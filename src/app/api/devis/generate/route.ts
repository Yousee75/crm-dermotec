// ============================================================
// CRM DERMOTEC — Generer un devis PDF + Stripe payment link
// Flux : Devis -> PDF -> Storage -> Email -> Paiement -> Inscription
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { DevisPDF, EMETTEUR_DERMOTEC, type DevisProps } from '@/lib/pdf/devis'
import { FORMATIONS_SEED } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const TVA_TAUX = 0.20
const VALIDITE_JOURS = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      lead_id,
      formation_id,
      formation_nom,
      formation_prix_ht,
      session_id,
      financement_type,
      financement_montant,
      echeances,
    } = body

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id requis' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Charger le lead ──
    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .select('id, nom, prenom, email, telephone, entreprise_nom, siret, adresse')
      .eq('id', lead_id)
      .single()

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead non trouve' }, { status: 404 })
    }

    // ── Determiner la formation ──
    let formationNom = formation_nom || ''
    let formationPrixHt = formation_prix_ht || 0
    let formationDureeJours = 1
    let formationDureeHeures = 7
    let formationDescription = ''

    if (formation_id) {
      // Chercher dans la BDD d'abord
      const { data: formationDb } = await supabase
        .from('formations')
        .select('nom, prix_ht, duree_jours, duree_heures, description_courte')
        .eq('id', formation_id)
        .single()

      if (formationDb) {
        formationNom = formationDb.nom
        formationPrixHt = formationDb.prix_ht
        formationDureeJours = formationDb.duree_jours || 1
        formationDureeHeures = formationDb.duree_heures || 7
        formationDescription = formationDb.description_courte || ''
      }
    }

    // Fallback sur FORMATIONS_SEED si pas de prix
    if (!formationPrixHt && formationNom) {
      const seed = FORMATIONS_SEED.find(f =>
        f.nom.toLowerCase() === formationNom.toLowerCase() ||
        f.slug === formationNom.toLowerCase().replace(/\s+/g, '-')
      )
      if (seed) {
        formationNom = seed.nom
        formationPrixHt = seed.prix_ht
        formationDureeJours = seed.duree_jours
        formationDureeHeures = seed.duree_heures
      }
    }

    if (!formationNom || !formationPrixHt) {
      return NextResponse.json({ error: 'Formation non trouvee ou prix manquant' }, { status: 400 })
    }

    // ── Charger la session (optionnel) ──
    let sessionData: DevisProps['session'] | undefined
    if (session_id) {
      const { data: sessionDb } = await supabase
        .from('sessions')
        .select('date_debut, date_fin, salle, adresse, formatrice:equipe!formatrice_id(prenom, nom)')
        .eq('id', session_id)
        .single()

      if (sessionDb) {
        const formatrice = sessionDb.formatrice as any
        sessionData = {
          dateDebut: sessionDb.date_debut,
          dateFin: sessionDb.date_fin,
          lieu: sessionDb.adresse || sessionDb.salle || '75 Bd Richard Lenoir, 75011 Paris',
          formatrice: formatrice ? `${formatrice.prenom} ${formatrice.nom}` : undefined,
        }
      }
    }

    // ── Calculs financiers ──
    const montantHt = Math.round(formationPrixHt)
    const montantTva = Math.round(montantHt * TVA_TAUX)
    const montantTtc = montantHt + montantTva
    const priseEnCharge = financement_montant || 0
    const resteACharge = Math.max(0, montantTtc - priseEnCharge)

    // ── Creer le devis en base ──
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + VALIDITE_JOURS)

    const { data: devis, error: dbError } = await supabase
      .from('devis')
      .insert({
        lead_id,
        formation_nom: formationNom,
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
      return NextResponse.json({ error: 'Erreur creation devis' }, { status: 500 })
    }

    // ── Generer le numero de devis lisible ──
    const devisNumber = `DVS-${new Date().getFullYear()}-${devis.id.slice(0, 6).toUpperCase()}`

    // ── Generer le PDF ──
    let pdfUrl: string | null = null
    try {
      const adresseStr = lead.adresse
        ? [lead.adresse.rue, lead.adresse.code_postal, lead.adresse.ville].filter(Boolean).join(', ')
        : undefined

      const devisProps: DevisProps = {
        devisId: devisNumber,
        date: new Date().toISOString(),
        validiteJours: VALIDITE_JOURS,
        emetteur: EMETTEUR_DERMOTEC,
        prospect: {
          nom: lead.nom || '',
          prenom: lead.prenom || undefined,
          entreprise: lead.entreprise_nom || undefined,
          adresse: adresseStr,
          siret: lead.siret || undefined,
          email: lead.email || undefined,
          telephone: lead.telephone || undefined,
        },
        formation: {
          nom: formationNom,
          dureeJours: formationDureeJours,
          dureeHeures: formationDureeHeures,
          prixHt: montantHt,
          description: formationDescription || undefined,
        },
        session: sessionData,
        financement: financement_type && priseEnCharge > 0
          ? { type: financement_type, montant: priseEnCharge }
          : undefined,
        echeances: echeances || undefined,
      }

      const pdfBuffer = await renderToBuffer(
        React.createElement(DevisPDF, devisProps)
      )

      // Upload dans Supabase Storage
      const filename = `devis/${devisNumber.replace(/\s/g, '_')}_${lead.nom || 'prospect'}.pdf`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filename, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filename)
        pdfUrl = urlData?.publicUrl || null

        // Mettre a jour le devis avec l'URL du PDF
        await supabase
          .from('devis')
          .update({ pdf_url: pdfUrl })
          .eq('id', devis.id)
      } else {
        console.warn('[Devis] Upload error:', uploadError.message)
      }
    } catch (pdfErr) {
      console.warn('[Devis] PDF generation error:', pdfErr)
      // Continue sans PDF — le devis est quand meme cree en base
    }

    // ── Stripe Payment Link (optionnel) ──
    let stripePaymentLink: string | null = null
    if (process.env.STRIPE_SECRET_KEY && resteACharge > 0) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Formation ${formationNom}`,
                description: `Devis N\u00B0 ${devisNumber}`,
              },
              unit_amount: resteACharge * 100,
            },
            quantity: 1,
          }],
          success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'}/inscription/success?devis=${devis.id}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'}/inscription/cancel`,
          metadata: {
            devis_id: devis.id,
            lead_id,
            formation: formationNom,
          },
        })

        stripePaymentLink = session.url

        await supabase
          .from('devis')
          .update({
            stripe_payment_link: stripePaymentLink,
            stripe_session_id: session.id,
          })
          .eq('id', devis.id)
      } catch (stripeErr) {
        console.warn('[Devis] Stripe error:', stripeErr)
      }
    }

    // ── Logger l'activite ──
    try {
      await supabase.from('activites').insert({
        lead_id,
        type: 'DEVIS',
        description: `Devis ${devisNumber} genere : ${formationNom} — ${montantTtc}\u20AC TTC`,
        metadata: { devis_id: devis.id, devis_number: devisNumber, montant_ttc: montantTtc, pdf_url: pdfUrl },
      })
    } catch { /* silent */ }

    console.log(`[Devis] Cree ${devisNumber} pour lead ${lead_id} — ${formationNom} ${montantTtc}\u20AC TTC`)

    return NextResponse.json({
      devisId: devis.id,
      devisNumber,
      montantHt,
      montantTva,
      montantTtc,
      resteACharge,
      pdfUrl,
      stripePaymentLink,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (err) {
    console.error('[Devis] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
