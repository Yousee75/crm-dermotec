'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        'h-4 w-4 rounded border-[#EEEEEE] text-primary focus:ring-primary cursor-pointer',
        className
      )}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  )
)
Checkbox.displayName = 'Checkbox'
