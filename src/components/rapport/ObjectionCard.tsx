'use client'

import { cn } from '@/lib/utils'
import type { Objection } from '@/lib/rapport/types'
import { MessageCircleWarning, ArrowRight } from 'lucide-react'

interface ObjectionCardProps {
  objection: Objection
  className?: string
}

export function ObjectionCard({ objection, className }: ObjectionCardProps) {
  return (
    <div className={cn('rounded-xl overflow-hidden border border-[#F0F0F0] shadow-sm', className)}>
      {/* Question (rose) */}
      <div className="bg-[#FFF0F5] border-b border-[#FFD6E8] px-3 py-2.5 flex items-start gap-2">
        <MessageCircleWarning className="w-3.5 h-3.5 text-[#FF2D78] shrink-0 mt-0.5" />
        <span className="text-[12px] font-bold text-[#991B4F] leading-snug">
          &laquo; {objection.objection} &raquo;
        </span>
      </div>

      {/* Réponse (vert) */}
      <div className="px-3 py-2.5 bg-white">
        {/* Diagnostic psycho */}
        <div className="text-[10px] italic text-[#777777] mb-1.5">
          {objection.diagnostic_psychologique}
        </div>

        {/* Punchline */}
        <div className="flex items-start gap-1.5 mb-1">
          <ArrowRight className="w-3 h-3 text-[#10B981] shrink-0 mt-0.5" />
          <span className="text-[12px] font-bold text-[#065F46] leading-snug">
            {objection.reponse_principale}
          </span>
        </div>

        {/* Pivot si insistance */}
        {objection.pivot_si_insistance && (
          <div className="text-[10px] text-[#777777] mt-1.5 pl-4 border-l-2 border-[#F0F0F0]">
            Si insiste : {objection.pivot_si_insistance}
          </div>
        )}
      </div>
    </div>
  )
}
