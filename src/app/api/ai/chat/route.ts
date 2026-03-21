import { NextRequest, NextResponse } from 'next/server'
import { chatWithAI } from '@/lib/ai-chatbot'
import { createServiceSupabase } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (auth.error) return auth.error

    const body = await req.json()
    const { messages, lead_id } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
    }

    if (messages.length > 50) {
      return NextResponse.json({ error: 'Conversation trop longue' }, { status: 400 })
    }

    const supabase = await createServiceSupabase()

    // Charger les formations pour le contexte
    const { data: formations } = await (supabase as any)
      .from('formations')
      .select('nom, prix_ht, duree_jours, duree_heures, categorie, prerequis, description_commerciale, objectifs, niveau')
      .eq('is_active', true)

    // Charger le contexte du lead si disponible
    let leadContext: { prenom?: string; statut_pro?: string; experience?: string } | undefined
    if (lead_id) {
      const { data: lead } = await (supabase as any)
        .from('leads')
        .select('prenom, statut_pro, experience_esthetique')
        .eq('id', lead_id)
        .single()
      if (lead) {
        leadContext = {
          prenom: lead.prenom,
          statut_pro: lead.statut_pro,
          experience: lead.experience_esthetique,
        }
      }
    }

    const result = await chatWithAI(messages, formations || [], leadContext)

    // Logger l'interaction si c'est un lead connu
    if (lead_id) {
      await (supabase as any).from('activites').insert({
        type: 'CONTACT',
        lead_id,
        description: `Chatbot IA — ${messages[messages.length - 1]?.content?.slice(0, 80)}...`,
        metadata: {
          canal: 'chatbot',
          suggested_action: result.suggestedAction,
        },
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Erreur API chat:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
