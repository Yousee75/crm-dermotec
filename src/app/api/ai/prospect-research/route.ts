import { NextRequest, NextResponse } from 'next/server'
import { aiResearchProspect } from '@/lib/ai/core'
import { requireAuth } from '@/lib/api/auth'
import { logActivity } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 45

// POST /api/ai/prospect-research — Recherche enrichie avant appel
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error

    const body = await request.json()
    const { nom, entreprise, ville, secteur } = body

    if (!nom && !entreprise) {
      return NextResponse.json({ error: 'nom ou entreprise requis' }, { status: 400 })
    }

    const result = await aiResearchProspect({ nom, entreprise, ville, secteur })

    if (!result) {
      return NextResponse.json({ error: 'Service IA indisponible' }, { status: 503 })
    }

    logActivity({
      type: 'SYSTEME',
      description: `IA recherche prospect : ${nom || ''} ${entreprise || ''} (${ville || ''})`,
      user_id: auth.user?.id,
      metadata: { action: 'ai_prospect_research', nom, entreprise, ville, secteur },
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[AI Research]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
