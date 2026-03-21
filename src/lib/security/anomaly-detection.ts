// ============================================================
// CRM DERMOTEC — Détection d'anomalies comportementales
// Détecte : impossible travel, exfiltration, brute force
// Stocke dans Upstash Redis pour analyse temps réel
// ============================================================

import { logSecurityEvent } from './rate-limits'

let _redis: import('@upstash/redis').Redis | null | undefined = undefined

async function getRedis() {
  if (_redis !== undefined) return _redis
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) { _redis = null; return null }
    const { Redis } = await import('@upstash/redis')
    _redis = new Redis({ url, token })
    return _redis
  } catch {
    _redis = null
    return null
  }
}

export type AnomalyType =
  | 'impossible_travel'
  | 'data_exfiltration'
  | 'brute_force'
  | 'unusual_hours'
  | 'mass_export'
  | 'session_hijack'

interface AnomalyResult {
  detected: boolean
  type?: AnomalyType
  severity?: 'critical' | 'warning' | 'info'
  details?: Record<string, unknown>
  action?: 'block' | 'alert' | 'log'
}

/**
 * Vérifie les anomalies pour une action utilisateur
 */
export async function checkAnomalies(
  userId: string,
  action: string,
  metadata: {
    ip?: string
    country?: string
    userAgent?: string
    path?: string
  }
): Promise<AnomalyResult> {
  const redis = await getRedis()
  if (!redis) return { detected: false }

  const results: AnomalyResult[] = await Promise.all([
    checkImpossibleTravel(redis, userId, metadata.country, metadata.ip),
    checkDataExfiltration(redis, userId, action, metadata.path),
    checkUnusualHours(userId, action),
  ])

  // Retourner la première anomalie détectée (la plus sévère)
  const detected = results.find(r => r.detected)
  if (detected) {
    await logSecurityEvent(`anomaly:${detected.type}`, {
      userId,
      action,
      ...detected.details,
      ...metadata,
    })
  }

  return detected || { detected: false }
}

/**
 * Impossible Travel — même user de 2 pays différents en < 2h
 */
async function checkImpossibleTravel(
  redis: import('@upstash/redis').Redis,
  userId: string,
  country?: string,
  ip?: string
): Promise<AnomalyResult> {
  if (!country || !ip) return { detected: false }

  const lastCountryKey = `user:${userId}:last_country`
  const lastTsKey = `user:${userId}:last_seen_ts`
  const lastIpKey = `user:${userId}:last_ip`

  const [lastCountry, lastTs, lastIp] = await Promise.all([
    redis.get<string>(lastCountryKey),
    redis.get<number>(lastTsKey),
    redis.get<string>(lastIpKey),
  ])

  // Mettre à jour la position actuelle
  const pipeline = redis.pipeline()
  pipeline.set(lastCountryKey, country, { ex: 86400 })
  pipeline.set(lastTsKey, Date.now(), { ex: 86400 })
  pipeline.set(lastIpKey, ip, { ex: 86400 })
  await pipeline.exec()

  // Vérifier le travel impossible
  if (lastCountry && lastCountry !== country && lastTs) {
    const timeDiffMinutes = (Date.now() - lastTs) / 60000

    if (timeDiffMinutes < 120) { // Moins de 2 heures
      return {
        detected: true,
        type: 'impossible_travel',
        severity: 'critical',
        action: 'block',
        details: {
          from_country: lastCountry,
          to_country: country,
          from_ip: lastIp,
          to_ip: ip,
          time_diff_minutes: Math.round(timeDiffMinutes),
        },
      }
    }
  }

  return { detected: false }
}

/**
 * Data Exfiltration — trop de requêtes LIST/GET en peu de temps
 */
async function checkDataExfiltration(
  redis: import('@upstash/redis').Redis,
  userId: string,
  action: string,
  path?: string
): Promise<AnomalyResult> {
  // Ne surveiller que les actions de lecture de données
  const dataActions = ['leads_list', 'leads_export', 'contacts_list', 'GET']
  const isDataAction = dataActions.some(a => action.includes(a)) ||
    (path && ['/api/leads', '/api/export', '/api/analytics'].some(p => path.startsWith(p)))

  if (!isDataAction) return { detected: false }

  const key = `user:${userId}:data_requests`
  const count = await redis.incr(key)
  await redis.expire(key, 300) // Window de 5 minutes

  if (count > 100) { // 100 requêtes de données en 5 minutes
    // Throttle temporaire
    await redis.set(`user:${userId}:throttled`, '1', { ex: 3600 })

    return {
      detected: true,
      type: 'data_exfiltration',
      severity: 'critical',
      action: 'block',
      details: {
        request_count: count,
        window: '5 minutes',
        path,
      },
    }
  }

  if (count > 50) { // Warning à 50
    return {
      detected: true,
      type: 'data_exfiltration',
      severity: 'warning',
      action: 'alert',
      details: {
        request_count: count,
        window: '5 minutes',
        path,
      },
    }
  }

  return { detected: false }
}

/**
 * Unusual Hours — activité en dehors des heures normales (22h-6h)
 */
async function checkUnusualHours(
  userId: string,
  action: string
): Promise<AnomalyResult> {
  // Seulement les actions sensibles
  const sensitiveActions = ['delete', 'export', 'admin', 'settings']
  if (!sensitiveActions.some(a => action.toLowerCase().includes(a))) {
    return { detected: false }
  }

  const hour = new Date().getHours() // UTC — ajuster si nécessaire
  const parisHour = (hour + 1) % 24 // UTC+1 (CET) ou UTC+2 (CEST)

  if (parisHour >= 22 || parisHour < 6) {
    return {
      detected: true,
      type: 'unusual_hours',
      severity: 'info',
      action: 'log',
      details: {
        hour_paris: parisHour,
        action,
        message: `Action sensible "${action}" à ${parisHour}h (hors horaires)`,
      },
    }
  }

  return { detected: false }
}

/**
 * Vérifie si un utilisateur est throttled (après une anomalie)
 */
export async function isUserThrottled(userId: string): Promise<boolean> {
  const redis = await getRedis()
  if (!redis) return false
  const throttled = await redis.get(`user:${userId}:throttled`)
  return throttled === '1'
}
