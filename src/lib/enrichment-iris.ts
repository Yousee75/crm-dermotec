import 'server-only'
// ============================================================
// CRM DERMOTEC — Enrichissement IRIS (revenus par quartier INSEE)
// Sources: geo.api.gouv.fr + table Supabase iris_revenus + fallback estimation
// Pattern: lazy init, cache 30j Upstash, timeout 10s, logging [IRIS]
// ============================================================

// --- Types ---

export interface RevenusIRIS {
  code_iris?: string
  code_commune: string
  nom_commune: string
  departement: string
  revenu_median?: number
  revenu_q1?: number
  revenu_q3?: number
  taux_pauvrete?: number
  population?: number
  standing: Standing
}

export type Standing = 'premium' | 'moyen_plus' | 'moyen' | 'populaire'

interface CommuneGeo {
  code: string
  nom: string
  codesPostaux?: string[]
  population?: number
  departement?: { code: string; nom: string }
}

interface GetRevenusParams {
  lat?: number
  lng?: number
  codeCommune?: string
}

// --- Constants ---

const TAG = '[IRIS]'
const CACHE_TTL = 2_592_000 // 30 jours en secondes
const TIMEOUT_MS = 10_000
const GEO_API = 'https://geo.api.gouv.fr'

// Seuils revenus médians annuels par UC (source Filosofi INSEE)
const SEUIL_PREMIUM = 30_000
const SEUIL_MOYEN_PLUS = 22_000
const SEUIL_MOYEN = 16_000

// Revenu médian national de référence (INSEE 2022)
const REVENU_MEDIAN_NATIONAL = 23_160

// --- Cache helpers ---

function cacheKey(prefix: string, ...parts: string[]): string {
  return `enrichment:iris:${prefix}:${parts.join(':')}`
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const { cacheGet } = await import('./upstash')
    return await cacheGet<T>(key)
  } catch {
    return null
  }
}

async function setCache<T>(key: string, value: T): Promise<void> {
  try {
    const { cacheSet } = await import('./upstash')
    await cacheSet(key, value, CACHE_TTL)
  } catch { /* Silent */ }
}

// --- Standing ---

export function estimerStanding(revenuMedian: number): Standing {
  if (revenuMedian > SEUIL_PREMIUM) return 'premium'
  if (revenuMedian > SEUIL_MOYEN_PLUS) return 'moyen_plus'
  if (revenuMedian > SEUIL_MOYEN) return 'moyen'
  return 'populaire'
}

// --- Géocodage inverse via API Geo ---

export async function getCodeCommuneFromGPS(
  lat: number,
  lng: number,
): Promise<{ code: string; nom: string; departement: string } | null> {
  const key = cacheKey('commune', `${lat.toFixed(4)}`, `${lng.toFixed(4)}`)
  const cached = await getCached<{ code: string; nom: string; departement: string }>(key)
  if (cached) return cached

  try {
    const url = `${GEO_API}/communes?lat=${lat}&lon=${lng}&fields=code,nom,codesPostaux,population,departement&limit=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(TAG, `API Geo ${res.status} pour GPS ${lat},${lng}`)
      return null
    }

    const communes: CommuneGeo[] = await res.json()
    if (!communes.length) {
      console.warn(TAG, `Aucune commune trouvée pour GPS ${lat},${lng}`)
      return null
    }

    const c = communes[0]
    const result = {
      code: c.code,
      nom: c.nom,
      departement: c.departement?.code || c.code.substring(0, 2),
    }

    await setCache(key, result)
    console.info(TAG, `Commune trouvée: ${result.nom} (${result.code})`)
    return result
  } catch (err) {
    console.error(TAG, 'Erreur géocodage inverse:', err instanceof Error ? err.message : err)
    return null
  }
}

// --- Lookup Supabase iris_revenus ---

async function lookupIRISFromDB(codeCommune: string): Promise<RevenusIRIS | null> {
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase() as any

    const { data, error } = await supabase
      .from('iris_revenus')
      .select('*')
      .eq('code_commune', codeCommune)
      .order('revenu_median', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(TAG, `Erreur DB iris_revenus pour ${codeCommune}:`, error.message)
      return null
    }

    if (!data) return null

    return {
      code_iris: data.code_iris,
      code_commune: data.code_commune,
      nom_commune: data.nom_commune || '',
      departement: data.departement || codeCommune.substring(0, 2),
      revenu_median: data.revenu_median,
      revenu_q1: data.revenu_q1,
      revenu_q3: data.revenu_q3,
      taux_pauvrete: data.taux_pauvrete,
      population: data.population,
      standing: estimerStanding(data.revenu_median || REVENU_MEDIAN_NATIONAL),
    }
  } catch (err) {
    console.error(TAG, 'Erreur lookup DB:', err instanceof Error ? err.message : err)
    return null
  }
}

// --- Fallback : estimation depuis API Geo (population commune) ---

async function estimerRevenusFromGeo(codeCommune: string): Promise<RevenusIRIS | null> {
  try {
    const url = `${GEO_API}/communes/${codeCommune}?fields=code,nom,population,departement,codesPostaux`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(TAG, `API Geo ${res.status} pour commune ${codeCommune}`)
      return null
    }

    const c: CommuneGeo = await res.json()
    const dept = c.departement?.code || codeCommune.substring(0, 2)
    const pop = c.population || 0

    // Estimation grossière basée sur le département et la taille de la commune
    // Paris + Hauts-de-Seine + Yvelines → revenus plus élevés
    const deptsAises = ['75', '92', '78', '91', '94', '74', '69', '31', '33', '06']
    const deptsPop = ['93', '95', '59', '62', '80', '02', '08', '60']

    let revenuEstime = REVENU_MEDIAN_NATIONAL

    if (deptsAises.includes(dept)) {
      revenuEstime = REVENU_MEDIAN_NATIONAL * 1.25
    } else if (deptsPop.includes(dept)) {
      revenuEstime = REVENU_MEDIAN_NATIONAL * 0.85
    }

    // Les petites communes rurales ont souvent des revenus légèrement supérieurs à la moyenne
    if (pop > 0 && pop < 2000) {
      revenuEstime *= 1.05
    } else if (pop > 100_000) {
      // Grandes villes = plus d'inégalités, revenu médian souvent plus bas
      revenuEstime *= 0.95
    }

    revenuEstime = Math.round(revenuEstime)

    return {
      code_commune: codeCommune,
      nom_commune: c.nom,
      departement: dept,
      revenu_median: revenuEstime,
      population: pop,
      standing: estimerStanding(revenuEstime),
    }
  } catch (err) {
    console.error(TAG, 'Erreur estimation fallback:', err instanceof Error ? err.message : err)
    return null
  }
}

// --- Fonction principale : revenus quartier ---

export async function getRevenusQuartier(params: GetRevenusParams): Promise<RevenusIRIS | null> {
  let codeCommune = params.codeCommune

  // Résoudre le code commune depuis GPS si nécessaire
  if (!codeCommune && params.lat != null && params.lng != null) {
    const commune = await getCodeCommuneFromGPS(params.lat, params.lng)
    if (!commune) return null
    codeCommune = commune.code
  }

  if (!codeCommune) {
    console.warn(TAG, 'Ni GPS ni code commune fourni')
    return null
  }

  // Check cache
  const key = cacheKey('revenus', codeCommune)
  const cached = await getCached<RevenusIRIS>(key)
  if (cached) return cached

  // 1. Chercher dans la table Supabase iris_revenus
  const fromDB = await lookupIRISFromDB(codeCommune)
  if (fromDB) {
    await setCache(key, fromDB)
    console.info(TAG, `Revenus DB pour ${fromDB.nom_commune}: ${fromDB.revenu_median}€ (${fromDB.standing})`)
    return fromDB
  }

  // 2. Fallback : estimation depuis API Geo
  const estimated = await estimerRevenusFromGeo(codeCommune)
  if (estimated) {
    await setCache(key, estimated)
    console.info(TAG, `Revenus estimés pour ${estimated.nom_commune}: ${estimated.revenu_median}€ (${estimated.standing})`)
    return estimated
  }

  return null
}

// --- Score zone de chalandise (0-100) ---

export async function getScoreZoneChalandise(lat: number, lng: number): Promise<number> {
  const key = cacheKey('score', `${lat.toFixed(4)}`, `${lng.toFixed(4)}`)
  const cached = await getCached<number>(key)
  if (cached != null) return cached

  let score = 50 // Score par défaut

  // 1. Revenus du quartier (0-50 points)
  const revenus = await getRevenusQuartier({ lat, lng })
  if (revenus) {
    const revenuScore = computeRevenuScore(revenus)
    score = revenuScore
  }

  // 2. Bonus population (0-15 points)
  if (revenus?.population) {
    score += computePopulationScore(revenus.population)
  }

  // 3. Bonus présence en base IRIS (données précises = +10 points)
  if (revenus?.code_iris) {
    score += 10
  }

  // 4. Bonus Google Nearby si disponible (0-25 points)
  try {
    const { getNearbyBusinesses } = await import('./enrichment') as any
    const nearby = await getNearbyBusinesses(lat, lng)
    if (nearby && typeof nearby === 'object') {
      // Présence de commerces/salons = zone dynamique
      const nbPlaces = Array.isArray(nearby) ? nearby.length : 0
      if (nbPlaces > 20) score += 25
      else if (nbPlaces > 10) score += 20
      else if (nbPlaces > 5) score += 15
      else if (nbPlaces > 0) score += 10
    }
  } catch {
    // Google Nearby non disponible, on continue sans
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, Math.round(score)))

  await setCache(key, score)
  console.info(TAG, `Score zone chalandise GPS ${lat},${lng}: ${score}/100`)
  return score
}

// --- Scoring helpers ---

function computeRevenuScore(revenus: RevenusIRIS): number {
  if (!revenus.revenu_median) return 25 // Données manquantes → score neutre

  // Mapping revenu médian → score (0-50)
  // < 14K → 10, 14-18K → 20, 18-24K → 30, 24-30K → 40, > 30K → 50
  const r = revenus.revenu_median
  if (r > 35_000) return 50
  if (r > 30_000) return 45
  if (r > 24_000) return 40
  if (r > 20_000) return 35
  if (r > 18_000) return 30
  if (r > 16_000) return 25
  if (r > 14_000) return 20
  if (r > 12_000) return 15
  return 10
}

function computePopulationScore(population: number): number {
  // Zone idéale pour formations esthétique : 10K-200K habitants
  if (population >= 50_000 && population <= 200_000) return 15
  if (population >= 20_000 && population < 50_000) return 12
  if (population >= 10_000 && population < 20_000) return 10
  if (population > 200_000) return 10 // Grande ville = concurrence
  if (population >= 5_000) return 8
  if (population >= 2_000) return 5
  return 3 // Très petite commune
}
