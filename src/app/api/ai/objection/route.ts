// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { aiHandleObjection } from '@/lib/ai'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

// POST /api/ai/objection — Traitement d'objection en temps réel
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error

    const { objection, contexte_lead } = await request.json()

    if (!objection) {
      return NextResponse.json({ error: 'objection requise' }, { status: 400 })
    }

    const result = await aiHandleObjection({ objection, contexte_lead })

    if (!result) {
      return NextResponse.json({ error: 'Service IA indisponible' }, { status: 503 })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[AI Objection]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
