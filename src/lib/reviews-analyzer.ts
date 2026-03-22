// ============================================================
// CRM DERMOTEC — Récupération & analyse COMPLÈTE des avis
// Sources : Outscraper (TOUS les avis) + Google Places (fallback 5)
// Stocke chaque avis en BDD, analyse distribution, sentiment,
// mots-clés, tendance, réponses propriétaire, photos
// ============================================================
import 'server-only'

// ── Types ──────────────────────────────────────────────────

export interface GoogleReview {
  author_name: string
  author_url?: string
  author_image?: string
  author_reviews_count?: number
  rating: number
  text: string
  time: number // Unix timestamp
  relative_time_description?: string
  language?: string
  // Outscraper bonus
  review_id?: string
  review_link?: string
  review_img_urls?: string[]
  review_likes?: number
  owner_answer?: string
  owner_answer_date?: string
}

/** Données place complètes retournées par Outscraper en plus des avis */
export interface OutscraperPlaceData {
  name?: string
  place_id?: string
  google_id?: string
  rating?: number
  reviews?: number
  reviews_per_score?: Record<string, number> // {"1": 2, "2": 5, "3": 10, "4": 30, "5": 120}
  address?: string
  phone?: string
  website?: string
  location_link?: string
  photos_count?: number
  type?: string
  subtypes?: string[]
  price_level?: string
  working_hours?: Record<string, string>
  about?: Record<string, any>
  description?: string
  logo?: string
  owner_title?: string
  owner_link?: string
}

export interface ReviewAnalysis {
  // Distribution exacte (depuis reviews_per_score ou calculée)
  distribution: { stars: number; count: number; percentage: number }[]
  totalReviews: number
  averageRating: number
  fetchedCount: number // Nombre d'avis réellement récupérés

  // Tendance temporelle
  recentAvg: number
  olderAvg: number
  trend: 'improving' | 'stable' | 'declining'
  trendDelta: number

  // Réponses propriétaire
  ownerResponseRate: number // % d'avis avec réponse du proprio
  ownerRespondsToNegative: boolean // Répond-il aux avis négatifs ?

  // Engagement auteurs
  avgAuthorReviews: number // Les auteurs sont-ils des "vrais" reviewers ?
  reviewsWithPhotos: number // Nb d'avis avec photo

  // Sentiment / mots-clés
  positiveKeywords: string[]
  negativeKeywords: string[]
  topPositiveReview: GoogleReview | null
  topNegativeReview: GoogleReview | null
  topLikedReview: GoogleReview | null // Avis le plus "utile"

  // Stats texte
  averageLength: number
  withTextPercentage: number

  // Données place enrichies (Outscraper)
  placeData?: OutscraperPlaceData
}

export interface StoredReview {
  id?: string
  lead_id: string
  source: 'google' | 'pagesjaunes' | 'planity' | 'treatwell' | 'facebook' | 'yelp'
  author_name: string
  rating: number
  text: string
  review_date: string
  language: string
  metadata?: Record<string, unknown>
}

// ── Récupération Google Places (fallback — 5 avis max) ────

export async function fetchGoogleReviews(placeId: string): Promise<GoogleReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey || !placeId) return []

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}&language=fr&reviews_sort=newest`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.result?.reviews || []).map((r: any) => ({
      author_name: r.author_name || 'Anonyme',
      author_url: r.author_url,
      author_image: r.profile_photo_url,
      rating: r.rating,
      text: r.text || '',
      time: r.time,
      relative_time_description: r.relative_time_description,
      language: r.language,
    }))
  } catch {
    return []
  }
}

// ── Récupération Outscraper (TOUS les avis + données place) ─

export interface OutscraperResult {
  reviews: GoogleReview[]
  placeData: OutscraperPlaceData | null
  reviewsPerScore: Record<string, number> | null
}

export async function fetchAllReviewsOutscraper(query: string): Promise<OutscraperResult> {
  const apiKey = process.env.OUTSCRAPER_API_KEY
  if (!apiKey || !query) return { reviews: [], placeData: null, reviewsPerScore: null }

  try {
    // Outscraper reviews-v3 : retourne les avis + les données du lieu
    const res = await fetch(
      `https://api.app.outscraper.com/maps/reviews-v3?query=${encodeURIComponent(query)}&reviewsLimit=200&language=fr&sort=newest&async=false`,
      {
        headers: { 'X-API-KEY': apiKey },
        signal: AbortSignal.timeout(60000), // 60s — Outscraper peut être lent
      }
    )

    if (!res.ok) {
      console.error(`[Outscraper] HTTP ${res.status}`)
      return { reviews: [], placeData: null, reviewsPerScore: null }
    }

    const data = await res.json()
    const place = data.data?.[0] || {}

    // Extraire les données du lieu
    const placeData: OutscraperPlaceData = {
      name: place.name,
      place_id: place.place_id,
      google_id: place.google_id,
      rating: place.rating,
      reviews: place.reviews,
      reviews_per_score: place.reviews_per_score, // Distribution EXACTE Google
      address: place.full_address || place.address,
      phone: place.phone,
      website: place.site || place.website,
      location_link: place.location_link,
      photos_count: place.photos_count,
      type: place.type,
      subtypes: place.subtypes,
      price_level: place.price_level,
      working_hours: place.working_hours,
      description: place.description,
      logo: place.logo,
      owner_title: place.owner_title,
      owner_link: place.owner_link,
    }

    // Distribution depuis Outscraper (si dispo, c'est la VRAIE distribution Google)
    const reviewsPerScore = place.reviews_per_score || null

    // Normaliser les avis
    const rawReviews = place.reviews_data || []
    const reviews: GoogleReview[] = rawReviews.map((r: any) => ({
      author_name: r.author_title || 'Anonyme',
      author_url: r.author_link,
      author_image: r.author_image,
      author_reviews_count: r.author_reviews_count,
      rating: r.review_rating || 3,
      text: r.review_text || '',
      time: r.review_datetime_utc
        ? Math.floor(new Date(r.review_datetime_utc).getTime() / 1000)
        : r.review_timestamp || Math.floor(Date.now() / 1000),
      relative_time_description: r.review_datetime_utc,
      language: r.review_language || 'fr',
      review_id: r.review_id,
      review_link: r.review_link,
      review_img_urls: r.review_img_urls || (r.review_img_url ? [r.review_img_url] : []),
      review_likes: r.review_likes || 0,
      owner_answer: r.owner_answer,
      owner_answer_date: r.owner_answer_timestamp_datetime_utc,
    }))

    console.log(`[Outscraper] ${reviews.length} avis récupérés pour "${place.name}", distribution: ${JSON.stringify(reviewsPerScore)}`)

    return { reviews, placeData, reviewsPerScore }
  } catch (err) {
    console.error('[Outscraper] Erreur:', err)
    return { reviews: [], placeData: null, reviewsPerScore: null }
  }
}

// ── Analyse complète des avis ─────────────────────────────

const POSITIVE_KEYWORDS_FR = [
  'excellent', 'super', 'parfait', 'génial', 'magnifique', 'bravo', 'top',
  'recommande', 'professionnelle', 'accueil', 'résultat', 'naturel',
  'satisfaite', 'ravie', 'impeccable', 'qualité', 'propre', 'hygiène',
  'compétente', 'douce', 'précise', 'formidable', 'merci', 'confiance',
  'sublime', 'incroyable', 'adore', 'meilleur', 'exceptionnelle', 'fantastique',
]

const NEGATIVE_KEYWORDS_FR = [
  'déçue', 'décevant', 'mauvais', 'nul', 'horrible', 'arnaque',
  'attente', 'retard', 'douleur', 'mal', 'cher', 'trop cher',
  'jamais', 'problème', 'désagréable', 'sale', 'lent', 'froid',
  'impoli', 'rude', 'catastrophe', 'regret', 'pire', 'honte', 'éviter',
]

export function analyzeReviews(
  reviews: GoogleReview[],
  reviewsPerScore?: Record<string, number> | null,
  totalKnown?: number,
  placeData?: OutscraperPlaceData | null,
): ReviewAnalysis {
  const total = totalKnown || reviews.length

  // Distribution : utiliser reviews_per_score Outscraper si dispo (données EXACTES Google)
  let distribution: ReviewAnalysis['distribution']
  if (reviewsPerScore && Object.keys(reviewsPerScore).length > 0) {
    distribution = [1, 2, 3, 4, 5].map(stars => {
      const count = reviewsPerScore[String(stars)] || 0
      return { stars, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0 }
    })
  } else {
    // Calculer depuis les avis récupérés
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach(r => { counts[Math.round(r.rating)] = (counts[Math.round(r.rating)] || 0) + 1 })
    const n = reviews.length || 1
    distribution = [1, 2, 3, 4, 5].map(stars => ({
      stars, count: counts[stars] || 0, percentage: Math.round(((counts[stars] || 0) / n) * 100),
    }))
  }

  // Moyenne
  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : placeData?.rating || 0

  // Tendance (6 derniers mois vs avant)
  const sixMonthsAgo = Date.now() / 1000 - 6 * 30 * 24 * 3600
  const recent = reviews.filter(r => r.time > sixMonthsAgo)
  const older = reviews.filter(r => r.time <= sixMonthsAgo)
  const recentAvg = recent.length > 0 ? Math.round((recent.reduce((s, r) => s + r.rating, 0) / recent.length) * 10) / 10 : averageRating
  const olderAvg = older.length > 0 ? Math.round((older.reduce((s, r) => s + r.rating, 0) / older.length) * 10) / 10 : averageRating
  const trendDelta = Math.round((recentAvg - olderAvg) * 10) / 10
  const trend: ReviewAnalysis['trend'] = trendDelta > 0.2 ? 'improving' : trendDelta < -0.2 ? 'declining' : 'stable'

  // Réponses propriétaire
  const withOwnerAnswer = reviews.filter(r => r.owner_answer && r.owner_answer.length > 0)
  const ownerResponseRate = reviews.length > 0 ? Math.round((withOwnerAnswer.length / reviews.length) * 100) : 0
  const negativeWithResponse = reviews.filter(r => r.rating <= 2 && r.owner_answer)
  const negativesTotal = reviews.filter(r => r.rating <= 2)
  const ownerRespondsToNegative = negativesTotal.length > 0 ? negativeWithResponse.length / negativesTotal.length > 0.3 : false

  // Engagement auteurs
  const authorsWithCount = reviews.filter(r => r.author_reviews_count && r.author_reviews_count > 0)
  const avgAuthorReviews = authorsWithCount.length > 0
    ? Math.round(authorsWithCount.reduce((s, r) => s + (r.author_reviews_count || 0), 0) / authorsWithCount.length)
    : 0

  // Photos dans les avis
  const reviewsWithPhotos = reviews.filter(r => r.review_img_urls && r.review_img_urls.length > 0).length

  // Mots-clés
  const allText = reviews.map(r => r.text.toLowerCase()).join(' ')
  const positiveKeywords = POSITIVE_KEYWORDS_FR.filter(kw => allText.includes(kw)).slice(0, 8)
  const negativeKeywords = NEGATIVE_KEYWORDS_FR.filter(kw => allText.includes(kw)).slice(0, 5)

  // Meilleur, pire, et plus liké
  const sorted5 = reviews.filter(r => r.rating === 5 && r.text.length > 20).sort((a, b) => b.text.length - a.text.length)
  const sorted12 = reviews.filter(r => r.rating <= 2 && r.text.length > 20).sort((a, b) => b.text.length - a.text.length)
  const sortedLikes = [...reviews].filter(r => (r.review_likes || 0) > 0).sort((a, b) => (b.review_likes || 0) - (a.review_likes || 0))

  // Stats texte
  const withText = reviews.filter(r => r.text && r.text.length > 5)
  const avgLength = withText.length > 0 ? Math.round(withText.reduce((s, r) => s + r.text.split(/\s+/).length, 0) / withText.length) : 0

  return {
    distribution,
    totalReviews: total,
    averageRating,
    fetchedCount: reviews.length,
    recentAvg,
    olderAvg,
    trend,
    trendDelta,
    ownerResponseRate,
    ownerRespondsToNegative,
    avgAuthorReviews,
    reviewsWithPhotos,
    positiveKeywords,
    negativeKeywords,
    topPositiveReview: sorted5[0] || null,
    topNegativeReview: sorted12[0] || null,
    topLikedReview: sortedLikes[0] || null,
    averageLength: avgLength,
    withTextPercentage: reviews.length > 0 ? Math.round((withText.length / reviews.length) * 100) : 0,
    placeData: placeData || undefined,
  }
}

// ── Préparer les avis pour stockage en BDD ────────────────

export function reviewsToStorable(leadId: string, reviews: GoogleReview[], source: StoredReview['source'] = 'google'): StoredReview[] {
  return reviews.map(r => ({
    lead_id: leadId,
    source,
    author_name: (r.author_name || 'Anonyme').slice(0, 100),
    rating: Math.min(5, Math.max(1, Math.round(r.rating))),
    text: r.text || '',
    review_date: new Date(r.time * 1000).toISOString(),
    language: r.language || 'fr',
    metadata: {
      author_url: r.author_url,
      author_image: r.author_image,
      author_reviews_count: r.author_reviews_count,
      review_id: r.review_id,
      review_link: r.review_link,
      review_img_urls: r.review_img_urls,
      review_likes: r.review_likes,
      owner_answer: r.owner_answer,
      owner_answer_date: r.owner_answer_date,
    },
  }))
}
