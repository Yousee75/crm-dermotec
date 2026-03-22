// ============================================================
// CRM DERMOTEC — Design Tokens Sémantiques
// ============================================================

// Design tokens exportés comme constantes TypeScript
// Basés sur le design system existant dans globals.css
export const tokens = {
  color: {
    // Marque principale (adaptée du existant)
    brand: {
      primary: '#2EC6F3',       // Couleur branding Dermotec officielle
      hover: '#0284C7',         // sky-600 (primary-dark existant)
      subtle: 'rgba(46,198,243,0.08)', // primary Dermotec avec alpha
    },

    // États sémantiques
    success: {
      default: '#10B981',       // emerald-500 (existant)
      subtle: '#ECFDF5',        // emerald-50 (existant success-50)
      border: '#86efac',        // emerald-300
    },
    danger: {
      default: '#EF4444',       // red-500 (existant)
      subtle: '#FEF2F2',        // red-50 (existant error-50)
      border: '#fca5a5',        // red-300
    },
    warning: {
      default: '#F59E0B',       // amber-500 (existant)
      subtle: '#FFFBEB',        // amber-50 (existant warning-50)
      border: '#fed7aa',        // orange-300
    },
    info: {
      default: '#3B82F6',       // blue-500 (existant)
      subtle: '#EFF6FF',        // blue-50 (existant info-50)
      border: '#93c5fd',        // blue-300
    },

    // IA / Intelligence artificielle
    ai: {
      default: '#a855f7',       // purple-500
      subtle: '#f5f3ff',        // purple-50
      border: '#c4b5fd',        // purple-300
    },

    // Texte (hiérarchie)
    text: {
      primary: '#0F172A',       // slate-900 (existant)
      secondary: '#475569',     // slate-600 (existant)
      tertiary: '#94A3B8',      // slate-400 (existant text-muted)
      disabled: '#d4d4d8',      // zinc-300
    },

    // Surfaces et fonds
    surface: {
      default: '#FFFFFF',       // white (existant)
      hover: '#F8FAFC',         // slate-50 (existant surface-hover)
      active: '#F1F5F9',        // slate-100 (existant surface-active)
      border: '#E2E8F0',        // slate-200 (existant border)
    },

    // Sidebar (design system actuel)
    sidebar: {
      bg: '#0F172A',            // slate-900 (existant sidebar-bg)
      text: '#CBD5E1',          // slate-300 (existant sidebar-text)
      active: '#2EC6F3',        // Couleur primaire Dermotec (sidebar-active)
      hover: '#1E293B',         // slate-800 (existant sidebar-hover)
    },
  },

  // Typographie
  font: {
    display: "'Bricolage Grotesque', serif", // Headings (existant)
    body: "'DM Sans', sans-serif",            // Body text (existant)
    mono: "'Geist Mono', monospace",          // Code/data
  },

  // Rayons de bordure
  radius: {
    sm: '6px',    // existant
    md: '8px',    // existant
    lg: '12px',   // existant
    xl: '16px',   // existant
    full: '9999px', // existant
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

  // Ombres (existantes)
  shadow: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(14, 165, 233, 0.15)', // primary glow
    card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
    cardHover: '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
  },

  // Animations (existantes)
  animation: {
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.5s',
    },
    easing: {
      ease: 'ease-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }
  },

  // Breakpoints (Tailwind standard)
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
  },
} as const

// Types dérivés pour TypeScript
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
    if (value === undefined) {
      console.warn(`Token couleur introuvable: ${path}`)
      return '#000000'
    }
  }

  return value
}

// Exemples d'usage:
// getColorValue('brand.primary') → '#2EC6F3'
// getColorValue('success.subtle') → '#ECFDF5'
// tokens.radius.md → '8px'
// tokens.font.display → "'Bricolage Grotesque', serif"