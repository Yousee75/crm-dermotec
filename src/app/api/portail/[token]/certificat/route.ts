export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/portail/[token]/certificat — Generer ou recuperer certificat
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
    }

    // Recuperer inscription par token
    const supabase = getSupabase()
    const { data: inscription, error } = await supabase
      .from('inscriptions')
      .select(`
        *,
        lead:leads(prenom, nom),
        session:sessions(
          date_debut, date_fin,
          formation:formations(nom, categorie, duree_jours, duree_heures)
        )
      `)
      .eq('portail_token', token)
      .single()

    if (error || !inscription) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }

    // Verifier que la formation est completee
    if (inscription.statut !== 'COMPLETEE') {
      return NextResponse.json({
        error: 'Formation non terminée',
        message: 'Le certificat sera disponible une fois la formation terminée.'
      }, { status: 403 })
    }

    // Generer numero certificat si pas encore fait
    let certificatNumero = inscription.certificat_numero
    if (!certificatNumero) {
      const year = new Date().getFullYear()
      const random = randomBytes(4).toString('hex').toUpperCase()
      certificatNumero = `CERT-${year}-${random}`

      await supabase
        .from('inscriptions')
        .update({
          certificat_genere: true,
          certificat_numero: certificatNumero,
        })
        .eq('id', inscription.id)
    }

    const formation = inscription.session?.formation
    const lead = inscription.lead

    return NextResponse.json({
      certificat: {
        numero: certificatNumero,
        prenom: lead?.prenom,
        nom: lead?.nom,
        formation: formation?.nom,
        categorie: formation?.categorie,
        duree_jours: formation?.duree_jours,
        duree_heures: formation?.duree_heures,
        date_debut: inscription.session?.date_debut,
        date_fin: inscription.session?.date_fin,
        taux_presence: inscription.taux_presence || 100,
        note_satisfaction: inscription.note_satisfaction,
        date_emission: new Date().toISOString(),
        verification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'}/certificat/${certificatNumero}`,
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
