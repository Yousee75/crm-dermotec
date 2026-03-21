// ============================================================
// Tests — State Machines exhaustifs
// Verifie TOUTES les transitions valides et invalides
// des 4 state machines du CRM.
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  validateLeadTransition,
  validateFinancementTransition,
  validateSessionTransition,
  validateInscriptionTransition,
} from '@/lib/validators'
import type { StatutLead, StatutFinancement, StatutSession, StatutInscription } from '@/types'

// --- Lead State Machine ---

describe('Lead State Machine (exhaustif)', () => {
  const validTransitions: [StatutLead, StatutLead][] = [
    ['NOUVEAU', 'CONTACTE'],
    ['NOUVEAU', 'QUALIFIE'],
    ['NOUVEAU', 'PERDU'],
    ['NOUVEAU', 'SPAM'],
    ['CONTACTE', 'QUALIFIE'],
    ['CONTACTE', 'FINANCEMENT_EN_COURS'],
    ['CONTACTE', 'PERDU'],
    ['CONTACTE', 'REPORTE'],
    ['CONTACTE', 'SPAM'],
    ['QUALIFIE', 'FINANCEMENT_EN_COURS'],
    ['QUALIFIE', 'INSCRIT'],
    ['QUALIFIE', 'PERDU'],
    ['QUALIFIE', 'REPORTE'],
    ['FINANCEMENT_EN_COURS', 'INSCRIT'],
    ['FINANCEMENT_EN_COURS', 'PERDU'],
    ['FINANCEMENT_EN_COURS', 'REPORTE'],
    ['FINANCEMENT_EN_COURS', 'QUALIFIE'],
    ['INSCRIT', 'EN_FORMATION'],
    ['INSCRIT', 'PERDU'],
    ['INSCRIT', 'REPORTE'],
    ['EN_FORMATION', 'FORME'],
    ['EN_FORMATION', 'PERDU'],
    ['FORME', 'ALUMNI'],
    ['FORME', 'PERDU'],
    ['ALUMNI', 'QUALIFIE'],
    ['PERDU', 'NOUVEAU'],
    ['PERDU', 'CONTACTE'],
    ['REPORTE', 'CONTACTE'],
    ['REPORTE', 'QUALIFIE'],
    ['REPORTE', 'PERDU'],
  ]

  it.each(validTransitions)('accepte %s → %s', (from, to) => {
    expect(validateLeadTransition(from, to)).toBeNull()
  })

  const invalidTransitions: [StatutLead, StatutLead][] = [
    ['NOUVEAU', 'INSCRIT'],
    ['NOUVEAU', 'EN_FORMATION'],
    ['NOUVEAU', 'ALUMNI'],
    ['SPAM', 'NOUVEAU'],
    ['SPAM', 'CONTACTE'],
    ['EN_FORMATION', 'NOUVEAU'],
    ['ALUMNI', 'NOUVEAU'],
    ['FORME', 'CONTACTE'],
  ]

  it.each(invalidTransitions)('refuse %s → %s', (from, to) => {
    expect(validateLeadTransition(from, to)).toContain('Transition invalide')
  })

  it('meme statut = pas d erreur', () => {
    expect(validateLeadTransition('NOUVEAU', 'NOUVEAU')).toBeNull()
    expect(validateLeadTransition('QUALIFIE', 'QUALIFIE')).toBeNull()
  })
})

// --- Financement State Machine ---

describe('Financement State Machine (exhaustif)', () => {
  const validTransitions: [StatutFinancement, StatutFinancement][] = [
    ['PREPARATION', 'DOCUMENTS_REQUIS'],
    ['PREPARATION', 'DOSSIER_COMPLET'],
    ['DOCUMENTS_REQUIS', 'DOSSIER_COMPLET'],
    ['DOCUMENTS_REQUIS', 'PREPARATION'],
    ['DOSSIER_COMPLET', 'SOUMIS'],
    ['SOUMIS', 'EN_EXAMEN'],
    ['SOUMIS', 'VALIDE'],
    ['SOUMIS', 'REFUSE'],
    ['EN_EXAMEN', 'COMPLEMENT_DEMANDE'],
    ['EN_EXAMEN', 'VALIDE'],
    ['EN_EXAMEN', 'REFUSE'],
    ['COMPLEMENT_DEMANDE', 'EN_EXAMEN'],
    ['COMPLEMENT_DEMANDE', 'DOSSIER_COMPLET'],
    ['COMPLEMENT_DEMANDE', 'REFUSE'],
    ['VALIDE', 'VERSE'],
    ['VALIDE', 'CLOTURE'],
    ['REFUSE', 'PREPARATION'],
    ['REFUSE', 'CLOTURE'],
    ['VERSE', 'CLOTURE'],
  ]

  it.each(validTransitions)('accepte %s → %s', (from, to) => {
    expect(validateFinancementTransition(from, to)).toBeNull()
  })

  it('CLOTURE est terminal', () => {
    expect(validateFinancementTransition('CLOTURE', 'PREPARATION')).toContain('Transition invalide')
  })

  it('PREPARATION ne va pas directement a VALIDE', () => {
    expect(validateFinancementTransition('PREPARATION', 'VALIDE')).toContain('Transition invalide')
  })
})

// --- Session State Machine ---

describe('Session State Machine (exhaustif)', () => {
  const validTransitions: [StatutSession, StatutSession][] = [
    ['BROUILLON', 'PLANIFIEE'],
    ['BROUILLON', 'ANNULEE'],
    ['PLANIFIEE', 'CONFIRMEE'],
    ['PLANIFIEE', 'ANNULEE'],
    ['PLANIFIEE', 'REPORTEE'],
    ['CONFIRMEE', 'EN_COURS'],
    ['CONFIRMEE', 'ANNULEE'],
    ['CONFIRMEE', 'REPORTEE'],
    ['EN_COURS', 'TERMINEE'],
    ['EN_COURS', 'ANNULEE'],
    ['ANNULEE', 'BROUILLON'],
    ['REPORTEE', 'PLANIFIEE'],
    ['REPORTEE', 'ANNULEE'],
  ]

  it.each(validTransitions)('accepte %s → %s', (from, to) => {
    expect(validateSessionTransition(from, to)).toBeNull()
  })

  it('TERMINEE est terminal', () => {
    expect(validateSessionTransition('TERMINEE', 'EN_COURS')).toContain('Transition invalide')
  })
})

// --- Inscription State Machine ---

describe('Inscription State Machine (exhaustif)', () => {
  const validTransitions: [StatutInscription, StatutInscription][] = [
    ['EN_ATTENTE', 'CONFIRMEE'],
    ['EN_ATTENTE', 'ANNULEE'],
    ['CONFIRMEE', 'EN_COURS'],
    ['CONFIRMEE', 'ANNULEE'],
    ['EN_COURS', 'COMPLETEE'],
    ['EN_COURS', 'ANNULEE'],
    ['EN_COURS', 'NO_SHOW'],
    ['COMPLETEE', 'REMBOURSEE'],
    ['ANNULEE', 'EN_ATTENTE'],
    ['NO_SHOW', 'ANNULEE'],
  ]

  it.each(validTransitions)('accepte %s → %s', (from, to) => {
    expect(validateInscriptionTransition(from, to)).toBeNull()
  })

  it('REMBOURSEE est terminal', () => {
    expect(validateInscriptionTransition('REMBOURSEE', 'EN_ATTENTE')).toContain('Transition invalide')
  })

  it('NO_SHOW ne peut pas passer a COMPLETEE', () => {
    expect(validateInscriptionTransition('NO_SHOW', 'COMPLETEE')).toContain('Transition invalide')
  })
})
