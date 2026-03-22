import 'server-only'
// ============================================================
// CRM DERMOTEC — Scraping Production via Bright Data
// PagesJaunes + Planity + Treatwell + Google Avis
// Scraping Browser (anti-CAPTCHA, JS rendering, Cloudflare bypass)
// Web Unlocker (fallback) → Scrape.do (fallback 2)
// ============================================================

const BRIGHTDATA_API_URL = 'https://api.brightdata.com/request'
const SCRAPEDO_API_URL = 'https://api.scrape.do'
const MAX_RETRIES = 3

// Types
export interface PlatformReview {
  platform: string
  author: string
  rating: number
  text: string
  date?: string
  title?: string
  ownerResponded?: boolean
}

export interface ScrapedCompetitor {
  pagesJaunes?: {
    rating?: number
    reviewsCount?: number
    telephone?: string
    adresse?: string
    nom?: string
    website?: string
    description?: string
    horaires?: string[]
    categories?: string[]
    services?: string[]
    priceRange?: string
    photoUrls?: string[]
    reviews?: PlatformReview[]
  }
  planity?: {
    found: boolean
    nom?: string
    rating?: number
    reviewsCount?: number
    services?: string[]
    prix?: string[]
    adresse?: string
    telephone?: string
    horaires?: string[]
  }
  treatwell?: {
    found: boolean
    nom?: string
    rating?: number
    reviewsCount?: number
    services?: string[]
    prix?: string[]
    adresse?: string
  }
  google?: {
    rating?: number
    reviewsCount?: number
    reviews?: PlatformReview[]
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================
// FETCH ENGINE — 3 niveaux de fallback
// ============================================================

/** Scraping Browser — le plus puissant, anti-CAPTCHA, JS rendering complet */
async function fetchWithScrapingBrowser(url: string): Promise<string | null> {
  const apiKey = process.env.BRIGHTDATA_API_KEY
  if (!apiKey) return null

  const zone = process.env.BRIGHTDATA_SCRAPING_BROWSER_ZONE || 'scraping_browser1'

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(BRIGHTDATA_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zone,
          url,
          format: 'raw',
          country: 'fr',
          browser: true, // Active le Scraping Browser (headless Chrome)
        }),
        signal: AbortSignal.timeout(60000), // 60s timeout (les pages JS sont lentes)
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const html = await res.text()

      // Vérification qualité — la page doit avoir du contenu
      if (html.length < 500) throw new Error('Page trop courte, probablement bloquée')

      // Scraping Browser OK
      return html
    } catch (err) {
      console.warn(`[Scraper] ScrapingBrowser attempt ${attempt}/${MAX_RETRIES} failed:`, err)
      if (attempt < MAX_RETRIES) await sleep(3000 * attempt)
    }
  }
  return null
}

/** Web Unlocker — moins cher, pas de JS rendering, bon pour HTML statique */
async function fetchWithWebUnlocker(url: string): Promise<string | null> {
  const apiKey = process.env.BRIGHTDATA_API_KEY
  if (!apiKey) return null

  const zone = process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE || 'web_unlocker1'

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(BRIGHTDATA_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zone,
          url,
          format: 'raw',
          country: 'fr',
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()
      if (html.length < 500) throw new Error('Page trop courte')

      // WebUnlocker OK
      return html
    } catch (err) {
      console.warn(`[Scraper] WebUnlocker attempt ${attempt}/${MAX_RETRIES} failed:`, err)
      if (attempt < MAX_RETRIES) await sleep(2000 * attempt)
    }
  }
  return null
}

/** Scrape.do — fallback ultime, 1000 crédits gratuits */
async function fetchWithScrapeDo(url: string, renderJs = false): Promise<string | null> {
  const apiKey = process.env.SCRAPEDO_API_KEY
  if (!apiKey) return null

  try {
    const params = new URLSearchParams({
      token: apiKey,
      url,
      geoCode: 'fr',
      ...(renderJs && { render: 'true' }),
    })

    const res = await fetch(`${SCRAPEDO_API_URL}?${params}`, {
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) return null
    const html = await res.text()
    // Scrape.do OK
    return html
  } catch {
    return null
  }
}

/** Chain complet : ScrapingBrowser → WebUnlocker → Scrape.do */
async function fetchWithFullFallback(url: string, needsJs = false): Promise<string | null> {
  // Niveau 1 : Scraping Browser (anti-CAPTCHA, JS, le plus cher ~$0.20)
  if (needsJs) {
    const result = await fetchWithScrapingBrowser(url)
    if (result) return result
  }

  // Niveau 2 : Web Unlocker (proxies résidentiels, ~$0.05)
  const unlocked = await fetchWithWebUnlocker(url)
  if (unlocked) return unlocked

  // Niveau 3 : Scraping Browser si pas encore essayé
  if (!needsJs) {
    const browser = await fetchWithScrapingBrowser(url)
    if (browser) return browser
  }

  // Niveau 4 : Scrape.do fallback gratuit
  return fetchWithScrapeDo(url, needsJs)
}

// ============================================================
// PARSERS — Extraction exhaustive de chaque plateforme
// ============================================================

function parsePagesJaunes(html: string): ScrapedCompetitor['pagesJaunes'] {
  const result: NonNullable<ScrapedCompetitor['pagesJaunes']> = {}

  // Rating : patterns PJ vérifiés mars 2026
  const ratingMatch = html.match(/Note globale (\d+(?:[.,]\d)?)\s*sur\s*5\s*pour\s*(\d+)\s*avis/i)
    || html.match(/Note moyenne\s*(\d+(?:[.,]\d)?)\s*\/\s*5/i)
    || html.match(/(\d[.,]\d)\s*\/\s*5/)
  if (ratingMatch) {
    result.rating = parseFloat(ratingMatch[1].replace(',', '.'))
    const reviewsStr = ratingMatch[2] || html.match(/(\d+)\s*avis/i)?.[1]
    if (reviewsStr) result.reviewsCount = parseInt(reviewsStr)
  }

  // Nom
  const nameMatch = html.match(/class="[^"]*bi-denomination[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i)
    || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (nameMatch) result.nom = nameMatch[1].replace(/<[^>]+>/g, '').trim()

  // Téléphone
  const telMatch = html.match(/(?:0[1-9])(?:[\s.-]?\d{2}){4}/)
    || html.match(/\+33\s*[1-9](?:[\s.-]?\d{2}){4}/)
  if (telMatch) result.telephone = telMatch[0].replace(/[\s.-]/g, '').replace(/\+33/, '0')

  // Adresse
  const addrMatch = html.match(/class="[^"]*bi-address[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i)
    || html.match(/<address[^>]*>([\s\S]*?)<\/address>/i)
  if (addrMatch) result.adresse = addrMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

  // Site web
  const webMatch = html.match(/href="(https?:\/\/(?!www\.pagesjaunes)[^"]+)"[^>]*class="[^"]*(?:url|website|site)/i)
  if (webMatch) result.website = webMatch[1]

  // Description
  const descMatch = html.match(/id="teaser-description"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/)
    || html.match(/class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\//)
  if (descMatch) result.description = descMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500)

  // Horaires
  result.horaires = html
    .match(/(?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s+(?:de\s+)?\d{1,2}[h:]\d{2}\s*(?:à|-)\s*\d{1,2}[h:]\d{2}/gi)
    ?.map(h => h.trim()) || []

  // Catégories et services
  const allTags = [...new Set(
    (html.match(/class="bi-tag[^"]*"[^>]*>([^<]+)/g) || [])
      .map(m => m.replace(/class="bi-tag[^"]*"[^>]*>/, '').trim())
      .filter(t => t.length > 2)
  )]
  result.categories = allTags.slice(0, 15)
  result.services = allTags.filter(t =>
    /soin|beauté|esthétique|maquillage|épil|massage|ongle|pédicure|manucure|dermato|laser|micro|peeling|tatou/i.test(t)
  )

  // Prix
  const priceMatch = html.match(/(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/gi)
  if (priceMatch) result.priceRange = priceMatch.slice(0, 3).join(' - ')

  // Photos
  result.photoUrls = [...new Set(
    (html.match(/src="([^"]*(?:media\.pagesjaunes|media\/newdam)[^"]*\.(?:jpg|png|jpeg|webp))"/gi) || [])
      .map(m => m.replace(/^src="/, '').replace(/"$/, ''))
  )].slice(0, 5)

  // Avis individuels
  result.reviews = parsePjReviews(html)

  return result
}

function parsePjReviews(html: string): PlatformReview[] {
  const reviews: PlatformReview[] = []

  // JSON-LD d'abord
  const ldBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const block of ldBlocks) {
    try {
      const data = JSON.parse(block.replace(/<\/?script[^>]*>/gi, ''))
      const ldReviews = data?.review || data?.reviews || []
      if (Array.isArray(ldReviews)) {
        for (const r of ldReviews) {
          if (reviews.length >= 10) break
          reviews.push({
            platform: 'pagesjaunes',
            author: r.author?.name || r.author || 'Anonyme',
            rating: parseInt(r.reviewRating?.ratingValue || '5'),
            text: (r.reviewBody || '').slice(0, 500),
            date: r.datePublished,
          })
        }
      }
    } catch { /* skip */ }
  }
  if (reviews.length > 0) return reviews

  // HTML parsing fallback
  const authorTextPairs = html.matchAll(
    /(?:class="[^"]*(?:author|auteur|name)[^"]*"[^>]*>([^<]{2,40})<)[\s\S]{0,500}?(?:class="[^"]*(?:text|comment|content)[^"]*"[^>]*>([\s\S]{10,500}?)<\/)/gi
  )
  for (const match of authorTextPairs) {
    if (reviews.length >= 10) break
    const author = match[1]?.trim() || 'Anonyme'
    const text = match[2]?.replace(/<[^>]+>/g, '').trim() || ''
    if (text.length < 10) continue

    reviews.push({ platform: 'pagesjaunes', author, rating: 5, text })
  }

  return reviews
}

function parsePlanity(html: string): ScrapedCompetitor['planity'] {
  // Planity est une SPA React — vérifier que le contenu est rendu
  const has404 = html.includes('introuvable') && html.includes('404')
  const hasContent = html.length > 10000 && !has404
    && (html.includes('planity') || html.includes('Réserver') || html.includes('avis'))

  if (!hasContent) return { found: false }

  const result: NonNullable<ScrapedCompetitor['planity']> = { found: true }

  // Nom salon
  const nameMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (nameMatch) result.nom = nameMatch[1].replace(/<[^>]+>/g, '').trim()

  // Rating
  const ratingMatch = html.match(/(\d[.,]\d)\s*\/\s*5/i)
    || html.match(/note[^>]*>(\d[.,]\d)/i)
  if (ratingMatch) result.rating = parseFloat(ratingMatch[1].replace(',', '.'))

  // Nb avis
  const reviewsMatch = html.match(/(\d+)\s*avis/i)
  if (reviewsMatch) result.reviewsCount = parseInt(reviewsMatch[1])

  // Services et prix
  const serviceMatches = html.matchAll(/(?:class="[^"]*service[^"]*"[^>]*>|<li[^>]*>)\s*([\s\S]{5,100}?)\s*(?:<\/|<span[^>]*>(\d+[.,]?\d*)\s*€)/gi)
  const services: string[] = []
  const prix: string[] = []
  for (const m of serviceMatches) {
    const name = m[1]?.replace(/<[^>]+>/g, '').trim()
    if (name && name.length > 3) services.push(name)
    if (m[2]) prix.push(`${m[2]}€`)
  }
  if (services.length) result.services = [...new Set(services)].slice(0, 20)
  if (prix.length) result.prix = [...new Set(prix)].slice(0, 20)

  // Adresse
  const addrMatch = html.match(/(?:class="[^"]*address[^"]*"[^>]*>|<address[^>]*>)([\s\S]*?)<\//i)
  if (addrMatch) result.adresse = addrMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

  // Téléphone
  const telMatch = html.match(/(?:0[1-9])(?:[\s.-]?\d{2}){4}/)
  if (telMatch) result.telephone = telMatch[0]

  // Horaires
  result.horaires = html
    .match(/(?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)[^<]{5,50}/gi)
    ?.map(h => h.trim()).slice(0, 7) || []

  return result
}

function parseTreatwell(html: string): ScrapedCompetitor['treatwell'] {
  const hasContent = html.length > 5000
    && (html.includes('treatwell') || html.includes('Treatwell'))

  if (!hasContent) return { found: false }

  const result: NonNullable<ScrapedCompetitor['treatwell']> = { found: true }

  // Nom — chercher dans les résultats de listing, pas le H1 (qui est "Prestation")
  const salonNames = html.match(/data-testid="[^"]*salon[^"]*"[^>]*>([\s\S]*?)<\//gi)
    || html.match(/class="[^"]*salon-name[^"]*"[^>]*>([^<]+)/gi)
    || html.match(/<h[2-4][^>]*>([^<]{5,60})<\/h[2-4]>/gi)
  if (salonNames && salonNames.length > 0) {
    result.nom = salonNames[0].replace(/<[^>]+>/g, '').replace(/data-testid[^>]*>/, '').trim()
  }

  // Rating — attention, ne pas confondre avec les prix (5,25€)
  // Pattern Treatwell : note sur 5 avec avis, pas suivi de €
  const ratingMatch = html.match(/(\d[.,]\d)\s*(?:\/\s*5|sur\s*5)(?!\s*€)/i)
    || html.match(/class="[^"]*rating[^"]*"[^>]*>(\d[.,]\d)/i)
  if (ratingMatch) result.rating = parseFloat(ratingMatch[1].replace(',', '.'))

  const reviewsMatch = html.match(/(\d+)\s*avis/i)
  if (reviewsMatch) result.reviewsCount = parseInt(reviewsMatch[1])

  // Services et prix
  const services: string[] = []
  const prix: string[] = []
  const priceMatches = html.matchAll(/([\w\sÀ-ÿ'-]{5,60})\s*(?:à partir de\s*)?(\d+[.,]?\d*)\s*€/gi)
  for (const m of priceMatches) {
    services.push(m[1].trim())
    prix.push(`${m[2]}€`)
  }
  if (services.length) result.services = [...new Set(services)].slice(0, 20)
  if (prix.length) result.prix = [...new Set(prix)].slice(0, 20)

  // Adresse
  const addrMatch = html.match(/(?:class="[^"]*address[^"]*"[^>]*>|<address[^>]*>)([\s\S]*?)<\//i)
  if (addrMatch) result.adresse = addrMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

  return result
}

function parseGoogleReviews(html: string): ScrapedCompetitor['google'] {
  const result: NonNullable<ScrapedCompetitor['google']> = {}

  // Rating depuis JSON-LD
  const ldBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const block of ldBlocks) {
    try {
      const data = JSON.parse(block.replace(/<\/?script[^>]*>/gi, ''))
      if (data?.aggregateRating) {
        result.rating = parseFloat(data.aggregateRating.ratingValue)
        result.reviewsCount = parseInt(data.aggregateRating.reviewCount || '0')
      }
      if (data?.review && Array.isArray(data.review)) {
        result.reviews = data.review.slice(0, 10).map((r: { author?: { name?: string }; reviewRating?: { ratingValue?: string }; reviewBody?: string; datePublished?: string }) => ({
          platform: 'google',
          author: r.author?.name || 'Anonyme',
          rating: parseInt(r.reviewRating?.ratingValue || '5'),
          text: (r.reviewBody || '').slice(0, 500),
          date: r.datePublished,
        }))
      }
    } catch { /* skip */ }
  }

  return result
}

// ============================================================
// ORCHESTRATEUR PRINCIPAL
// ============================================================

export async function scrapeCompetitorFull(params: {
  nom: string
  ville: string
  pagesJaunesUrl?: string
  planityUrl?: string
  treatwellUrl?: string
  googleMapsUrl?: string
}): Promise<ScrapedCompetitor> {
  const results: ScrapedCompetitor = {}

  // Scraping complet lancé

  // Construire URLs avec les bons formats (testés mars 2026)
  const slugify = (s: string) => s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const nomSlug = slugify(params.nom)
  const villeSlug = slugify(params.ville)
  const cp = params.ville.match(/\d{5}/)?.[0] || ''
  const cp5 = cp || '75011'

  const pjUrl = params.pagesJaunesUrl ||
    `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(params.nom)}&ou=${encodeURIComponent(params.ville)}`

  // Planity : format /{nom-slug}-{codepostal}-{ville}
  const planityUrl = params.planityUrl ||
    `https://www.planity.com/${nomSlug}-${cp5}-${villeSlug}`

  // Treatwell : recherche par catégorie + arrondissement
  const treatwellUrl = params.treatwellUrl ||
    `https://www.treatwell.fr/salons/institut-de-beaute/${villeSlug}/`

  // Lancer tous les scrapings en parallèle (Promise.allSettled = pas de crash si un échoue)
  const [pjResult, planityResult, treatwellResult] = await Promise.allSettled([
    // PagesJaunes — Cloudflare protégé, besoin Scraping Browser
    fetchWithFullFallback(pjUrl, true).then(html => {
      if (html) {
        results.pagesJaunes = parsePagesJaunes(html)
        // PJ parsed
      }
    }),

    // Planity — JS heavy, besoin Scraping Browser
    fetchWithFullFallback(planityUrl, true).then(html => {
      if (html) {
        results.planity = parsePlanity(html)
        // Planity parsed
      }
    }),

    // Treatwell — moins protégé, Web Unlocker suffit souvent
    fetchWithFullFallback(treatwellUrl, false).then(html => {
      if (html) {
        results.treatwell = parseTreatwell(html)
        // Treatwell parsed
      }
    }),
  ])

  return results
}

// Export aussi le scraper simple pour compatibilité
export { scrapeCompetitorFull as scrapeCompetitor }
