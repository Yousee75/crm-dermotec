// ============================================================
// CRM DERMOTEC — Upstash Redis (rate limiting distribué + cache)
// Pattern: lazy init + fallback gracieux si non configuré
// ============================================================

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

let _redis: Redis | null = null
let _rateLimitApi: Ratelimit | null = null
let _rateLimitPages: Ratelimit | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.warn('[Upstash] UPSTASH_REDIS_REST_URL/TOKEN manquantes — fallback in-memory')
    return null
  }
  _redis = new Redis({ url, token })
  return _redis
}

/**
 * Rate limiter pour les API routes (10 req/min par IP)
 */
export function getApiRateLimiter(): Ratelimit | null {
  if (_rateLimitApi) return _rateLimitApi
  const redis = getRedis()
  if (!redis) return null
  _rateLimitApi = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    prefix: 'rl:api',
    analytics: true,
  })
  return _rateLimitApi
}

/**
 * Rate limiter pour les pages (30 req/min par IP)
 */
export function getPageRateLimiter(): Ratelimit | null {
  if (_rateLimitPages) return _rateLimitPages
  const redis = getRedis()
  if (!redis) return null
  _rateLimitPages = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    prefix: 'rl:page',
    analytics: true,
  })
  return _rateLimitPages
}

/**
 * Cache simple avec TTL (en secondes)
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    return await redis.get<T>(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.set(key, value, { ex: ttlSeconds })
  } catch (err) {
    console.warn('[Upstash] Cache set failed:', err)
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(key)
  } catch {
    // Silent
  }
}

/**
 * Cache-aside pattern : récupère du cache ou exécute la fonction
 */
export async function cacheThrough<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  const result = await fn()
  await cacheSet(key, result, ttlSeconds)
  return result
}
