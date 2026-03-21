import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceSupabase } from '@/lib/supabase-server'
import { createCheckoutSession } from '@/lib/stripe'
import type { Lead, Inscription } from '@/types'

const inscriptionExpressSchema = z.object({
  prenom: z.string().min(2),
  nom: z.string().min(2),
  email: z.string().email(),
  telephone: z.string().min(10),
  formation_id: z.string().uuid(),
  session_id: z.string().uuid(),
  payment_mode: z.enum(['immediate', '3x', '4x']),
  convention_accepted: z.boolean().refine(val => val, 'Convention obligatoire'),
  reglement_accepted: z.boolean().refine(val => val, 'Règlement obligatoire'),
  rgpd_accepted: z.boolean().refine(val => val, 'RGPD obligatoire'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation des données
    const validatedData = inscriptionExpressSchema.parse(body)

    const supabase = createServiceSupabase()

    // 1. Récupérer formation et session
    const { data: formation, error: formationError } = await supabase
      .from('formations')
      .select('*')
      .eq('id', validatedData.formation_id)
      .eq('is_active', true)
      .single()

    if (formationError || !formation) {
      return NextResponse.json(
        { error: 'Formation non trouvée ou inactive' },
        { status: 404 }
      )
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', validatedData.session_id)
      .eq('statut', 'CONFIRMEE')
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session non trouvée ou non confirmée' },
        { status: 404 }
      )
    }

    // Vérifier places disponibles
    if (session.places_occupees >= session.places_max) {
      return NextResponse.json(
        { error: 'Session complète — Plus de places disponibles' },
        { status: 400 }
      )
    }

    // 2. Créer ou trouver le lead
    let leadId: string

    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (existingLead) {
      leadId = existingLead.id

      // Mettre à jour le lead existant
      await supabase
        .from('leads')
        .update({
          prenom: validatedData.prenom,
          nom: validatedData.nom,
          telephone: validatedData.telephone,
          statut: 'INSCRIT',
          formation_principale_id: validatedData.formation_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
    } else {
      // Créer nouveau lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          prenom: validatedData.prenom,
          nom: validatedData.nom,
          email: validatedData.email,
          telephone: validatedData.telephone,
          source: 'formulaire' as const,
          sujet: 'formation' as const,
          statut: 'INSCRIT' as const,
          priorite: 'HAUTE' as const,
          score_chaud: 90,
          formation_principale_id: validatedData.formation_id,
          formations_interessees: [validatedData.formation_id],
          financement_souhaite: false,
          nb_contacts: 0,
          tags: ['inscription_express'],
          ip_address: request.ip || request.headers.get('x-forwarded-for'),
          user_agent: request.headers.get('user-agent'),
          data_sources: {
            inscription_express: true,
            payment_mode: validatedData.payment_mode,
            timestamp: new Date().toISOString(),
          },
          metadata: {},
        })
        .select()
        .single()

      if (leadError || !newLead) {
        console.error('Erreur création lead:', leadError)
        return NextResponse.json(
          { error: 'Erreur lors de la création du profil' },
          { status: 500 }
        )
      }

      leadId = newLead.id
    }

    // 3. Calculer montants
    const montantTotalHT = formation.prix_ht
    const montantTTC = montantTotalHT * (1 + formation.tva_rate / 100)
    const montantFinal = Math.round(montantTTC * 100) / 100

    // 4. Créer l'inscription
    const { data: inscription, error: inscriptionError } = await supabase
      .from('inscriptions')
      .insert({
        lead_id: leadId,
        session_id: validatedData.session_id,
        montant_total: montantFinal,
        montant_finance: 0,
        reste_a_charge: montantFinal,
        mode_paiement: 'carte' as const,
        paiement_statut: 'EN_ATTENTE' as const,
        statut: 'EN_ATTENTE' as const,
        convention_generee: true,
        convention_signee: true, // Convention acceptée via checkbox
        certificat_genere: false,
        notes: `Inscription express - Mode: ${validatedData.payment_mode}`,
      })
      .select()
      .single()

    if (inscriptionError || !inscription) {
      console.error('Erreur création inscription:', inscriptionError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'inscription' },
        { status: 500 }
      )
    }

    // 5. Mettre à jour le compteur de places
    await supabase
      .from('sessions')
      .update({
        places_occupees: session.places_occupees + 1,
      })
      .eq('id', validatedData.session_id)

    // 6. Logger l'activité
    await supabase
      .from('activites')
      .insert({
        type: 'INSCRIPTION' as const,
        lead_id: leadId,
        session_id: validatedData.session_id,
        inscription_id: inscription.id,
        description: `Inscription express à ${formation.nom}`,
        metadata: {
          payment_mode: validatedData.payment_mode,
          montant: montantFinal,
          convention_accepted: true,
          rgpd_accepted: true,
          ip_address: request.ip || request.headers.get('x-forwarded-for'),
          user_agent: request.headers.get('user-agent'),
        },
      })

    // 7. Créer la session Stripe Checkout
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const stripeSession = await createCheckoutSession({
      leadEmail: validatedData.email,
      leadNom: `${validatedData.prenom} ${validatedData.nom}`,
      formationNom: formation.nom,
      montant: montantFinal,
      inscriptionId: inscription.id,
      successUrl: `${baseUrl}/inscription/success?inscription_id=${inscription.id}`,
      cancelUrl: `${baseUrl}/inscription-express/${validatedData.formation_id}?error=payment_cancelled`,
    })

    // 8. Mettre à jour l'inscription avec l'ID Stripe
    await supabase
      .from('inscriptions')
      .update({
        stripe_payment_id: stripeSession.id,
      })
      .eq('id', inscription.id)

    return NextResponse.json({
      success: true,
      checkout_url: stripeSession.url,
      inscription_id: inscription.id,
    })

  } catch (error) {
    console.error('Erreur inscription express:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}