// ============================================================
// CRM DERMOTEC — Feature Gate basé sur les plans SaaS
// Contrôle d'accès aux fonctionnalités par plan
// ============================================================

import { ReactNode } from 'react'
import { useCurrentPlan } from '@/hooks/use-subscription'
import type { PlanSaaS } from '@/types/subscription'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Lock, Zap, Crown } from 'lucide-react'

interface FeatureGateProps {
  /** Plans minimum requis pour cette fonctionnalité */
  requiredPlan: PlanSaaS | PlanSaaS[]
  /** Contenu à afficher si l'utilisateur a accès */
  children: ReactNode
  /** Message personnalisé si accès refusé */
  fallbackMessage?: string
  /** Afficher un CTA d'upgrade */
  showUpgrade?: boolean
  /** Callback appelé quand l'utilisateur clique sur upgrade */
  onUpgradeClick?: () => void
  /** Mode d'affichage : masquer ou remplacer par un placeholder */
  mode?: 'hidden' | 'placeholder'
}

function getPlanLevel(plan: PlanSaaS): number {
  const levels = { decouverte: 0, pro: 1, expert: 2, clinique: 3 }
  return levels[plan] || 0
}

function getPlanIcon(plan: PlanSaaS) {
  switch (plan) {
    case 'pro': return <Zap className="w-4 h-4" />
    case 'expert': return <Crown className="w-4 h-4" />
    case 'clinique': return <Crown className="w-4 h-4" />
    default: return <Lock className="w-4 h-4" />
  }
}

function getPlanColor(plan: PlanSaaS) {
  switch (plan) {
    case 'pro': return 'bg-primary text-white'
    case 'expert': return 'bg-action text-white'
    case 'clinique': return 'bg-accent text-white'
    default: return 'bg-muted text-muted-foreground'
  }
}

export function FeatureGate({
  requiredPlan,
  children,
  fallbackMessage,
  showUpgrade = true,
  onUpgradeClick,
  mode = 'placeholder',
}: FeatureGateProps) {
  const { plan, isLoading } = useCurrentPlan()

  // Loading state
  if (isLoading) {
    return mode === 'hidden' ? null : (
      <div className="bg-muted animate-pulse rounded-lg h-20" />
    )
  }

  // Vérifier l'accès
  const userPlanLevel = getPlanLevel(plan)
  const requiredPlans = Array.isArray(requiredPlan) ? requiredPlan : [requiredPlan]
  const minRequiredLevel = Math.min(...requiredPlans.map(getPlanLevel))

  const hasAccess = userPlanLevel >= minRequiredLevel

  // Si accès accordé, afficher le contenu
  if (hasAccess) {
    return <>{children}</>
  }

  // Si mode masqué et pas d'accès
  if (mode === 'hidden') {
    return null
  }

  // Trouver le plan minimum requis pour l'upgrade
  const targetPlan = requiredPlans.find(p => getPlanLevel(p) === minRequiredLevel) || 'pro'

  return (
    <div className="border border-border rounded-lg p-6 bg-surface/50 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        {getPlanIcon(targetPlan)}
        <Badge className={getPlanColor(targetPlan)}>
          {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}
        </Badge>
      </div>

      <h3 className="font-medium mb-2">
        Fonctionnalité {targetPlan}
      </h3>

      <p className="text-sm text-muted-foreground mb-4">
        {fallbackMessage || `Cette fonctionnalité nécessite un plan ${targetPlan} ou supérieur.`}
      </p>

      {showUpgrade && (
        <Button
          size="sm"
          className="bg-primary hover:bg-primary-dark"
          onClick={onUpgradeClick}
        >
          Passer au plan {targetPlan}
        </Button>
      )}
    </div>
  )
}

// ============================================================
// Hook pour vérifier l'accès à une fonctionnalité
// ============================================================
export function useFeatureAccess(requiredPlan: PlanSaaS | PlanSaaS[]): {
  hasAccess: boolean
  userPlan: PlanSaaS
  requiredPlan: PlanSaaS
  isLoading: boolean
} {
  const { plan, isLoading } = useCurrentPlan()

  const userPlanLevel = getPlanLevel(plan)
  const requiredPlans = Array.isArray(requiredPlan) ? requiredPlan : [requiredPlan]
  const minRequiredLevel = Math.min(...requiredPlans.map(getPlanLevel))
  const targetPlan = requiredPlans.find(p => getPlanLevel(p) === minRequiredLevel) || 'pro'

  return {
    hasAccess: userPlanLevel >= minRequiredLevel,
    userPlan: plan,
    requiredPlan: targetPlan,
    isLoading,
  }
}

// ============================================================
// Composant simple pour afficher le plan actuel
// ============================================================
export function CurrentPlanBadge({ className }: { className?: string }) {
  const { plan, isLoading } = useCurrentPlan()

  if (isLoading) {
    return <div className="w-16 h-6 bg-muted animate-pulse rounded" />
  }

  return (
    <Badge className={`${getPlanColor(plan)} ${className}`}>
      <span className="flex items-center gap-1">
        {getPlanIcon(plan)}
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    </Badge>
  )
}