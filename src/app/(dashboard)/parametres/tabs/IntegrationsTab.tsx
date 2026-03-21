'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Calendar, Zap, CreditCard, Mail, MessageSquare, Globe,
  Settings, ExternalLink, CheckCircle, Clock, AlertCircle
} from 'lucide-react'

// Intégrations disponibles
const INTEGRATIONS = [
  {
    id: 'google-calendar',
    nom: 'Google Calendar',
    description: 'Synchronisation des sessions de formation avec Google Calendar',
    icon: Calendar,
    categorie: 'Productivité',
    statut: 'disponible',
    connecte: false,
    populaire: true,
    setup_difficulty: 'Facile'
  },
  {
    id: 'stripe',
    nom: 'Stripe',
    description: 'Paiements en ligne sécurisés pour vos formations',
    icon: CreditCard,
    categorie: 'Paiement',
    statut: 'disponible',
    connecte: true,
    populaire: true,
    setup_difficulty: 'Facile'
  },
  {
    id: 'zapier',
    nom: 'Zapier',
    description: 'Automatisation avec plus de 5000 applications',
    icon: Zap,
    categorie: 'Automatisation',
    statut: 'disponible',
    connecte: false,
    populaire: true,
    setup_difficulty: 'Moyen'
  },
  {
    id: 'mailchimp',
    nom: 'Mailchimp',
    description: 'Envoi d\'emails marketing et newsletters',
    icon: Mail,
    categorie: 'Marketing',
    statut: 'bientot',
    connecte: false,
    populaire: false,
    setup_difficulty: 'Moyen'
  },
  {
    id: 'whatsapp-business',
    nom: 'WhatsApp Business',
    description: 'Messages automatiques et support client via WhatsApp',
    icon: MessageSquare,
    categorie: 'Communication',
    statut: 'bientot',
    connecte: false,
    populaire: true,
    setup_difficulty: 'Facile'
  },
  {
    id: 'zoom',
    nom: 'Zoom',
    description: 'Formations à distance et visioconférences',
    icon: Globe,
    categorie: 'Formation',
    statut: 'planifie',
    connecte: false,
    populaire: false,
    setup_difficulty: 'Moyen'
  }
]

const STATUT_CONFIG = {
  disponible: {
    label: 'Disponible',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle
  },
  bientot: {
    label: 'Bientôt disponible',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: Clock
  },
  planifie: {
    label: 'En développement',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Settings
  }
}

const CATEGORIES = ['Tous', 'Productivité', 'Paiement', 'Automatisation', 'Marketing', 'Communication', 'Formation']

export default function IntegrationsTab() {
  const t = useTranslations('integrations')

  const integrationsConnectees = INTEGRATIONS.filter(i => i.connecte).length
  const integrationsDisponibles = INTEGRATIONS.filter(i => i.statut === 'disponible').length

  return (
    <div className="space-y-6">
      {/* Stats des intégrations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Connectées</p>
              <p className="text-xl font-bold text-green-600">{integrationsConnectees}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-xl font-bold text-blue-600">{integrationsDisponibles}</p>
            </div>
            <Settings className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En développement</p>
              <p className="text-xl font-bold text-gray-600">3</p>
            </div>
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Intégration en vedette */}
      <Card className="p-6 bg-gradient-to-r from-[#2EC6F3]/5 to-blue-50/30 border-[#2EC6F3]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#2EC6F3]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Google Calendar</h3>
              <p className="text-sm text-gray-600">
                Synchronisez automatiquement vos sessions de formation avec Google Calendar.
                Vos formateurs et apprenants recevront les invitations automatiquement.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="success" size="sm">Recommandé</Badge>
                <Badge variant="outline" size="sm">Facile à configurer</Badge>
              </div>
            </div>
          </div>
          <Button>Connecter</Button>
        </div>
      </Card>

      {/* Filtres par catégorie */}
      <Card className="p-4">
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map((categorie) => (
            <Button
              key={categorie}
              size="sm"
              variant={categorie === 'Tous' ? 'default' : 'outline'}
              className="whitespace-nowrap"
            >
              {categorie}
            </Button>
          ))}
        </div>
      </Card>

      {/* Grille des intégrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATIONS.map((integration) => {
          const IconComponent = integration.icon
          const statutConfig = STATUT_CONFIG[integration.statut as keyof typeof STATUT_CONFIG]
          const StatutIcon = statutConfig.icon

          return (
            <Card key={integration.id} className={`p-6 ${integration.connecte ? 'ring-2 ring-green-200 bg-green-50/50' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{integration.nom}</h3>
                    <p className="text-xs text-gray-500">{integration.categorie}</p>
                  </div>
                </div>
                {integration.populaire && (
                  <Badge variant="outline" size="xs">Populaire</Badge>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <StatutIcon className="w-4 h-4" />
                  <Badge className={statutConfig.color} size="sm">
                    {statutConfig.label}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">{integration.setup_difficulty}</span>
              </div>

              <div className="flex gap-2">
                {integration.connecte ? (
                  <>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="w-3 h-3 mr-1" />
                      Configurer
                    </Button>
                    <Button size="sm" variant="outline">
                      Déconnecter
                    </Button>
                  </>
                ) : integration.statut === 'disponible' ? (
                  <Button size="sm" className="flex-1">Connecter</Button>
                ) : (
                  <Button size="sm" variant="outline" className="flex-1" disabled>
                    {integration.statut === 'bientot' ? 'Bientôt disponible' : 'En développement'}
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Intégrations personnalisées */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Intégrations personnalisées</h3>
            <p className="text-sm text-gray-600">
              Besoin d'une intégration spécifique ? Notre API vous permet de connecter Dermotec à n'importe quel système.
            </p>
          </div>
          <Button variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Documentation API
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">API REST</h4>
            <p className="text-xs text-gray-600">Accès complet aux données via notre API REST moderne</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Webhooks</h4>
            <p className="text-xs text-gray-600">Notifications en temps réel des événements importants</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Support dédié</h4>
            <p className="text-xs text-gray-600">Assistance technique pour vos développements</p>
          </div>
        </div>
      </Card>

      {/* Demande d'intégration */}
      <Card className="p-6 border-dashed border-2 border-gray-200">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Une intégration manque ?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Proposez-nous une nouvelle intégration. Nous étudions toutes les demandes et priorisons selon les besoins de nos utilisateurs.
          </p>
          <Button>Proposer une intégration</Button>
        </div>
      </Card>
    </div>
  )
}