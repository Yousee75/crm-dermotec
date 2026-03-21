'use client'

// ============================================================
// CRM DERMOTEC — Hook Feature Gating
// ============================================================

import type { Feature, Plan } from '@/lib/plans/features'
import {
  getFeatureLimit,
  isFeatureAllowed,
  canDoAction,
  getUpgradePlan,
  getRemainingUsage,
  getUsagePercentage
} from '@/lib/plans/features'

export interface FeatureHookResult {
  plan: Plan
  limit: number | boolean
  isAllowed: boolean
  isUnlimited: boolean
  canDo: (current: number) => boolean
  upgradeTo: Plan | null
  remaining: (current: number) => number
  percentage: (current: number) => number
}

export function useFeature(feature: Feature): FeatureHookResult {
  // TODO: lire depuis Supabase user metadata ou table subscriptions
  // const { plan } = useCurrentPlan()
  const plan = useCurrentPlan()

  const limit = getFeatureLimit(feature, plan)

  return {
    plan,
    limit,
    isAllowed: isFeatureAllowed(feature, plan),
    isUnlimited: limit === Infinity,
    canDo: (current: number) => canDoAction(feature, plan, current),
    upgradeTo: getUpgradePlan(feature, plan),
    remaining: (current: number) => getRemainingUsage(feature, plan, current),
    percentage: (current: number) => getUsagePercentage(feature, plan, current),
  }
}

export function useCurrentPlan(): Plan {
  // TODO: Intégration avec Supabase
  // 1. Lire user metadata: user.user_metadata?.plan
  // 2. Ou lire depuis table subscriptions avec join equipe
  // 3. Gérer cache avec React Query/SWR

  // MVP: plan par défaut Pro
  return 'pro'
}

export function usePlanLimits(plan?: Plan) {
  const currentPlan = plan || useCurrentPlan()

  // Retourne toutes les limites pour un plan
  const limits: Record<Feature, number | boolean> = {} as Record<Feature, number | boolean>

  const features: Feature[] = [
    'contacts_limit',
    'pipelines_limit',
    'ai_coach_monthly',
    'email_sequences',
    'multi_users',
    'export_csv',
    'export_pdf',
    'api_access',
    'custom_branding',
    'sso',
    'automation',
    'analytics_advanced',
    'white_label',
    'priority_support'
  ]

  features.forEach(feature => {
    limits[feature] = getFeatureLimit(feature, currentPlan)
  })

  return {
    plan: currentPlan,
    limits
  }
}

export function useFeatureWithUsage(feature: Feature, currentUsage: number) {
  const featureData = useFeature(feature)

  return {
    ...featureData,
    currentUsage,
    remaining: featureData.remaining(currentUsage),
    percentage: featureData.percentage(currentUsage),
    isAtLimit: !featureData.canDo(currentUsage),
    canAddOne: featureData.canDo(currentUsage + 1),
  }
}