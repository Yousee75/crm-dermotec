// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { createServiceSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const InviteSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase().trim(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
})

async function getAuthUser(request: NextRequest) {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll() {},
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// POST — Envoyer une invitation
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const parsed = InviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = await createServiceSupabase()

    // Récupérer l'org de l'utilisateur
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Seuls les admins peuvent inviter' }, { status: 403 })
    }

    // Vérifier que l'email n'est pas déjà membre
    const { data: existingMember } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', membership.org_id)
      .eq('user_id', (
        await supabase.from('auth.users').select('id').eq('email', parsed.data.email).single()
      ).data?.id || '00000000-0000-0000-0000-000000000000')
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'Cet utilisateur est déjà membre' }, { status: 409 })
    }

    // Vérifier qu'il n'y a pas déjà une invitation en attente
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('org_id', membership.org_id)
      .eq('email', parsed.data.email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingInvite) {
      return NextResponse.json({ error: 'Invitation déjà envoyée à cet email' }, { status: 409 })
    }

    // Créer l'invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        org_id: membership.org_id,
        email: parsed.data.email,
        role: parsed.data.role,
        invited_by: user.id,
      })
      .select('id, token, email, role, expires_at')
      .single()

    if (error) throw error

    // Envoyer l'email d'invitation via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm.dermotec.fr'
    const joinUrl = `${appUrl}/join/${invitation.token}`

    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Dermotec CRM <noreply@dermotec.fr>',
        to: parsed.data.email,
        subject: 'Vous êtes invité(e) sur Dermotec CRM',
        html: `
          <div style="font-family:'DM Sans',Arial,sans-serif;max-width:500px;margin:0 auto;">
            <div style="background:#082545;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:#2EC6F3;margin:0;font-size:24px;">Dermotec CRM</h1>
            </div>
            <div style="padding:32px;background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
              <h2 style="color:#082545;margin:0 0 16px;">Vous êtes invité(e) !</h2>
              <p style="color:#64748b;line-height:1.6;">
                Vous avez été invité(e) à rejoindre le CRM Dermotec en tant que <strong>${parsed.data.role === 'admin' ? 'Administrateur' : parsed.data.role === 'viewer' ? 'Lecteur' : 'Membre'}</strong>.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${joinUrl}" style="background:#2EC6F3;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block;">
                  Accepter l'invitation
                </a>
              </div>
              <p style="color:#94a3b8;font-size:13px;">Ce lien expire dans 7 jours.</p>
            </div>
          </div>
        `,
      })
    } catch {
      // Si l'email échoue, l'invitation est quand même créée
      console.warn('[Invitations] Email sending failed')
    }

    return NextResponse.json({
      success: true,
      invitation: { id: invitation.id, email: invitation.email, role: invitation.role },
      join_url: joinUrl,
    })

  } catch (err) {
    console.error('[Invitations] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET — Lister les invitations de mon org
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const supabase = await createServiceSupabase()

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ invitations: [] })

    const { data: invitations } = await supabase
      .from('invitations')
      .select('id, email, role, token, accepted_at, expires_at, created_at')
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ invitations: invitations || [] })

  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
