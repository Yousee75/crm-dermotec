// ============================================================
// CRM DERMOTEC — API Factures CRUD
// GET : liste avec filtres | POST : créer une facture
// Table : factures_formation (migration 020)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// ── GET — Liste factures avec filtres ──
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
    const search = url.searchParams.get('search')
    const type = url.searchParams.get('type')
    const date_from = url.searchParams.get('date_from')
    const date_to = url.searchParams.get('date_to')
    const page = parseInt(url.searchParams.get('page') || '1')
    const per_page = parseInt(url.searchParams.get('per_page') || '20')
    const sort_by = url.searchParams.get('sort_by') || 'created_at'
    const sort_order = url.searchParams.get('sort_order') || 'desc'

    let query = supabase
      .from('factures_formation')
      .select('*, leads!lead_id(id, nom, prenom, email, entreprise_nom, telephone)', { count: 'exact' })
      .is('deleted_at', null)

    // Filtres
    if (statut) query = query.eq('statut', statut)
    if (type) query = query.eq('type', type)
    if (date_from) query = query.gte('date_emission', date_from)
    if (date_to) query = query.lte('date_emission', date_to)
    if (search) {
      query = query.or(`numero_facture.ilike.%${search}%,destinataire_nom.ilike.%${search}%`)
    }

    // Tri et pagination
    const ascending = sort_order === 'asc'
    query = query
      .order(sort_by, { ascending })
      .range((page - 1) * per_page, page * per_page - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Stats agrégées
    const { data: statsData } = await supabase
      .from('factures_formation')
      .select('statut, montant_ttc, montant_paye')
      .is('deleted_at', null)

    const stats = {
      total: statsData?.length || 0,
      ca_total: statsData?.filter(f => f.statut === 'payee').reduce((s, f) => s + (f.montant_ttc || 0), 0) || 0,
      en_attente: statsData?.filter(f => ['envoyee', 'emise', 'validee'].includes(f.statut)).reduce((s, f) => s + ((f.montant_ttc || 0) - (f.montant_paye || 0)), 0) || 0,
      en_retard: statsData?.filter(f => ['en_retard', 'impayee'].includes(f.statut)).length || 0,
      montant_en_retard: statsData?.filter(f => ['en_retard', 'impayee'].includes(f.statut)).reduce((s, f) => s + ((f.montant_ttc || 0) - (f.montant_paye || 0)), 0) || 0,
    }

    return NextResponse.json({
      factures: data || [],
      stats,
      pagination: {
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page),
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}

// ── POST — Créer une facture ──
export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const {
      lead_id,
      financement_id,
      inscription_id,
      session_id,
      type = 'facture',
      destinataire_type,
      destinataire_nom,
      destinataire_adresse,
      destinataire_siret,
      destinataire_email,
      montant_ht,
      taux_tva = 0,
      mentions,
      conditions_paiement = 'Paiement à 30 jours',
      notes,
    } = body

    // Validation
    if (!destinataire_nom || !montant_ht || !destinataire_type) {
      return NextResponse.json(
        { error: 'destinataire_nom, destinataire_type et montant_ht sont requis' },
        { status: 400 }
      )
    }

    if (!['facture', 'avoir', 'acompte', 'proforma'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    if (!['organisme_financeur', 'stagiaire', 'entreprise'].includes(destinataire_type)) {
      return NextResponse.json({ error: 'destinataire_type invalide' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Calcul montants
    const montant_tva = Math.round(montant_ht * taux_tva * 100) / 100
    const montant_ttc = Math.round((montant_ht + montant_tva) * 100) / 100

    // Date échéance : 30 jours par défaut
    const date_emission = new Date().toISOString()
    const date_echeance = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: facture, error } = await supabase
      .from('factures_formation')
      .insert({
        lead_id,
        financement_id,
        inscription_id,
        session_id,
        type,
        numero_facture: '', // Auto-généré par trigger
        destinataire_type,
        destinataire_nom,
        destinataire_adresse,
        destinataire_siret,
        destinataire_email,
        montant_ht,
        taux_tva,
        montant_tva,
        montant_ttc,
        statut: 'brouillon',
        date_emission,
        date_echeance,
        mentions: mentions || (taux_tva === 0 ? 'Exonération de TVA - Art. 261-4-4° du CGI' : null),
        conditions_paiement,
        notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ facture }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
