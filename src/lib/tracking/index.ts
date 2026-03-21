// @ts-nocheck
// ============================================================
// CRM DERMOTEC — Tracking System Exports
// Point d'entrée centralisé pour tout le système de tracking
// ============================================================

// Core tracking
export { tracker, trackingHelpers, type TrackEvent } from '@/lib/user-tracker'

// React hooks
export {
  usePageTracker,
  useTrack,
  useComponentTimer,
  useElementTracker,
  useFormTracker,
  usePerformanceTracker,
  useErrorTracker,
  useEngagementTracker,
  useTrackingStatus
} from '@/hooks/use-tracker'

// Providers et composants
export { TrackerProvider } from '@/components/TrackerProvider'
export { TrackedButton } from '@/components/ui/TrackedButton'
export { TrackedLink } from '@/components/ui/TrackedLink'

// Debug (dev only)
export {
  TrackingDebugger,
  useTrackingDebugger
} from '@/components/debug/TrackingDebugger'

// Types constants
export const TRACKING_EVENTS = {
  // Navigation
  PAGE_VIEW: 'page_view' as const,
  PAGE_LEAVE: 'page_leave' as const,

  // Leads
  LEAD_VIEWED: 'lead_viewed' as const,
  LEAD_EDITED: 'lead_edited' as const,
  LEAD_CREATED: 'lead_created' as const,
  LEAD_DELETED: 'lead_deleted' as const,
  LEAD_STATUS_CHANGED: 'lead_status_changed' as const,

  // Sessions
  SESSION_VIEWED: 'session_viewed' as const,
  SESSION_CREATED: 'session_created' as const,

  // Inscriptions
  INSCRIPTION_CREATED: 'inscription_created' as const,

  // Documents
  DOCUMENT_UPLOADED: 'document_uploaded' as const,
  DOCUMENT_DOWNLOADED: 'document_downloaded' as const,

  // Exports
  EXPORT_CSV: 'export_csv' as const,
  EXPORT_PDF: 'export_pdf' as const,

  // Communications
  EMAIL_SENT: 'email_sent' as const,
  CALL_LOGGED: 'call_logged' as const,
  NOTE_ADDED: 'note_added' as const,

  // Recherche/filtres
  SEARCH_PERFORMED: 'search_performed' as const,
  FILTER_APPLIED: 'filter_applied' as const,

  // UI Interactions
  PIPELINE_DRAG: 'pipeline_drag' as const,
  REMINDER_CREATED: 'reminder_created' as const,
  CLICK: 'click' as const,

  // Financement
  FINANCEMENT_UPDATED: 'financement_updated' as const,

  // Système
  LOGIN: 'login' as const,
  LOGOUT: 'logout' as const,
  MFA_ENROLLED: 'mfa_enrolled' as const,
  SETTINGS_CHANGED: 'settings_changed' as const,

  // IA
  AI_USED: 'ai_used' as const,
} as const

// Helpers pour usage fréquent
export const trackingUtils = {
  /**
   * Track une vue de lead avec métadonnées complètes
   */
  trackLeadView: (leadId: string, source?: string) => {
    trackingHelpers.leadView(leadId)
    if (source) {
      trackingHelpers.track(TRACKING_EVENTS.CLICK, {
        target: 'lead_navigation',
        source,
        lead_id: leadId
      })
    }
  },

  /**
   * Track un export avec détails
   */
  trackExport: (format: 'csv' | 'pdf', entity: string, count: number, filters?: any) => {
    trackingHelpers.export(format, entity, count)
    if (filters) {
      trackingHelpers.track(TRACKING_EVENTS.CLICK, {
        target: 'export_with_filters',
        format,
        entity,
        count,
        applied_filters: Object.keys(filters).length
      })
    }
  },

  /**
   * Track usage IA avec contexte
   */
  trackAIUsage: (feature: string, promptLength?: number, resultQuality?: 'good' | 'bad') => {
    trackingHelpers.aiUsage(feature, promptLength ? 'a'.repeat(promptLength) : undefined)
    if (resultQuality) {
      trackingHelpers.track(TRACKING_EVENTS.CLICK, {
        target: 'ai_feedback',
        feature,
        quality: resultQuality
      })
    }
  },

  /**
   * Track une erreur avec contexte complet
   */
  trackError: (error: Error, context?: string) => {
    trackingHelpers.track(TRACKING_EVENTS.CLICK, {
      target: 'error',
      error_message: error.message,
      error_stack: error.stack?.slice(0, 500),
      error_context: context,
      timestamp: new Date().toISOString()
    })
  }
}