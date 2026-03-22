'use client'

import { GraduationCap, Star, Award, TrendingUp, Building } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export default function ApprenantsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            <GraduationCap className="inline w-7 h-7 mr-3 text-[#2EC6F3]" />
            Apprenants
          </h1>
          <p className="text-gray-600 mt-1">
            Personnes physiques qui suivent vos formations
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
              <p className="text-sm text-gray-600 mb-1">Total apprenants</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En formation</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Certifiés</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">NPS moyen</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
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
            Voici comment la gestion des apprenants fonctionnera
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Example apprenants */}
          {[
            {
              name: 'Julie Moreau',
              email: 'julie.moreau@gmail.com',
              client: 'Institut Belle & Bien',
              formation: 'Maquillage Permanent',
              statut: 'En formation',
              nps: 9,
              certificats: 2,
            },
            {
              name: 'Camille Dubois',
              email: 'camille.d@wellness-spa.fr',
              client: 'Wellness Spa Network',
              formation: 'Microblading',
              statut: 'Certifiée',
              nps: 10,
              certificats: 3,
            },
            {
              name: 'Sarah Martin',
              email: 'sarah.martin@hotmail.fr',
              client: 'Particulier',
              formation: 'Hygiène & Salubrité',
              statut: 'Complétée',
              nps: 8,
              certificats: 1,
            },
          ].map((apprenant, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {apprenant.name.split(' ').map(n => n.charAt(0)).join('')}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{apprenant.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{apprenant.email}</span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {apprenant.client}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900">{apprenant.formation}</p>
                  <p className="text-gray-500">{apprenant.statut}</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">{apprenant.certificats}</p>
                  <p className="text-gray-500">certificats</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-emerald-600">NPS {apprenant.nps}/10</p>
                  <div className="flex items-center gap-1 justify-center">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`w-3 h-3 ${j < Math.round(apprenant.nps / 2) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features preview */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Fonctionnalités apprenants
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Profil individuel complet</h4>
              <p className="text-sm text-gray-600">Identité, niveau, objectifs, historique formations</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Suivi post-formation</h4>
              <p className="text-sm text-gray-600">NPS, avis Google, témoignages, lancement activité</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Certificats et diplômes</h4>
              <p className="text-sm text-gray-600">Gestion automatisée des attestations et certifications</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Lien avec le client payeur</h4>
              <p className="text-sm text-gray-600">Connexion automatique avec l'entreprise qui finance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}