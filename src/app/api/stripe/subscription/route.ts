// ============================================================
// CRM DERMOTEC — API Stripe Subscription Status
// GET /api/stripe/subscription
// Récupère l'abonnement actuel de l'utilisateur connecté
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { getPlanFromPriceId } from '@/lib/stripe-plans'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY manquante')
  return new Stripe(key, { apiVersion: '2025-08-27.basil' })
}

export async function GET(request: NextRequest) {
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

    const stripe = getStripe()

    // 2. Chercher le customer Stripe via email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    // Pas de customer → utilisateur gratuit
    if (customers.data.length === 0) {
      return NextResponse.json({
        subscription: null,
        plan: 'decouverte',
        customer: null,
        invoices: [],
      })
    }

    const customer = customers.data[0]

    // 3. Récupérer les abonnements actifs
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10,
    })

    // Pas d'abonnement actif → utilisateur gratuit
    if (subscriptions.data.length === 0) {
      return NextResponse.json({
        subscription: null,
        plan: 'decouverte',
        customer: {
          id: customer.id,
          email: customer.email,
        },
        invoices: [],
      })
    }

    // 4. Prendre le premier abonnement actif
    const subscription = subscriptions.data[0]
    const priceId = subscription.items.data[0]?.price?.id

    // Mapper price ID vers plan
    const plan = getPlanFromPriceId(priceId || '')

    // 5. Récupérer les dernières factures
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 5,
    })

    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      date: invoice.created * 1000, // Convertir timestamp Unix en ms
      amount: invoice.amount_paid || 0,
      status: invoice.status,
      pdf_url: invoice.hosted_invoice_url,
      number: invoice.number,
    }))

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan,
        current_period_end: subscription.current_period_end * 1000, // Convertir en ms
        cancel_at_period_end: subscription.cancel_at_period_end,
        created: subscription.created * 1000,
        price_id: priceId,
      },
      customer: {
        id: customer.id,
        email: customer.email,
      },
      invoices: formattedInvoices,
    })

  } catch (error) {
    console.error('[Stripe Subscription] Erreur:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération de l\'abonnement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}