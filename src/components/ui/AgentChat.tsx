// @ts-nocheck
'use client'

import { useChat, type Message } from '@ai-sdk/react'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  Bot, X, Send, Sparkles, Loader2, ChevronDown,
  User, Wrench, CheckCircle, AlertCircle, Minimize2, Maximize2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function AgentChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  // Détecter le lead_id depuis l'URL (ex: /lead/uuid)
  const leadIdMatch = pathname.match(/\/lead\/([a-f0-9-]+)/)
  const currentLeadId = leadIdMatch ? leadIdMatch[1] : undefined

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/ai/agent-v2',
    body: { leadId: currentLeadId },
    initialMessages: [{
      id: 'welcome',
      role: 'assistant',
      content: currentLeadId
        ? 'Je suis sur la fiche de ce lead. Que veux-tu savoir ? Je peux analyser son profil, proposer un financement, ou préparer un email.'
        : 'Salut ! Je suis ton assistant commercial Dermotec. Pose-moi une question sur un lead, une objection, un financement — je cherche dans le CRM et te réponds.',
    }],
  })

  // Auto-scroll quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input quand on ouvre
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  // Reset quand on change de page lead
  useEffect(() => {
    if (currentLeadId) {
      setMessages([{
        id: 'welcome-lead',
        role: 'assistant',
        content: 'Je suis sur la fiche de ce lead. Que veux-tu savoir ? Je peux analyser son profil, proposer un financement, ou préparer un email.',
      }])
    }
  }, [currentLeadId, setMessages])

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false) }}
        className={cn(
          'fixed z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          'md:bottom-6 md:right-6 bottom-20 right-4',
          isOpen
            ? 'bg-gray-700 hover:bg-gray-800 scale-90'
            : 'bg-gradient-to-br from-[#2EC6F3] to-[#1BA8D4] hover:shadow-xl hover:scale-105'
        )}
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Bot className="w-6 h-6 text-white" />}
        {!isOpen && messages.length > 1 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {messages.filter(m => m.role === 'assistant').length - 1}
          </span>
        )}
      </button>

      {/* Panel chat */}
      {isOpen && (
        <div className={cn(
          'fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-scaleIn',
          'md:bottom-24 md:right-6 md:w-[420px]',
          'bottom-20 right-2 left-2 md:left-auto',
          isMinimized ? 'h-[56px]' : 'md:max-h-[600px] max-h-[70vh]'
        )}>
          {/* Header */}
          <div
            className="gradient-accent px-4 py-3 flex items-center gap-3 cursor-pointer shrink-0"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="w-8 h-8 rounded-full bg-[#2EC6F3]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#2EC6F3]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">Agent Commercial IA</h3>
              <p className="text-white/50 text-[11px]">
                {currentLeadId ? 'Contexte : fiche lead active' : 'Claude Sonnet · CRM Dermotec'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-white/60" />
              ) : (
                <Minimize2 className="w-4 h-4 text-white/60" />
              )}
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
                {messages.map((message) => (
                  <div key={message.id} className={cn('flex gap-2.5', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-[#2EC6F3]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-[#2EC6F3]" />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      message.role === 'user'
                        ? 'bg-[#2EC6F3] text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    )}>
                      {/* Tool invocations */}
                      {message.toolInvocations?.map((tool, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5 bg-white/80 rounded-lg px-2 py-1">
                          {tool.state === 'result' ? (
                            <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                          ) : (
                            <Loader2 className="w-3 h-3 text-[#2EC6F3] animate-spin shrink-0" />
                          )}
                          <Wrench className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {tool.toolName === 'searchLeads' && 'Recherche leads...'}
                            {tool.toolName === 'getLeadDetails' && 'Chargement fiche lead...'}
                            {tool.toolName === 'createReminder' && 'Création rappel...'}
                            {tool.toolName === 'getNextSessions' && 'Sessions disponibles...'}
                            {tool.toolName === 'analyzeFinancement' && 'Analyse financement...'}
                            {tool.toolName === 'searchKnowledgeBase' && 'Recherche KB...'}
                            {tool.toolName === 'getPlaybookResponse' && 'Playbook...'}
                          </span>
                        </div>
                      ))}
                      {/* Message content */}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-[#082545] flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#2EC6F3]/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-[#2EC6F3]" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions rapides (si peu de messages) */}
              {messages.length <= 2 && !isLoading && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {(currentLeadId ? [
                    'Analyse ce lead',
                    'Options financement ?',
                    'Prépare un email de relance',
                    'Prochaines sessions dispo',
                  ] : [
                    'Leads chauds à rappeler',
                    'Comment gérer "c\'est trop cher" ?',
                    'Sessions avec places dispo',
                    'Script premier appel',
                  ]).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        handleInputChange({ target: { value: suggestion } } as any)
                        setTimeout(() => {
                          const form = document.querySelector('[data-agent-form]') as HTMLFormElement
                          form?.requestSubmit()
                        }, 50)
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-gray-100 text-gray-600 hover:bg-[#2EC6F3]/10 hover:text-[#2EC6F3] transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form
                data-agent-form
                onSubmit={handleSubmit}
                className="px-4 py-3 border-t border-gray-100 flex gap-2 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={currentLeadId ? 'Question sur ce lead...' : 'Pose ta question...'}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-1 focus:ring-[#2EC6F3]/20 outline-none bg-gray-50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-xl transition disabled:opacity-40 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}
