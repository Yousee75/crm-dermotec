'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, X, Pencil, User, Bot, Database, FileSpreadsheet, Globe, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────

export type FieldSource =
  | 'manual'
  | 'api:pappers'
  | 'api:google'
  | 'api:outscraper'
  | 'api:sirene'
  | 'ai:claude'
  | 'csv:import'
  | 'webhook:formulaire'

export interface FieldSourceInfo {
  source: FieldSource
  updated_by?: string
  at?: string
}

// ── Source icons & labels ──────────────────────────────────

const SOURCE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  manual: { icon: User, label: 'Saisi manuellement', color: 'text-blue-500', bg: 'bg-blue-50' },
  'api:pappers': { icon: Database, label: 'Pappers API', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  'api:google': { icon: Globe, label: 'Google Places', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  'api:outscraper': { icon: Database, label: 'Outscraper', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  'api:sirene': { icon: Database, label: 'API Sirene (INSEE)', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  'ai:claude': { icon: Sparkles, label: 'IA (Claude)', color: 'text-violet-500', bg: 'bg-violet-50' },
  'csv:import': { icon: FileSpreadsheet, label: 'Import CSV', color: 'text-gray-500', bg: 'bg-gray-50' },
  'webhook:formulaire': { icon: Globe, label: 'Formulaire web', color: 'text-amber-500', bg: 'bg-amber-50' },
}

function SourceBadge({ source }: { source?: FieldSourceInfo }) {
  if (!source) return null
  const config = SOURCE_CONFIG[source.source] || SOURCE_CONFIG.manual
  const Icon = config.icon

  return (
    <div className={cn('inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px]', config.bg, config.color)} title={`${config.label}${source.at ? ` — ${new Date(source.at).toLocaleDateString('fr-FR')}` : ''}`}>
      <Icon className="w-2.5 h-2.5" />
    </div>
  )
}

// ── Composant principal ───────────────────────────────────

interface FieldWithSourceProps {
  label: string
  value: string | number | null | undefined
  source?: FieldSourceInfo
  editable?: boolean
  type?: 'text' | 'email' | 'tel' | 'number' | 'url' | 'select' | 'textarea'
  options?: { value: string; label: string }[]
  placeholder?: string
  displayValue?: string // Pour afficher une valeur formatée (ex: téléphone)
  onSave?: (value: string) => void
  className?: string
  compact?: boolean
}

export function FieldWithSource({
  label,
  value,
  source,
  editable = true,
  type = 'text',
  options,
  placeholder,
  displayValue,
  onSave,
  className,
  compact = false,
}: FieldWithSourceProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value ?? ''))
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if ('select' in inputRef.current) inputRef.current.select()
    }
  }, [editing])

  const handleSave = () => {
    if (editValue !== String(value ?? '')) {
      onSave?.(editValue)
    }
    setEditing(false)
  }

  const handleCancel = () => {
    setEditValue(String(value ?? ''))
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  const displayVal = displayValue || String(value ?? '')
  const isEmpty = !value && value !== 0

  return (
    <div className={cn('group', className)}>
      {/* Label + source */}
      <div className="flex items-center gap-1 mb-0.5">
        <span className={cn('text-gray-400 font-medium', compact ? 'text-[10px]' : 'text-[11px]')}>{label}</span>
        <SourceBadge source={source} />
      </div>

      {/* Value / Edit */}
      {editing ? (
        <div className="flex items-center gap-1">
          {type === 'select' && options ? (
            <select
              ref={inputRef as any}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-xs border border-primary rounded px-2 py-1 focus:outline-none bg-white"
            >
              <option value="">— Sélectionner —</option>
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              ref={inputRef as any}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-xs border border-primary rounded px-2 py-1 focus:outline-none resize-none min-h-[48px]"
              placeholder={placeholder}
            />
          ) : (
            <input
              ref={inputRef as any}
              type={type}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-xs border border-primary rounded px-2 py-1 focus:outline-none"
              placeholder={placeholder}
            />
          )}
          <button onClick={handleSave} className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={handleCancel} className="p-1 rounded hover:bg-red-50 text-red-500 transition"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <div className="flex items-center gap-1 min-h-[24px]">
          <span className={cn(
            'flex-1 transition',
            compact ? 'text-xs' : 'text-[13px]',
            isEmpty ? 'text-gray-300 italic' : 'text-gray-900',
          )}>
            {isEmpty ? (placeholder || '—') : displayVal}
          </span>
          {editable && onSave && (
            <button
              onClick={() => { setEditValue(String(value ?? '')); setEditing(true) }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-100 text-gray-400 transition"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Export du SourceBadge pour usage externe ───────────────

export { SourceBadge, SOURCE_CONFIG }
