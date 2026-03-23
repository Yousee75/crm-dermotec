// ============================================================
// CRM DERMOTEC — Workflow complet du financement
// Centre de formation esthétique certifié Qualiopi
// ============================================================

import {
  ORGANISMES_FINANCEMENT,
  getOrganismeById,
  calculerFinancement,
} from '@/lib/financement-data'
import {
  calculerTVA,
  formatMontant,
  verifierPlafond,
} from '@/lib/financement-calculator'
import { validateFinancementTransition } from '@/lib/validators'

// ============================================================
// SECTION 1 — PIPELINE 14 ÉTAPES
// ============================================================

export type EtapeWorkflow =
  | 'qualification'           // Lead identifié, profil déterminé
  | 'collecte_docs'          // Documents en cours de collecte
  | 'dossier_complet'        // Tous les docs reçus, convention signée
  | 'depose'                 // Dossier envoyé au financeur
  | 'en_instruction'         // Financeur examine le dossier
  | 'complement_demande'     // Financeur demande pièces supplémentaires
  | 'accorde'                // APC reçu (Accord de Prise en Charge)
  | 'inscription_confirmee'  // Stagiaire inscrit à la session
  | 'en_formation'           // Formation en cours
  | 'facture_envoyee'        // Facture + certificat envoyés au financeur
  | 'paiement_recu'          // Financeur a payé
  | 'cloture'                // Dossier terminé
  | 'refuse'                 // Financeur a refusé
  | 'annule'                 // Annulé par le stagiaire ou l'OF

// Transitions valides (state machine)
export const WORKFLOW_TRANSITIONS: Record<EtapeWorkflow, EtapeWorkflow[]> = {
  qualification: ['collecte_docs', 'annule'],
  collecte_docs: ['dossier_complet', 'qualification', 'annule'],
  dossier_complet: ['depose', 'collecte_docs', 'annule'],
  depose: ['en_instruction', 'complement_demande', 'accorde', 'refuse'],
  en_instruction: ['complement_demande', 'accorde', 'refuse'],
  complement_demande: ['collecte_docs', 'depose', 'refuse', 'annule'],
  accorde: ['inscription_confirmee', 'annule'],
  inscription_confirmee: ['en_formation', 'annule'],
  en_formation: ['facture_envoyee'], // Pas d'annulation pendant la formation
  facture_envoyee: ['paiement_recu', 'cloture'],
  paiement_recu: ['cloture'],
  cloture: [], // Terminal
  refuse: ['qualification', 'annule'], // Peut recommencer
  annule: [], // Terminal
}

export interface EtapeMetadata {
  nom: string
  description: string
  icone: string
  couleur: string
  numero: number
  total: number
  pourcentage: number
  delai_max: number // jours maximum avant alerte
}

export const ETAPES_METADATA: Record<EtapeWorkflow, EtapeMetadata> = {
  qualification: {
    nom: 'Qualification',
    description: 'Profil déterminé, éligibilité vérifiée',
    icone: '🎯',
    couleur: '#3B82F6',
    numero: 1,
    total: 14,
    pourcentage: 7,
    delai_max: 3,
  },
  collecte_docs: {
    nom: 'Collecte documents',
    description: 'Documents requis en cours de collecte',
    icone: '📋',
    couleur: '#F59E0B',
    numero: 2,
    total: 14,
    pourcentage: 14,
    delai_max: 7,
  },
  dossier_complet: {
    nom: 'Dossier complet',
    description: 'Tous les documents reçus et validés',
    icone: '✅',
    couleur: '#10B981',
    numero: 3,
    total: 14,
    pourcentage: 21,
    delai_max: 2,
  },
  depose: {
    nom: 'Déposé',
    description: 'Dossier transmis au financeur',
    icone: '📤',
    couleur: '#FF2D78',
    numero: 4,
    total: 14,
    pourcentage: 28,
    delai_max: 1,
  },
  en_instruction: {
    nom: 'En instruction',
    description: 'Financeur examine la demande',
    icone: '🔍',
    couleur: '#FF2D78',
    numero: 5,
    total: 14,
    pourcentage: 35,
    delai_max: 30,
  },
  complement_demande: {
    nom: 'Complément demandé',
    description: 'Pièces supplémentaires requises',
    icone: '🔄',
    couleur: '#F97316',
    numero: 6,
    total: 14,
    pourcentage: 42,
    delai_max: 5,
  },
  accorde: {
    nom: 'Accordé',
    description: 'APC (Accord de Prise en Charge) reçu',
    icone: '🎉',
    couleur: 'var(--color-success)',
    numero: 7,
    total: 14,
    pourcentage: 50,
    delai_max: 7,
  },
  inscription_confirmee: {
    nom: 'Inscription confirmée',
    description: 'Stagiaire inscrit à la session',
    icone: '📝',
    couleur: '#06B6D4',
    numero: 8,
    total: 14,
    pourcentage: 57,
    delai_max: 14,
  },
  en_formation: {
    nom: 'En formation',
    description: 'Formation en cours de réalisation',
    icone: '🎓',
    couleur: '#0EA5E9',
    numero: 9,
    total: 14,
    pourcentage: 64,
    delai_max: 0, // Pas de délai max
  },
  facture_envoyee: {
    nom: 'Facture envoyée',
    description: 'Facture et certificat transmis',
    icone: '💰',
    couleur: '#84CC16',
    numero: 10,
    total: 14,
    pourcentage: 71,
    delai_max: 3,
  },
  paiement_recu: {
    nom: 'Paiement reçu',
    description: 'Financeur a effectué le paiement',
    icone: '✨',
    couleur: 'var(--color-success)',
    numero: 11,
    total: 14,
    pourcentage: 78,
    delai_max: 5,
  },
  cloture: {
    nom: 'Clôturé',
    description: 'Dossier terminé avec succès',
    icone: '🏁',
    couleur: '#059669',
    numero: 14,
    total: 14,
    pourcentage: 100,
    delai_max: 0,
  },
  refuse: {
    nom: 'Refusé',
    description: 'Demande rejetée par le financeur',
    icone: '❌',
    couleur: '#EF4444',
    numero: 13,
    total: 14,
    pourcentage: 0,
    delai_max: 0,
  },
  annule: {
    nom: 'Annulé',
    description: 'Dossier annulé par le stagiaire ou l\'OF',
    icone: '🚫',
    couleur: '#6B7280',
    numero: 12,
    total: 14,
    pourcentage: 0,
    delai_max: 0,
  },
}

// ============================================================
// SECTION 2 — DOCUMENTS REQUIS PAR ÉTAPE
// ============================================================

export interface DocumentRequis {
  type: string
  obligatoire: boolean
  description: string
  alternatives?: string[]
  conditionnel?: string
  format?: string[]
  taille_max?: number // Mo
  validite_jours?: number
}

export const DOCUMENTS_PAR_ETAPE: Record<EtapeWorkflow, DocumentRequis[]> = {
  qualification: [], // Rien requis

  collecte_docs: [
    {
      type: 'piece_identite',
      obligatoire: true,
      description: 'Pièce d\'identité recto-verso en cours de validité',
      format: ['pdf', 'jpg', 'png'],
      taille_max: 5,
      validite_jours: 365,
    },
    {
      type: 'attestation_urssaf',
      obligatoire: true,
      description: 'Attestation URSSAF de moins de 1 an',
      conditionnel: 'Si travailleur indépendant',
      format: ['pdf'],
      taille_max: 3,
      validite_jours: 365,
    },
    {
      type: 'kbis',
      obligatoire: true,
      description: 'Kbis ou extrait RM de moins de 1 an',
      alternatives: ['extrait_rm'],
      conditionnel: 'Si entreprise',
      format: ['pdf'],
      taille_max: 3,
      validite_jours: 365,
    },
    {
      type: 'diplome_esthetique',
      obligatoire: false,
      description: 'Diplôme esthétique (requis FAFCEA technique)',
      conditionnel: 'Si FAFCEA et formation technique',
      format: ['pdf', 'jpg'],
      taille_max: 5,
    },
    {
      type: 'justificatif_domicile',
      obligatoire: true,
      description: 'Justificatif de domicile de moins de 3 mois',
      format: ['pdf', 'jpg'],
      taille_max: 3,
      validite_jours: 90,
    },
  ],

  dossier_complet: [
    {
      type: 'convention',
      obligatoire: true,
      description: 'Convention de formation signée',
      format: ['pdf'],
      taille_max: 5,
    },
    {
      type: 'devis',
      obligatoire: true,
      description: 'Devis conforme aux exigences du financeur',
      format: ['pdf'],
      taille_max: 3,
    },
    {
      type: 'programme',
      obligatoire: true,
      description: 'Programme de formation détaillé',
      format: ['pdf'],
      taille_max: 5,
    },
    {
      type: 'rib_organisme',
      obligatoire: true,
      description: 'RIB de l\'organisme de formation',
      format: ['pdf'],
      taille_max: 1,
    },
    {
      type: 'attestation_employeur',
      obligatoire: false,
      description: 'Attestation employeur',
      conditionnel: 'Si salarié',
      format: ['pdf'],
      taille_max: 3,
    },
  ],

  depose: [
    {
      type: 'accusé_depot',
      obligatoire: true,
      description: 'Accusé de réception du dépôt',
      format: ['pdf', 'email'],
      taille_max: 2,
    },
    {
      type: 'numero_dossier',
      obligatoire: true,
      description: 'Numéro de dossier attribué par le financeur',
      format: ['text'],
    },
  ],

  en_instruction: [],

  complement_demande: [
    {
      type: 'demande_complement',
      obligatoire: true,
      description: 'Courrier de demande de complément',
      format: ['pdf', 'email'],
      taille_max: 3,
    },
  ],

  accorde: [
    {
      type: 'accord_prise_en_charge',
      obligatoire: true,
      description: 'APC (Accord de Prise en Charge) officiel',
      format: ['pdf'],
      taille_max: 5,
    },
    {
      type: 'numero_apc',
      obligatoire: true,
      description: 'Numéro d\'APC pour la facturation',
      format: ['text'],
    },
  ],

  inscription_confirmee: [
    {
      type: 'contrat_formation',
      obligatoire: true,
      description: 'Contrat de formation signé',
      format: ['pdf'],
      taille_max: 5,
    },
  ],

  en_formation: [
    {
      type: 'emargement',
      obligatoire: true,
      description: 'Feuilles d\'émargement quotidiennes',
      format: ['pdf'],
      taille_max: 10,
    },
  ],

  facture_envoyee: [
    {
      type: 'facture',
      obligatoire: true,
      description: 'Facture HT conforme',
      format: ['pdf'],
      taille_max: 3,
    },
    {
      type: 'certificat_realisation',
      obligatoire: true,
      description: 'Certificat de réalisation',
      format: ['pdf'],
      taille_max: 5,
    },
    {
      type: 'emargement_complet',
      obligatoire: true,
      description: 'Feuilles d\'émargement complètes et signées',
      format: ['pdf'],
      taille_max: 10,
    },
    {
      type: 'evaluation_stagiaire',
      obligatoire: false,
      description: 'Évaluation de satisfaction',
      format: ['pdf'],
      taille_max: 3,
    },
  ],

  paiement_recu: [
    {
      type: 'avis_paiement',
      obligatoire: true,
      description: 'Avis de paiement ou virement reçu',
      format: ['pdf'],
      taille_max: 2,
    },
  ],

  cloture: [
    {
      type: 'bilan_final',
      obligatoire: false,
      description: 'Bilan final du financement',
      format: ['pdf'],
      taille_max: 5,
    },
  ],

  refuse: [
    {
      type: 'courrier_refus',
      obligatoire: true,
      description: 'Courrier motivé de refus',
      format: ['pdf', 'email'],
      taille_max: 3,
    },
  ],

  annule: [
    {
      type: 'demande_annulation',
      obligatoire: true,
      description: 'Demande d\'annulation motivée',
      format: ['pdf', 'email'],
      taille_max: 3,
    },
  ],
}

// ============================================================
// SECTION 3 — GESTION DES PAIEMENTS
// ============================================================

export type TypePaiement = 'financement_organisme' | 'reste_a_charge' | 'acompte' | 'solde' | 'remboursement' | 'avoir'
export type MoyenPaiement = 'carte_bancaire' | 'virement' | 'cheque' | 'especes' | 'prelevement' | 'stripe' | 'paypal' | 'subrogation'
export type StatutPaiement = 'en_attente' | 'en_cours' | 'paye' | 'partiel' | 'en_retard' | 'impaye' | 'rembourse' | 'annule'

// Mode de paiement du financement
export type ModePaiement = 'subrogation' | 'remboursement_stagiaire' | 'mixte'

export interface Echeance {
  numero: number
  montant: number
  dateEcheance: Date
  statut: StatutPaiement
  moyen: MoyenPaiement
  datePayee?: Date
  reference?: string
}

// Créer un échéancier pour le reste à charge stagiaire
export function creerEcheancier(params: {
  montantTotal: number
  nombreEcheances: 2 | 3 | 4  // 2x, 3x, 4x
  dateDebut: Date
  moyen: MoyenPaiement
}): Echeance[] {
  const { montantTotal, nombreEcheances, dateDebut, moyen } = params
  const echeances: Echeance[] = []
  const montantParEcheance = Math.round((montantTotal / nombreEcheances) * 100) / 100

  for (let i = 0; i < nombreEcheances; i++) {
    const dateEcheance = new Date(dateDebut)
    dateEcheance.setDate(dateEcheance.getDate() + (i * 30)) // 30 jours entre chaque

    // Dernière échéance = ajustement pour éviter les centimes
    const montant = i === nombreEcheances - 1
      ? montantTotal - (montantParEcheance * (nombreEcheances - 1))
      : montantParEcheance

    echeances.push({
      numero: i + 1,
      montant,
      dateEcheance,
      statut: 'en_attente',
      moyen,
    })
  }

  return echeances
}

// Vérifier la cohérence financière
export function verifierCoherenceFinanciere(params: {
  montantFormation: number
  montantAPC: number  // Accord de Prise en Charge
  montantFacture: number
  totalPaiementsRecus: number
}): { coherent: boolean; alertes: string[] } {
  const { montantFormation, montantAPC, montantFacture, totalPaiementsRecus } = params
  const alertes: string[] = []
  let coherent = true

  // Règle 1: montantFacture <= montantAPC
  if (montantFacture > montantAPC) {
    coherent = false
    alertes.push(`La facture (${formatEuro(montantFacture)}) ne peut pas dépasser l'APC accordé (${formatEuro(montantAPC)})`)
  }

  // Règle 2: totalPaiementsRecus <= montantFacture
  if (totalPaiementsRecus > montantFacture) {
    coherent = false
    alertes.push(`Les paiements reçus (${formatEuro(totalPaiementsRecus)}) dépassent le montant facturé (${formatEuro(montantFacture)})`)
  }

  // Règle 3: montantAPC <= montantFormation
  if (montantAPC > montantFormation) {
    alertes.push(`ATTENTION: L'APC (${formatEuro(montantAPC)}) dépasse le coût formation (${formatEuro(montantFormation)}) - trop-perçu possible`)
  }

  // Règle 4: Vérifier si paiement complet
  const restantAPayer = montantFacture - totalPaiementsRecus
  if (restantAPayer > 0.01) { // Tolérance centimes
    alertes.push(`Paiement incomplet: ${formatEuro(restantAPayer)} restant à recevoir`)
  }

  return { coherent, alertes }
}

// ============================================================
// SECTION 4 — FACTURATION
// ============================================================

export interface FactureFormation {
  numero: string
  type: 'facture' | 'avoir' | 'acompte' | 'proforma'
  destinataireType: 'organisme_financeur' | 'stagiaire' | 'entreprise'
  montantHT: number
  exonereTVA: boolean
  tauxTVA: number
  montantTTC: number
  dateEmission: Date
  dateEcheance: Date
  mentionsLegales: string[]
  numeroDossier?: string
  numeroAPC?: string
}

// Générer une facture
export function genererFacture(params: {
  financementId: string
  type: 'facture' | 'avoir' | 'acompte' | 'proforma'
  destinataireType: 'organisme_financeur' | 'stagiaire' | 'entreprise'
  montantHT: number
  exonereTVA: boolean
  tauxTVA?: number
  numeroDossier?: string
  numeroAPC?: string
}): FactureFormation {
  const {
    financementId,
    type,
    destinataireType,
    montantHT,
    exonereTVA,
    tauxTVA = 20,
    numeroDossier,
    numeroAPC,
  } = params

  const dateEmission = new Date()
  const dateEcheance = calculerDateEcheance('general', dateEmission)

  const tva = calculerTVA(montantHT, exonereTVA, tauxTVA)

  const mentionsLegales = getMentionsLegales({
    exonereTVA,
    organismeType: destinataireType,
    numeroDossier,
    numeroAPC,
  })

  // Générer numéro de facture (format: 2024-001)
  const annee = dateEmission.getFullYear()
  const numero = `${annee}-${String(Math.floor(Math.random() * 9999) + 1).padStart(3, '0')}`

  return {
    numero,
    type,
    destinataireType,
    montantHT,
    exonereTVA,
    tauxTVA: tva.tauxTVA,
    montantTTC: tva.montantTTC,
    dateEmission,
    dateEcheance,
    mentionsLegales,
    numeroDossier,
    numeroAPC,
  }
}

// Calculer la date d'échéance selon l'organisme
export function calculerDateEcheance(organismeId: string, dateEmission: Date): Date {
  const dateEcheance = new Date(dateEmission)

  switch (organismeId) {
    case 'opco-ep':
      dateEcheance.setDate(dateEcheance.getDate() + 30) // 30 jours
      break
    case 'fafcea':
      dateEcheance.setDate(dateEcheance.getDate() + 60) // 60 jours (jusqu'à 2 mois après fin formation)
      break
    case 'fifpl':
      dateEcheance.setDate(dateEcheance.getDate() + 45) // 45 jours
      break
    case 'cpf':
      dateEcheance.setDate(dateEcheance.getDate() + 0) // Paiement immédiat via plateforme
      break
    case 'france-travail-aif':
      dateEcheance.setDate(dateEcheance.getDate() + 40) // 30-45 jours
      break
    default:
      dateEcheance.setDate(dateEcheance.getDate() + 30) // 30 jours par défaut
  }

  return dateEcheance
}

// Mentions légales selon le type de facture
export function getMentionsLegales(params: {
  exonereTVA: boolean
  organismeType: string
  numeroDossier?: string
  numeroAPC?: string
}): string[] {
  const { exonereTVA, organismeType, numeroDossier, numeroAPC } = params
  const mentions: string[] = []

  // Mentions obligatoires
  mentions.push('NDA (Numéro de Déclaration d\'Activité) : 11 75 54350 75')
  mentions.push('SIRET : 123 456 789 00012')
  mentions.push('Organisme certifié Qualiopi - Actions de formation')

  // TVA
  if (exonereTVA) {
    mentions.push('Exonération de TVA — Article 261-4-4° du CGI')
  }

  // Informations financeur
  if (organismeType === 'organisme_financeur') {
    if (numeroDossier) {
      mentions.push(`N° de dossier : ${numeroDossier}`)
    }
    if (numeroAPC) {
      mentions.push(`N° APC : ${numeroAPC}`)
    }
  }

  // Délai de paiement
  mentions.push('Règlement : 30 jours à réception de facture')
  mentions.push('En cas de retard de paiement, application de pénalités de 3 fois le taux légal')

  return mentions
}

// ============================================================
// SECTION 5 — RELANCES & ALERTES
// ============================================================

// Calendrier de relance automatique pour impayés
export const CALENDRIER_RELANCES = {
  premiere_relance: 7,   // J+7 après échéance
  deuxieme_relance: 21,  // J+21
  troisieme_relance: 35, // J+35
  mise_en_demeure: 45,   // J+45
  contentieux: 60,        // J+60
} as const

// Templates de relance
export const TEMPLATES_RELANCE = {
  premiere: {
    objet: 'Rappel — Facture {numero_facture} échue',
    corps: 'Bonjour, sauf erreur de notre part, la facture n°{numero_facture} d\'un montant de {montant}€ émise le {date_emission} arrive à échéance le {date_echeance}. Nous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais.',
  },
  deuxieme: {
    objet: 'Relance — Facture {numero_facture} impayée',
    corps: 'Bonjour, malgré notre premier rappel, la facture n°{numero_facture} reste impayée. Merci de régulariser votre situation sous 7 jours.',
  },
  mise_en_demeure: {
    objet: 'Mise en demeure — Facture {numero_facture}',
    corps: 'Madame, Monsieur, par la présente, nous vous mettons en demeure de régler la facture n°{numero_facture} d\'un montant de {montant}€ dans un délai de 8 jours à compter de la réception de ce courrier.',
  },
}

export interface Alerte {
  type: 'document_manquant' | 'delai_depasse' | 'paiement_retard' | 'echeance_proche' | 'deadline_approche' | 'budget_epuise' | 'validite_expire' | 'refus_sans_plan_b'
  urgence: 'basse' | 'moyenne' | 'haute' | 'critique'
  message: string
  actions?: string[]
  delai_resolution?: number // jours
}

// Alertes automatiques
export function detecterAlertes(financement: any): Alerte[] {
  const alertes: Alerte[] = []
  const maintenant = new Date()

  // Document manquant depuis > 7 jours
  if (financement.etape === 'collecte_docs' && financement.updated_at) {
    const joursDepuisMAJ = Math.floor((maintenant.getTime() - new Date(financement.updated_at).getTime()) / (1000 * 60 * 60 * 24))
    if (joursDepuisMAJ > 7) {
      alertes.push({
        type: 'document_manquant',
        urgence: 'haute',
        message: `Documents manquants depuis ${joursDepuisMAJ} jours`,
        actions: ['Relance WhatsApp', 'Appel stagiaire', 'Email de rappel'],
        delai_resolution: 3,
      })
    }
  }

  // Dossier en instruction depuis > 30 jours
  if (financement.etape === 'en_instruction' && financement.date_depot) {
    const joursInstruction = Math.floor((maintenant.getTime() - new Date(financement.date_depot).getTime()) / (1000 * 60 * 60 * 24))
    if (joursInstruction > 30) {
      alertes.push({
        type: 'delai_depasse',
        urgence: 'moyenne',
        message: `Dossier en instruction depuis ${joursInstruction} jours`,
        actions: ['Contacter le financeur', 'Demander un point d\'avancement'],
        delai_resolution: 7,
      })
    }
  }

  // Facture en retard de paiement
  if (financement.etape === 'facture_envoyee' && financement.date_echeance_facture) {
    const joursRetard = Math.floor((maintenant.getTime() - new Date(financement.date_echeance_facture).getTime()) / (1000 * 60 * 60 * 24))
    if (joursRetard > 0) {
      const urgence = joursRetard > 30 ? 'critique' : joursRetard > 14 ? 'haute' : 'moyenne'
      alertes.push({
        type: 'paiement_retard',
        urgence,
        message: `Facture impayée depuis ${joursRetard} jours`,
        actions: ['Relance financeur', 'Vérifier IBAN', 'Mise en demeure si >45j'],
        delai_resolution: joursRetard > 30 ? 1 : 3,
      })
    }
  }

  // Échéance stagiaire dans 3 jours
  if (financement.echeances) {
    const prochaineEcheance = financement.echeances.find((e: any) => e.statut === 'en_attente')
    if (prochaineEcheance) {
      const joursAvantEcheance = Math.floor((new Date(prochaineEcheance.date_echeance).getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24))
      if (joursAvantEcheance <= 3 && joursAvantEcheance >= 0) {
        alertes.push({
          type: 'echeance_proche',
          urgence: 'moyenne',
          message: `Échéance de ${formatEuro(prochaineEcheance.montant)} dans ${joursAvantEcheance} jour(s)`,
          actions: ['Préparer prélèvement', 'Rappel au stagiaire'],
          delai_resolution: joursAvantEcheance,
        })
      }
    }
  }

  // Date limite de dépôt qui approche (< 14 jours)
  if (financement.date_limite_depot) {
    const joursAvantLimite = Math.floor((new Date(financement.date_limite_depot).getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24))
    if (joursAvantLimite <= 14 && joursAvantLimite >= 0) {
      const urgence = joursAvantLimite <= 7 ? 'critique' : 'haute'
      alertes.push({
        type: 'deadline_approche',
        urgence,
        message: `Date limite dépôt dans ${joursAvantLimite} jour(s)`,
        actions: ['Accélérer collecte docs', 'Prioriser traitement', 'Alerter stagiaire'],
        delai_resolution: Math.max(1, joursAvantLimite - 1),
      })
    }
  }

  // Budget OPCO potentiellement épuisé (2nd semestre)
  const moisActuel = maintenant.getMonth() + 1 // 1-12
  if (moisActuel >= 7 && financement.organisme_id === 'opco-ep') { // Juillet+
    alertes.push({
      type: 'budget_epuise',
      urgence: moisActuel >= 10 ? 'haute' : 'moyenne', // Oct+ = haute
      message: 'Budgets OPCO EP souvent épuisés en 2nd semestre',
      actions: ['Dépôt prioritaire', 'Plan B si refus', 'Prévoir CPF complément'],
    })
  }

  // Attestation URSSAF qui expire bientôt
  if (financement.documents?.attestation_urssaf_validite) {
    const joursAvantExpiration = Math.floor((new Date(financement.documents.attestation_urssaf_validite).getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24))
    if (joursAvantExpiration <= 30 && joursAvantExpiration >= 0) {
      alertes.push({
        type: 'validite_expire',
        urgence: joursAvantExpiration <= 7 ? 'haute' : 'moyenne',
        message: `Attestation URSSAF expire dans ${joursAvantExpiration} jour(s)`,
        actions: ['Demander nouvelle attestation', 'Mettre à jour dossier'],
        delai_resolution: Math.max(3, joursAvantExpiration - 7),
      })
    }
  }

  // Financement refusé sans plan B
  if (financement.etape === 'refuse' && !financement.plan_b_active) {
    alertes.push({
      type: 'refus_sans_plan_b',
      urgence: 'critique',
      message: 'Financement refusé sans solution alternative',
      actions: ['Activer plan B', 'Orienter vers CPF', 'Proposition paiement perso'],
      delai_resolution: 1,
    })
  }

  return alertes
}

// ============================================================
// SECTION 6 — ANNULATION & AVOIR
// ============================================================

export interface CalculAnnulation {
  remboursementTotal: boolean  // Rétractation = remboursement total
  montantDu: number           // Prorata si après rétractation
  montantRemboursable: number
  montantRetenu: number       // Frais de dossier / prorata
  avoir: boolean              // Faut-il émettre un avoir ?
  montantAvoir: number
  baseLegale: string
  conditions: string
}

// Gérer l'annulation d'un financement
export function calculerAnnulation(params: {
  montantFormation: number
  montantPaye: number
  joursSuivis: number    // jours de formation suivis
  joursTotaux: number    // durée totale formation
  delaiRetractation: boolean // dans les 10 jours ?
  typeClient: 'particulier' | 'entreprise' | 'financeur'
  modePaiement: 'personnel' | 'subrogation'
}): CalculAnnulation {
  const {
    montantFormation,
    montantPaye,
    joursSuivis,
    joursTotaux,
    delaiRetractation,
    typeClient,
    modePaiement,
  } = params

  let remboursementTotal = false
  let montantDu = 0
  let montantRemboursable = 0
  let montantRetenu = 0
  let avoir = false
  let montantAvoir = 0
  let baseLegale = ''
  let conditions = ''

  // Cas 1: Délai de rétractation (10 jours) + particulier + paiement personnel
  if (delaiRetractation && typeClient === 'particulier' && modePaiement === 'personnel') {
    remboursementTotal = true
    montantRemboursable = montantPaye
    baseLegale = 'Code de la consommation - Délai de rétractation'
    conditions = 'Remboursement total sous 14 jours'
  }
  // Cas 2: Avant le début de formation
  else if (joursSuivis === 0) {
    if (delaiRetractation) {
      // Gratuit si >14 jours avant
      montantRemboursable = montantPaye
      conditions = 'Annulation gratuite'
    } else {
      // Frais d'annulation selon CGV (ex: 10% ou forfait)
      const fraisAnnulation = Math.min(montantPaye * 0.1, 150) // 10% ou 150€ max
      montantRetenu = fraisAnnulation
      montantRemboursable = montantPaye - fraisAnnulation
      conditions = `Frais d'annulation: ${formatEuro(fraisAnnulation)}`
    }
    baseLegale = 'Conditions Générales de Vente'
  }
  // Cas 3: Formation en cours (prorata)
  else if (joursSuivis > 0 && joursSuivis < joursTotaux) {
    const pourcentageSuivi = joursSuivis / joursTotaux
    montantDu = montantFormation * pourcentageSuivi

    if (modePaiement === 'subrogation') {
      // En subrogation, l'OF reverse le prorata au financeur
      montantAvoir = montantFormation - montantDu
      avoir = true
      conditions = 'Avoir émis vers le financeur pour la partie non suivie'
    } else {
      // Paiement personnel: remboursement du prorata non suivi
      montantRemboursable = montantPaye - montantDu
      if (montantRemboursable < 0) montantRemboursable = 0
      conditions = `Prorata: ${joursSuivis}/${joursTotaux} jours suivis`
    }

    baseLegale = 'Prorata temporis selon jours de formation suivis'
  }
  // Cas 4: Formation terminée
  else {
    montantDu = montantFormation
    conditions = 'Formation terminée, aucun remboursement'
    baseLegale = 'Prestation entièrement réalisée'
  }

  return {
    remboursementTotal,
    montantDu,
    montantRemboursable,
    montantRetenu,
    avoir,
    montantAvoir,
    baseLegale,
    conditions,
  }
}

// Conditions d'annulation par moment
export const CONDITIONS_ANNULATION = {
  avant_10_jours: {
    applicable: 'Stagiaire particulier payant personnellement',
    remboursement: '100% (délai de rétractation légal)',
    base_legale: 'Code de la consommation',
  },
  avant_formation: {
    applicable: 'Toute annulation avant le début',
    conditions: 'Selon les CGV de la convention',
    frais_habituels: 'Souvent gratuit si > 14 jours avant, frais si < 14 jours',
  },
  pendant_formation: {
    applicable: 'Abandon en cours de formation',
    conditions: 'Prorata au temps suivi',
    impact_financeur: 'Le certificat de réalisation mentionne les heures réellement suivies. Le financeur ne paie que le prorata.',
  },
  apres_formation: {
    applicable: 'Pas d\'annulation possible après la formation',
    note: 'Seule une réclamation qualité peut être faite',
  },
}

// ============================================================
// SECTION 7 — LIENS AVEC LE CRM
// ============================================================

// Comment le financement impacte les autres entités
export const IMPACTS_CRM = {
  lead: {
    score_impact: {
      financement_valide: 15,
      financement_en_cours: 5,
      financement_refuse: -10,
    },
    transitions_auto: {
      accorde: 'INSCRIT', // Quand le financement est accordé, le lead passe en INSCRIT
      refuse_sans_plan_b: 'EN_ATTENTE', // Si refusé sans alternative
    },
  },
  inscription: {
    creation: 'L\'inscription est créée quand le financement passe à "accorde"',
    confirmation: 'L\'inscription est confirmée quand le financement passe à "inscription_confirmee"',
    annulation: 'Si le financement est annulé, l\'inscription est suspendue',
  },
  session: {
    affectation: 'Le stagiaire est affecté à la session via l\'inscription',
    emargement: 'L\'émargement de la session génère les données pour le certificat de réalisation',
    certificat: 'Le certificat est le document clé pour déclencher la facturation au financeur',
  },
  cadences: {
    relance_docs: 'Si document manquant > 7 jours → cadence de relance WhatsApp',
    relance_paiement: 'Si facture en retard → cadence email + appel',
    alerte_deadline: 'Si date limite dépôt < 14 jours → notification urgente',
  },
}

export interface FinancementSummary {
  etape: { nom: string; numero: number; total: number; pourcentage: number }
  montants: { demande: number; accorde: number; facture: number; paye: number; reste: number }
  documents: { total: number; recus: number; valides: number; manquants: number }
  paiements: { enAttente: number; payés: number; enRetard: number }
  alertes: Alerte[]
  prochaineAction: { action: string; description: string; urgence: 'haute' | 'moyenne' | 'basse' }
}

// Obtenir le résumé complet d'un financement pour le dashboard
export function getFinancementSummary(financement: any): FinancementSummary {
  const etapeMetadata = ETAPES_METADATA[financement.etape as EtapeWorkflow]

  // Calcul des montants
  const montants = {
    demande: financement.montant_demande || 0,
    accorde: financement.montant_accorde || 0,
    facture: financement.montant_facture || 0,
    paye: financement.montant_paye || 0,
    reste: (financement.montant_facture || 0) - (financement.montant_paye || 0),
  }

  // Analyse des documents
  const documentsRequis = DOCUMENTS_PAR_ETAPE[financement.etape as EtapeWorkflow] || []
  const documentsPresents = financement.documents ? Object.keys(financement.documents) : []
  const documents = {
    total: documentsRequis.length,
    recus: documentsPresents.length,
    valides: documentsPresents.filter(doc => financement.documents[doc]?.valide).length,
    manquants: documentsRequis.filter(req => !documentsPresents.includes(req.type)).length,
  }

  // Analyse des paiements
  const echeances = financement.echeances || []
  const paiements = {
    enAttente: echeances.filter((e: any) => e.statut === 'en_attente').length,
    payés: echeances.filter((e: any) => e.statut === 'paye').length,
    enRetard: echeances.filter((e: any) => {
      const maintenant = new Date()
      return e.statut === 'en_attente' && new Date(e.date_echeance) < maintenant
    }).length,
  }

  // Détecter les alertes
  const alertes = detecterAlertes(financement)

  // Déterminer la prochaine action
  let prochaineAction: { action: string; description: string; urgence: 'basse' | 'moyenne' | 'haute' } = {
    action: 'Aucune action',
    description: 'Dossier en attente',
    urgence: 'basse',
  }

  switch (financement.etape) {
    case 'qualification':
      prochaineAction = {
        action: 'Collecter les documents',
        description: 'Envoyer la checklist au stagiaire',
        urgence: 'moyenne',
      }
      break
    case 'collecte_docs':
      if (documents.manquants > 0) {
        prochaineAction = {
          action: 'Relancer pour documents manquants',
          description: `${documents.manquants} document(s) manquant(s)`,
          urgence: 'haute',
        }
      } else {
        prochaineAction = {
          action: 'Finaliser le dossier',
          description: 'Préparer la convention et déposer',
          urgence: 'haute',
        }
      }
      break
    case 'dossier_complet':
      prochaineAction = {
        action: 'Déposer le dossier',
        description: 'Transmettre au financeur',
        urgence: 'haute',
      }
      break
    case 'facture_envoyee':
      if (montants.reste > 0) {
        prochaineAction = {
          action: 'Suivre le paiement',
          description: `${formatEuro(montants.reste)} en attente`,
          urgence: 'moyenne',
        }
      }
      break
    default:
      // Utiliser l'alerte la plus urgente s'il y en a
      if (alertes.length > 0) {
        const alerteUrgente = alertes.sort((a, b) => {
          const urgenceOrder = { critique: 4, haute: 3, moyenne: 2, basse: 1 }
          return urgenceOrder[b.urgence] - urgenceOrder[a.urgence]
        })[0]

        prochaineAction = {
          action: alerteUrgente.actions?.[0] || 'Action requise',
          description: alerteUrgente.message,
          urgence: alerteUrgente.urgence === 'critique' ? 'haute' : alerteUrgente.urgence,
        }
      }
  }

  return {
    etape: {
      nom: etapeMetadata?.nom || financement.etape,
      numero: etapeMetadata?.numero || 0,
      total: etapeMetadata?.total || 14,
      pourcentage: etapeMetadata?.pourcentage || 0,
    },
    montants,
    documents,
    paiements,
    alertes,
    prochaineAction,
  }
}

// ============================================================
// SECTION 8 — UTILITAIRES
// ============================================================

// Valider une transition d'étape
export function validateWorkflowTransition(from: EtapeWorkflow, to: EtapeWorkflow): boolean {
  if (from === to) return true
  const validTransitions = WORKFLOW_TRANSITIONS[from]
  return validTransitions?.includes(to) ?? false
}

// Obtenir les prochaines étapes possibles
export function getNextSteps(currentStep: EtapeWorkflow): EtapeWorkflow[] {
  return WORKFLOW_TRANSITIONS[currentStep] || []
}

// Obtenir les documents manquants pour avancer à l'étape suivante
export function getDocumentsManquants(currentStep: EtapeWorkflow, documentsPresents: string[]): DocumentRequis[] {
  const documentsRequis = DOCUMENTS_PAR_ETAPE[currentStep] || []
  return documentsRequis.filter(doc =>
    doc.obligatoire && !documentsPresents.includes(doc.type)
  )
}

// Estimer le délai restant jusqu'à la clôture
export function estimerDelaiRestant(currentStep: EtapeWorkflow, organismeId: string): string {
  const etapeMetadata = ETAPES_METADATA[currentStep]
  if (!etapeMetadata) return 'Délai indéterminé'

  // Étapes restantes jusqu'à clôture
  const etapesRestantes = 14 - etapeMetadata.numero

  // Délai moyen par étape selon l'organisme
  let delaiMoyenParEtape = 3 // jours par défaut

  switch (organismeId) {
    case 'opco-ep':
      delaiMoyenParEtape = 2 // OPCO EP rapide
      break
    case 'fafcea':
      delaiMoyenParEtape = 4 // FAFCEA plus lent
      break
    case 'cpf':
      delaiMoyenParEtape = 1 // CPF très rapide
      break
    case 'france-travail-aif':
      delaiMoyenParEtape = 5 // AIF complexe
      break
  }

  const joursRestants = etapesRestantes * delaiMoyenParEtape

  if (joursRestants <= 7) {
    return `${joursRestants} jour(s)`
  } else if (joursRestants <= 30) {
    return `${Math.ceil(joursRestants / 7)} semaine(s)`
  } else {
    return `${Math.ceil(joursRestants / 30)} mois`
  }
}

// Formater un montant en euros
export function formatEuro(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(montant)
}

// Calculer le pourcentage d'avancement dans le pipeline
export function calculerAvancement(etape: EtapeWorkflow): number {
  const metadata = ETAPES_METADATA[etape]
  return metadata?.pourcentage || 0
}

// Obtenir la couleur d'une étape
export function getCouleurEtape(etape: EtapeWorkflow): string {
  return ETAPES_METADATA[etape]?.couleur || '#6B7280'
}

// Obtenir l'icône d'une étape
export function getIconeEtape(etape: EtapeWorkflow): string {
  return ETAPES_METADATA[etape]?.icone || '📄'
}

// Vérifier si une étape est terminale
export function isEtapeTerminale(etape: EtapeWorkflow): boolean {
  return ['cloture', 'refuse', 'annule'].includes(etape)
}

// Obtenir le libellé d'urgence d'une alerte
export function getLibelleUrgence(urgence: Alerte['urgence']): string {
  switch (urgence) {
    case 'critique':
      return 'URGENT'
    case 'haute':
      return 'Important'
    case 'moyenne':
      return 'Modéré'
    case 'basse':
      return 'Faible'
    default:
      return 'Normal'
  }
}

// Calculer le score de santé d'un financement (0-100)
export function calculerScoreSante(financement: any): {
  score: number
  niveau: 'excellent' | 'bon' | 'moyen' | 'faible' | 'critique'
  facteurs: string[]
} {
  let score = 100
  const facteurs: string[] = []

  // Pénalités selon l'étape et les délais
  const etapeMetadata = ETAPES_METADATA[financement.etape as EtapeWorkflow]
  if (etapeMetadata && financement.updated_at) {
    const joursDepuisMAJ = Math.floor(
      (new Date().getTime() - new Date(financement.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (joursDepuisMAJ > etapeMetadata.delai_max && etapeMetadata.delai_max > 0) {
      const penalite = Math.min(30, (joursDepuisMAJ - etapeMetadata.delai_max) * 2)
      score -= penalite
      facteurs.push(`Délai dépassé de ${joursDepuisMAJ - etapeMetadata.delai_max} jour(s)`)
    }
  }

  // Documents manquants
  const summary = getFinancementSummary(financement)
  if (summary.documents.manquants > 0) {
    score -= summary.documents.manquants * 10
    facteurs.push(`${summary.documents.manquants} document(s) manquant(s)`)
  }

  // Paiements en retard
  if (summary.paiements.enRetard > 0) {
    score -= summary.paiements.enRetard * 15
    facteurs.push(`${summary.paiements.enRetard} paiement(s) en retard`)
  }

  // Alertes critiques
  const alertesCritiques = summary.alertes.filter(a => a.urgence === 'critique')
  score -= alertesCritiques.length * 20
  if (alertesCritiques.length > 0) {
    facteurs.push(`${alertesCritiques.length} alerte(s) critique(s)`)
  }

  // Bonus si tout va bien
  if (financement.etape === 'cloture') {
    score = 100
    facteurs.push('Dossier clôturé avec succès')
  }

  score = Math.max(0, Math.min(100, score))

  let niveau: 'excellent' | 'bon' | 'moyen' | 'faible' | 'critique'
  if (score >= 90) niveau = 'excellent'
  else if (score >= 70) niveau = 'bon'
  else if (score >= 50) niveau = 'moyen'
  else if (score >= 30) niveau = 'faible'
  else niveau = 'critique'

  return { score, niveau, facteurs }
}