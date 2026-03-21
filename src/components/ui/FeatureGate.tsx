'use client'

// ============================================================
// CRM DERMOTEC — Feature Gating UI Component
// ============================================================

import { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useFeature } from '@/hooks/use-feature'
import { PLANS, type Feature } from '@/lib/plans/features'

interface FeatureGateProps {
  feature: Feature
  currentUsage?: number
  children: ReactNode
  fallback?: ReactNode
  className?: string
  showLockIcon?: boolean
  disableToast?: boolean
}

export function FeatureGate({
  feature,
  currentUsage = 0,
  children,
  fallback,
  className,
  showLockIcon = true,
  disableToast = false
}: FeatureGateProps) {
  const featureData = useFeature(feature)

  const isAllowed = featureData.canDo(currentUsage)

  // Si autorisé : render normal
  if (isAllowed) {
    return <>{children}</>
  }

  // Si fallback custom fourni
  if (fallback) {
    return <>{fallback}</>
  }

  const upgradePlan = featureData.upgradeTo

  const handleUpgradeClick = () => {
    if (disableToast) return

    const planInfo = upgradePlan ? PLANS[upgradePlan] : null
    const message = planInfo
      ? `Disponible dès le plan ${planInfo.name} (${planInfo.price}€/mois)`
      : 'Cette fonctionnalité nécessite un plan supérieur'

    toast.info(message, {
      action: planInfo ? {
        label: `Upgrader vers ${planInfo.name}`,
        onClick: () => {
          // TODO: redirection vers page pricing/billing
          console.log('Redirect to billing:', upgradePlan)
        }
      } : undefined
    })
  }

  // Rendu "verrouillé" : opacity réduite + lock icon + click handler
  return (
    <div
      className={cn(
        'relative cursor-not-allowed opacity-[0.35]',
        className
      )}
      onClick={handleUpgradeClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleUpgradeClick()
        }
      }}
      aria-label={`Feature verrouillée. ${upgradePlan ? `Disponible dès le plan ${PLANS[upgradePlan].name}` : 'Nécessite un plan supérieur'}`}
    >
      {children}

      {showLockIcon && (
        <Lock className="absolute top-2 right-2 h-4 w-4 text-gray-600 pointer-events-none" />
      )}
    </div>
  )
}

// Composant wrapper pour input/button spécifiques
interface FeatureGatedButtonProps {
  feature: Feature
  currentUsage?: number
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
}

export function FeatureGatedButton({
  feature,
  currentUsage = 0,
  children,
  onClick,
  disabled = false,
  className,
  variant = 'default'
}: FeatureGatedButtonProps) {
  const featureData = useFeature(feature)
  const isAllowed = featureData.canDo(currentUsage)

  const handleClick = () => {
    if (!isAllowed) {
      const upgradePlan = featureData.upgradeTo
      const planInfo = upgradePlan ? PLANS[upgradePlan] : null
      const message = planInfo
        ? `Disponible dès le plan ${planInfo.name} (${planInfo.price}€/mois)`
        : 'Cette fonctionnalité nécessite un plan supérieur'

      toast.info(message)
      return
    }

    onClick?.()
  }

  const buttonClasses = cn(
    'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      'bg-primary text-white hover:bg-primary-dark': variant === 'default' && isAllowed,
      'border border-border bg-background hover:bg-surface-hover': variant === 'outline' && isAllowed,
      'hover:bg-surface-hover': variant === 'ghost' && isAllowed,
      'opacity-50 cursor-not-allowed': !isAllowed || disabled
    },
    className
  )

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
      {!isAllowed && <Lock className="h-3 w-3" />}
    </button>
  )
}

// Wrapper pour limites quantitatives
interface UsageLimitProps {
  feature: Feature
  current: number
  children?: ReactNode
  showPercentage?: boolean
}

export function UsageLimit({ feature, current, children, showPercentage = true }: UsageLimitProps) {
  const featureData = useFeature(feature)

  if (typeof featureData.limit === 'boolean') {
    return null // Pas applicable aux features booléennes
  }

  const percentage = featureData.percentage(current)
  const isNearLimit = percentage > 80
  const isAtLimit = percentage >= 100

  const displayLimit = featureData.isUnlimited ? '∞' : featureData.limit.toString()

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={cn(
        'font-medium',
        isAtLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-text-secondary'
      )}>
        {current} / {displayLimit}
      </span>

      {showPercentage && !featureData.isUnlimited && (
        <div className="flex-1 bg-surface-active rounded-full h-1.5 max-w-20">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isAtLimit ? 'bg-error' : isNearLimit ? 'bg-warning' : 'bg-success'
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      )}

      {children}
    </div>
  )
}