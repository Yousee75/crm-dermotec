'use client'

import { Shield, Star, Lock, CreditCard, Building, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrustBarProps {
  variant?: 'full' | 'compact'
}

const trustBadges = [
  {
    icon: Shield,
    text: 'Certifié Qualiopi',
    description: 'Formation qualifiée'
  },
  {
    icon: Star,
    text: 'Google 4.9/5',
    description: '127 avis clients'
  },
  {
    icon: Lock,
    text: 'Paiement sécurisé',
    description: 'SSL & 3D Secure'
  },
  {
    icon: CreditCard,
    text: 'Alma 3x sans frais',
    description: 'Facilités de paiement'
  },
  {
    icon: Building,
    text: 'France Travail',
    description: 'Financement possible'
  },
  {
    icon: Users,
    text: '+500 stagiaires',
    description: 'Formées depuis 2019'
  }
]

export function TrustBar({ variant = 'full' }: TrustBarProps) {
  const isCompact = variant === 'compact'

  return (
    <div
      className={cn(
        'w-full',
        isCompact ? 'py-3' : 'bg-gray-50 border-y border-gray-200 py-4'
      )}
    >
      <div className="container mx-auto px-4">
        <div
          className={cn(
            'flex items-center justify-center gap-4 md:gap-8',
            isCompact ? 'flex-wrap' : 'grid grid-cols-2 md:grid-cols-6 gap-4'
          )}
        >
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon

            return (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 transition-all duration-200',
                  'grayscale hover:grayscale-0',
                  isCompact
                    ? 'justify-center'
                    : 'flex-col text-center md:flex-row md:text-left'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-lg bg-white/50',
                    isCompact ? 'w-6 h-6' : 'w-8 h-8'
                  )}
                >
                  <Icon
                    className={cn(
                      'text-[#2EC6F3]',
                      isCompact ? 'w-4 h-4' : 'w-5 h-5'
                    )}
                  />
                </div>

                {!isCompact && (
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-xs md:text-sm">
                      {badge.text}
                    </div>
                    <div className="text-gray-600 text-xs leading-tight hidden md:block">
                      {badge.description}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {!isCompact && (
          <div className="text-center mt-4 md:hidden">
            <p className="text-xs text-gray-600">
              Formation certifiée • Paiement sécurisé • +500 stagiaires formées
            </p>
          </div>
        )}
      </div>
    </div>
  )
}