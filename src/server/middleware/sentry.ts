// ============================================================
// Middleware Hono — Error Handling + Sentry
// ============================================================

import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import * as Sentry from '@sentry/node'

/**
 * Initialiser Sentry une seule fois au demarrage.
 * Appeler cette fonction dans le fichier principal (index.ts).
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    console.warn('[Sentry] SENTRY_DSN manquant — monitoring desactive')
    return
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    integrations: [
      // Node.js auto-instrumentations
      Sentry.httpIntegration(),
    ],
  })
}

/**
 * Middleware qui capture les erreurs et les envoie a Sentry.
 * Enrichit le scope avec les infos de la requete.
 *
 * Usage: app.use('*', sentryMiddleware())
 */
export const sentryMiddleware = () =>
  createMiddleware(async (c, next) => {
    try {
      await next()
    } catch (err) {
      // Enrichir le scope Sentry
      Sentry.withScope((scope) => {
        scope.setTag('url', c.req.url)
        scope.setTag('method', c.req.method)
        scope.setExtra('headers', Object.fromEntries(c.req.raw.headers))

        // Si l'auth middleware a deja tourne, on a le user
        try {
          const userId = c.get('userId' as never)
          if (userId) scope.setUser({ id: userId as string })
        } catch {
          // pas d'user dans le contexte — ok
        }

        Sentry.captureException(err)
      })

      throw err // re-throw pour que le onError de Hono reponde
    }
  })

/**
 * Handler onError global pour Hono.
 * Retourne une reponse JSON propre + log Sentry.
 *
 * Usage: const app = new Hono({ ... })
 *        app.onError(onErrorHandler)
 */
export function onErrorHandler(err: Error, c: Context) {
  console.error(`[API Error] ${c.req.method} ${c.req.url}:`, err)

  // HTTPException de Hono = erreurs controlees (401, 403, 404, 422, 429)
  const status = 'status' in err ? (err as { status: number }).status : 500
  const message =
    status >= 500 ? 'Erreur interne du serveur' : err.message

  // Ne capturer dans Sentry que les 5xx
  if (status >= 500) {
    Sentry.captureException(err)
  }

  return c.json(
    {
      error: message,
      status,
      ...(process.env.NODE_ENV !== 'production' && {
        stack: err.stack,
      }),
    },
    status as 500
  )
}
