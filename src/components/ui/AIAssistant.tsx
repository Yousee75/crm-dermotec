'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bot, X, Send, Sparkles, Mail, MessageCircle, Phone, Smartphone,
  Target, Shield, TrendingUp, CreditCard, Zap, Copy, Check,
  ChevronRight, Loader2, FileText, ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import type { AssistantAction } from '@/lib/ai-commercial'

interface AIAssistantProps {
  leadId?: string
  leadName?: string
  onSendMessage?: (canal: string, content: string) => void
}

interface ActionButton {
  action: AssistantAction
  icon: React.ElementType
  label: string
  shortLabel: string
  color: string
  description: string
}

const ACTIONS: ActionButton[] = [
  { action: 'suggest_next_action', icon: Target, label: 'Prochaine action', shortLabel: 'Action', color: 'bg-[#2EC6F3]', description: 'Que faire maintenant ?' },
  { action: 'draft_email', icon: Mail, label: 'Rédiger email', shortLabel: 'Email', color: 'bg-blue-500', description: 'Email personnalisé' },
  { action: 'draft_whatsapp', icon: MessageCircle, label: 'Message WhatsApp', shortLabel: 'WhatsApp', color: 'bg-green-500', description: 'Message court et percutant' },
  { action: 'draft_sms', icon: Smartphone, label: 'SMS', shortLabel: 'SMS', color: 'bg-purple-500', description: 'SMS 160 caractères' },
  { action: 'handle_objection', icon: Shield, label: 'Gérer objection', shortLabel: 'Objection', color: 'bg-orange-500', description: '"C\'est trop cher", "Je réfléchis"...' },
  { action: 'analyze_lead', icon: TrendingUp, label: 'Analyser le lead', shortLabel: 'Analyse', color: 'bg-indigo-500', description: 'Brief commercial complet' },
  { action: 'financement_eligibility', icon: CreditCard, label: 'Éligibilité financement', shortLabel: 'Finance', color: 'bg-emerald-500', description: 'OPCO, CPF, France Travail' },
  { action: 'closing_script', icon: Zap, label: 'Script de closing', shortLabel: 'Closing', color: 'bg-red-500', description: 'Le lead est chaud !' },
  { action: 'draft_relance', icon: ArrowRight, label: 'Relance', shortLabel: 'Relance', color: 'bg-amber-500', description: 'Lead silencieux depuis X jours' },
]

interface AIResult {
  content: string
  copyable_texts?: { label: string; text: string; canal?: string }[]
  suggested_actions?: { label: string; action: AssistantAction; input?: string }[]
}

export default function AIAssistant({ leadId, leadName, onSendMessage }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<AIResult | null>(null)
  const [currentAction, setCurrentAction] = useState<AssistantAction | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // Raccourci clavier Ctrl+J pour ouvrir
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Focus input à l'ouverture
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  // Scroll résultat en bas
  useEffect(() => {
    if (result) resultRef.current?.scrollTo(0, resultRef.current.scrollHeight)
  }, [result])

  const executeAction = useCallback(async (action: AssistantAction, customInput?: string) => {
    setIsLoading(true)
    setCurrentAction(action)
    setResult(null)

    try {
      const res = await fetch('/api/ai/commercial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          lead_id: leadId,
          input: customInput || input,
        }),
      })

      if (!res.ok) throw new Error('Erreur API')
      const data = await res.json()
      setResult(data)
      setInput('')
    } catch {
      toast.error('Erreur IA — vérifiez la configuration')
    } finally {
      setIsLoading(false)
    }
  }, [leadId, input])

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Copié dans le presse-papier !')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const sendDirectly = (canal: string, text: string) => {
    if (onSendMessage) {
      onSendMessage(canal, text)
      toast.success(`Message envoyé via ${canal}`)
    } else {
      copyText(text, -1)
    }
  }

  const needsInput = (action: AssistantAction): boolean => {
    return ['handle_objection', 'draft_relance', 'free_question'].includes(action)
  }

  const handleActionClick = (action: AssistantAction) => {
    if (needsInput(action)) {
      setCurrentAction(action)
      setResult(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      executeAction(action)
    }
  }

  const handleSubmit = () => {
    if (!input.trim() && !currentAction) return
    const action = currentAction || 'free_question'
    executeAction(action, input)
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 group ${
          isOpen
            ? 'bg-gray-700 hover:bg-gray-800 rotate-90'
            : 'bg-gradient-to-br from-[#2EC6F3] to-[#082545] hover:shadow-xl hover:scale-105'
        }`}
        title="Assistant IA (Ctrl+J)"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <>
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#082545] px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#2EC6F3]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#2EC6F3]" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">Copilote Commercial IA</h3>
              <p className="text-white/50 text-xs">
                {leadName ? `Lead : ${leadName}` : 'Sélectionne un lead pour plus de contexte'}
              </p>
            </div>
            <kbd className="text-white/30 text-xs bg-white/10 px-1.5 py-0.5 rounded">Ctrl+J</kbd>
          </div>

          {/* Actions rapides */}
          <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {ACTIONS.map((a) => (
                <button
                  key={a.action}
                  onClick={() => handleActionClick(a.action)}
                  disabled={isLoading}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    currentAction === a.action
                      ? `${a.color} text-white shadow-sm`
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                  title={a.description}
                >
                  <a.icon className="w-3 h-3" />
                  {a.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Résultat */}
          <div ref={resultRef} className="flex-1 overflow-y-auto px-4 py-3 min-h-[200px]">
            {!result && !isLoading && (
              <div className="text-center py-6 text-gray-400">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium mb-1">
                  {leadId ? `Prêt à aider avec ${leadName}` : 'Ton copilote de vente IA'}
                </p>
                <p className="text-xs text-gray-300">
                  {currentAction === 'handle_objection' ? 'Tape l\'objection du prospect...' :
                   currentAction === 'draft_relance' ? 'Depuis combien de jours ? (ex: "5 jours")' :
                   currentAction === 'free_question' ? 'Pose ta question...' :
                   leadId ? 'Clique sur une action ci-dessus' : 'Ouvre une fiche lead pour plus de contexte'}
                </p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto mb-3 text-[#2EC6F3] animate-spin" />
                <p className="text-sm text-gray-500">
                  {currentAction === 'analyze_lead' ? 'Analyse du profil en cours...' :
                   currentAction === 'handle_objection' ? 'Préparation de la réponse...' :
                   currentAction === 'financement_eligibility' ? 'Vérification éligibilité...' :
                   'L\'IA réfléchit...'}
                </p>
              </div>
            )}

            {result && !isLoading && (
              <div className="space-y-3">
                {/* Contenu principal */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {result.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-bold text-[#082545] mt-2 first:mt-0">{line.replace(/\*\*/g, '')}</p>
                      }
                      if (line.startsWith('**')) {
                        const parts = line.split('**')
                        return (
                          <p key={i} className="mt-1">
                            <strong className="text-[#082545]">{parts[1]}</strong>
                            {parts[2]}
                          </p>
                        )
                      }
                      if (line.startsWith('→') || line.startsWith('•') || line.startsWith('✅')) {
                        return <p key={i} className="ml-2 text-gray-600">{line}</p>
                      }
                      return line ? <p key={i} className="text-gray-700">{line}</p> : <br key={i} />
                    })}
                  </div>
                </div>

                {/* Textes copiables */}
                {result.copyable_texts && result.copyable_texts.length > 0 && (
                  <div className="space-y-2">
                    {result.copyable_texts.map((item, i) => (
                      <div key={i} className="border border-gray-200 rounded-xl p-3 hover:border-[#2EC6F3]/50 transition">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-500">{item.label}</span>
                          <div className="flex gap-1">
                            {item.canal && onSendMessage && (
                              <button
                                onClick={() => sendDirectly(item.canal!, item.text)}
                                className="flex items-center gap-1 text-xs px-2 py-0.5 bg-[#2EC6F3] text-white rounded-md hover:bg-[#1BA8D4] transition"
                              >
                                <Send className="w-3 h-3" />
                                Envoyer
                              </button>
                            )}
                            <button
                              onClick={() => copyText(item.text, i)}
                              className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition"
                            >
                              {copiedIndex === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              {copiedIndex === i ? 'Copié' : 'Copier'}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions suggérées */}
                {result.suggested_actions && result.suggested_actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.suggested_actions.map((sa, i) => (
                      <button
                        key={i}
                        onClick={() => executeAction(sa.action, sa.input)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#2EC6F3]/10 text-[#2EC6F3] rounded-lg hover:bg-[#2EC6F3]/20 transition font-medium"
                      >
                        <ChevronRight className="w-3 h-3" />
                        {sa.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder={
                  currentAction === 'handle_objection' ? '"C\'est trop cher", "Je dois réfléchir"...' :
                  currentAction === 'draft_relance' ? 'Depuis combien de jours ? (ex: 5 jours)' :
                  'Question libre ou sélectionne une action...'
                }
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-1 focus:ring-[#2EC6F3]/20 outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || (!input.trim() && !currentAction)}
                className="p-2.5 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-xl transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
