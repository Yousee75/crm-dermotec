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
const MAX_STORED_MESSAGES = 50

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

function saveState(state: StoredState) {
  if (typeof window === 'undefined') return
  try {
    const trimmed = {
      ...state,
      messages: state.messages.slice(-MAX_STORED_MESSAGES),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch { /* quota exceeded */ }
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

  const hasConversation = messages.some(m => m.role === 'user')

  // ---- SEND MESSAGE ----
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

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

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          // AI SDK v6 UIMessage stream protocol
          // Format: TYPE:JSON\n
          try {
            // Text deltas: 0:"text"
            if (line.startsWith('0:')) {
              const text = JSON.parse(line.slice(2))
              if (typeof text === 'string') {
                fullText += text
                setMessages(prev => prev.map((m, i) =>
                  i === prev.length - 1 && m.role === 'assistant'
                    ? { ...m, parts: [...toolParts, { type: 'text' as const, text: fullText }] }
                    : m
                ))
              }
              continue
            }

            // Tool call start: b:{toolCallId, toolName, args}
            if (line.startsWith('b:')) {
              const toolData = JSON.parse(line.slice(2))
              const newPart: AgentPart = {
                type: 'tool-invocation',
                toolCallId: toolData.toolCallId,
                toolName: toolData.toolName,
                state: 'partial-call',
                args: toolData.args,
              }
              toolParts = [...toolParts, newPart]
              setMessages(prev => prev.map((m, i) =>
                i === prev.length - 1 && m.role === 'assistant'
                  ? { ...m, parts: [...toolParts, ...(fullText ? [{ type: 'text' as const, text: fullText }] : [])] }
                  : m
              ))
              continue
            }

            // Tool result: c:{toolCallId, result}
            if (line.startsWith('c:')) {
              const toolResult = JSON.parse(line.slice(2))
              toolParts = toolParts.map(p =>
                p.type === 'tool-invocation' && p.toolCallId === toolResult.toolCallId
                  ? { ...p, state: 'output-available', output: toolResult.result }
                  : p
              )
              setMessages(prev => prev.map((m, i) =>
                i === prev.length - 1 && m.role === 'assistant'
                  ? { ...m, parts: [...toolParts, ...(fullText ? [{ type: 'text' as const, text: fullText }] : [])] }
                  : m
              ))
              continue
            }

            // Fallback: try old data: format
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const chunk = JSON.parse(line.slice(6))
                if (chunk.type === 'text-delta' && chunk.delta) {
                  fullText += chunk.delta
                  setMessages(prev => prev.map((m, i) =>
                    i === prev.length - 1 && m.role === 'assistant'
                      ? { ...m, parts: [...toolParts, { type: 'text' as const, text: fullText }] }
                      : m
                  ))
                }
              } catch { /* invalid chunk */ }
            }
          } catch { /* parse error, skip line */ }
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
