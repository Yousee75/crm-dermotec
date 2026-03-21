import type { NextConfig } from 'next'

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
  },

  // Security headers
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
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

export default nextConfig
