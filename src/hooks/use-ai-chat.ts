// ============================================================
// CRM DERMOTEC — Hook : Assistant IA Chat
// ============================================================

import { useState, useCallback } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
  cached?: boolean
}

interface UsageInfo {
  current: number
  limit: number
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<UsageInfo>({ current: 0, limit: 50 })

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setError(null)

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const apiMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: content.trim() },
      ]

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError('Limite quotidienne atteinte. Réessayez demain.')
        } else {
          setError(data.error || 'Erreur de communication')
        }
        return
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        model: data.model,
        cached: data.cached,
      }

      setMessages(prev => [...prev, assistantMessage])
      setUsage({ current: data.usage, limit: data.limit })
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    usage,
    sendMessage,
    clearChat,
  }
}
