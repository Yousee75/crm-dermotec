import 'server-only'
// ============================================================
// CRM DERMOTEC — Enrichissement BODACC (annonces légales)
// API: https://bodacc-datadila.opendatasoft.com/api/explore/v2.1
// Pattern: gratuit sans auth, cache 24h Upstash, timeout 15s
// ============================================================

// --- Types ---

export interface AnnonceBodacc {
  annonce_id: string
  siren?: string
  denomination?: string
  type_annonce: string
  contenu?: string
  tribunal?: string
  date_parution?: string
}

export interface ProcedureCollective {
  enProcedure: boolean
  type?: string
  date?: string
}

export interface CreationsRadiationsZone {
  creations: number
  radiations: number
  procedures: number
}

// --- Constants ---

const TAG = '[BODACC]'
const CACHE_TTL = 86400 // 24h
const TIMEOUT_MS = 15_000

const API_BASE = 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records'

// --- Helpers ---

function cacheKey(prefix: string, ...parts: string[]): string {
  return `enrichment:bodacc:${prefix}:${parts.join(':')}`
}

// --- Annonces par SIREN ---

export async function getAnnoncesBySiren(siren: string): Promise<AnnonceBodacc[]> {
  if (!siren || siren.length < 9) {
    console.warn(TAG, 'SIREN invalide:', siren)
    return []
  }

  // Normaliser SIREN (9 chiffres)
  const sirenClean = siren.replace(/\s/g, '').substring(0, 9)
  const key = cacheKey('siren', sirenClean)

  // Check cache
  try {
    const { cacheGet } = await import('./upstash')
    const cached = await cacheGet<AnnonceBodacc[]>(key)
    if (cached) {
      console.log(TAG, 'Cache hit:', sirenClean)
      return cached
    }
  } catch { /* Redis down */ }

  try {
    const params = new URLSearchParams({
      where: `numero_identification_rcs:"${sirenClean}"`,
      limit: '50',
      order_by: 'dateparution DESC',
    })

    const res = await fetch(`${API_BASE}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(TAG, `API error ${res.status}: ${await res.text()}`)
      return []
    }

    const json = await res.json()
    const records = json.results || []

    const annonces: AnnonceBodacc[] = records.map((r: any) => ({
      annonce_id: r.id || r.record_id || '',
      siren: r.numero_identification_rcs || sirenClean,
      denomination: r.denomination || r.personne_morale_denomination,
      type_annonce: r.fampilelleannonce || r.typeavis || r.type_annonce || 'Inconnue',
      contenu: r.contenu || r.jugement || r.descriptif,
      tribunal: r.tribunal || r.nomgreffeimmat,
      date_parution: r.dateparution,
    }))

    // Cache 24h
    try {
      const { cacheSet } = await import('./upstash')
      await cacheSet(key, annonces, CACHE_TTL)
    } catch { /* Silent */ }

    console.log(TAG, `${annonces.length} annonces trouvées pour SIREN ${sirenClean}`)
    return annonces
  } catch (err) {
    console.error(TAG, 'Fetch failed:', err)
    return []
  }
}

// --- Détection procédure collective ---

export async function checkProcedureCollective(siren: string): Promise<ProcedureCollective> {
  const negative: ProcedureCollective = { enProcedure: false }

  if (!siren || siren.length < 9) return negative

  const sirenClean = siren.replace(/\s/g, '').substring(0, 9)
  const key = cacheKey('procedure', sirenClean)

  // Check cache
  try {
    const { cacheGet } = await import('./upstash')
    const cached = await cacheGet<ProcedureCollective>(key)
    if (cached) {
      console.log(TAG, 'Procedure cache hit:', sirenClean)
      return cached
    }
  } catch { /* Redis down */ }

  const annonces = await getAnnoncesBySiren(sirenClean)

  // Mots-clés de procédures collectives
  const keywords = [
    'redressement judiciaire',
    'liquidation judiciaire',
    'sauvegarde',
    'plan de cession',
    'procédure collective',
    'mandat ad hoc',
    'conciliation',
  ]

  const procedureAnnonce = annonces.find(a => {
    const text = `${a.type_annonce} ${a.contenu || ''}`.toLowerCase()
    return keywords.some(kw => text.includes(kw))
  })

  const result: ProcedureCollective = procedureAnnonce
    ? {
        enProcedure: true,
        type: detectProcedureType(procedureAnnonce),
        date: procedureAnnonce.date_parution,
      }
    : negative

  // Cache 24h
  try {
    const { cacheSet } = await import('./upstash')
    await cacheSet(key, result, CACHE_TTL)
  } catch { /* Silent */ }

  if (result.enProcedure) {
    console.warn(TAG, `⚠ Procédure collective détectée pour ${sirenClean}: ${result.type}`)
  }

  return result
}

// --- Créations / Radiations par zone ---

export async function getCreationsRadiationsZone(
  departement: string,
  derniersMois: number = 6,
): Promise<CreationsRadiationsZone> {
  const empty: CreationsRadiationsZone = { creations: 0, radiations: 0, procedures: 0 }

  if (!departement) return empty

  const key = cacheKey('zone', departement, String(derniersMois))

  // Check cache
  try {
    const { cacheGet } = await import('./upstash')
    const cached = await cacheGet<CreationsRadiationsZone>(key)
    if (cached) {
      console.log(TAG, 'Zone cache hit:', departement)
      return cached
    }
  } catch { /* Redis down */ }

  try {
    const dateFrom = new Date()
    dateFrom.setMonth(dateFrom.getMonth() - derniersMois)
    const dateStr = dateFrom.toISOString().split('T')[0]

    // Requêtes en parallèle pour les 3 types
    const [creationsRes, radiationsRes, proceduresRes] = await Promise.all([
      fetchZoneCount(departement, dateStr, 'immatriculation'),
      fetchZoneCount(departement, dateStr, 'radiation'),
      fetchZoneCount(departement, dateStr, 'procédure collective'),
    ])

    const result: CreationsRadiationsZone = {
      creations: creationsRes,
      radiations: radiationsRes,
      procedures: proceduresRes,
    }

    // Cache 24h
    try {
      const { cacheSet } = await import('./upstash')
      await cacheSet(key, result, CACHE_TTL)
    } catch { /* Silent */ }

    console.log(TAG, `Zone ${departement} (${derniersMois}m): ${result.creations} créa, ${result.radiations} rad, ${result.procedures} proc`)
    return result
  } catch (err) {
    console.error(TAG, 'Zone fetch failed:', err)
    return empty
  }
}

// --- Helpers internes ---

async function fetchZoneCount(
  departement: string,
  dateFrom: string,
  typeAnnonce: string,
): Promise<number> {
  try {
    const params = new URLSearchParams({
      where: `departement_code:"${departement}" AND dateparution>="${dateFrom}" AND fampilelleannonce:"${typeAnnonce}"`,
      limit: '0',
    })

    const res = await fetch(`${API_BASE}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) return 0

    const json = await res.json()
    return json.total_count || 0
  } catch {
    return 0
  }
}

function detectProcedureType(annonce: AnnonceBodacc): string {
  const text = `${annonce.type_annonce} ${annonce.contenu || ''}`.toLowerCase()

  if (text.includes('liquidation judiciaire')) return 'Liquidation judiciaire'
  if (text.includes('redressement judiciaire')) return 'Redressement judiciaire'
  if (text.includes('sauvegarde')) return 'Procédure de sauvegarde'
  if (text.includes('plan de cession')) return 'Plan de cession'
  if (text.includes('mandat ad hoc')) return 'Mandat ad hoc'
  if (text.includes('conciliation')) return 'Conciliation'
  return 'Procédure collective'
}
