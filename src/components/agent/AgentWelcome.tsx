'use client'

import { Bot, ChevronRight } from 'lucide-react'
import type { AgentMode } from '@/hooks/use-agent-chat'
import type { SuggestionCard } from './agent-suggestions'

const SATOREA = {
  primary: '#FF5C00',
  accent: '#1A1A1A',
  action: '#FF2D78',
  muted: '#8A8A8A',
  cardBg: '#FFFFFF',
  border: '#E5E2DE',
} as const

interface AgentWelcomeProps {
  mode: AgentMode
  modeLabel: string
  suggestions: SuggestionCard[]
  onSuggestion: (prompt: string) => void
  isStreaming: boolean
}

export function AgentWelcome({ mode, modeLabel, suggestions, onSuggestion, isStreaming }: AgentWelcomeProps) {
  return (
    <div className="flex flex-col items-center px-5 pt-8 pb-4">
      {/* Bot avatar */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `linear-gradient(135deg, ${SATOREA.primary}20, ${SATOREA.action}15)` }}
      >
        <Bot className="w-8 h-8" style={{ color: SATOREA.primary }} />
      </div>

      <h2 className="text-lg font-bold mb-1" style={{ color: SATOREA.accent }}>
        Agent {modeLabel}
      </h2>
      <p className="text-sm mb-1 font-medium" style={{ color: SATOREA.accent }}>
        Dermotec Advanced
      </p>
      <p className="text-[13px] text-center mb-6 max-w-[280px] leading-relaxed" style={{ color: SATOREA.muted }}>
        {mode === 'commercial'
          ? 'Je vous aide à convertir vos prospects en inscriptions.'
          : 'Je vous accompagne sur Qualiopi, sessions et stagiaires.'
        }
      </p>

      {/* Suggestion cards */}
      <div className="w-full space-y-2.5">
        {suggestions.map((card) => {
          const CardIcon = card.icon
          return (
            <button
              key={card.prompt}
              onClick={() => onSuggestion(card.prompt)}
              disabled={isStreaming}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: SATOREA.cardBg, border: `1px solid ${SATOREA.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${SATOREA.primary}10` }}>
                <CardIcon className="w-5 h-5" style={{ color: SATOREA.primary }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: SATOREA.accent }}>{card.title}</p>
                <p className="text-xs" style={{ color: SATOREA.muted }}>{card.subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: SATOREA.muted }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
