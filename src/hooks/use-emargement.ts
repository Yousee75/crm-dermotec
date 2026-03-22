'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import type { Emargement } from '@/types'

export function useEmargements(sessionId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['emargements', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emargements')
        .select('*, inscription:inscriptions(*, lead:leads(prenom, nom, email))')
        .eq('session_id', sessionId)
        .order('date', { ascending: true })
      if (error) throw error
      return data as (Emargement & { inscription: { lead: { prenom: string; nom: string; email: string } } })[]
    },
    enabled: !!sessionId,
    staleTime: 2 * 60_000, // 2 min — liste émargements
    gcTime: 10 * 60_000,
  })
}

export function useEmargementsByInscription(inscriptionId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['emargements', 'inscription', inscriptionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emargements')
        .select('*')
        .eq('inscription_id', inscriptionId)
        .order('date', { ascending: true })
      if (error) throw error
      return data as Emargement[]
    },
    enabled: !!inscriptionId,
    staleTime: 2 * 60_000, // 2 min — émargements par inscription
    gcTime: 10 * 60_000,
  })
}

export function useSignEmargement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      session_id: string
      inscription_id: string
      date: string
      creneau: string
      signature_data: string
    }) => {
      const res = await fetch('/api/emargement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur lors de la signature')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['emargements', vars.session_id] })
      queryClient.invalidateQueries({ queryKey: ['emargements', 'inscription', vars.inscription_id] })
    },
  })
}
