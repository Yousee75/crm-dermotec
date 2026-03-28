// ============================================================
// Tests — PII Encryption (AES-256-GCM)
// Verifie le chiffrement/dechiffrement, le round-trip,
// la compatibilite ascendante, et la securite du format.
// ============================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encryptPII, decryptPII } from '@/lib/api/key-auth'

describe('PII Encryption (AES-256-GCM)', () => {
  const ORIGINAL_KEY = process.env.PII_ENCRYPTION_KEY

  beforeEach(() => {
    process.env.PII_ENCRYPTION_KEY = 'test-encryption-key-for-vitest-32!'
  })

  afterEach(() => {
    process.env.PII_ENCRYPTION_KEY = ORIGINAL_KEY
  })

  it('round-trip : encrypt → decrypt retourne la valeur originale', () => {
    const values = [
      'john.doe@gmail.com',
      '06 12 34 56 78',
      'Jean-Pierre Hébert',
      'Données avec accents éàü et émojis 🇫🇷',
      '', // vide
      'a', // 1 char
      'x'.repeat(5000), // longue chaine
    ]

    for (const original of values) {
      const encrypted = encryptPII(original)
      const decrypted = decryptPII(encrypted)
      expect(decrypted).toBe(original)
    }
  })

  it('le format chiffre commence par enc2:', () => {
    const encrypted = encryptPII('test@example.com')
    expect(encrypted.startsWith('enc2:')).toBe(true)
  })

  it('le format contient 3 parties base64 (iv:authTag:ciphertext)', () => {
    const encrypted = encryptPII('test@example.com')
    const parts = encrypted.substring(5).split(':') // enlever "enc2:"
    expect(parts).toHaveLength(3)

    // Chaque partie est du base64 valide
    for (const part of parts) {
      expect(() => Buffer.from(part, 'base64')).not.toThrow()
    }
  })

  it('IV est de 12 bytes (96 bits — standard GCM)', () => {
    const encrypted = encryptPII('test')
    const ivB64 = encrypted.substring(5).split(':')[0]
    const iv = Buffer.from(ivB64, 'base64')
    expect(iv.length).toBe(12)
  })

  it('authTag est de 16 bytes (128 bits — integrite GCM)', () => {
    const encrypted = encryptPII('test')
    const authTagB64 = encrypted.substring(5).split(':')[1]
    const authTag = Buffer.from(authTagB64, 'base64')
    expect(authTag.length).toBe(16)
  })

  it('deux chiffrements du meme texte produisent des resultats differents (IV unique)', () => {
    const a = encryptPII('same-value')
    const b = encryptPII('same-value')
    expect(a).not.toBe(b) // IV different a chaque appel
  })

  it('decryptPII retourne la valeur telle quelle si pas chiffree', () => {
    expect(decryptPII('plain text')).toBe('plain text')
    expect(decryptPII('')).toBe('')
    expect(decryptPII('bonjour')).toBe('bonjour')
  })

  it('sans PII_ENCRYPTION_KEY, encryptPII retourne en clair', () => {
    delete process.env.PII_ENCRYPTION_KEY
    const result = encryptPII('sensitive@email.com')
    expect(result).toBe('sensitive@email.com') // pas de prefix enc2:
  })

  it('sans PII_ENCRYPTION_KEY, decryptPII sur enc2: avertit', () => {
    const encrypted = encryptPII('test')
    delete process.env.PII_ENCRYPTION_KEY
    // Sans cle, decryptPII ne peut pas dechiffrer
    expect(decryptPII(encrypted).startsWith('enc2:')).toBe(true)
  })

  it('dechiffrement avec mauvaise cle echoue (integrite GCM)', () => {
    const encrypted = encryptPII('secret data')
    process.env.PII_ENCRYPTION_KEY = 'wrong-key-completely-different!!'
    expect(() => decryptPII(encrypted)).toThrow()
  })

  it('format corrompu lance une erreur', () => {
    expect(() => decryptPII('enc2:invalid')).toThrow('Format de chiffrement invalide')
  })
})
