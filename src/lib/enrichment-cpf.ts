import 'server-only'
// ============================================================
// CRM DERMOTEC — Enrichissement CPF (Mon Compte Formation / EDOF)
// API OpenDataSoft v2.1 — Caisse des Dépôts
// Cache multi-couche (Redis L1, DB L2), timeout 15s, silent fallback
// ============================================================

import type { EnrichmentResult } from './enrichment'

// ── Types ────────────────────────────────────────────────────

export interface FormationCPF {
  source_id: string
  organisme_siren: string
  organisme_nom: string
  intitule: string
  code_rncp?: string
  code_rs?: string
  prix_ttc?: number // centimes
  duree_heures?: number
  modalite?: string
  region?: string
  departement?: string
  ville?: string
  certifiante?: boolean
  nb_sessions?: number
  date_debut?: string
  date_fin?: string
}

export interface StatsCPFZone {
  nb_formations: number
  prix_moyen_ttc: number // centimes
  nb_organismes: number
  top_formations: { intitule: string; organisme: string; prix_ttc: number }[]
}

export interface ResultatConcurrents {
  formations: FormationCPF[]
  stats: {
    prix_moyen_ttc: number
    nb_concurrents: number
    nb_formations: number
  }
}

// ── Constantes ───────────────────────────────────────────────

const EDOF_BASE_URL =
  'https://opendata.caissedesdepots.fr/api/explore/v2.1/catalog/datasets/moncompteformation_catalogueformation/records'

const CACHE_TTL_EDOF = 6 * 3600 // 6 heures — les données CPF changent peu
const TIMEOUT_MS = 15_000
const MAX_LIMIT = 100

const LOG_PREFIX = '[EDOF]'

// ── Helpers ──────────────────────────────────────────────────

function log(..._args: unknown[]) {
  // Debug logging disabled in production
}

function buildUrl(params: Record<string, string | number | undefined>): string {
  const url = new URL(EDOF_BASE_URL)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

function mapRecord(raw: Record<string, any>): FormationCPF {
  return {
    source_id: raw.numero_formation || raw.id || '',
    organisme_siren: raw.code_siren_organisme || raw.siren_organisme || '',
    organisme_nom: raw.nom_organisme || raw.raison_sociale_organisme || '',
    intitule: raw.intitule_certification || raw.intitule_formation || '',
    code_rncp: raw.code_rncp || undefined,
    code_rs: raw.code_inventaire || raw.code_rs || undefined,
    prix_ttc: raw.prix_total_ttc != null ? Math.round(Number(raw.prix_total_ttc) * 100) : undefined,
    duree_heures: raw.nombre_heures_total_min != null ? Number(raw.nombre_heures_total_min) : undefined,
    modalite: raw.modalite_enseignement || undefined,
    region: raw.region_recherche || raw.region || undefined,
    departement: raw.departement_recherche || raw.departement || undefined,
    ville: raw.ville_recherche || raw.ville || undefined,
    certifiante: raw.certification != null ? Boolean(raw.certification) : undefined,
    nb_sessions: raw.nombre_sessions != null ? Number(raw.nombre_sessions) : undefined,
    date_debut: raw.date_debut || undefined,
    date_fin: raw.date_fin || undefined,
  }
}

// ── Cache multi-couche ───────────────────────────────────────

async function getCached<T>(key: string): Promise<T | null> {
  // L1: Redis
  try {
    const { cacheGet } = await import('./upstash')
    const cached = await cacheGet<T>(key)
    if (cached) {
      log('Cache hit (Redis)', key)
      return cached
    }
  } catch { /* Redis down */ }

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
      log('Cache hit (DB)', key)
      return (data as any).data as T
    }
  } catch { /* DB down */ }

  return null
}

async function setCache(key: string, value: unknown): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL_EDOF * 1000).toISOString()

  // L1: Redis
  try {
    const { cacheSet } = await import('./upstash')
    await cacheSet(key, value, CACHE_TTL_EDOF)
  } catch { /* Silent */ }

  // L2: DB
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase() as any
    await supabase.from('enrichment_cache').upsert({
      cache_key: key,
      provider: 'edof',
      data: value,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' })
  } catch { /* Silent */ }
}

// ── Appel API brut ───────────────────────────────────────────

async function fetchEDOF(params: Record<string, string | number | undefined>): Promise<Record<string, any>[]> {
  const url = buildUrl(params)
  log('Fetch', url)

  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`EDOF API ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = await res.json()
  return json.results || json.records?.map((r: any) => r.record?.fields || r.fields || r) || []
}

// ── Appel protégé avec cache ─────────────────────────────────

async function cachedEDOF<T>(
  cacheKey: string,
  params: Record<string, string | number | undefined>,
  transform: (records: Record<string, any>[]) => T
): Promise<EnrichmentResult<T>> {
  const fullKey = `enrichment:edof:${cacheKey}`

  // Cache check
  const cached = await getCached<T>(fullKey)
  if (cached) {
    return { success: true, data: cached, cached: true, credits_consumed: 0, provider: 'edof' }
  }

  // Appel API
  const start = Date.now()
  try {
    const records = await fetchEDOF(params)
    const data = transform(records)

    await setCache(fullKey, data)

    const latency = Date.now() - start
    log(`OK — ${Array.isArray(records) ? records.length : '?'} records en ${latency}ms`)

    return { success: true, data, cached: false, credits_consumed: 0, provider: 'edof' }
  } catch (err) {
    const latency = Date.now() - start
    const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
    log('Erreur', errorMsg, `(${latency}ms)`)

    return { success: false, cached: false, credits_consumed: 0, provider: 'edof', error: errorMsg }
  }
}

// ============================================================
// 1. searchFormationsCPF — Recherche par mot-clé + zone géo
// ============================================================

export async function searchFormationsCPF(params: {
  keyword: string
  departement?: string
  region?: string
  limit?: number
}): Promise<EnrichmentResult<FormationCPF[]>> {
  const { keyword, departement, region, limit = 20 } = params

  if (!keyword || keyword.trim().length < 2) {
    return { success: false, cached: false, credits_consumed: 0, provider: 'edof', error: 'Mot-clé trop court (min 2 caractères)' }
  }

  const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT)
  const safeKeyword = keyword.trim().replace(/"/g, '\\"')

  // Construire le filtre OData
  const whereClauses: string[] = [
    `search(intitule_certification, "${safeKeyword}")`,
  ]
  if (departement) {
    whereClauses.push(`departement_recherche = "${departement}"`)
  }
  if (region) {
    whereClauses.push(`region_recherche = "${region}"`)
  }

  const cacheKeyParts = [safeKeyword, departement || '', region || '', safeLimit].join(':')
  const cacheKey = `search:${cacheKeyParts.replace(/[^a-zA-Z0-9:]/g, '_').slice(0, 120)}`

  return cachedEDOF<FormationCPF[]>(cacheKey, {
    where: whereClauses.join(' AND '),
    limit: safeLimit,
    order_by: 'prix_total_ttc ASC',
  }, (records) => records.map(mapRecord))
}

// ============================================================
// 2. getFormationsCPFByOrganisme — Formations d'un organisme
// ============================================================

export async function getFormationsCPFByOrganisme(
  siren: string
): Promise<EnrichmentResult<FormationCPF[]>> {
  const cleanSiren = siren.replace(/\s/g, '').slice(0, 9)

  if (!/^\d{9}$/.test(cleanSiren)) {
    return { success: false, cached: false, credits_consumed: 0, provider: 'edof', error: 'SIREN invalide (9 chiffres attendus)' }
  }

  return cachedEDOF<FormationCPF[]>(`org:${cleanSiren}`, {
    where: `code_siren_organisme = "${cleanSiren}"`,
    limit: MAX_LIMIT,
    order_by: 'intitule_certification ASC',
  }, (records) => records.map(mapRecord))
}

// ============================================================
// 3. getStatsCPFByZone — Stats agrégées par département
// ============================================================

export async function getStatsCPFByZone(
  departement: string
): Promise<EnrichmentResult<StatsCPFZone>> {
  const cleanDept = departement.trim()

  if (!cleanDept) {
    return { success: false, cached: false, credits_consumed: 0, provider: 'edof', error: 'Département requis' }
  }

  return cachedEDOF<StatsCPFZone>(`stats:${cleanDept}`, {
    where: `departement_recherche = "${cleanDept}"`,
    limit: MAX_LIMIT,
    order_by: 'prix_total_ttc DESC',
  }, (records) => {
    const formations = records.map(mapRecord)

    // Prix moyen (exclure les formations sans prix)
    const avecPrix = formations.filter((f) => f.prix_ttc != null && f.prix_ttc > 0)
    const prixMoyen = avecPrix.length > 0
      ? Math.round(avecPrix.reduce((sum, f) => sum + (f.prix_ttc || 0), 0) / avecPrix.length)
      : 0

    // Organismes uniques
    const organismesUniques = new Set(formations.map((f) => f.organisme_siren).filter(Boolean))

    // Top formations (par prix décroissant, déjà triées)
    const top = formations.slice(0, 10).map((f) => ({
      intitule: f.intitule,
      organisme: f.organisme_nom,
      prix_ttc: f.prix_ttc || 0,
    }))

    return {
      nb_formations: formations.length,
      prix_moyen_ttc: prixMoyen,
      nb_organismes: organismesUniques.size,
      top_formations: top,
    }
  })
}

// ============================================================
// 4. getFormationsCPFConcurrentes — Formations concurrentes
// ============================================================

export async function getFormationsCPFConcurrentes(params: {
  keyword: string
  departement: string
  excludeSiren?: string
}): Promise<EnrichmentResult<ResultatConcurrents>> {
  const { keyword, departement, excludeSiren } = params

  if (!keyword || keyword.trim().length < 2) {
    return { success: false, cached: false, credits_consumed: 0, provider: 'edof', error: 'Mot-clé trop court (min 2 caractères)' }
  }
  if (!departement) {
    return { success: false, cached: false, credits_consumed: 0, provider: 'edof', error: 'Département requis' }
  }

  const safeKeyword = keyword.trim().replace(/"/g, '\\"')
  const cleanDept = departement.trim()
  const cleanExclude = excludeSiren?.replace(/\s/g, '').slice(0, 9)

  const whereClauses: string[] = [
    `search(intitule_certification, "${safeKeyword}")`,
    `departement_recherche = "${cleanDept}"`,
  ]
  if (cleanExclude && /^\d{9}$/.test(cleanExclude)) {
    whereClauses.push(`code_siren_organisme != "${cleanExclude}"`)
  }

  const cacheKeyParts = [safeKeyword, cleanDept, cleanExclude || 'all'].join(':')
  const cacheKey = `concurrents:${cacheKeyParts.replace(/[^a-zA-Z0-9:]/g, '_').slice(0, 120)}`

  return cachedEDOF<ResultatConcurrents>(cacheKey, {
    where: whereClauses.join(' AND '),
    limit: MAX_LIMIT,
    order_by: 'prix_total_ttc ASC',
  }, (records) => {
    const formations = records.map(mapRecord)

    // Stats concurrents
    const avecPrix = formations.filter((f) => f.prix_ttc != null && f.prix_ttc > 0)
    const prixMoyen = avecPrix.length > 0
      ? Math.round(avecPrix.reduce((sum, f) => sum + (f.prix_ttc || 0), 0) / avecPrix.length)
      : 0

    const organismesUniques = new Set(formations.map((f) => f.organisme_siren).filter(Boolean))

    return {
      formations,
      stats: {
        prix_moyen_ttc: prixMoyen,
        nb_concurrents: organismesUniques.size,
        nb_formations: formations.length,
      },
    }
  })
}
