// ============================================================
// CRM DERMOTEC — API Key Management + SSO/OAuth2
// Gestion des cles API pour integrations externes
// IP allowlisting per-key
// ============================================================

import { createHash, randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto'

// --- Types ---

interface ApiKeyData {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  rate_limit_per_minute: number
  allowed_ips: string[]
  is_active: boolean
  expires_at: string | null
  last_used_at: string | null
  usage_count: number
}

interface ApiKeyValidation {
  valid: boolean
  keyData?: ApiKeyData
  error?: string
}

// --- Key Generation ---

/**
 * Generer une nouvelle cle API
 * Format: dmtc_live_<32 chars random hex>
 * On retourne la cle en clair UNE SEULE FOIS, ensuite seul le hash est stocke
 */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const rawBytes = randomBytes(32)
  const key = `dmtc_live_${rawBytes.toString('hex')}`
  const hash = hashApiKey(key)
  const prefix = key.substring(0, 16) // "dmtc_live_XXXXXX"

  return { key, hash, prefix }
}

/**
 * Hash SHA-256 d'une cle API (pour stockage en DB)
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

// --- Validation ---

/**
 * Valider une cle API depuis un header Authorization
 * Header attendu: Authorization: Bearer dmtc_live_...
 */
export async function validateApiKey(
  authHeader: string | null,
  clientIp: string
): Promise<ApiKeyValidation> {
  if (!authHeader) {
    return { valid: false, error: 'Authorization header missing' }
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return { valid: false, error: 'Invalid Authorization format. Expected: Bearer <key>' }
  }

  const key = parts[1]
  if (!key.startsWith('dmtc_live_')) {
    return { valid: false, error: 'Invalid API key format' }
  }

  const keyHash = hashApiKey(key)

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single()

    if (error || !keyData) {
      return { valid: false, error: 'Invalid or revoked API key' }
    }

    // Verifier expiration
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { valid: false, error: 'API key expired' }
    }

    // Verifier IP allowlist
    if (keyData.allowed_ips.length > 0 && !keyData.allowed_ips.includes(clientIp)) {
      return { valid: false, error: `IP ${clientIp} not in allowlist` }
    }

    // Mettre a jour last_used_at et usage_count (non-bloquant)
    Promise.resolve(
      supabase
        .from('api_keys')
        .update({
          last_used_at: new Date().toISOString(),
          usage_count: (keyData.usage_count || 0) + 1,
        })
        .eq('id', keyData.id)
    ).then(() => {}, () => {})

    return { valid: true, keyData: keyData as ApiKeyData }
  } catch (err) {
    console.error('[ApiKeyAuth] Validation error:', err)
    return { valid: false, error: 'Internal validation error' }
  }
}

/**
 * Verifier qu'une cle API a le scope requis
 */
export function hasScope(keyData: ApiKeyData, requiredScope: string): boolean {
  // '*' = tous les scopes
  if (keyData.scopes.includes('*')) return true
  // 'write' inclut 'read'
  if (requiredScope === 'read' && keyData.scopes.includes('write')) return true
  return keyData.scopes.includes(requiredScope)
}

// --- CRUD API Keys (admin only) ---

/**
 * Creer une nouvelle cle API
 * Retourne la cle en clair (a afficher une seule fois a l'utilisateur)
 */
export async function createApiKey(params: {
  name: string
  scopes?: string[]
  rate_limit_per_minute?: number
  allowed_ips?: string[]
  expires_in_days?: number
  created_by: string
}): Promise<{ key: string; id: string }> {
  const { key, hash, prefix } = generateApiKey()

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const expiresAt = params.expires_in_days
    ? new Date(Date.now() + params.expires_in_days * 86400_000).toISOString()
    : null

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      name: params.name,
      key_hash: hash,
      key_prefix: prefix,
      scopes: params.scopes || ['read'],
      rate_limit_per_minute: params.rate_limit_per_minute || 60,
      allowed_ips: params.allowed_ips || [],
      expires_at: expiresAt,
      created_by: params.created_by,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create API key: ${error.message}`)

  return { key, id: data.id }
}

/**
 * Revoquer une cle API
 */
export async function revokeApiKey(keyId: string): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)

  if (error) throw new Error(`Failed to revoke API key: ${error.message}`)
}

// --- PII Encryption helpers ---
// AES-256-GCM avec IV unique par operation et cle derivee via PBKDF2
// Format de sortie : iv:authTag:ciphertext (tout en base64)

const PII_SALT = 'dermotec-pii-v1' // Salt fixe pour la derivation de cle
const PII_KEY_ITERATIONS = 100_000  // PBKDF2 iterations (OWASP minimum)

/**
 * Derive une cle AES-256 depuis la passphrase via PBKDF2
 */
function derivePIIKey(passphrase: string): Buffer {
  return pbkdf2Sync(passphrase, PII_SALT, PII_KEY_ITERATIONS, 32, 'sha256')
}

/**
 * Chiffrer un champ PII avant stockage (AES-256-GCM)
 * Genere un IV unique (12 bytes) par operation — jamais de reutilisation d'IV
 * Retourne le format : enc2:iv:authTag:ciphertext (base64)
 */
export function encryptPII(value: string): string {
  const passphrase = process.env.PII_ENCRYPTION_KEY
  if (!passphrase) {
    console.warn('[PII] PII_ENCRYPTION_KEY not set — storing in cleartext')
    return value
  }

  const key = derivePIIKey(passphrase)
  const iv = randomBytes(12) // 12 bytes = taille recommandee pour GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag() // 16 bytes — garantit l'integrite

  // Format : enc2:iv:authTag:ciphertext (prefixe enc2 pour distinguer de l'ancien format XOR)
  return `enc2:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

/**
 * Dechiffrer un champ PII (AES-256-GCM)
 * Supporte aussi l'ancien format enc: (XOR) pour migration progressive
 */
export function decryptPII(value: string): string {
  // Pas chiffre
  if (!value.startsWith('enc')) return value

  const passphrase = process.env.PII_ENCRYPTION_KEY
  if (!passphrase) {
    console.warn('[PII] PII_ENCRYPTION_KEY not set — cannot decrypt')
    return value
  }

  // Ancien format XOR (enc:...) — DEPRECATED, log un warning pour migration
  if (value.startsWith('enc:') && !value.startsWith('enc2:')) {
    console.warn('[PII] DEPRECATED: Ancien format XOR détecté. Re-chiffrer avec encryptPII() pour migrer vers AES-256-GCM.')
    const oldKey = createHash('sha256').update(passphrase).digest()
    const buffer = Buffer.from(value.substring(4), 'base64')
    const decrypted = Buffer.alloc(buffer.length)
    for (let i = 0; i < buffer.length; i++) {
      decrypted[i] = buffer[i] ^ oldKey[i % oldKey.length]
    }
    return decrypted.toString('utf8')
  }

  // Nouveau format AES-256-GCM (enc2:iv:authTag:ciphertext)
  const parts = value.substring(5).split(':') // Enlever "enc2:"
  if (parts.length !== 3) {
    throw new Error('[PII] Format de chiffrement invalide')
  }

  const [ivB64, authTagB64, ciphertextB64] = parts
  const key = derivePIIKey(passphrase)
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const ciphertext = Buffer.from(ciphertextB64, 'base64')

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}
