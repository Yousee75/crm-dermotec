import 'server-only'
// ============================================================
// CRM DERMOTEC — Discovery rapide de concurrents
// SIRET → Sirene + Google Places + déduction URLs
// ============================================================

export interface DiscoveredCompetitor {
  siret?: string
  siren?: string
  nom: string
  adresse?: string
  ville?: string
  codePostal?: string
  codeApe?: string
  lat: number
  lng: number
  distanceM: number
  googlePlaceId?: string
  googleRating?: number
  googleReviewsCount?: number
  website?: string
  telephone?: string
  pagesJaunesUrl?: string
  planityUrl?: string
  treatwellUrl?: string
}

export interface DiscoveryResult {
  prospect: {
    siret: string
    nom: string
    adresse: string
    lat: number
    lng: number
    codeApe: string
  }
  competitors: DiscoveredCompetitor[]
  totalFound: number
  radiusM: number
}

// APE codes liés à l'esthétique
const ESTHETIQUE_APE = new Set([
  '9602B', // Soins de beauté
  '9602A', // Coiffure
  '9604Z', // Entretien corporel
  '8690F', // Activités de santé humaine non classées ailleurs
  '4775Z', // Commerce de détail de parfumerie et produits de beauté
])

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function discoverCompetitors(input: {
  siret?: string
  nom?: string
  ville?: string
  radiusM?: number
}): Promise<DiscoveryResult | null> {
  const radius = input.radiusM || 1000

  // 1. Lookup SIRET via API recherche-entreprises
  let prospect = null

  if (input.siret) {
    try {
      const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${input.siret}`)
      const data = await res.json()
      const etab = data.results?.[0]

      if (etab) {
        prospect = {
          siret: etab.matching_etablissements?.[0]?.siret || input.siret,
          nom: etab.nom_complet || etab.nom_raison_sociale || '',
          adresse: etab.siege?.adresse || '',
          lat: etab.siege?.latitude || 0,
          lng: etab.siege?.longitude || 0,
          codeApe: etab.activite_principale || '',
        }
      }
    } catch (err) {
      console.error('[Discovery] Sirene lookup error:', err)
    }
  }

  if (!prospect && input.nom && input.ville) {
    try {
      const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(input.nom)}&commune=${encodeURIComponent(input.ville)}&activite_principale=96.02B,96.02A,96.04Z`)
      const data = await res.json()
      const etab = data.results?.[0]

      if (etab) {
        prospect = {
          siret: etab.matching_etablissements?.[0]?.siret || '',
          nom: etab.nom_complet || input.nom,
          adresse: etab.siege?.adresse || '',
          lat: etab.siege?.latitude || 0,
          lng: etab.siege?.longitude || 0,
          codeApe: etab.activite_principale || '',
        }
      }
    } catch (err) {
      console.error('[Discovery] Nom lookup error:', err)
    }
  }

  if (!prospect || !prospect.lat) return null

  // 2. Chercher concurrents même APE dans le rayon
  const competitors: DiscoveredCompetitor[] = []

  try {
    const ape4 = prospect.codeApe.replace('.', '').slice(0, 4)
    const searchApes = ['9602', '9604', '4775'] // Esthétique + soins + commerce beauté
    const apeQuery = searchApes.includes(ape4) ? searchApes.join(',') : ape4

    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/near_point?lat=${prospect.lat}&long=${prospect.lng}&radius=${radius / 1000}&activite_principale=${apeQuery}&per_page=25&etat_administratif=A`
    )
    const data = await res.json()

    for (const etab of data.results || []) {
      const compSiret = etab.matching_etablissements?.[0]?.siret || ''
      if (compSiret === prospect.siret) continue // Skip soi-même

      const compLat = etab.siege?.latitude || 0
      const compLng = etab.siege?.longitude || 0

      const distanceM = haversineM(prospect.lat, prospect.lng, compLat, compLng)

      const nomSlug = slugify(etab.nom_complet || '')
      const villeSlug = slugify(etab.siege?.libelle_commune || '')

      competitors.push({
        siret: compSiret,
        siren: etab.siren,
        nom: etab.nom_complet || etab.nom_raison_sociale || 'Inconnu',
        adresse: etab.siege?.adresse || '',
        ville: etab.siege?.libelle_commune || '',
        codePostal: etab.siege?.code_postal || '',
        codeApe: etab.activite_principale || '',
        lat: compLat,
        lng: compLng,
        distanceM: Math.round(distanceM),
        pagesJaunesUrl: `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(etab.nom_complet || '')}&ou=${encodeURIComponent(etab.siege?.libelle_commune || '')}`,
        planityUrl: `https://www.planity.com/${nomSlug}-${etab.siege?.code_postal || '75011'}-${villeSlug}`,
        treatwellUrl: `https://www.treatwell.fr/salons/institut-de-beaute/${villeSlug}/`,
      })
    }
  } catch (err) {
    console.error('[Discovery] Competitor search error:', err)
  }

  // 3. Enrichir avec Google Places (top 10)
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
  if (googleApiKey) {
    for (const comp of competitors.slice(0, 10)) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${comp.lat},${comp.lng}&radius=200&keyword=${encodeURIComponent(comp.nom)}&language=fr&key=${googleApiKey}`
        )
        const data = await res.json()
        const place = data.results?.[0]

        if (place) {
          comp.googlePlaceId = place.place_id
          comp.googleRating = place.rating
          comp.googleReviewsCount = place.user_ratings_total
        }

        await new Promise(r => setTimeout(r, 200)) // Rate limit
      } catch {
        // Continue sans Google
      }
    }
  }

  // Filtrer par distance réelle (l'API near_point n'est pas toujours précise)
  const filtered = competitors
    .filter(c => c.lat && c.lng && c.distanceM <= radius * 1.2)
    .sort((a, b) => a.distanceM - b.distanceM)

  return {
    prospect,
    competitors: filtered.slice(0, 20),
    totalFound: filtered.length,
    radiusM: radius,
  }
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
