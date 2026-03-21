'use client'

// ============================================================
// CRM DERMOTEC — Page démo Feature Gating
// ============================================================

import { useState } from 'react'
import { FeatureGate, FeatureGatedButton, UsageLimit } from '@/components/ui/FeatureGate'
import { PlanBadge, PlanComparison } from '@/components/ui/PlanBadge'
import { useFeature, useCurrentPlan, usePlanLimits } from '@/hooks/use-feature'
import { tokens } from '@/lib/design-tokens'
import { PLANS, type Plan } from '@/lib/plans/features'
import { Download, Users, Zap, Crown, FileText, Settings, BarChart3 } from 'lucide-react'

export default function FeatureGatingDemo() {
  const [mockUsage, setMockUsage] = useState({
    contacts: 127,
    pipelines: 2,
    aiCoach: 15,
    emailSequences: 3
  })

  const currentPlan = useCurrentPlan()
  const planLimits = usePlanLimits()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header avec plan actuel */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: tokens.font.display }}>
          Feature Gating Demo
        </h1>
        <div className="flex items-center justify-center gap-4">
          <span className="text-text-secondary">Plan actuel :</span>
          <PlanBadge showName showPrice size="lg" />
        </div>
      </div>

      {/* Section 1: Boutons d'export */}
      <section className="border border-surface-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exports de données
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureGate feature="export_csv">
            <button className="w-full flex items-center justify-center gap-2 bg-success-default text-white px-4 py-2 rounded-lg hover:opacity-90">
              <FileText className="h-4 w-4" />
              Exporter en CSV
            </button>
          </FeatureGate>

          <FeatureGate feature="export_pdf">
            <button className="w-full flex items-center justify-center gap-2 bg-danger-default text-white px-4 py-2 rounded-lg hover:opacity-90">
              <FileText className="h-4 w-4" />
              Exporter en PDF
            </button>
          </FeatureGate>
        </div>
      </section>

      {/* Section 2: Gestion des contacts */}
      <section className="border border-surface-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des contacts
          </h2>
          <UsageLimit
            feature="contacts_limit"
            current={mockUsage.contacts}
            showPercentage
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-hover rounded-lg text-center">
              <p className="text-2xl font-bold" style={{ color: tokens.color.brand.primary }}>
                {mockUsage.contacts}
              </p>
              <p className="text-sm text-text-secondary">Contacts actuels</p>
            </div>

            <FeatureGate feature="contacts_limit" currentUsage={mockUsage.contacts}>
              <button
                className="w-full h-full border-2 border-dashed border-brand-primary text-brand-primary rounded-lg hover:bg-brand-subtle transition-colors"
                onClick={() => setMockUsage(prev => ({ ...prev, contacts: prev.contacts + 1 }))}
              >
                + Nouveau Contact
              </button>
            </FeatureGate>

            <FeatureGate feature="contacts_limit" currentUsage={mockUsage.contacts + 10}>
              <button className="w-full h-full border-2 border-dashed border-surface-border text-text-secondary rounded-lg">
                + Import en masse
              </button>
            </FeatureGate>
          </div>
        </div>
      </section>

      {/* Section 3: IA Coach */}
      <section className="border border-surface-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5" style={{ color: tokens.color.ai.default }} />
            IA Coach
          </h2>
          <UsageLimit
            feature="ai_coach_monthly"
            current={mockUsage.aiCoach}
            showPercentage
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FeatureGatedButton
              feature="ai_coach_monthly"
              currentUsage={mockUsage.aiCoach}
              onClick={() => setMockUsage(prev => ({ ...prev, aiCoach: prev.aiCoach + 1 }))}
              className="w-full bg-ai-default text-white"
            >
              🤖 Analyser ce lead
            </FeatureGatedButton>

            <FeatureGatedButton
              feature="ai_coach_monthly"
              currentUsage={mockUsage.aiCoach}
              onClick={() => setMockUsage(prev => ({ ...prev, aiCoach: prev.aiCoach + 1 }))}
              className="w-full bg-ai-default text-white"
            >
              ✨ Générer email de relance
            </FeatureGatedButton>
          </div>

          <div className="p-4 bg-ai-subtle border border-ai-border rounded-lg">
            <h3 className="font-medium mb-2">Suggestions IA</h3>
            <FeatureGate feature="ai_coach_monthly" currentUsage={mockUsage.aiCoach}>
              <div className="space-y-2 text-sm">
                <p>• Ce lead a 87% de chance de conversion</p>
                <p>• Relancer dans 2 jours avec formation "Microblading"</p>
                <p>• Proposer financement OPCO</p>
              </div>
            </FeatureGate>
          </div>
        </div>
      </section>

      {/* Section 4: Analytics avancés */}
      <section className="border border-surface-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics avancés
        </h2>

        <FeatureGate feature="analytics_advanced">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-surface-hover rounded-lg text-center">
              <p className="text-2xl font-bold text-brand-primary">24.5%</p>
              <p className="text-sm text-text-secondary">Taux conversion</p>
            </div>
            <div className="p-4 bg-surface-hover rounded-lg text-center">
              <p className="text-2xl font-bold text-success-default">€2,845</p>
              <p className="text-sm text-text-secondary">LTV moyenne</p>
            </div>
            <div className="p-4 bg-surface-hover rounded-lg text-center">
              <p className="text-2xl font-bold text-warning-default">3.2%</p>
              <p className="text-sm text-text-secondary">Churn rate</p>
            </div>
            <div className="p-4 bg-surface-hover rounded-lg text-center">
              <p className="text-2xl font-bold text-success-default">+186%</p>
              <p className="text-sm text-text-secondary">ROI</p>
            </div>
          </div>
        </FeatureGate>
      </section>

      {/* Section 5: Comparaison plans */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Comparaison des plans</h2>
        <PlanComparison
          targetPlan="expert"
          features={['contacts_limit', 'ai_coach_monthly', 'export_pdf', 'analytics_advanced']}
        />
      </section>

      {/* Section 6: Tous les plans */}
      <section className="border border-surface-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Tous les plans disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(Object.entries(PLANS) as [Plan, typeof PLANS[Plan]][]).map(([planId, planInfo]) => (
            <div
              key={planId}
              className="border border-surface-border rounded-lg p-4 text-center space-y-3"
              style={{ borderColor: planInfo.color + '40' }}
            >
              <PlanBadge plan={planId} showName size="lg" />

              <div>
                {planInfo.price !== null ? (
                  <p className="text-2xl font-bold">{planInfo.price}€</p>
                ) : (
                  <p className="text-lg font-semibold text-ai-default">Sur devis</p>
                )}
                <p className="text-sm text-text-secondary">par mois</p>
              </div>

              <div className="text-xs text-text-tertiary space-y-1">
                <p>Contacts: {planLimits.limits.contacts_limit === Infinity ? '∞' : planLimits.limits.contacts_limit}</p>
                <p>Pipelines: {planLimits.limits.pipelines_limit === Infinity ? '∞' : planLimits.limits.pipelines_limit}</p>
                <p>AI Coach: {planLimits.limits.ai_coach_monthly === Infinity ? '∞' : planLimits.limits.ai_coach_monthly}/mois</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section debug */}
      <section className="border border-surface-border rounded-lg p-6 bg-surface-hover">
        <h3 className="font-semibold mb-3">Debug Info</h3>
        <div className="text-sm space-y-2 font-mono">
          <p>Plan actuel: <code>{currentPlan}</code></p>
          <p>Limites: <code>{JSON.stringify(planLimits.limits, null, 2)}</code></p>
          <p>Usage mock: <code>{JSON.stringify(mockUsage, null, 2)}</code></p>
        </div>
      </section>
    </div>
  )
}