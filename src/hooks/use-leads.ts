'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import type { Lead, StatutLead, PrioriteLead, SourceLead } from '@/types'

// --- Filtres ---
export interface LeadFilters {
  search?: string
  statut?: StatutLead[]
  priorite?: PrioriteLead
  source?: SourceLead
  formation_id?: string
  commercial_id?: string
  score_min?: number
  financement?: boolean
  has_email?: boolean
  has_phone?: boolean
  tags?: string[]
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

// --- Query: liste leads ---
export function useLeads(filters: LeadFilters = {}) {
  const supabase = createClient()
  const { page = 1, per_page = 20, sort_by = 'created_at', sort_order = 'desc' } = filters

  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          formation_principale:formations!formation_principale_id(id, nom, slug, categorie, prix_ht),
          commercial_assigne:equipe!commercial_assigne_id(id, prenom, nom, avatar_color)
        `, { count: 'exact' })

      // Filtres
      if (filters.search) {
        query = query.or(`prenom.ilike.%${filters.search}%,nom.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telephone.ilike.%${filters.search}%`)
      }
      if (filters.statut?.length) {
        query = query.in('statut', filters.statut)
      }
      if (filters.priorite) {
        query = query.eq('priorite', filters.priorite)
      }
      if (filters.source) {
        query = query.eq('source', filters.source)
      }
      if (filters.formation_id) {
        query = query.eq('formation_principale_id', filters.formation_id)
      }
      if (filters.commercial_id) {
        query = query.eq('commercial_assigne_id', filters.commercial_id)
      }
      if (filters.score_min) {
        query = query.gte('score_chaud', filters.score_min)
      }
      if (filters.financement !== undefined) {
        query = query.eq('financement_souhaite', filters.financement)
      }
      if (filters.has_email) {
        query = query.not('email', 'is', null)
      }
      if (filters.has_phone) {
        query = query.not('telephone', 'is', null)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      // Tri + pagination
      query = query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range((page - 1) * per_page, page * per_page - 1)

      const { data, error, count } = await query
      if (error) throw error

      return {
        leads: (data || []) as Lead[],
        total: count || 0,
        page,
        per_page,
        total_pages: Math.ceil((count || 0) / per_page),
      }
    },
  })
}

// --- Query: un lead ---
export function useLead(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          formation_principale:formations!formation_principale_id(*),
          commercial_assigne:equipe!commercial_assigne_id(*),
          inscriptions(*, session:sessions(*, formation:formations(*))),
          financements(*),
          rappels(*),
          notes_lead(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Lead
    },
    enabled: !!id,
  })
}

// --- Mutation: créer lead ---
export function useCreateLead() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead créé avec succès')
    },
    onError: (error: Error) => {
      console.error('[useCreateLead]', error)
      toast.error(`Erreur création lead : ${error.message}`)
    },
  })
}

// --- Mutation: update lead (via API Hono) ---
export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', data.id] })
      toast.success('Lead mis à jour')
    },
    onError: (error: Error) => {
      toast.error(`Erreur mise à jour : ${error.message}`)
    },
  })
}

// --- Mutation: changer statut (via API Hono — state machine validée côté serveur) ---
export function useChangeStatut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, statut, notes }: { id: string; statut: StatutLead; notes?: string }) => {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut, notes }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Statut mis à jour')
    },
    onError: (error: Error) => {
      toast.error(`Erreur changement statut : ${error.message}`)
    },
  })
}

// --- Mutation: supprimer lead (via API Hono — soft delete RGPD) ---
export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead supprimé')
    },
    onError: (error: Error) => {
      console.error('[useDeleteLead]', error)
      toast.error(`Erreur suppression : ${error.message}`)
    },
  })
}
