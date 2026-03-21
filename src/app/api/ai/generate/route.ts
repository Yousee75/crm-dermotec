// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { aiGenerateEmail } from '@/lib/ai'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// POST /api/ai/generate — Génère un email/message personnalisé
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error

    const body = await request.json()
    const { type, lead, contexte } = body

    if (!type || !lead?.prenom) {
      return NextResponse.json({ error: 'type et lead.prenom requis' }, { status: 400 })
    }

    const validTypes = ['premier_contact', 'relance', 'financement', 'post_formation', 'upsell', 'reactivation']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Type invalide. Valeurs : ${validTypes.join(', ')}` }, { status: 400 })
    }

    const result = await aiGenerateEmail({ type, lead, contexte })

    if (!result) {
      return NextResponse.json({ error: 'Service IA indisponible' }, { status: 503 })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[AI Generate]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
