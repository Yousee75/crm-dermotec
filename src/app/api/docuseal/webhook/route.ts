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

    console.log(`[DocuSeal Webhook] Event: ${event_type}`, JSON.stringify(data).slice(0, 200))

    switch (event_type) {
      case 'submission.completed': {
        // Tous les signataires ont signé
        const submissionId = data?.id
        const submitters = data?.submitters || []
        console.log(`[DocuSeal] Soumission ${submissionId} complétée — ${submitters.length} signataire(s)`)

        // TODO: Mettre à jour le statut du document dans le CRM
        // TODO: Stocker le PDF signé dans Supabase Storage
        // TODO: Logger l'activité
        break
      }

      case 'submitter.completed': {
        // Un signataire a signé
        const email = data?.email
        const role = data?.role
        console.log(`[DocuSeal] Signataire ${email} (${role}) a signé`)
        break
      }

      case 'submission.created': {
        console.log(`[DocuSeal] Nouvelle soumission créée: ${data?.id}`)
        break
      }

      default:
        console.log(`[DocuSeal] Event non géré: ${event_type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[DocuSeal Webhook] Erreur:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
