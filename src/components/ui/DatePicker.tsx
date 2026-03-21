'use client'

// ============================================================
// CRM DERMOTEC — Date Picker Component
// Wrapper pour react-datepicker avec styling Dermotec
// ============================================================

import { forwardRef } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  selected?: Date | null
  onChange: (date: Date | null) => void
  dateFormat?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  showTimeSelect?: boolean
  timeFormat?: string
  timeIntervals?: number
}

// Version simple sans react-datepicker (pour éviter les dépendances)
// En production, remplacer par react-datepicker ou @headlessui/react
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({
    selected,
    onChange,
    dateFormat = "dd/MM/yyyy",
    placeholder = "Sélectionner une date",
    disabled = false,
    className,
    minDate,
    maxDate,
    showTimeSelect = false,
    timeFormat = "HH:mm",
    timeIntervals = 15,
    ...props
  }, ref) => {

    const formatDate = (date: Date | null): string => {
      if (!date) return ''

      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()

      if (showTimeSelect) {
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}`
      }

      return `${day}/${month}/${year}`
    }

    const parseDate = (value: string): Date | null => {
      if (!value) return null

      try {
        // Support format DD/MM/YYYY ou DD/MM/YYYY HH:MM
        const parts = value.split(' ')
        const datePart = parts[0]
        const timePart = parts[1]

        const [day, month, year] = datePart.split('/').map(Number)

        if (!day || !month || !year) return null

        const date = new Date(year, month - 1, day)

        if (timePart && showTimeSelect) {
          const [hours, minutes] = timePart.split(':').map(Number)
          if (hours !== undefined && minutes !== undefined) {
            date.setHours(hours, minutes)
          }
        }

        return date
      } catch {
        return null
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const parsedDate = parseDate(value)

      // Vérifier les limites min/max
      if (parsedDate) {
        if (minDate && parsedDate < minDate) return
        if (maxDate && parsedDate > maxDate) return
      }

      onChange(parsedDate)
    }

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={formatDate(selected)}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-slate-500",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "pr-10", // Space for calendar icon
            className
          )}
          {...props}
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />

        {/* Note d'aide pour le format */}
        <div className="text-xs text-slate-500 mt-1">
          Format: {showTimeSelect ? "JJ/MM/AAAA HH:MM" : "JJ/MM/AAAA"}
        </div>
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'