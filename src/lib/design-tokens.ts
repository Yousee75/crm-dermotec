// ============================================================
// CRM DERMOTEC — Design Tokens v4 "Blush & Fire"
// Rose blush + Orange feu + Noir luxe
// Inspiré : Sephora, Charlotte Tilbury, Glossier
// ============================================================

export const tokens = {
  color: {
    brand: {
      primary: '#E8627C',       // Rose blush — identité beauté
      hover: '#D14B65',         // Rose foncé — hover states
      subtle: 'rgba(232,98,124,0.08)',
    },

    action: {
      default: '#F97316',       // Orange feu — CTA (+34% clics)
      hover: '#EA6C0A',
      subtle: 'rgba(249,115,22,0.08)',
    },

    success: {
      default: '#10B981',
      subtle: '#ECFDF5',
      border: '#86efac',
    },
    danger: {
      default: '#DC2647',
      subtle: '#FFF1F3',
      border: '#F4A0B0',
    },
    warning: {
      default: '#F97316',
      subtle: '#FFFAF5',
      border: '#FDBA74',
    },
    info: {
      default: '#6B8CAE',
      subtle: '#F0F5FA',
      border: '#A0BDD6',
    },
    ai: {
      default: '#E8627C',
      subtle: '#FFF5F7',
      border: '#F4A0B0',
    },

    text: {
      primary: '#1A1A24',       // Noir charcoal (16:1 AAA)
      secondary: '#52525E',     // Gris moyen (7:1 AAA)
      tertiary: '#74747F',      // Gris (4.5:1 AA)
      disabled: '#C0C0CA',
    },

    surface: {
      default: '#FFFFFF',
      hover: '#FFF9FA',
      active: '#FFF0F2',
      border: '#F0E4E6',
    },

    sidebar: {
      bg: '#0D0D12',
      text: '#A0A0B0',
      active: '#E8627C',
      hover: '#1C1C24',
    },
  },

  font: {
    display: "'Bricolage Grotesque', serif",
    body: "'DM Sans', sans-serif",
    mono: "'Geist Mono', monospace",
  },

  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    full: '9999px',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  shadow: {
    xs: '0 1px 2px rgba(13, 13, 18, 0.05)',
    sm: '0 1px 3px rgba(13, 13, 18, 0.07), 0 1px 2px rgba(13, 13, 18, 0.04)',
    md: '0 4px 12px -2px rgba(13, 13, 18, 0.10), 0 2px 4px rgba(13, 13, 18, 0.05)',
    lg: '0 12px 24px -4px rgba(13, 13, 18, 0.12), 0 4px 8px rgba(13, 13, 18, 0.05)',
    xl: '0 24px 48px -8px rgba(13, 13, 18, 0.14), 0 8px 16px rgba(13, 13, 18, 0.05)',
    glow: '0 0 24px rgba(232, 98, 124, 0.25)',
    card: '0 1px 4px rgba(13, 13, 18, 0.04), 0 1px 2px rgba(13, 13, 18, 0.02)',
    cardHover: '0 12px 32px rgba(232, 98, 124, 0.14), 0 4px 12px rgba(13, 13, 18, 0.08)',
  },

  animation: {
    duration: { fast: '0.15s', normal: '0.25s', slow: '0.4s' },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    }
  },

  breakpoint: {
    sm: '640px', md: '768px', lg: '1024px', xl: '1280px', xxl: '1536px',
  },
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
    if (value === undefined) return '#1A1A24'
  }
  return value
}
