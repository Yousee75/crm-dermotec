// ============================================================
// CRM DERMOTEC — Design Tokens v3 "Rose Gold Elegance"
// Identité beauté/esthétique : chaleur, premium, sophistication
// ============================================================

export const tokens = {
  color: {
    // Marque principale — Rose Gold (beauté, premium, chaleur)
    brand: {
      primary: '#D4A574',
      hover: '#B8895A',
      subtle: 'rgba(212,165,116,0.08)',
    },

    // États sémantiques — tons adoucis beauté
    success: {
      default: '#6B9080',       // vert sauge (naturel, soin)
      subtle: '#F0F7F3',
      border: '#A8C5B5',
    },
    danger: {
      default: '#C25B68',       // rose foncé (pas rouge agressif)
      subtle: '#FEF2F4',
      border: '#E5A0AA',
    },
    warning: {
      default: '#D4A754',       // ambre doux
      subtle: '#FFFBF0',
      border: '#E8C98A',
    },
    info: {
      default: '#6B8CAE',       // bleu adouci
      subtle: '#F0F5FA',
      border: '#A0BDD6',
    },

    // IA / Intelligence artificielle
    ai: {
      default: '#8B5CF6',       // violet (action, créativité)
      subtle: '#EDE9FE',
      border: '#C4B5FD',
    },

    // Texte (hiérarchie — charcoal doux)
    text: {
      primary: '#2D2D3F',
      secondary: '#5C5C72',
      tertiary: '#9090A7',
      disabled: '#C8C8D8',
    },

    // Surfaces et fonds (crème chaud)
    surface: {
      default: '#FFFFFF',
      hover: '#FAF8F5',
      active: '#F5F0EA',
      border: '#E8E0D8',
    },

    // Sidebar (charcoal profond)
    sidebar: {
      bg: '#1A1A2E',
      text: '#B8B8CC',
      active: '#D4A574',
      hover: '#2A2A40',
    },
  },

  // Typographie
  font: {
    display: "'Bricolage Grotesque', serif",
    body: "'DM Sans', sans-serif",
    mono: "'Geist Mono', monospace",
  },

  // Rayons de bordure (plus arrondis pour la douceur)
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    full: '9999px',
  },

  // Espacement (8px grid)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  // Ombres — warm tint (rose gold glow)
  shadow: {
    xs: '0 1px 2px rgba(26, 26, 46, 0.04)',
    sm: '0 1px 3px rgba(26, 26, 46, 0.06), 0 1px 2px rgba(26, 26, 46, 0.04)',
    md: '0 4px 12px -2px rgba(26, 26, 46, 0.08), 0 2px 4px rgba(26, 26, 46, 0.04)',
    lg: '0 12px 24px -4px rgba(26, 26, 46, 0.10), 0 4px 8px rgba(26, 26, 46, 0.04)',
    xl: '0 24px 48px -8px rgba(26, 26, 46, 0.12), 0 8px 16px rgba(26, 26, 46, 0.04)',
    glow: '0 0 24px rgba(212, 165, 116, 0.20)',
    card: '0 1px 3px rgba(26, 26, 46, 0.04), 0 1px 2px rgba(26, 26, 46, 0.02)',
    cardHover: '0 12px 32px rgba(212, 165, 116, 0.12), 0 4px 12px rgba(26, 26, 46, 0.06)',
  },

  // Animations
  animation: {
    duration: {
      fast: '0.15s',
      normal: '0.25s',
      slow: '0.4s',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    }
  },

  // Breakpoints
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
  },
} as const

// Types dérivés
export type ColorToken = keyof typeof tokens.color
export type FontToken = keyof typeof tokens.font
export type RadiusToken = keyof typeof tokens.radius
export type SpacingToken = keyof typeof tokens.spacing

// Helper pour accéder facilement aux tokens
export const getColorValue = (path: string): string => {
  const keys = path.split('.')
  let value: any = tokens.color

  for (const key of keys) {
    value = value[key]
    if (value === undefined) return '#2D2D3F'
  }

  return value
}
