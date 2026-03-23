// ============================================================
// CRM SATOREA — Vérification email prospect
// 100% open source, 0 API key, 0 coût
// Vérifie : format, typos, disposable, DNS/MX, SMTP mailbox
// ============================================================
import 'server-only'

import validate from 'deep-email-validator'

export interface EmailVerificationResult {
  email: string
  valid: boolean
  score: number // 0-100
  checks: {
    format: boolean
    typo: boolean // Détecte gmaill.com, yaho.com, etc.
    disposable: boolean // Jetable (mailinator, guerrillamail...)
    mx: boolean // Serveur mail existe
    smtp: boolean | null // Boîte mail existe (null si timeout)
  }
  suggestion?: string // Si typo détecté : "gmail.com" au lieu de "gmaill.com"
  reason?: string // Raison lisible si invalide
  verifiedAt: string
}

/**
 * Vérifie un email en profondeur (format + typo + disposable + DNS + SMTP)
 * Gratuit, open source, pas de limite, pas d'API key
 * Temps : 2-8 secondes (requête DNS + SMTP)
 */
export async function verifyEmail(email: string): Promise<EmailVerificationResult> {
  const now = new Date().toISOString()

  if (!email || !email.includes('@')) {
    return {
      email,
      valid: false,
      score: 0,
      checks: { format: false, typo: false, disposable: false, mx: false, smtp: null },
      reason: 'Format email invalide',
      verifiedAt: now,
    }
  }

  try {
    const result = await validate({
      email,
      validateRegex: true,
      validateMx: true,
      validateTypo: true,
      validateDisposable: true,
      validateSMTP: true,
    })

    const checks = {
      format: result.validators.regex?.valid ?? false,
      typo: result.validators.typo?.valid ?? true, // true = pas de typo
      disposable: result.validators.disposable?.valid ?? true, // true = pas disposable
      mx: result.validators.mx?.valid ?? false,
      smtp: result.validators.smtp?.valid ?? null,
    }

    // Score de confiance 0-100
    let score = 0
    if (checks.format) score += 20
    if (checks.typo) score += 15
    if (checks.disposable) score += 15
    if (checks.mx) score += 25
    if (checks.smtp === true) score += 25
    else if (checks.smtp === null) score += 10 // SMTP timeout = neutre

    // Suggestion de typo
    const suggestion = !checks.typo
      ? (result.validators.typo as any)?.reason?.replace('Did you mean ', '').replace('?', '') || undefined
      : undefined

    // Raison lisible
    let reason: string | undefined
    if (!checks.format) reason = 'Format email invalide'
    else if (!checks.typo) reason = `Typo détecté${suggestion ? ` — vouliez-vous dire ${suggestion} ?` : ''}`
    else if (!checks.disposable) reason = 'Email jetable (temporaire) — demander un vrai email'
    else if (!checks.mx) reason = 'Domaine email inexistant — pas de serveur mail'
    else if (checks.smtp === false) reason = 'Boîte mail inexistante — l\'adresse n\'existe pas'

    return {
      email,
      valid: result.valid,
      score,
      checks,
      suggestion,
      reason,
      verifiedAt: now,
    }
  } catch (error) {
    console.error('[EmailVerify] Error:', error)
    return {
      email,
      valid: false,
      score: 20, // On a au moins vérifié le format
      checks: { format: email.includes('@'), typo: true, disposable: true, mx: false, smtp: null },
      reason: 'Vérification impossible (timeout réseau)',
      verifiedAt: now,
    }
  }
}

/**
 * Vérification rapide (format + disposable seulement, pas de DNS/SMTP)
 * Instantané, 0 requête réseau
 */
export async function verifyEmailQuick(email: string): Promise<Pick<EmailVerificationResult, 'valid' | 'score' | 'reason'>> {
  if (!email || !email.includes('@')) {
    return { valid: false, score: 0, reason: 'Format invalide' }
  }

  try {
    const result = await validate({
      email,
      validateRegex: true,
      validateMx: false,
      validateTypo: true,
      validateDisposable: true,
      validateSMTP: false,
    })

    let score = 0
    if (result.validators.regex?.valid) score += 30
    if (result.validators.typo?.valid) score += 35
    if (result.validators.disposable?.valid) score += 35

    return {
      valid: result.valid,
      score,
      reason: !result.valid ? (result.reason || 'Email invalide') : undefined,
    }
  } catch {
    return { valid: true, score: 50, reason: undefined }
  }
}
