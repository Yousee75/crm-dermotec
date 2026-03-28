import { NextRequest, NextResponse } from 'next/server'
import { discoverCompetitors } from '@/lib/competitor/discovery'
import { analyzeCompetitors } from '@/lib/competitor/analyzer'
import { requireAuth } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error
    const body = await request.json()
    const { siret, nom, ville, radiusM } = body

    if (!siret && !nom) {
      return NextResponse.json({ error: 'SIRET ou nom requis' }, { status: 400 })
    }

    // Phase 1 : Discovery
    const discovery = await discoverCompetitors({ siret, nom, ville, radiusM })

    if (!discovery) {
      return NextResponse.json({ error: 'Établissement non trouvé' }, { status: 404 })
    }

    // Phase 2 : Analyse enrichie (Pappers + scoring)
    const analysis = await analyzeCompetitors(
      discovery.prospect,
      discovery.competitors
    )

    return NextResponse.json(analysis)
  } catch (err) {
    console.error('[Competitors] Analysis error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
