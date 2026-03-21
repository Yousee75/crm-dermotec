import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-08-27.basil' })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  const stripe = getStripe()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const inscriptionId = session.metadata?.inscription_id

      if (inscriptionId) {
        // Marquer inscription comme payée
        await supabase
          .from('inscriptions')
          .update({
            paiement_statut: 'PAYE',
            stripe_payment_id: session.payment_intent as string,
          })
          .eq('id', inscriptionId)

        // Logger
        await supabase.from('activites').insert({
          type: 'PAIEMENT',
          inscription_id: inscriptionId,
          description: `Paiement reçu via Stripe — ${(session.amount_total || 0) / 100}€`,
          metadata: {
            stripe_session_id: session.id,
            amount: (session.amount_total || 0) / 100,
          },
        })
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      const inscriptionId = intent.metadata?.inscription_id

      if (inscriptionId) {
        await supabase
          .from('inscriptions')
          .update({ paiement_statut: 'LITIGE' })
          .eq('id', inscriptionId)

        await supabase.from('activites').insert({
          type: 'PAIEMENT',
          inscription_id: inscriptionId,
          description: `Paiement échoué — ${intent.last_payment_error?.message || 'erreur inconnue'}`,
        })
      }
      break
    }

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
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
