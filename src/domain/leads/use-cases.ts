// ============================================================
// CRM DERMOTEC — Lead Use Cases (Application Layer)
// Orchestrent la logique métier sans dépendre de l'infrastructure
// ============================================================

import type { Lead } from '@/types'
import type { ILeadRepository, CreateLeadInput, LeadFilters, PaginatedResult } from './repository'
import {
  type Result, Ok, Err, isOk,
  ValidationError, NotFoundError, DuplicateError,
  type AppError,
} from '@/lib/result'

// --- Use Case: Créer un Lead ---

export interface CreateLeadResult {
  lead: Lead
  action: 'created' | 'updated'
  cadenceStarted: boolean
}

export async function createLead(
  repo: ILeadRepository,
  input: CreateLeadInput,
  options?: {
    triggerCadence?: boolean
    sendWelcomeEmail?: boolean
  }
): Promise<Result<CreateLeadResult, ValidationError | DuplicateError | AppError>> {
  // 1. Validation
  if (!input.email && !input.telephone) {
    return Err(new ValidationError('Email ou téléphone requis', {
      details: { fields: ['email', 'telephone'] },
    }))
  }

  // 2. Vérifier doublon
  if (input.email) {
    const existing = await repo.findByEmail(input.email)
    if (isOk(existing) && existing.value) {
      // Lead existe → mettre à jour
      const updated = await repo.update(existing.value.id, {
        message: input.message,
        nb_contacts: (existing.value.nb_contacts || 0) + 1,
      } as Partial<Lead>)

      if (!updated.ok) return updated

      return Ok({
        lead: updated.value,
        action: 'updated' as const,
        cadenceStarted: false,
      })
    }
  }

  // 3. Créer le lead
  const result = await repo.create(input)
  if (!result.ok) return result

  const lead = result.value
  let cadenceStarted = false

  // 4. Déclencher la cadence (optionnel, via Inngest)
  if (options?.triggerCadence && lead.email) {
    try {
      const { triggerLeadCadence } = await import('@/lib/infra/inngest-events')
      await triggerLeadCadence({
        lead_id: lead.id,
        email: lead.email,
        prenom: lead.prenom,
        formation_nom: input.sujet || 'Formation Dermotec',
      })
      cadenceStarted = true
    } catch {
      // Non-bloquant — la cadence n'est pas critique
    }
  }

  // 5. Email de bienvenue (optionnel)
  if (options?.sendWelcomeEmail && lead.email) {
    try {
      const { triggerAsyncEmail } = await import('@/lib/infra/inngest-events')
      await triggerAsyncEmail({
        to: lead.email,
        template_slug: 'bienvenue',
        variables: { prenom: lead.prenom },
        lead_id: lead.id,
      })
    } catch {
      // Non-bloquant
    }
  }

  return Ok({
    lead,
    action: 'created' as const,
    cadenceStarted,
  })
}

// --- Use Case: Changer le statut d'un Lead ---

export interface StatusChangeResult {
  lead: Lead
  previousStatus: string
  newStatus: string
  sideEffectsTriggered: string[]
}

export async function changeLeadStatus(
  repo: ILeadRepository,
  leadId: string,
  newStatus: string,
  userId?: string
): Promise<Result<StatusChangeResult, NotFoundError | AppError>> {
  // 1. Récupérer le lead
  const current = await repo.findById(leadId)
  if (!current.ok) return current

  const previousStatus = current.value.statut

  // 2. Appliquer la transition (le repo valide via state machine)
  const result = await repo.updateStatus(leadId, newStatus, userId)
  if (!result.ok) return result

  const sideEffects: string[] = []

  // 3. Side effects selon la transition
  if (newStatus === 'INSCRIT' && previousStatus !== 'INSCRIT') {
    // Déclencher email confirmation inscription
    sideEffects.push('confirmation_email')
  }

  if (newStatus === 'FORME') {
    // Déclencher cadence post-formation
    sideEffects.push('post_formation_cadence')
    try {
      const { triggerAsyncEmail } = await import('@/lib/infra/inngest-events')
      await triggerAsyncEmail({
        to: result.value.email || '',
        template_slug: 'satisfaction',
        variables: { prenom: result.value.prenom },
        lead_id: leadId,
      })
    } catch {
      // Non-bloquant
    }
  }

  if (newStatus === 'PERDU') {
    sideEffects.push('abandon_cadence')
  }

  return Ok({
    lead: result.value,
    previousStatus,
    newStatus,
    sideEffectsTriggered: sideEffects,
  })
}

// --- Use Case: Lister les Leads ---

export async function listLeads(
  repo: ILeadRepository,
  filters: LeadFilters,
  page: number = 1,
  limit: number = 20
): Promise<Result<PaginatedResult<Lead>>> {
  return repo.findMany(filters, page, limit)
}

// --- Use Case: Scoring Lead ---

export async function scoreAndUpdateLead(
  repo: ILeadRepository,
  leadId: string
): Promise<Result<{ lead: Lead; score: number; breakdown: Record<string, number> }>> {
  const current = await repo.findById(leadId)
  if (!current.ok) return current

  const { scoreLead } = await import('@/lib/ai/scoring')
  const scoreResult = scoreLead(current.value)

  const updated = await repo.update(leadId, {
    score_chaud: scoreResult.total,
  } as Partial<Lead>)

  if (!updated.ok) return updated

  return Ok({
    lead: updated.value,
    score: scoreResult.total,
    breakdown: {
      completude: scoreResult.completude,
      engagement: scoreResult.engagement,
      financement: scoreResult.financement,
      profil: scoreResult.profil,
      urgence: scoreResult.urgence,
    },
  })
}
