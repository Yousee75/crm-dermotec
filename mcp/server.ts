#!/usr/bin/env node
// ============================================================
// MCP Server — CRM Dermotec
// Expose les données CRM (leads, sessions, inscriptions,
// financements, rappels) à Claude via le protocole MCP.
//
// IMPORTANT : Ne JAMAIS utiliser console.log() ici.
// Stdio est réservé au protocole JSON-RPC.
// Logger sur stderr uniquement (console.error).
// ============================================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// --- Supabase client (lazy init) ---

let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis. ' +
      'Configurez-les dans env du MCP server.'
    )
  }

  _supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.error('[MCP Dermotec] Supabase connecté:', url)
  return _supabase
}

// --- State machines (copié de validators.ts pour éviter les imports cross-project) ---

const VALID_LEAD_TRANSITIONS: Record<string, string[]> = {
  NOUVEAU: ['CONTACTE', 'QUALIFIE', 'PERDU', 'SPAM'],
  CONTACTE: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'PERDU', 'REPORTE', 'SPAM'],
  QUALIFIE: ['FINANCEMENT_EN_COURS', 'INSCRIT', 'PERDU', 'REPORTE'],
  FINANCEMENT_EN_COURS: ['INSCRIT', 'PERDU', 'REPORTE', 'QUALIFIE'],
  INSCRIT: ['EN_FORMATION', 'PERDU', 'REPORTE'],
  EN_FORMATION: ['FORME', 'PERDU'],
  FORME: ['ALUMNI', 'PERDU'],
  ALUMNI: ['QUALIFIE'],
  PERDU: ['NOUVEAU', 'CONTACTE'],
  REPORTE: ['CONTACTE', 'QUALIFIE', 'PERDU'],
  SPAM: [],
}

// --- MCP Server ---

const server = new McpServer({
  name: 'dermotec-crm',
  version: '1.0.0',
})

// ==================== TOOLS ====================

// 1. Rechercher des leads
server.tool(
  'search_leads',
  'Rechercher des leads dans le CRM par nom, email, téléphone ou texte libre',
  {
    query: z.string().describe('Texte de recherche (nom, email, téléphone)'),
    statut: z.string().optional().describe('Filtrer par statut (NOUVEAU, QUALIFIE, etc.)'),
    limit: z.number().optional().default(10).describe('Nombre max de résultats'),
  },
  async ({ query, statut, limit }) => {
    const db = getSupabase()
    let q = db
      .from('leads')
      .select('id, prenom, nom, email, telephone, statut, source, score_chaud, priorite, created_at, date_dernier_contact')
      .or(`prenom.ilike.%${query}%,nom.ilike.%${query}%,email.ilike.%${query}%,telephone.ilike.%${query}%`)
      .order('score_chaud', { ascending: false })
      .limit(limit ?? 10)

    if (statut) q = q.eq('statut', statut)

    const { data, error } = await q
    if (error) return { content: [{ type: 'text' as const, text: `Erreur: ${error.message}` }] }

    return {
      content: [{
        type: 'text' as const,
        text: data.length === 0
          ? `Aucun lead trouvé pour "${query}"`
          : `${data.length} lead(s) trouvé(s):\n${JSON.stringify(data, null, 2)}`
      }]
    }
  }
)

// 2. Détail complet d'un lead
server.tool(
  'get_lead_detail',
  'Récupérer le profil complet d\'un lead avec ses inscriptions, financements, activités récentes et rappels',
  {
    lead_id: z.string().uuid().describe('ID du lead'),
  },
  async ({ lead_id }) => {
    const db = getSupabase()

    const [leadRes, inscrRes, finRes, actRes, rappelRes] = await Promise.all([
      db.from('leads').select('*').eq('id', lead_id).single(),
      db.from('inscriptions').select('*, session:sessions(*, formation:formations(nom))').eq('lead_id', lead_id),
      db.from('financements').select('*').eq('lead_id', lead_id),
      db.from('activites').select('*').eq('lead_id', lead_id).order('created_at', { ascending: false }).limit(10),
      db.from('rappels').select('*').eq('lead_id', lead_id).eq('statut', 'EN_ATTENTE'),
    ])

    if (leadRes.error) return { content: [{ type: 'text' as const, text: `Lead non trouvé: ${leadRes.error.message}` }] }

    const result = {
      lead: leadRes.data,
      inscriptions: inscrRes.data ?? [],
      financements: finRes.data ?? [],
      activites_recentes: actRes.data ?? [],
      rappels_en_attente: rappelRes.data ?? [],
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  }
)

// 3. Changer le statut d'un lead (via state machine)
server.tool(
  'update_lead_status',
  'Changer le statut d\'un lead en respectant la state machine (transitions autorisées uniquement)',
  {
    lead_id: z.string().uuid().describe('ID du lead'),
    new_status: z.string().describe('Nouveau statut (CONTACTE, QUALIFIE, INSCRIT, etc.)'),
    reason: z.string().optional().describe('Raison du changement'),
  },
  async ({ lead_id, new_status, reason }) => {
    const db = getSupabase()

    // Récupérer le statut actuel
    const { data: lead, error } = await db.from('leads').select('statut, prenom, nom').eq('id', lead_id).single()
    if (error || !lead) return { content: [{ type: 'text' as const, text: `Lead non trouvé` }] }

    // Vérifier la transition via state machine
    const currentStatus = lead.statut as string
    const allowed = VALID_LEAD_TRANSITIONS[currentStatus] ?? []
    if (!allowed.includes(new_status)) {
      return {
        content: [{
          type: 'text' as const,
          text: `Transition invalide: ${currentStatus} → ${new_status}. Transitions autorisées: ${allowed.join(', ') || 'aucune (état terminal)'}`
        }]
      }
    }

    // Appliquer le changement
    const { error: updateErr } = await db
      .from('leads')
      .update({ statut: new_status, updated_at: new Date().toISOString() })
      .eq('id', lead_id)

    if (updateErr) return { content: [{ type: 'text' as const, text: `Erreur mise à jour: ${updateErr.message}` }] }

    // Logger l'activité
    await db.from('activites').insert({
      type: 'STATUT_CHANGE',
      lead_id,
      description: `${currentStatus} → ${new_status}${reason ? ` (${reason})` : ''} — via MCP`,
      ancien_statut: currentStatus,
      nouveau_statut: new_status,
    })

    return {
      content: [{
        type: 'text' as const,
        text: `${lead.prenom} ${lead.nom}: ${currentStatus} → ${new_status} ✓`
      }]
    }
  }
)

// 4. Lister les sessions à venir
server.tool(
  'list_sessions',
  'Lister les sessions de formation à venir avec leurs inscriptions',
  {
    statut: z.string().optional().describe('Filtrer par statut (PLANIFIEE, CONFIRMEE, EN_COURS)'),
    limit: z.number().optional().default(10),
  },
  async ({ statut, limit }) => {
    const db = getSupabase()
    let q = db
      .from('sessions')
      .select('*, formation:formations(nom, categorie, prix_ht), inscriptions(id, statut)')
      .gte('date_debut', new Date().toISOString().split('T')[0])
      .order('date_debut', { ascending: true })
      .limit(limit ?? 10)

    if (statut) q = q.eq('statut', statut)

    const { data, error } = await q
    if (error) return { content: [{ type: 'text' as const, text: `Erreur: ${error.message}` }] }

    const summary = (data ?? []).map((s: any) => ({
      id: s.id,
      formation: Array.isArray(s.formation) ? s.formation[0]?.nom : s.formation?.nom,
      date_debut: s.date_debut,
      date_fin: s.date_fin,
      statut: s.statut,
      places_max: s.places_max,
      inscrits: s.inscriptions?.length ?? 0,
      lieu: s.lieu,
    }))

    return { content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }] }
  }
)

// 5. Rappels en retard et du jour
server.tool(
  'get_rappels',
  'Récupérer les rappels en attente : en retard et du jour',
  {
    include_future: z.boolean().optional().default(false).describe('Inclure les rappels futurs aussi'),
  },
  async ({ include_future }) => {
    const db = getSupabase()
    const today = new Date().toISOString().split('T')[0]

    let q = db
      .from('rappels')
      .select('*, lead:leads(prenom, nom, email)')
      .eq('statut', 'EN_ATTENTE')
      .order('date_rappel', { ascending: true })
      .limit(30)

    if (!include_future) {
      q = q.lte('date_rappel', `${today}T23:59:59`)
    }

    const { data, error } = await q
    if (error) return { content: [{ type: 'text' as const, text: `Erreur: ${error.message}` }] }

    const overdue = (data ?? []).filter((r: any) => r.date_rappel < today)
    const todayRappels = (data ?? []).filter((r: any) => r.date_rappel >= today && r.date_rappel <= `${today}T23:59:59`)
    const future = (data ?? []).filter((r: any) => r.date_rappel > `${today}T23:59:59`)

    return {
      content: [{
        type: 'text' as const,
        text: `Rappels:\n- En retard: ${overdue.length}\n- Aujourd'hui: ${todayRappels.length}\n- Futurs: ${future.length}\n\n${JSON.stringify(data, null, 2)}`
      }]
    }
  }
)

// 6. Pipeline (vue Kanban)
server.tool(
  'get_pipeline',
  'Vue pipeline des leads groupés par statut avec CA potentiel',
  {},
  async () => {
    const db = getSupabase()

    const { data, error } = await db
      .from('leads')
      .select('statut, score_chaud, formation_principale_id')
      .not('statut', 'in', '("PERDU","SPAM","ALUMNI")')

    if (error) return { content: [{ type: 'text' as const, text: `Erreur: ${error.message}` }] }

    const pipeline: Record<string, { count: number; avg_score: number }> = {}
    for (const lead of data ?? []) {
      const s = lead.statut as string
      if (!pipeline[s]) pipeline[s] = { count: 0, avg_score: 0 }
      pipeline[s].count++
      pipeline[s].avg_score += lead.score_chaud ?? 0
    }

    // Calculer les moyennes
    for (const s of Object.keys(pipeline)) {
      pipeline[s].avg_score = Math.round(pipeline[s].avg_score / pipeline[s].count)
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(pipeline, null, 2) }] }
  }
)

// 7. Métriques dashboard
server.tool(
  'get_dashboard_metrics',
  'KPIs clés du CRM : leads, inscriptions, CA, taux de conversion',
  {
    period_days: z.number().optional().default(30).describe('Période en jours (défaut: 30)'),
  },
  async ({ period_days }) => {
    const db = getSupabase()
    const since = new Date(Date.now() - (period_days ?? 30) * 86_400_000).toISOString()

    const [leads, inscriptions, financements] = await Promise.all([
      db.from('leads').select('id, statut', { count: 'exact' }).gte('created_at', since),
      db.from('inscriptions').select('montant_total, statut', { count: 'exact' }).gte('created_at', since),
      db.from('financements').select('montant_accorde, statut', { count: 'exact' }).gte('created_at', since),
    ])

    const inscData = inscriptions.data ?? []
    const finData = financements.data ?? []

    const metrics = {
      period: `${period_days} derniers jours`,
      leads_total: leads.count ?? 0,
      inscriptions_total: inscriptions.count ?? 0,
      ca_inscriptions: inscData
        .filter((i: any) => ['CONFIRMEE', 'EN_COURS', 'COMPLETEE'].includes(i.statut))
        .reduce((sum: number, i: any) => sum + (i.montant_total ?? 0), 0),
      financements_actifs: finData.filter((f: any) => !['CLOTURE', 'REFUSE'].includes(f.statut)).length,
      financements_valides: finData.filter((f: any) => f.statut === 'VALIDE' || f.statut === 'VERSE').length,
      montant_finance: finData
        .filter((f: any) => f.statut === 'VALIDE' || f.statut === 'VERSE')
        .reduce((sum: number, f: any) => sum + (f.montant_accorde ?? 0), 0),
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(metrics, null, 2) }] }
  }
)

// 8. Logger une activité
server.tool(
  'log_activity',
  'Enregistrer une activité (appel, email, note) sur un lead',
  {
    lead_id: z.string().uuid().describe('ID du lead'),
    type: z.enum(['CONTACT', 'EMAIL', 'RAPPEL', 'NOTE', 'SYSTEME']).describe('Type d\'activité'),
    description: z.string().describe('Description de l\'activité'),
  },
  async ({ lead_id, type, description }) => {
    const db = getSupabase()

    const { error } = await db.from('activites').insert({
      type,
      lead_id,
      description: `${description} — via MCP`,
      created_at: new Date().toISOString(),
    })

    if (error) return { content: [{ type: 'text' as const, text: `Erreur: ${error.message}` }] }
    return { content: [{ type: 'text' as const, text: `Activité "${type}" enregistrée sur le lead ${lead_id}` }] }
  }
)

// 9. Lister les formations
server.tool(
  'list_formations',
  'Catalogue des formations Dermotec avec prix et disponibilités',
  {},
  async () => {
    const db = getSupabase()

    const { data, error } = await db
      .from('formations')
      .select('id, nom, categorie, duree_jours, prix_ht, tva_rate, is_active, niveau, places_max')
      .eq('is_active', true)
      .order('categorie')

    if (error) return { content: [{ type: 'text' as const, text: `Erreur: ${error.message}` }] }

    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  }
)

// 10. Créer un lead
server.tool(
  'create_lead',
  'Créer un nouveau lead dans le CRM',
  {
    prenom: z.string().min(1).describe('Prénom'),
    nom: z.string().optional().describe('Nom'),
    email: z.string().email().optional().describe('Email'),
    telephone: z.string().optional().describe('Téléphone'),
    source: z.enum([
      'formulaire', 'whatsapp', 'telephone', 'instagram', 'facebook',
      'google', 'bouche_a_oreille', 'partenariat', 'ancien_stagiaire',
      'site_web', 'salon', 'autre',
    ]).default('autre').describe('Source du lead'),
    message: z.string().optional().describe('Message ou notes'),
  },
  async ({ prenom, nom, email, telephone, source, message }) => {
    const db = getSupabase()

    // Vérifier doublon par email
    if (email) {
      const { data: existing } = await db.from('leads').select('id, prenom, nom').eq('email', email).single()
      if (existing) {
        return {
          content: [{
            type: 'text' as const,
            text: `Doublon détecté : ${existing.prenom} ${existing.nom} (${existing.id}) a déjà cet email. Utilisez get_lead_detail pour voir son profil.`
          }]
        }
      }
    }

    const { data, error } = await db
      .from('leads')
      .insert({
        prenom,
        nom: nom ?? null,
        email: email ?? null,
        telephone: telephone ?? null,
        source,
        message: message ?? null,
        statut: 'NOUVEAU',
        priorite: 'NORMALE',
        score_chaud: 20,
        nb_contacts: 0,
        tags: [],
        formations_interessees: [],
        financement_souhaite: false,
      })
      .select('id')
      .single()

    if (error) return { content: [{ type: 'text' as const, text: `Erreur création: ${error.message}` }] }

    // Logger l'activité
    await db.from('activites').insert({
      type: 'LEAD_CREE',
      lead_id: data.id,
      description: `Lead créé via MCP — ${prenom} ${nom ?? ''} (${source})`,
    })

    return { content: [{ type: 'text' as const, text: `Lead créé: ${data.id} (${prenom} ${nom ?? ''})` }] }
  }
)

// ==================== RESOURCES ====================

// Resource : État du pipeline en temps réel
server.resource(
  'pipeline://overview',
  'pipeline://overview',
  async () => {
    const db = getSupabase()
    const { data } = await db
      .from('leads')
      .select('statut')
      .not('statut', 'in', '("PERDU","SPAM")')

    const counts: Record<string, number> = {}
    for (const lead of data ?? []) {
      counts[lead.statut] = (counts[lead.statut] || 0) + 1
    }

    return {
      contents: [{
        uri: 'pipeline://overview',
        text: JSON.stringify(counts, null, 2),
        mimeType: 'application/json',
      }]
    }
  }
)

// ==================== PROMPTS ====================

// Prompt : Analyser un lead
server.prompt(
  'analyze_lead',
  'Analyser un lead et recommander la prochaine action',
  { lead_id: z.string().uuid() },
  ({ lead_id }) => ({
    messages: [{
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Utilise l'outil get_lead_detail avec l'ID "${lead_id}" pour récupérer toutes les données du lead, puis:
1. Résume le profil (statut, score, historique contacts)
2. Identifie les signaux positifs et négatifs
3. Recommande la prochaine action concrète (appel, email, relance, etc.)
4. Propose un message personnalisé si pertinent
Contexte Dermotec : centre de formation esthétique, formations 400-2500€ HT, financements OPCO/France Travail possibles.`
      }
    }]
  })
)

// Prompt : Rapport quotidien
server.prompt(
  'daily_report',
  'Générer le rapport quotidien du CRM',
  {},
  () => ({
    messages: [{
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Génère le rapport quotidien CRM Dermotec :
1. Utilise get_dashboard_metrics (période 1 jour) pour les KPIs du jour
2. Utilise get_rappels pour les rappels en retard + du jour
3. Utilise get_pipeline pour la vue pipeline
4. Utilise list_sessions pour les prochaines sessions

Produis un rapport structuré avec :
- Chiffres clés du jour
- Actions urgentes (rappels en retard)
- Sessions à venir et taux de remplissage
- Recommandations`
      }
    }]
  })
)

// ==================== START ====================

async function main() {
  console.error('[MCP Dermotec] Démarrage du serveur CRM...')
  console.error('[MCP Dermotec] 10 tools, 1 resource, 2 prompts')

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('[MCP Dermotec] Serveur connecté via stdio ✓')
}

main().catch((err) => {
  console.error('[MCP Dermotec] Erreur fatale:', err)
  process.exit(1)
})
