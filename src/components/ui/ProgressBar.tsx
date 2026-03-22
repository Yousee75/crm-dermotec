import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: string
  showLabel?: boolean
  className?: string
}

function ProgressBar({ value, max = 100, size = 'sm', color, showLabel, className }: ProgressBarProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100)

  const autoColor = percent >= 70 ? 'var(--color-success)' : percent >= 40 ? '#F59E0B' : '#94A3B8'
  const barColor = color || autoColor

  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-gray-100 rounded-full overflow-hidden', heights[size])}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%`, backgroundColor: barColor }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-500 tabular-nums">{Math.round(percent)}%</span>
      )}
    </div>
  )
}

export { ProgressBar }
