'use client'

// ============================================================
// CRM DERMOTEC — User Tracker côté client
// Capture TOUS les mouvements utilisateur pour audit complet
// ============================================================

// Types d'événements trackés
export type TrackEvent =
  | 'page_view'           // Navigation vers une page
  | 'page_leave'          // Quitte une page (avec durée)
  | 'lead_viewed'         // A ouvert une fiche lead
  | 'lead_edited'         // A modifié un champ lead
  | 'lead_created'        // A créé un lead
  | 'lead_deleted'        // A supprimé un lead
  | 'lead_status_changed' // A changé le statut d'un lead
  | 'session_viewed'      // A ouvert une session
  | 'session_created'     // A créé une session
  | 'inscription_created' // A inscrit un stagiaire
  | 'document_uploaded'   // A uploadé un document
  | 'document_downloaded' // A téléchargé un document
  | 'export_csv'          // A exporté en CSV
  | 'export_pdf'          // A exporté en PDF
  | 'email_sent'          // A envoyé un email
  | 'call_logged'         // A logué un appel
  | 'note_added'          // A ajouté une note
  | 'search_performed'    // A fait une recherche
  | 'filter_applied'      // A appliqué un filtre
  | 'pipeline_drag'       // A drag-drop dans le pipeline
  | 'reminder_created'    // A créé un rappel
  | 'financement_updated' // A modifié un dossier financement
  | 'login'               // Connexion
  | 'logout'              // Déconnexion
  | 'mfa_enrolled'        // A activé la 2FA
  | 'settings_changed'    // A modifié les paramètres
  | 'ai_used'             // A utilisé une fonctionnalité IA
  | 'click'               // Clic sur un élément important

// Structure d'un événement
interface TrackingEvent {
  event: TrackEvent
  timestamp: string
  page: string           // URL courante
  user_id?: string
  duration_ms?: number   // Temps passé (pour page_leave)
  target?: string        // ID ou description de l'élément cliqué
  metadata?: Record<string, unknown>
}

// Buffer d'événements (batch pour performance)
// Envoie par batch de 10 ou toutes les 30 secondes
class UserTracker {
  private buffer: TrackingEvent[] = []
  private pageEntryTime: number = Date.now()
  private currentPage: string = ''
  private flushInterval: NodeJS.Timeout | null = null
  private userId: string | null = null
  private lastClickTime: number = 0
  private isBeingDestroyed: boolean = false

  // Initialiser avec l'user ID
  init(userId: string) {
    this.userId = userId
    this.currentPage = window.location.pathname
    this.pageEntryTime = Date.now()

    // Auto-flush toutes les 30 secondes
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 30000)

    // Flush avant fermeture de page
    window.addEventListener('beforeunload', () => {
      this.trackPageLeave()
      this.flush()
    })

    // Listener pour les clics globaux (délégation d'événements)
    document.addEventListener('click', this.handleGlobalClick.bind(this))

    // Initialized
  }

  // Track un événement
  track(event: TrackEvent, metadata?: Record<string, unknown>) {
    if (!this.userId) return

    const trackingEvent: TrackingEvent = {
      event,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      user_id: this.userId,
      metadata: metadata || {}
    }

    this.buffer.push(trackingEvent)

    // Flush automatique si buffer plein
    if (this.buffer.length >= 10) {
      this.flush()
    }

    // Event tracked
  }

  // Auto-track durée page précédente + nouvelle page
  trackPageView(page: string) {
    if (!this.userId) return

    // Track la sortie de la page précédente (avec durée)
    if (this.currentPage && this.currentPage !== page) {
      this.trackPageLeave()
    }

    // Track l'entrée sur la nouvelle page
    this.currentPage = page
    this.pageEntryTime = Date.now()

    this.track('page_view', {
      from_page: this.currentPage || 'direct',
      referrer: document.referrer
    })
  }

  // Track la sortie d'une page
  private trackPageLeave() {
    if (!this.currentPage || !this.userId) return

    const duration = Date.now() - this.pageEntryTime
    this.track('page_leave', {
      duration_ms: duration,
      from_page: this.currentPage
    })
  }

  // Track un clic avec debounce (éviter spam)
  trackClick(target: string, metadata?: Record<string, unknown>) {
    const now = Date.now()

    // Debounce 500ms pour éviter spam
    if (now - this.lastClickTime < 500) return
    this.lastClickTime = now

    this.track('click', {
      target,
      ...metadata
    })
  }

  // Handler global pour les clics importants
  private handleGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target) return

    // Identifier les éléments importants à tracker
    const importantSelectors = [
      'button',
      'a[href]',
      '[role="button"]',
      '[data-track]',
      '.tracking-element',
      'input[type="submit"]'
    ]

    const isImportant = importantSelectors.some(selector =>
      target.matches(selector) || target.closest(selector)
    )

    if (isImportant) {
      const element = target.closest('[data-track]') || target
      const trackId = element.getAttribute('data-track') ||
                     element.getAttribute('id') ||
                     element.textContent?.slice(0, 50) ||
                     element.tagName.toLowerCase()

      this.trackClick(trackId, {
        tag: element.tagName,
        class: element.className,
        text: element.textContent?.slice(0, 100)
      })
    }
  }

  // Envoyer le buffer au serveur
  async flush() {
    if (this.buffer.length === 0 || this.isBeingDestroyed) return

    const events = [...this.buffer]
    this.buffer = []

    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Flushed events
    } catch (error) {
      console.warn('[UserTracker] Flush failed, logging locally:', error)

      // Remettre les events dans le buffer (retry)
      this.buffer.unshift(...events)

      // Limite : max 50 events en buffer pour éviter memory leak
      if (this.buffer.length > 50) {
        this.buffer = this.buffer.slice(-50)
      }
    }
  }

  // Cleanup
  destroy() {
    this.isBeingDestroyed = true

    // Track sortie de page finale
    this.trackPageLeave()

    // Flush final
    this.flush()

    // Clear interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    // Remove listeners
    document.removeEventListener('click', this.handleGlobalClick.bind(this))

    // Destroyed
  }
}

// Singleton
export const tracker = new UserTracker()

// Helpers spécialisés pour usage fréquent
export const trackingHelpers = {
  leadView: (leadId: string) => tracker.track('lead_viewed', { lead_id: leadId }),
  leadEdit: (leadId: string, field: string, oldValue: any, newValue: any) =>
    tracker.track('lead_edited', { lead_id: leadId, field, old_value: oldValue, new_value: newValue }),
  leadStatusChange: (leadId: string, oldStatus: string, newStatus: string) =>
    tracker.track('lead_status_changed', { lead_id: leadId, old_status: oldStatus, new_status: newStatus }),
  sessionView: (sessionId: string) => tracker.track('session_viewed', { session_id: sessionId }),
  documentUpload: (type: string, fileName: string) =>
    tracker.track('document_uploaded', { document_type: type, file_name: fileName }),
  search: (query: string, results: number) =>
    tracker.track('search_performed', { query, result_count: results }),
  export: (format: 'csv' | 'pdf', entity: string, count: number) =>
    tracker.track(format === 'csv' ? 'export_csv' : 'export_pdf', { entity, record_count: count }),
  aiUsage: (feature: string, prompt?: string) =>
    tracker.track('ai_used', { feature, prompt_length: prompt?.length }),
}