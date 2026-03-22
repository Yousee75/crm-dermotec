'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Crown, Check, X, Users, Calendar, CreditCard, Zap, Star } from 'lucide-react'

// Mock data pour le plan actuel
const PLAN_ACTUEL = {
  nom: 'Pro',
  prix_mensuel: 49,
  prix_annuel: 490,
  facturation: 'mensuelle', // mensuelle ou annuelle
  date_souscription: '2024-01-15T00:00:00Z',
  prochaine_facturation: '2024-04-15T00:00:00Z',
  utilisateurs_max: 5,
  utilisateurs_actuels: 3,
  sessions_max: 50,
  sessions_utilisees: 24,
  storage_max: 10, // GB
  storage_utilise: 3.2 // GB
}

const PLANS = [
  {
    id: 'starter',
    nom: 'Starter',
    description: 'Pour débuter dans la formation',
    prix_mensuel: 19,
    prix_annuel: 190,
    populaire: false,
    features: [
      { nom: '2 utilisateurs', inclus: true },
      { nom: '20 sessions/mois', inclus: true },
      { nom: '5 GB stockage', inclus: true },
      { nom: 'Support email', inclus: true },
      { nom: 'Analytics de base', inclus: true },
      { nom: 'Gamification', inclus: false },
      { nom: 'IA Coaching', inclus: false },
      { nom: 'API accès', inclus: false }
    ]
  },
  {
    id: 'pro',
    nom: 'Pro',
    description: 'Pour les centres en croissance',
    prix_mensuel: 49,
    prix_annuel: 490,
    populaire: true,
    features: [
      { nom: '5 utilisateurs', inclus: true },
      { nom: '50 sessions/mois', inclus: true },
      { nom: '10 GB stockage', inclus: true },
      { nom: 'Support prioritaire', inclus: true },
      { nom: 'Analytics avancées', inclus: true },
      { nom: 'Gamification', inclus: true },
      { nom: 'IA Coaching', inclus: true },
      { nom: 'API accès', inclus: false }
    ]
  },
  {
    id: 'enterprise',
    nom: 'Enterprise',
    description: 'Pour les grandes organisations',
    prix_mensuel: 99,
    prix_annuel: 990,
    populaire: false,
    features: [
      { nom: 'Utilisateurs illimités', inclus: true },
      { nom: 'Sessions illimitées', inclus: true },
      { nom: '50 GB stockage', inclus: true },
      { nom: 'Support 24/7', inclus: true },
      { nom: 'Analytics expert', inclus: true },
      { nom: 'Gamification', inclus: true },
      { nom: 'IA Coaching', inclus: true },
      { nom: 'API complète', inclus: true }
    ]
  }
]

export default function PlanTab() {
  const t = useTranslations('plan')

  const planActuel = PLANS.find(p => p.id === 'pro') || PLANS[1]
  const economieAnnuelle = planActuel.prix_mensuel * 12 - planActuel.prix_annuel

  return (
    <div className="space-y-6">
      {/* Plan actuel */}
      <Card className="p-6 border-primary bg-gradient-to-r from-primary/5 to-blue-50/30">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Plan {PLAN_ACTUEL.nom}</h3>
                <p className="text-sm text-gray-600">
                  {PLAN_ACTUEL.prix_mensuel}€/mois •
                  Prochaine facturation le {new Date(PLAN_ACTUEL.prochaine_facturation).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">Modifier</Button>
            <Button size="sm" variant="outline">Factures</Button>
          </div>
        </div>

        {/* Utilisation */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Utilisateurs</span>
              <span className="font-medium">{PLAN_ACTUEL.utilisateurs_actuels}/{PLAN_ACTUEL.utilisateurs_max}</span>
            </div>
            <ProgressBar
              value={(PLAN_ACTUEL.utilisateurs_actuels / PLAN_ACTUEL.utilisateurs_max) * 100}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sessions</span>
              <span className="font-medium">{PLAN_ACTUEL.sessions_utilisees}/{PLAN_ACTUEL.sessions_max}</span>
            </div>
            <ProgressBar
              value={(PLAN_ACTUEL.sessions_utilisees / PLAN_ACTUEL.sessions_max) * 100}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Stockage</span>
              <span className="font-medium">{PLAN_ACTUEL.storage_utilise}/{PLAN_ACTUEL.storage_max} GB</span>
            </div>
            <ProgressBar
              value={(PLAN_ACTUEL.storage_utilise / PLAN_ACTUEL.storage_max) * 100}
              className="h-2"
            />
          </div>
        </div>
      </Card>

      {/* Toggle facturation */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button className="px-4 py-2 text-sm font-medium rounded-md text-gray-500">
            Mensuel
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm">
            Annuel
            <Badge variant="success" size="xs" className="ml-2">-17%</Badge>
          </button>
        </div>
      </div>

      {/* Grille des plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const estPlanActuel = plan.id === 'pro'

          return (
            <Card key={plan.id} className={`p-6 relative ${plan.populaire ? 'border-primary shadow-lg' : ''} ${estPlanActuel ? 'ring-2 ring-primary' : ''}`}>
              {plan.populaire && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="primary" className="bg-primary">
                    <Star className="w-3 h-3 mr-1" />
                    Populaire
                  </Badge>
                </div>
              )}

              {estPlanActuel && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="success">Plan actuel</Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.nom}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-900">
                    {plan.prix_annuel / 12}€
                    <span className="text-lg font-normal text-gray-500">/mois</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Facturé {plan.prix_annuel}€/an • Économie de {plan.prix_mensuel * 12 - plan.prix_annuel}€
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {feature.inclus ? (
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <span className={`text-sm ${feature.inclus ? 'text-gray-900' : 'text-gray-500'}`}>
                      {feature.nom}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                variant={estPlanActuel ? 'outline' : plan.populaire ? 'default' : 'outline'}
                disabled={estPlanActuel}
              >
                {estPlanActuel ? 'Plan actuel' : 'Choisir ce plan'}
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Fonctionnalités détaillées */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Comparaison détaillée</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Fonctionnalité</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Starter</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Pro</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">Utilisateurs</td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">2</td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">5</td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">Illimités</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">Sessions/mois</td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">20</td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">50</td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">Illimitées</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">Stockage</td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">5 GB</td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">10 GB</td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">50 GB</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">IA Coaching</td>
                <td className="py-3 px-4 text-center"><X className="w-4 h-4 text-gray-400 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-green-600 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">API accès</td>
                <td className="py-3 px-4 text-center"><X className="w-4 h-4 text-gray-400 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><X className="w-4 h-4 text-gray-400 mx-auto" /></td>
                <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-green-600 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Support et contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Support inclus</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Documentation complète</li>
            <li>• Support par email (réponse sous 24h)</li>
            <li>• Webinaires de formation mensuels</li>
            <li>• Base de connaissances mise à jour</li>
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Besoin d'aide ?</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Notre équipe est là pour vous accompagner dans votre choix.
          </p>
          <Button variant="outline" className="w-full">
            Contacter un conseiller
          </Button>
        </Card>
      </div>
    </div>
  )
}