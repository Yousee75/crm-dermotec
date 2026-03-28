'use client'

import { createContext, useContext, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const RadioGroupContext = createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function RadioGroup({ value, onValueChange, children, className }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </RadioGroupContext.Provider>
  )
}

interface RadioGroupItemProps {
  value: string
  id?: string
  className?: string
}

export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value, id, className }, ref) => {
    const ctx = useContext(RadioGroupContext)
    return (
      <input
        ref={ref}
        type="radio"
        id={id}
        value={value}
        checked={ctx.value === value}
        onChange={() => ctx.onValueChange?.(value)}
        className={cn(
          'h-4 w-4 border-[#F0F0F0] text-primary focus:ring-primary cursor-pointer',
          className
        )}
      />
    )
  }
)
RadioGroupItem.displayName = 'RadioGroupItem'
