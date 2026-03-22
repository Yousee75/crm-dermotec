import { NextRequest, NextResponse } from 'next/server'
import { discoverCompetitors } from '@/lib/competitor-discovery'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siret, nom, ville, radiusM } = body

    if (!siret && !nom) {
      return NextResponse.json({ error: 'SIRET ou nom requis' }, { status: 400 })
    }

    const result = await discoverCompetitors({ siret, nom, ville, radiusM })

    if (!result) {
      return NextResponse.json({ error: 'Établissement non trouvé' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[Competitors] Discovery error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
