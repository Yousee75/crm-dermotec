import 'server-only'
// ============================================================
// CRM SATOREA — Enrichment Orchestrator v2
// Orchestre les 25 sources de données en parallèle.
// Retourne un objet IntelligenceComplete OPAQUE (aucun provider visible).
//
// SÉCURITÉ : Ce fichier ne doit JAMAIS être importé côté client.
// Seules les API routes l'utilisent.
// ============================================================

import { assembleIntelligence, type IntelligenceComplete } from './enrichment-proxy'

// ============================================================
// Types internes (JAMAIS exposés au frontend)
// ============================================================

interface EnrichmentParams {
  siret?: string
  siren?: string
  nom?: string
  ville?: string
  departement?: string
  code_postal?: string
  lat?: number
  lng?: number
  website?: string
  lead_id?: string
  user_id?: string
  // Options
  skip_scraping?: boolean // skip les sources lentes (Bright Data)
  skip_formation?: boolean // skip EDOF/DGEFP/RNCP
  skip_geo?: boolean // skip IRIS/DVF/Neighborhood
  max_timeout_ms?: number // timeout global (défaut 30s)
}

interface InternalData {
  sirene?: any
  pappers?: any
  google?: any
  pj?: any
  planity?: any
  treatwell?: any
  tripadvisor?: any
  fresha?: any
  booksy?: any
  groupon?: any
  wecasa?: any
  instagram?: any
  social?: any
  scraper?: any
  outscraper?: any
  outscraper_analysis?: any
  edof?: any
  dgefp?: any
  rncp?: any
  france_travail?: any
  bodacc?: any
  pagespeed?: any
  inpi?: any
  iris?: any
  dvf?: any
  neighborhood?: any
  osm?: any
  convention?: any
  aides?: any
  _signaux?: any
}

// ============================================================
// Helpers — Appel sécurisé avec timeout et fallback
// ============================================================

async function safeCall<T>(
  label: string,
  fn: () => Promise<T>,
  timeoutMs: number = 15000
): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const result = await Promise.race([
      fn(),
      new Promise<null>((_, reject) =>
        controller.signal.addEventListener('abort', () =>
          reject(new Error(`[Enrichment] ${label} timeout ${timeoutMs}ms`))
        )
      ),
    ])

    clearTimeout(timer)
    return result
  } catch (err) {
    // Log interne seulement — codes opaques en prod
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Enrichment] ${label} failed:`, err instanceof Error ? err.message : err)
    } else {
      console.warn(`[E] ${label.charAt(0)}${label.length} err`)
    }
    return null
  }
}

// ============================================================
// ORCHESTRATEUR PRINCIPAL
// ============================================================

/**
 * Enrichit un lead/prospect avec TOUTES les sources disponibles.
 * Retourne un objet IntelligenceComplete OPAQUE — aucun provider visible.
 *
 * Usage :
 * ```ts
 * const intel = await enrichComplet({ siret: '12345678900012', nom: 'Institut Sophie', ville: 'Lyon' })
 * // intel.score_global = 72
 * // intel.financier.chiffre_affaires = 85000
 * // intel.formation.concurrents_zone.nombre = 3
 * ```
 */
export async function enrichComplet(params: EnrichmentParams): Promise<IntelligenceComplete> {
  const siren = params.siren || params.siret?.slice(0, 9)
  const dept = params.departement || params.code_postal?.slice(0, 2)
  const data: InternalData = {}

  const timeout = params.max_timeout_ms || 30000
  const perCallTimeout = Math.min(15000, timeout / 2)

  // Initialiser les signaux d'alerte
  data._signaux = {
    est_organisme_concurrent: false,
    droits_formation_non_consommes: false,
    en_difficulte: false,
    avis_insuffisants: false,
    zone_saturee: false,
    est_sur_promo: false,
  }

  // ============================================================
  // BRANCHE 1 — Identité (si SIRET)
  // ============================================================

  if (params.siret) {
    const identityBranch: Promise<void | null>[] = []

    // Sirene + Convention + BODACC + DGEFP en parallèle
    identityBranch.push(
      safeCall('I1', async () => {
        const { verifySIRET } = await import('./sirene-api')
        const r = await verifySIRET(params.siret!)
        if (r.valid && r.entreprise) {
          data.sirene = r.entreprise
          // SI entreprise fermée → STOP early return
          if (data.sirene.is_active === false) {
            data._signaux.en_difficulte = true
            return // Early stop signal
          }
        }
      }, perCallTimeout)
    )

    identityBranch.push(
      safeCall('I2', async () => {
        const { getConventionCollective } = await import('./enrichment-conventions')
        data.convention = await getConventionCollective(params.siret!)
        // SI Convention IDCC 3032/3050 → droits formation non consommés
        if (data.convention?.idcc === '3032' || data.convention?.idcc === '3050') {
          data._signaux.droits_formation_non_consommes = true
        }
      }, perCallTimeout)
    )

    identityBranch.push(
      safeCall('I3', async () => {
        const { checkProcedureCollective } = await import('./enrichment-bodacc')
        data.bodacc = await checkProcedureCollective(siren!)
        // SI BODACC procédure → en difficulté
        if (data.bodacc?.procedure_collective) {
          data._signaux.en_difficulte = true
        }
      }, perCallTimeout)
    )

    if (!params.skip_formation) {
      identityBranch.push(
        safeCall('I4', async () => {
          const { getOrganismeBySiren } = await import('./enrichment-dgefp')
          data.dgefp = await getOrganismeBySiren(siren!)
          // SI DGEFP retourne NDA → organisme concurrent
          if (data.dgefp?.nda) {
            data._signaux.est_organisme_concurrent = true
          }
        }, perCallTimeout)
      )
    }

    // SI Pappers API key → ajouter Pappers
    if (process.env.PAPPERS_API_KEY) {
      identityBranch.push(
        safeCall('I5', async () => {
          const { enrichWithPappers } = await import('./enrichment')
          const r = await enrichWithPappers(params.siret!, { lead_id: params.lead_id })
          if (r.success && r.data) data.pappers = r.data
        }, perCallTimeout)
      )
    }

    // INPI — fallback si Pappers échoue (données publiques gratuites)
    identityBranch.push(
      safeCall('I6', async () => {
        const { getDerniersChiffres } = await import('./enrichment-inpi')
        data.inpi = await getDerniersChiffres(siren!)
      }, perCallTimeout)
    )

    // RNCP — certifications professionnelles (si secteur formation)
    if (!params.skip_formation) {
      identityBranch.push(
        safeCall('I7', async () => {
          const { getRNCPData } = await import('./enrichment-rncp')
          const rncp = await getRNCPData({ siret: params.siret!, keyword: 'esthetique' })
          if (rncp) data._signaux.est_organisme_concurrent = true
        }, perCallTimeout)
      )
    }

    await Promise.allSettled(identityBranch)

    // SI entreprise fermée → early return
    if (data.sirene?.is_active === false) {
      return assembleIntelligence(data)
    }
  }

  // ============================================================
  // BRANCHE 2 — Réputation (si nom)
  // ============================================================

  if (params.nom && process.env.GOOGLE_PLACES_API_KEY) {
    // Google Places d'abord (pour récupérer website et GPS)
    await safeCall('R1', async () => {
      const { enrichWithGooglePlaces } = await import('./enrichment')
      const r = await enrichWithGooglePlaces(params.nom!, params.ville, { lead_id: params.lead_id })
      if (r.success && r.data) {
        data.google = r.data
        // SI < 10 avis Google → force_scraping = true
        if (data.google.rating_count && data.google.rating_count < 10) {
          data._signaux.avis_insuffisants = true
        }
      }
    }, perCallTimeout)

    // Extraire website et GPS de Google si pas fournis en params
    const website = params.website || data.google?.website
    const lat = params.lat || data.google?.geometry?.location?.lat || data.google?.lat
    const lng = params.lng || data.google?.geometry?.location?.lng || data.google?.lng

    // SI Google retourne website → lancer Social Discovery + PageSpeed en parallèle
    if (website) {
      const reputationBranch: Promise<void | null>[] = []

      reputationBranch.push(
        safeCall('R2', async () => {
          const { discoverSocialProfiles } = await import('./social-discovery')
          data.social = await discoverSocialProfiles(website, params.nom)
        }, perCallTimeout)
      )

      reputationBranch.push(
        safeCall('R3', async () => {
          const { analyzePageSpeed } = await import('./enrichment-pagespeed')
          const [mobile, desktop] = await Promise.all([
            analyzePageSpeed(website, 'mobile').catch(() => null),
            analyzePageSpeed(website, 'desktop').catch(() => null),
          ])
          data.pagespeed = {
            score_mobile: mobile?.score,
            score_desktop: desktop?.score,
            lcp_ms: mobile?.lcp_ms,
            maturite: Math.round(((mobile?.score || 0) * 0.6 + (desktop?.score || 0) * 0.4)),
          }
        }, perCallTimeout)
      )

      await Promise.allSettled(reputationBranch)

      // SI Instagram trouvé → scrapeInstagram
      if (data.social?.instagram) {
        await safeCall('R4', async () => {
          const { scrapeInstagram } = await import('./social-discovery')
          data.instagram = await scrapeInstagram(data.social.instagram)
        }, perCallTimeout)
      }
    }

    // Outscraper — 200 avis Google si > 10 avis et API key dispo
    if (data.google?.total_reviews > 10 && process.env.OUTSCRAPER_API_KEY) {
      await safeCall('R-OUT', async () => {
        const { fetchAllReviewsOutscraper, analyzeReviews } = await import('./reviews-analyzer')
        const query = `${params.nom} ${params.ville}`
        const outscraper = await fetchAllReviewsOutscraper(query)
        if (outscraper) {
          data.outscraper = outscraper
          // Si outscraper a des reviews_per_score, analyser
          if (outscraper.reviewsPerScore) {
            const analysis = analyzeReviews(
              outscraper.reviews || [],
              outscraper.reviewsPerScore,
              data.google.total_reviews,
              outscraper.placeData
            )
            data.outscraper_analysis = analysis
          }
        }
      }, 60000) // Outscraper peut être lent
    }

    // Mettre à jour les coordonnées pour les branches suivantes
    params.lat = lat
    params.lng = lng
  }

  // ============================================================
  // BRANCHE 3 — Géo (si GPS fourni ou déduit de Google)
  // ============================================================

  if ((params.lat && params.lng) && !params.skip_geo) {
    const geoBranch: Promise<void | null>[] = []

    geoBranch.push(
      safeCall('G1', async () => {
        const { getRevenusQuartier } = await import('./enrichment-iris')
        data.iris = await getRevenusQuartier({ lat: params.lat!, lng: params.lng! })
      }, perCallTimeout)
    )

    geoBranch.push(
      safeCall('G2', async () => {
        const { fetchNeighborhoodData } = await import('./neighborhood-data')
        data.neighborhood = await fetchNeighborhoodData(params.lat!, params.lng!, 500)
      }, perCallTimeout)
    )

    geoBranch.push(
      safeCall('G3', async () => {
        const { findBeautyShopsInArea } = await import('./enrichment-osm')
        data.osm = await findBeautyShopsInArea({ lat: params.lat!, lng: params.lng!, radiusMeters: 2000 })
        // SI OSM retourne > 10 beauty shops → zone saturée
        if (data.osm?.shops && data.osm.shops.length > 10) {
          data._signaux.zone_saturee = true
        }
      }, perCallTimeout)
    )

    geoBranch.push(
      safeCall('G4', async () => {
        const { getPrixM2ParAdresse } = await import('./enrichment-dvf')
        data.dvf = await getPrixM2ParAdresse(params.lat!, params.lng!)
      }, perCallTimeout)
    )

    await Promise.allSettled(geoBranch)
  }

  // ============================================================
  // BRANCHE 4 — Formation & Marché (si département)
  // ============================================================

  if (dept) {
    const formationBranch: Promise<void | null>[] = []

    formationBranch.push(
      safeCall('F1', async () => {
        const { getStatsEmploiZone } = await import('./enrichment-emploi')
        data.france_travail = await getStatsEmploiZone(dept)
      }, perCallTimeout)
    )

    formationBranch.push(
      safeCall('F2', async () => {
        const { getAidesFinancement } = await import('./enrichment-aides')
        data.aides = await getAidesFinancement(dept)
      }, perCallTimeout)
    )

    if (!params.skip_formation) {
      formationBranch.push(
        safeCall('F3', async () => {
          const { getFormationsCPFConcurrentes } = await import('./enrichment-cpf')
          const r = await getFormationsCPFConcurrentes({
            keyword: 'esthetique',
            departement: dept,
            excludeSiren: siren,
          })
          if (r.success && r.data) data.edof = r.data
        }, perCallTimeout)
      )

      formationBranch.push(
        safeCall('F4', async () => {
          const { getCreationsRadiationsZone } = await import('./enrichment-bodacc')
          const zoneData = await getCreationsRadiationsZone(dept, 6)
          if (data.bodacc) {
            data.bodacc = { ...data.bodacc, ...zoneData }
          } else {
            data.bodacc = zoneData
          }
        }, perCallTimeout)
      )
    }

    await Promise.allSettled(formationBranch)
  }

  // ============================================================
  // BRANCHE 5 — Scraping (si nom+ville ET pas skip OU force_scraping)
  // ============================================================

  const force_scraping = data._signaux.avis_insuffisants
  const should_scrape = params.nom && params.ville && (!params.skip_scraping || force_scraping)

  if (should_scrape) {
    await safeCall('S1', async () => {
      const { scrapeCompetitorFull } = await import('./competitor-scraper')
      const scraped = await scrapeCompetitorFull({
        nom: params.nom!,
        ville: params.ville!,
      })

      // Distribuer les résultats
      if (scraped.pagesJaunes) data.pj = scraped.pagesJaunes
      if (scraped.planity) data.planity = scraped.planity
      if (scraped.treatwell) data.treatwell = scraped.treatwell
      if (scraped.tripadvisor) data.tripadvisor = scraped.tripadvisor
      if (scraped.fresha) data.fresha = scraped.fresha
      if (scraped.booksy) data.booksy = scraped.booksy
      if (scraped.groupon) {
        data.groupon = scraped.groupon
        // SI Groupon found → est_sur_promo = true
        data._signaux.est_sur_promo = true
      }
      if (scraped.wecasa) data.wecasa = scraped.wecasa
      if (scraped.google) data.scraper = scraped.google
    }, 60000) // scraping = 60s max
  }

  // ============================================================
  // ASSEMBLAGE — Transformer en IntelligenceComplete opaque
  // ============================================================

  return assembleIntelligence(data)
}

/**
 * Enrichissement rapide (sans scraping ni formation).
 * Pour les aperçus dans les listes et les recherches.
 */
export async function enrichRapide(params: EnrichmentParams): Promise<IntelligenceComplete> {
  return enrichComplet({
    ...params,
    skip_scraping: true,
    skip_formation: true,
    skip_geo: true,
    max_timeout_ms: 10000,
  })
}

/**
 * Enrichissement formation uniquement.
 * Pour la page /concurrents et l'analyse concurrentielle.
 */
export async function enrichFormation(params: {
  departement: string
  keyword?: string
  excludeSiren?: string
}): Promise<{
  organismes: any[]
  formations_cpf: any[]
  stats_emploi: any
  stats_of: any
}> {
  const [organismes, formations, emploi, statsOf] = await Promise.allSettled([
    safeCall('EF1', async () => {
      const { getConcurrentsFormation } = await import('./enrichment-dgefp')
      return getConcurrentsFormation({
        departement: params.departement,
        specialite: params.keyword || 'esthetique',
        excludeSiren: params.excludeSiren,
      })
    }),
    safeCall('EF2', async () => {
      const { getFormationsCPFConcurrentes } = await import('./enrichment-cpf')
      return getFormationsCPFConcurrentes({
        keyword: params.keyword || 'esthetique',
        departement: params.departement,
        excludeSiren: params.excludeSiren,
      })
    }),
    safeCall('EF3', async () => {
      const { getStatsEmploiZone } = await import('./enrichment-emploi')
      return getStatsEmploiZone(params.departement)
    }),
    safeCall('EF4', async () => {
      const { getStatsOFByZone } = await import('./enrichment-dgefp')
      return getStatsOFByZone(params.departement)
    }),
  ])

  return {
    organismes: organismes.status === 'fulfilled' ? (organismes.value as any) || [] : [],
    formations_cpf: formations.status === 'fulfilled' ? (formations.value as any) || [] : [],
    stats_emploi: emploi.status === 'fulfilled' ? emploi.value : null,
    stats_of: statsOf.status === 'fulfilled' ? statsOf.value : null,
  }
}
