'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Inscription {
  prenom: string
  nom_initial: string
  formation: string
  date: string
}

interface SocialProofToastProps {
  inscriptions: Inscription[]
}

export function SocialProofToast({ inscriptions }: SocialProofToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [counter, setCounter] = useState(0)
  const [isMobileBottomBarVisible, setIsMobileBottomBarVisible] = useState(false)

  useEffect(() => {
    // Détection du StickyBottomBar pour éviter le chevauchement
    const checkBottomBar = () => {
      const bottomBar = document.querySelector('[data-sticky-bottom-bar]')
      setIsMobileBottomBarVisible(!!bottomBar && window.innerWidth < 768)
    }

    checkBottomBar()
    window.addEventListener('resize', checkBottomBar)

    const observer = new MutationObserver(checkBottomBar)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('resize', checkBottomBar)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!inscriptions.length || counter >= 5) return

    const showToast = () => {
      setIsVisible(true)
      setCounter(prev => prev + 1)

      // Masquer après 4s
      setTimeout(() => {
        setIsVisible(false)

        // Passer au suivant après fade out
        setTimeout(() => {
          setCurrentIndex(prev => (prev + 1) % inscriptions.length)
        }, 300)
      }, 4000)
    }

    // Premier affichage après 2s
    const initialDelay = setTimeout(showToast, 2000)

    return () => clearTimeout(initialDelay)
  }, [currentIndex, inscriptions.length, counter])

  useEffect(() => {
    if (!isVisible && counter < 5 && inscriptions.length > 0) {
      // Délai aléatoire entre 30-45s pour le prochain
      const randomDelay = Math.random() * 15000 + 30000
      const nextToastTimer = setTimeout(() => {
        setIsVisible(true)
        setCounter(prev => prev + 1)

        setTimeout(() => {
          setIsVisible(false)
          setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % inscriptions.length)
          }, 300)
        }, 4000)
      }, randomDelay)

      return () => clearTimeout(nextToastTimer)
    }
  }, [isVisible, counter, inscriptions.length])

  if (!inscriptions.length || counter >= 5) return null

  const inscription = inscriptions[currentIndex]
  const timeAgo = getTimeAgo(inscription.date)

  return (
    <div
      className={cn(
        'fixed z-50 transition-all duration-300 ease-out',
        'left-4 max-w-sm',
        isMobileBottomBarVisible ? 'bottom-20' : 'bottom-4',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0'
      )}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-start gap-3">
        {/* Avatar avec initiales */}
        <div className="bg-primary/20 text-primary rounded-full w-10 h-10 flex items-center justify-center font-semibold text-sm shrink-0">
          {inscription.prenom[0]}{inscription.nom_initial}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 leading-relaxed">
            <span className="font-medium">{inscription.prenom} {inscription.nom_initial}.</span>
            {' '}vient de s'inscrire à{' '}
            <span className="font-medium text-primary">{inscription.formation}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            il y a {timeAgo}
          </p>
        </div>

        {/* Point d'activité */}
        <div className="w-2 h-2 bg-green-500 rounded-full shrink-0 mt-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 60) {
    return `${diffInMinutes}min`
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `${days}j`
  }
}