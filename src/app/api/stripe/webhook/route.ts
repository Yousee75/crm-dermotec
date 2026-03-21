import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// ============================================================
// Webhook Stripe — Idempotent + événements complets
// Chaque event est stocké dans webhook_events pour déduplication
// ============================================================

export const dynamic = 'force-dynamic'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY manquante')
  return new Stripe(key, { apiVersion: '2025-08-27.basil' })
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logActivite(
  supabase: ReturnType<typeof createClient>,
  data: {
    type: string
    description: string
    lead_id?: string
    inscription_id?: string
    session_id?: string
    metadata?: Record<string, unknown>
  }
) {
  try {
    await supabase.from('activites').insert({
      type: data.type,
      description: data.description,
      lead_id: data.lead_id || null,
      inscription_id: data.inscription_id || null,
      session_id: data.session_id || null,
      metadata: data.metadata || {},
    })
  } catch (err) {
    console.error('[Stripe Webhook] Activity log failed:', err)
  }
}

// Vérifier si l'event a déjà été traité (idempotence)
async function isEventProcessed(supabase: ReturnType<typeof createClient>, eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .eq('status', 'processed')
    .single()
  return !!data
}

// Marquer l'event comme traité
async function markEventProcessed(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  await supabase.from('webhook_events').upsert({
    event_id: eventId,
    event_type: eventType,
    source: 'stripe',
    payload,
    status: 'processed',
    processed_at: new Date().toISOString(),
  }, { onConflict: 'event_id' })
}

// Marquer l'event comme échoué
async function markEventFailed(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  eventType: string,
  error: string
) {
  await supabase.from('webhook_events').upsert({
    event_id: eventId,
    event_type: eventType,
    source: 'stripe',
    status: 'failed',
    error_message: error,
    attempts: 1,
  }, { onConflict: 'event_id' })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    console.error('[Stripe Webhook] Supabase non configuré')
    // Retourner 503 pour que Stripe retry
    return NextResponse.json({ error: 'DB non configurée' }, { status: 503 })
  }

  console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`)

  // Idempotence : vérifier si déjà traité
  if (await isEventProcessed(supabase, event.id)) {
    console.log(`[Stripe Webhook] Event ${event.id} déjà traité, skip`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      // === PAIEMENT FORMATION ===
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const inscriptionId = session.metadata?.inscription_id
        const commandeId = session.metadata?.commande_id

        if (inscriptionId) {
          // Vérifier si déjà payé (double protection)
          const { data: existing } = await supabase
            .from('inscriptions')
            .select('paiement_statut')
            .eq('id', inscriptionId)
            .single()

          if (existing?.paiement_statut === 'PAYE') {
            console.log(`[Stripe Webhook] Inscription ${inscriptionId} déjà payée, skip`)
            break
          }

          await supabase
            .from('inscriptions')
            .update({
              paiement_statut: 'PAYE',
              stripe_payment_id: session.payment_intent as string,
              statut: 'CONFIRMEE',
            })
            .eq('id', inscriptionId)

          const { data: inscription } = await supabase
            .from('inscriptions')
            .select('lead_id, session_id, montant_total')
            .eq('id', inscriptionId)
            .single()

          if (inscription?.lead_id) {
            await supabase
              .from('leads')
              .update({ statut: 'INSCRIT' })
              .eq('id', inscription.lead_id)

            await logActivite(supabase, {
              type: 'PAIEMENT',
              description: `Paiement reçu : ${((session.amount_total || 0) / 100).toFixed(2)}€ via Stripe`,
              lead_id: inscription.lead_id,
              inscription_id: inscriptionId,
              session_id: inscription.session_id,
              metadata: {
                stripe_session_id: session.id,
                amount: (session.amount_total || 0) / 100,
                payment_intent: session.payment_intent,
              },
            })
          }

          // Incrémenter CA session
          if (inscription?.session_id && inscription?.montant_total) {
            const { error: rpcError } = await supabase.rpc('increment_session_ca', {
              p_session_id: inscription.session_id,
              p_amount: inscription.montant_total,
            })
            if (rpcError) {
              console.warn('[Stripe Webhook] increment_session_ca failed:', rpcError.message)
            }
          }
        }

        if (commandeId) {
          await supabase
            .from('commandes')
            .update({
              paiement_statut: 'PAYE',
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent as string,
              statut: 'PREPAREE',
            })
            .eq('id', commandeId)

          await logActivite(supabase, {
            type: 'PAIEMENT',
            description: `Commande payée : ${((session.amount_total || 0) / 100).toFixed(2)}€`,
            metadata: {
              commande_id: commandeId,
              stripe_session_id: session.id,
              amount: (session.amount_total || 0) / 100,
            },
          })
        }
        break
      }

      // === PAIEMENT ÉCHOUÉ ===
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        const inscriptionId = intent.metadata?.inscription_id

        if (inscriptionId) {
          await supabase
            .from('inscriptions')
            .update({ paiement_statut: 'LITIGE' })
            .eq('id', inscriptionId)

          const { data: inscription } = await supabase
            .from('inscriptions')
            .select('lead_id')
            .eq('id', inscriptionId)
            .single()

          await logActivite(supabase, {
            type: 'PAIEMENT',
            description: `Paiement échoué : ${intent.last_payment_error?.message || 'erreur inconnue'}`,
            lead_id: inscription?.lead_id,
            inscription_id: inscriptionId,
            metadata: {
              error: intent.last_payment_error?.message,
              payment_intent: intent.id,
            },
          })
        }
        break
      }

      // === PAIEMENT ANNULÉ ===
      case 'payment_intent.canceled': {
        const intent = event.data.object as Stripe.PaymentIntent
        const inscriptionId = intent.metadata?.inscription_id

        if (inscriptionId) {
          await supabase
            .from('inscriptions')
            .update({ paiement_statut: 'EN_ATTENTE' })
            .eq('id', inscriptionId)

          await logActivite(supabase, {
            type: 'PAIEMENT',
            description: `Paiement annulé par le client`,
            inscription_id: inscriptionId,
            metadata: { payment_intent: intent.id },
          })
        }
        break
      }

      // === FACTURE PAYÉE (paiement échelonné) ===
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const inscriptionId = invoice.metadata?.inscription_id

        if (inscriptionId) {
          await supabase
            .from('inscriptions')
            .update({
              paiement_statut: 'PAYE',
              stripe_invoice_id: invoice.id,
            })
            .eq('id', inscriptionId)

          await supabase
            .from('factures')
            .update({ statut: 'PAYEE' })
            .eq('stripe_invoice_id', invoice.id)

          await logActivite(supabase, {
            type: 'PAIEMENT',
            description: `Facture payée : ${((invoice.amount_paid || 0) / 100).toFixed(2)}€`,
            inscription_id: inscriptionId,
            metadata: { invoice_id: invoice.id },
          })
        }
        break
      }

      // === FACTURE ÉCHOUÉE ===
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const inscriptionId = invoice.metadata?.inscription_id

        if (inscriptionId) {
          await supabase
            .from('inscriptions')
            .update({ paiement_statut: 'LITIGE' })
            .eq('id', inscriptionId)

          await supabase
            .from('factures')
            .update({ statut: 'EN_RETARD' })
            .eq('stripe_invoice_id', invoice.id)

          await logActivite(supabase, {
            type: 'PAIEMENT',
            description: `Paiement facture échoué — relance nécessaire`,
            inscription_id: inscriptionId,
            metadata: { invoice_id: invoice.id },
          })

          // Créer une anomalie pour alerte admin
          await supabase.from('anomalies').insert({
            type: 'MONTANT_ANORMAL',
            severite: 'WARNING',
            titre: 'Paiement facture échoué',
            description: `La facture ${invoice.id} n'a pas pu être prélevée. Relance manuelle nécessaire.`,
            table_name: 'inscriptions',
            record_id: inscriptionId,
            metadata: { invoice_id: invoice.id, amount: (invoice.amount_due || 0) / 100 },
          })
        }
        break
      }

      // === REMBOURSEMENT ===
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const inscriptionId = charge.metadata?.inscription_id
        const commandeId = charge.metadata?.commande_id

        if (inscriptionId) {
          await supabase
            .from('inscriptions')
            .update({ paiement_statut: 'REMBOURSE', statut: 'REMBOURSEE' })
            .eq('id', inscriptionId)

          // Reverser le CA de la session
          const { data: inscription } = await supabase
            .from('inscriptions')
            .select('session_id, montant_total, lead_id')
            .eq('id', inscriptionId)
            .single()

          if (inscription?.session_id && inscription?.montant_total) {
            await supabase.rpc('increment_session_ca', {
              p_session_id: inscription.session_id,
              p_amount: -inscription.montant_total, // Négatif pour reverser
            })
          }

          await logActivite(supabase, {
            type: 'PAIEMENT',
            lead_id: inscription?.lead_id,
            inscription_id: inscriptionId,
            description: `Remboursement effectué : ${((charge.amount_refunded || 0) / 100).toFixed(2)}€`,
            metadata: { charge_id: charge.id },
          })
        }

        if (commandeId) {
          await supabase
            .from('commandes')
            .update({ paiement_statut: 'REMBOURSE', statut: 'RETOURNEE' })
            .eq('id', commandeId)
        }
        break
      }

      // === LITIGE ===
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        const charge = dispute.charge as string

        const { data: inscription } = await supabase
          .from('inscriptions')
          .select('id, lead_id')
          .eq('stripe_payment_id', charge)
          .single()

        if (inscription) {
          await supabase
            .from('inscriptions')
            .update({ paiement_statut: 'LITIGE' })
            .eq('id', inscription.id)

          await supabase.from('anomalies').insert({
            type: 'MONTANT_ANORMAL',
            severite: 'CRITICAL',
            titre: `Litige Stripe sur inscription`,
            description: `Litige ouvert pour le paiement ${charge}. Montant contesté : ${(dispute.amount / 100).toFixed(2)}€`,
            table_name: 'inscriptions',
            record_id: inscription.id,
            metadata: { dispute_id: dispute.id, charge_id: charge },
          })

          await logActivite(supabase, {
            type: 'PAIEMENT',
            lead_id: inscription.lead_id,
            inscription_id: inscription.id,
            description: `Litige Stripe ouvert : ${(dispute.amount / 100).toFixed(2)}€ contestés`,
            metadata: { dispute_id: dispute.id },
          })
        }
        break
      }

      default:
        console.log(`[Stripe Webhook] Event non géré: ${event.type}`)
    }

    // Marquer l'event comme traité
    await markEventProcessed(supabase, event.id, event.type, {
      object_id: (event.data.object as { id?: string }).id,
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err)

    // Marquer comme échoué pour debug
    await markEventFailed(supabase, event.id, event.type, errorMessage)

    // Retourner 500 pour que Stripe retry
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
