// @ts-nocheck
// ============================================================
// CRM DERMOTEC — Agent IA Commercial API
// POST /api/ai/agent
// Conseiller de vente temps réel basé sur CRM + knowledge base
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { askAgent, type AgentMessage } from '@/lib/ai-agent'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error

    const body = await request.json()

    const { question, lead_id, conversation_history } = body as {
      question?: string
      lead_id?: string
      conversation_history?: AgentMessage[]
    }

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'La question est requise' },
        { status: 400 }
      )
    }

    if (question.length > 2000) {
      return NextResponse.json(
        { error: 'Question trop longue (max 2000 caractères)' },
        { status: 400 }
      )
    }

    const result = await askAgent({
      question: question.trim(),
      leadId: lead_id,
      conversationHistory: conversation_history?.slice(-6) || [],
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Agent IA] Error:', error)
    return NextResponse.json(
      { error: 'Erreur interne agent IA' },
      { status: 500 }
    )
  }
}
