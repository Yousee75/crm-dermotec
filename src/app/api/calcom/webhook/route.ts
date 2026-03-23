import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Webhook Cal.com — reçoit les événements de réservation
 * Configurer dans Cal.com : Settings > Developer > Webhooks
 * URL = https://crm-dermotec.vercel.app/api/calcom/webhook
 * Events: BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { triggerEvent, payload } = body

    switch (triggerEvent) {
      case 'BOOKING_CREATED': {
        // TODO: Créer un rappel dans le CRM
        // TODO: Si le email match un lead → logger activité "RDV planifié"
        // TODO: Si metadata.source === 'crm-dermotec' → mettre à jour le lead
        break
      }

      case 'BOOKING_RESCHEDULED': {
        // TODO: Mettre à jour le rappel existant
        break
      }

      case 'BOOKING_CANCELLED': {
        // TODO: Annuler le rappel associé
        // TODO: Logger activité "RDV annulé"
        break
      }

      case 'MEETING_ENDED': {
        // TODO: Créer un rappel de suivi post-RDV
        break
      }

      default:
        // Event non géré
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Cal.com Webhook] Erreur:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
