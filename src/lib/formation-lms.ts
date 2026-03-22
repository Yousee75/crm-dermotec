// @ts-nocheck — Tables LMS pas encore dans database.ts (types Supabase non générés)
// ============================================================
// CRM DERMOTEC — Formation LMS Backend
// Upload/download fichiers, signed URLs, progression stagiaire
// Bucket: formation-content (privé) | Tables: migration 033
// ============================================================
import 'server-only'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormationModule {
  id: string
  formation_id: string
  titre: string
  slug: string
  description?: string
  icone: string
  couleur: string
  jour_formation?: number
  ordre: number
  duree_minutes?: number
  accessible_avant: boolean
  accessible_pendant: boolean
  accessible_apres: boolean
  is_published: boolean
  contents?: FormationContent[]
  progress?: { completed: number; total: number; pct: number }
}

export interface FormationContent {
  id: string
  module_id: string
  formation_id: string
  titre: string
  slug: string
  type:
    | 'video'
    | 'ppt'
    | 'pdf'
    | 'audio'
    | 'image'
    | 'galerie'
    | 'quiz'
    | 'exercice'
    | 'texte'
    | 'lien'
    | 'checklist'
  description?: string
  ordre: number
  // Fichier
  file_name?: string
  file_size?: number
  file_mime?: string
  // Vidéo
  video_url?: string
  video_provider?: string
  video_duration_seconds?: number
  video_thumbnail_url?: string
  // Audio
  audio_url?: string
  audio_duration_seconds?: number
  // Inline
  contenu?: any
  // Config
  telechargeable: boolean
  watermark_enabled: boolean
  points: number
  obligatoire: boolean
  score_minimum?: number
  // Stats
  vues_totales: number
  telechargements_totaux: number
  // Progression (si inscription fournie)
  progress_statut?: 'non_vu' | 'en_cours' | 'complete'
  progress_pct?: number
  score_quiz?: number
}

interface ModuleProgress {
  module: FormationModule
  contents: Array<
    FormationContent & {
      progress_statut: 'non_vu' | 'en_cours' | 'complete'
      progress_pct: number
      score_quiz?: number
    }
  >
  completed: number
  total: number
  pct: number
}

interface UploadContentParams {
  formationId: string
  moduleId: string
  file: File
  type: FormationContent['type']
  titre: string
}

interface TrackViewParams {
  inscriptionId: string
  contentId: string
  leadId: string
  tempsSecondes?: number
}

interface CompleteContentParams {
  inscriptionId: string
  contentId: string
  leadId: string
  scoreQuiz?: number
  reponsesQuiz?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUCKET = 'formation-content'
const SIGNED_URL_TTL = 3600 // 1 heure
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB
const LOG_PREFIX = '[LMS]'

/** MIME types autorisés par catégorie */
const ALLOWED_MIMES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  ppt: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
}

/** Extensions dangereuses interdites */
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.vbs', '.vbe',
  '.js', '.jse', '.ws', '.wsf', '.wsc', '.wsh', '.ps1', '.ps1xml', '.ps2',
  '.ps2xml', '.psc1', '.psc2', '.msh', '.msh1', '.msh2', '.inf', '.reg',
  '.rgs', '.sct', '.shb', '.shs', '.lnk', '.dll', '.sys', '.sh', '.bash',
])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lazy import du service client Supabase */
async function getSupabase() {
  const { createServiceSupabase } = await import('./supabase-server')
  return createServiceSupabase()
}

/** Log non-bloquant */
function log(message: string, data?: unknown) {
  try {
    if (data) {
      console.log(`${LOG_PREFIX} ${message}`, data)
    } else {
      console.log(`${LOG_PREFIX} ${message}`)
    }
  } catch {
    // silencieux
  }
}

function logError(message: string, err?: unknown) {
  try {
    console.error(`${LOG_PREFIX} ${message}`, err instanceof Error ? err.message : err)
  } catch {
    // silencieux
  }
}

/** Extraire l'extension d'un nom de fichier */
function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.slice(idx).toLowerCase() : ''
}

/** Valider un fichier avant upload */
function validateFile(file: File, type: FormationContent['type']): { valid: boolean; reason?: string } {
  // Taille
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, reason: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(0)} MB > 500 MB)` }
  }
  if (file.size === 0) {
    return { valid: false, reason: 'Fichier vide' }
  }

  // Extension dangereuse
  const ext = getExtension(file.name)
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return { valid: false, reason: `Extension interdite : ${ext}` }
  }

  // MIME autorisé (si le type a des mimes définis)
  const allowedForType = ALLOWED_MIMES[type]
  if (allowedForType && !allowedForType.includes(file.type)) {
    return { valid: false, reason: `Type MIME non autorisé pour ${type} : ${file.type}` }
  }

  return { valid: true }
}

/** Construire le chemin Storage */
function buildStoragePath(formationId: string, moduleSlug: string, filename: string): string {
  // Sanitize le nom de fichier
  const safe = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
  const ts = Date.now()
  return `${formationId}/${moduleSlug}/${ts}_${safe}`
}

// ---------------------------------------------------------------------------
// 1. Upload & Storage
// ---------------------------------------------------------------------------

/**
 * Upload un fichier vers Supabase Storage et crée l'entrée DB
 */
export async function uploadContent(params: UploadContentParams): Promise<{
  path: string
  size: number
  mime: string
  contentId: string
}> {
  const { formationId, moduleId, file, type, titre } = params

  // Validation
  const check = validateFile(file, type)
  if (!check.valid) {
    throw new Error(`Validation échouée : ${check.reason}`)
  }

  const supabase = await getSupabase()

  // Récupérer le module pour le slug
  const { data: mod, error: modErr } = await supabase
    .from('formation_modules')
    .select('slug, formation_id')
    .eq('id', moduleId)
    .single()

  if (modErr || !mod) {
    throw new Error(`Module introuvable : ${moduleId}`)
  }

  if (mod.formation_id !== formationId) {
    throw new Error('Le module ne correspond pas à cette formation')
  }

  // Upload vers Storage
  const storagePath = buildStoragePath(formationId, mod.slug, file.name)
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadErr) {
    throw new Error(`Upload Storage échoué : ${uploadErr.message}`)
  }

  // Slug du contenu
  const contentSlug = titre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Compter l'ordre max existant
  const { data: maxOrder } = await supabase
    .from('formation_contents')
    .select('ordre')
    .eq('module_id', moduleId)
    .order('ordre', { ascending: false })
    .limit(1)
    .single()

  const nextOrdre = (maxOrder?.ordre ?? 0) + 1

  // Créer l'entrée DB
  const { data: content, error: dbErr } = await supabase
    .from('formation_contents')
    .insert({
      module_id: moduleId,
      formation_id: formationId,
      titre,
      slug: contentSlug,
      type,
      file_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      file_mime: file.type,
      ordre: nextOrdre,
      telechargeable: true,
      watermark_enabled: type === 'pdf',
      points: 10,
      obligatoire: false,
      vues_totales: 0,
      telechargements_totaux: 0,
      is_published: true,
    })
    .select('id')
    .single()

  if (dbErr || !content) {
    // Rollback : supprimer le fichier uploadé
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {})
    throw new Error(`Création DB échouée : ${dbErr?.message}`)
  }

  log(`Contenu uploadé : ${titre} (${(file.size / 1024).toFixed(0)} KB)`, { contentId: content.id })

  return {
    path: storagePath,
    size: file.size,
    mime: file.type,
    contentId: content.id,
  }
}

/**
 * Supprimer un contenu (fichier Storage + entrée DB)
 */
export async function deleteContent(contentId: string): Promise<boolean> {
  const supabase = await getSupabase()

  // Récupérer le file_path avant suppression
  const { data: content, error: fetchErr } = await supabase
    .from('formation_contents')
    .select('file_path, titre')
    .eq('id', contentId)
    .single()

  if (fetchErr || !content) {
    logError('Contenu introuvable pour suppression', contentId)
    return false
  }

  // Supprimer du Storage si fichier présent
  if (content.file_path) {
    const { error: storageErr } = await supabase.storage
      .from(BUCKET)
      .remove([content.file_path])

    if (storageErr) {
      logError('Suppression Storage échouée', storageErr)
      // On continue quand même pour supprimer la DB
    }
  }

  // Supprimer les progressions liées
  await supabase
    .from('content_progress')
    .delete()
    .eq('content_id', contentId)
    .then(() => {})
    .catch(() => {})

  // Supprimer les logs de téléchargement
  await supabase
    .from('content_downloads')
    .delete()
    .eq('content_id', contentId)
    .then(() => {})
    .catch(() => {})

  // Supprimer l'entrée DB
  const { error: dbErr } = await supabase
    .from('formation_contents')
    .delete()
    .eq('id', contentId)

  if (dbErr) {
    logError('Suppression DB échouée', dbErr)
    return false
  }

  log(`Contenu supprimé : ${content.titre}`)
  return true
}

// ---------------------------------------------------------------------------
// 2. Download & Accès sécurisé
// ---------------------------------------------------------------------------

/**
 * Générer un signed URL pour télécharger un contenu
 * Vérifie l'accès, log le téléchargement, incrémente le compteur
 */
export async function getSignedDownloadUrl(
  contentId: string,
  inscriptionId: string,
  options?: { ipAddress?: string }
): Promise<{ url: string; expiresAt: string }> {
  const supabase = await getSupabase()

  // Vérifier l'accès
  const access = await checkContentAccess(inscriptionId, contentId)
  if (!access.allowed) {
    throw new Error(`Accès refusé : ${access.reason}`)
  }

  // Récupérer le contenu
  const { data: content, error: contentErr } = await supabase
    .from('formation_contents')
    .select('file_path, file_name, telechargeable, watermark_enabled, titre')
    .eq('id', contentId)
    .single()

  if (contentErr || !content) {
    throw new Error('Contenu introuvable')
  }

  if (!content.file_path) {
    throw new Error('Ce contenu ne possède pas de fichier téléchargeable')
  }

  if (!content.telechargeable) {
    throw new Error('Ce contenu n\'est pas téléchargeable')
  }

  // Générer le signed URL
  const { data: signedData, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(content.file_path, SIGNED_URL_TTL)

  if (signErr || !signedData?.signedUrl) {
    throw new Error(`Signed URL échoué : ${signErr?.message}`)
  }

  const expiresAt = new Date(Date.now() + SIGNED_URL_TTL * 1000).toISOString()

  // Récupérer le lead_id de l'inscription (non-bloquant)
  const { data: inscription } = await supabase
    .from('inscriptions')
    .select('lead_id')
    .eq('id', inscriptionId)
    .single()

  // Logger le téléchargement (non-bloquant)
  supabase
    .from('content_downloads')
    .insert({
      content_id: contentId,
      inscription_id: inscriptionId,
      lead_id: inscription?.lead_id || null,
      file_name: content.file_name,
      ip_address: options?.ipAddress || null,
      watermarked: content.watermark_enabled,
    })
    .then(() => {})
    .catch((err: unknown) => logError('Log téléchargement échoué', err))

  // Incrémenter le compteur de téléchargements (non-bloquant)
  supabase
    .rpc('increment_counter', {
      table_name: 'formation_contents',
      column_name: 'telechargements_totaux',
      row_id: contentId,
    })
    .then(() => {})
    .catch(() => {
      // Fallback : update direct
      supabase
        .from('formation_contents')
        .update({ telechargements_totaux: (content as any).telechargements_totaux + 1 })
        .eq('id', contentId)
        .then(() => {})
        .catch((err: unknown) => logError('Incrémentation téléchargements échouée', err))
    })

  log(`Signed URL généré : ${content.titre}`, { inscriptionId })

  return { url: signedData.signedUrl, expiresAt }
}

/**
 * Vérifier si une inscription a accès à un contenu donné
 */
export async function checkContentAccess(
  inscriptionId: string,
  contentId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await getSupabase()

  // Récupérer le contenu avec son module
  const { data: content, error: contentErr } = await supabase
    .from('formation_contents')
    .select(`
      id, formation_id, is_published,
      module:formation_modules!module_id (
        id, accessible_avant, accessible_pendant, accessible_apres, is_published
      )
    `)
    .eq('id', contentId)
    .single()

  if (contentErr || !content) {
    return { allowed: false, reason: 'Contenu introuvable' }
  }

  if (!content.is_published) {
    return { allowed: false, reason: 'Contenu non publié' }
  }

  const mod = Array.isArray(content.module) ? content.module[0] : content.module
  if (!mod?.is_published) {
    return { allowed: false, reason: 'Module non publié' }
  }

  // Vérifier que l'inscription est liée à cette formation
  const { data: inscription, error: inscErr } = await supabase
    .from('inscriptions')
    .select('id, formation_id, statut, session_id')
    .eq('id', inscriptionId)
    .single()

  if (inscErr || !inscription) {
    return { allowed: false, reason: 'Inscription introuvable' }
  }

  if (inscription.formation_id !== content.formation_id) {
    return { allowed: false, reason: 'Inscription non liée à cette formation' }
  }

  // Vérifier le statut de l'inscription (doit être active)
  const statutsActifs = ['confirmee', 'en_cours', 'terminee', 'certifiee']
  if (!statutsActifs.includes(inscription.statut)) {
    return { allowed: false, reason: `Inscription non active (statut: ${inscription.statut})` }
  }

  // Vérifier les dates d'accès selon la session
  if (inscription.session_id) {
    const { data: session } = await supabase
      .from('sessions')
      .select('date_debut, date_fin')
      .eq('id', inscription.session_id)
      .single()

    if (session) {
      const now = new Date()
      const debut = new Date(session.date_debut)
      const fin = new Date(session.date_fin)

      const isAvant = now < debut
      const isPendant = now >= debut && now <= fin
      const isApres = now > fin

      if (isAvant && !mod.accessible_avant) {
        return { allowed: false, reason: 'Contenu non accessible avant la session' }
      }
      if (isPendant && !mod.accessible_pendant) {
        return { allowed: false, reason: 'Contenu non accessible pendant la session' }
      }
      if (isApres && !mod.accessible_apres) {
        return { allowed: false, reason: 'Contenu non accessible après la session' }
      }
    }
  }

  return { allowed: true }
}

// ---------------------------------------------------------------------------
// 3. Progression
// ---------------------------------------------------------------------------

/**
 * Tracker une vue de contenu (upsert)
 * Met à jour first_viewed_at, last_viewed_at et cumule le temps passé
 */
export async function trackContentView(params: TrackViewParams): Promise<void> {
  const { inscriptionId, contentId, leadId, tempsSecondes } = params
  const supabase = await getSupabase()

  const now = new Date().toISOString()

  // Vérifier si une progression existe déjà
  const { data: existing } = await supabase
    .from('content_progress')
    .select('id, temps_passe_secondes, statut')
    .eq('inscription_id', inscriptionId)
    .eq('content_id', contentId)
    .single()

  if (existing) {
    // Update : accumuler le temps, mettre à jour last_viewed_at
    const updates: Record<string, unknown> = {
      last_viewed_at: now,
    }
    if (tempsSecondes) {
      updates.temps_passe_secondes = (existing.temps_passe_secondes || 0) + tempsSecondes
    }
    if (existing.statut === 'non_vu') {
      updates.statut = 'en_cours'
      updates.progression_pct = 10
    }

    await supabase
      .from('content_progress')
      .update(updates)
      .eq('id', existing.id)
      .then(() => {})
      .catch((err: unknown) => logError('Update progression échoué', err))
  } else {
    // Insert
    await supabase
      .from('content_progress')
      .insert({
        inscription_id: inscriptionId,
        content_id: contentId,
        lead_id: leadId,
        statut: 'en_cours',
        first_viewed_at: now,
        last_viewed_at: now,
        temps_passe_secondes: tempsSecondes || 0,
        progression_pct: 10,
      })
      .then(() => {})
      .catch((err: unknown) => logError('Insert progression échoué', err))
  }

  // Incrémenter vues_totales (non-bloquant)
  supabase
    .from('formation_contents')
    .rpc('increment_counter', {
      table_name: 'formation_contents',
      column_name: 'vues_totales',
      row_id: contentId,
    })
    .then(() => {})
    .catch(() => {
      // Fallback direct
      supabase
        .from('formation_contents')
        .select('vues_totales')
        .eq('id', contentId)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase
              .from('formation_contents')
              .update({ vues_totales: (data.vues_totales || 0) + 1 })
              .eq('id', contentId)
              .then(() => {})
              .catch(() => {})
          }
        })
        .catch(() => {})
    })

  log('Vue trackée', { inscriptionId, contentId })
}

/**
 * Marquer un contenu comme terminé
 * Si quiz : vérifie le score minimum
 */
export async function completeContent(params: CompleteContentParams): Promise<void> {
  const { inscriptionId, contentId, leadId, scoreQuiz, reponsesQuiz } = params
  const supabase = await getSupabase()

  // Récupérer le contenu pour vérifier le score minimum
  const { data: content, error: contentErr } = await supabase
    .from('formation_contents')
    .select('type, score_minimum, points')
    .eq('id', contentId)
    .single()

  if (contentErr || !content) {
    throw new Error('Contenu introuvable')
  }

  // Si quiz, vérifier le score minimum
  if (content.type === 'quiz' && content.score_minimum != null && scoreQuiz != null) {
    if (scoreQuiz < content.score_minimum) {
      throw new Error(
        `Score insuffisant : ${scoreQuiz}% (minimum requis : ${content.score_minimum}%)`
      )
    }
  }

  const now = new Date().toISOString()

  // Upsert la progression
  const { data: existing } = await supabase
    .from('content_progress')
    .select('id, temps_passe_secondes')
    .eq('inscription_id', inscriptionId)
    .eq('content_id', contentId)
    .single()

  const progressData: Record<string, unknown> = {
    statut: 'complete',
    progression_pct: 100,
    completed_at: now,
    last_viewed_at: now,
  }

  if (scoreQuiz != null) {
    progressData.score_quiz = scoreQuiz
  }
  if (reponsesQuiz) {
    progressData.reponses_quiz = reponsesQuiz
  }

  if (existing) {
    await supabase
      .from('content_progress')
      .update(progressData)
      .eq('id', existing.id)
  } else {
    await supabase
      .from('content_progress')
      .insert({
        inscription_id: inscriptionId,
        content_id: contentId,
        lead_id: leadId,
        first_viewed_at: now,
        temps_passe_secondes: 0,
        ...progressData,
      })
  }

  log(`Contenu complété`, { inscriptionId, contentId, scoreQuiz })
}

/**
 * Récupérer la progression complète d'une inscription
 * Retourne chaque module avec ses contenus et leur statut
 */
export async function getInscriptionProgress(inscriptionId: string): Promise<{
  modules: ModuleProgress[]
  progressionPct: number
  pointsGagnes: number
}> {
  const supabase = await getSupabase()

  // Récupérer l'inscription pour connaître la formation
  const { data: inscription, error: inscErr } = await supabase
    .from('inscriptions')
    .select('id, formation_id')
    .eq('id', inscriptionId)
    .single()

  if (inscErr || !inscription) {
    throw new Error('Inscription introuvable')
  }

  // Récupérer tous les modules publiés de la formation
  const { data: modules, error: modErr } = await supabase
    .from('formation_modules')
    .select('*')
    .eq('formation_id', inscription.formation_id)
    .eq('is_published', true)
    .order('ordre', { ascending: true })

  if (modErr) {
    throw new Error(`Erreur chargement modules : ${modErr.message}`)
  }

  if (!modules || modules.length === 0) {
    return { modules: [], progressionPct: 0, pointsGagnes: 0 }
  }

  // Récupérer tous les contenus publiés
  const { data: contents } = await supabase
    .from('formation_contents')
    .select('*')
    .eq('formation_id', inscription.formation_id)
    .eq('is_published', true)
    .order('ordre', { ascending: true })

  // Récupérer toutes les progressions de cette inscription
  const { data: progressRows } = await supabase
    .from('content_progress')
    .select('content_id, statut, progression_pct, score_quiz, temps_passe_secondes')
    .eq('inscription_id', inscriptionId)

  // Indexer les progressions par content_id
  const progressMap = new Map<string, {
    statut: string
    progression_pct: number
    score_quiz?: number
  }>()
  for (const p of progressRows || []) {
    progressMap.set(p.content_id, {
      statut: p.statut,
      progression_pct: p.progression_pct || 0,
      score_quiz: p.score_quiz,
    })
  }

  // Construire la réponse
  let totalContents = 0
  let totalCompleted = 0
  let pointsGagnes = 0

  const moduleResults: ModuleProgress[] = (modules as FormationModule[]).map((mod) => {
    const modContents = (contents || []).filter((c: any) => c.module_id === mod.id)
    let modCompleted = 0

    const enrichedContents = modContents.map((c: any) => {
      const prog = progressMap.get(c.id)
      const statut = (prog?.statut as 'non_vu' | 'en_cours' | 'complete') || 'non_vu'
      const pct = prog?.progression_pct || 0

      if (statut === 'complete') {
        modCompleted++
        pointsGagnes += c.points || 0
      }

      return {
        ...c,
        progress_statut: statut,
        progress_pct: pct,
        score_quiz: prog?.score_quiz,
      }
    })

    totalContents += modContents.length
    totalCompleted += modCompleted

    return {
      module: mod,
      contents: enrichedContents,
      completed: modCompleted,
      total: modContents.length,
      pct: modContents.length > 0 ? Math.round((modCompleted / modContents.length) * 100) : 0,
    }
  })

  const progressionPct =
    totalContents > 0 ? Math.round((totalCompleted / totalContents) * 100) : 0

  return {
    modules: moduleResults,
    progressionPct,
    pointsGagnes,
  }
}

// ---------------------------------------------------------------------------
// 4. Modules & Contenus
// ---------------------------------------------------------------------------

/**
 * Récupérer les modules publiés d'une formation avec leurs contenus
 */
export async function getFormationModules(formationId: string): Promise<FormationModule[]> {
  const supabase = await getSupabase()

  const { data: modules, error } = await supabase
    .from('formation_modules')
    .select('*')
    .eq('formation_id', formationId)
    .eq('is_published', true)
    .order('ordre', { ascending: true })

  if (error) {
    logError('Erreur chargement modules', error)
    throw new Error(`Erreur chargement modules : ${error.message}`)
  }

  if (!modules || modules.length === 0) return []

  // Charger les contenus pour chaque module
  const moduleIds = modules.map((m: any) => m.id)
  const { data: contents } = await supabase
    .from('formation_contents')
    .select('*')
    .in('module_id', moduleIds)
    .eq('is_published', true)
    .order('ordre', { ascending: true })

  // Associer contenus aux modules
  return (modules as FormationModule[]).map((mod) => ({
    ...mod,
    contents: (contents || []).filter((c: any) => c.module_id === mod.id) as FormationContent[],
  }))
}

/**
 * Récupérer les contenus publiés d'un module, triés par ordre
 */
export async function getModuleContents(moduleId: string): Promise<FormationContent[]> {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('formation_contents')
    .select('*')
    .eq('module_id', moduleId)
    .eq('is_published', true)
    .order('ordre', { ascending: true })

  if (error) {
    logError('Erreur chargement contenus', error)
    throw new Error(`Erreur chargement contenus : ${error.message}`)
  }

  return (data || []) as FormationContent[]
}
