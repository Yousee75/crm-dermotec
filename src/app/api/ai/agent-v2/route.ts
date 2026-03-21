// ============================================================
// CRM DERMOTEC — Agent IA Commercial v3 (Vercel AI SDK)
// POST /api/ai/agent-v2
// Streaming + Tool Calling + Hybrid Search + Semantic Cache
// Claude Sonnet 4.6 (prompt caching auto via SDK)
// ============================================================

import { streamText } from 'ai'
import { getModel, DERMOTEC_SYSTEM } from '@/lib/ai-sdk'
import { crmTools } from '@/lib/ai-tools'
import { semanticCacheGet, semanticCacheSet } from '@/lib/semantic-cache'

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

    // Dernier message de l'utilisateur
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''

    // Semantic cache : si question identique récemment posée, retourner le cache
    // (seulement pour les questions génériques, pas les questions avec lead_id spécifique)
    if (!leadId && lastUserMessage.length > 10) {
      const cached = await semanticCacheGet(lastUserMessage)
      if (cached) {
        // Retourner le cache comme un stream simple
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`0:${JSON.stringify(cached.response)}\n`))
            controller.close()
          },
        })
        return new Response(stream, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
    }

    // Construire le system prompt enrichi
    let systemPrompt = DERMOTEC_SYSTEM

    if (leadId) {
      systemPrompt += `\n\nCONTEXTE : Le commercial consulte la fiche du lead ID: ${leadId}.
COMPORTEMENT OBLIGATOIRE quand tu as un lead_id :
1. Appelle getProactiveInsights(lead_id) EN PREMIER pour détecter les urgences
2. Si des urgences → commence ta réponse par les alertes
3. Utilise getLeadDetails si tu as besoin de plus de contexte
4. Utilise findSimilarSuccess pour des insights data-driven`
    }

    systemPrompt += `\n\nTu as accès à 13 outils pour AGIR dans le CRM :
- think : réfléchir en privé avant de répondre (le commercial ne voit pas ta réflexion)
- searchLeads : chercher des leads par nom/email/statut
- getLeadDetails : charger une fiche lead complète
- getProactiveInsights : détecter urgences et opportunités
- findSimilarSuccess : trouver des leads similaires qui ont converti
- createReminder : créer un rappel/relance
- getNextSessions : sessions disponibles avec places
- analyzeFinancement : options OPCO/CPF/France Travail + script téléphone
- searchKnowledgeBase : chercher dans la KB (hybrid search BM25 + vecteurs)
- getPlaybookResponse : meilleure réponse validée par l'équipe
- getPipelineStats : KPIs du pipeline
- updateLeadStatus : changer le statut d'un lead
- sendEmail : envoyer un email

COMPORTEMENT :
- Utilise "think" AVANT les réponses complexes (financement, choix formation, stratégie)
- Utilise les outils de manière PROACTIVE — ne dis pas "je pourrais" → FAIS-LE
- Quand tu exécutes une action, CONFIRME ce qui a été fait
- Cite tes sources (KB article, playbook response) quand pertinent`

    // Collecter la réponse complète pour le cache
    let fullResponse = ''

    const result = streamText({
      model: getModel('best'),
      system: systemPrompt,
      messages,
      tools: crmTools,
      maxRetries: 2,
      temperature: 0.4,
      onFinish: async ({ text }) => {
        fullResponse = text
        // Sauvegarder dans le semantic cache (seulement questions génériques)
        if (!leadId && lastUserMessage.length > 10 && text.length > 50) {
          await semanticCacheSet(lastUserMessage, text).catch(() => {})
        }
      },
      onError: ({ error }) => {
        console.error('[Agent v3] Stream error:', error)
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[Agent v3] Error:', error)
    return new Response(JSON.stringify({ error: 'Erreur interne agent IA' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
