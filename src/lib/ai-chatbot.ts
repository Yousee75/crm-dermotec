// ============================================================
// CRM DERMOTEC — Chatbot IA (Claude API)
// RAG sur les formations Dermotec pour répondre 24/7
// Config : ANTHROPIC_API_KEY dans .env.local
// ============================================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `Tu es l'assistante virtuelle de Dermotec Advanced, un centre de formation en esthétique certifié Qualiopi situé au 75 Boulevard Richard Lenoir, 75011 Paris.

TON RÔLE :
- Répondre aux questions sur les formations, tarifs, financement, prérequis
- Qualifier les leads en posant les bonnes questions (expérience, objectif, financement)
- Encourager l'inscription en mettant en avant les bénéfices
- Orienter vers un appel avec une conseillère si besoin

TON STYLE :
- Chaleureuse, professionnelle, enthousiaste
- Réponses courtes (3-5 phrases max)
- Utilise le tutoiement
- Toujours terminer par une question ou un CTA

INFORMATIONS DERMOTEC :
- Téléphone : 01 88 33 43 43
- Email : dermotec.fr@gmail.com
- Horaires : Lun-Ven 9h-18h
- Certifié Qualiopi (formations finançables OPCO, CPF, France Travail)
- +500 stagiaires formées
- Note Google : 4.9/5

FINANCEMENT :
- Toutes les formations sont éligibles au financement
- OPCO (salariées), CPF (tout actif), France Travail (demandeurs emploi)
- Paiement en 3x ou 4x sans frais avec Alma
- L'équipe aide à monter le dossier de financement

RÈGLES :
- Ne jamais inventer d'information
- Si tu ne sais pas, dire "Je vais transmettre ta question à une conseillère"
- Ne pas donner de conseils médicaux
- Toujours proposer un RDV téléphonique pour les questions complexes`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface FormationContext {
  nom: string
  prix_ht: number
  duree_jours: number
  duree_heures: number
  categorie: string
  prerequis?: string
  description_commerciale?: string
  objectifs?: string[]
  niveau: string
}

export async function chatWithAI(
  messages: ChatMessage[],
  formations: FormationContext[] = [],
  leadContext?: { prenom?: string; statut_pro?: string; experience?: string }
): Promise<{ response: string; suggestedAction?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      response: "Je suis temporairement indisponible. Contacte-nous au 01 88 33 43 43 ou par email à dermotec.fr@gmail.com !",
      suggestedAction: 'fallback_contact'
    }
  }

  // Construire le contexte formations
  const formationsContext = formations.length > 0
    ? `\n\nFORMATIONS DISPONIBLES :\n${formations.map(f =>
        `- ${f.nom} (${f.categorie}) : ${f.prix_ht}€ HT, ${f.duree_jours} jours (${f.duree_heures}h), niveau ${f.niveau}${f.prerequis ? `, prérequis: ${f.prerequis}` : ''}${f.description_commerciale ? ` — ${f.description_commerciale}` : ''}`
      ).join('\n')}`
    : ''

  const leadCtx = leadContext
    ? `\n\nCONTEXTE LEAD : ${leadContext.prenom ? `Prénom: ${leadContext.prenom}` : ''}${leadContext.statut_pro ? `, Statut: ${leadContext.statut_pro}` : ''}${leadContext.experience ? `, Expérience: ${leadContext.experience}` : ''}`
    : ''

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT + formationsContext + leadCtx,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Erreur Claude API:', err)
      return {
        response: "Oups, j'ai un petit souci technique ! Appelle-nous au 01 88 33 43 43, on sera ravies de t'aider. 😊",
        suggestedAction: 'fallback_contact'
      }
    }

    const data = await res.json()
    const response = data.content?.[0]?.text || "Je n'ai pas compris, peux-tu reformuler ?"

    // Détecter les actions suggérées dans la réponse
    let suggestedAction: string | undefined
    if (response.toLowerCase().includes('appel') || response.toLowerCase().includes('conseillère')) {
      suggestedAction = 'schedule_call'
    } else if (response.toLowerCase().includes('inscri') || response.toLowerCase().includes('réserv')) {
      suggestedAction = 'show_inscription'
    } else if (response.toLowerCase().includes('financement') || response.toLowerCase().includes('opco') || response.toLowerCase().includes('cpf')) {
      suggestedAction = 'show_financement'
    }

    return { response, suggestedAction }
  } catch (err) {
    console.error('Erreur chatbot:', err)
    return {
      response: "Je rencontre un problème technique. N'hésite pas à nous appeler au 01 88 33 43 43 !",
      suggestedAction: 'fallback_contact'
    }
  }
}

export function isAIChatConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}
