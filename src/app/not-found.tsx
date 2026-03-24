import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-primary">404</span>
        </div>
        <h1
          className="text-2xl font-bold text-accent mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Page introuvable
        </h1>
        <p className="text-[#777777] mb-6 max-w-md">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition"
        >
          Retour au dashboard
        </Link>
      </div>
    </div>
  )
}
