// ============================================================
// CRM DERMOTEC — Impossible Travel Detection
// ============================================================

interface LocationInfo {
  country?: string
  city?: string
  region?: string
  coordinates?: {
    lat: number
    lon: number
  }
}

interface UserSession {
  userId: string
  ip: string
  location: LocationInfo
  timestamp: number
  userAgent: string
}

// Cache en mémoire pour les dernières localisations
// En production, utiliser Redis pour persistance multi-instance
const LOCATION_CACHE = new Map<string, UserSession>()

// Constantes pour la détection de voyage impossible
const TRAVEL_CONFIG = {
  MAX_SPEED_KMH: 900,           // Vitesse max réaliste (avion commercial)
  MIN_DISTANCE_KM: 500,         // Distance minimale pour déclencher la vérification
  MIN_TIME_DIFF_MINUTES: 60,    // Temps minimum pour un voyage réaliste
  CACHE_TTL_HOURS: 24,          // Garder les localisations 24h
} as const

// Coordonnées approximatives des principales villes (pour fallback)
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'paris': { lat: 48.8566, lon: 2.3522 },
  'lyon': { lat: 45.7640, lon: 4.8357 },
  'marseille': { lat: 43.2965, lon: 5.3698 },
  'toulouse': { lat: 43.6047, lon: 1.4442 },
  'lille': { lat: 50.6292, lon: 3.0573 },
  'strasbourg': { lat: 48.5734, lon: 7.7521 },
  'nantes': { lat: 47.2184, lon: -1.5536 },
  'bordeaux': { lat: 44.8378, lon: -0.5792 },
  'rennes': { lat: 48.1173, lon: -1.6778 },
  'nice': { lat: 43.7102, lon: 7.2620 },
} as const

/**
 * Vérifie si une connexion constitue un "voyage impossible"
 */
export async function checkImpossibleTravel(
  userId: string,
  ip: string,
  headers: Headers
): Promise<{ suspicious: boolean; reason?: string; details?: Record<string, unknown> }> {
  try {
    const now = Date.now()

    // Récupérer la géolocalisation depuis les headers Vercel
    const currentLocation = extractLocationFromHeaders(headers)
    const userAgent = headers.get('user-agent') || 'Unknown'

    // Récupérer la dernière session connue pour cet utilisateur
    const lastSession = LOCATION_CACHE.get(userId)

    if (!lastSession) {
      // Première connexion pour cet utilisateur
      const newSession: UserSession = {
        userId,
        ip,
        location: currentLocation,
        timestamp: now,
        userAgent,
      }

      LOCATION_CACHE.set(userId, newSession)
      return { suspicious: false }
    }

    // Vérifier si c'est la même IP (pas de voyage)
    if (lastSession.ip === ip) {
      // Même IP, mettre à jour le timestamp
      lastSession.timestamp = now
      lastSession.userAgent = userAgent
      return { suspicious: false }
    }

    // Calculer le temps écoulé entre les deux connexions
    const timeDiffMinutes = (now - lastSession.timestamp) / (1000 * 60)

    // Si plus de 24h, considérer comme voyage normal
    if (timeDiffMinutes > TRAVEL_CONFIG.CACHE_TTL_HOURS * 60) {
      const newSession: UserSession = {
        userId,
        ip,
        location: currentLocation,
        timestamp: now,
        userAgent,
      }
      LOCATION_CACHE.set(userId, newSession)
      return { suspicious: false }
    }

    // Estimer la distance entre les deux localisations
    const distance = estimateDistance(lastSession.location, currentLocation)

    // Si distance < seuil minimum, pas de voyage notable
    if (distance < TRAVEL_CONFIG.MIN_DISTANCE_KM) {
      lastSession.ip = ip
      lastSession.location = currentLocation
      lastSession.timestamp = now
      lastSession.userAgent = userAgent
      return { suspicious: false }
    }

    // Calculer la vitesse requise pour ce voyage
    const requiredSpeedKmh = distance / (timeDiffMinutes / 60)

    // Voyage impossible détecté
    if (requiredSpeedKmh > TRAVEL_CONFIG.MAX_SPEED_KMH && timeDiffMinutes < TRAVEL_CONFIG.MIN_TIME_DIFF_MINUTES) {
      const details = {
        previous_location: formatLocation(lastSession.location),
        current_location: formatLocation(currentLocation),
        distance_km: Math.round(distance),
        time_diff_minutes: Math.round(timeDiffMinutes),
        required_speed_kmh: Math.round(requiredSpeedKmh),
        max_speed_kmh: TRAVEL_CONFIG.MAX_SPEED_KMH,
        previous_ip: lastSession.ip,
        current_ip: ip,
        previous_user_agent: lastSession.userAgent,
        current_user_agent: userAgent,
      }

      // Log l'événement de sécurité
      await logSecurityEvent(userId, 'impossible_travel', 'CRITICAL', details, ip, userAgent)

      return {
        suspicious: true,
        reason: `Voyage impossible détecté: ${Math.round(distance)}km en ${Math.round(timeDiffMinutes)}min (vitesse requise: ${Math.round(requiredSpeedKmh)}km/h)`,
        details,
      }
    }

    // Connexion légitime mais dans un nouveau lieu
    const newSession: UserSession = {
      userId,
      ip,
      location: currentLocation,
      timestamp: now,
      userAgent,
    }
    LOCATION_CACHE.set(userId, newSession)

    return { suspicious: false }

  } catch (error) {
    console.error('Erreur lors de la vérification impossible travel:', error)

    // En cas d'erreur, ne pas bloquer la connexion
    return { suspicious: false }
  }
}

/**
 * Extrait la géolocalisation depuis les headers Vercel
 */
function extractLocationFromHeaders(headers: Headers): LocationInfo {
  const country = headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry')
  const city = headers.get('x-vercel-ip-city') || headers.get('cf-ipcity')
  const region = headers.get('x-vercel-ip-country-region')

  // Tenter d'obtenir les coordonnées depuis la ville
  let coordinates: { lat: number; lon: number } | undefined

  if (city) {
    const cityKey = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    coordinates = CITY_COORDINATES[cityKey]
  }

  return {
    country: country || 'Unknown',
    city: city || 'Unknown',
    region: region || 'Unknown',
    coordinates,
  }
}

/**
 * Estime la distance entre deux localisations (formule de Haversine)
 */
function estimateDistance(location1: LocationInfo, location2: LocationInfo): number {
  // Si on n'a pas de coordonnées précises, utiliser une estimation basique
  if (!location1.coordinates || !location2.coordinates) {
    return estimateDistanceByRegion(location1, location2)
  }

  const { lat: lat1, lon: lon1 } = location1.coordinates
  const { lat: lat2, lon: lon2 } = location2.coordinates

  // Formule de Haversine pour la distance orthodromique
  const R = 6371 // Rayon de la Terre en km
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Estimation grossière basée sur les pays/villes
 */
function estimateDistanceByRegion(location1: LocationInfo, location2: LocationInfo): number {
  // Même pays, distance faible
  if (location1.country === location2.country) {
    if (location1.city === location2.city) {
      return 0 // Même ville
    }
    return 200 // Villes différentes, même pays
  }

  // Pays différents en Europe
  const europeanCountries = ['FR', 'DE', 'IT', 'ES', 'BE', 'NL', 'CH', 'GB']
  if (europeanCountries.includes(location1.country || '') &&
      europeanCountries.includes(location2.country || '')) {
    return 1000 // Distance européenne moyenne
  }

  // Pays très éloignés
  return 8000 // Distance intercontinentale
}

/**
 * Convertit des degrés en radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Formate une localisation pour l'affichage
 */
function formatLocation(location: LocationInfo): string {
  const parts = []

  if (location.city && location.city !== 'Unknown') {
    parts.push(location.city)
  }

  if (location.region && location.region !== 'Unknown') {
    parts.push(location.region)
  }

  if (location.country && location.country !== 'Unknown') {
    parts.push(location.country)
  }

  return parts.length > 0 ? parts.join(', ') : 'Localisation inconnue'
}

/**
 * Nettoie le cache des anciennes entrées
 */
export function cleanupLocationCache(): void {
  const now = Date.now()
  const maxAge = TRAVEL_CONFIG.CACHE_TTL_HOURS * 60 * 60 * 1000

  for (const [userId, session] of LOCATION_CACHE.entries()) {
    if (now - session.timestamp > maxAge) {
      LOCATION_CACHE.delete(userId)
    }
  }
}

/**
 * Révoque toutes les sessions d'un utilisateur (appelé lors d'un voyage suspect)
 */
export async function revokeUserSessions(userId: string): Promise<boolean> {
  try {
    // Nettoyer le cache local
    LOCATION_CACHE.delete(userId)

    // En production, révoquer aussi les sessions Supabase
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured for session revocation')
      return false
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Révoquer toutes les sessions refresh tokens de l'utilisateur
    const { error } = await supabase.auth.admin.signOut(userId, 'global')

    if (error) {
      console.error('Erreur lors de la révocation des sessions:', error)
      return false
    }

    console.log(`Sessions révoquées pour l'utilisateur ${userId}`)
    return true

  } catch (error) {
    console.error('Erreur lors de la révocation des sessions:', error)
    return false
  }
}

/**
 * Statistiques du cache pour monitoring
 */
export function getLocationCacheStats(): {
  active_users: number
  oldest_session_hours: number
  cache_memory_kb: number
} {
  const now = Date.now()
  let oldestTimestamp = now

  for (const session of LOCATION_CACHE.values()) {
    if (session.timestamp < oldestTimestamp) {
      oldestTimestamp = session.timestamp
    }
  }

  const oldestHours = (now - oldestTimestamp) / (1000 * 60 * 60)
  const memoryUsage = JSON.stringify([...LOCATION_CACHE.entries()])

  return {
    active_users: LOCATION_CACHE.size,
    oldest_session_hours: Math.round(oldestHours * 100) / 100,
    cache_memory_kb: Math.round(new Blob([memoryUsage]).size / 1024),
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
  userAgent?: string
): Promise<void> {
  try {
    // En mode développement, juste un console.log
    if (process.env.NODE_ENV === 'development') {
      console.log('🚨 Impossible Travel:', {
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
        metadata,
      })
  } catch (error) {
    console.error('Failed to log impossible travel event:', error)
  }
}