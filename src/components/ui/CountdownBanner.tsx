'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CountdownBannerProps {
  targetDate: string
  formationNom: string
  placesRestantes: number
  placesMax: number
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownBanner({
  targetDate,
  formationNom,
  placesRestantes,
  placesMax
}: CountdownBannerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isVisible, setIsVisible] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const calculateTimeLeft = (): TimeLeft => {
      const difference = +new Date(targetDate) - +new Date()

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        }
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    // Calcul initial
    setTimeLeft(calculateTimeLeft())

    return () => clearInterval(timer)
  }, [targetDate, isMounted])

  if (!isVisible || !isMounted) return null

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const isUrgent = placesRestantes < 3

  return (
    <div className="sticky top-0 z-40 bg-[#082545] text-white">
      <div className="relative px-4 py-3">
        <div className="flex items-center justify-center text-center">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Info formation */}
            <span className="text-sm font-medium">
              Prochaine session <span className="text-[#2EC6F3]">{formationNom}</span> :
            </span>

            <span className="text-sm font-medium">
              {formatDate(targetDate)}
            </span>

            {/* Séparateur */}
            <span className="hidden sm:inline text-gray-400">—</span>

            {/* Compteur temps */}
            <div className="flex items-center gap-1">
              <div className="bg-white/20 rounded px-2 py-0.5 font-mono font-bold text-xs min-w-[32px]">
                {timeLeft.days}j
              </div>
              <div className="bg-white/20 rounded px-2 py-0.5 font-mono font-bold text-xs min-w-[32px]">
                {String(timeLeft.hours).padStart(2, '0')}h
              </div>
              <div className="bg-white/20 rounded px-2 py-0.5 font-mono font-bold text-xs min-w-[32px]">
                {String(timeLeft.minutes).padStart(2, '0')}m
              </div>
              <div className="bg-white/20 rounded px-2 py-0.5 font-mono font-bold text-xs min-w-[32px]">
                {String(timeLeft.seconds).padStart(2, '0')}s
              </div>
            </div>

            {/* Séparateur */}
            <span className="hidden sm:inline text-gray-400">—</span>

            {/* Places restantes */}
            <span className="text-sm font-medium">
              Places :{' '}
              <span
                className={cn(
                  'font-bold',
                  isUrgent ? 'text-red-400' : 'text-[#2EC6F3]'
                )}
              >
                {placesRestantes}/{placesMax}
              </span>
              {isUrgent && (
                <span className="text-red-400 ml-1 animate-pulse">
                  ⚠️
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Bouton fermer */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Fermer la bannière"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}