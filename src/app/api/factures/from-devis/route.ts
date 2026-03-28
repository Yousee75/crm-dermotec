// ============================================================
// CRM DERMOTEC — Conversion Devis → Facture
// Copie les données du devis signé dans factures_formation
// Le numéro facture est auto-généré par trigger DB
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { devis_id } = body

    if (!devis_id) {
      return NextResponse.json({ error: 'devis_id requis' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Charger le devis ──
    const { data: devis, error: devisErr } = await supabase
      .from('devis')
      .select('*')
      .eq('id', devis_id)
      .single()

    if (devisErr || !devis) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Vérifier que le devis n'est pas déjà converti
    if (devis.statut === 'paye') {
      // Vérifier si une facture existe déjà pour ce devis
      const { data: existing } = await supabase
        .from('factures_formation')
        .select('id, numero_facture')
        .eq('lead_id', devis.lead_id)
        .eq('montant_ttc', devis.montant_ttc)
        .is('deleted_at', null)
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'Une facture existe déjà pour ce devis', facture_id: existing[0].id },
          { status: 409 }
        )
      }
    }

    // ── Charger le lead pour destinataire ──
    const { data: lead } = await supabase
      .from('leads')
      .select('id, nom, prenom, email, entreprise_nom, siret, adresse, telephone')
      .eq('id', devis.lead_id)
      .single()

    if (!lead) {
      return NextResponse.json({ error: 'Lead non trouvé' }, { status: 404 })
    }

    // ── Déterminer destinataire ──
    // Si financement OPCO/CPF → facture à l'organisme, sinon au stagiaire/entreprise
    const hasFinancement = devis.financement_type && devis.financement_montant > 0
    const destinataire_type = hasFinancement ? 'organisme_financeur' : (lead.entreprise_nom ? 'entreprise' : 'stagiaire')
    const destinataire_nom = hasFinancement
      ? (devis.financement_type || 'Organisme financeur')
      : (lead.entreprise_nom || `${lead.prenom || ''} ${lead.nom || ''}`.trim())

    // ── Créer la facture ──
    const montant_ht = devis.montant_ht || 0
    const taux_tva = devis.tva_taux || 0
    const montant_tva = Math.round(montant_ht * taux_tva * 100) / 100
    const montant_ttc = devis.montant_ttc || Math.round((montant_ht + montant_tva) * 100) / 100

    const { data: facture, error: factureErr } = await supabase
      .from('factures_formation')
      .insert({
        lead_id: devis.lead_id,
        inscription_id: devis.inscription_id || null,
        type: 'facture',
        numero_facture: '', // Auto-généré par trigger
        destinataire_type,
        destinataire_nom,
        destinataire_adresse: lead.adresse || null,
        destinataire_siret: lead.siret || null,
        destinataire_email: lead.email || null,
        montant_ht,
        taux_tva,
        montant_tva,
        montant_ttc,
        statut: 'validee',
        date_emission: new Date().toISOString(),
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        mentions: taux_tva === 0 ? 'Exonération de TVA - Art. 261-4-4° du CGI' : null,
        conditions_paiement: 'Paiement à 30 jours',
        notes: `Convertie depuis devis ${devis.id.slice(0, 8).toUpperCase()} — ${devis.formation_nom || ''}`,
        created_by: user.id,
      })
      .select()
      .single()

    if (factureErr) {
      return NextResponse.json({ error: factureErr.message }, { status: 500 })
    }

    // ── Mettre à jour le statut du devis ──
    await supabase
      .from('devis')
      .update({ statut: 'signe' })
      .eq('id', devis_id)

    return NextResponse.json({ facture, devis_id }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
