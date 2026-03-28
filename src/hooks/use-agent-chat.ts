'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ============================================================
// HOOK: useAgentChat — Logique agent IA extraite
// Features: streaming SSE, localStorage persistence, auto-scroll,
//           abort controller, conversation ID, feedback
// ============================================================

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  parts: AgentPart[]
  timestamp: number
  feedback?: 'up' | 'down' | null
}

export type AgentPart =
  | { type: 'text'; text: string }
  | { type: 'tool-invocation'; toolCallId: string; toolName: string; state: string; args?: any; output?: any; errorText?: string }

export type AgentMode = 'commercial' | 'formation'

const STORAGE_KEY = 'satorea-agent-chat'
const MAX_STORED_MESSAGES = 30
const REQUEST_COOLDOWN_MS = 1500 // Anti-flood: 1.5s between messages
const MAX_STORAGE_BYTES = 500_000 // 500KB max localStorage

interface StoredState {
  messages: AgentMessage[]
  mode: AgentMode
  conversationId: string
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function loadState(): StoredState {
  if (typeof window === 'undefined') {
    return { messages: [], mode: 'commercial', conversationId: generateId() }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        messages: parsed.messages || [],
        mode: parsed.mode || 'commercial',
        conversationId: parsed.conversationId || generateId(),
      }
    }
  } catch { /* corrupted */ }
  return { messages: [], mode: 'commercial', conversationId: generateId() }
}

function stripSensitiveData(messages: AgentMessage[]): AgentMessage[] {
  return messages.map(m => ({
    ...m,
    parts: m.parts.map(p => {
      if (p.type === 'tool-invocation') {
        // Strip tool outputs containing PII (leads, emails, phones)
        return { ...p, output: undefined, args: undefined }
      }
      return p
    }),
  }))
}

function saveState(state: StoredState) {
  if (typeof window === 'undefined') return
  try {
    const trimmed = {
      ...state,
      messages: stripSensitiveData(state.messages.slice(-MAX_STORED_MESSAGES)),
    }
    const json = JSON.stringify(trimmed)
    // Check size before saving
    if (json.length > MAX_STORAGE_BYTES) {
      // Keep only last 10 messages if too large
      trimmed.messages = stripSensitiveData(state.messages.slice(-10))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } else {
      localStorage.setItem(STORAGE_KEY, json)
    }
  } catch {
    // QuotaExceededError — clear and keep minimal
    try {
      const minimal = { ...state, messages: state.messages.slice(-5).map(m => ({ ...m, parts: m.parts.filter(p => p.type === 'text') })) }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
}

export interface UseAgentChatOptions {
  leadId?: string
}

export function useAgentChat(options: UseAgentChatOptions = {}) {
  const { leadId } = options

  const [messages, setMessages] = useState<AgentMessage[]>(() => loadState().messages)
  const [mode, setModeState] = useState<AgentMode>(() => loadState().mode)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastRequestRef = useRef(0) // Anti-flood timestamp
  const conversationIdRef = useRef(loadState().conversationId)
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Persist on change
  useEffect(() => {
    saveState({
      messages,
      mode,
      conversationId: conversationIdRef.current,
    })
  }, [messages, mode])

  // Auto-scroll with RAF to avoid race condition
  useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [messages])

  // Cleanup abort on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  // Sync state across tabs via StorageEvent
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        const synced = JSON.parse(e.newValue)
        if (synced.messages) setMessages(synced.messages)
        if (synced.mode) setModeState(synced.mode)
      } catch { /* corrupted sync */ }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const hasConversation = messages.some(m => m.role === 'user')

  // ---- SEND MESSAGE ----
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    // Anti-flood: 1.5s cooldown between messages
    const now = Date.now()
    if (now - lastRequestRef.current < REQUEST_COOLDOWN_MS) {
      setError('Trop rapide. Attendez un instant.')
      return
    }
    lastRequestRef.current = now

    setError(null)

    const userMsg: AgentMessage = {
      id: `u-${generateId()}`,
      role: 'user',
      parts: [{ type: 'text', text: trimmed }],
      timestamp: Date.now(),
    }
    const assistantMsg: AgentMessage = {
      id: `a-${generateId()}`,
      role: 'assistant',
      parts: [],
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsStreaming(true)

    // Build history for API
    const history = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.parts.filter(p => p.type === 'text').map(p => (p as any).text).join('') || '',
    })).filter(m => m.content)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/agent-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: history,
          leadId,
          mode,
        }),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        if (res.status === 401) throw new Error('Session expirée. Reconnectez-vous.')
        if (res.status === 429) throw new Error('Trop de requêtes. Attendez un moment.')
        throw new Error(`Erreur serveur (${res.status})`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('Stream non disponible')

      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''
      let toolParts: AgentPart[] = []

      // Helper to update the assistant message
      const updateAssistant = () => {
        const parts: AgentPart[] = [
          ...toolParts,
          ...(fullText ? [{ type: 'text' as const, text: fullText }] : []),
        ]
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 && m.role === 'assistant'
            ? { ...m, parts }
            : m
        ))
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        // SSE uses double newline as separator, but lines within can be single
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue

          // AI SDK v6 UIMessageStream format: data: {"type":"...","..."}\n\n
          if (trimmed.startsWith('data: ')) {
            try {
              const part = JSON.parse(trimmed.slice(6))

              // Text delta — the main content
              if (part.type === 'text-delta' && part.textDelta) {
                fullText += part.textDelta
                updateAssistant()
                continue
              }

              // Tool call — agent is calling a CRM tool
              if (part.type === 'tool-call') {
                const newPart: AgentPart = {
                  type: 'tool-invocation',
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  state: 'partial-call',
                  args: part.args,
                }
                toolParts = [...toolParts, newPart]
                updateAssistant()
                continue
              }

              // Tool result — tool has returned data
              if (part.type === 'tool-result') {
                toolParts = toolParts.map(p =>
                  p.type === 'tool-invocation' && p.toolCallId === part.toolCallId
                    ? { ...p, state: 'output-available', output: part.result }
                    : p
                )
                updateAssistant()
                continue
              }

              // Start step — new reasoning step (reset text for multi-step)
              if (part.type === 'start-step') {
                // Keep accumulated text, new step may add more
                continue
              }

              // Finish step / finish message — ignore (handled by final state)
              if (part.type === 'finish-step' || part.type === 'finish') {
                continue
              }

              // Error from server
              if (part.type === 'error') {
                const errorText = part.errorText || part.error || 'Erreur serveur'
                fullText += `\n\nErreur : ${errorText}`
                updateAssistant()
                continue
              }
            } catch {
              // Invalid JSON in SSE line — skip
            }
          }
        }
      }

      // Ensure final state is set
      if (fullText || toolParts.length > 0) {
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 && m.role === 'assistant'
            ? { ...m, parts: [...toolParts, ...(fullText ? [{ type: 'text' as const, text: fullText }] : [])], timestamp: Date.now() }
            : m
        ))
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      const errorMsg = err.message || 'Erreur de connexion'
      setError(errorMsg)
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 && m.role === 'assistant'
          ? { ...m, parts: [{ type: 'text' as const, text: `Erreur : ${errorMsg}` }] }
          : m
      ))
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [messages, isStreaming, leadId, mode])

  // ---- ACTIONS ----
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const clearChat = useCallback(() => {
    setMessages([])
    conversationIdRef.current = generateId()
    setError(null)
  }, [])

  const setMode = useCallback((newMode: AgentMode) => {
    setModeState(newMode)
    // Don't clear messages on mode switch — user can continue
  }, [])

  const setFeedback = useCallback((messageId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, feedback } : m
    ))
  }, [])

  const retry = useCallback(() => {
    // Find last user message and resend
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) return
    const text = lastUserMsg.parts.find(p => p.type === 'text')
    if (!text || text.type !== 'text') return
    // Remove last user + assistant pair
    setMessages(prev => prev.slice(0, -2))
    setError(null)
    // Use setTimeout to let state update before sending
    setTimeout(() => sendMessage((text as any).text), 50)
  }, [messages, sendMessage])

  return {
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
  }
}
