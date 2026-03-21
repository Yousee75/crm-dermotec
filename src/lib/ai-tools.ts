// @ts-nocheck — AI SDK v6 tool() inference conflicts, non-blocking
// ============================================================
// CRM DERMOTEC — AI Agent Tools
// Actions que l'agent peut exécuter dans le CRM
// Chaque tool = une capacité concrète de l'agent
// ============================================================
import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'
import { createServiceSupabase } from './supabase-server'

// --- TOOL: Recherche de leads ---
export const searchLeadsTool = tool({
  description: 'Recherche des leads dans le CRM par nom, email, téléphone ou statut. Utilise cet outil quand le commercial mentionne un prospect ou veut trouver un lead.',
  parameters: z.object({
    query: z.string().optional().describe('Texte de recherche (nom, email, téléphone)'),
    statut: z.string().optional().describe('Filtrer par statut pipeline (NOUVEAU, CONTACTE, QUALIFIE, FINANCEMENT_EN_COURS, INSCRIT, EN_FORMATION, FORME, ALUMNI)'),
    limit: z.number().optional().default(5).describe('Nombre max de résultats'),
  }),
  execute: async ({ query, statut, limit }: { query?: string; statut?: string; limit?: number }) => {
    const supabase = await createServiceSupabase()
    let q = supabase
      .from('leads')
      .select('id, prenom, nom, email, telephone, statut, score_chaud, source, statut_pro, formation_principale:formations!leads_formation_principale_id_fkey(nom)')
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
    return { leads: data, count: data?.length || 0 }
  },
})

// --- TOOL: Fiche lead complète ---
export const getLeadDetailsTool = tool({
  description: 'Charge la fiche complète d\'un lead avec son historique, ses financements, inscriptions, notes et rappels. Utilise cet outil quand tu as besoin de contexte détaillé sur un lead.',
  parameters: z.object({
    lead_id: z.string().uuid().describe('ID du lead'),
  }),
  execute: async ({ lead_id }) => {
    const supabase = await createServiceSupabase()
    const { data: lead, error } = await supabase
      .from('leads')
      .select(`
        *,
        formation_principale:formations!leads_formation_principale_id_fkey(nom, prix_ht, categorie, duree_jours),
        commercial_assigne:equipe!leads_commercial_assigne_id_fkey(prenom, nom),
        inscriptions(id, statut, montant_total, paiement_statut, note_satisfaction, session:sessions(date_debut, formation:formations(nom))),
        financements(organisme, statut, montant_demande, montant_accorde),
        rappels(id, date_rappel, type, statut, titre),
        notes_lead(contenu, type, created_at)
      `)
      .eq('id', lead_id)
      .single()

    if (error) return { error: error.message }
    return { lead }
  },
})

// --- TOOL: Créer un rappel ---
export const createReminderTool = tool({
  description: 'Crée un rappel/relance pour un lead. Utilise cet outil quand le commercial veut planifier un suivi.',
  parameters: z.object({
    lead_id: z.string().uuid().describe('ID du lead'),
    date_rappel: z.string().describe('Date et heure du rappel (ISO 8601, ex: 2026-03-25T10:00:00)'),
    type: z.enum(['APPEL', 'EMAIL', 'WHATSAPP', 'SMS', 'RDV', 'RELANCE', 'SUIVI']).describe('Type de rappel'),
    titre: z.string().describe('Titre court du rappel'),
    description: z.string().optional().describe('Description détaillée'),
  }),
  execute: async ({ lead_id, date_rappel, type, titre, description }) => {
    const supabase = await createServiceSupabase()

    const { data, error } = await supabase
      .from('rappels')
      .insert({
        lead_id,
        date_rappel,
        type,
        titre,
        description,
        statut: 'EN_ATTENTE',
        priorite: 'NORMALE',
      })
      .select('id, date_rappel, type, titre')
      .single()

    if (error) return { error: error.message }

    // Logger l'activité
    await supabase.from('activites').insert({
      type: 'RAPPEL',
      lead_id,
      description: `Rappel créé par l'agent IA : ${titre} (${type}) pour le ${new Date(date_rappel).toLocaleDateString('fr-FR')}`,
    })

    return { success: true, rappel: data }
  },
})

// --- TOOL: Prochaines sessions disponibles ---
export const getNextSessionsTool = tool({
  description: 'Liste les prochaines sessions de formation disponibles avec les places restantes. Utilise quand le commercial veut proposer une date.',
  parameters: z.object({
    formation_slug: z.string().optional().describe('Slug de la formation (ex: maquillage-permanent, microblading)'),
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

    if (formation_slug) {
      // Filtrer par formation via join
      q = q.eq('formation.slug', formation_slug)
    }

    const { data, error } = await q
    if (error) return { error: error.message }

    return {
      sessions: data?.map(s => ({
        ...s,
        places_restantes: s.places_max - s.places_occupees,
        complet: s.places_occupees >= s.places_max,
      })) || [],
    }
  },
})

// --- TOOL: Analyser les options de financement ---
export const analyzeFinancementTool = tool({
  description: 'Analyse les options de financement disponibles pour un lead selon son profil professionnel. Utilise quand le commercial doit expliquer le financement.',
  parameters: z.object({
    statut_pro: z.string().describe('Statut professionnel (salariee, independante, auto_entrepreneur, demandeur_emploi, reconversion, gerant_institut)'),
    formation_prix: z.number().describe('Prix HT de la formation en euros'),
    formation_nom: z.string().describe('Nom de la formation'),
  }),
  execute: async ({ statut_pro, formation_prix, formation_nom }) => {
    const recommandations: Array<{
      organisme: string
      eligible: boolean
      taux_prise_en_charge: string
      reste_a_charge_estime: string
      delai: string
      conseil: string
    }> = []

    const mapping: Record<string, Array<{ org: string; taux: string; rac: string; delai: string; conseil: string }>> = {
      salariee: [
        { org: 'OPCO EP', taux: '100%', rac: '0€', delai: '3-6 semaines', conseil: 'Demander au RH le code OPCO de l\'entreprise. Dossier simple.' },
        { org: 'CPF', taux: 'Variable', rac: 'Selon solde CPF', delai: 'Immédiat', conseil: 'Vérifier le solde sur moncompteformation.gouv.fr' },
        { org: 'Employeur', taux: '100%', rac: '0€', delai: '1-2 semaines', conseil: 'Présenter comme plan de développement des compétences' },
      ],
      independante: [
        { org: 'FAFCEA', taux: '100% (plafond 2000€)', rac: formation_prix > 2000 ? `${formation_prix - 2000}€` : '0€', delai: '2-4 semaines', conseil: 'Vérifier la cotisation CFP sur l\'URSSAF' },
        { org: 'FIFPL', taux: '100% (plafond 1500€)', rac: formation_prix > 1500 ? `${formation_prix - 1500}€` : '0€', delai: '2-4 semaines', conseil: 'Créer un compte FIFPL si pas encore fait' },
        { org: 'CPF', taux: 'Variable', rac: 'Selon solde', delai: 'Immédiat', conseil: 'moncompteformation.gouv.fr' },
      ],
      auto_entrepreneur: [
        { org: 'FAFCEA', taux: '100% (plafond 2000€)', rac: formation_prix > 2000 ? `${formation_prix - 2000}€` : '0€', delai: '2-4 semaines', conseil: 'Vérifier la cotisation CFP' },
        { org: 'CPF', taux: 'Variable', rac: 'Selon solde', delai: 'Immédiat', conseil: 'moncompteformation.gouv.fr' },
      ],
      demandeur_emploi: [
        { org: 'France Travail (AIF)', taux: '100%', rac: '0€', delai: '4-8 semaines', conseil: 'Le conseiller France Travail doit valider. Préparer le devis Dermotec.' },
        { org: 'CPF', taux: 'Variable', rac: 'Selon solde', delai: 'Immédiat', conseil: 'Cumulable avec AIF pour compléter' },
      ],
      reconversion: [
        { org: 'Transitions Pro (PTP)', taux: '100% salaire + formation', rac: '0€', delai: '2-3 mois', conseil: 'CDI >2 ans requis. Salaire maintenu pendant la formation.' },
        { org: 'France Travail (AIF)', taux: '100%', rac: '0€', delai: '4-8 semaines', conseil: 'Si démission pour reconversion, s\'inscrire à France Travail d\'abord' },
        { org: 'CPF', taux: 'Variable', rac: 'Selon solde', delai: 'Immédiat', conseil: 'moncompteformation.gouv.fr' },
      ],
      gerant_institut: [
        { org: 'OPCO EP', taux: '100%', rac: '0€', delai: '3-6 semaines', conseil: 'L\'entreprise cotise à l\'OPCO EP — vérifier les droits annuels' },
        { org: 'FAFCEA', taux: '100% (plafond 2000€)', rac: formation_prix > 2000 ? `${formation_prix - 2000}€` : '0€', delai: '2-4 semaines', conseil: 'Si artisan, FAFCEA est souvent plus rapide' },
        { org: 'CPF', taux: 'Variable', rac: 'Selon solde', delai: 'Immédiat', conseil: 'Personnel du dirigeant' },
      ],
    }

    const options = mapping[statut_pro] || mapping.salariee
    for (const opt of options) {
      recommandations.push({
        organisme: opt.org,
        eligible: true,
        taux_prise_en_charge: opt.taux,
        reste_a_charge_estime: opt.rac,
        delai: opt.delai,
        conseil: opt.conseil,
      })
    }

    return {
      formation: formation_nom,
      prix_ht: formation_prix,
      statut_pro,
      recommandations,
      script_telephone: `"${statut_pro === 'demandeur_emploi'
        ? `Bonne nouvelle, en tant que demandeur d'emploi, France Travail peut prendre en charge 100% de la formation ${formation_nom}. Vous ne payez rien. On s'occupe de monter le dossier avec vous.`
        : statut_pro === 'gerant_institut'
        ? `En tant que gérante, votre OPCO EP prend en charge la formation ${formation_nom}. C'est un droit que vous payez déjà via vos cotisations — autant en profiter. Reste à charge : 0€.`
        : `Votre formation ${formation_nom} est finançable via ${options[0]?.org}. ${options[0]?.taux === '100%' ? 'Prise en charge totale, 0€ de reste à charge.' : 'Le reste à charge dépend de votre situation.'} On vous aide à monter le dossier.`
      }"`,
    }
  },
})

// --- TOOL: Chercher dans la knowledge base ---
export const searchKnowledgeBaseTool = tool({
  description: 'Recherche dans la base de connaissances Dermotec (scripts de vente, réponses aux objections, fiches formation, processus financement). Utilise quand tu as besoin d\'information métier.',
  parameters: z.object({
    query: z.string().describe('Termes de recherche'),
    categorie: z.enum(['script_vente', 'objection', 'fiche_formation', 'financement', 'process', 'faq', 'temoignage', 'argument_cle']).optional().describe('Catégorie à filtrer'),
  }),
  execute: async ({ query, categorie }) => {
    const supabase = await createServiceSupabase()

    const searchTerms = query.replace(/['"]/g, '').split(/\s+/).filter(w => w.length > 2).join(' & ')

    let q = supabase
      .from('knowledge_base')
      .select('categorie, titre, contenu, formation_slug, statut_pro_cible')
      .eq('is_active', true)
      .limit(5)

    if (searchTerms) {
      q = q.textSearch('fts', searchTerms, { config: 'french' })
    }
    if (categorie) {
      q = q.eq('categorie', categorie)
    }

    const { data, error } = await q
    if (error || !data?.length) {
      // Fallback: recherche par catégorie si FTS échoue
      const { data: fallback } = await supabase
        .from('knowledge_base')
        .select('categorie, titre, contenu, formation_slug, statut_pro_cible')
        .eq('is_active', true)
        .order('priorite', { ascending: false })
        .limit(5)
      return { articles: fallback || [], source: 'priorité' }
    }

    return { articles: data, source: 'recherche' }
  },
})

// --- TOOL: Meilleure réponse du playbook ---
export const getPlaybookResponseTool = tool({
  description: 'Trouve la meilleure réponse validée par l\'équipe pour une objection donnée. Utilise quand le commercial fait face à une objection et veut la réponse qui marche le mieux.',
  parameters: z.object({
    objection: z.string().describe('L\'objection du prospect (ex: "C\'est trop cher", "Je dois réfléchir")'),
  }),
  execute: async ({ objection }) => {
    const supabase = await createServiceSupabase()

    // Chercher dans le playbook collaboratif
    const searchTerms = objection.replace(/['"]/g, '').split(/\s+/).filter(w => w.length > 2).join(' & ')

    const { data: entries } = await supabase
      .from('playbook_entries')
      .select(`
        titre, contexte, occurences,
        playbook_responses(contenu, taux_succes, upvotes, downvotes, succes, echecs, is_ai_generated)
      `)
      .eq('categorie', 'objection')
      .eq('is_active', true)
      .textSearch('fts', searchTerms || 'cher prix', { config: 'french' })
      .limit(3)

    if (!entries?.length) {
      return { found: false, message: 'Pas de réponse validée pour cette objection dans le playbook' }
    }

    // Trier les réponses par taux de succès
    const bestEntry = entries[0]
    const responses = (bestEntry as any).playbook_responses || []
    const bestResponse = responses.sort((a: any, b: any) => (b.taux_succes || 0) - (a.taux_succes || 0))[0]

    return {
      found: true,
      objection_titre: bestEntry.titre,
      occurences: bestEntry.occurences,
      meilleure_reponse: bestResponse?.contenu || null,
      taux_succes: bestResponse?.taux_succes || 0,
      nb_utilisations: (bestResponse?.succes || 0) + (bestResponse?.echecs || 0),
      validee_par_equipe: (bestResponse?.upvotes || 0) >= 3,
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
}
