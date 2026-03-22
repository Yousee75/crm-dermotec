// ============================================================
// Inngest Function: Bulk Operations avec Fan-Out
// Pattern: 1 event declencheur -> N steps paralleles
// Dead letter queue pour les echecs permanents
// ============================================================

import { inngest } from '@/lib/inngest'

// --- Bulk Email Send (fan-out pattern) ---

export const bulkEmailSend = inngest.createFunction(
  {
    id: 'crm-bulk-email-send',
    retries: 2,
    concurrency: {
      limit: 5, // Max 5 executions paralleles
    },
    throttle: {
      limit: 50, // Max 50 emails par minute (respect Resend limits)
      period: '1m',
    },
    triggers: [{ event: 'crm/bulk.email.send' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { recipients, template_slug, variables_template, batch_id } = event.data as {
      recipients: Array<{ email: string; lead_id: string; prenom: string }>
      template_slug: string
      variables_template: Record<string, string>
      batch_id: string
    }

    // Step 1: Charger le template une seule fois
    const template = await step.run('load-template', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('slug', template_slug)
        .eq('is_active', true)
        .single()

      if (error || !data) throw new Error(`Template ${template_slug} not found`)
      return data as { sujet: string; contenu_html: string }
    })

    // Step 2: Fan-out — envoyer un evenement par destinataire
    // Inngest gere la concurrence et le throttling
    const results = await step.run('fan-out-emails', async () => {
      const events = recipients.map((r) => ({
        name: 'crm/email.send' as const,
        data: {
          to: r.email,
          template_slug,
          variables: {
            ...variables_template,
            prenom: r.prenom,
          },
          lead_id: r.lead_id,
        },
      }))

      // Envoyer en batch de 100 max (limite Inngest)
      const batches: typeof events[] = []
      for (let i = 0; i < events.length; i += 100) {
        batches.push(events.slice(i, i + 100))
      }

      let totalSent = 0
      for (const batch of batches) {
        await inngest.send(batch)
        totalSent += batch.length
      }

      return { totalSent, batches: batches.length }
    })

    // Step 3: Logger le bulk send
    await step.run('log-bulk-result', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      await supabase.from('activites').insert({
        type: 'EMAIL',
        description: `Bulk email: ${results.totalSent} emails envoyes (template: ${template_slug})`,
        metadata: {
          batch_id,
          template_slug,
          total_recipients: recipients.length,
          total_sent: results.totalSent,
        },
      })
    })

    return {
      success: true,
      batch_id,
      total: recipients.length,
      sent: results.totalSent,
    }
  }
)

// --- Bulk Lead Update (avec debouncing) ---

export const bulkLeadUpdate = inngest.createFunction(
  {
    id: 'crm-bulk-lead-update',
    retries: 3,
    debounce: {
      period: '10s', // Regrouper les events dans une fenetre de 10s
      key: 'event.data.operation', // Par type d'operation
    },
    concurrency: {
      limit: 3,
    },
    triggers: [{ event: 'crm/bulk.lead.update' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { lead_ids, updates, operation, user_id } = event.data as {
      lead_ids: string[]
      updates: Record<string, unknown>
      operation: string
      user_id: string
    }

    // Traiter par lots de 50
    const BATCH_SIZE = 50
    const batches: string[][] = []
    for (let i = 0; i < lead_ids.length; i += BATCH_SIZE) {
      batches.push(lead_ids.slice(i, i + BATCH_SIZE))
    }

    let totalUpdated = 0
    let totalFailed = 0

    for (let idx = 0; idx < batches.length; idx++) {
      const batch = batches[idx]

      const result = await step.run(`update-batch-${idx}`, async () => {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false } }
        )

        const { data, error } = await supabase
          .from('leads')
          .update(updates)
          .in('id', batch)
          .select('id')

        if (error) {
          console.error(`Batch ${idx} failed:`, error.message)
          return { updated: 0, failed: batch.length, error: error.message }
        }

        return { updated: data?.length || 0, failed: batch.length - (data?.length || 0) }
      })

      totalUpdated += result.updated
      totalFailed += result.failed
    }

    // Logger le resultat global
    await step.run('log-bulk-update', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      await supabase.from('activites').insert({
        type: 'LEAD_MAJ',
        user_id,
        description: `Bulk update "${operation}": ${totalUpdated}/${lead_ids.length} leads mis a jour`,
        metadata: {
          operation,
          total_requested: lead_ids.length,
          total_updated: totalUpdated,
          total_failed: totalFailed,
          updates,
        },
      })
    })

    // Si trop d'echecs -> dead letter
    if (totalFailed > lead_ids.length * 0.1) {
      await step.run('dead-letter', async () => {
        await inngest.send({
          name: 'crm/webhook.received',
          data: {
            source: 'dead-letter',
            payload: {
              type: 'bulk-lead-update-failures',
              operation,
              totalFailed,
              totalRequested: lead_ids.length,
            },
          },
        })
      })
    }

    return { success: true, totalUpdated, totalFailed }
  }
)

// --- Refresh Materialized Views (priority: low, schedule) ---

export const refreshMaterializedViews = inngest.createFunction(
  {
    id: 'crm-refresh-mv',
    retries: 2,
    triggers: [{ cron: '*/5 * * * *' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: { step: any }) => {
    const result = await step.run('refresh-views', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const { error } = await supabase.rpc('refresh_dashboard_views')

      if (error) {
        console.error('Failed to refresh materialized views:', error.message)
        throw error
      }

      return { refreshed: true, at: new Date().toISOString() }
    })

    return result
  }
)

// --- Process Degraded Queue (priority: high) ---

export const processQueueJob = inngest.createFunction({
    id: 'crm-process-queue',
    retries: 1,
    triggers: [{ cron: '*/2 * * * *' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: { step: any }) => {
    // 1. Drainer la queue in-memory
    const result = await step.run('drain-memory-queue', async () => {
      const { processQueue } = await import('@/lib/graceful-degradation')
      return processQueue()
    })

    // 2. Drainer la Dead Letter Queue persistante (messages échoués)
    const dlqResult = await step.run('drain-dlq', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      // Récupérer les opérations en attente de retry
      const { data: pending } = await supabase
        .from('failed_operations')
        .select('*')
        .eq('status', 'pending')
        .lte('next_retry_at', new Date().toISOString())
        .lt('attempts', 5)  // Max 5 tentatives
        .order('created_at', { ascending: true })
        .limit(20)

      if (!pending?.length) return { processed: 0, failed: 0, remaining: 0 }

      let processed = 0
      let failed = 0

      for (const op of pending) {
        try {
          // Marquer comme processing
          await supabase.from('failed_operations')
            .update({ status: 'processing', attempts: op.attempts + 1 })
            .eq('id', op.id)

          // Reprocesser selon le service
          if (op.service === 'messages' && op.operation === 'save_message') {
            const { error } = await supabase.from('messages').insert(op.payload)
            if (error) throw new Error(error.message)
          }

          // Marquer comme completed
          await supabase.from('failed_operations')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', op.id)

          processed++
        } catch (err) {
          const nextAttempt = op.attempts + 1
          if (nextAttempt >= op.max_attempts) {
            // Dead — ne plus retenter
            await supabase.from('failed_operations')
              .update({ status: 'dead', last_error: (err as Error).message })
              .eq('id', op.id)
            failed++
            console.error(`[DLQ] Permanently failed: ${op.service}/${op.operation}`, (err as Error).message)
          } else {
            // Retry avec backoff exponentiel (30s, 1min, 2min, 4min, 8min)
            const backoffMs = Math.min(30_000 * Math.pow(2, nextAttempt), 480_000)
            await supabase.from('failed_operations')
              .update({
                status: 'pending',
                last_error: (err as Error).message,
                next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
              })
              .eq('id', op.id)
          }
        }
      }

      // Compter le restant
      const { count } = await supabase
        .from('failed_operations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')

      return { processed, failed, remaining: count || 0 }
    })

    if (result.remaining > 0 || dlqResult.remaining > 0) {
      console.warn(`[Queue] Memory: ${result.remaining} pending | DLQ: ${dlqResult.remaining} pending`)
    }

    return { memory_queue: result, dlq: dlqResult }
  }
)

// --- Business Metrics Check (detect anomalies) ---

export const businessMetricsCheck = inngest.createFunction({
    id: 'crm-business-metrics',
    retries: 1,
    triggers: [{ cron: '0 * * * *' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: { step: any }) => {
    const metrics = await step.run('compute-metrics', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      // Leads des 24 dernieres heures vs les 24h precedentes
      const now = new Date()
      const h24 = new Date(now.getTime() - 86400_000)
      const h48 = new Date(now.getTime() - 2 * 86400_000)

      const [recent, previous, conversions] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .gte('created_at', h24.toISOString()),
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .gte('created_at', h48.toISOString())
          .lt('created_at', h24.toISOString()),
        supabase.from('inscriptions').select('id, montant_total', { count: 'exact' })
          .eq('paiement_statut', 'PAYE')
          .gte('updated_at', h24.toISOString()),
      ])

      const recentLeads = recent.count || 0
      const previousLeads = previous.count || 0
      const conversionCount = conversions.count || 0
      const revenue24h = (conversions.data || []).reduce(
        (sum: number, i: { montant_total: number }) => sum + (i.montant_total || 0), 0
      )

      return {
        leads_24h: recentLeads,
        leads_prev_24h: previousLeads,
        lead_change_pct: previousLeads > 0
          ? Math.round(((recentLeads - previousLeads) / previousLeads) * 100)
          : 0,
        conversions_24h: conversionCount,
        revenue_24h: revenue24h,
      }
    })

    // Detecter les anomalies
    await step.run('check-anomalies', async () => {
      const anomalies: Array<{ type: string; message: string }> = []

      // Drop de leads > 50%
      if (metrics.leads_prev_24h > 5 && metrics.lead_change_pct < -50) {
        anomalies.push({
          type: 'LEAD_DROP',
          message: `Lead volume dropped ${Math.abs(metrics.lead_change_pct)}% (${metrics.leads_prev_24h} -> ${metrics.leads_24h})`,
        })
      }

      // Zero conversions alors qu'on a des leads
      if (metrics.leads_24h > 10 && metrics.conversions_24h === 0) {
        anomalies.push({
          type: 'ZERO_CONVERSIONS',
          message: `${metrics.leads_24h} leads in 24h but 0 conversions`,
        })
      }

      if (anomalies.length > 0) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false } }
        )

        for (const anomaly of anomalies) {
          await supabase.from('anomalies').insert({
            type: 'DONNEES_INCOHERENTES',
            severite: 'WARNING',
            titre: anomaly.type,
            description: anomaly.message,
            metadata: metrics,
          })
        }

        console.warn(`[BusinessMetrics] ${anomalies.length} anomalies detected`)
      }

      return { anomalies: anomalies.length, metrics }
    })

    return metrics
  }
)
