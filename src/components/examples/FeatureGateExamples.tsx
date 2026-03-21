'use client'

// ============================================================
// CRM DERMOTEC — Exemples d'utilisation Feature Gating
// ============================================================

import { FeatureGate, FeatureGatedButton, UsageLimit } from '@/components/ui/FeatureGate'
import { useFeature, useFeatureWithUsage } from '@/hooks/use-feature'
import { tokens } from '@/lib/design-tokens'

// Exemple 1: Gating d'un bouton d'export
export function ExportButton() {
  return (
    <FeatureGate feature="export_csv">
      <button className="bg-primary text-white px-4 py-2 rounded">
        Exporter en CSV
      </button>
    </FeatureGate>
  )
}

// Exemple 2: Gating avec usage limite
export function ContactsSection() {
  const currentContacts = 127 // À récupérer depuis Supabase

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Contacts</h3>
        <UsageLimit feature="contacts_limit" current={currentContacts} />
      </div>

      <FeatureGate feature="contacts_limit" currentUsage={currentContacts}>
        <button className="bg-brand-primary text-white px-4 py-2 rounded">
          + Nouveau Contact
        </button>
      </FeatureGate>
    </div>
  )
}

// Exemple 3: Bouton avec gating intégré
export function AICoachButton() {
  const monthlyUsage = 15 // À récupérer depuis Supabase

  return (
    <div className="space-y-2">
      <FeatureGatedButton
        feature="ai_coach_monthly"
        currentUsage={monthlyUsage}
        onClick={() => console.log('Lancement AI Coach')}
        className="w-full"
      >
        🤖 Lancer l'AI Coach
      </FeatureGatedButton>

      <UsageLimit
        feature="ai_coach_monthly"
        current={monthlyUsage}
        showPercentage
      />
    </div>
  )
}

// Exemple 4: Section complète avec gating
export function AnalyticsAdvancedSection() {
  const analytics = useFeature('analytics_advanced')

  return (
    <div className="border border-surface-border rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Analytics Avancés</h3>

      <FeatureGate feature="analytics_advanced">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-surface-hover rounded-lg">
            <h4 className="font-medium">Conversion Rate</h4>
            <p className="text-2xl font-bold text-brand-primary">24.5%</p>
          </div>
          <div className="p-4 bg-surface-hover rounded-lg">
            <h4 className="font-medium">LTV</h4>
            <p className="text-2xl font-bold text-success-default">€2,845</p>
          </div>
          <div className="p-4 bg-surface-hover rounded-lg">
            <h4 className="font-medium">Churn Rate</h4>
            <p className="text-2xl font-bold text-danger-default">3.2%</p>
          </div>
          <div className="p-4 bg-surface-hover rounded-lg">
            <h4 className="font-medium">ROI</h4>
            <p className="text-2xl font-bold text-success-default">+186%</p>
          </div>
        </div>
      </FeatureGate>

      {!analytics.isAllowed && analytics.upgradeTo && (
        <p className="text-sm text-text-secondary mt-4">
          Débloquez ces métriques avec le plan {analytics.upgradeTo}
        </p>
      )}
    </div>
  )
}

// Exemple 5: Hook d'usage complet
export function PipelinesManager() {
  const pipelines = useFeatureWithUsage('pipelines_limit', 2) // 2 pipelines actuels

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Mes Pipelines</h3>
        <UsageLimit
          feature="pipelines_limit"
          current={pipelines.currentUsage}
          showPercentage
        />
      </div>

      <div className="space-y-2">
        <div className="p-3 border border-surface-border rounded-lg">
          Pipeline Formation 2025
        </div>
        <div className="p-3 border border-surface-border rounded-lg">
          Pipeline E-shop
        </div>
      </div>

      {pipelines.canAddOne ? (
        <button className="w-full p-3 border-2 border-dashed border-surface-border rounded-lg text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors">
          + Créer un nouveau pipeline
        </button>
      ) : (
        <FeatureGate
          feature="pipelines_limit"
          currentUsage={pipelines.currentUsage + 1}
          showLockIcon={false}
        >
          <button className="w-full p-3 border-2 border-dashed border-surface-border rounded-lg text-text-secondary">
            + Créer un nouveau pipeline
          </button>
        </FeatureGate>
      )}

      <p className="text-xs text-text-tertiary">
        {pipelines.isUnlimited
          ? 'Pipelines illimités'
          : `${pipelines.remaining} pipeline(s) restant(s)`
        }
      </p>
    </div>
  )
}

// Exemple 6: Design tokens usage
export function TokensDemo() {
  return (
    <div className="space-y-4 p-6">
      <h3 style={{ fontFamily: tokens.font.display, color: tokens.color.text.primary }}>
        Design Tokens Demo
      </h3>

      <div className="flex gap-2">
        <div
          className="w-12 h-12 rounded-md"
          style={{ backgroundColor: tokens.color.brand.primary }}
        />
        <div
          className="w-12 h-12 rounded-md"
          style={{ backgroundColor: tokens.color.success.default }}
        />
        <div
          className="w-12 h-12 rounded-md"
          style={{ backgroundColor: tokens.color.ai.default }}
        />
      </div>

      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: tokens.color.surface.hover,
          boxShadow: tokens.shadow.card,
          borderRadius: tokens.radius.lg
        }}
      >
        <p style={{ fontFamily: tokens.font.body, color: tokens.color.text.secondary }}>
          Exemple d'utilisation des design tokens
        </p>
      </div>
    </div>
  )
}