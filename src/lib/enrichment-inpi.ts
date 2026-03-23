import 'server-only'
// ============================================================
// CRM DERMOTEC — Enrichissement INPI / Finances entreprise
// API primaire: INPI Data (bilans/comptes annuels)
// API fallback: Recherche Entreprises (données financières basiques)
// Pattern: lazy init, cache 7j Upstash, timeout 15s, AbortSignal
// ============================================================

// --- Types ---

export interface BilanINPI {
  siren: string
  denomination?: string
  annee_cloture: number
  date_cloture?: string
  chiffre_affaires?: number
  resultat_net?: number
  total_bilan?: number
  capitaux_propres?: number
  effectif?: number
  type_comptes?: string
}

export interface DerniersChiffres {
  ca?: number
  resultat_net?: number
  effectif?: number
  annee?: number
  source: 'inpi' | 'recherche-entreprises'
}

export interface ComparisonResult {
  entreprise1: DerniersChiffres & { siren: string; denomination?: string }
  entreprise2: DerniersChiffres & { siren: string; denomination?: string }
  delta: {
    ca_diff?: number
    ca_ratio?: number
    resultat_diff?: number
    effectif_diff?: number
  }
}

// --- Constants ---

const TAG = '[INPI]'
const CACHE_TTL = 604800 // 7 jours
const TIMEOUT_MS = 15_000

const INPI_API_BASE = 'https://data.inpi.fr/api'
const RECHERCHE_API = 'https://recherche-entreprises.api.gouv.fr/search'

// --- Token management (lazy init) ---

let cachedToken: { jwt: string; expiresAt: number } | null = null

async function getINPIToken(): Promise<string | null> {
  const login = process.env.INPI_API_LOGIN
  const password = process.env.INPI_API_PASSWORD

  if (!login || !password) {
    console.warn(TAG, 'INPI_API_LOGIN ou INPI_API_PASSWORD manquant, fallback recherche-entreprises')
    return null
  }

  // Réutiliser le token s'il est encore valide (marge de 5 min)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300_000) {
    return cachedToken.jwt
  }

  try {
    const res = await fetch(`${INPI_API_BASE}/sso/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: login, password }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(TAG, `Login INPI failed: ${res.status}`)
      cachedToken = null
      return null
    }

    const json = await res.json()
    const jwt = json.token || json.access_token

    if (!jwt) {
      console.error(TAG, 'Pas de token dans la réponse INPI')
      cachedToken = null
      return null
    }

    // Token JWT valide ~1h, on garde 55 min
    cachedToken = { jwt, expiresAt: Date.now() + 55 * 60 * 1000 }
    // Token INPI obtained
    return jwt
  } catch (err) {
    console.error(TAG, 'Erreur login INPI:', err)
    cachedToken = null
    return null
  }
}

// --- Helpers ---

function cleanSiren(siren: string): string {
  return siren.replace(/[\s.-]/g, '').substring(0, 9)
}

function cacheKey(prefix: string, ...parts: string[]): string {
  return `enrichment:inpi:${prefix}:${parts.join(':')}`
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

// --- INPI API: Bilans ---

async function fetchBilansINPI(siren: string): Promise<BilanINPI[] | null> {
  const token = await getINPIToken()
  if (!token) return null

  try {
    const res = await fetch(`${INPI_API_BASE}/companies/${siren}/actes-bilans`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(TAG, `API bilans INPI ${res.status} pour ${siren}`)
      return null
    }

    const json = await res.json()
    const bilans = json.bilans || json.comptes || json.results || []

    if (!Array.isArray(bilans) || bilans.length === 0) {
      return []
    }

    return bilans.map((b: any) => ({
      siren,
      denomination: json.denomination || json.nom_complet || b.denomination,
      annee_cloture: extractAnnee(b.date_cloture_exercice || b.date_cloture || b.annee),
      date_cloture: b.date_cloture_exercice || b.date_cloture,
      chiffre_affaires: parseNumber(b.chiffre_affaires || b.ca),
      resultat_net: parseNumber(b.resultat_net || b.resultat),
      total_bilan: parseNumber(b.total_bilan || b.total_actif),
      capitaux_propres: parseNumber(b.capitaux_propres),
      effectif: parseNumber(b.effectif || b.effectif_moyen),
      type_comptes: b.type_comptes || b.type || 'comptes annuels',
    }))
  } catch (err) {
    console.error(TAG, 'Erreur fetch bilans INPI:', err)
    return null
  }
}

// --- Fallback: Recherche Entreprises API ---

async function fetchFinancesRechercheEntreprises(siren: string): Promise<BilanINPI[]> {
  try {
    const res = await fetch(`${RECHERCHE_API}?q=${siren}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(TAG, `API Recherche Entreprises ${res.status} pour ${siren}`)
      return []
    }

    const json = await res.json()
    const results = json.results || []
    const entreprise = results.find((r: any) => r.siren === siren) || results[0]

    if (!entreprise) {
      return []
    }

    const finances = entreprise.finances || {}
    const denomination = entreprise.nom_complet || entreprise.nom_raison_sociale
    const effectif = entreprise.tranche_effectif_salarie
      ? parseEffectifTranche(entreprise.tranche_effectif_salarie)
      : undefined

    // L'API retourne les finances par année
    if (typeof finances === 'object' && !Array.isArray(finances)) {
      const bilans: BilanINPI[] = []
      for (const [annee, data] of Object.entries(finances)) {
        const f = data as any
        if (!f) continue
        bilans.push({
          siren,
          denomination,
          annee_cloture: parseInt(annee, 10),
          date_cloture: f.date_cloture_exercice,
          chiffre_affaires: parseNumber(f.ca),
          resultat_net: parseNumber(f.resultat_net),
          total_bilan: undefined,
          capitaux_propres: undefined,
          effectif,
          type_comptes: 'recherche-entreprises',
        })
      }

      if (bilans.length > 0) {
        bilans.sort((a, b) => b.annee_cloture - a.annee_cloture)
        return bilans
      }
    }

    // Fallback si finances est un tableau ou vide
    return []
  } catch (err) {
    console.error(TAG, 'Erreur Recherche Entreprises:', err)
    return []
  }
}

// --- Fonctions publiques ---

/**
 * Récupérer les bilans disponibles pour un SIREN.
 * Essaie INPI d'abord, fallback Recherche Entreprises.
 */
export async function getBilansINPI(siren: string): Promise<BilanINPI[]> {
  if (!siren || siren.replace(/\D/g, '').length < 9) {
    console.warn(TAG, 'SIREN invalide:', siren)
    return []
  }

  const sirenClean = cleanSiren(siren)
  const key = cacheKey('bilans', sirenClean)

  // Check cache
  const cached = await getCached<BilanINPI[]>(key)
  if (cached) {
    return cached
  }

  // Essayer INPI d'abord
  let bilans = await fetchBilansINPI(sirenClean)

  // Fallback Recherche Entreprises
  if (bilans === null || bilans.length === 0) {
    bilans = await fetchFinancesRechercheEntreprises(sirenClean)
  }

  const result = bilans || []

  // Cache 7 jours
  await setCache(key, result)

  return result
}

/**
 * Retourner les derniers chiffres clés (CA, résultat, effectif).
 */
export async function getDerniersChiffres(siren: string): Promise<DerniersChiffres | null> {
  if (!siren || siren.replace(/\D/g, '').length < 9) {
    console.warn(TAG, 'SIREN invalide:', siren)
    return null
  }

  const sirenClean = cleanSiren(siren)
  const key = cacheKey('derniers', sirenClean)

  // Check cache
  const cached = await getCached<DerniersChiffres>(key)
  if (cached) {
    return cached
  }

  const bilans = await getBilansINPI(sirenClean)
  if (bilans.length === 0) return null

  // Prendre le bilan le plus récent
  const dernier = bilans[0]
  const result: DerniersChiffres = {
    ca: dernier.chiffre_affaires,
    resultat_net: dernier.resultat_net,
    effectif: dernier.effectif,
    annee: dernier.annee_cloture,
    source: dernier.type_comptes === 'recherche-entreprises' ? 'recherche-entreprises' : 'inpi',
  }

  // Cache 7 jours
  await setCache(key, result)

  return result
}

/**
 * Comparer les finances de 2 entreprises côte à côte.
 */
export async function comparerFinances(siren1: string, siren2: string): Promise<ComparisonResult | null> {
  if (!siren1 || !siren2) {
    console.warn(TAG, 'Deux SIRENs requis pour la comparaison')
    return null
  }

  const s1 = cleanSiren(siren1)
  const s2 = cleanSiren(siren2)

  if (s1.replace(/\D/g, '').length < 9 || s2.replace(/\D/g, '').length < 9) {
    console.warn(TAG, 'SIREN invalide dans la comparaison')
    return null
  }

  const key = cacheKey('compare', s1, s2)

  // Check cache
  const cached = await getCached<ComparisonResult>(key)
  if (cached) {
    return cached
  }

  // Fetch en parallèle
  const [bilans1, bilans2] = await Promise.all([
    getBilansINPI(s1),
    getBilansINPI(s2),
  ])

  if (bilans1.length === 0 && bilans2.length === 0) {
    console.warn(TAG, 'Aucune donnée financière pour les 2 SIRENs')
    return null
  }

  const d1 = bilans1[0]
  const d2 = bilans2[0]

  const e1: ComparisonResult['entreprise1'] = {
    siren: s1,
    denomination: d1?.denomination,
    ca: d1?.chiffre_affaires,
    resultat_net: d1?.resultat_net,
    effectif: d1?.effectif,
    annee: d1?.annee_cloture,
    source: d1?.type_comptes === 'recherche-entreprises' ? 'recherche-entreprises' : 'inpi',
  }

  const e2: ComparisonResult['entreprise2'] = {
    siren: s2,
    denomination: d2?.denomination,
    ca: d2?.chiffre_affaires,
    resultat_net: d2?.resultat_net,
    effectif: d2?.effectif,
    annee: d2?.annee_cloture,
    source: d2?.type_comptes === 'recherche-entreprises' ? 'recherche-entreprises' : 'inpi',
  }

  const delta: ComparisonResult['delta'] = {}

  if (e1.ca != null && e2.ca != null) {
    delta.ca_diff = e1.ca - e2.ca
    delta.ca_ratio = e2.ca !== 0 ? e1.ca / e2.ca : undefined
  }
  if (e1.resultat_net != null && e2.resultat_net != null) {
    delta.resultat_diff = e1.resultat_net - e2.resultat_net
  }
  if (e1.effectif != null && e2.effectif != null) {
    delta.effectif_diff = e1.effectif - e2.effectif
  }

  const result: ComparisonResult = { entreprise1: e1, entreprise2: e2, delta }

  // Cache 7 jours
  await setCache(key, result)

  return result
}

// --- Helpers internes ---

function parseNumber(value: unknown): number | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? undefined : num
  }
  return undefined
}

function extractAnnee(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Format YYYY-MM-DD ou YYYY
    const match = value.match(/(\d{4})/)
    return match ? parseInt(match[1], 10) : 0
  }
  return 0
}

function parseEffectifTranche(tranche: string): number | undefined {
  // Tranches INSEE: "00" = 0, "01" = 1-2, "02" = 3-5, "03" = 6-9, etc.
  const mapping: Record<string, number> = {
    '00': 0,
    '01': 2,
    '02': 4,
    '03': 8,
    '11': 15,
    '12': 30,
    '21': 75,
    '22': 150,
    '31': 350,
    '32': 750,
    '41': 1500,
    '42': 3500,
    '51': 7500,
    '52': 9999,
  }
  return mapping[tranche]
}
