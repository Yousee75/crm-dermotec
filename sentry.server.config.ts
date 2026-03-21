// ============================================================
// Sentry — Server-side configuration
// ============================================================

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring (server)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Ne pas envoyer en dev si pas de DSN
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),

  // Tags
  initialScope: {
    tags: {
      app: 'crm-dermotec',
      runtime: 'node',
    },
  },
})
