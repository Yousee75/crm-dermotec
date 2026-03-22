'use client'

import { useState } from 'react'
import { Copy, Check, Phone, User, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

interface ScriptStep {
  role: string
  texte: string
  note?: string
}

interface ScriptBlockProps {
  scenario: string
  etapes: ScriptStep[]
}

export function ScriptBlock({ scenario, etapes }: ScriptBlockProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const toggleNote = (index: number) => {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Script copié !')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const copyAll = () => {
    const fullScript = etapes.map(e => `${e.role}: ${e.texte}`).join('\n\n')
    navigator.clipboard.writeText(fullScript)
    toast.success('Script complet copié !')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header scénario */}
      <div className="bg-gradient-to-r from-[#082545] to-[#0F3460] px-6 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Phone className="w-5 h-5 text-primary" />
          <span className="text-primary text-sm font-semibold uppercase tracking-wide">Script de vente</span>
        </div>
        <p className="text-white text-[15px] leading-relaxed">{scenario}</p>
        <button
          onClick={copyAll}
          className="mt-3 flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition"
        >
          <Copy className="w-3 h-3" /> Copier le script complet
        </button>
      </div>

      {/* Conversation */}
      <div className="p-4 space-y-1">
        {etapes.map((etape, i) => {
          const isCommerciale = etape.role.toLowerCase().includes('commercial')
          const hasNote = !!etape.note
          const isNoteOpen = expandedNotes.has(i)

          return (
            <div key={i} className="group">
              <div className={`flex gap-3 ${isCommerciale ? '' : 'flex-row-reverse'}`}>
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                  isCommerciale ? 'bg-primary/15' : 'bg-gray-100'
                }`}>
                  {isCommerciale ? (
                    <Phone className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {/* Bulle */}
                <div className={`flex-1 max-w-[85%] ${isCommerciale ? '' : 'text-right'}`}>
                  <span className={`text-xs font-semibold mb-1 block ${
                    isCommerciale ? 'text-primary' : 'text-gray-400'
                  }`}>
                    {etape.role}
                  </span>
                  <div className={`relative inline-block rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                    isCommerciale
                      ? 'bg-primary/10 text-accent rounded-tl-sm'
                      : 'bg-gray-50 text-gray-600 rounded-tr-sm'
                  }`}>
                    <p>{etape.texte}</p>

                    {/* Copy button */}
                    {isCommerciale && (
                      <button
                        onClick={() => copyText(etape.texte, i)}
                        className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center"
                      >
                        {copiedIndex === i ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Note/conseil */}
                  {hasNote && (
                    <button
                      onClick={() => toggleNote(i)}
                      className="flex items-center gap-1 mt-1.5 text-xs text-amber-600 hover:text-amber-700 transition"
                    >
                      <Lightbulb className="w-3 h-3" />
                      Conseil
                      {isNoteOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                  {hasNote && isNoteOpen && (
                    <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 leading-relaxed">
                      💡 {etape.note}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
