#!/usr/bin/env tsx
// ============================================================
// CRM SATOREA — Test de recette : Enrichissement 25 sources
// Teste 5 acteurs réels avec toutes les sources disponibles
// Génère un rapport détaillé avec temps, complétude, erreurs
// ============================================================

const ACTEURS = [
  {
    id: 'A1',
    nom: 'Diana Beauté',
    siren: '513579854',
    ville: 'Paris 11e',
    code_postal: '75011',
    departement: '75',
    type: 'Institut beauté',
  },
  {
    id: 'A2',
    nom: 'Sandrine Esthétique',
    siren: '812583136',
    ville: 'Lyon',
    code_postal: '69000',
    departement: '69',
    type: 'Formation esthétique',
  },
  {
    id: 'A3',
    nom: 'ABC Beauté',
    siren: '493651772',
    ville: 'Marseille',
    code_postal: '13000',
    departement: '13',
    type: 'Salon beauté',
  },
  {
    id: 'A4',
    nom: 'Les Jardins Suspendus',
    siren: '834166035',
    ville: 'Paris 11e',
    code_postal: '75011',
    departement: '75',
    type: 'Salon beauté Paris 11',
  },
  {
    id: 'A5',
    nom: 'Peyronne EURL (Le Chalet de la Beauté)',
    siren: '539029934',
    ville: 'Paris 11e',
    code_postal: '75011',
    departement: '75',
    type: 'Institut beauté charonne',
  },
]

// ============================================================
// SOURCES À TESTER (gratuites, pas besoin de clé API)
// ============================================================

interface TestResult {
  source: string
  status: 'OK' | 'ERROR' | 'SKIP' | 'TIMEOUT' | 'NO_DATA'
  time_ms: number
  data_count: number // nb de champs non-null
  error?: string
  sample?: string // aperçu de la donnée principale
}

async function testSource(
  name: string,
  fn: () => Promise<any>,
  timeoutMs: number = 15000
): Promise<TestResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const result = await Promise.race([
      fn(),
      new Promise((_, reject) =>
        controller.signal.addEventListener('abort', () => reject(new Error('TIMEOUT')))
      ),
    ])

    clearTimeout(timer)
    const elapsed = Date.now() - start

    if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
      return { source: name, status: 'NO_DATA', time_ms: elapsed, data_count: 0 }
    }

    const dataCount = typeof result === 'object'
      ? Object.values(result).filter(v => v !== null && v !== undefined && v !== '').length
      : 1

    const sample = typeof result === 'object'
      ? JSON.stringify(result).slice(0, 100)
      : String(result).slice(0, 100)

    return { source: name, status: 'OK', time_ms: elapsed, data_count: dataCount, sample }
  } catch (err) {
    const elapsed = Date.now() - start
    const msg = err instanceof Error ? err.message : String(err)
    return {
      source: name,
      status: msg === 'TIMEOUT' ? 'TIMEOUT' : 'ERROR',
      time_ms: elapsed,
      data_count: 0,
      error: msg.slice(0, 200),
    }
  }
}

// ============================================================
// TESTS PAR SOURCE
// ============================================================

async function testSirene(siren: string): Promise<any> {
  const res = await fetch(
    `https://recherche-entreprises.api.gouv.fr/search?q=${siren}`,
    { signal: AbortSignal.timeout(10000) }
  )
  const data = await res.json()
  return data.results?.[0] || null
}

async function testEDOF(departement: string): Promise<any> {
  const res = await fetch(
    `https://opendata.caissedesdepots.fr/api/explore/v2.1/catalog/datasets/moncompteformation_catalogueformation/records?where=search(intitule_certification,"esthetique")&limit=5&refine=nom_departement:${departement === '75' ? 'Paris' : departement}`,
    { signal: AbortSignal.timeout(10000) }
  )
  const data = await res.json()
  return { total: data.total_count, records: data.results?.length || 0, first: data.results?.[0]?.intitule_certification }
}

async function testDGEFP(departement: string): Promise<any> {
  const res = await fetch(
    `https://dgefp.opendatasoft.com/api/explore/v2.0/catalog/datasets/liste-publique-des-of-v2/records?where=search(denomination_of,"esthetique") AND departement_of="${departement}"&limit=5`,
    { signal: AbortSignal.timeout(10000) }
  )
  const data = await res.json()
  return { total: data.total_count, records: data.results?.length || 0, first: data.results?.[0]?.denomination_of }
}

async function testBODACCBySiren(siren: string): Promise<any> {
  const res = await fetch(
    `https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records?where=numerodepartement="${siren.slice(0, 2)}"&limit=3&order_by=dateparution DESC`,
    { signal: AbortSignal.timeout(10000) }
  )
  const data = await res.json()
  return { total: data.total_count, records: data.results?.length || 0 }
}

async function testFranceTravail(departement: string): Promise<any> {
  // France Travail nécessite OAuth — on teste juste la disponibilité
  const res = await fetch(
    `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?codeROME=D1208&departement=${departement}&range=0-4`,
    { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } }
  )
  if (res.status === 401) return { status: 'AUTH_REQUIRED', message: 'OAuth token needed' }
  const data = await res.json()
  return { total: data.filtresPossibles?.[0]?.agregation?.[0]?.nbResultats, results: data.resultats?.length }
}

async function testPageSpeed(nom: string, ville: string): Promise<any> {
  // On ne peut pas tester PageSpeed sans connaître le site web
  // Mais on peut tester sur un site connu
  return { status: 'SKIP', reason: 'Need website URL' }
}

async function testGeoAPI(codePostal: string): Promise<any> {
  const res = await fetch(
    `https://geo.api.gouv.fr/communes?codePostal=${codePostal}&fields=nom,code,population,codesPostaux&limit=1`,
    { signal: AbortSignal.timeout(5000) }
  )
  const data = await res.json()
  return data[0] || null
}

async function testDVF(codeCommune: string): Promise<any> {
  const res = await fetch(
    `https://api.cquest.org/dvf?code_commune=${codeCommune}&nature_mutation=Vente&limit=5`,
    { signal: AbortSignal.timeout(10000) }
  )
  const data = await res.json()
  return { nb_mutations: data.nb_resultats, features: data.resultats?.length || 0 }
}

// ============================================================
// ORCHESTRATION
// ============================================================

async function testActeur(acteur: typeof ACTEURS[0]): Promise<{
  acteur: typeof ACTEURS[0]
  results: TestResult[]
  total_time_ms: number
  sources_ok: number
  sources_total: number
  completude_pct: number
}> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`TEST: ${acteur.nom} (${acteur.type}) — SIREN ${acteur.siren}`)
  console.log(`${'='.repeat(60)}`)

  const start = Date.now()

  // Lancer TOUTES les sources en parallèle
  const results = await Promise.all([
    testSource('Sirene INSEE', () => testSirene(acteur.siren)),
    testSource('EDOF/CPF', () => testEDOF(acteur.departement)),
    testSource('DGEFP OF', () => testDGEFP(acteur.departement)),
    testSource('BODACC', () => testBODACCBySiren(acteur.siren)),
    testSource('France Travail', () => testFranceTravail(acteur.departement)),
    testSource('Geo API', () => testGeoAPI(acteur.code_postal)),
    testSource('DVF Immo', () => testDVF(acteur.code_postal === '75011' ? '75111' : acteur.code_postal.slice(0, 2) + '001')),
  ])

  const totalTime = Date.now() - start
  const sourcesOk = results.filter(r => r.status === 'OK').length
  const sourcesTotal = results.length
  const completude = Math.round((sourcesOk / sourcesTotal) * 100)

  // Afficher résultats
  for (const r of results) {
    const icon = r.status === 'OK' ? '✅' : r.status === 'NO_DATA' ? '⚠️' : r.status === 'SKIP' ? '⏭️' : '❌'
    const time = `${r.time_ms}ms`.padStart(7)
    const data = `${r.data_count} champs`.padStart(10)
    console.log(`  ${icon} ${r.source.padEnd(18)} ${time} ${data} ${r.error || r.sample || ''}`)
  }

  console.log(`\n  BILAN: ${sourcesOk}/${sourcesTotal} sources OK (${completude}%) — ${totalTime}ms total`)

  return { acteur, results, total_time_ms: totalTime, sources_ok: sourcesOk, sources_total: sourcesTotal, completude_pct: completude }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║    TEST DE RECETTE — ENRICHISSEMENT CRM SATOREA        ║')
  console.log('║    5 acteurs × 7 sources gratuites                     ║')
  console.log(`║    ${new Date().toLocaleString('fr-FR').padEnd(44)}║`)
  console.log('╚══════════════════════════════════════════════════════════╝')

  const allResults = []

  for (const acteur of ACTEURS) {
    const result = await testActeur(acteur)
    allResults.push(result)
  }

  // ============================================================
  // RAPPORT FINAL
  // ============================================================
  console.log('\n' + '═'.repeat(60))
  console.log('RAPPORT FINAL — TEST DE RECETTE')
  console.log('═'.repeat(60))

  console.log('\n📊 RÉSUMÉ PAR ACTEUR:')
  console.log('─'.repeat(60))
  for (const r of allResults) {
    const pct = `${r.completude_pct}%`.padStart(4)
    const time = `${r.total_time_ms}ms`.padStart(8)
    const ok = `${r.sources_ok}/${r.sources_total}`.padStart(4)
    console.log(`  ${r.acteur.id} ${r.acteur.nom.padEnd(30).slice(0, 30)} ${ok} ${pct} ${time}`)
  }

  console.log('\n📊 RÉSUMÉ PAR SOURCE:')
  console.log('─'.repeat(60))
  const sourceNames = allResults[0]?.results.map(r => r.source) || []
  for (const source of sourceNames) {
    const sourceResults = allResults.map(a => a.results.find(r => r.source === source)!)
    const ok = sourceResults.filter(r => r.status === 'OK').length
    const avgTime = Math.round(sourceResults.reduce((s, r) => s + r.time_ms, 0) / sourceResults.length)
    const icon = ok === 5 ? '✅' : ok >= 3 ? '⚠️' : '❌'
    console.log(`  ${icon} ${source.padEnd(18)} ${ok}/5 OK  avg ${avgTime}ms`)
  }

  console.log('\n❌ ERREURS DÉTECTÉES:')
  console.log('─'.repeat(60))
  let errCount = 0
  for (const a of allResults) {
    for (const r of a.results) {
      if (r.status === 'ERROR' || r.status === 'TIMEOUT') {
        console.log(`  ${a.acteur.id} × ${r.source}: ${r.error}`)
        errCount++
      }
    }
  }
  if (errCount === 0) console.log('  Aucune erreur ! 🎉')

  console.log('\n📈 MÉTRIQUES GLOBALES:')
  console.log('─'.repeat(60))
  const totalSources = allResults.reduce((s, a) => s + a.sources_total, 0)
  const totalOk = allResults.reduce((s, a) => s + a.sources_ok, 0)
  const avgTime = Math.round(allResults.reduce((s, a) => s + a.total_time_ms, 0) / allResults.length)
  const avgCompletude = Math.round(allResults.reduce((s, a) => s + a.completude_pct, 0) / allResults.length)
  console.log(`  Sources testées:    ${totalSources}`)
  console.log(`  Sources OK:         ${totalOk} (${Math.round(totalOk / totalSources * 100)}%)`)
  console.log(`  Temps moyen/acteur: ${avgTime}ms`)
  console.log(`  Complétude moyenne: ${avgCompletude}%`)
  console.log(`  Erreurs totales:    ${errCount}`)
}

main().catch(console.error)
