import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase, createServerSupabase } from '@/lib/supabase-server'

// GET : messages d'un lead ou inbox
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    // Mode démo : skip auth
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    if (!isDemoMode) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const lead_id = searchParams.get('lead_id')
    const canal = searchParams.get('canal')
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '50')

    const service = await createServiceSupabase()

    if (lead_id) {
      // Messages d'un lead spécifique
      let query = service
        .from('messages')
        .select('*, user:equipe(prenom, nom)')
        .eq('lead_id', lead_id)
        .order('created_at', { ascending: true })

      if (canal) query = query.eq('canal', canal)

      const { data, error } = await query
      if (error) return NextResponse.json({ error: 'Erreur récupération' }, { status: 500 })
      return NextResponse.json({ messages: data })
    }

    // Inbox : derniers messages groupés par lead
    let data: unknown = null
    let error: unknown = null
    try {
      const result = await (service as any).rpc('get_inbox_conversations', {
        p_limit: per_page,
        p_offset: (page - 1) * per_page,
      })
      data = result.data
      error = result.error
    } catch {
      // Fallback si la RPC n'existe pas : query directe
      const result = await service
        .from('messages')
        .select('id, lead_id, canal, contenu, statut, created_at, lead:leads(prenom, nom, email, telephone, photo_url, statut)')
        .order('created_at', { ascending: false })
        .limit(per_page)
      data = result.data
      error = result.error
    }

    if (error) return NextResponse.json({ error: 'Erreur inbox' }, { status: 500 })
    return NextResponse.json({ messages: data })
  } catch (err) {
    console.error('Erreur API messages:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST : envoyer un message
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    // Mode démo : skip auth
    const isDemoMode2 = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    let user: { id: string; email?: string } | null = null
    if (!isDemoMode2) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
      user = authUser
    }

    const body = await req.json()
    const { lead_id, canal, contenu, sujet } = body

    if (!lead_id || !canal || !contenu) {
      return NextResponse.json({ error: 'lead_id, canal et contenu requis' }, { status: 400 })
    }

    if (!['email', 'whatsapp', 'sms', 'appel', 'note_interne'].includes(canal)) {
      return NextResponse.json({ error: 'Canal invalide' }, { status: 400 })
    }

    const service = await createServiceSupabase()

    // Récupérer le lead
    const { data: lead } = await (service as any)
      .from('leads')
      .select('email, telephone, whatsapp, prenom, nom')
      .eq('id', lead_id)
      .single()

    if (!lead) return NextResponse.json({ error: 'Lead non trouvé' }, { status: 404 })

    let statut = 'envoye'
    let external_id: string | null = null
    let erreur_detail: string | null = null
    const destinataire = canal === 'email' ? lead.email : (lead.whatsapp || lead.telephone)

    // Envoyer selon le canal
    if (canal === 'email' && lead.email) {
      try {
        const emailRes = await fetch(new URL('/api/email/send', req.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: lead.email, subject: sujet || 'Message de Dermotec', html: contenu }),
        })
        if (!emailRes.ok) statut = 'erreur'
      } catch {
        statut = 'erreur'
        erreur_detail = 'Échec envoi email'
      }
    } else if (canal === 'whatsapp' && (lead.whatsapp || lead.telephone)) {
      const { sendWhatsAppText, isWhatsAppConfigured } = await import('@/lib/whatsapp')
      if (isWhatsAppConfigured()) {
        const result = await sendWhatsAppText(lead.whatsapp || lead.telephone!, contenu)
        if (result.success) {
          external_id = result.messageId || null
        } else {
          statut = 'erreur'
          erreur_detail = result.error || null
        }
      } else {
        statut = 'brouillon'
        erreur_detail = 'WhatsApp non configuré'
      }
    } else if (canal === 'sms' && lead.telephone) {
      const { sendSMS, isSMSConfigured } = await import('@/lib/sms')
      if (isSMSConfigured()) {
        const result = await sendSMS(lead.telephone, contenu)
        if (result.success) {
          external_id = result.messageId || null
        } else {
          statut = 'erreur'
          erreur_detail = result.error || null
        }
      } else {
        statut = 'brouillon'
        erreur_detail = 'SMS non configuré'
      }
    } else if (canal === 'note_interne' || canal === 'appel') {
      statut = 'envoye' // Notes et appels sont juste enregistrés
    }

    // Récupérer user_id depuis equipe
    let equipeUser: { id: string } | null = null
    if (user?.id) {
      const { data } = await (service as any)
        .from('equipe')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      equipeUser = data
    }

    // Enregistrer le message
    const { data: message, error } = await (service as any)
      .from('messages')
      .insert({
        lead_id,
        direction: 'outbound',
        canal,
        sujet,
        contenu,
        de: 'Dermotec',
        a: destinataire,
        statut,
        external_id,
        erreur_detail,
        user_id: equipeUser?.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur insert message:', error)
      return NextResponse.json({ error: 'Erreur enregistrement' }, { status: 500 })
    }

    // Logger l'activité
    await (service as any).from('activites').insert({
      type: 'CONTACT',
      lead_id,
      user_id: equipeUser?.id,
      description: `${canal === 'note_interne' ? 'Note interne' : canal.toUpperCase() + ' envoyé'} — ${contenu.slice(0, 80)}...`,
      metadata: { message_id: message.id, canal },
    })

    // Mettre à jour le lead
    await (service as any)
      .from('leads')
      .update({
        date_dernier_contact: new Date().toISOString(),
        nb_contacts: (lead as Record<string, unknown>).nb_contacts
          ? ((lead as Record<string, unknown>).nb_contacts as number) + 1
          : 1,
      })
      .eq('id', lead_id)

    return NextResponse.json({ success: true, message })
  } catch (err) {
    console.error('Erreur API messages POST:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
