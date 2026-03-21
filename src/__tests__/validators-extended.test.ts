// ============================================================
// Tests — Validateurs etendus
// Couvre les edge cases des validateurs basiques + sanitization.
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
  validateSessionDates,
  validateUrl,
  validateRequired,
  sanitizeString,
  sanitizeFormData,
} from '@/lib/validators'

describe('validateEmail', () => {
  it('accepte un email valide', () => {
    expect(validateEmail('test@example.com')).toBeNull()
  })

  it('refuse un email sans @', () => {
    expect(validateEmail('invalid')).toBe('Email invalide')
  })

  it('refuse un email trop long (>254)', () => {
    const long = 'a'.repeat(250) + '@b.com'
    expect(validateEmail(long)).toBe('Email trop long')
  })

  it('refuse un email jetable', () => {
    const result = validateEmail('test@yopmail.com')
    expect(result).toBe('Adresse email jetable non acceptée')
  })

  it('retourne null pour valeur vide', () => {
    expect(validateEmail('')).toBeNull()
  })
})

describe('validatePhone', () => {
  it('accepte un telephone FR valide', () => {
    expect(validatePhone('06 12 34 56 78')).toBeNull()
    expect(validatePhone('0612345678')).toBeNull()
    expect(validatePhone('+33612345678')).toBeNull()
    expect(validatePhone('06.12.34.56.78')).toBeNull()
  })

  it('refuse un format invalide', () => {
    expect(validatePhone('123')).toContain('invalide')
    expect(validatePhone('00 12 34 56 78')).toContain('invalide') // 00 pas valide
  })

  it('retourne null pour valeur vide', () => {
    expect(validatePhone('')).toBeNull()
  })
})

describe('validateSiret', () => {
  // SIRET genere avec somme Luhn valide
  it('accepte un SIRET valide', () => {
    expect(validateSiret('42340440036070')).toBeNull()
  })

  it('refuse un SIRET trop court', () => {
    expect(validateSiret('123')).toContain('14 chiffres')
  })

  it('refuse un SIRET avec mauvaise somme de controle', () => {
    expect(validateSiret('12345678901234')).toContain('somme de contrôle')
  })
})

describe('validateCodePostal', () => {
  it('accepte des codes postaux FR valides', () => {
    expect(validateCodePostal('75011')).toBeNull()
    expect(validateCodePostal('13001')).toBeNull()
    expect(validateCodePostal('01000')).toBeNull()
  })

  it('refuse un code postal invalide', () => {
    expect(validateCodePostal('00000')).toContain('invalide')
    expect(validateCodePostal('99000')).toContain('invalide')
    expect(validateCodePostal('ABCDE')).toContain('invalide')
  })
})

describe('validateMontant', () => {
  it('accepte un montant valide', () => {
    expect(validateMontant('1500')).toBeNull()
    expect(validateMontant('0')).toBeNull()
    expect(validateMontant('99999')).toBeNull()
  })

  it('refuse un montant negatif', () => {
    expect(validateMontant('-100')).toContain('invalide')
  })

  it('refuse un montant > 100 000', () => {
    expect(validateMontant('200000')).toContain('trop élevé')
  })
})

describe('validateAge', () => {
  it('accepte 16-99', () => {
    expect(validateAge('16')).toBeNull()
    expect(validateAge('99')).toBeNull()
    expect(validateAge('35')).toBeNull()
  })

  it('refuse en dehors de 16-99', () => {
    expect(validateAge('15')).toContain('invalide')
    expect(validateAge('100')).toContain('invalide')
    expect(validateAge('abc')).toContain('invalide')
  })
})

describe('validateNPS', () => {
  it('accepte 0-10', () => {
    expect(validateNPS('0')).toBeNull()
    expect(validateNPS('10')).toBeNull()
    expect(validateNPS('7')).toBeNull()
  })

  it('refuse en dehors de 0-10', () => {
    expect(validateNPS('-1')).toContain('NPS')
    expect(validateNPS('11')).toContain('NPS')
  })
})

describe('validateSatisfaction', () => {
  it('accepte 1-5', () => {
    expect(validateSatisfaction('1')).toBeNull()
    expect(validateSatisfaction('5')).toBeNull()
  })

  it('refuse en dehors de 1-5', () => {
    expect(validateSatisfaction('0')).toContain('Note')
    expect(validateSatisfaction('6')).toContain('Note')
  })
})

describe('validateSessionDates', () => {
  it('accepte des dates valides', () => {
    expect(validateSessionDates('2026-04-01', '2026-04-03')).toBeNull()
  })

  it('refuse fin avant debut', () => {
    expect(validateSessionDates('2026-04-05', '2026-04-01')).toContain('après')
  })

  it('refuse une session de plus de 30 jours', () => {
    expect(validateSessionDates('2026-04-01', '2026-05-15')).toContain('30 jours')
  })

  it('refuse des dates manquantes', () => {
    expect(validateSessionDates('', '2026-04-01')).toContain('requises')
  })
})

describe('validateUrl', () => {
  it('accepte une URL valide', () => {
    expect(validateUrl('https://dermotec.fr')).toBeNull()
  })

  it('refuse une URL invalide', () => {
    expect(validateUrl('not-a-url')).toContain('invalide')
  })
})

describe('validateRequired', () => {
  it('refuse une chaine vide', () => {
    expect(validateRequired('')).toContain('requis')
    expect(validateRequired('   ')).toContain('requis')
  })

  it('accepte une chaine non vide', () => {
    expect(validateRequired('hello')).toBeNull()
  })
})

describe('sanitizeString', () => {
  it('supprime les tags HTML', () => {
    expect(sanitizeString('<script>alert("xss")</script>Hello')).toBe('alert(xss)Hello')
  })

  it('supprime les caracteres dangereux', () => {
    expect(sanitizeString('Test"with\'quotes<>')).toBe('Testwithquotes')
  })

  it('tronque a 2000 chars', () => {
    const long = 'a'.repeat(3000)
    expect(sanitizeString(long)).toHaveLength(2000)
  })

  it('trim les espaces', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
  })
})

describe('sanitizeFormData', () => {
  it('sanitize toutes les chaines d un objet', () => {
    const data = { name: '<b>Test</b>', age: 25, email: 'test@test.com' }
    const result = sanitizeFormData(data)
    expect(result.name).toBe('Test')
    expect(result.age).toBe(25) // non-string pas touche
    expect(result.email).toBe('test@test.com')
  })
})
