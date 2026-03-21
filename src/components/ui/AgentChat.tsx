// @ts-nocheck
'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Bot, X, Send, Sparkles, Loader2,
  User, Wrench, CheckCircle, Minimize2, Maximize2,
  Phone, Mail, Calendar, CreditCard, BookOpen,
  BarChart3, Bell, ArrowRight, Copy, ExternalLink,
  RefreshCw, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// --- Tool Result Renderers ---
// Cartes visuelles pour les résultats des tools (au lieu de JSON brut)

function ToolResultCard({ toolName, result }: { toolName: string; result: any }) {
  // Think tool : ne rien afficher (réflexion privée de l'agent)
  if (toolName === 'think') return null

  if (!result || result.error) {
    return (
      <div className="text-xs text-red-500 bg-red-50 rounded-lg px-2.5 py-1.5 mt-1">
        {result?.error || 'Erreur'}
      </div>
    )
  }

  switch (toolName) {
    case 'searchLeads':
      if (!result.leads?.length) return <div className="text-xs text-gray-400 mt-1">Aucun lead trouvé</div>
      return (
        <div className="mt-1.5 space-y-1">
          {result.leads.slice(0, 3).map((lead: any) => (
            <Link
              key={lead.id}
              href={`/lead/${lead.id}`}
              className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-2 border border-gray-100 hover:border-[#2EC6F3]/30 transition group"
            >
              <div className="w-7 h-7 rounded-full bg-[#2EC6F3]/10 flex items-center justify-center text-[10px] font-bold text-[#2EC6F3]">
                {lead.prenom?.[0]}{lead.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{lead.prenom} {lead.nom}</p>
                <p className="text-[10px] text-gray-400 truncate">{lead.statut} · Score {lead.score_chaud}</p>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-[#2EC6F3] transition shrink-0" />
            </Link>
          ))}
          {result.count > 3 && <p className="text-[10px] text-gray-400 text-center">+{result.count - 3} autres</p>}
        </div>
      )

    case 'getNextSessions':
      if (!result.sessions?.length) return <div className="text-xs text-gray-400 mt-1">Aucune session disponible</div>
      return (
        <div className="mt-1.5 space-y-1">
          {result.sessions.slice(0, 4).map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-2 border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex flex-col items-center justify-center shrink-0">
                <span className="text-[8px] text-violet-500 uppercase leading-none">{new Date(s.date_debut).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                <span className="text-xs font-bold text-violet-700 leading-tight">{new Date(s.date_debut).getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{s.formation}</p>
                <p className="text-[10px] text-gray-400">{s.horaires} · {s.prix_ht}€ HT</p>
              </div>
              <span className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                s.complet ? 'bg-red-50 text-red-600' : s.places_restantes <= 2 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
              )}>
                {s.complet ? 'Complet' : `${s.places_restantes} places`}
              </span>
            </div>
          ))}
        </div>
      )

    case 'analyzeFinancement':
      return (
        <div className="mt-1.5 space-y-1">
          <div className="bg-white rounded-lg px-2.5 py-2 border border-gray-100">
            <p className="text-[10px] text-gray-400 mb-1">{result.formation} · {result.prix_ht}€ HT</p>
            {result.recommandations?.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1 border-t border-gray-50 first:border-0">
                <div>
                  <p className="text-xs font-medium text-gray-900">{r.organisme}</p>
                  <p className="text-[10px] text-gray-400">{r.delai}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-xs font-bold', r.reste_a_charge === '0€' ? 'text-green-600' : 'text-amber-600')}>
                    {r.reste_a_charge === '0€' ? 'Gratuit' : `RAC: ${r.reste_a_charge}`}
                  </p>
                  <p className="text-[10px] text-gray-400">{r.taux_prise_en_charge}</p>
                </div>
              </div>
            ))}
          </div>
          {result.script_telephone && (
            <button
              onClick={() => { navigator.clipboard.writeText(result.script_telephone.replace(/^"|"$/g, '')); toast.success('Script copié') }}
              className="flex items-center gap-1.5 text-[10px] text-[#2EC6F3] hover:text-[#1BA8D4] transition"
            >
              <Copy className="w-3 h-3" /> Copier le script téléphone
            </button>
          )}
        </div>
      )

    case 'createReminder':
      return (
        <div className="mt-1.5 flex items-center gap-2 bg-green-50 rounded-lg px-2.5 py-2 border border-green-100">
          <Bell className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-xs text-green-700">{result.message}</p>
        </div>
      )

    case 'updateLeadStatus':
      return (
        <div className="mt-1.5 flex items-center gap-2 bg-blue-50 rounded-lg px-2.5 py-2 border border-blue-100">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700">{result.message}</p>
        </div>
      )

    case 'sendEmail':
      return (
        <div className={cn('mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2 border',
          result.mode === 'envoye' ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'
        )}>
          <Mail className={cn('w-4 h-4 shrink-0', result.mode === 'envoye' ? 'text-green-600' : 'text-amber-600')} />
          <p className={cn('text-xs', result.mode === 'envoye' ? 'text-green-700' : 'text-amber-700')}>{result.message}</p>
        </div>
      )

    case 'getPlaybookResponse':
      if (!result.found) return <div className="text-xs text-gray-400 mt-1">{result.message}</div>
      return (
        <div className="mt-1.5 bg-white rounded-lg px-2.5 py-2 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <BookOpen className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-medium text-orange-600">Playbook · {result.taux_succes} succès</span>
            {result.validee_equipe && <span className="text-[10px] bg-green-50 text-green-600 px-1 rounded">Validée</span>}
          </div>
          {result.meilleure_reponse && (
            <>
              <p className="text-xs text-gray-700 italic">"{result.meilleure_reponse}"</p>
              <button
                onClick={() => { navigator.clipboard.writeText(result.meilleure_reponse); toast.success('Réponse copiée') }}
                className="flex items-center gap-1 text-[10px] text-[#2EC6F3] mt-1 hover:text-[#1BA8D4]"
              >
                <Copy className="w-3 h-3" /> Copier
              </button>
            </>
          )}
        </div>
      )

    case 'getPipelineStats':
      return (
        <div className="mt-1.5 grid grid-cols-3 gap-1">
          {[
            { label: 'Leads actifs', value: result.total_leads_actifs, color: 'text-blue-600' },
            { label: 'Score moy.', value: result.score_moyen, color: 'text-amber-600' },
            { label: 'Rappels retard', value: result.rappels_en_retard, color: result.rappels_en_retard > 0 ? 'text-red-600' : 'text-green-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg px-2 py-1.5 border border-gray-100 text-center">
              <p className={cn('text-sm font-bold', stat.color)}>{stat.value}</p>
              <p className="text-[9px] text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )

    case 'getProactiveInsights':
      if (!result.urgences?.length && !result.insights?.length) return null
      return (
        <div className="mt-1.5 space-y-1">
          {result.urgences?.map((u: string, i: number) => (
            <div key={i} className="text-xs bg-red-50 text-red-700 rounded-lg px-2.5 py-1.5 border border-red-100">
              {u}
            </div>
          ))}
          {result.insights?.map((ins: string, i: number) => (
            <div key={i} className="text-xs bg-blue-50 text-blue-700 rounded-lg px-2.5 py-1.5 border border-blue-100">
              {ins}
            </div>
          ))}
        </div>
      )

    case 'findSimilarSuccess':
      if (!result.found) return <div className="text-xs text-gray-400 mt-1">{result.message}</div>
      return (
        <div className="mt-1.5 bg-white rounded-lg px-2.5 py-2 border border-gray-100">
          <p className="text-[10px] text-gray-400 mb-1">Basé sur {result.nb_leads_similaires} leads similaires</p>
          <div className="grid grid-cols-2 gap-1.5">
            {result.contacts_moyens && (
              <div className="text-center">
                <p className="text-sm font-bold text-[#2EC6F3]">{result.contacts_moyens}</p>
                <p className="text-[9px] text-gray-400">contacts moy.</p>
              </div>
            )}
            {result.delai_conversion_jours && (
              <div className="text-center">
                <p className="text-sm font-bold text-green-600">{result.delai_conversion_jours}j</p>
                <p className="text-[9px] text-gray-400">délai conversion</p>
              </div>
            )}
            {result.financement_principal && (
              <div className="text-center">
                <p className="text-sm font-bold text-violet-600">{result.financement_principal.organisme}</p>
                <p className="text-[9px] text-gray-400">financement #1</p>
              </div>
            )}
            {result.satisfaction_moyenne && (
              <div className="text-center">
                <p className="text-sm font-bold text-amber-600">{result.satisfaction_moyenne}/5</p>
                <p className="text-[9px] text-gray-400">satisfaction</p>
              </div>
            )}
          </div>
        </div>
      )

    default:
      return null // Ne pas afficher le JSON brut
  }
}

// --- Tool name to French label ---
const TOOL_LABELS: Record<string, { label: string; icon: any; hidden?: boolean }> = {
  think: { label: 'Réflexion...', icon: Sparkles, hidden: true },
  searchLeads: { label: 'Recherche leads', icon: User },
  getLeadDetails: { label: 'Fiche lead', icon: User },
  getProactiveInsights: { label: 'Analyse urgences', icon: Bell },
  findSimilarSuccess: { label: 'Leads similaires', icon: BarChart3 },
  createReminder: { label: 'Création rappel', icon: Bell },
  getNextSessions: { label: 'Sessions dispo', icon: Calendar },
  analyzeFinancement: { label: 'Analyse financement', icon: CreditCard },
  searchKnowledgeBase: { label: 'Base de connaissances', icon: BookOpen },
  getPlaybookResponse: { label: 'Playbook', icon: BookOpen },
  getPipelineStats: { label: 'Stats pipeline', icon: BarChart3 },
  updateLeadStatus: { label: 'Changement statut', icon: RefreshCw },
  sendEmail: { label: 'Envoi email', icon: Mail },
}

// --- Main Component ---
export function AgentChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  const leadIdMatch = pathname.match(/\/lead\/([a-f0-9-]+)/)
  const currentLeadId = leadIdMatch ? leadIdMatch[1] : undefined

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, reload } = useChat({
    api: '/api/ai/agent-v2',
    body: { leadId: currentLeadId },
    initialMessages: [{
      id: 'welcome',
      role: 'assistant',
      content: currentLeadId
        ? 'Je suis sur la fiche de ce lead. Que veux-tu savoir ?'
        : 'Pose-moi une question sur un lead, une objection, un financement.',
    }],
    onError: (err) => {
      console.error('[AgentChat] Error:', err.message)
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen, isMinimized])

  useEffect(() => {
    if (currentLeadId) {
      setMessages([{
        id: `welcome-${currentLeadId}`,
        role: 'assistant',
        content: 'Je suis sur la fiche de ce lead. Analyse, financement, relance — dis-moi.',
      }])
    }
  }, [currentLeadId, setMessages])

  const clearChat = useCallback(() => {
    setMessages([{
      id: 'welcome-clear',
      role: 'assistant',
      content: currentLeadId
        ? 'Conversation effacée. Que veux-tu savoir sur ce lead ?'
        : 'Conversation effacée. Comment je peux t\'aider ?',
    }])
  }, [currentLeadId, setMessages])

  // Suggestions contextuelles dynamiques
  const suggestions = currentLeadId
    ? ['Analyse ce lead', 'Options financement', 'Prépare un email de relance', 'Prochaines sessions']
    : ['Leads chauds à rappeler', 'Comment gérer "c\'est trop cher" ?', 'Stats pipeline', 'Script premier appel']

  const submitSuggestion = (text: string) => {
    handleInputChange({ target: { value: text } } as any)
    setTimeout(() => {
      const form = document.querySelector('[data-agent-form]') as HTMLFormElement
      form?.requestSubmit()
    }, 50)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false) }}
        className={cn(
          'fixed z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          'md:bottom-6 md:right-6 bottom-20 right-4',
          isOpen ? 'bg-gray-700 hover:bg-gray-800 scale-90' : 'bg-gradient-to-br from-[#2EC6F3] to-[#1BA8D4] hover:shadow-xl hover:scale-105'
        )}
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Bot className="w-6 h-6 text-white" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className={cn(
          'fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-scaleIn',
          'md:bottom-24 md:right-6 md:w-[420px]',
          'bottom-20 right-2 left-2 md:left-auto',
          isMinimized ? 'h-[56px]' : 'md:max-h-[620px] max-h-[70vh]'
        )}>
          {/* Header */}
          <div className="gradient-accent px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#2EC6F3]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#2EC6F3]" />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
              <h3 className="text-white font-semibold text-sm">Agent Commercial</h3>
              <p className="text-white/50 text-[11px]">
                {isLoading ? 'Réflexion en cours...' : currentLeadId ? 'Fiche lead active' : 'Claude Sonnet · 10 outils CRM'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/10 transition" title="Effacer">
                <Trash2 className="w-3.5 h-3.5 text-white/40" />
              </button>
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5 text-white/60" /> : <Minimize2 className="w-3.5 h-3.5 text-white/60" />}
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
                {messages.map((message) => (
                  <div key={message.id} className={cn('flex gap-2', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-[#2EC6F3]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-[#2EC6F3]" />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed',
                      message.role === 'user'
                        ? 'bg-[#2EC6F3] text-white rounded-br-sm'
                        : 'bg-gray-50 text-gray-800 rounded-bl-sm'
                    )}>
                      {/* Tool invocations with visual results */}
                      {message.toolInvocations?.map((toolInvocation, i) => {
                        const toolInfo = TOOL_LABELS[toolInvocation.toolName] || { label: toolInvocation.toolName, icon: Wrench }
                        const ToolIcon = toolInfo.icon

                        // Masquer le tool "think" complètement (réflexion privée de l'agent)
                        if (toolInfo.hidden && toolInvocation.state === 'result') return null

                        return (
                          <div key={i}>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1">
                              {toolInvocation.state === 'result' ? (
                                <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                              ) : (
                                <Loader2 className="w-3 h-3 text-[#2EC6F3] animate-spin shrink-0" />
                              )}
                              <ToolIcon className="w-3 h-3 shrink-0" />
                              <span>{toolInfo.label}</span>
                            </div>
                            {toolInvocation.state === 'result' && (
                              <ToolResultCard toolName={toolInvocation.toolName} result={toolInvocation.result} />
                            )}
                          </div>
                        )
                      })}
                      {message.content && (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-[#082545] flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && !messages.some(m => m.toolInvocations?.some(t => t.state !== 'result')) && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#2EC6F3]/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3 text-[#2EC6F3]" />
                    </div>
                    <div className="bg-gray-50 rounded-2xl rounded-bl-sm px-3 py-2">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions */}
              {messages.length <= 2 && !isLoading && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => submitSuggestion(s)}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-gray-100 text-gray-600 hover:bg-[#2EC6F3]/10 hover:text-[#2EC6F3] transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form data-agent-form onSubmit={handleSubmit} className="px-3 py-2.5 border-t border-gray-100 flex gap-2 shrink-0">
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
                  className="p-2 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-xl transition disabled:opacity-40 shrink-0"
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
