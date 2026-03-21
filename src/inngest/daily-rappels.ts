// ============================================================
// Inngest Function: Cron quotidien 7h — Rappels du jour
// Envoie une notification admin avec les rappels en attente
// ============================================================

import { inngest } from '@/lib/inngest'

export const dailyRappels = inngest.createFunction(
  {
    id: 'crm-daily-rappels',
    retries: 2,
  },
  { cron: 'TZ=Europe/Paris 0 7 * * *' },
  async ({ step }) => {
    // Step 1: Récupérer les rappels du jour
    const rappels = await step.run('fetch-rappels-du-jour', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('rappels')
        .select('*, leads(prenom, nom, email, telephone)')
        .eq('statut', 'EN_ATTENTE')
        .lte('date_rappel', `${today}T23:59:59`)
        .order('date_rappel', { ascending: true })

      if (error) throw new Error(`Supabase error: ${error.message}`)
      return data || []
    })

    if (rappels.length === 0) {
      return { message: 'Aucun rappel aujourd\'hui' }
    }

    // Step 2: Vérifier les rappels en retard (jours précédents)
    const enRetard = await step.run('check-retard', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { data } = await supabase
        .from('rappels')
        .select('id')
        .eq('statut', 'EN_ATTENTE')
        .lt('date_rappel', yesterday.toISOString().split('T')[0])

      return data?.length || 0
    })

    // Step 3: Envoyer la notification admin
    await step.run('send-admin-digest', async () => {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)

      const lignes = rappels.map((r: Record<string, unknown>) => {
        const lead = r.leads as Record<string, string> | null
        const nom = lead ? `${lead.prenom} ${lead.nom}` : 'N/A'
        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0">${r.type_rappel}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0">${nom}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0">${r.description || '-'}</td>
        </tr>`
      })

      await resend.emails.send({
        from: 'Dermotec CRM <crm@dermotec.fr>',
        to: process.env.ADMIN_EMAIL || 'dermotec.fr@gmail.com',
        subject: `[CRM] ${rappels.length} rappel(s) aujourd'hui${enRetard > 0 ? ` + ${enRetard} en retard` : ''}`,
        html: `
          <h2>Rappels du jour — ${new Date().toLocaleDateString('fr-FR')}</h2>
          ${enRetard > 0 ? `<p style="color:#EF4444;font-weight:bold">⚠ ${enRetard} rappel(s) en retard non traité(s)</p>` : ''}
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f1f5f9">
                <th style="padding:8px;text-align:left">Type</th>
                <th style="padding:8px;text-align:left">Lead</th>
                <th style="padding:8px;text-align:left">Note</th>
              </tr>
            </thead>
            <tbody>${lignes.join('')}</tbody>
          </table>
          <p style="margin-top:16px">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crm.dermotec.fr'}/rappels"
               style="background:#2EC6F3;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
              Ouvrir le CRM
            </a>
          </p>
        `,
      })
    })

    return {
      rappels_count: rappels.length,
      en_retard: enRetard,
    }
  }
)
