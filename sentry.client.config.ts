// ============================================================
// Sentry — Client-side configuration
// ============================================================

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Session replay (10% sessions, 100% sur erreur)
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,

  // Environment
  environment: process.env.NODE_ENV,

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

  // Tags métier
  initialScope: {
    tags: {
      app: 'crm-dermotec',
    },
  },
})
