// ============================================================
// CRM DERMOTEC — Feature Gating par Plan
// ============================================================

export const PLANS = {
  free: { name: 'Découverte', price: 0, color: '#71717a' },      // zinc-500
  pro: { name: 'Pro', price: 49, color: '#d4a853' },            // amber-600
  expert: { name: 'Expert', price: 99, color: '#3b82f6' },      // blue-500
  clinique: { name: 'Clinique', price: null, color: '#22c55e' }, // green-500
} as const

export type Plan = keyof typeof PLANS

export const FEATURES = {
  // Limites quantitatives
  contacts_limit: { free: 50, pro: 500, expert: Infinity, clinique: Infinity },
  pipelines_limit: { free: 1, pro: 3, expert: Infinity, clinique: Infinity },
  ai_coach_monthly: { free: 0, pro: 20, expert: Infinity, clinique: Infinity },
  email_sequences: { free: 0, pro: 5, expert: Infinity, clinique: Infinity },
  multi_users: { free: 1, pro: 3, expert: 10, clinique: Infinity },

  // Features booléennes
  export_csv: { free: false, pro: true, expert: true, clinique: true },
  export_pdf: { free: false, pro: false, expert: true, clinique: true },
  api_access: { free: false, pro: false, expert: true, clinique: true },
  custom_branding: { free: false, pro: false, expert: false, clinique: true },
  sso: { free: false, pro: false, expert: false, clinique: true },

  // IA Assistant (requetes/jour)
  ai_assistant_daily: { free: 10, pro: 50, expert: 200, clinique: Infinity },

  // Features avancées
  automation: { free: false, pro: true, expert: true, clinique: true },
  analytics_advanced: { free: false, pro: false, expert: true, clinique: true },
  white_label: { free: false, pro: false, expert: false, clinique: true },
  priority_support: { free: false, pro: false, expert: true, clinique: true },
} as const

export type Feature = keyof typeof FEATURES

// Helper functions
export function getFeatureLimit(feature: Feature, plan: Plan): number | boolean {
  return FEATURES[feature][plan]
}

export function isFeatureAllowed(feature: Feature, plan: Plan): boolean {
  const limit = getFeatureLimit(feature, plan)
  return typeof limit === 'boolean' ? limit : limit > 0
}

export function canDoAction(feature: Feature, plan: Plan, currentUsage: number): boolean {
  const limit = getFeatureLimit(feature, plan)

  // Boolean features
  if (typeof limit === 'boolean') {
    return limit
  }

  // Numeric limits
  if (limit === Infinity) return true
  return currentUsage < limit
}

export function getUpgradePlan(feature: Feature, plan: Plan): Plan | null {
  const planOrder: Plan[] = ['free', 'pro', 'expert', 'clinique']
  const currentIndex = planOrder.indexOf(plan)

  // Trouver le plan minimal qui permet cette feature
  for (let i = currentIndex + 1; i < planOrder.length; i++) {
    const targetPlan = planOrder[i]
    if (isFeatureAllowed(feature, targetPlan)) {
      return targetPlan
    }
  }

  return null
}

export function getPlanLimits(plan: Plan) {
  const limits: Record<string, number | boolean> = {}

  for (const feature of Object.keys(FEATURES) as Feature[]) {
    limits[feature] = getFeatureLimit(feature, plan)
  }

  return limits
}

export function getRemainingUsage(feature: Feature, plan: Plan, currentUsage: number): number {
  const limit = getFeatureLimit(feature, plan)

  if (typeof limit === 'boolean') return limit ? 1 : 0
  if (limit === Infinity) return Infinity

  return Math.max(0, limit - currentUsage)
}

export function getUsagePercentage(feature: Feature, plan: Plan, currentUsage: number): number {
  const limit = getFeatureLimit(feature, plan)

  if (typeof limit === 'boolean') return limit ? 0 : 100
  if (limit === Infinity) return 0
  if (limit === 0) return 100

  return Math.min(100, (currentUsage / limit) * 100)
}