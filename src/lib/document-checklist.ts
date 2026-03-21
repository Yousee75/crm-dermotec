// ============================================================
// CRM DERMOTEC — Gestion des prérequis et workflows documents
// ============================================================

import type { TypeDocument, OrganismeFinancement, StatutLead, Document, Lead, Inscription } from '@/types'

// Documents requis par organisme de financement
export const REQUIRED_DOCUMENTS_BY_ORGANISME: Record<OrganismeFinancement, TypeDocument[]> = {
  OPCO_EP: ['piece_identite', 'justificatif_domicile', 'convention', 'devis', 'programme'],
  AKTO: ['piece_identite', 'justificatif_domicile', 'convention', 'devis', 'programme'],
  FAFCEA: ['piece_identite', 'attestation_employeur', 'convention', 'devis', 'programme'],
  FIFPL: ['piece_identite', 'justificatif_domicile', 'convention', 'devis', 'programme'],
  FRANCE_TRAVAIL: ['piece_identite', 'attestation_pole_emploi', 'convention', 'devis', 'programme'],
  CPF: ['piece_identite'],
  AGEFIPH: ['piece_identite', 'convention', 'devis', 'programme', 'autre'], // RQTH dans 'autre'
  MISSIONS_LOCALES: ['piece_identite', 'convention', 'programme'],
  REGION: ['piece_identite', 'justificatif_domicile', 'convention', 'devis', 'programme'],
  EMPLOYEUR: ['convention', 'autre'], // accord_employeur dans 'autre'
  TRANSITIONS_PRO: ['piece_identite', 'convention', 'devis', 'programme', 'autre'], // bulletins_paie_12m, bilan_positionnement, cv, lettre_motivation dans 'autre'
  AUTRE: []
}

// Labels français pour les types de documents
export const DOCUMENT_LABELS: Record<TypeDocument, string> = {
  piece_identite: 'Pièce d\'identité (CNI, passeport)',
  justificatif_domicile: 'Justificatif de domicile (-3 mois)',
  kbis: 'Extrait Kbis (-3 mois)',
  attestation_employeur: 'Attestation employeur / Bulletins de paie',
  attestation_pole_emploi: 'Attestation Pôle Emploi',
  convention: 'Convention de formation signée',
  devis: 'Devis détaillé de formation',
  facture: 'Facture',
  avoir: 'Avoir / Note de crédit',
  certificat: 'Certificat de formation',
  attestation: 'Attestation de présence',
  programme: 'Programme détaillé de formation',
  emargement: 'Feuille d\'émargement',
  consentement: 'Formulaire de consentement',
  photo_avant: 'Photo avant prestation',
  photo_apres: 'Photo après prestation',
  autre: 'Autre document (RQTH, CV, etc.)'
}

// Documents spécifiques requis par organisme avec détails
export const DOCUMENTS_SPECIFIQUES: Record<OrganismeFinancement, Array<{ type: TypeDocument; label: string; description: string; obligatoire: boolean }>> = {
  OPCO_EP: [
    { type: 'piece_identite', label: 'Pièce d\'identité', description: 'CNI recto-verso ou passeport', obligatoire: true },
    { type: 'justificatif_domicile', label: 'Justificatif domicile', description: 'Facture (-3 mois)', obligatoire: true },
    { type: 'autre', label: 'Bulletins de paie', description: '3 derniers bulletins de paie', obligatoire: true },
    { type: 'convention', label: 'Convention formation', description: 'Signée par toutes les parties', obligatoire: true },
    { type: 'devis', label: 'Devis détaillé', description: 'Avec tarifs et durée', obligatoire: true },
    { type: 'programme', label: 'Programme formation', description: 'Objectifs et contenu détaillé', obligatoire: true },
    { type: 'autre', label: 'Formulaire OPCO', description: 'Demande de prise en charge', obligatoire: true }
  ],
  AKTO: [
    { type: 'piece_identite', label: 'Pièce d\'identité', description: 'CNI recto-verso ou passeport', obligatoire: true },
    { type: 'justificatif_domicile', label: 'Justificatif domicile', description: 'Facture (-3 mois)', obligatoire: true },
    { type: 'autre', label: 'Bulletins de paie', description: '3 derniers bulletins de paie', obligatoire: true },
    { type: 'convention', label: 'Convention formation', description: 'Signée par toutes les parties', obligatoire: true },
    { type: 'devis', label: 'Devis détaillé', description: 'Avec tarifs et durée', obligatoire: true },
    { type: 'programme', label: 'Programme formation', description: 'Objectifs et contenu détaillé', obligatoire: true },
    { type: 'autre', label: 'Formulaire AKTO', description: 'Demande de prise en charge', obligatoire: true }
  ],
  FAFCEA: [
    { type: 'piece_identite', label: 'Pièce d\'identité', description: 'CNI recto-verso', obligatoire: true },
    { type: 'autre', label: 'Attestation URSSAF', description: 'Attestation à jour (-3 mois)', obligatoire: true },
    { type: 'convention', label: 'Convention formation', description: 'Signée', obligatoire: true },
    { type: 'devis', label: 'Devis formation', description: 'Détaillé avec durée', obligatoire: true },
    { type: 'programme', label: 'Programme détaillé', description: 'Objectifs pédagogiques', obligatoire: true }
  ],
  FIFPL: [
    { type: 'piece_identite', label: 'Pièce d\'identité', description: 'CNI recto-verso', obligatoire: true },
    { type: 'autre', label: 'Attestation URSSAF', description: 'Attestation à jour (-3 mois)', obligatoire: true },
    { type: 'autre', label: 'Relevé SNIR', description: 'Ou avis d\'imposition', obligatoire: true },
    { type: 'convention', label: 'Convention formation', description: 'Signée', obligatoire: true },
    { type: 'programme', label: 'Programme formation', description: 'Détaillé', obligatoire: true }
  ],
  FRANCE_TRAVAIL: [
    { type: 'piece_identite', label: 'Pièce d\'identité', description: 'CNI recto-verso', obligatoire: true },
    { type: 'attestation_pole_emploi', label: 'Attestation inscription', description: 'Pôle Emploi', obligatoire: true },
    { type: 'convention', label: 'Convention formation', description: 'Signée', obligatoire: true },
    { type: 'devis', label: 'Devis formation', description: 'Détaillé', obligatoire: true },
    { type: 'programme', label: 'Programme formation', description: 'Objectifs détaillés', obligatoire: true },
    { type: 'autre', label: 'Lettre motivation', description: 'Projet professionnel', obligatoire: true }
  ],
  CPF: [
    { type: 'piece_identite', label: 'Pièce d\'identité', description: 'CNI recto-verso ou passeport', obligatoire: true }
  ],
  AGEFIPH: [
    { type: 'piece_identite', label: 'Pièce d\'identité', description: 'CNI recto-verso', obligatoire: true },
    { type: 'autre', label: 'RQTH', description: 'Reconnaissance Qualité Travailleur Handicapé', obligatoire: true },
    { type: 'convention', label: 'Convention formation', description: 'Signée', obligatoire: true },
    { type: 'devis', label: 'Devis formation', description: 'Détaillé', obligatoire: true },
    { type: 'programme', label: 'Programme formation', description: 'Adapté si besoin', obligatoire: true },
    { type: 'autre', label: 'CV', description: 'CV actualisé', obligatoire: false }
  ],
  MISSIONS_LOCALES: [
    { type: 'piece_identite', label: 'Pièce d\'identité', description: 'CNI recto-verso', obligatoire: true },
    { type: 'autre', label: 'Attestation Mission Locale', description: 'Accompagnement en cours', obligatoire: true },
    { type: 'convention', label: 'Convention formation', description: 'Signée', obligatoire: true },
    { type: 'programme', label: 'Programme formation', description: 'Détaillé', obligatoire: true }
  ],
  REGION: [
    { type: 'piece_identite', label: 'Pièce d\'identité', description: 'CNI recto-verso', obligatoire: true },
    { type: 'justificatif_domicile', label: 'Justificatif domicile', description: 'Facture (-3 mois)', obligatoire: true },
    { type: 'convention', label: 'Convention formation', description: 'Signée', obligatoire: true },
    { type: 'devis', label: 'Devis formation', description: 'Détaillé', obligatoire: true },
    { type: 'programme', label: 'Programme formation', description: 'Objectifs détaillés', obligatoire: true }
  ],
  EMPLOYEUR: [
    { type: 'convention', label: 'Convention formation', description: 'Signée employeur/OF/salarié', obligatoire: true },
    { type: 'autre', label: 'Accord employeur', description: 'Plan de développement des compétences', obligatoire: true }
  ],
  TRANSITIONS_PRO: [
    { type: 'piece_identite', label: 'Pièce d\'identité', description: 'CNI recto-verso', obligatoire: true },
    { type: 'autre', label: 'Bulletins paie 12 mois', description: '12 derniers bulletins', obligatoire: true },
    { type: 'autre', label: 'Bilan positionnement', description: 'Compétences acquises', obligatoire: true },
    { type: 'convention', label: 'Convention formation', description: 'Signée', obligatoire: true },
    { type: 'programme', label: 'Programme formation', description: 'Détaillé', obligatoire: true },
    { type: 'autre', label: 'CV', description: 'CV actualisé', obligatoire: true },
    { type: 'autre', label: 'Lettre motivation', description: 'Projet de reconversion', obligatoire: true }
  ],
  AUTRE: []
}

// Prérequis par transition de statut lead
export const REQUIRED_CONDITIONS_BY_TRANSITION: Record<string, {
  documents?: TypeDocument[]
  payment_required?: boolean
  minimum_payment_percentage?: number
  presence_required?: boolean
  evaluation_required?: boolean
  other_conditions?: string[]
}> = {
  'NOUVEAU_TO_CONTACTE': {
    other_conditions: ['Premier contact effectué']
  },
  'CONTACTE_TO_QUALIFIE': {
    other_conditions: ['Besoins qualifiés', 'Formation identifiée', 'Budget confirmé']
  },
  'QUALIFIE_TO_FINANCEMENT_EN_COURS': {
    documents: ['piece_identite'],
    other_conditions: ['Dossier financement initié']
  },
  'QUALIFIE_TO_INSCRIT': {
    documents: ['convention', 'piece_identite'],
    payment_required: true,
    minimum_payment_percentage: 30,
    other_conditions: ['Convention signée']
  },
  'FINANCEMENT_EN_COURS_TO_INSCRIT': {
    documents: ['convention'],
    other_conditions: ['Financement validé', 'Convention signée']
  },
  'INSCRIT_TO_EN_FORMATION': {
    documents: ['convention', 'programme', 'emargement'],
    other_conditions: ['Session démarrée', 'Présence J1 confirmée']
  },
  'EN_FORMATION_TO_FORME': {
    presence_required: true,
    evaluation_required: true,
    documents: ['certificat'],
    other_conditions: ['Présence minimale 75%', 'Évaluation satisfaisante']
  },
  'FORME_TO_ALUMNI': {
    other_conditions: ['Suivi post-formation J+30 effectué']
  }
}

/**
 * Récupère la checklist des documents pour un organisme donné
 */
export function getChecklistForOrganisme(organisme: OrganismeFinancement) {
  return DOCUMENTS_SPECIFIQUES[organisme] || []
}

/**
 * Identifie les documents manquants pour un lead et un organisme
 */
export function getMissingDocuments(
  leadId: string,
  organisme: OrganismeFinancement,
  existingDocs: Document[]
): Array<{ type: TypeDocument; label: string; description: string; obligatoire: boolean }> {
  const requiredDocs = DOCUMENTS_SPECIFIQUES[organisme] || []
  const existingTypes = new Set(existingDocs.map(doc => doc.type))

  return requiredDocs.filter(doc =>
    doc.obligatoire && !existingTypes.has(doc.type)
  )
}

/**
 * Calcule le progrès des documents pour un organisme
 */
export function getDocumentProgress(
  leadId: string,
  organisme: OrganismeFinancement,
  existingDocs: Document[]
): {
  total: number
  completed: number
  percentage: number
  missing: Array<{ type: TypeDocument; label: string; description: string }>
} {
  const requiredDocs = DOCUMENTS_SPECIFIQUES[organisme] || []
  const obligatoryDocs = requiredDocs.filter(doc => doc.obligatoire)
  const existingTypes = new Set(existingDocs.map(doc => doc.type))

  const completed = obligatoryDocs.filter(doc => existingTypes.has(doc.type)).length
  const missing = obligatoryDocs.filter(doc => !existingTypes.has(doc.type))

  return {
    total: obligatoryDocs.length,
    completed,
    percentage: obligatoryDocs.length > 0 ? Math.round((completed / obligatoryDocs.length) * 100) : 100,
    missing: missing.map(({ type, label, description }) => ({ type, label, description }))
  }
}

/**
 * Vérifie si une transition de statut est possible
 */
export function canTransitionStatus(
  lead: Lead,
  fromStatus: StatutLead,
  toStatus: StatutLead,
  documents: Document[],
  inscriptions: Inscription[]
): {
  allowed: boolean
  blockers: string[]
} {
  const transitionKey = `${fromStatus}_TO_${toStatus}`
  const requirements = REQUIRED_CONDITIONS_BY_TRANSITION[transitionKey]

  if (!requirements) {
    return { allowed: true, blockers: [] }
  }

  const blockers: string[] = []
  const docTypes = new Set(documents.map(d => d.type))

  // Vérifier les documents requis
  if (requirements.documents) {
    const missingDocs = requirements.documents.filter(docType => !docTypes.has(docType))
    if (missingDocs.length > 0) {
      blockers.push(`Documents manquants: ${missingDocs.map(type => DOCUMENT_LABELS[type]).join(', ')}`)
    }
  }

  // Vérifier le paiement
  if (requirements.payment_required) {
    const inscription = inscriptions.find(i => i.lead_id === lead.id)
    if (!inscription) {
      blockers.push('Aucune inscription trouvée')
    } else {
      const paidPercentage = inscription.montant_total > 0
        ? ((inscription.montant_total - (inscription.reste_a_charge || 0)) / inscription.montant_total) * 100
        : 0

      const minPercentage = requirements.minimum_payment_percentage || 100

      if (paidPercentage < minPercentage) {
        blockers.push(`Paiement insuffisant: ${Math.round(paidPercentage)}% payé (minimum: ${minPercentage}%)`)
      }
    }
  }

  // Vérifier la présence
  if (requirements.presence_required) {
    const inscription = inscriptions.find(i => i.lead_id === lead.id)
    if (!inscription || !inscription.taux_presence || inscription.taux_presence < 75) {
      blockers.push('Présence insuffisante (minimum: 75%)')
    }
  }

  // Vérifier l'évaluation
  if (requirements.evaluation_required) {
    const inscription = inscriptions.find(i => i.lead_id === lead.id)
    if (!inscription || !inscription.note_satisfaction || inscription.note_satisfaction < 3) {
      blockers.push('Évaluation manquante ou insuffisante')
    }
  }

  return {
    allowed: blockers.length === 0,
    blockers
  }
}

/**
 * Suggestions d'actions suivantes basées sur l'état actuel
 */
export function getNextActions(
  lead: Lead,
  currentDocuments: Document[],
  financements?: Array<{ organisme: OrganismeFinancement; statut: string }>
): string[] {
  const actions: string[] = []

  // Actions basées sur le statut du lead
  switch (lead.statut) {
    case 'NOUVEAU':
      actions.push('Effectuer le premier contact')
      actions.push('Qualifier les besoins de formation')
      break

    case 'CONTACTE':
      actions.push('Identifier la formation souhaitée')
      actions.push('Confirmer le budget et mode de financement')
      if (!currentDocuments.some(d => d.type === 'piece_identite')) {
        actions.push('Demander une pièce d\'identité')
      }
      break

    case 'QUALIFIE':
      if (lead.financement_souhaite) {
        actions.push('Initier le dossier de financement')
        if (lead.organisme_financement) {
          const organisme = lead.organisme_financement as OrganismeFinancement
          const missing = getMissingDocuments(lead.id, organisme, currentDocuments)
          if (missing.length > 0) {
            actions.push(`Documents manquants pour ${organisme}: ${missing.map(d => d.label).join(', ')}`)
          } else {
            actions.push('Dossier de financement complet - peut être soumis')
          }
        }
      } else {
        actions.push('Préparer la convention de formation')
        actions.push('Demander l\'acompte (30% minimum)')
      }
      break

    case 'FINANCEMENT_EN_COURS':
      if (financements) {
        const financementActif = financements.find(f => f.statut !== 'REFUSE' && f.statut !== 'CLOTURE')
        if (financementActif) {
          switch (financementActif.statut) {
            case 'PREPARATION':
            case 'DOCUMENTS_REQUIS':
              actions.push('Compléter le dossier de financement')
              break
            case 'SOUMIS':
            case 'EN_EXAMEN':
              actions.push('Attendre la réponse de l\'organisme financeur')
              break
            case 'VALIDE':
              actions.push('Financement validé - procéder à l\'inscription')
              break
          }
        }
      }
      break

    case 'INSCRIT':
      if (!currentDocuments.some(d => d.type === 'convention')) {
        actions.push('Générer et faire signer la convention')
      }
      if (!currentDocuments.some(d => d.type === 'programme')) {
        actions.push('Envoyer le programme détaillé de formation')
      }
      actions.push('Envoyer la convocation de formation')
      break

    case 'EN_FORMATION':
      actions.push('Suivre la présence quotidienne')
      if (!currentDocuments.some(d => d.type === 'emargement')) {
        actions.push('Faire signer les émargements')
      }
      break

    case 'FORME':
      if (!currentDocuments.some(d => d.type === 'certificat')) {
        actions.push('Générer le certificat de formation')
      }
      actions.push('Envoyer l\'enquête de satisfaction')
      actions.push('Planifier le suivi post-formation J+30')
      break

    case 'ALUMNI':
      actions.push('Proposer des formations complémentaires')
      actions.push('Inviter à laisser un avis Google')
      break

    case 'PERDU':
    case 'REPORTE':
      actions.push('Planifier une relance à moyen terme')
      break
  }

  return actions
}