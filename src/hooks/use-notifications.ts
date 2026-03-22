'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  type: 'rappel' | 'inscription' | 'paiement' | 'systeme' | 'alerte' | 'lead' | 'session' | 'message'
  titre: string
  message: string
  lu: boolean
  created_at: string
  lead_id?: string
  lead_nom?: string
  session_id?: string
  lien?: string
}

// Clé localStorage pour le tracking des notifications lues
const READ_KEY = 'notifications-read'

function getReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(READ_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function persistReadIds(ids: Set<string>) {
  try {
    // Garder uniquement les 200 dernières pour ne pas exploser le localStorage
    const arr = [...ids].slice(-200)
    localStorage.setItem(READ_KEY, JSON.stringify(arr))
  } catch { /* ignore */ }
}

export function useNotifications() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Charger les 30 dernières notifications (activites + rappels en retard)
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-realtime'],
    queryFn: async () => {
      const readIds = getReadIds()

      const [{ data: activites }, { data: rappels }] = await Promise.all([
        supabase
          .from('activites')
          .select('id, type, description, lead_id, session_id, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('rappels')
          .select('id, titre, description, type, date_rappel, lead_id, statut')
          .eq('statut', 'EN_ATTENTE')
          .lte('date_rappel', new Date().toISOString())
          .order('date_rappel', { ascending: true })
          .limit(10),
      ])

      const result: Notification[] = []

      // Rappels en retard = notifications urgentes (non lues par defaut)
      for (const r of (rappels || [])) {
        const id = `rappel-${r.id}`
        result.push({
          id,
          type: 'rappel',
          titre: r.titre || `Rappel ${r.type || ''}`.trim(),
          message: r.description || `En retard`,
          lu: readIds.has(id),
          created_at: r.date_rappel,
          lead_id: r.lead_id || undefined,
          lien: r.lead_id ? `/lead/${r.lead_id}` : '/cockpit',
        })
      }

      // Activites recentes
      const typeMapping: Record<string, Notification['type']> = {
        LEAD_CREE: 'lead',
        STATUT_CHANGE: 'lead',
        PAIEMENT: 'paiement',
        INSCRIPTION: 'inscription',
        SESSION: 'session',
        EMAIL: 'message',
        SYSTEME: 'systeme',
        ALERTE: 'alerte',
      }

      for (const a of (activites || [])) {
        const id = `act-${a.id}`
        result.push({
          id,
          type: typeMapping[a.type] || 'systeme',
          titre: formatActivityType(a.type),
          message: a.description || '',
          lu: readIds.has(id),
          created_at: a.created_at,
          lead_id: a.lead_id || undefined,
          session_id: a.session_id || undefined,
          lien: a.lead_id
            ? `/lead/${a.lead_id}`
            : a.session_id
              ? `/session/${a.session_id}`
              : undefined,
        })
      }

      return result.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  })

  // Supabase Realtime — ecouter les INSERT sur activites et rappels
  useEffect(() => {
    channelRef.current = supabase
      .channel('notifications-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activites' },
        (payload) => {
          // Invalider le cache pour recharger les notifications
          queryClient.invalidateQueries({ queryKey: ['notifications-realtime'] })

          // Toast pour les evenements importants
          const record = payload.new as { type?: string; description?: string }
          if (record.type === 'LEAD_CREE') {
            toast.success('Nouveau prospect', {
              description: record.description || 'Un lead vient d\'arriver',
            })
          } else if (record.type === 'PAIEMENT') {
            toast.success('Paiement recu', {
              description: record.description || '',
            })
          } else if (record.type === 'INSCRIPTION') {
            toast.info('Nouvelle inscription', {
              description: record.description || '',
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rappels' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications-realtime'] })
          // Invalider aussi les rappels pour le reste du CRM
          queryClient.invalidateQueries({ queryKey: ['rappels'] })
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [supabase, queryClient])

  // Compteur non-lues
  const unreadCount = notifications.filter(n => !n.lu).length

  // Marquer une notification comme lue
  const markAsRead = useCallback((id: string) => {
    const readIds = getReadIds()
    readIds.add(id)
    persistReadIds(readIds)
    // Mettre a jour le cache React Query
    queryClient.setQueryData<Notification[]>(['notifications-realtime'], (old) =>
      old?.map(n => n.id === id ? { ...n, lu: true } : n) ?? []
    )
  }, [queryClient])

  // Tout marquer comme lu
  const markAllAsRead = useCallback(() => {
    const readIds = getReadIds()
    for (const n of notifications) {
      readIds.add(n.id)
    }
    persistReadIds(readIds)
    queryClient.setQueryData<Notification[]>(['notifications-realtime'], (old) =>
      old?.map(n => ({ ...n, lu: true })) ?? []
    )
  }, [notifications, queryClient])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  }
}

function formatActivityType(type: string): string {
  const labels: Record<string, string> = {
    LEAD_CREE: 'Nouveau prospect',
    STATUT_CHANGE: 'Changement de statut',
    PAIEMENT: 'Paiement',
    INSCRIPTION: 'Inscription',
    SESSION: 'Session',
    EMAIL: 'Email',
    SYSTEME: 'Systeme',
    ALERTE: 'Alerte',
    APPEL: 'Appel',
    NOTE: 'Note',
    RDV: 'Rendez-vous',
    DOCUMENT: 'Document',
  }
  return labels[type] || type.replace(/_/g, ' ')
}
