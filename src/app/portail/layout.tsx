import { headers } from 'next/headers'
import { Phone, Mail, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PortailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await headers()
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-heading font-bold text-primary">
                Dermotec Advanced
              </h1>
            </div>

            {/* Navigation info */}
            <div className="hidden md:flex items-center space-x-6 text-sm text-text-secondary">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>75 Bd Richard Lenoir, Paris 11e</span>
              </div>
              <div className="flex items-center space-x-1">
                <Phone className="h-4 w-4" />
                <span>01 43 57 86 79</span>
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
      <footer className="bg-accent text-text-inverse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">Contact</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>01 43 57 86 79</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>contact@dermotec-advanced.fr</span>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span>75 Boulevard Richard Lenoir<br />75011 Paris</span>
                </div>
              </div>
            </div>

            {/* Formations */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">Formations</h3>
              <ul className="space-y-1 text-sm">
                <li>Dermo-Esthétique</li>
                <li>Dermo-Correctrice</li>
                <li>Soins Visage Avancés</li>
                <li>Laser & IPL</li>
                <li>Soins Corps</li>
              </ul>
            </div>

            {/* Certification */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">Certification</h3>
              <p className="text-sm">
                Centre de formation certifié Qualiopi
                <br />
                Formations éligibles OPCO, CPF, France Travail
              </p>
            </div>
          </div>

          <div className="border-t border-accent-light mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 Dermotec Advanced. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}