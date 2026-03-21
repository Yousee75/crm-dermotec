// ============================================================
// CRM DERMOTEC — API Tracking Events
// Reçoit les événements de tracking côté client
// Rate limit + enrichissement + stockage en base
// ============================================================

import { createServiceSupabase } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface TrackingEvent {
  event: string
  timestamp: string
  page: string
  user_id?: string
  duration_ms?: number
  target?: string
  metadata?: Record<string, unknown>
}

interface TrackingRequest {
  events: TrackingEvent[]
}

// Rate limiting simple en mémoire (pour prototypage)
// En prod : utiliser Redis/Upstash
const userRateLimits = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const minute = Math.floor(now / 60000)
  const key = `${userId}:${minute}`

  const current = userRateLimits.get(key) || { count: 0, resetTime: (minute + 1) * 60000 }

  // Nettoyer les anciennes entrées
  if (now > current.resetTime) {
    userRateLimits.delete(key)
    userRateLimits.set(key, { count: 1, resetTime: (minute + 1) * 60000 })
    return true
  }

  current.count++
  userRateLimits.set(key, current)

  // Limite : 100 events/minute par user
  return current.count <= 100
}

function dedupeEvents(events: TrackingEvent[]): TrackingEvent[] {
  const dedupedEvents: TrackingEvent[] = []
  let lastClickTime = 0

  for (const event of events) {
    // Debounce des clics (500ms)
    if (event.event === 'click') {
      const eventTime = new Date(event.timestamp).getTime()
      if (eventTime - lastClickTime < 500) {
        continue // Skip cet événement
      }
      lastClickTime = eventTime
    }

    // Éviter les duplicatas exacts (même timestamp + event + user)
    const isDuplicate = dedupedEvents.some(existing =>
      existing.timestamp === event.timestamp &&
      existing.event === event.event &&
      existing.user_id === event.user_id &&
      existing.target === event.target
    )

    if (!isDuplicate) {
      dedupedEvents.push(event)
    }
  }

  return dedupedEvents
}

function enrichEvent(event: TrackingEvent, req: NextRequest): Record<string, any> {
  // Extraire l'IP (avec proxy headers)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
           req.headers.get('x-real-ip') ||
           req.headers.get('x-client-ip') ||
           '127.0.0.1'

  // User agent
  const userAgent = req.headers.get('user-agent') || ''

  return {
    user_id: event.user_id || null,
    event: event.event,
    page: event.page || '',
    target: event.target || null,
    duration_ms: event.duration_ms || null,
    metadata: event.metadata || {},
    ip_address: ip,
    user_agent: userAgent.slice(0, 500), // Limiter la taille
    client_timestamp: event.timestamp,
    server_timestamp: new Date().toISOString(),
  }
}

function categorizeEvent(event: string): string {
  if (['page_view', 'page_leave'].includes(event)) return 'navigation'
  if (['lead_created', 'inscription_created', 'email_sent'].includes(event)) return 'conversion'
  if (['search_performed', 'filter_applied', 'ai_used'].includes(event)) return 'engagement'
  if (event.includes('error')) return 'error'
  return 'interaction'
}

function parseBrowser(ua: string): string {
  if (/Firefox/i.test(ua)) return 'firefox'
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'safari'
  if (/Chrome/i.test(ua)) return 'chrome'
  return 'other'
}

function parseDevice(ua: string): string {
  if (/Mobile|iPhone|Android/i.test(ua)) return 'mobile'
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  return 'desktop'
}

export async function POST(req: NextRequest) {
  try {
    const body: TrackingRequest = await req.json()

    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Invalid request: events array required' },
        { status: 400 }
      )
    }

    // Limite de sécurité : max 20 events par batch
    if (body.events.length > 20) {
      return NextResponse.json(
        { error: 'Too many events in batch' },
        { status: 400 }
      )
    }

    // Rate limiting par user
    const userId = body.events[0]?.user_id
    if (userId && !checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Dédupliquer les événements
    const dedupedEvents = dedupeEvents(body.events)

    if (dedupedEvents.length === 0) {
      // Tous les events étaient des duplicatas
      return NextResponse.json({ success: true, inserted: 0 })
    }

    // Enrichir avec données serveur
    const enrichedEvents = dedupedEvents.map(event => enrichEvent(event, req))

    // Insérer en base via service role (bypass RLS)
    const supabase = await createServiceSupabase()

    // Insérer dans analytics_events (table ML)
    const analyticsRows = enrichedEvents.map(e => ({
      session_id: (e.metadata as any)?.session_id || crypto.randomUUID().substring(0, 8),
      user_hash: e.user_id ? e.user_id.substring(0, 16) : 'anon',
      event_name: e.event,
      event_category: categorizeEvent(e.event),
      page_path: e.page,
      element_id: e.target,
      element_text: ((e.metadata as any)?.text as string)?.substring(0, 100) || null,
      time_on_page_ms: e.duration_ms,
      properties: e.metadata || {},
      browser: parseBrowser(e.user_agent),
      device_type: parseDevice(e.user_agent),
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, count } = await (supabase as any)
      .from('analytics_events')
      .insert(analyticsRows)
      .select('id', { count: 'exact' })

    // Also insert in user_events for backward compat (ignore errors)
    await (supabase as any).from('user_events').insert(enrichedEvents).then(() => {}).catch(() => {})

    if (error) {
      console.error('[Tracking] Insert failed:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    console.log(`[Tracking] Inserted ${count} events for user ${userId}`)

    return NextResponse.json({
      success: true,
      inserted: count,
      deduped: body.events.length - dedupedEvents.length
    })

  } catch (error) {
    console.error('[Tracking] Request failed:', error)

    // Ne jamais renvoyer 500 pour le tracking (non-bloquant)
    return NextResponse.json(
      { error: 'Internal error', success: false },
      { status: 200 } // 200 pour que le client ne retry pas
    )
  }
}

// GET : healthcheck
export async function GET() {
  return NextResponse.json({
    service: 'tracking',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
}