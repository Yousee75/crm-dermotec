'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AnimatedCounter } from './AnimatedCounter'

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  subtitle?: string
  trend?: {
    value: number
    label?: string
  }
  className?: string
  onClick?: () => void
}

function KpiCard({ icon: Icon, label, value, color, subtitle, trend, className, onClick }: KpiCardProps) {
  const TrendIcon = trend
    ? trend.value > 0 ? TrendingUp
    : trend.value < 0 ? TrendingDown
    : Minus
    : null

  const trendColor = trend
    ? trend.value > 0 ? 'text-green-600 bg-green-50'
    : trend.value < 0 ? 'text-red-600 bg-red-50'
    : 'text-gray-500 bg-gray-50'
    : ''

  return (
    <div
      className={cn(
        'group bg-white rounded-xl border border-gray-100 p-4 md:p-5',
        'hover:shadow-md hover:border-gray-200 transition-all duration-200',
        'animate-fadeIn',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-xl md:text-2xl font-bold tracking-tight" style={{ color }}>
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
          {trend && TrendIcon && (
            <div className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium', trendColor)}>
              <TrendIcon className="w-3 h-3" />
              {trend.value > 0 ? '+' : ''}{trend.value}%
              {trend.label && <span className="text-gray-400 ml-0.5">{trend.label}</span>}
            </div>
          )}
        </div>
        <div
          className={cn(
            'p-2.5 rounded-xl transition-transform duration-200',
            'group-hover:scale-110'
          )}
          style={{ backgroundColor: `${color}12` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export { KpiCard }
