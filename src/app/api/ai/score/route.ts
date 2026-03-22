import { NextRequest, NextResponse } from 'next/server'
import { scoreLead } from '@/lib/ai-scoring'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    // Auth : skip en mode démo
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
      const supabase = await createServerSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { lead_id } = body

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id requis' }, { status: 400 })
    }

    const service = await createServiceSupabase()
    const { data: lead, error } = await (service as any)
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead non trouvé' }, { status: 404 })
    }

    const result = await scoreLead(lead)

    // Mettre à jour le score du lead
    await (service as any)
      .from('leads')
      .update({ score_chaud: result.score_predictif })
      .eq('id', lead_id)

    // Logger
    await (service as any).from('activites').insert({
      type: 'SYSTEME',
      lead_id,
      description: `Score IA mis à jour : ${result.score_predictif}/100 (${result.probabilite_conversion}% conversion)`,
      metadata: { scoring: result },
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('Erreur API scoring:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
