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

/**
 * Hook leads avec filtrage automatique par rôle
 * - Admin/Manager : voit tous les leads
 * - Commercial : voit UNIQUEMENT ses leads (commercial_assigne_id = equipe_id)
 * - Formatrice : pas d'accès leads
 *
 * Le filtrage est AUTOMATIQUE — les pages n'ont pas besoin de passer commercial_id
 */
export function useLeads(filters: LeadFilters = {}) {
  const supabase = createClient()
  const { page = 1, per_page = 20, sort_by = 'created_at', sort_order = 'desc' } = filters

  // Auto-détection du rôle pour filtrage
  const { data: currentEquipe } = useQuery({
    queryKey: ['current-equipe-role'],
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
    staleTime: 10 * 60 * 1000, // Cache 10 min
  })

  // Si commercial → forcer le filtre automatiquement
  const autoFilters = { ...filters }
  if (currentEquipe?.role === 'commercial' && currentEquipe.id && !filters.commercial_id) {
    autoFilters.commercial_id = currentEquipe.id
  }

  return useQuery({
    queryKey: ['leads', autoFilters, currentEquipe?.id],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          formation_principale:formations!formation_principale_id(id, nom, slug, categorie, prix_ht),
          commercial_assigne:equipe!commercial_assigne_id(id, prenom, nom, avatar_color)
        `, { count: 'exact' })

      // Filtres
      if (autoFilters.search) {
        query = query.or(`prenom.ilike.%${autoFilters.search}%,nom.ilike.%${autoFilters.search}%,email.ilike.%${autoFilters.search}%,telephone.ilike.%${autoFilters.search}%`)
      }
      if (autoFilters.statut?.length) {
        query = query.in('statut', autoFilters.statut)
      }
      if (autoFilters.priorite) {
        query = query.eq('priorite', autoFilters.priorite)
      }
      if (autoFilters.source) {
        query = query.eq('source', autoFilters.source)
      }
      if (autoFilters.formation_id) {
        query = query.eq('formation_principale_id', autoFilters.formation_id)
      }
      if (autoFilters.commercial_id) {
        query = query.eq('commercial_assigne_id', autoFilters.commercial_id)
      }
      if (autoFilters.score_min) {
        query = query.gte('score_chaud', autoFilters.score_min)
      }
      if (autoFilters.financement !== undefined) {
        query = query.eq('financement_souhaite', autoFilters.financement)
      }
      if (autoFilters.has_email) {
        query = query.not('email', 'is', null)
      }
      if (autoFilters.has_phone) {
        query = query.not('telephone', 'is', null)
      }
      if (autoFilters.date_from) {
        query = query.gte('created_at', autoFilters.date_from)
      }
      if (autoFilters.date_to) {
        query = query.lte('created_at', autoFilters.date_to)
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

/**
 * Hook qui retourne les leads filtrés par rôle automatiquement
 * Commercial → ses leads uniquement | Admin → tous
 */
export function useMyLeads(filters: LeadFilters = {}) {
  // Importer le hook current user inline pour éviter les deps circulaires
  const supabase = createClient()
  const { data: userResult } = useQuery({
    queryKey: ['current-user-for-leads'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data: equipe } = await supabase
        .from('equipe')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      return equipe
    },
    staleTime: 5 * 60 * 1000,
  })

  // Si commercial → forcer le filtre par commercial_id
  const enrichedFilters = { ...filters }
  if (userResult?.role === 'commercial' && userResult.id) {
    enrichedFilters.commercial_id = userResult.id
  }

  return useLeads(enrichedFilters)
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

// --- Mutation: update lead (Supabase direct) ---
export function useUpdateLead() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
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

// --- Mutation: changer statut (Supabase direct — state machine validée par trigger SQL) ---
export function useChangeStatut() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, statut, notes }: { id: string; statut: StatutLead; notes?: string }) => {
      const updates: Record<string, unknown> = { statut }
      if (notes) updates.notes = notes
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
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

// --- Mutation: supprimer lead (Supabase direct — soft delete via SPAM) ---
export function useDeleteLead() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
      if (error) throw error
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
