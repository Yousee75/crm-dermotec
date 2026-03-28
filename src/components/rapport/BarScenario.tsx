'use client'

import { cn } from '@/lib/utils'

interface BarScenarioProps {
  label: string
  value: number
  maxValue: number
  remboursementJours: number
  variant: 'conservateur' | 'mixte' | 'optimiste'
  highlight?: boolean
  className?: string
}

const variantStyles = {
  conservateur: { bg: 'bg-[#10B981]/20', fill: 'bg-[#10B981]/40', text: 'text-[#065F46]', label: 'text-[#777777]' },
  mixte: { bg: 'bg-[#10B981]/20', fill: 'bg-[#10B981]/60', text: 'text-[#065F46]', label: 'text-[#111111] font-bold' },
  optimiste: { bg: 'bg-[#10B981]/20', fill: 'bg-[#10B981]', text: 'text-[#000000]', label: 'text-[#777777]' },
}

export function BarScenario({ label, value, maxValue, remboursementJours, variant, highlight, className }: BarScenarioProps) {
  const s = variantStyles[variant]
  const percent = Math.min((value / maxValue) * 100, 100)

  return (
    <div className={cn('flex items-center gap-3', highlight && 'py-1', className)}>
      <span className={cn('text-[12px] min-w-[120px] shrink-0', s.label)}>
        {label} {highlight && '★'}
      </span>
      <div className={cn('flex-1 h-5 rounded overflow-hidden', s.bg)}>
        <div
          className={cn('h-full rounded flex items-center px-2 text-[10px] font-bold transition-all duration-1000 ease-out', s.fill, s.text)}
          style={{ width: `${percent}%` }}
        >
          {value.toLocaleString('fr-FR')}€/mois &middot; {remboursementJours}j
        </div>
      </div>
    </div>
  )
}
