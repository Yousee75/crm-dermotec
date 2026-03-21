// ============================================================
// CRM DERMOTEC — Inngest Functions (background jobs)
// ============================================================

import { inngest } from './inngest'

// ============================================================
// 1. Email async — envoi différé avec retry
// ============================================================
export const sendEmailAsync = inngest.createFunction(
  {
    id: 'send-email-async',
    retries: 3,
    throttle: { limit: 10, period: '1m' }, // Max 10 emails/min (Resend rate limit)
  },
  { event: 'crm/email.send' },
  async ({ event, step }) => {
    const { to, template_slug, variables, lead_id } = event.data

    // Step 1 : Récupérer le template
    const template = await step.run('fetch-template', async () => {
      const { createServiceSupabase } = await import('./supabase-server')
      const supabase = await createServiceSupabase()
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('slug', template_slug)
        .eq('is_active', true)
        .single()
      if (error || !data) throw new Error(`Template '${template_slug}' non trouvé`)
      return data
    })

    // Step 2 : Envoyer l'email
    const emailId = await step.run('send-resend', async () => {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      let sujet = template.sujet as string
      let contenuHtml = template.contenu_html as string

      // Remplacer les variables (déjà sanitizées côté API)
      for (const [key, value] of Object.entries(variables)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        sujet = sujet.replace(pattern, value)
        contenuHtml = contenuHtml.replace(pattern, value)
      }

      const { data, error } = await resend.emails.send({
        from: 'Dermotec Formation <formation@dermotec.fr>',
        to,
        subject: sujet,
        html: contenuHtml,
      })

      if (error) throw error
      return data?.id
    })

    // Step 3 : Logger (non-bloquant)
    await step.run('log-activity', async () => {
      const { createServiceSupabase } = await import('./supabase-server')
      const supabase = await createServiceSupabase()

      await supabase.from('emails_sent').insert({
        template_id: template.id,
        template_slug,
        destinataire: to,
        sujet: template.sujet,
        lead_id: lead_id || null,
        resend_id: emailId,
        variables,
        statut: 'ENVOYE',
      })

      if (lead_id) {
        await supabase.from('activites').insert({
          type: 'EMAIL',
          lead_id,
          description: `Email async envoyé: ${template.sujet}`,
          metadata: { template_slug, email_id: emailId, destinataire: to },
        })
      }
    })

    return { emailId, template_slug, to }
  }
)

// ============================================================
// 2. Cadence automation — engagement séquentiel
// ============================================================
export const executeCadence = inngest.createFunction(
  {
    id: 'execute-cadence',
    retries: 2,
  },
  { event: 'crm/cadence.start' },
  async ({ event, step }) => {
    const { lead_id, cadence_template_id, cadence_instance_id } = event.data

    // Récupérer le template de cadence
    const cadence = await step.run('fetch-cadence', async () => {
      const { createServiceSupabase } = await import('./supabase-server')
      const supabase = await createServiceSupabase()
      const { data } = await supabase
        .from('cadence_templates')
        .select('*')
        .eq('id', cadence_template_id)
        .single()
      return data
    })

    if (!cadence || !cadence.etapes) return { status: 'no_cadence' }

    const etapes = cadence.etapes as Array<{
      jour: number
      type: string
      titre: string
      template_slug?: string
    }>

    // Exécuter chaque étape avec les délais
    for (let i = 0; i < etapes.length; i++) {
      const etape = etapes[i]

      // Attendre le nombre de jours entre les étapes
      if (i > 0) {
        const joursAttente = etape.jour - etapes[i - 1].jour
        if (joursAttente > 0) {
          await step.sleep(`wait-${i}`, `${joursAttente}d`)
        }
      }

      // Vérifier que le lead est toujours actif
      const leadActif = await step.run(`check-lead-${i}`, async () => {
        const { createServiceSupabase } = await import('./supabase-server')
        const supabase = await createServiceSupabase()
        const { data } = await supabase
          .from('leads')
          .select('statut')
          .eq('id', lead_id)
          .single()
        // Arrêter la cadence si le lead est PERDU, SPAM, ou déjà INSCRIT+
        const stopStatuts = ['PERDU', 'SPAM', 'INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI']
        return data && !stopStatuts.includes(data.statut)
      })

      if (!leadActif) {
        // Mettre à jour la cadence instance
        await step.run('cancel-cadence', async () => {
          const { createServiceSupabase } = await import('./supabase-server')
          const supabase = await createServiceSupabase()
          await supabase
            .from('cadence_instances')
            .update({ statut: 'ANNULEE', etape_actuelle: i })
            .eq('id', cadence_instance_id)
        })
        return { status: 'cancelled', reason: 'lead_inactive', step: i }
      }

      // Exécuter l'étape
      await step.run(`execute-step-${i}`, async () => {
        const { createServiceSupabase } = await import('./supabase-server')
        const supabase = await createServiceSupabase()

        if (etape.type === 'EMAIL' && etape.template_slug) {
          // Récupérer les infos du lead pour les variables
          const { data: lead } = await supabase
            .from('leads')
            .select('prenom, nom, email')
            .eq('id', lead_id)
            .single()

          if (lead?.email) {
            // Déclencher l'envoi email via Inngest
            await inngest.send({
              name: 'crm/email.send',
              data: {
                to: lead.email,
                template_slug: etape.template_slug,
                variables: {
                  prenom: lead.prenom || '',
                  nom: lead.nom || '',
                },
                lead_id,
              },
            })
          }
        } else {
          // Créer un rappel pour les actions manuelles (APPEL, WHATSAPP)
          await supabase.from('rappels').insert({
            lead_id,
            type: etape.type,
            description: etape.titre,
            date_rappel: new Date().toISOString(),
            statut: 'EN_ATTENTE',
            priorite: 'NORMALE',
          })
        }

        // Mettre à jour l'étape actuelle
        await supabase
          .from('cadence_instances')
          .update({ etape_actuelle: i + 1 })
          .eq('id', cadence_instance_id)
      })
    }

    // Cadence terminée
    await step.run('complete-cadence', async () => {
      const { createServiceSupabase } = await import('./supabase-server')
      const supabase = await createServiceSupabase()
      await supabase
        .from('cadence_instances')
        .update({ statut: 'COMPLETEE', etape_actuelle: etapes.length })
        .eq('id', cadence_instance_id)
    })

    return { status: 'completed', steps: etapes.length }
  }
)

// ============================================================
// 3. Cron — Auto-transition sessions (tous les jours à 7h)
// ============================================================
export const autoTransitionSessions = inngest.createFunction(
  {
    id: 'auto-transition-sessions',
    retries: 2,
  },
  { cron: '0 7 * * *' }, // Tous les jours à 7h UTC
  async ({ step }) => {
    const results = await step.run('transition-sessions', async () => {
      const { createServiceSupabase } = await import('./supabase-server')
      const supabase = await createServiceSupabase()
      const today = new Date().toISOString().split('T')[0]

      // CONFIRMEE → EN_COURS (date_debut <= today)
      const { data: toStart } = await supabase
        .from('sessions')
        .select('id, formation_id')
        .eq('statut', 'CONFIRMEE')
        .lte('date_debut', today)
        .gte('date_fin', today)

      if (toStart?.length) {
        await supabase
          .from('sessions')
          .update({ statut: 'EN_COURS' })
          .in('id', toStart.map(s => s.id))

        for (const session of toStart) {
          await supabase.from('activites').insert({
            type: 'SESSION',
            session_id: session.id,
            description: 'Session démarrée automatiquement (auto-transition)',
            ancien_statut: 'CONFIRMEE',
            nouveau_statut: 'EN_COURS',
            metadata: { auto: true, trigger: 'inngest_cron' },
          })
        }
      }

      // EN_COURS → TERMINEE (date_fin < today)
      const { data: toEnd } = await supabase
        .from('sessions')
        .select('id, formation_id')
        .eq('statut', 'EN_COURS')
        .lt('date_fin', today)

      if (toEnd?.length) {
        await supabase
          .from('sessions')
          .update({ statut: 'TERMINEE' })
          .in('id', toEnd.map(s => s.id))

        for (const session of toEnd) {
          await supabase.from('activites').insert({
            type: 'SESSION',
            session_id: session.id,
            description: 'Session terminée automatiquement (auto-transition)',
            ancien_statut: 'EN_COURS',
            nouveau_statut: 'TERMINEE',
            metadata: { auto: true, trigger: 'inngest_cron' },
          })
        }
      }

      return {
        started: toStart?.length || 0,
        ended: toEnd?.length || 0,
      }
    })

    return results
  }
)

// ============================================================
// 4. Cron — Rappels overdue (tous les jours à 8h)
// ============================================================
export const checkOverdueRappels = inngest.createFunction(
  {
    id: 'check-overdue-rappels',
    retries: 1,
  },
  { cron: '0 8 * * *' },
  async ({ step }) => {
    await step.run('check-rappels', async () => {
      const { createServiceSupabase } = await import('./supabase-server')
      const supabase = await createServiceSupabase()
      const now = new Date().toISOString()

      // Trouver les rappels en retard
      const { data: overdue } = await supabase
        .from('rappels')
        .select('id, lead_id, user_id, type, description')
        .eq('statut', 'EN_ATTENTE')
        .lt('date_rappel', now)
        .limit(50)

      if (!overdue?.length) return { overdue: 0 }

      // Créer des smart actions pour chaque rappel overdue
      for (const rappel of overdue) {
        await supabase.from('smart_actions').insert({
          type: 'RAPPEL_OVERDUE',
          priorite: 'HAUTE',
          titre: `Rappel en retard : ${rappel.type}`,
          description: rappel.description || `Rappel ${rappel.type} non traité`,
          action_cta: 'Traiter le rappel',
          lead_id: rappel.lead_id,
          user_id: rappel.user_id,
          statut: 'ACTIVE',
          metadata: { rappel_id: rappel.id },
        })
      }

      return { overdue: overdue.length }
    })
  }
)

// ============================================================
// 5. Webhook sortant — dispatch avec retry
// ============================================================
export const dispatchOutgoingWebhook = inngest.createFunction(
  {
    id: 'dispatch-outgoing-webhook',
    retries: 5,
    backoff: { type: 'exponential', delay: '30s' },
  },
  { event: 'crm/webhook.outgoing' },
  async ({ event, step }) => {
    const { target_url, payload, event_type, subscription_id } = event.data

    const result = await step.run('send-webhook', async () => {
      const response = await fetch(target_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CRM-Event': event_type,
          'X-CRM-Signature': '', // TODO: HMAC signature
        },
        body: JSON.stringify({
          event: event_type,
          data: payload,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(10_000), // 10s timeout
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
      }

      return { status: response.status }
    })

    // Logger la livraison
    await step.run('log-delivery', async () => {
      const { createServiceSupabase } = await import('./supabase-server')
      const supabase = await createServiceSupabase()
      await supabase.from('webhook_deliveries').insert({
        subscription_id,
        event_type,
        payload,
        status: 'delivered',
        response_code: result.status,
        delivered_at: new Date().toISOString(),
      })
    })

    return result
  }
)

// ============================================================
// Export toutes les fonctions pour le serve endpoint
// ============================================================
export const inngestFunctions = [
  sendEmailAsync,
  executeCadence,
  autoTransitionSessions,
  checkOverdueRappels,
  dispatchOutgoingWebhook,
]
