// ============================================================
// CRM DERMOTEC — Assistant IA General (DeepSeek)
// Chatbot quotidien pas cher, distinct de l'Agent CRM (Claude)
// ============================================================

import type { AIMessage, AIResponse } from './core'

const ASSISTANT_PROVIDERS = [
  {
    name: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
  },
  {
    name: 'mistral_nemo',
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'open-mistral-nemo',
    envKey: 'MISTRAL_API_KEY',
  },
  {
    name: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    envKey: 'GROQ_API_KEY',
  },
  {
    name: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'deepseek/deepseek-chat',
    envKey: 'OPENROUTER_API_KEY',
  },
] as const

const SYSTEM_PROMPT = `Tu es l'assistant IA de Dermotec Advanced, centre de formation esthétique certifié Qualiopi à Paris 11e (75 Bd Richard Lenoir).

TON ROLE :
- Aider les utilisateurs du CRM dans leur quotidien
- Répondre aux questions sur la formation professionnelle en France
- Aider à la rédaction (emails, courriers, descriptions)
- Expliquer les réglementations (Qualiopi, CPF, OPCO, France Travail)
- Donner des conseils commerciaux pour le secteur esthétique
- Reformuler et corriger des textes

FORMATIONS DERMOTEC (11 formations, 400-2500€ HT) :
- Maquillage Permanent (2490€), Microblading (1400€), Full Lips (1400€)
- Tricopigmentation (2500€), Aréole Mammaire (2300€), Nanoneedling (700€)
- Soin ALLin1 (900€), Peeling/Dermaplaning (990€), Détatouage (990€)
- Épilation Définitive (990€), Hygiène & Salubrité (400€)

FONCTIONNALITÉS DU CRM QUE TU PEUX MENTIONNER :
- Page /concurrents : analyse concurrentielle avec carte, scraping PagesJaunes/Planity/Treatwell, scores
- Page /outils : 13 outils (TVA, SIRET, PDF, images, OCR, notes, CSV, signature email, mot de passe, pomodoro)
- Rapport PDF : générer un rapport d'analyse concurrentielle professionnel
- Chatbot IA : tu es ce chatbot, connecté à DeepSeek pour répondre rapidement
- Agent CRM : un autre assistant (Claude) connecté aux données CRM pour des analyses plus profondes

COMPORTEMENT INTELLIGENT :
- Si l'utilisateur fait des fautes ou s'exprime mal, COMPRENDS l'intention et réponds correctement
- Ne demande PAS de reformuler, déduis le sens
- Si la question est ambiguë, réponds à l'interprétation la plus probable ET propose une alternative
- Sois proactif : propose des actions ("Voulez-vous que je génère un rapport PDF ?", "Utilisez l'outil SIRET dans /outils")
- Adapte le niveau de langage : technique pour un expert, simple pour un débutant
- Si l'utilisateur demande quelque chose que le CRM peut faire, guide-le vers la bonne page

REGLES :
- Réponds TOUJOURS en français
- Sois concis, professionnel et chaleureux
- Ne donne JAMAIS de conseils médicaux
- Pour les questions hors domaine, réponds poliment que tu es spécialisé formation esthétique
- Utilise des emojis avec parcimonie (max 2 par réponse)
- Formate avec du markdown quand pertinent
- Si tu proposes de générer un PDF, dis "Allez dans /concurrents puis cliquez sur Rapport PDF"
- Maximum 200 mots par réponse sauf si l'utilisateur demande plus de détails`

function getAssistantProvider() {
  for (const provider of ASSISTANT_PROVIDERS) {
    const apiKey = process.env[provider.envKey]
    if (apiKey) {
      return { ...provider, apiKey }
    }
  }
  return null
}

export async function assistantChat(
  userMessages: AIMessage[],
  options?: { temperature?: number; max_tokens?: number }
): Promise<AIResponse | null> {
  const provider = getAssistantProvider()
  if (!provider) {
    console.warn('[AI Assistant] Aucun provider disponible')
    return null
  }

  const messages: AIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...userMessages.slice(-20), // Garder les 20 derniers messages max
  ]

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    }

    if (provider.name === 'openrouter') {
      headers['HTTP-Referer'] = 'https://crm-dermotec.vercel.app'
      headers['X-Title'] = 'CRM Dermotec'
    }

    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 1500,
        stream: false,
      }),
    })

    if (!res.ok) {
      console.error(`[AI Assistant] ${provider.name} error ${res.status}`)
      return null
    }

    const data = await res.json()
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: `${provider.name}/${data.model || provider.model}`,
      usage: data.usage,
    }
  } catch (err) {
    console.error(`[AI Assistant] ${provider.name} fetch error:`, err)
    return null
  }
}

// Semantic cache key
export function getCacheKey(message: string): string {
  const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ')
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return `ai_cache:${Math.abs(hash).toString(36)}`
}
