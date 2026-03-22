'use client'

import { Receipt, Download, Plus, TrendingUp, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export default function FacturationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            <Receipt className="inline w-7 h-7 mr-3 text-[#2EC6F3]" />
            Facturation
          </h1>
          <p className="text-gray-600 mt-1">
            Devis, factures, exports comptables et suivi des paiements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info" size="lg">
            En développement
          </Badge>
          <button className="flex items-center gap-2 bg-[#2EC6F3] hover:bg-[#0284C7] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle facture</span>
          </button>
        </div>
      </div>

      {/* Stats preview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">CA ce mois</p>
              <p className="text-2xl font-bold text-emerald-600">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Factures émises</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En attente de paiement</p>
              <p className="text-2xl font-bold text-amber-600">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Exports comptables</p>
              <p className="text-2xl font-bold text-purple-600">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Features cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Multi-financement */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Multi-financement
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Facturez plusieurs financeurs pour une même inscription (OPCO 80% + stagiaire 20%)
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Bientôt disponible</span>
          </div>
        </div>

        {/* Exports comptables */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
            <Download className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Exports comptables
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Formats CEGID, Sage, FEC pour votre expert-comptable
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Bientôt disponible</span>
          </div>
        </div>

        {/* Facturation échelonnée */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Facturation échelonnée
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Facturez selon l'avancement : 50% à l'inscription, 50% en fin de formation
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Bientôt disponible</span>
          </div>
        </div>
      </div>

      {/* Example data preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Aperçu des factures
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Voici comment la gestion de facturation fonctionnera
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Example factures */}
          {[
            {
              numero: 'FACT-2026-001',
              client: 'Institut Belle & Bien',
              formation: 'Maquillage Permanent - Julie Moreau',
              montant: '1 992,00 €',
              statut: 'Payée',
              date: '15 mars 2026',
              statusColor: 'emerald',
            },
            {
              numero: 'FACT-2026-002',
              client: 'OPCO EP',
              formation: 'Microblading - Camille Dubois',
              montant: '1 120,00 €',
              statut: 'En attente',
              date: '18 mars 2026',
              statusColor: 'amber',
            },
            {
              numero: 'DEVIS-2026-015',
              client: 'Wellness Spa Network',
              formation: 'Formation groupe (5 personnes)',
              montant: '4 500,00 €',
              statut: 'Devis',
              date: '20 mars 2026',
              statusColor: 'blue',
            },
          ].map((facture, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white font-bold text-sm">
                  {facture.numero.includes('FACT') ? 'F' : 'D'}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{facture.numero}</h4>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{facture.client}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{facture.formation}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900">{facture.montant}</p>
                  <p className="text-gray-500">{facture.date}</p>
                </div>
                <div className="text-center">
                  <Badge
                    variant={facture.statusColor === 'emerald' ? 'success' : facture.statusColor === 'amber' ? 'warning' : 'info'}
                    size="sm"
                  >
                    {facture.statut}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features preview */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Fonctionnalités avancées
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">TVA avancée</h4>
              <p className="text-sm text-gray-600">Exonération art. 261.4.4° CGI, gestion multi-taux</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Numérotation séquentielle</h4>
              <p className="text-sm text-gray-600">Conforme aux obligations comptables françaises</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Templates personnalisables</h4>
              <p className="text-sm text-gray-600">Adaptez le design à votre charte graphique</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Relances automatiques</h4>
              <p className="text-sm text-gray-600">Emails de rappel selon l'échéance de paiement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}