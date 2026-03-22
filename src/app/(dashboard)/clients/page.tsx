'use client'

import { Building2, Plus, Users, TrendingUp, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export default function ClientsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            <Building2 className="inline w-7 h-7 mr-3 text-[#2EC6F3]" />
            Clients
          </h1>
          <p className="text-gray-600 mt-1">
            Entreprises et instituts qui envoient des apprenants en formation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info" size="lg">
            En développement
          </Badge>
          <button className="flex items-center gap-2 bg-[#2EC6F3] hover:bg-[#0284C7] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau client</span>
          </button>
        </div>
      </div>

      {/* Stats preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total clients</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">CA total généré</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Apprenants envoyés</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Example data preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Aperçu des fonctionnalités
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Voici comment la gestion clients fonctionnera une fois développée
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Example client cards */}
          {[
            {
              name: 'Institut Belle & Bien',
              contact: 'Marie Dubois',
              email: 'marie@bellebien.fr',
              apprenants: 12,
              ca: '15 400 €',
              location: 'Paris 16e',
            },
            {
              name: 'Wellness Spa Network',
              contact: 'Antoine Martin',
              email: 'antoine@wellness-spa.fr',
              apprenants: 8,
              ca: '9 800 €',
              location: 'Lyon',
            },
            {
              name: 'Esthétique Moderne SARL',
              contact: 'Sophie Laurent',
              email: 'contact@esthetique-moderne.com',
              apprenants: 5,
              ca: '6 200 €',
              location: 'Marseille',
            },
          ].map((client, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{client.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{client.contact} • {client.email}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {client.location}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900">{client.apprenants}</p>
                  <p className="text-gray-500">apprenants</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-emerald-600">{client.ca}</p>
                  <p className="text-gray-500">CA généré</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features preview */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Fonctionnalités clients
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Gestion entreprises</h4>
              <p className="text-sm text-gray-600">SIRET, OPCO, convention collective, contact RH</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Suivi des apprenants envoyés</h4>
              <p className="text-sm text-gray-600">Liste des personnes envoyées par chaque client</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Facturation groupée</h4>
              <p className="text-sm text-gray-600">Une facture pour plusieurs apprenants du même client</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Analytics par client</h4>
              <p className="text-sm text-gray-600">CA, satisfaction, fidélité, potentiel de croissance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}