// ============================================================
// CRM DERMOTEC — Score Chip visuel
// Affiche le score avec icône température + couleur
// ============================================================

import { Flame, Thermometer, Search, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'

const SCORE_TIERS = [
  { min: 80, label: 'Chaud', icon: Flame, bg: 'bg-red-50 text-red-700 border-red-200' },
  { min: 60, label: 'Tiede', icon: Thermometer, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { min: 40, label: 'A qualifier', icon: Search, bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { min: 0, label: 'Froid', icon: Snowflake, bg: 'bg-gray-50 text-gray-500 border-gray-200' },
]

export { SCORE_TIERS }

export function ScoreChip({ score }: { score: number }) {
  const tier = SCORE_TIERS.find(t => score >= t.min) || SCORE_TIERS[SCORE_TIERS.length - 1]
  const Icon = tier.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border', tier.bg)}>
      <Icon className="w-3 h-3" />
      {score}
    </span>
  )
}
