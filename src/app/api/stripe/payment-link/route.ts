import { NextResponse, type NextRequest } from 'next/server'
import { createPaymentLink } from '@/lib/integrations/stripe'
import { requireAuth } from '@/lib/api/auth'

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
