// ============================================================
// Use Case: CreateLead
// Application service that orchestrates business logic.
// Validates → Creates → Logs activity → Publishes event → Returns result.
//
// Use cases are the ONLY entry point to domain logic from routes.
// They coordinate repositories, domain objects, and events.
// ============================================================

import type { Container } from '../../../infrastructure/container'
import { type Result, Ok, Err, Errors } from '../../../domain/shared/result'
import type { CRMDomainEvent } from '../../../domain/shared/domain-events'
import { LeadAggregate } from '../../../domain/leads/lead.aggregate'
import { Email } from '../../../domain/shared/value-objects'
import { sanitizeString } from '@/lib/validators'
import type { SourceLead, StatutLead, PrioriteLead } from '@/types'
import { createEvent } from '../../../domain/shared/domain-events'

// --- Input DTO (what the route sends) ---

export interface CreateLeadInput {
  prenom: string
  nom?: string
  email?: string
  telephone?: string
  source: SourceLead
  sujet?: string
  message?: string
  formation_principale_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer_url?: string
  ip_address?: string
  user_agent?: string
  /** Honeypot field: must be empty */
  _hp_company?: string
}

// --- Output DTO (what the route receives) ---

export interface CreateLeadOutput {
  id: string
  action: 'created' | 'updated'
  prenom: string
  email: string | null
  statut: string
}

// --- Use case ---

export async function createLead(
  input: CreateLeadInput,
  container: Container
): Promise<Result<CreateLeadOutput>> {
  const { leadRepo, activityRepo, eventBus, userId } = container

  // 1. Honeypot check (bot detection)
  if (input._hp_company && input._hp_company.length > 0) {
    // Return fake success to not alert bots
    return Ok({ id: 'fake', action: 'created' as const, prenom: '', email: null, statut: 'NOUVEAU' })
  }

  // 2. Sanitize all string inputs
  const prenom = sanitizeString(input.prenom || '')
  const nom = sanitizeString(input.nom || '')
  const message = sanitizeString(input.message || '')

  if (!prenom) {
    return Err(Errors.validation('Prenom requis'), 422)
  }

  // 3. Validate email if provided
  if (input.email) {
    const email = Email.create(input.email)
    if (!email) {
      return Err(Errors.validation('Email invalide ou jetable', { field: 'email' }), 422)
    }
  }

  // 4. Check for duplicate (same email)
  if (input.email) {
    const existingResult = await leadRepo.findByEmail(input.email)
    if (existingResult.ok && existingResult.data) {
      const existing = existingResult.data

      // Update existing lead instead of creating duplicate
      await leadRepo.update(existing.id, {
        message,
        resultat_dernier_contact: `Nouveau message formulaire: ${message.slice(0, 200)}`,
      })
      await leadRepo.incrementContacts(existing.id)

      // Log activity
      await activityRepo.log({
        type: 'CONTACT',
        lead_id: existing.id,
        description: `Nouveau contact formulaire (doublon) — ${prenom} ${nom}`,
        user_id: userId ?? undefined,
        metadata: { source: input.source, doublon: true },
      })

      return Ok({
        id: existing.id,
        action: 'updated' as const,
        prenom: existing.prenom,
        email: existing.email,
        statut: existing.statut,
      })
    }
  }

  // 5. Create via domain aggregate (validates business rules)
  const createResult = LeadAggregate.create({
    prenom,
    nom,
    email: input.email,
    telephone: input.telephone,
    source: input.source,
    sujet: input.sujet,
    message,
    formation_principale_id: input.formation_principale_id,
    utm_source: input.utm_source,
    utm_medium: input.utm_medium,
    utm_campaign: input.utm_campaign,
  }, userId)

  if (!createResult.ok) return createResult

  // 6. Persist via repository
  const createData = createResult.data.data as {
    prenom: string
    nom: string | null
    email: string | null
    telephone: string | null
    source: SourceLead
    sujet: string | null
    message: string | null
    statut: StatutLead
    priorite: PrioriteLead
    score_chaud: number
    formation_principale_id: string | null
  }
  const persistResult = await leadRepo.create({
    prenom: createData.prenom,
    nom: createData.nom ?? undefined,
    email: createData.email ?? undefined,
    telephone: createData.telephone ?? undefined,
    source: createData.source,
    sujet: createData.sujet ?? undefined,
    message: createData.message ?? undefined,
    statut: createData.statut,
    priorite: createData.priorite,
    score_chaud: createData.score_chaud,
    formation_principale_id: createData.formation_principale_id ?? undefined,
    referrer_url: input.referrer_url,
    ip_address: input.ip_address,
    user_agent: input.user_agent,
    metadata: {
      received_at: new Date().toISOString(),
    },
  })

  if (!persistResult.ok) return persistResult

  const lead = persistResult.data

  // 7. Log activity (non-blocking)
  await activityRepo.log({
    type: 'LEAD_CREE',
    lead_id: lead.id,
    description: `Lead cree via ${input.source} — ${prenom} ${nom} (${input.sujet || 'non precise'})`,
    user_id: userId ?? undefined,
    metadata: { source: input.source, sujet: input.sujet },
  })

  // 8. Publish domain events (triggers Inngest functions)
  // Patch lead_id into events (wasn't available at creation time)
  const events = createResult.data.events.map(e => ({
    ...e,
    data: { ...(e as { data: Record<string, unknown> }).data, lead_id: lead.id },
  })) as CRMDomainEvent[]
  await eventBus.publishMany(events)

  // 9. Also publish cadence start event
  if (lead.email) {
    await eventBus.publish(
      createEvent('crm/lead.created', {
        lead_id: lead.id,
        email: lead.email,
        prenom: lead.prenom,
        nom: lead.nom || '',
        source: input.source,
        sujet: input.sujet || null,
        formation_id: input.formation_principale_id || null,
        score_chaud: 20,
      }, userId)
    )
  }

  return Ok({
    id: lead.id,
    action: 'created' as const,
    prenom: lead.prenom,
    email: lead.email,
    statut: lead.statut,
  })
}
