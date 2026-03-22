import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Security — Protection code propriétaire
  poweredByHeader: false,
  productionBrowserSourceMaps: false, // JAMAIS de source maps en prod

  serverExternalPackages: ['@react-pdf/renderer'],

  // Images — AVIF en priorite, WebP fallback, cache 1 an
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      { protocol: 'https', hostname: 'wtbrdxijvtelluwfmgsf.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  // Performance
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    // reactCompiler: true, // Necessite babel-plugin-react-compiler (npm install babel-plugin-react-compiler)
    optimizePackageImports: [
      'lucide-react', 'recharts', 'date-fns', 'framer-motion',
      '@tanstack/react-query', 'sonner', '@supabase/ssr', 'cmdk',
      'react-hook-form', 'zod', '@dnd-kit/core', '@dnd-kit/sortable',
      '@supabase/supabase-js', 'react-day-picker',
    ],
  },

  // Webpack — Obfuscation légère du code propriétaire (prod client-side only)
  webpack: (config, { isServer, dev }) => {
    if (dev || isServer) return config
    try {
      const WebpackObfuscator = require('webpack-obfuscator')
      config.plugins.push(
        new WebpackObfuscator({
          compact: true,
          controlFlowFlattening: false,
          deadCodeInjection: false,
          identifierNamesGenerator: 'hexadecimal',
          renameGlobals: false,
          selfDefending: false,
          stringArray: true,
          stringArrayEncoding: ['none'],
          stringArrayThreshold: 0.3,
          transformObjectKeys: false,
          unicodeEscapeSequence: false,
          debugProtection: false,
          disableConsoleOutput: false,
        }, ['**/node_modules/**'])
      )
    } catch {
      // webpack-obfuscator pas installé — skip
    }
    return config
  },

  // Security headers + cache assets statiques
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
      ],
    },
    {
      source: '/images/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/fonts/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      // Réponses enrichment = pas de cache, pas d'indexation
      source: '/api/enrichment/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow, nosnippet, noarchive' },
      ],
    },
  ],
}

export default withNextIntl(nextConfig)
