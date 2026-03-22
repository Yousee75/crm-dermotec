'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, X, Send, Trash2, Sparkles, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAIChat } from '@/hooks/use-ai-chat'

// Suggestions contextuelles par page
const PAGE_SUGGESTIONS: Record<string, { title: string; suggestions: string[] }> = {
  '/': {
    title: 'Dashboard',
    suggestions: ['Résume mes KPIs du jour', 'Quels leads relancer en priorité ?', 'Rédige un email de bienvenue'],
  },
  '/leads': {
    title: 'Prospects',
    suggestions: ['Comment qualifier ce prospect ?', 'Rédige un email de premier contact', 'Quel statut pour ce lead ?'],
  },
  '/pipeline': {
    title: 'Pipeline',
    suggestions: ['Analyse mon taux de conversion', 'Quels deals vont se fermer ?', 'Conseils pour débloquer un lead'],
  },
  '/sessions': {
    title: 'Sessions',
    suggestions: ['Combien de places restantes ?', 'Génère une convocation', 'Prochaines sessions à planifier ?'],
  },
  '/analytics': {
    title: 'Analytics',
    suggestions: ['Analyse mes performances ce mois', 'Compare avec le mois dernier', 'Quel est mon CA ce trimestre ?'],
  },
  '/concurrents': {
    title: 'Concurrents',
    suggestions: ['Analyse ce concurrent', 'Quels sont ses points faibles ?', 'Comment se différencier ?'],
  },
  '/outils': {
    title: 'Outils',
    suggestions: ['Aide-moi à reformuler ce texte', 'Calcule la TVA sur 1500€ HT', 'Explique le financement OPCO'],
  },
  '/financement': {
    title: 'Financement',
    suggestions: ['Quels organismes contacter ?', 'Checklist documents OPCO', 'Différence CPF et OPCO ?'],
  },
  '/inscriptions': {
    title: 'Inscriptions',
    suggestions: ['Statut des inscriptions en cours', 'Documents manquants ?', 'Relancer les paiements en attente'],
  },
  '/qualite': {
    title: 'Qualité',
    suggestions: ['Explique les 7 critères Qualiopi', 'Préparer un audit', 'Documents obligatoires ?'],
  },
}

const DEFAULT_SUGGESTIONS = {
  title: 'Assistant',
  suggestions: ['Comment puis-je vous aider ?', 'Rédige un email professionnel', 'Explique le financement OPCO'],
}

// Pages rapides
const QUICK_PAGES = [
  { label: 'Prospects', href: '/leads' },
  { label: 'Sessions', href: '/sessions' },
  { label: 'Outils', href: '/outils' },
  { label: 'Concurrents', href: '/concurrents' },
]

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const { messages, isLoading, error, usage, sendMessage, clearChat } = useAIChat()

  // Suggestions basées sur la page courante
  const currentSuggestions = useMemo(() => {
    const basePath = '/' + (pathname?.split('/')[1] || '')
    return PAGE_SUGGESTIONS[basePath] || PAGE_SUGGESTIONS[pathname || ''] || DEFAULT_SUGGESTIONS
  }, [pathname])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) {
      // Délai pour laisser l'animation finir avant focus
      const timer = setTimeout(() => inputRef.current?.focus(), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (text: string) => {
    sendMessage(text)
  }

  return (
    <>
      {/* Bouton flottant — z-[70] pour être au-dessus de tout */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[70] bg-gradient-to-br from-[#2EC6F3] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-shadow"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: 'spring', damping: 20, stiffness: 300 }}
        aria-label="Assistant IA"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
        {!isOpen && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Widget chat — z-[70] */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-[70] w-[400px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col"
            style={{ maxHeight: 'min(560px, calc(100vh - 120px))' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#082545] to-[#0F3460] text-white px-4 py-3 flex items-center justify-between shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Assistant Dermotec</p>
                  <p className="text-[10px] text-white/50">
                    {currentSuggestions.title} · {usage.current}/{usage.limit} req/jour
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={clearChat}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Effacer"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Quick nav pages */}
            <div className="flex gap-1.5 px-3 py-2 border-b border-gray-100 shrink-0 overflow-x-auto">
              {QUICK_PAGES.map(page => (
                <a
                  key={page.href}
                  href={page.href}
                  className={`text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                    pathname?.startsWith(page.href)
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {page.label}
                </a>
              ))}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 200 }}>
              {messages.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-6 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#2EC6F3]/10 to-[#0EA5E9]/10 flex items-center justify-center">
                    <Bot size={28} className="text-primary" />
                  </div>
                  <p className="font-medium text-gray-600 text-sm">
                    {currentSuggestions.title === 'Assistant'
                      ? 'Comment puis-je vous aider ?'
                      : `Aide sur la page ${currentSuggestions.title}`}
                  </p>
                  <div className="space-y-1.5 px-2">
                    {currentSuggestions.suggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full flex items-center justify-between text-left text-xs bg-gray-50 hover:bg-primary/5 hover:border-primary/30 border border-gray-100 rounded-lg px-3 py-2.5 transition-all group"
                      >
                        <span>{suggestion}</span>
                        <ArrowRight size={12} className="text-gray-300 group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.cached && (
                      <p className="text-[10px] mt-1 opacity-50">⚡ cache</p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Input — z-[80] pour être sûr qu'il est cliquable */}
            <div className="border-t border-gray-100 p-3 shrink-0 bg-white rounded-b-2xl relative z-[80]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-gray-400"
                  disabled={isLoading}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-primary hover:bg-[#0EA5E9] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-3 transition-all hover:shadow-md active:scale-95"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
