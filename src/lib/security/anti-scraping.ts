// ============================================================
// CRM DERMOTEC — Anti-Scraping & Data Exfiltration Protection
// ============================================================

interface RequestTracker {
  userId: string
  endpoint: string
  method: string
  count: number
  lastRequest: number
  windowStart: number
}

interface ExportAttempt {
  userId: string
  type: 'csv' | 'json' | 'pdf'
  timestamp: number
}

// Cache en mémoire pour tracker les patterns suspects
// En production, utiliser Redis pour persistance multi-instance
const REQUEST_CACHE = new Map<string, RequestTracker>()
const EXPORT_CACHE = new Map<string, ExportAttempt[]>()

// Constantes de sécurité
const RATE_LIMITS = {
  GET_REQUESTS_PER_5MIN: 50,          // Max 50 GET sur une même table en 5 min
  EXPORT_PER_HOUR: 1,                 // Max 1 export CSV/JSON/PDF par heure
  MAX_PAGINATION_SIZE: 100,           // Max 100 résultats par requête
  MAX_RESPONSE_SIZE_KB: 500,          // Alert si réponse > 500Ko
  WINDOW_5MIN: 5 * 60 * 1000,         // 5 minutes en ms
  WINDOW_1HOUR: 60 * 60 * 1000,       // 1 heure en ms
} as const

/**
 * Vérifie si une requête API est suspecte (scraping potentiel)
 */
export function checkAntiScraping(
  userId: string,
  endpoint: string,
  method: string
): { allowed: boolean; reason?: string } {
  const now = Date.now()
  const cacheKey = `${userId}:${endpoint}:${method}`

  // Seuls les GET sont trackés pour le scraping (lectures de données)
  if (method !== 'GET') {
    return { allowed: true }
  }

  const tracker = REQUEST_CACHE.get(cacheKey)

  if (!tracker) {
    // Première requête sur cet endpoint
    REQUEST_CACHE.set(cacheKey, {
      userId,
      endpoint,
      method,
      count: 1,
      lastRequest: now,
      windowStart: now,
    })
    return { allowed: true }
  }

  // Nettoyer la fenêtre glissante de 5 minutes
  if (now - tracker.windowStart > RATE_LIMITS.WINDOW_5MIN) {
    tracker.count = 1
    tracker.windowStart = now
    tracker.lastRequest = now
    return { allowed: true }
  }

  // Incrémenter le compteur
  tracker.count++
  tracker.lastRequest = now

  // Vérifier la limite de rate
  if (tracker.count > RATE_LIMITS.GET_REQUESTS_PER_5MIN) {
    return {
      allowed: false,
      reason: `Trop de requêtes GET sur ${endpoint} (${tracker.count}/${RATE_LIMITS.GET_REQUESTS_PER_5MIN} en 5min)`
    }
  }

  return { allowed: true }
}

/**
 * Force la pagination avec une limite maximale
 */
export function enforcePagination(query: URLSearchParams): { page: number; perPage: number } {
  const page = Math.max(1, parseInt(query.get('page') || '1'))
  const requestedPerPage = parseInt(query.get('perPage') || query.get('limit') || '20')

  // Forcer la limite maximale
  const perPage = Math.min(requestedPerPage, RATE_LIMITS.MAX_PAGINATION_SIZE)

  return { page, perPage }
}

/**
 * Log et contrôle les tentatives d'export de données
 * Retourne false si l'export doit être bloqué
 */
export async function logExportAttempt(
  userId: string,
  type: 'csv' | 'json' | 'pdf'
): Promise<boolean> {
  const now = Date.now()

  // Récupérer l'historique des exports pour cet utilisateur
  const userExports = EXPORT_CACHE.get(userId) || []

  // Nettoyer les exports de plus d'1 heure
  const recentExports = userExports.filter(
    attempt => now - attempt.timestamp < RATE_LIMITS.WINDOW_1HOUR
  )

  // Vérifier la limite d'exports par heure
  if (recentExports.length >= RATE_LIMITS.EXPORT_PER_HOUR) {
    // Log l'événement de sécurité
    await logSecurityEvent(userId, 'export_blocked', 'WARNING', {
      type,
      attempts_last_hour: recentExports.length,
      limit: RATE_LIMITS.EXPORT_PER_HOUR,
    })

    return false // Bloquer l'export
  }

  // Ajouter ce nouvel export à l'historique
  recentExports.push({ userId, type, timestamp: now })
  EXPORT_CACHE.set(userId, recentExports)

  // Log l'export autorisé
  await logSecurityEvent(userId, 'export_authorized', 'INFO', {
    type,
    attempts_last_hour: recentExports.length,
  })

  return true // Autoriser l'export
}

/**
 * Vérifie la taille de la réponse et alerte si suspecte
 */
export function checkResponseSize(responseBody: string, userId: string, endpoint: string): boolean {
  const sizeKB = new Blob([responseBody]).size / 1024

  if (sizeKB > RATE_LIMITS.MAX_RESPONSE_SIZE_KB) {
    // Log asynchrone pour ne pas bloquer la réponse
    logSecurityEvent(userId, 'large_response_detected', 'WARNING', {
      endpoint,
      size_kb: Math.round(sizeKB),
      limit_kb: RATE_LIMITS.MAX_RESPONSE_SIZE_KB,
    }).catch(console.error)

    return false // Réponse suspecte
  }

  return true // Taille normale
}

/**
 * Nettoie le cache périodiquement (à appeler via cron ou interval)
 */
export function cleanupCache(): void {
  const now = Date.now()

  // Nettoyer REQUEST_CACHE
  for (const [key, tracker] of REQUEST_CACHE.entries()) {
    if (now - tracker.lastRequest > RATE_LIMITS.WINDOW_5MIN) {
      REQUEST_CACHE.delete(key)
    }
  }

  // Nettoyer EXPORT_CACHE
  for (const [userId, exports] of EXPORT_CACHE.entries()) {
    const recentExports = exports.filter(
      attempt => now - attempt.timestamp < RATE_LIMITS.WINDOW_1HOUR
    )

    if (recentExports.length === 0) {
      EXPORT_CACHE.delete(userId)
    } else {
      EXPORT_CACHE.set(userId, recentExports)
    }
  }
}

/**
 * Statistiques du cache pour monitoring
 */
export function getCacheStats(): {
  request_trackers: number
  export_trackers: number
  total_memory_kb: number
} {
  const memoryUsage = JSON.stringify([...REQUEST_CACHE.entries(), ...EXPORT_CACHE.entries()])

  return {
    request_trackers: REQUEST_CACHE.size,
    export_trackers: EXPORT_CACHE.size,
    total_memory_kb: Math.round(new Blob([memoryUsage]).size / 1024),
  }
}

/**
 * Log un événement de sécurité dans Supabase
 */
async function logSecurityEvent(
  userId: string,
  eventType: string,
  severity: 'INFO' | 'WARNING' | 'CRITICAL',
  metadata: Record<string, unknown>,
  ip?: string,
  userAgent?: string,
  endpoint?: string
): Promise<void> {
  try {
    // En mode développement, juste un console.log
    if (process.env.NODE_ENV === 'development') {
      console.log('🚨 Security Event:', {
        userId,
        eventType,
        severity,
        metadata,
        timestamp: new Date().toISOString(),
      })
      return
    }

    // En production, insérer dans la table security_events
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured for security logging')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    await supabase
      .from('security_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        severity,
        ip_address: ip,
        user_agent: userAgent,
        endpoint,
        metadata,
      })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}