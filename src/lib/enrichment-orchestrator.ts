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
  instagram?: any
  social?: any
  scraper?: any
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

  // ============================================================
  // VAGUE 1 — Sources rapides en parallèle (APIs gratuites)
  // ============================================================

  const wave1: Promise<void | null>[] = []

  // Sirene (gratuit, rapide)
  if (params.siret) {
    wave1.push(
      safeCall('S1', async () => {
        const { verifySIRET } = await import('./sirene-api')
        const r = await verifySIRET(params.siret!)
        if (r.valid && r.entreprise) data.sirene = r.entreprise
      }, perCallTimeout)
    )
  }

  // DGEFP — est-ce un organisme de formation ?
  if (siren && !params.skip_formation) {
    wave1.push(
      safeCall('S2', async () => {
        const { getOrganismeBySiren } = await import('./enrichment-dgefp')
        data.dgefp = await getOrganismeBySiren(siren)
      }, perCallTimeout)
    )
  }

  // BODACC — procédures collectives
  if (siren) {
    wave1.push(
      safeCall('S3', async () => {
        const { checkProcedureCollective } = await import('./enrichment-bodacc')
        data.bodacc = await checkProcedureCollective(siren)
      }, perCallTimeout)
    )
  }

  // France Travail — offres emploi zone
  if (dept) {
    wave1.push(
      safeCall('S4', async () => {
        const { getStatsEmploiZone } = await import('./enrichment-emploi')
        data.france_travail = await getStatsEmploiZone(dept)
      }, perCallTimeout)
    )
  }

  // PageSpeed — maturité digitale
  if (params.website) {
    wave1.push(
      safeCall('S5', async () => {
        const { getDigitalMaturityScore, analyzePageSpeed } = await import('./enrichment-pagespeed')
        const mobile = await analyzePageSpeed(params.website!, 'mobile')
        const desktop = await analyzePageSpeed(params.website!, 'desktop')
        const maturite = await getDigitalMaturityScore(params.website!)
        data.pagespeed = {
          score_mobile: mobile?.score,
          score_desktop: desktop?.score,
          lcp_ms: mobile?.lcp_ms,
          maturite,
        }
      }, perCallTimeout)
    )
  }

  // Geo — code commune depuis GPS
  if (params.lat && params.lng && !params.skip_geo) {
    wave1.push(
      safeCall('S6', async () => {
        const { getRevenusQuartier } = await import('./enrichment-iris')
        data.iris = await getRevenusQuartier({ lat: params.lat, lng: params.lng })
      }, perCallTimeout)
    )

    wave1.push(
      safeCall('S7', async () => {
        const { fetchNeighborhoodData } = await import('./neighborhood-data')
        data.neighborhood = await fetchNeighborhoodData(params.lat!, params.lng!, 500)
      }, perCallTimeout)
    )
  }

  await Promise.allSettled(wave1)

  // ============================================================
  // VAGUE 2 — Sources payantes / lentes (en parallèle)
  // ============================================================

  const wave2: Promise<void | null>[] = []

  // Pappers (payant, protégé)
  if (params.siret && process.env.PAPPERS_API_KEY) {
    wave2.push(
      safeCall('P1', async () => {
        const { enrichWithPappers } = await import('./enrichment')
        const r = await enrichWithPappers(params.siret!, { lead_id: params.lead_id })
        if (r.success && r.data) data.pappers = r.data
      }, perCallTimeout)
    )
  }

  // INPI bilans (gratuit, fallback Pappers)
  if (siren && !data.pappers) {
    wave2.push(
      safeCall('P2', async () => {
        const { getDerniersChiffres } = await import('./enrichment-inpi')
        data.inpi = await getDerniersChiffres(siren)
      }, perCallTimeout)
    )
  }

  // Google Places
  if (params.nom && process.env.GOOGLE_PLACES_API_KEY) {
    wave2.push(
      safeCall('P3', async () => {
        const { enrichWithGooglePlaces } = await import('./enrichment')
        const r = await enrichWithGooglePlaces(params.nom!, params.ville, { lead_id: params.lead_id })
        if (r.success && r.data) data.google = r.data
      }, perCallTimeout)
    )
  }

  // DVF prix immobilier
  if (!params.skip_geo) {
    const codeCommune = (data.iris as any)?.code_commune
    if (codeCommune) {
      wave2.push(
        safeCall('P4', async () => {
          const { getPrixM2Commune } = await import('./enrichment-dvf')
          data.dvf = await getPrixM2Commune(codeCommune)
        }, perCallTimeout)
      )
    } else if (params.lat && params.lng) {
      wave2.push(
        safeCall('P4', async () => {
          const { getPrixM2ParAdresse } = await import('./enrichment-dvf')
          data.dvf = await getPrixM2ParAdresse(params.lat!, params.lng!)
        }, perCallTimeout)
      )
    }
  }

  await Promise.allSettled(wave2)

  // ============================================================
  // VAGUE 3 — Sources Formation (si pertinent)
  // ============================================================

  if (!params.skip_formation && dept) {
    const wave3: Promise<void | null>[] = []

    // EDOF — formations CPF concurrentes
    wave3.push(
      safeCall('F1', async () => {
        const { getFormationsCPFConcurrentes } = await import('./enrichment-cpf')
        const r = await getFormationsCPFConcurrentes({
          keyword: 'esthetique',
          departement: dept,
          excludeSiren: siren,
        })
        if (r.success && r.data) data.edof = r.data
      }, perCallTimeout)
    )

    // BODACC zone — créations/radiations
    wave3.push(
      safeCall('F2', async () => {
        const { getCreationsRadiationsZone } = await import('./enrichment-bodacc')
        const zoneData = await getCreationsRadiationsZone(dept, 6)
        if (data.bodacc) {
          data.bodacc = { ...data.bodacc, ...zoneData }
        } else {
          data.bodacc = zoneData
        }
      }, perCallTimeout)
    )

    await Promise.allSettled(wave3)
  }

  // ============================================================
  // VAGUE 4 — Scraping (optionnel, lent)
  // ============================================================

  if (!params.skip_scraping && params.nom && params.ville) {
    const wave4: Promise<void | null>[] = []

    // Scraping PagesJaunes + Planity + Treatwell
    wave4.push(
      safeCall('X1', async () => {
        const { scrapeCompetitorFull } = await import('./competitor-scraper')
        const scraped = await scrapeCompetitorFull({
          nom: params.nom!,
          ville: params.ville!,
        })
        if (scraped.pagesJaunes) data.pj = scraped.pagesJaunes
        if (scraped.planity) data.planity = scraped.planity
        if (scraped.treatwell) data.treatwell = scraped.treatwell
        if (scraped.tripadvisor) data.tripadvisor = scraped.tripadvisor
        if (scraped.google) data.scraper = scraped.google
      }, 60000) // scraping = 60s max
    )

    // Social discovery (Instagram, FB, etc.)
    const siteWeb = params.website || data.google?.website || data.pj?.website
    if (siteWeb) {
      wave4.push(
        safeCall('X2', async () => {
          const { discoverSocialProfiles, scrapeInstagram } = await import('./social-discovery')
          data.social = await discoverSocialProfiles(siteWeb, params.nom)
          if (data.social?.instagram) {
            data.instagram = await scrapeInstagram(data.social.instagram)
          }
        }, 60000)
      )
    }

    await Promise.allSettled(wave4)
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
