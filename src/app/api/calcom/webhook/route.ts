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

    console.log(`[Cal.com Webhook] Event: ${triggerEvent}`)

    switch (triggerEvent) {
      case 'BOOKING_CREATED': {
        const { title, startTime, endTime, attendees, metadata } = payload || {}
        const attendee = attendees?.[0]

        console.log(`[Cal.com] Nouveau RDV: ${title}`)
        console.log(`[Cal.com] Date: ${startTime} → ${endTime}`)
        console.log(`[Cal.com] Participant: ${attendee?.name} (${attendee?.email})`)

        // TODO: Créer un rappel dans le CRM
        // TODO: Si le email match un lead → logger activité "RDV planifié"
        // TODO: Si metadata.source === 'crm-dermotec' → mettre à jour le lead
        break
      }

      case 'BOOKING_RESCHEDULED': {
        const { title, startTime } = payload || {}
        console.log(`[Cal.com] RDV replanifié: ${title} → ${startTime}`)

        // TODO: Mettre à jour le rappel existant
        break
      }

      case 'BOOKING_CANCELLED': {
        const { title, cancellationReason } = payload || {}
        console.log(`[Cal.com] RDV annulé: ${title} — Raison: ${cancellationReason || 'non spécifiée'}`)

        // TODO: Annuler le rappel associé
        // TODO: Logger activité "RDV annulé"
        break
      }

      case 'MEETING_ENDED': {
        // Note: payload shape is different from other events (Cal.com issue #12494)
        console.log(`[Cal.com] Réunion terminée`)

        // TODO: Créer un rappel de suivi post-RDV
        break
      }

      default:
        console.log(`[Cal.com] Event non géré: ${triggerEvent}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Cal.com Webhook] Erreur:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
