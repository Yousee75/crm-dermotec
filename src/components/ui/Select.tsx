'use client'

// ============================================================
// CRM DERMOTEC — Select Component
// Composant select stylé pour les formulaires
// ============================================================

import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void
  placeholder?: string
  children?: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    onValueChange,
    onChange,
    placeholder,
    children,
    value,
    disabled,
    ...props
  }, ref) => {

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value

      // Appeler le onChange original s'il existe
      if (onChange) {
        onChange(e)
      }

      // Appeler onValueChange si fourni (API compatible avec shadcn/ui)
      if (onValueChange) {
        onValueChange(newValue)
      }
    }

    return (
      <div className="relative">
        <select
          ref={ref}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm ring-offset-white",
            "placeholder:text-slate-500",
            "focus:outline-none focus:ring-1 focus:ring-slate-950 focus:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "appearance-none pr-10", // Remove default arrow, add space for custom
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {children}
        </select>

        {/* Custom chevron icon */}
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
    )
  }
)

Select.displayName = 'Select'

// Alias pour compatibilité API
export const SelectTrigger = Select
export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
)
export const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <option value="" disabled hidden>{placeholder}</option>
)