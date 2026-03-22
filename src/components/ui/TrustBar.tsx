'use client'

import { Shield, Star, Lock, CreditCard, Building, Users, Award, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrustBarProps {
  variant?: 'full' | 'compact' | 'hero'
}

const trustBadges = [
  {
    icon: Award,
    text: 'Certifié Qualiopi',
    description: 'Qualité formation garantie',
    color: '#E8627C',
  },
  {
    icon: Star,
    text: 'Google 4.9/5',
    description: '127 avis vérifiés',
    color: '#F97316',
  },
  {
    icon: Lock,
    text: 'Paiement sécurisé',
    description: 'Stripe, 3D Secure, SEPA',
    color: '#10B981',
  },
  {
    icon: CreditCard,
    text: 'Paiement 3x',
    description: 'Sans frais, Alma',
    color: '#8B5CF6',
  },
  {
    icon: Building,
    text: 'OPCO / CPF',
    description: 'Financement possible',
    color: '#6B8CAE',
  },
  {
    icon: Users,
    text: '+500 formées',
    description: 'Depuis 2019',
    color: '#E8627C',
  },
]

export function TrustBar({ variant = 'full' }: TrustBarProps) {
  // Hero : version 3 badges horizontaux animés pour la page d'accueil
  if (variant === 'hero') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-6 py-4">
        {trustBadges.slice(0, 3).map((badge, index) => {
          const Icon = badge.icon
          return (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-border shadow-xs spring-hover"
            >
              <Icon className="w-4 h-4" style={{ color: badge.color }} />
              <span className="text-sm font-semibold text-text">{badge.text}</span>
              <span className="text-xs text-text-muted hidden sm:inline">— {badge.description}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const isCompact = variant === 'compact'

  return (
    <div className={cn('w-full', isCompact ? 'py-3' : 'bg-surface-hover border-y border-border py-6')}>
      <div className="container mx-auto px-4">
        <div className={cn(
          isCompact
            ? 'flex items-center justify-center gap-4 md:gap-8 flex-wrap'
            : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6'
        )}>
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 transition-all duration-200 group',
                  !isCompact && 'p-3 rounded-xl hover:bg-white hover:shadow-sm'
                )}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${badge.color}12` }}
                >
                  <Icon className="w-5 h-5" style={{ color: badge.color }} />
                </div>
                {!isCompact && (
                  <div className="min-w-0">
                    <p className="font-semibold text-text text-sm">{badge.text}</p>
                    <p className="text-text-muted text-xs">{badge.description}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
