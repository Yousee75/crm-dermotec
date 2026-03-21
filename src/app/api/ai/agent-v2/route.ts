// @ts-nocheck
// ============================================================
// CRM DERMOTEC — Agent IA Commercial v2 (Vercel AI SDK)
// POST /api/ai/agent-v2
// Streaming + Tool Calling + Claude Sonnet 4.6
// ============================================================

import { streamText } from 'ai'
import { getModel, DERMOTEC_SYSTEM } from '@/lib/ai-sdk'
import { crmTools } from '@/lib/ai-tools'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, leadId } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      leadId?: string
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Construire le system prompt avec contexte lead si disponible
    let systemPrompt = DERMOTEC_SYSTEM

    if (leadId) {
      systemPrompt += `\n\nCONTEXTE : Le commercial consulte actuellement la fiche du lead ID: ${leadId}. Utilise l'outil getLeadDetails pour charger ses informations si nécessaire.`
    }

    systemPrompt += `\n\nTu as accès aux outils suivants pour AGIR dans le CRM :
- searchLeads : chercher des leads
- getLeadDetails : charger une fiche lead complète
- createReminder : créer un rappel/relance
- getNextSessions : voir les prochaines sessions disponibles
- analyzeFinancement : analyser les options de financement
- searchKnowledgeBase : chercher dans les scripts de vente et fiches
- getPlaybookResponse : trouver la meilleure réponse à une objection

Utilise ces outils de manière proactive. Ne dis pas "je pourrais chercher" — CHERCHE directement.
Quand tu crées un rappel ou exécutes une action, confirme au commercial ce qui a été fait.`

    const result = streamText({
      model: getModel('best'),
      system: systemPrompt,
      messages,
      tools: crmTools,
      maxRetries: 2,
      temperature: 0.4,
      onError: ({ error }) => {
        console.error('[Agent v2] Stream error:', error)
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[Agent v2] Error:', error)
    return new Response(JSON.stringify({ error: 'Erreur interne agent IA' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
