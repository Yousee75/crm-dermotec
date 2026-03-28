'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/infra/supabase-client'
import { toast } from 'sonner'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Limite globale de channels par page (performance)
const MAX_CHANNELS_PER_PAGE = 3
let activeChannels = 0

interface RealtimeOptions {
  onInsert?: (record: unknown) => void
  onUpdate?: (record: unknown) => void
  onDelete?: (record: unknown) => void
  filter?: string // Filtre côté serveur ex: 'assigned_to=eq.${userId}'
  userId?: string // Pour filtres automatiques
}

// Écoute les changements en temps réel sur une table avec filtres côté serveur
export function useRealtime(table: string, options?: RealtimeOptions) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Limite de sécurité pour éviter la surcharge
    if (activeChannels >= MAX_CHANNELS_PER_PAGE) {
      console.warn(`[Realtime] Max channels reached (${MAX_CHANNELS_PER_PAGE}), skipping ${table}`)
      return
    }

    // Construire le filtre côté serveur si fourni
    let filter: Record<string, string> | undefined
    if (options?.filter) {
      filter = { filter: options.filter }
    } else if (options?.userId) {
      // Filtres automatiques fréquents
      if (table === 'leads' || table === 'inscriptions') {
        filter = { filter: `assigned_to=eq.${options.userId}` }
      } else if (table === 'sessions') {
        filter = { filter: `formatrice_assignee=eq.${options.userId}` }
      } else if (table === 'activites') {
        filter = { filter: `created_by=eq.${options.userId}` }
      }
    }

    const channelName = `realtime-${table}${filter ? '-filtered' : ''}`

    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        ...filter
      }, (payload) => {
        // Invalider les queries pour refresh auto
        queryClient.invalidateQueries({ queryKey: [table] })

        // Callbacks spécifiques
        if (payload.eventType === 'INSERT' && options?.onInsert) {
          options.onInsert(payload.new)
        }
        if (payload.eventType === 'UPDATE' && options?.onUpdate) {
          options.onUpdate(payload.new)
        }
        if (payload.eventType === 'DELETE' && options?.onDelete) {
          options.onDelete(payload.old)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          activeChannels++
          // Subscribed
        }
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          activeChannels = Math.max(0, activeChannels - 1)
        }
      })

    // Cleanup obligatoire
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        activeChannels = Math.max(0, activeChannels - 1)
        channelRef.current = null
        // Unsubscribed
      }
    }
  }, [table, supabase, queryClient, options?.filter, options?.userId])

  // Retourner une fonction pour cleanup manuel si nécessaire
  return () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      activeChannels = Math.max(0, activeChannels - 1)
      channelRef.current = null
    }
  }
}

// Écoute les nouveaux leads en temps réel (notification) avec filtre utilisateur
export function useNewLeadNotification(userId?: string) {
  useRealtime('leads', {
    userId, // Filtre automatique par assigned_to
    onInsert: (record: unknown) => {
      const lead = record as { prenom?: string; nom?: string; source?: string }
      toast.success(`Nouveau lead : ${lead.prenom || ''} ${lead.nom || ''}`, {
        description: `Source: ${lead.source || 'inconnue'}`,
        action: { label: 'Voir', onClick: () => window.location.href = '/leads' },
      })
    },
  })
}

// Écoute les changements de statut de financement
export function useFinancementNotification() {
  useRealtime('financements', {
    onUpdate: (record: unknown) => {
      const fin = record as { statut?: string; organisme?: string }
      if (fin.statut === 'VALIDE') {
        toast.success(`Financement ${fin.organisme} validé !`, {
          description: 'Le dossier a été accepté.',
        })
      }
      if (fin.statut === 'REFUSE') {
        toast.error(`Financement ${fin.organisme} refusé`, {
          description: 'Voir les détails du dossier.',
        })
      }
    },
  })
}

// Présence : qui est connecté (compte dans la limite de channels)
export function usePresence(userId: string, userName: string) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Vérifier la limite de channels
    if (activeChannels >= MAX_CHANNELS_PER_PAGE) {
      console.warn('[Realtime] Max channels reached, skipping presence')
      return
    }

    channelRef.current = supabase.channel('presence', {
      config: { presence: { key: userId } },
    })

    channelRef.current
      .on('presence', { event: 'sync' }, () => {
        const state = channelRef.current?.presenceState()
        if (state) {
          // Presence sync
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          activeChannels++
          await channelRef.current?.track({
            user_id: userId,
            user_name: userName,
            online_at: new Date().toISOString()
          })
        }
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          activeChannels = Math.max(0, activeChannels - 1)
        }
      })

    // Cleanup obligatoire
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        activeChannels = Math.max(0, activeChannels - 1)
        channelRef.current = null
      }
    }
  }, [userId, userName, supabase])
}
