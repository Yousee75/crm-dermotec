// ============================================================
// CRM DERMOTEC — API Route: Enrichissement manuel lead
// POST /api/leads/[id]/enrich
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { triggerLeadEnrichment, getEnrichmentStatus } from '@/lib/auto-enrichment'
import { requireAuth } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

// Lazy init pour éviter le crash SSG
async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

/**
 * POST - Déclencher enrichissement manuel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  try {
    const { id: leadId } = await params
    const supabase = await getSupabase()

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, entreprise_nom, siret, email, adresse')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))

    const result = await triggerLeadEnrichment({
      lead_id: leadId,
      siret: body.siret,
      nom: body.nom || body.entreprise_nom,
      ville: body.ville,
      email: body.email
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    if (result.skipped) {
      return NextResponse.json({ success: false, skipped: true, reason: result.reason })
    }

    await (supabase as any).from('activites').insert({
      type: 'ACTION',
      lead_id: leadId,
      description: 'Enrichissement manuel déclenché',
      metadata: { canal: 'api_manual', event_id: result.eventId, triggered_by: 'manual_api_call' }
    })

    return NextResponse.json({ success: true, triggered: true, event_id: result.eventId, lead_id: leadId })
  } catch (error) {
    console.error('[API] Enrichment trigger failed:', error)
    return NextResponse.json({ error: 'Failed to trigger enrichment' }, { status: 500 })
  }
}

/**
 * GET - Récupérer le statut d'enrichissement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  try {
    const { id: leadId } = await params
    const status = await getEnrichmentStatus(leadId)

    if (status.error) {
      return NextResponse.json({ error: status.error }, { status: 400 })
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('[API] Get enrichment status failed:', error)
    return NextResponse.json({ error: 'Failed to get enrichment status' }, { status: 500 })
  }
}
