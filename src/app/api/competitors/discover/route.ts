import { NextRequest, NextResponse } from 'next/server'
import { discoverCompetitors } from '@/lib/competitor/discovery'
import { requireAuth } from '@/lib/api/auth'
import { logActivity } from '@/lib/activity-logger'

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

    const result = await discoverCompetitors({ siret, nom, ville, radiusM })

    if (!result) {
      return NextResponse.json({ error: 'Établissement non trouvé' }, { status: 404 })
    }

    logActivity({ type: 'SYSTEME', description: 'Découverte concurrents lancée', user_id: auth.user?.id, metadata: { action: 'competitor_discover' } })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[Competitors] Discovery error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
