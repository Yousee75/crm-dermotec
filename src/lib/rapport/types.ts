// ============================================================
// CRM DERMOTEC — Types Rapport Satorea "Briefing Premium"
// Structure de données pour le rapport commercial 5 slides
// Inspiré du pipeline Satorea + WIX Hunter
// ============================================================

// ── Données prospect (entrée) ──────────────────────────────

export interface ProspectData {
  // Identité
  id: string
  nom_dirigeant: string
  nom_salon: string
  adresse: string
  code_postal: string
  ville: string
  telephone_mobile: string
  telephone_fixe?: string
  email?: string

  // Profil
  mixte: boolean
  effectif: string
  statut_pro?: string
  marques_utilisees: string[]
  specialites: string[]

  // Réputation
  reputation: {
    note_globale: number
    nb_avis_total: number
    planity_note?: number
    planity_nb_avis?: number
    google_note?: number
    google_nb_avis?: number
    treatwell_note?: number
    taux_reponse_avis?: number
    awards: string[]
  }

  // Données financières
  finances: {
    forme_juridique: string
    capital_social?: number
    annee_creation: number
    bodacc_clean: boolean
    opco_eligible: boolean
    service_le_plus_cher_eur?: number
    effectif_reel?: number
  }

  // Marché local
  concurrents_500m?: number
  concurrents_avec_dermo?: number
  revenus_medians_quartier?: number
  score_trafic_pieton?: number

  // Scores enrichment
  scores?: {
    global: number
    reputation: number
    presence: number
    activity: number
    financial: number
    neighborhood: number
  }

  // Formation intéressée
  formation_principale?: {
    nom: string
    prix_ht: number
    duree_jours: number
    duree_heures: number
    description_commerciale?: string
  }
}

// ── Contenu généré par Claude (sortie) ─────────────────────

export interface KpiData {
  ca_mensuel_conservateur: number  // 3 clients/sem × prix_moyen × 4
  ca_mensuel_mixte: number         // 5 clients/sem × prix_moyen × 4
  ca_mensuel_optimiste: number     // 7 clients/sem × prix_moyen × 4
  ca_annuel_mixte: number          // ca_mensuel_mixte × 12
  remboursement_jours: number      // prix_formation ÷ ca_mensuel_mixte × 30
  anciennete_ans: number
  score_reputation: number         // /100
}

export interface ScriptStep {
  numero: number                   // 1, 2, 3 ou 4
  nom: string                      // "Accroche", "Angle unique", "Les chiffres", "Closing"
  duree_secondes: number           // 15, 20, 30, ou 15
  texte: string                    // Texte exact mot pour mot
  conseil: string                  // Conseil court pour le commercial
}

export interface Objection {
  objection: string                // Formulation exacte
  diagnostic_psychologique: string // Ce que pense vraiment le prospect
  reponse_principale: string       // La réponse à dire
  pivot_si_insistance?: string     // Réponse de secours
}

export interface TimelineAction {
  jour: string                     // "J0", "J+1", "J+3", "J+7", "J+14"
  action: string                   // Action précise
  canal: string                    // Mobile, Email, SMS, En personne
  objectif: string                 // Résultat attendu
  est_critique: boolean            // True pour J+7 passage terrain
}

export interface MotInterdit {
  interdit: string
  a_dire: string
  raison: string
}

export interface RapportSatorea {
  // ── Contenu personnalisé (100% écrit par Claude) ──
  accroche: string
  angle_unique: string
  argument_tarifaire: string
  analyse_reputation: string
  profil_psychologique: string
  argument_opco: string
  conclusion_emotionnelle: string

  // ── Données calculées ──
  kpi: KpiData

  // ── Script et objections ──
  script: ScriptStep[]           // 4 étapes
  objections: Objection[]        // 5 objections
  timeline: TimelineAction[]     // 6 actions J0→J+14
  mots_interdits: MotInterdit[]  // 5+ entrées

  // ── Meta ──
  date_generation: string
  classification: 'CHAUD' | 'TIEDE' | 'FROID'
  score_chaleur: number
}

// ── État du rapport (stockage + UI) ────────────────────────

export type RapportStatus = 'idle' | 'generating' | 'ready' | 'error'

export interface RapportState {
  status: RapportStatus
  rapport: RapportSatorea | null
  prospect: ProspectData | null
  error?: string
  generated_at?: string
}
