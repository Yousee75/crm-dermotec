// ============================================================
// CRM DERMOTEC — Service Email (Resend)
// Pattern: lazy init + silent fallback + templates design system
// ============================================================

import { Resend } from 'resend'
import { EMAIL_TEMPLATES, type EmailTemplateName } from './email-templates'

let _resend: Resend | null = null

function getResend(): Resend | null {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[Email] RESEND_API_KEY manquante — emails désactivés')
    return null
  }
  _resend = new Resend(key)
  return _resend
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Dermotec Formation <contact@dermotec.fr>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dermotec.fr@gmail.com'

// --- Envoi générique avec template ---

type TemplateData<T extends EmailTemplateName> = Parameters<typeof EMAIL_TEMPLATES[T]>[0]

export async function sendTemplateEmail<T extends EmailTemplateName>(
  to: string,
  template: T,
  data: TemplateData<T>
): Promise<string | null> {
  const resend = getResend()
  if (!resend) return null

  try {
    // @ts-expect-error — data type is correct per template
    const { subject, html } = EMAIL_TEMPLATES[template](data)
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      headers: {
        'X-Template': template,
        'X-Dermotec-CRM': 'true',
      },
    })
    // Email sent successfully
    return result.data?.id || null
  } catch (err) {
    console.error(`[Email] Erreur ${template}:`, err)
    return null
  }
}

// --- Fonctions raccourcis (rétrocompatibilité) ---

export async function sendBienvenueEmail(data: {
  to: string
  prenom: string
  formation_nom?: string
}) {
  return sendTemplateEmail(data.to, 'bienvenue', {
    prenom: data.prenom,
    formation_nom: data.formation_nom,
  })
}

export async function sendConfirmationInscription(data: {
  to: string
  prenom: string
  formation_nom: string
  dates: string
  horaires?: string
  lieu?: string
  montant?: string
  portail_url?: string
}) {
  return sendTemplateEmail(data.to, 'confirmation_inscription', {
    prenom: data.prenom,
    formation_nom: data.formation_nom,
    dates: data.dates,
    horaires: data.horaires || '9h00 — 17h00',
    lieu: data.lieu,
    montant: data.montant,
    portail_url: data.portail_url,
  })
}

export async function sendConvocationJ7(data: {
  to: string
  prenom: string
  formation_nom: string
  date_debut: string
  date_fin?: string
  horaire: string
  formatrice?: string
}) {
  return sendTemplateEmail(data.to, 'convocation_j7', {
    prenom: data.prenom,
    formation_nom: data.formation_nom,
    date_debut: data.date_debut,
    date_fin: data.date_fin || data.date_debut,
    horaires: data.horaire,
    formatrice: data.formatrice,
  })
}

export async function sendRappelJ1(data: {
  to: string
  prenom: string
  formation_nom: string
  horaire_debut: string
}) {
  return sendTemplateEmail(data.to, 'rappel_j1', {
    prenom: data.prenom,
    formation_nom: data.formation_nom,
    horaire_debut: data.horaire_debut,
  })
}

export async function sendSatisfactionEmail(data: {
  to: string
  prenom: string
  formation_nom: string
  portail_url: string
}) {
  return sendTemplateEmail(data.to, 'satisfaction_nps', {
    prenom: data.prenom,
    formation_nom: data.formation_nom,
    portail_url: data.portail_url,
  })
}

export async function sendCertificatEmail(data: {
  to: string
  prenom: string
  formation_nom: string
  certificat_numero: string
  portail_url: string
  duree_heures: number
  taux_presence: number
}) {
  return sendTemplateEmail(data.to, 'certificat', data)
}

export async function sendRelanceFinancementEmail(data: {
  to: string
  prenom: string
  organisme: string
  formation_nom: string
  jours_depuis: number
}) {
  return sendTemplateEmail(data.to, 'relance_financement', data)
}

export async function sendAbandonRelanceEmail(data: {
  to: string
  prenom: string
  formation_nom: string
  prochaine_session?: string
  places_restantes?: number
}) {
  return sendTemplateEmail(data.to, 'abandon_relance', data)
}

export async function sendUpsellEmail(data: {
  to: string
  prenom: string
  formation_completee: string
  formation_suggeree: string
  prix_suggeree: number
  url_inscription: string
}) {
  return sendTemplateEmail(data.to, 'upsell_j30', data)
}

export async function sendAlumniParrainageEmail(data: {
  to: string
  prenom: string
  formation_completee: string
  code_parrainage: string
  eshop_url: string
}) {
  return sendTemplateEmail(data.to, 'alumni_parrainage', data)
}

// --- Notifications internes (admin/commercial) ---

export async function sendRappelNotification(data: {
  to: string
  prenom_lead: string
  type_rappel: string
  description?: string
}) {
  const resend = getResend()
  if (!resend) return null

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Rappel — ${data.type_rappel} ${data.prenom_lead}`,
      html: `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:24px;background:#f8fafc;font-family:DM Sans,sans-serif">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:24px">
<h2 style="color:#1A1A1A;margin:0 0 12px;font-size:18px">Rappel à traiter</h2>
<p style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px;font-size:14px;color:#1E293B"><strong>${data.type_rappel}</strong> — ${data.prenom_lead}${data.description ? `<br>${data.description}` : ''}</p>
<p style="text-align:center;margin:20px 0"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'}" style="background:#FF5C00;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Ouvrir le CRM</a></p>
</div></body></html>`,
    })
    return result.data?.id || null
  } catch (err) {
    console.error('[Email] Erreur rappel:', err)
    return null
  }
}

export async function sendAdminNotification(subject: string, content: string) {
  const resend = getResend()
  if (!resend) return null

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[CRM] ${subject}`,
      html: `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:24px;background:#f8fafc;font-family:DM Sans,sans-serif">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:24px">
<h2 style="color:#1A1A1A;margin:0 0 12px;font-size:18px">${subject}</h2>
<div style="color:#334155;font-size:14px;line-height:1.6">${content}</div>
</div></body></html>`,
    })
    return result.data?.id || null
  } catch (err) {
    console.error('[Email] Erreur admin:', err)
    return null
  }
}
