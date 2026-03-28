'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import {
  Bot, X, Send, Loader2, Minimize2, Maximize2,
  Trash2, MessageSquare, RotateCcw, Square,
  TrendingUp, GraduationCap, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAgentChat, type AgentMode } from '@/hooks/use-agent-chat'
import { AgentWelcome } from './AgentWelcome'
import { MessageBubble } from './MessageBubble'
import { SuggestionChips } from './SuggestionChips'
import { getSuggestions, getPlaceholder } from './agent-suggestions'

// ============================================================
// AGENT PANEL — Sidebar droite pattern Intercom
// Responsive: desktop = 420px sidebar | mobile = fullscreen
// ============================================================

const SATOREA = {
  primary: '#FF5C00',
  accent: '#1A1A1A',
  bg: '#FAF8F5',
  success: '#10B981',
  action: '#FF2D78',
  muted: '#8A8A8A',
  border: '#E5E2DE',
  cardBg: '#FFFFFF',
} as const

const MODE_CONFIG: Record<AgentMode, { label: string; icon: any; color: string }> = {
  commercial: { label: 'Commercial', icon: TrendingUp, color: SATOREA.primary },
  formation: { label: 'Formation', icon: GraduationCap, color: SATOREA.action },
}

export function AgentPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const pathname = usePathname()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')

  // Detect lead page
  const leadIdMatch = (pathname ?? '').match(/\/lead\/([a-f0-9-]+)/)
  const currentLeadId = leadIdMatch ? leadIdMatch[1] : undefined

  const {
    messages,
    isStreaming,
    hasConversation,
    error,
    mode,
    messagesEndRef,
    scrollContainerRef,
    sendMessage,
    stopStreaming,
    clearChat,
    setMode,
    setFeedback,
    retry,
  } = useAgentChat({ leadId: currentLeadId })

  const modeConfig = MODE_CONFIG[mode]
  const suggestions = useMemo(
    () => getSuggestions(pathname ?? '', mode, currentLeadId),
    [pathname, mode, currentLeadId]
  )
  const placeholder = useMemo(
    () => getPlaceholder(pathname ?? '', currentLeadId),
    [pathname, currentLeadId]
  )

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, isMinimized])

  // Lock body scroll on mobile
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    setInput('')
    sendMessage(trimmed)
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto'
  }, [input, isStreaming, sendMessage])

  const handleSuggestion = useCallback((prompt: string) => {
    if (isStreaming) return
    sendMessage(prompt)
  }, [isStreaming, sendMessage])

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <>
      {/* ======== FLOATING BUTTON ======== */}
      <button
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false) }}
        aria-label={isOpen ? 'Fermer l\'assistant' : 'Ouvrir l\'assistant'}
        className={cn(
          'fixed z-[99] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 group',
          'md:bottom-6 md:right-6 bottom-20 right-4',
          isOpen && 'hidden md:flex',
        )}
        style={{
          background: isOpen ? SATOREA.accent : `linear-gradient(135deg, ${SATOREA.primary}, ${SATOREA.action})`,
        }}
      >
        {isOpen
          ? <X className="w-5 h-5 text-white" />
          : <>
              <MessageSquare className="w-6 h-6 text-white transition-transform group-hover:scale-110" />
              {/* Pulse indicator */}
              <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ backgroundColor: SATOREA.success }} />
            </>
        }
      </button>

      {/* ======== CHAT PANEL ======== */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-[100] flex flex-col overflow-hidden',
            'inset-0 md:inset-auto',
            'md:bottom-24 md:right-6 md:w-[420px] md:rounded-2xl md:shadow-2xl md:border',
            isMinimized ? 'md:h-[56px]' : 'md:max-h-[calc(100vh-120px)] md:h-[640px]',
            'transition-all duration-200',
          )}
          style={{ backgroundColor: SATOREA.bg, borderColor: SATOREA.border }}
        >
          {/* ======== HEADER ======== */}
          <div className="px-4 py-3 shrink-0" style={{ backgroundColor: SATOREA.accent }}>
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${modeConfig.color}25` }}>
                <Bot className="w-5 h-5" style={{ color: modeConfig.color }} />
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm leading-tight">
                  Agent {modeConfig.label}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isStreaming ? '#F59E0B' : SATOREA.success,
                      animation: isStreaming ? 'agent-pulse 1.5s infinite' : undefined,
                    }}
                  />
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {isStreaming ? 'Réflexion...' : 'En ligne'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5">
                {hasConversation && (
                  <button onClick={clearChat} className="p-2 rounded-lg transition hover:bg-white/10" title="Nouvelle conversation">
                    <Trash2 className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </button>
                )}
                <button onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 rounded-lg transition hover:bg-white/10 hidden md:flex">
                  {isMinimized
                    ? <Maximize2 className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                    : <Minimize2 className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                  }
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg transition hover:bg-white/10">
                  <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                </button>
              </div>
            </div>

            {/* Mode tabs */}
            {!isMinimized && (
              <div className="flex gap-1 mt-2.5">
                {(Object.keys(MODE_CONFIG) as AgentMode[]).map((m) => {
                  const cfg = MODE_CONFIG[m]
                  const ModeIcon = cfg.icon
                  const active = mode === m
                  return (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                      style={{
                        backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: active ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      <ModeIcon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {!isMinimized && (
            <>
              {/* ======== BODY ======== */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                {!hasConversation ? (
                  <AgentWelcome
                    mode={mode}
                    modeLabel={modeConfig.label}
                    suggestions={suggestions}
                    onSuggestion={handleSuggestion}
                    isStreaming={isStreaming}
                  />
                ) : (
                  <div className="px-4 py-3 space-y-4">
                    {messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        onFeedback={setFeedback}
                      />
                    ))}

                    {/* Suggestion chips after response */}
                    {messages.length >= 2 && !isStreaming && (
                      <SuggestionChips
                        suggestions={suggestions.slice(0, 3)}
                        onSelect={handleSuggestion}
                      />
                    )}

                    {/* Error with retry */}
                    {error && !isStreaming && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: '#FFE0EF', color: '#FF2D78' }}>
                        <span className="flex-1">{error}</span>
                        <button onClick={retry} className="flex items-center gap-1 font-medium hover:opacity-80">
                          <RotateCcw className="w-3 h-3" /> Réessayer
                        </button>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* ======== INPUT ======== */}
              <div className="shrink-0 px-3 py-3 safe-area-bottom"
                style={{ borderTop: `1px solid ${SATOREA.border}`, backgroundColor: SATOREA.cardBg }}>
                <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition resize-none"
                    style={{
                      backgroundColor: SATOREA.bg,
                      border: `1.5px solid ${SATOREA.border}`,
                      color: SATOREA.accent,
                      maxHeight: '120px',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = SATOREA.primary
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${SATOREA.primary}15`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = SATOREA.border
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    disabled={isStreaming}
                  />
                  {isStreaming ? (
                    <button type="button" onClick={stopStreaming}
                      className="p-2.5 rounded-xl transition shrink-0 active:scale-95"
                      style={{ backgroundColor: SATOREA.accent, color: '#FFFFFF' }}
                      title="Arrêter">
                      <Square className="w-4 h-4" />
                    </button>
                  ) : (
                    <button type="submit" disabled={!input.trim()}
                      className="p-2.5 rounded-xl transition disabled:opacity-30 shrink-0 active:scale-95"
                      style={{
                        backgroundColor: input.trim() ? SATOREA.primary : `${SATOREA.primary}40`,
                        color: '#FFFFFF',
                      }}>
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </form>

                {/* Powered by */}
                <p className="text-center text-[9px] mt-2" style={{ color: SATOREA.muted }}>
                  Agent IA Satorea · 15 outils CRM
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes agent-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .safe-area-bottom {
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </>
  )
}
