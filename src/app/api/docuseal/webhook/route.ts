import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Webhook DocuSeal — reçoit les événements de signature
 * Configurer dans DocuSeal : Settings > Webhooks > URL = https://crm-dermotec.vercel.app/api/docuseal/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_type, data } = body

    switch (event_type) {
      case 'submission.completed': {
        // TODO: Mettre à jour le statut du document dans le CRM
        // TODO: Stocker le PDF signé dans Supabase Storage
        // TODO: Logger l'activité
        break
      }

      case 'submitter.completed': {
        // TODO: Logger l'activité de signature
        break
      }

      case 'submission.created': {
        // TODO: Logger la création
        break
      }

      default:
        // Event non géré
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[DocuSeal Webhook] Erreur:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
