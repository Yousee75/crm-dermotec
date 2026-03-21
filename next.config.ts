import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Security
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

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
    ],
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
  ],
}

export default nextConfig
