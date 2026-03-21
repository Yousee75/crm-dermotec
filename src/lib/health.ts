// ============================================================
// CRM DERMOTEC — Health Check System
// Surveillance des services critiques en production
// ============================================================

import { createServiceSupabase } from '@/lib/supabase-server'

export interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  response_time_ms: number
  error?: string
  details?: Record<string, unknown>
}

export interface HealthStatus {
  overall_status: 'healthy' | 'degraded' | 'down'
  timestamp: string
  checks: HealthCheck[]
  version?: string
  environment?: string
}

/**
 * Teste la connexion Supabase via une requête simple
 */
async function checkSupabaseHealth(): Promise<HealthCheck> {
  const start = Date.now()

  try {
    const supabase = await createServiceSupabase()

    // Test de base: SELECT 1
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
      .single()

    const responseTime = Date.now() - start

    if (error) {
      return {
        service: 'supabase',
        status: 'down',
        response_time_ms: responseTime,
        error: error.message,
        details: { code: error.code }
      }
    }

    // Test plus approfondi: connexion DB
    const { data: dbTest, error: dbError } = await supabase.rpc('get_random_uuid')

    if (dbError) {
      return {
        service: 'supabase',
        status: 'degraded',
        response_time_ms: responseTime,
        error: `Database test failed: ${dbError.message}`,
        details: { db_test: false }
      }
    }

    return {
      service: 'supabase',
      status: responseTime < 500 ? 'healthy' : 'degraded',
      response_time_ms: responseTime,
      details: { db_test: !!dbTest }
    }
  } catch (error) {
    return {
      service: 'supabase',
      status: 'down',
      response_time_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Teste l'API Stripe
 */
async function checkStripeHealth(): Promise<HealthCheck> {
  const start = Date.now()

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        service: 'stripe',
        status: 'degraded',
        response_time_ms: 0,
        error: 'STRIPE_SECRET_KEY not configured'
      }
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil'
    })

    // Test simple: récupérer le balance
    const balance = await stripe.balance.retrieve()
    const responseTime = Date.now() - start

    return {
      service: 'stripe',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      response_time_ms: responseTime,
      details: {
        currency: balance.available[0]?.currency || 'unknown',
        livemode: balance.livemode
      }
    }
  } catch (error) {
    return {
      service: 'stripe',
      status: 'down',
      response_time_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Teste l'API Resend (si configurée)
 */
async function checkResendHealth(): Promise<HealthCheck> {
  const start = Date.now()

  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        service: 'resend',
        status: 'healthy', // Pas critique, service optionnel
        response_time_ms: 0,
        details: { configured: false }
      }
    }

    // Test simple: GET domains (ne consomme pas de quota)
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // 5s timeout
    })

    const responseTime = Date.now() - start

    if (!response.ok) {
      return {
        service: 'resend',
        status: 'down',
        response_time_ms: responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()

    return {
      service: 'resend',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      response_time_ms: responseTime,
      details: {
        domains_count: Array.isArray(data.data) ? data.data.length : 0,
        configured: true
      }
    }
  } catch (error) {
    return {
      service: 'resend',
      status: 'down',
      response_time_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Teste l'accès au Storage Supabase
 */
async function checkStorageHealth(): Promise<HealthCheck> {
  const start = Date.now()

  try {
    const supabase = await createServiceSupabase()

    // Test: vérifier que le bucket 'documents' existe
    const { data: buckets, error } = await supabase.storage.listBuckets()

    const responseTime = Date.now() - start

    if (error) {
      return {
        service: 'storage',
        status: 'down',
        response_time_ms: responseTime,
        error: error.message
      }
    }

    const documentsBucket = buckets?.find(b => b.name === 'documents')

    return {
      service: 'storage',
      status: documentsBucket ? 'healthy' : 'degraded',
      response_time_ms: responseTime,
      details: {
        documents_bucket_exists: !!documentsBucket,
        total_buckets: buckets?.length || 0
      },
      error: !documentsBucket ? 'Bucket "documents" not found' : undefined
    }
  } catch (error) {
    return {
      service: 'storage',
      status: 'down',
      response_time_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Effectue tous les health checks
 */
export async function performHealthChecks(): Promise<HealthStatus> {
  console.log('[Health] Starting health checks...')

  // Exécuter tous les checks en parallèle pour la performance
  const [supabaseCheck, stripeCheck, resendCheck, storageCheck] = await Promise.all([
    checkSupabaseHealth(),
    checkStripeHealth(),
    checkResendHealth(),
    checkStorageHealth()
  ])

  const checks = [supabaseCheck, stripeCheck, resendCheck, storageCheck]

  // Déterminer le statut global
  const downServices = checks.filter(c => c.status === 'down')
  const degradedServices = checks.filter(c => c.status === 'degraded')

  let overallStatus: 'healthy' | 'degraded' | 'down'

  if (downServices.length > 0) {
    // Si Supabase est down, tout est down
    if (downServices.some(s => s.service === 'supabase')) {
      overallStatus = 'down'
    } else {
      // Services secondaires down = degraded
      overallStatus = 'degraded'
    }
  } else if (degradedServices.length > 0) {
    overallStatus = 'degraded'
  } else {
    overallStatus = 'healthy'
  }

  const result: HealthStatus = {
    overall_status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
  }

  console.log(`[Health] Overall status: ${overallStatus} (${checks.length} checks)`)
  return result
}

/**
 * Health check rapide (uniquement Supabase)
 */
export async function quickHealthCheck(): Promise<Omit<HealthStatus, 'checks'> & { supabase_ok: boolean }> {
  const start = Date.now()

  try {
    const supabase = await createServiceSupabase()
    await supabase.from('user_profiles').select('count').limit(1).single()

    return {
      overall_status: 'healthy',
      timestamp: new Date().toISOString(),
      supabase_ok: true,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
    }
  } catch {
    return {
      overall_status: 'down',
      timestamp: new Date().toISOString(),
      supabase_ok: false,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
    }
  }
}

/**
 * Utilitaire pour formater les checks pour les logs
 */
export function formatHealthForLogs(health: HealthStatus): string {
  const summary = health.checks.map(c =>
    `${c.service}: ${c.status} (${c.response_time_ms}ms)`
  ).join(', ')

  return `[Health] ${health.overall_status.toUpperCase()} - ${summary}`
}