// ============================================================
// Notifications Realtime — Export central
// ============================================================

export {
  createNotification,
  createProspectChaudNotification,
  createFinancementStagnantNotification,
  createSessionPleineNotification,
  createRappelRetardNotification,
  type CreateNotificationOptions
} from './create-notification'

export { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'

// Types pour les notifications
export interface NotificationData {
  id: string
  type: 'prospect_chaud' | 'financement_stagnant' | 'session_pleine' | 'rappel_retard' | 'lead_recuperable'
  title: string
  message: string
  leadId?: string
  sessionId?: string
  userId: string
  metadata?: Record<string, any>
  createdAt: string
}

// Configuration des types de notifications avec leurs icônes et couleurs
export const NOTIFICATION_CONFIG = {
  prospect_chaud: {
    icon: 'Flame',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    toastType: 'error' as const,
    duration: 8000
  },
  financement_stagnant: {
    icon: 'AlertTriangle',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    toastType: 'warning' as const,
    duration: 10000
  },
  session_pleine: {
    icon: 'Calendar',
    color: 'text-[#FF5C00]',
    bgColor: 'bg-[#FFF0E5]',
    toastType: 'info' as const,
    duration: 6000
  },
  rappel_retard: {
    icon: 'Clock',
    color: 'text-[#FF2D78]',
    bgColor: 'bg-[#FFE0EF]',
    toastType: 'error' as const,
    duration: 10000
  },
  lead_recuperable: {
    icon: 'Flame',
    color: 'text-[#FF2D78]',
    bgColor: 'bg-[#FFE0EF]',
    toastType: 'default' as const,
    duration: 8000
  }
} as const

// Helper pour créer des métadonnées standardisées
export function createNotificationMetadata(action: string, data: Record<string, any>) {
  return {
    canal: 'agent_ia',
    action,
    timestamp: new Date().toISOString(),
    ...data
  }
}