'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  FileSignature,
  CheckCircle,
  Star,
  GraduationCap,
  Users,
  Zap,
  X,
} from 'lucide-react'
import type { PortailData } from '@/types'

interface Badge {
  id: string
  label: string
  description: string
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  earned: boolean
}

interface PortailBadgesProps {
  data: PortailData
}

export default function PortailBadges({ data }: PortailBadgesProps) {
  const [showAchievement, setShowAchievement] = useState<Badge | null>(null)
  const [dismissedBadges, setDismissedBadges] = useState<string[]>([])

  const { inscription, formation } = data

  const badges: Badge[] = useMemo(() => {
    const joursPresence = [
      inscription.presence_jour1,
      inscription.presence_jour2,
      inscription.presence_jour3,
      inscription.presence_jour4,
      inscription.presence_jour5,
    ].filter(Boolean).length
    const joursTotal = formation?.duree_jours || 1
    const tauxPresence = inscription.taux_presence || Math.round((joursPresence / joursTotal) * 100)

    return [
      {
        id: 'inscrit',
        label: 'Premier pas',
        description: 'Inscription confirmée à la formation',
        icon: Users,
        color: '#FF5C00',
        bgColor: '#FFF0E5',
        earned: true,
      },
      {
        id: 'convention',
        label: 'Engagement signé',
        description: 'Convention de formation signée',
        icon: FileSignature,
        color: '#FF2D78',
        bgColor: '#FFE0EF',
        earned: inscription.convention_signee === true,
      },
      {
        id: 'presence',
        label: 'Assiduité parfaite',
        description: 'Taux de présence supérieur à 90%',
        icon: CheckCircle,
        color: '#10B981',
        bgColor: '#D1FAE5',
        earned: tauxPresence >= 90,
      },
      {
        id: 'evaluation',
        label: 'Avis partagé',
        description: 'Évaluation de satisfaction complétée',
        icon: Star,
        color: '#FF8C42',
        bgColor: '#FFF3E8',
        earned: (inscription.note_satisfaction || 0) > 0,
      },
      {
        id: 'ambassadeur',
        label: 'Ambassadrice',
        description: 'Recommanderait la formation',
        icon: Zap,
        color: '#FF2D78',
        bgColor: '#FFE0EF',
        earned: inscription.recommanderait === true,
      },
      {
        id: 'diplome',
        label: 'Certifiée',
        description: 'Certificat de formation obtenu',
        icon: GraduationCap,
        color: '#FF5C00',
        bgColor: '#FFF0E5',
        earned: inscription.certificat_genere === true,
      },
    ]
  }, [inscription, formation])

  const earnedCount = badges.filter(b => b.earned).length

  // Montrer popup pour le dernier badge gagne (une seule fois)
  useEffect(() => {
    const lastEarned = [...badges].reverse().find(b => b.earned && !dismissedBadges.includes(b.id))
    if (lastEarned && earnedCount > 1) {
      // Petit delai pour l'animation
      const timer = setTimeout(() => setShowAchievement(lastEarned), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismissAchievement = () => {
    if (showAchievement) {
      setDismissedBadges(prev => [...prev, showAchievement.id])
      setShowAchievement(null)
    }
  }

  return (
    <>
      {/* Grille de badges */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm" style={{ color: '#111111' }}>
            Mes badges
          </h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#FFF0E5', color: '#FF5C00' }}>
            {earnedCount}/{badges.length}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {badges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08 }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center"
                style={{
                  backgroundColor: badge.earned ? badge.bgColor : '#F4F0EB',
                  opacity: badge.earned ? 1 : 0.5,
                }}
                title={badge.description}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: badge.earned ? `${badge.color}20` : '#E5E5E5',
                  }}>
                  <Icon size={20} style={{ color: badge.earned ? badge.color : '#999999' }} />
                </div>
                <span className="text-xs font-medium leading-tight" style={{
                  color: badge.earned ? '#111111' : '#999999',
                }}>
                  {badge.label}
                </span>
                {badge.earned && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: badge.color }}
                  >
                    <CheckCircle size={10} className="text-white" />
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Popup achievement */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={dismissAchievement}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative rounded-2xl p-8 text-center max-w-sm w-full"
              style={{ backgroundColor: '#FFFFFF' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={dismissAchievement}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-[#F4F0EB]"
              >
                <X size={16} style={{ color: '#999999' }} />
              </button>

              {/* Confetti effect via pulsating circles */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                initial={{ boxShadow: `0 0 0 0 ${showAchievement.color}40` }}
                animate={{ boxShadow: [`0 0 0 0 ${showAchievement.color}40`, `0 0 0 20px ${showAchievement.color}00`] }}
                transition={{ duration: 1, repeat: 2 }}
              />

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: showAchievement.bgColor }}
              >
                <Award size={40} style={{ color: showAchievement.color }} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: showAchievement.color }}>
                  Nouveau badge
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
                  {showAchievement.label}
                </h3>
                <p className="text-sm" style={{ color: '#777777' }}>
                  {showAchievement.description}
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={dismissAchievement}
                className="mt-6 px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: showAchievement.color }}
              >
                Super !
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
