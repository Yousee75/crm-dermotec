import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aiScoreLead } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// POST /api/ai/score — Score un lead via IA
export async function POST(request: NextRequest) {
  try {
    const { lead_id } = await request.json()
    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id requis' }, { status: 400 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'DB non configurée' }, { status: 503 })
    }

    // Récupérer le lead complet
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*, formation_principale:formations(*)')
      .eq('id', lead_id)
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead non trouvé' }, { status: 404 })
    }

    // Scorer via IA
    const scoring = await aiScoreLead({
      prenom: lead.prenom,
      nom: lead.nom,
      email: lead.email,
      telephone: lead.telephone,
      source: lead.source,
      statut_pro: lead.statut_pro,
      experience: lead.experience_esthetique,
      formation_interessee: lead.formation_principale?.nom,
      message: lead.message,
      nb_contacts: lead.nb_contacts,
      financement_souhaite: lead.financement_souhaite,
      tags: lead.tags,
      created_at: lead.created_at,
    })

    if (!scoring) {
      return NextResponse.json({ error: 'Service IA indisponible' }, { status: 503 })
    }

    // Sauvegarder le score en DB
    await supabase
      .from('leads')
      .update({
        score_chaud: scoring.score,
        metadata: {
          ...lead.metadata,
          ai_score: scoring,
          ai_scored_at: new Date().toISOString(),
        },
      })
      .eq('id', lead_id)

    // Logger
    await supabase.from('activites').insert({
      type: 'SYSTEME',
      lead_id,
      description: `Score IA : ${scoring.score}/100 — ${scoring.segment} — ${scoring.urgence}`,
      metadata: scoring,
    })

    return NextResponse.json({ success: true, scoring })
  } catch (err) {
    console.error('[AI Score]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
