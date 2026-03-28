export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/certificat/[numero] — Vérification publique d'un certificat
export async function GET(
  request: NextRequest,
  { params }: { params: { numero: string } }
) {
  try {
    const { numero } = params

    if (!numero || numero.length < 8) {
      return NextResponse.json({ error: 'Numéro invalide' }, { status: 400 })
    }

    // Sanitize : seuls alphanumériques et tirets
    const sanitized = numero.replace(/[^A-Za-z0-9-]/g, '')
    if (sanitized !== numero) {
      return NextResponse.json({ error: 'Numéro invalide' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: inscription } = await supabase
      .from('inscriptions')
      .select(`
        certificat_numero, taux_presence, statut,
        session:sessions(
          date_debut, date_fin,
          formation:formations(nom, categorie, duree_jours, duree_heures)
        ),
        lead:leads(prenom, nom)
      `)
      .eq('certificat_numero', sanitized)
      .single()

    if (!inscription) {
      return NextResponse.json({ found: false }, { status: 404 })
    }

    const formation = (inscription.session as any)?.formation
    const lead = inscription.lead as any

    return NextResponse.json({
      found: true,
      certificat: {
        numero: inscription.certificat_numero,
        prenom: lead?.prenom || '',
        nom: lead?.nom || '',
        formation: formation?.nom || '',
        categorie: formation?.categorie || '',
        duree_jours: formation?.duree_jours || 0,
        duree_heures: formation?.duree_heures || 0,
        date_debut: (inscription.session as any)?.date_debut || '',
        date_fin: (inscription.session as any)?.date_fin || '',
        taux_presence: inscription.taux_presence || 0,
        valid: inscription.statut === 'COMPLETEE',
      }
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
