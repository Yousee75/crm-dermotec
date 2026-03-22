import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm font-[family-name:var(--font-heading)]">D</span>
            </div>
            <span className="text-lg font-bold text-accent font-[family-name:var(--font-heading)] group-hover:text-primary transition-colors">
              Dermotec Advanced
            </span>
          </Link>
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
              &copy; {new Date().getFullYear()} Dermotec Advanced. Tous droits réservés.
            </p>
            <nav className="flex items-center gap-6">
              <Link
                href="/mentions-legales"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                Mentions légales
              </Link>
              <Link
                href="/politique-confidentialite"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link
                href="/conditions-generales"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
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
