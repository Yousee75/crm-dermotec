// ============================================================
// CRM DERMOTEC — Générateur de cartes statiques OpenStreetMap
// Utilise la lib 'staticmaps' (open source, pas de Google)
// Génère des images PNG avec marqueurs, sans pub, sans clé API
// ============================================================
import 'server-only'

/**
 * Génère une image PNG de carte OpenStreetMap centrée sur des coordonnées
 * avec un marqueur Satorea personnalisé
 *
 * @param lat Latitude du point central
 * @param lng Longitude du point central
 * @param zoom Niveau de zoom (1-17, défaut 15)
 * @param width Largeur en pixels (défaut 640)
 * @param height Hauteur en pixels (défaut 300)
 * @returns Buffer PNG de l'image
 */
export async function generateStaticMap(params: {
  lat: number
  lng: number
  zoom?: number
  width?: number
  height?: number
  markers?: { lat: number; lng: number; color?: string; label?: string }[]
}): Promise<Buffer | null> {
  const { lat, lng, zoom = 15, width = 640, height = 300, markers = [] } = params

  try {
    // Import dynamique — staticmaps utilise sharp qui peut crasher au SSG
    // @ts-ignore - no types for staticmaps
    const StaticMaps = (await import('staticmaps')).default

    const map = new StaticMaps({
      width,
      height,
      tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      tileSize: 256,
      tileRequestHeader: {
        'User-Agent': 'SatoreaCRM/1.0 (contact@satorea.fr)',
      },
    })

    // Marqueur principal (le prospect)
    map.addMarker({
      coord: [lng, lat],
      img: undefined, // Utilise le marqueur par défaut
      height: 32,
      width: 24,
    })

    // Marqueurs supplémentaires (concurrents, métros, etc.)
    for (const marker of markers) {
      map.addMarker({
        coord: [marker.lng, marker.lat],
        img: undefined,
        height: 24,
        width: 18,
      })
    }

    // Rendre la carte
    await map.render([lng, lat], zoom)

    // Retourner le buffer PNG
    return await map.image.buffer('image/png') as Buffer
  } catch (error) {
    console.error('[MapGenerator] Erreur:', error)
    return null
  }
}

/**
 * Geocoder une adresse en coordonnées lat/lng
 * Utilise Nominatim (OpenStreetMap, gratuit, pas de clé API)
 * Rate limit : 1 requête/seconde max
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: { 'User-Agent': 'SatoreaCRM/1.0 (contact@satorea.fr)' },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return null
    const data = await res.json()
    if (!data?.[0]) return null

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }
  } catch {
    return null
  }
}

/**
 * Génère une carte complète pour un prospect :
 * - Geocode l'adresse si pas de coordonnées
 * - Génère la carte PNG
 * - Retourne le buffer + les coordonnées
 */
export async function generateProspectMap(params: {
  adresse?: string
  lat?: number
  lng?: number
  nom?: string
}): Promise<{ buffer: Buffer; lat: number; lng: number } | null> {
  let { lat, lng } = params

  // Geocoder si pas de coordonnées
  if ((!lat || !lng) && params.adresse) {
    const coords = await geocodeAddress(params.adresse)
    if (!coords) return null
    lat = coords.lat
    lng = coords.lng
  }

  if (!lat || !lng) return null

  const buffer = await generateStaticMap({ lat, lng, zoom: 15, width: 640, height: 300 })
  if (!buffer) return null

  return { buffer, lat, lng }
}
