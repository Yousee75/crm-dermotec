// ============================================================
// CRM DERMOTEC — next-intl Routing
// ============================================================

import { defineRouting } from 'next-intl/routing'
import { locales, defaultLocale } from './config'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // /fr = pas de préfixe (défaut), /en/dashboard, /he/dashboard
})
