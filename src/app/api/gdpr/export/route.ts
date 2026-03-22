// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceSupabase } from '@/lib/supabase-server'

// ============================================================
// API RGPD — Export données personnelles (Art. 15 & 20)
// Auth obligatoire + rate limited
// ============================================================

export const dynamic = 'force-dynamic'

async function getAuthUser(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll() {},
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(request: NextRequest) {
  // 1. Auth
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get('lead_id')

  if (!leadId) {
    return NextResponse.json({ error: 'lead_id requis' }, { status: 400 })
  }

  // 2. Vérifier le rôle (admin/manager uniquement)
  const supabase = await createServiceSupabase()

  const { data: equipe } = await supabase
    .from('equipe')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!equipe || !['admin', 'manager'].includes(equipe.role)) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  // 3. Collecter toutes les données du lead
  const [lead, inscriptions, financements, activites, notes, documents, emails, consents] = await Promise.all([
    supabase.from('leads').select('*').eq('id', leadId).single(),
    supabase.from('inscriptions').select('*').eq('lead_id', leadId),
    supabase.from('financements').select('*').eq('lead_id', leadId),
    supabase.from('activites').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
    supabase.from('notes_lead').select('*').eq('lead_id', leadId),
    supabase.from('documents').select('id, type, nom_fichier, mime_type, created_at').eq('lead_id', leadId),
    supabase.from('emails_sent').select('*').eq('lead_id', leadId),
    supabase.from('consent_logs').select('*').eq('lead_id', leadId),
  ])

  if (!lead.data) {
    return NextResponse.json({ error: 'Lead non trouvé' }, { status: 404 })
  }

  // 4. Logger l'export RGPD
  await supabase.from('activites').insert({
    type: 'SYSTEME',
    lead_id: leadId,
    user_id: user.id,
    description: `Export RGPD effectué par ${user.email}`,
    metadata: { action: 'gdpr_export' },
  })

  // 5. Retourner les données structurées
  return NextResponse.json({
    export_date: new Date().toISOString(),
    export_by: user.email,
    rgpd_article: 'Article 15 & 20 du RGPD',
    lead: lead.data,
    inscriptions: inscriptions.data || [],
    financements: financements.data || [],
    activites: activites.data || [],
    notes: notes.data || [],
    documents: documents.data || [],
    emails_envoyes: emails.data || [],
    consentements: consents.data || [],
  }, {
    headers: {
      'Content-Disposition': `attachment; filename="export-rgpd-${leadId}.json"`,
    },
  })
}
