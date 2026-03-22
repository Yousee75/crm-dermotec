'use client'

import { Phone } from 'lucide-react'

interface ClickToCallProps {
  phone: string
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md'
}

/** Formatte et rend un numéro de téléphone cliquable (ouvre l'app téléphone) */
export function ClickToCall({ phone, className = '', showIcon = true, size = 'sm' }: ClickToCallProps) {
  if (!phone) return null

  // Nettoyer le numéro pour le lien tel:
  const cleanNumber = phone.replace(/[\s.-]/g, '').replace(/^0/, '+33')
  // Formater pour l'affichage
  const displayNumber = phone.replace(/(\d{2})(?=\d)/g, '$1 ').trim()

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-1 gap-1'
    : 'text-sm px-3 py-1.5 gap-1.5'

  return (
    <a
      href={`tel:${cleanNumber}`}
      className={`inline-flex items-center ${sizeClasses} rounded-lg bg-primary/5 text-info hover:bg-primary/15 hover:text-primary-dark transition-colors font-mono ${className}`}
      title={`Appeler ${displayNumber}`}
    >
      {showIcon && <Phone size={size === 'sm' ? 12 : 14} />}
      {displayNumber}
    </a>
  )
}
