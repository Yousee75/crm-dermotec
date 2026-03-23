import 'server-only'
// ============================================================
// CRM DERMOTEC — Enrichissement France Travail (offres emploi)
// API: https://api.francetravail.io/partenaire/offresdemploi/v2
// Pattern: lazy init, cache 24h Upstash, timeout 15s, logging
// ============================================================

// --- Types ---

export interface OffreEmploi {
  offre_id: string
  intitule: string
  description?: string
  entreprise_nom?: string
  type_contrat?: string
  salaire_min?: number
  salaire_max?: number
  experience_requis?: string
  commune?: string
  departement?: string
  code_postal?: string
  date_creation?: string
}

export interface StatsEmploiZone {
  nb_offres: number
  nb_cdi: number
  nb_cdd: number
  salaire_moyen: number
}

export interface SearchParams {
  departement?: string
  codePostal?: string
  codeRome?: string
  distance?: number
}

// --- Token cache in-memory ---

let _cachedToken: string | null = null
let _tokenExpiresAt = 0

const TAG = '[FranceTravail]'
const CACHE_TTL = 86400 // 24h
const TOKEN_TTL = 1500 // 25 min (token valide 30 min)
const TIMEOUT_MS = 15_000

const TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire'
const API_BASE = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search'

// --- Helpers ---

function isConfigured(): boolean {
  return !!(process.env.FRANCE_TRAVAIL_CLIENT_ID && process.env.FRANCE_TRAVAIL_CLIENT_SECRET)
}

function cacheKey(prefix: string, ...parts: string[]): string {
  return `enrichment:francetravail:${prefix}:${parts.join(':')}`
}

// --- OAuth2 Token ---

export async function getToken(): Promise<string | null> {
  if (!isConfigured()) {
    console.warn(TAG, 'FRANCE_TRAVAIL_CLIENT_ID/SECRET manquantes — skip')
    return null
  }

  // Check in-memory cache
  if (_cachedToken && Date.now() < _tokenExpiresAt) {
    return _cachedToken
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.FRANCE_TRAVAIL_CLIENT_ID!,
      client_secret: process.env.FRANCE_TRAVAIL_CLIENT_SECRET!,
      scope: 'api_offresdemploiv2 o2dsoffre',
    })

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(TAG, `Token error ${res.status}: ${await res.text()}`)
      return null
    }

    const json = await res.json()
    _cachedToken = json.access_token
    _tokenExpiresAt = Date.now() + TOKEN_TTL * 1000
    return _cachedToken
  } catch (err) {
    console.error(TAG, 'Token fetch failed:', err)
    return null
  }
}

// --- Search offres ---

export async function searchOffresEmploi(params: SearchParams = {}): Promise<OffreEmploi[]> {
  if (!isConfigured()) return []

  const {
    departement = '75',
    codePostal,
    codeRome = 'D1208', // Esthéticienne
    distance = 30,
  } = params

  const key = cacheKey('search', codeRome, departement, codePostal || '', String(distance))

  // Check cache
  try {
    const { cacheGet } = await import('./upstash')
    const cached = await cacheGet<OffreEmploi[]>(key)
    if (cached) {
      return cached
    }
  } catch { /* Redis down */ }

  const token = await getToken()
  if (!token) return []

  try {
    const searchParams = new URLSearchParams({
      codeROME: codeRome,
      distance: String(distance),
      range: '0-49',
    })

    if (codePostal) {
      searchParams.set('commune', codePostal)
    } else {
      searchParams.set('departement', departement)
    }

    const res = await fetch(`${API_BASE}?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(TAG, `Search error ${res.status}: ${await res.text()}`)
      return []
    }

    const json = await res.json()
    const resultats = json.resultats || []

    const offres: OffreEmploi[] = resultats.map((r: any) => ({
      offre_id: r.id || '',
      intitule: r.intitule || '',
      description: r.description,
      entreprise_nom: r.entreprise?.nom,
      type_contrat: r.typeContrat,
      salaire_min: r.salaire?.libelle ? parseSalaire(r.salaire.libelle, 'min') : undefined,
      salaire_max: r.salaire?.libelle ? parseSalaire(r.salaire.libelle, 'max') : undefined,
      experience_requis: r.experienceExige,
      commune: r.lieuTravail?.commune,
      departement: r.lieuTravail?.commune?.substring(0, 2),
      code_postal: r.lieuTravail?.codePostal,
      date_creation: r.dateCreation,
    }))

    // Cache 24h
    try {
      const { cacheSet } = await import('./upstash')
      await cacheSet(key, offres, CACHE_TTL)
    } catch { /* Silent */ }

    return offres
  } catch (err) {
    console.error(TAG, 'Search failed:', err)
    return []
  }
}

// --- Stats emploi zone ---

export async function getStatsEmploiZone(departement: string): Promise<StatsEmploiZone> {
  const empty: StatsEmploiZone = { nb_offres: 0, nb_cdi: 0, nb_cdd: 0, salaire_moyen: 0 }
  if (!isConfigured()) return empty

  const key = cacheKey('stats', departement)

  // Check cache
  try {
    const { cacheGet } = await import('./upstash')
    const cached = await cacheGet<StatsEmploiZone>(key)
    if (cached) {
      return cached
    }
  } catch { /* Redis down */ }

  const offres = await searchOffresEmploi({ departement, distance: 50 })
  if (offres.length === 0) return empty

  const nb_cdi = offres.filter(o => o.type_contrat === 'CDI').length
  const nb_cdd = offres.filter(o => o.type_contrat === 'CDD').length

  const salaires = offres
    .filter(o => o.salaire_min || o.salaire_max)
    .map(o => o.salaire_max || o.salaire_min || 0)
    .filter(s => s > 0)

  const salaire_moyen = salaires.length > 0
    ? Math.round(salaires.reduce((a, b) => a + b, 0) / salaires.length)
    : 0

  const stats: StatsEmploiZone = {
    nb_offres: offres.length,
    nb_cdi,
    nb_cdd,
    salaire_moyen,
  }

  // Cache 24h
  try {
    const { cacheSet } = await import('./upstash')
    await cacheSet(key, stats, CACHE_TTL)
  } catch { /* Silent */ }

  return stats
}

// --- Helpers internes ---

function parseSalaire(libelle: string, type: 'min' | 'max'): number | undefined {
  if (!libelle) return undefined
  // Formats courants: "Mensuel de 1800.0 Euros à 2200.0 Euros" / "Annuel de 22000 Euros"
  const numbers = libelle.match(/[\d]+(?:\.[\d]+)?/g)
  if (!numbers || numbers.length === 0) return undefined
  if (type === 'min') return parseFloat(numbers[0])
  if (type === 'max' && numbers.length > 1) return parseFloat(numbers[numbers.length - 1])
  return parseFloat(numbers[0])
}
