import { describe, it, expect } from 'vitest'
import {
  validateLeadTransition,
  validateFinancementTransition,
  validateSessionTransition,
  validateInscriptionTransition,
} from '@/lib/validators'

// ============================================================
// Lead State Machine — EXHAUSTIF
// ============================================================

describe('Lead State Machine', () => {
  // Transitions valides
  it('NOUVEAU → CONTACTE', () => expect(validateLeadTransition('NOUVEAU', 'CONTACTE')).toBeNull())
  it('NOUVEAU → QUALIFIE', () => expect(validateLeadTransition('NOUVEAU', 'QUALIFIE')).toBeNull())
  it('NOUVEAU → PERDU', () => expect(validateLeadTransition('NOUVEAU', 'PERDU')).toBeNull())
  it('NOUVEAU → SPAM', () => expect(validateLeadTransition('NOUVEAU', 'SPAM')).toBeNull())
  it('CONTACTE → QUALIFIE', () => expect(validateLeadTransition('CONTACTE', 'QUALIFIE')).toBeNull())
  it('CONTACTE → FINANCEMENT_EN_COURS', () => expect(validateLeadTransition('CONTACTE', 'FINANCEMENT_EN_COURS')).toBeNull())
  it('QUALIFIE → INSCRIT', () => expect(validateLeadTransition('QUALIFIE', 'INSCRIT')).toBeNull())
  it('INSCRIT → EN_FORMATION', () => expect(validateLeadTransition('INSCRIT', 'EN_FORMATION')).toBeNull())
  it('EN_FORMATION → FORME', () => expect(validateLeadTransition('EN_FORMATION', 'FORME')).toBeNull())
  it('FORME → ALUMNI', () => expect(validateLeadTransition('FORME', 'ALUMNI')).toBeNull())
  it('ALUMNI → QUALIFIE (re-inscription)', () => expect(validateLeadTransition('ALUMNI', 'QUALIFIE')).toBeNull())
  it('PERDU → NOUVEAU (réactivation)', () => expect(validateLeadTransition('PERDU', 'NOUVEAU')).toBeNull())
  it('PERDU → CONTACTE (réactivation)', () => expect(validateLeadTransition('PERDU', 'CONTACTE')).toBeNull())
  it('REPORTE → CONTACTE', () => expect(validateLeadTransition('REPORTE', 'CONTACTE')).toBeNull())

  // Transitions invalides
  it('NOUVEAU ✗ INSCRIT', () => expect(validateLeadTransition('NOUVEAU', 'INSCRIT')).not.toBeNull())
  it('NOUVEAU ✗ FORME', () => expect(validateLeadTransition('NOUVEAU', 'FORME')).not.toBeNull())
  it('NOUVEAU ✗ ALUMNI', () => expect(validateLeadTransition('NOUVEAU', 'ALUMNI')).not.toBeNull())
  it('CONTACTE ✗ INSCRIT (doit passer par QUALIFIE)', () => expect(validateLeadTransition('CONTACTE', 'INSCRIT')).not.toBeNull())
  it('QUALIFIE ✗ EN_FORMATION (doit passer par INSCRIT)', () => expect(validateLeadTransition('QUALIFIE', 'EN_FORMATION')).not.toBeNull())
  it('SPAM ✗ CONTACTE (terminal)', () => expect(validateLeadTransition('SPAM', 'CONTACTE')).not.toBeNull())
  it('SPAM ✗ NOUVEAU (terminal)', () => expect(validateLeadTransition('SPAM', 'NOUVEAU')).not.toBeNull())
  it('ALUMNI ✗ NOUVEAU', () => expect(validateLeadTransition('ALUMNI', 'NOUVEAU')).not.toBeNull())

  // Même statut = OK
  it('NOUVEAU → NOUVEAU (pas de changement)', () => expect(validateLeadTransition('NOUVEAU', 'NOUVEAU')).toBeNull())
})

// ============================================================
// Financement State Machine — EXHAUSTIF
// ============================================================

describe('Financement State Machine', () => {
  // Parcours complet normal
  it('PREPARATION → DOCUMENTS_REQUIS', () => expect(validateFinancementTransition('PREPARATION', 'DOCUMENTS_REQUIS')).toBeNull())
  it('DOCUMENTS_REQUIS → DOSSIER_COMPLET', () => expect(validateFinancementTransition('DOCUMENTS_REQUIS', 'DOSSIER_COMPLET')).toBeNull())
  it('DOSSIER_COMPLET → SOUMIS', () => expect(validateFinancementTransition('DOSSIER_COMPLET', 'SOUMIS')).toBeNull())
  it('SOUMIS → EN_EXAMEN', () => expect(validateFinancementTransition('SOUMIS', 'EN_EXAMEN')).toBeNull())
  it('EN_EXAMEN → VALIDE', () => expect(validateFinancementTransition('EN_EXAMEN', 'VALIDE')).toBeNull())
  it('EN_EXAMEN → REFUSE', () => expect(validateFinancementTransition('EN_EXAMEN', 'REFUSE')).toBeNull())
  it('VALIDE → VERSE', () => expect(validateFinancementTransition('VALIDE', 'VERSE')).toBeNull())
  it('VERSE → CLOTURE', () => expect(validateFinancementTransition('VERSE', 'CLOTURE')).toBeNull())

  // Retours en arrière autorisés
  it('REFUSE → PREPARATION (nouveau dossier)', () => expect(validateFinancementTransition('REFUSE', 'PREPARATION')).toBeNull())
  it('COMPLEMENT_DEMANDE → EN_EXAMEN', () => expect(validateFinancementTransition('COMPLEMENT_DEMANDE', 'EN_EXAMEN')).toBeNull())
  it('COMPLEMENT_DEMANDE → DOSSIER_COMPLET', () => expect(validateFinancementTransition('COMPLEMENT_DEMANDE', 'DOSSIER_COMPLET')).toBeNull())

  // Invalides
  it('PREPARATION ✗ VALIDE (doit passer par SOUMIS)', () => expect(validateFinancementTransition('PREPARATION', 'VALIDE')).not.toBeNull())
  it('CLOTURE ✗ PREPARATION (terminal)', () => expect(validateFinancementTransition('CLOTURE', 'PREPARATION')).not.toBeNull())
  it('SOUMIS ✗ PREPARATION', () => expect(validateFinancementTransition('SOUMIS', 'PREPARATION')).not.toBeNull())
})

// ============================================================
// Session State Machine — EXHAUSTIF
// ============================================================

describe('Session State Machine', () => {
  // Cycle de vie normal
  it('BROUILLON → PLANIFIEE', () => expect(validateSessionTransition('BROUILLON', 'PLANIFIEE')).toBeNull())
  it('PLANIFIEE → CONFIRMEE', () => expect(validateSessionTransition('PLANIFIEE', 'CONFIRMEE')).toBeNull())
  it('CONFIRMEE → EN_COURS', () => expect(validateSessionTransition('CONFIRMEE', 'EN_COURS')).toBeNull())
  it('EN_COURS → TERMINEE', () => expect(validateSessionTransition('EN_COURS', 'TERMINEE')).toBeNull())

  // Annulations
  it('BROUILLON → ANNULEE', () => expect(validateSessionTransition('BROUILLON', 'ANNULEE')).toBeNull())
  it('PLANIFIEE → ANNULEE', () => expect(validateSessionTransition('PLANIFIEE', 'ANNULEE')).toBeNull())
  it('CONFIRMEE → ANNULEE', () => expect(validateSessionTransition('CONFIRMEE', 'ANNULEE')).toBeNull())
  it('EN_COURS → ANNULEE', () => expect(validateSessionTransition('EN_COURS', 'ANNULEE')).toBeNull())

  // Reports
  it('PLANIFIEE → REPORTEE', () => expect(validateSessionTransition('PLANIFIEE', 'REPORTEE')).toBeNull())
  it('REPORTEE → PLANIFIEE', () => expect(validateSessionTransition('REPORTEE', 'PLANIFIEE')).toBeNull())

  // Recréation
  it('ANNULEE → BROUILLON', () => expect(validateSessionTransition('ANNULEE', 'BROUILLON')).toBeNull())

  // Terminaux
  it('TERMINEE ✗ EN_COURS', () => expect(validateSessionTransition('TERMINEE', 'EN_COURS')).not.toBeNull())
  it('TERMINEE ✗ BROUILLON', () => expect(validateSessionTransition('TERMINEE', 'BROUILLON')).not.toBeNull())
  it('BROUILLON ✗ TERMINEE', () => expect(validateSessionTransition('BROUILLON', 'TERMINEE')).not.toBeNull())
  it('BROUILLON ✗ EN_COURS', () => expect(validateSessionTransition('BROUILLON', 'EN_COURS')).not.toBeNull())
})

// ============================================================
// Inscription State Machine — EXHAUSTIF
// ============================================================

describe('Inscription State Machine', () => {
  // Parcours normal
  it('EN_ATTENTE → CONFIRMEE', () => expect(validateInscriptionTransition('EN_ATTENTE', 'CONFIRMEE')).toBeNull())
  it('CONFIRMEE → EN_COURS', () => expect(validateInscriptionTransition('CONFIRMEE', 'EN_COURS')).toBeNull())
  it('EN_COURS → COMPLETEE', () => expect(validateInscriptionTransition('EN_COURS', 'COMPLETEE')).toBeNull())

  // Annulations
  it('EN_ATTENTE → ANNULEE', () => expect(validateInscriptionTransition('EN_ATTENTE', 'ANNULEE')).toBeNull())
  it('CONFIRMEE → ANNULEE', () => expect(validateInscriptionTransition('CONFIRMEE', 'ANNULEE')).toBeNull())
  it('EN_COURS → ANNULEE', () => expect(validateInscriptionTransition('EN_COURS', 'ANNULEE')).toBeNull())

  // NO_SHOW
  it('EN_COURS → NO_SHOW', () => expect(validateInscriptionTransition('EN_COURS', 'NO_SHOW')).toBeNull())
  it('NO_SHOW → ANNULEE', () => expect(validateInscriptionTransition('NO_SHOW', 'ANNULEE')).toBeNull())

  // Remboursement
  it('COMPLETEE → REMBOURSEE (cas rare)', () => expect(validateInscriptionTransition('COMPLETEE', 'REMBOURSEE')).toBeNull())

  // Réinscription
  it('ANNULEE → EN_ATTENTE', () => expect(validateInscriptionTransition('ANNULEE', 'EN_ATTENTE')).toBeNull())

  // Terminaux
  it('REMBOURSEE ✗ EN_ATTENTE (terminal)', () => expect(validateInscriptionTransition('REMBOURSEE', 'EN_ATTENTE')).not.toBeNull())
  it('EN_ATTENTE ✗ COMPLETEE (doit passer par CONFIRMEE+EN_COURS)', () => expect(validateInscriptionTransition('EN_ATTENTE', 'COMPLETEE')).not.toBeNull())
  it('CONFIRMEE ✗ COMPLETEE (doit passer par EN_COURS)', () => expect(validateInscriptionTransition('CONFIRMEE', 'COMPLETEE')).not.toBeNull())
})
