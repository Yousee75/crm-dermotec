'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import type { CadenceTemplate, CadenceInstance } from '@/types'

export function useCadenceTemplates() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['cadence-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cadence_templates')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CadenceTemplate[]
    },
    staleTime: 10 * 60_000, // 10 min — templates quasi-statiques
    gcTime: 10 * 60_000,
  })
}

export function useCadenceInstances(filters?: { lead_id?: string; statut?: string }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['cadence-instances', filters],
    queryFn: async () => {
      let query = supabase
        .from('cadence_instances')
        .select('*, template:cadence_templates(*), lead:leads(prenom, nom, email, statut)')
        .order('created_at', { ascending: false })

      if (filters?.lead_id) query = query.eq('lead_id', filters.lead_id)
      if (filters?.statut) query = query.eq('statut', filters.statut)

      const { data, error } = await query
      if (error) throw error
      return data as CadenceInstance[]
    },
    staleTime: 2 * 60_000, // 2 min — instances cadences
    gcTime: 10 * 60_000,
  })
}

export function useStartCadence() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (params: { template_id: string; lead_id: string }) => {
      const { data, error } = await supabase
        .from('cadence_instances')
        .insert({
          template_id: params.template_id,
          lead_id: params.lead_id,
          etape_courante: 0,
          statut: 'active',
          prochaine_execution: new Date().toISOString(),
          historique: [],
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-instances'] })
    },
  })
}

export function useStopCadence() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const { error } = await supabase
        .from('cadence_instances')
        .update({ statut: 'arretee' })
        .eq('id', instanceId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-instances'] })
    },
  })
}
