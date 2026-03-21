// ============================================================
// CRM DERMOTEC — Health Check Endpoint
// GET /api/health — checks all dependencies
// ============================================================

import { NextResponse } from 'next/server'
import { getAllCircuitStates } from '@/lib/circuit-breaker'
import { getQueueStats } from '@/lib/graceful-degradation'

export const dynamic = 'force-dynamic'

interface DependencyCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latencyMs?: number
  error?: string
  details?: Record<string, unknown>
}

async function checkSupabase(): Promise<DependencyCheck> {
  const start = Date.now()
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return { name: 'supabase', status: 'unhealthy', error: 'Not configured' }
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(url, key, { auth: { persistSession: false } })

    const { data, error } = await supabase.from('formations').select('id', { count: 'exact', head: true })
    const latency = Date.now() - start

    if (error) {
      return { name: 'supabase', status: 'unhealthy', latencyMs: latency, error: error.message }
    }

    return {
      name: 'supabase',
      status: latency > 2000 ? 'degraded' : 'healthy',
      latencyMs: latency,
      details: { count: data },
    }
  } catch (err) {
    return { name: 'supabase', status: 'unhealthy', latencyMs: Date.now() - start, error: (err as Error).message }
  }
}

async function checkRedis(): Promise<DependencyCheck> {
  const start = Date.now()
  try {
    const { cacheSet, cacheGet, cacheDelete } = await import('@/lib/upstash')
    const testKey = '_health_check_ping'
    await cacheSet(testKey, 'pong', 10)
    const result = await cacheGet<string>(testKey)
    await cacheDelete(testKey)
    const latency = Date.now() - start

    if (result !== 'pong') {
      return { name: 'redis', status: 'degraded', latencyMs: latency, error: 'Read/write mismatch' }
    }

    return {
      name: 'redis',
      status: latency > 500 ? 'degraded' : 'healthy',
      latencyMs: latency,
    }
  } catch (err) {
    return { name: 'redis', status: 'unhealthy', latencyMs: Date.now() - start, error: (err as Error).message }
  }
}

async function checkStripe(): Promise<DependencyCheck> {
  const start = Date.now()
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { name: 'stripe', status: 'unhealthy', error: 'Not configured' }
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })

    await stripe.balance.retrieve()
    const latency = Date.now() - start

    return {
      name: 'stripe',
      status: latency > 3000 ? 'degraded' : 'healthy',
      latencyMs: latency,
    }
  } catch (err) {
    return { name: 'stripe', status: 'unhealthy', latencyMs: Date.now() - start, error: (err as Error).message }
  }
}

async function checkResend(): Promise<DependencyCheck> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { name: 'resend', status: 'degraded', error: 'Not configured (emails disabled)' }
    }
    // On ne fait pas d'appel reel a Resend — juste vérifier que la cle existe
    return { name: 'resend', status: 'healthy' }
  } catch {
    return { name: 'resend', status: 'unhealthy', error: 'Check failed' }
  }
}

export async function GET() {
  const startTime = Date.now()

  // Run all checks in parallel
  const [supabase, redis, stripe, resend] = await Promise.all([
    checkSupabase(),
    checkRedis(),
    checkStripe(),
    checkResend(),
  ])

  const dependencies = [supabase, redis, stripe, resend]

  // Circuit breaker states
  const circuits = getAllCircuitStates()

  // Queue stats
  const queue = getQueueStats()

  // Overall status
  const hasUnhealthy = dependencies.some(d => d.status === 'unhealthy')
  const hasDegraded = dependencies.some(d => d.status === 'degraded')
  const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy'

  const response = {
    status: overallStatus,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() || 0,
    totalLatencyMs: Date.now() - startTime,

    dependencies,

    circuits: circuits.map(c => ({
      name: c.name,
      state: c.state,
      failures: c.failures,
      lastFailure: c.lastFailure ? new Date(c.lastFailure).toISOString() : null,
    })),

    queue,
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(response, { status: statusCode })
}
