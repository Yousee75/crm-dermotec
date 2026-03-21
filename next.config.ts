import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Skip ESLint during builds (run separately, plugin @typescript-eslint not installed)
  eslint: { ignoreDuringBuilds: true },

  // Security
  poweredByHeader: false,

  // Exclure react-pdf du bundle serveur (conflit Html avec next/document en SSG)
  serverExternalPackages: ['@react-pdf/renderer'],

  // Images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'wtbrdxijvtelluwfmgsf.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  // Performance
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    optimizePackageImports: [
      'lucide-react', 'recharts', 'date-fns', 'framer-motion',
      '@tanstack/react-query', 'sonner', '@supabase/ssr', 'cmdk',
    ],
  },


  // Security headers
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
  ],
}

export default nextConfig
