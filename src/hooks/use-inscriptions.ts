'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import type { Inscription, StatutInscription, PaiementStatut } from '@/types'

export function useCreateInscription() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (inscription: {
      lead_id: string
      session_id: string
      montant_total: number
      montant_finance?: number
      reste_a_charge?: number
      mode_paiement?: string
      statut?: StatutInscription
      paiement_statut?: PaiementStatut
    }) => {
      const { data, error } = await supabase
        .from('inscriptions')
        .insert({
          ...inscription,
          statut: inscription.statut || 'EN_ATTENTE',
          paiement_statut: inscription.paiement_statut || 'EN_ATTENTE',
          montant_finance: inscription.montant_finance || 0,
          reste_a_charge: inscription.reste_a_charge ?? inscription.montant_total,
          certificat_genere: false,
          convention_generee: false,
          convention_signee: false,
        })
        .select(`*, lead:leads(id, prenom, nom), session:sessions(*, formation:formations(*))`)
        .single()
      if (error) throw error

      // Update session places_occupees
      await supabase.rpc('increment_places', { session_id: inscription.session_id })

      // Log activity
      await supabase.from('activites').insert({
        type: 'INSCRIPTION',
        description: `Inscription créée`,
        lead_id: inscription.lead_id,
        session_id: inscription.session_id,
      })

      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead', data.lead_id] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['session', data.session_id] })
    },
  })
}

export function useUpdateInscription() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Inscription> & { id: string }) => {
      const { data, error } = await supabase
        .from('inscriptions')
        .update(updates)
        .eq('id', id)
        .select(`*, lead:leads(id, prenom, nom), session:sessions(id)`)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead', data.lead_id] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['session', data.session_id] })
    },
  })
}

export function useDeleteInscription() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, session_id, lead_id }: { id: string; session_id: string; lead_id: string }) => {
      const { error } = await supabase.from('inscriptions').delete().eq('id', id)
      if (error) throw error

      // Decrement places
      await supabase.rpc('decrement_places', { session_id })

      return { id, session_id, lead_id }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead', data.lead_id] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['session', data.session_id] })
    },
  })
}
