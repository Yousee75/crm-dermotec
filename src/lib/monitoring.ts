// ============================================================
// CRM DERMOTEC — Monitoring Automatique
// Tests quotidiens de tous les services + stockage résultats
// ============================================================
import 'server-only'

import { createServiceSupabase } from './supabase-server'

// ---- Types ----

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip'
export type RunStatus = 'running' | 'healthy' | 'degraded' | 'down'
export type CheckCategory = 'api' | 'database' | 'external' | 'storage' | 'auth'

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
      status: 'skip',
      response_time_ms: 0,
      error_message: 'RESEND_API_KEY non configurée'
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
    status: missing_required.length > 0 ? 'fail' : missing_optional.length > 3 ? 'warn' : 'pass',
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

  // Lancer tous les checks en parallèle
  const [
    supabaseConn,
    supabaseTables,
    supabaseRPC,
    storage,
    stripe,
    resend,
    apiRoutes,
    auth,
    envVars
  ] = await Promise.allSettled([
    checkSupabaseConnection(),
    checkSupabaseTables(),
    checkSupabaseRPC(),
    checkSupabaseStorage(),
    checkStripe(),
    checkResend(),
    checkAPIRoutes(),
    checkAuth(),
    checkEnvVars()
  ])

  // Collecter les résultats
  const allChecks: CheckResult[] = []

  const settled = [supabaseConn, supabaseTables, supabaseRPC, storage, stripe, resend, auth, envVars]
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      allChecks.push(result.value as CheckResult)
    }
  }

  // apiRoutes retourne un tableau
  if (apiRoutes.status === 'fulfilled') {
    allChecks.push(...(apiRoutes.value as CheckResult[]))
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
