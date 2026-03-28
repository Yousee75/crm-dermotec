// ============================================================
// CRM DERMOTEC — Annulation facture avec avoir automatique
// Obligation comptable : une facture émise ne se supprime pas,
// on crée un avoir (document inverse) puis on annule l'original.
// Tout est tracé dans facture_audit_log (trigger DB auto).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const motif = body.motif || 'Annulation demandée'

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Charger la facture ──
    const { data: facture, error: loadErr } = await supabase
      .from('factures_formation')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (loadErr || !facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // ── Vérifications ──
    if (facture.statut === 'annulee') {
      return NextResponse.json({ error: 'Facture déjà annulée' }, { status: 400 })
    }

    if (facture.type === 'avoir') {
      return NextResponse.json({ error: 'Impossible d\'annuler un avoir' }, { status: 400 })
    }

    // ── Créer l'avoir (montants en négatif conceptuel, même montant avec type avoir) ──
    const { data: avoir, error: avoirErr } = await supabase
      .from('factures_formation')
      .insert({
        lead_id: facture.lead_id,
        financement_id: facture.financement_id,
        inscription_id: facture.inscription_id,
        session_id: facture.session_id,
        type: 'avoir',
        numero_facture: '', // Auto-généré par trigger → AVO-2026-XXXX
        destinataire_type: facture.destinataire_type,
        destinataire_nom: facture.destinataire_nom,
        destinataire_adresse: facture.destinataire_adresse,
        destinataire_siret: facture.destinataire_siret,
        destinataire_email: facture.destinataire_email,
        montant_ht: facture.montant_ht,
        taux_tva: facture.taux_tva,
        montant_tva: facture.montant_tva,
        montant_ttc: facture.montant_ttc,
        facture_origine_id: facture.id,
        statut: 'validee',
        date_emission: new Date().toISOString(),
        mentions: `Avoir sur facture ${facture.numero_facture} — Motif : ${motif}`,
        conditions_paiement: 'Remboursement sous 30 jours',
        notes: `Avoir automatique — Annulation facture ${facture.numero_facture}. Motif : ${motif}`,
        created_by: user.id,
      })
      .select()
      .single()

    if (avoirErr) {
      return NextResponse.json({ error: `Erreur création avoir: ${avoirErr.message}` }, { status: 500 })
    }

    // ── Annuler la facture d'origine ──
    const { error: annulErr } = await supabase
      .from('factures_formation')
      .update({
        statut: 'annulee',
        notes: `${facture.notes || ''}\n[ANNULÉE ${new Date().toLocaleDateString('fr-FR')}] Motif : ${motif}. Avoir : ${avoir.numero_facture}`.trim(),
      })
      .eq('id', id)

    if (annulErr) {
      return NextResponse.json({ error: `Erreur annulation: ${annulErr.message}` }, { status: 500 })
    }

    // ── Log audit explicite (le trigger DB log aussi, mais on ajoute le contexte) ──
    await supabase
      .from('facture_audit_log')
      .insert({
        facture_id: id,
        action: 'annulation',
        old_values: { statut: facture.statut, montant_ttc: facture.montant_ttc },
        new_values: { statut: 'annulee', avoir_id: avoir.id, avoir_numero: avoir.numero_facture },
        details: `Annulation + avoir ${avoir.numero_facture} créé. Motif : ${motif}`,
        user_id: user.id,
      })

    return NextResponse.json({
      success: true,
      facture_annulee: { id: facture.id, numero: facture.numero_facture },
      avoir_cree: { id: avoir.id, numero: avoir.numero_facture, montant_ttc: avoir.montant_ttc },
      motif,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
