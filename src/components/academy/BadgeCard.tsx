'use client'

import { Lock } from 'lucide-react'

interface BadgeCardProps {
  nom: string
  description?: string | null
  icone: string
  earned: boolean
  earned_at?: string | null
  points_bonus?: number
}

export function BadgeCard({ nom, description, icone, earned, earned_at, points_bonus }: BadgeCardProps) {
  return (
    <div className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all min-w-[120px] ${
      earned
        ? 'bg-white border-primary/30 shadow-sm hover:shadow-md'
        : 'bg-gray-50 border-gray-100 opacity-50'
    }`}>
      {/* Badge icon */}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-2 ${
        earned ? 'bg-gradient-to-br from-primary/20 to-[#082545]/10' : 'bg-gray-200'
      }`}>
        {earned ? icone : <Lock className="w-6 h-6 text-gray-400" />}
      </div>

      {/* Name */}
      <p className={`text-xs font-semibold text-center leading-tight ${earned ? 'text-accent' : 'text-gray-400'}`}>
        {nom}
      </p>

      {/* Points */}
      {earned && points_bonus && points_bonus > 0 && (
        <span className="mt-1 text-[10px] font-bold text-primary">+{points_bonus} pts</span>
      )}

      {/* Earned date */}
      {earned && earned_at && (
        <span className="mt-0.5 text-[10px] text-gray-400">
          {new Date(earned_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
      )}

      {/* Lock overlay */}
      {!earned && description && (
        <p className="mt-1 text-[10px] text-gray-400 text-center">{description}</p>
      )}
    </div>
  )
}
