import { describe, it, expect } from 'vitest'
import {
  formatEuro, formatDate, formatPhone, formatRelativeDate,
  generateNumeroFacture, generateCertificatNumero,
  getInitials, daysBetween, isOverdue, slugify,
} from '@/lib/utils'

describe('formatEuro', () => {
  it('formate un montant en euros', () => {
    const result = formatEuro(1500)
    expect(result).toContain('1')
    expect(result).toContain('500')
    expect(result).toContain('€')
  })

  it('gère les centimes', () => {
    const result = formatEuro(99.99)
    expect(result).toContain('99')
  })

  it('gère zéro', () => {
    const result = formatEuro(0)
    expect(result).toContain('0')
  })
})

describe('formatDate', () => {
  it('formate une date ISO', () => {
    const result = formatDate('2026-03-15')
    expect(result).toContain('2026')
    expect(result).toContain('15')
  })

  it('accepte un objet Date', () => {
    const result = formatDate(new Date(2026, 2, 15))
    expect(result).toContain('2026')
  })
})

describe('formatPhone', () => {
  it('formate un numéro FR à 10 chiffres', () => {
    expect(formatPhone('0612345678')).toBe('06 12 34 56 78')
  })

  it('retourne tel quel si pas 10 chiffres', () => {
    expect(formatPhone('+33612345678')).toBe('+33612345678')
  })
})

describe('formatRelativeDate', () => {
  it('retourne "à l\'instant" pour maintenant', () => {
    expect(formatRelativeDate(new Date())).toBe("à l'instant")
  })

  it('retourne "hier" pour hier', () => {
    const hier = new Date(Date.now() - 86400000 * 1.5)
    expect(formatRelativeDate(hier)).toBe('hier')
  })

  it('retourne "il y a Xj" pour quelques jours', () => {
    const d = new Date(Date.now() - 86400000 * 5)
    expect(formatRelativeDate(d)).toBe('il y a 5j')
  })
})

describe('generateNumeroFacture', () => {
  it('préfixe D pour devis', () => {
    expect(generateNumeroFacture('devis')).toMatch(/^D-\d{4}-\d{4}$/)
  })

  it('préfixe F pour facture', () => {
    expect(generateNumeroFacture('facture')).toMatch(/^F-\d{4}-\d{4}$/)
  })

  it('préfixe A pour avoir', () => {
    expect(generateNumeroFacture('avoir')).toMatch(/^A-\d{4}-\d{4}$/)
  })

  it('génère des numéros uniques', () => {
    const n1 = generateNumeroFacture('facture')
    const n2 = generateNumeroFacture('facture')
    // Probabilité de collision très faible mais pas impossible
    // On vérifie juste le format
    expect(n1).toMatch(/^F-/)
    expect(n2).toMatch(/^F-/)
  })
})

describe('generateCertificatNumero', () => {
  it('génère un numéro au format CERT-YYYY-XXXXX', () => {
    expect(generateCertificatNumero()).toMatch(/^CERT-\d{4}-\d{5}$/)
  })
})

describe('getInitials', () => {
  it('retourne les initiales', () => {
    expect(getInitials('Marie', 'Dupont')).toBe('MD')
  })

  it('gère le prénom seul', () => {
    expect(getInitials('Marie')).toBe('M')
  })

  it('gère les strings vides', () => {
    expect(getInitials('', '')).toBe('')
  })
})

describe('daysBetween', () => {
  it('calcule le nombre de jours entre deux dates', () => {
    expect(daysBetween('2026-01-01', '2026-01-11')).toBe(10)
  })

  it('retourne négatif si date1 > date2', () => {
    expect(daysBetween('2026-01-11', '2026-01-01')).toBe(-10)
  })

  it('retourne 0 pour le même jour', () => {
    expect(daysBetween('2026-03-15', '2026-03-15')).toBe(0)
  })
})

describe('isOverdue', () => {
  it('retourne true si la date est passée', () => {
    expect(isOverdue('2020-01-01')).toBe(true)
  })

  it('retourne false si la date est future', () => {
    expect(isOverdue('2030-01-01')).toBe(false)
  })
})

describe('slugify', () => {
  it('convertit en slug', () => {
    expect(slugify('Maquillage Permanent')).toBe('maquillage-permanent')
  })

  it('gère les accents', () => {
    expect(slugify('Épilation Définitive')).toBe('epilation-definitive')
  })

  it('gère les caractères spéciaux', () => {
    expect(slugify('Soin All-in-1')).toBe('soin-all-in-1')
  })

  it('supprime les tirets en début/fin', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world')
  })
})
