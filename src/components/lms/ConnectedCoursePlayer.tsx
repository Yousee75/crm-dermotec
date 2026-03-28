'use client'

// ============================================================
// CRM SATOREA — Connected Course Player
// Wrapper qui connecte CoursePlayer (UI) aux hooks Supabase
// ============================================================

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, BookOpen } from 'lucide-react'
import CoursePlayer from '@/components/lms/CoursePlayer'
import type { Module, Content } from '@/components/lms/CoursePlayer'
import {
  useFormationModules,
  useContentProgress,
  useTrackView,
  useCompleteContent,
  useDownloadContent,
} from '@/hooks/use-formation-content'
import type {
  FormationModule,
  ModuleContenu,
  ContentProgressItem,
} from '@/hooks/use-formation-content'

// ============================================================
// PROPS
// ============================================================

interface ConnectedCoursePlayerProps {
  formationId: string
  formationNom: string
  inscriptionId: string
}

// ============================================================
// MAPPING — Adapter les données hooks vers les types CoursePlayer
// ============================================================

function mapStatut(statut?: ContentProgressItem['statut']): Content['progress_statut'] {
  if (!statut) return 'non_vu'
  switch (statut) {
    case 'termine': return 'complete'
    case 'en_cours': return 'en_cours'
    case 'non_commence':
    default: return 'non_vu'
  }
}

function mapContentType(type: ModuleContenu['type']): Content['type'] {
  // Les types du hook sont un sous-ensemble des types CoursePlayer
  // 'video' | 'pdf' | 'quiz' | 'texte' | 'exercice' | 'lien'
  return type as Content['type']
}

function mapContenuToContent(
  contenu: ModuleContenu,
  progressMap: Map<string, ContentProgressItem>
): Content {
  const progress = progressMap.get(contenu.id)

  return {
    id: contenu.id,
    titre: contenu.titre,
    slug: contenu.id, // Pas de slug dans ModuleContenu, on utilise l'id
    type: mapContentType(contenu.type),
    description: undefined,
    ordre: contenu.ordre,
    // Fichier / URL
    file_name: contenu.url ? contenu.url.split('/').pop() : undefined,
    // Video — si type video, l'url est la video_url
    video_url: contenu.type === 'video' ? contenu.url : undefined,
    // Audio (le type peut être étendu côté DB)
    audio_url: (contenu.type as string) === 'audio' ? contenu.url : undefined,
    // Durée
    video_duration_seconds: contenu.duree_minutes ? contenu.duree_minutes * 60 : undefined,
    // Contenu inline (texte, quiz)
    contenu: contenu.contenu_texte ? { text: contenu.contenu_texte } : undefined,
    // Config
    telechargeable: contenu.type === 'pdf' || (contenu.type as string) === 'ppt',
    obligatoire: contenu.obligatoire,
    points: contenu.obligatoire ? 10 : 5, // Points par défaut
    // Progression
    progress_statut: mapStatut(progress?.statut),
    progress_pct: progress?.statut === 'termine' ? 100 : progress?.statut === 'en_cours' ? 50 : 0,
    score_quiz: progress?.score_quiz ?? undefined,
    // Accès — pas de verrouillage par défaut
    locked: false,
  }
}

function mapModuleToPlayerModule(
  module: FormationModule,
  progressMap: Map<string, ContentProgressItem>
): Module {
  const contents = (module.contenus || []).map((c) =>
    mapContenuToContent(c, progressMap)
  )

  const completed = contents.filter((c) => c.progress_statut === 'complete').length

  return {
    id: module.id,
    titre: module.titre,
    slug: module.id, // Pas de slug dans FormationModule
    description: module.description,
    ordre: module.ordre,
    duree_minutes: module.duree_minutes,
    contents,
    progress: {
      completed,
      total: contents.length,
    },
  }
}

// ============================================================
// COMPOSANT WRAPPER
// ============================================================

export default function ConnectedCoursePlayer({
  formationId,
  formationNom,
  inscriptionId,
}: ConnectedCoursePlayerProps) {
  const router = useRouter()
  const [currentContentId, setCurrentContentId] = useState<string | undefined>(undefined)

  // ---------- Données ----------
  const {
    data: rawModules,
    isLoading: modulesLoading,
    error: modulesError,
  } = useFormationModules(formationId)

  const {
    data: progressData,
    isLoading: progressLoading,
    error: progressError,
  } = useContentProgress(inscriptionId)

  // ---------- Mutations ----------
  const trackViewMutation = useTrackView()
  const completeContentMutation = useCompleteContent()
  const downloadContentMutation = useDownloadContent()

  // ---------- Mapping progressMap ----------
  const progressMap = useMemo(() => {
    const map = new Map<string, ContentProgressItem>()
    if (progressData?.modules) {
      for (const mod of progressData.modules) {
        if (mod.progression) {
          for (const p of mod.progression) {
            map.set(p.contenu_id, p)
          }
        }
      }
    }
    return map
  }, [progressData])

  // ---------- Modules mappés pour CoursePlayer ----------
  const modules: Module[] = useMemo(() => {
    if (!rawModules) return []
    return rawModules.map((m) => mapModuleToPlayerModule(m, progressMap))
  }, [rawModules, progressMap])

  // ---------- Progression globale ----------
  const progressionGlobale = useMemo(() => {
    // Utiliser la valeur du backend si disponible
    if (progressData?.progressionPct !== undefined) {
      return Math.round(progressData.progressionPct)
    }
    // Sinon calculer depuis les modules mappés
    const allContents = modules.flatMap((m) => m.contents)
    if (allContents.length === 0) return 0
    const completed = allContents.filter((c) => c.progress_statut === 'complete').length
    return Math.round((completed / allContents.length) * 100)
  }, [progressData, modules])

  // ---------- Points ----------
  const pointsTotaux = useMemo(() => {
    return modules.flatMap((m) => m.contents).reduce((sum, c) => sum + (c.points || 0), 0)
  }, [modules])

  const pointsGagnes = useMemo(() => {
    if (progressData?.pointsGagnes !== undefined) {
      return progressData.pointsGagnes
    }
    return modules
      .flatMap((m) => m.contents)
      .filter((c) => c.progress_statut === 'complete')
      .reduce((sum, c) => sum + (c.points || 0), 0)
  }, [progressData, modules])

  // ---------- Auto-select premier contenu non terminé ----------
  const effectiveContentId = useMemo(() => {
    if (currentContentId) return currentContentId
    // Trouver le premier contenu non terminé
    const allContents = modules.flatMap((m) => m.contents)
    const firstIncomplete = allContents.find((c) => c.progress_statut !== 'complete')
    return firstIncomplete?.id || allContents[0]?.id
  }, [currentContentId, modules])

  // ---------- Callbacks ----------
  const handleContentSelect = useCallback((contentId: string) => {
    setCurrentContentId(contentId)
  }, [])

  const handleComplete = useCallback(
    (contentId: string, data?: { scoreQuiz?: number }) => {
      completeContentMutation.mutate({
        inscriptionId,
        contentId,
        scoreQuiz: data?.scoreQuiz,
      })
    },
    [inscriptionId, completeContentMutation]
  )

  const handleDownload = useCallback(
    (contentId: string) => {
      downloadContentMutation.mutate({
        contentId,
        inscriptionId,
      })
    },
    [inscriptionId, downloadContentMutation]
  )

  const handleTrackView = useCallback(
    (contentId: string, tempsSecondes: number) => {
      trackViewMutation.mutate({
        inscriptionId,
        contentId,
        tempsSecondes,
      })
    },
    [inscriptionId, trackViewMutation]
  )

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  // ---------- Loading ----------
  if (modulesLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111111]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#FF5C00]" />
          <p className="text-sm text-[#999999]">Chargement de la formation...</p>
        </div>
      </div>
    )
  }

  // ---------- Error ----------
  if (modulesError || progressError) {
    const errorMsg =
      (modulesError as Error)?.message ||
      (progressError as Error)?.message ||
      'Erreur de chargement'

    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111111]">
        <div className="text-center space-y-4 max-w-md px-6">
          <AlertCircle className="h-12 w-12 mx-auto text-[#FF2D78]" />
          <h2 className="text-lg font-semibold text-white">Erreur de chargement</h2>
          <p className="text-sm text-[#999999]">{errorMsg}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-lg bg-[#FF5C00] hover:bg-[#E65200] text-white text-sm font-medium transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  // ---------- Empty state ----------
  if (!modules || modules.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111111]">
        <div className="text-center space-y-4 max-w-md px-6">
          <BookOpen className="h-12 w-12 mx-auto text-[#3A3A3A]" />
          <h2 className="text-lg font-semibold text-white">Aucun contenu disponible</h2>
          <p className="text-sm text-[#999999]">
            Les contenus de cette formation n'ont pas encore ete publies.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-lg bg-[#FF5C00] hover:bg-[#E65200] text-white text-sm font-medium transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  // ---------- Render ----------
  return (
    <CoursePlayer
      formationNom={formationNom}
      modules={modules}
      currentContentId={effectiveContentId}
      progressionGlobale={progressionGlobale}
      pointsGagnes={pointsGagnes}
      pointsTotaux={pointsTotaux}
      onContentSelect={handleContentSelect}
      onComplete={handleComplete}
      onDownload={handleDownload}
      onTrackView={handleTrackView}
      onBack={handleBack}
    />
  )
}

// ============================================================
// EXPORTS
// ============================================================

export { type ConnectedCoursePlayerProps }
