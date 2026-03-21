// ============================================================
// CRM DERMOTEC — Validateurs
// ============================================================

export function validateEmail(value: string): string | null {
  if (!value) return null
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(value) ? null : 'Email invalide'
}

export function validatePhone(value: string): string | null {
  if (!value) return null
  const cleaned = value.replace(/[\s.\-()]/g, '')
  if (/^(?:0[1-9]|\\+33[1-9])\d{8}$/.test(cleaned)) return null
  return 'Téléphone invalide (format FR : 0X XX XX XX XX)'
}

export function validateSiret(value: string): string | null {
  if (!value) return null
  const cleaned = value.replace(/\s/g, '')
  if (/^\d{14}$/.test(cleaned)) return null
  return 'SIRET invalide (14 chiffres)'
}

export function validateCodePostal(value: string): string | null {
  if (!value) return null
  if (/^(0[1-9]|[1-8]\d|9[0-8])\d{3}$/.test(value)) return null
  return 'Code postal invalide'
}

export function validateMontant(value: string): string | null {
  if (!value) return null
  const num = parseFloat(value.replace(/[,\s€]/g, '').replace(',', '.'))
  if (!isNaN(num) && num >= 0) return null
  return 'Montant invalide'
}

export function validateUrl(value: string): string | null {
  if (!value) return null
  try {
    new URL(value)
    return null
  } catch {
    return 'URL invalide'
  }
}

export function validateDateFuture(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'Date invalide'
  if (date <= new Date()) return 'La date doit être dans le futur'
  return null
}

export function validateAge(value: string): string | null {
  if (!value) return null
  const age = parseInt(value)
  if (isNaN(age) || age < 16 || age > 99) return 'Âge invalide (16-99)'
  return null
}

export function validateRequired(value: string): string | null {
  if (!value || !value.trim()) return 'Ce champ est requis'
  return null
}

export function validateNPS(value: string): string | null {
  if (!value) return null
  const n = parseInt(value)
  if (isNaN(n) || n < 0 || n > 10) return 'Score NPS entre 0 et 10'
  return null
}

export function validateSatisfaction(value: string): string | null {
  if (!value) return null
  const n = parseInt(value)
  if (isNaN(n) || n < 1 || n > 5) return 'Note entre 1 et 5'
  return null
}
