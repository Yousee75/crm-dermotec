import 'server-only'
// ============================================================
// CRM DERMOTEC — Enrichissement DGEFP (Liste publique des OF)
// API OpenDataSoft : organismes de formation déclarés en France
// Cache multi-couche (Redis + DB), timeout 15s, logging [DGEFP]
// ============================================================

// ── Types ──────────────────────────────────────────────────

export interface OrganismeFormation {
  nda: string
  siren: string
  siret?: string
  nom: string
  effectif_formateurs?: number
  nb_stagiaires?: number
  specialites?: string[]
  qualiopi: boolean
  qualiopi_actions?: string[]
  adresse?: string
  code_postal?: string
  ville?: string
  region?: string
  departement?: string
  telephone?: string
  email?: string
  website?: string
}

export interface StatsOFZone {
  departement: string
  total_of: number
  total_qualiopi: number
  taux_qualiopi: number
  top_specialites: { specialite: string; count: number }[]
  avg_stagiaires: number
  avg_effectif: number
}

export interface ConcurrentsResult {
  concurrents: OrganismeFormation[]
  stats: {
    total: number
    qualiopi_count: number
    avg_stagiaires: number
    avg_effectif: number
  }
}

// ── Configuration ──────────────────────────────────────────

const DGEFP_BASE_URL =
  'https://dgefp.opendatasoft.com/api/explore/v2.0/catalog/datasets/liste-publique-des-of-v2/records'

const DGEFP_TIMEOUT_MS = 15_000
const CACHE_TTL_SECONDS = 24 * 3600 // 24h — les données OF changent rarement
const CACHE_PREFIX = 'dgefp'

// ── Cache multi-couche ─────────────────────────────────────

async function cacheGet(key: string): Promise<unknown | null> {
  // L1: Redis
  try {
    const { cacheGet: redisGet } = await import('./upstash')
    const cached = await redisGet(key)
    if (cached) {
      console.log(`[DGEFP] Cache hit (Redis) : ${key}`)
      return cached
    }
  } catch { /* Redis down — fallback DB */ }

  // L2: DB
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase() as any
    const { data } = await supabase
      .from('enrichment_cache')
      .select('data')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single()
    if ((data as any)?.data) {
      console.log(`[DGEFP] Cache hit (DB) : ${key}`)
      return (data as any).data
    }
  } catch { /* Silent */ }

  return null
}

async function cacheSet(key: string, value: unknown): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString()

  // L1: Redis
  try {
    const { cacheSet: redisSet } = await import('./upstash')
    await redisSet(key, value, CACHE_TTL_SECONDS)
  } catch { /* Silent */ }

  // L2: DB
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase() as any
    await supabase.from('enrichment_cache').upsert({
      cache_key: key,
      provider: 'dgefp',
      data: value,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' })
  } catch { /* Silent */ }
}

// ── Helpers API ────────────────────────────────────────────

function buildUrl(params: Record<string, string | number | undefined>): string {
  const url = new URL(DGEFP_BASE_URL)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') {
      url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

async function fetchDGEFP<T>(url: string): Promise<T> {
  console.log(`[DGEFP] Requête : ${url}`)
  const start = Date.now()

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(DGEFP_TIMEOUT_MS),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`DGEFP API ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  console.log(`[DGEFP] Réponse en ${Date.now() - start}ms — ${data.total_count ?? '?'} résultats`)
  return data as T
}

interface DGEFPResponse {
  total_count: number
  results: DGEFPRecord[]
}

interface DGEFPRecord {
  numero_da?: string
  denomination_of?: string
  siren?: string
  code_postal?: string
  ville?: string
  region?: string
  departement?: string
  nb_stagiaires?: number
  effectif?: number
  specialites?: string
  identifiant_certifqualiopiformations?: string
}

function mapRecord(r: DGEFPRecord): OrganismeFormation {
  const specialitesRaw = r.specialites || ''
  const specialites = specialitesRaw
    ? specialitesRaw
        .split(/[;,|]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined

  const qualiopiId = r.identifiant_certifqualiopiformations || ''
  const qualiopi = qualiopiId.length > 0

  // Extraire les actions Qualiopi si disponibles
  const qualiopi_actions = qualiopi
    ? qualiopiId.split(/[;,|]/).map((s) => s.trim()).filter(Boolean)
    : undefined

  return {
    nda: r.numero_da || '',
    siren: r.siren || '',
    nom: r.denomination_of || '',
    effectif_formateurs: r.effectif ?? undefined,
    nb_stagiaires: r.nb_stagiaires ?? undefined,
    specialites,
    qualiopi,
    qualiopi_actions,
    code_postal: r.code_postal || undefined,
    ville: r.ville || undefined,
    region: r.region || undefined,
    departement: r.departement || undefined,
  }
}

// ── In-flight dedup ────────────────────────────────────────

const inflightRequests = new Map<string, Promise<unknown>>()

async function dedupedFetch<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> {
  // 1. Cache
  const cached = await cacheGet(cacheKey)
  if (cached) return cached as T

  // 2. Dedup
  const existing = inflightRequests.get(cacheKey)
  if (existing) return existing as Promise<T>

  // 3. Fetch
  const promise = (async () => {
    try {
      const result = await fetcher()
      await cacheSet(cacheKey, result)
      return result
    } finally {
      setTimeout(() => inflightRequests.delete(cacheKey), 1000)
    }
  })()

  inflightRequests.set(cacheKey, promise)
  return promise
}

// ============================================================
// 1. searchOrganismesFormation — Recherche par zone/mot-clé
// ============================================================

export interface SearchOFParams {
  keyword?: string
  departement?: string
  region?: string
  qualiopi?: boolean
  limit?: number
  offset?: number
}

export async function searchOrganismesFormation(
  params: SearchOFParams
): Promise<OrganismeFormation[]> {
  const { keyword, departement, region, qualiopi, limit = 20, offset = 0 } = params

  // Construire le filtre OData where
  const filters: string[] = []

  if (keyword) {
    // Recherche texte sur dénomination + spécialités
    const escaped = keyword.replace(/'/g, "\\'")
    filters.push(
      `(search(denomination_of, '${escaped}') OR search(specialites, '${escaped}'))`
    )
  }
  if (departement) {
    filters.push(`departement = '${departement.replace(/'/g, "\\'")}'`)
  }
  if (region) {
    filters.push(`region = '${region.replace(/'/g, "\\'")}'`)
  }
  if (qualiopi === true) {
    filters.push(`identifiant_certifqualiopiformations IS NOT NULL`)
  } else if (qualiopi === false) {
    filters.push(`identifiant_certifqualiopiformations IS NULL`)
  }

  const where = filters.length > 0 ? filters.join(' AND ') : undefined
  const cacheKey = `${CACHE_PREFIX}:search:${JSON.stringify({ keyword, departement, region, qualiopi, limit, offset })}`

  return dedupedFetch(cacheKey, async () => {
    const data = await fetchDGEFP<DGEFPResponse>(
      buildUrl({
        where,
        limit: Math.min(limit, 100),
        offset,
        order_by: 'nb_stagiaires DESC',
      })
    )
    return (data.results || []).map(mapRecord)
  })
}

// ============================================================
// 2. getOrganismeByNDA — Par numéro de déclaration d'activité
// ============================================================

export async function getOrganismeByNDA(
  nda: string
): Promise<OrganismeFormation | null> {
  if (!nda || nda.trim().length === 0) {
    console.log('[DGEFP] getOrganismeByNDA : NDA vide')
    return null
  }

  const cleanNDA = nda.replace(/\s/g, '')
  const cacheKey = `${CACHE_PREFIX}:nda:${cleanNDA}`

  return dedupedFetch(cacheKey, async () => {
    const data = await fetchDGEFP<DGEFPResponse>(
      buildUrl({
        where: `numero_da = '${cleanNDA}'`,
        limit: 1,
      })
    )
    const record = data.results?.[0]
    return record ? mapRecord(record) : null
  })
}

// ============================================================
// 3. getOrganismeBySiren — Par SIREN
// ============================================================

export async function getOrganismeBySiren(
  siren: string
): Promise<OrganismeFormation | null> {
  if (!siren || siren.trim().length === 0) {
    console.log('[DGEFP] getOrganismeBySiren : SIREN vide')
    return null
  }

  const cleanSiren = siren.replace(/\s/g, '').slice(0, 9)
  const cacheKey = `${CACHE_PREFIX}:siren:${cleanSiren}`

  return dedupedFetch(cacheKey, async () => {
    const data = await fetchDGEFP<DGEFPResponse>(
      buildUrl({
        where: `siren = '${cleanSiren}'`,
        limit: 1,
      })
    )
    const record = data.results?.[0]
    return record ? mapRecord(record) : null
  })
}

// ============================================================
// 4. getStatsOFByZone — Statistiques agrégées par département
// ============================================================

export async function getStatsOFByZone(
  departement: string
): Promise<StatsOFZone> {
  if (!departement || departement.trim().length === 0) {
    throw new Error('[DGEFP] getStatsOFByZone : département requis')
  }

  const cleanDept = departement.trim().replace(/'/g, "\\'")
  const cacheKey = `${CACHE_PREFIX}:stats:${cleanDept}`

  return dedupedFetch(cacheKey, async () => {
    // Récupérer un échantillon large pour calculer les stats
    // On pagine si nécessaire — max 100 par appel
    const allRecords: DGEFPRecord[] = []
    let offset = 0
    let totalCount = 0
    const PAGE_SIZE = 100
    const MAX_PAGES = 10 // Limiter à 1000 OF max pour les stats

    do {
      const data = await fetchDGEFP<DGEFPResponse>(
        buildUrl({
          where: `departement = '${cleanDept}'`,
          limit: PAGE_SIZE,
          offset,
          select: 'numero_da,siren,denomination_of,nb_stagiaires,effectif,specialites,identifiant_certifqualiopiformations',
        })
      )
      totalCount = data.total_count || 0
      allRecords.push(...(data.results || []))
      offset += PAGE_SIZE
    } while (offset < totalCount && offset < PAGE_SIZE * MAX_PAGES)

    // Calculer les stats
    const totalOF = totalCount
    const qualiopiCount = allRecords.filter(
      (r) => r.identifiant_certifqualiopiformations && r.identifiant_certifqualiopiformations.length > 0
    ).length
    const taux_qualiopi = totalOF > 0
      ? Math.round((qualiopiCount / Math.min(totalOF, allRecords.length)) * 100 * 10) / 10
      : 0

    // Moyenne stagiaires
    const stagiairesValues = allRecords
      .map((r) => r.nb_stagiaires)
      .filter((v): v is number => typeof v === 'number' && v > 0)
    const avg_stagiaires = stagiairesValues.length > 0
      ? Math.round(stagiairesValues.reduce((a, b) => a + b, 0) / stagiairesValues.length)
      : 0

    // Moyenne effectif
    const effectifValues = allRecords
      .map((r) => r.effectif)
      .filter((v): v is number => typeof v === 'number' && v > 0)
    const avg_effectif = effectifValues.length > 0
      ? Math.round(effectifValues.reduce((a, b) => a + b, 0) / effectifValues.length)
      : 0

    // Top spécialités
    const specCounts = new Map<string, number>()
    for (const r of allRecords) {
      if (!r.specialites) continue
      const specs = r.specialites.split(/[;,|]/).map((s) => s.trim().toLowerCase()).filter(Boolean)
      for (const spec of specs) {
        specCounts.set(spec, (specCounts.get(spec) || 0) + 1)
      }
    }
    const top_specialites = Array.from(specCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([specialite, count]) => ({ specialite, count }))

    return {
      departement: cleanDept,
      total_of: totalOF,
      total_qualiopi: qualiopiCount,
      taux_qualiopi,
      top_specialites,
      avg_stagiaires,
      avg_effectif,
    } satisfies StatsOFZone
  })
}

// ============================================================
// 5. getConcurrentsFormation — OF concurrents dans la zone
// ============================================================

export interface ConcurrentsParams {
  departement: string
  specialite?: string
  excludeSiren?: string
  limit?: number
}

export async function getConcurrentsFormation(
  params: ConcurrentsParams
): Promise<ConcurrentsResult> {
  const { departement, specialite, excludeSiren, limit = 50 } = params

  if (!departement || departement.trim().length === 0) {
    throw new Error('[DGEFP] getConcurrentsFormation : département requis')
  }

  const cleanDept = departement.trim().replace(/'/g, "\\'")
  const cacheKey = `${CACHE_PREFIX}:concurrents:${JSON.stringify({ departement: cleanDept, specialite, excludeSiren, limit })}`

  return dedupedFetch(cacheKey, async () => {
    const filters: string[] = [
      `departement = '${cleanDept}'`,
    ]

    if (specialite) {
      const escaped = specialite.replace(/'/g, "\\'")
      filters.push(`search(specialites, '${escaped}')`)
    }

    // On récupère plus que le limit pour pouvoir exclure et calculer les stats
    const fetchLimit = Math.min(limit + 10, 100)

    const data = await fetchDGEFP<DGEFPResponse>(
      buildUrl({
        where: filters.join(' AND '),
        limit: fetchLimit,
        order_by: 'nb_stagiaires DESC',
      })
    )

    let concurrents = (data.results || []).map(mapRecord)

    // Exclure notre propre SIREN
    if (excludeSiren) {
      const cleanExclude = excludeSiren.replace(/\s/g, '')
      concurrents = concurrents.filter((c) => c.siren !== cleanExclude)
    }

    // Limiter au nombre demandé
    concurrents = concurrents.slice(0, limit)

    // Calculer les stats
    const qualiopiCount = concurrents.filter((c) => c.qualiopi).length
    const stagiairesValues = concurrents
      .map((c) => c.nb_stagiaires)
      .filter((v): v is number => typeof v === 'number' && v > 0)
    const effectifValues = concurrents
      .map((c) => c.effectif_formateurs)
      .filter((v): v is number => typeof v === 'number' && v > 0)

    return {
      concurrents,
      stats: {
        total: concurrents.length,
        qualiopi_count: qualiopiCount,
        avg_stagiaires: stagiairesValues.length > 0
          ? Math.round(stagiairesValues.reduce((a, b) => a + b, 0) / stagiairesValues.length)
          : 0,
        avg_effectif: effectifValues.length > 0
          ? Math.round(effectifValues.reduce((a, b) => a + b, 0) / effectifValues.length)
          : 0,
      },
    } satisfies ConcurrentsResult
  })
}
