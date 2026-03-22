'use client'

import { AlertCircle, Phone, Clock, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface LeadAlertBarProps {
  /** Jours depuis le dernier contact */
  daysSinceContact?: number
  /** Statut actuel du lead */
  statut: string
  /** Nom du lead */
  prenom: string
  /** Téléphone pour le bouton appeler */
  telephone?: string
}

export function LeadAlertBar({ daysSinceContact, statut, prenom, telephone }: LeadAlertBarProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Pas d'alerte pour les leads PERDU, SPAM, FORME, ALUMNI
  if (['PERDU', 'SPAM', 'FORME', 'ALUMNI'].includes(statut)) return null

  // Alerte si pas contacté depuis > 5 jours
  const isUrgent = daysSinceContact !== undefined && daysSinceContact > 5
  const isWarning = daysSinceContact !== undefined && daysSinceContact > 3 && daysSinceContact <= 5

  if (!isUrgent && !isWarning) return null

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm animate-fadeIn',
      isUrgent ? 'bg-error/10 border border-error/20' : 'bg-warning/10 border border-warning/20',
    )}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isUrgent ? 'bg-error/20' : 'bg-warning/20',
      )}>
        {isUrgent ? <AlertCircle className="w-4 h-4 text-error" /> : <Clock className="w-4 h-4 text-warning" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium', isUrgent ? 'text-error' : 'text-warning')}>
          {isUrgent
            ? `${prenom} n'a pas été contacté(e) depuis ${daysSinceContact} jours`
            : `Dernier contact avec ${prenom} il y a ${daysSinceContact} jours`
          }
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">
          {isUrgent
            ? 'Les leads contactés dans les 2h ont 21x plus de chances de convertir'
            : 'Un rappel rapide maintient l\'intérêt du prospect'
          }
        </p>
      </div>

      {telephone && (
        <a
          href={`tel:${telephone}`}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shrink-0 transition',
            isUrgent ? 'bg-error hover:bg-error/90' : 'bg-warning hover:bg-warning/90',
          )}
        >
          <Phone className="w-3 h-3" />
          Appeler
        </a>
      )}

      <button onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-black/5 transition shrink-0">
        <X className="w-3.5 h-3.5 text-text-muted" />
      </button>
    </div>
  )
}
