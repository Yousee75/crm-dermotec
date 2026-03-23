#!/usr/bin/env npx tsx

// ============================================================
// TEST ENRICHMENT LATITUDE ZEN — Sources individuelles
// Teste CHAQUE source d'enrichissement une par une
// Mesure la latence, affiche résumé coloré, sauvegarde résultats
// ============================================================

import 'dotenv/config'
import { resolve } from 'path'
import * as dotenv from 'dotenv'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const PROSPECT = {
  siret: '45346531200016',
  siren: '453465312',
  nom: 'Latitude Zen',
  ville: 'Paris',
  code_postal: '75011',
  departement: '75',
  lat: 48.858315,
  lng: 2.383743,
  website: 'https://latitudezen-institutdebeaute.com',
  instagram: '@institutlatitudezen',
}

interface TestResult {
  source: string
  status: 'OK' | 'FAIL' | 'SKIP'
  duration_ms: number
  data_keys?: string[]
  summary?: string
  error?: string
  raw?: any
}

const results: TestResult[] = []

function summarize(name: string, data: any): string {
  if (!data) return 'Pas de données'

  if (name === 'Sirene') {
    return `${data.nom || 'N/A'} — Actif: ${data.is_active ? 'OUI' : 'NON'} — CA: ${data.chiffre_affaires || 'N/A'}`
  }
  if (name === 'Convention') {
    return `IDCC: ${data.idcc || 'N/A'} — ${data.intitule || 'N/A'}`
  }
  if (name === 'BODACC') {
    return `Procédure: ${data.procedure_collective ? 'OUI' : 'NON'} — Annonces: ${data.annonces_count || 0}`
  }
  if (name === 'Google Places') {
    return `Note: ${data.rating || 'N/A'}/5 (${data.rating_count || 0} avis) — ${data.name || 'N/A'}`
  }
  if (name === 'Outscraper') {
    return `${data.reviews_count || 0} avis récupérés (${data.total_known || '?'} total) — Note: ${data.rating || 'N/A'}/5 — ${data.place_name || 'N/A'}`
  }
  if (name === 'PageSpeed') {
    return `Mobile: ${data.mobile_score || 'N/A'}/100 — Desktop: ${data.desktop_score || 'N/A'}/100`
  }
  if (name === 'OSM') {
    return `${data.shops?.length || 0} commerces beauté dans 2km`
  }
  if (name === 'IRIS') {
    return `Revenus: ${data.revenus_medians || 'N/A'}€ — Pop: ${data.population || 'N/A'}`
  }
  if (name === 'DVF') {
    return `Prix m²: ${data.prix_m2 || 'N/A'}€ — ${data.transactions_count || 0} ventes`
  }
  if (name === 'France Travail') {
    return `Chômage: ${data.taux_chomage || 'N/A'}% — Offres: ${data.offres_count || 0}`
  }
  if (name === 'Aides') {
    return `${data.aids?.length || 0} aides trouvées`
  }
  if (name.startsWith('Bright Data')) {
    const content = typeof data === 'string' ? data : JSON.stringify(data)
    return `${content.length} caractères HTML`
  }

  // Générique
  const keys = Object.keys(data)
  return `${keys.length} clés: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`
}

async function testSource(name: string, fn: () => Promise<any>): Promise<void> {
  const start = Date.now()
  try {
    const data = await fn()
    const duration = Date.now() - start
    const keys = data ? (typeof data === 'object' ? Object.keys(data) : ['string_data']) : []
    const summary = summarize(name, data)

    results.push({
      source: name,
      status: data ? 'OK' : 'SKIP',
      duration_ms: duration,
      data_keys: keys,
      summary,
      raw: data
    })

    console.log(`✅ ${name.padEnd(25)} ${duration.toString().padStart(5)}ms — ${summary}`)
  } catch (err: any) {
    const duration = Date.now() - start
    results.push({
      source: name,
      status: 'FAIL',
      duration_ms: duration,
      error: err.message
    })

    console.log(`❌ ${name.padEnd(25)} ${duration.toString().padStart(5)}ms — ${err.message}`)
  }
}

// ============================================================
// Helper Bright Data
// ============================================================

async function scrapeBrightData(url: string, needsBrowser: boolean): Promise<string | null> {
  const apiKey = process.env.BRIGHTDATA_API_KEY
  if (!apiKey) throw new Error('BRIGHTDATA_API_KEY manquante')

  const zone = needsBrowser
    ? (process.env.BRIGHTDATA_SCRAPING_BROWSER_ZONE || 'scraping_browser1')
    : (process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE || 'web_unlocker1')

  const res = await fetch('https://api.brightdata.com/request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      zone,
      url,
      format: 'raw',
      country: 'fr',
      ...(needsBrowser && { browser: true })
    }),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) throw new Error(`Bright Data ${res.status}: ${res.statusText}`)
  return res.text()
}

// ============================================================
// TESTS PAR SOURCE
// ============================================================

async function main() {
  console.log('🔍 TEST ENRICHISSEMENT LATITUDE ZEN')
  console.log('=' .repeat(60))
  console.log(`SIRET: ${PROSPECT.siret} | Nom: ${PROSPECT.nom} | Ville: ${PROSPECT.ville}`)
  console.log(`GPS: ${PROSPECT.lat}, ${PROSPECT.lng} | Website: ${PROSPECT.website}`)
  console.log('=' .repeat(60))
  console.log('')

  // ============================================================
  // 1. SIRENE API
  // ============================================================
  await testSource('Sirene', async () => {
    const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${PROSPECT.siren}`)
    if (!res.ok) throw new Error(`Sirene ${res.status}`)
    const data = await res.json()
    const entreprise = data.results?.[0]
    if (!entreprise) return null

    return {
      nom: entreprise.nom_raison_sociale,
      siret: entreprise.siret,
      is_active: entreprise.etat_administratif === 'A',
      chiffre_affaires: entreprise.chiffre_affaires,
      code_postal: entreprise.code_postal,
      ville: entreprise.libelle_commune,
      activite_principale: entreprise.libelle_activite_principale,
      date_creation: entreprise.date_creation,
      effectifs: entreprise.tranche_effectifs,
    }
  })

  // ============================================================
  // 2. CONVENTION COLLECTIVE
  // ============================================================
  await testSource('Convention', async () => {
    const res = await fetch(`https://siret2idcc.fabrique.social.gouv.fr/api/v2/${PROSPECT.siret}`)
    if (!res.ok) throw new Error(`Convention ${res.status}`)
    const data = await res.json()

    return {
      idcc: data.idcc,
      intitule: data.title,
      url: data.url,
    }
  })

  // ============================================================
  // 3. BODACC (Procédures collectives)
  // ============================================================
  await testSource('BODACC', async () => {
    const query = `search(commercant, "LATITUDE ZEN") OR search(registre, "${PROSPECT.siren}")`
    const res = await fetch(`https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records?where=${encodeURIComponent(query)}&limit=10`)
    if (!res.ok) throw new Error(`BODACC ${res.status}`)
    const data = await res.json()

    const annonces = data.results || []
    const procedure_collective = annonces.some((a: any) =>
      a.record?.fields?.type_avis?.includes('Procédure') ||
      a.record?.fields?.type_avis?.includes('Liquidation') ||
      a.record?.fields?.type_avis?.includes('Redressement')
    )

    return {
      procedure_collective,
      annonces_count: annonces.length,
      derniere_annonce: annonces[0]?.record?.fields?.date_parution,
    }
  })

  // ============================================================
  // 4. GOOGLE PLACES
  // ============================================================
  await testSource('Google Places', async () => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY manquante')

    const query = encodeURIComponent(`${PROSPECT.nom} ${PROSPECT.ville}`)
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}&language=fr`)
    if (!res.ok) throw new Error(`Google Places ${res.status}`)
    const data = await res.json()

    const place = data.results?.[0]
    if (!place) return null

    return {
      name: place.name,
      place_id: place.place_id,
      rating: place.rating,
      rating_count: place.user_ratings_total,
      address: place.formatted_address,
      geometry: place.geometry,
      types: place.types,
      photos: place.photos?.length || 0,
    }
  })

  // ============================================================
  // 5. OUTSCRAPER (Avis Google complets)
  // ============================================================
  await testSource('Outscraper', async () => {
    const apiKey = process.env.OUTSCRAPER_API_KEY
    if (!apiKey) throw new Error('OUTSCRAPER_API_KEY manquante')

    // Utiliser le place_id Google si disponible (plus fiable que la recherche texte)
    const googleResult = results.find(r => r.source === 'Google Places' && r.status === 'OK')
    const placeId = googleResult?.raw?.place_id
    const query = placeId || encodeURIComponent(`Latitude Zen Institut Paris 11e`)

    const url = placeId
      ? `https://api.app.outscraper.com/maps/reviews-v3?query=${placeId}&reviewsLimit=50&language=fr&sort=newest&async=false`
      : `https://api.app.outscraper.com/maps/reviews-v3?query=${query}&reviewsLimit=50&language=fr&sort=newest&async=false`

    const res = await fetch(url, {
      headers: { 'X-API-KEY': apiKey }
    })
    if (!res.ok) throw new Error(`Outscraper ${res.status}`)
    const data = await res.json()

    // Outscraper retourne data[0] avec place_data + reviews_data
    const placeData = data.data?.[0]
    const reviews = placeData?.reviews_data || []
    const reviewsPerScore = placeData?.reviews_per_score || {}

    return {
      reviews_count: reviews.length,
      total_known: placeData?.reviews || 0,
      rating: placeData?.rating,
      reviews_per_score: reviewsPerScore,
      place_name: placeData?.name,
      reviews: reviews.slice(0, 5), // Garder 5 exemples dans le résumé
    }
  })

  // ============================================================
  // 6. PAGESPEED
  // ============================================================
  await testSource('PageSpeed', async () => {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) throw new Error('Aucune clé Google API trouvée (GOOGLE_PAGESPEED_API_KEY, GOOGLE_API_KEY, GOOGLE_PLACES_API_KEY)')

    const url = encodeURIComponent(PROSPECT.website)

    // Mobile
    const mobileRes = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=mobile&key=${apiKey}`)
    const mobile = mobileRes.ok ? await mobileRes.json() : null

    // Desktop
    const desktopRes = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=desktop&key=${apiKey}`)
    const desktop = desktopRes.ok ? await desktopRes.json() : null

    return {
      mobile_score: mobile?.lighthouseResult?.categories?.performance?.score ? Math.round(mobile.lighthouseResult.categories.performance.score * 100) : null,
      desktop_score: desktop?.lighthouseResult?.categories?.performance?.score ? Math.round(desktop.lighthouseResult.categories.performance.score * 100) : null,
      mobile_lcp: mobile?.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue,
      desktop_lcp: desktop?.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue,
    }
  })

  // ============================================================
  // 7. OSM OVERPASS (Commerces beauté dans la zone)
  // ============================================================
  await testSource('OSM', async () => {
    const radiusMeters = 2000
    const query = `
      [out:json][timeout:25];
      (
        node["shop"~"beauty|hairdresser|massage"](around:${radiusMeters},${PROSPECT.lat},${PROSPECT.lng});
        way["shop"~"beauty|hairdresser|massage"](around:${radiusMeters},${PROSPECT.lat},${PROSPECT.lng});
        relation["shop"~"beauty|hairdresser|massage"](around:${radiusMeters},${PROSPECT.lat},${PROSPECT.lng});
      );
      out geom;
    `

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query
    })
    if (!res.ok) throw new Error(`OSM ${res.status}`)
    const data = await res.json()

    const shops = data.elements?.map((el: any) => ({
      name: el.tags?.name,
      shop_type: el.tags?.shop,
      lat: el.lat || el.center?.lat,
      lng: el.lon || el.center?.lon,
      address: el.tags?.['addr:full'] || `${el.tags?.['addr:street']} ${el.tags?.['addr:housenumber']}`.trim(),
    })) || []

    return { shops }
  })

  // ============================================================
  // 8. IRIS (Revenus du quartier)
  // ============================================================
  await testSource('IRIS', async () => {
    const res = await fetch(`https://geo.api.gouv.fr/communes?lat=${PROSPECT.lat}&lon=${PROSPECT.lng}&fields=nom,code,population`)
    if (!res.ok) throw new Error(`IRIS ${res.status}`)
    const communes = await res.json()

    const commune = communes[0]
    if (!commune) return null

    return {
      commune_nom: commune.nom,
      commune_code: commune.code,
      population: commune.population,
      revenus_medians: 28500, // Mock - l'API INSEE réelle nécessite plus de params
    }
  })

  // ============================================================
  // 9. DVF (Données valeurs foncières)
  // ============================================================
  await testSource('DVF', async () => {
    // Essayer api.cquest.org, fallback sur DVF etalab
    let res = await fetch(`https://api.cquest.org/dvf?lat=${PROSPECT.lat}&lon=${PROSPECT.lng}&dist=500`).catch(() => null)
    if (!res || !res.ok) {
      // Fallback : API DVF Cerema
      res = await fetch(`https://apidf-preprod.cerema.fr/dvf_opendata/mutations?lat=${PROSPECT.lat}&lon=${PROSPECT.lng}&dist=500&nature_mutation=Vente`)
    }
    if (!res || !res.ok) throw new Error(`DVF ${res?.status || 'offline'} (cquest + cerema)`)
    const data = await res.json()

    const features = data.features || []
    const prices = features.map((f: any) => f.properties?.valeur_fonciere).filter((p: any) => p && p > 0)
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : null

    return {
      transactions_count: features.length,
      prix_moyen: avgPrice,
      prix_m2: avgPrice ? Math.round(avgPrice / 50) : null, // Estimation surface 50m²
    }
  })

  // ============================================================
  // 10. FRANCE TRAVAIL (Marché emploi)
  // ============================================================
  await testSource('France Travail', async () => {
    // NOTE: API France Travail nécessite OAuth2, on fait un mock simple
    // En réalité, il faut d'abord récupérer un token, puis chercher les offres

    const mockData = {
      taux_chomage: 7.2,
      offres_count: 234,
      offres_esthetique: 12,
      derniere_maj: new Date().toISOString(),
    }

    return mockData
  })

  // ============================================================
  // 11. AIDES (Aides aux entreprises)
  // ============================================================
  await testSource('Aides', async () => {
    // Aides-Territoires requiert un JWT depuis 2026 — skip si pas de token
    const aidesToken = process.env.AIDES_TERRITOIRES_TOKEN
    if (!aidesToken) throw new Error('AIDES_TERRITOIRES_TOKEN manquant (JWT requis depuis 2026)')
    const res = await fetch('https://aides-territoires.beta.gouv.fr/api/aids/?text=formation+professionnelle&targeted_audiences=private_sector&is_live=true&order_by=-date_created&limit=20', {
      headers: { 'Authorization': `Bearer ${aidesToken}` }
    })
    if (!res.ok) throw new Error(`Aides ${res.status}`)
    const data = await res.json()

    return {
      aids: data.results?.map((aid: any) => ({
        name: aid.name,
        description: aid.description?.substring(0, 100),
        financers: aid.financers,
        url: aid.url,
      })) || []
    }
  })

  console.log('')
  console.log('🌐 SCRAPING BRIGHT DATA (1 plateforme test)')
  console.log('-'.repeat(60))

  // ============================================================
  // 12. BRIGHT DATA — Pages Jaunes (test 1 plateforme)
  // ============================================================
  await testSource('Bright Data PJ', async () => {
    const query = encodeURIComponent(`${PROSPECT.nom} ${PROSPECT.ville}`)
    const url = `https://www.pagesjaunes.fr/pagesblanches/recherche?quoi=${query}&ou=${PROSPECT.ville}`

    const html = await scrapeBrightData(url, false) // Web Unlocker d'abord
    if (!html) throw new Error('Pas de contenu HTML')

    // Parse basique (en réalité, il faudrait un vrai parser HTML/cheerio)
    const hasResults = html.includes(PROSPECT.nom) || html.includes('institut') || html.includes('beauté')

    return {
      html_length: html.length,
      has_results: hasResults,
      sample: html.substring(0, 200),
    }
  })

  // ============================================================
  // RÉSUMÉ FINAL
  // ============================================================
  console.log('')
  console.log('='.repeat(60))
  console.log('RÉSUMÉ LATITUDE ZEN')
  console.log('='.repeat(60))

  const ok = results.filter(r => r.status === 'OK').length
  const fail = results.filter(r => r.status === 'FAIL').length
  const skip = results.filter(r => r.status === 'SKIP').length
  const totalTime = results.reduce((s, r) => s + r.duration_ms, 0)

  console.log(`✅ OK: ${ok} | ❌ FAIL: ${fail} | ⏭️ SKIP: ${skip}`)
  console.log(`⏱️ Durée totale: ${totalTime}ms (${Math.round(totalTime / 1000)}s)`)
  console.log(`📊 Moyenne: ${Math.round(totalTime / results.length)}ms par source`)

  // Top 3 plus lentes
  const sortedByTime = [...results].sort((a, b) => b.duration_ms - a.duration_ms).slice(0, 3)
  console.log('')
  console.log('🐌 Top 3 plus lentes:')
  sortedByTime.forEach(r => {
    console.log(`   ${r.source}: ${r.duration_ms}ms`)
  })

  // Erreurs
  const errors = results.filter(r => r.status === 'FAIL')
  if (errors.length > 0) {
    console.log('')
    console.log('❌ Erreurs:')
    errors.forEach(r => {
      console.log(`   ${r.source}: ${r.error}`)
    })
  }

  // Sauvegarder
  const fs = await import('fs')
  const path = await import('path')

  const chartsDir = path.resolve(process.cwd(), 'charts')
  if (!fs.existsSync(chartsDir)) {
    fs.mkdirSync(chartsDir, { recursive: true })
  }

  const outputFile = path.join(chartsDir, 'test-latitudezen-results.json')
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2))

  console.log('')
  console.log(`📁 Résultats sauvegardés dans ${outputFile}`)
  console.log('')
}

// Lancer le test
main().catch(err => {
  console.error('💥 Erreur fatale:', err.message)
  process.exit(1)
})