'use client'
// ============================================================
// CRM SATOREA — Course Player (style Udemy)
// Layout 3 zones : Header + Contenu + Sidebar Curriculum
// Mobile-first, progress tracking, mode focus
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Play, CheckCircle2, Circle, Lock, Download,
  Maximize2, Minimize2, FileText, Video, Music,
  Image, ListChecks, HelpCircle, BookOpen, Link2,
  X, Menu, Clock, Award
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface Module {
  id: string
  titre: string
  slug: string
  description?: string
  icone?: string
  jour_formation?: number
  ordre: number
  duree_minutes?: number
  contents: Content[]
  progress?: { completed: number; total: number }
}

interface Content {
  id: string
  titre: string
  slug: string
  type: 'video' | 'ppt' | 'pdf' | 'audio' | 'image' | 'galerie' | 'quiz' | 'exercice' | 'texte' | 'lien' | 'checklist'
  description?: string
  ordre: number
  // Fichier
  file_name?: string
  file_size?: number
  // Vidéo
  video_url?: string
  video_provider?: string
  video_duration_seconds?: number
  // Audio
  audio_url?: string
  audio_duration_seconds?: number
  // Thumbnail
  video_thumbnail_url?: string
  // Inline
  contenu?: any
  // Config
  telechargeable?: boolean
  points?: number
  obligatoire?: boolean
  // Progression
  progress_statut?: 'non_vu' | 'en_cours' | 'complete'
  progress_pct?: number
  score_quiz?: number
  // Accès
  locked?: boolean
}

interface CoursePlayerProps {
  formationNom: string
  modules: Module[]
  currentContentId?: string
  progressionGlobale: number // 0-100
  pointsGagnes: number
  pointsTotaux: number
  onContentSelect: (contentId: string) => void
  onComplete: (contentId: string, data?: { scoreQuiz?: number }) => void
  onDownload: (contentId: string) => void
  onTrackView: (contentId: string, tempsSecondes: number) => void
  onBack: () => void
  // Contenu
  renderContent?: (content: Content) => React.ReactNode
}

// ============================================================
// HELPERS
// ============================================================

const TYPE_ICONS: Record<string, typeof Video> = {
  video: Video,
  ppt: FileText,
  pdf: FileText,
  audio: Music,
  image: Image,
  galerie: Image,
  quiz: HelpCircle,
  exercice: BookOpen,
  texte: BookOpen,
  lien: Link2,
  checklist: ListChecks,
}

const TYPE_LABELS: Record<string, string> = {
  video: 'Vidéo',
  ppt: 'Présentation',
  pdf: 'Document PDF',
  audio: 'Audio',
  image: 'Image',
  galerie: 'Galerie photos',
  quiz: 'Quiz',
  exercice: 'Exercice',
  texte: 'Texte',
  lien: 'Lien',
  checklist: 'Checklist',
}

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  return `${h}h${m % 60 > 0 ? `${m % 60}` : ''}`
}

function formatSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getStatusIcon(statut?: string, locked?: boolean) {
  if (locked) return <Lock className="w-4 h-4 text-gray-400" />
  if (statut === 'complete') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  if (statut === 'en_cours') return <Play className="w-4 h-4 text-cyan-500" />
  return <Circle className="w-4 h-4 text-gray-300" />
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function CoursePlayer({
  formationNom,
  modules,
  currentContentId,
  progressionGlobale,
  pointsGagnes,
  pointsTotaux,
  onContentSelect,
  onComplete,
  onDownload,
  onTrackView,
  onBack,
  renderContent,
}: CoursePlayerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(modules.map(m => m.id)))
  const [focusMode, setFocusMode] = useState(false)
  const viewTimerRef = useRef<ReturnType<typeof setInterval>>()
  const viewSecondsRef = useRef(0)

  // Trouver le contenu actuel
  const allContents = modules.flatMap(m => m.contents)
  const currentContent = allContents.find(c => c.id === currentContentId)
  const currentIndex = allContents.findIndex(c => c.id === currentContentId)
  const prevContent = currentIndex > 0 ? allContents[currentIndex - 1] : null
  const nextContent = currentIndex < allContents.length - 1 ? allContents[currentIndex + 1] : null

  // Timer de vue (track le temps passé)
  useEffect(() => {
    if (!currentContentId) return

    viewSecondsRef.current = 0
    viewTimerRef.current = setInterval(() => {
      viewSecondsRef.current += 1
      // Envoyer toutes les 30 secondes
      if (viewSecondsRef.current % 30 === 0) {
        onTrackView(currentContentId, viewSecondsRef.current)
      }
    }, 1000)

    return () => {
      if (viewTimerRef.current) clearInterval(viewTimerRef.current)
      // Envoyer le temps final
      if (viewSecondsRef.current > 0) {
        onTrackView(currentContentId, viewSecondsRef.current)
      }
    }
  }, [currentContentId])

  // Toggle module dans l'accordéon
  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId)
      return next
    })
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* ============================================================ */}
      {/* HEADER BAR */}
      {/* ============================================================ */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm z-20">
        {/* Gauche : retour + titre */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Retour"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-medium truncate max-w-[200px] md:max-w-[400px]">
            {formationNom}
          </h1>
        </div>

        {/* Centre : barre de progression */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-8">
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${progressionGlobale}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {progressionGlobale}% terminé
          </span>
        </div>

        {/* Droite : points + toggle sidebar */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
            <Award className="w-3.5 h-3.5" />
            {pointsGagnes}/{pointsTotaux}
          </div>
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors hidden md:block"
            title={focusMode ? 'Quitter le mode focus' : 'Mode focus'}
          >
            {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors md:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* ZONE PRINCIPALE : Contenu + Sidebar */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden">
        {/* --- ZONE CONTENU --- */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {currentContent ? (
            <>
              {/* Contenu principal */}
              <div className="flex-1 p-4 md:p-8">
                {/* Titre du contenu */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    {(() => { const Icon = TYPE_ICONS[currentContent.type] || BookOpen; return <Icon className="w-3.5 h-3.5" /> })()}
                    <span>{TYPE_LABELS[currentContent.type]}</span>
                    {currentContent.video_duration_seconds && (
                      <>
                        <span className="text-gray-600">·</span>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDuration(currentContent.video_duration_seconds)}</span>
                      </>
                    )}
                    {currentContent.obligatoire && (
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[10px] font-medium">
                        Obligatoire
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    {currentContent.titre}
                  </h2>
                  {currentContent.description && (
                    <p className="text-gray-400 mt-2 text-sm">{currentContent.description}</p>
                  )}
                </div>

                {/* Rendu du contenu selon le type */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  {renderContent ? (
                    renderContent(currentContent)
                  ) : (
                    <DefaultContentRenderer content={currentContent} />
                  )}
                </div>

                {/* Actions sous le contenu */}
                <div className="flex items-center justify-between mt-6 gap-4">
                  {currentContent.telechargeable && currentContent.file_name && (
                    <button
                      onClick={() => onDownload(currentContent.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                      {currentContent.file_size && (
                        <span className="text-gray-500">({formatSize(currentContent.file_size)})</span>
                      )}
                    </button>
                  )}

                  {currentContent.progress_statut !== 'complete' && (
                    <button
                      onClick={() => onComplete(currentContent.id)}
                      className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-sm font-medium transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Marquer comme terminé
                    </button>
                  )}

                  {currentContent.progress_statut === 'complete' && (
                    <div className="ml-auto flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Terminé
                      {currentContent.score_quiz !== undefined && (
                        <span className="text-gray-400">— Score : {currentContent.score_quiz}%</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* BOTTOM BAR : Navigation précédent/suivant */}
              <footer className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm">
                <button
                  onClick={() => prevContent && onContentSelect(prevContent.id)}
                  disabled={!prevContent}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{prevContent?.titre || 'Précédent'}</span>
                  <span className="sm:hidden">Préc.</span>
                </button>

                <span className="text-xs text-gray-500">
                  {currentIndex + 1} / {allContents.length}
                </span>

                <button
                  onClick={() => nextContent && onContentSelect(nextContent.id)}
                  disabled={!nextContent}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <span className="hidden sm:inline">{nextContent?.titre || 'Suivant'}</span>
                  <span className="sm:hidden">Suiv.</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </footer>
            </>
          ) : (
            /* État vide : pas de contenu sélectionné */
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">Sélectionnez une leçon</h3>
                <p className="text-sm text-gray-600">
                  Choisissez un contenu dans le menu à droite pour commencer
                </p>
              </div>
            </div>
          )}
        </main>

        {/* --- SIDEBAR CURRICULUM (style Udemy) --- */}
        {!focusMode && (
          <aside className={`
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            md:translate-x-0
            fixed md:static right-0 top-14 bottom-0 z-10
            w-80 md:w-[340px] flex-shrink-0
            bg-gray-900 border-l border-gray-800
            overflow-y-auto
            transition-transform duration-300
          `}>
            {/* Header sidebar */}
            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4">
              <h3 className="text-sm font-semibold text-gray-300">Contenu de la formation</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressionGlobale}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500">{progressionGlobale}%</span>
              </div>
            </div>

            {/* Modules accordéon */}
            <div className="divide-y divide-gray-800">
              {modules.map((module) => (
                <div key={module.id}>
                  {/* Header module */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {module.jour_formation && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                            J{module.jour_formation}
                          </span>
                        )}
                        <h4 className="text-sm font-medium text-gray-200 truncate">
                          {module.titre}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-500">
                          {module.progress?.completed || 0}/{module.progress?.total || module.contents.length}
                        </span>
                        {module.duree_minutes && (
                          <span className="text-[10px] text-gray-600">
                            · {formatDuration(module.duree_minutes * 60)}
                          </span>
                        )}
                      </div>
                    </div>
                    {expandedModules.has(module.id) ? (
                      <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}
                  </button>

                  {/* Liste contenus du module */}
                  {expandedModules.has(module.id) && (
                    <div className="pb-2">
                      {module.contents.map((content) => {
                        const isActive = content.id === currentContentId
                        const Icon = TYPE_ICONS[content.type] || BookOpen

                        return (
                          <button
                            key={content.id}
                            onClick={() => !content.locked && onContentSelect(content.id)}
                            disabled={content.locked}
                            className={`
                              w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors
                              ${isActive
                                ? 'bg-cyan-500/10 border-l-2 border-cyan-500'
                                : 'hover:bg-gray-800/50 border-l-2 border-transparent'
                              }
                              ${content.locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            {/* Icône statut */}
                            <div className="mt-0.5 flex-shrink-0">
                              {getStatusIcon(content.progress_statut, content.locked)}
                            </div>

                            {/* Info contenu */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-relaxed ${isActive ? 'text-cyan-300 font-medium' : 'text-gray-300'}`}>
                                {content.titre}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Icon className="w-3 h-3 text-gray-600" />
                                <span className="text-[10px] text-gray-600">
                                  {TYPE_LABELS[content.type]}
                                </span>
                                {content.video_duration_seconds && (
                                  <span className="text-[10px] text-gray-600">
                                    · {formatDuration(content.video_duration_seconds)}
                                  </span>
                                )}
                                {content.points && content.points > 0 && (
                                  <span className="text-[10px] text-amber-500">
                                    +{content.points} pts
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer sidebar : certificat */}
            {progressionGlobale >= 100 && (
              <div className="p-4 border-t border-gray-800">
                <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-300">Formation terminée !</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Votre certificat est disponible dans les documents.
                  </p>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

// ============================================================
// RENDERERS PAR TYPE DE CONTENU
// ============================================================

function DefaultContentRenderer({ content }: { content: Content }) {
  switch (content.type) {
    case 'video':
      return <VideoRenderer content={content} />
    case 'pdf':
    case 'ppt':
      return <FileRenderer content={content} />
    case 'audio':
      return <AudioRenderer content={content} />
    case 'texte':
      return <TextRenderer content={content} />
    case 'quiz':
      return <QuizPlaceholder content={content} />
    default:
      return (
        <div className="p-8 text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Contenu de type "{content.type}"</p>
        </div>
      )
  }
}

function VideoRenderer({ content }: { content: Content }) {
  if (!content.video_url) return null

  // YouTube embed
  if (content.video_provider === 'youtube' || content.video_url.includes('youtube') || content.video_url.includes('youtu.be')) {
    const videoId = content.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?/]+)/)?.[1]
    if (!videoId) return null

    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={content.titre}
        />
      </div>
    )
  }

  // Video HTML5 (Supabase Storage, Bunny, etc.)
  return (
    <video
      controls
      className="w-full aspect-video bg-black"
      poster={content.video_thumbnail_url}
      preload="metadata"
    >
      <source src={content.video_url} type="video/mp4" />
      Votre navigateur ne supporte pas la vidéo.
    </video>
  )
}

function FileRenderer({ content }: { content: Content }) {
  return (
    <div className="p-8 text-center">
      <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">{content.file_name || content.titre}</h3>
      <p className="text-sm text-gray-500 mb-4">
        {content.type === 'ppt' ? 'Présentation PowerPoint' : 'Document PDF'}
        {content.file_size && ` — ${formatSize(content.file_size)}`}
      </p>
      <p className="text-xs text-gray-600">
        Cliquez sur "Télécharger" ci-dessous pour obtenir le fichier.
      </p>
    </div>
  )
}

function AudioRenderer({ content }: { content: Content }) {
  const url = content.audio_url || content.video_url
  if (!url) return null

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
          <Music className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="font-medium">{content.titre}</h3>
          {content.audio_duration_seconds && (
            <p className="text-sm text-gray-500">{formatDuration(content.audio_duration_seconds)}</p>
          )}
        </div>
      </div>
      <audio controls className="w-full" preload="metadata">
        <source src={url} />
      </audio>
    </div>
  )
}

function TextRenderer({ content }: { content: Content }) {
  const markdown = content.contenu?.markdown || content.contenu?.text || content.description || ''

  return (
    <div className="p-6 md:p-8 prose prose-invert prose-sm max-w-none">
      {/* Rendu basique du markdown (sans lib externe) */}
      {markdown.split('\n').map((line: string, i: number) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-6 mb-3">{line.slice(2)}</h1>
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2">{line.slice(3)}</h2>
        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-medium mt-4 mb-2">{line.slice(4)}</h3>
        if (line.startsWith('- ')) return <li key={i} className="ml-4 text-gray-300">{line.slice(2)}</li>
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-2 border-cyan-500 pl-4 text-gray-400 italic">{line.slice(2)}</blockquote>
        if (line.trim() === '') return <br key={i} />
        return <p key={i} className="text-gray-300 leading-relaxed mb-2">{line}</p>
      })}
    </div>
  )
}

function QuizPlaceholder({ content }: { content: Content }) {
  const questions = content.contenu?.questions || []

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-medium">Quiz — {content.titre}</h3>
          <p className="text-sm text-gray-500">{questions.length} question{questions.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Quiz en cours de préparation...</p>
      ) : (
        <p className="text-gray-400 text-sm">
          Le quiz interactif sera disponible ici. Composant QuizBlock déjà disponible dans l'Academy.
        </p>
      )}
    </div>
  )
}

// ============================================================
// EXPORTS
// ============================================================

export { type Module, type Content, type CoursePlayerProps }
