// ============================================================
// CRM DERMOTEC — Inngest Client
// SDK v3 — Event-driven background jobs
// ============================================================

import { Inngest, EventSchemas } from 'inngest'

// --- Typage des événements ---
type Events = {
  // Email asynchrone
  'crm/email.send': {
    data: {
      to: string
      template_slug: string
      variables: Record<string, string>
      lead_id?: string
    }
  }
  // Cadence lead (séquence nurturing)
  'crm/lead.cadence.start': {
    data: {
      lead_id: string
      email: string
      prenom: string
      formation_nom: string
      assigned_to?: string
    }
  }
  // Webhook entrant à traiter
  'crm/webhook.received': {
    data: {
      source: string
      payload: Record<string, unknown>
      attempt?: number
    }
  }
  // Rappel planifié
  'crm/rappel.schedule': {
    data: {
      lead_id: string
      type: string
      description: string
      due_at: string
      assigned_to: string
    }
  }
  // Lead créé (pour déclencher scoring, email bienvenue, etc.)
  'crm/lead.created': {
    data: {
      lead_id: string
      email: string
      prenom: string
      source: string
      formation_id?: string
    }
  }
  // Paiement reçu
  'crm/payment.received': {
    data: {
      lead_id: string
      inscription_id: string
      amount: number
      stripe_payment_id: string
    }
  }
}

export const inngest = new Inngest({
  id: 'crm-dermotec',
  schemas: new EventSchemas().fromRecord<Events>(),
})
