import 'server-only'
// ============================================================
// CRM DERMOTEC — Enrichissement RNCP/RS (France Competences)
// Verification eligibilite CPF des certifications
// API data.gouv.fr (open data) + fallback scraping France Competences
// Cache 7 jours (donnees stables), timeout 15s, silent fallback
// ============================================================

import type { EnrichmentResult } from './enrichment'
import { FORMATIONS_SEED } from './constants'

// ── Types ────────────────────────────────────────────────────

export interface CertificationRNCP {
  code: string // "RNCP12345" ou "RS6789"
  type: 'rncp' | 'rs'
  intitule: string
  niveau?: string // "Niveau 3", "Niveau 5", etc.
  nsf_code?: string
  nsf_libelle?: string
  actif: boolean
  date_fin_validite?: string
  certificateurs?: string[]
  eligible_cpf: boolean
  eligible_apprentissage?: boolean
  url_fiche?: string
}

export interface FormationCertification {
  formation_id: string
  formation_nom: string
  code_rncp?: string
  code_rs?: string
  eligible_cpf: boolean
  certification_active: boolean
}

// ── Constantes ───────────────────────────────────────────────

const DATA_GOUV_DATASET_URL =
  'https://www.data.gouv.fr/api/1/datasets/repertoire-national-des-certifications-professionnelles-et-repertoire-specifique/'

const FRANCE_COMPETENCES_RNCP_URL = 'https://www.francecompetences.fr/recherche/rncp'
const FRANCE_COMPETENCES_RS_URL = 'https://www.francecompetences.fr/recherche/rs'

const BRIGHTDATA_API_URL = 'https://api.brightdata.com/request'

const CACHE_TTL = 7 * 24 * 3600 // 7 jours — les certifications changent rarement
const TIMEOUT_MS = 15_000
const LOG_PREFIX = '[RNCP]'

// Mapping formations Dermotec → codes RNCP/RS connus
// Source : France Competences, verifies manuellement
const FORMATIONS_RNCP_MAP: Record<string, { rncp?: string; rs?: string }> = {
  'hygiene-salubrite':              { rs: 'RS6516' },
  'maquillage-permanent':           { rs: 'RS5858' },
  'microblading':                   { rs: 'RS5858' },
  'full-lips':                      { rs: 'RS5858' },
  'tricopigmentation':              { rs: 'RS5858' },
  'areole-cicatrices':              { rs: 'RS5858' },
  'nanoneedling':                   {},
  'soin-allin1':                    {},
  'peeling-dermaplaning':           {},
  'detatouage':                     {},
  'epilation-definitive':           {},
  'masterclass-hfs':                {},
  'blanchiment-dentaire':           {},
  'brow-lift-rehaussement':         {},
  'extension-cils-volume-russe':    {},
  'fil-collagene':                  {},
  'drainage-lymphatique':           {},
  'hifu':                           {},
  'lifting-colombien':              {},
  'lipo-radiofrequence-lipolaser':  {},
  'maderotherapie':                 {},
}

// ── Helpers ──────────────────────────────────────────────────

function log(..._args: unknown[]) {
  // Debug logging disabled in production
}

function warn(...args: unknown[]) {
  console.warn(LOG_PREFIX, ...args)
}

function parseCodeType(code: string): { type: 'rncp' | 'rs'; numero: string } | null {
  const clean = code.trim().toUpperCase()
  const matchRncp = clean.match(/^RNCP\s*(\d+)$/)
  if (matchRncp) return { type: 'rncp', numero: matchRncp[1] }
  const matchRs = clean.match(/^RS\s*(\d+)$/)
  if (matchRs) return { type: 'rs', numero: matchRs[1] }
  return null
}

function normalizeCode(code: string): string {
  const parsed = parseCodeType(code)
  if (!parsed) return code.trim().toUpperCase()
  return `${parsed.type === 'rncp' ? 'RNCP' : 'RS'}${parsed.numero}`
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
  } catch { /* Redis down — silent */ }

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
  } catch { /* DB down — silent */ }

  return null
}

async function setCache(key: string, value: unknown): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL * 1000).toISOString()

  // L1: Redis
  try {
    const { cacheSet } = await import('./upstash')
    await cacheSet(key, value, CACHE_TTL)
  } catch { /* Silent */ }

  // L2: DB
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase() as any
    await supabase.from('enrichment_cache').upsert({
      cache_key: key,
      provider: 'rncp',
      data: value,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' })
  } catch { /* Silent */ }
}

// ── Appel protege avec cache ─────────────────────────────────

async function cachedFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
): Promise<EnrichmentResult<T>> {
  const fullKey = `enrichment:rncp:${cacheKey}`

  // Cache check
  const cached = await getCached<T>(fullKey)
  if (cached) {
    return { success: true, data: cached, cached: true, credits_consumed: 0, provider: 'rncp' }
  }

  // Appel
  const start = Date.now()
  try {
    const data = await fetcher()
    await setCache(fullKey, data)

    const latency = Date.now() - start
    log(`OK en ${latency}ms`)

    return { success: true, data, cached: false, credits_consumed: 0, provider: 'rncp' }
  } catch (err) {
    const latency = Date.now() - start
    const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
    warn('Erreur', errorMsg, `(${latency}ms)`)

    return { success: false, cached: false, credits_consumed: 0, provider: 'rncp', error: errorMsg }
  }
}

// ── data.gouv.fr — Recuperation dataset RNCP/RS ─────────────

interface DataGouvResource {
  id: string
  title: string
  url: string
  format: string
  last_modified: string
}

async function getDataGouvResources(): Promise<DataGouvResource[]> {
  const res = await fetch(DATA_GOUV_DATASET_URL, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`data.gouv.fr API ${res.status}`)
  }

  const dataset = await res.json()
  return (dataset.resources || []).map((r: any) => ({
    id: r.id || '',
    title: r.title || '',
    url: r.url || '',
    format: (r.format || '').toLowerCase(),
    last_modified: r.last_modified || '',
  }))
}

function findBestResource(resources: DataGouvResource[], type: 'rncp' | 'rs'): DataGouvResource | null {
  const keyword = type === 'rncp' ? 'rncp' : 'repertoire-specifique'
  const keywordAlt = type === 'rncp' ? 'rncp' : 'rs'

  // Prefer JSON/CSV
  const preferred = ['json', 'csv']
  for (const fmt of preferred) {
    const match = resources.find(
      (r) =>
        r.format === fmt &&
        (r.title.toLowerCase().includes(keyword) || r.title.toLowerCase().includes(keywordAlt) || r.url.toLowerCase().includes(keyword))
    )
    if (match) return match
  }

  // Fallback : any matching resource
  return resources.find(
    (r) => r.title.toLowerCase().includes(keyword) || r.title.toLowerCase().includes(keywordAlt)
  ) || null
}

// ── Parser CSV RNCP/RS ───────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ';' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else if (char === ',' && !inQuotes && fields.length === 0 && !line.includes(';')) {
      // Fallback: comma separator if no semicolons found
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current.trim())
  return fields
}

function mapCSVToCertification(headers: string[], values: string[], type: 'rncp' | 'rs'): CertificationRNCP | null {
  const get = (name: string): string => {
    const idx = headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()))
    return idx >= 0 ? (values[idx] || '').trim() : ''
  }

  const numero = get('numero_fiche') || get('code') || get('numero')
  const intitule = get('intitule') || get('libelle') || get('nom')

  if (!numero && !intitule) return null

  const codePrefix = type === 'rncp' ? 'RNCP' : 'RS'
  const code = numero.toUpperCase().startsWith(codePrefix)
    ? numero.toUpperCase()
    : `${codePrefix}${numero.replace(/\D/g, '')}`

  const statut = get('statut') || get('etat') || get('actif')
  const actif = /actif|active|valide|en vigueur/i.test(statut) || statut === ''

  const dateFinStr = get('date_fin_validite') || get('date_fin') || get('date_echeance')

  const niveauRaw = get('nomenclature_europe') || get('niveau') || get('niveau_de_qualification')
  const niveau = niveauRaw ? `Niveau ${niveauRaw.replace(/[^0-9]/g, '')}` : undefined

  const certificateursRaw = get('certificateurs') || get('certificateur')
  const certificateurs = certificateursRaw
    ? certificateursRaw.split(/[;|]/).map((c) => c.trim()).filter(Boolean)
    : undefined

  const eligibleCpf = actif && !!code
  const eligibleApprentissage = /oui|true|1/i.test(get('apprentissage') || '')

  return {
    code,
    type,
    intitule,
    niveau: niveau && niveau !== 'Niveau ' ? niveau : undefined,
    nsf_code: get('nsf_code') || get('code_nsf') || undefined,
    nsf_libelle: get('nsf_libelle') || get('libelle_nsf') || get('formacode_libelle') || undefined,
    actif,
    date_fin_validite: dateFinStr || undefined,
    certificateurs,
    eligible_cpf: eligibleCpf,
    eligible_apprentissage: eligibleApprentissage || undefined,
    url_fiche: type === 'rncp'
      ? `${FRANCE_COMPETENCES_RNCP_URL}/${numero.replace(/\D/g, '')}/`
      : `${FRANCE_COMPETENCES_RS_URL}/${numero.replace(/\D/g, '')}/`,
  }
}

async function fetchAndParseDataset(type: 'rncp' | 'rs'): Promise<CertificationRNCP[]> {
  const resources = await getDataGouvResources()
  const resource = findBestResource(resources, type)

  if (!resource) {
    throw new Error(`Aucune resource ${type.toUpperCase()} trouvee sur data.gouv.fr`)
  }

  log(`Telechargement ${type.toUpperCase()} depuis ${resource.format}: ${resource.url.slice(0, 100)}...`)

  const res = await fetch(resource.url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: '*/*' },
  })

  if (!res.ok) {
    throw new Error(`Telechargement echoue: ${res.status}`)
  }

  if (resource.format === 'json') {
    const json = await res.json()
    const items = Array.isArray(json) ? json : json.data || json.results || []
    return items
      .map((item: any) => mapJSONToCertification(item, type))
      .filter((c: CertificationRNCP | null): c is CertificationRNCP => c !== null)
  }

  // CSV parsing
  const text = await res.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim())

  if (lines.length < 2) {
    throw new Error(`Fichier CSV ${type.toUpperCase()} vide ou invalide`)
  }

  const headers = parseCSVLine(lines[0])
  const certifications: CertificationRNCP[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const cert = mapCSVToCertification(headers, values, type)
    if (cert) certifications.push(cert)
  }

  log(`Parse ${type.toUpperCase()}: ${certifications.length} certifications`)
  return certifications
}

function mapJSONToCertification(raw: Record<string, any>, type: 'rncp' | 'rs'): CertificationRNCP | null {
  const code = raw.numero_fiche || raw.code || raw.numero || ''
  const intitule = raw.intitule || raw.libelle || raw.nom || ''

  if (!code && !intitule) return null

  const codePrefix = type === 'rncp' ? 'RNCP' : 'RS'
  const normalizedCode = String(code).toUpperCase().startsWith(codePrefix)
    ? String(code).toUpperCase()
    : `${codePrefix}${String(code).replace(/\D/g, '')}`

  const statut = raw.statut || raw.etat || ''
  const actif = /actif|active|valide|en vigueur/i.test(String(statut)) || statut === ''

  const niveauRaw = raw.nomenclature_europe || raw.niveau || raw.niveau_de_qualification || ''
  const niveauClean = String(niveauRaw).replace(/[^0-9]/g, '')
  const niveau = niveauClean ? `Niveau ${niveauClean}` : undefined

  const certificateurs = raw.certificateurs
    ? (Array.isArray(raw.certificateurs)
      ? raw.certificateurs.map((c: any) => c.nom || c.certificateur_libelle || String(c))
      : String(raw.certificateurs).split(/[;|]/).map((c: string) => c.trim())
    ).filter(Boolean)
    : undefined

  return {
    code: normalizedCode,
    type,
    intitule: String(intitule),
    niveau,
    nsf_code: raw.nsf_code || raw.code_nsf || undefined,
    nsf_libelle: raw.nsf_libelle || raw.libelle_nsf || raw.formacode_libelle || undefined,
    actif,
    date_fin_validite: raw.date_fin_validite || raw.date_fin || raw.date_echeance || undefined,
    certificateurs,
    eligible_cpf: actif,
    eligible_apprentissage: raw.apprentissage === 'Oui' || raw.apprentissage === true || undefined,
    url_fiche: type === 'rncp'
      ? `${FRANCE_COMPETENCES_RNCP_URL}/${String(code).replace(/\D/g, '')}/`
      : `${FRANCE_COMPETENCES_RS_URL}/${String(code).replace(/\D/g, '')}/`,
  }
}

// ── Fallback scraping France Competences ─────────────────────

async function scrapeFranceCompetences(code: string): Promise<CertificationRNCP | null> {
  const parsed = parseCodeType(code)
  if (!parsed) return null

  const url = parsed.type === 'rncp'
    ? `${FRANCE_COMPETENCES_RNCP_URL}/${parsed.numero}/`
    : `${FRANCE_COMPETENCES_RS_URL}/${parsed.numero}/`

  log(`Scraping France Competences: ${url}`)

  // Essayer Bright Data si disponible
  const apiKey = process.env.BRIGHTDATA_API_KEY
  let html: string

  if (apiKey) {
    try {
      const res = await fetch(BRIGHTDATA_API_URL, {
        method: 'POST',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          zone: 'web_unlocker1',
          url,
          format: 'raw',
        }),
      })

      if (!res.ok) throw new Error(`Bright Data ${res.status}`)
      html = await res.text()
    } catch (err) {
      warn('Bright Data fallback echoue, tentative directe', err instanceof Error ? err.message : '')
      html = await fetchDirectHTML(url)
    }
  } else {
    html = await fetchDirectHTML(url)
  }

  return parseHTMLCertification(html, code, parsed.type)
}

async function fetchDirectHTML(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DermotecCRM/1.0)',
      Accept: 'text/html',
    },
  })

  if (!res.ok) {
    throw new Error(`France Competences ${res.status}`)
  }

  return res.text()
}

function parseHTMLCertification(html: string, code: string, type: 'rncp' | 'rs'): CertificationRNCP | null {
  if (!html || html.length < 200) return null

  // Extraire le titre de la fiche
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/) ||
    html.match(/<title>([^<]+)<\/title>/)
  const intitule = titleMatch
    ? titleMatch[1].replace(/\s*[-|].*$/, '').trim()
    : ''

  if (!intitule) return null

  // Statut actif/inactif
  const actif = /class="[^"]*actif[^"]*"/i.test(html) ||
    /statut[^>]*>.*?actif/i.test(html) ||
    !(/inactif|inactive|expire|expiree|perimee/i.test(html))

  // Niveau
  const niveauMatch = html.match(/Niveau\s*(\d)/i)
  const niveau = niveauMatch ? `Niveau ${niveauMatch[1]}` : undefined

  // Date fin validite
  const dateFinMatch = html.match(/date[^>]*fin[^>]*validit[^>]*>([^<]+)/i) ||
    html.match(/(\d{2}\/\d{2}\/\d{4})\s*<\//)
  const dateFin = dateFinMatch ? dateFinMatch[1].trim() : undefined

  // Certificateurs
  const certMatch = html.match(/certificateur[^>]*>([^<]+)/gi)
  const certificateurs = certMatch
    ? certMatch.map((m) => m.replace(/<[^>]+>/g, '').replace(/certificateur[^:]*:\s*/i, '').trim()).filter(Boolean)
    : undefined

  // NSF
  const nsfMatch = html.match(/NSF\s*(\d+)\s*[:\s]*([^<\n]+)/i)
  const nsfCode = nsfMatch ? nsfMatch[1] : undefined
  const nsfLibelle = nsfMatch ? nsfMatch[2].trim() : undefined

  // Eligible CPF
  const eligibleCpf = actif && (
    /eligible.*cpf|cpf.*eligible|france.*comp[eé]tences/i.test(html) ||
    !/non.*[eé]ligible.*cpf/i.test(html)
  )

  const parsed = parseCodeType(code)
  const numero = parsed?.numero || code.replace(/\D/g, '')

  return {
    code: normalizeCode(code),
    type,
    intitule,
    niveau,
    nsf_code: nsfCode,
    nsf_libelle: nsfLibelle,
    actif,
    date_fin_validite: dateFin,
    certificateurs,
    eligible_cpf: eligibleCpf,
    url_fiche: type === 'rncp'
      ? `${FRANCE_COMPETENCES_RNCP_URL}/${numero}/`
      : `${FRANCE_COMPETENCES_RS_URL}/${numero}/`,
  }
}

// ── Index en memoire (lazy init) ─────────────────────────────

let indexRNCP: Map<string, CertificationRNCP> | null = null
let indexRS: Map<string, CertificationRNCP> | null = null
let indexLoadedAt: number | null = null
let indexLoadPromise: Promise<void> | null = null

const INDEX_MAX_AGE = CACHE_TTL * 1000

async function ensureIndexLoaded(): Promise<void> {
  // Deja charge et frais
  if (indexRNCP && indexRS && indexLoadedAt && Date.now() - indexLoadedAt < INDEX_MAX_AGE) {
    return
  }

  // Eviter les chargements paralleles
  if (indexLoadPromise) {
    await indexLoadPromise
    return
  }

  indexLoadPromise = loadIndex()
  try {
    await indexLoadPromise
  } finally {
    indexLoadPromise = null
  }
}

async function loadIndex(): Promise<void> {
  log('Chargement index RNCP/RS depuis data.gouv.fr...')

  const newRNCP = new Map<string, CertificationRNCP>()
  const newRS = new Map<string, CertificationRNCP>()

  // Charger RNCP
  try {
    const certs = await fetchAndParseDataset('rncp')
    for (const cert of certs) {
      newRNCP.set(cert.code.toUpperCase(), cert)
    }
    log(`Index RNCP: ${newRNCP.size} certifications`)
  } catch (err) {
    warn('Echec chargement RNCP:', err instanceof Error ? err.message : 'Erreur inconnue')
  }

  // Charger RS
  try {
    const certs = await fetchAndParseDataset('rs')
    for (const cert of certs) {
      newRS.set(cert.code.toUpperCase(), cert)
    }
    log(`Index RS: ${newRS.size} certifications`)
  } catch (err) {
    warn('Echec chargement RS:', err instanceof Error ? err.message : 'Erreur inconnue')
  }

  // Meme si un seul a reussi, on met a jour
  if (newRNCP.size > 0 || newRS.size > 0) {
    indexRNCP = newRNCP.size > 0 ? newRNCP : indexRNCP || new Map()
    indexRS = newRS.size > 0 ? newRS : indexRS || new Map()
    indexLoadedAt = Date.now()
  } else if (!indexRNCP) {
    // Premier chargement echoue — init vide pour eviter retry en boucle
    indexRNCP = new Map()
    indexRS = new Map()
    indexLoadedAt = Date.now()
    warn('Index vide — les recherches utiliseront le fallback scraping')
  }
}

// ============================================================
// 1. searchCertifications — Recherche par mot-cle
// ============================================================

export async function searchCertifications(
  keyword: string,
  type?: 'rncp' | 'rs',
): Promise<EnrichmentResult<CertificationRNCP[]>> {
  if (!keyword || keyword.trim().length < 2) {
    return { success: false, cached: false, credits_consumed: 0, provider: 'rncp', error: 'Mot-cle trop court (min 2 caracteres)' }
  }

  const safeKeyword = keyword.trim().toLowerCase()
  const cacheKey = `search:${safeKeyword}:${type || 'all'}`

  return cachedFetch<CertificationRNCP[]>(cacheKey, async () => {
    await ensureIndexLoaded()

    const results: CertificationRNCP[] = []
    const searchIn = (index: Map<string, CertificationRNCP>) => {
      for (const cert of index.values()) {
        const haystack = [
          cert.intitule,
          cert.nsf_libelle || '',
          cert.code,
          ...(cert.certificateurs || []),
        ].join(' ').toLowerCase()

        if (haystack.includes(safeKeyword)) {
          results.push(cert)
        }
      }
    }

    if (type !== 'rs' && indexRNCP) searchIn(indexRNCP)
    if (type !== 'rncp' && indexRS) searchIn(indexRS)

    // Trier : actifs d'abord, puis par pertinence (intitule match > nsf match)
    results.sort((a, b) => {
      if (a.actif !== b.actif) return a.actif ? -1 : 1
      const aTitle = a.intitule.toLowerCase().includes(safeKeyword) ? 0 : 1
      const bTitle = b.intitule.toLowerCase().includes(safeKeyword) ? 0 : 1
      return aTitle - bTitle
    })

    log(`Recherche "${keyword}": ${results.length} resultats`)
    return results.slice(0, 100) // Limiter a 100 resultats
  })
}

// ============================================================
// 2. getCertificationByCode — Par code RNCP/RS
// ============================================================

export async function getCertificationByCode(
  code: string,
): Promise<EnrichmentResult<CertificationRNCP | null>> {
  if (!code || code.trim().length < 3) {
    return { success: false, cached: false, credits_consumed: 0, provider: 'rncp', error: 'Code invalide' }
  }

  const normalized = normalizeCode(code)
  const cacheKey = `code:${normalized}`

  return cachedFetch<CertificationRNCP | null>(cacheKey, async () => {
    // D'abord chercher dans l'index
    await ensureIndexLoaded()

    const parsed = parseCodeType(normalized)
    if (parsed) {
      const index = parsed.type === 'rncp' ? indexRNCP : indexRS
      const found = index?.get(normalized.toUpperCase())
      if (found) {
        log(`Trouve dans index: ${normalized}`)
        return found
      }
    }

    // Fallback : scraping France Competences
    log(`Pas dans l'index, fallback scraping: ${normalized}`)
    const scraped = await scrapeFranceCompetences(normalized)
    return scraped
  })
}

// ============================================================
// 3. verifierEligibiliteCPF — Eligibilite CPF d'un code
// ============================================================

export async function verifierEligibiliteCPF(
  codeRNCP: string,
): Promise<EnrichmentResult<{ eligible: boolean; details?: string }>> {
  if (!codeRNCP || codeRNCP.trim().length < 3) {
    return { success: false, cached: false, credits_consumed: 0, provider: 'rncp', error: 'Code RNCP/RS invalide' }
  }

  const normalized = normalizeCode(codeRNCP)
  const cacheKey = `cpf:${normalized}`

  return cachedFetch<{ eligible: boolean; details?: string }>(cacheKey, async () => {
    const result = await getCertificationByCode(normalized)

    if (!result.success || !result.data) {
      return {
        eligible: false,
        details: `Certification ${normalized} introuvable dans le repertoire France Competences.`,
      }
    }

    const cert = result.data

    // Verifier date de fin
    let expiree = false
    if (cert.date_fin_validite) {
      try {
        const dateFin = new Date(cert.date_fin_validite.split('/').reverse().join('-'))
        expiree = dateFin < new Date()
      } catch { /* Format non standard — on ignore */ }
    }

    if (!cert.actif || expiree) {
      return {
        eligible: false,
        details: `Certification ${normalized} "${cert.intitule}" — statut inactif${expiree ? ', date de validite depassee' : ''}. Non eligible CPF.`,
      }
    }

    if (cert.eligible_cpf) {
      const parts = [`Certification ${normalized} "${cert.intitule}" — ELIGIBLE CPF.`]
      if (cert.niveau) parts.push(`${cert.niveau}.`)
      if (cert.certificateurs?.length) parts.push(`Certificateur(s): ${cert.certificateurs.join(', ')}.`)
      if (cert.date_fin_validite) parts.push(`Valide jusqu'au ${cert.date_fin_validite}.`)

      return { eligible: true, details: parts.join(' ') }
    }

    return {
      eligible: false,
      details: `Certification ${normalized} "${cert.intitule}" — enregistree mais eligibilite CPF non confirmee.`,
    }
  })
}

// ============================================================
// 4. mapFormationsToCertifications — Mapping formations Dermotec
// ============================================================

export async function mapFormationsToCertifications(): Promise<EnrichmentResult<FormationCertification[]>> {
  const cacheKey = 'mapping:dermotec'

  return cachedFetch<FormationCertification[]>(cacheKey, async () => {
    const results: FormationCertification[] = []

    for (const formation of FORMATIONS_SEED) {
      const mapping = FORMATIONS_RNCP_MAP[formation.slug]
      const codeRncp = mapping?.rncp
      const codeRs = mapping?.rs

      let eligibleCpf = false
      let certificationActive = false

      // Verifier le code RNCP ou RS si connu
      const codeToCheck = codeRncp || codeRs
      if (codeToCheck) {
        try {
          const result = await getCertificationByCode(codeToCheck)
          if (result.success && result.data) {
            eligibleCpf = result.data.eligible_cpf
            certificationActive = result.data.actif
          }
        } catch {
          warn(`Verification echouee pour ${formation.slug} (${codeToCheck})`)
        }
      }

      results.push({
        formation_id: formation.slug,
        formation_nom: formation.nom,
        code_rncp: codeRncp,
        code_rs: codeRs,
        eligible_cpf: eligibleCpf,
        certification_active: certificationActive,
      })
    }

    log(`Mapping Dermotec: ${results.length} formations, ${results.filter((r) => r.eligible_cpf).length} eligibles CPF`)
    return results
  })
}
