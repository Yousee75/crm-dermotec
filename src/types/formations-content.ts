// Types partagés pour les 5 chantiers FORMATIONS SOURCES
// Chaque chantier produit un fichier indépendant utilisant ces interfaces

// ============================================================
// CHANTIER 1 — ACADEMY
// ============================================================

export interface AcademyQuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explication: string
}

export interface AcademyScript {
  id: string
  titre: string
  contexte: string
  canal: 'email' | 'sms' | 'whatsapp' | 'appel' | 'presentiel'
  corps: string
  variables: string[]
  conseils: string[]
}

export interface AcademySection {
  id: string
  titre: string
  sousTitre: string
  contenu: string
  pointsCles: string[]
  scripts?: AcademyScript[]
  tableaux?: AcademyTableau[]
}

export interface AcademyTableau {
  titre: string
  colonnes: string[]
  lignes: string[][]
}

export interface AcademyModule {
  id: string
  slug: string
  titre: string
  sousTitre: string
  description: string
  icone: string
  dureeMinutes: number
  niveau: 'debutant' | 'intermediaire' | 'avance'
  categorie: 'commercial' | 'technique' | 'relation-client' | 'financement' | 'fidelisation'
  sections: AcademySection[]
  quiz: AcademyQuizQuestion[]
  objectifs: string[]
  prerequis: string[]
  tags: string[]
}

// ============================================================
// CHANTIER 2 — KNOWLEDGE BASE (Agent IA)
// ============================================================

export type KBCategorie =
  | 'script-vente'
  | 'objection-parade'
  | 'faq-technique'
  | 'faq-financement'
  | 'argumentaire-financement'
  | 'cnv-formulation'
  | 'cas-pratique'

export interface KBEntry {
  id: string
  categorie: KBCategorie
  titre: string
  contenu: string
  tags: string[]
  metadata: Record<string, string>
}

// ============================================================
// CHANTIER 3 — CADENCES
// ============================================================

export type CanalCadence = 'email' | 'sms' | 'whatsapp' | 'appel'

export interface CadenceTemplate {
  id: string
  cadenceId: string
  ordre: number
  delaiJours: number
  canal: CanalCadence
  sujet: string
  corps: string
  variables: string[]
  objectif: string
  conseilsExecution: string[]
}

export interface CadenceDefinition {
  id: string
  slug: string
  nom: string
  description: string
  type: 'post-formation' | 'vente' | 'parrainage' | 'reactivation'
  dureeJours: number
  templates: CadenceTemplate[]
}

// ============================================================
// CHANTIER 4 — FORMATIONS ENRICHIES
// ============================================================

export interface FormationTechniqueComparee {
  nom: string
  methode: string
  rendu: string
  peauIdeale: string
}

export interface FormationMateriel {
  nom: string
  description: string
  prixIndicatif: string
  avantages: string[]
}

export interface FormationROI {
  coutFormation: number
  coutConsommablesParSeance: number
  prixVenteMoyen: number
  seuilRentabiliteSeances: number
  gainAnnuelEstime: string
  tempsAmortissement: string
}

export interface FormationFAQ {
  question: string
  reponse: string
}

export interface FormationGlossaire {
  terme: string
  definition: string
}

export interface FormationEnriched {
  slug: string
  nom: string
  categorie: 'dermopigmentation' | 'soins-visage' | 'laser-ipl' | 'reglementaire' | 'tricopigmentation'
  descriptionTechnique: string
  techniquesComparees: FormationTechniqueComparee[]
  materiel: FormationMateriel[]
  roi: FormationROI
  faq: FormationFAQ[]
  glossaire: FormationGlossaire[]
  reglementation: string
  contreIndications: string[]
  publicCible: string[]
  duree: string
  prix: string
}

// ============================================================
// CHANTIER 5 — FINANCEMENT
// ============================================================

export interface FraisAnnexes {
  nuitee: number | null
  repas: number | null
  transportParKm: number | null
}

export interface OrganismeFinancement {
  id: string
  nom: string
  sigle: string
  description: string
  publicEligible: string[]
  tauxHoraire: {
    technique: number
    transverse: number
    unite: string
  }
  plafondAnnuel: {
    min: number
    max: number
    description: string
  }
  fraisAnnexes: FraisAnnexes
  delaiTraitement: string
  tauxAcceptation: string
  documentsRequis: string[]
  urlPortail: string
  scriptCommercial: string
  pointsVigilance: string[]
}

export interface ChecklistFinancement {
  profil: string
  description: string
  organismeId: string
  documents: string[]
  etapes: string[]
  delaiEstime: string
}

export interface CasMontageFinancier {
  id: string
  prenom: string
  age: number
  profil: string
  contexte: string
  financeur: string
  montage: string
  resultat: string
  montantFormation: number
  montantPrisEnCharge: number
  resteACharge: number
}

export interface MotifRefus {
  motif: string
  frequence: 'frequent' | 'occasionnel' | 'rare'
  cause: string
  solution: string
  prevention: string
}
