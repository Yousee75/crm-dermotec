import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { enrichLead, enrichWithPappers, enrichWithGooglePlaces } from '@/lib/enrichment'
import { checkAndConsumeCredits, getCreditStatus } from '@/lib/api/credit-guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const CREDIT_COSTS_MAP: Record<string, number> = {
  pappers: 2,
  google_places: 2,
  enrichment_full: 5,
}

// POST /api/enrichment — Enrichir un lead (PROTÉGÉ par credit guard anti-abus)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { lead_id, siret, entreprise_nom, ville, provider } = body
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()

    // Récupérer le profil utilisateur
    const { createServiceSupabase } = await import('@/lib/supabase-server')
    const supabase = await createServiceSupabase()
    const { data: equipe } = await (supabase as any)
      .from('equipe')
      .select('id, org_id')
      .eq('auth_user_id', auth.user.id)
      .single()

    if (!equipe) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 403 })
    }

    const creditsNeeded = CREDIT_COSTS_MAP[provider || 'enrichment_full'] || 5

    // VÉRIFICATION CRÉDITS — atomique, inviolable, anti-abus
    const creditCheck = await checkAndConsumeCredits({
      user_id: equipe.id,
      org_id: equipe.org_id,
      lead_id,
      provider: provider || 'enrichment_full',
      credits: creditsNeeded,
      ip,
    })

    if (!creditCheck.allowed) {
      const statusCode = creditCheck.reason === 'burst_detected' || creditCheck.reason?.includes('limit') ? 429
        : creditCheck.reason === 'insufficient_credits' ? 402
        : creditCheck.reason === 'lead_already_enriched' ? 409
        : 403

      return NextResponse.json({
        error: 'Limite atteinte',
        reason: creditCheck.reason,
        remaining: creditCheck.remaining,
        retry_after: creditCheck.retry_after,
      }, {
        status: statusCode,
        headers: creditCheck.retry_after ? { 'Retry-After': creditCheck.retry_after === '1 hour' ? '3600' : '60' } : {},
      })
    }

    // Enrichissement
    if (provider === 'pappers' && siret) {
      const result = await enrichWithPappers(siret)
      return NextResponse.json({ ...result, credits: creditCheck })
    }
    if (provider === 'google_places' && entreprise_nom) {
      const result = await enrichWithGooglePlaces(entreprise_nom, ville)
      return NextResponse.json({ ...result, credits: creditCheck })
    }
    if (!siret && !entreprise_nom) {
      return NextResponse.json({ error: 'siret ou entreprise_nom requis' }, { status: 400 })
    }

    const result = await enrichLead({ siret, entreprise_nom, ville, lead_id, user_id: equipe.id })

    // Mettre à jour le lead
    if (lead_id && (result.sirene || result.pappers || result.google)) {
      const updates: Record<string, unknown> = {}
      if (result.pappers) {
        updates.entreprise_nom = result.pappers.denomination
        updates.entreprise_siret = result.pappers.siret_siege
        updates.metadata = {
          enrichment: {
            pappers: { ...result.pappers, enriched_at: new Date().toISOString() },
            ...(result.google ? { google: { ...result.google, enriched_at: new Date().toISOString() } } : {}),
            ai_summary: result.ai_summary,
          },
        }
      }
      if (Object.keys(updates).length > 0) {
        await (supabase as any).from('leads').update(updates).eq('id', lead_id)
        await (supabase as any).from('activites').insert({
          type: 'SYSTEME', lead_id, user_id: equipe.id,
          description: `Lead enrichi (${result.sources_used.join(', ')}) — ${creditCheck.credits_consumed} crédits`,
        })
      }
    }

    return NextResponse.json({
      ...result, lead_id,
      credits: { consumed: creditCheck.credits_consumed, remaining: creditCheck.remaining, plan: creditCheck.plan },
    })
  } catch (error) {
    console.error('[Enrichment]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// GET /api/enrichment — Solde crédits + usage + alertes abus
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  try {
    const { createServiceSupabase } = await import('@/lib/supabase-server')
    const supabase = await createServiceSupabase()
    const { data: equipe } = await (supabase as any).from('equipe').select('org_id').eq('auth_user_id', auth.user.id).single()

    const status = await getCreditStatus(equipe?.org_id)
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
