// ============================================================
// CRM SATOREA — Code Protection Layer
// 7 couches de protection pour le code propriétaire
//
// COUCHE 1 : Proxy opaque (enrichment-proxy.ts)
// COUCHE 2 : Obfuscation webpack (next.config.ts)
// COUCHE 3 : server-only imports (ce fichier)
// COUCHE 4 : Chiffrement réponses inter-services (AES-256-GCM)
// COUCHE 5 : HMAC signature des requêtes internes
// COUCHE 6 : Anti-debug / détection reverse engineering
// COUCHE 7 : Rate limiting + monitoring anomalies
// ============================================================

import 'server-only' // BLOQUE l'import côté client — erreur de build

import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'

// ============================================================
// COUCHE 4 : Chiffrement AES-256-GCM inter-services
// ============================================================

const ALGO = 'aes-256-gcm'
const KEY_ENV = 'ENRICHMENT_ENCRYPTION_KEY' // 32 bytes hex dans env

function getEncryptionKey(): Buffer {
  const hex = process.env[KEY_ENV]
  if (!hex || hex.length < 64) {
    // Générer une clé éphémère si pas configurée (dev)
    return randomBytes(32)
  }
  return Buffer.from(hex, 'hex')
}

/** Chiffre des données pour transmission inter-services */
export function encryptPayload(data: any): string {
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGO, key, iv)

  const json = JSON.stringify(data)
  let encrypted = cipher.update(json, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')

  // Format : iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/** Déchiffre des données reçues d'un service interne */
export function decryptPayload<T = any>(payload: string): T | null {
  try {
    const key = getEncryptionKey()
    const [ivHex, authTagHex, encrypted] = payload.split(':')

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return JSON.parse(decrypted) as T
  } catch {
    return null
  }
}

// ============================================================
// COUCHE 5 : HMAC signature des requêtes internes
// ============================================================

const HMAC_SECRET_ENV = 'ENRICHMENT_HMAC_SECRET'

function getHmacSecret(): string {
  return process.env[HMAC_SECRET_ENV] || 'dev-hmac-secret-change-in-prod'
}

/** Signe un payload avec HMAC-SHA256 */
export function signPayload(payload: string, timestamp: number): string {
  const message = `${timestamp}.${payload}`
  return createHmac('sha256', getHmacSecret())
    .update(message)
    .digest('hex')
}

/** Vérifie la signature HMAC d'une requête */
export function verifySignature(
  payload: string,
  timestamp: number,
  signature: string,
  maxAgeMs: number = 300_000 // 5 minutes
): boolean {
  // Vérifier fraîcheur (anti-replay)
  const age = Date.now() - timestamp
  if (age > maxAgeMs || age < -30_000) return false

  // Vérifier signature
  const expected = signPayload(payload, timestamp)

  // Comparaison à temps constant (anti-timing attack)
  if (expected.length !== signature.length) return false

  let result = 0
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return result === 0
}

// ============================================================
// COUCHE 6 : Anti-debug / détection reverse engineering
// ============================================================

/** Headers de sécurité pour les réponses enrichment */
export const ENRICHMENT_SECURITY_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive',
  // Pas de CORS sur les routes enrichment internes
  'Access-Control-Allow-Origin': '',
} as const

/** Détecte les patterns d'appels suspects (brute force / scraping) */
export function detectSuspiciousPattern(
  requestLog: Array<{ timestamp: number; ip: string; endpoint: string }>
): { suspicious: boolean; reason?: string } {
  if (requestLog.length < 5) return { suspicious: false }

  const now = Date.now()
  const recent = requestLog.filter(r => now - r.timestamp < 60_000)

  // Plus de 20 appels enrichment en 1 minute = suspect
  if (recent.length > 20) {
    return { suspicious: true, reason: 'rate_exceeded' }
  }

  // Même IP fait des appels séquentiels rapides (< 500ms entre chaque)
  const sorted = recent.sort((a, b) => a.timestamp - b.timestamp)
  let rapidCount = 0
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].timestamp - sorted[i - 1].timestamp < 500) {
      rapidCount++
    }
  }
  if (rapidCount > 5) {
    return { suspicious: true, reason: 'automated_pattern' }
  }

  // Appels à des endpoints variés en séquence rapide (scan)
  const uniqueEndpoints = new Set(recent.map(r => r.endpoint))
  if (uniqueEndpoints.size > 8 && recent.length > 10) {
    return { suspicious: true, reason: 'endpoint_scanning' }
  }

  return { suspicious: false }
}

// ============================================================
// COUCHE 7 : Protection des fichiers sensibles
// ============================================================

/** Liste des fichiers qui ne doivent JAMAIS être accessibles publiquement */
export const PROTECTED_PATHS = [
  '/enrichment',
  '/competitor',
  '/scraper',
  '/scoring',
  '/social-discovery',
  '/neighborhood',
  '/sirene',
  '/pappers',
] as const

/** Vérifie qu'une route API enrichment est appelée avec les bons credentials */
export function validateInternalRequest(headers: Headers): {
  valid: boolean
  error?: string
} {
  // En dev, on est plus permissif
  if (process.env.NODE_ENV === 'development') return { valid: true }

  const apiKey = headers.get('x-enrichment-key')
  const expectedKey = process.env.ENRICHMENT_API_KEY

  if (!expectedKey) {
    // Pas de clé configurée = pas de microservice séparé = OK
    return { valid: true }
  }

  if (!apiKey) {
    return { valid: false, error: 'Missing authentication' }
  }

  // Comparaison à temps constant
  if (apiKey.length !== expectedKey.length) {
    return { valid: false, error: 'Invalid authentication' }
  }

  let result = 0
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.charCodeAt(i) ^ expectedKey.charCodeAt(i)
  }

  if (result !== 0) {
    return { valid: false, error: 'Invalid authentication' }
  }

  return { valid: true }
}

// ============================================================
// UTILITY : Générer des clés de sécurité
// ============================================================

/** Génère une clé d'encryption (32 bytes = 64 hex chars) */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex')
}

/** Génère une clé HMAC */
export function generateHmacSecret(): string {
  return randomBytes(32).toString('hex')
}

/** Génère une clé API pour le microservice */
export function generateApiKey(): string {
  return `stea_${randomBytes(24).toString('hex')}`
}
