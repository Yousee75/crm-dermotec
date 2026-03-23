import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceSupabase } from '@/lib/supabase-server'

// ============================================================
// Webhook Stripe — Fast Response + Async Processing
// 1. Vérifier signature (synchrone, rapide)
// 2. Check idempotence (synchrone, rapide)
// 3. Envoyer à Inngest pour traitement async (non-bloquant)
// 4. Fallback: traitement inline si Inngest indisponible
// ============================================================

export const dynamic = 'force-dynamic'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY manquante')
  return new Stripe(key, { apiVersion: '2025-08-27.basil' })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  // 1. Vérifier signature (rapide, ~5ms)
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

  const supabase = await createServiceSupabase()

  // 2. Idempotence check amélioré (rapide, ~50ms)
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id, status, attempts')
    .eq('event_id', event.id)
    .single()

  if (existing) {
    if (existing.status === 'processed') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    if (existing.status === 'pending' && existing.attempts > 0) {
      // Déjà en cours de traitement, éviter la duplication
      return NextResponse.json({ received: true, already_processing: true })
    }
  }

  // 3. Marquer comme "pending" avec signature vérifiée
  const startTime = Date.now()
  await supabase.from('webhook_events').upsert({
    event_id: event.id,
    event_type: event.type,
    source: 'stripe',
    status: 'pending',
    signature_verified: true,
    payload: {
      object_id: (event.data.object as { id?: string }).id,
      amount: (event.data.object as { amount?: number; amount_total?: number }).amount
        || (event.data.object as { amount_total?: number }).amount_total,
      metadata: (event.data.object as { metadata?: Record<string, string> }).metadata
    },
  }, { onConflict: 'event_id' })

  // Event received and verified

  // 4. Envoyer à Inngest pour traitement async
  try {
    const { inngest } = await import('@/lib/inngest')
    await inngest.send({
      name: 'stripe/webhook.process',
      data: {
        eventId: event.id,
        eventType: event.type,
        objectId: (event.data.object as { id?: string }).id || '',
        // Sérialiser le payload Stripe (pas l'objet complet — trop gros)
        metadata: (event.data.object as { metadata?: Record<string, string> }).metadata || {},
        amount: (event.data.object as { amount?: number; amount_total?: number }).amount
          || (event.data.object as { amount_total?: number }).amount_total
          || 0,
        paymentIntent: (event.data.object as { payment_intent?: string }).payment_intent || '',
        chargeId: (event.data.object as { charge?: string }).charge || '',
        invoiceId: (event.data.object as { id?: string }).id || '',
      },
    })

    // Répondre 200 IMMÉDIATEMENT — traitement en background
    return NextResponse.json({ received: true, async: true })

  } catch (inngestErr) {
    console.warn('[Stripe Webhook] Inngest unavailable, processing inline:', inngestErr)

    // 5. FALLBACK: traitement inline si Inngest est down
    try {
      await processStripeEventInline(supabase, event)

      // Utiliser la fonction optimisée pour marquer comme processed
      const processingDuration = Date.now() - startTime
      await supabase.rpc('mark_webhook_processed', {
        p_event_id: event.id,
        p_processing_duration_ms: processingDuration
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[Stripe Webhook] Inline processing failed:`, err)

      // Utiliser la fonction avec retry logic
      const processingDuration = Date.now() - startTime
      const shouldRetry = await supabase.rpc('mark_webhook_failed', {
        p_event_id: event.id,
        p_error_message: errorMessage,
        p_processing_duration_ms: processingDuration
      })

      return NextResponse.json({
        error: 'Processing failed',
        will_retry: shouldRetry.data
      }, { status: 500 })
    }

    return NextResponse.json({ received: true, inline: true })
  }
}

// ============================================================
// Traitement inline (fallback si Inngest indisponible)
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
async function processStripeEventInline(supabase: any, event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const inscriptionId = session.metadata?.inscription_id
      const commandeId = session.metadata?.commande_id

      if (inscriptionId) {
        const { data: existing } = await supabase
          .from('inscriptions')
          .select('paiement_statut')
          .eq('id', inscriptionId)
          .single()

        if (existing?.paiement_statut === 'PAYE') break

        await supabase.from('inscriptions').update({
          paiement_statut: 'PAYE',
          stripe_payment_id: session.payment_intent as string,
          statut: 'CONFIRMEE',
        }).eq('id', inscriptionId)

        const { data: inscription } = await supabase
          .from('inscriptions')
          .select('lead_id, session_id, montant_total')
          .eq('id', inscriptionId)
          .single()

        if (inscription?.lead_id) {
          await supabase.from('leads').update({ statut: 'INSCRIT' }).eq('id', inscription.lead_id)

          // Generer la commission pour le commercial assigne
          try {
            const { data: lead } = await supabase
              .from('leads')
              .select('prenom, nom, email, commercial_assigne_id, formation_principale_id, organisme_financement, parrain_id, financement_souhaite')
              .eq('id', inscription.lead_id)
              .single()

            const { data: commercial } = lead?.commercial_assigne_id
              ? await supabase.from('equipe').select('id, prenom, nom').eq('id', lead.commercial_assigne_id).single()
              : { data: null }

            const { data: formation } = lead?.formation_principale_id
              ? await supabase.from('formations').select('nom, categorie, prix_ht, tva_rate').eq('id', lead.formation_principale_id).single()
              : { data: null }

            if (commercial && formation) {
              const { createCommission } = await import('@/lib/commissions')
              await createCommission({
                commercial_id: commercial.id,
                commercial_nom: `${commercial.prenom} ${commercial.nom}`,
                lead_id: inscription.lead_id,
                lead_nom: `${lead.prenom} ${lead.nom || ''}`.trim(),
                lead_email: lead.email || undefined,
                inscription_id: inscriptionId,
                session_id: inscription.session_id,
                formation_nom: formation.nom,
                formation_categorie: formation.categorie,
                montant_ht: formation.prix_ht,
                montant_ttc: formation.prix_ht * (1 + (formation.tva_rate || 20) / 100),
                mode_paiement: lead.financement_souhaite ? 'financement' : 'direct',
                organisme_financement: lead.organisme_financement || undefined,
                montant_finance: lead.financement_souhaite ? formation.prix_ht : 0,
                reste_a_charge: lead.financement_souhaite ? 0 : formation.prix_ht * (1 + (formation.tva_rate || 20) / 100),
              })
            }
          } catch (commErr) {
            console.error('[Webhook] Erreur creation commission:', commErr)
          }
        }

        if (inscription?.session_id && inscription?.montant_total) {
          await supabase.rpc('increment_session_ca', {
            p_session_id: inscription.session_id,
            p_amount: inscription.montant_total,
          }).then(() => {})
        }
      }

      if (commandeId) {
        await supabase.from('commandes').update({
          paiement_statut: 'PAYE',
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent as string,
          statut: 'PREPAREE',
        }).eq('id', commandeId)
      }
      break
    }

    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent
      const inscriptionId = intent.metadata?.inscription_id
      if (inscriptionId) {
        const { data: existing } = await supabase
          .from('inscriptions')
          .select('paiement_statut')
          .eq('id', inscriptionId)
          .single()

        if (existing && existing.paiement_statut !== 'PAYE') {
          await supabase.from('inscriptions').update({
            paiement_statut: 'PAYE',
            stripe_payment_id: intent.id,
            statut: 'CONFIRMEE',
          }).eq('id', inscriptionId)
        }
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      const inscriptionId = intent.metadata?.inscription_id
      if (inscriptionId) {
        await supabase.from('inscriptions').update({ paiement_statut: 'LITIGE' }).eq('id', inscriptionId)
      }
      break
    }

    case 'payment_intent.canceled': {
      const intent = event.data.object as Stripe.PaymentIntent
      const inscriptionId = intent.metadata?.inscription_id
      if (inscriptionId) {
        await supabase.from('inscriptions').update({ paiement_statut: 'EN_ATTENTE' }).eq('id', inscriptionId)
      }
      break
    }

    case 'charge.succeeded': {
      const charge = event.data.object as Stripe.Charge
      const inscriptionId = charge.metadata?.inscription_id
      if (inscriptionId) {
        const { data: existing } = await supabase
          .from('inscriptions').select('paiement_statut').eq('id', inscriptionId).single()
        if (existing && existing.paiement_statut !== 'PAYE') {
          await supabase.from('inscriptions').update({
            paiement_statut: 'PAYE',
            stripe_payment_id: charge.payment_intent as string || charge.id,
          }).eq('id', inscriptionId)
        }
      }
      break
    }

    case 'charge.pending': {
      const charge = event.data.object as Stripe.Charge
      const inscriptionId = charge.metadata?.inscription_id
      if (inscriptionId) {
        await supabase.from('inscriptions').update({ paiement_statut: 'ACOMPTE' }).eq('id', inscriptionId)
      }
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const inscriptionId = charge.metadata?.inscription_id
      if (inscriptionId) {
        await supabase.from('inscriptions').update({ paiement_statut: 'REMBOURSE', statut: 'REMBOURSEE' }).eq('id', inscriptionId)
      }
      if (charge.metadata?.commande_id) {
        await supabase.from('commandes').update({ paiement_statut: 'REMBOURSE', statut: 'RETOURNEE' }).eq('id', charge.metadata.commande_id)
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const inscriptionId = invoice.metadata?.inscription_id
      if (inscriptionId) {
        await supabase.from('inscriptions').update({ paiement_statut: 'PAYE', stripe_invoice_id: invoice.id }).eq('id', inscriptionId)
        await supabase.from('factures').update({ statut: 'PAYEE' }).eq('stripe_invoice_id', invoice.id)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const inscriptionId = invoice.metadata?.inscription_id
      if (inscriptionId) {
        await supabase.from('inscriptions').update({ paiement_statut: 'LITIGE' }).eq('id', inscriptionId)
        await supabase.from('factures').update({ statut: 'EN_RETARD' }).eq('stripe_invoice_id', invoice.id)
      }
      break
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute
      const chargeId = dispute.charge as string
      const { data: inscription } = await supabase
        .from('inscriptions').select('id, lead_id').eq('stripe_payment_id', chargeId).single()
      if (inscription) {
        await supabase.from('inscriptions').update({ paiement_statut: 'LITIGE' }).eq('id', inscription.id)
        await supabase.from('anomalies').insert({
          type: 'MONTANT_ANORMAL',
          severite: 'CRITICAL',
          titre: 'Litige Stripe',
          description: `Montant contesté : ${(dispute.amount / 100).toFixed(2)}€`,
          table_name: 'inscriptions',
          record_id: inscription.id,
        })
      }
      break
    }

    default:
      // Event non géré
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
