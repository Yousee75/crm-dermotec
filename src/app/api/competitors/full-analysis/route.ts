import { NextRequest, NextResponse } from 'next/server'
import { discoverCompetitors } from '@/lib/competitor-discovery'
import { analyzeCompetitors } from '@/lib/competitor-analyzer'
import { discoverSocialProfiles, scrapeInstagram } from '@/lib/social-discovery'
import { scrapeCompetitorFull } from '@/lib/competitor-scraper'
import { fetchNeighborhoodData } from '@/lib/neighborhood-data'
import { computeMultiScore } from '@/lib/competitor-scoring'
import { validateWithAI } from '@/lib/competitor-ai-validator'
import { saveCompetitorProfile } from '@/lib/competitor-persistence'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error
    const body = await request.json()
    const { siret, nom, ville, radiusM, maxCompetitors } = body

    if (!siret && !nom) {
      return NextResponse.json({ error: 'SIRET ou nom requis' }, { status: 400 })
    }

    const max = Math.min(maxCompetitors || 5, 10)

    // PHASE 1 : Discovery + Analyse de base
    const discovery = await discoverCompetitors({ siret, nom, ville, radiusM })
    if (!discovery) {
      return NextResponse.json({ error: 'Établissement non trouvé' }, { status: 404 })
    }

    const analysis = await analyzeCompetitors(discovery.prospect, discovery.competitors)

    // PHASE 2 : Données quartier (gratuit, Google Places)
    const neighborhood = await fetchNeighborhoodData(
      discovery.prospect.lat,
      discovery.prospect.lng,
      500
    )

    // PHASE 3 : Pour chaque concurrent (top N), scraping approfondi
    const enrichedCompetitors = []

    for (const comp of analysis.competitors.slice(0, max)) {
      // 3a. Scraping plateformes (PJ, Planity, Treatwell)
      let scraped = null
      try {
        scraped = await scrapeCompetitorFull({
          nom: comp.nom,
          ville: comp.ville || ville || 'Paris',
          pagesJaunesUrl: comp.pagesJaunesUrl,
          planityUrl: comp.planityUrl,
          treatwellUrl: comp.treatwellUrl,
        })
      } catch (err) {
        console.warn(`[FullAnalysis] Scraping failed for ${comp.nom}:`, err)
      }

      // 3b. Social discovery (site web → réseaux sociaux)
      let social = null
      if (comp.website) {
        try {
          const profiles = await discoverSocialProfiles(comp.website, comp.nom)
          social = { profiles } as Record<string, unknown>

          // Scraper Instagram si trouvé
          if (profiles.instagram) {
            const igData = await scrapeInstagram(profiles.instagram)
            if (igData) (social as Record<string, unknown>).instagram = igData
          }
        } catch {
          console.warn(`[FullAnalysis] Social discovery failed for ${comp.nom}`)
        }
      }

      // 3c. Score multi-dimensionnel
      const scores = computeMultiScore({
        competitor: {
          ...comp,
          pjRating: scraped?.pagesJaunes?.rating,
          planityFound: scraped?.planity?.found,
          planityRating: scraped?.planity?.rating,
          treatwellFound: scraped?.treatwell?.found,
          treatwellRating: scraped?.treatwell?.rating,
        },
        social: social as Record<string, unknown> | undefined,
        neighborhood,
      })

      // 3d. Validation IA (DeepSeek + Claude en parallèle)
      let aiValidation = null
      try {
        aiValidation = await validateWithAI({
          businessName: comp.nom,
          businessAddress: comp.adresse,
          businessCity: comp.ville || ville,
          competitor: comp,
          social: social as Record<string, unknown> | undefined,
          scraped: scraped || undefined,
          neighborhood,
          scores,
        })
      } catch {
        console.warn(`[FullAnalysis] AI validation failed for ${comp.nom}`)
      }

      // 3e. Sauvegarder dans Supabase
      let savedId = null
      try {
        savedId = await saveCompetitorProfile({
          competitor: comp,
          scraped,
          social: social as Record<string, unknown> | undefined,
          scores,
          aiValidation,
          neighborhood,
        })
      } catch {
        console.warn(`[FullAnalysis] Save failed for ${comp.nom}`)
      }

      enrichedCompetitors.push({
        ...comp,
        scraped,
        social,
        scores,
        aiValidation,
        savedId,
      })
    }

    return NextResponse.json({
      prospect: discovery.prospect,
      neighborhood,
      competitors: enrichedCompetitors,
      kpis: {
        ...analysis.kpis,
        avgMultiScore: enrichedCompetitors.length > 0
          ? Math.round(enrichedCompetitors.reduce((s, c) => s + (c.scores?.global || 0), 0) / enrichedCompetitors.length)
          : 0,
      },
      meta: {
        analyzedAt: new Date().toISOString(),
        radiusM: radiusM || 1000,
        competitorsAnalyzed: enrichedCompetitors.length,
        totalFound: analysis.competitors.length,
      },
    })
  } catch (err) {
    console.error('[FullAnalysis] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
