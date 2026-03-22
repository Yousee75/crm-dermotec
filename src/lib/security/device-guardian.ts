import 'server-only'
// ============================================================
// CRM SATOREA — Device Guardian
// Système de surveillance des appareils et sessions
//
// - Device fingerprinting (empreinte navigateur unique)
// - IP whitelisting (appareils autorisés)
// - Impossible travel detection (2 connexions trop éloignées)
// - Session anomaly detection (heures bizarres, durées anormales)
// - Notification nouveaux appareils
// - Blocage automatique si comportement suspect
// ============================================================

import { createHmac, randomBytes } from 'crypto'

// ============================================================
// TYPES
// ============================================================

export interface DeviceInfo {
  fingerprint: string // Hash unique du navigateur (FingerprintJS)
  ip: string
  userAgent: string
  language?: string
  timezone?: string
  screenResolution?: string
  platform?: string
}

export interface SessionEvent {
  user_id: string
  device: DeviceInfo
  timestamp: number // Date.now()
  action: 'login' | 'api_call' | 'enrichment' | 'export' | 'admin_action'
  geo?: { lat: number; lng: number; city?: string; country?: string }
  risk_score?: number
  flags?: string[]
}

export interface ThreatAssessment {
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_score: number // 0-100
  flags: string[]
  action: 'allow' | 'challenge' | 'notify_admin' | 'block'
  details: string
}

export interface KnownDevice {
  fingerprint: string
  user_id: string
  name?: string // "MacBook Pro de Hayou"
  first_seen: string
  last_seen: string
  ip_addresses: string[]
  trusted: boolean
  login_count: number
}

// ============================================================
// CONFIGURATION — Seuils de détection
// ============================================================

const CONFIG = {
  // Heures de travail normales (UTC+1 Paris)
  WORK_HOURS_START: 7, // 7h du matin
  WORK_HOURS_END: 22, // 22h le soir

  // Impossible travel
  MAX_SPEED_KMH: 900, // Vitesse max réaliste (avion)
  MIN_TIME_BETWEEN_LOGINS_MS: 30_000, // 30 secondes minimum entre 2 logins

  // Sessions
  MAX_SESSION_DURATION_MS: 12 * 60 * 60 * 1000, // 12h max
  MAX_CONCURRENT_SESSIONS: 3, // Max 3 sessions simultanées
  MAX_API_CALLS_PER_MINUTE: 60, // Rate limit par user

  // Appareils
  MAX_DEVICES_PER_USER: 5, // Max 5 appareils différents
  NEW_DEVICE_GRACE_PERIOD_MS: 24 * 60 * 60 * 1000, // 24h pour valider un nouvel appareil

  // Enrichissement (le plus sensible)
  MAX_ENRICHMENT_CALLS_PER_HOUR: 50,
  MAX_EXPORT_CALLS_PER_DAY: 10,

  // Géo
  SUSPICIOUS_COUNTRIES: ['CN', 'RU', 'KP', 'IR'], // Pays à risque
} as const

// ============================================================
// HAVERSINE — Distance entre 2 points GPS
// ============================================================

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ============================================================
// IP GEOLOCATION (gratuit, via API publique)
// ============================================================

interface GeoIP {
  lat: number
  lng: number
  city?: string
  country?: string
  countryCode?: string
}

async function geolocateIP(ip: string): Promise<GeoIP | null> {
  // Skip les IPs locales
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
    return { lat: 48.8566, lng: 2.3522, city: 'Local', country: 'France', countryCode: 'FR' }
  }

  try {
    // API gratuite, 45 req/min (suffisant)
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon,city,country,countryCode`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      lat: data.lat,
      lng: data.lon,
      city: data.city,
      country: data.country,
      countryCode: data.countryCode,
    }
  } catch {
    return null
  }
}

// ============================================================
// DEVICE FINGERPRINT HASH (côté serveur)
// ============================================================

/** Crée un hash serveur du fingerprint + user agent pour renforcer l'unicité */
export function hashDeviceFingerprint(fingerprint: string, userAgent: string): string {
  const secret = process.env.DEVICE_HASH_SECRET || 'satorea-device-guardian-2026'
  return createHmac('sha256', secret)
    .update(`${fingerprint}:${userAgent}`)
    .digest('hex')
    .slice(0, 32) // 32 chars suffisent
}

// ============================================================
// THREAT ASSESSMENT — Évaluation du risque
// ============================================================

/**
 * Analyse complète d'une tentative de connexion ou d'action.
 * Retourne un score de risque (0-100) et l'action recommandée.
 */
export async function assessThreat(
  event: SessionEvent,
  history: SessionEvent[], // Historique des 30 derniers jours
  knownDevices: KnownDevice[]
): Promise<ThreatAssessment> {
  const flags: string[] = []
  let riskScore = 0

  // --------------------------------------------------------
  // 1. APPAREIL INCONNU
  // --------------------------------------------------------
  const deviceKnown = knownDevices.some(
    d => d.fingerprint === event.device.fingerprint && d.trusted
  )
  if (!deviceKnown) {
    const deviceExists = knownDevices.some(
      d => d.fingerprint === event.device.fingerprint
    )
    if (!deviceExists) {
      flags.push('NEW_DEVICE')
      riskScore += 25

      // Trop d'appareils différents ?
      if (knownDevices.length >= CONFIG.MAX_DEVICES_PER_USER) {
        flags.push('TOO_MANY_DEVICES')
        riskScore += 15
      }
    } else {
      flags.push('UNTRUSTED_DEVICE')
      riskScore += 10
    }
  }

  // --------------------------------------------------------
  // 2. IP INCONNUE
  // --------------------------------------------------------
  const knownIPs = new Set(knownDevices.flatMap(d => d.ip_addresses))
  if (!knownIPs.has(event.device.ip)) {
    flags.push('NEW_IP')
    riskScore += 15

    // Géolocaliser la nouvelle IP
    const geo = await geolocateIP(event.device.ip)
    if (geo) {
      event.geo = geo

      // Pays suspect ?
      if (geo.countryCode && (CONFIG.SUSPICIOUS_COUNTRIES as readonly string[]).includes(geo.countryCode)) {
        flags.push('SUSPICIOUS_COUNTRY')
        riskScore += 30
      }
    }
  }

  // --------------------------------------------------------
  // 3. IMPOSSIBLE TRAVEL
  // --------------------------------------------------------
  const recentLogins = history
    .filter(h => h.action === 'login' && h.geo)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)

  if (event.geo && recentLogins.length > 0) {
    const lastLogin = recentLogins[0]
    if (lastLogin.geo) {
      const distance = haversineKm(
        lastLogin.geo.lat, lastLogin.geo.lng,
        event.geo.lat, event.geo.lng
      )
      const timeDiffH = (event.timestamp - lastLogin.timestamp) / 3_600_000

      if (timeDiffH > 0 && distance > 50) { // Plus de 50km
        const speedKmh = distance / timeDiffH
        if (speedKmh > CONFIG.MAX_SPEED_KMH) {
          flags.push('IMPOSSIBLE_TRAVEL')
          riskScore += 40

          // Détail pour le log
          flags.push(`TRAVEL_${Math.round(distance)}km_${Math.round(timeDiffH * 60)}min`)
        }
      }
    }
  }

  // --------------------------------------------------------
  // 4. HEURE SUSPECTE
  // --------------------------------------------------------
  const hour = new Date(event.timestamp).getUTCHours() + 1 // UTC+1 Paris
  if (hour < CONFIG.WORK_HOURS_START || hour > CONFIG.WORK_HOURS_END) {
    flags.push('OFF_HOURS')
    riskScore += 10

    // Nuit profonde (1h-5h) = plus suspect
    if (hour >= 1 && hour <= 5) {
      flags.push('DEEP_NIGHT')
      riskScore += 15
    }
  }

  // --------------------------------------------------------
  // 5. RATE LIMITING COMPORTEMENTAL
  // --------------------------------------------------------
  const now = event.timestamp
  const lastMinute = history.filter(h => now - h.timestamp < 60_000)
  const lastHour = history.filter(h => now - h.timestamp < 3_600_000)
  const lastDay = history.filter(h => now - h.timestamp < 86_400_000)

  if (lastMinute.length > CONFIG.MAX_API_CALLS_PER_MINUTE) {
    flags.push('RATE_EXCEEDED')
    riskScore += 20
  }

  // Enrichissement = le plus sensible
  const enrichmentLastHour = lastHour.filter(h => h.action === 'enrichment')
  if (enrichmentLastHour.length > CONFIG.MAX_ENRICHMENT_CALLS_PER_HOUR) {
    flags.push('ENRICHMENT_ABUSE')
    riskScore += 30
  }

  // Export = très sensible (vol de données)
  const exportsToday = lastDay.filter(h => h.action === 'export')
  if (exportsToday.length > CONFIG.MAX_EXPORT_CALLS_PER_DAY) {
    flags.push('EXPORT_ABUSE')
    riskScore += 35
  }

  // --------------------------------------------------------
  // 6. SESSIONS MULTIPLES
  // --------------------------------------------------------
  const activeDevices = new Set(
    history
      .filter(h => now - h.timestamp < 3_600_000) // dernière heure
      .map(h => h.device.fingerprint)
  )
  if (activeDevices.size > CONFIG.MAX_CONCURRENT_SESSIONS) {
    flags.push('TOO_MANY_SESSIONS')
    riskScore += 15
  }

  // --------------------------------------------------------
  // 7. USER-AGENT SUSPECT
  // --------------------------------------------------------
  const ua = event.device.userAgent.toLowerCase()
  if (
    ua.includes('curl') || ua.includes('wget') || ua.includes('python') ||
    ua.includes('scrapy') || ua.includes('bot') || ua.includes('crawler') ||
    ua.includes('postman') || ua.includes('insomnia') ||
    ua.length < 20 // UA trop court = fake
  ) {
    flags.push('SUSPICIOUS_USER_AGENT')
    riskScore += 25
  }

  // --------------------------------------------------------
  // 8. PATTERN AUTOMATISÉ (appels trop réguliers)
  // --------------------------------------------------------
  if (lastMinute.length >= 5) {
    const intervals = lastMinute
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((e, i, arr) => i > 0 ? e.timestamp - arr[i - 1].timestamp : 0)
      .filter(i => i > 0)

    // Si tous les intervalles sont quasi identiques → bot
    if (intervals.length >= 3) {
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const variance = intervals.reduce((a, i) => a + (i - avg) ** 2, 0) / intervals.length
      const stdDev = Math.sqrt(variance)

      if (stdDev < 100) { // Moins de 100ms de variation → robot
        flags.push('AUTOMATED_PATTERN')
        riskScore += 30
      }
    }
  }

  // --------------------------------------------------------
  // DÉCISION FINALE
  // --------------------------------------------------------
  riskScore = Math.min(100, riskScore)

  let action: ThreatAssessment['action']
  let riskLevel: ThreatAssessment['risk_level']

  if (riskScore >= 70) {
    action = 'block'
    riskLevel = 'critical'
  } else if (riskScore >= 50) {
    action = 'notify_admin'
    riskLevel = 'high'
  } else if (riskScore >= 25) {
    action = 'challenge' // Demander MFA ou confirmation
    riskLevel = 'medium'
  } else {
    action = 'allow'
    riskLevel = 'low'
  }

  const details = flags.length > 0
    ? `Risk ${riskScore}/100: ${flags.join(', ')}`
    : 'No threats detected'

  return { risk_level: riskLevel, risk_score: riskScore, flags, action, details }
}

// ============================================================
// SUPABASE — Persistence des appareils et événements
// ============================================================

/** Enregistre un événement de sécurité dans Supabase */
export async function logSecurityEvent(event: SessionEvent & { threat: ThreatAssessment }) {
  try {
    const { createServiceSupabase } = await import('../supabase-server')
    const supabase = await createServiceSupabase()

    await (supabase as any).from('security_events').insert({
      user_id: event.user_id,
      action: event.action,
      device_fingerprint: event.device.fingerprint,
      ip_address: event.device.ip,
      user_agent: event.device.userAgent,
      geo_city: event.geo?.city,
      geo_country: event.geo?.country,
      geo_lat: event.geo?.lat,
      geo_lng: event.geo?.lng,
      risk_score: event.threat.risk_score,
      risk_level: event.threat.risk_level,
      risk_flags: event.threat.flags,
      risk_action: event.threat.action,
      created_at: new Date(event.timestamp).toISOString(),
    })
  } catch {
    // Non-bloquant — la sécurité ne doit pas casser l'UX
  }
}

/** Récupère les appareils connus d'un utilisateur */
export async function getKnownDevices(userId: string): Promise<KnownDevice[]> {
  try {
    const { createServiceSupabase } = await import('../supabase-server')
    const supabase = await createServiceSupabase()

    const { data } = await (supabase as any)
      .from('known_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen', { ascending: false })
      .limit(CONFIG.MAX_DEVICES_PER_USER + 2)

    return (data || []).map((d: any) => ({
      fingerprint: d.fingerprint,
      user_id: d.user_id,
      name: d.name,
      first_seen: d.first_seen,
      last_seen: d.last_seen,
      ip_addresses: d.ip_addresses || [],
      trusted: d.trusted || false,
      login_count: d.login_count || 0,
    }))
  } catch {
    return []
  }
}

/** Récupère l'historique récent d'un utilisateur */
export async function getRecentHistory(userId: string, days: number = 30): Promise<SessionEvent[]> {
  try {
    const { createServiceSupabase } = await import('../supabase-server')
    const supabase = await createServiceSupabase()

    const since = new Date(Date.now() - days * 86_400_000).toISOString()
    const { data } = await (supabase as any)
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500)

    return (data || []).map((e: any) => ({
      user_id: e.user_id,
      device: {
        fingerprint: e.device_fingerprint,
        ip: e.ip_address,
        userAgent: e.user_agent,
      },
      timestamp: new Date(e.created_at).getTime(),
      action: e.action,
      geo: e.geo_lat ? { lat: e.geo_lat, lng: e.geo_lng, city: e.geo_city, country: e.geo_country } : undefined,
    }))
  } catch {
    return []
  }
}

/** Enregistre ou met à jour un appareil connu */
export async function registerDevice(userId: string, device: DeviceInfo) {
  try {
    const { createServiceSupabase } = await import('../supabase-server')
    const supabase = await createServiceSupabase()

    const fingerprint = hashDeviceFingerprint(device.fingerprint, device.userAgent)

    // Upsert : créer ou mettre à jour
    await (supabase as any).from('known_devices').upsert({
      fingerprint,
      user_id: userId,
      last_seen: new Date().toISOString(),
      ip_addresses: [device.ip], // Sera fusionné par un trigger DB
      login_count: 1, // Sera incrémenté par un trigger DB
    }, {
      onConflict: 'fingerprint,user_id',
    })
  } catch {
    // Non-bloquant
  }
}

// ============================================================
// NOTIFICATIONS — Alerter l'admin
// ============================================================

/** Envoie une notification d'alerte sécurité */
export async function notifySecurityAlert(
  threat: ThreatAssessment,
  event: SessionEvent
) {
  // En prod : envoyer un email via Resend ou un SMS
  // Pour l'instant : log + table Supabase
  console.warn(`[SECURITY ALERT] ${threat.risk_level.toUpperCase()} — User ${event.user_id} — ${threat.details}`)

  try {
    const { createServiceSupabase } = await import('../supabase-server')
    const supabase = await createServiceSupabase()

    await (supabase as any).from('security_alerts').insert({
      user_id: event.user_id,
      risk_level: threat.risk_level,
      risk_score: threat.risk_score,
      flags: threat.flags,
      action_taken: threat.action,
      details: threat.details,
      device_fingerprint: event.device.fingerprint,
      ip_address: event.device.ip,
      geo_city: event.geo?.city,
      geo_country: event.geo?.country,
      created_at: new Date(event.timestamp).toISOString(),
    })

    // Si critique → email à l'admin
    if (threat.risk_level === 'critical' || threat.risk_level === 'high') {
      try {
        const { sendAdminNotification } = await import('../email')
        await sendAdminNotification(
          `[ALERTE SÉCURITÉ] ${threat.risk_level.toUpperCase()} — ${threat.flags.join(', ')}`,
          `<h2>Alerte sécurité CRM Satorea</h2>
            <p><strong>Niveau :</strong> ${threat.risk_level} (${threat.risk_score}/100)</p>
            <p><strong>User :</strong> ${event.user_id}</p>
            <p><strong>IP :</strong> ${event.device.ip}</p>
            <p><strong>Localisation :</strong> ${event.geo?.city || 'Inconnue'}, ${event.geo?.country || 'Inconnu'}</p>
            <p><strong>Flags :</strong> ${threat.flags.join(', ')}</p>
            <p><strong>Action :</strong> ${threat.action}</p>
            <p><strong>Date :</strong> ${new Date(event.timestamp).toLocaleString('fr-FR')}</p>
            <p><strong>User-Agent :</strong> ${event.device.userAgent}</p>`
        )
      } catch {
        // Email fail = non-bloquant
      }
    }
  } catch {
    // Non-bloquant
  }
}

// ============================================================
// MIDDLEWARE — Point d'entrée pour chaque requête
// ============================================================

/**
 * Évalue le risque d'une requête et agit en conséquence.
 * À appeler dans le middleware Next.js ou dans les API routes sensibles.
 *
 * Retourne true si la requête est autorisée, false si bloquée.
 */
export async function guardRequest(
  userId: string,
  device: DeviceInfo,
  action: SessionEvent['action']
): Promise<{ allowed: boolean; threat: ThreatAssessment }> {
  const event: SessionEvent = {
    user_id: userId,
    device,
    timestamp: Date.now(),
    action,
  }

  // Récupérer le contexte
  const [knownDevices, history] = await Promise.all([
    getKnownDevices(userId),
    getRecentHistory(userId, 7), // 7 jours d'historique
  ])

  // Évaluer la menace
  const threat = await assessThreat(event, history, knownDevices)

  // Logger l'événement (toujours, même si autorisé)
  await logSecurityEvent({ ...event, threat })

  // Agir selon le niveau de risque
  if (threat.action === 'block') {
    await notifySecurityAlert(threat, event)
    return { allowed: false, threat }
  }

  if (threat.action === 'notify_admin') {
    await notifySecurityAlert(threat, event)
    // On laisse passer mais on notifie
    return { allowed: true, threat }
  }

  if (threat.action === 'challenge') {
    // TODO : rediriger vers MFA
    // Pour l'instant : on laisse passer + notification
    if (threat.risk_score >= 40) {
      await notifySecurityAlert(threat, event)
    }
    return { allowed: true, threat }
  }

  // Enregistrer l'appareil si tout va bien
  await registerDevice(userId, device)

  return { allowed: true, threat }
}
