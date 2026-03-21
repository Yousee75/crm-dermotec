// ============================================================
// Inngest Function: Session Lifecycle Automation
// Cron quotidien 8h — gère les transitions automatiques
//
// 1. Sessions qui démarrent aujourd'hui → EN_COURS
// 2. Sessions terminées hier → TERMINEE + déclenche cadence post-formation
// 3. Sessions dans 7 jours → Envoyer convocations
// 4. Sessions dans 2 jours → Rappel SMS/email dernière minute
// 5. Sessions incomplètes dans 14 jours → Alerte cockpit
// ============================================================

import { inngest } from '@/lib/inngest'

export const sessionLifecycle = inngest.createFunction(
  {
    id: 'crm-session-lifecycle',
    retries: 2,
  },
  { cron: 'TZ=Europe/Paris 0 8 * * *' },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: { step: any }) => {
    const today = new Date().toISOString().split('T')[0]
    const stats = { started: 0, completed: 0, convocations: 0, reminders: 0 }

    // --- 1. Sessions qui démarrent aujourd'hui → EN_COURS ---
    const sessionsStarting = await step.run('start-sessions', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, formation:formations(nom)')
        .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
        .eq('date_debut', today)

      if (!sessions || sessions.length === 0) return []

      for (const session of sessions) {
        await supabase
          .from('sessions')
          .update({ statut: 'EN_COURS', updated_at: new Date().toISOString() })
          .eq('id', session.id)

        await supabase.from('activites').insert({
          type: 'SESSION',
          description: `Session "${(session.formation as any)?.nom}" démarrée automatiquement`,
          metadata: { session_id: session.id, transition: 'CONFIRMEE→EN_COURS' },
        })
      }

      return sessions.map(s => s.id)
    })
    stats.started = sessionsStarting.length

    // --- 2. Sessions terminées hier → TERMINEE + cadence post-formation ---
    const sessionsCompleted = await step.run('complete-sessions', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, formation:formations(id, nom, slug)')
        .eq('statut', 'EN_COURS')
        .eq('date_fin', yesterdayStr)

      if (!sessions || sessions.length === 0) return []

      for (const session of sessions) {
        // Passer la session en TERMINEE
        await supabase
          .from('sessions')
          .update({ statut: 'TERMINEE', updated_at: new Date().toISOString() })
          .eq('id', session.id)

        // Récupérer tous les inscrits de cette session
        const { data: inscriptions } = await supabase
          .from('inscriptions')
          .select('id, lead_id, lead:leads(id, email, prenom, statut)')
          .eq('session_id', session.id)
          .in('statut', ['EN_COURS', 'CONFIRMEE'])

        if (inscriptions) {
          for (const insc of inscriptions) {
            const lead = insc.lead as any
            if (!lead) continue

            // Passer l'inscription en COMPLETEE
            await supabase
              .from('inscriptions')
              .update({ statut: 'COMPLETEE', updated_at: new Date().toISOString() })
              .eq('id', insc.id)

            // Passer le lead en FORME
            if (['INSCRIT', 'EN_FORMATION'].includes(lead.statut)) {
              await supabase
                .from('leads')
                .update({ statut: 'FORME', updated_at: new Date().toISOString() })
                .eq('id', lead.id)
            }

            // Déclencher la cadence post-formation
            if (lead.email) {
              await inngest.send({
                name: 'crm/lead.post-formation.start',
                data: {
                  lead_id: lead.id,
                  email: lead.email,
                  prenom: lead.prenom || 'Stagiaire',
                  formation_nom: (session.formation as any)?.nom || 'votre formation',
                },
              })
            }
          }
        }

        await supabase.from('activites').insert({
          type: 'SESSION',
          description: `Session "${(session.formation as any)?.nom}" terminée — ${inscriptions?.length || 0} stagiaire(s) formé(es)`,
          metadata: {
            session_id: session.id,
            transition: 'EN_COURS→TERMINEE',
            nb_inscrits: inscriptions?.length || 0,
          },
        })
      }

      return sessions.map(s => s.id)
    })
    stats.completed = sessionsCompleted.length

    // --- 3. Sessions dans 7 jours → Convocations ---
    const convocations = await step.run('send-convocations-j7', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const j7 = new Date()
      j7.setDate(j7.getDate() + 7)
      const j7Str = j7.toISOString().split('T')[0]

      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id, date_debut, horaire_debut, horaire_fin,
          formation:formations(nom),
          convocations_envoyees
        `)
        .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
        .eq('date_debut', j7Str)
        .eq('convocations_envoyees', false)

      if (!sessions || sessions.length === 0) return 0

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)
      let count = 0

      for (const session of sessions) {
        const { data: inscriptions } = await supabase
          .from('inscriptions')
          .select('lead:leads(email, prenom)')
          .eq('session_id', session.id)
          .in('statut', ['CONFIRMEE', 'EN_ATTENTE'])

        if (!inscriptions) continue

        for (const insc of inscriptions) {
          const lead = insc.lead as any
          if (!lead?.email) continue

          const formationNom = (session.formation as any)?.nom || 'votre formation'
          const dateFormatee = new Date(session.date_debut).toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })

          await resend.emails.send({
            from: 'Dermotec Formation <formation@dermotec.fr>',
            to: lead.email,
            subject: `Votre formation dans 7 jours — ${formationNom}`,
            html: `
              <!DOCTYPE html>
              <html lang="fr">
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
              <body style="margin:0;padding:0;background:#f8fafc;font-family:'DM Sans',Arial,sans-serif">
              <div style="max-width:600px;margin:0 auto;padding:24px">
                <div style="background:#082545;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
                  <h1 style="color:#2EC6F3;font-size:20px;margin:0;font-weight:600">Dermotec Advanced</h1>
                </div>
                <div style="background:#ffffff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:0">
                  <h2 style="color:#082545;margin:0 0 12px">Plus que 7 jours, ${lead.prenom} !</h2>
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
                    <p style="margin:0 0 8px;font-weight:600;color:#082545">${formationNom}</p>
                    <p style="margin:0 0 4px;color:#334155">Date : ${dateFormatee}</p>
                    <p style="margin:0 0 4px;color:#334155">Horaires : ${session.horaire_debut || '09:00'} — ${session.horaire_fin || '18:00'}</p>
                    <p style="margin:0;color:#334155">Lieu : 75 Bd Richard Lenoir, 75011 Paris</p>
                  </div>
                  <h3 style="color:#082545;margin:16px 0 8px">Pensez à apporter :</h3>
                  <ul style="color:#334155;line-height:1.8;padding-left:20px">
                    <li>Pièce d'identité</li>
                    <li>De quoi prendre des notes</li>
                    <li>Tenue confortable</li>
                  </ul>
                  <p style="color:#64748b;font-size:13px;margin-top:16px">
                    Une question ? Appelez-nous au
                    <a href="tel:+33188334343" style="color:#2EC6F3;text-decoration:none;font-weight:600">01 88 33 43 43</a>
                    ou écrivez-nous sur
                    <a href="https://wa.me/33188334343" style="color:#25D366;text-decoration:none;font-weight:600">WhatsApp</a>.
                  </p>
                </div>
              </div>
              </body></html>
            `,
          })
          count++
        }

        // Marquer les convocations comme envoyées
        await supabase
          .from('sessions')
          .update({ convocations_envoyees: true, updated_at: new Date().toISOString() })
          .eq('id', session.id)

        await supabase.from('activites').insert({
          type: 'SESSION',
          description: `Convocations J-7 envoyées pour "${(session.formation as any)?.nom}"`,
          metadata: { session_id: session.id, nb_convocations: count },
        })
      }

      return count
    })
    stats.convocations = convocations

    // --- 4. Sessions dans 2 jours → Rappel dernière minute ---
    const reminders = await step.run('send-reminders-j2', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const j2 = new Date()
      j2.setDate(j2.getDate() + 2)
      const j2Str = j2.toISOString().split('T')[0]

      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, formation:formations(nom)')
        .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
        .eq('date_debut', j2Str)

      if (!sessions || sessions.length === 0) return 0

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)
      let count = 0

      for (const session of sessions) {
        const { data: inscriptions } = await supabase
          .from('inscriptions')
          .select('lead:leads(email, prenom)')
          .eq('session_id', session.id)
          .in('statut', ['CONFIRMEE', 'EN_ATTENTE'])

        if (!inscriptions) continue

        for (const insc of inscriptions) {
          const lead = insc.lead as any
          if (!lead?.email) continue

          await resend.emails.send({
            from: 'Dermotec Formation <formation@dermotec.fr>',
            to: lead.email,
            subject: `Rappel : formation après-demain !`,
            html: `
              <!DOCTYPE html>
              <html lang="fr">
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
              <body style="margin:0;padding:0;background:#f8fafc;font-family:'DM Sans',Arial,sans-serif">
              <div style="max-width:600px;margin:0 auto;padding:24px">
                <div style="background:#082545;padding:16px;border-radius:12px 12px 0 0;text-align:center">
                  <h1 style="color:#2EC6F3;font-size:18px;margin:0">Dermotec Advanced</h1>
                </div>
                <div style="background:#ffffff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:0">
                  <p style="color:#082545;font-size:16px;font-weight:600;margin:0 0 12px">
                    ${lead.prenom}, c'est après-demain !
                  </p>
                  <p style="color:#334155;line-height:1.6">
                    Votre formation <strong>${(session.formation as any)?.nom}</strong> commence dans 2 jours.
                    On a hâte de vous accueillir !
                  </p>
                  <p style="color:#334155;line-height:1.6">
                    <strong>Adresse :</strong> 75 Bd Richard Lenoir, 75011 Paris<br>
                    <strong>Métro :</strong> Voltaire (ligne 9) ou Oberkampf (lignes 5, 9)
                  </p>
                </div>
              </div>
              </body></html>
            `,
          })
          count++
        }
      }

      return count
    })
    stats.reminders = reminders

    return {
      date: today,
      sessions_started: stats.started,
      sessions_completed: stats.completed,
      convocations_sent: stats.convocations,
      reminders_sent: stats.reminders,
    }
  }
)
