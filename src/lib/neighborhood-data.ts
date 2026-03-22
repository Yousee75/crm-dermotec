// ============================================================
// CRM DERMOTEC — Données quartier via Google Places Nearby
// Métros, restaurants, commerces, pharmacies, écoles...
// 100% gratuit avec la clé Google Places déjà configurée
// ============================================================

export interface NeighborhoodData {
  // Comptages par catégorie dans le rayon
  metros: number
  restaurants: number
  cafes: number
  pharmacies: number
  ecoles: number
  banks: number
  gyms: number
  beautyCompetitors: number
  parkings: number
  supermarkets: number

  // Score trafic piéton calculé
  footTrafficScore: number  // 0-100

  // Lieux remarquables proches
  nearbyLandmarks: Array<{
    name: string
    type: string
    distance: number
    rating?: number
  }>
}

// Poids de trafic par type d'établissement
const TRAFFIC_WEIGHTS: Record<string, number> = {
  subway_station: 5.0,
  train_station: 6.0,
  bus_station: 2.0,
  restaurant: 1.5,
  cafe: 1.5,
  supermarket: 3.0,
  shopping_mall: 4.0,
  school: 2.0,
  university: 3.0,
  hospital: 2.5,
  pharmacy: 1.5,
  bank: 1.0,
  gym: 1.5,
  beauty_salon: 0.5, // Concurrents
  parking: 1.0,
}

// Types Google Places à chercher
const SEARCH_TYPES = [
  { type: 'subway_station', key: 'metros' },
  { type: 'restaurant', key: 'restaurants' },
  { type: 'cafe', key: 'cafes' },
  { type: 'pharmacy', key: 'pharmacies' },
  { type: 'school', key: 'ecoles' },
  { type: 'bank', key: 'banks' },
  { type: 'gym', key: 'gyms' },
  { type: 'beauty_salon', key: 'beautyCompetitors' },
  { type: 'parking', key: 'parkings' },
  { type: 'supermarket', key: 'supermarkets' },
] as const

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function fetchNeighborhoodData(
  lat: number,
  lng: number,
  radiusM: number = 500
): Promise<NeighborhoodData> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    console.warn('[Neighborhood] GOOGLE_PLACES_API_KEY manquante')
    return getEmptyData()
  }

  const counts: Record<string, number> = {}
  const landmarks: NeighborhoodData['nearbyLandmarks'] = []
  let totalWeightedScore = 0

  // Chercher chaque type en parallèle (max 10 requêtes)
  const results = await Promise.allSettled(
    SEARCH_TYPES.map(async ({ type, key }) => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusM}&type=${type}&language=fr&key=${apiKey}`
        )
        const data = await res.json()
        const places = data.results || []

        counts[key] = places.length

        // Calculer score trafic pondéré
        const weight = TRAFFIC_WEIGHTS[type] || 1.0
        totalWeightedScore += places.length * weight

        // Garder les 2 plus proches par type comme landmarks
        const closest = places
          .map((p: { geometry?: { location?: { lat: number; lng: number } }; name?: string; rating?: number }) => ({
            name: p.name || '',
            type: key,
            distance: Math.round(haversineM(lat, lng, p.geometry?.location?.lat || lat, p.geometry?.location?.lng || lng)),
            rating: p.rating,
          }))
          .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
          .slice(0, 2)

        landmarks.push(...closest)

        return { key, count: places.length }
      } catch {
        counts[key] = 0
        return { key, count: 0 }
      }
    })
  )

  // Score trafic piéton (0-100), normalisé
  // Un quartier "très actif" a ~50+ points pondérés
  const footTrafficScore = Math.min(100, Math.round((totalWeightedScore / 60) * 100))

  // Trier landmarks par distance
  landmarks.sort((a, b) => a.distance - b.distance)

  console.log(`[Neighborhood] ${lat},${lng} r=${radiusM}m : ` +
    `métros=${counts.metros || 0} restos=${counts.restaurants || 0} ` +
    `beauté=${counts.beautyCompetitors || 0} score=${footTrafficScore}`)

  return {
    metros: counts.metros || 0,
    restaurants: counts.restaurants || 0,
    cafes: counts.cafes || 0,
    pharmacies: counts.pharmacies || 0,
    ecoles: counts.ecoles || 0,
    banks: counts.banks || 0,
    gyms: counts.gyms || 0,
    beautyCompetitors: counts.beautyCompetitors || 0,
    parkings: counts.parkings || 0,
    supermarkets: counts.supermarkets || 0,
    footTrafficScore,
    nearbyLandmarks: landmarks.slice(0, 10),
  }
}

function getEmptyData(): NeighborhoodData {
  return {
    metros: 0, restaurants: 0, cafes: 0, pharmacies: 0,
    ecoles: 0, banks: 0, gyms: 0, beautyCompetitors: 0,
    parkings: 0, supermarkets: 0,
    footTrafficScore: 0, nearbyLandmarks: [],
  }
}
