// ============================================================
// CRM DERMOTEC — Analytics Tracker
// Capture tous les événements utilisateur pour ML/Deep Learning
// Données pseudonymisées, propriété Satorea (art. 6.1.f RGPD)
// ============================================================

import { createClient } from '@/lib/supabase-client'

// ===== Types =====

interface TrackEvent {
  event_name: string
  event_category?: 'navigation' | 'interaction' | 'conversion' | 'engagement' | 'error' | 'performance'
  element_type?: string
  element_id?: string
  element_text?: string
  element_position?: string
  form_name?: string
  form_field?: string
  form_completion_pct?: number
  funnel_step?: string
  conversion_value?: number
  feature_name?: string
  feature_variant?: string
  api_latency_ms?: number
  error_message?: string
  properties?: Record<string, unknown>
}

// ===== Session & User =====

let _sessionId: string | null = null
let _userHash: string | null = null
let _pageEnteredAt: number = Date.now()
let _maxScrollDepth = 0
let _buffer: TrackEvent[] = []
let _flushTimer: ReturnType<typeof setTimeout> | null = null

function getSessionId(): string {
  if (_sessionId) return _sessionId

  // Session = onglet navigateur (sessionStorage)
  let sid = sessionStorage.getItem('_stk_sid')
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem('_stk_sid', sid)
  }
  _sessionId = sid
  return sid
}

async function getUserHash(): Promise<string> {
  if (_userHash) return _userHash

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      // SHA-256 du user ID (pseudonymisé)
      const encoder = new TextEncoder()
      const data = encoder.encode(user.id)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      _userHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)
      return _userHash
    }
  } catch { /* pas authentifié */ }

  _userHash = 'anon'
  return _userHash
}

function getDeviceInfo() {
  const ua = navigator.userAgent
  const width = window.innerWidth

  return {
    viewport_width: width,
    viewport_height: window.innerHeight,
    device_type: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
    browser: /Firefox/i.test(ua) ? 'firefox' : /Safari/i.test(ua) && !/Chrome/i.test(ua) ? 'safari' : /Chrome/i.test(ua) ? 'chrome' : 'other',
    os: /Windows/i.test(ua) ? 'windows' : /Mac/i.test(ua) ? 'macos' : /iPhone|iPad/i.test(ua) ? 'ios' : /Android/i.test(ua) ? 'android' : 'other',
    connection_type: (navigator as any).connection?.effectiveType || null,
  }
}

// ===== Opt-out check =====

function isOptedOut(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('analytics-optout') === 'true'
}

// ===== Core tracking =====

export async function track(event: TrackEvent): Promise<void> {
  if (typeof window === 'undefined') return
  if (isOptedOut()) return

  const device = getDeviceInfo()
  const userHash = await getUserHash()

  const row = {
    session_id: getSessionId(),
    user_hash: userHash,
    event_name: event.event_name,
    event_category: event.event_category || 'interaction',
    page_path: window.location.pathname,
    page_title: document.title,
    referrer_path: document.referrer ? new URL(document.referrer).pathname : null,
    element_type: event.element_type,
    element_id: event.element_id,
    element_text: event.element_text?.substring(0, 100),
    element_position: event.element_position,
    time_on_page_ms: Date.now() - _pageEnteredAt,
    scroll_depth_pct: _maxScrollDepth,
    form_name: event.form_name,
    form_field: event.form_field,
    form_completion_pct: event.form_completion_pct,
    funnel_step: event.funnel_step,
    conversion_value: event.conversion_value,
    feature_name: event.feature_name,
    feature_variant: event.feature_variant,
    api_latency_ms: event.api_latency_ms,
    error_message: event.error_message?.substring(0, 200),
    properties: event.properties || {},
    ...device,
  }

  // Buffer les events et flush par batch (performance)
  _buffer.push(row as any)

  if (_buffer.length >= 10) {
    flushEvents()
  } else if (!_flushTimer) {
    _flushTimer = setTimeout(flushEvents, 5000) // Flush toutes les 5s max
  }
}

async function flushEvents(): Promise<void> {
  if (_buffer.length === 0) return

  const events = [..._buffer]
  _buffer = []

  if (_flushTimer) {
    clearTimeout(_flushTimer)
    _flushTimer = null
  }

  try {
    const supabase = createClient()
    await supabase.from('analytics_events').insert(events)
  } catch (err) {
    // Silencieux — ne pas bloquer l'app pour du tracking
    console.debug('[Analytics] Flush error:', err)
  }
}

// ===== Auto-tracking =====

export function initAutoTracking(): () => void {
  if (typeof window === 'undefined') return () => {}
  if (isOptedOut()) return () => {}

  // 1. Page views
  _pageEnteredAt = Date.now()
  _maxScrollDepth = 0
  track({ event_name: 'page_view', event_category: 'navigation' })

  // 2. Scroll tracking (throttled)
  let scrollTimer: ReturnType<typeof setTimeout> | null = null
  const handleScroll = () => {
    if (scrollTimer) return
    scrollTimer = setTimeout(() => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0
      if (pct > _maxScrollDepth) _maxScrollDepth = pct
      scrollTimer = null
    }, 200)
  }

  // 3. Click tracking
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const el = target.closest('button, a, [data-track]') as HTMLElement | null
    if (!el) return

    const isNav = el.closest('nav, [role="navigation"]')
    const isModal = el.closest('[role="dialog"], .dialog-content')

    track({
      event_name: 'click',
      event_category: 'interaction',
      element_type: el.tagName.toLowerCase(),
      element_id: el.getAttribute('data-track') || el.id || undefined,
      element_text: el.textContent?.trim().substring(0, 100),
      element_position: isModal ? 'modal' : isNav ? 'sidebar' : el.closest('header') ? 'header' : 'main',
    })
  }

  // 4. Focus tracking (formulaires)
  const handleFocus = (e: FocusEvent) => {
    const target = e.target as HTMLElement
    if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

    const form = target.closest('form')
    const formName = form?.getAttribute('data-form') || form?.getAttribute('name') || undefined

    track({
      event_name: 'field_focus',
      event_category: 'engagement',
      element_type: target.tagName.toLowerCase(),
      element_id: (target as HTMLInputElement).name || target.id,
      form_name: formName,
    })
  }

  // 5. Visibilité (quitte l'onglet)
  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      track({
        event_name: 'page_leave',
        event_category: 'navigation',
        properties: {
          time_on_page_ms: Date.now() - _pageEnteredAt,
          scroll_depth_pct: _maxScrollDepth,
        },
      })
      flushEvents() // Flush immédiat avant de quitter
    }
  }

  // 6. Errors (non-bloquant)
  const handleError = (e: ErrorEvent) => {
    track({
      event_name: 'js_error',
      event_category: 'error',
      error_message: e.message?.substring(0, 200),
      properties: { filename: e.filename, line: e.lineno },
    })
  }

  // 7. Performance (après chargement)
  const handleLoad = () => {
    setTimeout(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (perf) {
        track({
          event_name: 'page_performance',
          event_category: 'performance',
          properties: {
            dns_ms: Math.round(perf.domainLookupEnd - perf.domainLookupStart),
            connect_ms: Math.round(perf.connectEnd - perf.connectStart),
            ttfb_ms: Math.round(perf.responseStart - perf.requestStart),
            dom_load_ms: Math.round(perf.domContentLoadedEventEnd - perf.startTime),
            full_load_ms: Math.round(perf.loadEventEnd - perf.startTime),
          },
        })
      }
    }, 1000)
  }

  // Attacher les listeners
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('click', handleClick, { capture: true })
  document.addEventListener('focusin', handleFocus)
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('error', handleError)
  window.addEventListener('load', handleLoad)

  // Cleanup
  return () => {
    window.removeEventListener('scroll', handleScroll)
    document.removeEventListener('click', handleClick, { capture: true })
    document.removeEventListener('focusin', handleFocus)
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('error', handleError)
    window.removeEventListener('load', handleLoad)
    flushEvents()
  }
}

// ===== Helpers pour tracking spécifique =====

/** Track une conversion (lead créé, inscription, paiement) */
export function trackConversion(type: string, value?: number, properties?: Record<string, unknown>) {
  track({
    event_name: `conversion_${type}`,
    event_category: 'conversion',
    funnel_step: type,
    conversion_value: value,
    properties,
  })
}

/** Track l'utilisation d'une feature */
export function trackFeature(name: string, variant?: string, properties?: Record<string, unknown>) {
  track({
    event_name: 'feature_used',
    event_category: 'engagement',
    feature_name: name,
    feature_variant: variant,
    properties,
  })
}

/** Track une erreur API */
export function trackApiError(endpoint: string, status: number, message?: string) {
  track({
    event_name: 'api_error',
    event_category: 'error',
    error_message: `${status}: ${message?.substring(0, 100)}`,
    properties: { endpoint, status },
  })
}

/** Track la latence d'une API */
export function trackApiLatency(endpoint: string, latencyMs: number) {
  track({
    event_name: 'api_call',
    event_category: 'performance',
    api_latency_ms: latencyMs,
    properties: { endpoint },
  })
}

/** Track la soumission d'un formulaire */
export function trackFormSubmit(formName: string, success: boolean, fieldCount?: number) {
  track({
    event_name: success ? 'form_submit_success' : 'form_submit_error',
    event_category: success ? 'conversion' : 'error',
    form_name: formName,
    form_completion_pct: 100,
    properties: { field_count: fieldCount },
  })
}

/** Track une recherche */
export function trackSearch(query: string, resultCount: number) {
  track({
    event_name: 'search',
    event_category: 'engagement',
    properties: {
      query_length: query.length,
      result_count: resultCount,
      has_results: resultCount > 0,
    },
  })
}
