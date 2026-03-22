// ============================================================
// Inngest Function: Snapshot mensuel KPIs
// Cron : 1er de chaque mois à 2h du matin
// Capture l'état du CRM pour comparaison M-1, M-3, M-12
// ============================================================

import { inngest } from '@/lib/inngest'

export const monthlySnapshot = inngest.createFunction(
  {
    id: 'crm-monthly-kpi-snapshot',
    retries: 3,
    triggers: [{ cron: 'TZ=Europe/Paris 0 2 1 * *' }], // 1er du mois à 2h
  },
  async ({ step }: { step: any }) => {
    // Step 1 : Capturer le snapshot via la fonction SQL
    const snapshot = await step.run('capture-snapshot', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const { error } = await supabase.rpc('capture_monthly_kpi_snapshot')
      if (error) throw new Error(`Snapshot failed: ${error.message}`)

      // Récupérer le snapshot créé
      const { data } = await supabase
        .from('kpi_snapshots')
        .select('*')
        .order('mois', { ascending: false })
        .limit(1)
        .single()

      return data
    })

    // Step 2 : Détecter les opportunités upsell
    const upsells = await step.run('detect-upsells', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      // Alumni/Formés qui matchent une règle upsell
      const { data: candidates } = await supabase
        .from('leads')
        .select(`
          id, prenom, nom, email, statut, dernier_upsell_at,
          inscriptions(session_id, statut, session:sessions(formation_id, date_fin))
        `)
        .in('statut', ['FORME', 'ALUMNI'])

      if (!candidates?.length) return { upsells_detected: 0 }

      const { data: rules } = await supabase
        .from('upsell_rules')
        .select('*, source:formations!upsell_rules_formation_source_id_fkey(nom), cible:formations!upsell_rules_formation_cible_id_fkey(nom, prix_ht)')
        .eq('is_active', true)

      if (!rules?.length) return { upsells_detected: 0 }

      let detected = 0

      for (const lead of candidates as any[]) {
        // Skip si upsell proposé récemment (< 30j)
        if (lead.dernier_upsell_at && new Date(lead.dernier_upsell_at).getTime() > Date.now() - 30 * 86400000) continue

        const completedFormations = (lead.inscriptions || [])
          .filter((i: any) => i.statut === 'COMPLETEE')
          .map((i: any) => i.session?.formation_id)
          .filter(Boolean)

        for (const rule of rules as any[]) {
          if (!completedFormations.includes(rule.formation_source_id)) continue

          // Vérifier le délai
          const completedInscription = (lead.inscriptions || []).find(
            (i: any) => i.session?.formation_id === rule.formation_source_id && i.statut === 'COMPLETEE'
          )
          if (!completedInscription?.session?.date_fin) continue

          const daysSince = Math.floor((Date.now() - new Date(completedInscription.session.date_fin).getTime()) / 86400000)
          if (daysSince < rule.delai_jours) continue

          // Créer le rappel upsell
          await supabase.from('rappels').insert({
            lead_id: lead.id,
            type: 'RELANCE',
            description: `[Upsell] ${rule.source?.nom} → ${rule.cible?.nom} (${rule.cible?.prix_ht}€) — ${rule.raison}`,
            date_rappel: new Date().toISOString(),
            statut: 'EN_ATTENTE',
            priorite: rule.priorite === 1 ? 'HAUTE' : 'NORMALE',
          })

          // Marquer le lead
          await supabase.from('leads')
            .update({ dernier_upsell_at: new Date().toISOString() })
            .eq('id', lead.id)

          // Log
          await supabase.from('activites').insert({
            type: 'SYSTEME',
            lead_id: lead.id,
            description: `Upsell détecté : ${rule.source?.nom} → ${rule.cible?.nom} (${rule.message_template.slice(0, 80)}...)`,
            metadata: { canal: 'agent_ia', action: 'upsell_detected', rule_id: rule.id },
          })

          detected++
          break // 1 upsell par lead par mois max
        }
      }

      return { upsells_detected: detected }
    })

    // Step 3 : Email récap mensuel
    await step.run('send-monthly-recap', async () => {
      try {
        const { Resend } = await import('resend')
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey || !snapshot) return { skipped: true }

        const resend = new Resend(apiKey)
        const s = snapshot as any

        await resend.emails.send({
          from: 'Dermotec CRM <crm@dermotec.fr>',
          to: process.env.ADMIN_EMAIL || 'dermotec.fr@gmail.com',
          subject: `[CRM] Bilan mensuel — ${new Date(s.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px">
              <h2 style="color:#082545">📊 Bilan mensuel CRM</h2>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>Total leads</strong></td><td style="text-align:right">${s.total_leads}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>Nouveaux ce mois</strong></td><td style="text-align:right">${s.nouveaux_leads}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>Convertis</strong></td><td style="text-align:right">${s.leads_convertis}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>CA réalisé</strong></td><td style="text-align:right;color:#22C55E;font-weight:bold">${Number(s.ca_realise).toLocaleString('fr-FR')}€</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>Taux conversion</strong></td><td style="text-align:right">${s.taux_conversion}%</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>Top source</strong></td><td style="text-align:right">${s.top_source || 'N/A'}</td></tr>
                <tr><td style="padding:8px"><strong>Top formation</strong></td><td style="text-align:right">${s.top_formation || 'N/A'}</td></tr>
              </table>
              ${upsells.upsells_detected > 0 ? `<p style="margin-top:16px;color:#F59E0B">🎯 ${upsells.upsells_detected} opportunité(s) upsell détectée(s)</p>` : ''}
              <p style="margin-top:24px">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'}/analytics"
                   style="background:#2EC6F3;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">
                  Voir les analytics
                </a>
              </p>
            </div>
          `,
        })
      } catch { /* non-bloquant */ }
    })

    return {
      snapshot: snapshot ? 'captured' : 'failed',
      upsells_detected: upsells.upsells_detected,
    }
  }
)
