'use client'

import { cn } from '@/lib/utils'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  icon: LucideIcon
  value: number
  label: string
  sublabel?: string
  prefix?: string
  suffix?: string
  color?: 'primary' | 'success' | 'accent' | 'rose'
  className?: string
}

const colorMap = {
  primary: { bar: '#FF5C00', icon: '#FF5C00', value: '#FF5C00' },
  success: { bar: '#10B981', icon: '#10B981', value: '#10B981' },
  accent: { bar: '#1A1A1A', icon: '#1A1A1A', value: '#1A1A1A' },
  rose: { bar: '#FF2D78', icon: '#FF2D78', value: '#FF2D78' },
}

export function KpiCard({ icon: Icon, value, label, sublabel, prefix, suffix, color = 'primary', className }: KpiCardProps) {
  const c = colorMap[color]

  return (
    <div className={cn(
      'bg-white border border-[#EEEEEE] rounded-xl p-3 md:p-4 text-center relative overflow-hidden shadow-sm',
      'hover:shadow-[0_12px_32px_rgba(255,92,0,0.14)] hover:border-[#FF5C00]/20 transition-all duration-300',
      className
    )}>
      {/* Barre couleur top */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: c.bar }} />

      <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: c.icon }} />

      <div className="font-mono text-2xl md:text-3xl font-bold leading-none" style={{ color: c.value }}>
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} duration={800} />
      </div>

      <div className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#777777] mt-1.5">
        {label}
      </div>

      {sublabel && (
        <div className="text-[8px] text-[#999999] mt-0.5">{sublabel}</div>
      )}
    </div>
  )
}
