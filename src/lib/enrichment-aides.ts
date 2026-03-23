import 'server-only'

/**
 * CRM DERMOTEC — Enrichissement Aides Formation
 *
 * API Aides-Territoires (100% gratuite, aucune auth)
 * Endpoint: https://aides-territoires.beta.gouv.fr/api/aids/
 *
 * Paramètres utiles :
 * - targeted_audiences=private_sector (entreprises privées)
 * - categories=formation (aides formation)
 * - perimeter={code_commune} (géolocalisation)
 *
 * @author CRM Dermotec
 * @version 1.0
 */

// Cache silent fallback
let redis: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  redis = require('@upstash/redis').Redis.fromEnv()
} catch {
  // Silent fallback si Upstash pas configuré
}

export interface AideFormation {
  nom: string
  description: string
  url: string
  financeur: string
  type: 'subvention' | 'pret' | 'exoneration' | 'autre'
  montant_max?: number
  date_limite?: string
  eligibilite: string[]
  is_recurrent: boolean
  perimeter_name?: string
}

interface AidesApiResponse {
  count: number
  next?: string
  results: Array<{
    id: number
    name: string
    description: string
    url: string
    financers: Array<{ name: string }>
    aid_types: Array<{ name: string }>
    recurrence: string
    submission_deadline?: string
    eligibility: string
    perimeter?: { name: string }
    targeted_audiences: Array<{ name: string }>
    categories: Array<{ name: string }>
    subvention_rate_lower_bound?: number
    subvention_rate_upper_bound?: number
  }>
}

const CACHE_TTL = 60 * 60 * 24 // 24 heures
const TIMEOUT_MS = 15000
const BASE_URL = 'https://aides-territoires.beta.gouv.fr/api/aids/'

/**
 * Récupère les aides formation pour un territoire
 */
export async function getAidesFormation(params: {
  code_commune?: string
  departement?: string
}): Promise<AideFormation[]> {
  const { code_commune, departement } = params

  if (!code_commune && !departement) {
    console.log('[AIDES] Paramètre territoire manquant')
    return []
  }

  const territory = code_commune || departement || 'france'
  const cacheKey = `aides:${territory}`

  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        console.log('[AIDES] Cache hit:', territory)
        return cached
      }
    } catch (error) {
      console.log('[AIDES] Cache read error (continue):', String(error))
    }
  }

  try {
    console.log('[AIDES] Fetching aides formation:', territory)

    const searchParams = new URLSearchParams({
      targeted_audiences: 'private_sector',
      categories: 'formation',
      page_size: '50'
    })

    if (code_commune) {
      searchParams.append('perimeter', code_commune)
    } else if (departement) {
      searchParams.append('perimeter', departement)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(`${BASE_URL}?${searchParams}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CRM-Dermotec/1.0'
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log('[AIDES] API error:', response.status, response.statusText)
      return []
    }

    const data: AidesApiResponse = await response.json()

    if (!data || !Array.isArray(data.results)) {
      console.log('[AIDES] Invalid response format:', data)
      return []
    }

    const aides: AideFormation[] = data.results.map(aide => ({
      nom: aide.name,
      description: cleanDescription(aide.description),
      url: aide.url,
      financeur: aide.financers?.[0]?.name || 'Non spécifié',
      type: mapAidType(aide.aid_types?.[0]?.name || ''),
      montant_max: extractMontantMax(aide),
      date_limite: aide.submission_deadline || undefined,
      eligibilite: extractEligibilite(aide.eligibility),
      is_recurrent: aide.recurrence !== 'ponctuelle',
      perimeter_name: aide.perimeter?.name
    }))

    // Filter relevant aids for beauty sector
    const aidesRelevantes = aides.filter(aide =>
      isRelevantForBeautySector(aide.nom, aide.description)
    )

    // Cache result
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, aidesRelevantes)
        console.log('[AIDES] Cached for 24h:', territory, '→', aidesRelevantes.length, 'aides')
      } catch (error) {
        console.log('[AIDES] Cache write error (continue):', String(error))
      }
    }

    console.log('[AIDES] Success:', territory, '→', aidesRelevantes.length, 'aides relevantes')
    return aidesRelevantes

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[AIDES] Timeout after 15s:', territory)
    } else {
      console.log('[AIDES] Fetch error (silent):', territory, String(error))
    }
    return []
  }
}

/**
 * Récupère un résumé des aides financement par département
 */
export async function getAidesFinancement(departement: string): Promise<{
  aides: AideFormation[]
  total: number
  montant_max_cumule: number
}> {
  const aides = await getAidesFormation({ departement })

  const aidesAvecMontant = aides.filter(aide => aide.montant_max && aide.montant_max > 0)
  const montantMaxCumule = aidesAvecMontant.reduce(
    (sum, aide) => sum + (aide.montant_max || 0),
    0
  )

  console.log('[AIDES] Résumé financement:', departement, '→', aides.length, 'aides, montant max cumulé:', montantMaxCumule)

  return {
    aides,
    total: aides.length,
    montant_max_cumule: montantMaxCumule
  }
}

/**
 * Nettoie la description des aides (supprime HTML, limite taille)
 */
function cleanDescription(description: string): string {
  if (!description) return ''

  return description
    .replace(/<[^>]*>/g, '') // Supprime HTML
    .replace(/\s+/g, ' ') // Normalise espaces
    .trim()
    .substring(0, 300) + (description.length > 300 ? '...' : '')
}

/**
 * Mappe le type d'aide depuis l'API vers notre enum
 */
function mapAidType(aidType: string): AideFormation['type'] {
  const type = aidType.toLowerCase()

  if (type.includes('subvention') || type.includes('aide')) return 'subvention'
  if (type.includes('prêt') || type.includes('pret')) return 'pret'
  if (type.includes('exonération') || type.includes('fiscal')) return 'exoneration'

  return 'autre'
}

/**
 * Extrait le montant maximum depuis les données de l'aide
 */
function extractMontantMax(aide: AidesApiResponse['results'][0]): number | undefined {
  if (aide.subvention_rate_upper_bound && aide.subvention_rate_upper_bound > 0) {
    return aide.subvention_rate_upper_bound
  }

  if (aide.subvention_rate_lower_bound && aide.subvention_rate_lower_bound > 0) {
    return aide.subvention_rate_lower_bound
  }

  return undefined
}

/**
 * Extrait les critères d'éligibilité en array
 */
function extractEligibilite(eligibility: string): string[] {
  if (!eligibility) return []

  return eligibility
    .split(/[•\-\n\r]/)
    .map(item => item.trim())
    .filter(item => item.length > 5)
    .slice(0, 5) // Max 5 critères
}

/**
 * Vérifie si l'aide est pertinente pour le secteur beauté
 */
function isRelevantForBeautySector(nom: string, description: string): boolean {
  const text = (nom + ' ' + description).toLowerCase()

  const motsClesRelevants = [
    'formation', 'apprentissage', 'compétence', 'qualification',
    'esthétique', 'cosmétique', 'coiffure', 'beauté', 'bien-être',
    'artisanat', 'commerce', 'service', 'tpe', 'pme',
    'cpf', 'opco', 'fongecif', 'pole emploi'
  ]

  const motsExclus = [
    'agriculture', 'industrie', 'btp', 'transport', 'logistique',
    'numérique', 'informatique', 'tech'
  ]

  const hasRelevantKeywords = motsClesRelevants.some(mot => text.includes(mot))
  const hasExcludedKeywords = motsExclus.some(mot => text.includes(mot))

  return hasRelevantKeywords && !hasExcludedKeywords
}

/**
 * Batch enrichment pour plusieurs territoires
 */
export async function getAidesMultipleTerritoires(territoires: string[]): Promise<Record<string, AideFormation[]>> {
  console.log('[AIDES] Batch enrichment:', territoires.length, 'territoires')

  const results: Record<string, AideFormation[]> = {}

  // Process in parallel with max 3 concurrent requests (rate limiting)
  const chunks = []
  for (let i = 0; i < territoires.length; i += 3) {
    chunks.push(territoires.slice(i, i + 3))
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (territoire) => {
      const aides = await getAidesFormation({ departement: territoire })
      return { territoire, aides }
    })

    const chunkResults = await Promise.allSettled(promises)

    for (const settled of chunkResults) {
      if (settled.status === 'fulfilled') {
        results[settled.value.territoire] = settled.value.aides
      }
    }

    // Rate limiting entre chunks
    if (chunks.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log('[AIDES] Batch completed:', Object.keys(results).length, 'territoires')
  return results
}