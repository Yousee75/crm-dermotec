import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/ai/core'
import { requireAuth } from '@/lib/api/auth'
import { logActivity } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error
    const { text, tone } = await request.json()

    if (!text || typeof text !== 'string' || text.length > 5000) {
      return NextResponse.json({ error: 'Texte invalide (max 5000 caractères)' }, { status: 400 })
    }

    const toneInstructions: Record<string, string> = {
      professionnel: 'un ton professionnel et sérieux',
      commercial: 'un ton commercial persuasif et engageant',
      amical: 'un ton chaleureux et amical',
      formel: 'un ton très formel et institutionnel',
      concis: 'un style concis et direct, en réduisant le texte de moitié',
    }

    const instruction = toneInstructions[tone] || toneInstructions.professionnel

    const result = await chatCompletion([
      {
        role: 'system',
        content: `Tu es un expert en rédaction française. Reformule le texte avec ${instruction}. Retourne UNIQUEMENT le texte reformulé, sans commentaire ni explication.`,
      },
      {
        role: 'user',
        content: text,
      },
    ], { temperature: 0.7, max_tokens: 2000 })

    if (!result) {
      return NextResponse.json({ error: 'IA non disponible' }, { status: 503 })
    }

    return NextResponse.json({ result: result.content, model: result.model })
  } catch (err) {
    console.error('[Reformulate] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
