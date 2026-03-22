import type { Metadata } from 'next'
import { DM_Sans, Bricolage_Grotesque, Heebo, Noto_Sans_SC } from 'next/font/google'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Providers } from './providers'
import CookieConsent from '@/components/ui/CookieConsent'
import InstallPWAPrompt from '@/components/ui/InstallPWAPrompt'
import { getDirection } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import './globals.css'

// --- Fonts ---
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-heading', display: 'swap' })
const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-hebrew', display: 'swap' })
const notoSansSC = Noto_Sans_SC({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-chinese', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://crm-dermotec.vercel.app'),
  title: {
    default: 'Dermotec Advanced — Centre de Formation Esthetique Certifie Qualiopi | Paris',
    template: '%s | Dermotec Advanced',
  },
  description: 'CRM et centre de formation esthetique certifie Qualiopi a Paris. 20+ formations professionnelles, financement OPCO/CPF, gestion leads et inscriptions.',
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
  openGraph: {
    title: 'Dermotec Advanced — Centre de Formation Esthetique Certifie Qualiopi',
    description: 'Formations esthetique professionnelles certifiees Qualiopi a Paris. Financement OPCO, CPF, France Travail. +500 stagiaires formees.',
    url: 'https://crm-dermotec.vercel.app',
    siteName: 'Dermotec Advanced',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dermotec Advanced — Formation Esthetique Certifiee Qualiopi',
    description: 'Formations esthetique professionnelles certifiees Qualiopi a Paris. Financement OPCO, CPF, France Travail.',
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2EC6F3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        {/* Dark mode SUPPRIMÉ — palette Satorea light only. Nettoyage au chargement. */}
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.classList.remove('dark');localStorage.removeItem('theme')}catch(e){}` }} />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}` }} />
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
        <InstallPWAPrompt />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
