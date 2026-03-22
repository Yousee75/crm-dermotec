// ============================================================
// Inngest Function: Rapport hebdomadaire automatique
// Cron : Chaque lundi à 7h (Europe/Paris)
// Génère HTML + sauvegarde DB + envoie par email
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

function formatEuro(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + '€'
}

function tendanceIcon(pct: number): string {
  if (pct > 5) return `<span style="color:#22C55E">↑ +${pct.toFixed(1)}%</span>`
  if (pct < -5) return `<span style="color:#EF4444">↓ ${pct.toFixed(1)}%</span>`
  return `<span style="color:#6B7280">→ ${pct.toFixed(1)}%</span>`
}

export const weeklyReport = inngest.createFunction(
  {
    id: 'crm-weekly-report',
    retries: 3,
    triggers: [{ cron: 'TZ=Europe/Paris 0 7 * * 1' }], // Lundi 7h
  },
  async ({ step }: { step: any }) => {
    // ============================================
    // STEP 1 : Collecter les données de la semaine
    // ============================================
    const data = await step.run('collect-weekly-data', async () => {
      const supabase = getSupabase()

      const now = new Date()
      const lundi = new Date(now)
      lundi.setDate(now.getDate() - 7) // Lundi dernier
      lundi.setHours(0, 0, 0, 0)
      const dimanche = new Date(lundi)
      dimanche.setDate(lundi.getDate() + 7)

      // Semaine précédente (S-1) pour comparaison
      const lundiS1 = new Date(lundi)
      lundiS1.setDate(lundi.getDate() - 7)

      const sDebut = lundi.toISOString()
      const sFin = dimanche.toISOString()
      const s1Debut = lundiS1.toISOString()

      // Requêtes parallèles
      const [
        leadsRes, leadsS1Res, convertisRes, convertisS1Res,
        perdusRes, caRes, caS1Res,
        sessionsRes, rappelsRes, rappelsOverdueRes, emailsRes,
        topCommRes, topFormRes, topSrcRes, pipelineRes
      ] = await Promise.all([
        // Leads cette semaine
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .gte('created_at', sDebut).lt('created_at', sFin).neq('statut', 'SPAM'),
        // Leads S-1
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .gte('created_at', s1Debut).lt('created_at', sDebut).neq('statut', 'SPAM'),
        // Convertis cette semaine
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .in('statut', ['INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI'])
          .gte('updated_at', sDebut).lt('updated_at', sFin),
        // Convertis S-1
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .in('statut', ['INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI'])
          .gte('updated_at', s1Debut).lt('updated_at', sDebut),
        // Perdus
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .eq('statut', 'PERDU').gte('updated_at', sDebut).lt('updated_at', sFin),
        // CA cette semaine
        supabase.from('inscriptions').select('montant_total')
          .eq('paiement_statut', 'PAYE').gte('updated_at', sDebut).lt('updated_at', sFin),
        // CA S-1
        supabase.from('inscriptions').select('montant_total')
          .eq('paiement_statut', 'PAYE').gte('updated_at', s1Debut).lt('updated_at', sDebut),
        // Sessions terminées
        supabase.from('sessions').select('id', { count: 'exact', head: true })
          .eq('statut', 'TERMINEE').gte('date_fin', sDebut).lt('date_fin', sFin),
        // Rappels traités
        supabase.from('rappels').select('id', { count: 'exact', head: true })
          .eq('statut', 'FAIT').gte('updated_at', sDebut).lt('updated_at', sFin),
        // Rappels overdue
        supabase.from('rappels').select('id', { count: 'exact', head: true })
          .eq('statut', 'EN_ATTENTE').lt('date_rappel', now.toISOString()),
        // Emails envoyés
        supabase.from('messages').select('id', { count: 'exact', head: true })
          .eq('canal', 'email').eq('direction', 'outbound')
          .gte('created_at', sDebut).lt('created_at', sFin),
        // Top commercial
        supabase.from('leads').select('commercial_assigne_id, equipe:equipe!leads_commercial_assigne_id_fkey(prenom, nom)')
          .in('statut', ['INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI'])
          .gte('updated_at', sDebut).lt('updated_at', sFin),
        // Top formation
        supabase.from('leads').select('formation:formations!leads_formation_principale_id_fkey(nom)')
          .gte('created_at', sDebut).lt('created_at', sFin).neq('statut', 'SPAM'),
        // Top source
        supabase.from('leads').select('source')
          .gte('created_at', sDebut).lt('created_at', sFin).neq('statut', 'SPAM'),
        // Pipeline value
        supabase.from('mv_pipeline_forecast').select('ca_pondere')
          .not('statut', 'in', '("FORME","ALUMNI","PERDU","SPAM")'),
      ])

      const ca = (caRes.data || []).reduce((s: number, i: any) => s + (i.montant_total || 0), 0)
      const caS1 = (caS1Res.data || []).reduce((s: number, i: any) => s + (i.montant_total || 0), 0)
      const nouveaux = leadsRes.count || 0
      const nouveauxS1 = leadsS1Res.count || 0
      const convertis = convertisRes.count || 0
      const convertisS1 = convertisS1Res.count || 0
      const pipelineValue = (pipelineRes.data || []).reduce((s: number, r: any) => s + (parseFloat(r.ca_pondere) || 0), 0)

      // Top commercial
      const commCounts: Record<string, { nom: string; count: number }> = {}
      for (const l of topCommRes.data || []) {
        const e = l.equipe as any
        if (e) {
          const key = `${e.prenom} ${e.nom}`
          commCounts[key] = commCounts[key] || { nom: key, count: 0 }
          commCounts[key].count++
        }
      }
      const topComm = Object.values(commCounts).sort((a, b) => b.count - a.count)[0]?.nom || 'N/A'

      // Top formation
      const formCounts: Record<string, number> = {}
      for (const l of topFormRes.data || []) {
        const f = l.formation as any
        if (f?.nom) formCounts[f.nom] = (formCounts[f.nom] || 0) + 1
      }
      const topForm = Object.entries(formCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'

      // Top source
      const srcCounts: Record<string, number> = {}
      for (const l of topSrcRes.data || []) {
        if (l.source) srcCounts[l.source] = (srcCounts[l.source] || 0) + 1
      }
      const topSrc = Object.entries(srcCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'

      const weekNum = Math.ceil((lundi.getTime() - new Date(lundi.getFullYear(), 0, 1).getTime()) / (7 * 86400000))

      return {
        semaine_debut: lundi.toISOString().split('T')[0],
        semaine_fin: dimanche.toISOString().split('T')[0],
        numero_semaine: weekNum,
        annee: lundi.getFullYear(),
        nouveaux, convertis, perdus: perdusRes.count || 0,
        ca, ca_previsionnel: Math.round(pipelineValue),
        sessions: sessionsRes.count || 0,
        rappels_traites: rappelsRes.count || 0,
        rappels_overdue: rappelsOverdueRes.count || 0,
        emails: emailsRes.count || 0,
        tendance_leads: nouveauxS1 > 0 ? ((nouveaux - nouveauxS1) / nouveauxS1 * 100) : 0,
        tendance_ca: caS1 > 0 ? ((ca - caS1) / caS1 * 100) : 0,
        tendance_conversion: convertisS1 > 0 ? ((convertis - convertisS1) / convertisS1 * 100) : 0,
        top_commercial: topComm,
        top_formation: topForm,
        top_source: topSrc,
      }
    })

    // ============================================
    // STEP 2 : Générer le HTML du rapport
    // ============================================
    const html = await step.run('generate-html', async () => {
      const d = data as any
      const dateRange = `${new Date(d.semaine_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${new Date(d.semaine_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`

      return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Rapport S${d.numero_semaine}</title></head>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b">
<div style="max-width:680px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#082545 0%,#0f3a6b 100%);padding:32px;color:#fff">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <div style="width:40px;height:40px;background:#2EC6F3;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px">D</div>
      <div>
        <h1 style="margin:0;font-size:24px;font-weight:700">Rapport Hebdomadaire</h1>
        <p style="margin:4px 0 0;opacity:0.7;font-size:14px">Semaine ${d.numero_semaine} · ${dateRange}</p>
      </div>
    </div>
  </div>

  <!-- KPIs Grid -->
  <div style="padding:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
    <div style="background:#f0fdf4;border-radius:12px;padding:16px;text-align:center">
      <p style="margin:0;font-size:28px;font-weight:800;color:#16a34a">${d.nouveaux}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#6b7280">Nouveaux leads</p>
      <p style="margin:2px 0 0;font-size:11px">${tendanceIcon(d.tendance_leads)} vs S-1</p>
    </div>
    <div style="background:#eff6ff;border-radius:12px;padding:16px;text-align:center">
      <p style="margin:0;font-size:28px;font-weight:800;color:#2563eb">${d.convertis}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#6b7280">Convertis</p>
      <p style="margin:2px 0 0;font-size:11px">${tendanceIcon(d.tendance_conversion)} vs S-1</p>
    </div>
    <div style="background:#fefce8;border-radius:12px;padding:16px;text-align:center">
      <p style="margin:0;font-size:28px;font-weight:800;color:#ca8a04">${formatEuro(d.ca)}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#6b7280">CA réalisé</p>
      <p style="margin:2px 0 0;font-size:11px">${tendanceIcon(d.tendance_ca)} vs S-1</p>
    </div>
  </div>

  <!-- Stats détaillées -->
  <div style="padding:0 24px 24px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:10px 0;color:#6b7280">Pipeline prévisionnel</td>
        <td style="padding:10px 0;text-align:right;font-weight:600;color:#2EC6F3">${formatEuro(d.ca_previsionnel)}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:10px 0;color:#6b7280">Sessions terminées</td>
        <td style="padding:10px 0;text-align:right;font-weight:600">${d.sessions}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:10px 0;color:#6b7280">Rappels traités</td>
        <td style="padding:10px 0;text-align:right;font-weight:600">${d.rappels_traites}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:10px 0;color:#6b7280">Rappels en retard</td>
        <td style="padding:10px 0;text-align:right;font-weight:600;color:${d.rappels_overdue > 0 ? '#ef4444' : '#22c55e'}">${d.rappels_overdue}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:10px 0;color:#6b7280">Emails envoyés</td>
        <td style="padding:10px 0;text-align:right;font-weight:600">${d.emails}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280">Leads perdus</td>
        <td style="padding:10px 0;text-align:right;font-weight:600;color:${d.perdus > 0 ? '#ef4444' : '#22c55e'}">${d.perdus}</td>
      </tr>
    </table>
  </div>

  <!-- Top performers -->
  <div style="padding:0 24px 24px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
    <div style="background:#f8fafc;border-radius:10px;padding:12px;text-align:center">
      <p style="margin:0;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Top Commercial</p>
      <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:#082545">${d.top_commercial}</p>
    </div>
    <div style="background:#f8fafc;border-radius:10px;padding:12px;text-align:center">
      <p style="margin:0;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Top Formation</p>
      <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:#082545">${d.top_formation}</p>
    </div>
    <div style="background:#f8fafc;border-radius:10px;padding:12px;text-align:center">
      <p style="margin:0;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Top Source</p>
      <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:#082545">${d.top_source}</p>
    </div>
  </div>

  <!-- CTA -->
  <div style="padding:0 24px 32px;text-align:center">
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'}/analytics" style="display:inline-block;background:#2EC6F3;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">
      Voir les analytics complets
    </a>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#9ca3af">Dermotec CRM · Rapport auto-généré · S${d.numero_semaine}/${d.annee}</p>
    <p style="margin:4px 0 0;font-size:11px;color:#9ca3af">75 Bd Richard Lenoir, 75011 Paris</p>
  </div>

</div>
</body>
</html>`
    })

    // ============================================
    // STEP 3 : Sauvegarder en DB
    // ============================================
    const saved = await step.run('save-to-db', async () => {
      const supabase = getSupabase()
      const d = data as any

      const { data: report, error } = await supabase
        .from('weekly_reports')
        .upsert({
          semaine_debut: d.semaine_debut,
          semaine_fin: d.semaine_fin,
          numero_semaine: d.numero_semaine,
          annee: d.annee,
          html_content: html,
          nouveaux_leads: d.nouveaux,
          leads_convertis: d.convertis,
          leads_perdus: d.perdus,
          ca_realise: d.ca,
          ca_previsionnel: d.ca_previsionnel,
          sessions_realisees: d.sessions,
          rappels_traites: d.rappels_traites,
          rappels_overdue: d.rappels_overdue,
          emails_envoyes: d.emails,
          tendance_leads: d.tendance_leads,
          tendance_ca: d.tendance_ca,
          tendance_conversion: d.tendance_conversion,
          top_commercial: d.top_commercial,
          top_formation: d.top_formation,
          top_source: d.top_source,
        }, { onConflict: 'annee,numero_semaine' })
        .select('id')
        .single()

      if (error) throw new Error(`Save failed: ${error.message}`)

      // Sauvegarder le HTML dans Supabase Storage
      try {
        const filename = `rapport-s${d.numero_semaine}-${d.annee}.html`
        await supabase.storage
          .from('documents')
          .upload(`rapports/${d.annee}/${filename}`, new Blob([html as string], { type: 'text/html' }), {
            contentType: 'text/html',
            upsert: true,
          })

        // Générer URL signée (7 jours)
        const { data: urlData } = await supabase.storage
          .from('documents')
          .createSignedUrl(`rapports/${d.annee}/${filename}`, 7 * 86400)

        if (urlData?.signedUrl) {
          await supabase.from('weekly_reports')
            .update({ storage_path: `rapports/${d.annee}/${filename}`, storage_url: urlData.signedUrl })
            .eq('id', report.id)
        }
      } catch (storageErr) {
        console.error('[WeeklyReport] Storage upload failed:', storageErr)
      }

      return { report_id: report.id }
    })

    // ============================================
    // STEP 4 : Envoyer par email
    // ============================================
    await step.run('send-email', async () => {
      try {
        const { Resend } = await import('resend')
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) return { skipped: true, reason: 'Resend non configuré' }

        const resend = new Resend(apiKey)
        const d = data as any

        await resend.emails.send({
          from: 'Dermotec CRM <crm@dermotec.fr>',
          to: process.env.ADMIN_EMAIL || 'dermotec.fr@gmail.com',
          subject: `📊 Rapport S${d.numero_semaine} — ${d.nouveaux} leads, ${formatEuro(d.ca)} CA`,
          html: html as string,
        })

        // Marquer comme envoyé
        const supabase = getSupabase()
        await supabase.from('weekly_reports')
          .update({ envoye_email: true, destinataires: [process.env.ADMIN_EMAIL || 'dermotec.fr@gmail.com'] })
          .eq('id', (saved as any).report_id)

        return { sent: true }
      } catch (err) {
        console.error('[WeeklyReport] Email failed:', err)
        return { sent: false, error: (err as Error).message }
      }
    })

    return {
      report_id: (saved as any).report_id,
      semaine: (data as any).numero_semaine,
      kpis: {
        leads: (data as any).nouveaux,
        convertis: (data as any).convertis,
        ca: (data as any).ca,
      },
    }
  }
)
