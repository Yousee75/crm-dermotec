'use client'

import { Flame } from 'lucide-react'

interface StreakCounterProps {
  days: number
  size?: 'sm' | 'md' | 'lg'
}

export function StreakCounter({ days, size = 'md' }: StreakCounterProps) {
  const isActive = days > 0
  const isMilestone = days === 7 || days === 30 || days === 100

  const sizes = {
    sm: { container: 'w-10 h-10', icon: 'w-4 h-4', text: 'text-xs' },
    md: { container: 'w-14 h-14', icon: 'w-6 h-6', text: 'text-sm' },
    lg: { container: 'w-20 h-20', icon: 'w-8 h-8', text: 'text-lg' },
  }

  const s = sizes[size]

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${s.container} rounded-2xl flex flex-col items-center justify-center relative ${
        isActive
          ? isMilestone
            ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-500/30'
            : 'bg-gradient-to-br from-orange-400 to-orange-600'
          : 'bg-[#EEEEEE]'
      }`}>
        {isActive && isMilestone && (
          <div className="absolute inset-0 rounded-2xl animate-pulse bg-orange-400/20" />
        )}
        <Flame className={`${s.icon} ${isActive ? 'text-white' : 'text-[#999999]'}`} />
        <span className={`${s.text} font-bold ${isActive ? 'text-white' : 'text-[#999999]'}`}>
          {days}
        </span>
      </div>
      <span className="text-[10px] text-[#999999] font-medium">
        {days === 0 ? 'Pas de streak' : days === 1 ? '1 jour' : `${days} jours`}
      </span>
    </div>
  )
}
