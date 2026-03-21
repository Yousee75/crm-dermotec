// ============================================================
// CRM DERMOTEC — Safe Logging (RGPD-compliant)
// Sanitize les données personnelles avant console.log/error
// Évite les fuites PII dans les logs Vercel/Sentry
// ============================================================

const PII_PATTERNS: Array<{ key: string; mask: (v: string) => string }> = [
  { key: 'email', mask: (v) => v.replace(/(.{2}).*@/, '$1***@') },
  { key: 'telephone', mask: () => '06 ** ** ** **' },
  { key: 'phone', mask: () => '06 ** ** ** **' },
  { key: 'prenom', mask: (v) => v[0] + '***' },
  { key: 'nom', mask: (v) => v[0] + '***' },
  { key: 'firstName', mask: (v) => v[0] + '***' },
  { key: 'lastName', mask: (v) => v[0] + '***' },
  { key: 'ip_address', mask: () => '***.***.***.***' },
  { key: 'siret', mask: () => '*** *** *** *****' },
  { key: 'entreprise_siret', mask: () => '*** *** *** *****' },
]

/**
 * Sanitize un objet pour supprimer les PII avant logging.
 * Remplace les champs sensibles par des valeurs masquées.
 */
export function sanitizeForLog(data: unknown): unknown {
  if (data === null || data === undefined) return data
  if (typeof data === 'string') return data
  if (typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map(sanitizeForLog)
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const pattern = PII_PATTERNS.find(p => key.toLowerCase().includes(p.key))
    if (pattern && typeof value === 'string' && value.length > 0) {
      sanitized[key] = pattern.mask(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

/**
 * Console.error safe pour production — sanitize automatiquement les PII.
 */
export function safeError(context: string, error: unknown, data?: Record<string, unknown>) {
  const sanitizedData = data ? sanitizeForLog(data) : undefined
  const errorMsg = error instanceof Error ? error.message : String(error)

  // Ne jamais logger le stack complet en production
  if (process.env.NODE_ENV === 'production') {
    console.error(`[${context}]`, errorMsg, sanitizedData || '')
  } else {
    console.error(`[${context}]`, error, sanitizedData || '')
  }
}

/**
 * Console.log safe — sanitize les données avant logging.
 */
export function safeLog(context: string, message: string, data?: Record<string, unknown>) {
  const sanitizedData = data ? sanitizeForLog(data) : undefined
  console.log(`[${context}]`, message, sanitizedData || '')
}
