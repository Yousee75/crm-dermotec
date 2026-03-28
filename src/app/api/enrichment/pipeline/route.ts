import { NextRequest, NextResponse } from 'next/server'
import { runEnrichmentPipeline } from '@/lib/enrichment-pipeline'
import { enrichComplet } from '@/lib/enrichment-orchestrator'
import { generateProspectNarrative } from '@/lib/prospect/narrator'
import { reviewsToStorable } from '@/lib/reviews-analyzer'
import { createServiceSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/enrichment/pipeline
 * Lance le pipeline d'enrichissement intelligent pour un lead
 * Body: { leadId: string }
 * Retourne: enrichment + narrative
 */
export async function POST(req: NextRequest) {
  const supabase = await createServiceSupabase()
  try {
    // Auth obligatoire
    const { createServerSupabase } = await import('@/lib/supabase-server')
    const authSb = await createServerSupabase()
    const { data: { user } } = await authSb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Rate limiting strict (3 req/min — route coûteuse)
    const { getEnrichmentRateLimiter } = await import('@/lib/upstash')
    const limiter = getEnrichmentRateLimiter()
    if (limiter) {
      const { success } = await limiter.limit(user.id)
      if (!success) {
        return NextResponse.json({ error: 'Trop de requêtes. Maximum 3 enrichissements par minute.' }, { status: 429 })
      }
    }

    const { leadId } = await req.json()
    if (!leadId) {
      return NextResponse.json({ error: 'leadId requis' }, { status: 400 })
    }

    // Anti-doublon : lock distribué sur le lead_id (empêche 2 enrichissements simultanés)
    try {
      const { cacheGet, cacheSet } = await import('@/lib/upstash')
      const lockKey = `lock:enrich:${leadId}`
      const existing = await cacheGet(lockKey)
      if (existing) {
        return NextResponse.json({ error: 'Enrichissement déjà en cours pour ce lead' }, { status: 409 })
      }
      await cacheSet(lockKey, 'running', 120) // Lock 2 min max
    } catch { /* Redis down — continue sans lock */ }

    // Récupérer les données du lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    }

    const l = lead as any

    // ── 1. Lancer le pipeline d'enrichissement ──
    const enrichment = await runEnrichmentPipeline({
      leadId,
      siret: l.siret || l.entreprise_siret,
      nom: l.nom,
      prenom: l.prenom,
      entreprise: l.entreprise_nom,
      ville: l.adresse?.ville || 'Paris',
      email: l.email,
      telephone: l.telephone,
      codePostal: l.adresse?.code_postal,
    })

    // ── 1bis. Enrichissement 360° (orchestrateur 47 sources) ──
    const intelligence = await enrichComplet({
      siret: l.siret || l.entreprise_siret,
      nom: l.entreprise_nom,
      ville: l.adresse?.ville || 'Paris',
      departement: l.adresse?.departement,
      code_postal: l.adresse?.code_postal,
      lat: l.adresse?.lat || l.metadata?.google_places?.lat,
      lng: l.adresse?.lng || l.metadata?.google_places?.lng,
      website: l.metadata?.google_places?.website || l.site_web,
      lead_id: leadId,
    })

    // ── 1ter. Stocker les avis en base ──
    if (enrichment.aggregatedData.reviews?.rawReviews.length) {
      const storable = reviewsToStorable(leadId, enrichment.aggregatedData.reviews.rawReviews)
      // Upsert — ignorer les doublons
      for (const review of storable) {
        await supabase.from('prospect_reviews' as any).upsert(review as any, {
          onConflict: 'lead_id,source,author_name,review_date',
          ignoreDuplicates: true,
        } as any).then(() => {})
      }
    }

    // ── 1quater. Stocker avis détaillés dans prospect_reviews_detailed ──
    if (enrichment.aggregatedData.reviews?.rawReviews?.length) {
      for (const review of enrichment.aggregatedData.reviews.rawReviews.slice(0, 50)) {
        await supabase.from('prospect_reviews_detailed' as any).upsert({
          lead_id: leadId,
          plateforme: 'google',
          auteur: review.author_name || review.author_title || 'Anonyme',
          note: review.rating || review.review_rating,
          texte: review.text || review.review_text,
          date_avis: review.time ? new Date(review.time * 1000).toISOString().split('T')[0] : null,
          date_avis_relative: review.relative_time_description || review.review_datetime_utc,
          reponse_proprietaire: review.owner_answer || null,
          sentiment: (review.rating || review.review_rating) >= 4 ? 'positif' : (review.rating || review.review_rating) <= 2 ? 'negatif' : 'neutre',
        } as any, {
          onConflict: 'lead_id,plateforme,auteur,date_avis',
          ignoreDuplicates: true,
        } as any).then(() => {})
      }
    }

    // ── 1quinquies. Stocker photos dans prospect_photos ──
    if (enrichment.aggregatedData.google?.photos) {
      const photoCount = enrichment.aggregatedData.google.photos
      // Stocker le nombre de photos comme métadonnée (les URLs nécessitent Place Photos API)
      await supabase.from('prospect_photos' as any).upsert({
        lead_id: leadId,
        source: 'google',
        url_originale: `google_photos_count:${photoCount}`,
        type: 'metadata',
      } as any, {
        onConflict: 'lead_id,source,type',
        ignoreDuplicates: true,
      } as any).then(() => {})
    }

    // ── 2. Générer le narratif IA (avec données 360°) ──
    const narrative = await generateProspectNarrative({
      lead: {
        prenom: l.prenom,
        nom: l.nom,
        email: l.email,
        telephone: l.telephone,
        entreprise: l.entreprise_nom,
        statut_pro: l.statut_professionnel,
        source: l.source,
      },
      enrichment: enrichment.aggregatedData,
      intelligence,
      score: enrichment.totalScore,
      classification: enrichment.classification,
    })

    // ── 3. Sauvegarder le rapport (version 1) ──
    const reportData = {
      lead_id: leadId,
      version: 1,
      score: enrichment.totalScore,
      classification: enrichment.classification,
      enrichment_data: { ...enrichment.aggregatedData, intelligence },
      enrichment_steps: enrichment.steps,
      narrative,
      status: 'generated',
      created_at: new Date().toISOString(),
    }

    // Upsert — si un rapport existe déjà, incrémenter la version
    const { data: existing } = await supabase
      .from('prospect_reports')
      .select('version')
      .eq('lead_id', leadId)
      .order('version', { ascending: false })
      .limit(1)

    if (existing && existing.length > 0) {
      reportData.version = (existing as any[])[0].version + 1
    }

    const { error: insertError } = await supabase
      .from('prospect_reports' as any)
      .insert(reportData as any)

    if (insertError) {
      console.error('[Pipeline] Erreur sauvegarde rapport:', insertError)
      // Continue quand même — le rapport est généré même si la DB échoue
    }

    // ── 4. Mettre à jour le lead avec le score ──
    await (supabase.from('leads') as any)
      .update({
        score: enrichment.totalScore,
        metadata: {
          ...(l.metadata || {}),
          last_enrichment: new Date().toISOString(),
          enrichment_classification: enrichment.classification,
        },
      })
      .eq('id', leadId)

    // Libérer le lock
    try {
      const { cacheDelete } = await import('@/lib/upstash')
      await cacheDelete(`lock:enrich:${leadId}`)
    } catch { /* silent */ }

    return NextResponse.json({
      enrichment: {
        score: enrichment.totalScore,
        classification: enrichment.classification,
        steps: enrichment.steps.map(s => ({
          step: s.step,
          status: s.status,
          scoreImpact: s.scoreImpact,
          durationMs: s.durationMs,
          reason: s.reason,
        })),
        totalDurationMs: enrichment.totalDurationMs,
      },
      narrative,
      intelligence,
      version: reportData.version,
    })
  } catch (error: any) {
    // Libérer le lock même en cas d'erreur (leadId peut ne pas être défini si l'erreur est avant le parsing)
    try {
      const body = await req.clone().json().catch(() => ({}))
      if (body?.leadId) {
        const { cacheDelete } = await import('@/lib/upstash')
        await cacheDelete(`lock:enrich:${body.leadId}`)
      }
    } catch { /* silent */ }

    console.error('[Pipeline] Erreur:', error)
    return NextResponse.json({ error: 'Erreur pipeline enrichissement' }, { status: 500 })
  }
}
