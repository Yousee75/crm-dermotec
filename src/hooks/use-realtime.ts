'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

// Écoute les changements en temps réel sur une table
export function useRealtime(table: string, options?: { onInsert?: (record: unknown) => void; onUpdate?: (record: unknown) => void; onDelete?: (record: unknown) => void }) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        // Invalider les queries pour refresh auto
        queryClient.invalidateQueries({ queryKey: [table] })

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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, supabase, queryClient, options])
}

// Écoute les nouveaux leads en temps réel (notification)
export function useNewLeadNotification() {
  useRealtime('leads', {
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

// Présence : qui est connecté
export function usePresence(userId: string, userName: string) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('presence', {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        // Pourrait être utilisé pour afficher les avatars connectés
        console.log('Utilisateurs connectés:', Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, user_name: userName, online_at: new Date().toISOString() })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [userId, userName, supabase])
}
