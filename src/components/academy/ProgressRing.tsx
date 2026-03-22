'use client'

interface ProgressRingProps {
  percent: number
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
  showLabel?: boolean
  label?: string
}

export function ProgressRing({
  percent,
  size = 120,
  strokeWidth = 10,
  color = '#2EC6F3',
  bgColor = '#E2E8F0',
  showLabel = true,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  // Couleur dynamique basée sur le pourcentage
  const dynamicColor = percent >= 80 ? '#10B981' : percent >= 50 ? '#F59E0B' : color

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={dynamicColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-accent">{percent}%</span>
          {label && <span className="text-xs text-gray-400 mt-0.5">{label}</span>}
        </div>
      )}
    </div>
  )
}
