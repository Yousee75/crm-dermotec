'use client'
// ============================================================
// CRM SATOREA — Content Uploader
// Interface admin/formatrice pour uploader les supports de formation
// Drag & drop, multi-fichiers, preview, organisation par module
// ============================================================

import { useState, useCallback, useRef } from 'react'
import {
  Upload, X, FileText, Video, Music, Image as ImageIcon,
  Plus, GripVertical, Trash2, Eye, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface UploadItem {
  id: string
  file: File
  titre: string
  type: 'video' | 'ppt' | 'pdf' | 'audio' | 'image'
  moduleId: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number // 0-100
  error?: string
  // Vidéo externe
  videoUrl?: string
  videoProvider?: 'youtube' | 'vimeo' | 'bunny'
}

interface ModuleConfig {
  id: string
  titre: string
  slug: string
  jour_formation?: number
  ordre: number
}

interface ContentUploaderProps {
  formationId: string
  formationNom: string
  modules: ModuleConfig[]
  onUpload: (item: { file: File; titre: string; type: string; moduleId: string }) => Promise<void>
  onCreateModule: (module: { titre: string; jourFormation?: number }) => Promise<string>
  onAddVideoUrl: (params: { url: string; titre: string; moduleId: string; provider: string }) => Promise<void>
}

// ============================================================
// HELPERS
// ============================================================

const ACCEPTED_TYPES: Record<string, string[]> = {
  ppt: ['.ppt', '.pptx', '.key', '.odp'],
  pdf: ['.pdf'],
  video: ['.mp4', '.webm', '.mov', '.avi'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
  image: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
}

const ALL_ACCEPTED = Object.values(ACCEPTED_TYPES).flat().join(',')

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB

function detectType(file: File): UploadItem['type'] {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  for (const [type, exts] of Object.entries(ACCEPTED_TYPES)) {
    if (exts.includes(ext)) return type as UploadItem['type']
  }
  return 'pdf' // fallback
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const TYPE_CONFIG: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  ppt: { icon: FileText, color: 'text-orange-400 bg-orange-500/10', label: 'Présentation' },
  pdf: { icon: FileText, color: 'text-[#FF2D78] bg-[#FF2D78]/10', label: 'PDF' },
  video: { icon: Video, color: 'text-cyan-400 bg-cyan-500/10', label: 'Vidéo' },
  audio: { icon: Music, color: 'text-violet-400 bg-violet-500/10', label: 'Audio' },
  image: { icon: ImageIcon, color: 'text-emerald-400 bg-emerald-500/10', label: 'Image' },
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function ContentUploader({
  formationId,
  formationNom,
  modules,
  onUpload,
  onCreateModule,
  onAddVideoUrl,
}: ContentUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [showVideoUrlForm, setShowVideoUrlForm] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoTitre, setVideoTitre] = useState('')
  const [videoModuleId, setVideoModuleId] = useState(modules[0]?.id || '')
  const [newModuleTitre, setNewModuleTitre] = useState('')
  const [newModuleJour, setNewModuleJour] = useState<number | undefined>()
  const [showNewModule, setShowNewModule] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ajouter des fichiers depuis le drag & drop ou le sélecteur
  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: UploadItem[] = Array.from(files)
      .filter(f => f.size <= MAX_FILE_SIZE)
      .map(f => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        titre: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        type: detectType(f),
        moduleId: modules[0]?.id || '',
        status: 'pending' as const,
        progress: 0,
      }))

    setItems(prev => [...prev, ...newItems])
  }, [modules])

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }, [addFiles])

  // Supprimer un item
  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  // Modifier un item
  const updateItem = useCallback((id: string, updates: Partial<UploadItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }, [])

  // Uploader tous les fichiers
  const uploadAll = useCallback(async () => {
    setIsUploading(true)
    const pending = items.filter(i => i.status === 'pending')

    for (const item of pending) {
      updateItem(item.id, { status: 'uploading', progress: 10 })
      try {
        await onUpload({
          file: item.file,
          titre: item.titre,
          type: item.type,
          moduleId: item.moduleId,
        })
        updateItem(item.id, { status: 'success', progress: 100 })
      } catch (err) {
        updateItem(item.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        })
      }
    }

    setIsUploading(false)
  }, [items, onUpload, updateItem])

  // Ajouter une vidéo par URL
  const addVideoByUrl = useCallback(async () => {
    if (!videoUrl || !videoTitre || !videoModuleId) return

    const provider = videoUrl.includes('youtube') || videoUrl.includes('youtu.be')
      ? 'youtube'
      : videoUrl.includes('vimeo')
        ? 'vimeo'
        : 'bunny'

    try {
      await onAddVideoUrl({ url: videoUrl, titre: videoTitre, moduleId: videoModuleId, provider })
      setVideoUrl('')
      setVideoTitre('')
      setShowVideoUrlForm(false)
    } catch {
      // Erreur gérée par le parent
    }
  }, [videoUrl, videoTitre, videoModuleId, onAddVideoUrl])

  // Créer un nouveau module
  const createModule = useCallback(async () => {
    if (!newModuleTitre) return
    try {
      await onCreateModule({ titre: newModuleTitre, jourFormation: newModuleJour })
      setNewModuleTitre('')
      setNewModuleJour(undefined)
      setShowNewModule(false)
    } catch {
      // Erreur gérée par le parent
    }
  }, [newModuleTitre, newModuleJour, onCreateModule])

  const pendingCount = items.filter(i => i.status === 'pending').length
  const successCount = items.filter(i => i.status === 'success').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Supports de formation</h2>
          <p className="text-sm text-[#777777]">{formationNom}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowVideoUrlForm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#EEEEEE] hover:bg-[#FAF8F5] text-sm transition-colors"
          >
            <Video className="w-4 h-4" />
            Ajouter vidéo YouTube
          </button>
          <button
            onClick={() => setShowNewModule(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau module
          </button>
        </div>
      </div>

      {/* Zone de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragOver
            ? 'border-cyan-400 bg-cyan-50'
            : 'border-[#EEEEEE] hover:border-[#EEEEEE] hover:bg-[#FAF8F5]'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALL_ACCEPTED}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          className="hidden"
        />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-cyan-500' : 'text-[#999999]'}`} />
        <p className="text-sm font-medium text-[#3A3A3A]">
          Glissez-déposez vos fichiers ici
        </p>
        <p className="text-xs text-[#777777] mt-1">
          ou cliquez pour parcourir — PPT, PDF, vidéo, audio, images — max 500 MB
        </p>
      </div>

      {/* Formulaire vidéo URL */}
      {showVideoUrlForm && (
        <div className="p-4 rounded-lg border border-[#EEEEEE] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Ajouter une vidéo par URL</h3>
            <button onClick={() => setShowVideoUrlForm(false)} className="p-1 hover:bg-[#F4F0EB] rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={videoTitre}
            onChange={(e) => setVideoTitre(e.target.value)}
            placeholder="Titre de la vidéo"
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <select
            value={videoModuleId}
            onChange={(e) => setVideoModuleId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            {modules.map(m => (
              <option key={m.id} value={m.id}>
                {m.jour_formation ? `J${m.jour_formation} — ` : ''}{m.titre}
              </option>
            ))}
          </select>
          <button
            onClick={addVideoByUrl}
            disabled={!videoUrl || !videoTitre}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500 disabled:opacity-50 transition-colors"
          >
            Ajouter
          </button>
        </div>
      )}

      {/* Formulaire nouveau module */}
      {showNewModule && (
        <div className="p-4 rounded-lg border border-[#EEEEEE] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Nouveau module</h3>
            <button onClick={() => setShowNewModule(false)} className="p-1 hover:bg-[#F4F0EB] rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={newModuleTitre}
            onChange={(e) => setNewModuleTitre(e.target.value)}
            placeholder="Ex: Théorie & Hygiène"
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="number"
            value={newModuleJour || ''}
            onChange={(e) => setNewModuleJour(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Jour de formation (optionnel)"
            className="w-full px-3 py-2 border rounded-lg text-sm"
            min={1}
            max={10}
          />
          <button
            onClick={createModule}
            disabled={!newModuleTitre}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500 disabled:opacity-50 transition-colors"
          >
            Créer le module
          </button>
        </div>
      )}

      {/* Liste des fichiers à uploader */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {pendingCount > 0 ? `${pendingCount} fichier(s) à envoyer` : `${successCount} fichier(s) envoyé(s)`}
            </h3>
            {pendingCount > 0 && (
              <button
                onClick={uploadAll}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-500 disabled:opacity-50 transition-colors"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isUploading ? 'Envoi...' : 'Tout envoyer'}
              </button>
            )}
          </div>

          {items.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.pdf
            const Icon = config.icon

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#EEEEEE] bg-white"
              >
                {/* Icône type */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Info fichier */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={item.titre}
                    onChange={(e) => updateItem(item.id, { titre: e.target.value })}
                    className="w-full text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                    disabled={item.status !== 'pending'}
                  />
                  <div className="flex items-center gap-2 text-xs text-[#777777]">
                    <span>{config.label}</span>
                    <span>·</span>
                    <span>{formatSize(item.file.size)}</span>
                    {item.status === 'uploading' && <span>· {item.progress}%</span>}
                  </div>
                  {/* Barre de progression */}
                  {item.status === 'uploading' && (
                    <div className="h-1 bg-[#F4F0EB] rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.error && (
                    <p className="text-xs text-[#FF2D78] mt-1">{item.error}</p>
                  )}
                </div>

                {/* Module selector */}
                {item.status === 'pending' && (
                  <select
                    value={item.moduleId}
                    onChange={(e) => updateItem(item.id, { moduleId: e.target.value })}
                    className="text-xs border rounded-lg px-2 py-1.5 bg-[#FAF8F5] max-w-[150px]"
                  >
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.jour_formation ? `J${m.jour_formation}` : ''} {m.titre}
                      </option>
                    ))}
                  </select>
                )}

                {/* Statut */}
                {item.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                {item.status === 'error' && <AlertCircle className="w-5 h-5 text-[#FF2D78] flex-shrink-0" />}
                {item.status === 'uploading' && <Loader2 className="w-5 h-5 text-cyan-500 animate-spin flex-shrink-0" />}

                {/* Supprimer */}
                {item.status === 'pending' && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 hover:bg-[#F4F0EB] rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-[#999999]" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { type UploadItem, type ModuleConfig, type ContentUploaderProps }
