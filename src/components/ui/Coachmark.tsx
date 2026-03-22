'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CoachmarkProps {
  /** Identifiant unique pour le localStorage */
  id: string
  /** Titre du coachmark */
  title: string
  /** Description */
  description: string
  /** Position relative à l'élément ciblé */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Icône optionnelle */
  icon?: React.ReactNode
  /** Callback quand fermé */
  onDismiss?: () => void
  /** Délai avant apparition (ms) */
  delay?: number
  /** Forcer l'affichage même si déjà vu */
  force?: boolean
  children: React.ReactNode
}

const STORAGE_KEY = 'satorea-coachmarks-seen'

function getSeenCoachmarks(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function markAsSeen(id: string) {
  const seen = getSeenCoachmarks()
  seen.add(id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]))
  } catch {}
}

export function Coachmark({
  id,
  title,
  description,
  position = 'bottom',
  icon,
  onDismiss,
  delay = 1000,
  force = false,
  children,
}: CoachmarkProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (force || !getSeenCoachmarks().has(id)) {
      const timer = setTimeout(() => setVisible(true), delay)
      return () => clearTimeout(timer)
    }
  }, [id, delay, force])

  const handleDismiss = () => {
    setVisible(false)
    markAsSeen(id)
    onDismiss?.()
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-accent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-accent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-accent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-accent',
  }

  return (
    <div className="relative inline-block">
      {children}

      {visible && (
        <>
          {/* Highlight ring autour de l'élément */}
          <div className="absolute inset-0 rounded-lg ring-2 ring-primary ring-offset-2 animate-pulse pointer-events-none z-40" />

          {/* Bulle coachmark */}
          <div className={cn(
            'absolute z-50 w-64 animate-fadeIn',
            positionClasses[position],
          )}>
            <div className="bg-accent text-white rounded-xl shadow-xl p-4 relative">
              {/* Flèche */}
              <div className={cn(
                'absolute w-0 h-0 border-4 border-transparent',
                arrowClasses[position],
              )} />

              {/* Contenu */}
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 mt-0.5">
                  {icon || <Sparkles className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold mb-1">{title}</h4>
                  <p className="text-xs text-white/70 leading-relaxed">{description}</p>
                </div>
                <button onClick={handleDismiss} className="shrink-0 p-0.5 rounded hover:bg-white/10 transition">
                  <X className="w-3.5 h-3.5 text-white/50" />
                </button>
              </div>

              {/* Bouton OK */}
              <button
                onClick={handleDismiss}
                className="mt-3 w-full py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium rounded-lg transition"
              >
                Compris
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/** Reset tous les coachmarks (utile pour tests) */
export function resetCoachmarks() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}
