// ============================================================
// Tests — API Key Generation & Hashing
// Verifie le format, l'unicite, et le hashing SHA-256.
// ============================================================

import { describe, it, expect } from 'vitest'
import { generateApiKey, hashApiKey, hasScope } from '@/lib/api-key-auth'

describe('API Key Generation', () => {
  it('genere une cle au format dmtc_live_<hex>', () => {
    const { key } = generateApiKey()
    expect(key).toMatch(/^dmtc_live_[a-f0-9]{64}$/)
  })

  it('genere un prefix de 16 chars', () => {
    const { prefix } = generateApiKey()
    expect(prefix).toHaveLength(16)
    expect(prefix.startsWith('dmtc_live_')).toBe(true)
  })

  it('genere un hash SHA-256 hex de 64 chars', () => {
    const { hash } = generateApiKey()
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('deux generations produisent des cles differentes', () => {
    const a = generateApiKey()
    const b = generateApiKey()
    expect(a.key).not.toBe(b.key)
    expect(a.hash).not.toBe(b.hash)
  })

  it('le hash correspond a la cle', () => {
    const { key, hash } = generateApiKey()
    expect(hashApiKey(key)).toBe(hash)
  })
})

describe('hashApiKey', () => {
  it('produit un SHA-256 deterministe', () => {
    const hash1 = hashApiKey('test-key')
    const hash2 = hashApiKey('test-key')
    expect(hash1).toBe(hash2)
  })

  it('des cles differentes = des hash differents', () => {
    const hash1 = hashApiKey('key-a')
    const hash2 = hashApiKey('key-b')
    expect(hash1).not.toBe(hash2)
  })
})

describe('hasScope', () => {
  const baseKey = {
    id: 'test',
    name: 'test',
    key_prefix: 'dmtc_live_test',
    rate_limit_per_minute: 60,
    allowed_ips: [],
    is_active: true,
    expires_at: null,
    last_used_at: null,
    usage_count: 0,
  }

  it('wildcard * donne tous les scopes', () => {
    expect(hasScope({ ...baseKey, scopes: ['*'] }, 'read')).toBe(true)
    expect(hasScope({ ...baseKey, scopes: ['*'] }, 'write')).toBe(true)
    expect(hasScope({ ...baseKey, scopes: ['*'] }, 'anything')).toBe(true)
  })

  it('write inclut read', () => {
    expect(hasScope({ ...baseKey, scopes: ['write'] }, 'read')).toBe(true)
  })

  it('read ne donne pas write', () => {
    expect(hasScope({ ...baseKey, scopes: ['read'] }, 'write')).toBe(false)
  })

  it('scope exact match', () => {
    expect(hasScope({ ...baseKey, scopes: ['leads:read'] }, 'leads:read')).toBe(true)
    expect(hasScope({ ...baseKey, scopes: ['leads:read'] }, 'leads:write')).toBe(false)
  })
})
