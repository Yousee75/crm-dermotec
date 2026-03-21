'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import type { Rappel } from '@/types'

export function useRappels(filters: { lead_id?: string; date?: string; statut?: string } = {}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['rappels', filters],
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

      const { data, error } = await query
      if (error) throw error
      return (data || []) as Rappel[]
    },
  })
}

export function useTodayRappels() {
  const today = new Date().toISOString().split('T')[0]
  return useRappels({ date: today, statut: 'EN_ATTENTE' })
}

export function useOverdueRappels() {
  const supabase = createClient()
  const now = new Date().toISOString()

  return useQuery({
    queryKey: ['rappels', 'overdue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rappels')
        .select(`*, lead:leads(id, prenom, nom, email, telephone)`)
        .eq('statut', 'EN_ATTENTE')
        .lt('date_rappel', now)
        .order('date_rappel', { ascending: true })
      if (error) throw error
      return (data || []) as Rappel[]
    },
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
