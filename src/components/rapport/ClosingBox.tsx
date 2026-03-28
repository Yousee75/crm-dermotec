'use client'

import { cn } from '@/lib/utils'
import { Target } from 'lucide-react'

interface ClosingBoxProps {
  text: string
  className?: string
}

export function ClosingBox({ text, className }: ClosingBoxProps) {
  // Séparer "À toi de jouer." du reste
  const mainText = text.replace(/À toi de jouer\.?/i, '').trim()
  const hasAToiDeJouer = /À toi de jouer/i.test(text)

  return (
    <div className={cn(
      'bg-gradient-to-br from-[#111111] to-[#222222] rounded-xl p-5 md:p-6',
      'flex items-start gap-4 shadow-lg',
      className
    )}>
      {/* Icône */}
      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        <Target className="w-5 h-5 text-white" />
      </div>

      {/* Texte */}
      <div className="flex-1">
        <div className="text-[14px] leading-[1.65] text-white font-medium">
          {mainText}
        </div>
        {hasAToiDeJouer && (
          <div className="mt-3 text-[16px] font-extrabold text-[#10B981]">
            À toi de jouer.
          </div>
        )}
        <div className="mt-4 text-[9px] text-white/30 tracking-[0.1em] uppercase">
          SATOREA &middot; Semer &middot; Tisser &middot; Transformer
        </div>
      </div>
    </div>
  )
}
