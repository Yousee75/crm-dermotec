// ============================================================
// Inngest Function: Agent IA Proactif (inspiré Gong Agents)
// Cron quotidien 8h — Scanne les leads critiques
// Crée des alertes, relances et actions automatiques
// ============================================================

import { inngest } from '@/lib/infra/inngest'

export const proactiveAgent = inngest.createFunction(
  {
    id: 'crm-proactive-agent',
    retries: 2,
    triggers: [{ cron: 'TZ=Europe/Paris 0 8 * * 1-5' }], // Lun-Ven 8h
  },
  async ({ step }: { step: any }) => {
    const supabaseImport = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
    }

    // ============================================
    // STEP 1: Leads chauds sans contact récent
    // Score > 60 + pas de contact depuis 7+ jours
    // ============================================
    const leadsChaudsSansContact = await step.run('detect-hot-leads-no-contact', async () => {
      const supabase = await supabaseImport()

      const { data } = await supabase
        .from('v_revenue_graph')
        .select('id, prenom, nom, statut, score, jours_sans_contact, formation_nom, commercial_assigne_id')
        .gte('score', 60)
        .gte('jours_sans_contact', 7)
        .not('statut', 'in', '("PERDU","SPAM","FORME","ALUMNI")')
        .order('score', { ascending: false })
        .limit(20)

      return data || []
    })

    // Créer des rappels automatiques pour les leads chauds
    if (leadsChaudsSansContact.length > 0) {
      await step.run('create-rappels-leads-chauds', async () => {
        const supabase = await supabaseImport()
        const now = new Date()

        const rappels = leadsChaudsSansContact.map((lead: any) => ({
          lead_id: lead.id,
          user_id: lead.commercial_assigne_id,
          type: lead.jours_sans_contact >= 14 ? 'APPEL' : 'EMAIL',
          description: `[Agent IA] Lead chaud (score ${lead.score}) sans contact depuis ${lead.jours_sans_contact}j — ${lead.formation_nom || 'formation non définie'}`,
          date_rappel: now.toISOString(),
          statut: 'EN_ATTENTE',
        }))

        // Éviter les doublons : ne pas créer si rappel similaire existe déjà
        for (const rappel of rappels) {
          const { data: existing } = await supabase
            .from('rappels')
            .select('id')
            .eq('lead_id', rappel.lead_id)
            .eq('statut', 'EN_ATTENTE')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1)

          if (!existing?.length) {
            await supabase.from('rappels').insert(rappel)
            await supabase.from('activites').insert({
              type: 'SYSTEME',
              lead_id: rappel.lead_id,
              description: rappel.description,
              metadata: { canal: 'agent_ia', action: 'rappel_auto', score: rappel.description.match(/score (\d+)/)?.[1] },
            })
          }
        }

        return { created: rappels.length }
      })
    }

    // ============================================
    // STEP 2: Financements en attente trop longtemps
    // Soumis depuis 14+ jours sans réponse
    // ============================================
    const financementsStagnants = await step.run('detect-stagnant-financements', async () => {
      const supabase = await supabaseImport()

      const dateLimite = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('financements')
        .select('id, lead_id, organisme, montant, statut, created_at, lead:leads(prenom, nom, email, commercial_assigne_id)')
        .in('statut', ['SOUMIS', 'EN_EXAMEN'])
        .lte('updated_at', dateLimite)
        .is('deleted_at', null)
        .limit(20)

      return data || []
    })

    if (financementsStagnants.length > 0) {
      await step.run('alert-stagnant-financements', async () => {
        const supabase = await supabaseImport()

        for (const fin of financementsStagnants as any[]) {
          const lead = fin.lead as any
          if (!lead) continue

          const joursAttente = Math.floor((Date.now() - new Date(fin.created_at).getTime()) / (1000 * 60 * 60 * 24))

          await supabase.from('rappels').insert({
            lead_id: fin.lead_id,
            user_id: lead.commercial_assigne_id,
            type: 'RELANCE',
            description: `[Agent IA] Financement ${fin.organisme} en attente depuis ${joursAttente}j (${fin.montant}€) — Relancer l'organisme`,
            date_rappel: new Date().toISOString(),
            statut: 'EN_ATTENTE',
          })

          await supabase.from('activites').insert({
            type: 'SYSTEME',
            lead_id: fin.lead_id,
            description: `Agent IA : financement ${fin.organisme} stagnant depuis ${joursAttente}j — rappel créé`,
            metadata: { canal: 'agent_ia', action: 'financement_relance', organisme: fin.organisme, jours: joursAttente },
          })
        }

        return { alerted: financementsStagnants.length }
      })
    }

    // ============================================
    // STEP 3: Sessions dans 7 jours — convocations
    // Leads inscrits avec session proche
    // ============================================
    const sessionsProches = await step.run('detect-upcoming-sessions', async () => {
      const supabase = await supabaseImport()

      const dans7j = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const demain = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data } = await supabase
        .from('sessions')
        .select('id, date_debut, formation:formations(nom), inscriptions(lead_id, statut, lead:leads(prenom, nom, email))')
        .gte('date_debut', demain)
        .lte('date_debut', dans7j)
        .in('statut', ['CONFIRMEE', 'PLANIFIEE'])
        .limit(10)

      return data || []
    })

    if (sessionsProches.length > 0) {
      await step.run('log-session-reminders', async () => {
        const supabase = await supabaseImport()
        let count = 0

        for (const session of sessionsProches as any[]) {
          const inscriptions = session.inscriptions || []
          const formation = session.formation as any
          const joursAvant = Math.ceil((new Date(session.date_debut).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

          for (const insc of inscriptions) {
            if (insc.statut !== 'CONFIRMEE' && insc.statut !== 'EN_COURS') continue
            const lead = insc.lead as any
            if (!lead) continue

            await supabase.from('activites').insert({
              type: 'SYSTEME',
              lead_id: insc.lead_id,
              session_id: session.id,
              description: `Agent IA : session "${formation?.nom}" dans ${joursAvant} jour(s) — ${lead.prenom} ${lead.nom}`,
              metadata: { canal: 'agent_ia', action: 'session_reminder', jours_avant: joursAvant },
            })
            count++
          }
        }

        return { reminders: count }
      })
    }

    // ============================================
    // STEP 4: Leads perdus récemment à fort potentiel
    // Perdu dans les 30 derniers jours + score > 50
    // ============================================
    const leadsRecuperables = await step.run('detect-recoverable-lost-leads', async () => {
      const supabase = await supabaseImport()

      const il30j = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('leads')
        .select('id, prenom, nom, score_chaud, formation_principale:formations!leads_formation_principale_id_fkey(nom), commercial_assigne_id')
        .eq('statut', 'PERDU')
        .gte('updated_at', il30j)
        .gte('score_chaud', 50)
        .order('score_chaud', { ascending: false })
        .limit(10)

      return data || []
    })

    if (leadsRecuperables.length > 0) {
      await step.run('create-recovery-tasks', async () => {
        const supabase = await supabaseImport()

        for (const lead of leadsRecuperables as any[]) {
          const formation = lead.formation_principale as any

          // Vérifier qu'on n'a pas déjà une tâche de récupération
          const { data: existing } = await supabase
            .from('rappels')
            .select('id')
            .eq('lead_id', lead.id)
            .eq('statut', 'EN_ATTENTE')
            .limit(1)

          if (!existing?.length) {
            await supabase.from('rappels').insert({
              lead_id: lead.id,
              user_id: lead.commercial_assigne_id,
              type: 'RELANCE',
              description: `[Agent IA] Lead récupérable (score ${lead.score_chaud}) — ${lead.prenom} ${lead.nom} — ${formation?.nom || 'formation ?'} — Perdu récemment, tenter une réactivation`,
              date_rappel: new Date().toISOString(),
              statut: 'EN_ATTENTE',
            })

            await supabase.from('activites').insert({
              type: 'SYSTEME',
              lead_id: lead.id,
              description: `Agent IA : lead récupérable détecté (score ${lead.score_chaud}) — rappel de réactivation créé`,
              metadata: { canal: 'agent_ia', action: 'recovery_attempt', score: lead.score_chaud },
            })
          }
        }

        return { recovery_tasks: leadsRecuperables.length }
      })
    }

    // ============================================
    // STEP 5: Résumé et log
    // ============================================
    const summary = {
      date: new Date().toISOString(),
      leads_chauds_alertes: leadsChaudsSansContact.length,
      financements_stagnants: financementsStagnants.length,
      sessions_proches: sessionsProches.length,
      leads_recuperables: leadsRecuperables.length,
      total_actions: leadsChaudsSansContact.length + financementsStagnants.length + leadsRecuperables.length,
    }

    // ============================================
    // STEP 6: Email récap aux admins
    // ============================================
    if (summary.total_actions > 0) {
      await step.run('send-recap-email', async () => {
        try {
          const { Resend } = await import('resend')
          const apiKey = process.env.RESEND_API_KEY
          if (!apiKey) return { skipped: true, reason: 'Resend non configuré' }

          const resend = new Resend(apiKey)

          const sections: string[] = []

          if (leadsChaudsSansContact.length > 0) {
            sections.push(`
              <h3 style="color:#F59E0B">🔥 ${leadsChaudsSansContact.length} lead(s) chaud(s) sans contact</h3>
              <ul>${leadsChaudsSansContact.slice(0, 5).map((l: any) =>
                `<li><strong>${l.prenom} ${l.nom}</strong> — Score ${l.score}, ${l.jours_sans_contact}j sans contact — ${l.formation_nom || 'N/A'}</li>`
              ).join('')}</ul>
            `)
          }

          if (financementsStagnants.length > 0) {
            sections.push(`
              <h3 style="color:#EF4444">💰 ${financementsStagnants.length} financement(s) en attente</h3>
              <ul>${financementsStagnants.slice(0, 5).map((f: any) => {
                const lead = f.lead as any
                return `<li><strong>${lead?.prenom || '?'} ${lead?.nom || '?'}</strong> — ${f.organisme} (${f.statut})</li>`
              }).join('')}</ul>
            `)
          }

          if (leadsRecuperables.length > 0) {
            sections.push(`
              <h3 style="color:#8B5CF6">♻️ ${leadsRecuperables.length} lead(s) récupérable(s)</h3>
              <ul>${leadsRecuperables.slice(0, 5).map((l: any) =>
                `<li><strong>${l.prenom} ${l.nom}</strong> — Score ${l.score_chaud}</li>`
              ).join('')}</ul>
            `)
          }

          if (sessionsProches.length > 0) {
            sections.push(`
              <h3 style="color:#6366F1">📅 ${sessionsProches.length} session(s) dans 7 jours</h3>
            `)
          }

          await resend.emails.send({
            from: 'Dermotec CRM <crm@dermotec.fr>',
            to: process.env.ADMIN_EMAIL || 'dermotec.fr@gmail.com',
            subject: `[Agent IA] ${summary.total_actions} action(s) automatique(s) — ${new Date().toLocaleDateString('fr-FR')}`,
            html: `
              <div style="font-family:sans-serif;max-width:600px">
                <h2 style="color:#1A1A1A">🤖 Rapport Agent IA Proactif</h2>
                <p style="color:#6B7280">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                ${sections.join('<hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0">')}
                <p style="margin-top:24px">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'}"
                     style="background:#FF5C00;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
                    Ouvrir le CRM
                  </a>
                </p>
              </div>
            `,
          })

          return { sent: true }
        } catch (err) {
          console.error('[ProactiveAgent] Email recap failed:', err)
          return { skipped: true, reason: 'Erreur envoi' }
        }
      })
    }

    return summary
  }
)
