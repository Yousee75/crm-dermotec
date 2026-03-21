// ============================================================
// Tests — sanitizeForLog (masquage PII dans les logs)
// Verifie que les emails, telephones, et tokens sont masques.
// ============================================================

import { describe, it, expect } from 'vitest'
import { sanitizeForLog } from '@/lib/logger'

describe('sanitizeForLog', () => {
  describe('emails', () => {
    it('masque un email simple', () => {
      expect(sanitizeForLog('john.doe@gmail.com')).toBe('j***@gmail.com')
    })

    it('masque un email dans une phrase', () => {
      const result = sanitizeForLog('Contact: marie.dupont@dermotec.fr pour la formation')
      expect(result).toBe('Contact: m***@dermotec.fr pour la formation')
    })

    it('masque plusieurs emails', () => {
      const result = sanitizeForLog('De: a@b.com A: c@d.com')
      expect(result).toBe('De: a***@b.com A: c***@d.com')
    })

    it('ne touche pas un texte sans email', () => {
      expect(sanitizeForLog('Bonjour le monde')).toBe('Bonjour le monde')
    })
  })

  describe('telephones FR', () => {
    it('masque un telephone 06', () => {
      expect(sanitizeForLog('0612345678')).toBe('06 ** ** ** 78')
    })

    it('masque un telephone avec espaces', () => {
      expect(sanitizeForLog('06 12 34 56 78')).toBe('06 ** ** ** 78')
    })

    it('masque un telephone avec points', () => {
      expect(sanitizeForLog('06.12.34.56.78')).toBe('06 ** ** ** 78')
    })

    it('masque un telephone 01 (fixe)', () => {
      expect(sanitizeForLog('0145678901')).toBe('01 ** ** ** 01')
    })
  })

  describe('tokens et cles API', () => {
    it('masque une cle Stripe live', () => {
      const result = sanitizeForLog('sk_live_abc123def456xyz')
      expect(result).toContain('sk_live_****')
      expect(result).not.toContain('abc123')
    })

    it('masque une cle Stripe test', () => {
      const result = sanitizeForLog('sk_test_longSecretKeyValue')
      expect(result).toContain('sk_test_****')
    })

    it('masque une cle API Dermotec', () => {
      const result = sanitizeForLog('dmtc_live_abcdef1234567890')
      expect(result).toContain('dmtc_live_****')
      expect(result).not.toContain('abcdef')
    })

    it('masque un Bearer token', () => {
      const result = sanitizeForLog('Bearer eyJhbGciOiJIUzI1NiJ9')
      expect(result).toContain('Bearer ****')
      expect(result).not.toContain('eyJh')
    })
  })

  describe('types complexes', () => {
    it('sanitize les objets recursifs', () => {
      const result = sanitizeForLog({
        email: 'test@example.com',
        phone: '0612345678',
        nested: { key: 'sk_live_secret123' },
      }) as Record<string, unknown>

      expect(result.email).toBe('t***@example.com')
      expect(result.phone).toBe('06 ** ** ** 78')
      expect((result.nested as Record<string, unknown>).key).toContain('sk_live_****')
    })

    it('sanitize les arrays', () => {
      const result = sanitizeForLog(['a@b.com', '0612345678']) as string[]
      expect(result[0]).toBe('a***@b.com')
      expect(result[1]).toBe('06 ** ** ** 78')
    })

    it('retourne les non-strings tels quels', () => {
      expect(sanitizeForLog(42)).toBe(42)
      expect(sanitizeForLog(null)).toBe(null)
      expect(sanitizeForLog(true)).toBe(true)
    })
  })
})
