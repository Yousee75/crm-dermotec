'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import type { Financement, StatutFinancement, OrganismeFinancement } from '@/types'

// --- Filtres ---
export interface FinancementFilters {
  search?: string
  statut?: StatutFinancement[]
  organisme?: OrganismeFinancement
  lead_id?: string
  commercial_id?: string
  montant_min?: number
  montant_max?: number
  date_from?: string
  date_to?: string
  date_limite_proche?: boolean // dans les 30 prochains jours
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

// --- Query: liste financements ---
export function useFinancements(filters: FinancementFilters = {}) {
  const supabase = createClient()
  const { page = 1, per_page = 20, sort_by = 'created_at', sort_order = 'desc' } = filters

  return useQuery({
    queryKey: ['financements', filters],
    queryFn: async () => {
      let query = supabase
        .from('financements')
        .select(`
          *,
          lead:leads!inner(id, prenom, nom, email, telephone, commercial_assigne_id),
          inscription:inscriptions(id, session:sessions(id, formation:formations(nom, categorie)))
        `, { count: 'exact' })

      // Filtres
      if (filters.search) {
        query = query.or(
          `numero_dossier.ilike.%${filters.search}%,` +
          `organisme_detail.ilike.%${filters.search}%,` +
          `lead.prenom.ilike.%${filters.search}%,` +
          `lead.nom.ilike.%${filters.search}%`
        )
      }
      if (filters.statut?.length) {
        query = query.in('statut', filters.statut)
      }
      if (filters.organisme) {
        query = query.eq('organisme', filters.organisme)
      }
      if (filters.lead_id) {
        query = query.eq('lead_id', filters.lead_id)
      }
      if (filters.commercial_id) {
        query = query.eq('lead.commercial_assigne_id', filters.commercial_id)
      }
      if (filters.montant_min) {
        query = query.gte('montant_demande', filters.montant_min)
      }
      if (filters.montant_max) {
        query = query.lte('montant_demande', filters.montant_max)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }
      if (filters.date_limite_proche) {
        const in30Days = new Date()
        in30Days.setDate(in30Days.getDate() + 30)
        query = query
          .not('date_limite', 'is', null)
          .lte('date_limite', in30Days.toISOString())
          .gte('date_limite', new Date().toISOString())
      }

      // Tri + pagination
      query = query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range((page - 1) * per_page, page * per_page - 1)

      const { data, error, count } = await query
      if (error) throw error

      return {
        financements: (data || []) as Financement[],
        total: count || 0,
        page,
        per_page,
        total_pages: Math.ceil((count || 0) / per_page),
      }
    },
  })
}

// --- Query: un financement ---
export function useFinancement(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['financement', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financements')
        .select(`
          *,
          lead:leads!inner(
            id, prenom, nom, email, telephone, adresse,
            commercial_assigne:equipe!commercial_assigne_id(id, prenom, nom, email),
            formation_principale:formations!formation_principale_id(id, nom, categorie, prix_ht)
          ),
          inscription:inscriptions(
            id, montant_total, montant_finance, statut,
            session:sessions(
              id, date_debut, date_fin,
              formation:formations(id, nom, categorie, prix_ht, duree_jours)
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Financement
    },
    enabled: !!id,
  })
}

// --- Query: stats financements ---
export function useFinancementStats(filters?: Pick<FinancementFilters, 'organisme' | 'commercial_id' | 'date_from' | 'date_to'>) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['financement-stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('financements')
        .select('statut, montant_demande, montant_accorde, montant_verse, organisme, created_at')

      if (filters?.organisme) {
        query = query.eq('organisme', filters.organisme)
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data, error } = await query
      if (error) throw error

      const stats = {
        total_dossiers: data?.length || 0,
        par_statut: {} as Record<StatutFinancement, number>,
        par_organisme: {} as Record<OrganismeFinancement, number>,
        montant_total_demande: 0,
        montant_total_accorde: 0,
        montant_total_verse: 0,
        taux_acceptation: 0,
      }

      data?.forEach(f => {
        // Compteurs par statut
        stats.par_statut[f.statut] = (stats.par_statut[f.statut] || 0) + 1

        // Compteurs par organisme
        stats.par_organisme[f.organisme] = (stats.par_organisme[f.organisme] || 0) + 1

        // Montants
        stats.montant_total_demande += f.montant_demande || 0
        stats.montant_total_accorde += f.montant_accorde || 0
        stats.montant_total_verse += f.montant_verse || 0
      })

      // Taux d'acceptation
      const acceptes = (stats.par_statut.VALIDE || 0) + (stats.par_statut.VERSE || 0)
      const refuses = stats.par_statut.REFUSE || 0
      stats.taux_acceptation = acceptes + refuses > 0
        ? Math.round((acceptes / (acceptes + refuses)) * 100)
        : 0

      return stats
    },
  })
}

// --- Mutation: créer financement ---
export function useCreateFinancement() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (financement: Partial<Financement>) => {
      const { data, error } = await supabase
        .from('financements')
        .insert({
          ...financement,
          historique: [
            {
              date: new Date().toISOString(),
              action: 'Dossier créé',
              detail: `Organisme: ${financement.organisme}`,
            }
          ]
        })
        .select()
        .single()
      if (error) throw error

      // Log activité
      if (financement.lead_id) {
        await supabase.from('activites').insert({
          type: 'FINANCEMENT',
          lead_id: financement.lead_id,
          description: `Nouveau dossier de financement ${financement.organisme}`,
          metadata: { organisme: financement.organisme, montant: financement.montant_demande },
        })
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financements'] })
      queryClient.invalidateQueries({ queryKey: ['financement-stats'] })
    },
  })
}

// --- Mutation: update financement ---
export function useUpdateFinancement() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      historique_entry,
      ...updates
    }: Partial<Financement> & {
      id: string
      historique_entry?: { action: string; detail?: string; user?: string }
    }) => {
      // Si on a un nouvel historique, l'ajouter
      if (historique_entry) {
        const { data: current } = await supabase
          .from('financements')
          .select('historique')
          .eq('id', id)
          .single()

        const newHistorique = [
          ...(current?.historique || []),
          {
            date: new Date().toISOString(),
            ...historique_entry
          }
        ]

        updates.historique = newHistorique
      }

      const { data, error } = await supabase
        .from('financements')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      // Log activité si changement de statut
      if (updates.statut && updates.lead_id) {
        await supabase.from('activites').insert({
          type: 'FINANCEMENT',
          lead_id: updates.lead_id,
          description: `Financement ${updates.statut.toLowerCase().replace('_', ' ')}`,
          metadata: {
            nouveau_statut: updates.statut,
            action: historique_entry?.action
          },
        })
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['financements'] })
      queryClient.invalidateQueries({ queryKey: ['financement', data.id] })
      queryClient.invalidateQueries({ queryKey: ['financement-stats'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] }) // Au cas où le statut lead change
    },
  })
}

// --- Mutation: supprimer financement ---
export function useDeleteFinancement() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financements'] })
      queryClient.invalidateQueries({ queryKey: ['financement-stats'] })
    },
  })
}