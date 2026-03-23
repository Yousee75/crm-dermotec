import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import React from 'react'

export const dynamic = 'force-dynamic'

/**
 * GET /api/enrichment/report/pdf?leadId=xxx
 * Génère et retourne le PDF du rapport prospect
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
  const versionParam = searchParams.get('version')

  if (!leadId) {
    return NextResponse.json({ error: 'leadId requis' }, { status: 400 })
  }

  try {
    // Récupérer le lead
    const { data: lead } = await supabase
      .from('leads')
      .select('prenom, nom, email, telephone, entreprise_nom')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    }
    const ld = lead as any

    // Récupérer le rapport
    let query = supabase
      .from('prospect_reports')
      .select('*')
      .eq('lead_id', leadId)

    if (versionParam) {
      query = query.eq('version', parseInt(versionParam))
    } else {
      query = query.order('version', { ascending: false }).limit(1)
    }

    const { data: reports } = await query
    const report = (reports as any)?.[0]

    if (!report || !report.narrative) {
      return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 })
    }

    // Extraire les données enrichies et scores
    const enrichmentData = report.enrichment_data || {}
    // SÉCURITÉ : ne PAS exposer GOOGLE_PLACES_API_KEY dans l'URL du PDF
    // Télécharger la photo côté serveur et l'intégrer en base64
    let googlePhoto: string | undefined
    if (enrichmentData.google?.photos > 0 && enrichmentData.google?.placeId && process.env.GOOGLE_PLACES_API_KEY) {
      try {
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photo_reference=${enrichmentData.google.placeId}&key=${process.env.GOOGLE_PLACES_API_KEY}`
        const photoRes = await fetch(photoUrl, { signal: AbortSignal.timeout(5000) })
        if (photoRes.ok) {
          const buf = await photoRes.arrayBuffer()
          googlePhoto = `data:image/jpeg;base64,${Buffer.from(buf).toString('base64')}`
        }
      } catch { /* Photo non disponible — pas bloquant */ }
    }

    // Calculer les scores par dimension si pas déjà dans le rapport
    const scores = report.scores || {
      reputation: enrichmentData.google?.rating ? Math.round(enrichmentData.google.rating * 20) : 40,
      presence: (enrichmentData.social?.website ? 30 : 0) + (enrichmentData.social?.instagram ? 25 : 0) + (enrichmentData.google?.website ? 15 : 0) + (enrichmentData.social?.facebook ? 10 : 0),
      activity: enrichmentData.social?.instagram?.posts ? Math.min(100, Math.round(Math.log10(enrichmentData.social.instagram.posts + 1) * 30)) : 20,
      financial: enrichmentData.pappers?.chiffreAffaires ? Math.min(100, Math.round(enrichmentData.pappers.chiffreAffaires / 3000)) : 50,
      neighborhood: enrichmentData.quartier?.footTrafficScore || 50,
    }

    // Lazy import pour éviter le crash au build (SSG)
    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { RapportProspect } = await import('@/lib/pdf/rapport-prospect')

    // Générer le PDF
    const element = React.createElement(RapportProspect, {
      lead: {
        prenom: ld.prenom,
        nom: ld.nom,
        entreprise: ld.entreprise_nom,
        email: ld.email,
        telephone: ld.telephone,
      },
      narrative: report.narrative,
      enrichment: enrichmentData,
      scores,
      generatedAt: new Date(report.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      version: report.version,
      photoUrl: googlePhoto,
    })

    const buffer = await renderToBuffer(element as any)
    const uint8 = new Uint8Array(buffer)

    const nomFichier = `rapport-prospect-${(ld.prenom || '').toLowerCase()}-${(ld.nom || '').toLowerCase()}-v${report.version}.pdf`

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${nomFichier}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('[PDF Report] Erreur:', error)
    return NextResponse.json({ error: 'Erreur génération PDF' }, { status: 500 })
  }
}
