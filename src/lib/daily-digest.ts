// ============================================================
// CRM DERMOTEC — Email Digest Quotidien
// Envoie un résumé matinal aux commerciaux :
// - Smart actions CRITIQUE + HAUTE
// - Leads à SLA dépassé
// - Sessions à remplir
// - KPIs du jour
// ============================================================

import type { Lead, Session, Rappel, Financement } from '@/types'
import { generateSmartActions, type SmartAction } from './smart-actions'
import { getBreachedLeads, type SLAStatus } from './sla-tracking'

export interface DigestData {
  date: string
  destinataire: string
  smart_actions: SmartAction[]
  sla_breaches: SLAStatus[]
  kpis: {
    leads_nouveaux_24h: number
    leads_non_contactes: number
    rappels_en_retard: number
    sessions_a_remplir: number
    financements_en_attente: number
  }
  sessions_prochaines: Array<{
    formation: string
    date: string
    places_restantes: number
    taux_remplissage: number
  }>
}

/**
 * Génère les données du digest quotidien.
 */
export function generateDigestData({
  leads,
  sessions,
  financements,
  rappelsOverdue,
  destinataire,
}: {
  leads: Lead[]
  sessions: Session[]
  financements: Financement[]
  rappelsOverdue: Rappel[]
  destinataire: string
}): DigestData {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 86400000)

  // Smart actions (seulement CRITIQUE + HAUTE)
  const allActions = generateSmartActions({ leads, sessions, financements, rappelsOverdue })
  const urgentActions = allActions.filter(a => a.priorite === 'CRITIQUE' || a.priorite === 'HAUTE')

  // SLA breaches
  const slaBreaches = getBreachedLeads(leads)

  // KPIs
  const leadsNouveau24h = leads.filter(l =>
    new Date(l.created_at) >= yesterday
  ).length

  const leadsNonContactes = leads.filter(l =>
    l.statut === 'NOUVEAU' && l.nb_contacts === 0
  ).length

  // Sessions dans les 14 prochains jours avec places
  const in14Days = new Date(now.getTime() + 14 * 86400000)
  const sessionsProchaines = sessions
    .filter(s =>
      ['PLANIFIEE', 'CONFIRMEE'].includes(s.statut) &&
      new Date(s.date_debut) >= now &&
      new Date(s.date_debut) <= in14Days
    )
    .map(s => ({
      formation: s.formation?.nom ?? 'Formation',
      date: s.date_debut,
      places_restantes: s.places_max - s.places_occupees,
      taux_remplissage: Math.round((s.places_occupees / s.places_max) * 100),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const financementsEnAttente = financements.filter(f =>
    ['SOUMIS', 'EN_EXAMEN', 'COMPLEMENT_DEMANDE'].includes(f.statut)
  ).length

  return {
    date: now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    destinataire,
    smart_actions: urgentActions,
    sla_breaches: slaBreaches,
    kpis: {
      leads_nouveaux_24h: leadsNouveau24h,
      leads_non_contactes: leadsNonContactes,
      rappels_en_retard: rappelsOverdue.length,
      sessions_a_remplir: sessionsProchaines.filter(s => s.taux_remplissage < 50).length,
      financements_en_attente: financementsEnAttente,
    },
    sessions_prochaines: sessionsProchaines,
  }
}

/**
 * Génère le HTML du digest pour Resend.
 */
export function renderDigestHTML(data: DigestData): string {
  const actionRows = data.smart_actions.map(a => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:white;background:${a.priorite === 'CRITIQUE' ? '#EF4444' : '#F59E0B'}">${a.priorite}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:14px">${a.titre}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b">${a.description}</td>
    </tr>
  `).join('')

  const slaRows = data.sla_breaches.slice(0, 5).map(s => `
    <tr>
      <td style="padding:6px 12px;font-size:14px">${s.lead_name}</td>
      <td style="padding:6px 12px;font-size:13px;color:#EF4444">${s.elapsed_minutes} min (SLA: ${s.sla_minutes} min)</td>
    </tr>
  `).join('')

  const sessionRows = data.sessions_prochaines.slice(0, 5).map(s => `
    <tr>
      <td style="padding:6px 12px;font-size:14px">${s.formation}</td>
      <td style="padding:6px 12px;font-size:13px">${new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
      <td style="padding:6px 12px;font-size:13px">${s.places_restantes} place${s.places_restantes > 1 ? 's' : ''}</td>
      <td style="padding:6px 12px">
        <div style="background:#f1f5f9;border-radius:4px;height:8px;width:80px">
          <div style="background:${s.taux_remplissage >= 80 ? 'var(--color-success)' : s.taux_remplissage >= 50 ? '#F59E0B' : '#EF4444'};border-radius:4px;height:8px;width:${s.taux_remplissage}%"></div>
        </div>
      </td>
    </tr>
  `).join('')

  return `
    <div style="max-width:600px;margin:0 auto;font-family:'DM Sans',Arial,sans-serif;color:#1A1A1A">
      <div style="background:#1A1A1A;padding:20px 24px;border-radius:12px 12px 0 0">
        <h1 style="color:#FF5C00;font-size:20px;margin:0">Dermotec CRM — Briefing du jour</h1>
        <p style="color:#94A3B8;font-size:13px;margin:4px 0 0">${data.date}</p>
      </div>

      <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-top:none">

        <!-- KPIs -->
        <div style="display:flex;gap:12px;margin-bottom:24px">
          <div style="flex:1;background:#F8FAFC;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:#FF5C00">${data.kpis.leads_nouveaux_24h}</div>
            <div style="font-size:11px;color:#64748b;text-transform:uppercase">Nouveaux leads</div>
          </div>
          <div style="flex:1;background:#F8FAFC;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:${data.kpis.rappels_en_retard > 0 ? '#EF4444' : 'var(--color-success)'}">${data.kpis.rappels_en_retard}</div>
            <div style="font-size:11px;color:#64748b;text-transform:uppercase">Rappels en retard</div>
          </div>
          <div style="flex:1;background:#F8FAFC;padding:12px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:#F59E0B">${data.kpis.financements_en_attente}</div>
            <div style="font-size:11px;color:#64748b;text-transform:uppercase">Financements</div>
          </div>
        </div>

        ${data.smart_actions.length > 0 ? `
        <!-- Actions prioritaires -->
        <h2 style="font-size:16px;margin:0 0 12px;color:#1A1A1A">Actions prioritaires (${data.smart_actions.length})</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          ${actionRows}
        </table>
        ` : '<p style="color:#22C55E;font-size:14px;margin-bottom:24px">Aucune action urgente. Tout est à jour !</p>'}

        ${data.sla_breaches.length > 0 ? `
        <!-- SLA Breaches -->
        <h2 style="font-size:16px;margin:0 0 12px;color:#EF4444">SLA dépassés (${data.sla_breaches.length})</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#FEF2F2;border-radius:8px">
          ${slaRows}
        </table>
        ` : ''}

        ${data.sessions_prochaines.length > 0 ? `
        <!-- Sessions -->
        <h2 style="font-size:16px;margin:0 0 12px;color:#1A1A1A">Sessions à venir</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          ${sessionRows}
        </table>
        ` : ''}

        <div style="text-align:center;margin-top:24px">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crm.dermotec.fr'}" style="display:inline-block;background:#FF5C00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Ouvrir le CRM</a>
        </div>
      </div>

      <div style="background:#F8FAFC;padding:12px 24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;text-align:center">
        <p style="font-size:11px;color:#94A3B8;margin:0">Dermotec Advanced — CRM Centre de Formation</p>
      </div>
    </div>
  `
}
