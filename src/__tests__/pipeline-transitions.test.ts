// ============================================================
// Tests — Pipeline Transitions
// Tests critiques des transitions de statut (state machines)
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  validateLeadTransition,
  validateFinancementTransition,
  validateLigneFinancementTransition,
  validateSessionTransition,
  validateInscriptionTransition,
} from '@/lib/validators'
import type {
  StatutLead,
  StatutFinancement,
  StatutLigneFinancement,
  StatutSession,
  StatutInscription,
} from '@/types'

describe('Pipeline Transitions - Lead', () => {
  describe('Transitions valides', () => {
    it('NOUVEAU → États suivants autorisés', () => {
      expect(validateLeadTransition('NOUVEAU', 'CONTACTE')).toBeNull()
      expect(validateLeadTransition('NOUVEAU', 'QUALIFIE')).toBeNull()
      expect(validateLeadTransition('NOUVEAU', 'PERDU')).toBeNull()
      expect(validateLeadTransition('NOUVEAU', 'SPAM')).toBeNull()
    })

    it('CONTACTE → États suivants autorisés', () => {
      expect(validateLeadTransition('CONTACTE', 'QUALIFIE')).toBeNull()
      expect(validateLeadTransition('CONTACTE', 'FINANCEMENT_EN_COURS')).toBeNull()
      expect(validateLeadTransition('CONTACTE', 'PERDU')).toBeNull()
      expect(validateLeadTransition('CONTACTE', 'REPORTE')).toBeNull()
      expect(validateLeadTransition('CONTACTE', 'SPAM')).toBeNull()
    })

    it('QUALIFIE → États suivants autorisés', () => {
      expect(validateLeadTransition('QUALIFIE', 'FINANCEMENT_EN_COURS')).toBeNull()
      expect(validateLeadTransition('QUALIFIE', 'INSCRIT')).toBeNull()
      expect(validateLeadTransition('QUALIFIE', 'PERDU')).toBeNull()
      expect(validateLeadTransition('QUALIFIE', 'REPORTE')).toBeNull()
    })

    it('FINANCEMENT_EN_COURS → États suivants autorisés', () => {
      expect(validateLeadTransition('FINANCEMENT_EN_COURS', 'INSCRIT')).toBeNull()
      expect(validateLeadTransition('FINANCEMENT_EN_COURS', 'PERDU')).toBeNull()
      expect(validateLeadTransition('FINANCEMENT_EN_COURS', 'REPORTE')).toBeNull()
      expect(validateLeadTransition('FINANCEMENT_EN_COURS', 'QUALIFIE')).toBeNull()
    })

    it('INSCRIT → États suivants autorisés', () => {
      expect(validateLeadTransition('INSCRIT', 'EN_FORMATION')).toBeNull()
      expect(validateLeadTransition('INSCRIT', 'PERDU')).toBeNull()
      expect(validateLeadTransition('INSCRIT', 'REPORTE')).toBeNull()
    })

    it('EN_FORMATION → États suivants autorisés', () => {
      expect(validateLeadTransition('EN_FORMATION', 'FORME')).toBeNull()
      expect(validateLeadTransition('EN_FORMATION', 'PERDU')).toBeNull()
    })

    it('FORME → États suivants autorisés', () => {
      expect(validateLeadTransition('FORME', 'ALUMNI')).toBeNull()
      expect(validateLeadTransition('FORME', 'PERDU')).toBeNull()
    })

    it('ALUMNI → Réinscription possible', () => {
      expect(validateLeadTransition('ALUMNI', 'QUALIFIE')).toBeNull()
    })

    it('PERDU → Réactivation possible', () => {
      expect(validateLeadTransition('PERDU', 'NOUVEAU')).toBeNull()
      expect(validateLeadTransition('PERDU', 'CONTACTE')).toBeNull()
    })

    it('REPORTE → Reprise possible', () => {
      expect(validateLeadTransition('REPORTE', 'CONTACTE')).toBeNull()
      expect(validateLeadTransition('REPORTE', 'QUALIFIE')).toBeNull()
      expect(validateLeadTransition('REPORTE', 'PERDU')).toBeNull()
    })

    it('Même statut → Pas de changement', () => {
      expect(validateLeadTransition('NOUVEAU', 'NOUVEAU')).toBeNull()
      expect(validateLeadTransition('CONTACTE', 'CONTACTE')).toBeNull()
      expect(validateLeadTransition('QUALIFIE', 'QUALIFIE')).toBeNull()
    })
  })

  describe('Transitions invalides', () => {
    it('NOUVEAU → États interdits', () => {
      expect(validateLeadTransition('NOUVEAU', 'FINANCEMENT_EN_COURS')).toBe('Transition invalide : NOUVEAU → FINANCEMENT_EN_COURS')
      expect(validateLeadTransition('NOUVEAU', 'INSCRIT')).toBe('Transition invalide : NOUVEAU → INSCRIT')
      expect(validateLeadTransition('NOUVEAU', 'EN_FORMATION')).toBe('Transition invalide : NOUVEAU → EN_FORMATION')
      expect(validateLeadTransition('NOUVEAU', 'FORME')).toBe('Transition invalide : NOUVEAU → FORME')
      expect(validateLeadTransition('NOUVEAU', 'ALUMNI')).toBe('Transition invalide : NOUVEAU → ALUMNI')
    })

    it('FORME → Retour arrière interdit (sauf ALUMNI/PERDU)', () => {
      expect(validateLeadTransition('FORME', 'NOUVEAU')).toBe('Transition invalide : FORME → NOUVEAU')
      expect(validateLeadTransition('FORME', 'CONTACTE')).toBe('Transition invalide : FORME → CONTACTE')
      expect(validateLeadTransition('FORME', 'QUALIFIE')).toBe('Transition invalide : FORME → QUALIFIE')
      expect(validateLeadTransition('FORME', 'INSCRIT')).toBe('Transition invalide : FORME → INSCRIT')
      expect(validateLeadTransition('FORME', 'EN_FORMATION')).toBe('Transition invalide : FORME → EN_FORMATION')
    })

    it('SPAM → Terminal, aucune transition', () => {
      const allStatuses: StatutLead[] = ['NOUVEAU', 'CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI', 'PERDU', 'REPORTE']

      allStatuses.forEach(status => {
        if (status !== 'SPAM') {
          expect(validateLeadTransition('SPAM', status)).toBe(`Transition invalide : SPAM → ${status}`)
        }
      })
    })

    it('Saut d\'étapes interdits', () => {
      expect(validateLeadTransition('CONTACTE', 'INSCRIT')).toBe('Transition invalide : CONTACTE → INSCRIT')
      expect(validateLeadTransition('QUALIFIE', 'EN_FORMATION')).toBe('Transition invalide : QUALIFIE → EN_FORMATION')
      expect(validateLeadTransition('INSCRIT', 'FORME')).toBe('Transition invalide : INSCRIT → FORME')
    })
  })
})

describe('Pipeline Transitions - Financement', () => {
  describe('Transitions valides', () => {
    it('Workflow normal de financement', () => {
      // PREPARATION → DOCUMENTS_REQUIS → DOSSIER_COMPLET → SOUMIS → EN_EXAMEN → VALIDE → VERSE → CLOTURE
      expect(validateFinancementTransition('PREPARATION', 'DOCUMENTS_REQUIS')).toBeNull()
      expect(validateFinancementTransition('DOCUMENTS_REQUIS', 'DOSSIER_COMPLET')).toBeNull()
      expect(validateFinancementTransition('DOSSIER_COMPLET', 'SOUMIS')).toBeNull()
      expect(validateFinancementTransition('SOUMIS', 'EN_EXAMEN')).toBeNull()
      expect(validateFinancementTransition('EN_EXAMEN', 'VALIDE')).toBeNull()
      expect(validateFinancementTransition('VALIDE', 'VERSE')).toBeNull()
      expect(validateFinancementTransition('VERSE', 'CLOTURE')).toBeNull()
    })

    it('Workflow avec refus et nouvelle tentative', () => {
      expect(validateFinancementTransition('SOUMIS', 'REFUSE')).toBeNull()
      expect(validateFinancementTransition('EN_EXAMEN', 'REFUSE')).toBeNull()
      expect(validateFinancementTransition('REFUSE', 'PREPARATION')).toBeNull() // Nouveau dossier
    })

    it('Workflow avec complément demandé', () => {
      expect(validateFinancementTransition('EN_EXAMEN', 'COMPLEMENT_DEMANDE')).toBeNull()
      expect(validateFinancementTransition('COMPLEMENT_DEMANDE', 'EN_EXAMEN')).toBeNull()
      expect(validateFinancementTransition('COMPLEMENT_DEMANDE', 'DOSSIER_COMPLET')).toBeNull()
    })

    it('Corrections/retours possibles', () => {
      expect(validateFinancementTransition('DOCUMENTS_REQUIS', 'PREPARATION')).toBeNull()
      expect(validateFinancementTransition('PREPARATION', 'DOSSIER_COMPLET')).toBeNull() // Saut si docs complets
    })
  })

  describe('Transitions invalides', () => {
    it('Saut d\'étapes interdits', () => {
      expect(validateFinancementTransition('PREPARATION', 'SOUMIS')).toBe('Transition invalide : PREPARATION → SOUMIS')
      expect(validateFinancementTransition('DOCUMENTS_REQUIS', 'EN_EXAMEN')).toBe('Transition invalide : DOCUMENTS_REQUIS → EN_EXAMEN')
      expect(validateFinancementTransition('DOSSIER_COMPLET', 'VALIDE')).toBe('Transition invalide : DOSSIER_COMPLET → VALIDE')
    })

    it('CLOTURE terminal', () => {
      const allStatuses: StatutFinancement[] = ['PREPARATION', 'DOCUMENTS_REQUIS', 'DOSSIER_COMPLET', 'SOUMIS', 'EN_EXAMEN', 'COMPLEMENT_DEMANDE', 'VALIDE', 'REFUSE', 'VERSE']

      allStatuses.forEach(status => {
        expect(validateFinancementTransition('CLOTURE', status)).toBe(`Transition invalide : CLOTURE → ${status}`)
      })
    })

    it('VERSE → Seule CLOTURE possible', () => {
      expect(validateFinancementTransition('VERSE', 'PREPARATION')).toBe('Transition invalide : VERSE → PREPARATION')
      expect(validateFinancementTransition('VERSE', 'EN_EXAMEN')).toBe('Transition invalide : VERSE → EN_EXAMEN')
      expect(validateFinancementTransition('VERSE', 'VALIDE')).toBe('Transition invalide : VERSE → VALIDE')
    })
  })
})

describe('Pipeline Transitions - Session', () => {
  describe('Transitions valides', () => {
    it('Workflow normal de session', () => {
      // BROUILLON → PLANIFIEE → CONFIRMEE → EN_COURS → TERMINEE
      expect(validateSessionTransition('BROUILLON', 'PLANIFIEE')).toBeNull()
      expect(validateSessionTransition('PLANIFIEE', 'CONFIRMEE')).toBeNull()
      expect(validateSessionTransition('CONFIRMEE', 'EN_COURS')).toBeNull()
      expect(validateSessionTransition('EN_COURS', 'TERMINEE')).toBeNull()
    })

    it('Annulation possible à tout moment (sauf TERMINEE)', () => {
      expect(validateSessionTransition('BROUILLON', 'ANNULEE')).toBeNull()
      expect(validateSessionTransition('PLANIFIEE', 'ANNULEE')).toBeNull()
      expect(validateSessionTransition('CONFIRMEE', 'ANNULEE')).toBeNull()
      expect(validateSessionTransition('EN_COURS', 'ANNULEE')).toBeNull()
    })

    it('Report possible avant EN_COURS', () => {
      expect(validateSessionTransition('PLANIFIEE', 'REPORTEE')).toBeNull()
      expect(validateSessionTransition('CONFIRMEE', 'REPORTEE')).toBeNull()
      expect(validateSessionTransition('REPORTEE', 'PLANIFIEE')).toBeNull()
      expect(validateSessionTransition('REPORTEE', 'ANNULEE')).toBeNull()
    })

    it('Recréation après annulation', () => {
      expect(validateSessionTransition('ANNULEE', 'BROUILLON')).toBeNull()
    })
  })

  describe('Transitions invalides', () => {
    it('Saut d\'étapes interdits', () => {
      expect(validateSessionTransition('BROUILLON', 'CONFIRMEE')).toBe('Transition invalide : BROUILLON → CONFIRMEE')
      expect(validateSessionTransition('BROUILLON', 'EN_COURS')).toBe('Transition invalide : BROUILLON → EN_COURS')
      expect(validateSessionTransition('PLANIFIEE', 'EN_COURS')).toBe('Transition invalide : PLANIFIEE → EN_COURS')
    })

    it('Retour arrière impossible (sauf cas spéciaux)', () => {
      expect(validateSessionTransition('CONFIRMEE', 'PLANIFIEE')).toBe('Transition invalide : CONFIRMEE → PLANIFIEE')
      expect(validateSessionTransition('EN_COURS', 'CONFIRMEE')).toBe('Transition invalide : EN_COURS → CONFIRMEE')
      expect(validateSessionTransition('EN_COURS', 'PLANIFIEE')).toBe('Transition invalide : EN_COURS → PLANIFIEE')
    })

    it('TERMINEE terminal', () => {
      const allStatuses: StatutSession[] = ['BROUILLON', 'PLANIFIEE', 'CONFIRMEE', 'EN_COURS', 'ANNULEE', 'REPORTEE']

      allStatuses.forEach(status => {
        expect(validateSessionTransition('TERMINEE', status)).toBe(`Transition invalide : TERMINEE → ${status}`)
      })
    })

    it('Report impossible si EN_COURS ou TERMINEE', () => {
      expect(validateSessionTransition('EN_COURS', 'REPORTEE')).toBe('Transition invalide : EN_COURS → REPORTEE')
      expect(validateSessionTransition('TERMINEE', 'REPORTEE')).toBe('Transition invalide : TERMINEE → REPORTEE')
    })
  })
})

describe('Pipeline Transitions - Inscription', () => {
  describe('Transitions valides', () => {
    it('Workflow normal d\'inscription', () => {
      // EN_ATTENTE → CONFIRMEE → EN_COURS → COMPLETEE
      expect(validateInscriptionTransition('EN_ATTENTE', 'CONFIRMEE')).toBeNull()
      expect(validateInscriptionTransition('CONFIRMEE', 'EN_COURS')).toBeNull()
      expect(validateInscriptionTransition('EN_COURS', 'COMPLETEE')).toBeNull()
    })

    it('Annulation possible avant COMPLETEE', () => {
      expect(validateInscriptionTransition('EN_ATTENTE', 'ANNULEE')).toBeNull()
      expect(validateInscriptionTransition('CONFIRMEE', 'ANNULEE')).toBeNull()
      expect(validateInscriptionTransition('EN_COURS', 'ANNULEE')).toBeNull()
    })

    it('No-show possible pendant EN_COURS', () => {
      expect(validateInscriptionTransition('EN_COURS', 'NO_SHOW')).toBeNull()
      expect(validateInscriptionTransition('NO_SHOW', 'ANNULEE')).toBeNull()
    })

    it('Réinscription après annulation', () => {
      expect(validateInscriptionTransition('ANNULEE', 'EN_ATTENTE')).toBeNull()
    })

    it('Remboursement possible (cas rare)', () => {
      expect(validateInscriptionTransition('COMPLETEE', 'REMBOURSEE')).toBeNull()
    })
  })

  describe('Transitions invalides', () => {
    it('Saut d\'étapes interdits', () => {
      expect(validateInscriptionTransition('EN_ATTENTE', 'EN_COURS')).toBe('Transition invalide : EN_ATTENTE → EN_COURS')
      expect(validateInscriptionTransition('EN_ATTENTE', 'COMPLETEE')).toBe('Transition invalide : EN_ATTENTE → COMPLETEE')
      expect(validateInscriptionTransition('CONFIRMEE', 'COMPLETEE')).toBe('Transition invalide : CONFIRMEE → COMPLETEE')
    })

    it('Retour arrière impossible (sauf réinscription)', () => {
      expect(validateInscriptionTransition('CONFIRMEE', 'EN_ATTENTE')).toBe('Transition invalide : CONFIRMEE → EN_ATTENTE')
      expect(validateInscriptionTransition('EN_COURS', 'CONFIRMEE')).toBe('Transition invalide : EN_COURS → CONFIRMEE')
      expect(validateInscriptionTransition('COMPLETEE', 'EN_COURS')).toBe('Transition invalide : COMPLETEE → EN_COURS')
    })

    it('REMBOURSEE terminal', () => {
      const allStatuses: StatutInscription[] = ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'COMPLETEE', 'ANNULEE', 'NO_SHOW']

      allStatuses.forEach(status => {
        expect(validateInscriptionTransition('REMBOURSEE', status)).toBe(`Transition invalide : REMBOURSEE → ${status}`)
      })
    })

    it('NO_SHOW ne peut que vers ANNULEE', () => {
      expect(validateInscriptionTransition('NO_SHOW', 'EN_ATTENTE')).toBe('Transition invalide : NO_SHOW → EN_ATTENTE')
      expect(validateInscriptionTransition('NO_SHOW', 'CONFIRMEE')).toBe('Transition invalide : NO_SHOW → CONFIRMEE')
      expect(validateInscriptionTransition('NO_SHOW', 'EN_COURS')).toBe('Transition invalide : NO_SHOW → EN_COURS')
    })
  })
})

describe('Pipeline Transitions - Ligne Financement', () => {
  describe('Transitions valides', () => {
    it('Workflow simple ligne financement', () => {
      // PREPARATION → SOUMIS → EN_EXAMEN → VALIDE → VERSE
      expect(validateLigneFinancementTransition('PREPARATION', 'SOUMIS')).toBeNull()
      expect(validateLigneFinancementTransition('SOUMIS', 'EN_EXAMEN')).toBeNull()
      expect(validateLigneFinancementTransition('EN_EXAMEN', 'VALIDE')).toBeNull()
      expect(validateLigneFinancementTransition('VALIDE', 'VERSE')).toBeNull()
    })

    it('Refus et nouvelle tentative', () => {
      expect(validateLigneFinancementTransition('SOUMIS', 'REFUSE')).toBeNull()
      expect(validateLigneFinancementTransition('EN_EXAMEN', 'REFUSE')).toBeNull()
      expect(validateLigneFinancementTransition('REFUSE', 'PREPARATION')).toBeNull()
    })
  })

  describe('Transitions invalides', () => {
    it('Saut d\'étapes interdits', () => {
      expect(validateLigneFinancementTransition('PREPARATION', 'EN_EXAMEN')).toBe('Transition ligne financement invalide : PREPARATION → EN_EXAMEN')
      expect(validateLigneFinancementTransition('SOUMIS', 'VALIDE')).toBe('Transition ligne financement invalide : SOUMIS → VALIDE')
      expect(validateLigneFinancementTransition('PREPARATION', 'VERSE')).toBe('Transition ligne financement invalide : PREPARATION → VERSE')
    })

    it('VERSE terminal', () => {
      const allStatuses: StatutLigneFinancement[] = ['PREPARATION', 'SOUMIS', 'EN_EXAMEN', 'VALIDE', 'REFUSE']

      allStatuses.forEach(status => {
        expect(validateLigneFinancementTransition('VERSE', status)).toBe(`Transition ligne financement invalide : VERSE → ${status}`)
      })
    })

    it('Retour arrière impossible depuis VALIDE', () => {
      expect(validateLigneFinancementTransition('VALIDE', 'PREPARATION')).toBe('Transition ligne financement invalide : VALIDE → PREPARATION')
      expect(validateLigneFinancementTransition('VALIDE', 'SOUMIS')).toBe('Transition ligne financement invalide : VALIDE → SOUMIS')
      expect(validateLigneFinancementTransition('VALIDE', 'EN_EXAMEN')).toBe('Transition ligne financement invalide : VALIDE → EN_EXAMEN')
    })
  })
})

describe('Edge Cases - All State Machines', () => {
  it('gère les transitions avec statuts identiques', () => {
    expect(validateLeadTransition('NOUVEAU', 'NOUVEAU')).toBeNull()
    expect(validateFinancementTransition('SOUMIS', 'SOUMIS')).toBeNull()
    expect(validateSessionTransition('PLANIFIEE', 'PLANIFIEE')).toBeNull()
    expect(validateInscriptionTransition('EN_COURS', 'EN_COURS')).toBeNull()
    expect(validateLigneFinancementTransition('VALIDE', 'VALIDE')).toBeNull()
  })

  it('valide tous les statuts terminaux', () => {
    // Statuts qui ne permettent aucune transition sortante (ou très limitées)
    expect(validateLeadTransition('SPAM', 'NOUVEAU')).toBe('Transition invalide : SPAM → NOUVEAU')
    expect(validateFinancementTransition('CLOTURE', 'PREPARATION')).toBe('Transition invalide : CLOTURE → PREPARATION')
    expect(validateSessionTransition('TERMINEE', 'BROUILLON')).toBe('Transition invalide : TERMINEE → BROUILLON')
    expect(validateInscriptionTransition('REMBOURSEE', 'EN_ATTENTE')).toBe('Transition invalide : REMBOURSEE → EN_ATTENTE')
    expect(validateLigneFinancementTransition('VERSE', 'PREPARATION')).toBe('Transition ligne financement invalide : VERSE → PREPARATION')
  })
})