// ============================================================
// CRM DERMOTEC — AI Agent Tools (v2)
// 10 tools CRM exécutables par l'agent
// Best practice Anthropic : descriptions détaillées + exemples
// ============================================================
import 'server-only'

import { tool, type Tool, jsonSchema as aiJsonSchema } from 'ai'
import { z } from 'zod'
import { createServiceSupabase } from './supabase-server'
import { hybridSearchKB } from './hybrid-search'

// AI SDK v6 + Anthropic : la combinaison tool() + Zod produit un schema sans type:"object"
// FIX : convertir Zod → JSON Schema MANUELLEMENT puis utiliser jsonSchema()
function zodToJsonSchema(schema: z.ZodObject<any>): Record<string, unknown> {
  const properties: Record<string, any> = {}
  const required: string[] = []
  const shape = schema.shape || {}

  for (const [key, val] of Object.entries(shape)) {
    const zf = val as z.ZodTypeAny
    const unwrapped = zf.isOptional() ? (zf as any)._def?.innerType || zf : zf
    let type = 'string'
    if (unwrapped instanceof z.ZodNumber) type = 'number'
    else if (unwrapped instanceof z.ZodBoolean) type = 'boolean'
    else if (unwrapped instanceof z.ZodArray) type = 'array'
    properties[key] = { type, ...(zf.description ? { description: zf.description } : {}) }
    if (!zf.isOptional()) required.push(key)
  }

  const result: Record<string, unknown> = { type: 'object', properties }
  if (required.length > 0) result.required = required
  return result
}

function defineTool(config: { description: string; parameters: z.ZodObject<any>; execute: (args: any) => Promise<any> }): any {
  // Objet Tool brut — le JSON Schema est passé TEL QUEL au provider
  const schema = zodToJsonSchema(config.parameters)
  return {
    type: 'function' as const,
    description: config.description,
    parameters: {
      jsonSchema: schema,
      validate: undefined,
      _type: undefined,
    },
    execute: config.execute,
  }
}

// --- TOOL 1: Recherche de leads ---
export const searchLeadsTool = defineTool({
  description: `Recherche des leads dans le CRM par nom, email, téléphone ou statut.
QUAND L'UTILISER : quand le commercial mentionne un prospect par son nom, veut voir ses leads chauds, ou cherche un contact.
EXEMPLE : "Cherche Marie Dupont" → searchLeads({ query: "Marie Dupont" })
EXEMPLE : "Mes leads qualifiés" → searchLeads({ statut: "QUALIFIE" })
EXEMPLE : "Leads à rappeler" → searchLeads({ statut: "CONTACTE", limit: 10 })`,
  parameters: z.object({
    query: z.string().optional().describe('Texte de recherche (nom, email, téléphone)'),
    statut: z.string().optional().describe('NOUVEAU | CONTACTE | QUALIFIE | FINANCEMENT_EN_COURS | INSCRIT | EN_FORMATION | FORME | ALUMNI'),
    limit: z.number().optional().default(5).describe('Nombre max de résultats (défaut 5)'),
  }),
  execute: async ({ query, statut, limit }: { query?: string; statut?: string; limit?: number }) => {
    const supabase = await createServiceSupabase() as any
    let q = supabase
      .from('leads')
      .select('id, prenom, nom, email, telephone, statut, score_chaud, source, statut_pro, created_at, formation_principale:formations!leads_formation_principale_id_fkey(nom, prix_ht)')
      .order('updated_at', { ascending: false })
      .limit(limit || 5)

    if (query) {
      q = q.or(`prenom.ilike.%${query}%,nom.ilike.%${query}%,email.ilike.%${query}%,telephone.ilike.%${query}%`)
    }
    if (statut) {
      q = q.eq('statut', statut)
    }

    const { data, error } = await q
    if (error) return { error: error.message }
    return { leads: data || [], count: data?.length || 0 }
  },
})

// --- TOOL 2: Fiche lead complète ---
export const getLeadDetailsTool = defineTool({
  description: `Charge la fiche complète d'un lead : profil, formation, financement, inscriptions, rappels, notes.
QUAND L'UTILISER : quand tu as besoin du contexte complet d'un lead pour conseiller le commercial.
EXEMPLE : "Dis-moi tout sur cette lead" → getLeadDetails({ lead_id: "uuid" })`,
  parameters: z.object({
    lead_id: z.string().describe('ID UUID du lead'),
  }),
  execute: async ({ lead_id }: { lead_id: string }) => {
    const supabase = await createServiceSupabase() as any
    const { data: lead, error } = await supabase
      .from('leads')
      .select(`
        id, prenom, nom, email, telephone, whatsapp, statut, priorite,
        score_chaud, source, statut_pro, experience_esthetique,
        financement_souhaite, nb_contacts, date_dernier_contact, tags, notes, created_at,
        formation_principale:formations!leads_formation_principale_id_fkey(nom, prix_ht, categorie, duree_jours),
        commercial_assigne:equipe!leads_commercial_assigne_id_fkey(prenom, nom, email),
        inscriptions(id, statut, montant_total, paiement_statut, note_satisfaction, session:sessions(date_debut, date_fin, formation:formations(nom))),
        financements(organisme, statut, montant_demande, montant_accorde, numero_dossier),
        rappels(id, date_rappel, type, statut, titre, description),
        notes_lead(contenu, type, created_at)
      `)
      .eq('id', lead_id)
      .single()

    if (error) return { error: error.message }
    return { lead }
  },
})

// --- TOOL 3: Créer un rappel ---
export const createReminderTool = defineTool({
  description: `Crée un rappel pour relancer un lead. L'agent DOIT confirmer au commercial que le rappel a été créé.
QUAND L'UTILISER : quand le commercial dit "rappelle-moi de contacter...", "planifie un suivi", "crée un rappel".
EXEMPLE : "Rappelle-moi d'appeler Marie mardi" → createReminder({ lead_id: "uuid", date_rappel: "2026-03-25T10:00:00", type: "APPEL", titre: "Rappeler Marie" })`,
  parameters: z.object({
    lead_id: z.string().describe('ID du lead'),
    date_rappel: z.string().describe('Date ISO 8601 (ex: 2026-03-25T10:00:00)'),
    type: z.enum(['APPEL', 'EMAIL', 'WHATSAPP', 'SMS', 'RDV', 'RELANCE', 'SUIVI']).describe('Type de rappel'),
    titre: z.string().describe('Titre court du rappel'),
    description: z.string().optional().describe('Description optionnelle'),
  }),
  execute: async ({ lead_id, date_rappel, type, titre, description }: { lead_id: string; date_rappel: string; type: string; titre: string; description?: string }) => {
    const supabase = await createServiceSupabase() as any
    const { data, error } = await supabase
      .from('rappels')
      .insert({ lead_id, date_rappel, type, titre, description, statut: 'EN_ATTENTE', priorite: 'NORMALE' })
      .select('id, date_rappel, type, titre')
      .single()

    if (error) return { error: error.message }

    await (supabase as any).from('activites').insert({
      type: 'RAPPEL',
      lead_id,
      description: `Rappel créé par l'agent IA : ${titre} (${type}) — ${new Date(date_rappel).toLocaleDateString('fr-FR')}`,
    })

    return { success: true, rappel: data, message: `Rappel "${titre}" créé pour le ${new Date(date_rappel).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}` }
  },
})

// --- TOOL 4: Sessions disponibles ---
export const getNextSessionsTool = defineTool({
  description: `Liste les prochaines sessions de formation avec places restantes.
QUAND L'UTILISER : quand le commercial veut proposer une date au prospect, vérifier les disponibilités.
EXEMPLE : "Prochaines sessions microblading ?" → getNextSessions({ formation_slug: "microblading" })
EXEMPLE : "Qu'est-ce qui est dispo ?" → getNextSessions({})`,
  parameters: z.object({
    formation_slug: z.string().optional().describe('Slug formation (maquillage-permanent, microblading, full-lips, tricopigmentation, areole-cicatrices, nanoneedling, soin-allin1, peeling-dermaplaning, detatouage, epilation-definitive, hygiene-salubrite)'),
  }),
  execute: async ({ formation_slug }: { formation_slug?: string }) => {
    const supabase = await createServiceSupabase() as any
    let q = supabase
      .from('sessions')
      .select('id, date_debut, date_fin, horaire_debut, horaire_fin, salle, places_max, places_occupees, statut, formation:formations(nom, slug, prix_ht, duree_jours)')
      .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
      .gte('date_debut', new Date().toISOString())
      .order('date_debut', { ascending: true })
      .limit(10)

    const { data, error } = await q
    if (error) return { error: error.message }

    let sessions = data || []
    if (formation_slug) {
      sessions = sessions.filter((s: any) => s.formation?.slug === formation_slug)
    }

    return {
      sessions: sessions.map((s: any) => ({
        id: s.id,
        formation: s.formation?.nom,
        date_debut: s.date_debut,
        date_fin: s.date_fin,
        horaires: `${s.horaire_debut || '9h'} - ${s.horaire_fin || '17h'}`,
        places_restantes: s.places_max - s.places_occupees,
        places_max: s.places_max,
        complet: s.places_occupees >= s.places_max,
        prix_ht: s.formation?.prix_ht,
      })),
    }
  },
})

// --- TOOL 5: Analyse financement ---
export const analyzeFinancementTool = defineTool({
  description: `Analyse les options de financement pour un prospect selon son statut professionnel.
Retourne les organismes éligibles, les montants, les délais et un SCRIPT TÉLÉPHONIQUE prêt à lire.
QUAND L'UTILISER : quand le commercial parle de financement, de prix, ou que le prospect demande comment payer.
EXEMPLE : "Comment financer le microblading pour une salariée ?" → analyzeFinancement({ statut_pro: "salariee", formation_prix: 1400, formation_nom: "Microblading" })`,
  parameters: z.object({
    statut_pro: z.string().describe('salariee | independante | auto_entrepreneur | demandeur_emploi | reconversion | gerant_institut'),
    formation_prix: z.number().describe('Prix HT en euros'),
    formation_nom: z.string().describe('Nom de la formation'),
  }),
  execute: async ({ statut_pro, formation_prix, formation_nom }: { statut_pro: string; formation_prix: number; formation_nom: string }) => {
    const mapping: Record<string, Array<{ org: string; taux: string; rac: string; delai: string; conseil: string }>> = {
      salariee: [
        { org: 'OPCO EP', taux: '100%', rac: '0€', delai: '3-6 semaines', conseil: 'Demander au RH le code OPCO.' },
        { org: 'CPF', taux: 'Variable', rac: 'Selon solde CPF', delai: 'Immédiat', conseil: 'moncompteformation.gouv.fr' },
        { org: 'Employeur', taux: '100%', rac: '0€', delai: '1-2 semaines', conseil: 'Plan de développement des compétences.' },
      ],
      independante: [
        { org: 'FAFCEA', taux: '100% (plafond 2000€)', rac: formation_prix > 2000 ? `${formation_prix - 2000}€` : '0€', delai: '2-4 semaines', conseil: 'Vérifier cotisation CFP URSSAF.' },
        { org: 'FIFPL', taux: '100% (plafond 1500€)', rac: formation_prix > 1500 ? `${formation_prix - 1500}€` : '0€', delai: '2-4 semaines', conseil: 'Créer compte FIFPL.' },
      ],
      auto_entrepreneur: [
        { org: 'FAFCEA', taux: '100% (plafond 2000€)', rac: formation_prix > 2000 ? `${formation_prix - 2000}€` : '0€', delai: '2-4 semaines', conseil: 'Vérifier cotisation CFP.' },
        { org: 'CPF', taux: 'Variable', rac: 'Selon solde', delai: 'Immédiat', conseil: 'moncompteformation.gouv.fr' },
      ],
      demandeur_emploi: [
        { org: 'France Travail (AIF)', taux: '100%', rac: '0€', delai: '4-8 semaines', conseil: 'Le conseiller France Travail valide. Préparer le devis.' },
        { org: 'CPF', taux: 'Variable', rac: 'Selon solde', delai: 'Immédiat', conseil: 'Cumulable avec AIF.' },
      ],
      reconversion: [
        { org: 'Transitions Pro (PTP)', taux: '100% salaire + formation', rac: '0€', delai: '2-3 mois', conseil: 'CDI >2 ans requis. Salaire maintenu.' },
        { org: 'France Travail (AIF)', taux: '100%', rac: '0€', delai: '4-8 semaines', conseil: 'Si démission reconversion.' },
      ],
      gerant_institut: [
        { org: 'OPCO EP', taux: '100%', rac: '0€', delai: '3-6 semaines', conseil: 'Cotisation OPCO EP via charges entreprise.' },
        { org: 'FAFCEA', taux: '100% (plafond 2000€)', rac: formation_prix > 2000 ? `${formation_prix - 2000}€` : '0€', delai: '2-4 semaines', conseil: 'Si artisan, plus rapide.' },
      ],
    }

    const options = mapping[statut_pro] || mapping.salariee
    return {
      formation: formation_nom,
      prix_ht: formation_prix,
      statut_pro,
      recommandations: options.map(o => ({ organisme: o.org, taux_prise_en_charge: o.taux, reste_a_charge: o.rac, delai: o.delai, conseil: o.conseil })),
      meilleur_choix: options[0]?.org,
      script_telephone: options[0]?.rac === '0€'
        ? `"Bonne nouvelle : votre ${options[0].org} prend en charge 100% de la formation ${formation_nom}. Reste à charge : 0€. On s'occupe du dossier ensemble."`
        : `"La formation ${formation_nom} est finançable via ${options[0]?.org}. ${options[0]?.conseil}"`,
    }
  },
})

// --- TOOL 6: Knowledge base ---
export const searchKnowledgeBaseTool = defineTool({
  description: `Recherche dans la base de connaissances Dermotec : scripts de vente, réponses objections, fiches formation, processus financement, FAQ, témoignages.
QUAND L'UTILISER : quand le commercial a besoin d'un script, d'arguments, ou d'informations métier.
EXEMPLE : "Script premier appel" → searchKnowledgeBase({ query: "premier appel", categorie: "script_vente" })
EXEMPLE : "Comment fonctionne le CPF ?" → searchKnowledgeBase({ query: "CPF processus" })`,
  parameters: z.object({
    query: z.string().describe('Termes de recherche'),
    categorie: z.enum(['script_vente', 'objection', 'fiche_formation', 'financement', 'process', 'faq', 'temoignage', 'argument_cle']).optional(),
  }),
  execute: async ({ query, categorie }: { query: string; categorie?: string }) => {
    // Hybrid search : BM25 (full-text) + Vector (sémantique) — -67% échecs retrieval
    try {
      const results = await hybridSearchKB(query, { limit: 5, categorie })
      if (results.length > 0) {
        return { articles: results.map(r => ({ categorie: r.categorie, titre: r.titre, contenu: r.contenu, formation_slug: r.formation_slug, statut_pro_cible: r.statut_pro_cible })), source: 'hybrid_search' }
      }
    } catch (err) {
      console.error('[KB Tool] Hybrid search failed, falling back to FTS:', err)
    }

    // Fallback : FTS seul
    const supabase = await createServiceSupabase() as any
    const searchTerms = query.replace(/['"]/g, '').split(/\s+/).filter((w: string) => w.length > 2).join(' & ')
    const { data } = await supabase.from('knowledge_base').select('categorie, titre, contenu, formation_slug, statut_pro_cible').eq('is_active', true).textSearch('fts', searchTerms || query, { config: 'french' }).limit(5)
    if (data?.length) return { articles: data, source: 'fts' }

    // Fallback ultime : articles prioritaires
    const { data: fallback } = await supabase.from('knowledge_base').select('categorie, titre, contenu').eq('is_active', true).order('priorite', { ascending: false }).limit(5)
    return { articles: fallback || [], source: 'priorité' }
  },
})

// --- TOOL 7: Playbook réponse ---
export const getPlaybookResponseTool = defineTool({
  description: `Trouve la MEILLEURE réponse validée par l'équipe pour une objection. Chaque réponse a un taux de succès mesuré en conditions réelles.
QUAND L'UTILISER : quand le commercial fait face à une objection (trop cher, pas le temps, peur, conjoint, etc.)
EXEMPLE : "La lead dit que c'est trop cher" → getPlaybookResponse({ objection: "trop cher" })`,
  parameters: z.object({
    objection: z.string().describe('L\'objection du prospect'),
  }),
  execute: async ({ objection }: { objection: string }) => {
    const supabase = await createServiceSupabase() as any
    const searchTerms = objection.replace(/['"]/g, '').split(/\s+/).filter((w: string) => w.length > 2).join(' & ')

    const { data: entries } = await supabase
      .from('playbook_entries')
      .select('titre, contexte, occurences, playbook_responses(contenu, taux_succes, upvotes, succes, echecs, is_ai_generated)')
      .eq('categorie', 'objection')
      .eq('is_active', true)
      .textSearch('fts', searchTerms || 'cher prix', { config: 'french' })
      .limit(3)

    if (!entries?.length) return { found: false, message: 'Pas de réponse validée dans le playbook pour cette objection.' }

    const bestEntry = entries[0]
    const responses = (bestEntry as any).playbook_responses || []
    const best = responses.sort((a: any, b: any) => (b.taux_succes || 0) - (a.taux_succes || 0))[0]

    return {
      found: true,
      objection: bestEntry.titre,
      nb_fois_entendue: bestEntry.occurences,
      meilleure_reponse: best?.contenu || null,
      taux_succes: best?.taux_succes ? `${best.taux_succes}%` : null,
      nb_utilisations: (best?.succes || 0) + (best?.echecs || 0),
      validee_equipe: (best?.upvotes || 0) >= 3,
    }
  },
})

// --- TOOL 8: Statistiques pipeline ---
export const getPipelineStatsTool = defineTool({
  description: `Donne les statistiques du pipeline commercial : nombre de leads par statut, CA prévisionnel, taux de conversion.
QUAND L'UTILISER : quand le commercial ou manager demande "où on en est", "combien de leads", "quel est le CA".
EXEMPLE : "Combien de leads en pipeline ?" → getPipelineStats({})`,
  parameters: z.object({ _context: z.string().optional().describe('Contexte optionnel') }),
  execute: async () => {
    const supabase = await createServiceSupabase() as any
    const { data: leads } = await supabase
      .from('leads')
      .select('statut, score_chaud')
      .not('statut', 'in', '("PERDU","SPAM")')

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, places_max, places_occupees, statut')
      .in('statut', ['PLANIFIEE', 'CONFIRMEE'])

    const { data: rappels } = await supabase
      .from('rappels')
      .select('id, statut, date_rappel')
      .eq('statut', 'EN_ATTENTE')
      .lte('date_rappel', new Date().toISOString())

    const statuts = {} as Record<string, number>
    let totalScore = 0
    for (const l of leads || []) {
      statuts[l.statut] = (statuts[l.statut] || 0) + 1
      totalScore += l.score_chaud || 0
    }

    return {
      total_leads_actifs: leads?.length || 0,
      par_statut: statuts,
      score_moyen: leads?.length ? Math.round(totalScore / leads.length) : 0,
      sessions_planifiees: sessions?.length || 0,
      places_dispo_total: sessions?.reduce((sum: number, s: any) => sum + (s.places_max - s.places_occupees), 0) || 0,
      rappels_en_retard: rappels?.length || 0,
    }
  },
})

// --- TOOL 9: Changer statut lead ---
export const updateLeadStatusTool = defineTool({
  description: `Change le statut d'un lead dans le pipeline. ATTENTION : vérifie que la transition est valide (state machine).
QUAND L'UTILISER : quand le commercial dit "passe ce lead en qualifié", "ce lead est inscrit", etc.
TRANSITIONS VALIDES :
- NOUVEAU → CONTACTE, QUALIFIE
- CONTACTE → QUALIFIE, FINANCEMENT_EN_COURS
- QUALIFIE → FINANCEMENT_EN_COURS, INSCRIT
- FINANCEMENT_EN_COURS → INSCRIT
EXEMPLE : "Marie est qualifiée" → updateLeadStatus({ lead_id: "uuid", nouveau_statut: "QUALIFIE", raison: "Entretien positif, intéressée microblading" })`,
  parameters: z.object({
    lead_id: z.string().describe('ID du lead'),
    nouveau_statut: z.string().describe('NOUVEAU | CONTACTE | QUALIFIE | FINANCEMENT_EN_COURS | INSCRIT | EN_FORMATION | FORME | ALUMNI | PERDU'),
    raison: z.string().describe('Raison du changement de statut'),
  }),
  execute: async ({ lead_id, nouveau_statut, raison }: { lead_id: string; nouveau_statut: string; raison: string }) => {
    const supabase = await createServiceSupabase() as any

    // Charger le statut actuel
    const { data: lead } = await supabase.from('leads').select('statut, prenom, nom').eq('id', lead_id).single()
    if (!lead) return { error: 'Lead non trouvé' }

    const ancien_statut = lead.statut

    // Validation state machine — transitions autorisées
    const VALID_TRANSITIONS: Record<string, string[]> = {
      NOUVEAU: ['CONTACTE', 'QUALIFIE', 'PERDU', 'SPAM'],
      CONTACTE: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'PERDU', 'SPAM', 'REPORTE'],
      QUALIFIE: ['FINANCEMENT_EN_COURS', 'INSCRIT', 'PERDU', 'REPORTE'],
      FINANCEMENT_EN_COURS: ['INSCRIT', 'QUALIFIE', 'PERDU', 'REPORTE'],
      INSCRIT: ['EN_FORMATION', 'PERDU', 'REPORTE'],
      EN_FORMATION: ['FORME', 'PERDU'],
      FORME: ['ALUMNI'],
      ALUMNI: [],
      REPORTE: ['CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS', 'PERDU'],
      PERDU: ['NOUVEAU', 'CONTACTE'],  // Réactivation possible
      SPAM: [],
    }

    const allowed = VALID_TRANSITIONS[ancien_statut] || []
    if (!allowed.includes(nouveau_statut)) {
      return {
        error: `Transition invalide : ${ancien_statut} → ${nouveau_statut}. Transitions possibles depuis ${ancien_statut} : ${allowed.join(', ') || 'aucune'}`,
      }
    }

    // Mettre à jour
    const { error } = await supabase.from('leads').update({ statut: nouveau_statut }).eq('id', lead_id)
    if (error) return { error: error.message }

    // Logger
    await supabase.from('activites').insert({
      type: 'STATUT_CHANGE',
      lead_id,
      description: `Statut changé par l'agent IA : ${ancien_statut} → ${nouveau_statut}. Raison : ${raison}`,
      ancien_statut,
      nouveau_statut,
    })

    return {
      success: true,
      lead: `${lead.prenom} ${lead.nom}`,
      ancien_statut,
      nouveau_statut,
      message: `${lead.prenom} ${lead.nom} est passé de ${ancien_statut} à ${nouveau_statut}`,
    }
  },
})

// --- TOOL 10: Envoyer un email ---
export const sendEmailTool = defineTool({
  description: `Envoie un email à un lead via le système Resend de Dermotec.
QUAND L'UTILISER : quand le commercial veut envoyer un email de relance, de confirmation, ou de financement.
IMPORTANT : toujours confirmer au commercial avant d'envoyer (résumer le contenu).
EXEMPLE : "Envoie un email de relance à Marie" → D'ABORD getLeadDetails pour avoir l'email, PUIS sendEmail(...)`,
  parameters: z.object({
    to: z.string().email().describe('Adresse email du destinataire'),
    subject: z.string().describe('Objet de l\'email'),
    body: z.string().describe('Contenu de l\'email (texte simple)'),
    lead_id: z.string().optional().describe('ID du lead pour le tracking'),
  }),
  execute: async ({ to, subject, body, lead_id }: { to: string; subject: string; body: string; lead_id?: string }) => {
    // Envoyer via l'API interne
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          template_slug: 'agent_custom',
          variables: { subject, body, lead_id },
        }),
      })

      if (!res.ok) {
        // Fallback : log l'email comme brouillon
        if (lead_id) {
          const supabase = await createServiceSupabase() as any
          await supabase.from('messages').insert({
            lead_id,
            direction: 'outbound',
            canal: 'email',
            sujet: subject,
            contenu: body,
            statut: 'brouillon',
          })
          return { success: true, mode: 'brouillon', message: `Email sauvegardé en brouillon (Resend non configuré). Sujet : "${subject}"` }
        }
        return { error: 'Impossible d\'envoyer l\'email. Resend non configuré.' }
      }

      // Sauvegarder dans messages (source de vérité)
      if (lead_id) {
        const { saveEmailSent } = await import('./message-store')
        await saveEmailSent({
          lead_id, sujet: subject, contenu: body,
          destinataire: to, source: 'agent_ia',
        })
      }
      return { success: true, mode: 'envoye', message: `Email envoyé à ${to}. Sujet : "${subject}"` }
    } catch {
      return { error: 'Erreur lors de l\'envoi de l\'email' }
    }
  },
})

// --- TOOL 11: Think (raisonnement privé) ---
// Best practice Anthropic : https://www.anthropic.com/engineering/claude-think-tool
export const thinkTool = defineTool({
  description: `Espace de réflexion PRIVÉ. Utilise cet outil pour RAISONNER avant de répondre à une question complexe.
Le contenu de ta réflexion n'est PAS montré au commercial — c'est ton brouillon interne.
QUAND L'UTILISER :
- Avant de recommander une formation (comparer prix, durée, ROI)
- Avant de conseiller un financement (croiser statut pro + organisme + montant)
- Quand la question est ambiguë et tu dois clarifier ta compréhension
- Pour vérifier que les prix/chiffres que tu vas citer sont corrects
- Pour planifier une séquence de tools à exécuter
EXEMPLE : "Je dois réfléchir... Marie est gérante, formation microblading 1400€. OPCO EP plafond 3500€ → couvert à 100%. FAFCEA plafond 2000€ → couvert aussi. Meilleur choix : OPCO EP car plus rapide."`,
  parameters: z.object({
    reasoning: z.string().describe('Ta réflexion interne — analyse, vérification de données, planification'),
  }),
  execute: async ({ reasoning }: { reasoning: string }) => {
    // Le think tool ne fait rien côté serveur — c'est juste un espace de réflexion pour le LLM
    // Le résultat n'est pas affiché dans l'UI (filtré dans AgentChat.tsx)
    return { thought: reasoning, _private: true }
  },
})

// --- TOOL 12: Proactive Insights (alertes automatiques) ---
export const getProactiveInsightsTool = defineTool({
  description: `Analyse un lead et retourne les ALERTES et OPPORTUNITÉS urgentes.
QUAND L'UTILISER : AUTOMATIQUEMENT quand tu as un lead_id en contexte. Appelle cet outil en PREMIER avant toute autre chose.
Retourne : rappels en retard, jours sans contact, dossiers financement en attente, sessions bientôt complètes.`,
  parameters: z.object({
    lead_id: z.string().describe('ID du lead'),
  }),
  execute: async ({ lead_id }: { lead_id: string }) => {
    const supabase = await createServiceSupabase() as any
    const insights: string[] = []
    const urgences: string[] = []

    // 1. Infos lead
    const { data: lead } = await supabase
      .from('leads')
      .select('prenom, nom, statut, date_dernier_contact, nb_contacts, financement_souhaite, formation_principale:formations!leads_formation_principale_id_fkey(nom, slug)')
      .eq('id', lead_id)
      .single()

    if (!lead) return { error: 'Lead non trouvé' }

    // 2. Jours sans contact
    if (lead.date_dernier_contact) {
      const daysSince = Math.floor((Date.now() - new Date(lead.date_dernier_contact).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince >= 7) urgences.push(`⚠️ Aucun contact depuis ${daysSince} jours`)
      else if (daysSince >= 3) insights.push(`Dernier contact il y a ${daysSince} jours`)
    } else if (lead.nb_contacts === 0) {
      urgences.push('🔴 Lead JAMAIS contacté')
    }

    // 3. Rappels en retard
    const { data: rappels } = await supabase
      .from('rappels')
      .select('titre, type, date_rappel')
      .eq('lead_id', lead_id)
      .eq('statut', 'EN_ATTENTE')
      .lte('date_rappel', new Date().toISOString())

    if (rappels?.length) {
      urgences.push(`🔴 ${rappels.length} rappel(s) en retard : ${rappels.map((r: any) => r.titre || r.type).join(', ')}`)
    }

    // 4. Financement en attente
    if (lead.financement_souhaite) {
      const { data: financements } = await supabase
        .from('financements')
        .select('organisme, statut')
        .eq('lead_id', lead_id)

      if (!financements?.length) {
        insights.push('💡 Financement souhaité mais aucun dossier ouvert')
      } else {
        const enCours = financements.filter((f: any) => ['SOUMIS', 'EN_EXAMEN', 'COMPLEMENT_DEMANDE'].includes(f.statut))
        if (enCours.length) insights.push(`📋 ${enCours.length} dossier(s) financement en cours : ${enCours.map((f: any) => f.organisme).join(', ')}`)
      }
    }

    // 5. Sessions bientôt complètes pour sa formation
    if (lead.formation_principale) {
      const slug = (lead.formation_principale as any)?.slug
      if (slug) {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('date_debut, places_max, places_occupees, formation:formations(slug)')
          .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
          .gte('date_debut', new Date().toISOString())
          .order('date_debut', { ascending: true })
          .limit(5)

        const matching = sessions?.filter((s: any) => s.formation?.slug === slug)
        if (matching?.length) {
          const next = matching[0]
          const placesLeft = next.places_max - next.places_occupees
          if (placesLeft <= 2) urgences.push(`🔥 Prochaine session ${(lead.formation_principale as any)?.nom} presque complète (${placesLeft} place${placesLeft > 1 ? 's' : ''})`)
          else insights.push(`📅 Prochaine session : ${new Date(next.date_debut).toLocaleDateString('fr-FR')} (${placesLeft} places dispo)`)
        }
      }
    }

    return {
      lead: `${lead.prenom} ${lead.nom}`,
      statut: lead.statut,
      urgences,
      insights,
      nb_urgences: urgences.length,
      nb_insights: insights.length,
    }
  },
})

// --- TOOL 13: Find Similar Success Leads ---
export const findSimilarSuccessTool = defineTool({
  description: `Trouve des leads avec un profil SIMILAIRE qui ont RÉUSSI (statut FORME ou ALUMNI).
Retourne les patterns de succès : nombre de contacts moyen, financement utilisé, délai de conversion.
QUAND L'UTILISER : quand tu veux donner des insights data-driven au commercial.
EXEMPLE : "Comment les gérantes d'institut comme Marie ont converti ?" → findSimilarSuccess({ statut_pro: "gerant_institut", formation_slug: "microblading" })`,
  parameters: z.object({
    statut_pro: z.string().optional().describe('Statut professionnel du lead courant'),
    formation_slug: z.string().optional().describe('Slug de la formation'),
    source: z.string().optional().describe('Source du lead'),
  }),
  execute: async ({ statut_pro, formation_slug, source }: { statut_pro?: string; formation_slug?: string; source?: string }) => {
    const supabase = await createServiceSupabase() as any

    let q = supabase
      .from('leads')
      .select('statut_pro, nb_contacts, source, created_at, financements(organisme, statut, montant_accorde), inscriptions(created_at, note_satisfaction, session:sessions(formation:formations(nom, slug)))')
      .in('statut', ['FORME', 'ALUMNI'])
      .order('updated_at', { ascending: false })
      .limit(50)

    if (statut_pro) q = q.eq('statut_pro', statut_pro)

    const { data: successLeads } = await q
    if (!successLeads?.length) return { found: false, message: 'Pas assez de données historiques pour ce profil' }

    // Filtrer par formation si précisé
    let filtered = successLeads
    if (formation_slug) {
      filtered = successLeads.filter((l: any) =>
        l.inscriptions?.some((i: any) => i.session?.formation?.slug === formation_slug)
      )
      if (!filtered.length) filtered = successLeads // fallback
    }

    // Calculer les stats
    const totalContacts = filtered.reduce((sum: number, l: any) => sum + (l.nb_contacts || 0), 0)
    const avgContacts = Math.round(totalContacts / filtered.length)

    const financements = filtered.flatMap((l: any) => l.financements?.filter((f: any) => f.statut === 'VERSE' || f.statut === 'VALIDE') || [])
    const orgCounts: Record<string, number> = {}
    for (const f of financements) {
      orgCounts[f.organisme] = (orgCounts[f.organisme] || 0) + 1
    }
    const topOrg = Object.entries(orgCounts).sort(([, a], [, b]) => b - a)[0]

    const satisfactions = filtered.flatMap((l: any) => l.inscriptions?.map((i: any) => i.note_satisfaction).filter(Boolean) || [])
    const avgSatisfaction = satisfactions.length ? (satisfactions.reduce((s: number, v: number) => s + v, 0) / satisfactions.length).toFixed(1) : null

    // Délai moyen (création → inscription)
    const delays = filtered.flatMap((l: any) =>
      l.inscriptions?.map((i: any) => {
        if (!i.created_at || !l.created_at) return null
        return Math.floor((new Date(i.created_at).getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24))
      }).filter(Boolean) || []
    )
    const avgDelay = delays.length ? Math.round(delays.reduce((s: number, v: number) => s + v, 0) / delays.length) : null

    return {
      found: true,
      nb_leads_similaires: filtered.length,
      contacts_moyens: avgContacts,
      delai_conversion_jours: avgDelay,
      financement_principal: topOrg ? { organisme: topOrg[0], count: topOrg[1] } : null,
      satisfaction_moyenne: avgSatisfaction,
      insight: `${filtered.length} leads similaires ont converti en moyenne en ${avgDelay || '?'} jours avec ${avgContacts} contacts. ${topOrg ? `${Math.round(topOrg[1] / filtered.length * 100)}% ont utilisé ${topOrg[0]}.` : ''}`,
    }
  },
})

// --- TOOL 14: Pipeline Forecast (inspiré Gong Forecast) ---
export const getPipelineForecastTool = defineTool({
  description: `Donne les PRÉVISIONS de chiffre d'affaires du pipeline : CA pondéré par probabilité, forecast 30/60/90 jours, velocity.
QUAND L'UTILISER : quand le manager demande "quel CA on peut espérer", "prévisions", "forecast", "projection", "combien on va faire ce mois".
EXEMPLE : "Quel est le forecast ?" → getPipelineForecast({})
EXEMPLE : "Combien on devrait closer ce mois ?" → getPipelineForecast({})`,
  parameters: z.object({ _context: z.string().optional().describe('Contexte optionnel') }),
  execute: async () => {
    const supabase = await createServiceSupabase() as any

    // 1. Pipeline forecast (CA pondéré par étape)
    const { data: forecast } = await supabase
      .from('v_pipeline_forecast')
      .select('*')

    // 2. Velocity (temps moyen par transition)
    const { data: velocity } = await supabase
      .from('v_pipeline_velocity')
      .select('*')

    // 3. Win patterns (coaching)
    const { data: winPatterns } = await supabase
      .from('v_win_patterns')
      .select('*')

    // Calculer les totaux
    const stages = forecast || []
    const activeStages = stages.filter((s: any) =>
      !['FORME', 'ALUMNI', 'PERDU', 'SPAM'].includes(s.statut)
    )

    const totalLeads = activeStages.reduce((sum: number, s: any) => sum + (s.nb_leads || 0), 0)
    const caBrut = activeStages.reduce((sum: number, s: any) => sum + (s.ca_brut || 0), 0)
    const caPondere = activeStages.reduce((sum: number, s: any) => sum + (s.ca_pondere || 0), 0)

    // Forecast temporel
    const ca30j = stages
      .filter((s: any) => ['INSCRIT', 'EN_FORMATION', 'FINANCEMENT_EN_COURS'].includes(s.statut))
      .reduce((sum: number, s: any) => sum + (s.ca_pondere || 0), 0)
    const ca60j = ca30j + stages
      .filter((s: any) => s.statut === 'QUALIFIE')
      .reduce((sum: number, s: any) => sum + (s.ca_pondere || 0), 0)
    const ca90j = ca60j + stages
      .filter((s: any) => ['CONTACTE', 'REPORTE'].includes(s.statut))
      .reduce((sum: number, s: any) => sum + (s.ca_pondere || 0), 0)

    return {
      total_leads_actifs: totalLeads,
      ca_brut_total: Math.round(caBrut),
      ca_pondere_total: Math.round(caPondere),
      forecast: {
        '30_jours': Math.round(ca30j),
        '60_jours': Math.round(ca60j),
        '90_jours': Math.round(ca90j),
      },
      par_etape: activeStages.map((s: any) => ({
        statut: s.statut,
        nb_leads: s.nb_leads,
        probabilite: `${Math.round((s.probabilite_etape || 0) * 100)}%`,
        ca_brut: Math.round(s.ca_brut || 0),
        ca_pondere: Math.round(s.ca_pondere || 0),
      })),
      velocity: (velocity || []).slice(0, 10).map((v: any) => ({
        transition: `${v.statut_origine} → ${v.statut_destination}`,
        duree_moyenne: `${v.duree_moyenne_jours}j`,
        nb_cas: v.nb_transitions,
      })),
      top_win_patterns: (winPatterns || []).slice(0, 8).map((w: any) => ({
        dimension: w.dimension,
        valeur: w.valeur,
        nb_wins: w.nb_wins,
        delai_moyen: `${w.delai_moyen_jours}j`,
        panier: Math.round(w.panier_moyen || 0),
      })),
    }
  },
})

// --- TOOL 15: Revenue Graph (profil 360° enrichi, inspiré Gong Revenue Graph + Klaviyo CDP) ---
// Import Score 360°
import { calculateScore360, score360ToText } from './lead-score-360'

export const getRevenueGraphTool = defineTool({
  description: `Vue 360° ENRICHIE d'un lead : revenue, engagement, financements, rappels, tout en UN SEUL appel.
Plus complet que getLeadDetails — inclut lifetime value, engagement score, jours sans contact, rappels overdue.
QUAND L'UTILISER : quand tu as besoin d'une vue COMPLÈTE d'un lead pour faire une analyse poussée.
EXEMPLE : "Fais-moi un bilan complet de Marie" → getRevenueGraph({ lead_id: "uuid" })
EXEMPLE : "Quels leads sont en danger ?" → getRevenueGraph({ filtre: "a_risque" })`,
  parameters: z.object({
    lead_id: z.string().optional().describe('ID d\'un lead spécifique'),
    filtre: z.enum(['a_risque', 'chauds', 'inactifs', 'top_ltv']).optional().describe('Filtre prédéfini'),
    limit: z.number().optional().default(10).describe('Nombre max de résultats'),
  }),
  execute: async ({ lead_id, filtre, limit }: { lead_id?: string; filtre?: string; limit?: number }) => {
    const supabase = await createServiceSupabase() as any

    if (lead_id) {
      // Un seul lead — vue 360° complète avec score
      const { data, error } = await supabase
        .from('v_revenue_graph')
        .select('*')
        .eq('id', lead_id)
        .single()
      if (error) return { error: error.message }
      // Calculer le Score 360° (engagement, LTV, health, churn)
      const score360 = calculateScore360(data)
      return {
        lead: data,
        score_360: {
          global: score360.score_global,
          label: score360.label,
          engagement: score360.engagement,
          lifetime_value: score360.lifetime_value,
          health: score360.health,
          churn_risk: score360.churn_risk,
          signaux_positifs: score360.signaux_positifs,
          signaux_negatifs: score360.signaux_negatifs,
          action_recommandee: score360.action_recommandee,
        },
      }
    }

    // Liste filtrée
    let q = supabase
      .from('v_revenue_graph')
      .select('id, prenom, nom, statut, score, engagement_score, lifetime_value, jours_sans_contact, rappels_overdue, formation_nom, formation_prix, nb_activites, nb_financements_en_cours')
      .limit(limit || 10)

    switch (filtre) {
      case 'a_risque':
        // Leads avec score > 50 mais sans contact depuis 7+ jours ou rappels overdue
        q = q.gte('score', 50)
          .or('jours_sans_contact.gte.7,rappels_overdue.gte.1')
          .order('jours_sans_contact', { ascending: false })
        break
      case 'chauds':
        q = q.gte('engagement_score', 60)
          .order('engagement_score', { ascending: false })
        break
      case 'inactifs':
        q = q.gte('jours_sans_contact', 14)
          .not('statut', 'in', '("PERDU","FORME","ALUMNI")')
          .order('jours_sans_contact', { ascending: false })
        break
      case 'top_ltv':
        q = q.gt('lifetime_value', 0)
          .order('lifetime_value', { ascending: false })
        break
      default:
        q = q.order('engagement_score', { ascending: false })
    }

    const { data, error } = await q
    if (error) return { error: error.message }
    return { leads: data || [], count: data?.length || 0, filtre: filtre || 'top_engagement' }
  },
})

// --- Export tous les tools ---
export const crmTools = {
  think: thinkTool,
  searchLeads: searchLeadsTool,
  getLeadDetails: getLeadDetailsTool,
  getProactiveInsights: getProactiveInsightsTool,
  findSimilarSuccess: findSimilarSuccessTool,
  createReminder: createReminderTool,
  getNextSessions: getNextSessionsTool,
  analyzeFinancement: analyzeFinancementTool,
  searchKnowledgeBase: searchKnowledgeBaseTool,
  getPlaybookResponse: getPlaybookResponseTool,
  getPipelineStats: getPipelineStatsTool,
  updateLeadStatus: updateLeadStatusTool,
  sendEmail: sendEmailTool,
  getPipelineForecast: getPipelineForecastTool,
  getRevenueGraph: getRevenueGraphTool,
}
