// ============================================================
// Inngest Function: Envoi email asynchrone via Resend
// Trigger: crm/email.send
// ============================================================

import { inngest } from '@/lib/inngest'

export const sendEmail = inngest.createFunction(
  {
    id: 'crm-send-email',
    retries: 3,
  },
  { event: 'crm/email.send' },
  async ({ event, step }) => {
    const { to, template_slug, variables, lead_id } = event.data

    // Step 1: Récupérer le template depuis Supabase
    const template = await step.run('fetch-template', async () => {
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

      if (error || !data) {
        throw new Error(`Template '${template_slug}' non trouvé`)
      }
      return data
    })

    // Step 2: Remplir les variables et envoyer via Resend
    const emailResult = await step.run('send-via-resend', async () => {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)

      let sujet = template.sujet as string
      let contenuHtml = template.contenu_html as string

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
        headers: {
          'X-Template-Slug': template_slug,
          'X-Lead-ID': lead_id || '',
        },
      })

      if (error) throw new Error(`Resend error: ${error.message}`)
      return { email_id: data?.id, sujet }
    })

    // Step 3: Logger dans activités + emails_sent
    await step.run('log-activity', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const promises: Promise<unknown>[] = []

      if (lead_id) {
        promises.push(
          supabase.from('activites').insert({
            type: 'EMAIL',
            lead_id,
            description: `Email envoyé: ${emailResult.sujet}`,
            metadata: {
              template_slug,
              email_id: emailResult.email_id,
              destinataire: to,
            },
          })
        )
      }

      promises.push(
        supabase.from('emails_sent').insert({
          template_id: template.id,
          template_slug,
          destinataire: to,
          sujet: emailResult.sujet,
          lead_id: lead_id || null,
          resend_id: emailResult.email_id,
          variables,
          statut: 'ENVOYE',
        })
      )

      await Promise.all(promises)
    })

    return { success: true, email_id: emailResult.email_id }
  }
)
