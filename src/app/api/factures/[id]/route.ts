// ============================================================
// CRM DERMOTEC — API Facture détail
// GET : détail | PATCH : modifier | DELETE : soft-delete
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getServiceClient() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── GET — Détail facture ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const supabase = await getServiceClient()

    const { data: facture, error } = await supabase
      .from('factures_formation')
      .select('*, leads!lead_id(id, nom, prenom, email, entreprise_nom, telephone, siret, adresse)')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Charger les paiements associés
    const { data: paiements } = await supabase
      .from('paiements_formation')
      .select('*')
      .eq('facture_id', id)
      .order('date_echeance', { ascending: true })

    return NextResponse.json({ facture, paiements: paiements || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}

// ── PATCH — Modifier facture ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const supabase = await getServiceClient()

    // Champs autorisés à modifier
    const allowedFields = [
      'statut', 'notes', 'mentions', 'conditions_paiement',
      'destinataire_nom', 'destinataire_adresse', 'destinataire_siret', 'destinataire_email',
      'montant_ht', 'taux_tva', 'montant_tva', 'montant_ttc',
      'montant_paye', 'date_echeance', 'date_paiement', 'pdf_url',
      'date_emission', 'date_envoi',
    ]
    const updates: Record<string, any> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 })
    }

    // Recalcul auto si montant_ht ou taux_tva changent
    if (updates.montant_ht !== undefined || updates.taux_tva !== undefined) {
      const { data: current } = await supabase
        .from('factures_formation')
        .select('montant_ht, taux_tva')
        .eq('id', id)
        .single()

      if (current) {
        const ht = updates.montant_ht ?? current.montant_ht
        const tva = updates.taux_tva ?? current.taux_tva
        updates.montant_tva = Math.round(ht * tva * 100) / 100
        updates.montant_ttc = Math.round((ht + updates.montant_tva) * 100) / 100
      }
    }

    // Si passage à "envoyee", marquer la date d'envoi
    if (updates.statut === 'envoyee' && !updates.date_envoi) {
      updates.date_envoi = new Date().toISOString()
    }
    // Si passage à "payee", marquer la date de paiement
    if (updates.statut === 'payee' && !updates.date_paiement) {
      updates.date_paiement = new Date().toISOString()
    }

    const { data: facture, error } = await supabase
      .from('factures_formation')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ facture })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}

// ── DELETE — Soft-delete facture ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const supabase = await getServiceClient()

    // Vérifier que la facture n'est pas payée
    const { data: facture } = await supabase
      .from('factures_formation')
      .select('statut')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    if (facture.statut === 'payee') {
      return NextResponse.json({ error: 'Impossible de supprimer une facture payée' }, { status: 400 })
    }

    const { error } = await supabase
      .from('factures_formation')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
