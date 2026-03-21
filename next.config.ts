import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // Security
  poweredByHeader: false,

  // Images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'wtbrdxijvtelluwfmgsf.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  // Exclure @react-pdf/renderer du bundle serveur (conflit Html avec next/document)
  serverExternalPackages: ['@react-pdf/renderer'],

  // Performance
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns', 'framer-motion'],
    // Sentry tracing dans App Router
    clientTraceMetadata: ['sentry-trace', 'baggage'],
  },

  // Security headers
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '0' }, // Désactivé en faveur de CSP nonce
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      ],
    },
    // Cache static assets
    {
      source: '/images/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],
}

// Sentry wrapping — ne rien faire si pas de DSN configuré
const sentryConfig = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.SENTRY_AUTH_TOKEN, // Silencieux si pas configuré
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
  // Route Sentry via le serveur pour contourner les ad-blockers
  tunnelRoute: '/monitoring',
  // Supprimer les source maps après upload
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
}

const configWithAnalyzer = withBundleAnalyzer(nextConfig)

export default process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(configWithAnalyzer, sentryConfig)
  : configWithAnalyzer
