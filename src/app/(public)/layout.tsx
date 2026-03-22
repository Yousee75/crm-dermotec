'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/accueil' || pathname === '/'

  // Landing page has its own full-bleed header/footer — render children only
  if (isLandingPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/accueil" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#2EC6F3] flex items-center justify-center">
              <span className="text-white font-bold text-sm font-[family-name:var(--font-heading)]">D</span>
            </div>
            <span className="text-lg font-bold text-[#082545] font-[family-name:var(--font-heading)] group-hover:text-[#2EC6F3] transition-colors">
              Dermotec Advanced
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/formations" className="text-sm text-gray-600 hover:text-[#2EC6F3] transition-colors hidden sm:block">
              Formations
            </Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-[#2EC6F3] transition-colors hidden sm:block">
              Tarifs
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-white bg-[#2EC6F3] hover:bg-[#1ab5e2] rounded-lg px-4 py-2 transition-colors"
            >
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Dermotec Advanced. Tous droits r&eacute;serv&eacute;s.
            </p>
            <nav className="flex items-center gap-6">
              <Link
                href="/mentions-legales"
                className="text-sm text-gray-500 hover:text-[#2EC6F3] transition-colors"
              >
                Mentions l&eacute;gales
              </Link>
              <Link
                href="/politique-confidentialite"
                className="text-sm text-gray-500 hover:text-[#2EC6F3] transition-colors"
              >
                Confidentialit&eacute;
              </Link>
              <Link
                href="/conditions-generales"
                className="text-sm text-gray-500 hover:text-[#2EC6F3] transition-colors"
              >
                CGU / CGV
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
