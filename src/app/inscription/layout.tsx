import { headers } from 'next/headers'

// Force dynamic rendering pour toutes les pages d'inscription
export const dynamic = 'force-dynamic'

export default async function InscriptionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Force dynamic rendering
  await headers()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-[#2EC6F3]">
                Dermotec Advanced
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                On vous forme. On vous équipe. On vous lance.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Centre de Formation Esthétique Certifié Qualiopi
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#082545] text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Dermotec Advanced</h3>
              <p className="text-gray-300 text-sm">
                Centre de formation esthétique certifié Qualiopi et distributeur NPM France.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div>75 Bd Richard Lenoir, Paris 11e</div>
                <div>01 88 33 43 43</div>
                <div>dermotec.fr@gmail.com</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Formations</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Dermo-Esthétique</li>
                <li>Soins Visage</li>
                <li>Laser et IPL</li>
                <li>Hygiène</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2026 Dermotec Advanced. Tous droits réservés. | Certifié Qualiopi
          </div>
        </div>
      </footer>
    </div>
  )
}
