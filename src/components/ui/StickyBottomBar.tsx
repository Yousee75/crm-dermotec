'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface StickyBottomBarProps {
  formationNom: string
  prix: number
  ctaText?: string
  onCtaClick: () => void
  heroRef: React.RefObject<HTMLElement>
}

export function StickyBottomBar({
  formationNom,
  prix,
  ctaText = "Je m'inscris",
  onCtaClick,
  heroRef
}: StickyBottomBarProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!heroRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Afficher la barre quand le hero sort du viewport
        setIsVisible(!entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '-100px 0px'
      }
    )

    observer.observe(heroRef.current)

    return () => observer.disconnect()
  }, [heroRef])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-white border-t border-gray-200',
        'shadow-[0_-4px_12px_rgba(0,0,0,0.1)]',
        'transition-transform duration-300 ease-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
      data-sticky-bottom-bar
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Info formation */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {formationNom}
            </h3>
            <p className="font-bold text-primary text-lg leading-tight">
              {formatPrice(prix)} HT
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onCtaClick}
            variant="primary"
            className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl min-h-[48px] px-6 shadow-lg active:shadow-md"
          >
            {ctaText}
          </Button>
        </div>
      </div>
    </div>
  )
}