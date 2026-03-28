import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/lib/infra/inngest'

// ============================================================
// Webhook Supabase — Database Webhooks pour automatisations
// Reçoit les événements INSERT/UPDATE/DELETE des tables principales
// ============================================================

export const dynamic = 'force-dynamic'

interface SupabaseWebhookEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
  schema: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SupabaseWebhookEvent = await request.json()

    // Vérification simple de sécurité (optionnelle, Supabase ne fournit pas de signature par défaut)
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ============================================
    // Table LEADS : nouveau lead créé
    // ============================================
    if (body.table === 'leads' && body.type === 'INSERT' && body.record) {
      const lead = body.record

      try {
        // Déclencher l'enrichissement automatique
        await inngest.send({
          name: 'crm/lead.created',
          data: {
            lead_id: lead.id,
            siret: lead.siret || undefined,
            nom: lead.nom || undefined,
            prenom: lead.prenom || undefined,
            entreprise_nom: lead.entreprise_nom || undefined,
            ville: lead.metadata?.ville || undefined,
            email: lead.email || undefined,
            source: lead.source || 'unknown',
            trigger: 'database'
          }
        })

        // Enrichment triggered
      } catch (inngestError) {
        console.error('[Supabase Webhook] Enrichment trigger failed:', inngestError)
        // Continue processing, ne pas faire échouer le webhook
      }

      return NextResponse.json({
        success: true,
        processed: `lead.created for ${lead.id}`
      })
    }

    // ============================================
    // Table SESSIONS : session créée ou mise à jour
    // ============================================
    if (body.table === 'sessions' && body.type === 'INSERT' && body.record) {
      const session = body.record

      try {
        // Déclencher le lifecycle de session
        await inngest.send({
          name: 'crm/session.lifecycle',
          data: {
            session_id: session.id,
            formation_id: session.formation_id,
            date_debut: session.date_debut,
            type: 'created'
          }
        })

        // Session lifecycle triggered
      } catch (inngestError) {
        console.error('[Supabase Webhook] Session lifecycle trigger failed:', inngestError)
      }

      return NextResponse.json({
        success: true,
        processed: `session.created for ${session.id}`
      })
    }

    // ============================================
    // Autres tables ou événements non traités
    // ============================================
    return NextResponse.json({
      success: true,
      processed: 'ignored'
    })

  } catch (error) {
    console.error('[Supabase Webhook] Error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Méthode GET pour vérifier que le webhook est accessible
export async function GET() {
  return NextResponse.json({
    service: 'supabase-webhook',
    status: 'ok',
    timestamp: new Date().toISOString()
  })
}