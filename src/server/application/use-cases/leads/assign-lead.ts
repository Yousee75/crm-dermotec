// ============================================================
// Use Case: AssignLead
// Assigns a commercial to a lead with RBAC check.
// ============================================================

import type { Container } from '../../../infrastructure/container'
import { type Result, Ok, Err, Errors } from '../../../domain/shared/result'
import { LeadAggregate, type LeadData } from '../../../domain/leads/lead.aggregate'
import { hasPermission, type Permission } from '@/lib/rbac'
import type { RoleEquipe } from '@/types'

export interface AssignLeadInput {
  lead_id: string
  commercial_id: string
}

export async function assignLead(
  input: AssignLeadInput,
  container: Container
): Promise<Result<{ lead_id: string; commercial_id: string }>> {
  const { leadRepo, activityRepo, eventBus, userId, userRole } = container

  // 1. RBAC: only admin/manager can assign
  if (userRole && !hasPermission(userRole as RoleEquipe, 'leads:assign' as Permission)) {
    return Err(Errors.forbidden('Permission leads:assign requise'), 403)
  }

  // 2. Load lead
  const leadResult = await leadRepo.findById(input.lead_id)
  if (!leadResult.ok) return leadResult

  const lead = LeadAggregate.fromData(leadResult.data as unknown as LeadData)

  // 3. Domain logic
  lead.assignCommercial(input.commercial_id, userId)

  // 4. Persist
  const updateResult = await leadRepo.update(input.lead_id, {
    commercial_assigne_id: input.commercial_id,
  })
  if (!updateResult.ok) return updateResult

  // 5. Publish events
  await eventBus.publishMany(lead.events as never[])

  // 6. Activity log
  await activityRepo.log({
    type: 'LEAD_MAJ',
    lead_id: input.lead_id,
    description: `Lead assigne au commercial ${input.commercial_id}`,
    user_id: userId ?? undefined,
  })

  return Ok({
    lead_id: input.lead_id,
    commercial_id: input.commercial_id,
  })
}
