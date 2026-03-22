import type { Metadata } from 'next'
import { DM_Sans, Bricolage_Grotesque, Heebo, Noto_Sans_SC } from 'next/font/google'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Providers } from './providers'
import CookieConsent from '@/components/ui/CookieConsent'
import { getDirection } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import './globals.css'

// --- Fonts ---
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-heading', display: 'swap' })
const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-hebrew', display: 'swap' })
const notoSansSC = Noto_Sans_SC({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-chinese', display: 'swap' })

export const metadata: Metadata = {
  title: 'CRM Dermotec — Gestion Centre de Formation',
  description: 'CRM complet pour centre de formation esthétique. Gestion leads, inscriptions, financement, sessions, facturation.',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Dermotec CRM' },
  formatDetection: { telephone: false },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale() as Locale
  const messages = await getMessages()
  const dir = getDirection(locale)

  // Font classes — inclure toutes les fonts pour fallback
  const fontClasses = `${dmSans.variable} ${bricolage.variable} ${heebo.variable} ${notoSansSC.variable}`

  return (
    <html lang={locale} dir={dir} className={fontClasses} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.theme==='dark'||(!localStorage.theme&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}` }} />
      </head>
      <body className="antialiased" style={{ fontFamily: locale === 'he' ? 'var(--font-hebrew)' : locale === 'zh' ? 'var(--font-chinese)' : 'var(--font-body)' }}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            <Toaster
              position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'}
              richColors
              closeButton
              toastOptions={{ style: { fontFamily: 'inherit' } }}
            />
          </Providers>
        </NextIntlClientProvider>
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
