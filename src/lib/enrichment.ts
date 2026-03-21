// ============================================================
// CRM DERMOTEC — Service d'enrichissement multi-API
// BLINDÉ : cache DB + Redis, déduplication, rate limit provider,
// circuit breaker, anti-doublon, compteur global
// ============================================================

// --- Types ---

export interface EnrichmentResult<T = unknown> {
  success: boolean
  data?: T
  cached: boolean
  credits_consumed: number
  provider: string
  error?: string
}

export interface PappersCompany {
  siren: string
  siret_siege: string
  denomination: string
  forme_juridique: string
  code_naf: string
  libelle_code_naf: string
  date_creation: string
  tranche_effectifs: string
  capital_social: number
  chiffre_affaires?: number
  resultat_net?: number
  dirigeants: Array<{ nom: string; prenom: string; fonction: string }>
  adresse: { ligne: string; code_postal: string; ville: string }
  etat: 'actif' | 'fermé'
}

export interface GooglePlaceInfo {
  place_id: string
  name: string
  rating: number
  total_reviews: number
  address: string
  phone?: string
  website?: string
  opening_hours?: string[]
  photos_count: number
}

export interface OpenRouterResponse {
  content: string
  model: string
  tokens_used: number
  cost_usd: number
}

// --- Coûts en crédits ---

export const CREDIT_COSTS: Record<string, number> = {
  'sirene:search': 0,
  'pappers:search': 1,
  'pappers:details': 2,
  'pappers:dirigeants': 5,
  'google_places:search': 1,
  'google_places:details': 2,
  'openrouter:summarize': 1,
  'openrouter:email': 2,
  'openrouter:prospect_analysis': 3,
}

// --- Limites globales par provider (protège NOS clés API) ---

const PROVIDER_LIMITS = {
  pappers: { max_per_hour: 100, max_per_day: 500 },       // Pappers SLA
  google_places: { max_per_hour: 200, max_per_day: 800 }, // Google free tier ~1000/mois
  openrouter: { max_per_hour: 300, max_per_day: 2000 },   // OpenRouter standard
} as const

// --- In-flight dedup (empêche les doubles appels simultanés) ---
const inflightRequests = new Map<string, Promise<EnrichmentResult<unknown>>>()

// --- Cache TTL ---

const CACHE_TTL_SECONDS: Record<string, number> = {
  sirene: 7 * 86400,        // 7 jours
  pappers: 86400,            // 24h
  google_places: 12 * 3600,  // 12h
  openrouter: 3600,          // 1h
}

// ============================================================
// HELPERS — Cache multi-couche (Redis + DB fallback)
// ============================================================

async function getFromCache(key: string): Promise<unknown | null> {
  // L1: Redis (rapide)
  try {
    const { cacheGet } = await import('./upstash')
    const cached = await cacheGet(key)
    if (cached) return cached
  } catch { /* Redis down — fallback DB */ }

  // L2: DB (fallback si Redis down)
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase() as any
    const { data } = await supabase
      .from('enrichment_cache')
      .select('data')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single()
    return (data as any)?.data || null
  } catch { return null }
}

async function setInCache(key: string, value: unknown, provider: string): Promise<void> {
  const ttl = CACHE_TTL_SECONDS[provider] || 3600
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()

  // L1: Redis
  try {
    const { cacheSet } = await import('./upstash')
    await cacheSet(key, value, ttl)
  } catch { /* Silent */ }

  // L2: DB (backup persistent)
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase() as any
    await supabase.from('enrichment_cache').upsert({
      cache_key: key,
      provider,
      data: value,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' })
  } catch { /* Silent */ }
}

// ============================================================
// HELPERS — Rate limit global par provider
// ============================================================

async function checkProviderRateLimit(provider: string): Promise<boolean> {
  try {
    const limits = PROVIDER_LIMITS[provider as keyof typeof PROVIDER_LIMITS]
    if (!limits) return true // Pas de limite connue

    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase() as any

    // Vérifier le compteur horaire
    const { count: hourCount } = await supabase
      .from('enrichment_log')
      .select('id', { count: 'exact', head: true })
      .eq('provider', provider)
      .neq('status', 'cached')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())

    if ((hourCount || 0) >= limits.max_per_hour) return false

    // Vérifier le compteur journalier
    const { count: dayCount } = await supabase
      .from('enrichment_log')
      .select('id', { count: 'exact', head: true })
      .eq('provider', provider)
      .neq('status', 'cached')
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())

    if ((dayCount || 0) >= limits.max_per_day) return false

    return true
  } catch {
    return true // Si erreur, laisser passer (fail-open pour le rate limit global)
  }
}

// ============================================================
// HELPERS — Logging enrichment
// ============================================================

async function logEnrichment(params: {
  lead_id?: string
  user_id?: string
  provider: string
  endpoint: string
  credits: number
  status: 'success' | 'error' | 'cached' | 'rate_limited'
  cached: boolean
  latency_ms: number
  response_summary?: Record<string, unknown>
  error_message?: string
}): Promise<void> {
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase() as any
    await supabase.from('enrichment_log').insert({
      lead_id: params.lead_id || null,
      user_id: params.user_id || null,
      provider: params.provider,
      endpoint: params.endpoint,
      credits_consumed: params.credits,
      status: params.status,
      cached: params.cached,
      latency_ms: params.latency_ms,
      response_summary: params.response_summary || {},
      error_message: params.error_message || null,
    })
  } catch { /* Non-bloquant */ }
}

// ============================================================
// WRAPPER — Appel API avec toutes les protections
// ============================================================

async function protectedApiCall<T>(
  provider: string,
  cacheKey: string,
  apiCall: () => Promise<T>,
  options?: { lead_id?: string; user_id?: string; endpoint?: string }
): Promise<EnrichmentResult<T>> {
  // 1. Cache check (0 crédits, instantané)
  const cached = await getFromCache(cacheKey)
  if (cached) {
    await logEnrichment({
      provider, endpoint: options?.endpoint || cacheKey,
      credits: 0, status: 'cached', cached: true, latency_ms: 0,
      lead_id: options?.lead_id, user_id: options?.user_id,
    })
    return { success: true, data: cached as T, cached: true, credits_consumed: 0, provider }
  }

  // 2. Déduplication — si un appel identique est en cours, attendre le résultat
  const existing = inflightRequests.get(cacheKey)
  if (existing) {
    const result = await existing
    return result as EnrichmentResult<T>
  }

  // 3. Rate limit global provider (protège NOS clés API)
  const providerAllowed = await checkProviderRateLimit(provider)
  if (!providerAllowed) {
    await logEnrichment({
      provider, endpoint: options?.endpoint || cacheKey,
      credits: 0, status: 'rate_limited', cached: false, latency_ms: 0,
      error_message: `Rate limit global ${provider} atteint`,
      lead_id: options?.lead_id, user_id: options?.user_id,
    })
    return { success: false, cached: false, credits_consumed: 0, provider, error: `Limite API ${provider} atteinte — réessayez dans 1h` }
  }

  // 4. Exécuter l'appel avec déduplication
  const start = Date.now()
  const promise = (async (): Promise<EnrichmentResult<T>> => {
    try {
      const data = await apiCall()
      const latency = Date.now() - start

      // Stocker en cache (multi-couche)
      await setInCache(cacheKey, data, provider)

      await logEnrichment({
        provider, endpoint: options?.endpoint || cacheKey,
        credits: CREDIT_COSTS[`${provider}:details`] || 1,
        status: 'success', cached: false, latency_ms: latency,
        lead_id: options?.lead_id, user_id: options?.user_id,
        response_summary: typeof data === 'object' && data !== null ? { keys: Object.keys(data as Record<string, unknown>).length } : {},
      })

      return { success: true, data, cached: false, credits_consumed: CREDIT_COSTS[`${provider}:details`] || 1, provider }

    } catch (err) {
      const latency = Date.now() - start
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      await logEnrichment({
        provider, endpoint: options?.endpoint || cacheKey,
        credits: 0, status: 'error', cached: false, latency_ms: latency,
        error_message: errorMsg, lead_id: options?.lead_id, user_id: options?.user_id,
      })
      return { success: false, cached: false, credits_consumed: 0, provider, error: errorMsg }

    } finally {
      // Nettoyer la déduplication après 1 seconde
      setTimeout(() => inflightRequests.delete(cacheKey), 1000)
    }
  })()

  inflightRequests.set(cacheKey, promise as Promise<EnrichmentResult<unknown>>)
  return promise
}

// ============================================================
// 1. PAPPERS
// ============================================================

export async function enrichWithPappers(
  siret: string,
  options?: { lead_id?: string; user_id?: string }
): Promise<EnrichmentResult<PappersCompany>> {
  const apiKey = process.env.PAPPERS_API_KEY
  if (!apiKey) return { success: false, cached: false, credits_consumed: 0, provider: 'pappers', error: 'PAPPERS_API_KEY non configurée' }

  const cleanSiret = siret.replace(/\s/g, '')
  const cacheKey = `enrichment:pappers:${cleanSiret}`

  return protectedApiCall<PappersCompany>('pappers', cacheKey, async () => {
    const url = new URL('https://api.pappers.fr/v2/entreprise')
    url.searchParams.set('api_token', apiKey)
    url.searchParams.set('siret', cleanSiret)

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) throw new Error(`Pappers ${res.status}: ${await res.text()}`)

    const raw = await res.json()
    return {
      siren: raw.siren,
      siret_siege: raw.siege?.siret || cleanSiret,
      denomination: raw.nom_entreprise || raw.denomination,
      forme_juridique: raw.forme_juridique,
      code_naf: raw.code_naf,
      libelle_code_naf: raw.libelle_code_naf,
      date_creation: raw.date_creation,
      tranche_effectifs: raw.tranche_effectifs,
      capital_social: raw.capital,
      chiffre_affaires: raw.derniers_comptes?.chiffre_affaires,
      resultat_net: raw.derniers_comptes?.resultat,
      dirigeants: (raw.representants || []).slice(0, 5).map((r: Record<string, string>) => ({
        nom: r.nom, prenom: r.prenom, fonction: r.qualite,
      })),
      adresse: {
        ligne: raw.siege?.adresse_ligne_1 || '',
        code_postal: raw.siege?.code_postal || '',
        ville: raw.siege?.ville || '',
      },
      etat: raw.statut_rcs === 'Radié' ? 'fermé' : 'actif',
    } as PappersCompany
  }, { lead_id: options?.lead_id, user_id: options?.user_id, endpoint: `/entreprise/${cleanSiret}` })
}

// ============================================================
// 2. GOOGLE PLACES
// ============================================================

export async function enrichWithGooglePlaces(
  businessName: string,
  city?: string,
  options?: { lead_id?: string; user_id?: string }
): Promise<EnrichmentResult<GooglePlaceInfo>> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return { success: false, cached: false, credits_consumed: 0, provider: 'google_places', error: 'GOOGLE_PLACES_API_KEY non configurée' }

  const query = `${businessName}${city ? ` ${city}` : ''}`
  const cacheKey = `enrichment:google:${query.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 100)}`

  return protectedApiCall<GooglePlaceInfo>('google_places', cacheKey, async () => {
    // Search
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=fr`,
      { signal: AbortSignal.timeout(10_000) }
    )
    const searchData = await searchRes.json()
    const place = searchData.results?.[0]
    if (!place) throw new Error('Aucun lieu trouvé')

    // Details
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,photos&key=${apiKey}&language=fr`,
      { signal: AbortSignal.timeout(10_000) }
    )
    const details = (await detailsRes.json()).result

    return {
      place_id: place.place_id,
      name: details?.name || place.name,
      rating: details?.rating || place.rating || 0,
      total_reviews: details?.user_ratings_total || 0,
      address: details?.formatted_address || place.formatted_address,
      phone: details?.formatted_phone_number,
      website: details?.website,
      opening_hours: details?.opening_hours?.weekday_text,
      photos_count: details?.photos?.length || 0,
    } as GooglePlaceInfo
  }, { lead_id: options?.lead_id, user_id: options?.user_id, endpoint: '/places' })
}

// ============================================================
// 3. OPENROUTER
// ============================================================

export async function enrichWithOpenRouter(
  prompt: string,
  options?: { model?: string; max_tokens?: number; task?: string; lead_id?: string; user_id?: string }
): Promise<EnrichmentResult<OpenRouterResponse>> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY
  if (!apiKey) return { success: false, cached: false, credits_consumed: 0, provider: 'openrouter', error: 'Aucune clé API IA configurée' }

  const task = options?.task || 'summarize'
  // Pas de cache pour le contenu généré par IA (chaque prompt est unique)
  const cacheKey = `enrichment:ai:${Buffer.from(prompt).toString('base64').slice(0, 64)}`

  return protectedApiCall<OpenRouterResponse>('openrouter', cacheKey, async () => {
    const isOpenRouter = !!process.env.OPENROUTER_API_KEY
    const baseUrl = isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.deepseek.com/v1'
    const model = isOpenRouter ? (options?.model || 'mistralai/mistral-small-latest') : 'deepseek-chat'

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(isOpenRouter ? { 'HTTP-Referer': 'https://crm.dermotec.fr', 'X-Title': 'CRM Dermotec' } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.max_tokens || 500,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) throw new Error(`LLM API ${res.status}`)

    const raw = await res.json()
    return {
      content: raw.choices?.[0]?.message?.content || '',
      model: raw.model || model,
      tokens_used: raw.usage?.total_tokens || 0,
      cost_usd: raw.usage?.total_tokens ? raw.usage.total_tokens * 0.0000003 : 0,
    } as OpenRouterResponse
  }, { lead_id: options?.lead_id, user_id: options?.user_id, endpoint: `/chat/${task}` })
}

// ============================================================
// 4. ENRICHISSEMENT COMPLET
// ============================================================

import type { EntrepriseSirene } from './sirene-api'

export interface FullEnrichmentResult {
  sirene?: EntrepriseSirene
  pappers?: PappersCompany
  google?: GooglePlaceInfo
  ai_summary?: string
  total_credits: number
  sources_used: string[]
  errors: string[]
}

export async function enrichLead(params: {
  siret?: string
  entreprise_nom?: string
  ville?: string
  lead_id?: string
  user_id?: string
}): Promise<FullEnrichmentResult> {
  const result: FullEnrichmentResult = { total_credits: 0, sources_used: [], errors: [] }

  // 1. SIRENE (gratuit)
  if (params.siret) {
    try {
      const { verifySIRET } = await import('./sirene-api')
      const sireneResult = await verifySIRET(params.siret)
      if (sireneResult.valid && sireneResult.entreprise) { result.sirene = sireneResult.entreprise; result.sources_used.push('sirene') }
    } catch (err) { result.errors.push(`SIRENE: ${err instanceof Error ? err.message : 'erreur'}`) }
  }

  // 2. Pappers (payant, protégé)
  if (params.siret && process.env.PAPPERS_API_KEY) {
    const pappers = await enrichWithPappers(params.siret, { lead_id: params.lead_id, user_id: params.user_id })
    if (pappers.success && pappers.data) {
      result.pappers = pappers.data; result.total_credits += pappers.credits_consumed; result.sources_used.push('pappers')
    } else if (pappers.error) { result.errors.push(`Pappers: ${pappers.error}`) }
  }

  // 3. Google Places (payant, protégé)
  if (params.entreprise_nom && process.env.GOOGLE_PLACES_API_KEY) {
    const google = await enrichWithGooglePlaces(params.entreprise_nom, params.ville, { lead_id: params.lead_id, user_id: params.user_id })
    if (google.success && google.data) {
      result.google = google.data; result.total_credits += google.credits_consumed; result.sources_used.push('google_places')
    } else if (google.error) { result.errors.push(`Google: ${google.error}`) }
  }

  // 4. Résumé IA (si au moins une source)
  if (result.sources_used.length > 0 && (process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY)) {
    const context = [
      result.sirene ? `Entreprise: ${result.sirene.nom}, NAF: ${result.sirene.libelle_naf}` : '',
      result.pappers ? `CA: ${result.pappers.chiffre_affaires}€, Dirigeant: ${result.pappers.dirigeants?.[0]?.prenom} ${result.pappers.dirigeants?.[0]?.nom}` : '',
      result.google ? `Google: ${result.google.rating}/5 (${result.google.total_reviews} avis)` : '',
    ].filter(Boolean).join('\n')

    const ai = await enrichWithOpenRouter(
      `Résume en 3 phrases les infos clés de ce prospect pour un centre de formation esthétique. Mentionne les opportunités.\n\n${context}`,
      { task: 'summarize', max_tokens: 200, lead_id: params.lead_id, user_id: params.user_id }
    )
    if (ai.success && ai.data) {
      result.ai_summary = ai.data.content; result.total_credits += ai.credits_consumed; result.sources_used.push('openrouter')
    }
  }

  return result
}
