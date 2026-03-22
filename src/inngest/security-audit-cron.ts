import 'server-only'
// ============================================================
// CRM SATOREA — Security Audit Cron (Inngest)
// Tourne TOUTES LES HEURES pour :
// 1. Self-check IA (injection, KB empoisonnée, data infectée)
// 2. Audit appareils suspects
// 3. Nettoyage événements anciens
// 4. Alerte admin si problème détecté
// 5. Health check global (Supabase, Stripe, Redis, Sentry)
// ============================================================

import { inngest } from '../lib/inngest'

// ============================================================
// JOB 1 : Audit sécurité complet — TOUTES LES HEURES
// ============================================================

export const securityAuditHourly = inngest.createFunction(
  {
    id: 'security-audit-hourly',
    name: 'Security Audit — Hourly Check',
  },
  { cron: '0 * * * *' }, // Chaque heure pile
  async ({ step }) => {
    const results: Record<string, any> = {}
    const issues: string[] = []

    // --- Step 1 : AI Self-Check ---
    const aiCheck = await step.run('ai-self-check', async () => {
      try {
        const { fullSelfCheck } = await import('../lib/security/ai-self-check')
        return await fullSelfCheck()
      } catch (err) {
        return { healthy: false, issues: [`AI self-check failed: ${err}`] }
      }
    })
    results.ai = aiCheck
    if (!aiCheck.healthy) issues.push(...(aiCheck.issues || ['AI unhealthy']))

    // --- Step 2 : Scan données pour injection ---
    const dataScan = await step.run('data-injection-scan', async () => {
      try {
        const { scanDataForInjection } = await import('../lib/security/ai-self-check')
        return await scanDataForInjection()
      } catch {
        return { clean: true, infectedRecords: [] }
      }
    })
    results.dataScan = { clean: dataScan.clean, infected: dataScan.infectedRecords?.length || 0 }
    if (!dataScan.clean) issues.push(`DATA_INFECTED: ${dataScan.infectedRecords.length} records`)

    // --- Step 3 : Appareils suspects (dernière heure) ---
    const deviceCheck = await step.run('suspicious-devices', async () => {
      try {
        const { createServiceSupabase } = await import('../lib/supabase-server')
        const supabase = await createServiceSupabase()

        // Appareils non-trusted connectés dans la dernière heure
        const { data: untrusted } = await (supabase as any)
          .from('known_devices')
          .select('fingerprint, user_id, ip_addresses, last_seen')
          .eq('trusted', false)
          .gte('last_seen', new Date(Date.now() - 3_600_000).toISOString())

        // Alertes non résolues critiques
        const { data: criticalAlerts } = await (supabase as any)
          .from('security_alerts')
          .select('id, risk_level, flags, user_id')
          .eq('resolved', false)
          .in('risk_level', ['critical', 'high'])
          .limit(20)

        // Events de la dernière heure avec risque élevé
        const { data: highRiskEvents } = await (supabase as any)
          .from('security_events')
          .select('id, user_id, risk_score, risk_flags, ip_address')
          .gte('risk_score', 50)
          .gte('created_at', new Date(Date.now() - 3_600_000).toISOString())

        return {
          untrusted_devices: untrusted?.length || 0,
          critical_alerts: criticalAlerts?.length || 0,
          high_risk_events: highRiskEvents?.length || 0,
          details: {
            untrusted: untrusted?.slice(0, 5) || [],
            alerts: criticalAlerts?.slice(0, 5) || [],
            events: highRiskEvents?.slice(0, 5) || [],
          },
        }
      } catch {
        return { untrusted_devices: 0, critical_alerts: 0, high_risk_events: 0, details: {} }
      }
    })
    results.devices = deviceCheck
    if (deviceCheck.untrusted_devices > 0) issues.push(`UNTRUSTED_DEVICES: ${deviceCheck.untrusted_devices}`)
    if (deviceCheck.critical_alerts > 0) issues.push(`CRITICAL_ALERTS_OPEN: ${deviceCheck.critical_alerts}`)
    if (deviceCheck.high_risk_events > 0) issues.push(`HIGH_RISK_EVENTS: ${deviceCheck.high_risk_events}`)

    // --- Step 4 : Health check services ---
    const healthCheck = await step.run('health-check-services', async () => {
      const health: Record<string, boolean> = {}

      // Supabase
      try {
        const { createServiceSupabase } = await import('../lib/supabase-server')
        const supabase = await createServiceSupabase()
        const { error } = await (supabase as any).from('equipe').select('id').limit(1)
        health.supabase = !error
      } catch { health.supabase = false }

      // Redis/Upstash
      try {
        const { cacheGet } = await import('../lib/upstash')
        await cacheGet('health-check-ping')
        health.redis = true
      } catch { health.redis = false }

      // Stripe
      try {
        const stripe = (await import('../lib/stripe')).default
        if (stripe) {
          await stripe.balance.retrieve()
          health.stripe = true
        } else { health.stripe = false }
      } catch { health.stripe = false }

      return health
    })
    results.health = healthCheck
    if (!healthCheck.supabase) issues.push('SUPABASE_DOWN')
    if (!healthCheck.redis) issues.push('REDIS_DOWN')

    // --- Step 5 : Nettoyage (1x par jour, à minuit) ---
    const hour = new Date().getUTCHours()
    if (hour === 0) {
      await step.run('cleanup-old-events', async () => {
        try {
          const { createServiceSupabase } = await import('../lib/supabase-server')
          const supabase = await createServiceSupabase()

          // Nettoyer les events > 90 jours
          await (supabase as any).rpc('cleanup_old_security_events')
          await (supabase as any).rpc('cleanup_old_ai_audit')

          return { cleaned: true }
        } catch {
          return { cleaned: false }
        }
      })
    }

    // --- Step 6 : Envoyer alerte si problèmes détectés ---
    if (issues.length > 0) {
      await step.run('send-security-alert', async () => {
        const severity = issues.some(i =>
          i.includes('DOWN') || i.includes('CRITICAL') || i.includes('INFECTED')
        ) ? 'CRITICAL' : 'WARNING'

        console.error(`[SECURITY CRON] ${severity}: ${issues.join(' | ')}`)

        // Email à l'admin
        try {
          const { sendEmail } = await import('../lib/email')
          await sendEmail({
            to: process.env.ADMIN_EMAIL || 'admin@satorea.com',
            subject: `[${severity}] Audit sécurité CRM — ${issues.length} problème(s) détecté(s)`,
            html: `
              <h2>Rapport d'audit sécurité — ${new Date().toLocaleString('fr-FR')}</h2>
              <p><strong>Statut :</strong> <span style="color:${severity === 'CRITICAL' ? 'red' : 'orange'}">${severity}</span></p>

              <h3>Problèmes détectés (${issues.length})</h3>
              <ul>
                ${issues.map(i => `<li>${i}</li>`).join('\n')}
              </ul>

              <h3>Health check services</h3>
              <table border="1" cellpadding="5">
                <tr><td>Supabase</td><td>${healthCheck.supabase ? '✅' : '❌'}</td></tr>
                <tr><td>Redis</td><td>${healthCheck.redis ? '✅' : '❌'}</td></tr>
                <tr><td>Stripe</td><td>${healthCheck.stripe ? '✅' : '❌'}</td></tr>
              </table>

              <h3>Sécurité</h3>
              <ul>
                <li>Appareils non-trusted actifs : ${deviceCheck.untrusted_devices}</li>
                <li>Alertes critiques ouvertes : ${deviceCheck.critical_alerts}</li>
                <li>Events à risque (1h) : ${deviceCheck.high_risk_events}</li>
              </ul>

              <h3>IA</h3>
              <ul>
                <li>Self-check : ${aiCheck.healthy ? '✅ Healthy' : '❌ UNHEALTHY'}</li>
                <li>Données infectées : ${dataScan.infectedRecords?.length || 0}</li>
              </ul>

              <p style="color:gray;font-size:12px">Audit automatique — CRM Satorea — toutes les heures</p>
            `,
          })
        } catch {
          // Email fail — non bloquant
        }

        return { severity, issues }
      })
    }

    // --- Résultat final ---
    return {
      timestamp: new Date().toISOString(),
      healthy: issues.length === 0,
      issues_count: issues.length,
      issues,
      results,
    }
  }
)

// ============================================================
// JOB 2 : Monitoring uptime — TOUTES LES 5 MINUTES
// ============================================================

export const uptimeMonitor = inngest.createFunction(
  {
    id: 'uptime-monitor',
    name: 'Uptime Monitor — 5min',
  },
  { cron: '*/5 * * * *' }, // Toutes les 5 minutes
  async ({ step }) => {
    const endpoints = [
      { name: 'CRM Homepage', url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://crm-dermotec.vercel.app'}/` },
      { name: 'API Health', url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://crm-dermotec.vercel.app'}/api/health` },
      { name: 'Login Page', url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://crm-dermotec.vercel.app'}/login` },
    ]

    const results = await step.run('check-endpoints', async () => {
      const checks = await Promise.allSettled(
        endpoints.map(async (ep) => {
          const start = Date.now()
          try {
            const res = await fetch(ep.url, {
              signal: AbortSignal.timeout(10_000),
              headers: { 'User-Agent': 'Satorea-Uptime-Monitor/1.0' },
            })
            return {
              name: ep.name,
              url: ep.url,
              status: res.status,
              latency_ms: Date.now() - start,
              ok: res.ok,
            }
          } catch (err) {
            return {
              name: ep.name,
              url: ep.url,
              status: 0,
              latency_ms: Date.now() - start,
              ok: false,
              error: err instanceof Error ? err.message : 'Unknown',
            }
          }
        })
      )

      return checks.map(c => c.status === 'fulfilled' ? c.value : { name: 'unknown', ok: false, status: 0, latency_ms: 0 })
    })

    // Alerter si un endpoint est down
    const down = results.filter((r: any) => !r.ok)
    if (down.length > 0) {
      await step.run('alert-downtime', async () => {
        console.error(`[UPTIME] ${down.length} endpoint(s) DOWN:`, down.map((d: any) => d.name).join(', '))

        try {
          const { sendEmail } = await import('../lib/email')
          await sendEmail({
            to: process.env.ADMIN_EMAIL || 'admin@satorea.com',
            subject: `[DOWNTIME] ${down.length} endpoint(s) inaccessible(s)`,
            html: `
              <h2>Alerte downtime CRM Satorea</h2>
              <table border="1" cellpadding="5">
                <tr><th>Endpoint</th><th>Status</th><th>Latence</th></tr>
                ${results.map((r: any) => `
                  <tr style="background:${r.ok ? '#e8f5e9' : '#ffebee'}">
                    <td>${r.name}</td>
                    <td>${r.ok ? '✅ ' + r.status : '❌ ' + (r.status || 'TIMEOUT')}</td>
                    <td>${r.latency_ms}ms</td>
                  </tr>
                `).join('')}
              </table>
              <p style="color:gray;font-size:12px">Monitoring automatique — toutes les 5 min</p>
            `,
          })
        } catch { /* non-bloquant */ }
      })
    }

    return { timestamp: new Date().toISOString(), all_ok: down.length === 0, results }
  }
)

// ============================================================
// JOB 3 : Rapport quotidien — CHAQUE MATIN 8H
// ============================================================

export const dailySecurityReport = inngest.createFunction(
  {
    id: 'daily-security-report',
    name: 'Daily Security Report — 8h',
  },
  { cron: '0 7 * * *' }, // 7h UTC = 8h Paris
  async ({ step }) => {
    const report = await step.run('generate-report', async () => {
      try {
        const { createServiceSupabase } = await import('../lib/supabase-server')
        const supabase = await createServiceSupabase()

        // Stats 24h
        const yesterday = new Date(Date.now() - 86_400_000).toISOString()

        const [events, alerts, injections, aiLogs, devices] = await Promise.all([
          (supabase as any).from('security_events').select('id, risk_level, risk_action', { count: 'exact' }).gte('created_at', yesterday),
          (supabase as any).from('security_alerts').select('id, risk_level', { count: 'exact' }).gte('created_at', yesterday),
          (supabase as any).from('ai_injection_attempts').select('id, injection_type', { count: 'exact' }).gte('created_at', yesterday),
          (supabase as any).from('ai_audit_log').select('id, blocked', { count: 'exact' }).gte('created_at', yesterday),
          (supabase as any).from('known_devices').select('id', { count: 'exact' }).eq('trusted', false),
        ])

        return {
          security_events: events.count || 0,
          security_alerts: alerts.count || 0,
          injection_attempts: injections.count || 0,
          ai_conversations: aiLogs.count || 0,
          untrusted_devices: devices.count || 0,
          blocked_events: events.data?.filter((e: any) => e.risk_action === 'block').length || 0,
          critical_events: events.data?.filter((e: any) => e.risk_level === 'critical').length || 0,
        }
      } catch {
        return { error: 'Failed to generate report' }
      }
    })

    // Envoyer le rapport par email
    await step.run('send-daily-report', async () => {
      try {
        const { sendEmail } = await import('../lib/email')
        const r = report as any

        await sendEmail({
          to: process.env.ADMIN_EMAIL || 'admin@satorea.com',
          subject: `[RAPPORT] Sécurité quotidienne CRM — ${new Date().toLocaleDateString('fr-FR')}`,
          html: `
            <h2>Rapport sécurité quotidien</h2>
            <p>${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <h3>Résumé 24h</h3>
            <table border="1" cellpadding="8" style="border-collapse:collapse">
              <tr><td>Événements sécurité</td><td><strong>${r.security_events || 0}</strong></td></tr>
              <tr><td>Alertes générées</td><td><strong>${r.security_alerts || 0}</strong></td></tr>
              <tr><td>Événements bloqués</td><td style="color:${(r.blocked_events || 0) > 0 ? 'red' : 'green'}"><strong>${r.blocked_events || 0}</strong></td></tr>
              <tr><td>Événements critiques</td><td style="color:${(r.critical_events || 0) > 0 ? 'red' : 'green'}"><strong>${r.critical_events || 0}</strong></td></tr>
              <tr><td>Tentatives injection IA</td><td style="color:${(r.injection_attempts || 0) > 0 ? 'orange' : 'green'}"><strong>${r.injection_attempts || 0}</strong></td></tr>
              <tr><td>Conversations IA</td><td>${r.ai_conversations || 0}</td></tr>
              <tr><td>Appareils non validés</td><td style="color:${(r.untrusted_devices || 0) > 0 ? 'orange' : 'green'}"><strong>${r.untrusted_devices || 0}</strong></td></tr>
            </table>

            <p style="color:gray;font-size:12px;margin-top:20px">
              Rapport automatique — CRM Satorea — chaque matin 8h<br>
              Pour accéder au dashboard sécurité : /settings/security
            </p>
          `,
        })
      } catch { /* non-bloquant */ }
    })

    return report
  }
)
