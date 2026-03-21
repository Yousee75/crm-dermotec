'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Shield, Key, Eye, AlertTriangle, CheckCircle, ExternalLink, Clock } from 'lucide-react'
import Link from 'next/link'

// Mock data pour les sessions actives
const SESSIONS_ACTIVES = [
  {
    id: '1',
    device: 'Chrome - Windows',
    location: 'Paris, France',
    ip: '192.168.1.1',
    derniere_activite: '2024-03-20T10:30:00Z',
    current: true
  },
  {
    id: '2',
    device: 'Safari - iPhone',
    location: 'Paris, France',
    ip: '192.168.1.2',
    derniere_activite: '2024-03-19T18:45:00Z',
    current: false
  },
  {
    id: '3',
    device: 'Chrome - Android',
    location: 'Lyon, France',
    ip: '89.185.12.45',
    derniere_activite: '2024-03-18T14:20:00Z',
    current: false
  }
]

const LOGS_SECURITE = [
  {
    id: '1',
    action: 'Connexion réussie',
    timestamp: '2024-03-20T10:30:00Z',
    ip: '192.168.1.1',
    device: 'Chrome - Windows',
    statut: 'success'
  },
  {
    id: '2',
    action: 'Tentative de connexion échouée',
    timestamp: '2024-03-19T22:15:00Z',
    ip: '45.123.78.99',
    device: 'Chrome - Unknown',
    statut: 'warning'
  },
  {
    id: '3',
    action: 'Changement de mot de passe',
    timestamp: '2024-03-18T16:30:00Z',
    ip: '192.168.1.1',
    device: 'Chrome - Windows',
    statut: 'info'
  },
  {
    id: '4',
    action: 'Export de données',
    timestamp: '2024-03-17T11:45:00Z',
    ip: '192.168.1.1',
    device: 'Chrome - Windows',
    statut: 'info'
  }
]

export default function SecuriteTab() {
  const t = useTranslations('securite')

  return (
    <div className="space-y-6">
      {/* Score de sécurité */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Score de sécurité</h3>
            <p className="text-sm text-gray-600">Votre compte est bien sécurisé</p>
          </div>
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${85 * 2.51} 251`}
                  className="text-green-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900">85%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Paramètres de sécurité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentification */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Authentification</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Mot de passe</p>
                <p className="text-xs text-gray-500">Dernière modification il y a 15 jours</p>
              </div>
              <Button size="sm" variant="outline">Modifier</Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Authentification à deux facteurs</p>
                <p className="text-xs text-gray-500">Protection supplémentaire recommandée</p>
              </div>
              <Badge variant="warning" size="sm">Désactivée</Badge>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">A2F recommandée</p>
                  <p className="text-xs text-amber-700">Activez l'authentification à deux facteurs pour une sécurité renforcée</p>
                  <Button size="xs" className="mt-2 bg-amber-600 hover:bg-amber-700">
                    Activer maintenant
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Confidentialité */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Confidentialité</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Visibilité du profil</p>
                <p className="text-xs text-gray-500">Qui peut voir vos informations</p>
              </div>
              <Badge variant="outline" size="sm">Équipe uniquement</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Partage de données</p>
                <p className="text-xs text-gray-500">Analytics et amélioration du service</p>
              </div>
              <Badge variant="success" size="sm">Activé</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Notifications par email</p>
                <p className="text-xs text-gray-500">Alertes de sécurité importantes</p>
              </div>
              <Badge variant="success" size="sm">Activé</Badge>
            </div>

            <Link href="/settings/privacy" className="inline-flex items-center gap-2 text-sm text-[#2EC6F3] hover:text-[#1A94CC] font-medium">
              Paramètres détaillés
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Sessions actives */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sessions actives</h3>
          <Button size="sm" variant="outline">Déconnecter tout</Button>
        </div>

        <div className="space-y-3">
          {SESSIONS_ACTIVES.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{session.device}</p>
                    {session.current && (
                      <Badge variant="success" size="xs">Session actuelle</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {session.location} • {session.ip} • {new Date(session.derniere_activite).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              {!session.current && (
                <Button size="xs" variant="outline">Révoquer</Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Journal de sécurité */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Journal de sécurité</h3>
          <Link href="/settings/security/logs" className="text-sm text-[#2EC6F3] hover:text-[#1A94CC] font-medium">
            Voir tout
          </Link>
        </div>

        <div className="space-y-3">
          {LOGS_SECURITE.slice(0, 4).map((log) => {
            const getStatusIcon = (statut: string) => {
              switch (statut) {
                case 'success':
                  return <CheckCircle className="w-4 h-4 text-green-600" />
                case 'warning':
                  return <AlertTriangle className="w-4 h-4 text-amber-600" />
                default:
                  return <Clock className="w-4 h-4 text-blue-600" />
              }
            }

            const getStatusColor = (statut: string) => {
              switch (statut) {
                case 'success':
                  return 'bg-green-50 border-green-200'
                case 'warning':
                  return 'bg-amber-50 border-amber-200'
                default:
                  return 'bg-blue-50 border-blue-200'
              }
            }

            return (
              <div key={log.id} className={`p-3 rounded-lg border ${getStatusColor(log.statut)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.statut)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-500">
                        {log.device} • {log.ip}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleDateString('fr-FR')} à {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Recommandations de sécurité */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommandations de sécurité</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Mot de passe fort</p>
                <p className="text-xs text-green-700">Votre mot de passe respecte les bonnes pratiques</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">A2F désactivée</p>
                <p className="text-xs text-amber-700">Activez l'authentification à deux facteurs</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Révision des accès</p>
                <p className="text-xs text-blue-700">Révisez les permissions de votre équipe</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Sauvegardes actives</p>
                <p className="text-xs text-green-700">Vos données sont automatiquement sauvegardées</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}