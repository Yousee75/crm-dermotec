import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

// GET /api/questionnaires — Lister les templates + stats
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  try {
    const { createServiceSupabase } = await import('@/lib/supabase-server')
    const supabase = await createServiceSupabase() as any

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let query = supabase
      .from('questionnaire_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (type) query = query.eq('type', type)

    const { data: templates } = await query

    // Stats par template
    const { data: stats } = await supabase
      .from('v_questionnaire_stats')
      .select('*')

    return NextResponse.json({ templates: templates || [], stats: stats || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// POST /api/questionnaires — Envoyer un questionnaire à un stagiaire
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { template_id, lead_id, inscription_id, session_id } = body

    if (!template_id) {
      return NextResponse.json({ error: 'template_id requis' }, { status: 400 })
    }

    const { createServiceSupabase } = await import('@/lib/supabase-server')
    const supabase = await createServiceSupabase() as any

    // Récupérer le template
    const { data: template } = await supabase
      .from('questionnaire_templates')
      .select('*')
      .eq('id', template_id)
      .single()

    if (!template) {
      return NextResponse.json({ error: 'Template non trouvé' }, { status: 404 })
    }

    // Créer l'envoi
    const { data: envoi, error } = await supabase
      .from('questionnaire_envois')
      .insert({
        template_id,
        lead_id: lead_id || null,
        inscription_id: inscription_id || null,
        session_id: session_id || null,
        statut: 'en_attente',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Récupérer l'email du lead pour envoyer
    if (lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('email, prenom')
        .eq('id', lead_id)
        .single()

      if (lead?.email) {
        // Envoyer via Inngest (async)
        try {
          const { inngest } = await import('@/lib/infra/inngest')
          await inngest.send({
            name: 'crm/email.send',
            data: {
              to: lead.email,
              template_slug: 'questionnaire',
              variables: {
                prenom: lead.prenom || '',
                questionnaire_titre: template.titre,
                questionnaire_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crm.dermotec.fr'}/questionnaire/${envoi.token}`,
              },
              lead_id,
            },
          })

          await supabase
            .from('questionnaire_envois')
            .update({ statut: 'envoye', envoye_at: new Date().toISOString() })
            .eq('id', envoi.id)
        } catch {
          // Email non-bloquant
        }
      }
    }

    // Logger
    await supabase.from('activites').insert({
      type: 'SYSTEME',
      lead_id: lead_id || null,
      session_id: session_id || null,
      description: `Questionnaire "${template.titre}" envoyé`,
      metadata: { template_id, envoi_id: envoi.id, type: template.type },
    })

    return NextResponse.json({
      success: true,
      envoi_id: envoi.id,
      token: envoi.token,
      url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/questionnaire/${envoi.token}`,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
