// ============================================================
// CRM SATOREA — Design Tokens v5 "Palette Officielle"
// Source : satorea_light_options.html — Option B "Blanc Chaud"
// Orange #FF5C00 · Rose #FF2D78 · Noir #1A1A1A · Papier #FAFAFA
// ============================================================

export const tokens = {
  color: {
    brand: {
      primary: '#FF5C00',       // Orange Satorea — CTA, énergie
      hover: '#E65200',
      subtle: 'rgba(255,92,0,0.08)',
    },

    action: {
      default: '#FF2D78',       // Rose hot pink — accent, distinction
      hover: '#E6186A',
      subtle: 'rgba(255,45,120,0.08)',
    },

    success: { default: '#10B981', subtle: '#ECFDF5', border: '#86EFAC' },
    danger: { default: '#FF2D78', subtle: '#FFF0F5', border: '#FF6BA8' },
    warning: { default: '#FF8C42', subtle: '#FFF3E8', border: '#FFCAAA' },
    info: { default: '#6B8CAE', subtle: '#F0F5FA', border: '#A0BDD6' },
    ai: { default: '#FF2D78', subtle: '#FFE0EF', border: '#FF6BA8' },

    text: {
      primary: '#111111',       // Noir graphique (19:1 AAA)
      secondary: '#3A3A3A',     // Gris foncé (10:1 AAA)
      tertiary: '#777777',      // Gris moyen (4.5:1 AA)
      disabled: '#CCCCCC',
    },

    surface: {
      default: '#FFFFFF',
      hover: '#FAFAFA',         // Blanc chaud papier
      active: '#F5F5F5',
      border: '#EEEEEE',
    },

    sidebar: {
      bg: '#111111',
      text: '#999999',
      active: '#FF5C00',
      hover: '#222222',
    },
  },

  font: {
    display: "'Bricolage Grotesque', serif",
    body: "'DM Sans', sans-serif",
    mono: "'Geist Mono', monospace",
  },

  radius: { sm: '6px', md: '10px', lg: '14px', xl: '18px', full: '9999px' },

  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px' },

  shadow: {
    xs: '0 1px 2px rgba(26,26,26,0.05)',
    sm: '0 1px 3px rgba(26,26,26,0.07), 0 1px 2px rgba(26,26,26,0.04)',
    md: '0 4px 12px -2px rgba(26,26,26,0.10), 0 2px 4px rgba(26,26,26,0.05)',
    lg: '0 12px 24px -4px rgba(26,26,26,0.12), 0 4px 8px rgba(26,26,26,0.05)',
    xl: '0 24px 48px -8px rgba(26,26,26,0.14), 0 8px 16px rgba(26,26,26,0.05)',
    glow: '0 0 24px rgba(255,92,0,0.25)',
    card: '0 1px 3px rgba(0,0,0,0.08)',
    cardHover: '0 12px 32px rgba(255,92,0,0.12), 0 4px 12px rgba(26,26,26,0.08)',
  },

  animation: {
    duration: { fast: '0.15s', normal: '0.25s', slow: '0.4s' },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    }
  },

  breakpoint: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', xxl: '1536px' },
} as const

export type ColorToken = keyof typeof tokens.color
export type FontToken = keyof typeof tokens.font
export type RadiusToken = keyof typeof tokens.radius
export type SpacingToken = keyof typeof tokens.spacing

export const getColorValue = (path: string): string => {
  const keys = path.split('.')
  let value: any = tokens.color
  for (const key of keys) {
    value = value[key]
    if (value === undefined) return '#111111'
  }
  return value
}
