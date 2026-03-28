// ============================================================
// Inngest: Traitement async des webhooks Stripe
// Reçoit l'event depuis /api/stripe/webhook et traite en background
// Avantage: pas de timeout Stripe (30s), retry automatique, observabilité
// ============================================================

import { inngest } from '@/lib/infra/inngest'

export const stripeWebhookProcessor = inngest.createFunction(
  {
    id: 'stripe-webhook-processor',
    retries: 3,
    triggers: [{ event: 'stripe/webhook.process' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { eventId, eventType, objectId, metadata, amount, paymentIntent, chargeId } = event.data
    const inscriptionId = metadata?.inscription_id
    const commandeId = metadata?.commande_id

    // Helper : créer Supabase client
    const getDb = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
    }

    // Traiter selon le type d'événement
    switch (eventType) {
      case 'checkout.session.completed': {
        if (inscriptionId) {
          await step.run('update-inscription-paye', async () => {
            const db = await getDb()
            const { data: existing } = await db
              .from('inscriptions')
              .select('paiement_statut, lead_id, session_id, montant_total')
              .eq('id', inscriptionId)
              .single()

            if (existing?.paiement_statut === 'PAYE') return { skipped: true }

            await db.from('inscriptions').update({
              paiement_statut: 'PAYE',
              stripe_payment_id: paymentIntent || objectId,
              statut: 'CONFIRMEE',
            }).eq('id', inscriptionId)

            if (existing?.lead_id) {
              await db.from('leads').update({ statut: 'INSCRIT' }).eq('id', existing.lead_id)
            }

            return { updated: true, lead_id: existing?.lead_id }
          })

          await step.run('log-paiement', async () => {
            const db = await getDb()
            const { data: inscription } = await db
              .from('inscriptions')
              .select('lead_id, session_id, montant_total')
              .eq('id', inscriptionId)
              .single()

            await db.from('activites').insert({
              type: 'PAIEMENT',
              lead_id: inscription?.lead_id || null,
              inscription_id: inscriptionId,
              session_id: inscription?.session_id || null,
              description: `Paiement reçu : ${(amount / 100).toFixed(2)}€ via Stripe`,
              metadata: { stripe_event_id: eventId, payment_intent: paymentIntent, amount: amount / 100 },
            })

            // Incrémenter CA session
            if (inscription?.session_id && inscription?.montant_total) {
              await db.rpc('increment_session_ca', {
                p_session_id: inscription.session_id,
                p_amount: inscription.montant_total,
              }).then(() => {})
            }
          })
        }

        if (commandeId) {
          await step.run('update-commande-payee', async () => {
            const db = await getDb()
            await db.from('commandes').update({
              paiement_statut: 'PAYE',
              stripe_session_id: objectId,
              stripe_payment_intent: paymentIntent,
              statut: 'PREPAREE',
            }).eq('id', commandeId)
          })
        }
        break
      }

      case 'payment_intent.succeeded': {
        if (inscriptionId) {
          await step.run('pi-succeeded-update', async () => {
            const db = await getDb()
            const { data } = await db.from('inscriptions').select('paiement_statut, lead_id').eq('id', inscriptionId).single()
            if (data && data.paiement_statut !== 'PAYE') {
              await db.from('inscriptions').update({
                paiement_statut: 'PAYE', stripe_payment_id: objectId, statut: 'CONFIRMEE',
              }).eq('id', inscriptionId)
              if (data.lead_id) await db.from('leads').update({ statut: 'INSCRIT' }).eq('id', data.lead_id)
            }
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        if (inscriptionId) {
          await step.run('pi-failed', async () => {
            const db = await getDb()
            await db.from('inscriptions').update({ paiement_statut: 'LITIGE' }).eq('id', inscriptionId)
            await db.from('activites').insert({
              type: 'PAIEMENT', inscription_id: inscriptionId,
              description: 'Paiement échoué — relance nécessaire',
              metadata: { stripe_event_id: eventId },
            })
          })
        }
        break
      }

      case 'charge.pending': {
        if (inscriptionId) {
          await step.run('sepa-pending', async () => {
            const db = await getDb()
            await db.from('inscriptions').update({ paiement_statut: 'ACOMPTE' }).eq('id', inscriptionId)
            await db.from('activites').insert({
              type: 'PAIEMENT', inscription_id: inscriptionId,
              description: 'Paiement SEPA en cours de compensation (3-5 jours)',
              metadata: { payment_method: 'sepa_debit' },
            })
          })
        }
        break
      }

      case 'charge.succeeded': {
        if (inscriptionId) {
          await step.run('charge-succeeded', async () => {
            const db = await getDb()
            const { data } = await db.from('inscriptions').select('paiement_statut').eq('id', inscriptionId).single()
            if (data && data.paiement_statut !== 'PAYE') {
              await db.from('inscriptions').update({
                paiement_statut: 'PAYE', stripe_payment_id: paymentIntent || chargeId,
              }).eq('id', inscriptionId)
            }
          })
        }
        break
      }

      case 'charge.refunded': {
        await step.run('refund', async () => {
          const db = await getDb()
          if (inscriptionId) {
            await db.from('inscriptions').update({ paiement_statut: 'REMBOURSE', statut: 'REMBOURSEE' }).eq('id', inscriptionId)
            // Reverser le CA
            const { data } = await db.from('inscriptions').select('session_id, montant_total').eq('id', inscriptionId).single()
            if (data?.session_id && data?.montant_total) {
              await db.rpc('increment_session_ca', { p_session_id: data.session_id, p_amount: -data.montant_total }).then(() => {})
            }
          }
          if (commandeId) {
            await db.from('commandes').update({ paiement_statut: 'REMBOURSE', statut: 'RETOURNEE' }).eq('id', commandeId)
          }
        })
        break
      }

      case 'charge.dispute.created': {
        await step.run('dispute', async () => {
          const db = await getDb()
          const { data: inscription } = await db.from('inscriptions').select('id, lead_id').eq('stripe_payment_id', chargeId).single()
          if (inscription) {
            await db.from('inscriptions').update({ paiement_statut: 'LITIGE' }).eq('id', inscription.id)
            await db.from('anomalies').insert({
              type: 'MONTANT_ANORMAL', severite: 'CRITICAL',
              titre: 'Litige Stripe', description: `Montant contesté : ${(amount / 100).toFixed(2)}€`,
              table_name: 'inscriptions', record_id: inscription.id,
            })
          }
        })
        break
      }

      case 'invoice.paid': {
        if (inscriptionId) {
          await step.run('invoice-paid', async () => {
            const db = await getDb()
            await db.from('inscriptions').update({ paiement_statut: 'PAYE', stripe_invoice_id: objectId }).eq('id', inscriptionId)
            await db.from('factures').update({ statut: 'PAYEE' }).eq('stripe_invoice_id', objectId)
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        if (inscriptionId) {
          await step.run('invoice-failed', async () => {
            const db = await getDb()
            await db.from('inscriptions').update({ paiement_statut: 'LITIGE' }).eq('id', inscriptionId)
            await db.from('factures').update({ statut: 'EN_RETARD' }).eq('stripe_invoice_id', objectId)
            await db.from('anomalies').insert({
              type: 'MONTANT_ANORMAL', severite: 'WARNING',
              titre: 'Paiement facture échoué',
              description: `Facture ${objectId} — relance manuelle nécessaire`,
              table_name: 'inscriptions', record_id: inscriptionId,
            })
          })
        }
        break
      }

      default:
        // Event non géré
    }

    // Marquer comme traité
    await step.run('mark-processed', async () => {
      const db = await getDb()
      await db.from('webhook_events').update({
        status: 'processed',
        processed_at: new Date().toISOString(),
      }).eq('event_id', eventId)
    })

    return { eventType, eventId, processed: true }
  }
)
