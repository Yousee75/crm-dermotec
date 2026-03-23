/**
 * Test du scraping multi-profils
 * Vérifie que les parsers fonctionnent avec différents types d'instituts
 */

// Types pour le test
interface Review {
  platform: string
  author: string
  rating: number
  text: string
  date?: string
}

interface ScrapingResult {
  url: string
  reviews: Review[]
  rating_avg?: number
  reviews_count?: number
  error?: string
}

interface TestProfile {
  name: string
  type: string
  description: string
  urls: {
    pagesjaunes?: string
    planity?: string
    google?: string
  }
}

// Configuration des 3 profils de test
const TEST_PROFILES: TestProfile[] = [
  {
    name: "Latitude Zen",
    type: "Institut établi",
    description: "Paris 11e, 21 ans d'expérience, beaucoup d'avis",
    urls: {
      pagesjaunes: "https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=Latitude+Zen&ou=Paris+11e",
      planity: "https://www.planity.com/latitude-zen-75011-paris"
    }
  },
  {
    name: "Institut Beauté Prestige",
    type: "Petit institut",
    description: "Institut local, moins de 50 avis",
    urls: {
      google: "ChIJ_R8XwC1u5kcR8VGztdlm1nE" // Place ID exemple
    }
  },
  {
    name: "Body Minute",
    type: "Chaîne franchise",
    description: "Franchise, beaucoup de résultats",
    urls: {
      pagesjaunes: "https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=Body+Minute&ou=Paris",
      planity: "https://www.planity.com/s/body-minute"
    }
  }
]

// Reproduction des regex clés (sans import server-only)
function extractJsonLdReviews(html: string): Review[] {
  const reviews: Review[] = []

  // JSON-LD reviews pattern
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis
  let match

  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const jsonData = JSON.parse(match[1])

      if (jsonData.review || jsonData['@type'] === 'Review') {
        const reviewData = jsonData.review || jsonData
        if (Array.isArray(reviewData)) {
          reviewData.forEach((review: any) => {
            if (review.reviewRating && review.author) {
              reviews.push({
                platform: 'jsonld',
                author: review.author?.name || review.author || 'Anonyme',
                rating: parseFloat(review.reviewRating.ratingValue || review.reviewRating) || 0,
                text: review.reviewBody || review.description || '',
                date: review.datePublished
              })
            }
          })
        } else if (reviewData.reviewRating) {
          reviews.push({
            platform: 'jsonld',
            author: reviewData.author?.name || reviewData.author || 'Anonyme',
            rating: parseFloat(reviewData.reviewRating.ratingValue || reviewData.reviewRating) || 0,
            text: reviewData.reviewBody || reviewData.description || '',
            date: reviewData.datePublished
          })
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  return reviews
}

function extractRating(html: string): number | null {
  const patterns = [
    /rating["\s:]+([0-9,.]+)/i,
    /note["\s:]+([0-9,.]+)/i,
    /score["\s:]+([0-9,.]+)/i,
    /"ratingValue"["\s:]+([0-9,.]+)/i,
    /moyenne["\s:]+([0-9,.]+)/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const rating = parseFloat(match[1].replace(',', '.'))
      if (rating >= 0 && rating <= 5) {
        return rating
      }
    }
  }

  return null
}

function extractReviewsCount(html: string): number | null {
  const patterns = [
    /([0-9,.\s]+)\s*avis/i,
    /([0-9,.\s]+)\s*commentaires?/i,
    /([0-9,.\s]+)\s*reviews?/i,
    /"reviewCount"["\s:]+([0-9,.\s]+)/i,
    /"aggregateRating"[^}]*"reviewCount"["\s:]+([0-9,.\s]+)/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const count = parseInt(match[1].replace(/[,.\s]/g, ''))
      if (!isNaN(count) && count >= 0) {
        return count
      }
    }
  }

  return null
}

// Fonction de scraping via Bright Data
async function scrapeBrightData(url: string, needsBrowser: boolean = false): Promise<string> {
  try {
    // Configuration proxy Bright Data
    const proxyUrl = needsBrowser
      ? `http://brd-customer-hl_${process.env.BRIGHTDATA_CUSTOMER_ID}-zone-scraping_browser:${process.env.BRIGHTDATA_PASSWORD}@brd.superproxy.io:22225`
      : `http://brd-customer-hl_${process.env.BRIGHTDATA_CUSTOMER_ID}-zone-datacenter:${process.env.BRIGHTDATA_PASSWORD}@brd.superproxy.io:22225`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()

    if (!html || html.length < 100) {
      throw new Error('Contenu HTML trop court ou vide')
    }

    return html
  } catch (error) {
    console.error('Erreur scraping Bright Data:', error)
    throw error
  }
}

// Test d'une URL avec parser local
async function testScrapingUrl(url: string, platform: string): Promise<ScrapingResult> {
  try {
    console.log(`\n🔍 Test ${platform}: ${url}`)

    const html = await scrapeBrightData(url, platform === 'planity')

    // Parser avec nos regex locales
    const reviews = extractJsonLdReviews(html)
    const rating = extractRating(html)
    const reviewsCount = extractReviewsCount(html)

    console.log(`✅ Résultat: ${reviews.length} avis extraits, note: ${rating}, total: ${reviewsCount}`)

    // Log détaillé pour debug
    if (reviews.length === 0) {
      console.log(`⚠️ Aucun avis trouvé. Taille HTML: ${html.length} caractères`)
      // Chercher des indices dans le HTML
      const hasReviewKeywords = /avis|review|commentaire/i.test(html)
      const hasRatingKeywords = /note|rating|étoile/i.test(html)
      console.log(`   - Mots-clés avis détectés: ${hasReviewKeywords}`)
      console.log(`   - Mots-clés notation détectés: ${hasRatingKeywords}`)
    }

    return {
      url,
      reviews,
      rating_avg: rating || undefined,
      reviews_count: reviewsCount || undefined
    }

  } catch (error) {
    console.error(`❌ Erreur ${platform}:`, error)
    return {
      url,
      reviews: [],
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

// Test complet d'un profil
async function testProfile(profile: TestProfile): Promise<void> {
  console.log(`\n🎯 === TEST PROFIL: ${profile.name} (${profile.type}) ===`)
  console.log(`📝 ${profile.description}`)

  const results: ScrapingResult[] = []
  let totalReviews = 0
  let platformsWithReviews = 0

  // Test Pages Jaunes
  if (profile.urls.pagesjaunes) {
    const result = await testScrapingUrl(profile.urls.pagesjaunes, 'pagesjaunes')
    results.push(result)
    if (result.reviews.length > 0) {
      totalReviews += result.reviews.length
      platformsWithReviews++
    }
    // Délai entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Test Planity
  if (profile.urls.planity) {
    const result = await testScrapingUrl(profile.urls.planity, 'planity')
    results.push(result)
    if (result.reviews.length > 0) {
      totalReviews += result.reviews.length
      platformsWithReviews++
    }
    // Délai entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Test Google (si place_id)
  if (profile.urls.google) {
    const googleUrl = `https://www.google.com/maps/place/?q=place_id:${profile.urls.google}`
    const result = await testScrapingUrl(googleUrl, 'google')
    results.push(result)
    if (result.reviews.length > 0) {
      totalReviews += result.reviews.length
      platformsWithReviews++
    }
  }

  // Bilan du profil
  console.log(`\n📊 BILAN ${profile.name}:`)
  console.log(`- Plateformes testées: ${results.length}`)
  console.log(`- Plateformes avec avis: ${platformsWithReviews}`)
  console.log(`- Total avis récupérés: ${totalReviews}`)

  // Détail par plateforme
  results.forEach((result, index) => {
    const platform = Object.keys(profile.urls)[index]
    if (result.error) {
      console.log(`  ❌ ${platform}: ERREUR - ${result.error}`)
    } else {
      console.log(`  ✅ ${platform}: ${result.reviews.length} avis, note ${result.rating_avg || 'N/A'}, total ${result.reviews_count || 'N/A'}`)
    }
  })

  // Échantillon d'avis
  if (totalReviews > 0) {
    console.log(`\n📝 Échantillon avis (3 premiers):`)
    const allReviews = results.flatMap(r => r.reviews)
    allReviews.slice(0, 3).forEach((review, i) => {
      console.log(`  ${i + 1}. ${review.author} (${review.rating}/5): ${(review.text || '').slice(0, 100)}...`)
    })
  }
}

// Fonction principale
async function main() {
  console.log('🚀 DÉMARRAGE TEST SCRAPING MULTI-PROFILS')
  console.log('========================================')

  // Vérifier les variables d'environnement
  if (!process.env.BRIGHTDATA_CUSTOMER_ID || !process.env.BRIGHTDATA_PASSWORD) {
    console.error('❌ Variables Bright Data manquantes:')
    console.error('   - BRIGHTDATA_CUSTOMER_ID')
    console.error('   - BRIGHTDATA_PASSWORD')
    console.error('\nAjouter ces variables dans .env.local')
    process.exit(1)
  }

  const startTime = Date.now()
  const results = {
    totalProfiles: TEST_PROFILES.length,
    successfulProfiles: 0,
    totalReviews: 0,
    totalPlatforms: 0,
    errors: [] as string[]
  }

  // Tester chaque profil
  for (const profile of TEST_PROFILES) {
    try {
      await testProfile(profile)
      results.successfulProfiles++
      results.totalPlatforms += Object.keys(profile.urls).length
    } catch (error) {
      console.error(`❌ Erreur profil ${profile.name}:`, error)
      results.errors.push(`${profile.name}: ${error}`)
    }
  }

  // Bilan final
  const duration = Math.round((Date.now() - startTime) / 1000)
  console.log(`\n🏁 BILAN FINAL (${duration}s)`)
  console.log('=======================')
  console.log(`✅ Profils testés: ${results.successfulProfiles}/${results.totalProfiles}`)
  console.log(`🔗 Plateformes testées: ${results.totalPlatforms}`)
  console.log(`📝 Total avis récupérés: ${results.totalReviews}`)

  if (results.errors.length > 0) {
    console.log(`\n❌ Erreurs (${results.errors.length}):`)
    results.errors.forEach(error => console.log(`  - ${error}`))
  }

  // Recommandations
  console.log('\n💡 RECOMMANDATIONS:')
  if (results.successfulProfiles < results.totalProfiles) {
    console.log('- Vérifier la connectivité Bright Data')
    console.log('- Ajuster les User-Agent pour certaines plateformes')
  }
  if (results.totalReviews < 10) {
    console.log('- Améliorer les regex d\'extraction')
    console.log('- Tester d\'autres sélecteurs CSS/XPath')
  }

  console.log('\n🔚 Test terminé.')
}

// Exécution
if (require.main === module) {
  main().catch(console.error)
}

export { testProfile, scrapeBrightData, extractJsonLdReviews }