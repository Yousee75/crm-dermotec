'use client'

import { UserCheck, Calendar, CreditCard, CheckCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export default function InscriptionsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            <UserCheck className="inline w-7 h-7 mr-3 text-[#0EA5E9]" />
            Inscriptions
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des inscriptions par session avec financement et suivi
          </p>
        </div>
        <Badge variant="info" size="lg">
          En développement
        </Badge>
      </div>

      {/* Stats preview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total inscriptions</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En attente</p>
              <p className="text-2xl font-bold text-amber-600">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Confirmées</p>
              <p className="text-2xl font-bold text-emerald-600">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">CA prévu</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
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
            Gestion complète des inscriptions par session
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Example inscriptions */}
          {[
            {
              apprenant: 'Julie Moreau',
              session: 'Maquillage Permanent - 15-19 Mars',
              montant: '2 490 €',
              financement: 'OPCO EP (80%) + Particulier (20%)',
              statut: 'Confirmée',
              paiement: 'Payé',
              statusColor: 'emerald',
            },
            {
              apprenant: 'Camille Dubois',
              session: 'Microblading - 22-23 Mars',
              montant: '1 400 €',
              financement: 'France Travail (100%)',
              statut: 'En attente',
              paiement: 'En cours',
              statusColor: 'amber',
            },
            {
              apprenant: 'Sarah Martin',
              session: 'Hygiène & Salubrité - 25-27 Mars',
              montant: '400 €',
              financement: 'Particulier (100%)',
              statut: 'Confirmée',
              paiement: 'Acompte versé',
              statusColor: 'blue',
            },
          ].map((inscription, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {inscription.apprenant.split(' ').map(n => n.charAt(0)).join('')}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{inscription.apprenant}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {inscription.session}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{inscription.financement}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900">{inscription.montant}</p>
                  <p className="text-gray-500">{inscription.paiement}</p>
                </div>
                <div className="text-center">
                  <Badge
                    variant={inscription.statusColor === 'emerald' ? 'success' : inscription.statusColor === 'amber' ? 'warning' : 'info'}
                    size="sm"
                  >
                    {inscription.statut}
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
          Fonctionnalités inscriptions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Multi-financement</h4>
              <p className="text-sm text-gray-600">Une inscription = plusieurs financeurs (OPCO + reste à charge)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Workflow automatisé</h4>
              <p className="text-sm text-gray-600">Convocations, conventions, émargement, évaluations</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Suivi paiements</h4>
              <p className="text-sm text-gray-600">Acomptes, échéanciers, rappels automatiques</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Vue par session</h4>
              <p className="text-sm text-gray-600">Gestion groupée des inscriptions d'une même session</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}