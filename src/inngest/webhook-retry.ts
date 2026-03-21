// ============================================================
// Inngest Function: Webhook retry avec backoff exponentiel
// Traite les webhooks entrants avec retry automatique
// ============================================================

import { inngest } from '@/lib/inngest'

export const webhookRetry = inngest.createFunction(
  {
    id: 'crm-webhook-retry',
    retries: 5,
    // Backoff exponentiel custom via onFailure
  },
  { event: 'crm/webhook.received' },
  async ({ event, step, attempt }) => {
    const { source, payload } = event.data

    // Step 1: Valider le payload
    const validated = await step.run('validate-payload', async () => {
      if (!source) throw new Error('Source webhook manquante')
      if (!payload || typeof payload !== 'object') {
        throw new Error('Payload invalide')
      }

      const supportedSources = ['stripe', 'typeform', 'calendly', 'zapier', 'custom']
      if (!supportedSources.includes(source)) {
        throw new Error(`Source non supportée: ${source}`)
      }

      return { source, valid: true }
    })

    // Step 2: Traiter selon la source
    const result = await step.run('process-webhook', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      switch (validated.source) {
        case 'typeform': {
          // Créer un lead depuis Typeform
          const answers = payload.answers as Record<string, string>[] | undefined
          if (!answers) throw new Error('Typeform: answers manquantes')

          const { error } = await supabase.from('leads').insert({
            prenom: answers[0]?.text || 'Inconnu',
            email: answers[1]?.email || '',
            telephone: answers[2]?.phone_number || '',
            source: 'formulaire',
            statut: 'NOUVEAU',
            metadata: { webhook_source: 'typeform', raw: payload },
          })
          if (error) throw new Error(`Supabase insert error: ${error.message}`)
          return { action: 'lead_created', source: 'typeform' }
        }

        case 'calendly': {
          // Créer un rappel RDV
          const eventData = payload as Record<string, unknown>
          const { error } = await supabase.from('rappels').insert({
            type_rappel: 'RDV',
            date_rappel: eventData.start_time as string,
            description: `RDV Calendly: ${eventData.name || 'RDV'}`,
            statut: 'EN_ATTENTE',
            metadata: { webhook_source: 'calendly', raw: payload },
          })
          if (error) throw new Error(`Supabase insert error: ${error.message}`)
          return { action: 'rappel_created', source: 'calendly' }
        }

        default: {
          // Stocker le webhook brut pour traitement manuel
          await supabase.from('activites').insert({
            type: 'SYSTEME',
            description: `Webhook reçu de ${validated.source}`,
            metadata: { source: validated.source, payload, attempt },
          })
          return { action: 'logged', source: validated.source }
        }
      }
    })

    // Step 3: Logger le succès
    await step.run('log-success', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      await supabase.from('activites').insert({
        type: 'SYSTEME',
        description: `Webhook ${source} traité avec succès (attempt ${attempt + 1})`,
        metadata: { result, attempt },
      })
    })

    return result
  }
)
