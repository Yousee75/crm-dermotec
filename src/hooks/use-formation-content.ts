'use client'

// ============================================================
// CRM DERMOTEC — Hooks LMS Formation Content
// Modules, contenus, progression, tracking, upload/download
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// --------------------------------------------------------
// Types
// --------------------------------------------------------

export interface FormationModule {
  id: string
  formation_id: string
  titre: string
  description?: string
  ordre: number
  duree_minutes?: number
  contenus: ModuleContenu[]
}

export interface ModuleContenu {
  id: string
  module_id: string
  titre: string
  type: 'video' | 'pdf' | 'quiz' | 'texte' | 'exercice' | 'lien'
  url?: string
  contenu_texte?: string
  duree_minutes?: number
  ordre: number
  obligatoire: boolean
  created_at: string
}

export interface ContentProgressItem {
  contenu_id: string
  statut: 'non_commence' | 'en_cours' | 'termine'
  temps_total_secondes: number
  score_quiz?: number
  completed_at?: string
}

export interface ContentProgressResponse {
  modules: Array<FormationModule & {
    progression: ContentProgressItem[]
    progressionPct: number
  }>
  progressionPct: number
  pointsGagnes: number
}

export interface DownloadResponse {
  url: string
  expiresAt: string
}

export interface UploadResponse {
  success: boolean
  contenu_id?: string
  storage_path?: string
  error?: string
}

// --------------------------------------------------------
// Helper fetch avec gestion erreurs
// --------------------------------------------------------

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `Erreur ${res.status}`)
  }
  return res.json()
}

// --------------------------------------------------------
// 1. useFormationModules — Liste modules + contenus
// --------------------------------------------------------

export function useFormationModules(formationId: string) {
  return useQuery({
    queryKey: ['formation-modules', formationId],
    queryFn: () =>
      apiFetch<FormationModule[]>(
        `/api/formation-content?formationId=${encodeURIComponent(formationId)}`
      ),
    enabled: !!formationId,
    staleTime: 5 * 60 * 1000, // 5 min — contenu change rarement
  })
}

// --------------------------------------------------------
// 2. useModuleContents — Contenus d'un module
// --------------------------------------------------------

export function useModuleContents(moduleId: string) {
  return useQuery({
    queryKey: ['module-contents', moduleId],
    queryFn: () =>
      apiFetch<ModuleContenu[]>(
        `/api/formation-content?moduleId=${encodeURIComponent(moduleId)}`
      ),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000,
  })
}

// --------------------------------------------------------
// 3. useContentProgress — Progression du stagiaire
// --------------------------------------------------------

export function useContentProgress(inscriptionId: string) {
  return useQuery({
    queryKey: ['content-progress', inscriptionId],
    queryFn: () =>
      apiFetch<ContentProgressResponse>(
        `/api/formation-content?inscriptionId=${encodeURIComponent(inscriptionId)}`
      ),
    enabled: !!inscriptionId,
    staleTime: 30 * 1000, // 30s — progression change souvent
  })
}

// --------------------------------------------------------
// 4. useTrackView — Tracker qu'un contenu a ete vu
// --------------------------------------------------------

export function useTrackView() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      inscriptionId: string
      contentId: string
      tempsSecondes: number
    }) =>
      apiFetch<{ success: boolean }>('/api/formation-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track',
          inscriptionId: params.inscriptionId,
          contentId: params.contentId,
          tempsSecondes: params.tempsSecondes,
        }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['content-progress', variables.inscriptionId] })
    },
  })
}

// --------------------------------------------------------
// 5. useCompleteContent — Marquer un contenu comme termine
// --------------------------------------------------------

export function useCompleteContent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      inscriptionId: string
      contentId: string
      scoreQuiz?: number
      reponsesQuiz?: Record<string, unknown>
    }) =>
      apiFetch<{ success: boolean; pointsGagnes?: number }>('/api/formation-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          inscriptionId: params.inscriptionId,
          contentId: params.contentId,
          scoreQuiz: params.scoreQuiz,
          reponsesQuiz: params.reponsesQuiz,
        }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['content-progress', variables.inscriptionId] })
      // Invalider aussi les modules au cas ou le statut global change
      qc.invalidateQueries({ queryKey: ['formation-modules'] })
    },
  })
}

// --------------------------------------------------------
// 6. useDownloadContent — Telecharger un fichier (signed URL)
// --------------------------------------------------------

export function useDownloadContent() {
  return useMutation({
    mutationFn: async (params: {
      contentId: string
      inscriptionId: string
    }) => {
      const result = await apiFetch<DownloadResponse>('/api/formation-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'download',
          contentId: params.contentId,
          inscriptionId: params.inscriptionId,
        }),
      })

      // Ouvrir dans un nouvel onglet
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
      }

      return result
    },
  })
}

// --------------------------------------------------------
// 7. useUploadContent — Upload fichier (admin/formatrice)
// --------------------------------------------------------

export function useUploadContent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      file: File
      formationId: string
      moduleId: string
      titre: string
      type: ModuleContenu['type']
    }) => {
      const formData = new FormData()
      formData.append('file', params.file)
      formData.append('action', 'upload')
      formData.append('formationId', params.formationId)
      formData.append('moduleId', params.moduleId)
      formData.append('titre', params.titre)
      formData.append('type', params.type)

      const res = await fetch('/api/formation-content', {
        method: 'POST',
        body: formData, // Pas de Content-Type header — le browser ajoute le boundary
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(body.error || `Erreur ${res.status}`)
      }

      return res.json() as Promise<UploadResponse>
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['formation-modules', variables.formationId] })
      qc.invalidateQueries({ queryKey: ['module-contents', variables.moduleId] })
    },
  })
}
