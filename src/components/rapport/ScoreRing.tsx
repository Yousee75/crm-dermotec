'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ScoreRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
}

export function ScoreRing({ value, max = 100, size = 80, strokeWidth = 6, className, label }: ScoreRingProps) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percent = Math.min(animated / max, 1)
  const offset = circumference * (1 - percent)

  // Couleur dynamique basée sur le score
  const color = value >= 60 ? '#10B981' : value >= 30 ? '#FF8C42' : '#FF2D78'

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      {/* Valeur au centre */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-xl font-bold text-white leading-none">{Math.round(animated)}</span>
        <span className="text-[9px] text-white/50">/{max}</span>
      </div>
      {label && (
        <span className="text-[10px] text-white/70 mt-1.5 font-medium">{label}</span>
      )}
    </div>
  )
}
