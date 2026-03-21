// ============================================================
// Use Case: ChangeLeadStatus
// Enforces state machine, logs audit trail, publishes events.
// ============================================================

import type { Container } from '../../../infrastructure/container'
import { type Result, Ok, Err, Errors } from '../../../domain/shared/result'
import { LeadAggregate, type LeadData } from '../../../domain/leads/lead.aggregate'
import { hasPermission, type Permission } from '@/lib/rbac'
import type { StatutLead, RoleEquipe } from '@/types'

export interface ChangeLeadStatusInput {
  lead_id: string
  new_status: StatutLead
  reason?: string
}

export interface ChangeLeadStatusOutput {
  lead_id: string
  from: string
  to: string
}

export async function changeLeadStatus(
  input: ChangeLeadStatusInput,
  container: Container
): Promise<Result<ChangeLeadStatusOutput>> {
  const { leadRepo, activityRepo, auditRepo, eventBus, userId, userRole } = container

  // 1. Authorization check
  if (userRole && !hasPermission(userRole as RoleEquipe, 'leads:write' as Permission)) {
    return Err(Errors.forbidden('Permission leads:write requise'), 403)
  }

  // 2. Load lead aggregate
  const leadResult = await leadRepo.findById(input.lead_id)
  if (!leadResult.ok) return leadResult

  const leadData = leadResult.data as unknown as LeadData
  const lead = LeadAggregate.fromData(leadData)
  const oldStatus = lead.statut

  // 3. Execute state machine transition (domain logic)
  const transitionResult = lead.changeStatus(input.new_status, input.reason, userId)
  if (!transitionResult.ok) return transitionResult

  // 4. Persist new status
  const updateResult = await leadRepo.updateStatus(input.lead_id, input.new_status)
  if (!updateResult.ok) return updateResult

  // 5. Audit trail (immutable)
  await auditRepo.append({
    event_type: 'STATUS_CHANGE',
    table_name: 'leads',
    record_id: input.lead_id,
    actor_id: userId,
    actor_role: userRole,
    old_values: { statut: oldStatus },
    new_values: { statut: input.new_status },
    ip_address: null,
    user_agent: null,
    timestamp: new Date().toISOString(),
  })

  // 6. Activity log
  await activityRepo.log({
    type: 'STATUT_CHANGE',
    lead_id: input.lead_id,
    description: `Statut change : ${oldStatus} -> ${input.new_status}${input.reason ? ` (${input.reason})` : ''}`,
    user_id: userId ?? undefined,
    ancien_statut: oldStatus,
    nouveau_statut: input.new_status,
  })

  // 7. Publish domain events (side effects handled by Inngest)
  await eventBus.publishMany(lead.events as never[])

  return Ok({
    lead_id: input.lead_id,
    from: oldStatus,
    to: input.new_status,
  })
}
