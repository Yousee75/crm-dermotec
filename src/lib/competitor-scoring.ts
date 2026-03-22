// ============================================================
// CRM DERMOTEC — Score multi-dimensionnel concurrent
// 5 dimensions (0-100 chacune) + score global pondéré
// ============================================================

import type { AnalyzedCompetitor } from './competitor-analyzer'
import type { SocialMetrics } from './social-discovery'
import type { NeighborhoodData } from './neighborhood-data'

export interface CompetitorScores {
  reputation: number      // 0-100 — Notes et avis
  presence: number        // 0-100 — Présence digitale
  activity: number        // 0-100 — Activité réseaux sociaux
  financial: number       // 0-100 — Santé financière
  neighborhood: number    // 0-100 — Potentiel quartier
  global: number          // 0-100 — Score pondéré final
}

// Poids des dimensions dans le score global
const WEIGHTS = {
  reputation: 0.30,
  presence: 0.25,
  activity: 0.20,
  financial: 0.15,
  neighborhood: 0.10,
}

/** Score Réputation (0-100) */
export function scoreReputation(comp: Partial<AnalyzedCompetitor>): number {
  let score = 0

  // Note Google /5 → 0-30 points
  if (comp.googleRating) score += (comp.googleRating / 5) * 30

  // Nb avis Google (log scale, cap 200) → 0-20 points
  if (comp.googleReviewsCount && comp.googleReviewsCount > 0) {
    score += Math.min(1, Math.log10(comp.googleReviewsCount + 1) / Math.log10(201)) * 20
  }

  // Note PagesJaunes → 0-15 points
  if (comp.pjRating) score += (comp.pjRating / 5) * 15

  // Note Planity/Treatwell → 0-10 points
  if (comp.planityRating) score += (comp.planityRating / 5) * 5
  if (comp.treatwellRating) score += (comp.treatwellRating / 5) * 5

  // Présence multi-plateformes (bonus) → 0-15 points
  const platforms = [
    comp.googleRating,
    comp.pjRating,
    comp.planityFound,
    comp.treatwellFound,
  ].filter(Boolean).length
  score += platforms * 5

  return Math.min(100, Math.round(score))
}

/** Score Présence Digitale (0-100) */
export function scorePresence(
  comp: Partial<AnalyzedCompetitor>,
  social?: Partial<SocialMetrics>
): number {
  let score = 0

  // A un site web → 15 points
  if (comp.website) score += 15

  // Instagram → 0-20 points
  if (social?.instagram) {
    score += 10
    if (social.instagram.followers && social.instagram.followers > 500) score += 5
    if (social.instagram.followers && social.instagram.followers > 2000) score += 5
  }

  // Facebook → 0-15 points
  if (social?.facebook) {
    score += 8
    if (social.facebook.followers && social.facebook.followers > 200) score += 7
  }

  // TikTok → 0-10 points
  if (social?.tiktok) {
    score += 5
    if (social.tiktok.followers && social.tiktok.followers > 500) score += 5
  }

  // Planity → 10 points
  if (comp.planityFound) score += 10

  // Treatwell → 10 points
  if (comp.treatwellFound) score += 10

  // Google Business optimisé (photos, horaires) → 0-10 points
  if (comp.googleReviewsCount && comp.googleReviewsCount > 0) score += 5
  if (comp.telephone) score += 5

  return Math.min(100, Math.round(score))
}

/** Score Activité Sociale (0-100) */
export function scoreActivity(social?: Partial<SocialMetrics>): number {
  if (!social) return 0
  let score = 0

  // Instagram activité
  if (social.instagram) {
    const ig = social.instagram
    // Nb posts total → 0-30 points (log scale)
    if (ig.posts && ig.posts > 0) {
      score += Math.min(30, Math.round(Math.log10(ig.posts + 1) / Math.log10(501) * 30))
    }

    // Followers → 0-30 points (log scale)
    if (ig.followers && ig.followers > 0) {
      score += Math.min(30, Math.round(Math.log10(ig.followers + 1) / Math.log10(10001) * 30))
    }

    // Ratio followers/following (engagement indicator) → 0-20 points
    if (ig.followers && ig.following && ig.following > 0) {
      const ratio = ig.followers / ig.following
      score += Math.min(20, Math.round(ratio * 5))
    }
  }

  // Facebook → 0-20 points
  if (social.facebook?.followers) {
    score += Math.min(20, Math.round(Math.log10(social.facebook.followers + 1) / Math.log10(5001) * 20))
  }

  return Math.min(100, Math.round(score))
}

/** Score Financier (0-100) */
export function scoreFinancial(comp: Partial<AnalyzedCompetitor>): number {
  if (!comp.chiffreAffaires) return 50 // Neutre si pas de données

  let score = 0

  // CA → 0-40 points (log scale, médiane secteur esthétique ~150K€)
  const caRatio = comp.chiffreAffaires / 150000
  score += Math.min(40, Math.round(caRatio * 20))

  // Résultat net positif → 0-30 points
  if (comp.resultatNet !== undefined) {
    if (comp.resultatNet > 0) {
      score += 20
      // Marge > 10% → bonus
      if (comp.chiffreAffaires > 0 && comp.resultatNet / comp.chiffreAffaires > 0.10) {
        score += 10
      }
    }
  } else {
    score += 15 // Neutre
  }

  // Forme juridique (SARL/SAS vs micro) → 0-30 points
  if (comp.formeJuridique) {
    if (/SARL|SAS|SA\b/i.test(comp.formeJuridique)) score += 20
    else if (/EURL|SASU/i.test(comp.formeJuridique)) score += 15
    else score += 5 // Micro/auto
  } else {
    score += 10
  }

  return Math.min(100, Math.round(score))
}

/** Score Quartier (0-100) */
export function scoreNeighborhood(data?: NeighborhoodData): number {
  if (!data) return 50

  let score = 0

  // Métros proches → 0-20 points
  score += Math.min(20, data.metros * 7)

  // Restaurants/cafés → 0-20 points (indicateur d'activité)
  score += Math.min(20, (data.restaurants + data.cafes) * 1)

  // Supermarchés → 0-10 points
  score += Math.min(10, data.supermarkets * 3)

  // Pharmacies → 0-10 points (indicateur santé/beauté)
  score += Math.min(10, data.pharmacies * 3)

  // Parkings → 0-10 points (accessibilité)
  score += Math.min(10, data.parkings * 2)

  // Score trafic piéton → 0-30 points
  score += Math.round(data.footTrafficScore * 0.30)

  return Math.min(100, Math.round(score))
}

/** Calcul du score global pondéré */
export function computeMultiScore(params: {
  competitor: Partial<AnalyzedCompetitor>
  social?: Partial<SocialMetrics>
  neighborhood?: NeighborhoodData
}): CompetitorScores {
  const reputation = scoreReputation(params.competitor)
  const presence = scorePresence(params.competitor, params.social)
  const activity = scoreActivity(params.social)
  const financial = scoreFinancial(params.competitor)
  const neighborhood = scoreNeighborhood(params.neighborhood)

  const global = Math.round(
    reputation * WEIGHTS.reputation +
    presence * WEIGHTS.presence +
    activity * WEIGHTS.activity +
    financial * WEIGHTS.financial +
    neighborhood * WEIGHTS.neighborhood
  )

  return { reputation, presence, activity, financial, neighborhood, global }
}
