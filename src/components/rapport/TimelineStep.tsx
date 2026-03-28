'use client'

import { cn } from '@/lib/utils'
import type { TimelineAction } from '@/lib/rapport/types'

interface TimelineStepProps {
  action: TimelineAction
  isLast?: boolean
  className?: string
}

export function TimelineStep({ action, isLast, className }: TimelineStepProps) {
  return (
    <div className={cn(
      'flex gap-3 pb-3',
      !isLast && 'border-b border-[#F0F0F0]',
      action.est_critique && 'bg-[#ECFDF5] rounded-lg px-3 py-2 -mx-1',
      className
    )}>
      {/* Jour */}
      <div className={cn(
        'text-[12px] font-bold min-w-[55px] shrink-0 font-mono',
        action.est_critique ? 'text-[#10B981] text-[13px]' : 'text-[#FF5C00]'
      )}>
        {action.jour}
        {action.est_critique && ' ★'}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'text-[12px] font-medium',
          action.est_critique ? 'text-[#10B981] font-bold' : 'text-[#111111]'
        )}>
          {action.action}
        </div>
        <div className="text-[10px] text-[#777777] mt-0.5">
          {action.canal} &middot; {action.objectif}
        </div>
      </div>
    </div>
  )
}
