// ============================================================
// CRM DERMOTEC — Rate Limiting granulaire par endpoint
// Utilise Upstash Redis (Edge Runtime compatible)
// ============================================================

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}

// Cache les instances de rate limiter
const _limiters = new Map<string, Ratelimit>()

function getLimiter(prefix: string, requests: number, window: string): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null

  const key = `${prefix}:${requests}:${window}`
  if (_limiters.has(key)) return _limiters.get(key)!

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as `${number} ${'s' | 'm' | 'h' | 'd'}`),
    prefix: `@crm/${prefix}`,
    analytics: true,
  })

  _limiters.set(key, limiter)
  return limiter
}

// ===== Limiters par catégorie =====

export const rateLimits = {
  /** Auth : 5 tentatives par 15 minutes (anti-brute force) */
  auth: (identifier: string) => getLimiter('auth', 5, '15 m')?.limit(identifier),

  /** API générale : 60 requêtes par minute */
  api: (identifier: string) => getLimiter('api', 60, '1 m')?.limit(identifier),

  /** AI agent : 3 requêtes par minute (coûteux) */
  ai: (identifier: string) => getLimiter('ai', 3, '1 m')?.limit(identifier),

  /** Email : 5 envois par minute */
  email: (identifier: string) => getLimiter('email', 5, '1 m')?.limit(identifier),

  /** Export CSV/PDF : 1 par heure */
  export: (identifier: string) => getLimiter('export', 1, '1 h')?.limit(identifier),

  /** Webhook formulaire : 10 par minute par IP */
  webhook: (identifier: string) => getLimiter('webhook', 10, '1 m')?.limit(identifier),

  /** Création lead : 20 par heure */
  leadCreate: (identifier: string) => getLimiter('lead-create', 20, '1 h')?.limit(identifier),

  /** Upload fichier : 10 par heure */
  upload: (identifier: string) => getLimiter('upload', 10, '1 h')?.limit(identifier),
}

/**
 * Helper pour appliquer un rate limit dans une API route
 * Retourne une Response 429 si la limite est atteinte, null sinon
 */
export async function checkRateLimit(
  category: keyof typeof rateLimits,
  identifier: string
): Promise<Response | null> {
  const result = await rateLimits[category](identifier)

  // Si Upstash n'est pas configuré, laisser passer (graceful degradation)
  if (!result) return null

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Trop de requêtes. Réessayez plus tard.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.reset),
        },
      }
    )
  }

  return null
}

/**
 * Log un événement de sécurité (brute force, rate limit exceeded)
 */
export async function logSecurityEvent(
  type: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    console.warn('[Security]', type, metadata)
    return
  }

  // Stocker dans Redis pour analyse (expire après 7 jours)
  const key = `security:${type}:${Date.now()}`
  await redis.set(key, JSON.stringify({ type, ...metadata, timestamp: new Date().toISOString() }), { ex: 7 * 24 * 3600 })

  // Aussi log en console pour Sentry/Vercel Logs
  console.warn(`[SECURITY] ${type}:`, JSON.stringify(metadata))
}
