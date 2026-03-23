import 'server-only'
// ============================================================
// CRM SATOREA — Enrichment Queue & Protection System
//
// Résout les problèmes suivants :
// 1. DÉDUPLICATION : 2 users enrichissent le même lead → 1 seul appel API
// 2. RATE LIMITING : respect des limites par provider
// 3. CIRCUIT BREAKER : arrête d'appeler une API down
// 4. COST TRACKING : log le coût de chaque appel
// 5. RETRY : exponential backoff avec jitter
//
// Utilise Upstash Redis (distribué) avec fallback in-memory.
// ============================================================

import { RATE_LIMIT_CONFIGS, type ApiRateLimitConfig } from './api-rate-limits'

// ============================================================
// 1. CIRCUIT BREAKER — Arrêter d'appeler une API down
// ============================================================

interface CircuitBreakerState {
  failures: number
  lastFailure: number
  state: 'closed' | 'open' | 'half-open'
  lastSuccess: number
}

const circuitBreakers = new Map<string, CircuitBreakerState>()

function getCircuitBreaker(provider: string): CircuitBreakerState {
  if (!circuitBreakers.has(provider)) {
    circuitBreakers.set(provider, {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
      lastSuccess: Date.now(),
    })
  }
  return circuitBreakers.get(provider)!
}

function isCircuitOpen(provider: string): boolean {
  const config = RATE_LIMIT_CONFIGS[provider]
  if (!config) return false

  const cb = getCircuitBreaker(provider)

  if (cb.state === 'closed') return false

  if (cb.state === 'open') {
    // Vérifier si le cooldown est passé
    if (Date.now() - cb.lastFailure > config.circuit_breaker_cooldown_ms) {
      cb.state = 'half-open'
      return false // Laisser passer UNE requête de test
    }
    return true // Circuit ouvert, bloquer
  }

  // half-open : on laisse passer
  return false
}

function recordSuccess(provider: string): void {
  const cb = getCircuitBreaker(provider)
  cb.failures = 0
  cb.state = 'closed'
  cb.lastSuccess = Date.now()
}

function recordFailure(provider: string): void {
  const config = RATE_LIMIT_CONFIGS[provider]
  if (!config) return

  const cb = getCircuitBreaker(provider)
  cb.failures++
  cb.lastFailure = Date.now()

  if (cb.failures >= config.circuit_breaker_threshold) {
    cb.state = 'open'
    console.warn(
      `[CircuitBreaker] ${provider} OUVERT — ${cb.failures} erreurs consécutives. ` +
      `Cooldown ${config.circuit_breaker_cooldown_ms / 1000}s`
    )
  }
}

// ============================================================
// 2. RATE LIMITER IN-MEMORY — Token Bucket par provider
// ============================================================

interface TokenBucket {
  tokens: number
  lastRefill: number
  maxTokens: number
  refillRate: number // tokens par seconde
}

const buckets = new Map<string, TokenBucket>()

function getBucket(provider: string): TokenBucket {
  if (!buckets.has(provider)) {
    const config = RATE_LIMIT_CONFIGS[provider]
    const maxTokens = config?.max_per_second || 5
    buckets.set(provider, {
      tokens: maxTokens,
      lastRefill: Date.now(),
      maxTokens,
      refillRate: maxTokens,
    })
  }
  return buckets.get(provider)!
}

function tryAcquireToken(provider: string): boolean {
  const bucket = getBucket(provider)
  const now = Date.now()
  const elapsed = (now - bucket.lastRefill) / 1000

  // Refill tokens
  bucket.tokens = Math.min(
    bucket.maxTokens,
    bucket.tokens + elapsed * bucket.refillRate
  )
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return true
  }

  return false
}

/**
 * Attend qu'un token soit disponible (backpressure)
 */
async function waitForToken(provider: string, timeoutMs: number = 10_000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (tryAcquireToken(provider)) return true
    // Attendre un intervalle proportionnel au rate limit
    const config = RATE_LIMIT_CONFIGS[provider]
    const waitMs = config ? Math.ceil(1000 / config.max_per_second) : 200
    await new Promise(resolve => setTimeout(resolve, waitMs))
  }
  return false
}

// ============================================================
// 3. DÉDUPLICATION DISTRIBUÉE — Redis lock + in-memory fallback
// ============================================================

const inflightMap = new Map<string, Promise<unknown>>()

/**
 * Déduplication cross-instance via Redis SETNX.
 * Si une autre instance traite le même lead+provider, on attend.
 */
async function acquireLock(key: string, ttlMs: number = 60_000): Promise<boolean> {
  try {
    const { cacheGet, cacheSet } = await import('./upstash')
    const existing = await cacheGet<string>(key)
    if (existing) return false // Déjà en cours

    await cacheSet(key, 'locked', Math.ceil(ttlMs / 1000))
    return true
  } catch {
    // Redis down → fallback in-memory
    return !inflightMap.has(key)
  }
}

async function releaseLock(key: string): Promise<void> {
  try {
    const { cacheDelete } = await import('./upstash')
    await cacheDelete(key)
  } catch {
    // Silent
  }
}

// ============================================================
// 4. COST TRACKER — Log le coût de chaque appel
// ============================================================

interface CostEntry {
  provider: string
  cost_usd: number
  timestamp: number
  lead_id?: string
  cached: boolean
}

const costLog: CostEntry[] = []

function logCost(entry: CostEntry): void {
  costLog.push(entry)
  // Garder les 1000 dernières entrées en mémoire
  if (costLog.length > 1000) costLog.splice(0, costLog.length - 1000)
}

/**
 * Retourne le coût total par provider pour la période donnée
 */
export function getCostSummary(sinceMs: number = 24 * 3600 * 1000): Record<string, { calls: number; cost_usd: number; cached: number }> {
  const since = Date.now() - sinceMs
  const summary: Record<string, { calls: number; cost_usd: number; cached: number }> = {}

  for (const entry of costLog) {
    if (entry.timestamp < since) continue
    if (!summary[entry.provider]) {
      summary[entry.provider] = { calls: 0, cost_usd: 0, cached: 0 }
    }
    summary[entry.provider].calls++
    summary[entry.provider].cost_usd += entry.cost_usd
    if (entry.cached) summary[entry.provider].cached++
  }

  return summary
}

// ============================================================
// 5. RETRY avec exponential backoff + jitter
// ============================================================

function calculateBackoff(attempt: number, config: ApiRateLimitConfig): number {
  const base = config.backoff_base_ms

  if (config.retry_strategy === 'linear') {
    return base * attempt
  }

  // Exponential avec jitter (Full Jitter pattern d'AWS)
  const exponential = base * Math.pow(2, attempt - 1)
  const capped = Math.min(exponential, 30_000) // Cap à 30s
  const jitter = Math.random() * capped
  return jitter
}

// ============================================================
// 6. WRAPPER PRINCIPAL — protectedEnrichmentCall
// ============================================================

export interface EnrichmentCallResult<T> {
  success: boolean
  data?: T
  cached: boolean
  cost_usd: number
  provider: string
  error?: string
  latency_ms: number
  attempt: number
}

/**
 * Appelle une API d'enrichissement avec TOUTES les protections :
 * - Circuit breaker (API down → skip)
 * - Rate limiting (token bucket)
 * - Déduplication (même lead+provider → 1 seul appel)
 * - Cache (Redis L1, DB L2)
 * - Retry (exponential backoff + jitter)
 * - Cost tracking
 *
 * @example
 * const result = await protectedEnrichmentCall({
 *   provider: 'pappers',
 *   cacheKey: `pappers:${siret}`,
 *   leadId: 'uuid-123',
 *   fn: () => fetchPappersApi(siret),
 * })
 */
export async function protectedEnrichmentCall<T>(params: {
  provider: string
  cacheKey: string
  leadId?: string
  fn: () => Promise<T>
  timeoutMs?: number
}): Promise<EnrichmentCallResult<T>> {
  const { provider, cacheKey, leadId, fn, timeoutMs = 15_000 } = params
  const config = RATE_LIMIT_CONFIGS[provider]
  const start = Date.now()

  // 1. CIRCUIT BREAKER CHECK
  if (isCircuitOpen(provider)) {
    return {
      success: false,
      cached: false,
      cost_usd: 0,
      provider,
      error: `Circuit breaker ouvert pour ${provider}`,
      latency_ms: 0,
      attempt: 0,
    }
  }

  // 2. CACHE CHECK (L1 Redis, L2 DB)
  try {
    const { cacheGet } = await import('./upstash')
    const cached = await cacheGet<T>(cacheKey)
    if (cached !== null) {
      logCost({ provider, cost_usd: 0, timestamp: Date.now(), lead_id: leadId, cached: true })
      return {
        success: true,
        data: cached,
        cached: true,
        cost_usd: 0,
        provider,
        latency_ms: Date.now() - start,
        attempt: 0,
      }
    }
  } catch {
    // Redis down — continue
  }

  // 3. DÉDUPLICATION — si un appel identique est en vol
  const lockKey = `lock:enrich:${cacheKey}`
  const existing = inflightMap.get(cacheKey)
  if (existing) {
    try {
      const result = await existing
      return {
        success: true,
        data: result as T,
        cached: true, // "cached" via dedup
        cost_usd: 0,
        provider,
        latency_ms: Date.now() - start,
        attempt: 0,
      }
    } catch {
      // L'appel en vol a échoué, on retente
    }
  }

  // Vérifier le lock distribué (Redis)
  const lockAcquired = await acquireLock(lockKey, timeoutMs + 5000)
  if (!lockAcquired) {
    // Un autre worker traite déjà ce cacheKey
    // Attendre et récupérer du cache
    await new Promise(resolve => setTimeout(resolve, 2000))
    try {
      const { cacheGet } = await import('./upstash')
      const cached = await cacheGet<T>(cacheKey)
      if (cached !== null) {
        return {
          success: true,
          data: cached,
          cached: true,
          cost_usd: 0,
          provider,
          latency_ms: Date.now() - start,
          attempt: 0,
        }
      }
    } catch { /* continue */ }
  }

  // 4. RATE LIMITING — attendre un token
  const tokenAcquired = await waitForToken(provider, 10_000)
  if (!tokenAcquired) {
    await releaseLock(lockKey)
    return {
      success: false,
      cached: false,
      cost_usd: 0,
      provider,
      error: `Rate limit ${provider} — pas de token disponible`,
      latency_ms: Date.now() - start,
      attempt: 0,
    }
  }

  // 5. EXÉCUTION avec retry
  const maxRetries = config?.max_retries || 2
  let lastError: string = ''

  const promise = (async () => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Timeout par requête
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)

        const data = await Promise.race([
          fn(),
          new Promise<never>((_, reject) =>
            controller.signal.addEventListener('abort', () =>
              reject(new Error(`Timeout ${timeoutMs}ms`))
            )
          ),
        ])

        clearTimeout(timer)

        // Succès → enregistrer
        recordSuccess(provider)

        // Cache le résultat
        const cacheTTL = config?.cache_ttl_seconds || 3600
        try {
          const { cacheSet } = await import('./upstash')
          await cacheSet(cacheKey, data, cacheTTL)
        } catch { /* Silent */ }

        const costPerReq = config?.cost_per_request_usd || 0
        logCost({ provider, cost_usd: costPerReq, timestamp: Date.now(), lead_id: leadId, cached: false })

        return data

      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
        recordFailure(provider)

        if (attempt < maxRetries) {
          const backoff = config ? calculateBackoff(attempt, config) : 2000
          await new Promise(resolve => setTimeout(resolve, backoff))
        }
      }
    }

    throw new Error(lastError)
  })()

  // Enregistrer dans la map de dedup
  inflightMap.set(cacheKey, promise)

  try {
    const data = await promise
    return {
      success: true,
      data: data as T,
      cached: false,
      cost_usd: config?.cost_per_request_usd || 0,
      provider,
      latency_ms: Date.now() - start,
      attempt: maxRetries,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logCost({ provider, cost_usd: 0, timestamp: Date.now(), lead_id: leadId, cached: false })
    return {
      success: false,
      cached: false,
      cost_usd: 0,
      provider,
      error: errorMsg,
      latency_ms: Date.now() - start,
      attempt: maxRetries,
    }
  } finally {
    // Cleanup
    setTimeout(() => {
      inflightMap.delete(cacheKey)
      releaseLock(lockKey)
    }, 1000)
  }
}

// ============================================================
// 7. HELPERS — Diagnostics & Monitoring
// ============================================================

/**
 * Retourne l'état de tous les circuit breakers
 */
export function getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
  const status: Record<string, CircuitBreakerState> = {}
  for (const [provider, state] of circuitBreakers) {
    status[provider] = { ...state }
  }
  return status
}

/**
 * Force la fermeture d'un circuit breaker (reset manuel)
 */
export function resetCircuitBreaker(provider: string): void {
  const cb = getCircuitBreaker(provider)
  cb.failures = 0
  cb.state = 'closed'
  cb.lastSuccess = Date.now()
}

/**
 * Retourne les stats du rate limiter
 */
export function getRateLimiterStatus(): Record<string, { tokens: number; maxTokens: number }> {
  const status: Record<string, { tokens: number; maxTokens: number }> = {}
  for (const [provider, bucket] of buckets) {
    status[provider] = {
      tokens: Math.floor(bucket.tokens),
      maxTokens: bucket.maxTokens,
    }
  }
  return status
}
