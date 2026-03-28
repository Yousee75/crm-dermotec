// ============================================================
// CRM DERMOTEC — Mapper Lead + Enrichment → ProspectData
// Transforme les données Supabase en format rapport Satorea
// ============================================================
import 'server-only'

import type { Lead } from '@/types'
import type { ProspectData } from './types'
import { FORMATIONS_SEED } from '../constants'

// Type enrichment (structure de enrichment-latitudezen-live.json)
interface EnrichmentData {
  score_global?: number
  niveau?: string
  fiabilite?: number
  financier?: {
    capital_social?: number
    forme_juridique?: string
    date_creation?: string
    effectif?: number
    score_financier?: number
    dirigeants?: { prenom: string; nom: string; fonction: string }[]
  }
  reputation?: {
    note_globale?: number
    nb_avis_total?: number
    plateformes_presentes?: number
    sentiment?: string
    score_reputation?: number
  }
  digital?: {
    maturite_digitale?: number
    a_site_web?: boolean
    score_digital?: number
  }
  zone?: {
    revenu_median_quartier?: number
    score_trafic_pieton?: number
    transports_proches?: number
    densite_commerces?: number
    standing?: string
    score_zone?: number
  }
  plateformes_avis?: {
    plateforme: string
    note: number
    nb_avis: number
    services?: string[]
  }[]
  carte_soins?: string[]
  signaux?: {
    est_sur_promo?: boolean
    est_organisme_concurrent?: boolean
    zone_saturee?: boolean
  }
}

/**
 * Transforme un lead CRM + données enrichment en ProspectData pour le rapport
 */
export function mapLeadToProspect(lead: Lead, enrichment?: EnrichmentData | null): ProspectData {
  const nom = `${lead.prenom} ${lead.nom || ''}`.trim()

  // Trouver la formation dans le seed
  const formationSeed = lead.formation_principale_id
    ? FORMATIONS_SEED.find(f => f.slug === lead.formation_principale?.slug)
    : null

  // Extraire les données des plateformes d'avis
  const planity = enrichment?.plateformes_avis?.find(p =>
    p.plateforme.includes('reservation') || p.plateforme.includes('planity')
  )
  const google = enrichment?.plateformes_avis?.find(p =>
    p.plateforme.includes('principale') || p.plateforme.includes('google')
  )

  // Calculer scores
  const noteGlobale = enrichment?.reputation?.note_globale || lead.score_chaud / 20 || 0
  const nbAvis = enrichment?.reputation?.nb_avis_total || 0

  // Année de création
  const dateCreation = enrichment?.financier?.date_creation
  const anneeCreation = dateCreation
    ? new Date(dateCreation).getFullYear()
    : 2010

  // Forme juridique
  const formeJuridique = enrichment?.financier?.forme_juridique || 'Non renseigné'
  const opcoEligible = ['SARL', 'SAS', 'SA', 'EURL', 'EIRL'].includes(formeJuridique.toUpperCase())

  // Déduire si mixte à partir des services
  const services = enrichment?.carte_soins || []
  const mentionHomme = services.some(s =>
    /homme|masculin|barbe|men/i.test(s)
  )

  return {
    id: lead.id,
    nom_dirigeant: nom,
    nom_salon: lead.entreprise_nom || nom,
    adresse: lead.adresse?.rue || '',
    code_postal: lead.adresse?.code_postal || '',
    ville: lead.adresse?.ville || 'Paris',
    telephone_mobile: lead.telephone || '',
    telephone_fixe: undefined,
    email: lead.email || undefined,

    mixte: mentionHomme,
    effectif: enrichment?.financier?.effectif
      ? `${enrichment.financier.effectif} salariés`
      : '1-2 salariés',
    statut_pro: lead.statut_pro || undefined,
    marques_utilisees: [],
    specialites: services.slice(0, 8),

    reputation: {
      note_globale: noteGlobale,
      nb_avis_total: nbAvis,
      planity_note: planity?.note,
      planity_nb_avis: planity?.nb_avis,
      google_note: google?.note,
      google_nb_avis: google?.nb_avis,
      taux_reponse_avis: undefined,
      awards: [],
    },

    finances: {
      forme_juridique: formeJuridique,
      capital_social: enrichment?.financier?.capital_social,
      annee_creation: anneeCreation,
      bodacc_clean: true,
      opco_eligible: opcoEligible,
      service_le_plus_cher_eur: undefined,
      effectif_reel: enrichment?.financier?.effectif,
    },

    concurrents_500m: enrichment?.zone?.densite_commerces,
    concurrents_avec_dermo: undefined,
    revenus_medians_quartier: enrichment?.zone?.revenu_median_quartier,
    score_trafic_pieton: enrichment?.zone?.score_trafic_pieton,

    scores: enrichment ? {
      global: enrichment.score_global || 0,
      reputation: enrichment.reputation?.score_reputation || 0,
      presence: enrichment.digital?.score_digital || 0,
      activity: 50,
      financial: enrichment.financier?.score_financier || 0,
      neighborhood: enrichment.zone?.score_zone || 0,
    } : undefined,

    formation_principale: lead.formation_principale ? {
      nom: lead.formation_principale.nom,
      prix_ht: lead.formation_principale.prix_ht,
      duree_jours: lead.formation_principale.duree_jours,
      duree_heures: lead.formation_principale.duree_heures,
      description_commerciale: formationSeed?.description_commerciale,
    } : undefined,
  }
}
