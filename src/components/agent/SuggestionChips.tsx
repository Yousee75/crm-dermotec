'use client'

import type { SuggestionCard } from './agent-suggestions'

const SATOREA = {
  primary: '#FF5C00',
} as const

interface SuggestionChipsProps {
  suggestions: SuggestionCard[]
  onSelect: (prompt: string) => void
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  if (!suggestions.length) return null

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {suggestions.map((s) => (
        <button
          key={s.prompt}
          onClick={() => onSelect(s.prompt)}
          className="px-3 py-1.5 rounded-full text-[11px] font-medium transition hover:shadow-sm active:scale-95"
          style={{
            backgroundColor: `${SATOREA.primary}10`,
            color: SATOREA.primary,
            border: `1px solid ${SATOREA.primary}20`,
          }}
        >
          {s.title}
        </button>
      ))}
    </div>
  )
}
