// ============================================================
// CRM DERMOTEC — Health Check API Route (Production Ready)
// Endpoint de monitoring pour production (Vercel, DataDog, etc.)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { performHealthChecks, quickHealthCheck, formatHealthForLogs } from '@/lib/health'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 *
 * Query params:
 * - ?quick=true : Check rapide (Supabase uniquement)
 * - ?format=text : Format texte pour monitoring simple
 *
 * Statuses:
 * - 200: healthy
 * - 503: degraded ou down
 */
export async function GET(request: NextRequest) {
  const start = Date.now()
  const { searchParams } = new URL(request.url)

  const isQuick = searchParams.get('quick') === 'true'
  const format = searchParams.get('format') || 'json'

  try {
    if (isQuick) {
      // Health check rapide (Supabase uniquement)
      const health = await quickHealthCheck()
      const duration = Date.now() - start

      const status = health.overall_status === 'healthy' ? 200 : 503

      if (format === 'text') {
        return new Response(
          `Status: ${health.overall_status}\nSupabase: ${health.supabase_ok ? 'OK' : 'DOWN'}\nDuration: ${duration}ms\nTime: ${health.timestamp}`,
          {
            status,
            headers: { 'Content-Type': 'text/plain' }
          }
        )
      }

      return NextResponse.json(
        { ...health, duration_ms: duration },
        { status }
      )
    }

    // Health check complet
    const health = await performHealthChecks()
    const duration = Date.now() - start

    const status = health.overall_status === 'healthy' ? 200 : 503

    if (format === 'text') {
      const summary = health.checks
        .map(c => `${c.service}: ${c.status} (${c.response_time_ms}ms)`)
        .join('\n')

      return new Response(
        `Status: ${health.overall_status}\nDuration: ${duration}ms\nTime: ${health.timestamp}\n\nServices:\n${summary}`,
        {
          status,
          headers: { 'Content-Type': 'text/plain' }
        }
      )
    }

    // Réponse JSON complète
    return NextResponse.json(
      { ...health, duration_ms: duration },
      { status }
    )

  } catch (error) {
    const duration = Date.now() - start
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('[Health API] Health check failed:', error)

    if (format === 'text') {
      return new Response(
        `Status: down\nError: ${errorMessage}\nDuration: ${duration}ms\nTime: ${new Date().toISOString()}`,
        {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        }
      )
    }

    return NextResponse.json(
      {
        overall_status: 'down',
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        error: errorMessage,
        checks: []
      },
      { status: 503 }
    )
  }
}

/**
 * HEAD /api/health
 * Health check ultra rapide pour load balancers
 */
export async function HEAD() {
  try {
    const health = await quickHealthCheck()
    const status = health.supabase_ok ? 200 : 503

    return new Response(null, {
      status,
      headers: {
        'X-Health-Status': health.overall_status,
        'X-Health-Timestamp': health.timestamp
      }
    })
  } catch {
    return new Response(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'down',
        'X-Health-Timestamp': new Date().toISOString()
      }
    })
  }
}