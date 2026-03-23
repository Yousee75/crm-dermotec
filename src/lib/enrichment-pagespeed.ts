import 'server-only'
// ============================================================
// CRM DERMOTEC — Enrichissement Google PageSpeed Insights v5
// API: https://pagespeedonline.googleapis.com/pagespeedonline/v5
// Pattern: lazy init (skip si GOOGLE_API_KEY manquante), cache 24h, timeout 15s
// ============================================================

// --- Types ---

export interface PageSpeedResult {
  url: string
  strategy: string
  score: number // 0-100
  lcp_ms?: number
  fid_ms?: number
  cls?: number
  fcp_ms?: number
  ttfb_ms?: number
  si_ms?: number
  suggestions?: string[]
}

// --- Constants ---

const TAG = '[PageSpeed]'
const CACHE_TTL = 86400 // 24h
const TIMEOUT_MS = 15_000

const API_BASE = 'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed'

// --- Helpers ---

function isConfigured(): boolean {
  return !!process.env.GOOGLE_API_KEY
}

function cacheKey(url: string, strategy: string): string {
  // Normaliser l'URL pour la clé de cache
  const normalized = url.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  return `enrichment:pagespeed:${strategy}:${normalized}`
}

// --- Analyse PageSpeed ---

export async function analyzePageSpeed(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile',
): Promise<PageSpeedResult | null> {
  if (!isConfigured()) {
    console.warn(TAG, 'GOOGLE_API_KEY manquante — skip')
    return null
  }

  if (!url || !isValidUrl(url)) {
    console.warn(TAG, 'URL invalide:', url)
    return null
  }

  // Normaliser l'URL
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
  const key = cacheKey(normalizedUrl, strategy)

  // Check cache
  try {
    const { cacheGet } = await import('./upstash')
    const cached = await cacheGet<PageSpeedResult>(key)
    if (cached) {
      return cached
    }
  } catch { /* Redis down */ }

  try {
    const params = new URLSearchParams({
      url: normalizedUrl,
      strategy,
      category: 'performance',
      key: process.env.GOOGLE_API_KEY!,
    })

    const res = await fetch(`${API_BASE}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(TAG, `API error ${res.status}: ${await res.text()}`)
      return null
    }

    const json = await res.json()

    const lighthouse = json.lighthouseResult
    if (!lighthouse) {
      console.error(TAG, 'Pas de lighthouseResult dans la réponse')
      return null
    }

    const audits = lighthouse.audits || {}
    const categories = lighthouse.categories || {}

    // Extraire les suggestions des audits échoués
    const suggestions: string[] = []
    const opportunityAudits = [
      'render-blocking-resources',
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'uses-optimized-images',
      'uses-responsive-images',
      'efficient-animated-content',
      'uses-text-compression',
      'uses-long-cache-ttl',
      'dom-size',
      'redirects',
      'preload-lcp-image',
      'server-response-time',
    ]

    for (const auditId of opportunityAudits) {
      const audit = audits[auditId]
      if (audit && audit.score !== null && audit.score < 0.9 && audit.title) {
        suggestions.push(audit.title)
      }
    }

    const result: PageSpeedResult = {
      url: normalizedUrl,
      strategy,
      score: Math.round((categories.performance?.score || 0) * 100),
      lcp_ms: getMetricMs(audits, 'largest-contentful-paint'),
      fid_ms: getMetricMs(audits, 'max-potential-fid'),
      cls: getMetricValue(audits, 'cumulative-layout-shift'),
      fcp_ms: getMetricMs(audits, 'first-contentful-paint'),
      ttfb_ms: getMetricMs(audits, 'server-response-time'),
      si_ms: getMetricMs(audits, 'speed-index'),
      suggestions: suggestions.slice(0, 10), // Max 10 suggestions
    }

    // Cache 24h
    try {
      const { cacheSet } = await import('./upstash')
      await cacheSet(key, result, CACHE_TTL)
    } catch { /* Silent */ }

    return result
  } catch (err) {
    console.error(TAG, 'Analyse failed:', err)
    return null
  }
}

// --- Score maturité digitale ---

export async function getDigitalMaturityScore(url: string): Promise<number> {
  if (!isConfigured() || !url) return 0

  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
  const key = `enrichment:pagespeed:maturity:${normalizedUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`

  // Check cache
  try {
    const { cacheGet } = await import('./upstash')
    const cached = await cacheGet<number>(key)
    if (cached !== null && cached !== undefined) {
      return cached
    }
  } catch { /* Redis down */ }

  // Lancer mobile + desktop en parallèle
  const [mobile, desktop] = await Promise.all([
    analyzePageSpeed(normalizedUrl, 'mobile'),
    analyzePageSpeed(normalizedUrl, 'desktop'),
  ])

  if (!mobile && !desktop) return 0

  // Score pondéré : mobile 60% + desktop 40% (Google indexe mobile-first)
  const mobileScore = mobile?.score || 0
  const desktopScore = desktop?.score || 0

  let score: number
  if (mobile && desktop) {
    score = Math.round(mobileScore * 0.6 + desktopScore * 0.4)
  } else {
    score = mobile?.score || desktop?.score || 0
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score))

  // Cache 24h
  try {
    const { cacheSet } = await import('./upstash')
    await cacheSet(key, score, CACHE_TTL)
  } catch { /* Silent */ }

  return score
}

// --- Helpers internes ---

function getMetricMs(audits: Record<string, any>, auditId: string): number | undefined {
  const audit = audits[auditId]
  if (!audit || audit.numericValue === undefined) return undefined
  return Math.round(audit.numericValue)
}

function getMetricValue(audits: Record<string, any>, auditId: string): number | undefined {
  const audit = audits[auditId]
  if (!audit || audit.numericValue === undefined) return undefined
  return Math.round(audit.numericValue * 1000) / 1000
}

function isValidUrl(url: string): boolean {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    new URL(normalized)
    return true
  } catch {
    return false
  }
}
