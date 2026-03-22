import { NextRequest, NextResponse } from 'next/server'
import { askCommercialAssistant } from '@/lib/ai-commercial'
import type { AssistantAction } from '@/lib/ai-commercial'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    // Auth obligatoire (CRM interne)
    const supabase = await createServerSupabase()
    // Mode démo : skip auth
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    if (!isDemoMode) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { action, lead_id, input } = body as { action: AssistantAction; lead_id?: string; input?: string }

    if (!action) {
      return NextResponse.json({ error: 'Action requise' }, { status: 400 })
    }

    const service = await createServiceSupabase()

    // Charger le lead si ID fourni
    let lead = undefined
    if (lead_id) {
      const { data } = await (service as any)
        .from('leads')
        .select('*, formation_principale:formations(nom)')
        .eq('id', lead_id)
        .single()

      if (data) {
        lead = {
          prenom: data.prenom,
          nom: data.nom,
          email: data.email,
          telephone: data.telephone,
          statut: data.statut,
          statut_pro: data.statut_pro,
          experience_esthetique: data.experience_esthetique,
          source: data.source,
          formation_principale: data.formation_principale?.nom,
          formations_interessees: data.formations_interessees,
          financement_souhaite: data.financement_souhaite,
          nb_contacts: data.nb_contacts,
          score_chaud: data.score_chaud,
          date_dernier_contact: data.date_dernier_contact,
          objectif_pro: data.objectif_pro,
          message: data.message,
          tags: data.tags,
          notes: data.notes,
        }
      }
    }

    // Charger les formations pour le contexte
    const { data: formations } = await (service as any)
      .from('formations')
      .select('nom, prix_ht, duree_jours')
      .eq('is_active', true)

    const result = await askCommercialAssistant({
      action,
      lead,
      input,
      formations: formations || [],
    })

    // Logger l'utilisation de l'IA
    await (service as any).from('activites').insert({
      type: 'SYSTEME',
      lead_id: lead_id || null,
      description: `Assistant IA — ${action}${lead ? ` pour ${lead.prenom}` : ''}`,
      metadata: { action, has_lead: !!lead_id },
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('Erreur API AI commercial:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
