'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ApiResponse {
  response: string
  suggestedAction?: 'schedule_call' | 'show_inscription' | 'show_financement' | 'fallback_contact'
}

interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left'
}

const QUICK_ACTIONS = {
  schedule_call: '📞 Réserver un appel',
  show_inscription: '✍️ S\'inscrire',
  show_financement: '💰 Voir les financements',
  fallback_contact: '📱 Nous contacter'
} as const

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Bonjour ! 👋 Je suis l\'assistante Dermotec. Comment puis-je t\'aider ? Tu peux me poser des questions sur nos formations, le financement, ou les inscriptions.',
  timestamp: Date.now()
}

export default function ChatWidget({ position = 'bottom-right' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [suggestedAction, setSuggestedAction] = useState<string | null>(null)

  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Restaurer la conversation depuis sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('dermotec_chat_messages')
    if (saved) {
      try {
        const parsedMessages = JSON.parse(saved)
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error)
      }
    }
  }, [])

  // Sauvegarder la conversation
  useEffect(() => {
    if (messages.length > 1) { // Ne pas sauvegarder seulement le message initial
      sessionStorage.setItem('dermotec_chat_messages', JSON.stringify(messages))
    }
  }, [messages])

  // Auto-scroll vers le bas
  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100)
    }
  }, [isOpen, messages, scrollToBottom])

  // Focus input quand le chat s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isTyping) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    setSuggestedAction(null)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Erreur réseau')
      }

      const data: ApiResponse = await response.json()

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])

      if (data.suggestedAction) {
        setSuggestedAction(data.suggestedAction)
      }

    } catch (error) {
      console.error('Erreur chat:', error)

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Désolée, je rencontre un problème technique. Tu peux nous appeler au 01 88 33 43 43 ou nous écrire sur WhatsApp !',
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, errorMessage])
      setSuggestedAction('fallback_contact')
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSendMessage()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'schedule_call':
        window.open('https://calendly.com/dermotec-advanced', '_blank')
        break
      case 'show_inscription':
        window.location.href = '/inscription'
        break
      case 'show_financement':
        window.location.href = '/financement'
        break
      case 'fallback_contact':
        window.open('https://wa.me/33188334343?text=Bonjour ! J\'ai une question sur vos formations.', '_blank')
        break
    }
  }

  const positionClasses = {
    'bottom-right': 'right-4',
    'bottom-left': 'left-4'
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed z-50 w-14 h-14 rounded-full shadow-lg',
          'flex items-center justify-center transition-all duration-300',
          'focus:outline-none focus:ring-4 focus:ring-[#082545]/20',
          positionClasses[position],
          // Positionnement au-dessus du bouton WhatsApp
          'bottom-24 md:bottom-24',
          isOpen
            ? 'bg-gray-700 hover:bg-gray-800 rotate-180'
            : 'bg-[#082545] hover:bg-[#0a2a4a] hover:shadow-xl hover:scale-105'
        )}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Panel de chat */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100',
            'flex flex-col overflow-hidden',
            'transition-all duration-300 ease-out',
            positionClasses[position],
            // Responsive: plein écran sur mobile, panneau sur desktop
            'bottom-20 w-[calc(100vw-2rem)] h-[calc(100vh-6rem)]',
            'md:bottom-24 md:w-[400px] md:h-[500px]',
            // Animation d'entrée
            'animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-2'
          )}
        >
          {/* Header */}
          <div className="bg-[#082545] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2EC6F3]/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-[#2EC6F3]" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">Dermotec Assistant</h3>
              <p className="text-white/70 text-xs">En ligne maintenant</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messagesRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            {messages.map((message, index) => (
              <div key={index} className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#082545] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={cn(
                  'max-w-[85%] px-4 py-2 rounded-2xl text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'bg-[#2EC6F3] text-white ml-8 rounded-br-md'
                    : 'bg-white text-gray-800 mr-8 rounded-bl-md border'
                )}>
                  {message.content}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#2EC6F3] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Indicateur de frappe */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#082545] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border px-4 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Bouton d'action suggérée */}
            {suggestedAction && !isTyping && (
              <div className="flex justify-center">
                <button
                  onClick={() => handleQuickAction(suggestedAction)}
                  className="px-4 py-2 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  {QUICK_ACTIONS[suggestedAction as keyof typeof QUICK_ACTIONS]}
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tape ton message... (Ctrl+Entrée pour envoyer)"
                className={cn(
                  'flex-1 px-3 py-2.5 rounded-lg border border-gray-200',
                  'text-sm placeholder:text-gray-400',
                  'focus:border-[#2EC6F3] focus:ring-2 focus:ring-[#2EC6F3]/20 outline-none',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                disabled={isTyping}
                maxLength={500}
              />
              <button
                onClick={handleSendMessage}
                disabled={isTyping || !input.trim()}
                className={cn(
                  'p-2.5 rounded-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-[#2EC6F3]/20',
                  input.trim() && !isTyping
                    ? 'bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white shadow-sm hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
                aria-label="Envoyer le message"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Appuyez sur Ctrl+Entrée pour envoyer rapidement
            </p>
          </div>
        </div>
      )}
    </>
  )
}