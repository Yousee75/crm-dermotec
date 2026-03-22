import 'server-only'
// ============================================================
// CRM DERMOTEC — Analyse concurrentielle
// Fusion multi-sources + score réputation + ranking
// ============================================================

import type { DiscoveredCompetitor } from './competitor-discovery'

export interface AnalyzedCompetitor extends DiscoveredCompetitor {
  // Pappers
  chiffreAffaires?: number
  resultatNet?: number
  formeJuridique?: string
  dirigeants?: Array<{ prenom: string; nom: string; titre: string }>
  anneeFiscale?: number

  // PagesJaunes
  pjRating?: number
  pjReviewsCount?: number

  // Planity / Treatwell
  planityFound?: boolean
  treatwellFound?: boolean
  planityRating?: number
  treatwellRating?: number

  // Score composite
  reputationScore: number
  sources: string[]

  // Ranking
  rank?: number
}

export interface CompetitorAnalysis {
  prospect: {
    siret: string
    nom: string
    lat: number
    lng: number
  }
  competitors: AnalyzedCompetitor[]
  kpis: {
    totalCompetitors: number
    avgGoogleRating: number
    avgReviewsCount: number
    avgCA: number
    prospectRank: number
    avgReputationScore: number
  }
}

// Score de réputation composite (0-100)
export function computeReputationScore(comp: Partial<AnalyzedCompetitor>): number {
  let score = 0

  // Rating Google /5 → 0-40 points
  if (comp.googleRating) {
    score += (comp.googleRating / 5) * 40
  }

  // Nb avis (log scale, cap 200) → 0-30 points
  if (comp.googleReviewsCount && comp.googleReviewsCount > 0) {
    const logScore = Math.min(1, Math.log10(comp.googleReviewsCount + 1) / Math.log10(201))
    score += logScore * 30
  }

  // Taux réponse → 0-20 points (estimation basée sur présence)
  if (comp.googleReviewsCount && comp.googleReviewsCount > 5) {
    score += 10 // Présence active
  }
  if (comp.website) {
    score += 5 // A un site web
  }

  // Bonus plateformes
  if (comp.planityFound) score += 5
  if (comp.treatwellFound) score += 5
  if (comp.pjRating && comp.pjRating > 0) score += 5

  return Math.min(100, Math.round(score))
}

// Similarité entre deux noms (Dice coefficient)
export function nameSimilarity(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()

  const na = normalize(a)
  const nb = normalize(b)

  if (na === nb) return 1
  if (na.length < 2 || nb.length < 2) return 0

  const bigrams = (s: string): Set<string> => {
    const bg = new Set<string>()
    for (let i = 0; i < s.length - 1; i++) bg.add(s.slice(i, i + 2))
    return bg
  }

  const bgA = bigrams(na)
  const bgB = bigrams(nb)
  if (bgA.size + bgB.size === 0) return 0

  let intersection = 0
  for (const bg of bgA) if (bgB.has(bg)) intersection++

  return (2 * intersection) / (bgA.size + bgB.size)
}

// Enrichir avec Pappers (CA, dirigeants)
async function enrichWithPappers(siren: string): Promise<Partial<AnalyzedCompetitor>> {
  const apiKey = process.env.PAPPERS_API_KEY
  if (!apiKey || !siren) return {}

  try {
    const res = await fetch(
      `https://api.pappers.fr/v2/entreprise?siren=${siren}&api_token=${apiKey}&champs_optionnels=finances,dirigeants`
    )
    if (!res.ok) return {}

    const data = await res.json()
    const finances = data.finances?.[0]

    return {
      chiffreAffaires: finances?.chiffre_affaires ? finances.chiffre_affaires * 1000 : undefined,
      resultatNet: finances?.resultat ? finances.resultat * 1000 : undefined,
      anneeFiscale: finances?.annee,
      formeJuridique: data.forme_juridique,
      dirigeants: data.dirigeants?.slice(0, 3).map((d: { prenom: string; nom: string; qualite: string }) => ({
        prenom: d.prenom || '',
        nom: d.nom || '',
        titre: d.qualite || '',
      })),
    }
  } catch {
    return {}
  }
}

// Analyser les concurrents avec enrichissement
export async function analyzeCompetitors(
  prospect: { siret: string; nom: string; lat: number; lng: number },
  competitors: DiscoveredCompetitor[]
): Promise<CompetitorAnalysis> {
  // Enrichir top 10 avec Pappers
  const enriched: AnalyzedCompetitor[] = await Promise.all(
    competitors.slice(0, 15).map(async (comp) => {
      const siren = comp.siren || comp.siret?.slice(0, 9)
      const pappersData = siren ? await enrichWithPappers(siren) : {}

      const sources: string[] = ['sirene']
      if (comp.googlePlaceId) sources.push('google')
      if (pappersData.chiffreAffaires) sources.push('pappers')

      const analyzed: AnalyzedCompetitor = {
        ...comp,
        ...pappersData,
        sources,
        reputationScore: 0,
      }

      analyzed.reputationScore = computeReputationScore(analyzed)

      return analyzed
    })
  )

  // Ranking par score
  enriched.sort((a, b) => b.reputationScore - a.reputationScore)
  enriched.forEach((c, i) => { c.rank = i + 1 })

  // KPIs
  const withRating = enriched.filter(c => c.googleRating)
  const withCA = enriched.filter(c => c.chiffreAffaires)

  const kpis = {
    totalCompetitors: enriched.length,
    avgGoogleRating: withRating.length > 0
      ? Math.round((withRating.reduce((s, c) => s + (c.googleRating || 0), 0) / withRating.length) * 10) / 10
      : 0,
    avgReviewsCount: withRating.length > 0
      ? Math.round(withRating.reduce((s, c) => s + (c.googleReviewsCount || 0), 0) / withRating.length)
      : 0,
    avgCA: withCA.length > 0
      ? Math.round(withCA.reduce((s, c) => s + (c.chiffreAffaires || 0), 0) / withCA.length)
      : 0,
    prospectRank: 0,
    avgReputationScore: enriched.length > 0
      ? Math.round(enriched.reduce((s, c) => s + c.reputationScore, 0) / enriched.length)
      : 0,
  }

  return { prospect, competitors: enriched, kpis }
}
