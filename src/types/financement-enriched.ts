// ============================================================
// CRM DERMOTEC — Types financement enrichis
// ============================================================

import type {
  Financement,
  OrganismeFinancement,
  StatutFinancement,
  Lead
} from './index'

// ============================================================
// ENUMS & TYPES
// ============================================================

export type ProfilFinancement =
  | 'salarie'
  | 'independant'
  | 'liberal'
  | 'demandeur_emploi'
  | 'apprenti'

export type StatutLigneFinancement =
  | 'PREPARATION'
  | 'SOUMIS'
  | 'EN_EXAMEN'
  | 'VALIDE'
  | 'REFUSE'
  | 'VERSE'

export type ActionHistoriqueFinancement =
  | 'creation'
  | 'modification'
  | 'statut_change'
  | 'document_ajout'
  | 'note_ajout'
  | 'ligne_ajout'
  | 'ligne_modification'
  | 'calcul_cout'
  | 'calcul_marge'
  | 'calcul_tva'

// ============================================================
// INTERFACES COÛTS & MARGE
// ============================================================

export interface CoutFormation {
  cout_formatrice: number
  cout_salle: number
  cout_materiel: number
  cout_consommables: number
  cout_deplacement: number
  cout_restauration: number
  cout_administratif: number
  cout_autres: number
  cout_autres_detail?: string
  cout_total: number // calculé automatiquement
}

export interface CalculMarge {
  marge_nette: number // montant accordé - coût total
  taux_marge: number // % marge sur montant accordé
  ca_net: number // montant accordé
  benefice_brut: number // alias marge_nette
  rentabilite_pct: number // alias taux_marge
}

export interface CalculTVA {
  tva_applicable: boolean
  taux_tva: number // % TVA (20, 10, 5.5, 2.1, 0)
  montant_ht: number
  montant_ttc: number
  montant_tva: number // calculé : montant_ttc - montant_ht
  exoneration_tva_reference: string // Article CGI
}

// ============================================================
// INTERFACES RÉGLEMENTATION
// ============================================================

export interface ReglementationOF {
  numero_nda?: string // Numéro Déclaration Activité OF
  qualiopi_valide: boolean
  datadock_reference?: string
  certification_qualite?: string
  taux_satisfaction_min: number // % minimum requis
  delai_acces_max: number // jours max avant début formation
}

// ============================================================
// INTERFACES MULTI-FINANCEMENT
// ============================================================

export interface FinancementLigne {
  id: string
  financement_id: string
  organisme_id: string
  organisme_nom: string
  montant_demande: number
  montant_accorde?: number
  statut: StatutLigneFinancement
  numero_dossier?: string
  date_soumission?: string
  date_reponse?: string
  notes?: string
  pourcentage_prise_charge?: number // % du coût formation
  created_at: string
  updated_at: string
}

export interface MultiFinancement {
  multi_financement: boolean
  financement_parent_id?: string
  lignes: FinancementLigne[]
  montant_total_demande: number // somme des lignes
  montant_total_accorde: number // somme des lignes accordées
  taux_couverture: number // % couvert vs coût formation
  reste_a_charge: number // coût - total accordé
}

// ============================================================
// INTERFACES HISTORIQUE ENRICHI
// ============================================================

export interface FinancementHistoriqueEntry {
  id: string
  financement_id: string
  user_id?: string
  user_email?: string
  user_nom?: string
  action: ActionHistoriqueFinancement
  champ_modifie?: string
  ancienne_valeur?: string
  nouvelle_valeur?: string
  details?: Record<string, unknown>
  created_at: string
}

export interface HistoriqueAnalytics {
  nb_modifications: number
  derniere_modification: string
  utilisateur_le_plus_actif: string
  actions_par_type: Record<ActionHistoriqueFinancement, number>
  temps_moyen_traitement: number // heures entre création et validation
}

// ============================================================
// INTERFACES ORGANISMES ENRICHIS
// ============================================================

export interface OrganismeParametres {
  id: string
  organisme_id: string
  organisme_nom: string
  // Paramètres techniques
  api_endpoint?: string
  api_key_env_var?: string
  webhook_url?: string
  // Contraintes métier
  montant_min: number
  montant_max?: number
  delai_reponse_jours: number
  profils_eligibles: ProfilFinancement[]
  formations_eligibles: string[] // formation IDs
  // Documents requis
  documents_obligatoires: string[]
  // Contact
  contact_nom?: string
  contact_email?: string
  contact_telephone?: string
  // Configuration
  is_active: boolean
  auto_submit: boolean // soumission automatique si critères OK
  created_at: string
  updated_at: string
}

export interface EligibiliteFinancement {
  organisme_id: string
  organisme_nom: string
  eligible: boolean
  montant_max_possible: number
  raison_ineligibilite?: string
  score_eligibilite: number // 0-100 basé sur profil + formation + montant
  recommande: boolean // top 3 organismes pour ce dossier
}

// ============================================================
// INTERFACE FINANCEMENT ENRICHI PRINCIPALE
// ============================================================

export interface FinancementEnrichi extends Financement {
  // Coûts & Marge
  cout_formatrice: number
  cout_salle: number
  cout_materiel: number
  cout_consommables: number
  cout_deplacement: number
  cout_restauration: number
  cout_administratif: number
  cout_autres: number
  cout_autres_detail?: string
  cout_total: number
  marge_nette: number
  taux_marge: number

  // TVA & Réglementation
  tva_applicable: boolean
  taux_tva: number
  montant_ht: number
  montant_ttc: number
  exoneration_tva_reference: string
  numero_nda?: string
  qualiopi_valide: boolean

  // Multi-financement
  multi_financement: boolean
  financement_parent_id?: string

  // Relations enrichies
  lead?: Lead & {
    profil_financement: ProfilFinancement
    eligibilite_cpf: boolean
    eligibilite_opco: boolean
    eligibilite_agefiph: boolean
    eligibilite_transition_pro: boolean
  }
  lignes?: FinancementLigne[]
  historique_enrichi?: FinancementHistoriqueEntry[]

  // Analytics calculés
  nb_lignes_financement?: number
  total_multi_accorde?: number
  nb_modifications?: number
  score_dossier?: number // 0-100 qualité du dossier
  probabilite_acceptation?: number // % basé sur historique
  delai_prevu_reponse?: number // jours estimés
}

// ============================================================
// INTERFACES VUE MÉTIER
// ============================================================

export interface DashboardFinancement {
  // KPIs globaux
  ca_total_demande: number
  ca_total_accorde: number
  ca_total_verse: number
  taux_acceptation: number // %
  marge_moyenne: number // %
  delai_moyen_reponse: number // jours

  // Par organisme
  organismes_stats: Array<{
    organisme_id: string
    organisme_nom: string
    nb_dossiers: number
    montant_total: number
    taux_acceptation: number
    delai_moyen: number
    marge_moyenne: number
  }>

  // Tendances
  evolution_mensuelle: Array<{
    mois: string
    montant_demande: number
    montant_accorde: number
    nb_dossiers: number
  }>
}

export interface PipelineFinancement {
  // Par statut
  par_statut: Record<StatutFinancement, {
    nb_dossiers: number
    montant_total: number
    anciennete_moyenne: number // jours
  }>

  // Dossiers prioritaires
  urgents: FinancementEnrichi[] // date limite < 7j
  bloquants: FinancementEnrichi[] // documents manquants
  opportunities: FinancementEnrichi[] // score élevé, rapide à traiter
}

// ============================================================
// HELPERS & VALIDATEURS
// ============================================================

export interface ValidationFinancement {
  organisme_valide: boolean
  montant_coherent: boolean
  documents_complets: boolean
  profil_eligible: boolean
  formation_eligible: boolean
  erreurs: string[]
  warnings: string[]
  score_completude: number // 0-100
}

export interface RecommandationFinancement {
  organisme_recommande: OrganismeParametres
  montant_optimal: number
  probabilite_succes: number
  delai_estime: number
  actions_requises: string[]
  risques_identifies: string[]
}

// ============================================================
// TYPES EXPORT/IMPORT
// ============================================================

export interface ExportFinancement {
  // Données de base
  lead_info: Pick<Lead, 'nom' | 'email' | 'telephone'>
  financement_data: Omit<FinancementEnrichi, 'lead' | 'created_at' | 'updated_at'>

  // Historique complet
  timeline: FinancementHistoriqueEntry[]

  // Métadonnées
  export_date: string
  export_user: string
  version_schema: string
}

// Types pour les formulaires
export interface FinancementFormData {
  // Organisme
  organisme: OrganismeFinancement
  organisme_detail?: string

  // Montants
  montant_demande: number
  tva_applicable: boolean
  taux_tva?: number

  // Coûts détaillés
  couts: Partial<CoutFormation>

  // Multi-financement
  multi_financement: boolean
  lignes?: Omit<FinancementLigne, 'id' | 'created_at' | 'updated_at'>[]

  // Notes
  notes?: string
}