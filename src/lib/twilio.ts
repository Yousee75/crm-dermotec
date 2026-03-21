// ============================================================
// CRM DERMOTEC — Service Twilio (SMS + WhatsApp)
// Pattern: lazy init + silent fallback
// ============================================================

interface TwilioConfig {
  accountSid: string
  authToken: string
  phoneNumber: string
  whatsappNumber?: string
}

let _config: TwilioConfig | null = null

function getConfig(): TwilioConfig | null {
  if (_config) return _config
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const phone = process.env.TWILIO_PHONE_NUMBER
  if (!sid || !token || !phone) {
    console.warn('[Twilio] Clés manquantes — SMS/WhatsApp désactivés')
    return null
  }
  _config = {
    accountSid: sid,
    authToken: token,
    phoneNumber: phone,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${phone}`,
  }
  return _config
}

async function twilioRequest(path: string, body: Record<string, string>): Promise<{ success: boolean; sid?: string; error?: string }> {
  const config = getConfig()
  if (!config) return { success: false, error: 'Twilio non configuré' }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}${path}`
    const credentials = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[Twilio] Error:', data.message || data)
      return { success: false, error: data.message || 'Erreur Twilio' }
    }

    return { success: true, sid: data.sid }
  } catch (err) {
    console.error('[Twilio] Fetch error:', err)
    return { success: false, error: 'Erreur réseau Twilio' }
  }
}

// --- SMS ---

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const config = getConfig()
  if (!config) return { success: false, error: 'Twilio non configuré' }

  // Normaliser le numéro FR
  let phone = to.replace(/[\s.\-()]/g, '')
  if (phone.startsWith('0')) {
    phone = '+33' + phone.slice(1)
  }
  if (!phone.startsWith('+')) {
    phone = '+' + phone
  }

  console.log(`[SMS] Envoi à ${phone}: ${message.slice(0, 50)}...`)

  return twilioRequest('/Messages.json', {
    From: config.phoneNumber,
    To: phone,
    Body: message,
  })
}

// --- WhatsApp ---

export async function sendWhatsApp(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const config = getConfig()
  if (!config) return { success: false, error: 'Twilio non configuré' }

  let phone = to.replace(/[\s.\-()]/g, '')
  if (phone.startsWith('0')) {
    phone = '+33' + phone.slice(1)
  }
  if (!phone.startsWith('+')) {
    phone = '+' + phone
  }

  console.log(`[WhatsApp] Envoi à ${phone}: ${message.slice(0, 50)}...`)

  return twilioRequest('/Messages.json', {
    From: config.whatsappNumber || `whatsapp:${config.phoneNumber}`,
    To: `whatsapp:${phone}`,
    Body: message,
  })
}

// --- Rappel SMS programmé ---

export async function sendRappelSMS(params: {
  telephone: string
  prenom: string
  formation: string
  date_formation: string
}): Promise<{ success: boolean; sid?: string; error?: string }> {
  const message = `Bonjour ${params.prenom} ! Petit rappel : votre formation "${params.formation}" chez Dermotec a lieu le ${params.date_formation}. RDV au 75 Bd Richard Lenoir, 75011 Paris. À bientôt ! — L'équipe Dermotec 📍`

  return sendSMS(params.telephone, message)
}

// --- Notification commerciale WhatsApp ---

export async function sendCommercialNotif(params: {
  telephone_commercial: string
  lead_prenom: string
  action: string
}): Promise<{ success: boolean; sid?: string; error?: string }> {
  const message = `🔔 CRM Dermotec : ${params.action} pour ${params.lead_prenom}. Connecte-toi au CRM pour traiter.`

  return sendWhatsApp(params.telephone_commercial, message)
}
