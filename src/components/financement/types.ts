export interface FinancementWorkflowProps {
  financementId: string
  onClose?: () => void
}

// Les 14 étapes du workflow financement
export const WORKFLOW_STEPS = [
  { id: 'QUALIFICATION', label: 'Qualification', description: 'Évaluation du besoin et de la demande' },
  { id: 'COLLECTE_DOCS', label: 'Collecte docs', description: 'Rassemblement des documents requis' },
  { id: 'DOSSIER_COMPLET', label: 'Dossier complet', description: 'Validation complétude du dossier' },
  { id: 'DEPOSE', label: 'Déposé', description: 'Soumission officielle au financeur' },
  { id: 'EN_INSTRUCTION', label: 'En instruction', description: 'Examen par le financeur' },
  { id: 'COMPLEMENT_DEMANDE', label: 'Complément demandé', description: 'Informations supplémentaires requises' },
  { id: 'ACCORDE', label: 'Accordé (APC reçu)', description: 'Accord de prise en charge obtenu' },
  { id: 'INSCRIPTION_CONFIRMEE', label: 'Inscription confirmée', description: 'Place réservée en formation' },
  { id: 'EN_FORMATION', label: 'En formation', description: 'Stagiaire en cours de formation' },
  { id: 'FACTURE_ENVOYEE', label: 'Facture envoyée', description: 'Facturation émise au financeur' },
  { id: 'PAIEMENT_RECU', label: 'Paiement reçu', description: 'Encaissement effectué' },
  { id: 'CLOTURE', label: 'Clôturé', description: 'Dossier définitivement terminé' },
  { id: 'REFUSE', label: 'Refusé', description: 'Demande de financement rejetée' },
  { id: 'ANNULE', label: 'Annulé', description: 'Dossier annulé par le demandeur' }
] as const

export function getCurrentStepIndex(statut: string): number {
  const mapping: Record<string, number> = {
    PREPARATION: 0,
    DOCUMENTS_REQUIS: 1,
    DOSSIER_COMPLET: 2,
    SOUMIS: 3,
    EN_EXAMEN: 4,
    COMPLEMENT_DEMANDE: 5,
    VALIDE: 6,
    // Mapping des autres statuts vers les nouvelles étapes
    VERSE: 11,
    REFUSE: 12,
    CLOTURE: 11
  }
  return mapping[statut] || 0
}

export function getNextAction(currentStep: number): string {
  const actions = [
    'Qualifier le besoin de financement',
    'Collecter les documents requis',
    'Valider la complétude du dossier',
    'Déposer le dossier au financeur',
    'Suivre l\'instruction du dossier',
    'Fournir les compléments demandés',
    'Confirmer l\'inscription en formation',
    'Valider la place en session',
    'Suivre la formation du stagiaire',
    'Envoyer la facture au financeur',
    'Confirmer la réception du paiement',
    'Archiver le dossier',
    'Traiter le refus',
    'Finaliser l\'annulation'
  ]
  return actions[currentStep] || 'Action à définir'
}