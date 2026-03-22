import { NextRequest, NextResponse } from 'next/server'
import { envoyerConventionSignature, envoyerCertificatSignature, isDocuSealConfigured } from '@/lib/docuseal'
import { BRAND } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!isDocuSealConfigured()) {
    return NextResponse.json({ error: 'DocuSeal non configuré' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { type, templateId, stagiaire, formation, formatrice } = body

    if (!type || !templateId || !stagiaire?.email) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    let result

    if (type === 'convention') {
      result = await envoyerConventionSignature({
        templateId,
        stagiaire,
        formation: {
          nom: formation.nom || '',
          dates: formation.dates || '',
          lieu: formation.lieu || BRAND.address + ', ' + BRAND.zipCode + ' ' + BRAND.city,
          prix_ttc: formation.prix_ttc || '',
        },
        centre: {
          nom: BRAND.name,
          email: BRAND.email,
        },
      })
    } else if (type === 'certificat') {
      if (!formatrice?.email) {
        return NextResponse.json({ error: 'Formatrice requise pour un certificat' }, { status: 400 })
      }
      result = await envoyerCertificatSignature({
        templateId,
        stagiaire,
        formation: {
          nom: formation.nom || '',
          date_fin: formation.date_fin || '',
        },
        formatrice,
      })
    } else {
      return NextResponse.json({ error: 'Type invalide (convention ou certificat)' }, { status: 400 })
    }

    if (!result) {
      return NextResponse.json({ error: 'Échec de l\'envoi' }, { status: 500 })
    }

    return NextResponse.json({ id: result.id, status: result.status })
  } catch (err: any) {
    console.error('[DocuSeal] Erreur API:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
