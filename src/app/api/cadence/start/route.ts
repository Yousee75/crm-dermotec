import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { triggerLeadCadence } from '@/lib/infra/inngest-events'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const startCadenceSchema = z.object({
  leadId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Vérifier l'auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { leadId } = startCadenceSchema.parse(body)

    // Récupérer le lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id, prenom, nom, email, statut,
        formation_principale:formations(nom)
      `)
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead non trouvé' }, { status: 404 })
    }

    // Vérifier si déjà une cadence active
    const { data: existingCadence } = await supabase
      .from('cadence_instances')
      .select('id, statut')
      .eq('lead_id', leadId)
      .eq('statut', 'ACTIVE')
      .single()

    if (existingCadence) {
      return NextResponse.json({
        error: 'Cadence déjà active pour ce lead'
      }, { status: 400 })
    }

    // Déclencher la cadence via Inngest
    await triggerLeadCadence({
      lead_id: leadId,
      email: lead.email,
      prenom: lead.prenom,
      formation_nom: (lead.formation_principale as any)?.nom || 'nos formations',
    })

    // Logger l'activité
    await supabase.from('activites').insert({
      type: 'CADENCE',
      lead_id: leadId,
      user_id: user.id,
      description: `Cadence démarrée manuellement par ${user.email}`,
      metadata: { trigger: 'manual', user_email: user.email },
    })

    return NextResponse.json({
      success: true,
      message: 'Cadence démarrée avec succès'
    })

  } catch (error: any) {
    console.error('[Start Cadence] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Données invalides',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Erreur interne'
    }, { status: 500 })
  }
}