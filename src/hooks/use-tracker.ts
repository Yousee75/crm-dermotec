'use client'

// ============================================================
// CRM DERMOTEC — Hooks React pour intégrer le tracking
// Auto-track navigations, composants, événements métier
// ============================================================

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { tracker, trackingHelpers, type TrackEvent } from '@/lib/user-tracker'

// Auto-track les changements de page
export function usePageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) tracker.trackPageView(pathname)
  }, [pathname])
}

// Track un événement manuellement
export function useTrack() {
  return {
    track: (event: TrackEvent, metadata?: Record<string, unknown>) =>
      tracker.track(event, metadata),
    trackClick: (target: string, metadata?: Record<string, unknown>) =>
      tracker.trackClick(target, metadata),
    // Helpers spécialisés
    ...trackingHelpers,
  }
}

// Track le temps passé sur un composant spécifique
export function useComponentTimer(componentName: string) {
  useEffect(() => {
    const start = Date.now()

    // Track l'entrée dans le composant
    tracker.track('page_view', {
      component: componentName,
      entry_time: start
    })

    return () => {
      const duration = Date.now() - start
      tracker.track('page_leave', {
        component: componentName,
        duration_ms: duration
      })
    }
  }, [componentName])
}

// Hook pour tracker automatiquement les interactions sur un élément
export function useElementTracker(elementName: string, options?: {
  trackClicks?: boolean
  trackHovers?: boolean
  trackFocus?: boolean
}) {
  const { trackClicks = true, trackHovers = false, trackFocus = false } = options || {}

  useEffect(() => {
    const element = document.querySelector(`[data-track="${elementName}"]`)
    if (!element) return

    const handlers: { event: string; handler: EventListener }[] = []

    if (trackClicks) {
      const clickHandler = () => tracker.trackClick(elementName)
      element.addEventListener('click', clickHandler)
      handlers.push({ event: 'click', handler: clickHandler })
    }

    if (trackHovers) {
      const hoverHandler = () => tracker.track('click', { target: elementName, interaction: 'hover' })
      element.addEventListener('mouseenter', hoverHandler)
      handlers.push({ event: 'mouseenter', handler: hoverHandler })
    }

    if (trackFocus) {
      const focusHandler = () => tracker.track('click', { target: elementName, interaction: 'focus' })
      element.addEventListener('focus', focusHandler)
      handlers.push({ event: 'focus', handler: focusHandler })
    }

    return () => {
      handlers.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler)
      })
    }
  }, [elementName, trackClicks, trackHovers, trackFocus])
}

// Hook pour tracker les changements de valeur dans un formulaire
export function useFormTracker(formName: string) {
  const track = useTrack()

  return {
    trackFieldChange: (fieldName: string, oldValue: any, newValue: any) => {
      track.track('lead_edited', {
        form: formName,
        field: fieldName,
        old_value: oldValue,
        new_value: newValue,
        change_timestamp: new Date().toISOString()
      })
    },
    trackFormSubmit: (data: Record<string, any>) => {
      track.track('lead_created', {
        form: formName,
        fields_count: Object.keys(data).length,
        data_sample: Object.keys(data).slice(0, 5) // Premières 5 clés seulement
      })
    },
    trackFormError: (error: string, field?: string) => {
      track.track('click', {
        target: formName,
        interaction: 'error',
        error_message: error,
        error_field: field
      })
    }
  }
}

// Hook pour tracker les performances (temps de chargement, etc.)
export function usePerformanceTracker(pageName: string) {
  useEffect(() => {
    const startTime = Date.now()

    // Track le temps de chargement du composant
    const timeoutId = setTimeout(() => {
      const loadTime = Date.now() - startTime
      tracker.track('page_view', {
        page: pageName,
        load_time_ms: loadTime,
        performance_marker: true
      })
    }, 100) // Délai pour s'assurer que le composant est rendu

    return () => clearTimeout(timeoutId)
  }, [pageName])
}

// Hook pour tracker les erreurs
export function useErrorTracker() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      tracker.track('click', {
        target: 'error',
        interaction: 'javascript_error',
        error_message: event.message,
        error_filename: event.filename,
        error_line: event.lineno,
        error_col: event.colno,
        error_stack: event.error?.stack?.slice(0, 500) // Limiter la taille
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      tracker.track('click', {
        target: 'error',
        interaction: 'promise_rejection',
        error_reason: String(event.reason).slice(0, 500)
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
}

// Hook pour tracker les métriques de scroll et engagement
export function useEngagementTracker(pageName: string) {
  useEffect(() => {
    let maxScrollPercent = 0
    let scrollEvents = 0
    const startTime = Date.now()

    const handleScroll = () => {
      const scrollTop = window.pageYOffset
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / documentHeight) * 100)

      maxScrollPercent = Math.max(maxScrollPercent, scrollPercent)
      scrollEvents++

      // Track milestone de scroll (25%, 50%, 75%, 100%)
      if ([25, 50, 75, 100].includes(scrollPercent) && scrollPercent > 0) {
        tracker.track('click', {
          target: pageName,
          interaction: 'scroll_milestone',
          scroll_percent: scrollPercent,
          time_to_reach_ms: Date.now() - startTime
        })
      }
    }

    // Throttle les événements de scroll
    let scrollTimeout: NodeJS.Timeout
    const throttledScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(handleScroll, 250)
    }

    window.addEventListener('scroll', throttledScroll)

    // Track les métriques finales à la sortie de page
    return () => {
      window.removeEventListener('scroll', throttledScroll)

      const timeOnPage = Date.now() - startTime
      tracker.track('page_leave', {
        page: pageName,
        max_scroll_percent: maxScrollPercent,
        scroll_events: scrollEvents,
        engagement_time_ms: timeOnPage,
        engagement_score: Math.min(100, Math.round((maxScrollPercent + (scrollEvents * 2) + (timeOnPage / 1000)) / 3))
      })
    }
  }, [pageName])
}