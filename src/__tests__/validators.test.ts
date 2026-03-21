// ============================================================
// Tests — Validators & State Machines
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePhone,
  validateSiret,
  validateCodePostal,
  validateMontant,
  validateAge,
  validateNPS,
  validateSatisfaction,
  validateRequired,
  validateSessionDates,
  validateLeadTransition,
  validateFinancementTransition,
  validateSessionTransition,
  validateInscriptionTransition,
  sanitizeString,
  sanitizeFormData,
} from '@/lib/validators'

// ============================================================
// Validators basiques
// ============================================================

describe('validateEmail', () => {
  it('accepte un email valide', () => {
    expect(validateEmail('test@example.com')).toBeNull()
  })

  it('rejette un email invalide', () => {
    expect(validateEmail('invalid')).toBe('Email invalide')
    expect(validateEmail('no@dots')).toBe('Email invalide')
  })

  it('rejette un email trop long', () => {
    const long = 'a'.repeat(250) + '@b.com'
    expect(validateEmail(long)).toBe('Email trop long')
  })

  it('rejette les emails jetables', () => {
    expect(validateEmail('test@mailinator.com')).toBe('Adresse email jetable non acceptée')
    expect(validateEmail('test@yopmail.com')).toBe('Adresse email jetable non acceptée')
  })

  it('retourne null pour vide', () => {
    expect(validateEmail('')).toBeNull()
  })
})

describe('validatePhone', () => {
  it('accepte un numéro FR valide', () => {
    expect(validatePhone('06 12 34 56 78')).toBeNull()
    expect(validatePhone('+33612345678')).toBeNull()
    expect(validatePhone('01.23.45.67.89')).toBeNull()
  })

  it('rejette un numéro invalide', () => {
    expect(validatePhone('123')).not.toBeNull()
    expect(validatePhone('00 12 34 56 78')).not.toBeNull()
  })
})

describe('validateSiret', () => {
  it('rejette un SIRET trop court', () => {
    expect(validateSiret('12345')).toBe('SIRET invalide (14 chiffres)')
  })

  it('rejette un SIRET avec checksum invalide', () => {
    expect(validateSiret('12345678901234')).toBe('SIRET invalide (somme de contrôle)')
  })

  it('retourne null pour vide', () => {
    expect(validateSiret('')).toBeNull()
  })
})

describe('validateCodePostal', () => {
  it('accepte un CP valide', () => {
    expect(validateCodePostal('75011')).toBeNull()
    expect(validateCodePostal('69001')).toBeNull()
  })

  it('rejette un CP invalide', () => {
    expect(validateCodePostal('00000')).not.toBeNull()
    expect(validateCodePostal('99000')).not.toBeNull()
    expect(validateCodePostal('abc')).not.toBeNull()
  })
})

describe('validateMontant', () => {
  it('accepte un montant valide', () => {
    expect(validateMontant('1500')).toBeNull()
    expect(validateMontant('2 490 €')).toBeNull()
  })

  it('rejette un montant négatif', () => {
    expect(validateMontant('-100')).toBe('Montant invalide')
  })

  it('rejette un montant trop élevé', () => {
    expect(validateMontant('200000')).toBe('Montant trop élevé (max 100 000€)')
  })
})

describe('validateAge', () => {
  it('accepte un âge valide', () => {
    expect(validateAge('25')).toBeNull()
    expect(validateAge('16')).toBeNull()
    expect(validateAge('99')).toBeNull()
  })

  it('rejette un âge hors limites', () => {
    expect(validateAge('15')).not.toBeNull()
    expect(validateAge('100')).not.toBeNull()
  })
})

describe('validateNPS', () => {
  it('accepte un score NPS valide (0-10)', () => {
    expect(validateNPS('0')).toBeNull()
    expect(validateNPS('10')).toBeNull()
    expect(validateNPS('7')).toBeNull()
  })

  it('rejette un score hors limites', () => {
    expect(validateNPS('-1')).not.toBeNull()
    expect(validateNPS('11')).not.toBeNull()
  })
})

describe('validateSatisfaction', () => {
  it('accepte un score valide (1-5)', () => {
    expect(validateSatisfaction('1')).toBeNull()
    expect(validateSatisfaction('5')).toBeNull()
  })

  it('rejette un score hors limites', () => {
    expect(validateSatisfaction('0')).not.toBeNull()
    expect(validateSatisfaction('6')).not.toBeNull()
  })
})

describe('validateRequired', () => {
  it('rejette une valeur vide', () => {
    expect(validateRequired('')).toBe('Ce champ est requis')
    expect(validateRequired('   ')).toBe('Ce champ est requis')
  })

  it('accepte une valeur non vide', () => {
    expect(validateRequired('test')).toBeNull()
  })
})

describe('validateSessionDates', () => {
  it('accepte des dates valides', () => {
    expect(validateSessionDates('2026-04-01', '2026-04-03')).toBeNull()
  })

  it('rejette si fin < début', () => {
    expect(validateSessionDates('2026-04-03', '2026-04-01')).toBe(
      'La date de fin doit être après la date de début'
    )
  })

  it('rejette si durée > 30 jours', () => {
    expect(validateSessionDates('2026-04-01', '2026-06-01')).toBe(
      'La session ne peut pas durer plus de 30 jours'
    )
  })
})

// ============================================================
// State Machines
// ============================================================

describe('validateLeadTransition', () => {
  it('accepte les transitions valides', () => {
    expect(validateLeadTransition('NOUVEAU', 'CONTACTE')).toBeNull()
    expect(validateLeadTransition('CONTACTE', 'QUALIFIE')).toBeNull()
    expect(validateLeadTransition('QUALIFIE', 'INSCRIT')).toBeNull()
    expect(validateLeadTransition('EN_FORMATION', 'FORME')).toBeNull()
    expect(validateLeadTransition('FORME', 'ALUMNI')).toBeNull()
  })

  it('rejette les transitions invalides', () => {
    expect(validateLeadTransition('NOUVEAU', 'INSCRIT')).not.toBeNull()
    expect(validateLeadTransition('ALUMNI', 'NOUVEAU')).not.toBeNull()
    expect(validateLeadTransition('SPAM', 'CONTACTE')).not.toBeNull()
  })

  it('accepte même statut (pas de changement)', () => {
    expect(validateLeadTransition('NOUVEAU', 'NOUVEAU')).toBeNull()
  })

  it('permet la réactivation (PERDU → NOUVEAU)', () => {
    expect(validateLeadTransition('PERDU', 'NOUVEAU')).toBeNull()
    expect(validateLeadTransition('PERDU', 'CONTACTE')).toBeNull()
  })

  it('permet la re-inscription (ALUMNI → QUALIFIE)', () => {
    expect(validateLeadTransition('ALUMNI', 'QUALIFIE')).toBeNull()
  })
})

describe('validateFinancementTransition', () => {
  it('accepte le parcours normal', () => {
    expect(validateFinancementTransition('PREPARATION', 'DOCUMENTS_REQUIS')).toBeNull()
    expect(validateFinancementTransition('DOCUMENTS_REQUIS', 'DOSSIER_COMPLET')).toBeNull()
    expect(validateFinancementTransition('DOSSIER_COMPLET', 'SOUMIS')).toBeNull()
    expect(validateFinancementTransition('SOUMIS', 'EN_EXAMEN')).toBeNull()
    expect(validateFinancementTransition('EN_EXAMEN', 'VALIDE')).toBeNull()
    expect(validateFinancementTransition('VALIDE', 'VERSE')).toBeNull()
    expect(validateFinancementTransition('VERSE', 'CLOTURE')).toBeNull()
  })

  it('rejette les sauts non autorisés', () => {
    expect(validateFinancementTransition('PREPARATION', 'VALIDE')).not.toBeNull()
    expect(validateFinancementTransition('CLOTURE', 'PREPARATION')).not.toBeNull()
  })

  it('permet de refuser', () => {
    expect(validateFinancementTransition('EN_EXAMEN', 'REFUSE')).toBeNull()
    expect(validateFinancementTransition('SOUMIS', 'REFUSE')).toBeNull()
  })

  it('permet de recommencer après refus', () => {
    expect(validateFinancementTransition('REFUSE', 'PREPARATION')).toBeNull()
  })
})

describe('validateSessionTransition', () => {
  it('accepte le cycle de vie normal', () => {
    expect(validateSessionTransition('BROUILLON', 'PLANIFIEE')).toBeNull()
    expect(validateSessionTransition('PLANIFIEE', 'CONFIRMEE')).toBeNull()
    expect(validateSessionTransition('CONFIRMEE', 'EN_COURS')).toBeNull()
    expect(validateSessionTransition('EN_COURS', 'TERMINEE')).toBeNull()
  })

  it('permet l\'annulation à chaque étape', () => {
    expect(validateSessionTransition('BROUILLON', 'ANNULEE')).toBeNull()
    expect(validateSessionTransition('PLANIFIEE', 'ANNULEE')).toBeNull()
    expect(validateSessionTransition('CONFIRMEE', 'ANNULEE')).toBeNull()
    expect(validateSessionTransition('EN_COURS', 'ANNULEE')).toBeNull()
  })

  it('permet de recréer depuis ANNULEE', () => {
    expect(validateSessionTransition('ANNULEE', 'BROUILLON')).toBeNull()
  })

  it('TERMINEE est terminal', () => {
    expect(validateSessionTransition('TERMINEE', 'EN_COURS')).not.toBeNull()
  })
})

describe('validateInscriptionTransition', () => {
  it('accepte le parcours normal', () => {
    expect(validateInscriptionTransition('EN_ATTENTE', 'CONFIRMEE')).toBeNull()
    expect(validateInscriptionTransition('CONFIRMEE', 'EN_COURS')).toBeNull()
    expect(validateInscriptionTransition('EN_COURS', 'COMPLETEE')).toBeNull()
  })

  it('permet NO_SHOW', () => {
    expect(validateInscriptionTransition('EN_COURS', 'NO_SHOW')).toBeNull()
  })

  it('REMBOURSEE est terminal', () => {
    expect(validateInscriptionTransition('REMBOURSEE', 'EN_ATTENTE')).not.toBeNull()
  })
})

// ============================================================
// Sanitization
// ============================================================

describe('sanitizeString', () => {
  it('supprime les tags HTML', () => {
    expect(sanitizeString('<script>alert("xss")</script>Hello')).toBe('alert(xss)Hello')
  })

  it('supprime les caractères dangereux', () => {
    const result = sanitizeString('Test <> " \' value')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).not.toContain('"')
    expect(result).not.toContain("'")
  })

  it('tronque à 2000 caractères', () => {
    const long = 'a'.repeat(3000)
    expect(sanitizeString(long).length).toBe(2000)
  })

  it('trim les espaces', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
  })
})

describe('sanitizeFormData', () => {
  it('sanitize toutes les valeurs string', () => {
    const data = { name: '<b>Test</b>', age: 25, email: 'test@test.com' }
    const result = sanitizeFormData(data)
    expect(result.name).toBe('Test')
    expect(result.age).toBe(25)
    expect(result.email).toBe('test@test.com')
  })
})
