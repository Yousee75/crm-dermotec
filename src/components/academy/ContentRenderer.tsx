'use client'

import { useState } from 'react'
import { Download, ExternalLink, CheckSquare, Square, Lightbulb, AlertTriangle, Info, BookOpen, Play } from 'lucide-react'
import { QuizBlock } from './QuizBlock'
import { sanitizeEmail } from '@/lib/sanitize'
import { ScriptBlock } from './ScriptBlock'

interface ContentBlock {
  type: string
  [key: string]: unknown
}

interface ContentRendererProps {
  contenu: Record<string, unknown>
  type: string
  onComplete?: (score?: number, total?: number) => void
}

export function ContentRenderer({ contenu, type, onComplete }: ContentRendererProps) {
  switch (type) {
    case 'texte':
      return <TextContent body={contenu.body as string} />
    case 'video':
      return <VideoContent url={contenu.url as string} transcript={contenu.transcript as string | undefined} />
    case 'quiz':
      return <QuizBlock questions={contenu.questions as any[]} onComplete={(s, t) => onComplete?.(s, t)} />
    case 'checklist':
      return <ChecklistContent items={contenu.items as any[]} onComplete={() => onComplete?.()} />
    case 'script':
      return <ScriptBlock scenario={contenu.scenario as string} etapes={contenu.etapes as any[]} />
    case 'pdf':
      return <PdfContent url={contenu.url as string} titre={contenu.titre as string} />
    case 'exercice':
      return <ExerciceContent consigne={contenu.consigne as string} exemple={contenu.exemple as string | undefined} criteres={contenu.criteres as string[] | undefined} />
    default:
      return <div className="p-4 text-[#777777]">Type de contenu non supporté : {type}</div>
  }
}

// --- Text content (markdown-like) ---
function TextContent({ body }: { body: string }) {
  if (!body) return null

  const renderLine = (line: string, i: number) => {
    if (line.startsWith('# ')) {
      return <h1 key={i} className="text-2xl font-bold text-accent mt-8 mb-4">{line.slice(2)}</h1>
    }
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-bold text-accent mt-6 mb-3">{line.slice(3)}</h2>
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-semibold text-accent mt-5 mb-2">{line.slice(4)}</h3>
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return <li key={i} className="text-[15px] text-[#3A3A3A] leading-relaxed ml-4">{renderInline(line.slice(2))}</li>
    }
    if (line.startsWith('> ')) {
      return (
        <blockquote key={i} className="border-l-4 border-primary pl-4 py-2 my-3 bg-primary/5 rounded-r-lg">
          <p className="text-[15px] text-accent italic">{line.slice(2)}</p>
        </blockquote>
      )
    }
    if (line.startsWith('💡 ') || line.startsWith('[TIP]')) {
      return (
        <div key={i} className="flex gap-3 p-4 my-3 bg-[#FFF3E8] border border-[#FF8C42]/30 rounded-xl">
          <Lightbulb className="w-5 h-5 text-[#FF8C42] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#FF8C42] leading-relaxed">{line.replace(/^💡 |^\[TIP\] ?/, '')}</p>
        </div>
      )
    }
    if (line.startsWith('⚠️ ') || line.startsWith('[WARNING]')) {
      return (
        <div key={i} className="flex gap-3 p-4 my-3 bg-[#FFE0EF] border border-[#FF2D78]/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-[#FF2D78] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#FF2D78] leading-relaxed">{line.replace(/^⚠️ |^\[WARNING\] ?/, '')}</p>
        </div>
      )
    }
    if (line.startsWith('ℹ️ ') || line.startsWith('[INFO]')) {
      return (
        <div key={i} className="flex gap-3 p-4 my-3 bg-[#E0EBF5] border border-[#6B8CAE]/30 rounded-xl">
          <Info className="w-5 h-5 text-[#6B8CAE] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#6B8CAE] leading-relaxed">{line.replace(/^ℹ️ |^\[INFO\] ?/, '')}</p>
        </div>
      )
    }
    if (line.startsWith('---')) {
      return <hr key={i} className="my-6 border-[#EEEEEE]" />
    }
    if (line.trim() === '') {
      return <div key={i} className="h-3" />
    }
    return <p key={i} className="text-[15px] text-[#3A3A3A] leading-[1.8] mb-3">{renderInline(line)}</p>
  }

  const renderInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-accent">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-[#F4F0EB] px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
  }

  const lines = body.split('\n')

  return (
    <div className="prose-dermotec">
      {lines.map((line, i) => {
        const element = renderLine(line, i)
        if (typeof element === 'object' && element !== null && 'props' in element) {
          const html = (element.props as Record<string, unknown>).children
          if (typeof html === 'string' && html.includes('<')) {
            return <div key={i} dangerouslySetInnerHTML={{ __html: sanitizeEmail(renderInline(line)) }} className="text-[15px] text-[#3A3A3A] leading-[1.8] mb-3" />
          }
        }
        return element
      })}
    </div>
  )
}

// --- Video content ---
function VideoContent({ url, transcript }: { url: string; transcript?: string }) {
  const [showTranscript, setShowTranscript] = useState(false)
  const isYoutube = url?.includes('youtube') || url?.includes('youtu.be')

  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#111111]">
        {isYoutube ? (
          <iframe
            src={url.replace('watch?v=', 'embed/')}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : url ? (
          <video
            src={url}
            controls
            playsInline
            className="w-full h-full object-contain"
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Play className="w-16 h-16 text-[#777777] mx-auto mb-3" />
              <p className="text-[#999999]">Vidéo à venir</p>
            </div>
          </div>
        )}
      </div>

      {transcript && (
        <div>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
          >
            <BookOpen className="w-4 h-4" />
            {showTranscript ? 'Masquer la transcription' : 'Voir la transcription'}
          </button>
          {showTranscript && (
            <div className="mt-3 p-4 bg-[#FAF8F5] rounded-xl text-sm text-[#777777] leading-relaxed max-h-[300px] overflow-y-auto">
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Checklist content ---
function ChecklistContent({ items, onComplete }: { items: { label: string; description?: string }[]; onComplete?: () => void }) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const allChecked = checked.size === items.length

  const toggle = (index: number) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      if (next.size === items.length) onComplete?.()
      return next
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
      <div className="px-6 py-4 bg-[#FAF8F5] border-b flex items-center justify-between">
        <h3 className="font-semibold text-accent">Checklist</h3>
        <span className="text-sm text-[#777777]">{checked.size}/{items.length} complété{checked.size > 1 ? 's' : ''}</span>
      </div>
      <div className="p-4 space-y-2">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition ${
              checked.has(i) ? 'bg-[#ECFDF5]' : 'hover:bg-[#FAF8F5]'
            }`}
          >
            {checked.has(i) ? (
              <CheckSquare className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-[#999999] flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-[15px] ${checked.has(i) ? 'text-[#10B981] line-through' : 'text-accent'}`}>
                {item.label}
              </p>
              {item.description && (
                <p className="text-xs text-[#999999] mt-0.5">{item.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
      {allChecked && (
        <div className="px-6 py-3 bg-[#ECFDF5] border-t border-[#10B981]/30 text-center">
          <p className="text-sm font-semibold text-[#10B981]">✅ Checklist complète !</p>
        </div>
      )}
    </div>
  )
}

// --- PDF content ---
function PdfContent({ url, titre }: { url: string; titre: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EEEEEE] p-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-[#FFE0EF] rounded-xl flex items-center justify-center">
          <span className="text-[#FF2D78] font-bold text-lg">PDF</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-accent">{titre}</h3>
          <p className="text-sm text-[#777777]">Document téléchargeable</p>
        </div>
        <div className="flex gap-2">
          {url && (
            <>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#F4F0EB] text-[#3A3A3A] rounded-lg text-sm font-medium hover:bg-[#EEEEEE] transition"
              >
                <ExternalLink className="w-4 h-4" /> Ouvrir
              </a>
              <a
                href={url}
                download
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
              >
                <Download className="w-4 h-4" /> Télécharger
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Exercice content ---
function ExerciceContent({ consigne, exemple, criteres }: { consigne: string; exemple?: string; criteres?: string[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
      <div className="bg-[#FFE0EF] px-6 py-4 border-b border-purple-100">
        <h3 className="font-semibold text-[#FF2D78] flex items-center gap-2">
          <span className="text-lg">✍️</span> Exercice pratique
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-[#777777] uppercase tracking-wide mb-2">Consigne</h4>
          <p className="text-[15px] text-accent leading-relaxed">{consigne}</p>
        </div>

        {exemple && (
          <div className="bg-[#FAF8F5] rounded-xl p-4">
            <h4 className="text-sm font-semibold text-[#777777] mb-2">Exemple</h4>
            <p className="text-sm text-[#3A3A3A] leading-relaxed italic">{exemple}</p>
          </div>
        )}

        {criteres && criteres.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-[#777777] uppercase tracking-wide mb-2">Critères d'évaluation</h4>
            <ul className="space-y-1.5">
              {criteres.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[#3A3A3A]">
                  <span className="w-5 h-5 rounded-full bg-[#FFE0EF] text-[#FF2D78] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
