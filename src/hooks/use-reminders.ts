'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import type { Rappel } from '@/types'

export function useRappels(filters: { lead_id?: string; date?: string; statut?: string } = {}) {
  const supabase = createClient()

  // Auto-filtrage par rôle : commercial ne voit que SES rappels
  const { data: currentEquipe } = useQuery({
    queryKey: ['current-equipe-rappels'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('equipe')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      return data as { id: string; role: string } | null
    },
    staleTime: 10 * 60_000,
    gcTime: 10 * 60_000,
  })

  return useQuery({
    queryKey: ['rappels', filters, currentEquipe?.id],
    queryFn: async () => {
      let query = supabase
        .from('rappels')
        .select(`*, lead:leads(id, prenom, nom, email, telephone), user:equipe(id, prenom, nom)`)
        .order('date_rappel', { ascending: true })

      if (filters.lead_id) query = query.eq('lead_id', filters.lead_id)
      if (filters.statut) query = query.eq('statut', filters.statut)
      if (filters.date) {
        query = query.gte('date_rappel', `${filters.date}T00:00:00`)
          .lte('date_rappel', `${filters.date}T23:59:59`)
      }

      // Commercial → seulement ses rappels
      if (currentEquipe?.role === 'commercial' && currentEquipe.id) {
        query = query.eq('user_id', currentEquipe.id)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as Rappel[]
    },
    staleTime: 30_000, // 30s — rappels
    gcTime: 10 * 60_000,
  })
}

export function useTodayRappels() {
  const today = new Date().toISOString().split('T')[0]
  return useRappels({ date: today, statut: 'EN_ATTENTE' })
}

export function useOverdueRappels() {
  const supabase = createClient()
  const now = new Date().toISOString()

  // Auto-filtrage par rôle
  const { data: currentEquipe } = useQuery({
    queryKey: ['current-equipe-overdue'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('equipe')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      return data as { id: string; role: string } | null
    },
    staleTime: 10 * 60_000,
    gcTime: 10 * 60_000,
  })

  return useQuery({
    queryKey: ['rappels', 'overdue', currentEquipe?.id],
    queryFn: async () => {
      let query = supabase
        .from('rappels')
        .select(`*, lead:leads(id, prenom, nom, email, telephone)`)
        .eq('statut', 'EN_ATTENTE')
        .lt('date_rappel', now)
        .order('date_rappel', { ascending: true })

      // Commercial → seulement ses rappels
      if (currentEquipe?.role === 'commercial' && currentEquipe.id) {
        query = query.eq('user_id', currentEquipe.id)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as Rappel[]
    },
    staleTime: 30_000, // 30s — rappels overdue
    gcTime: 10 * 60_000,
  })
}

export function useCreateRappel() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (rappel: Partial<Rappel>) => {
      const { data, error } = await supabase
        .from('rappels')
        .insert(rappel)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rappels'] }),
  })
}

export function useUpdateRappel() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Rappel> & { id: string }) => {
      const { data, error } = await supabase
        .from('rappels')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rappels'] }),
  })
}
