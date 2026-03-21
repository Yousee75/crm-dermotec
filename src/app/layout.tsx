import type { Metadata } from 'next'
import { DM_Sans, Bricolage_Grotesque } from 'next/font/google'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers } from './providers'
import CookieConsent from '@/components/ui/CookieConsent'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CRM Dermotec — Gestion Centre de Formation',
  description: 'CRM complet pour centre de formation esthétique. Gestion leads, inscriptions, financement, sessions, facturation.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,         // Permettre le zoom accessibilité (WCAG)
    viewportFit: 'cover',    // Utiliser tout l'écran (encoche iPhone)
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dermotec CRM',
  },
  formatDetection: {
    telephone: false,        // Empêche iOS de transformer les numéros en liens
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${bricolage.variable}`}>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: { fontFamily: 'var(--font-body)' },
            }}
          />
        </Providers>
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
