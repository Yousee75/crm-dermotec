import 'server-only'
// ============================================================
// CRM DERMOTEC — Enrichissement DVF (Demandes de Valeurs Foncières)
// API: api.cquest.org/dvf (gratuit, pas d'inscription, JSON direct)
// Pattern: lazy init, cache 7j Upstash, timeout 15s, AbortSignal
// ============================================================

// --- Types ---

export interface PrixDVF {
  code_commune: string
  nom_commune?: string
  departement?: string
  prix_m2_median: number
  prix_m2_moyen: number
  nb_transactions: number
  prix_m2_appart?: number
  prix_m2_maison?: number
  annee: number
}

export type StandingQuartier = 'premium' | 'moyen' | 'populaire'

interface MutationDVF {
  id_mutation?: string
  date_mutation?: string
  nature_mutation?: string
  valeur_fonciere?: number
  code_commune?: string
  nom_commune?: string
  code_departement?: string
  type_local?: string
  surface_reelle_bati?: number
  nombre_pieces_principales?: number
  surface_terrain?: number
  longitude?: number
  latitude?: number
}

// --- Constants ---

const TAG = '[DVF]'
const CACHE_TTL = 604800 // 7 jours
const TIMEOUT_MS = 15_000

// API principale (cquest.org) + fallback (API gouv)
const DVF_APIS = [
  'https://api.cquest.org/dvf',
  'https://apidf-preprod.cerema.fr/dvf_opendata/mutations',
]
const GEO_API = 'https://geo.api.gouv.fr'

// Seuils prix m² pour classification standing (Ile-de-France)
const SEUIL_PREMIUM = 6000
const SEUIL_MOYEN = 3500

// --- Helpers ---

function cacheKey(prefix: string, ...parts: string[]): string {
  return `enrichment:dvf:${prefix}:${parts.join(':')}`
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const { cacheGet } = await import('./upstash')
    return await cacheGet<T>(key)
  } catch {
    return null
  }
}

async function setCache<T>(key: string, value: T): Promise<void> {
  try {
    const { cacheSet } = await import('./upstash')
    await cacheSet(key, value, CACHE_TTL)
  } catch { /* Silent */ }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

// --- Fetch mutations DVF ---

async function fetchMutations(
  codeCommune: string,
  annee?: number,
): Promise<MutationDVF[]> {
  try {
    const params = new URLSearchParams({
      code_commune: codeCommune,
      nature_mutation: 'Vente',
    })

    if (annee) {
      params.set('date_mutation_min', `${annee}-01-01`)
      params.set('date_mutation_max', `${annee}-12-31`)
    }

    const res = await fetch(`${DVF_API}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(TAG, `API DVF ${res.status} pour commune ${codeCommune}`)
      return []
    }

    const json = await res.json()
    const resultats = json.resultats || json.features || json.results || []

    // L'API cquest retourne parfois un format GeoJSON
    if (Array.isArray(resultats)) {
      return resultats.map((r: any) => {
        const props = r.properties || r
        return {
          id_mutation: props.id_mutation,
          date_mutation: props.date_mutation,
          nature_mutation: props.nature_mutation,
          valeur_fonciere: parseFloat(props.valeur_fonciere) || undefined,
          code_commune: props.code_commune || codeCommune,
          nom_commune: props.nom_commune,
          code_departement: props.code_departement || codeCommune.substring(0, 2),
          type_local: props.type_local,
          surface_reelle_bati: parseFloat(props.surface_reelle_bati) || undefined,
          nombre_pieces_principales: parseInt(props.nombre_pieces_principales) || undefined,
          surface_terrain: parseFloat(props.surface_terrain) || undefined,
          longitude: parseFloat(props.longitude) || (r.geometry?.coordinates?.[0]),
          latitude: parseFloat(props.latitude) || (r.geometry?.coordinates?.[1]),
        }
      })
    }

    return []
  } catch (err) {
    console.error(TAG, 'Erreur fetch DVF:', err)
    return []
  }
}

// --- Calcul prix m² ---

function calculerPrix(mutations: MutationDVF[], annee: number): PrixDVF {
  // Filtrer les mutations avec prix et surface valides
  const valides = mutations.filter(
    (m) => m.valeur_fonciere && m.valeur_fonciere > 0 && m.surface_reelle_bati && m.surface_reelle_bati > 0,
  )

  // Calculer prix au m² par type
  const prixM2All: number[] = []
  const prixM2Appart: number[] = []
  const prixM2Maison: number[] = []

  for (const m of valides) {
    const prixM2 = m.valeur_fonciere! / m.surface_reelle_bati!

    // Filtre anti-aberration : ignorer les prix < 500 ou > 30000 EUR/m²
    if (prixM2 < 500 || prixM2 > 30000) continue

    prixM2All.push(Math.round(prixM2))

    const typeLocal = (m.type_local || '').toLowerCase()
    if (typeLocal.includes('appartement')) {
      prixM2Appart.push(Math.round(prixM2))
    } else if (typeLocal.includes('maison')) {
      prixM2Maison.push(Math.round(prixM2))
    }
  }

  const premiere = valides[0]

  return {
    code_commune: premiere?.code_commune || '',
    nom_commune: premiere?.nom_commune,
    departement: premiere?.code_departement,
    prix_m2_median: median(prixM2All),
    prix_m2_moyen: mean(prixM2All),
    nb_transactions: prixM2All.length,
    prix_m2_appart: prixM2Appart.length >= 3 ? median(prixM2Appart) : undefined,
    prix_m2_maison: prixM2Maison.length >= 3 ? median(prixM2Maison) : undefined,
    annee,
  }
}

// --- Fonctions publiques ---

/**
 * Prix médian au m² pour une commune.
 * Sépare appartements et maisons si assez de transactions.
 */
export async function getPrixM2Commune(
  codeCommune: string,
  annee?: number,
): Promise<PrixDVF | null> {
  if (!codeCommune || codeCommune.length < 5) {
    console.warn(TAG, 'Code commune invalide:', codeCommune)
    return null
  }

  const anneeEffective = annee || new Date().getFullYear() - 1
  const key = cacheKey('commune', codeCommune, String(anneeEffective))

  // Check cache
  const cached = await getCached<PrixDVF>(key)
  if (cached) {
    console.log(TAG, 'Cache hit commune:', codeCommune)
    return cached
  }

  const mutations = await fetchMutations(codeCommune, anneeEffective)

  if (mutations.length === 0) {
    // Essayer l'année précédente si pas de données
    if (!annee) {
      console.log(TAG, `Pas de données ${anneeEffective}, essai ${anneeEffective - 1}`)
      const mutationsPrev = await fetchMutations(codeCommune, anneeEffective - 1)
      if (mutationsPrev.length > 0) {
        const result = calculerPrix(mutationsPrev, anneeEffective - 1)
        result.code_commune = codeCommune
        await setCache(key, result)
        console.log(TAG, `${result.nb_transactions} transactions pour ${codeCommune} (${result.annee})`)
        return result
      }
    }
    console.log(TAG, `Aucune mutation DVF pour ${codeCommune}`)
    return null
  }

  const result = calculerPrix(mutations, anneeEffective)
  result.code_commune = codeCommune

  // Cache 7 jours
  await setCache(key, result)

  console.log(TAG, `${result.nb_transactions} transactions, médian ${result.prix_m2_median} EUR/m² pour ${codeCommune}`)
  return result
}

/**
 * Prix au m² autour d'une coordonnée GPS.
 * Utilise le géocodage inverse pour trouver le code commune puis appelle getPrixM2Commune.
 */
export async function getPrixM2ParAdresse(
  lat: number,
  lng: number,
  rayonM?: number,
): Promise<PrixDVF | null> {
  if (!lat || !lng) {
    console.warn(TAG, 'Coordonnées GPS invalides')
    return null
  }

  // Arrondir pour une meilleure déduplication cache
  const latRound = Math.round(lat * 10000) / 10000
  const lngRound = Math.round(lng * 10000) / 10000
  const key = cacheKey('adresse', String(latRound), String(lngRound))

  // Check cache
  const cached = await getCached<PrixDVF>(key)
  if (cached) {
    console.log(TAG, 'Cache hit adresse:', latRound, lngRound)
    return cached
  }

  // Géocodage inverse via API Geo
  let codeCommune: string | null = null

  try {
    const res = await fetch(
      `${GEO_API}/communes?lat=${lat}&lon=${lng}&fields=code,nom,codeDepartement&limit=1`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    )

    if (res.ok) {
      const communes = await res.json()
      if (Array.isArray(communes) && communes.length > 0) {
        codeCommune = communes[0].code
        console.log(TAG, `Commune trouvée: ${communes[0].nom} (${codeCommune})`)
      }
    }
  } catch (err) {
    console.error(TAG, 'Erreur géocodage inverse:', err)
  }

  if (!codeCommune) {
    console.warn(TAG, `Impossible de trouver la commune pour lat=${lat}, lng=${lng}`)
    return null
  }

  const result = await getPrixM2Commune(codeCommune)

  if (result) {
    // Cache sous la clé adresse aussi
    await setCache(key, result)
  }

  return result
}

/**
 * Classifier le quartier selon le prix médian au m².
 * Seuils ajustables (par défaut calibrés France métropolitaine).
 */
export async function getStandingQuartier(
  codeCommune: string,
  seuils?: { premium: number; moyen: number },
): Promise<StandingQuartier | null> {
  if (!codeCommune || codeCommune.length < 5) {
    console.warn(TAG, 'Code commune invalide:', codeCommune)
    return null
  }

  const key = cacheKey('standing', codeCommune)

  // Check cache
  const cached = await getCached<StandingQuartier>(key)
  if (cached) {
    console.log(TAG, 'Cache hit standing:', codeCommune)
    return cached
  }

  const prix = await getPrixM2Commune(codeCommune)
  if (!prix || prix.nb_transactions < 5) {
    console.log(TAG, `Pas assez de transactions pour classifier ${codeCommune}`)
    return null
  }

  const seuilPremium = seuils?.premium ?? SEUIL_PREMIUM
  const seuilMoyen = seuils?.moyen ?? SEUIL_MOYEN

  let standing: StandingQuartier
  if (prix.prix_m2_median >= seuilPremium) {
    standing = 'premium'
  } else if (prix.prix_m2_median >= seuilMoyen) {
    standing = 'moyen'
  } else {
    standing = 'populaire'
  }

  // Cache 7 jours
  await setCache(key, standing)

  console.log(TAG, `Standing ${codeCommune}: ${standing} (${prix.prix_m2_median} EUR/m²)`)
  return standing
}
