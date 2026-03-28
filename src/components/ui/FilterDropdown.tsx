// ============================================================
// CRM DERMOTEC — Filter Dropdown réutilisable
// Pattern Attio/Folk : dropdown multi-sélection avec checkbox
// ============================================================

'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Dropdown Container ---

export function FilterDropdown({ label, icon: Icon, children, activeCount, onClear }: {
  label: string
  icon: React.ElementType
  children: React.ReactNode
  activeCount?: number
  onClear?: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border',
          activeCount
            ? 'bg-primary/10 text-primary border-primary/30'
            : 'bg-white text-[#777777] border-[#F0F0F0] hover:border-[#F0F0F0] hover:bg-[#FAFAFA]'
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
        {activeCount ? (
          <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] flex items-center justify-center leading-none">
            {activeCount}
          </span>
        ) : (
          <ChevronDown className="w-3 h-3 text-[#999999]" />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-[#F0F0F0] py-2 min-w-[220px] animate-fadeIn">
          {children}
          {activeCount ? (
            <div className="px-3 pt-2 mt-1 border-t border-[#F0F0F0]">
              <button
                onClick={() => { onClear?.(); setOpen(false) }}
                className="text-[11px] text-[#999999] hover:text-[#FF2D78] transition flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Reinitialiser
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// --- Filter Option (checkbox style) ---

export function FilterOption({ selected, onClick, children, color }: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-xs transition hover:bg-[#FAFAFA]',
        selected && 'bg-primary/5'
      )}
    >
      <div className={cn(
        'w-4 h-4 rounded border-2 flex items-center justify-center transition shrink-0',
        selected ? 'bg-primary border-primary' : 'border-[#F0F0F0]'
      )}>
        {selected && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
      <span className="flex-1 text-left text-[#3A3A3A]">{children}</span>
    </button>
  )
}
