// ============================================================
// CRM DERMOTEC — Multi-Layer Cache Architecture
// L1: Upstash Redis | L2: In-memory (process-level)
// Patterns: cache-aside, stale-while-revalidate, tag-based invalidation
// ============================================================

import { cacheGet, cacheSet, cacheDelete } from './upstash'

// --- L2: Process-level in-memory cache (pour Next.js Edge/Serverless) ---
const memoryCache = new Map<string, { value: unknown; expires: number; staleUntil: number }>()
const MAX_MEMORY_ENTRIES = 500

function pruneMemoryCache() {
  if (memoryCache.size <= MAX_MEMORY_ENTRIES) return
  const now = Date.now()
  for (const [key, entry] of memoryCache) {
    if (now > entry.staleUntil) memoryCache.delete(key)
  }
  // Si toujours trop gros, supprimer les plus vieux
  if (memoryCache.size > MAX_MEMORY_ENTRIES) {
    const entries = [...memoryCache.entries()]
    entries.sort((a, b) => a[1].expires - b[1].expires)
    const toDelete = entries.slice(0, entries.length - MAX_MEMORY_ENTRIES)
    for (const [key] of toDelete) memoryCache.delete(key)
  }
}

// --- Cache Keys Registry (centralise tous les patterns de cles) ---
export const CacheKeys = {
  // Dashboard
  dashboardKpis: () => 'crm:dashboard:kpis',
  dashboardFunnel: () => 'crm:dashboard:funnel',
  dashboardCaMensuel: () => 'crm:dashboard:ca-mensuel',
  dashboardFormations: () => 'crm:dashboard:formations',

  // Leads
  leadDetail: (id: string) => `crm:lead:${id}`,
  leadsList: (page: number, filters?: string) => `crm:leads:list:${page}:${filters || 'all'}`,
  leadsKanban: () => 'crm:leads:kanban',
  leadsCount: () => 'crm:leads:count',

  // Sessions
  sessionDetail: (id: string) => `crm:session:${id}`,
  sessionsList: () => 'crm:sessions:list',
  sessionsUpcoming: () => 'crm:sessions:upcoming',

  // Formations (quasi-statiques)
  formationsList: () => 'crm:formations:list',
  formationDetail: (slug: string) => `crm:formation:${slug}`,

  // Equipe
  equipeList: () => 'crm:equipe:list',
  equipeMember: (id: string) => `crm:equipe:${id}`,

  // Financements
  financementsList: () => 'crm:financements:list',

  // Auth session
  userSession: (userId: string) => `crm:auth:session:${userId}`,
  userPermissions: (userId: string) => `crm:auth:perms:${userId}`,
} as const

// --- TTL Presets (en secondes) ---
export const CacheTTL = {
  /** Donnees quasi-statiques (formations, equipe) — 1h */
  STATIC: 3600,
  /** Dashboard KPIs — 5 min */
  DASHBOARD: 300,
  /** Listes paginées — 2 min */
  LIST: 120,
  /** Detail d'un record — 5 min */
  DETAIL: 300,
  /** Session auth — 15 min */
  AUTH_SESSION: 900,
  /** Stale window pour SWR — 30 min apres expiry */
  STALE_WINDOW: 1800,
} as const

// --- Types ---
interface CacheOptions {
  ttl?: number
  staleWindow?: number // duree pendant laquelle on accepte du stale
  tags?: string[] // pour invalidation groupee
  skipMemory?: boolean // ne pas utiliser le cache memoire L2
}

interface CacheEntry<T> {
  data: T
  cachedAt: number
  tags?: string[]
}

// --- Tag registry (pour invalidation groupee) ---
const tagToKeys = new Map<string, Set<string>>()

function registerTags(key: string, tags: string[]) {
  for (const tag of tags) {
    if (!tagToKeys.has(tag)) tagToKeys.set(tag, new Set())
    tagToKeys.get(tag)!.add(key)
  }
}

// --- Core Cache Functions ---

/**
 * Cache multi-couche avec SWR (stale-while-revalidate)
 *
 * Flow:
 * 1. Check L2 (memory) — instant
 * 2. Check L1 (Redis) — ~1ms
 * 3. Execute fn() — variable
 * 4. Store result in L1 + L2
 *
 * Si le cache est "stale" mais dans la fenetre SWR,
 * retourne le stale ET revalide en arriere-plan.
 */
export async function cacheSWR<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const {
    ttl = CacheTTL.DASHBOARD,
    staleWindow = CacheTTL.STALE_WINDOW,
    tags = [],
    skipMemory = false,
  } = options

  const now = Date.now()

  // --- L2: Memory check ---
  if (!skipMemory) {
    const memEntry = memoryCache.get(key)
    if (memEntry) {
      if (now < memEntry.expires) {
        // Fresh from memory
        return memEntry.value as T
      }
      if (now < memEntry.staleUntil) {
        // Stale but acceptable — return stale, revalidate in background
        revalidateInBackground(key, fn, { ttl, staleWindow, tags })
        return memEntry.value as T
      }
      // Expired beyond stale window
      memoryCache.delete(key)
    }
  }

  // --- L1: Redis check ---
  try {
    const cached = await cacheGet<CacheEntry<T>>(key)
    if (cached) {
      const age = now - cached.cachedAt
      const isStale = age > ttl * 1000
      const isBeyondStale = age > (ttl + staleWindow) * 1000

      if (!isStale) {
        // Fresh — store in L2 too
        if (!skipMemory) {
          memoryCache.set(key, {
            value: cached.data,
            expires: cached.cachedAt + ttl * 1000,
            staleUntil: cached.cachedAt + (ttl + staleWindow) * 1000,
          })
          pruneMemoryCache()
        }
        return cached.data
      }

      if (!isBeyondStale) {
        // Stale but in SWR window — return stale, revalidate
        revalidateInBackground(key, fn, { ttl, staleWindow, tags })
        return cached.data
      }
    }
  } catch {
    // Redis down — continue to fetch
  }

  // --- Cache miss: execute fn ---
  const result = await fn()

  // Store in both layers
  const entry: CacheEntry<T> = {
    data: result,
    cachedAt: now,
    tags,
  }

  if (!skipMemory) {
    memoryCache.set(key, {
      value: result,
      expires: now + ttl * 1000,
      staleUntil: now + (ttl + staleWindow) * 1000,
    })
    pruneMemoryCache()
  }

  // Redis write (non-blocking)
  cacheSet(key, entry, ttl + staleWindow).catch(() => {})

  if (tags.length > 0) registerTags(key, tags)

  return result
}

/**
 * Revalidate a cache entry in the background (fire and forget)
 */
function revalidateInBackground<T>(
  key: string,
  fn: () => Promise<T>,
  options: { ttl: number; staleWindow: number; tags: string[] }
) {
  // Use a lock to prevent multiple concurrent revalidations
  const lockKey = `_revalidating:${key}`
  if (memoryCache.has(lockKey)) return

  memoryCache.set(lockKey, { value: true, expires: Date.now() + 10_000, staleUntil: Date.now() + 10_000 })

  fn()
    .then((result) => {
      const now = Date.now()
      const entry: CacheEntry<T> = { data: result, cachedAt: now, tags: options.tags }

      memoryCache.set(key, {
        value: result,
        expires: now + options.ttl * 1000,
        staleUntil: now + (options.ttl + options.staleWindow) * 1000,
      })

      cacheSet(key, entry, options.ttl + options.staleWindow).catch(() => {})
    })
    .catch((err) => {
      console.warn(`[Cache] Background revalidation failed for ${key}:`, err)
    })
    .finally(() => {
      memoryCache.delete(lockKey)
    })
}

// --- Invalidation ---

/**
 * Invalider une cle specifique (L1 + L2)
 */
export async function invalidate(key: string): Promise<void> {
  memoryCache.delete(key)
  await cacheDelete(key).catch(() => {})
}

/**
 * Invalider toutes les cles associees a un tag
 * Ex: invalidateByTag('leads') invalide toutes les listes et details de leads
 */
export async function invalidateByTag(tag: string): Promise<void> {
  const keys = tagToKeys.get(tag)
  if (!keys) return

  const promises: Promise<void>[] = []
  for (const key of keys) {
    memoryCache.delete(key)
    promises.push(cacheDelete(key).catch(() => {}))
  }
  await Promise.all(promises)
  tagToKeys.delete(tag)
}

/**
 * Invalider un pattern de cles (utilise le prefix)
 */
export async function invalidatePattern(prefix: string): Promise<void> {
  // L2: Memory
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key)
  }

  // L1: Redis — Upstash ne supporte pas SCAN, donc on invalide par cles connues
  // Pour les patterns, on s'appuie sur les tags
}

// --- Pre-built invalidation functions for CRM entities ---

export async function invalidateLeadCache(leadId?: string): Promise<void> {
  // Toujours invalider les listes et le kanban
  await Promise.all([
    invalidate(CacheKeys.leadsKanban()),
    invalidate(CacheKeys.leadsCount()),
    invalidateByTag('leads-list'),
    invalidate(CacheKeys.dashboardKpis()),
    invalidate(CacheKeys.dashboardFunnel()),
  ])

  if (leadId) {
    await invalidate(CacheKeys.leadDetail(leadId))
  }
}

export async function invalidateSessionCache(sessionId?: string): Promise<void> {
  await Promise.all([
    invalidate(CacheKeys.sessionsList()),
    invalidate(CacheKeys.sessionsUpcoming()),
    invalidate(CacheKeys.dashboardKpis()),
  ])

  if (sessionId) {
    await invalidate(CacheKeys.sessionDetail(sessionId))
  }
}

export async function invalidateFinancementCache(): Promise<void> {
  await Promise.all([
    invalidate(CacheKeys.financementsList()),
    invalidate(CacheKeys.dashboardKpis()),
  ])
}

export async function invalidateFormationCache(): Promise<void> {
  await Promise.all([
    invalidate(CacheKeys.formationsList()),
    invalidateByTag('formations'),
  ])
}
