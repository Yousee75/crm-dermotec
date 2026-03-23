// ============================================================
// POSTHOG — Analytics produit + Feature flags (remplace GA + flags maison)
// https://posthog.com/docs/libraries/next-js
// ============================================================

import posthog from 'posthog-js'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

// ── Init (côté client uniquement) ──────────────────────────

let initialized = false

export function initPostHog() {
  if (typeof window === 'undefined') return
  if (initialized) return
  if (!POSTHOG_KEY) {
    // PostHog key not configured — skip
    return
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // On capture manuellement via le router Next.js
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
    cross_subdomain_cookie: false,
    secure_cookie: true,
    // RGPD : respecter le cookie consent
    opt_out_capturing_by_default: false,
    respect_dnt: true,
    // Session replay (gratuit jusqu'à 5K sessions/mois)
    enable_recording_console_log: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-ph-mask]',
    },
  })

  initialized = true
}

// ── Identification ─────────────────────────────────────────

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return
  posthog.identify(userId, {
    ...properties,
    app: 'crm-dermotec',
  })
}

export function resetUser() {
  if (!POSTHOG_KEY) return
  posthog.reset()
}

// ── Events ─────────────────────────────────────────────────

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return
  posthog.capture(event, properties)
}

/** Capture page view (appelé par le PostHogPageView component) */
export function capturePageView(url: string) {
  if (!POSTHOG_KEY) return
  posthog.capture('$pageview', { $current_url: url })
}

// ── Events CRM spécifiques ─────────────────────────────────

export const CRM_EVENTS = {
  // Leads
  leadCreated: (source: string) => captureEvent('lead_created', { source }),
  leadStatusChanged: (from: string, to: string) => captureEvent('lead_status_changed', { from, to }),
  leadScored: (score: number) => captureEvent('lead_scored', { score }),

  // Pipeline
  pipelineDragDrop: (from: string, to: string) => captureEvent('pipeline_drag_drop', { from, to }),

  // Sessions
  sessionCreated: (formation: string) => captureEvent('session_created', { formation }),
  inscriptionCreated: (formation: string, mode: string) => captureEvent('inscription_created', { formation, mode_paiement: mode }),

  // Financement
  financementSubmitted: (organisme: string) => captureEvent('financement_submitted', { organisme }),
  financementValidated: (organisme: string, montant: number) => captureEvent('financement_validated', { organisme, montant }),

  // Paiements
  paymentCompleted: (amount: number, formation: string) => captureEvent('payment_completed', { amount, formation }),

  // IA
  aiChatUsed: (mode: string) => captureEvent('ai_chat_used', { mode }),
  aiToolUsed: (tool: string) => captureEvent('ai_tool_used', { tool }),

  // Documents
  documentSigned: (type: string) => captureEvent('document_signed', { type }),
  documentUploaded: (type: string) => captureEvent('document_uploaded', { type }),

  // Feature usage
  featureUsed: (feature: string) => captureEvent('feature_used', { feature }),
  searchUsed: (query: string) => captureEvent('search_used', { query_length: query.length }),
} as const

// ── Feature Flags ──────────────────────────────────────────

/** Vérifier un feature flag PostHog */
export function isFeatureEnabled(flag: string): boolean {
  if (!POSTHOG_KEY) return false
  return posthog.isFeatureEnabled(flag) ?? false
}

/** Récupérer la valeur d'un feature flag (pour A/B testing) */
export function getFeatureFlagPayload(flag: string): unknown {
  if (!POSTHOG_KEY) return null
  return posthog.getFeatureFlagPayload(flag)
}

// ── RGPD ───────────────────────────────────────────────────

export function optIn() {
  if (!POSTHOG_KEY) return
  posthog.opt_in_capturing()
}

export function optOut() {
  if (!POSTHOG_KEY) return
  posthog.opt_out_capturing()
}

export function hasOptedOut(): boolean {
  if (!POSTHOG_KEY) return true
  return posthog.has_opted_out_capturing()
}

// ── Export instance pour usage avancé ──────────────────────

export { posthog }
