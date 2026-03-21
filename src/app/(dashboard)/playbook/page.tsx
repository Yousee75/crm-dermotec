'use client'

import { useState } from 'react'
import { usePlaybookEntries, useVotePlaybookResponse, useRecordPlaybookResult, useCreatePlaybookEntry, useAddPlaybookResponse, useSuggestResponse } from '@/hooks/use-playbook'
import { PLAYBOOK_CATEGORIES } from '@/lib/playbook'
import {
  Shield, MessageCircle, Lightbulb, Star, Zap, Plus,
  ThumbsUp, ThumbsDown, CheckCircle, XCircle, Trophy,
  Loader2, Copy, Check, Bot, Send, ChevronDown, ChevronUp,
  Sparkles, TrendingUp, Clock
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { KpiCard } from '@/components/ui/KpiCard'
import { Dialog } from '@/components/ui/Dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const CATEGORIE_ICONS = {
  objection: Shield,
  script: MessageCircle,
  argument: Lightbulb,
  temoignage: Star,
  astuce: Zap,
}

export default function PlaybookPage() {
  const [activeCategorie, setActiveCategorie] = useState<string | undefined>(undefined)
  const [showNewModal, setShowNewModal] = useState(false)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  const { data: entries, isLoading } = usePlaybookEntries(activeCategorie)
  const voteMutation = useVotePlaybookResponse()
  const resultMutation = useRecordPlaybookResult()

  // KPIs
  const totalEntries = entries?.length || 0
  const totalResponses = entries?.reduce((acc, e) => acc + (e.responses?.length || 0), 0) || 0
  const avgSuccessRate = entries?.reduce((acc, e) => {
    const best = e.responses?.sort((a, b) => b.taux_succes - a.taux_succes)[0]
    return acc + (best?.taux_succes || 0)
  }, 0)
  const avgRate = totalEntries > 0 ? Math.round((avgSuccessRate || 0) / totalEntries) : 0

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playbook"
        description="Intelligence collective — Partagez ce qui marche"
      >
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2EC6F3] to-[#1DA1D4] text-white rounded-xl text-sm font-medium shadow-sm shadow-[#2EC6F3]/20 hover:shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Nouvelle entrée
        </button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Shield} label="Entrées" value={totalEntries} color="#F59E0B" />
        <KpiCard icon={MessageCircle} label="Réponses" value={totalResponses} color="#3B82F6" />
        <KpiCard icon={TrendingUp} label="Taux succès moy." value={`${avgRate}%`} color="#22C55E" />
        <KpiCard icon={Trophy} label="Promues en KB" value={entries?.reduce((acc, e) => acc + (e.responses?.filter(r => r.promoted_to_kb).length || 0), 0) || 0} color="#8B5CF6" />
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategorie(undefined)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition',
            !activeCategorie ? 'bg-[#082545] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Tout
        </button>
        {Object.entries(PLAYBOOK_CATEGORIES).map(([key, cat]) => {
          const Icon = CATEGORIE_ICONS[key as keyof typeof CATEGORIE_ICONS]
          return (
            <button
              key={key}
              onClick={() => setActiveCategorie(activeCategorie === key ? undefined : key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition',
                activeCategorie === key
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              style={activeCategorie === key ? { backgroundColor: cat.color } : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Liste des entrées */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto text-[#2EC6F3] animate-spin" />
        </div>
      ) : entries?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Aucune entrée dans le playbook.</p>
            <p className="text-sm text-gray-400 mt-1">Ajoutez votre première objection ou astuce !</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-4 px-4 py-2 bg-[#2EC6F3] text-white rounded-lg text-sm font-medium"
            >
              Commencer
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries?.map((entry) => {
            const cat = PLAYBOOK_CATEGORIES[entry.categorie as keyof typeof PLAYBOOK_CATEGORIES]
            const Icon = CATEGORIE_ICONS[entry.categorie as keyof typeof CATEGORIE_ICONS] || Shield
            const bestResponse = entry.responses?.sort((a, b) => {
              // Trier par taux_succes puis upvotes
              if (b.taux_succes !== a.taux_succes) return b.taux_succes - a.taux_succes
              return b.upvotes - a.upvotes
            })[0]
            const isExpanded = expandedEntry === entry.id

            return (
              <Card key={entry.id} padding="none" className="overflow-hidden">
                {/* Header de l'entrée */}
                <button
                  onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                  className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-50/50 transition"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">"{entry.titre}"</h3>
                      <Badge variant="primary" size="sm">{entry.occurences}×</Badge>
                      {bestResponse && bestResponse.taux_succes > 0 && (
                        <Badge variant={bestResponse.taux_succes >= 70 ? 'success' : 'warning'} size="sm">
                          {bestResponse.taux_succes}% succès
                        </Badge>
                      )}
                    </div>
                    {entry.contexte && (
                      <p className="text-xs text-gray-500 truncate">{entry.contexte}</p>
                    )}

                    {/* Meilleure réponse en preview */}
                    {bestResponse && !isExpanded && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2 bg-gray-50 rounded-lg px-3 py-2">
                        {bestResponse.is_ai_generated && <Bot className="w-3 h-3 inline mr-1 text-[#2EC6F3]" />}
                        {bestResponse.contenu}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{entry.responses?.length || 0} rép.</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Réponses (expandable) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50/30">
                    {entry.responses?.sort((a, b) => b.taux_succes - a.taux_succes || b.upvotes - a.upvotes).map((resp, i) => (
                      <div key={resp.id} className={cn(
                        'bg-white rounded-xl p-4 border transition',
                        i === 0 ? 'border-[#2EC6F3]/30 shadow-sm' : 'border-gray-100'
                      )}>
                        {/* Badge meilleure réponse */}
                        {i === 0 && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
                            <span className="text-[11px] font-semibold text-[#F59E0B]">Meilleure réponse</span>
                            {resp.promoted_to_kb && (
                              <Badge variant="success" size="sm">Promue en KB</Badge>
                            )}
                          </div>
                        )}

                        {/* Contenu */}
                        <div className="flex gap-2">
                          {resp.is_ai_generated && (
                            <Bot className="w-4 h-4 text-[#2EC6F3] shrink-0 mt-0.5" />
                          )}
                          <p className="text-sm text-gray-700 leading-relaxed flex-1">{resp.contenu}</p>
                          <button
                            onClick={() => copyText(resp.contenu, resp.id)}
                            className="shrink-0 p-1 rounded hover:bg-gray-100 transition text-gray-400"
                          >
                            {copiedId === resp.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-50">
                          {/* Votes */}
                          <button
                            onClick={() => voteMutation.mutate({ response_id: resp.id, vote: 'up', user_id: 'current' })}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" /> {resp.upvotes}
                          </button>
                          <button
                            onClick={() => voteMutation.mutate({ response_id: resp.id, vote: 'down', user_id: 'current' })}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" /> {resp.downvotes}
                          </button>

                          <div className="w-px h-4 bg-gray-200" />

                          {/* Résultat */}
                          <button
                            onClick={() => { resultMutation.mutate({ response_id: resp.id, result: 'succes' }); toast.success('Succès enregistré !') }}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> {resp.succes}
                          </button>
                          <button
                            onClick={() => { resultMutation.mutate({ response_id: resp.id, result: 'echec' }); toast('Échec enregistré') }}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" /> {resp.echecs}
                          </button>

                          {/* Meta */}
                          <div className="ml-auto flex items-center gap-2 text-[10px] text-gray-400">
                            {resp.author && <span>{resp.author.prenom}</span>}
                            <span>{new Date(resp.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Ajouter une réponse inline */}
                    <AddResponseInline entryId={entry.id} existingResponses={entry.responses?.map(r => r.contenu) || []} />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal nouvelle entrée */}
      {showNewModal && <NewEntryModal onClose={() => setShowNewModal(false)} />}
    </div>
  )
}

// --- Composant : Ajouter une réponse inline ---

function AddResponseInline({ entryId, existingResponses }: { entryId: string; existingResponses: string[] }) {
  const [text, setText] = useState('')
  const [showAI, setShowAI] = useState(false)
  const addMutation = useAddPlaybookResponse()
  const suggestMutation = useSuggestResponse()

  const handleAdd = () => {
    if (!text.trim()) return
    addMutation.mutate({ entry_id: entryId, contenu: text.trim() }, {
      onSuccess: () => { setText(''); toast.success('Réponse ajoutée !') },
    })
  }

  return (
    <div className="bg-white rounded-xl p-3 border border-dashed border-gray-200">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Ajouter votre réponse..."
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-1 focus:ring-[#2EC6F3]/20 outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim() || addMutation.isPending}
          className="p-2 bg-[#2EC6F3] text-white rounded-lg disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// --- Modal : Nouvelle entrée playbook ---

function NewEntryModal({ onClose }: { onClose: () => void }) {
  const [categorie, setCategorie] = useState<'objection' | 'script' | 'argument' | 'temoignage' | 'astuce'>('objection')
  const [titre, setTitre] = useState('')
  const [contexte, setContexte] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const createMutation = useCreatePlaybookEntry()
  const addResponseMutation = useAddPlaybookResponse()
  const suggestMutation = useSuggestResponse()

  const handleSuggest = () => {
    if (!titre.trim()) return
    suggestMutation.mutate({ objection: titre, contexte }, {
      onSuccess: (data) => setAiSuggestion(data.suggestion),
    })
  }

  const handleSubmit = async () => {
    if (!titre.trim()) return

    const result = await createMutation.mutateAsync({
      categorie,
      titre: titre.trim(),
      contexte: contexte.trim() || undefined,
    })

    // Si l'IA a suggéré une réponse, l'ajouter
    if (aiSuggestion && !result.merged) {
      await addResponseMutation.mutateAsync({
        entry_id: result.id,
        contenu: aiSuggestion,
        is_ai_generated: true,
      })
    }

    toast.success(result.merged ? 'Objection existante mise à jour !' : 'Entrée ajoutée au playbook !')
    onClose()
  }

  return (
    <Dialog open onClose={onClose}>
      <div className="space-y-4">
        {/* Catégorie */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Catégorie</label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(PLAYBOOK_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setCategorie(key as typeof categorie)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition',
                  categorie === key ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                style={categorie === key ? { backgroundColor: cat.color } : undefined}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Titre / Objection */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            {categorie === 'objection' ? 'L\'objection entendue' : 'Titre'}
          </label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder={categorie === 'objection' ? 'Ex: "C\'est trop cher"' : 'Titre de l\'entrée...'}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-2 focus:ring-[#2EC6F3]/10 outline-none"
          />
        </div>

        {/* Contexte */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Contexte (optionnel)</label>
          <input
            type="text"
            value={contexte}
            onChange={(e) => setContexte(e.target.value)}
            placeholder="Ex: Reconversion, intéressée microblading"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#2EC6F3] focus:ring-2 focus:ring-[#2EC6F3]/10 outline-none"
          />
        </div>

        {/* Suggestion IA */}
        {categorie === 'objection' && titre.trim() && (
          <div>
            {!aiSuggestion && !suggestMutation.isPending && (
              <button
                onClick={handleSuggest}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2EC6F3]/10 text-[#2EC6F3] text-xs font-medium hover:bg-[#2EC6F3]/20 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                L'IA suggère une réponse
              </button>
            )}

            {suggestMutation.isPending && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                L'IA réfléchit...
              </div>
            )}

            {aiSuggestion && (
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Bot className="w-3.5 h-3.5 text-[#2EC6F3]" />
                  <span className="text-[11px] font-medium text-[#2EC6F3]">Suggestion IA</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{aiSuggestion}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!titre.trim() || createMutation.isPending}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#2EC6F3] to-[#1DA1D4] text-white rounded-xl text-sm font-medium shadow-sm disabled:opacity-40 transition"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
