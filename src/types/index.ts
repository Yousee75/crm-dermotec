// ============================================================
// CRM DERMOTEC — Types TypeScript complets
// ============================================================

// --- Enums ---

export type RoleEquipe = 'admin' | 'commercial' | 'formatrice' | 'assistante' | 'manager'

export type SourceLead = 'formulaire' | 'whatsapp' | 'telephone' | 'instagram' | 'facebook' | 'google' | 'bouche_a_oreille' | 'partenariat' | 'ancien_stagiaire' | 'site_web' | 'salon' | 'autre'

export type SujetContact = 'formation' | 'financement' | 'eshop' | 'partenariat' | 'modele' | 'autre'

export type StatutLead = 'NOUVEAU' | 'CONTACTE' | 'QUALIFIE' | 'FINANCEMENT_EN_COURS' | 'INSCRIT' | 'EN_FORMATION' | 'FORME' | 'ALUMNI' | 'PERDU' | 'REPORTE' | 'SPAM'

export type PrioriteLead = 'URGENTE' | 'HAUTE' | 'NORMALE' | 'BASSE'

export type StatutPro = 'salariee' | 'independante' | 'auto_entrepreneur' | 'demandeur_emploi' | 'reconversion' | 'etudiante' | 'gerant_institut' | 'autre'

export type NiveauExperience = 'aucune' | 'debutante' | 'intermediaire' | 'confirmee' | 'experte'

export type CategorieFormation = 'Dermo-Esthétique' | 'Dermo-Correctrice' | 'Soins Visage' | 'Laser & IPL' | 'Soins Corps' | 'Hygiène'

export type NiveauFormation = 'debutant' | 'intermediaire' | 'confirme'

export type StatutSession = 'BROUILLON' | 'PLANIFIEE' | 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'REPORTEE'

export type StatutInscription = 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_COURS' | 'COMPLETEE' | 'ANNULEE' | 'REMBOURSEE' | 'NO_SHOW'

export type PaiementStatut = 'EN_ATTENTE' | 'ACOMPTE' | 'PARTIEL' | 'PAYE' | 'REMBOURSE' | 'LITIGE'

export type ModePaiement = 'carte' | 'virement' | 'especes' | 'financement' | 'cheque' | 'mixte'

export type OrganismeFinancement = 'OPCO_EP' | 'AKTO' | 'FAFCEA' | 'FIFPL' | 'FRANCE_TRAVAIL' | 'CPF' | 'AGEFIPH' | 'MISSIONS_LOCALES' | 'REGION' | 'EMPLOYEUR' | 'TRANSITIONS_PRO' | 'AUTRE'

export type StatutFinancement = 'PREPARATION' | 'DOCUMENTS_REQUIS' | 'DOSSIER_COMPLET' | 'SOUMIS' | 'EN_EXAMEN' | 'COMPLEMENT_DEMANDE' | 'VALIDE' | 'REFUSE' | 'VERSE' | 'CLOTURE'

// StatutLigneFinancement est re-exporté depuis ./financement-enriched (voir fin de fichier)
type StatutLigneFinancementBase = 'PREPARATION' | 'SOUMIS' | 'EN_EXAMEN' | 'VALIDE' | 'REFUSE' | 'VERSE'

export type TypeRappel = 'APPEL' | 'EMAIL' | 'WHATSAPP' | 'SMS' | 'RDV' | 'RELANCE' | 'SUIVI' | 'ADMIN'

export type StatutRappel = 'EN_ATTENTE' | 'FAIT' | 'ANNULE' | 'REPORTE' | 'MANQUE'

export type TypeActivite = 'LEAD_CREE' | 'LEAD_MAJ' | 'STATUT_CHANGE' | 'CONTACT' | 'INSCRIPTION' | 'FINANCEMENT' | 'SESSION' | 'PAIEMENT' | 'DOCUMENT' | 'EMAIL' | 'RAPPEL' | 'NOTE' | 'EXPORT' | 'SYSTEME'

export type TypeDocument = 'convention' | 'certificat' | 'attestation' | 'devis' | 'facture' | 'avoir' | 'piece_identite' | 'justificatif_domicile' | 'kbis' | 'attestation_employeur' | 'attestation_pole_emploi' | 'photo_avant' | 'photo_apres' | 'programme' | 'emargement' | 'consentement' | 'autre'

export type StatutCommande = 'NOUVELLE' | 'PREPAREE' | 'EXPEDIEE' | 'LIVREE' | 'RETOURNEE' | 'ANNULEE'

export type StatutModele = 'INSCRIT' | 'CONFIRME' | 'PRESENT' | 'ABSENT' | 'ANNULE'

export type TypeFacture = 'devis' | 'facture' | 'avoir'
export type StatutFacture = 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE' | 'PARTIELLEMENT_PAYEE'

// --- Interfaces ---

export interface Equipe {
  id: string
  auth_user_id?: string
  prenom: string
  nom: string
  email: string
  telephone?: string
  role: RoleEquipe
  specialites: string[]
  competences_formations?: string[] // IDs formations qu'elle peut donner
  objectif_mensuel: number
  avatar_color: string
  is_active: boolean
  // Formatrice spécifique
  cv_url?: string
  diplomes?: string[]
  certifications?: string[]
  taux_horaire?: number
  type_contrat?: string
  disponibilites?: Record<string, { debut: string; fin: string }> // jour → horaires
  created_at: string
  updated_at: string
}

export interface Formation {
  id: string
  nom: string
  slug: string
  categorie: CategorieFormation
  description?: string
  description_commerciale?: string
  prix_ht: number
  tva_rate: number
  duree_jours: number
  duree_heures: number
  prerequis?: string
  niveau: NiveauFormation
  materiel_inclus: boolean
  materiel_details?: string
  places_max: number
  programme_url?: string
  image_url?: string
  objectifs: string[]
  competences_acquises: string[]
  stripe_product_id?: string
  stripe_price_id?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Adresse {
  rue?: string
  complement?: string
  code_postal?: string
  ville?: string
  pays?: string
}

export interface Lead {
  id: string
  // Identité
  civilite?: string
  prenom: string
  nom?: string
  date_naissance?: string
  nationalite?: string
  email?: string
  telephone?: string
  whatsapp?: string
  adresse?: Adresse
  photo_url?: string
  // Source & tracking
  source: SourceLead
  sujet?: SujetContact
  message?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer_url?: string
  // Qualification
  statut: StatutLead
  priorite: PrioriteLead
  score_chaud: number
  // Profil pro
  statut_pro?: StatutPro
  experience_esthetique?: NiveauExperience
  experience_annees?: number
  entreprise_nom?: string
  siret?: string
  code_ape?: string
  employeur_nom?: string
  employeur_siret?: string
  diplomes?: DiplomeInfo[]
  objectif_pro?: string
  // Formations
  formation_principale_id?: string
  formation_principale?: Formation // joined
  formations_interessees: string[]
  // Commercial
  commercial_assigne_id?: string
  commercial_assigne?: Equipe // joined
  date_premier_contact?: string
  date_dernier_contact?: string
  date_prochain_rappel?: string
  resultat_dernier_contact?: string
  nb_contacts: number
  // Financement
  financement_souhaite: boolean
  organisme_financement?: string
  // Alumni & Suivi
  nps_score?: number
  avis_google_laisse?: boolean
  temoignage?: string
  newsletter_inscrite?: boolean
  suivi_post_j30?: string
  suivi_post_j90?: string
  a_lance_activite?: boolean
  parrain_id?: string
  // Metadata
  tags: string[]
  notes?: string
  ip_address?: string
  user_agent?: string
  data_sources: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Relations (joined)
  inscriptions?: Inscription[]
  financements?: Financement[]
  rappels?: Rappel[]
  notes_lead?: NoteLead[]
  documents?: Document[]
  commandes?: Commande[]
}

export interface DiplomeInfo {
  nom: string
  annee?: number
  etablissement?: string
}

export interface Session {
  id: string
  formation_id: string
  formation?: Formation // joined
  // Planning
  date_debut: string
  date_fin: string
  horaire_debut: string
  horaire_fin: string
  // Lieu
  salle: string
  adresse: string
  // Équipe
  formatrice_id?: string
  formatrice?: Equipe // joined
  formatrice_secondaire_id?: string
  // Places
  places_max: number
  places_occupees: number
  // Modèles
  modeles_necessaires: number
  modeles_inscrits: number
  // Statut
  statut: StatutSession
  // Financier
  ca_prevu: number
  ca_realise: number
  // Checklist
  materiel_prepare: boolean
  supports_envoyes: boolean
  convocations_envoyees?: boolean
  emargement_pret?: boolean
  // Notes
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  inscriptions?: Inscription[]
  modeles?: Modele[]
}

export interface Inscription {
  id: string
  lead_id: string
  lead?: Lead // joined
  session_id: string
  session?: Session // joined
  portail_token?: string
  // Financier
  montant_total: number
  montant_finance: number
  reste_a_charge: number
  mode_paiement?: ModePaiement
  paiement_statut: PaiementStatut
  stripe_payment_id?: string
  stripe_invoice_id?: string
  // Statut
  statut: StatutInscription
  // Présence
  presence_jour1?: boolean
  presence_jour2?: boolean
  presence_jour3?: boolean
  presence_jour4?: boolean
  presence_jour5?: boolean
  taux_presence?: number
  // Évaluation
  note_satisfaction?: number
  commentaire_satisfaction?: string
  recommanderait?: boolean
  points_forts?: string
  points_amelioration?: string
  // Certificat
  certificat_genere: boolean
  certificat_url?: string
  certificat_numero?: string
  date_certification?: string
  // Convention
  convention_generee: boolean
  convention_url?: string
  convention_signee: boolean
  // Notes
  notes?: string
  created_at: string
  updated_at: string
}

export interface Financement {
  id: string
  lead_id: string
  lead?: Lead
  inscription_id?: string
  inscription?: Inscription
  // Organisme
  organisme: OrganismeFinancement
  organisme_detail?: string
  numero_dossier?: string
  // Contact
  contact_nom?: string
  contact_email?: string
  contact_telephone?: string
  // Montants
  montant_demande?: number
  montant_accorde?: number
  montant_verse: number
  // Statut
  statut: StatutFinancement
  // Dates
  date_soumission?: string
  date_reponse?: string
  date_versement?: string
  date_limite?: string
  // Documents
  documents: DocumentFinancement[]
  checklist?: ChecklistItem[]
  // Notes
  motif_refus?: string
  notes?: string
  historique: HistoriqueEntry[]
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface DocumentFinancement {
  nom: string
  url?: string
  statut: 'requis' | 'fourni' | 'valide' | 'refuse'
  date_upload?: string
}

export interface ChecklistItem {
  label: string
  done: boolean
  date?: string
}

export interface HistoriqueEntry {
  date: string
  action: string
  detail?: string
  user?: string
}

export interface Rappel {
  id: string
  lead_id?: string
  lead?: Lead
  session_id?: string
  user_id?: string
  user?: Equipe
  date_rappel: string
  type: TypeRappel
  statut: StatutRappel
  priorite: PrioriteLead
  titre?: string
  description?: string
  resultat?: string
  recurrence?: string
  created_at: string
  updated_at: string
}

export interface Activite {
  id: string
  type: TypeActivite
  lead_id?: string
  session_id?: string
  inscription_id?: string
  user_id?: string
  user?: Equipe
  description: string
  ancien_statut?: string
  nouveau_statut?: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface Document {
  id: string
  lead_id?: string
  inscription_id?: string
  financement_id?: string
  type: TypeDocument
  filename: string
  storage_path: string
  file_size?: number
  mime_type?: string
  description?: string
  uploaded_by?: string
  is_signed: boolean
  created_at: string
}

export interface Commande {
  id: string
  lead_id?: string
  client_email: string
  client_nom?: string
  client_telephone?: string
  numero_commande?: string
  produits: ProduitCommande[]
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  frais_port: number
  stripe_session_id?: string
  stripe_payment_intent?: string
  paiement_statut: 'EN_ATTENTE' | 'PAYE' | 'REMBOURSE' | 'ECHOUE'
  adresse_livraison?: Adresse
  statut: StatutCommande
  tracking_number?: string
  transporteur?: string
  date_expedition?: string
  date_livraison?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ProduitCommande {
  nom: string
  categorie?: string
  quantite: number
  prix_unitaire_ht: number
  reference?: string
}

export interface Modele {
  id: string
  session_id: string
  prenom: string
  nom?: string
  email?: string
  telephone?: string
  age?: number
  prestation_souhaitee?: string
  zone?: string
  contre_indications?: string
  statut: StatutModele
  photo_avant_url?: string
  photo_apres_url?: string
  consentement_signe: boolean
  notes?: string
  satisfaction?: number
  created_at: string
}

export interface NoteLead {
  id: string
  lead_id: string
  user_id?: string
  user?: Equipe
  contenu: string
  type: 'note' | 'appel' | 'email' | 'whatsapp' | 'reunion' | 'interne'
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface Facture {
  id: string
  numero_facture: string
  type: TypeFacture
  lead_id?: string
  lead?: Lead
  inscription_id?: string
  // Lignes
  lignes: LigneFacture[]
  sous_total_ht: number
  tva_taux: number
  montant_tva: number
  total_ttc: number
  // Mentions
  exoneration_tva: boolean
  mention_legale?: string
  // Paiement
  conditions_paiement?: string
  date_echeance?: string
  statut: StatutFacture
  stripe_invoice_id?: string
  // Échéancier
  echeancier?: Echeance[]
  // Metadata
  notes?: string
  created_at: string
  updated_at: string
}

export interface LigneFacture {
  description: string
  quantite: number
  prix_unitaire_ht: number
  total_ht: number
  tva_taux?: number
}

export interface Echeance {
  numero: number
  date: string
  montant: number
  statut: 'A_VENIR' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE'
  stripe_payment_id?: string
  date_paiement?: string
}

export interface Qualite {
  id: string
  type: 'reclamation' | 'action_corrective' | 'amelioration' | 'non_conformite'
  titre: string
  description: string
  statut: 'OUVERTE' | 'EN_COURS' | 'RESOLUE' | 'CLOTUREE'
  priorite: 'HAUTE' | 'NORMALE' | 'BASSE'
  indicateur_qualiopi?: string
  critere_qualiopi?: number
  actions_menees?: string
  date_resolution?: string
  lead_id?: string
  session_id?: string
  responsable_id?: string
  created_at: string
  updated_at: string
}

export interface Partenaire {
  id: string
  nom: string
  type: 'institut' | 'fournisseur' | 'ecole' | 'prescripteur' | 'autre'
  contact_nom?: string
  contact_email?: string
  contact_telephone?: string
  adresse?: string
  commission_taux?: number
  leads_envoyes: number
  leads_convertis: number
  ca_genere: number
  notes?: string
  is_active: boolean
  created_at: string
}

export interface EmailTemplate {
  id: string
  nom: string
  slug: string
  sujet: string
  contenu_html: string
  contenu_text?: string
  variables: string[]
  categorie: 'confirmation' | 'relance' | 'financement' | 'rappel' | 'certificat' | 'bienvenue' | 'eshop' | 'convocation' | 'satisfaction' | 'autre'
  is_active: boolean
  created_at: string
}

// --- Émargement ---

export type CreneauEmargement = 'matin' | 'apres_midi' | 'journee'

export interface Emargement {
  id: string
  session_id: string
  inscription_id: string
  date: string
  creneau: CreneauEmargement
  // Signature stagiaire
  signature_data: string | null
  signed_at: string | null
  ip_address: string | null
  user_agent: string | null
  // Signature formateur (obligatoire Qualiopi)
  formateur_signature_data: string | null
  formateur_signed_at: string | null
  formateur_ip: string | null
  // Intégrité & conformité (Décret 2017-382, eIDAS SES)
  integrity_hash: string | null
  consent_text: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Relations
  inscription?: Inscription
  session?: Session
}

// --- Qualiopi Indicateurs (calculés dynamiquement) ---

export type StatutIndicateur = 'conforme' | 'a_surveiller' | 'non_conforme'

export interface QualiopiIndicateur {
  critere: number
  indicateur: number
  label: string
  description: string
  statut: StatutIndicateur
  score: number
  preuves: string[]
  actions_requises: string[]
}

export interface QualiopiCritere {
  numero: number
  label: string
  description: string
  indicateurs: QualiopiIndicateur[]
  score_global: number
}

// --- Portail Stagiaire ---

export interface PortailData {
  inscription: Inscription
  lead: Lead
  formation: Formation
  session: Session
  emargements: Emargement[]
  documents: Document[]
  factures: Facture[]
}

// --- Formulaire Inscription Publique ---

export type TypeFinancementInscription = 'personnel' | 'opco' | 'cpf' | 'france_travail' | 'employeur' | 'autre'

export interface InscriptionPubliqueData {
  // Identité
  civilite: string
  prenom: string
  nom: string
  email: string
  telephone: string
  date_naissance?: string
  // Adresse
  adresse_rue?: string
  adresse_cp?: string
  adresse_ville?: string
  // Profil
  statut_pro: string
  experience_esthetique: string
  objectif_pro?: string
  // Formation
  formation_id: string
  session_id?: string
  // Financement
  type_financement: TypeFinancementInscription
  // Champs conditionnels OPCO
  opco_employeur_nom?: string
  opco_employeur_siret?: string
  opco_organisme?: string
  opco_contact_rh_email?: string
  // Champs conditionnels CPF
  cpf_numero?: string
  // Champs conditionnels France Travail
  ft_identifiant?: string
  ft_agence?: string
  ft_conseiller?: string
  // Champs conditionnels Employeur
  emp_nom?: string
  emp_siret?: string
  emp_contact?: string
  // Consentement
  rgpd_consent: boolean
  reglement_interieur_accepte: boolean
}

// --- Messages & Communication ---

export type CanalMessage = 'email' | 'whatsapp' | 'sms' | 'appel' | 'note_interne'
export type DirectionMessage = 'inbound' | 'outbound'
export type StatutMessage = 'brouillon' | 'envoye' | 'delivre' | 'lu' | 'erreur' | 'recu'

export interface Message {
  id: string
  lead_id: string
  lead?: Lead
  direction: DirectionMessage
  canal: CanalMessage
  sujet: string | null
  contenu: string
  contenu_html: string | null
  de: string | null
  a: string | null
  statut: StatutMessage
  external_id: string | null
  template_id: string | null
  cadence_instance_id: string | null
  metadata: Record<string, unknown>
  pieces_jointes: { nom: string; url: string; type: string }[]
  lu_at: string | null
  delivre_at: string | null
  erreur_detail: string | null
  user_id: string | null
  user?: Equipe
  created_at: string
}

export interface InboxConversation {
  lead_id: string
  lead_prenom: string
  lead_nom: string
  lead_email: string | null
  lead_telephone: string | null
  lead_photo_url: string | null
  dernier_message: string
  dernier_canal: CanalMessage
  dernier_date: string
  non_lus: number
  statut_lead: StatutLead
}

// --- Cadences ---

export type CadenceStepType = 'email' | 'sms' | 'whatsapp' | 'appel' | 'rappel' | 'attente'
export type CadenceTrigger = 'nouveau_lead' | 'post_formation' | 'relance_financement' | 'abandon' | 'alumni' | 'custom'

export interface CadenceStep {
  ordre: number
  type: CadenceStepType
  delai_jours: number
  delai_heures: number
  template_id?: string
  contenu?: string
  sujet?: string
  condition_arret?: string // ex: "lead.statut === 'INSCRIT'"
}

export interface CadenceTemplate {
  id: string
  nom: string
  description: string
  declencheur: CadenceTrigger
  etapes: CadenceStep[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CadenceInstance {
  id: string
  template_id: string
  template?: CadenceTemplate
  lead_id: string
  lead?: Lead
  etape_courante: number
  statut: 'active' | 'terminee' | 'arretee' | 'en_pause'
  prochaine_execution: string | null
  historique: { etape: number; date: string; resultat: string }[]
  created_at: string
  updated_at: string
}

// --- Academy (formation interne équipe) ---

export type AcademyCategorie = 'onboarding' | 'vente' | 'produit' | 'financement' | 'crm' | 'qualite'
export type AcademyLessonType = 'texte' | 'video' | 'quiz' | 'checklist' | 'script' | 'pdf' | 'exercice'
export type AcademyProgressStatus = 'non_commence' | 'en_cours' | 'complete'

export interface AcademyModule {
  id: string
  slug: string
  titre: string
  description: string | null
  icone: string
  couleur: string
  categorie: AcademyCategorie
  ordre: number
  duree_minutes: number
  is_published: boolean
  prerequis_module_id: string | null
  created_at: string
  // Relations
  lessons?: AcademyLesson[]
  progress_count?: number
  total_lessons?: number
}

export interface AcademyLesson {
  id: string
  module_id: string
  slug: string
  titre: string
  type: AcademyLessonType
  contenu: Record<string, unknown>
  ordre: number
  duree_minutes: number
  points: number
  is_published: boolean
  created_at: string
  // Relations
  progress?: AcademyProgress
}

export interface AcademyProgress {
  id: string
  user_id: string
  lesson_id: string
  statut: AcademyProgressStatus
  score_quiz: number | null
  temps_passe_secondes: number
  completed_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface AcademyBadge {
  id: string
  slug: string
  nom: string
  description: string | null
  icone: string
  condition_type: string
  condition_value: Record<string, unknown>
  points_bonus: number
  created_at: string
  // Relation
  earned?: boolean
  earned_at?: string
}

export interface AcademyUserStats {
  total_points: number
  lessons_completed: number
  lessons_total: number
  modules_completed: number
  modules_total: number
  badges_earned: number
  streak_days: number
  completion_percent: number
}

// --- Dashboard KPIs ---

export interface DashboardKPIs {
  leads_nouveaux: number
  leads_qualifies: number
  leads_ce_mois: number
  inscriptions_confirmees: number
  inscriptions_ce_mois: number
  ca_mois: number
  ca_previsionnel: number
  ca_annuel: number
  taux_conversion: number
  taux_remplissage: number
  satisfaction_moyenne: number
  nps: number
  rappels_en_retard: number
  rappels_aujourdhui: number
  sessions_a_venir: number
  dossiers_financement_en_cours: number
  montant_financement_en_attente: number
}

// --- Constantes ---

// Pipeline : 5 groupes couleur (froid/actif/chaud/gagné/perdu)
export const STATUTS_LEAD: Record<StatutLead, { label: string; color: string; order: number }> = {
  NOUVEAU: { label: 'Nouveau', color: '#94A3B8', order: 0 },
  CONTACTE: { label: 'Contacté', color: '#94A3B8', order: 1 },
  QUALIFIE: { label: 'Qualifié', color: 'var(--color-primary)', order: 2 },
  FINANCEMENT_EN_COURS: { label: 'Financement', color: 'var(--color-primary)', order: 3 },
  INSCRIT: { label: 'Inscrit', color: '#F59E0B', order: 4 },
  EN_FORMATION: { label: 'En formation', color: '#F59E0B', order: 5 },
  FORME: { label: 'Formé(e)', color: '#10B981', order: 6 },
  ALUMNI: { label: 'Alumni', color: '#10B981', order: 7 },
  PERDU: { label: 'Perdu', color: '#EF4444', order: 8 },
  REPORTE: { label: 'Reporté', color: '#94A3B8', order: 9 },
  SPAM: { label: 'Spam', color: '#94A3B8', order: 10 },
}

export const PHASES_PIPELINE: { id: string; label: string; statuts: StatutLead[] }[] = [
  { id: 'prospection', label: 'Prospection', statuts: ['NOUVEAU', 'CONTACTE'] },
  { id: 'qualification', label: 'Qualification', statuts: ['QUALIFIE'] },
  { id: 'financement', label: 'Financement', statuts: ['FINANCEMENT_EN_COURS'] },
  { id: 'inscription', label: 'Inscription', statuts: ['INSCRIT'] },
  { id: 'formation', label: 'Formation', statuts: ['EN_FORMATION'] },
  { id: 'complete', label: 'Complété', statuts: ['FORME', 'ALUMNI'] },
  { id: 'perdu', label: 'Perdu', statuts: ['PERDU', 'REPORTE', 'SPAM'] },
]

export const ORGANISMES_FINANCEMENT: Record<OrganismeFinancement, { label: string; description: string; cible: string; documents_requis: string[] }> = {
  OPCO_EP: {
    label: 'OPCO EP',
    description: 'Opérateur de compétences des entreprises de proximité',
    cible: 'Salariées (commerce, artisanat, professions libérales)',
    documents_requis: ['Bulletin de paie', 'Programme formation', 'Convention', 'Devis', 'Formulaire OPCO'],
  },
  AKTO: {
    label: 'AKTO',
    description: 'Opérateur de compétences des services',
    cible: 'Salariées secteur services',
    documents_requis: ['Bulletin de paie', 'Programme formation', 'Convention', 'Devis', 'Formulaire AKTO'],
  },
  FAFCEA: {
    label: 'FAFCEA',
    description: 'Fonds d\'assurance formation des chefs d\'entreprise artisanale',
    cible: 'Artisans, dirigeants artisanaux',
    documents_requis: ['Attestation URSSAF', 'Programme formation', 'Devis', 'Convention'],
  },
  FIFPL: {
    label: 'FIF-PL',
    description: 'Fonds interprofessionnel de formation des professions libérales',
    cible: 'Professions libérales',
    documents_requis: ['Attestation URSSAF', 'Relevé SNIR ou avis imposition', 'Programme', 'Convention'],
  },
  FRANCE_TRAVAIL: {
    label: 'France Travail',
    description: 'Aide Individuelle à la Formation (AIF)',
    cible: 'Demandeurs d\'emploi',
    documents_requis: ['Attestation inscription', 'Programme formation', 'Devis', 'Lettre motivation'],
  },
  CPF: {
    label: 'CPF',
    description: 'Compte Personnel de Formation',
    cible: 'Toute personne active',
    documents_requis: ['Identifiant CPF', 'Pièce identité'],
  },
  AGEFIPH: {
    label: 'AGEFIPH',
    description: 'Association de gestion du fonds pour l\'insertion des personnes handicapées',
    cible: 'Personnes en situation de handicap',
    documents_requis: ['RQTH', 'Programme formation', 'Devis', 'CV'],
  },
  MISSIONS_LOCALES: {
    label: 'Missions Locales',
    description: 'Accompagnement jeunes 16-25 ans',
    cible: 'Jeunes 16-25 ans',
    documents_requis: ['Pièce identité', 'Attestation Mission Locale', 'Programme'],
  },
  REGION: {
    label: 'Région',
    description: 'Aides régionales à la formation',
    cible: 'Variable selon région',
    documents_requis: ['Pièce identité', 'Justificatif domicile', 'Programme', 'Devis'],
  },
  EMPLOYEUR: {
    label: 'Employeur direct',
    description: 'Financement direct par l\'employeur (plan de développement des compétences)',
    cible: 'Salariées',
    documents_requis: ['Convention', 'Programme', 'Accord employeur'],
  },
  TRANSITIONS_PRO: {
    label: 'Transitions Pro',
    description: 'Projet de Transition Professionnelle (PTP)',
    cible: 'Salariées CDI > 2 ans en reconversion',
    documents_requis: ['Bulletins de paie (12 mois)', 'Bilan positionnement', 'Programme', 'Convention', 'Lettre motivation', 'CV'],
  },
  AUTRE: {
    label: 'Autre',
    description: 'Autre mode de financement',
    cible: 'Tous',
    documents_requis: [],
  },
}

export const CATEGORIES_FORMATION: { id: CategorieFormation; label: string; icon: string; color: string }[] = [
  { id: 'Dermo-Esthétique', label: 'Dermo-Esthétique', icon: 'Palette', color: '#FF5C00' },
  { id: 'Dermo-Correctrice', label: 'Dermo-Correctrice', icon: 'Heart', color: '#FF2D78' },
  { id: 'Soins Visage', label: 'Soins Visage', icon: 'Sun', color: '#FF8C42' },
  { id: 'Laser & IPL', label: 'Laser & IPL', icon: 'Zap', color: '#E65200' },
  { id: 'Soins Corps', label: 'Soins Corps', icon: 'Flower2', color: '#10B981' },
  { id: 'Hygiène', label: 'Hygiène', icon: 'ShieldCheck', color: '#3A3A3A' },
]

// ============================================================
// TYPES ENRICHIS — Re-exports
// ============================================================

// Re-export des types financement enrichis
export type {
  ProfilFinancement,
  StatutLigneFinancement,
  ActionHistoriqueFinancement,
  CoutFormation,
  CalculMarge,
  CalculTVA,
  ReglementationOF,
  FinancementLigne,
  MultiFinancement,
  FinancementHistoriqueEntry,
  HistoriqueAnalytics,
  OrganismeParametres,
  EligibiliteFinancement,
  FinancementEnrichi,
  DashboardFinancement,
  PipelineFinancement,
  ValidationFinancement,
  RecommandationFinancement,
  ExportFinancement,
  FinancementFormData
} from './financement-enriched'
