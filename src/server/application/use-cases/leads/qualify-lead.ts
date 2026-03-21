// ============================================================
// Use Case: QualifyLead
// Updates lead profile data, recalculates score, transitions status.
// Business rule: auto-qualify if score >= 60 and status is NOUVEAU/CONTACTE.
// ============================================================

import type { Container } from '../../../infrastructure/container'
import { type Result, Ok, Err, Errors } from '../../../domain/shared/result'
import { LeadAggregate, type LeadData } from '../../../domain/leads/lead.aggregate'
import { createEvent } from '../../../domain/shared/domain-events'

export interface QualifyLeadInput {
  lead_id: string
  statut_pro?: string
  experience_esthetique?: string
  formation_principale_id?: string
  formations_interessees?: string[]
  financement_souhaite?: boolean
  organisme_financement?: string
  objectif_pro?: string
  entreprise_nom?: string
  siret?: string
}

export interface QualifyLeadOutput {
  lead_id: string
  score: number
  statut: string
  auto_qualified: boolean
}

export async function qualifyLead(
  input: QualifyLeadInput,
  container: Container
): Promise<Result<QualifyLeadOutput>> {
  const { leadRepo, activityRepo, eventBus, userId } = container

  // 1. Load lead
  const leadResult = await leadRepo.findById(input.lead_id)
  if (!leadResult.ok) return leadResult

  // 2. Update profile fields
  const updateData: Record<string, unknown> = {}
  if (input.statut_pro) updateData.statut_pro = input.statut_pro
  if (input.experience_esthetique) updateData.experience_esthetique = input.experience_esthetique
  if (input.formation_principale_id) updateData.formation_principale_id = input.formation_principale_id
  if (input.formations_interessees) updateData.formations_interessees = input.formations_interessees
  if (input.financement_souhaite !== undefined) updateData.financement_souhaite = input.financement_souhaite
  if (input.organisme_financement) updateData.organisme_financement = input.organisme_financement
  if (input.objectif_pro) updateData.objectif_pro = input.objectif_pro
  if (input.entreprise_nom) updateData.entreprise_nom = input.entreprise_nom
  if (input.siret) updateData.siret = input.siret

  const updateResult = await leadRepo.update(input.lead_id, updateData)
  if (!updateResult.ok) return updateResult

  const updated = updateResult.data

  // 3. Recalculate score
  const lead = LeadAggregate.fromData(updated as unknown as LeadData)
  const newScore = lead.recalculateScore()

  await leadRepo.update(input.lead_id, { score_chaud: newScore })

  // 4. Auto-qualify if score is high enough and lead is early in pipeline
  let autoQualified = false
  const currentStatut = updated.statut as string
  if (newScore >= 60 && ['NOUVEAU', 'CONTACTE'].includes(currentStatut)) {
    const transitionResult = lead.changeStatus('QUALIFIE' as never, 'Auto-qualification (score >= 60)', userId)
    if (transitionResult.ok) {
      await leadRepo.updateStatus(input.lead_id, 'QUALIFIE')
      autoQualified = true

      await activityRepo.log({
        type: 'STATUT_CHANGE',
        lead_id: input.lead_id,
        description: `Auto-qualification: score ${newScore}/100 >= seuil 60`,
        user_id: userId ?? undefined,
        ancien_statut: currentStatut,
        nouveau_statut: 'QUALIFIE',
      })
    }
  }

  // 5. Publish qualified event
  await eventBus.publish(
    createEvent('crm/lead.qualified', {
      lead_id: input.lead_id,
      score: newScore,
      formation_id: input.formation_principale_id || updated.formation_principale_id || null,
      financement_souhaite: input.financement_souhaite ?? (updated as Record<string, unknown>).financement_souhaite as boolean ?? false,
    }, userId)
  )

  // 6. Activity log
  await activityRepo.log({
    type: 'LEAD_MAJ',
    lead_id: input.lead_id,
    description: `Profil mis a jour — score: ${newScore}/100${autoQualified ? ' (auto-qualifie)' : ''}`,
    user_id: userId ?? undefined,
    metadata: { score: newScore, fields_updated: Object.keys(updateData) },
  })

  return Ok({
    lead_id: input.lead_id,
    score: newScore,
    statut: autoQualified ? 'QUALIFIE' : (currentStatut as string),
    auto_qualified: autoQualified,
  })
}
