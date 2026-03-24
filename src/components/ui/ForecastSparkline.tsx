'use client'

import { cn } from '@/lib/utils'

/**
 * Forecast Sparkline — mini graphique SVG avec historique + projection
 *
 * Usage:
 *   <ForecastSparkline
 *     data={[10, 12, 15, 18, 22]}
 *     forecast={[22, 25, 28]}
 *     color="text-[#10B981]"
 *   />
 */

interface ForecastSparklineProps {
  data: number[]
  forecast?: number[]
  color?: string
  height?: number
  className?: string
}

export function ForecastSparkline({
  data,
  forecast = [],
  color = 'text-primary',
  height = 48,
  className,
}: ForecastSparklineProps) {
  const width = 200
  const padding = 4

  const all = [...data, ...forecast]
  if (all.length < 2) return null

  const min = Math.min(...all) * 0.95
  const max = Math.max(...all) * 1.05
  const range = max - min || 1

  const toX = (i: number) => padding + (i / (all.length - 1)) * (width - padding * 2)
  const toY = (v: number) => padding + (1 - (v - min) / range) * (height - padding * 2)

  // History line (solid)
  const histLine = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(' ')

  // Forecast line (dashed) — starts from last history point
  const forecastFull = [data[data.length - 1], ...forecast]
  const forecastLine = forecastFull
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(data.length - 1 + i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(' ')

  // Junction point
  const jx = toX(data.length - 1)
  const jy = toY(data[data.length - 1])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full', color, className)}
    >
      {/* Gradient fill under history */}
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.15} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <path
        d={`${histLine} L${toX(data.length - 1).toFixed(1)},${height - padding} L${toX(0).toFixed(1)},${height - padding} Z`}
        fill="url(#sparkFill)"
      />

      {/* History line (solid) */}
      <path d={histLine} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Forecast line (dashed) */}
      {forecast.length > 0 && (
        <path d={forecastLine} fill="none" stroke="currentColor" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" opacity={0.5} />
      )}

      {/* Today separator */}
      {forecast.length > 0 && (
        <line x1={jx} y1={padding} x2={jx} y2={height - padding} stroke="currentColor" strokeWidth={1} strokeDasharray="2 2" opacity={0.2} />
      )}

      {/* Junction dot */}
      <circle cx={jx} cy={jy} r={3} fill="currentColor" />
    </svg>
  )
}
