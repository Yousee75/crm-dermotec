// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceSupabase } from '@/lib/supabase-server'

// ============================================================
// API RGPD — Droit à l'oubli / Anonymisation (Art. 17)
// Soft delete : anonymise les données personnelles
// Conserve les données agrégées pour le reporting
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

export async function POST(request: NextRequest) {
  // 1. Auth
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  const body = await request.json()
  const { lead_id, reason } = body

  if (!lead_id) {
    return NextResponse.json({ error: 'lead_id requis' }, { status: 400 })
  }

  // 2. Vérifier le rôle (admin uniquement)
  const supabase = await createServiceSupabase()

  const { data: equipe } = await supabase
    .from('equipe')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!equipe || equipe.role !== 'admin') {
    return NextResponse.json({ error: 'Seul un admin peut supprimer des données' }, { status: 403 })
  }

  // 3. Vérifier que le lead existe
  const { data: lead } = await supabase
    .from('leads')
    .select('id, prenom, email')
    .eq('id', lead_id)
    .single()

  if (!lead) {
    return NextResponse.json({ error: 'Lead non trouvé' }, { status: 404 })
  }

  // 4. Anonymiser les données personnelles
  const anonymizedEmail = `anonyme-${lead_id}@purged.local`

  await supabase
    .from('leads')
    .update({
      prenom: 'ANONYME',
      nom: 'ANONYME',
      email: anonymizedEmail,
      telephone: '',
      message: '',
      ip_address: '',
      user_agent: '',
      entreprise_nom: '',
      entreprise_siret: '',
      adresse: null,
      metadata: {},
      notes: '',
      statut: 'SPAM', // Marquer comme supprimé
    })
    .eq('id', lead_id)

  // 5. Anonymiser les notes
  await supabase
    .from('notes_lead')
    .update({ contenu: '[CONTENU SUPPRIMÉ - RGPD]' })
    .eq('lead_id', lead_id)

  // 6. Supprimer les documents du storage
  const { data: documents } = await supabase
    .from('documents')
    .select('id, storage_path')
    .eq('lead_id', lead_id)

  if (documents?.length) {
    const paths = documents
      .map(d => d.storage_path)
      .filter(Boolean) as string[]

    if (paths.length) {
      await supabase.storage
        .from('documents')
        .remove(paths)
    }
  }

  // 7. Logger l'anonymisation
  await supabase.from('activites').insert({
    type: 'SYSTEME',
    lead_id,
    user_id: user.id,
    description: `Anonymisation RGPD effectuée par ${user.email}`,
    metadata: {
      action: 'gdpr_delete',
      reason: reason || 'Demande de suppression',
      original_email_hash: Buffer.from(lead.email || '').toString('base64').slice(0, 10) + '...',
    },
  })

  // 8. Logger le consentement de suppression
  await supabase.from('consent_logs').insert({
    lead_id,
    user_id: user.id,
    consent_type: 'deletion_request',
    consent_given: true,
    consent_version: '1.0',
    method: 'api',
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
  })

  return NextResponse.json({
    success: true,
    message: 'Données anonymisées avec succès (RGPD Art. 17)',
    lead_id,
    anonymized_fields: ['prenom', 'nom', 'email', 'telephone', 'message', 'ip_address', 'user_agent', 'entreprise_nom', 'entreprise_siret', 'adresse', 'notes'],
  })
}
