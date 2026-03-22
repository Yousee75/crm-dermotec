// ============================================================
// CRM DERMOTEC — Générer un devis PDF + Stripe payment link
// Flux : Devis → Email → Paiement → Inscription auto
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TVA_TAUX = 0.20
const VALIDITE_JOURS = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, formation_nom, formation_prix_ht, formation_duree, financement_type, financement_montant, echeances, prospect } = body

    if (!lead_id || !formation_nom || !formation_prix_ht) {
      return NextResponse.json({ error: 'lead_id, formation_nom et formation_prix_ht requis' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Calculs financiers
    const montantHt = Math.round(formation_prix_ht)
    const montantTva = Math.round(montantHt * TVA_TAUX)
    const montantTtc = montantHt + montantTva
    const priseEnCharge = financement_montant || 0
    const resteACharge = Math.max(0, montantTtc - priseEnCharge)

    // Créer le devis en base
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + VALIDITE_JOURS)

    const { data: devis, error: dbError } = await supabase
      .from('devis')
      .insert({
        lead_id,
        formation_nom,
        formation_prix_ht: montantHt,
        tva_taux: TVA_TAUX * 100,
        montant_ht: montantHt,
        montant_tva: montantTva,
        montant_ttc: montantTtc,
        financement_type: financement_type || 'autofinancement',
        financement_montant: priseEnCharge,
        reste_a_charge: resteACharge,
        echeances: echeances || 1,
        statut: 'brouillon',
        validite_jours: VALIDITE_JOURS,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('[Devis] DB error:', dbError.message)
      return NextResponse.json({ error: 'Erreur création devis' }, { status: 500 })
    }

    // Créer un Stripe Payment Link si la clé est dispo
    let stripePaymentLink = null
    if (process.env.STRIPE_SECRET_KEY && resteACharge > 0) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

        // Créer un produit temporaire pour ce devis
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Formation ${formation_nom}`,
                description: `Devis N° ${devis.id.slice(0, 8).toUpperCase()}`,
              },
              unit_amount: resteACharge * 100, // Stripe en centimes
            },
            quantity: 1,
          }],
          success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'}/inscription/success?devis=${devis.id}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'}/inscription/cancel`,
          metadata: {
            devis_id: devis.id,
            lead_id,
            formation: formation_nom,
          },
        })

        stripePaymentLink = session.url

        // Update devis avec le lien Stripe
        await supabase
          .from('devis')
          .update({
            stripe_payment_link: stripePaymentLink,
            stripe_session_id: session.id,
          })
          .eq('id', devis.id)
      } catch (stripeErr) {
        console.warn('[Devis] Stripe error:', stripeErr)
        // Continue sans Stripe — le devis est quand même créé
      }
    }

    // Logger l'activité
    try {
      await supabase.from('activites').insert({
        lead_id,
        type: 'DEVIS',
        description: `Devis généré : ${formation_nom} — ${montantTtc}€ TTC`,
        metadata: { devis_id: devis.id, montant_ttc: montantTtc },
      })
    } catch { /* silent */ }

    console.log(`[Devis] Créé ${devis.id} pour lead ${lead_id} — ${formation_nom} ${montantTtc}€ TTC`)

    return NextResponse.json({
      devisId: devis.id,
      montantHt,
      montantTva,
      montantTtc,
      resteACharge,
      stripePaymentLink,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (err) {
    console.error('[Devis] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
