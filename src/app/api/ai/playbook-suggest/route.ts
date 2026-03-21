// ============================================================
// CRM DERMOTEC — Playbook IA Suggestion
// POST /api/ai/playbook-suggest
// Suggère une réponse à une objection basée sur le playbook
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { suggestPlaybookResponse } from '@/lib/playbook'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error

    const body = await request.json()
    const { objection, contexte, existingResponses } = body as {
      objection?: string
      contexte?: string
      existingResponses?: string[]
    }

    if (!objection || objection.trim().length === 0) {
      return NextResponse.json({ error: 'L\'objection est requise' }, { status: 400 })
    }

    const result = await suggestPlaybookResponse({
      objection: objection.trim(),
      contexte,
      existingResponses,
    })

    if (!result) {
      return NextResponse.json({ error: 'Service IA indisponible' }, { status: 503 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Playbook Suggest] Error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
