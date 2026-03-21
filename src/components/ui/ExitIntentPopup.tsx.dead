'use client'

import { useState, useEffect } from 'react'
import { X, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ExitIntentPopupProps {
  title?: string
  subtitle?: string
  ctaText?: string
  onSubmit: (email: string) => void
}

export function ExitIntentPopup({
  title = "Attendez ! Ne partez pas sans votre guide",
  subtitle = "Recevez notre guide gratuit '5 techniques NPM qui cartonnent en 2026' + 10% sur votre première formation",
  ctaText = "Je veux mon guide gratuit",
  onSubmit
}: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Vérifier si déjà affiché cette session
    const sessionFlag = sessionStorage.getItem('dermotec_exit_intent_shown')
    if (sessionFlag) {
      setHasShown(true)
      return
    }

    let lastScrollY = window.scrollY
    let isScrollingUp = false

    // Détection exit intent desktop (souris vers le haut)
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 10 && !hasShown) {
        showPopup()
      }
    }

    // Détection exit intent mobile (scroll rapide vers le haut)
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY < lastScrollY) {
        if (!isScrollingUp) {
          isScrollingUp = true
        }

        // Si scroll rapide vers le haut (plus de 100px d'un coup)
        if (lastScrollY - currentScrollY > 100 && currentScrollY < 500 && !hasShown) {
          showPopup()
        }
      } else {
        isScrollingUp = false
      }

      lastScrollY = currentScrollY
    }

    const showPopup = () => {
      if (hasShown) return
      setIsVisible(true)
      setHasShown(true)
      sessionStorage.setItem('dermotec_exit_intent_shown', 'true')
    }

    // Écouteurs d'événements
    document.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [hasShown])

  // Gestion de la touche Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false)
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [isVisible])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(email)
      setIsVisible(false)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsVisible(false)
    }
  }

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4',
          'transform transition-all duration-300',
          'animate-in zoom-in-95 fade-in duration-300'
        )}
      >
        {/* Bouton fermer */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-lg transition-colors z-10"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="p-6 pt-8">
          {/* Icône */}
          <div className="w-16 h-16 bg-[#2EC6F3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-[#2EC6F3]" />
          </div>

          {/* Titre */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </h2>

          {/* Sous-titre */}
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            {subtitle}
          </p>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className={cn(
                  'w-full px-4 py-3 border border-gray-200 rounded-xl',
                  'focus:outline-none focus:ring-2 focus:ring-[#2EC6F3] focus:border-transparent',
                  'transition-colors text-sm'
                )}
                required
                autoFocus
              />
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white font-bold py-3 rounded-xl"
              disabled={!email.trim()}
            >
              {ctaText}
            </Button>
          </form>

          {/* Lien "Non merci" */}
          <div className="text-center mt-4">
            <button
              onClick={() => setIsVisible(false)}
              className="text-sm text-gray-500 hover:text-gray-700 underline-offset-4 hover:underline transition-colors"
            >
              Non merci, continuer la navigation
            </button>
          </div>

          {/* Note de confiance */}
          <p className="text-xs text-gray-400 text-center mt-3">
            🔒 Nous respectons votre vie privée. Aucun spam.
          </p>
        </div>
      </div>
    </div>
  )
}