'use client'

import { useState } from 'react'
import { Calendar, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui'

interface CalComEmbedProps {
  /** URL Cal.com (ex: "https://cal.com/dermotec/decouverte") */
  calUrl: string
  /** Texte du bouton */
  buttonText?: string
  /** Variante du bouton */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg'
  /** Nom du lead (pré-rempli) */
  name?: string
  /** Email du lead (pré-rempli) */
  email?: string
  /** Afficher en modal ou lien externe */
  mode?: 'modal' | 'link'
  /** Classes additionnelles */
  className?: string
}

export function CalComEmbed({
  calUrl,
  buttonText = 'Prendre rendez-vous',
  variant = 'primary',
  size = 'md',
  name,
  email,
  mode = 'modal',
  className,
}: CalComEmbedProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Construire l'URL avec les paramètres pré-remplis
  const embedUrl = new URL(calUrl)
  if (name) embedUrl.searchParams.set('name', name)
  if (email) embedUrl.searchParams.set('email', email)

  if (mode === 'link') {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => window.open(embedUrl.toString(), '_blank')}
      >
        <Calendar className="w-4 h-4" />
        {buttonText}
        <ExternalLink className="w-3 h-3" />
      </Button>
    )
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <Calendar className="w-4 h-4" />
        {buttonText}
      </Button>

      {/* Modal iframe Cal.com */}
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-4 md:inset-8 lg:inset-16 bg-white rounded-2xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#F4F0EB]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-[#111111]">
                  {buttonText}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#F4F0EB] transition"
              >
                <X className="w-4 h-4 text-[#999999]" />
              </button>
            </div>

            {/* Iframe */}
            <div className="flex-1">
              <iframe
                src={embedUrl.toString()}
                className="w-full h-full border-0"
                title="Prise de rendez-vous Cal.com"
                allow="camera;microphone"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
