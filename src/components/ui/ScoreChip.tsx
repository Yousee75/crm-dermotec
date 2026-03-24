// ============================================================
// CRM DERMOTEC — Score Chip vivant
// Les prospects chauds pulsent, les froids sont discrets
// ============================================================

import { Flame, Thermometer, Search, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'

const SCORE_TIERS = [
  { min: 80, label: 'Chaud', icon: Flame, bg: 'bg-[#FFE0EF] text-[#FF2D78] border-[#FF2D78]/30', animate: true },
  { min: 60, label: 'Tiède', icon: Thermometer, bg: 'bg-[#FFF3E8] text-[#FF8C42] border-[#FF8C42]/30', animate: false },
  { min: 40, label: 'À qualifier', icon: Search, bg: 'bg-[#E0EBF5] text-[#6B8CAE] border-[#6B8CAE]/30', animate: false },
  { min: 0, label: 'Froid', icon: Snowflake, bg: 'bg-[#FAF8F5] text-[#999999] border-[#EEEEEE]', animate: false },
]

export { SCORE_TIERS }

interface ScoreChipProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showBar?: boolean
}

export function ScoreChip({ score, size = 'sm', showLabel = false, showBar = false }: ScoreChipProps) {
  const tier = SCORE_TIERS.find(t => score >= t.min) || SCORE_TIERS[SCORE_TIERS.length - 1]
  const Icon = tier.icon
  const isHot = score >= 80

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <span className={cn(
        'inline-flex items-center rounded-full font-semibold border transition-all',
        sizes[size],
        tier.bg,
        isHot && 'glow-hot border-[#FF2D78]/40 shadow-sm',
      )}>
        <Icon className={cn(iconSizes[size], isHot && 'animate-pulse')} />
        <span className="tabular-nums">{score}</span>
        {showLabel && <span className="ml-0.5 font-medium">{tier.label}</span>}
      </span>
      {showBar && (
        <div className="w-full h-1.5 bg-[#F4F0EB] rounded-full overflow-hidden" style={{ minWidth: 48 }}>
          <div
            className="h-full rounded-full score-fill"
            style={{
              width: `${Math.min(100, score)}%`,
              background: isHot
                ? 'linear-gradient(90deg, #FF5C00, #FF2D78)'
                : score >= 60
                ? 'linear-gradient(90deg, #FF8C42, #FF5C00)'
                : score >= 40
                ? 'linear-gradient(90deg, #6B8CAE, #FF2D78)'
                : '#E8E0D8',
            }}
          />
        </div>
      )}
    </div>
  )
}
