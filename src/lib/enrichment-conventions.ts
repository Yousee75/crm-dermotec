import 'server-only'

/**
 * CRM DERMOTEC — Enrichissement Conventions Collectives
 *
 * API Conventions Collectives (100% gratuite, aucune auth)
 * Endpoint: https://siret2idcc.fabrique.social.gouv.fr/api/v2/{siret}
 *
 * IDCC importantes secteur beauté :
 * - 3032 : Esthétique-cosmétique (24h formation/an)
 * - 3050 : Coiffure (20h formation/an)
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

export interface ConventionCollective {
  siret: string
  idcc: number
  intitule: string
  est_esthetique: boolean // IDCC 3032
  est_coiffure: boolean   // IDCC 3050
  droit_formation_heures: number // Heures formation/an selon IDCC
}

const IDCC_ESTHETIQUE = 3032
const IDCC_COIFFURE = 3050

const CACHE_TTL = 60 * 60 * 24 // 24 heures
const TIMEOUT_MS = 15000

/**
 * Récupère la convention collective d'un SIRET
 */
export async function getConventionCollective(siret: string): Promise<ConventionCollective | null> {
  if (!siret || siret.length !== 14) {
    return null
  }

  const cacheKey = `conv:${siret}`

  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return cached
      }
    } catch (error) {
      // Cache read error — continue
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(
      `https://siret2idcc.fabrique.social.gouv.fr/api/v2/${siret}`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CRM-Dermotec/1.0'
        }
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data || typeof data.idcc !== 'number') {
      return null
    }

    const convention: ConventionCollective = {
      siret,
      idcc: data.idcc,
      intitule: data.intitule || 'Convention non identifiée',
      est_esthetique: data.idcc === IDCC_ESTHETIQUE,
      est_coiffure: data.idcc === IDCC_COIFFURE,
      droit_formation_heures: getDroitFormationHeures(data.idcc)
    }

    // Cache result
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, convention)
      } catch (error) {
        // Cache write error — continue
      }
    }

    return convention

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Timeout after 15s
    } else {
      // Fetch error — silent fallback
    }
    return null
  }
}

/**
 * Calcule les heures de formation selon l'IDCC
 */
function getDroitFormationHeures(idcc: number): number {
  switch (idcc) {
    case IDCC_ESTHETIQUE:
      return 24 // 24h/an pour esthétique-cosmétique
    case IDCC_COIFFURE:
      return 20 // 20h/an pour coiffure
    default:
      return 14 // Minimum légal CPF
  }
}

/**
 * Vérifie si un SIRET est dans le secteur beauté (esthétique ou coiffure)
 */
export async function isSecteurBeaute(siret: string): Promise<boolean> {
  const convention = await getConventionCollective(siret)
  return convention?.est_esthetique || convention?.est_coiffure || false
}

/**
 * Batch enrichment pour plusieurs SIRETs
 */
export async function getConventionsCollectives(sirets: string[]): Promise<Record<string, ConventionCollective | null>> {
  const results: Record<string, ConventionCollective | null> = {}

  // Process in parallel with max 5 concurrent requests
  const chunks = []
  for (let i = 0; i < sirets.length; i += 5) {
    chunks.push(sirets.slice(i, i + 5))
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (siret) => {
      const result = await getConventionCollective(siret)
      return { siret, result }
    })

    const chunkResults = await Promise.allSettled(promises)

    for (const settled of chunkResults) {
      if (settled.status === 'fulfilled') {
        results[settled.value.siret] = settled.value.result
      }
    }

    // Rate limiting entre chunks
    if (chunks.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return results
}