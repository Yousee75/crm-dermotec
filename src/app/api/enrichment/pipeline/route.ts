import { NextRequest, NextResponse } from 'next/server'
import { runEnrichmentPipeline } from '@/lib/enrichment-pipeline'
import { generateProspectNarrative } from '@/lib/prospect-narrator'
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
    const { leadId } = await req.json()
    if (!leadId) {
      return NextResponse.json({ error: 'leadId requis' }, { status: 400 })
    }

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

    // ── 1bis. Stocker les avis en base ──
    if (enrichment.aggregatedData.reviews?.rawReviews.length) {
      const storable = reviewsToStorable(leadId, enrichment.aggregatedData.reviews.rawReviews)
      // Upsert — ignorer les doublons
      for (const review of storable) {
        await supabase.from('prospect_reviews').upsert(review, {
          onConflict: 'lead_id,source,author_name,review_date',
          ignoreDuplicates: true,
        }).then(() => {})
      }
    }

    // ── 2. Générer le narratif IA ──
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
      score: enrichment.totalScore,
      classification: enrichment.classification,
    })

    // ── 3. Sauvegarder le rapport (version 1) ──
    const reportData = {
      lead_id: leadId,
      version: 1,
      score: enrichment.totalScore,
      classification: enrichment.classification,
      enrichment_data: enrichment.aggregatedData,
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
      reportData.version = existing[0].version + 1
    }

    const { error: insertError } = await supabase
      .from('prospect_reports')
      .insert(reportData)

    if (insertError) {
      console.error('[Pipeline] Erreur sauvegarde rapport:', insertError)
      // Continue quand même — le rapport est généré même si la DB échoue
    }

    // ── 4. Mettre à jour le lead avec le score ──
    await supabase
      .from('leads')
      .update({
        score: enrichment.totalScore,
        metadata: {
          ...(l.metadata || {}),
          last_enrichment: new Date().toISOString(),
          enrichment_classification: enrichment.classification,
        },
      })
      .eq('id', leadId)

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
      version: reportData.version,
    })
  } catch (error: any) {
    console.error('[Pipeline] Erreur:', error)
    return NextResponse.json({ error: 'Erreur pipeline enrichissement' }, { status: 500 })
  }
}
