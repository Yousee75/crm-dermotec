import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/enrichment/report?leadId=xxx&version=latest
 * Récupère un rapport de prospection
 */
export async function GET(req: NextRequest) {
  const supabase = await createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const leadId = searchParams.get('leadId')
  const versionParam = searchParams.get('version')

  if (!leadId) {
    return NextResponse.json({ error: 'leadId requis' }, { status: 400 })
  }

  let query = supabase
    .from('prospect_reports')
    .select('*')
    .eq('lead_id', leadId)

  if (versionParam && versionParam !== 'latest') {
    query = query.eq('version', parseInt(versionParam))
  } else {
    query = query.order('version', { ascending: false }).limit(1)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Aucun rapport trouvé' }, { status: 404 })
  }

  // Récupérer toutes les versions pour le sélecteur
  const { data: versions } = await supabase
    .from('prospect_reports')
    .select('version, created_at, status')
    .eq('lead_id', leadId)
    .order('version', { ascending: false })

  return NextResponse.json({
    report: data[0],
    versions: versions || [],
  })
}

/**
 * POST /api/enrichment/report
 * Sauvegarder une version modifiée du rapport
 * Body: { leadId, narrative (modifié par le commercial) }
 */
export async function POST(req: NextRequest) {
  try {
    const { leadId, narrative } = await req.json()

    if (!leadId || !narrative) {
      return NextResponse.json({ error: 'leadId et narrative requis' }, { status: 400 })
    }

    // Récupérer la dernière version
    const { data: latest } = await supabase
      .from('prospect_reports')
      .select('version, enrichment_data, enrichment_steps, score, classification')
      .eq('lead_id', leadId)
      .order('version', { ascending: false })
      .limit(1)

    const newVersion = (latest && latest.length > 0) ? latest[0].version + 1 : 1

    const { error } = await supabase
      .from('prospect_reports')
      .insert({
        lead_id: leadId,
        version: newVersion,
        score: latest?.[0]?.score || narrative.score_chaleur,
        classification: latest?.[0]?.classification || narrative.classification,
        enrichment_data: latest?.[0]?.enrichment_data || {},
        enrichment_steps: latest?.[0]?.enrichment_steps || [],
        narrative,
        status: 'edited',
        created_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ version: newVersion, saved: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 })
  }
}
