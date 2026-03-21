import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
    }

    const supabase = await createServiceSupabase()

    // Récupérer l'inscription via le token portail
    const { data: inscription, error: inscError } = await (supabase as any)
      .from('inscriptions')
      .select(`
        *,
        lead:leads(id, prenom, nom, email, telephone, photo_url),
        session:sessions(
          *,
          formation:formations(*),
          formatrice:equipe(prenom, nom, email)
        )
      `)
      .eq('portail_token', token)
      .single()

    if (inscError || !inscription) {
      return NextResponse.json({ error: 'Portail non trouvé' }, { status: 404 })
    }

    // Récupérer les émargements
    const { data: emargements } = await (supabase as any)
      .from('emargements')
      .select('*')
      .eq('inscription_id', inscription.id)
      .order('date', { ascending: true })

    // Récupérer les documents liés (requêtes séparées pour éviter injection)
    const [docsByInsc, docsByLead] = await Promise.all([
      (supabase as any).from('documents').select('*').eq('inscription_id', inscription.id),
      (supabase as any).from('documents').select('*').eq('lead_id', inscription.lead_id),
    ])
    const documents = [...(docsByInsc.data || []), ...(docsByLead.data || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Récupérer les factures liées
    const { data: factures } = await (supabase as any)
      .from('factures')
      .select('*')
      .eq('inscription_id', inscription.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      inscription,
      lead: inscription.lead,
      session: inscription.session,
      formation: inscription.session?.formation,
      emargements: emargements || [],
      documents: documents || [],
      factures: factures || [],
    })
  } catch (err) {
    console.error('Erreur API portail:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
