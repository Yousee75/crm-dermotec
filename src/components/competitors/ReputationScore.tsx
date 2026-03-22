'use client'

interface ReputationScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function ReputationScore({ score, size = 'md' }: ReputationScoreProps) {
  const color = score >= 70 ? 'var(--color-success)' : score >= 40 ? '#F59E0B' : '#EF4444'
  const label = score >= 70 ? 'Excellent' : score >= 40 ? 'Moyen' : 'Faible'

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white`}
        style={{ backgroundColor: color }}
        title={`Score réputation : ${score}/100 — ${label}`}
      >
        {score}
      </div>
      {size !== 'sm' && (
        <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
      )}
    </div>
  )
}
