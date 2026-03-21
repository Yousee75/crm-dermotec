// ============================================================
// CRM DERMOTEC — next-intl Request Config (Server-side)
// Charge les messages de traduction pour la locale courante
// ============================================================

import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import type { Locale } from './config'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Vérifier que la locale est supportée
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale
  }

  // Charger les fichiers de messages (split par domaine métier)
  const messages = (await import(`../../messages/${locale}.json`)).default

  return {
    locale,
    messages,
  }
})
