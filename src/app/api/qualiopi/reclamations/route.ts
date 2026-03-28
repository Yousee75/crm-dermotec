// ============================================================
// CRM DERMOTEC — API Réclamations Qualiopi
// GET : liste | POST : créer — Table qualite (type=reclamation)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// ── GET — Liste réclamations ──
export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const url = request.nextUrl
    const statut = url.searchParams.get('statut')
    const type = url.searchParams.get('type') // reclamation, action_corrective, amelioration, non_conformite
    const priorite = url.searchParams.get('priorite')

    let query = supabase
      .from('qualite')
      .select('*, leads!lead_id(nom, prenom), sessions!session_id(nom), equipe!responsable_id(prenom, nom)')
      .order('created_at', { ascending: false })

    if (statut) query = query.eq('statut', statut)
    if (type) query = query.eq('type', type)
    if (priorite) query = query.eq('priorite', priorite)

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Stats
    const all = data || []
    const stats = {
      total: all.length,
      ouvertes: all.filter(r => r.statut === 'OUVERTE').length,
      en_cours: all.filter(r => r.statut === 'EN_COURS').length,
      resolues: all.filter(r => r.statut === 'RESOLUE').length,
      taux_resolution: all.length > 0
        ? Math.round(all.filter(r => ['RESOLUE', 'CLOTUREE'].includes(r.statut)).length / all.length * 100)
        : 0,
      par_type: {
        reclamation: all.filter(r => r.type === 'reclamation').length,
        action_corrective: all.filter(r => r.type === 'action_corrective').length,
        amelioration: all.filter(r => r.type === 'amelioration').length,
        non_conformite: all.filter(r => r.type === 'non_conformite').length,
      }
    }

    return NextResponse.json({ items: data || [], stats })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}

// ── POST — Créer réclamation/action ──
export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { type, titre, description, priorite, indicateur_qualiopi, critere_qualiopi, lead_id, session_id, responsable_id } = body

    if (!type || !titre || !description) {
      return NextResponse.json({ error: 'type, titre et description requis' }, { status: 400 })
    }

    if (!['reclamation', 'action_corrective', 'amelioration', 'non_conformite'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('qualite')
      .insert({
        type,
        titre,
        description,
        statut: 'OUVERTE',
        priorite: priorite || 'NORMALE',
        indicateur_qualiopi,
        critere_qualiopi,
        lead_id,
        session_id,
        responsable_id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ item: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
