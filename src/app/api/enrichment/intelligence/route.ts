import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/enrichment/intelligence?leadId=xxx
 * Récupère les données intelligence_complete depuis prospect_data
 */
export async function GET(req: NextRequest) {
  // Auth obligatoire
  const { createServerSupabase } = await import('@/lib/supabase-server')
  const authSb = await createServerSupabase()
  const { data: { user } } = await authSb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const supabase = await createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const leadId = searchParams.get('leadId')

  if (!leadId) {
    return NextResponse.json({ error: 'leadId requis' }, { status: 400 })
  }

  try {
    // Récupérer les données intelligence depuis prospect_data
    const { data: prospectData, error } = await (supabase
      .from('prospect_data' as any)
      .select('intelligence_complete, carte_soins, signaux_commerciaux, convention_idcc, convention_droit_heures, aides_zone, concurrents_osm_count, enrichment_version, last_scraping_at')
      .eq('lead_id', leadId)
      .single() as any) as { data: any; error: any }

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur récupération intelligence:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!prospectData) {
      return NextResponse.json({
        intelligence: null,
        message: 'Aucune donnée d\'intelligence disponible. Lancez l\'enrichissement depuis le briefing IA.'
      })
    }

    return NextResponse.json({
      intelligence: prospectData.intelligence_complete,
      metadata: {
        enrichment_version: prospectData.enrichment_version,
        last_scraping_at: prospectData.last_scraping_at,
        has_data: !!prospectData.intelligence_complete
      }
    })

  } catch (error) {
    console.error('Erreur API intelligence:', error)
    return NextResponse.json({ error: 'Erreur interne serveur' }, { status: 500 })
  }
}