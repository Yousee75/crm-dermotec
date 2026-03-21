// ============================================================
// CRM DERMOTEC — Tests rapides Feature Gating
// ============================================================

import {
  getFeatureLimit,
  isFeatureAllowed,
  canDoAction,
  getUpgradePlan,
  getRemainingUsage,
  getUsagePercentage
} from './features'

// Tests rapides
console.log('=== TESTS FEATURE GATING ===')

// Test 1: Limites par plan
console.log('contacts_limit free:', getFeatureLimit('contacts_limit', 'free')) // 50
console.log('contacts_limit pro:', getFeatureLimit('contacts_limit', 'pro')) // 500
console.log('contacts_limit expert:', getFeatureLimit('contacts_limit', 'expert')) // Infinity

// Test 2: Features booléennes
console.log('export_csv free:', isFeatureAllowed('export_csv', 'free')) // false
console.log('export_csv pro:', isFeatureAllowed('export_csv', 'pro')) // true

// Test 3: Usage checks
console.log('Can add contact (free, 49 used):', canDoAction('contacts_limit', 'free', 49)) // true
console.log('Can add contact (free, 50 used):', canDoAction('contacts_limit', 'free', 50)) // false

// Test 4: Upgrade suggestions
console.log('Upgrade plan for export_pdf from free:', getUpgradePlan('export_pdf', 'free')) // 'expert'
console.log('Upgrade plan for sso from pro:', getUpgradePlan('sso', 'pro')) // 'clinique'

// Test 5: Usage calculations
console.log('Remaining contacts (free, 30 used):', getRemainingUsage('contacts_limit', 'free', 30)) // 20
console.log('Usage percentage (free, 40/50):', getUsagePercentage('contacts_limit', 'free', 40)) // 80

console.log('=== TESTS COMPLETS ===')

export function runFeatureTests() {
  const tests = [
    // Limites quantitatives
    { feature: 'contacts_limit', plan: 'free', expected: 50 },
    { feature: 'contacts_limit', plan: 'expert', expected: Infinity },

    // Features booléennes
    { feature: 'export_csv', plan: 'free', expected: false },
    { feature: 'export_csv', plan: 'pro', expected: true },

    // Usage checks
    { feature: 'ai_coach_monthly', plan: 'pro', usage: 15, canDo: true },
    { feature: 'ai_coach_monthly', plan: 'pro', usage: 20, canDo: false },

    // Upgrade paths
    { feature: 'api_access', plan: 'free', upgradeTo: 'expert' },
    { feature: 'custom_branding', plan: 'expert', upgradeTo: 'clinique' }
  ] as const

  tests.forEach((test, i) => {
    if ('expected' in test) {
      const result = getFeatureLimit(test.feature as any, test.plan as any)
      console.log(`Test ${i + 1}: ${result === test.expected ? '✅' : '❌'} ${test.feature} ${test.plan}`)
    }

    if ('canDo' in test) {
      const result = canDoAction(test.feature as any, test.plan as any, test.usage!)
      console.log(`Test ${i + 1}: ${result === test.canDo ? '✅' : '❌'} can do ${test.feature}`)
    }

    if ('upgradeTo' in test) {
      const result = getUpgradePlan(test.feature as any, test.plan as any)
      console.log(`Test ${i + 1}: ${result === test.upgradeTo ? '✅' : '❌'} upgrade to ${test.upgradeTo}`)
    }
  })
}