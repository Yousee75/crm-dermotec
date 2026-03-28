'use client'

import { cn } from '@/lib/utils'
import type { MotInterdit } from '@/lib/rapport/types'

interface VocabTableProps {
  mots: MotInterdit[]
  className?: string
}

export function VocabTable({ mots, className }: VocabTableProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {mots.map((mot, i) => (
        <div key={i} className="flex items-start gap-3 py-1.5 border-b border-[#EEEEEE] last:border-b-0">
          <span className="text-[11px] text-[#FF2D78] line-through min-w-[130px] shrink-0">
            &laquo; {mot.interdit} &raquo;
          </span>
          <span className="text-[11px] text-[#10B981] font-semibold min-w-[140px] shrink-0">
            &laquo; {mot.a_dire} &raquo;
          </span>
          <span className="text-[10px] text-[#777777]">
            {mot.raison}
          </span>
        </div>
      ))}
    </div>
  )
}
