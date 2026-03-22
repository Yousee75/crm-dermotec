// @ts-nocheck
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
import { generateCoachingInsights, coachingToSystemPrompt } from '@/lib/win-patterns'
import type { WinPattern } from '@/lib/pipeline-forecast'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, leadId, mode } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      leadId?: string
      mode?: 'commercial' | 'formation'
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

    // Charger les win patterns pour le coaching IA (cache 15 min côté agent)
    let coachingPrompt = ''
    try {
      const { createServiceSupabase } = await import('@/lib/supabase-server')
      const sb = await createServiceSupabase() as any
      const { data: winPatterns } = await sb.from('v_win_patterns').select('*')
      if (winPatterns?.length) {
        const insights = generateCoachingInsights(winPatterns as WinPattern[])
        coachingPrompt = coachingToSystemPrompt(insights)
      }
    } catch { /* win patterns non disponibles, pas bloquant */ }

    // Construire le system prompt enrichi
    let systemPrompt = DERMOTEC_SYSTEM

    if (leadId) {
      systemPrompt += `\n\nCONTEXTE : Le commercial consulte la fiche du lead ID: ${leadId}.
COMPORTEMENT OBLIGATOIRE quand tu as un lead_id :
1. Appelle getProactiveInsights(lead_id) EN PREMIER pour détecter les urgences
2. Si des urgences → commence ta réponse par les alertes
3. Utilise getRevenueGraph(lead_id) pour le profil 360° complet (LTV, engagement, churn)
4. Utilise findSimilarSuccess pour des insights data-driven`
    }

    systemPrompt += `\n\nTu as accès à 15 outils pour AGIR dans le CRM :
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
- getPipelineForecast : prévisions CA 30/60/90j + velocity + patterns gagnants
- getRevenueGraph : vue 360° enrichie (LTV, engagement, churn risk, filtres prédéfinis)

COMPORTEMENT :
- Utilise "think" AVANT les réponses complexes (financement, choix formation, stratégie)
- Utilise les outils de manière PROACTIVE — ne dis pas "je pourrais" → FAIS-LE
- Quand tu exécutes une action, CONFIRME ce qui a été fait
- Cite tes sources (KB article, playbook response) quand pertinent
- Pour les questions forecast/CA → utilise getPipelineForecast
- Pour les bilans lead → utilise getRevenueGraph avec le filtre adapté`

    // Injecter le coaching IA basé sur les win patterns
    if (coachingPrompt) {
      systemPrompt += coachingPrompt
    }

    // Mode dual : Commercial (défaut) ou Formation/Qualiopi
    if (mode === 'formation') {
      systemPrompt += `

## MODE FORMATION / QUALIOPI

Tu es maintenant en mode FORMATION. Ton rôle change :
- Tu aides à la gestion des sessions, émargements, évaluations et certificats
- Tu connais les 7 critères Qualiopi et les 32 indicateurs
- Tu peux vérifier la conformité des sessions et documents

QUALIOPI — 7 CRITÈRES :
1. Information du public (site web, catalogue, CGV)
2. Identification des objectifs et adaptation (programmes, prérequis)
3. Adaptation aux publics (positionnement, individualisation)
4. Moyens pédagogiques et techniques (matériel, locaux, supports)
5. Qualification des intervenants (CV, diplômes, formation continue)
6. Inscription dans l'environnement professionnel (veille, partenariats)
7. Recueil des appréciations (NPS, satisfaction, suivi)

ACTIONS DISPONIBLES en mode formation :
- Vérifier la complétude d'un dossier session (émargement, évaluation, documents)
- Calculer les heures de formation restantes pour le BPF
- Suivre les présences et absences des stagiaires
- Identifier les documents manquants pour un audit Qualiopi
- Générer des rapports de suivi stagiaire

COMPORTEMENT en mode formation :
- Priorise la conformité réglementaire
- Cite les articles du Code du travail quand pertinent
- Alerte si un indicateur Qualiopi risque d'être non conforme`
    }

    // Collecter la réponse complète pour le cache
    let fullResponse = ''

    // Tools réactivés — fix: defineTool retourne un objet brut avec jsonSchema() au lieu de tool()
    const useTools = !(body as any).noTools

    const result = streamText({
      model: getModel('best'),
      system: systemPrompt,
      messages,
      ...(useTools ? { tools: crmTools } : {}),
      maxSteps: useTools ? (10 as any) : 1,
      maxRetries: 2,
      temperature: 0.4,
      onFinish: async ({ text, usage }) => {
        fullResponse = text
        // Sauvegarder dans le semantic cache (seulement questions génériques)
        if (!leadId && lastUserMessage.length > 10 && text.length > 50) {
          await semanticCacheSet(lastUserMessage, text).catch(() => {})
        }
        // Sauvegarder la conversation dans agent_conversations
        try {
          const { createServiceSupabase } = await import('@/lib/supabase-server')
          const sb = await createServiceSupabase() as any
          await sb.from('agent_conversations').insert({
            lead_id: leadId || null,
            mode: mode || 'commercial',
            messages: messages.concat([{ role: 'assistant', content: text }]),
            total_messages: messages.length + 1,
            total_tokens: (usage?.totalTokens) || 0,
            last_message_at: new Date().toISOString(),
          })

          // Sauvegarder dans messages omnicanal (canal = agent_ia)
          if (leadId) {
            try {
              const { saveAgentMessage } = await import('@/lib/message-store')
              // Question du commercial (inbound = vient vers le CRM)
              await saveAgentMessage({
                lead_id: leadId,
                direction: 'inbound',
                contenu: lastUserMessage.slice(0, 500),
                metadata: { type: 'user_question', mode: mode || 'commercial' },
              })
              // Réponse de l'agent (outbound = sort du CRM vers l'utilisateur)
              if (text) {
                await saveAgentMessage({
                  lead_id: leadId,
                  direction: 'outbound',
                  contenu: text.slice(0, 1000),
                  metadata: { type: 'agent_response', mode: mode || 'commercial', tokens: usage?.totalTokens },
                })
              }
            } catch (msgErr) {
              console.error('[Agent v3] Message save failed:', msgErr)
            }
          }
        } catch (saveErr) {
          console.error('[Agent v3] Conversation save failed:', saveErr)
        }
      },
      onError: ({ error }) => {
        console.error('[Agent v3] Stream error:', error)
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error: any) {
    console.error('[Agent v3] Error:', error?.message || error)
    console.error('[Agent v3] Stack:', error?.stack)

    // Distinguer les erreurs API key vs autres
    const message = error?.message || 'Erreur interne agent IA'
    const isAuthError = message.includes('API key') || message.includes('401') || message.includes('Unauthorized') || message.includes('clé API')
    const isModelError = message.includes('model') || message.includes('not found') || message.includes('404')

    return new Response(JSON.stringify({
      error: isAuthError ? 'Clé API IA non configurée ou invalide'
        : isModelError ? 'Modèle IA indisponible'
        : 'Erreur interne agent IA',
      details: process.env.NODE_ENV === 'development' ? message : undefined,
    }), {
      status: isAuthError ? 401 : 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
