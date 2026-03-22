// ============================================================
// CRM DERMOTEC — Persistence des données concurrents
// Sauvegarde dans Supabase competitor_profiles + competitor_reviews
// ============================================================

import type { AnalyzedCompetitor } from './competitor-analyzer'
import type { ScrapedCompetitor, PlatformReview } from './competitor-scraper'
import type { SocialMetrics } from './social-discovery'
import type { CompetitorScores } from './competitor-scoring'
import type { AIValidationResult } from './competitor-ai-validator'
import type { NeighborhoodData } from './neighborhood-data'

interface CompetitorFullData {
  competitor: Partial<AnalyzedCompetitor>
  scraped?: ScrapedCompetitor | null
  social?: Partial<SocialMetrics> | null
  scores?: CompetitorScores | null
  aiValidation?: AIValidationResult | null
  neighborhood?: NeighborhoodData | null
}

/** Sauvegarder un concurrent enrichi dans Supabase */
export async function saveCompetitorProfile(data: CompetitorFullData): Promise<string | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const c = data.competitor
    const s = data.scraped
    const social = data.social

    // Construire le profil
    const profile = {
      siren: c.siren || c.siret?.slice(0, 9) || null,
      siret: c.siret || null,
      nom: c.nom || 'Inconnu',
      adresse: c.adresse || s?.pagesJaunes?.adresse || null,
      code_postal: c.codePostal || null,
      ville: c.ville || null,
      lat: c.lat || null,
      lng: c.lng || null,
      code_ape: c.codeApe || null,
      forme_juridique: c.formeJuridique || null,
      capital_social: null, // TODO: from scraper-societe
      ca_dernier: c.chiffreAffaires || null,
      resultat_net: c.resultatNet || null,
      annee_fiscale: c.anneeFiscale || null,
      effectif: null,
      dirigeants: c.dirigeants || [],
      website: c.website || s?.pagesJaunes?.website || null,
      telephone: c.telephone || s?.pagesJaunes?.telephone || null,
      google_place_id: c.googlePlaceId || null,
      google_rating: c.googleRating || null,
      google_reviews_count: c.googleReviewsCount || null,
      pj_rating: s?.pagesJaunes?.rating || null,
      pj_reviews_count: s?.pagesJaunes?.reviewsCount || null,
      planity_found: s?.planity?.found || false,
      planity_rating: s?.planity?.rating || null,
      treatwell_found: s?.treatwell?.found || false,
      treatwell_rating: s?.treatwell?.rating || null,
      instagram_username: (social as Record<string, { username?: string }>)?.instagram?.username || null,
      instagram_followers: (social as Record<string, { followers?: number }>)?.instagram?.followers || null,
      instagram_posts: (social as Record<string, { posts?: number }>)?.instagram?.posts || null,
      facebook_url: (social as Record<string, { pageUrl?: string }>)?.facebook?.pageUrl || null,
      facebook_followers: (social as Record<string, { followers?: number }>)?.facebook?.followers || null,
      tiktok_username: (social as Record<string, { username?: string }>)?.tiktok?.username || null,
      tiktok_followers: (social as Record<string, { followers?: number }>)?.tiktok?.followers || null,
      services: [
        ...(s?.pagesJaunes?.services || []),
        ...(s?.planity?.services || []),
      ].filter((v, i, a) => a.indexOf(v) === i), // unique
      prix: [
        ...(s?.planity?.prix || []),
        ...(s?.treatwell?.prix || []),
      ].filter((v, i, a) => a.indexOf(v) === i),
      horaires: s?.pagesJaunes?.horaires || s?.planity?.horaires || [],
      photos: s?.pagesJaunes?.photoUrls || [],
      sources: c.sources || [],
      scores: data.scores || {},
      ai_analysis: data.aiValidation?.enrichedData || {},
      scraped_at: new Date().toISOString(),
    }

    // Calculer score de remplissage
    const filledFields = Object.entries(profile).filter(([, v]) => {
      if (v === null || v === undefined) return false
      if (typeof v === 'string' && v === '') return false
      if (typeof v === 'number' && v === 0) return false
      if (Array.isArray(v) && v.length === 0) return false
      if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false
      return true
    }).length
    const totalFields = Object.keys(profile).length
    const scoreRemplissage = Math.round((filledFields / totalFields) * 100)

    // UPSERT par siren (ou insert si pas de siren)
    const { data: saved, error } = profile.siren
      ? await supabase
          .from('competitor_profiles')
          .upsert({ ...profile, score_remplissage: scoreRemplissage }, { onConflict: 'siren' })
          .select('id')
          .single()
      : await supabase
          .from('competitor_profiles')
          .insert({ ...profile, score_remplissage: scoreRemplissage })
          .select('id')
          .single()

    if (error) {
      console.error('[Persistence] Save profile error:', error.message)
      return null
    }

    const profileId = saved?.id
    if (!profileId) return null

    console.log(`[Persistence] Saved ${profile.nom} (${profileId}) — ${scoreRemplissage}% rempli`)

    // Sauvegarder les avis
    const allReviews: PlatformReview[] = [
      ...(s?.pagesJaunes?.reviews || []),
      ...(s?.google?.reviews || []),
    ]

    if (allReviews.length > 0) {
      const reviewRows = allReviews.map(r => ({
        competitor_id: profileId,
        platform: r.platform,
        author: r.author,
        rating: r.rating,
        text: r.text,
        review_date: r.date || null,
        owner_responded: r.ownerResponded || false,
      }))

      const { error: revError } = await supabase
        .from('competitor_reviews')
        .insert(reviewRows)

      if (revError) {
        console.warn('[Persistence] Save reviews error:', revError.message)
      } else {
        console.log(`[Persistence] Saved ${reviewRows.length} reviews for ${profile.nom}`)
      }
    }

    return profileId
  } catch (err) {
    console.error('[Persistence] Error:', err)
    return null
  }
}

/** Sauvegarder tous les concurrents d'une analyse */
export async function saveAnalysisResults(
  competitors: CompetitorFullData[]
): Promise<string[]> {
  const ids: string[] = []

  for (const comp of competitors) {
    const id = await saveCompetitorProfile(comp)
    if (id) ids.push(id)
  }

  console.log(`[Persistence] Saved ${ids.length}/${competitors.length} competitors`)
  return ids
}
