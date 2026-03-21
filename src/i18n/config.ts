// ============================================================
// CRM DERMOTEC — Configuration i18n
// Locales, directions RTL, devises, fonts par culture
// ============================================================

export const locales = ['fr', 'en', 'es', 'he', 'zh'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

// RTL languages
const rtlLocales: readonly Locale[] = ['he']

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr'
}

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale)
}

// Devise par locale
export const localeCurrency: Record<Locale, string> = {
  fr: 'EUR',
  en: 'GBP',
  es: 'EUR',
  he: 'ILS',
  zh: 'CNY',
}

// Labels pour le sélecteur de langue
export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  he: 'עברית',
  zh: '中文',
}

// Flags emoji pour le sélecteur
export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  he: '🇮🇱',
  zh: '🇨🇳',
}

// Font families par locale
export const localeFonts: Record<Locale, { body: string; heading: string }> = {
  fr: { body: 'var(--font-body)', heading: 'var(--font-heading)' },
  en: { body: 'var(--font-body)', heading: 'var(--font-heading)' },
  es: { body: 'var(--font-body)', heading: 'var(--font-heading)' },
  he: { body: 'var(--font-hebrew)', heading: 'var(--font-hebrew)' },
  zh: { body: 'var(--font-chinese)', heading: 'var(--font-chinese)' },
}
