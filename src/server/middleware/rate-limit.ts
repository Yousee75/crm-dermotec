// ============================================================
// Middleware Hono — Rate Limiting via @upstash/ratelimit
// ============================================================

import { createMiddleware } from 'hono/factory'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { HTTPException } from 'hono/http-exception'

type RateLimitOptions = {
  /** Requetes autorisees par fenetre */
  requests: number
  /** Fenetre (ex: '10 s', '1 m', '1 h') */
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
  /** Prefixe Redis (defaut: '@crm/ratelimit') */
  prefix?: string
  /** Fonction pour extraire l'identifiant (defaut: IP) */
  identifier?: (c: { req: { header: (name: string) => string | undefined } }) => string
}

/**
 * Middleware rate limiting Upstash.
 *
 * Usage:
 *   app.use('/api/*', rateLimiter({ requests: 30, window: '1 m' }))
 *   app.use('/api/email/*', rateLimiter({ requests: 5, window: '1 m', prefix: '@crm/email' }))
 */
export const rateLimiter = (opts: RateLimitOptions) => {
  // Lazy init — ne crash pas si env vars manquantes au build
  let ratelimit: Ratelimit | null = null

  const getRatelimit = () => {
    if (ratelimit) return ratelimit

    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      console.warn('[RateLimit] UPSTASH_REDIS_REST_URL ou TOKEN manquant — bypass')
      return null
    }

    ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(opts.requests, opts.window),
      prefix: opts.prefix ?? '@crm/ratelimit',
      analytics: true,
    })

    return ratelimit
  }

  return createMiddleware(async (c, next) => {
    const rl = getRatelimit()

    // Si pas configure, laisser passer (dev local sans Redis)
    if (!rl) {
      await next()
      return
    }

    const id =
      opts.identifier?.(c) ??
      c.req.header('x-forwarded-for') ??
      c.req.header('x-real-ip') ??
      'anonymous'

    const { success, limit, remaining, reset } = await rl.limit(id)

    // Headers informatifs
    c.header('X-RateLimit-Limit', String(limit))
    c.header('X-RateLimit-Remaining', String(remaining))
    c.header('X-RateLimit-Reset', String(reset))

    if (!success) {
      throw new HTTPException(429, {
        message: 'Trop de requetes. Reessayez plus tard.',
      })
    }

    await next()
  })
}
