import 'server-only'
// ============================================================
// CRM SATOREA — Enrichment Proxy Layer
// SÉCURITÉ : Ce fichier masque TOUTES les sources de données.
// Les réponses API ne contiennent JAMAIS le nom d'un provider.
// Les champs sont génériques et opaques.
// ============================================================

// ============================================================
// TYPES PUBLICS — Ce que le frontend voit
// Aucun nom de provider, aucune trace de l'origine des données
// ============================================================

export interface IntelligenceFinanciere {
  chiffre_affaires?: number
  resultat_net?: number
  capital_social?: number
  effectif?: number
  annee_donnees?: number
  forme_juridique?: string
  date_creation?: string
  dirigeants?: Array<{ prenom: string; nom: string; fonction: string }>
  solvabilite?: 'bonne' | 'moyenne' | 'risque' | 'inconnue'
  en_difficulte?: boolean // procédure collective détectée
  score_financier?: number // 0-100
}

export interface IntelligenceReputation {
  note_globale?: number // 0-5 (moyenne pondérée multi-sources)
  nb_avis_total?: number
  sentiment?: 'positif' | 'neutre' | 'negatif'
  plateformes_presentes?: number // nb de plateformes où l'entreprise est référencée
  avis_recents?: Array<{
    auteur: string
    note: number
    extrait: string
    date?: string
  }>
  score_reputation?: number // 0-100
}

export interface IntelligenceFormation {
  est_organisme_formation?: boolean
  numero_declaration?: string
  certifie_qualite?: boolean // Qualiopi
  types_certification?: string[] // actions de formation, bilan, VAE, etc.
  nb_stagiaires?: number
  nb_formateurs?: number
  specialites?: string[]
  formations_catalogue?: Array<{
    intitule: string
    prix_ttc?: number
    duree_heures?: number
    certifiante?: boolean
    eligible_financement?: boolean
    code_certification?: string
  }>
  concurrents_zone?: {
    nombre: number
    prix_moyen?: number
    certifies_qualite?: number
  }
  score_formation?: number // 0-100
}

export interface IntelligenceMarche {
  offres_emploi_zone?: number
  tendance_recrutement?: 'hausse' | 'stable' | 'baisse'
  types_contrat?: { cdi: number; cdd: number; autre: number }
  salaire_moyen_zone?: number
  dynamisme_zone?: number // 0-100
  nouvelles_entreprises_zone?: number
  fermetures_zone?: number
  score_marche?: number // 0-100
}

export interface IntelligenceDigitale {
  score_site_mobile?: number // 0-100
  score_site_desktop?: number // 0-100
  temps_chargement_ms?: number
  maturite_digitale?: number // 0-100 (composite)
  a_site_web?: boolean
  reseaux_sociaux?: {
    nb_plateformes: number
    audience_totale?: number
  }
  score_digital?: number // 0-100
}

export interface IntelligenceZone {
  revenu_median_quartier?: number
  standing?: 'premium' | 'moyen_plus' | 'moyen' | 'populaire'
  prix_immobilier_m2?: number
  densite_commerces?: number
  score_trafic_pieton?: number // 0-100
  transports_proches?: number
  score_zone?: number // 0-100
}

/** Résultat complet d'enrichissement — AUCUNE trace des sources */
export interface IntelligenceComplete {
  // Scores composites (ce que le commercial voit)
  score_global: number // 0-100
  niveau: 'A' | 'B' | 'C' | 'D' // A=excellent, D=faible
  fiabilite: number // 0-100 (% de données vérifiées)

  // 6 axes d'intelligence
  financier?: IntelligenceFinanciere
  reputation?: IntelligenceReputation
  formation?: IntelligenceFormation
  marche?: IntelligenceMarche
  digital?: IntelligenceDigitale
  zone?: IntelligenceZone

  // Méta (sans sources)
  derniere_mise_a_jour: string // ISO date
  nb_donnees_collectees: number // nb de champs remplis
  version: string // "v2.1" — opaque
}

// ============================================================
// TRANSFORMATION — Convertir les données internes en format opaque
// ============================================================

/** Calcule le score financier (0-100) à partir des données brutes */
function scoreFinancier(data: {
  ca?: number
  resultat_net?: number
  effectif?: number
  en_difficulte?: boolean
}): number {
  if (data.en_difficulte) return 10
  let score = 50 // base
  if (data.ca && data.ca > 0) {
    if (data.ca > 500_000) score += 20
    else if (data.ca > 100_000) score += 10
    else score += 5
  }
  if (data.resultat_net && data.resultat_net > 0) score += 15
  if (data.effectif && data.effectif > 5) score += 10
  if (data.effectif && data.effectif > 20) score += 5
  return Math.min(100, score)
}

/** Calcule le score réputation (0-100) */
function scoreReputation(data: {
  note?: number
  nb_avis?: number
  nb_plateformes?: number
}): number {
  let score = 0
  if (data.note) score += (data.note / 5) * 40
  if (data.nb_avis && data.nb_avis > 0) {
    score += Math.min(30, Math.log10(data.nb_avis + 1) / Math.log10(201) * 30)
  }
  if (data.nb_plateformes) score += Math.min(30, data.nb_plateformes * 10)
  return Math.min(100, Math.round(score))
}

/** Détermine le standing du quartier */
function determinerStanding(revenuMedian?: number, prixM2?: number): IntelligenceZone['standing'] {
  if (!revenuMedian && !prixM2) return undefined
  const r = revenuMedian || 0
  const p = prixM2 || 0
  if (r > 35000 || p > 8000) return 'premium'
  if (r > 25000 || p > 5000) return 'moyen_plus'
  if (r > 18000 || p > 3000) return 'moyen'
  return 'populaire'
}

/** Détermine le niveau global */
function determinerNiveau(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 75) return 'A'
  if (score >= 50) return 'B'
  if (score >= 25) return 'C'
  return 'D'
}

// ============================================================
// ASSEMBLEUR — Combine toutes les sources en Intelligence opaque
// ============================================================

/**
 * Assemble les données de TOUTES les sources internes
 * en un objet IntelligenceComplete SANS AUCUNE trace des providers.
 *
 * Appelé par l'API route, JAMAIS directement par le frontend.
 */
export function assembleIntelligence(internal: {
  // Données internes (avec les vrais noms de providers)
  // Ce type n'est JAMAIS exposé au frontend
  sirene?: any
  pappers?: any
  google?: any
  pj?: any
  planity?: any
  treatwell?: any
  instagram?: any
  social?: any
  scraper?: any
  edof?: any
  dgefp?: any
  rncp?: any
  france_travail?: any
  bodacc?: any
  pagespeed?: any
  inpi?: any
  iris?: any
  dvf?: any
  neighborhood?: any
}): IntelligenceComplete {
  const now = new Date().toISOString()
  let nbDonnees = 0

  // --- FINANCIER ---
  const financier: IntelligenceFinanciere = {}
  const fin = internal.pappers || internal.inpi || internal.sirene
  if (fin) {
    financier.chiffre_affaires = fin.chiffre_affaires || fin.ca || fin.chiffre_affaires_dernier
    financier.resultat_net = fin.resultat_net || fin.resultat
    financier.capital_social = fin.capital_social || fin.capital
    financier.effectif = fin.effectif || fin.tranche_effectifs
    financier.forme_juridique = fin.forme_juridique
    financier.date_creation = fin.date_creation
    financier.dirigeants = fin.dirigeants?.map((d: any) => ({
      prenom: d.prenom || '',
      nom: d.nom || '',
      fonction: d.fonction || d.qualite || '',
    }))
    financier.annee_donnees = fin.annee_cloture || fin.anneeFiscale
    nbDonnees += Object.values(financier).filter(Boolean).length
  }

  // BODACC : procédures collectives
  if (internal.bodacc?.enProcedure) {
    financier.en_difficulte = true
    financier.solvabilite = 'risque'
  } else if (financier.chiffre_affaires) {
    financier.solvabilite = (financier.resultat_net || 0) > 0 ? 'bonne' : 'moyenne'
  }

  financier.score_financier = scoreFinancier({
    ca: financier.chiffre_affaires,
    resultat_net: financier.resultat_net,
    effectif: financier.effectif ? Number(financier.effectif) : undefined,
    en_difficulte: financier.en_difficulte,
  })

  // --- REPUTATION ---
  const reputation: IntelligenceReputation = {}
  const notes: number[] = []
  const avisTotal: number[] = []
  let plateformes = 0

  if (internal.google?.rating) { notes.push(internal.google.rating); plateformes++ }
  if (internal.google?.total_reviews) avisTotal.push(internal.google.total_reviews)
  if (internal.pj?.rating) { notes.push(internal.pj.rating); plateformes++ }
  if (internal.pj?.reviewsCount) avisTotal.push(internal.pj.reviewsCount)
  if (internal.planity?.found) plateformes++
  if (internal.treatwell?.found) plateformes++
  if (internal.instagram?.followers) plateformes++

  if (notes.length > 0) {
    reputation.note_globale = Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10
  }
  reputation.nb_avis_total = avisTotal.reduce((a, b) => a + b, 0) || undefined
  reputation.plateformes_presentes = plateformes || undefined

  if (reputation.note_globale) {
    reputation.sentiment = reputation.note_globale >= 4 ? 'positif'
      : reputation.note_globale >= 3 ? 'neutre' : 'negatif'
  }

  reputation.score_reputation = scoreReputation({
    note: reputation.note_globale,
    nb_avis: reputation.nb_avis_total,
    nb_plateformes: plateformes,
  })
  nbDonnees += Object.values(reputation).filter(Boolean).length

  // --- FORMATION ---
  const formation: IntelligenceFormation = {}
  if (internal.dgefp) {
    formation.est_organisme_formation = true
    formation.numero_declaration = internal.dgefp.nda
    formation.certifie_qualite = internal.dgefp.qualiopi
    formation.types_certification = internal.dgefp.qualiopi_actions
    formation.nb_stagiaires = internal.dgefp.nb_stagiaires
    formation.nb_formateurs = internal.dgefp.effectif_formateurs
    formation.specialites = internal.dgefp.specialites
  }

  if (internal.edof && Array.isArray(internal.edof)) {
    formation.formations_catalogue = internal.edof.map((f: any) => ({
      intitule: f.intitule || f.intitule_certification,
      prix_ttc: f.prix_ttc,
      duree_heures: f.duree_heures,
      certifiante: f.certifiante,
      eligible_financement: true, // CPF = finançable
      code_certification: f.code_rncp || f.code_rs,
    }))
    formation.concurrents_zone = {
      nombre: internal.edof.length,
      prix_moyen: internal.edof.length > 0
        ? Math.round(internal.edof.reduce((s: number, f: any) => s + (f.prix_ttc || 0), 0) / internal.edof.length)
        : undefined,
    }
  }

  formation.score_formation = formation.est_organisme_formation ? 80
    : formation.formations_catalogue?.length ? 50 : 0
  nbDonnees += Object.values(formation).filter(Boolean).length

  // --- MARCHE ---
  const marche: IntelligenceMarche = {}
  if (internal.france_travail) {
    marche.offres_emploi_zone = internal.france_travail.nb_offres
    marche.types_contrat = {
      cdi: internal.france_travail.nb_cdi || 0,
      cdd: internal.france_travail.nb_cdd || 0,
      autre: (internal.france_travail.nb_offres || 0) - (internal.france_travail.nb_cdi || 0) - (internal.france_travail.nb_cdd || 0),
    }
    marche.salaire_moyen_zone = internal.france_travail.salaire_moyen
    marche.tendance_recrutement = (marche.offres_emploi_zone || 0) > 10 ? 'hausse'
      : (marche.offres_emploi_zone || 0) > 3 ? 'stable' : 'baisse'
  }

  if (internal.bodacc) {
    marche.nouvelles_entreprises_zone = internal.bodacc.creations
    marche.fermetures_zone = internal.bodacc.radiations
  }

  marche.dynamisme_zone = Math.min(100, Math.round(
    ((marche.offres_emploi_zone || 0) * 5) +
    ((marche.nouvelles_entreprises_zone || 0) * 3) -
    ((marche.fermetures_zone || 0) * 2)
  ))
  marche.score_marche = Math.max(0, marche.dynamisme_zone || 0)
  nbDonnees += Object.values(marche).filter(Boolean).length

  // --- DIGITAL ---
  const digital: IntelligenceDigitale = {}
  if (internal.pagespeed) {
    digital.score_site_mobile = internal.pagespeed.score_mobile || internal.pagespeed.score
    digital.score_site_desktop = internal.pagespeed.score_desktop
    digital.temps_chargement_ms = internal.pagespeed.lcp_ms
    digital.maturite_digitale = internal.pagespeed.maturite
      || Math.round(((digital.score_site_mobile || 0) * 0.6 + (digital.score_site_desktop || 0) * 0.4))
  }

  const nbSocial = [
    internal.instagram?.followers,
    internal.social?.facebook,
    internal.social?.tiktok,
    internal.social?.youtube,
  ].filter(Boolean).length

  digital.a_site_web = !!(internal.google?.website || internal.pj?.website)
  digital.reseaux_sociaux = {
    nb_plateformes: nbSocial,
    audience_totale: (internal.instagram?.followers || 0) +
      (internal.social?.facebook_followers || 0) +
      (internal.social?.tiktok_followers || 0),
  }
  digital.score_digital = Math.min(100, Math.round(
    (digital.maturite_digitale || 0) * 0.5 +
    (nbSocial * 10) +
    (digital.a_site_web ? 20 : 0)
  ))
  nbDonnees += Object.values(digital).filter(Boolean).length

  // --- ZONE ---
  const zone: IntelligenceZone = {}
  if (internal.iris) {
    zone.revenu_median_quartier = internal.iris.revenu_median
  }
  if (internal.dvf) {
    zone.prix_immobilier_m2 = internal.dvf.prix_m2_median
  }
  if (internal.neighborhood) {
    zone.score_trafic_pieton = internal.neighborhood.footTrafficScore
    zone.transports_proches = internal.neighborhood.metros
    zone.densite_commerces = (internal.neighborhood.restaurants || 0) +
      (internal.neighborhood.cafes || 0) + (internal.neighborhood.supermarkets || 0)
  }
  zone.standing = determinerStanding(zone.revenu_median_quartier, zone.prix_immobilier_m2)
  zone.score_zone = Math.min(100, Math.round(
    ((zone.revenu_median_quartier || 0) > 25000 ? 30 : 15) +
    (zone.score_trafic_pieton || 0) * 0.4 +
    (zone.prix_immobilier_m2 && zone.prix_immobilier_m2 > 5000 ? 20 : 10)
  ))
  nbDonnees += Object.values(zone).filter(Boolean).length

  // --- SCORE GLOBAL ---
  const scores = [
    financier.score_financier,
    reputation.score_reputation,
    formation.score_formation,
    marche.score_marche,
    digital.score_digital,
    zone.score_zone,
  ].filter((s): s is number => s !== undefined && s > 0)

  const scoreGlobal = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  return {
    score_global: scoreGlobal,
    niveau: determinerNiveau(scoreGlobal),
    fiabilite: Math.min(100, Math.round((nbDonnees / 40) * 100)), // 40 champs = 100%
    financier: Object.keys(financier).length > 1 ? financier : undefined,
    reputation: Object.keys(reputation).length > 1 ? reputation : undefined,
    formation: Object.keys(formation).length > 1 ? formation : undefined,
    marche: Object.keys(marche).length > 1 ? marche : undefined,
    digital: Object.keys(digital).length > 1 ? digital : undefined,
    zone: Object.keys(zone).length > 1 ? zone : undefined,
    derniere_mise_a_jour: now,
    nb_donnees_collectees: nbDonnees,
    version: 'v2.1',
  }
}

// ============================================================
// NETTOYAGE — Supprimer toute trace de providers dans les logs prod
// ============================================================

const PROVIDER_NAMES = [
  'pappers', 'bright_data', 'brightdata', 'google_places', 'google places',
  'pagesjaunes', 'pages jaunes', 'planity', 'treatwell', 'instagram',
  'outscraper', 'scrape.do', 'scrapedo', 'sirene', 'insee', 'inpi',
  'france_travail', 'francetravail', 'pole_emploi', 'bodacc', 'dgefp',
  'edof', 'mon compte formation', 'rncp', 'carif', 'oref', 'pagespeed',
  'openrouter', 'deepseek', 'anthropic', 'openai', 'dvf', 'etalab',
  'societe.com', 'verif.com', 'apify', 'twilio', 'resend',
]

/** Nettoie un objet de toute référence aux providers */
export function sanitizeForClient<T extends Record<string, any>>(obj: T): T {
  const json = JSON.stringify(obj)
  let cleaned = json

  for (const name of PROVIDER_NAMES) {
    const regex = new RegExp(name, 'gi')
    cleaned = cleaned.replace(regex, 'source')
  }

  return JSON.parse(cleaned)
}

/** Vérifie qu'un objet ne contient aucune référence aux providers */
export function auditLeaks(obj: any): string[] {
  const json = JSON.stringify(obj).toLowerCase()
  return PROVIDER_NAMES.filter(name => json.includes(name.toLowerCase()))
}
