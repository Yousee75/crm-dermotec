// ============================================================
// Inngest Function: Cadence lead multi-step
// J+0: Email bienvenue
// J+3: Email relance
// J+7: Rappel téléphonique (créer rappel dans CRM)
// J+14: Dernier email
// ============================================================

import { inngest } from '@/lib/inngest'

export const leadCadence = inngest.createFunction(
  {
    id: 'crm-lead-cadence',
    retries: 3,
    cancelOn: [
      {
        event: 'crm/lead.cadence.cancel',
        match: 'data.lead_id',
      },
    ],
  },
  { event: 'crm/lead.cadence.start' },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { lead_id, email, prenom, formation_nom, assigned_to } = event.data

    // --- J+0 : Email bienvenue ---
    await step.run('j0-email-bienvenue', async () => {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)

      await resend.emails.send({
        from: 'Dermotec Formation <formation@dermotec.fr>',
        to: email,
        subject: `Bienvenue chez Dermotec, ${prenom} !`,
        html: `
          <h2>Bonjour ${prenom},</h2>
          <p>Merci pour votre intérêt pour <strong>${formation_nom}</strong>.</p>
          <p>Notre équipe vous contactera sous 24h pour répondre à toutes vos questions.</p>
          <p>En attendant, n'hésitez pas à nous écrire sur
            <a href="https://wa.me/33188334343">WhatsApp</a>.
          </p>
          <p>À très vite,<br><strong>L'équipe Dermotec</strong></p>
        `,
      })
    })

    await step.run('j0-log-activity', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
      await supabase.from('activites').insert({
        type: 'EMAIL',
        lead_id,
        description: 'Cadence J+0 : Email bienvenue envoyé',
        metadata: { step: 'cadence_j0', formation_nom },
      })
    })

    // --- Attendre 3 jours ---
    await step.sleep('wait-3-days', '3d')

    // --- J+3 : Email relance ---
    await step.run('j3-email-relance', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const { data: lead } = await supabase
        .from('leads')
        .select('statut')
        .eq('id', lead_id)
        .single()

      // Si le lead a déjà été qualifié ou inscrit, ne pas relancer
      if (lead && !['NOUVEAU', 'CONTACTE'].includes(lead.statut as string)) {
        return { skipped: true, reason: `Statut actuel: ${lead.statut}` }
      }

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)

      await resend.emails.send({
        from: 'Dermotec Formation <formation@dermotec.fr>',
        to: email,
        subject: `${prenom}, avez-vous des questions sur ${formation_nom} ?`,
        html: `
          <h2>${prenom},</h2>
          <p>Je reviens vers vous concernant la formation <strong>${formation_nom}</strong>.</p>
          <p>Avez-vous des questions ? Je serais ravie d'y répondre.</p>
          <ul>
            <li>Nous appeler : <a href="tel:+33188334343">01 88 33 43 43</a></li>
            <li>WhatsApp : <a href="https://wa.me/33188334343">Cliquez ici</a></li>
            <li>Répondre à cet email</li>
          </ul>
          <p>Cordialement,<br><strong>L'équipe Dermotec</strong></p>
        `,
      })

      return { sent: true }
    })

    // --- Attendre 4 jours (J+7 total) ---
    await step.sleep('wait-4-days', '4d')

    // --- J+7 : Créer un rappel téléphonique ---
    await step.run('j7-creer-rappel-tel', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const { data: lead } = await supabase
        .from('leads')
        .select('statut')
        .eq('id', lead_id)
        .single()

      if (lead && !['NOUVEAU', 'CONTACTE'].includes(lead.statut as string)) {
        return { skipped: true }
      }

      await supabase.from('rappels').insert({
        lead_id,
        type: 'APPEL',
        date_rappel: new Date().toISOString(),
        description: `Cadence J+7 : Appeler ${prenom} pour ${formation_nom}`,
        user_id: assigned_to || null,
        statut: 'EN_ATTENTE',
      })

      await supabase.from('activites').insert({
        type: 'RAPPEL',
        lead_id,
        description: 'Cadence J+7 : Rappel téléphonique créé',
        metadata: { step: 'cadence_j7', formation_nom },
      })

      return { rappel_created: true }
    })

    // --- Attendre 7 jours (J+14 total) ---
    await step.sleep('wait-7-days', '7d')

    // --- J+14 : Dernier email ---
    await step.run('j14-dernier-email', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const { data: lead } = await supabase
        .from('leads')
        .select('statut')
        .eq('id', lead_id)
        .single()

      if (lead && !['NOUVEAU', 'CONTACTE'].includes(lead.statut as string)) {
        return { skipped: true }
      }

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)

      await resend.emails.send({
        from: 'Dermotec Formation <formation@dermotec.fr>',
        to: email,
        subject: `Dernière info : ${formation_nom} — places limitées`,
        html: `
          <h2>${prenom},</h2>
          <p>Je me permets de vous relancer une dernière fois concernant
          la formation <strong>${formation_nom}</strong>.</p>
          <p>Nos prochaines sessions se remplissent vite et les places sont limitées.</p>
          <p>Si vous avez besoin d'aide pour le financement (OPCO, France Travail, CPF),
          nous vous accompagnons gratuitement dans les démarches.</p>
          <div style="text-align:center;margin:24px 0">
            <a href="https://wa.me/33188334343?text=Bonjour, je suis intéressée par ${encodeURIComponent(formation_nom)}"
               style="background:#2EC6F3;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Je veux en savoir plus
            </a>
          </div>
        `,
      })

      await supabase.from('activites').insert({
        type: 'SYSTEME',
        lead_id,
        description: 'Cadence terminée (J+14) — aucune conversion',
        metadata: { step: 'cadence_j14_fin', formation_nom },
      })

      return { sent: true, cadence_complete: true }
    })

    return { lead_id, cadence: 'complete', steps: 4 }
  }
)
