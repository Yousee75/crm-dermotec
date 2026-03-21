// @ts-nocheck — AI SDK v6 tool() inference conflicts, non-blocking
// ============================================================
// CRM DERMOTEC — AI Agent Tools (v2)
// 10 tools CRM exécutables par l'agent
// Best practice Anthropic : descriptions détaillées + exemples
// ============================================================
import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'
import { createServiceSupabase } from './supabase-server'

// --- TOOL 1: Recherche de leads ---
export const searchLeadsTool = tool({
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
  execute: async ({ query, statut, limit }) => {
    const supabase = await createServiceSupabase()
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
export const getLeadDetailsTool = tool({
  description: `Charge la fiche complète d'un lead : profil, formation, financement, inscriptions, rappels, notes.
QUAND L'UTILISER : quand tu as besoin du contexte complet d'un lead pour conseiller le commercial.
EXEMPLE : "Dis-moi tout sur cette lead" → getLeadDetails({ lead_id: "uuid" })`,
  parameters: z.object({
    lead_id: z.string().describe('ID UUID du lead'),
  }),
  execute: async ({ lead_id }) => {
    const supabase = await createServiceSupabase()
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
export const createReminderTool = tool({
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
  execute: async ({ lead_id, date_rappel, type, titre, description }) => {
    const supabase = await createServiceSupabase()
    const { data, error } = await supabase
      .from('rappels')
      .insert({ lead_id, date_rappel, type, titre, description, statut: 'EN_ATTENTE', priorite: 'NORMALE' })
      .select('id, date_rappel, type, titre')
      .single()

    if (error) return { error: error.message }

    await supabase.from('activites').insert({
      type: 'RAPPEL',
      lead_id,
      description: `Rappel créé par l'agent IA : ${titre} (${type}) — ${new Date(date_rappel).toLocaleDateString('fr-FR')}`,
    })

    return { success: true, rappel: data, message: `Rappel "${titre}" créé pour le ${new Date(date_rappel).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}` }
  },
})

// --- TOOL 4: Sessions disponibles ---
export const getNextSessionsTool = tool({
  description: `Liste les prochaines sessions de formation avec places restantes.
QUAND L'UTILISER : quand le commercial veut proposer une date au prospect, vérifier les disponibilités.
EXEMPLE : "Prochaines sessions microblading ?" → getNextSessions({ formation_slug: "microblading" })
EXEMPLE : "Qu'est-ce qui est dispo ?" → getNextSessions({})`,
  parameters: z.object({
    formation_slug: z.string().optional().describe('Slug formation (maquillage-permanent, microblading, full-lips, tricopigmentation, areole-cicatrices, nanoneedling, soin-allin1, peeling-dermaplaning, detatouage, epilation-definitive, hygiene-salubrite)'),
  }),
  execute: async ({ formation_slug }) => {
    const supabase = await createServiceSupabase()
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
export const analyzeFinancementTool = tool({
  description: `Analyse les options de financement pour un prospect selon son statut professionnel.
Retourne les organismes éligibles, les montants, les délais et un SCRIPT TÉLÉPHONIQUE prêt à lire.
QUAND L'UTILISER : quand le commercial parle de financement, de prix, ou que le prospect demande comment payer.
EXEMPLE : "Comment financer le microblading pour une salariée ?" → analyzeFinancement({ statut_pro: "salariee", formation_prix: 1400, formation_nom: "Microblading" })`,
  parameters: z.object({
    statut_pro: z.string().describe('salariee | independante | auto_entrepreneur | demandeur_emploi | reconversion | gerant_institut'),
    formation_prix: z.number().describe('Prix HT en euros'),
    formation_nom: z.string().describe('Nom de la formation'),
  }),
  execute: async ({ statut_pro, formation_prix, formation_nom }) => {
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
export const searchKnowledgeBaseTool = tool({
  description: `Recherche dans la base de connaissances Dermotec : scripts de vente, réponses objections, fiches formation, processus financement, FAQ, témoignages.
QUAND L'UTILISER : quand le commercial a besoin d'un script, d'arguments, ou d'informations métier.
EXEMPLE : "Script premier appel" → searchKnowledgeBase({ query: "premier appel", categorie: "script_vente" })
EXEMPLE : "Comment fonctionne le CPF ?" → searchKnowledgeBase({ query: "CPF processus" })`,
  parameters: z.object({
    query: z.string().describe('Termes de recherche'),
    categorie: z.enum(['script_vente', 'objection', 'fiche_formation', 'financement', 'process', 'faq', 'temoignage', 'argument_cle']).optional(),
  }),
  execute: async ({ query, categorie }) => {
    const supabase = await createServiceSupabase()
    const searchTerms = query.replace(/['"]/g, '').split(/\s+/).filter((w: string) => w.length > 2).join(' & ')

    let q = supabase.from('knowledge_base').select('categorie, titre, contenu, formation_slug, statut_pro_cible').eq('is_active', true).limit(5)
    if (searchTerms) q = q.textSearch('fts', searchTerms, { config: 'french' })
    if (categorie) q = q.eq('categorie', categorie)

    const { data } = await q
    if (!data?.length) {
      const { data: fallback } = await supabase.from('knowledge_base').select('categorie, titre, contenu').eq('is_active', true).order('priorite', { ascending: false }).limit(5)
      return { articles: fallback || [], source: 'priorité' }
    }
    return { articles: data, source: 'recherche' }
  },
})

// --- TOOL 7: Playbook réponse ---
export const getPlaybookResponseTool = tool({
  description: `Trouve la MEILLEURE réponse validée par l'équipe pour une objection. Chaque réponse a un taux de succès mesuré en conditions réelles.
QUAND L'UTILISER : quand le commercial fait face à une objection (trop cher, pas le temps, peur, conjoint, etc.)
EXEMPLE : "La lead dit que c'est trop cher" → getPlaybookResponse({ objection: "trop cher" })`,
  parameters: z.object({
    objection: z.string().describe('L\'objection du prospect'),
  }),
  execute: async ({ objection }) => {
    const supabase = await createServiceSupabase()
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
export const getPipelineStatsTool = tool({
  description: `Donne les statistiques du pipeline commercial : nombre de leads par statut, CA prévisionnel, taux de conversion.
QUAND L'UTILISER : quand le commercial ou manager demande "où on en est", "combien de leads", "quel est le CA".
EXEMPLE : "Combien de leads en pipeline ?" → getPipelineStats({})`,
  parameters: z.object({}),
  execute: async () => {
    const supabase = await createServiceSupabase()
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
      places_dispo_total: sessions?.reduce((sum, s) => sum + (s.places_max - s.places_occupees), 0) || 0,
      rappels_en_retard: rappels?.length || 0,
    }
  },
})

// --- TOOL 9: Changer statut lead ---
export const updateLeadStatusTool = tool({
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
  execute: async ({ lead_id, nouveau_statut, raison }) => {
    const supabase = await createServiceSupabase()

    // Charger le statut actuel
    const { data: lead } = await supabase.from('leads').select('statut, prenom, nom').eq('id', lead_id).single()
    if (!lead) return { error: 'Lead non trouvé' }

    const ancien_statut = lead.statut

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
export const sendEmailTool = tool({
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
  execute: async ({ to, subject, body, lead_id }) => {
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
          const supabase = await createServiceSupabase()
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

      return { success: true, mode: 'envoye', message: `Email envoyé à ${to}. Sujet : "${subject}"` }
    } catch {
      return { error: 'Erreur lors de l\'envoi de l\'email' }
    }
  },
})

// --- Export tous les tools ---
export const crmTools = {
  searchLeads: searchLeadsTool,
  getLeadDetails: getLeadDetailsTool,
  createReminder: createReminderTool,
  getNextSessions: getNextSessionsTool,
  analyzeFinancement: analyzeFinancementTool,
  searchKnowledgeBase: searchKnowledgeBaseTool,
  getPlaybookResponse: getPlaybookResponseTool,
  getPipelineStats: getPipelineStatsTool,
  updateLeadStatus: updateLeadStatusTool,
  sendEmail: sendEmailTool,
}
