import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Token requis' }, { status: 400 })

    // Vérifier l'auth
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Connexion requise' }, { status: 401 })

    const supabase = await createServiceSupabase()

    // Récupérer l'invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('id, org_id, email, role, expires_at, accepted_at')
      .eq('token', token)
      .single()

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })
    }

    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation déjà utilisée' }, { status: 410 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expirée' }, { status: 410 })
    }

    // Vérifier que l'utilisateur n'est pas déjà membre
    const { data: existing } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', invitation.org_id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Vous êtes déjà membre de cette organisation' }, { status: 409 })
    }

    // Créer le membre + marquer l'invitation comme acceptée
    const { error: memberError } = await supabase
      .from('org_members')
      .insert({
        org_id: invitation.org_id,
        user_id: user.id,
        role: invitation.role === 'admin' ? 'admin' : invitation.role === 'viewer' ? 'viewer' : 'member',
        invited_by: user.id,
      })

    if (memberError) {
      console.error('[Invitations] Member insert error:', memberError)
      return NextResponse.json({ error: 'Erreur lors de l\'ajout' }, { status: 500 })
    }

    // Marquer comme acceptée
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    // Logger l'activité
    await supabase.from('activites').insert({
      type: 'SYSTEME',
      description: `Invitation acceptée par ${user.email} (rôle: ${invitation.role})`,
      metadata: { invitation_id: invitation.id, org_id: invitation.org_id },
    })

    return NextResponse.json({ success: true, org_id: invitation.org_id })

  } catch (err) {
    console.error('[Invitations/Accept] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
