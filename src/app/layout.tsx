import type { Metadata } from 'next'
import { DM_Sans, Bricolage_Grotesque } from 'next/font/google'
import { Toaster } from 'sonner'
import { Providers } from './providers'
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
  icons: { icon: '/favicon.ico' },
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
      </body>
    </html>
  )
}
