// ============================================================
// CRM DERMOTEC — Monitoring Automatique
// Tests quotidiens de tous les services + stockage résultats
// ============================================================
import 'server-only'

import { createServiceSupabase } from './supabase-server'

// ---- Types ----

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip'
export type RunStatus = 'running' | 'healthy' | 'degraded' | 'down'
export type CheckCategory = 'api' | 'database' | 'external' | 'storage' | 'auth' | 'scraping' | 'enrichment'

interface CheckResult {
  category: CheckCategory
  service_name: string
  check_name: string
  status: CheckStatus
  response_time_ms: number
  status_code?: number
  error_message?: string
  details?: Record<string, unknown>
}

// ---- Checks individuels ----

async function checkSupabaseConnection(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createServiceSupabase()
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    return {
      category: 'database',
      service_name: 'supabase',
      check_name: 'connection',
      status: error ? 'fail' : 'pass',
      response_time_ms: Date.now() - start,
      error_message: error?.message,
      details: { leads_count: count }
    }
  } catch (e) {
    return {
      category: 'database',
      service_name: 'supabase',
      check_name: 'connection',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkSupabaseTables(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createServiceSupabase()
    const tables = ['leads', 'formations', 'sessions', 'inscriptions', 'activites', 'factures', 'equipe']
    const results: Record<string, boolean> = {}
    let allOk = true

    for (const table of tables) {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      results[table] = !error
      if (error) allOk = false
    }

    return {
      category: 'database',
      service_name: 'supabase',
      check_name: 'tables_critical',
      status: allOk ? 'pass' : 'fail',
      response_time_ms: Date.now() - start,
      details: results
    }
  } catch (e) {
    return {
      category: 'database',
      service_name: 'supabase',
      check_name: 'tables_critical',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkSupabaseRPC(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createServiceSupabase()
    const { error } = await supabase.rpc('get_dashboard_stats')

    return {
      category: 'database',
      service_name: 'supabase',
      check_name: 'rpc_dashboard_stats',
      status: error ? 'warn' : 'pass',
      response_time_ms: Date.now() - start,
      error_message: error?.message
    }
  } catch (e) {
    return {
      category: 'database',
      service_name: 'supabase',
      check_name: 'rpc_dashboard_stats',
      status: 'warn',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkSupabaseStorage(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createServiceSupabase()
    const { data, error } = await supabase.storage.listBuckets()

    const docsBucket = data?.find(b => b.name === 'documents')

    return {
      category: 'storage',
      service_name: 'supabase_storage',
      check_name: 'buckets',
      status: error ? 'fail' : docsBucket ? 'pass' : 'warn',
      response_time_ms: Date.now() - start,
      error_message: error?.message || (!docsBucket ? 'Bucket "documents" absent' : undefined),
      details: { total_buckets: data?.length || 0, has_documents: !!docsBucket }
    }
  } catch (e) {
    return {
      category: 'storage',
      service_name: 'supabase_storage',
      check_name: 'buckets',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkStripe(): Promise<CheckResult> {
  const start = Date.now()
  const key = process.env.STRIPE_SECRET_KEY

  if (!key) {
    return {
      category: 'external',
      service_name: 'stripe',
      check_name: 'connection',
      status: 'skip',
      response_time_ms: 0,
      error_message: 'STRIPE_SECRET_KEY non configurée'
    }
  }

  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { 'Authorization': `Bearer ${key}` }
    })

    return {
      category: 'external',
      service_name: 'stripe',
      check_name: 'connection',
      status: res.ok ? 'pass' : 'fail',
      response_time_ms: Date.now() - start,
      status_code: res.status,
      error_message: res.ok ? undefined : `HTTP ${res.status}`
    }
  } catch (e) {
    return {
      category: 'external',
      service_name: 'stripe',
      check_name: 'connection',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkResend(): Promise<CheckResult> {
  const start = Date.now()
  const key = process.env.RESEND_API_KEY

  if (!key) {
    return {
      category: 'external',
      service_name: 'resend',
      check_name: 'connection',
      status: 'pass',
      response_time_ms: 0,
      details: { configured: false, note: 'Non configuré — optionnel' }
    }
  }

  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { 'Authorization': `Bearer ${key}` }
    })

    return {
      category: 'external',
      service_name: 'resend',
      check_name: 'connection',
      status: res.ok ? 'pass' : 'fail',
      response_time_ms: Date.now() - start,
      status_code: res.status
    }
  } catch (e) {
    return {
      category: 'external',
      service_name: 'resend',
      check_name: 'connection',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkAPIRoutes(): Promise<CheckResult[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const routes = [
    { path: '/api/health?quick=true', name: 'health' },
    { path: '/api/analytics/dashboard', name: 'analytics_dashboard' },
  ]

  const results: CheckResult[] = []

  for (const route of routes) {
    const start = Date.now()
    try {
      const res = await fetch(`${baseUrl}${route.path}`, {
        headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || ''}` }
      })

      results.push({
        category: 'api',
        service_name: 'api_routes',
        check_name: route.name,
        status: res.status < 500 ? 'pass' : 'fail',
        response_time_ms: Date.now() - start,
        status_code: res.status
      })
    } catch (e) {
      results.push({
        category: 'api',
        service_name: 'api_routes',
        check_name: route.name,
        status: 'fail',
        response_time_ms: Date.now() - start,
        error_message: e instanceof Error ? e.message : 'Unknown error'
      })
    }
  }

  return results
}

async function checkAuth(): Promise<CheckResult> {
  const start = Date.now()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return {
      category: 'auth',
      service_name: 'supabase_auth',
      check_name: 'config',
      status: 'fail',
      response_time_ms: 0,
      error_message: 'Variables Supabase manquantes'
    }
  }

  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { 'apikey': key }
    })

    return {
      category: 'auth',
      service_name: 'supabase_auth',
      check_name: 'settings',
      status: res.ok ? 'pass' : 'fail',
      response_time_ms: Date.now() - start,
      status_code: res.status
    }
  } catch (e) {
    return {
      category: 'auth',
      service_name: 'supabase_auth',
      check_name: 'settings',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkEnvVars(): Promise<CheckResult> {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  const optional = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'CRON_SECRET',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
  ]

  const missing_required = required.filter(k => !process.env[k])
  const missing_optional = optional.filter(k => !process.env[k])

  return {
    category: 'auth',
    service_name: 'env_vars',
    check_name: 'configuration',
    status: missing_required.length > 0 ? 'fail' : 'pass',
    response_time_ms: 0,
    details: {
      required_ok: required.length - missing_required.length,
      required_total: required.length,
      optional_ok: optional.length - missing_optional.length,
      optional_total: optional.length,
      missing_required: missing_required,
      missing_optional: missing_optional
    }
  }
}

// ---- Checks Enrichissement & Scraping ----

async function checkPappers(): Promise<CheckResult> {
  const start = Date.now()
  const key = process.env.PAPPERS_API_KEY

  if (!key) {
    return {
      category: 'enrichment',
      service_name: 'pappers',
      check_name: 'api_key',
      status: 'fail',
      response_time_ms: 0,
      error_message: 'PAPPERS_API_KEY manquante'
    }
  }

  try {
    // Test avec un SIRET connu (Dermotec)
    const res = await fetch(`https://api.pappers.fr/v2/entreprise?siret=88301396500013&api_token=${key}`)
    return {
      category: 'enrichment',
      service_name: 'pappers',
      check_name: 'connection',
      status: res.ok ? 'pass' : 'fail',
      response_time_ms: Date.now() - start,
      status_code: res.status,
      error_message: res.ok ? undefined : `HTTP ${res.status}`
    }
  } catch (e) {
    return {
      category: 'enrichment',
      service_name: 'pappers',
      check_name: 'connection',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkGooglePlaces(): Promise<CheckResult> {
  const start = Date.now()
  const key = process.env.GOOGLE_PLACES_API_KEY

  if (!key) {
    return {
      category: 'enrichment',
      service_name: 'google_places',
      check_name: 'api_key',
      status: 'fail',
      response_time_ms: 0,
      error_message: 'GOOGLE_PLACES_API_KEY manquante'
    }
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Dermotec+Paris&inputtype=textquery&fields=place_id,name&key=${key}`
    )
    const data = await res.json()
    return {
      category: 'enrichment',
      service_name: 'google_places',
      check_name: 'connection',
      status: data.status === 'OK' || data.status === 'ZERO_RESULTS' ? 'pass' : 'fail',
      response_time_ms: Date.now() - start,
      status_code: res.status,
      details: { api_status: data.status, candidates: data.candidates?.length || 0 }
    }
  } catch (e) {
    return {
      category: 'enrichment',
      service_name: 'google_places',
      check_name: 'connection',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkOutscraper(): Promise<CheckResult> {
  const start = Date.now()
  const key = process.env.OUTSCRAPER_API_KEY

  if (!key) {
    return {
      category: 'scraping',
      service_name: 'outscraper',
      check_name: 'api_key',
      status: 'pass',
      response_time_ms: 0,
      details: { configured: false, note: 'Non configuré — optionnel' }
    }
  }

  try {
    const res = await fetch('https://api.app.outscraper.com/accounts/profile', {
      headers: { 'X-API-KEY': key }
    })
    const data = res.ok ? await res.json() : null
    return {
      category: 'scraping',
      service_name: 'outscraper',
      check_name: 'connection',
      status: res.ok ? 'pass' : 'fail',
      response_time_ms: Date.now() - start,
      status_code: res.status,
      details: data ? { credits: data.credits_amount, email: data.email } : undefined
    }
  } catch (e) {
    return {
      category: 'scraping',
      service_name: 'outscraper',
      check_name: 'connection',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkBrightData(): Promise<CheckResult> {
  const start = Date.now()
  const key = process.env.BRIGHTDATA_API_KEY

  if (!key) {
    return {
      category: 'scraping',
      service_name: 'brightdata',
      check_name: 'api_key',
      status: 'pass',
      response_time_ms: 0,
      details: { configured: false, note: 'Non configuré — optionnel' }
    }
  }

  try {
    // Vérifier les zones actives
    const res = await fetch('https://api.brightdata.com/zone/get_active_zones', {
      headers: { 'Authorization': `Bearer ${key}` }
    })
    const data = res.ok ? await res.json() : null
    return {
      category: 'scraping',
      service_name: 'brightdata',
      check_name: 'zones',
      status: res.ok ? 'pass' : 'fail',
      response_time_ms: Date.now() - start,
      status_code: res.status,
      details: data ? { active_zones: Array.isArray(data) ? data.length : 0 } : undefined,
      error_message: res.ok ? undefined : `HTTP ${res.status}`
    }
  } catch (e) {
    return {
      category: 'scraping',
      service_name: 'brightdata',
      check_name: 'zones',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkSirene(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await fetch('https://api.recherche-entreprises.fabrique.social.gouv.fr/api/v1/search?query=dermotec&limit=1')
    const data = await res.json()
    return {
      category: 'enrichment',
      service_name: 'sirene',
      check_name: 'recherche_entreprises',
      status: res.ok && data.entreprises?.length > 0 ? 'pass' : 'warn',
      response_time_ms: Date.now() - start,
      status_code: res.status,
      details: { results: data.entreprises?.length || 0 }
    }
  } catch (e) {
    return {
      category: 'enrichment',
      service_name: 'sirene',
      check_name: 'recherche_entreprises',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkOSM(): Promise<CheckResult> {
  const start = Date.now()
  try {
    // Requête Overpass ultra-légère : 1 institut beauté Paris 11e
    const query = '[out:json][timeout:10];node["shop"="beauty"](48.855,2.370,48.865,2.380);out 1;'
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
    const data = await res.json()
    return {
      category: 'enrichment',
      service_name: 'openstreetmap',
      check_name: 'overpass_api',
      status: res.ok ? 'pass' : 'fail',
      response_time_ms: Date.now() - start,
      status_code: res.status,
      details: { elements: data.elements?.length || 0 }
    }
  } catch (e) {
    return {
      category: 'enrichment',
      service_name: 'openstreetmap',
      check_name: 'overpass_api',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkINSEE_IRIS(): Promise<CheckResult> {
  const start = Date.now()
  try {
    // Géo API gouv — Paris 11e
    const res = await fetch('https://geo.api.gouv.fr/communes/75111?fields=nom,codesPostaux,population')
    const data = await res.json()
    return {
      category: 'enrichment',
      service_name: 'insee_iris',
      check_name: 'geo_api',
      status: res.ok && data.nom ? 'pass' : 'fail',
      response_time_ms: Date.now() - start,
      status_code: res.status,
      details: { commune: data.nom, population: data.population }
    }
  } catch (e) {
    return {
      category: 'enrichment',
      service_name: 'insee_iris',
      check_name: 'geo_api',
      status: 'fail',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkDVF(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await fetch('https://api.cquest.org/dvf?code_postal=75011&limit=1')
    return {
      category: 'enrichment',
      service_name: 'dvf',
      check_name: 'prix_immobilier',
      status: res.ok ? 'pass' : 'warn',
      response_time_ms: Date.now() - start,
      status_code: res.status
    }
  } catch (e) {
    return {
      category: 'enrichment',
      service_name: 'dvf',
      check_name: 'prix_immobilier',
      status: 'warn',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkFranceCompetences(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await fetch('https://api.francecompetences.fr/fc/v1/rs?INTITULE=maquillage+permanent&ETAT_FICHE=Actif&LIMIT=1')
    return {
      category: 'enrichment',
      service_name: 'france_competences',
      check_name: 'rncp_rs',
      status: res.ok ? 'pass' : 'warn',
      response_time_ms: Date.now() - start,
      status_code: res.status
    }
  } catch (e) {
    return {
      category: 'enrichment',
      service_name: 'france_competences',
      check_name: 'rncp_rs',
      status: 'warn',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkBODACC(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await fetch('https://bodacc-datadila.opendatasoft.com/api/records/1.0/search/?dataset=annonces-commerciales&q=dermotec&rows=1')
    return {
      category: 'enrichment',
      service_name: 'bodacc',
      check_name: 'annonces_legales',
      status: res.ok ? 'pass' : 'warn',
      response_time_ms: Date.now() - start,
      status_code: res.status
    }
  } catch (e) {
    return {
      category: 'enrichment',
      service_name: 'bodacc',
      check_name: 'annonces_legales',
      status: 'warn',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

async function checkDGEFP(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const res = await fetch('https://dgefp-opendatasoft.opendatasoft.com/api/records/1.0/search/?dataset=liste-publique-des-of-v2&q=dermotec&rows=1')
    return {
      category: 'enrichment',
      service_name: 'dgefp',
      check_name: 'organismes_formation',
      status: res.ok ? 'pass' : 'warn',
      response_time_ms: Date.now() - start,
      status_code: res.status
    }
  } catch (e) {
    return {
      category: 'enrichment',
      service_name: 'dgefp',
      check_name: 'organismes_formation',
      status: 'warn',
      response_time_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

// ---- Orchestrateur principal ----

export async function runFullMonitoring(triggerSource: 'cron' | 'manual' | 'api' = 'manual') {
  const supabase = await createServiceSupabase()

  // Créer le run (cast nécessaire car tables pas dans les types générés)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: run, error: runError } = await (supabase as any)
    .from('monitoring_runs')
    .insert({ trigger_source: triggerSource, overall_status: 'running' })
    .select('id')
    .single()

  if (runError || !run) {
    console.error('[Monitoring] Failed to create run:', runError)
    throw new Error('Failed to create monitoring run')
  }

  const runId = (run as any).id as string
  const startTime = Date.now()

  // Lancer TOUS les checks en parallèle (services + enrichissement + scraping)
  const results = await Promise.allSettled([
    // --- Services core ---
    checkSupabaseConnection(),
    checkSupabaseTables(),
    checkSupabaseRPC(),
    checkSupabaseStorage(),
    checkStripe(),
    checkResend(),
    checkAPIRoutes(),
    checkAuth(),
    checkEnvVars(),
    // --- Enrichissement (APIs payantes) ---
    checkPappers(),
    checkGooglePlaces(),
    // --- Scraping ---
    checkOutscraper(),
    checkBrightData(),
    // --- Enrichissement (APIs gratuites) ---
    checkSirene(),
    checkOSM(),
    checkINSEE_IRIS(),
    checkDVF(),
    checkFranceCompetences(),
    checkBODACC(),
    checkDGEFP(),
  ])

  // Collecter les résultats
  const allChecks: CheckResult[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const value = result.value
      if (Array.isArray(value)) {
        allChecks.push(...value)
      } else {
        allChecks.push(value as CheckResult)
      }
    }
  }

  // Insérer les checks
  const checksToInsert = allChecks.map(c => ({ run_id: runId, ...c }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('monitoring_checks').insert(checksToInsert)

  // Calculer le résumé
  const passed = allChecks.filter(c => c.status === 'pass').length
  const failed = allChecks.filter(c => c.status === 'fail').length
  const warnings = allChecks.filter(c => c.status === 'warn').length
  const total = allChecks.length

  let overallStatus: RunStatus = 'healthy'
  if (failed > 0) overallStatus = failed > 2 ? 'down' : 'degraded'
  else if (warnings > 2) overallStatus = 'degraded'

  // Mettre à jour le run
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('monitoring_runs')
    .update({
      finished_at: new Date().toISOString(),
      overall_status: overallStatus,
      total_checks: total,
      passed,
      failed,
      warnings,
      duration_ms: Date.now() - startTime
    })
    .eq('id', runId)

  return {
    run_id: runId,
    overall_status: overallStatus,
    total_checks: total,
    passed,
    failed,
    warnings,
    duration_ms: Date.now() - startTime,
    checks: allChecks
  }
}

// ---- Lecture des résultats ----

export async function getMonitoringHistory(limit = 30) {
  const supabase = await createServiceSupabase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: runs } = await (supabase as any)
    .from('monitoring_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)

  return (runs as Record<string, unknown>[]) || []
}

export async function getMonitoringRunDetails(runId: string) {
  const supabase = await createServiceSupabase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const [{ data: run }, { data: checks }] = await Promise.all([
    sb.from('monitoring_runs').select('*').eq('id', runId).single(),
    sb.from('monitoring_checks').select('*').eq('run_id', runId).order('category')
  ])

  return { run, checks: (checks as Record<string, unknown>[]) || [] }
}
