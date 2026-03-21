'use client'

import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface WhatsAppButtonProps {
  phone?: string
  message?: string
}

export function WhatsAppButton({
  phone = '33188334343',
  message = "Bonjour ! Je souhaite des informations sur vos formations Dermotec."
}: WhatsAppButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message)
    const url = `https://wa.me/${phone}?text=${encodedMessage}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="fixed z-50 group"
      style={{
        bottom: window.innerWidth < 768 ? '80px' : '24px',
        right: '16px'
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      <div
        className={cn(
          'absolute right-16 bottom-1/2 translate-y-1/2',
          'bg-gray-900 text-white text-sm rounded-lg px-3 py-2',
          'opacity-0 pointer-events-none transition-all duration-200',
          'whitespace-nowrap shadow-lg',
          'before:content-[""] before:absolute before:left-full before:top-1/2',
          'before:-translate-y-1/2 before:border-4 before:border-transparent',
          'before:border-l-gray-900',
          showTooltip && 'opacity-100 pointer-events-auto'
        )}
      >
        Besoin d'aide ?
      </div>

      {/* Bouton WhatsApp */}
      <button
        onClick={handleClick}
        className={cn(
          'w-14 h-14 bg-[#25D366] hover:bg-[#1FAD4F]',
          'rounded-full shadow-lg hover:shadow-xl',
          'flex items-center justify-center',
          'transition-all duration-200 ease-out',
          'hover:scale-110 active:scale-95',
          'focus:outline-none focus:ring-4 focus:ring-[#25D366]/20'
        )}
        aria-label="Contacter sur WhatsApp"
        title="Besoin d'aide ? Contactez-nous sur WhatsApp"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </button>

      {/* Effet de pulsation pour attirer l'attention */}
      <div
        className={cn(
          'absolute inset-0 bg-[#25D366] rounded-full',
          'animate-ping opacity-20',
          'pointer-events-none'
        )}
      />
    </div>
  )
}