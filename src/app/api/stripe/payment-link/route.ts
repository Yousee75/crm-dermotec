import { NextResponse, type NextRequest } from 'next/server'
import { createPaymentLink } from '@/lib/integrations/stripe'
import { requireAuth } from '@/lib/api/auth'
import { logActivity } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { formationNom, montant, inscriptionId } = body

    if (!formationNom || !montant || !inscriptionId) {
      return NextResponse.json(
        { error: 'formationNom, montant et inscriptionId requis' },
        { status: 400 }
      )
    }

    const paymentLink = await createPaymentLink({
      formationNom,
      montant,
      inscriptionId,
    })

    logActivity({
      type: 'PAIEMENT',
      description: `Lien paiement Stripe créé — ${formationNom} (${montant}€)`,
      inscription_id: inscriptionId,
      user_id: auth.user?.id,
      metadata: { action: 'stripe_payment_link', formation: formationNom, montant, stripe_link_id: paymentLink.id },
    })

    return NextResponse.json({
      url: paymentLink.url,
      id: paymentLink.id,
    })
  } catch (error: any) {
    console.error('[API] Payment link error:', error)
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la création du lien' },
      { status: 500 }
    )
  }
}
