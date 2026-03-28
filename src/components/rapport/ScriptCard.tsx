'use client'

import { cn } from '@/lib/utils'
import type { ScriptStep } from '@/lib/rapport/types'
import { Phone } from 'lucide-react'

interface ScriptCardProps {
  steps: ScriptStep[]
  prospectName: string
  className?: string
}

export function ScriptCard({ steps, prospectName, className }: ScriptCardProps) {
  return (
    <div className={cn('rounded-xl overflow-hidden border border-[#EEEEEE] shadow-sm', className)}>
      {/* Header gradient */}
      <div className="bg-gradient-to-r from-[#111111] to-[#222222] px-4 py-2.5 flex items-center gap-2">
        <Phone className="w-4 h-4 text-[#FF5C00]" />
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-white">
          Script d'appel — Lire mot pour mot
        </span>
        <span className="ml-auto text-[10px] text-white/50 font-mono">
          ~{steps.reduce((t, s) => t + s.duree_secondes, 0)}s
        </span>
      </div>

      {/* Steps */}
      <div className="bg-gradient-to-b from-[#FFF0E5] to-white p-4 space-y-3">
        {steps.map((step) => (
          <div key={step.numero} className="flex gap-3 items-start">
            {/* Numéro */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: step.numero === 4 ? '#10B981' : '#FF5C00' }}
              >
                {String(step.numero).padStart(2, '0')}
              </div>
              <span className="text-[8px] text-[#999999] mt-0.5 font-mono">{step.duree_secondes}s</span>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-bold text-[#FF5C00] uppercase tracking-wider mb-1">
                {step.nom}
              </div>
              <div className="text-[13px] leading-[1.75] text-[#111111] italic">
                {highlightScript(step.texte, prospectName)}
              </div>
              <div className="text-[10px] text-[#777777] mt-1 bg-[#FF5C00]/5 px-2 py-1 rounded">
                {step.conseil}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Met en surbrillance les chiffres et le nom du prospect dans le script */
function highlightScript(texte: string, prospectName: string): React.ReactNode {
  // Remplacer les chiffres importants et le nom par des spans colorés
  const parts = texte.split(new RegExp(`(${escapeRegExp(prospectName)}|\\d[\\d\\s]*[€%]|\\d+\\/\\d+|OPCO|Qualiopi|0\\s*€|100\\s*%)`, 'gi'))

  return parts.map((part, i) => {
    if (!part) return null
    const isHighlight = new RegExp(`${escapeRegExp(prospectName)}|\\d[\\d\\s]*[€%]|\\d+\\/\\d+|OPCO|Qualiopi|0\\s*€|100\\s*%`, 'gi').test(part)

    if (isHighlight) {
      return (
        <span key={i} className="not-italic font-bold bg-[#FF5C00]/10 text-[#FF5C00] px-1 rounded">
          {part}
        </span>
      )
    }
    return part
  })
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
