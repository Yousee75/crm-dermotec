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
    // Sanitize query pour éviter injection dans ilike
    const q_safe = query.replace(/[%_\\]/g, '').trim().slice(0, 100)
    let q = db
      .from('leads')
      .select(`id, prenom, nom, email, telephone, statut, source, score_chaud, priorite, nb_contacts,
        statut_pro, financement_souhaite, created_at, date_dernier_contact,
        formation_principale:formations!formation_principale_id(id, nom, categorie, prix_ht),
        commercial_assigne:equipe!commercial_assigne_id(id, prenom, nom)`)
      .or(`prenom.ilike.%${q_safe}%,nom.ilike.%${q_safe}%,email.ilike.%${q_safe}%,telephone.ilike.%${q_safe}%`)
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

// 11. Calculer le score d'un lead (algorithme /100)
server.tool(
  'calculate_lead_score',
  'Calculer le score de probabilité d\'inscription d\'un lead (0-100) avec détail par dimension',
  {
    lead_id: z.string().uuid().describe('ID du lead'),
  },
  async ({ lead_id }) => {
    const db = getSupabase()
    const { data: lead, error } = await db.from('leads').select('*').eq('id', lead_id).single()
    if (error || !lead) return { content: [{ type: 'text' as const, text: 'Lead non trouvé' }] }

    // Scoring inline (reproduit scoring.ts pour éviter les imports cross-project)
    let completude = 0, engagement = 0, financement = 0, profil = 0, urgence = 0
    const details: string[] = []

    // Complétude /30
    if (lead.email) completude += 5
    if (lead.telephone) completude += 5
    if (lead.prenom && lead.nom) completude += 3
    if (lead.statut_pro) completude += 4
    if (lead.formation_principale_id) completude += 5
    if (lead.experience_esthetique) completude += 3
    if (lead.objectif_pro) completude += 3
    if (lead.adresse?.code_postal) completude += 2

    // Engagement /25
    if (lead.nb_contacts >= 3) { engagement += 10; details.push('+10: 3+ contacts') }
    else if (lead.nb_contacts >= 1) engagement += 5
    if (lead.date_dernier_contact) {
      const jours = Math.floor((Date.now() - new Date(lead.date_dernier_contact).getTime()) / 86400000)
      if (jours <= 3) { engagement += 8; details.push('+8: contact < 3 jours') }
      else if (jours <= 7) engagement += 5
      else if (jours <= 14) engagement += 2
    }
    if (lead.source === 'formulaire' || lead.source === 'telephone') engagement += 4
    if (lead.source === 'whatsapp') engagement += 5
    if (lead.source === 'ancien_stagiaire') engagement += 3

    // Financement /20
    if (lead.financement_souhaite) { financement += 10; details.push('+10: financement souhaité') }
    if (lead.statut_pro === 'salariee') { financement += 8; details.push('+8: salariée (OPCO)') }
    else if (lead.statut_pro === 'demandeur_emploi') { financement += 7; details.push('+7: demandeur emploi') }
    else if (lead.statut_pro === 'reconversion') { financement += 6; details.push('+6: reconversion') }
    else if (lead.statut_pro === 'independante' || lead.statut_pro === 'auto_entrepreneur') financement += 5

    // Profil /15
    if (lead.experience_esthetique === 'intermediaire') { profil += 8; details.push('+8: profil intermédiaire') }
    else if (lead.experience_esthetique === 'aucune' || lead.experience_esthetique === 'debutante') profil += 5
    if (lead.objectif_pro) profil += 4
    if (lead.formations_interessees?.length >= 2) { profil += 3; details.push('+3: 2+ formations') }

    // Urgence /10
    if (lead.statut === 'QUALIFIE') urgence += 5
    if (lead.statut === 'FINANCEMENT_EN_COURS') urgence += 8
    if (lead.priorite === 'URGENTE') urgence += 5
    if (lead.priorite === 'HAUTE') urgence += 3
    if (lead.tags?.includes('urgent')) { urgence += 4; details.push('+4: tag urgent') }

    const total = Math.min(100, completude + engagement + financement + profil + urgence)
    const color = total >= 80 ? '#22C55E' : total >= 60 ? '#F59E0B' : total >= 40 ? '#3B82F6' : '#9CA3AF'
    const label = total >= 80 ? 'Chaud' : total >= 60 ? 'Tiède' : total >= 40 ? 'À qualifier' : 'Froid'

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          lead: `${lead.prenom} ${lead.nom ?? ''}`,
          score: total, label, color,
          breakdown: { completude, engagement, financement, profil, urgence },
          details,
        }, null, 2)
      }]
    }
  }
)

// 12. Smart Actions — suggestions proactives
server.tool(
  'get_smart_actions',
  'Obtenir les actions prioritaires : rappels en retard, leads stagnants, sessions à remplir, upsell alumni, financements bloqués',
  {
    limit: z.number().optional().default(20).describe('Nombre max d\'actions'),
  },
  async ({ limit }) => {
    const db = getSupabase()
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const actions: Array<{ type: string; priorite: string; titre: string; description: string; lead_id?: string }> = []

    // 1. Rappels en retard
    const { data: rappels } = await db
      .from('rappels')
      .select('*, lead:leads(prenom, nom)')
      .eq('statut', 'EN_ATTENTE')
      .lt('date_rappel', today)
      .limit(10)

    for (const r of rappels ?? []) {
      const jours = Math.floor((now.getTime() - new Date(r.date_rappel).getTime()) / 86400000)
      const lead = Array.isArray(r.lead) ? r.lead[0] : r.lead
      actions.push({
        type: 'RAPPEL_OVERDUE',
        priorite: jours > 3 ? 'CRITIQUE' : 'HAUTE',
        titre: `Rappel en retard ${jours}j — ${lead?.prenom} ${lead?.nom}`,
        description: `${r.type}: ${r.titre || 'Sans titre'}`,
        lead_id: r.lead_id,
      })
    }

    // 2. Leads qualifiés stagnants (5+ jours sans contact)
    const fiveDaysAgo = new Date(now.getTime() - 5 * 86400000).toISOString()
    const { data: stagnants } = await db
      .from('leads')
      .select('id, prenom, nom, statut, date_dernier_contact')
      .in('statut', ['QUALIFIE', 'FINANCEMENT_EN_COURS'])
      .lt('date_dernier_contact', fiveDaysAgo)
      .limit(10)

    for (const l of stagnants ?? []) {
      const jours = Math.floor((now.getTime() - new Date(l.date_dernier_contact).getTime()) / 86400000)
      actions.push({
        type: 'LEAD_STAGNANT',
        priorite: jours >= 14 ? 'HAUTE' : 'NORMALE',
        titre: `${l.statut} sans contact ${jours}j — ${l.prenom} ${l.nom}`,
        description: `Relancer ce lead qualifié`,
        lead_id: l.id,
      })
    }

    // 3. Nouveaux leads non contactés
    const { data: newLeads } = await db
      .from('leads')
      .select('id, prenom, nom, source, created_at')
      .eq('statut', 'NOUVEAU')
      .eq('nb_contacts', 0)
      .limit(10)

    for (const l of newLeads ?? []) {
      const jours = Math.floor((now.getTime() - new Date(l.created_at).getTime()) / 86400000)
      if (jours >= 1) {
        actions.push({
          type: 'APPELER_LEAD',
          priorite: jours >= 3 ? 'HAUTE' : 'NORMALE',
          titre: `Nouveau lead non contacté ${jours}j — ${l.prenom} ${l.nom}`,
          description: `Source: ${l.source}`,
          lead_id: l.id,
        })
      }
    }

    // 4. Financements en attente > 15 jours
    const { data: fins } = await db
      .from('financements')
      .select('id, lead_id, organisme, numero_dossier, date_soumission, lead:leads(prenom, nom)')
      .in('statut', ['SOUMIS', 'EN_EXAMEN'])
      .limit(10)

    for (const f of fins ?? []) {
      if (!f.date_soumission) continue
      const jours = Math.floor((now.getTime() - new Date(f.date_soumission).getTime()) / 86400000)
      if (jours >= 15) {
        const lead = Array.isArray(f.lead) ? f.lead[0] : f.lead
        actions.push({
          type: 'RELANCER_FINANCEMENT',
          priorite: jours >= 30 ? 'HAUTE' : 'NORMALE',
          titre: `Dossier ${f.organisme} sans réponse ${jours}j`,
          description: `${f.numero_dossier || ''} pour ${lead?.prenom} ${lead?.nom}`,
          lead_id: f.lead_id,
        })
      }
    }

    // Trier par priorité
    const order: Record<string, number> = { CRITIQUE: 0, HAUTE: 1, NORMALE: 2, BASSE: 3 }
    actions.sort((a, b) => (order[a.priorite] ?? 9) - (order[b.priorite] ?? 9))

    return {
      content: [{
        type: 'text' as const,
        text: actions.length === 0
          ? 'Aucune action prioritaire. Tout est à jour !'
          : `${actions.length} action(s) prioritaire(s):\n${JSON.stringify(actions.slice(0, limit ?? 20), null, 2)}`
      }]
    }
  }
)

// 13. Changer le statut d'un financement (state machine)
server.tool(
  'update_financement_status',
  'Changer le statut d\'un dossier de financement (state machine : PREPARATION → SOUMIS → VALIDE/REFUSE → VERSE → CLOTURE)',
  {
    financement_id: z.string().uuid(),
    new_status: z.string().describe('Nouveau statut'),
    notes: z.string().optional(),
  },
  async ({ financement_id, new_status, notes }) => {
    const db = getSupabase()
    const transitions: Record<string, string[]> = {
      PREPARATION: ['DOCUMENTS_REQUIS', 'DOSSIER_COMPLET'],
      DOCUMENTS_REQUIS: ['DOSSIER_COMPLET', 'PREPARATION'],
      DOSSIER_COMPLET: ['SOUMIS'],
      SOUMIS: ['EN_EXAMEN', 'VALIDE', 'REFUSE'],
      EN_EXAMEN: ['COMPLEMENT_DEMANDE', 'VALIDE', 'REFUSE'],
      COMPLEMENT_DEMANDE: ['EN_EXAMEN', 'DOSSIER_COMPLET', 'REFUSE'],
      VALIDE: ['VERSE', 'CLOTURE'],
      REFUSE: ['PREPARATION', 'CLOTURE'],
      VERSE: ['CLOTURE'],
      CLOTURE: [],
    }

    const { data: fin, error } = await db.from('financements').select('statut, lead_id').eq('id', financement_id).single()
    if (error || !fin) return { content: [{ type: 'text' as const, text: 'Financement non trouvé' }] }

    const allowed = transitions[fin.statut] ?? []
    if (!allowed.includes(new_status)) {
      return { content: [{ type: 'text' as const, text: `Transition invalide: ${fin.statut} → ${new_status}. Autorisés: ${allowed.join(', ') || 'aucune'}` }] }
    }

    await db.from('financements').update({ statut: new_status, updated_at: new Date().toISOString() }).eq('id', financement_id)
    await db.from('activites').insert({ type: 'FINANCEMENT', lead_id: fin.lead_id, description: `Financement ${fin.statut} → ${new_status}${notes ? ` (${notes})` : ''} — via MCP` })

    return { content: [{ type: 'text' as const, text: `Financement ${financement_id}: ${fin.statut} → ${new_status} ✓` }] }
  }
)

// 14. Changer le statut d'une session (state machine)
server.tool(
  'update_session_status',
  'Changer le statut d\'une session (BROUILLON → PLANIFIEE → CONFIRMEE → EN_COURS → TERMINEE)',
  {
    session_id: z.string().uuid(),
    new_status: z.string(),
  },
  async ({ session_id, new_status }) => {
    const db = getSupabase()
    const transitions: Record<string, string[]> = {
      BROUILLON: ['PLANIFIEE', 'ANNULEE'],
      PLANIFIEE: ['CONFIRMEE', 'ANNULEE', 'REPORTEE'],
      CONFIRMEE: ['EN_COURS', 'ANNULEE', 'REPORTEE'],
      EN_COURS: ['TERMINEE', 'ANNULEE'],
      TERMINEE: [],
      ANNULEE: ['BROUILLON'],
      REPORTEE: ['PLANIFIEE', 'ANNULEE'],
    }

    const { data: session, error } = await db.from('sessions').select('statut').eq('id', session_id).single()
    if (error || !session) return { content: [{ type: 'text' as const, text: 'Session non trouvée' }] }

    const allowed = transitions[session.statut] ?? []
    if (!allowed.includes(new_status)) {
      return { content: [{ type: 'text' as const, text: `Transition invalide: ${session.statut} → ${new_status}. Autorisés: ${allowed.join(', ') || 'aucune'}` }] }
    }

    await db.from('sessions').update({ statut: new_status, updated_at: new Date().toISOString() }).eq('id', session_id)
    return { content: [{ type: 'text' as const, text: `Session ${session_id}: ${session.statut} → ${new_status} ✓` }] }
  }
)

// 15. Changer le statut d'une inscription (state machine)
server.tool(
  'update_inscription_status',
  'Changer le statut d\'une inscription (EN_ATTENTE → CONFIRMEE → EN_COURS → COMPLETEE)',
  {
    inscription_id: z.string().uuid(),
    new_status: z.string(),
  },
  async ({ inscription_id, new_status }) => {
    const db = getSupabase()
    const transitions: Record<string, string[]> = {
      EN_ATTENTE: ['CONFIRMEE', 'ANNULEE'],
      CONFIRMEE: ['EN_COURS', 'ANNULEE'],
      EN_COURS: ['COMPLETEE', 'ANNULEE', 'NO_SHOW'],
      COMPLETEE: ['REMBOURSEE'],
      ANNULEE: ['EN_ATTENTE'],
      REMBOURSEE: [],
      NO_SHOW: ['ANNULEE'],
    }

    const { data: insc, error } = await db.from('inscriptions').select('statut, lead_id').eq('id', inscription_id).single()
    if (error || !insc) return { content: [{ type: 'text' as const, text: 'Inscription non trouvée' }] }

    const allowed = transitions[insc.statut] ?? []
    if (!allowed.includes(new_status)) {
      return { content: [{ type: 'text' as const, text: `Transition invalide: ${insc.statut} → ${new_status}. Autorisés: ${allowed.join(', ') || 'aucune'}` }] }
    }

    await db.from('inscriptions').update({ statut: new_status, updated_at: new Date().toISOString() }).eq('id', inscription_id)
    await db.from('activites').insert({ type: 'INSCRIPTION', lead_id: insc.lead_id, description: `Inscription ${insc.statut} → ${new_status} — via MCP` })

    return { content: [{ type: 'text' as const, text: `Inscription ${inscription_id}: ${insc.statut} → ${new_status} ✓` }] }
  }
)

// 16. Éligibilité financement par statut professionnel
server.tool(
  'get_financing_eligibility',
  'Identifier les organismes de financement éligibles selon le statut professionnel du lead',
  {
    statut_pro: z.enum(['salariee', 'independante', 'auto_entrepreneur', 'demandeur_emploi', 'reconversion', 'etudiante', 'gerant_institut', 'autre']),
  },
  async ({ statut_pro }) => {
    const eligibility: Record<string, { organismes: string[]; documents: string[] }> = {
      salariee: {
        organismes: ['OPCO_EP', 'CPF', 'EMPLOYEUR', 'TRANSITIONS_PRO'],
        documents: ['piece_identite', 'attestation_employeur', 'bulletin_salaire', 'devis'],
      },
      independante: {
        organismes: ['FIFPL', 'FAFCEA', 'CPF'],
        documents: ['piece_identite', 'attestation_urssaf', 'kbis', 'devis'],
      },
      auto_entrepreneur: {
        organismes: ['FAFCEA', 'CPF', 'AKTO'],
        documents: ['piece_identite', 'attestation_urssaf', 'devis'],
      },
      demandeur_emploi: {
        organismes: ['FRANCE_TRAVAIL', 'CPF', 'REGION', 'MISSIONS_LOCALES'],
        documents: ['piece_identite', 'attestation_pole_emploi', 'cv', 'devis'],
      },
      reconversion: {
        organismes: ['TRANSITIONS_PRO', 'CPF', 'FRANCE_TRAVAIL', 'REGION'],
        documents: ['piece_identite', 'attestation_employeur', 'projet_reconversion', 'devis'],
      },
      etudiante: {
        organismes: ['MISSIONS_LOCALES', 'REGION'],
        documents: ['piece_identite', 'certificat_scolarite', 'devis'],
      },
      gerant_institut: {
        organismes: ['OPCO_EP', 'FAFCEA', 'AKTO', 'CPF'],
        documents: ['piece_identite', 'kbis', 'attestation_urssaf', 'devis'],
      },
      autre: {
        organismes: ['CPF'],
        documents: ['piece_identite', 'devis'],
      },
    }

    const result = eligibility[statut_pro] ?? eligibility.autre
    return {
      content: [{
        type: 'text' as const,
        text: `Éligibilité financement pour "${statut_pro}":\n` +
          `Organismes: ${result.organismes.join(', ')}\n` +
          `Documents requis: ${result.documents.join(', ')}`
      }]
    }
  }
)

// 17. Meilleur créneau de contact
server.tool(
  'get_best_contact_time',
  'Identifier le meilleur moment pour contacter un lead (basé sur les statistiques Dermotec)',
  {},
  async () => {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          meilleurs_jours: ['mardi', 'jeudi'],
          meilleurs_creneaux: [
            { debut: '08:00', fin: '12:00', qualite: 'excellent', raison: 'Esthéticiennes souvent dispo le matin avant les RDV' },
            { debut: '14:00', fin: '17:00', qualite: 'bon', raison: 'Créneau après-midi OK mais moins réactif' },
          ],
          a_eviter: [
            { jour: 'lundi', raison: 'Début de semaine chargé (planification)' },
            { jour: 'vendredi après-midi', raison: 'Fermeture anticipée fréquente' },
            { heure: 'avant 8h et après 19h', raison: 'Hors horaires professionnels' },
          ],
          canal_prefere: {
            premier_contact: 'telephone',
            relance: 'whatsapp',
            nurturing: 'email',
            raison: 'WhatsApp = 95% taux ouverture vs 20% email',
          },
        }, null, 2)
      }]
    }
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
2. Utilise get_smart_actions pour les actions prioritaires triées
3. Utilise get_pipeline pour la vue pipeline
4. Utilise list_sessions pour les prochaines sessions
5. Utilise get_best_contact_time pour rappeler les créneaux optimaux

Produis un rapport structuré avec :
- Chiffres clés du jour
- Actions urgentes triées par priorité (CRITIQUE → HAUTE → NORMALE)
- Sessions à venir et taux de remplissage
- Leads chauds à contacter (score > 60)
- Meilleur créneau de contact pour aujourd'hui
- Recommandations concrètes`
      }
    }]
  })
)

// ==================== START ====================

async function main() {
  console.error('[MCP Dermotec] Démarrage du serveur CRM...')
  console.error('[MCP Dermotec] 17 tools, 1 resource, 2 prompts')

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('[MCP Dermotec] Serveur connecté via stdio ✓')
}

main().catch((err) => {
  console.error('[MCP Dermotec] Erreur fatale:', err)
  process.exit(1)
})
