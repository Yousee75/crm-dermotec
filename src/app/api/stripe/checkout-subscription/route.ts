// ============================================================
// CRM DERMOTEC — API Stripe Checkout Subscription
// POST /api/stripe/checkout-subscription
// Crée une session Checkout pour abonnement SaaS
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { z } from 'zod'
import Stripe from 'stripe'
import { logActivity } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'

// Schema de validation
const CheckoutSubscriptionSchema = z.object({
  planId: z.enum(['pro', 'expert', 'clinique'], {
    errorMap: () => ({ message: 'Plan invalide. Choix : pro, expert, clinique' })
  }),
})

import { getPriceId, isPriceConfigured } from '@/lib/stripe-plans'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY manquante')
  return new Stripe(key, { apiVersion: '2025-08-27.basil' })
}

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const authResult = await requireAuth(request)
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Email utilisateur requis' },
        { status: 400 }
      )
    }

    // 2. Valider le payload
    const body = await request.json()
    const validationResult = CheckoutSubscriptionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validationResult.error.errors.map(err => err.message).join(', ')
        },
        { status: 400 }
      )
    }

    const { planId } = validationResult.data

    // Vérifier que le plan est configuré
    if (!isPriceConfigured(planId)) {
      return NextResponse.json(
        { error: `Plan ${planId} non configuré dans Stripe` },
        { status: 500 }
      )
    }

    const priceId = getPriceId(planId)

    const stripe = getStripe()

    // 3. Construire les URLs de redirection
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'
    const successUrl = `${baseUrl}/settings/subscription?success=true&plan=${planId}`
    const cancelUrl = `${baseUrl}/settings/subscription?canceled=true`

    // 4. Vérifier si l'utilisateur a déjà un abonnement
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    let customerId: string | undefined
    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0]
      customerId = customer.id

      // Vérifier les abonnements existants
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1,
      })

      if (existingSubscriptions.data.length > 0) {
        return NextResponse.json(
          {
            error: 'Un abonnement actif existe déjà',
            subscription_id: existingSubscriptions.data[0].id,
            redirect_to_portal: true
          },
          { status: 409 }
        )
      }
    }

    // 5. Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      customer_email: customerId ? undefined : user.email, // Ne pas dupliquer si customer existe
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        planId,
        userEmail: user.email,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId,
          userEmail: user.email,
        },
      },
      allow_promotion_codes: true, // Permettre les codes promo
      billing_address_collection: 'required', // Adresse de facturation obligatoire
      payment_method_types: ['card', 'sepa_debit'], // Support carte + SEPA
      locale: 'fr', // Interface en français
    })

    logActivity({
      type: 'PAIEMENT',
      description: `Checkout abonnement SaaS — plan ${planId} (${user.email})`,
      user_id: user.id,
      metadata: { action: 'stripe_checkout_subscription', plan: planId, session_id: session.id, email: user.email },
    })

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
      plan: planId,
    })

  } catch (error) {
    console.error('[Stripe Checkout Subscription] Erreur:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: 'Erreur Stripe',
          details: error.message,
          code: error.code,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Erreur lors de la création de la session de paiement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}