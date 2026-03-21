// ============================================================
// CRM DERMOTEC — Helpers pour déclencher des événements Inngest
// Importer dans les API routes et server actions
// ============================================================

import { inngest } from '@/lib/inngest'

/**
 * Envoyer un email de façon asynchrone via Inngest
 * Remplace l'appel direct à Resend dans les API routes
 */
export async function triggerAsyncEmail(params: {
  to: string
  template_slug: string
  variables: Record<string, string>
  lead_id?: string
}) {
  await inngest.send({
    name: 'crm/email.send',
    data: params,
  })
}

/**
 * Démarrer une cadence de nurturing pour un nouveau lead
 */
export async function triggerLeadCadence(params: {
  lead_id: string
  email: string
  prenom: string
  formation_nom: string
  assigned_to?: string
}) {
  await inngest.send({
    name: 'crm/lead.cadence.start',
    data: params,
  })
}

/**
 * Envoyer un webhook à traiter avec retry
 */
export async function triggerWebhookProcessing(params: {
  source: string
  payload: Record<string, unknown>
}) {
  await inngest.send({
    name: 'crm/webhook.received',
    data: params,
  })
}

/**
 * Notifier qu'un lead a été créé (scoring, bienvenue, cadence)
 */
export async function triggerLeadCreated(params: {
  lead_id: string
  email: string
  prenom: string
  source: string
  formation_id?: string
}) {
  await inngest.send({
    name: 'crm/lead.created',
    data: params,
  })
}

/**
 * Envoyer plusieurs événements en batch
 */
export async function triggerBatch(events: Parameters<typeof inngest.send>[0]) {
  await inngest.send(events)
}
