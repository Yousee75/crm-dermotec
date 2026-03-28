'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/infra/supabase-client'
import type { PlaybookEntry, PlaybookResponse } from '@/lib/automation/playbook'

const supabase = createClient()

// --- Lister les entrées du playbook ---

export function usePlaybookEntries(categorie?: string) {
  return useQuery({
    queryKey: ['playbook-entries', categorie],
    queryFn: async () => {
      let query = supabase
        .from('playbook_entries')
        .select(`
          *,
          author:equipe!playbook_entries_created_by_fkey(prenom, nom),
          responses:playbook_responses(
            id, contenu, is_ai_generated, upvotes, downvotes,
            succes, echecs, taux_succes, promoted_to_kb, created_at,
            author:equipe!playbook_responses_created_by_fkey(prenom, nom)
          )
        `)
        .eq('is_active', true)
        .order('occurences', { ascending: false })

      if (categorie) {
        query = query.eq('categorie', categorie)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as PlaybookEntry[]
    },
    staleTime: 10 * 60_000, // 10 min — playbook quasi-statique
    gcTime: 10 * 60_000,
  })
}

// --- Détail d'une entrée ---

export function usePlaybookEntry(entryId: string) {
  return useQuery({
    queryKey: ['playbook-entry', entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playbook_entries')
        .select(`
          *,
          author:equipe!playbook_entries_created_by_fkey(prenom, nom),
          responses:playbook_responses(
            id, contenu, is_ai_generated, upvotes, downvotes,
            succes, echecs, taux_succes, promoted_to_kb, created_at,
            author:equipe!playbook_responses_created_by_fkey(prenom, nom)
          )
        `)
        .eq('id', entryId)
        .single()

      if (error) throw error
      return data as PlaybookEntry
    },
    enabled: !!entryId,
    staleTime: 10 * 60_000, // 10 min — détail playbook
    gcTime: 10 * 60_000,
  })
}

// --- Créer une entrée ---

export function useCreatePlaybookEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      categorie: PlaybookEntry['categorie']
      titre: string
      contexte?: string
      lead_id?: string
      formation_slug?: string
      statut_pro_cible?: string
      etape_pipeline?: string
    }) => {
      // Vérifier si une entrée similaire existe (FTS)
      const searchTerms = params.titre.split(/\s+/).filter(w => w.length > 3).join(' & ')
      if (searchTerms) {
        const { data: existing } = await supabase
          .from('playbook_entries')
          .select('id, titre, occurences')
          .textSearch('fts', searchTerms, { config: 'french' })
          .eq('categorie', params.categorie)
          .limit(1)

        // Si similaire trouvée, incrémenter occurences
        if (existing && existing.length > 0) {
          const { data } = await supabase
            .from('playbook_entries')
            .update({ occurences: existing[0].occurences + 1, updated_at: new Date().toISOString() })
            .eq('id', existing[0].id)
            .select('id')
            .single()
          return { id: data?.id || existing[0].id, merged: true, existing_id: existing[0].id }
        }
      }

      // Sinon créer nouvelle entrée
      const { data, error } = await supabase
        .from('playbook_entries')
        .insert(params)
        .select('id')
        .single()

      if (error) throw error
      return { id: data.id, merged: false }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-entries'] })
    },
  })
}

// --- Ajouter une réponse ---

export function useAddPlaybookResponse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      entry_id: string
      contenu: string
      is_ai_generated?: boolean
    }) => {
      const { data, error } = await supabase
        .from('playbook_responses')
        .insert(params)
        .select('id')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['playbook-entry', vars.entry_id] })
      queryClient.invalidateQueries({ queryKey: ['playbook-entries'] })
    },
  })
}

// --- Voter sur une réponse ---

export function useVotePlaybookResponse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      response_id: string
      vote: 'up' | 'down'
      user_id: string
    }) => {
      // Upsert le vote (remplace si déjà voté)
      const { error } = await supabase
        .from('playbook_votes')
        .upsert({
          response_id: params.response_id,
          user_id: params.user_id,
          vote: params.vote,
        }, {
          onConflict: 'response_id,user_id',
        })

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-entries'] })
      queryClient.invalidateQueries({ queryKey: ['playbook-entry'] })
    },
  })
}

// --- Enregistrer le résultat (succès/échec) ---

export function useRecordPlaybookResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      response_id: string
      result: 'succes' | 'echec'
    }) => {
      const field = params.result === 'succes' ? 'succes' : 'echecs'

      // Incrémenter le compteur
      const { data: current } = await supabase
        .from('playbook_responses')
        .select('succes, echecs')
        .eq('id', params.response_id)
        .single()

      if (!current) throw new Error('Réponse non trouvée')

      const currentValue = params.result === 'succes' ? (current.succes as number) : (current.echecs as number)

      const { error } = await supabase
        .from('playbook_responses')
        .update({ [field]: currentValue + 1 })
        .eq('id', params.response_id)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-entries'] })
    },
  })
}

// --- IA : Suggérer une réponse ---

export function useSuggestResponse() {
  return useMutation({
    mutationFn: async (params: {
      objection: string
      contexte?: string
      existingResponses?: string[]
    }) => {
      const res = await fetch('/api/ai/playbook-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error('Erreur suggestion IA')
      return res.json() as Promise<{ suggestion: string; argument_cle: string }>
    },
  })
}
