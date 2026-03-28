// ============================================================
// CRM DERMOTEC — API Stripe Customer Portal
// POST /api/stripe/portal
// Génère une session Customer Portal pour gestion abonnement
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import Stripe from 'stripe'
import { logActivity } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'

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

    const stripe = getStripe()

    // 2. Chercher le customer Stripe via email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    if (customers.data.length === 0) {
      return NextResponse.json(
        {
          error: 'Aucun compte client Stripe trouvé',
          message: 'Vous devez d\'abord souscrire un abonnement',
          redirect_to_plans: true
        },
        { status: 404 }
      )
    }

    const customer = customers.data[0]

    // 3. Construire l'URL de retour
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'
    const returnUrl = `${baseUrl}/settings/subscription`

    // 4. Créer la session Customer Portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl,
    })

    logActivity({
      type: 'PAIEMENT',
      description: `Accès portail client Stripe (${user.email})`,
      user_id: user.id,
      metadata: { action: 'stripe_portal_access', customer_id: customer.id, email: user.email },
    })

    return NextResponse.json({
      url: session.url,
      customer_id: customer.id,
    })

  } catch (error) {
    console.error('[Stripe Portal] Erreur:', error)

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
        error: 'Erreur lors de l\'accès au portail client',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}