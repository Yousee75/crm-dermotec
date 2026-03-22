// ============================================================
// CRM DERMOTEC — SLA Tracking (temps de réponse)
// Speed-to-lead = x21 taux de qualification si < 5 min
// Après 30 min = 1% taux de closing
// ============================================================

import type { Lead } from '@/types'

// SLA par source (en minutes)
const SLA_BY_SOURCE: Record<string, number> = {
  formulaire: 120,      // 2h max
  telephone: 5,          // immédiat
  whatsapp: 30,          // 30 min
  instagram: 120,        // 2h
  facebook: 120,         // 2h
  site_web: 120,         // 2h
  ancien_stagiaire: 240, // 4h (referral)
  partenariat: 240,      // 4h
  google: 120,           // 2h
  salon: 480,            // 8h (événement)
  bouche_a_oreille: 240, // 4h
  autre: 120,            // 2h par défaut
}

export interface SLAStatus {
  lead_id: string
  lead_name: string
  source: string
  sla_minutes: number
  elapsed_minutes: number
  is_breached: boolean
  is_responded: boolean
  severity: 'ok' | 'warning' | 'breached'
  time_remaining_minutes: number | null // null si déjà répondu ou breached
}

/**
 * Calculer le statut SLA d'un lead.
 * Mesure en heures ouvrées (lun-ven 8h-19h).
 */
export function calculateSLA(lead: Lead): SLAStatus {
  const slaMinutes = SLA_BY_SOURCE[lead.source] ?? 120
  const isResponded = lead.nb_contacts > 0

  // Temps écoulé depuis création (en minutes, heures ouvrées)
  const elapsedMinutes = getBusinessMinutesElapsed(new Date(lead.created_at))

  const isBreached = !isResponded && elapsedMinutes > slaMinutes

  let severity: 'ok' | 'warning' | 'breached' = 'ok'
  if (isResponded) {
    severity = 'ok'
  } else if (isBreached) {
    severity = 'breached'
  } else if (elapsedMinutes > slaMinutes * 0.75) {
    severity = 'warning' // 75% du temps écoulé
  }

  return {
    lead_id: lead.id,
    lead_name: `${lead.prenom} ${lead.nom ?? ''}`.trim(),
    source: lead.source,
    sla_minutes: slaMinutes,
    elapsed_minutes: Math.round(elapsedMinutes),
    is_breached: isBreached,
    is_responded: isResponded,
    severity,
    time_remaining_minutes: isResponded ? null : Math.max(0, Math.round(slaMinutes - elapsedMinutes)),
  }
}

/**
 * Calculer les minutes ouvrées écoulées depuis une date.
 * Heures ouvrées : Lun-Ven, 8h00-19h00 (heure Paris).
 */
function getBusinessMinutesElapsed(since: Date): number {
  const now = new Date()
  let minutes = 0
  const cursor = new Date(since)

  // Itérer minute par minute serait trop lent — on itère par tranches
  while (cursor < now) {
    const day = cursor.getDay() // 0=dim, 6=sam
    const hour = cursor.getHours()

    if (day >= 1 && day <= 5 && hour >= 8 && hour < 19) {
      // Heure ouvrée — ajouter le reste de l'heure ou jusqu'à now
      const endOfHour = new Date(cursor)
      endOfHour.setMinutes(59, 59, 999)
      const endTime = endOfHour < now ? endOfHour : now
      minutes += Math.ceil((endTime.getTime() - cursor.getTime()) / 60000)
      cursor.setTime(endOfHour.getTime() + 1)
    } else {
      // Hors heures ouvrées — avancer au prochain créneau ouvré
      if (day === 6) {
        // Samedi → Lundi 8h
        cursor.setDate(cursor.getDate() + 2)
        cursor.setHours(8, 0, 0, 0)
      } else if (day === 0) {
        // Dimanche → Lundi 8h
        cursor.setDate(cursor.getDate() + 1)
        cursor.setHours(8, 0, 0, 0)
      } else if (hour >= 19) {
        // Après 19h → Lendemain 8h
        cursor.setDate(cursor.getDate() + 1)
        cursor.setHours(8, 0, 0, 0)
      } else if (hour < 8) {
        // Avant 8h → Même jour 8h
        cursor.setHours(8, 0, 0, 0)
      }
    }
  }

  return minutes
}

/**
 * Vérifier les leads en breach SLA.
 * Retourne les leads non contactés qui dépassent leur SLA.
 */
export function getBreachedLeads(leads: Lead[]): SLAStatus[] {
  return leads
    .filter(l => l.statut === 'NOUVEAU' && l.nb_contacts === 0)
    .map(calculateSLA)
    .filter(s => s.is_breached)
    .sort((a, b) => b.elapsed_minutes - a.elapsed_minutes) // plus ancien en premier
}

/**
 * Métriques SLA pour le dashboard.
 */
export function calculateSLAMetrics(leads: Lead[]): {
  total_new: number
  responded_in_sla: number
  breached: number
  compliance_rate: number // en %
  avg_response_minutes: number
} {
  const newLeads = leads.filter(l => l.statut === 'NOUVEAU' || l.nb_contacts <= 1)
  const statuses = newLeads.map(calculateSLA)

  const respondedInSLA = statuses.filter(s => s.is_responded && s.elapsed_minutes <= s.sla_minutes).length
  const breached = statuses.filter(s => s.is_breached).length
  const responded = statuses.filter(s => s.is_responded)
  const avgResponse = responded.length > 0
    ? responded.reduce((sum, s) => sum + s.elapsed_minutes, 0) / responded.length
    : 0

  return {
    total_new: newLeads.length,
    responded_in_sla: respondedInSLA,
    breached,
    compliance_rate: newLeads.length > 0 ? Math.round((respondedInSLA / newLeads.length) * 100) : 100,
    avg_response_minutes: Math.round(avgResponse),
  }
}
