// @ts-nocheck — Tables LMS pas encore dans database.ts
// ============================================================
// CRM DERMOTEC — API LMS Formation Content
// GET: modules, contenus, progression
// POST: track, complete, download, upload
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase, createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// --------------------------------------------------------
// Helpers
// --------------------------------------------------------

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

/** Recupere l'utilisateur authentifie via cookies SSR */
async function getAuthUser() {
  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/** Verifie que l'utilisateur a acces a une inscription (est le stagiaire ou admin/manager) */
async function verifyInscriptionAccess(
  supabase: Awaited<ReturnType<typeof createServiceSupabase>>,
  inscriptionId: string,
  userId: string,
): Promise<{ allowed: boolean; inscription?: Record<string, unknown> }> {
  // Recuperer l'inscription avec le lead associe
  const { data: inscription, error } = await (supabase as any)
    .from('inscriptions')
    .select('*, lead:leads(id, email, user_id), session:sessions(id, formation_id)')
    .eq('id', inscriptionId)
    .single()

  if (error || !inscription) return { allowed: false }

  // Acces direct : le lead est lie a cet utilisateur
  if (inscription.lead?.user_id === userId) return { allowed: true, inscription }

  // Acces admin/manager : verifier le role
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile && ['admin', 'manager', 'formateur'].includes(profile.role)) {
    return { allowed: true, inscription }
  }

  return { allowed: false }
}

/** Verifie que l'utilisateur est admin ou manager */
async function isAdminOrManager(
  supabase: Awaited<ReturnType<typeof createServiceSupabase>>,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return !!profile && ['admin', 'manager'].includes(profile.role)
}

// --------------------------------------------------------
// GET — Modules, contenus ou progression
// --------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser()
    if (!user) return jsonError('Authentification requise', 401)

    const { searchParams } = new URL(request.url)
    const formationId = searchParams.get('formationId')
    const moduleId = searchParams.get('moduleId')
    const inscriptionId = searchParams.get('inscriptionId')

    const supabase = await createServiceSupabase()

    // --- Progression d'une inscription ---
    if (inscriptionId) {
      const { allowed, inscription } = await verifyInscriptionAccess(supabase, inscriptionId, user.id)
      if (!allowed || !inscription) return jsonError('Acces non autorise a cette inscription', 403)

      const formId = (inscription.session as any)?.formation_id
      if (!formId) return jsonError('Formation introuvable pour cette inscription', 404)

      // Modules + contenus de la formation
      const { data: modules, error: modErr } = await (supabase as any)
        .from('formation_modules')
        .select('*, contenus:formation_contenus(*)')
        .eq('formation_id', formId)
        .order('ordre', { ascending: true })

      if (modErr) {
        console.error('[LMS] Modules fetch error:', modErr)
        return jsonError('Erreur chargement modules', 500)
      }

      // Progression du stagiaire
      const { data: progressRows } = await (supabase as any)
        .from('formation_progress')
        .select('*')
        .eq('inscription_id', inscriptionId)

      const progressMap = new Map(
        (progressRows || []).map((p: any) => [p.contenu_id, p])
      )

      let totalContenus = 0
      let totalTermines = 0
      let pointsGagnes = 0

      const modulesWithProgress = (modules || []).map((mod: any) => {
        // Trier contenus par ordre
        const contenus = (mod.contenus || []).sort((a: any, b: any) => a.ordre - b.ordre)
        totalContenus += contenus.length

        const progression = contenus.map((c: any) => {
          const p = progressMap.get(c.id)
          const statut = p?.statut || 'non_commence'
          if (statut === 'termine') {
            totalTermines++
            pointsGagnes += p?.points_gagnes || 10
          }
          return {
            contenu_id: c.id,
            statut,
            temps_total_secondes: p?.temps_total_secondes || 0,
            score_quiz: p?.score_quiz,
            completed_at: p?.completed_at,
          }
        })

        const moduleTermines = progression.filter((p: any) => p.statut === 'termine').length
        const modulePct = contenus.length > 0
          ? Math.round((moduleTermines / contenus.length) * 100)
          : 0

        return {
          ...mod,
          contenus,
          progression,
          progressionPct: modulePct,
        }
      })

      const globalPct = totalContenus > 0
        ? Math.round((totalTermines / totalContenus) * 100)
        : 0

      return NextResponse.json({
        modules: modulesWithProgress,
        progressionPct: globalPct,
        pointsGagnes,
      })
    }

    // --- Contenus d'un module ---
    if (moduleId) {
      const { data: contenus, error } = await (supabase as any)
        .from('formation_contenus')
        .select('*')
        .eq('module_id', moduleId)
        .order('ordre', { ascending: true })

      if (error) {
        console.error('[LMS] Contenus fetch error:', error)
        return jsonError('Erreur chargement contenus', 500)
      }

      return NextResponse.json(contenus || [])
    }

    // --- Modules d'une formation ---
    if (formationId) {
      const { data: modules, error } = await (supabase as any)
        .from('formation_modules')
        .select('*, contenus:formation_contenus(*)')
        .eq('formation_id', formationId)
        .order('ordre', { ascending: true })

      if (error) {
        console.error('[LMS] Modules fetch error:', error)
        return jsonError('Erreur chargement modules', 500)
      }

      // Trier contenus dans chaque module
      const sorted = (modules || []).map((mod: any) => ({
        ...mod,
        contenus: (mod.contenus || []).sort((a: any, b: any) => a.ordre - b.ordre),
      }))

      return NextResponse.json(sorted)
    }

    return jsonError('Parametre requis: formationId, moduleId ou inscriptionId', 400)

  } catch (err) {
    console.error('[LMS] GET error:', err)
    return jsonError('Erreur serveur', 500)
  }
}

// --------------------------------------------------------
// POST — Actions: track, complete, download, upload
// --------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser()
    if (!user) return jsonError('Authentification requise', 401)

    const supabase = await createServiceSupabase()

    // Detecter si c'est un FormData (upload) ou JSON
    const contentType = request.headers.get('content-type') || ''
    const isFormData = contentType.includes('multipart/form-data')

    if (isFormData) {
      return handleUpload(request, supabase, user.id)
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'track':
        return handleTrack(body, supabase, user.id)
      case 'complete':
        return handleComplete(body, supabase, user.id)
      case 'download':
        return handleDownload(body, supabase, user.id)
      default:
        return jsonError(`Action inconnue: ${action}`, 400)
    }

  } catch (err) {
    console.error('[LMS] POST error:', err)
    return jsonError('Erreur serveur', 500)
  }
}

// --------------------------------------------------------
// Action: track — enregistrer le temps de visionnage
// --------------------------------------------------------

async function handleTrack(
  body: { inscriptionId?: string; contentId?: string; tempsSecondes?: number },
  supabase: Awaited<ReturnType<typeof createServiceSupabase>>,
  userId: string,
): Promise<NextResponse> {
  const { inscriptionId, contentId, tempsSecondes } = body

  if (!inscriptionId || !contentId || tempsSecondes == null) {
    return jsonError('inscriptionId, contentId et tempsSecondes requis', 400)
  }

  if (typeof tempsSecondes !== 'number' || tempsSecondes < 0 || tempsSecondes > 86400) {
    return jsonError('tempsSecondes invalide (0-86400)', 400)
  }

  const { allowed } = await verifyInscriptionAccess(supabase, inscriptionId, userId)
  if (!allowed) return jsonError('Acces non autorise', 403)

  // Upsert progression — incrementer le temps
  const { data: existing } = await (supabase as any)
    .from('formation_progress')
    .select('id, temps_total_secondes, statut')
    .eq('inscription_id', inscriptionId)
    .eq('contenu_id', contentId)
    .maybeSingle()

  if (existing) {
    const newTemps = (existing.temps_total_secondes || 0) + tempsSecondes
    const newStatut = existing.statut === 'termine' ? 'termine' : 'en_cours'

    await (supabase as any)
      .from('formation_progress')
      .update({
        temps_total_secondes: newTemps,
        statut: newStatut,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await (supabase as any)
      .from('formation_progress')
      .insert({
        inscription_id: inscriptionId,
        contenu_id: contentId,
        temps_total_secondes: tempsSecondes,
        statut: 'en_cours',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
  }

  return NextResponse.json({ success: true })
}

// --------------------------------------------------------
// Action: complete — marquer un contenu comme termine
// --------------------------------------------------------

async function handleComplete(
  body: {
    inscriptionId?: string
    contentId?: string
    scoreQuiz?: number
    reponsesQuiz?: Record<string, unknown>
  },
  supabase: Awaited<ReturnType<typeof createServiceSupabase>>,
  userId: string,
): Promise<NextResponse> {
  const { inscriptionId, contentId, scoreQuiz, reponsesQuiz } = body

  if (!inscriptionId || !contentId) {
    return jsonError('inscriptionId et contentId requis', 400)
  }

  if (scoreQuiz != null && (typeof scoreQuiz !== 'number' || scoreQuiz < 0 || scoreQuiz > 100)) {
    return jsonError('scoreQuiz invalide (0-100)', 400)
  }

  const { allowed } = await verifyInscriptionAccess(supabase, inscriptionId, userId)
  if (!allowed) return jsonError('Acces non autorise', 403)

  // Verifier que le contenu existe
  const { data: contenu } = await (supabase as any)
    .from('formation_contenus')
    .select('id, type, module_id')
    .eq('id', contentId)
    .single()

  if (!contenu) return jsonError('Contenu introuvable', 404)

  // Points: quiz = score, autres = 10 points fixes
  const pointsGagnes = contenu.type === 'quiz' && scoreQuiz != null
    ? Math.round(scoreQuiz / 10)
    : 10

  const now = new Date().toISOString()

  // Upsert progression
  const { error } = await (supabase as any)
    .from('formation_progress')
    .upsert(
      {
        inscription_id: inscriptionId,
        contenu_id: contentId,
        statut: 'termine',
        score_quiz: scoreQuiz ?? null,
        reponses_quiz: reponsesQuiz ?? null,
        points_gagnes: pointsGagnes,
        completed_at: now,
        updated_at: now,
      },
      { onConflict: 'inscription_id,contenu_id' }
    )

  if (error) {
    console.error('[LMS] Complete error:', error)
    return jsonError('Erreur mise a jour progression', 500)
  }

  // Log activite
  try {
    const { data: inscription } = await (supabase as any)
      .from('inscriptions')
      .select('lead_id, session_id')
      .eq('id', inscriptionId)
      .single()

    if (inscription) {
      await (supabase as any)
        .from('activites')
        .insert({
          type: 'FORMATION',
          lead_id: inscription.lead_id,
          session_id: inscription.session_id,
          description: `Contenu LMS termine (${contenu.type})`,
          metadata: {
            contenu_id: contentId,
            module_id: contenu.module_id,
            score_quiz: scoreQuiz,
            points_gagnes: pointsGagnes,
          },
          created_at: now,
        })
    }
  } catch (logErr) {
    console.error('[LMS] Activity log error:', logErr)
    // Ne pas bloquer la completion pour un log
  }

  return NextResponse.json({ success: true, pointsGagnes })
}

// --------------------------------------------------------
// Action: download — generer signed URL
// --------------------------------------------------------

async function handleDownload(
  body: { contentId?: string; inscriptionId?: string },
  supabase: Awaited<ReturnType<typeof createServiceSupabase>>,
  userId: string,
): Promise<NextResponse> {
  const { contentId, inscriptionId } = body

  if (!contentId || !inscriptionId) {
    return jsonError('contentId et inscriptionId requis', 400)
  }

  // Verifier acces inscription
  const { allowed } = await verifyInscriptionAccess(supabase, inscriptionId, userId)
  if (!allowed) return jsonError('Acces non autorise', 403)

  // Recuperer le contenu
  const { data: contenu } = await (supabase as any)
    .from('formation_contenus')
    .select('id, titre, url, type, storage_path')
    .eq('id', contentId)
    .single()

  if (!contenu) return jsonError('Contenu introuvable', 404)

  // Si c'est un lien externe, renvoyer directement
  if (contenu.type === 'lien' && contenu.url) {
    return NextResponse.json({
      url: contenu.url,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  // Sinon, generer une signed URL depuis Supabase Storage
  const storagePath = contenu.storage_path || contenu.url
  if (!storagePath) return jsonError('Aucun fichier associe a ce contenu', 404)

  const expiresIn = 3600 // 1 heure
  const { data: signedData, error: signError } = await supabase.storage
    .from('formation-content')
    .createSignedUrl(storagePath, expiresIn)

  if (signError || !signedData?.signedUrl) {
    console.error('[LMS] Signed URL error:', signError)
    return jsonError('Erreur generation du lien de telechargement', 500)
  }

  // Tracker le telechargement
  try {
    await (supabase as any)
      .from('formation_progress')
      .upsert(
        {
          inscription_id: inscriptionId,
          contenu_id: contentId,
          statut: 'en_cours',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'inscription_id,contenu_id', ignoreDuplicates: false }
      )
  } catch {
    // Silencieux — le download est prioritaire
  }

  return NextResponse.json({
    url: signedData.signedUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  })
}

// --------------------------------------------------------
// Action: upload — uploader un fichier (admin/formatrice)
// --------------------------------------------------------

async function handleUpload(
  request: NextRequest,
  supabase: Awaited<ReturnType<typeof createServiceSupabase>>,
  userId: string,
): Promise<NextResponse> {
  // Verifier role admin/manager
  const allowed = await isAdminOrManager(supabase, userId)
  if (!allowed) return jsonError('Upload reserve aux administrateurs et managers', 403)

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const formationId = formData.get('formationId') as string | null
  const moduleId = formData.get('moduleId') as string | null
  const titre = formData.get('titre') as string | null
  const type = formData.get('type') as string | null

  if (!file || !formationId || !moduleId || !titre || !type) {
    return jsonError('Parametres requis: file, formationId, moduleId, titre, type', 400)
  }

  // Validation type de contenu
  const typesValides = ['video', 'pdf', 'quiz', 'texte', 'exercice', 'lien']
  if (!typesValides.includes(type)) {
    return jsonError(`Type invalide. Types acceptes: ${typesValides.join(', ')}`, 400)
  }

  // Validation taille fichier (50 MB max)
  const MAX_SIZE = 50 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return jsonError(`Fichier trop volumineux (max ${MAX_SIZE / 1024 / 1024} MB)`, 400)
  }

  // Validation extension
  const allowedExtensions = ['.pdf', '.mp4', '.webm', '.mov', '.jpg', '.jpeg', '.png', '.webp', '.zip']
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  if (!allowedExtensions.includes(extension)) {
    return jsonError(`Extension non autorisee: ${extension}`, 400)
  }

  // Verifier que le module appartient a la formation
  const { data: module } = await (supabase as any)
    .from('formation_modules')
    .select('id, formation_id')
    .eq('id', moduleId)
    .eq('formation_id', formationId)
    .single()

  if (!module) return jsonError('Module introuvable pour cette formation', 404)

  // Determiner l'ordre (apres le dernier contenu existant)
  const { data: lastContenu } = await (supabase as any)
    .from('formation_contenus')
    .select('ordre')
    .eq('module_id', moduleId)
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ordre = (lastContenu?.ordre || 0) + 1

  // Upload vers Supabase Storage
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const safeFilename = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100)
  const storagePath = `${formationId}/${moduleId}/${timestamp}_${safeFilename}`

  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('formation-content')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: '3600',
    })

  if (uploadError) {
    console.error('[LMS] Storage upload error:', uploadError)
    return jsonError('Erreur lors de l\'upload du fichier', 500)
  }

  // Inserer en base
  const now = new Date().toISOString()
  const { data: contenu, error: dbError } = await (supabase as any)
    .from('formation_contenus')
    .insert({
      module_id: moduleId,
      titre: titre.trim().substring(0, 255),
      type,
      storage_path: storagePath,
      ordre,
      obligatoire: true,
      duree_minutes: null,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('[LMS] DB insert error:', dbError)

    // Cleanup: supprimer le fichier uploade
    await supabase.storage.from('formation-content').remove([storagePath])

    return jsonError('Erreur enregistrement en base', 500)
  }

  // Log activite
  try {
    await (supabase as any)
      .from('activites')
      .insert({
        type: 'FORMATION',
        description: `Contenu LMS uploade: ${titre} (${type})`,
        metadata: {
          contenu_id: contenu.id,
          module_id: moduleId,
          formation_id: formationId,
          file_size: file.size,
          storage_path: storagePath,
        },
        created_at: now,
      })
  } catch {
    // Silencieux
  }

  return NextResponse.json({
    success: true,
    contenu_id: contenu.id,
    storage_path: storagePath,
  })
}
