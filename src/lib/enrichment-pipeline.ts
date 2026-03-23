// ============================================================
// CRM DERMOTEC — Pipeline d'enrichissement intelligent
// Arbre de décision : chaque étape déclenche la suivante
// selon la pertinence et l'intérêt économique du prospect
// ============================================================

import { verifySIRET, verifySIREN, getOPCOFromNAF, type EntrepriseSirene } from './sirene-api'
import { fetchGoogleReviews, fetchAllReviewsOutscraper, analyzeReviews, type GoogleReview, type ReviewAnalysis, type OutscraperPlaceData } from './reviews-analyzer'
import { verifyEmail, type EmailVerificationResult } from './email-verify'

// ── Types ──────────────────────────────────────────────────

export type EnrichmentDecision = 'CONTINUE' | 'STOP' | 'SKIP'

export interface StepResult {
  step: string
  status: 'success' | 'skipped' | 'failed'
  decision: EnrichmentDecision
  data: Record<string, any>
  scoreImpact: number // points ajoutés/retirés au score de chaleur
  durationMs: number
  reason?: string
}

export interface EnrichmentResult {
  leadId: string
  steps: StepResult[]
  totalScore: number
  classification: 'CHAUD' | 'TIEDE' | 'FROID'
  aggregatedData: AggregatedProspectData
  completedAt: string
  totalDurationMs: number
}

export interface AggregatedProspectData {
  // Étape 0 : Vérification email
  emailVerification?: EmailVerificationResult

  // Étape 1 : SIRET/Sirene
  sirene?: EntrepriseSirene
  opco?: string | null

  // Étape 2 : Pappers (données légales)
  pappers?: {
    chiffreAffaires?: number
    resultatNet?: number
    effectif?: number
    capitalSocial?: number
    dateCreation?: string
    formeJuridique?: string
    dirigeants?: { nom: string; fonction: string }[]
    activite?: string
  }

  // Étape 3 : Google Places (réputation)
  google?: {
    rating?: number
    reviewsCount?: number
    placeId?: string
    photos?: number
    types?: string[]
    horaires?: string[]
    telephone?: string
    website?: string
  }

  // Étape 3bis : Avis Google détaillés + données place Outscraper
  reviews?: {
    rawReviews: GoogleReview[]
    analysis: ReviewAnalysis
    placeData?: OutscraperPlaceData
  }

  // Étape 4 : Réseaux sociaux
  social?: {
    instagram?: { username: string; followers?: number; posts?: number }
    facebook?: { url?: string; followers?: number }
    linkedin?: { url?: string }
    website?: string
  }

  // Étape 5 : Quartier
  quartier?: {
    metros: number
    restaurants: number
    concurrentsBeaute: number
    pharmacies: number
    footTrafficScore: number
  }
}

export interface PipelineConfig {
  leadId: string
  siret?: string
  nom?: string
  prenom?: string
  entreprise?: string
  ville?: string
  email?: string
  telephone?: string
  codePostal?: string
}

// ── Fonctions utilitaires ──────────────────────────────────

function classify(score: number): 'CHAUD' | 'TIEDE' | 'FROID' {
  if (score >= 60) return 'CHAUD'
  if (score >= 30) return 'TIEDE'
  return 'FROID'
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = Date.now()
  const result = await fn()
  return { result, durationMs: Date.now() - start }
}

// ── ÉTAPE 1 : SIRET / Sirene (gratuit) ────────────────────

async function step1_sirene(config: PipelineConfig): Promise<StepResult> {
  if (!config.siret && !config.entreprise) {
    return {
      step: 'sirene',
      status: 'skipped',
      decision: 'CONTINUE', // On continue quand même avec Google
      data: {},
      scoreImpact: 0,
      durationMs: 0,
      reason: 'Ni SIRET ni nom d\'entreprise fourni',
    }
  }

  const { result, durationMs } = await timed(async () => {
    if (config.siret) {
      const siretClean = config.siret.replace(/\s/g, '')
      if (siretClean.length === 14) return verifySIRET(siretClean)
      if (siretClean.length === 9) return verifySIREN(siretClean)
    }
    return { valid: false, error: 'SIRET invalide' }
  })

  if (!result.valid || !result.entreprise) {
    return {
      step: 'sirene',
      status: 'failed',
      decision: 'CONTINUE', // On tente quand même Google Places
      data: { error: result.error },
      scoreImpact: -5,
      durationMs,
      reason: result.error,
    }
  }

  const entreprise = result.entreprise

  // Entreprise fermée = STOP
  if (!entreprise.is_active) {
    return {
      step: 'sirene',
      status: 'success',
      decision: 'STOP',
      data: { entreprise },
      scoreImpact: -50,
      durationMs,
      reason: 'Établissement fermé/radié — prospect mort',
    }
  }

  const opco = getOPCOFromNAF(entreprise.code_naf)

  return {
    step: 'sirene',
    status: 'success',
    decision: 'CONTINUE',
    data: { entreprise, opco },
    scoreImpact: 15,
    durationMs,
  }
}

// ── ÉTAPE 2 : Pappers (données légales) ────────────────────

async function step2_pappers(
  config: PipelineConfig,
  sireneData: EntrepriseSirene | undefined,
  currentScore: number
): Promise<StepResult> {
  const pappersKey = process.env.PAPPERS_API_KEY
  if (!pappersKey) {
    return {
      step: 'pappers',
      status: 'skipped',
      decision: 'CONTINUE',
      data: {},
      scoreImpact: 0,
      durationMs: 0,
      reason: 'PAPPERS_API_KEY non configurée',
    }
  }

  const siren = sireneData?.siren
  if (!siren) {
    return {
      step: 'pappers',
      status: 'skipped',
      decision: 'CONTINUE',
      data: {},
      scoreImpact: 0,
      durationMs: 0,
      reason: 'Pas de SIREN disponible',
    }
  }

  const { result: pappers, durationMs } = await timed(async () => {
    try {
      const res = await fetch(
        `https://api.pappers.fr/v2/entreprise?siren=${siren}&api_token=${pappersKey}`,
        { signal: AbortSignal.timeout(15000) }
      )
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  })

  if (!pappers) {
    return {
      step: 'pappers',
      status: 'failed',
      decision: 'CONTINUE',
      data: {},
      scoreImpact: 0,
      durationMs,
      reason: 'API Pappers indisponible',
    }
  }

  const ca = pappers.finances?.chiffre_affaires || pappers.chiffre_affaires
  const resultatNet = pappers.finances?.resultat || pappers.resultat
  const effectif = pappers.effectifs_salaries || pappers.effectif
  const dirigeants = (pappers.dirigeants || []).slice(0, 3).map((d: any) => ({
    nom: `${d.prenom || ''} ${d.nom || ''}`.trim(),
    fonction: d.qualite || d.fonction || '',
  }))

  let scoreImpact = 5
  // CA > 100K = prospect intéressant
  if (ca && ca > 100000) scoreImpact += 15
  else if (ca && ca > 50000) scoreImpact += 10
  // Effectif > 2 = a les moyens d'investir en formation
  if (effectif && effectif > 2) scoreImpact += 10
  // Entreprise jeune (< 2 ans) = potentiel
  if (pappers.date_creation) {
    const age = (Date.now() - new Date(pappers.date_creation).getTime()) / (365.25 * 24 * 3600 * 1000)
    if (age < 2) scoreImpact += 5
  }

  return {
    step: 'pappers',
    status: 'success',
    decision: 'CONTINUE',
    data: {
      chiffreAffaires: ca,
      resultatNet,
      effectif,
      capitalSocial: pappers.capital,
      dateCreation: pappers.date_creation,
      formeJuridique: pappers.forme_juridique,
      dirigeants,
      activite: pappers.objet_social || pappers.libelle_code_naf,
    },
    scoreImpact,
    durationMs,
  }
}

// ── ÉTAPE 3 : Google Places (réputation) ──────────────────

async function step3_google(
  config: PipelineConfig,
  sireneData: EntrepriseSirene | undefined,
  currentScore: number
): Promise<StepResult> {
  const googleKey = process.env.GOOGLE_PLACES_API_KEY
  if (!googleKey) {
    return {
      step: 'google',
      status: 'skipped',
      decision: 'CONTINUE',
      data: {},
      scoreImpact: 0,
      durationMs: 0,
      reason: 'GOOGLE_PLACES_API_KEY non configurée',
    }
  }

  const searchQuery = config.entreprise || sireneData?.nom || config.nom || ''
  const ville = config.ville || sireneData?.ville || 'Paris'

  if (!searchQuery) {
    return {
      step: 'google',
      status: 'skipped',
      decision: 'CONTINUE',
      data: {},
      scoreImpact: 0,
      durationMs: 0,
      reason: 'Pas de nom pour rechercher sur Google Places',
    }
  }

  const { result: google, durationMs } = await timed(async () => {
    try {
      const query = encodeURIComponent(`${searchQuery} ${ville}`)
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total,formatted_phone_number,website,types,photos,opening_hours&key=${googleKey}`,
        { signal: AbortSignal.timeout(10000) }
      )
      if (!res.ok) return null
      const data = await res.json()
      return data.candidates?.[0] || null
    } catch {
      return null
    }
  })

  if (!google) {
    return {
      step: 'google',
      status: 'failed',
      decision: 'CONTINUE',
      data: {},
      scoreImpact: 0,
      durationMs,
      reason: 'Pas trouvé sur Google Places',
    }
  }

  let scoreImpact = 5
  if (google.rating && google.rating >= 4.0) scoreImpact += 15
  else if (google.rating && google.rating >= 3.5) scoreImpact += 10
  else if (google.rating && google.rating < 3.0) scoreImpact -= 5

  if (google.user_ratings_total && google.user_ratings_total > 50) scoreImpact += 10
  else if (google.user_ratings_total && google.user_ratings_total > 10) scoreImpact += 5

  return {
    step: 'google',
    status: 'success',
    decision: 'CONTINUE',
    data: {
      rating: google.rating,
      reviewsCount: google.user_ratings_total,
      placeId: google.place_id,
      photos: google.photos?.length || 0,
      types: google.types,
      telephone: google.formatted_phone_number,
      website: google.website,
    },
    scoreImpact,
    durationMs,
  }
}

// ── ÉTAPE 4 : Réseaux sociaux (présence digitale) ─────────

async function step4_social(
  config: PipelineConfig,
  googleData: Record<string, any>,
  currentScore: number
): Promise<StepResult> {
  // Si score trop bas, pas la peine de dépenser des crédits scraping
  if (currentScore < 15) {
    return {
      step: 'social',
      status: 'skipped',
      decision: 'CONTINUE',
      data: {},
      scoreImpact: 0,
      durationMs: 0,
      reason: `Score trop bas (${currentScore}) — skip scraping social`,
    }
  }

  const website = googleData?.website || ''
  const searchName = config.entreprise || config.nom || ''

  const { result: social, durationMs } = await timed(async () => {
    const data: Record<string, any> = {}

    // Tenter de trouver Instagram via le site web
    if (website) {
      try {
        const res = await fetch(website, {
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SatoreaCRM/1.0)' },
        })
        if (res.ok) {
          const html = await res.text()
          data.website = website

          // Extraire liens sociaux
          const igMatch = html.match(/instagram\.com\/([a-zA-Z0-9_.]+)/)
          if (igMatch) data.instagram = { username: igMatch[1] }

          const fbMatch = html.match(/facebook\.com\/([a-zA-Z0-9_.]+)/)
          if (fbMatch) data.facebook = { url: `https://facebook.com/${fbMatch[1]}` }

          const liMatch = html.match(/linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/)
          if (liMatch) data.linkedin = { url: `https://linkedin.com/company/${liMatch[1]}` }
        }
      } catch {
        // Site inaccessible — pas grave
      }
    }

    return data
  })

  let scoreImpact = 0
  if (social.website) scoreImpact += 10
  if (social.instagram) scoreImpact += 10
  if (social.facebook) scoreImpact += 5
  if (social.linkedin) scoreImpact += 5

  return {
    step: 'social',
    status: Object.keys(social).length > 0 ? 'success' : 'skipped',
    decision: 'CONTINUE',
    data: social,
    scoreImpact,
    durationMs,
    reason: Object.keys(social).length === 0 ? 'Aucune présence sociale trouvée' : undefined,
  }
}

// ── ÉTAPE 5 : Données quartier (optionnel, si score > 30) ─

async function step5_quartier(
  config: PipelineConfig,
  googleData: Record<string, any>,
  currentScore: number
): Promise<StepResult> {
  const googleKey = process.env.GOOGLE_PLACES_API_KEY
  if (!googleKey || currentScore < 30) {
    return {
      step: 'quartier',
      status: 'skipped',
      decision: 'CONTINUE',
      data: {},
      scoreImpact: 0,
      durationMs: 0,
      reason: currentScore < 30
        ? `Score insuffisant (${currentScore}) pour analyse quartier`
        : 'GOOGLE_PLACES_API_KEY non configurée',
    }
  }

  // On utilise le placeId de l'étape Google si disponible
  if (!googleData?.placeId) {
    return {
      step: 'quartier',
      status: 'skipped',
      decision: 'CONTINUE',
      data: {},
      scoreImpact: 0,
      durationMs: 0,
      reason: 'Pas de placeId Google pour analyser le quartier',
    }
  }

  const { result: quartier, durationMs } = await timed(async () => {
    try {
      // Récupérer les coordonnées du lieu
      const detailRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googleData.placeId}&fields=geometry&key=${googleKey}`,
        { signal: AbortSignal.timeout(8000) }
      )
      if (!detailRes.ok) return null
      const detail = await detailRes.json()
      const loc = detail.result?.geometry?.location
      if (!loc) return null

      // Quartier : données récupérées par OSM Overpass (enrichment-osm.ts) — gratuit
      // Les appels Google Nearby ($32/1K) sont supprimés pour optimiser les coûts

      return {
        metros: 0, // Données disponibles via OSM
        restaurants: 0, // Données disponibles via OSM
        concurrentsBeaute: 0, // Données disponibles via OSM
        pharmacies: 0, // Données disponibles via OSM
        footTrafficScore: 0, // Score calculé depuis les données OSM
      }
    } catch {
      return null
    }
  })

  if (!quartier) {
    return {
      step: 'quartier',
      status: 'failed',
      decision: 'CONTINUE',
      data: {},
      scoreImpact: 0,
      durationMs,
    }
  }

  const scoreImpact = quartier.footTrafficScore >= 60 ? 10 : quartier.footTrafficScore >= 30 ? 5 : 0

  return {
    step: 'quartier',
    status: 'success',
    decision: 'CONTINUE',
    data: quartier,
    scoreImpact,
    durationMs,
  }
}

// ── ORCHESTRATEUR : Pipeline principal ─────────────────────

export async function runEnrichmentPipeline(config: PipelineConfig): Promise<EnrichmentResult> {
  const startTime = Date.now()
  const steps: StepResult[] = []
  let totalScore = 10 // Score de base pour tout lead
  const aggregatedData: AggregatedProspectData = {}

  // ── ÉTAPE 0 : VÉRIFICATION EMAIL (gratuit, open source, 0 API) ──
  if (config.email) {
    const { result: emailResult, durationMs: emailDuration } = await timed(async () => {
      return verifyEmail(config.email!)
    })

    aggregatedData.emailVerification = emailResult
    let emailScoreImpact = 0
    if (emailResult.valid) emailScoreImpact = 5
    else if (!emailResult.checks.disposable) emailScoreImpact = -20 // Email jetable = prospect bidon
    else if (!emailResult.checks.mx) emailScoreImpact = -15 // Domaine inexistant
    else if (emailResult.checks.smtp === false) emailScoreImpact = -10 // Boîte inexistante

    steps.push({
      step: 'email_verification',
      status: emailResult.valid ? 'success' : 'failed',
      decision: !emailResult.checks.disposable ? 'CONTINUE' : 'CONTINUE', // On continue même si email invalide
      data: { ...emailResult },
      scoreImpact: emailScoreImpact,
      durationMs: emailDuration,
      reason: emailResult.reason,
    })
    totalScore += emailScoreImpact
  }

  // ── ÉTAPE 1 : SIRET ──
  const step1 = await step1_sirene(config)
  steps.push(step1)
  totalScore += step1.scoreImpact
  if (step1.data.entreprise) aggregatedData.sirene = step1.data.entreprise
  if (step1.data.opco !== undefined) aggregatedData.opco = step1.data.opco

  if (step1.decision === 'STOP') {
    return {
      leadId: config.leadId,
      steps,
      totalScore: Math.max(0, totalScore),
      classification: classify(totalScore),
      aggregatedData,
      completedAt: new Date().toISOString(),
      totalDurationMs: Date.now() - startTime,
    }
  }

  // ── ÉTAPE 2 : Pappers ──
  const step2 = await step2_pappers(config, aggregatedData.sirene, totalScore)
  steps.push(step2)
  totalScore += step2.scoreImpact
  if (step2.status === 'success') aggregatedData.pappers = step2.data

  // ── ÉTAPE 3 : Google Places ──
  const step3 = await step3_google(config, aggregatedData.sirene, totalScore)
  steps.push(step3)
  totalScore += step3.scoreImpact
  if (step3.status === 'success') aggregatedData.google = step3.data

  // ── ÉTAPE 3bis : Avis détaillés (Outscraper ALL → Google Places fallback) ──
  if (step3.status === 'success' && step3.data.placeId) {
    const { result: outscraper, durationMs: reviewsDuration } = await timed(async () => {
      // Outscraper d'abord — retourne TOUS les avis + données place enrichies
      const osResult = await fetchAllReviewsOutscraper(step3.data.placeId)
      if (osResult.reviews.length > 0) return osResult

      // Fallback Google Places (5 avis max)
      const gpReviews = await fetchGoogleReviews(step3.data.placeId)
      return { reviews: gpReviews, placeData: null, reviewsPerScore: null }
    })

    if (outscraper.reviews.length > 0) {
      const analysis = analyzeReviews(
        outscraper.reviews,
        outscraper.reviewsPerScore,
        step3.data.reviewsCount,
        outscraper.placeData,
      )
      aggregatedData.reviews = {
        rawReviews: outscraper.reviews,
        analysis,
        placeData: outscraper.placeData || undefined,
      }

      // Enrichir les données Google avec Outscraper (plus complet)
      if (outscraper.placeData) {
        aggregatedData.google = {
          ...aggregatedData.google,
          rating: outscraper.placeData.rating || aggregatedData.google?.rating,
          reviewsCount: outscraper.placeData.reviews || aggregatedData.google?.reviewsCount,
          telephone: outscraper.placeData.phone || aggregatedData.google?.telephone,
          website: outscraper.placeData.website || aggregatedData.google?.website,
          photos: outscraper.placeData.photos_count || aggregatedData.google?.photos,
        }
      }

      steps.push({
        step: 'reviews',
        status: 'success',
        decision: 'CONTINUE',
        data: {
          count: outscraper.reviews.length,
          totalKnown: step3.data.reviewsCount,
          hasOutscraper: !!outscraper.placeData,
          distribution: analysis.distribution,
        },
        scoreImpact: 0,
        durationMs: reviewsDuration,
      })
    } else {
      steps.push({
        step: 'reviews',
        status: 'skipped',
        decision: 'CONTINUE',
        data: {},
        scoreImpact: 0,
        durationMs: reviewsDuration,
        reason: 'Aucun avis récupéré',
      })
    }
  }

  // ── ÉTAPE 4 : Réseaux sociaux (conditionnel) ──
  const step4 = await step4_social(config, step3.data, totalScore)
  steps.push(step4)
  totalScore += step4.scoreImpact
  if (step4.status === 'success') aggregatedData.social = step4.data

  // ── ÉTAPE 5 : Quartier (conditionnel, score > 30) ──
  const step5 = await step5_quartier(config, step3.data, totalScore)
  steps.push(step5)
  totalScore += step5.scoreImpact
  if (step5.status === 'success' && step5.data.metros !== undefined) {
    aggregatedData.quartier = step5.data as AggregatedProspectData['quartier']
  }

  totalScore = Math.max(0, Math.min(100, totalScore))

  return {
    leadId: config.leadId,
    steps,
    totalScore,
    classification: classify(totalScore),
    aggregatedData,
    completedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
  }
}
