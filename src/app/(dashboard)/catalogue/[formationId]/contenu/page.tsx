'use client'

export const dynamic = 'force-dynamic'

// ============================================================
// CRM DERMOTEC — Gestion Contenus Formation (Admin / Formatrice)
// Upload, organisation et visualisation des supports LMS
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  BookOpen, Video, FileText, Music, Image as ImageIcon,
  ChevronDown, ChevronUp, Eye, Trash2, GripVertical,
  Loader2, ArrowLeft, BarChart3, Layers, Package,
  Plus, ExternalLink, AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import ContentUploader from '@/components/lms/ContentUploader'
import { useFormationModules, useUploadContent } from '@/hooks/use-formation-content'
import type { FormationModule, ModuleContenu } from '@/hooks/use-formation-content'

// ============================================================
// TYPES LOCAUX
// ============================================================

interface FormationInfo {
  id: string
  nom: string
  categorie: string
  duree_jours: number
  duree_heures: number
}

interface ModuleWithStats extends FormationModule {
  totalVues: number
}

// ============================================================
// HELPERS
// ============================================================

const TYPE_CONFIG: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  video: { icon: Video, color: 'text-cyan-600 bg-cyan-50', label: 'Video' },
  pdf: { icon: FileText, color: 'text-[#FF2D78] bg-[#FFE0EF]', label: 'PDF' },
  quiz: { icon: BookOpen, color: 'text-[#FF8C42] bg-[#FFF3E8]', label: 'Quiz' },
  texte: { icon: FileText, color: 'text-[#777777] bg-[#FAF8F5]', label: 'Texte' },
  exercice: { icon: BookOpen, color: 'text-emerald-600 bg-emerald-50', label: 'Exercice' },
  lien: { icon: ExternalLink, color: 'text-violet-600 bg-violet-50', label: 'Lien' },
  ppt: { icon: FileText, color: 'text-orange-600 bg-orange-50', label: 'Presentation' },
  audio: { icon: Music, color: 'text-violet-600 bg-violet-50', label: 'Audio' },
  image: { icon: ImageIcon, color: 'text-emerald-600 bg-emerald-50', label: 'Image' },
}

function formatDuration(minutes?: number): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m > 0 ? m : ''}`
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function FormationContenuPage() {
  const params = useParams()
  const router = useRouter()
  const formationId = params?.formationId as string

  // State
  const [formation, setFormation] = useState<FormationInfo | null>(null)
  const [formationLoading, setFormationLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Hooks LMS
  const {
    data: modules,
    isLoading: modulesLoading,
    refetch: refetchModules,
  } = useFormationModules(formationId)

  const uploadMutation = useUploadContent()

  // Charger les infos de la formation
  useEffect(() => {
    if (!formationId) return
    fetchFormation()
  }, [formationId])

  // Ouvrir tous les modules par defaut quand charges
  useEffect(() => {
    if (modules && modules.length > 0) {
      setExpandedModules(new Set(modules.map((m) => m.id)))
    }
  }, [modules])

  const fetchFormation = async () => {
    try {
      setFormationLoading(true)
      const res = await fetch(`/api/formation-content?formationId=${encodeURIComponent(formationId)}&meta=true`)
      if (res.ok) {
        const data = await res.json()
        if (data.formation) {
          setFormation(data.formation)
        } else if (data.length > 0) {
          // L'API retourne les modules — extraire le nom depuis le formationId
          setFormation({
            id: formationId,
            nom: 'Formation',
            categorie: '',
            duree_jours: 0,
            duree_heures: 0,
          })
        }
      }
    } catch (err) {
      console.error('Erreur chargement formation:', err)
    } finally {
      setFormationLoading(false)
    }
  }

  // Toggle accordion
  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId)
      return next
    })
  }, [])

  // Upload handler pour ContentUploader
  const handleUpload = useCallback(
    async (item: { file: File; titre: string; type: string; moduleId: string }) => {
      await uploadMutation.mutateAsync({
        file: item.file,
        formationId,
        moduleId: item.moduleId,
        titre: item.titre,
        type: item.type as ModuleContenu['type'],
      })
    },
    [formationId, uploadMutation]
  )

  // Creer un module
  const handleCreateModule = useCallback(
    async (module: { titre: string; jourFormation?: number }): Promise<string> => {
      const res = await fetch('/api/formation-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-module',
          formationId,
          titre: module.titre,
          jourFormation: module.jourFormation,
        }),
      })
      if (!res.ok) throw new Error('Erreur creation module')
      const data = await res.json()
      await refetchModules()
      return data.id || ''
    },
    [formationId, refetchModules]
  )

  // Ajouter video par URL
  const handleAddVideoUrl = useCallback(
    async (params: { url: string; titre: string; moduleId: string; provider: string }) => {
      const res = await fetch('/api/formation-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-video-url',
          formationId,
          moduleId: params.moduleId,
          titre: params.titre,
          url: params.url,
          provider: params.provider,
        }),
      })
      if (!res.ok) throw new Error('Erreur ajout video')
      await refetchModules()
    },
    [formationId, refetchModules]
  )

  // Supprimer un contenu
  const handleDeleteContent = useCallback(
    async (contentId: string) => {
      if (!confirm('Supprimer ce contenu ? Cette action est irreversible.')) return
      try {
        setDeleteLoading(contentId)
        const res = await fetch('/api/formation-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete-content',
            contentId,
            formationId,
          }),
        })
        if (!res.ok) throw new Error('Erreur suppression')
        await refetchModules()
      } catch (err) {
        console.error('Erreur suppression contenu:', err)
      } finally {
        setDeleteLoading(null)
      }
    },
    [formationId, refetchModules]
  )

  // Stats
  const totalModules = modules?.length || 0
  const totalContenus = modules?.reduce((sum, m) => sum + (m.contenus?.length || 0), 0) || 0
  const totalDuree = modules?.reduce(
    (sum, m) => sum + (m.contenus || []).reduce((s, c) => s + (c.duree_minutes || 0), 0),
    0
  ) || 0

  // Transformer modules pour le ContentUploader
  const uploaderModules = (modules || []).map((m) => ({
    id: m.id,
    titre: m.titre,
    slug: m.id,
    jour_formation: undefined,
    ordre: m.ordre,
  }))

  // ============================================================
  // LOADING
  // ============================================================

  if (formationLoading && modulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-[#777777]">Chargement de la formation...</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/catalogue')}
          className="p-2 rounded-lg hover:bg-[#F4F0EB] transition-colors"
          aria-label="Retour au catalogue"
        >
          <ArrowLeft className="w-5 h-5 text-[#777777]" />
        </button>
        <PageHeader
          title={formation?.nom || 'Contenus de formation'}
          description={
            formation?.categorie
              ? `${formation.categorie} — ${formation.duree_jours}j (${formation.duree_heures}h)`
              : 'Gestion des supports pedagogiques'
          }
        />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Layers className="w-5 h-5 text-cyan-600" />}
          label="Modules"
          value={totalModules}
          bgColor="bg-cyan-50"
        />
        <StatCard
          icon={<Package className="w-5 h-5 text-emerald-600" />}
          label="Contenus"
          value={totalContenus}
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-violet-600" />}
          label="Duree totale"
          value={formatDuration(totalDuree) || '0 min'}
          bgColor="bg-violet-50"
        />
      </div>

      {/* Content Uploader */}
      <div className="bg-white rounded-xl border border-[#EEEEEE] p-6">
        <ContentUploader
          formationId={formationId}
          formationNom={formation?.nom || 'Formation'}
          modules={uploaderModules}
          onUpload={handleUpload}
          onCreateModule={handleCreateModule}
          onAddVideoUrl={handleAddVideoUrl}
        />
      </div>

      {/* Liste des modules et contenus */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">
          Modules et contenus ({totalModules} module{totalModules > 1 ? 's' : ''})
        </h2>

        {modulesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#999999]" />
          </div>
        ) : !modules || modules.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#EEEEEE]">
            <BookOpen className="h-12 w-12 text-[#999999] mx-auto mb-4" />
            <p className="text-[#777777] font-medium">Aucun module pour cette formation</p>
            <p className="text-sm text-[#999999] mt-1">
              Utilisez le formulaire ci-dessus pour creer votre premier module
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {modules.map((module, moduleIdx) => {
              const isExpanded = expandedModules.has(module.id)
              const contenus = module.contenus || []

              return (
                <div
                  key={module.id}
                  className="bg-white rounded-xl border border-[#EEEEEE] overflow-hidden"
                >
                  {/* Header module — accordion */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[#FAF8F5] transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      {moduleIdx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1A1A1A] truncate">
                        {module.titre}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-[#777777]">
                          {contenus.length} contenu{contenus.length > 1 ? 's' : ''}
                        </span>
                        {module.duree_minutes && (
                          <span className="text-xs text-[#999999]">
                            {formatDuration(module.duree_minutes)}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[#F4F0EB] text-[#777777]">
                      {contenus.length}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#999999] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#999999] flex-shrink-0" />
                    )}
                  </button>

                  {/* Contenus du module */}
                  {isExpanded && (
                    <div className="border-t border-[#F4F0EB]">
                      {contenus.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm text-[#999999]">
                            Aucun contenu dans ce module
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#FAF8F5]">
                          {contenus.map((contenu, contenuIdx) => {
                            const config = TYPE_CONFIG[contenu.type] || TYPE_CONFIG.pdf
                            const Icon = config.icon

                            return (
                              <div
                                key={contenu.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAF8F5]/50 transition-colors group"
                              >
                                {/* Drag handle placeholder */}
                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab">
                                  <GripVertical className="w-4 h-4 text-[#999999]" />
                                </div>

                                {/* Ordre */}
                                <span className="text-xs text-[#999999] w-5 text-right flex-shrink-0">
                                  {contenuIdx + 1}.
                                </span>

                                {/* Icone type */}
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#3A3A3A] truncate">
                                    {contenu.titre}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] uppercase tracking-wide text-[#999999]">
                                      {config.label}
                                    </span>
                                    {contenu.duree_minutes && (
                                      <span className="text-[10px] text-[#999999]">
                                        {formatDuration(contenu.duree_minutes)}
                                      </span>
                                    )}
                                    {contenu.obligatoire && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-[#FFF3E8] text-[#FF8C42] rounded font-medium">
                                        Obligatoire
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {contenu.url && (
                                    <a
                                      href={contenu.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg hover:bg-[#F4F0EB] transition-colors"
                                      title="Voir le contenu"
                                    >
                                      <Eye className="w-4 h-4 text-[#777777]" />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleDeleteContent(contenu.id)}
                                    disabled={deleteLoading === contenu.id}
                                    className="p-1.5 rounded-lg hover:bg-[#FFE0EF] transition-colors"
                                    title="Supprimer"
                                  >
                                    {deleteLoading === contenu.id ? (
                                      <Loader2 className="w-4 h-4 text-[#999999] animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4 text-[#999999] hover:text-[#FF2D78]" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// SUB-COMPOSANTS
// ============================================================

function StatCard({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  bgColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-[#EEEEEE] p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
        <p className="text-xs text-[#777777]">{label}</p>
      </div>
    </div>
  )
}
