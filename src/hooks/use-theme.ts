'use client'

// Thème forcé LIGHT — pas de dark mode (règle CLAUDE.md #8)
// La palette Satorea officielle est uniquement en mode clair

export function useTheme() {
  return {
    theme: 'light' as const,
    setTheme: () => {},
    isDark: false,
    toggleTheme: () => {},
  }
}
