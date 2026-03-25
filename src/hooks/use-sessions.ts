'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import type { Session } from '@/types'

export function useSessions(filters: { month?: string; formation_id?: string; formation_slug?: string; statut?: string } = {}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: async () => {
      let query = supabase
        .from('sessions')
        .select(`
          *,
          formation:formations(*),
          formatrice:equipe!formatrice_id(id, prenom, nom, avatar_color),
          inscriptions(id, lead_id, statut, montant_total, paiement_statut)
        `)
        .order('date_debut', { ascending: true })

      if (filters.month) {
        const start = `${filters.month}-01`
        const [y, m] = filters.month.split('-').map(Number)
        const end = new Date(y, m, 0).toISOString().split('T')[0]
        query = query.gte('date_debut', start).lte('date_debut', end)
      }
      if (filters.formation_id) {
        query = query.eq('formation_id', filters.formation_id)
      }
      if (filters.statut) {
        query = query.eq('statut', filters.statut)
      }

      const { data, error } = await query
      if (error) throw error

      let sessions = (data || []) as Session[]

      // Filtre côté client par slug si nécessaire (pour le wizard d'inscription)
      if (filters.formation_slug) {
        sessions = sessions.filter(session => session.formation?.slug === filters.formation_slug)
      }

      return sessions
    },
    staleTime: 2 * 60_000, // 2 min — liste sessions
    gcTime: 10 * 60_000,
  })
}

export function useSession(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          formation:formations(*),
          formatrice:equipe!formatrice_id(*),
          inscriptions(*, lead:leads(id, prenom, nom, email, telephone, statut_pro)),
          modeles(*)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Session
    },
    enabled: !!id,
    staleTime: 60_000, // 1 min — détail session
    gcTime: 10 * 60_000,
  })
}

export function useCreateSession() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (session: Partial<Session>) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert(session)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session créée')
    },
    onError: (error: Error) => {
      console.error('[useCreateSession]', error)
      toast.error(`Erreur création session : ${error.message}`)
    },
  })
}

export function useUpdateSession() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Session> & { id: string }) => {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['session', data.id] })
      toast.success('Session mise à jour')
    },
    onError: (error: Error) => {
      console.error('[useUpdateSession]', error)
      toast.error(`Erreur mise à jour session : ${error.message}`)
    },
  })
}
