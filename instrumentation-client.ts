// ============================================================
// Sentry — Client instrumentation (Next.js 15 recommended pattern)
// ============================================================

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance: 100% en dev, 10% en prod
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay (erreurs seulement en prod)
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,

  // Filtrer les erreurs bruit
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'Load failed',
    'Failed to fetch',
    'ChunkLoadError',
    'Network request failed',
  ],

  // Ne pas envoyer en dev si pas de DSN
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  debug: false,
})

// Capturer les transitions de route (Next.js App Router)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
