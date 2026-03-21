// ============================================================
// Domain Events — Event-driven architecture (Event Sourcing lite)
// Each aggregate emits events. Side effects happen in Inngest handlers.
// Decoupled: the domain never knows about email, Stripe, or Supabase.
// ============================================================

// --- Base event interface ---

export interface DomainEvent<T extends string = string, D = unknown> {
  /** Event name following namespace convention: domain/entity.action */
  name: T
  /** Event payload */
  data: D
  /** ISO timestamp */
  timestamp: string
  /** User who triggered the action (null for system events) */
  actor_id: string | null
  /** Org ID for multi-tenant isolation */
  org_id?: string
  /** Correlation ID for tracing across services */
  correlation_id?: string
}

// --- Event factory ---

export function createEvent<T extends string, D>(
  name: T,
  data: D,
  actor_id: string | null = null,
  org_id?: string
): DomainEvent<T, D> {
  return {
    name,
    data,
    timestamp: new Date().toISOString(),
    actor_id,
    org_id,
    correlation_id: crypto.randomUUID(),
  }
}

// ============================================================
// LEADS domain events
// ============================================================

export type LeadCreatedEvent = DomainEvent<
  'crm/lead.created',
  {
    lead_id: string
    email: string | null
    prenom: string
    nom: string
    source: string
    sujet: string | null
    formation_id: string | null
    score_chaud: number
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
  }
>

export type LeadStatusChangedEvent = DomainEvent<
  'crm/lead.status.changed',
  {
    lead_id: string
    from: string
    to: string
    reason?: string
  }
>

export type LeadQualifiedEvent = DomainEvent<
  'crm/lead.qualified',
  {
    lead_id: string
    score: number
    formation_id: string | null
    financement_souhaite: boolean
  }
>

export type LeadAssignedEvent = DomainEvent<
  'crm/lead.assigned',
  {
    lead_id: string
    commercial_id: string
    previous_commercial_id: string | null
  }
>

export type LeadContactedEvent = DomainEvent<
  'crm/lead.contacted',
  {
    lead_id: string
    canal: string
    resultat: string
    nb_contacts: number
  }
>

export type LeadLostEvent = DomainEvent<
  'crm/lead.lost',
  {
    lead_id: string
    raison: string
    previous_statut: string
  }
>

// ============================================================
// INSCRIPTIONS domain events
// ============================================================

export type InscriptionCreatedEvent = DomainEvent<
  'crm/inscription.created',
  {
    inscription_id: string
    lead_id: string
    session_id: string
    montant_total: number
    mode_paiement: string | null
  }
>

export type InscriptionConfirmedEvent = DomainEvent<
  'crm/inscription.confirmed',
  {
    inscription_id: string
    lead_id: string
    session_id: string
  }
>

export type InscriptionCompletedEvent = DomainEvent<
  'crm/inscription.completed',
  {
    inscription_id: string
    lead_id: string
    session_id: string
    taux_presence: number | null
    note_satisfaction: number | null
  }
>

// ============================================================
// PAYMENTS domain events
// ============================================================

export type PaymentReceivedEvent = DomainEvent<
  'crm/payment.received',
  {
    inscription_id: string
    lead_id: string
    amount_cents: number
    stripe_payment_id: string
    mode: string
  }
>

export type PaymentFailedEvent = DomainEvent<
  'crm/payment.failed',
  {
    inscription_id: string
    lead_id: string | null
    stripe_payment_id: string
    error_message: string
  }
>

export type RefundProcessedEvent = DomainEvent<
  'crm/payment.refunded',
  {
    inscription_id: string
    lead_id: string | null
    amount_cents: number
    stripe_charge_id: string
  }
>

// ============================================================
// SESSIONS domain events
// ============================================================

export type SessionCreatedEvent = DomainEvent<
  'crm/session.created',
  {
    session_id: string
    formation_id: string
    date_debut: string
    date_fin: string
    places_max: number
  }
>

export type SessionStartedEvent = DomainEvent<
  'crm/session.started',
  {
    session_id: string
    formation_nom: string
    nb_inscrits: number
  }
>

export type SessionCompletedEvent = DomainEvent<
  'crm/session.completed',
  {
    session_id: string
    formation_nom: string
    nb_inscrits: number
    ca_realise: number
  }
>

export type SessionAlmostFullEvent = DomainEvent<
  'crm/session.almost-full',
  {
    session_id: string
    formation_nom: string
    places_restantes: number
    places_max: number
  }
>

// ============================================================
// FINANCEMENTS domain events
// ============================================================

export type FinancementSubmittedEvent = DomainEvent<
  'crm/financement.submitted',
  {
    financement_id: string
    lead_id: string
    organisme: string
    montant_demande: number
  }
>

export type FinancementApprovedEvent = DomainEvent<
  'crm/financement.approved',
  {
    financement_id: string
    lead_id: string
    organisme: string
    montant_accorde: number
  }
>

export type FinancementRejectedEvent = DomainEvent<
  'crm/financement.rejected',
  {
    financement_id: string
    lead_id: string
    organisme: string
    motif: string
  }
>

// ============================================================
// COMMUNICATIONS domain events
// ============================================================

export type EmailSentEvent = DomainEvent<
  'crm/email.sent',
  {
    lead_id: string
    template_slug: string
    to: string
    subject: string
    resend_id: string | null
  }
>

export type CadenceStartedEvent = DomainEvent<
  'crm/cadence.started',
  {
    cadence_instance_id: string
    lead_id: string
    template_id: string
  }
>

// ============================================================
// Union type of all domain events
// ============================================================

export type CRMDomainEvent =
  | LeadCreatedEvent
  | LeadStatusChangedEvent
  | LeadQualifiedEvent
  | LeadAssignedEvent
  | LeadContactedEvent
  | LeadLostEvent
  | InscriptionCreatedEvent
  | InscriptionConfirmedEvent
  | InscriptionCompletedEvent
  | PaymentReceivedEvent
  | PaymentFailedEvent
  | RefundProcessedEvent
  | SessionCreatedEvent
  | SessionStartedEvent
  | SessionCompletedEvent
  | SessionAlmostFullEvent
  | FinancementSubmittedEvent
  | FinancementApprovedEvent
  | FinancementRejectedEvent
  | EmailSentEvent
  | CadenceStartedEvent

// ============================================================
// Event Bus interface (implemented by Inngest)
// ============================================================

export interface EventBus {
  /** Publish a single event */
  publish(event: CRMDomainEvent): Promise<void>
  /** Publish multiple events atomically */
  publishMany(events: CRMDomainEvent[]): Promise<void>
}
