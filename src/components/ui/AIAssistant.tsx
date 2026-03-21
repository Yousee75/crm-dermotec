'use client'

import { useState } from 'react'
import { Bot, X, Send, Sparkles, Mail, Search, Shield, Loader2 } from 'lucide-react'
import { useAIGenerate, useAIObjection, useAIResearch } from '@/hooks/use-ai'
import { toast } from 'sonner'

type AIMode = 'chat' | 'email' | 'objection' | 'research'

const QUICK_ACTIONS = [
  { mode: 'email' as const, icon: Mail, label: 'Générer un email', color: 'bg-blue-500' },
  { mode: 'objection' as const, icon: Shield, label: 'Gérer une objection', color: 'bg-orange-500' },
  { mode: 'research' as const, icon: Search, label: 'Rechercher un prospect', color: 'bg-purple-500' },
]

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AIMode>('chat')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  const generateMutation = useAIGenerate()
  const objectionMutation = useAIObjection()
  const researchMutation = useAIResearch()

  const isLoading = generateMutation.isPending || objectionMutation.isPending || researchMutation.isPending

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    try {
      let data
      switch (mode) {
        case 'email':
          data = await generateMutation.mutateAsync({
            type: 'premier_contact',
            lead: { prenom: input, nb_contacts: 0 },
          })
          break
        case 'objection':
          data = await objectionMutation.mutateAsync({ objection: input })
          break
        case 'research':
          data = await researchMutation.mutateAsync({ nom: input })
          break
        default:
          data = await objectionMutation.mutateAsync({ objection: input })
      }
      setResult(data)
    } catch {
      toast.error('Erreur IA — vérifiez la configuration')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié !')
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-700 hover:bg-gray-800 rotate-90'
            : 'bg-gradient-to-br from-[#2EC6F3] to-[#3B82F6] hover:shadow-xl hover:scale-105'
        }`}
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Bot className="w-6 h-6 text-white" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-scaleIn">
          {/* Header */}
          <div className="gradient-accent px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2EC6F3]/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#2EC6F3]" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Assistant IA Dermotec</h3>
              <p className="text-white/60 text-xs">Prospection intelligente</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.mode}
                  onClick={() => { setMode(action.mode); setResult(null) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    mode === action.mode
                      ? `${action.color} text-white`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <action.icon className="w-3 h-3" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Résultat */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {!result && !isLoading && (
              <div className="text-center py-8 text-gray-400">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {mode === 'email' && 'Entrez le prénom du lead pour générer un email personnalisé'}
                  {mode === 'objection' && 'Entrez l\'objection du prospect (ex: "C\'est trop cher")'}
                  {mode === 'research' && 'Entrez le nom ou l\'entreprise du prospect'}
                  {mode === 'chat' && 'Posez votre question'}
                </p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto mb-3 text-[#2EC6F3] animate-spin" />
                <p className="text-sm text-gray-500">L'IA réfléchit...</p>
              </div>
            )}

            {result && !isLoading && (
              <div className="space-y-3">
                {/* Email result */}
                {result.objet && (
                  <>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 font-medium mb-1">Objet :</p>
                      <p className="text-sm font-medium">{String(result.objet)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">Corps :</p>
                      <div className="text-sm prose prose-sm" dangerouslySetInnerHTML={{ __html: String(result.corps || '') }} />
                    </div>
                    {result.variante_whatsapp && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-medium mb-1">WhatsApp :</p>
                        <p className="text-sm">{String(result.variante_whatsapp)}</p>
                        <button
                          onClick={() => copyToClipboard(String(result.variante_whatsapp))}
                          className="mt-2 text-xs text-green-600 hover:text-green-800"
                        >
                          Copier
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Objection result */}
                {result.reponse_courte && (
                  <>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-xs text-orange-600 font-medium mb-1">Réponse courte :</p>
                      <p className="text-sm font-medium">{String(result.reponse_courte)}</p>
                      <button
                        onClick={() => copyToClipboard(String(result.reponse_courte))}
                        className="mt-1 text-xs text-orange-600 hover:text-orange-800"
                      >
                        Copier
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">Réponse détaillée :</p>
                      <p className="text-sm">{String(result.reponse_detaillee)}</p>
                    </div>
                    {Array.isArray(result.questions_rebond) && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium mb-1">Questions rebond :</p>
                        <ul className="text-sm space-y-1">
                          {result.questions_rebond.map((q: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-400">→</span> {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* Research result */}
                {result.resume && !result.objet && !result.reponse_courte && (
                  <>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-purple-600 font-medium mb-1">Résumé :</p>
                      <p className="text-sm">{String(result.resume)}</p>
                    </div>
                    {Array.isArray(result.talking_points) && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 font-medium mb-1">Points de conversation :</p>
                        <ul className="text-sm space-y-1">
                          {result.talking_points.map((p: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-purple-400">💡</span> {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(result.opportunites) && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-medium mb-1">Opportunités :</p>
                        <ul className="text-sm space-y-1">
                          {result.opportunites.map((o: string, i: number) => (
                            <li key={i}>✅ {o}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={
                  mode === 'email' ? 'Prénom du lead...' :
                  mode === 'objection' ? 'L\'objection du prospect...' :
                  mode === 'research' ? 'Nom ou entreprise...' :
                  'Votre question...'
                }
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-1 focus:ring-[#2EC6F3]/20 outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="p-2 bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white rounded-lg transition disabled:opacity-50"
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
