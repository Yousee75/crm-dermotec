'use client'

// ============================================================
// CRM DERMOTEC — Plan Badge Component
// ============================================================

import { PLANS, type Plan } from '@/lib/plans/features'
import { useCurrentPlan, usePlanLimits } from '@/hooks/use-feature'
import { cn } from '@/lib/utils'
import { Crown, Users, Zap, Building2 } from 'lucide-react'

interface PlanBadgeProps {
  plan?: Plan
  showName?: boolean
  showPrice?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PlanBadge({
  plan,
  showName = true,
  showPrice = false,
  size = 'md',
  className
}: PlanBadgeProps) {
  const currentPlan = plan || useCurrentPlan()
  const planInfo = PLANS[currentPlan]

  const icons = {
    free: Users,
    pro: Zap,
    expert: Crown,
    clinique: Building2
  }

  const Icon = icons[currentPlan]

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-medium',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: planInfo.color + '20', // 20% opacity
        color: planInfo.color,
        border: `1px solid ${planInfo.color}40`
      }}
    >
      <Icon className={iconSizes[size]} />

      {showName && (
        <span>{planInfo.name}</span>
      )}

      {showPrice && planInfo.price !== null && (
        <span className="font-semibold">
          {planInfo.price}€/mois
        </span>
      )}

      {showPrice && planInfo.price === null && (
        <span className="font-semibold">
          Sur devis
        </span>
      )}
    </div>
  )
}

interface PlanComparisonProps {
  currentPlan?: Plan
  targetPlan: Plan
  features?: string[]
}

export function PlanComparison({
  currentPlan,
  targetPlan,
  features = []
}: PlanComparisonProps) {
  const current = currentPlan || useCurrentPlan()
  const currentLimits = usePlanLimits(current)
  const targetLimits = usePlanLimits(targetPlan)

  const currentInfo = PLANS[current]
  const targetInfo = PLANS[targetPlan]

  return (
    <div className="bg-surface-default border border-surface-border rounded-lg p-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Plan actuel */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PlanBadge plan={current} size="lg" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">Votre plan actuel</p>
            {currentInfo.price !== null && (
              <p className="text-lg font-semibold">
                {currentInfo.price}€/mois
              </p>
            )}
          </div>
        </div>

        {/* Plan cible */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PlanBadge plan={targetPlan} size="lg" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">Plan recommandé</p>
            {targetInfo.price !== null ? (
              <p className="text-lg font-semibold text-success-default">
                {targetInfo.price}€/mois
              </p>
            ) : (
              <p className="text-lg font-semibold text-ai-default">
                Sur devis
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Comparaison des features */}
      {features.length > 0 && (
        <div className="mt-6 pt-6 border-t border-surface-border">
          <h4 className="font-medium mb-3">Comparaison des fonctionnalités</h4>
          <div className="space-y-2">
            {features.map(feature => {
              const currentLimit = currentLimits.limits[feature as keyof typeof currentLimits.limits]
              const targetLimit = targetLimits.limits[feature as keyof typeof targetLimits.limits]

              return (
                <div key={feature} className="flex justify-between text-sm">
                  <span className="capitalize">{feature.replace('_', ' ')}</span>
                  <div className="flex gap-4">
                    <span className="text-text-secondary">
                      {currentLimit === Infinity ? '∞' : currentLimit.toString()}
                    </span>
                    <span className="text-success-default font-medium">
                      {targetLimit === Infinity ? '∞' : targetLimit.toString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}