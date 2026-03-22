// ============================================================
// Inngest Function: Cadence lead multi-step
// J+0: Email bienvenue (template pro)
// J+1: SMS bienvenue
// J+3: Email relance abandon
// J+7: Rappel téléphonique (créer rappel dans CRM)
// J+14: Dernier email
// ============================================================

import { inngest } from '@/lib/inngest'

function getSupabase() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function isLeadStillActive(lead_id: string): Promise<boolean> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('leads')
    .select('statut')
    .eq('id', lead_id)
    .single()
  return data && ['NOUVEAU', 'CONTACTE'].includes(data.statut)
}

async function logActivity(lead_id: string, description: string, step: string, formation_nom: string) {
  // Logger avec le helper omnicanal pour la timeline enrichie
  const { logCadenceStep } = await import('@/lib/activity-logger')
  const stepIndex = parseInt(step.replace(/\D/g, '') || '0')
  const stepType = step.includes('sms') ? 'sms' : step.includes('email') ? 'email' : 'rappel'
  await logCadenceStep(lead_id, `Lead ${formation_nom}`, stepIndex, stepType, description)
}

export const leadCadence = inngest.createFunction(
  {
    id: 'crm-lead-cadence',
    retries: 3,
    cancelOn: [
      { event: 'crm/lead.cadence.cancel', match: 'data.lead_id' },
    ],
    triggers: [{ event: 'crm/lead.cadence.start' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { lead_id, email, prenom, formation_nom, assigned_to } = event.data

    // --- J+0 : Email bienvenue (template pro) ---
    await step.run('j0-email-bienvenue', async () => {
      const { sendBienvenueEmail } = await import('@/lib/email')
      await sendBienvenueEmail({ to: email, prenom, formation_nom })
    })

    await step.run('j0-log', async () => {
      await logActivity(lead_id, `Cadence J+0 : Email bienvenue envoyé à ${email}`, 'cadence_j0', formation_nom)
    })

    // --- J+1 : SMS bienvenue ---
    await step.sleep('wait-1-day', '1d')

    await step.run('j1-sms-bienvenue', async () => {
      const supabase = getSupabase()
      const { data: lead } = await supabase.from('leads').select('telephone').eq('id', lead_id).single()
      if (!lead?.telephone) return { skipped: true, reason: 'Pas de téléphone' }

      try {
        const { sendSMS, isSMSConfigured } = await import('@/lib/sms')
        if (!isSMSConfigured()) return { skipped: true, reason: 'SMS non configuré' }

        const { SMS_TEMPLATES } = await import('@/lib/sms')
        await sendSMS(lead.telephone, SMS_TEMPLATES.confirmation_inscription(prenom, formation_nom))
        await logActivity(lead_id, 'Cadence J+1 : SMS bienvenue envoyé', 'cadence_j1_sms', formation_nom)
        return { sent: true }
      } catch {
        return { skipped: true, reason: 'Erreur SMS' }
      }
    })

    // --- J+3 : Email relance ---
    await step.sleep('wait-2-days', '2d')

    await step.run('j3-email-relance', async () => {
      if (!(await isLeadStillActive(lead_id))) return { skipped: true }

      // Chercher la prochaine session pour cette formation
      const supabase = getSupabase()
      const { data: lead } = await supabase.from('leads').select('formation_principale_id').eq('id', lead_id).single()

      let prochaine_session: string | undefined
      let places_restantes: number | undefined

      if (lead?.formation_principale_id) {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('date_debut, places_max, places_occupees')
          .eq('formation_id', lead.formation_principale_id)
          .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
          .gt('date_debut', new Date().toISOString())
          .order('date_debut', { ascending: true })
          .limit(1)

        if (sessions?.[0]) {
          prochaine_session = new Date(sessions[0].date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
          places_restantes = sessions[0].places_max - sessions[0].places_occupees
        }
      }

      const { sendAbandonRelanceEmail } = await import('@/lib/email')
      await sendAbandonRelanceEmail({
        to: email, prenom, formation_nom, prochaine_session, places_restantes,
      })
      await logActivity(lead_id, 'Cadence J+3 : Email relance envoyé', 'cadence_j3', formation_nom)
      return { sent: true }
    })

    // --- J+7 : Rappel téléphonique ---
    await step.sleep('wait-4-days', '4d')

    await step.run('j7-creer-rappel-tel', async () => {
      if (!(await isLeadStillActive(lead_id))) return { skipped: true }

      const supabase = getSupabase()
      await supabase.from('rappels').insert({
        lead_id,
        type: 'APPEL',
        date_rappel: new Date().toISOString(),
        description: `Cadence J+7 : Appeler ${prenom} pour ${formation_nom}`,
        user_id: assigned_to || null,
        statut: 'EN_ATTENTE',
        priorite: 'HAUTE',
      })
      await logActivity(lead_id, 'Cadence J+7 : Rappel téléphonique créé', 'cadence_j7', formation_nom)
      return { rappel_created: true }
    })

    // --- J+14 : Dernier email (dernière chance) ---
    await step.sleep('wait-7-days', '7d')

    await step.run('j14-dernier-email', async () => {
      if (!(await isLeadStillActive(lead_id))) return { skipped: true }

      const { sendAbandonRelanceEmail } = await import('@/lib/email')
      await sendAbandonRelanceEmail({
        to: email, prenom, formation_nom,
      })

      await logActivity(lead_id, 'Cadence terminée (J+14) — aucune conversion', 'cadence_j14_fin', formation_nom)

      // Marquer la cadence comme terminée
      const supabase = getSupabase()
      await supabase.from('activites').insert({
        type: 'SYSTEME',
        lead_id,
        description: `Cadence lead terminée après 14 jours sans conversion`,
        metadata: { cadence: 'lead', resultat: 'non_converti' },
      })

      return { sent: true, cadence_complete: true }
    })

    return { lead_id, cadence: 'complete', steps: 5 }
  }
)
