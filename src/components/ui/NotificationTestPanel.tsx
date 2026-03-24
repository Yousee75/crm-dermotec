'use client'

import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { Fire, Clock, Calendar, AlertTriangle } from 'lucide-react'

/**
 * Composant de test pour les notifications realtime
 * À utiliser uniquement en développement
 */
export function NotificationTestPanel() {
  const testProspectChaud = () => {
    toast.error('🔥 Prospect chaud détecté', {
      description: 'Marie Dupont (score 85) — 12j sans contact — Formation Dermo-Esthétique',
      duration: 8000,
      action: {
        label: 'Voir le prospect',
        onClick: () => window.location.href = '/lead/test-id'
      }
    })
  }

  const testFinancementStagnant = () => {
    toast.warning('⚠️ Financement en attente', {
      description: 'Sophie Martin — OPCO EP (2400€) depuis 18j',
      duration: 10000,
      action: {
        label: 'Voir le dossier',
        onClick: () => window.location.href = '/lead/test-id'
      }
    })
  }

  const testSessionPleine = () => {
    toast.info('📅 Session prochainement', {
      description: 'Formation Dermo-Correctrice dans 3 jour(s) — Julie Leblanc',
      duration: 6000,
      action: {
        label: 'Voir la session',
        onClick: () => window.location.href = '/session/test-id'
      }
    })
  }

  const testRappelRetard = () => {
    toast.error('🕐 Rappel en retard', {
      description: 'Appel de relance — En retard de 2 jour(s)',
      duration: 10000,
      action: {
        label: 'Voir les rappels',
        onClick: () => window.location.href = '/cockpit'
      }
    })
  }

  const testLeadRecuperable = () => {
    toast('♻️ Lead récupérable', {
      description: 'Anna Rossi (score 65) — Perdu récemment, tenter une réactivation',
      duration: 8000,
      action: {
        label: 'Tenter la récupération',
        onClick: () => window.location.href = '/lead/test-id'
      }
    })
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <h3 className="text-sm font-semibold text-gray-900">Test Notifications</h3>
      </div>

      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8"
          onClick={testProspectChaud}
        >
          <Fire className="w-3.5 h-3.5 text-orange-500" />
          Prospect chaud
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8"
          onClick={testFinancementStagnant}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Financement stagnant
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8"
          onClick={testSessionPleine}
        >
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          Session proche
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8"
          onClick={testRappelRetard}
        >
          <Clock className="w-3.5 h-3.5 text-red-500" />
          Rappel en retard
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8"
          onClick={testLeadRecuperable}
        >
          <Fire className="w-3.5 h-3.5 text-purple-500" />
          Lead récupérable
        </Button>
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Dev only - Test toasts
      </p>
    </div>
  )
}