// ============================================================
// CRM DERMOTEC — Module WhatsApp Business API
// Prêt à brancher sur Meta Cloud API ou Evolution API
// Config : WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID dans .env.local
// ============================================================

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0'

interface WhatsAppConfig {
  token: string
  phoneNumberId: string
}

function getConfig(): WhatsAppConfig {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) {
    throw new Error('WhatsApp non configuré : WHATSAPP_TOKEN et WHATSAPP_PHONE_NUMBER_ID requis')
  }
  return { token, phoneNumberId }
}

// Templates de messages prédéfinis
export const WHATSAPP_TEMPLATES = {
  confirmation_inscription: {
    name: 'confirmation_inscription',
    language: 'fr',
    variables: ['prenom', 'formation', 'date_debut'],
  },
  rappel_session_j7: {
    name: 'rappel_session_j7',
    language: 'fr',
    variables: ['prenom', 'formation', 'date', 'lieu'],
  },
  rappel_session_j1: {
    name: 'rappel_session_j1',
    language: 'fr',
    variables: ['prenom', 'formation', 'horaire', 'adresse'],
  },
  relance_financement: {
    name: 'relance_financement',
    language: 'fr',
    variables: ['prenom', 'organisme', 'formation'],
  },
  bienvenue: {
    name: 'bienvenue',
    language: 'fr',
    variables: ['prenom'],
  },
  satisfaction_post_formation: {
    name: 'satisfaction_post_formation',
    language: 'fr',
    variables: ['prenom', 'formation', 'lien_evaluation'],
  },
} as const

export type WhatsAppTemplateName = keyof typeof WHATSAPP_TEMPLATES

// Envoyer un message texte libre
export async function sendWhatsAppText(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { token, phoneNumberId } = getConfig()
    const phone = formatPhoneForWhatsApp(to)

    const res = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text },
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error?.message || 'Erreur WhatsApp' }
    }

    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}

// Envoyer un template (nécessaire pour initier une conversation)
export async function sendWhatsAppTemplate(
  to: string,
  templateName: WhatsAppTemplateName,
  variables: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { token, phoneNumberId } = getConfig()
    const phone = formatPhoneForWhatsApp(to)
    const template = WHATSAPP_TEMPLATES[templateName]

    const components = template.variables.length > 0 ? [{
      type: 'body',
      parameters: template.variables.map(v => ({
        type: 'text',
        text: variables[v] || '',
      })),
    }] : []

    const res = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: template.name,
          language: { code: template.language },
          components,
        },
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error?.message || 'Erreur template WhatsApp' }
    }

    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}

// Formatage téléphone FR → format international WhatsApp
function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[\s.\-()]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '33' + cleaned.slice(1)
  } else if (cleaned.startsWith('+33')) {
    cleaned = '33' + cleaned.slice(3)
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1)
  }
  return cleaned
}

// Vérifier si WhatsApp est configuré
export function isWhatsAppConfigured(): boolean {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
}
