import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/questionnaires/[token] — Récupérer le questionnaire (public, sans auth)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const { createServiceSupabase } = await import('@/lib/supabase-server')
    const supabase = await createServiceSupabase() as any

    // Récupérer l'envoi + template
    const { data: envoi } = await supabase
      .from('questionnaire_envois')
      .select('*, template:questionnaire_templates(*)')
      .eq('token', token)
      .single()

    if (!envoi) {
      return NextResponse.json({ error: 'Questionnaire non trouvé' }, { status: 404 })
    }

    // Vérifier expiration
    if (envoi.expire_at && new Date(envoi.expire_at) < new Date()) {
      await supabase.from('questionnaire_envois').update({ statut: 'expire' }).eq('id', envoi.id)
      return NextResponse.json({ error: 'Ce questionnaire a expiré' }, { status: 410 })
    }

    // Déjà complété ?
    if (envoi.statut === 'complete') {
      return NextResponse.json({
        error: 'Ce questionnaire a déjà été rempli. Merci !',
        already_completed: true,
      }, { status: 409 })
    }

    // Marquer comme ouvert
    if (envoi.statut === 'envoye' || envoi.statut === 'en_attente') {
      await supabase.from('questionnaire_envois')
        .update({ statut: 'ouvert', ouvert_at: new Date().toISOString() })
        .eq('id', envoi.id)
    }

    // Récupérer info lead si disponible
    let leadInfo = null
    if (envoi.lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('prenom, nom')
        .eq('id', envoi.lead_id)
        .single()
      leadInfo = lead
    }

    return NextResponse.json({
      id: envoi.id,
      titre: envoi.template.titre,
      description: envoi.template.description,
      type: envoi.template.type,
      questions: envoi.template.questions,
      lead: leadInfo,
      reponses_existantes: envoi.reponses || {},
    })

  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// POST /api/questionnaires/[token] — Soumettre les réponses (public, sans auth)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { reponses, commentaire_libre } = body

    if (!reponses || typeof reponses !== 'object') {
      return NextResponse.json({ error: 'Réponses requises' }, { status: 400 })
    }

    const { createServiceSupabase } = await import('@/lib/supabase-server')
    const supabase = await createServiceSupabase() as any

    // Récupérer l'envoi
    const { data: envoi } = await supabase
      .from('questionnaire_envois')
      .select('*, template:questionnaire_templates(*)')
      .eq('token', token)
      .single()

    if (!envoi) {
      return NextResponse.json({ error: 'Questionnaire non trouvé' }, { status: 404 })
    }

    if (envoi.statut === 'complete') {
      return NextResponse.json({ error: 'Déjà rempli' }, { status: 409 })
    }

    if (envoi.expire_at && new Date(envoi.expire_at) < new Date()) {
      return NextResponse.json({ error: 'Expiré' }, { status: 410 })
    }

    // Valider les réponses obligatoires
    const questions = envoi.template.questions || []
    const missing = questions
      .filter((q: { obligatoire: boolean; id: string }) => q.obligatoire && !reponses[q.id])
      .map((q: { id: string; texte: string }) => q.texte)

    if (missing.length > 0) {
      return NextResponse.json({
        error: 'Questions obligatoires manquantes',
        missing,
      }, { status: 400 })
    }

    // Calculer le score (pour les questionnaires notés)
    let scoreGlobal = null
    const notedResponses = Object.entries(reponses)
      .filter(([id]) => {
        const q = questions.find((q: { id: string }) => q.id === id)
        return q && (q.type === 'echelle_5' || q.type === 'note_10')
      })

    if (notedResponses.length > 0) {
      const total = notedResponses.reduce((sum, [id, val]) => {
        const q = questions.find((q: { id: string }) => q.id === id)
        const max = q?.type === 'note_10' ? 10 : 5
        return sum + ((Number(val) || 0) / max) * 100
      }, 0)
      scoreGlobal = Math.round(total / notedResponses.length)
    }

    // Calculer la durée (depuis ouvert_at)
    const duree = envoi.ouvert_at
      ? Math.round((Date.now() - new Date(envoi.ouvert_at).getTime()) / 1000)
      : null

    // Sauvegarder
    const { error: updateError } = await supabase
      .from('questionnaire_envois')
      .update({
        reponses,
        commentaire_libre: commentaire_libre || null,
        score_global: scoreGlobal,
        statut: 'complete',
        complete_at: new Date().toISOString(),
        duree_secondes: duree,
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
      })
      .eq('id', envoi.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Mettre à jour la satisfaction du lead si c'est un questionnaire de satisfaction
    if (envoi.template.type === 'satisfaction' && envoi.inscription_id && scoreGlobal) {
      await supabase
        .from('inscriptions')
        .update({ satisfaction: Math.round(scoreGlobal / 20) }) // Score /100 → /5
        .eq('id', envoi.inscription_id)
    }

    // NPS si la question 7 (note_10 "recommanderiez-vous") est présente
    if (envoi.lead_id && reponses['sat_7']) {
      await supabase
        .from('leads')
        .update({ nps_score: Number(reponses['sat_7']) })
        .eq('id', envoi.lead_id)
    }

    // Logger
    await supabase.from('activites').insert({
      type: 'SYSTEME',
      lead_id: envoi.lead_id || null,
      description: `Questionnaire "${envoi.template.titre}" complété (score: ${scoreGlobal || 'N/A'}%)`,
      metadata: {
        envoi_id: envoi.id,
        template_type: envoi.template.type,
        score: scoreGlobal,
        duree_secondes: duree,
      },
    })

    return NextResponse.json({
      success: true,
      score: scoreGlobal,
      message: 'Merci pour vos réponses !',
    })

  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
