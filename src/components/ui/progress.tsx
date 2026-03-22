'use client'

import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className }: ProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-slate-200',
        className
      )}
    >
      <div
        className="h-full w-full flex-1 bg-slate-900 transition-transform duration-300 ease-in-out"
        style={{
          transform: `translateX(-${100 - clampedValue}%)`
        }}
      />
    </div>
  )
}