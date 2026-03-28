'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/infra/supabase-client'
import { toast } from 'sonner'
import { Fire, Clock, Calendar, AlertTriangle } from 'lucide-react'

export interface RealtimeNotificationPayload {
  id: string
  type: 'prospect_chaud' | 'financement_stagnant' | 'session_pleine' | 'rappel_retard'
  title: string
  message: string
  lead_id?: string
  session_id?: string
  created_at: string
}

/**
 * Hook pour écouter les notifications realtime critiques et afficher des toasts
 * Se connecte aux INSERT sur la table 'activites' avec type 'SYSTEME' et metadata spécifiques
 */
export function useRealtimeNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Écouter les INSERT sur activites avec type SYSTEME (générés par l'agent proactif)
    const channel = supabase
      .channel('realtime-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activites',
        filter: `type=eq.SYSTEME`,
      }, (payload) => {
        const record = payload.new as {
          type: string
          description: string
          metadata?: {
            canal?: string
            action?: string
            score?: number
            jours?: number
            [key: string]: any
          }
          lead_id?: string
          session_id?: string
        }

        // Filtrer seulement les actions de l'agent IA
        if (record.metadata?.canal !== 'agent_ia') return

        const action = record.metadata?.action
        const description = record.description || ''

        // Prospect chaud sans contact
        if (action === 'rappel_auto' && record.metadata?.score) {
          toast.error('Prospect chaud détecté', {
            description: description.replace('[Agent IA] ', ''),
            icon: <Fire className="w-4 h-4" />,
            duration: 8000,
            action: record.lead_id ? {
              label: 'Voir le prospect',
              onClick: () => window.location.href = `/lead/${record.lead_id}`
            } : undefined
          })
        }

        // Financement stagnant
        else if (action === 'financement_relance' && record.metadata?.jours) {
          toast.warning('Financement en attente', {
            description: description.replace('[Agent IA] ', ''),
            icon: <AlertTriangle className="w-4 h-4" />,
            duration: 10000,
            action: record.lead_id ? {
              label: 'Voir le dossier',
              onClick: () => window.location.href = `/lead/${record.lead_id}`
            } : undefined
          })
        }

        // Session proche (rappel de convocation)
        else if (action === 'session_reminder' && record.metadata?.jours_avant) {
          toast.info('Session prochainement', {
            description: description.replace('[Agent IA] ', ''),
            icon: <Calendar className="w-4 h-4" />,
            duration: 6000,
            action: record.session_id ? {
              label: 'Voir la session',
              onClick: () => window.location.href = `/session/${record.session_id}`
            } : undefined
          })
        }

        // Lead récupérable
        else if (action === 'recovery_attempt' && record.metadata?.score) {
          toast('Lead récupérable', {
            description: description.replace('[Agent IA] ', ''),
            icon: <Fire className="w-4 h-4" />,
            duration: 8000,
            action: record.lead_id ? {
              label: 'Tenter la récupération',
              onClick: () => window.location.href = `/lead/${record.lead_id}`
            } : undefined
          })
        }
      })

    // Écouter aussi les rappels en retard (INSERT sur table rappels)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'rappels',
      filter: `statut=eq.EN_ATTENTE`,
    }, (payload) => {
      const record = payload.new as {
        titre?: string
        description?: string
        type: string
        date_rappel: string
        lead_id?: string
      }

      // Vérifier si le rappel est en retard (date passée)
      const dateRappel = new Date(record.date_rappel)
      const maintenant = new Date()

      if (dateRappel <= maintenant) {
        toast.error('Rappel en retard', {
          description: record.titre || record.description || 'Un rappel est en retard',
          icon: <Clock className="w-4 h-4" />,
          duration: 10000,
          action: record.lead_id ? {
            label: 'Voir le prospect',
            onClick: () => window.location.href = `/lead/${record.lead_id}`
          } : {
            label: 'Voir les rappels',
            onClick: () => window.location.href = '/cockpit'
          }
        })
      }
    })
    .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}