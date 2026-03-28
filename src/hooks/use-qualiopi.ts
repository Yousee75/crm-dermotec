'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// ── Types ──
export interface QualiopiStats {
  nb_formations: number
  nb_formations_avec_objectifs: number
  nb_formations_avec_prerequis: number
  nb_formations_avec_programme: number
  nb_sessions: number
  nb_sessions_terminees: number
  nb_sessions_materiel_ok: number
  nb_sessions_supports_ok: number
  nb_sessions_convocations_ok: number
  nb_inscriptions: number
  nb_inscriptions_completees: number
  nb_certificats: number
  nb_conventions: number
  nb_formatrices: number
  nb_formatrices_cv: number
  nb_formatrices_certifications: number
  taux_satisfaction: number
  taux_presence: number
  nb_reclamations: number
  nb_reclamations_resolues: number
  nb_evaluations: number
  nb_qualite_items: number
  nb_actions_correctives: number
  nb_ameliorations: number
  nb_questionnaires_envoyes: number
  nb_questionnaires_completes: number
  score_moyen_questionnaires: number
}

export interface CritereScore {
  numero: number
  label: string
  score: number
  indicateurs_conformes: number
  indicateurs_total: number
}

export interface QualiopiIndicateursResponse {
  score_global: number
  stats: QualiopiStats
  criteres: CritereScore[]
  updated_at: string
}

export interface QualiteItem {
  id: string
  type: 'reclamation' | 'action_corrective' | 'amelioration' | 'non_conformite'
  titre: string
  description: string
  statut: 'OUVERTE' | 'EN_COURS' | 'RESOLUE' | 'CLOTUREE'
  priorite: 'HAUTE' | 'NORMALE' | 'BASSE'
  indicateur_qualiopi?: string
  critere_qualiopi?: number
  actions_menees?: string
  date_resolution?: string
  lead_id?: string
  session_id?: string
  responsable_id?: string
  created_at: string
  updated_at: string
  leads?: { nom: string; prenom: string }
  sessions?: { nom: string }
  equipe?: { prenom: string; nom: string }
}

export interface ReclamationsResponse {
  items: QualiteItem[]
  stats: {
    total: number
    ouvertes: number
    en_cours: number
    resolues: number
    taux_resolution: number
    par_type: Record<string, number>
  }
}

// ── Hook indicateurs Qualiopi ──
export function useQualiopiIndicateurs() {
  return useQuery<QualiopiIndicateursResponse>({
    queryKey: ['qualiopi-indicateurs'],
    queryFn: async () => {
      const res = await fetch('/api/qualiopi/indicateurs')
      if (!res.ok) throw new Error('Erreur chargement indicateurs')
      return res.json()
    },
    staleTime: 5 * 60_000, // Cache 5 min
  })
}

// ── Hook réclamations / actions qualité ──
export function useReclamations(filters?: { statut?: string; type?: string; priorite?: string }) {
  const params = new URLSearchParams()
  if (filters?.statut) params.set('statut', filters.statut)
  if (filters?.type) params.set('type', filters.type)
  if (filters?.priorite) params.set('priorite', filters.priorite)

  return useQuery<ReclamationsResponse>({
    queryKey: ['qualiopi-reclamations', filters],
    queryFn: async () => {
      const res = await fetch(`/api/qualiopi/reclamations?${params}`)
      if (!res.ok) throw new Error('Erreur chargement réclamations')
      return res.json()
    },
    staleTime: 30_000,
  })
}

// ── Mutation créer réclamation ──
export function useCreateReclamation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      type: string
      titre: string
      description: string
      priorite?: string
      indicateur_qualiopi?: string
      critere_qualiopi?: number
      lead_id?: string
      session_id?: string
      responsable_id?: string
    }) => {
      const res = await fetch('/api/qualiopi/reclamations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur création' }))
        throw new Error(err.error)
      }
      return res.json() as Promise<{ item: QualiteItem }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qualiopi-reclamations'] })
      qc.invalidateQueries({ queryKey: ['qualiopi-indicateurs'] })
      toast.success('Réclamation créée')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur création')
    },
  })
}

// ── Hook questionnaires (templates + envois) ──
export function useQuestionnaires() {
  return useQuery({
    queryKey: ['questionnaires'],
    queryFn: async () => {
      const res = await fetch('/api/questionnaires')
      if (!res.ok) throw new Error('Erreur chargement questionnaires')
      return res.json() as Promise<{ templates: any[]; stats: any }>
    },
    staleTime: 60_000,
  })
}
