// ============================================================
// API Route — Génération Rapport Satorea
// POST /api/rapport/generate { leadId }
// → Retourne RapportSatorea JSON complet
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { genererRapportSatorea } from '@/lib/rapport/generate'
import { mapLeadToProspect } from '@/lib/rapport/mapper'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: 'leadId requis' }, { status: 400 })
    }

    const supabase = await createServiceSupabase()

    // 1. Récupérer le lead avec sa formation
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, formation_principale:formations(*)')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    }

    // 2. Récupérer les données enrichment si disponibles
    let enrichment: Record<string, unknown> | null = null
    try {
      const { data: prospectData } = await supabase
        .from('prospect_data' as never)
        .select('data')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as { data: { data: Record<string, unknown> } | null }

      if (prospectData?.data) {
        enrichment = prospectData.data
      }
    } catch {
      // Pas de données enrichment — on continue sans
    }

    // 3. Mapper vers ProspectData
    const prospect = mapLeadToProspect(lead, enrichment)

    // 4. Générer le rapport via Claude
    const rapport = await genererRapportSatorea(prospect)

    // 5. Sauvegarder le rapport en DB (optionnel, pour cache)
    try {
      await (supabase.from('prospect_reports' as never) as any).upsert({
        lead_id: leadId,
        report_type: 'satorea_briefing',
        content: rapport,
        version: 1,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'lead_id,report_type',
      })
    } catch {
      // Sauvegarde optionnelle — ne pas bloquer si la table n'existe pas encore
    }

    return NextResponse.json({
      prospect,
      rapport,
    })
  } catch (error) {
    console.error('[rapport/generate] Erreur:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur génération rapport' },
      { status: 500 }
    )
  }
}

// GET — Récupérer un rapport déjà généré (cache)
export async function GET(request: NextRequest) {
  try {
    const leadId = request.nextUrl.searchParams.get('leadId')

    if (!leadId) {
      return NextResponse.json({ error: 'leadId requis' }, { status: 400 })
    }

    const supabase = await createServiceSupabase()

    const { data: report } = await (supabase
      .from('prospect_reports' as never) as any)
      .select('content, updated_at')
      .eq('lead_id', leadId)
      .eq('report_type', 'satorea_briefing')
      .single()

    if (!report) {
      return NextResponse.json({ rapport: null, cached: false })
    }

    return NextResponse.json({
      rapport: (report as any).content,
      cached: true,
      generated_at: (report as any).updated_at,
    })
  } catch {
    return NextResponse.json({ rapport: null, cached: false })
  }
}
