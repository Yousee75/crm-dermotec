// ============================================================
// CRM DERMOTEC — Service Email (Resend)
// Pattern: lazy init + silent fallback + templates inline
// ============================================================

import { Resend } from 'resend'

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

// --- Templates inline ---
function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'DM Sans',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#082545;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
    <h1 style="color:#2EC6F3;font-size:20px;margin:0;font-weight:600">Dermotec Advanced</h1>
    <p style="color:#94a3b8;font-size:12px;margin:4px 0 0">Centre de Formation Esthétique Certifié Qualiopi</p>
  </div>
  <div style="background:#ffffff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:0">
    ${content}
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">
    Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris<br>
    01 88 33 43 43 — dermotec.fr@gmail.com
  </p>
</div>
</body>
</html>`
}

// --- Fonctions d'envoi ---

export async function sendBienvenueEmail(data: {
  to: string
  prenom: string
  formation_nom?: string
}) {
  const resend = getResend()
  if (!resend) return null

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Bienvenue chez Dermotec, ${data.prenom} !`,
      html: wrapHtml(`
        <h2 style="color:#082545;margin:0 0 12px">Bienvenue ${data.prenom} !</h2>
        <p style="color:#334155;line-height:1.6">Merci pour votre intérêt pour ${data.formation_nom || 'nos formations'}.</p>
        <p style="color:#334155;line-height:1.6">Notre équipe vous contactera sous <strong>24h</strong> pour répondre à toutes vos questions et vous accompagner dans votre projet.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="https://wa.me/33188334343" style="display:inline-block;background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Nous écrire sur WhatsApp</a>
        </div>
        <p style="color:#64748b;font-size:13px">À très vite,<br><strong>L'équipe Dermotec</strong></p>
      `),
    })
    console.log('[Email] Bienvenue envoyé à', data.to, result.data?.id)
    return result.data?.id || null
  } catch (err) {
    console.error('[Email] Erreur envoi bienvenue:', err)
    return null
  }
}

export async function sendConfirmationInscription(data: {
  to: string
  prenom: string
  formation_nom: string
  dates: string
  lieu?: string
  montant?: string
}) {
  const resend = getResend()
  if (!resend) return null

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Inscription confirmée — ${data.formation_nom}`,
      html: wrapHtml(`
        <h2 style="color:#082545;margin:0 0 12px">Inscription confirmée !</h2>
        <p style="color:#334155;line-height:1.6">${data.prenom}, votre inscription est confirmée :</p>
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Formation :</strong> ${data.formation_nom}</p>
          <p style="margin:0 0 8px"><strong>Dates :</strong> ${data.dates}</p>
          <p style="margin:0 0 8px"><strong>Lieu :</strong> ${data.lieu || '75 Bd Richard Lenoir, 75011 Paris'}</p>
          ${data.montant ? `<p style="margin:0"><strong>Montant :</strong> ${data.montant}</p>` : ''}
        </div>
        <p style="color:#334155;line-height:1.6">Vous recevrez une convocation 7 jours avant le début de la formation.</p>
      `),
    })
    console.log('[Email] Confirmation inscription envoyée à', data.to)
    return result.data?.id || null
  } catch (err) {
    console.error('[Email] Erreur confirmation inscription:', err)
    return null
  }
}

export async function sendConvocationJ7(data: {
  to: string
  prenom: string
  formation_nom: string
  date_debut: string
  horaire: string
}) {
  const resend = getResend()
  if (!resend) return null

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Votre formation dans 7 jours — ${data.formation_nom}`,
      html: wrapHtml(`
        <h2 style="color:#082545;margin:0 0 12px">Plus que 7 jours !</h2>
        <p style="color:#334155;line-height:1.6">${data.prenom}, votre formation approche :</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>${data.formation_nom}</strong></p>
          <p style="margin:0 0 8px">📅 ${data.date_debut}</p>
          <p style="margin:0 0 8px">⏰ ${data.horaire}</p>
          <p style="margin:0">📍 75 Bd Richard Lenoir, 75011 Paris</p>
        </div>
        <h3 style="color:#082545;margin:16px 0 8px">À apporter :</h3>
        <ul style="color:#334155;line-height:1.8">
          <li>Pièce d'identité</li>
          <li>De quoi prendre des notes</li>
          <li>Tenue confortable</li>
        </ul>
      `),
    })
    return result.data?.id || null
  } catch (err) {
    console.error('[Email] Erreur convocation:', err)
    return null
  }
}

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
      subject: `Rappel CRM — ${data.type_rappel} ${data.prenom_lead}`,
      html: wrapHtml(`
        <h2 style="color:#082545;margin:0 0 12px">Rappel à traiter</h2>
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Type :</strong> ${data.type_rappel}</p>
          <p style="margin:0 0 8px"><strong>Lead :</strong> ${data.prenom_lead}</p>
          ${data.description ? `<p style="margin:0"><strong>Note :</strong> ${data.description}</p>` : ''}
        </div>
        <div style="text-align:center;margin:20px 0">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crm.dermotec.fr'}" style="display:inline-block;background:#2EC6F3;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Ouvrir le CRM</a>
        </div>
      `),
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
      subject: `[CRM Dermotec] ${subject}`,
      html: wrapHtml(content),
    })
    return result.data?.id || null
  } catch (err) {
    console.error('[Email] Erreur admin notification:', err)
    return null
  }
}
