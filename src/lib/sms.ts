// ============================================================
// CRM DERMOTEC — Module SMS (Telnyx)
// Prêt à brancher : TELNYX_API_KEY + TELNYX_FROM_NUMBER dans .env.local
// Coût : ~0.004$/SMS France (20x moins cher que Twilio)
// ============================================================

const TELNYX_API_URL = 'https://api.telnyx.com/v2'

interface TelnyxConfig {
  apiKey: string
  fromNumber: string
}

function getConfig(): TelnyxConfig {
  const apiKey = process.env.TELNYX_API_KEY
  const fromNumber = process.env.TELNYX_FROM_NUMBER
  if (!apiKey || !fromNumber) {
    throw new Error('SMS non configuré : TELNYX_API_KEY et TELNYX_FROM_NUMBER requis')
  }
  return { apiKey, fromNumber }
}

// Templates SMS prédéfinis
export const SMS_TEMPLATES = {
  rappel_j7: (prenom: string, formation: string, date: string) =>
    `Bonjour ${prenom}, rappel : votre formation "${formation}" commence le ${date} chez Dermotec, 75 Bd Richard Lenoir, Paris 11e. À bientôt !`,

  rappel_j1: (prenom: string, formation: string, horaire: string) =>
    `${prenom}, c'est demain ! Formation "${formation}" à ${horaire}. Adresse : 75 Bd Richard Lenoir, Paris 11e. Pensez à votre pièce d'identité.`,

  confirmation_inscription: (prenom: string, formation: string) =>
    `Bienvenue ${prenom} ! Votre inscription à la formation "${formation}" chez Dermotec est confirmée. Nous vous enverrons les détails prochainement.`,

  relance_financement: (prenom: string, organisme: string) =>
    `Bonjour ${prenom}, avez-vous des nouvelles de votre dossier ${organisme} ? N'hésitez pas à nous appeler au 01 88 33 43 43. — Dermotec`,

  satisfaction: (prenom: string, lien: string) =>
    `${prenom}, merci pour votre formation ! Votre avis compte : ${lien} — Dermotec`,

  avis_google: (prenom: string, lien: string) =>
    `${prenom}, si vous avez apprécié votre formation, un avis Google nous aiderait énormément : ${lien} Merci ! — Dermotec`,
} as const

// Envoyer un SMS
export async function sendSMS(
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { apiKey, fromNumber } = getConfig()
    const phone = formatPhoneForSMS(to)

    // Vérifier longueur SMS (160 chars pour 1 SMS, 153 chars/segment au-delà)
    if (text.length > 1600) {
      return { success: false, error: 'SMS trop long (max 1600 caractères)' }
    }

    const res = await fetch(`${TELNYX_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromNumber,
        to: phone,
        text,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.errors?.[0]?.detail || 'Erreur SMS Telnyx' }
    }

    return { success: true, messageId: data.data?.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}

// Envoyer SMS en masse
export async function sendBulkSMS(
  recipients: { phone: string; text: string }[]
): Promise<{ sent: number; errors: number; details: { phone: string; success: boolean; error?: string }[] }> {
  const results = await Promise.allSettled(
    recipients.map(async ({ phone, text }) => {
      const result = await sendSMS(phone, text)
      return { phone, ...result }
    })
  )

  const details = results.map(r =>
    r.status === 'fulfilled' ? r.value : { phone: 'unknown', success: false, error: 'Promise rejected' }
  )

  return {
    sent: details.filter(d => d.success).length,
    errors: details.filter(d => !d.success).length,
    details,
  }
}

// Formatage téléphone FR → E.164
function formatPhoneForSMS(phone: string): string {
  let cleaned = phone.replace(/[\s.\-()]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '+33' + cleaned.slice(1)
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }
  return cleaned
}

// Vérifier si SMS est configuré
export function isSMSConfigured(): boolean {
  return !!(process.env.TELNYX_API_KEY && process.env.TELNYX_FROM_NUMBER)
}
