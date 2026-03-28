'use client'

import { cn } from '@/lib/utils'

interface FlashBoxProps {
  label: string
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'accent'
  className?: string
}

const variants = {
  primary: {
    border: 'border-l-[3px] border-l-[#FF5C00]',
    bg: 'bg-[#FFF0E5]',
    label: 'text-[#FF5C00]',
  },
  success: {
    border: 'border-l-[3px] border-l-[#10B981]',
    bg: 'bg-[#ECFDF5]',
    label: 'text-[#10B981]',
  },
  warning: {
    border: 'border-l-[3px] border-l-[#FF8C42]',
    bg: 'bg-[#FFF3E8]',
    label: 'text-[#FF8C42]',
  },
  accent: {
    border: 'border-l-[3px] border-l-[#FF2D78]',
    bg: 'bg-[#FFF0F5]',
    label: 'text-[#FF2D78]',
  },
}

export function FlashBox({ label, children, variant = 'primary', className }: FlashBoxProps) {
  const v = variants[variant]

  return (
    <div className={cn(v.border, v.bg, 'rounded-r-lg p-3 md:p-4', className)}>
      <div className={cn('text-[9px] font-bold uppercase tracking-[0.12em] mb-1.5', v.label)}>
        {label}
      </div>
      <div className="text-[13px] leading-relaxed text-[#111111]">
        {children}
      </div>
    </div>
  )
}
