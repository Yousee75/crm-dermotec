// ============================================================
// CRM DERMOTEC — Inngest Client (SDK v4)
// Event-driven background jobs
// ============================================================

import { Inngest } from 'inngest'

// --- Typage des événements ---
type Events = {
  'crm/email.send': {
    data: {
      to: string
      template_slug: string
      variables: Record<string, string>
      lead_id?: string
    }
  }
  'crm/lead.cadence.start': {
    data: {
      lead_id: string
      email: string
      prenom: string
      formation_nom: string
      assigned_to?: string
    }
  }
  'crm/lead.cadence.cancel': {
    data: {
      lead_id: string
    }
  }
  'crm/lead.post-formation.start': {
    data: {
      lead_id: string
      email: string
      prenom: string
      formation_nom: string
    }
  }
  'crm/webhook.received': {
    data: {
      source: string
      payload: Record<string, unknown>
      attempt?: number
    }
  }
  'crm/rappel.schedule': {
    data: {
      lead_id: string
      type: string
      description: string
      due_at: string
      assigned_to: string
    }
  }
  'crm/lead.created': {
    data: {
      lead_id: string
      email: string
      prenom: string
      source: string
      formation_id?: string
    }
  }
  'crm/payment.received': {
    data: {
      lead_id: string
      inscription_id: string
      amount: number
      stripe_payment_id: string
    }
  }
  'stripe/webhook.process': {
    data: {
      eventId: string
      eventType: string
      objectId: string
      metadata: Record<string, string>
      amount: number
      paymentIntent: string
      chargeId: string
      invoiceId: string
    }
  }
  'crm/bulk.email.send': {
    data: {
      recipients: Array<{ to: string; template_slug: string; variables: Record<string, string>; lead_id?: string }>
      batch_id: string
    }
  }
  'crm/bulk.lead.update': {
    data: {
      lead_ids: string[]
      updates: Record<string, unknown>
      operation: string
      user_id: string
    }
  }
  'lead.enrich': {
    data: {
      lead_id: string
      siret?: string
      nom?: string
      ville?: string
      email?: string
    }
  }
}

export const inngest = new Inngest({
  id: 'crm-dermotec',
})

// Export du type pour les fonctions
export type { Events }
