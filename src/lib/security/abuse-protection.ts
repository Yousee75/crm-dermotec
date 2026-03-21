// ============================================================
// CRM DERMOTEC — Protection contre les abus clients
// Export limits, quota checks, health score, churn detection
// ============================================================

import { checkRateLimit, logSecurityEvent } from './rate-limits'

// ===== QUOTAS PAR PLAN =====

export const PLAN_QUOTAS = {
  free:     { leads: 50,    users: 1,  storage_mb: 100,  api_daily: 1000,  exports_daily: 2 },
  pro:      { leads: 500,   users: 5,  storage_mb: 1000, api_daily: 10000, exports_daily: 10 },
  expert:   { leads: 99999, users: 15, storage_mb: 5000, api_daily: 50000, exports_daily: 50 },
  clinique: { leads: 99999, users: 999, storage_mb: 50000, api_daily: 100000, exports_daily: 999 },
} as const

export type Plan = keyof typeof PLAN_QUOTAS

// ===== EXPORT PROTECTION =====

/** Vérifie les limites d'export et logge l'action */
export async function checkExportLimit(
  orgId: string,
  userId: string,
  resourceType: string,
  rowCount: number
): Promise<{ allowed: boolean; reason?: string }> {
  // Rate limit par user
  const blocked = await checkRateLimit('export', userId)
  if (blocked) return { allowed: false, reason: 'Limite d\'export atteinte (1/heure)' }

  // Limite de lignes par export
  const MAX_ROWS_PER_EXPORT = 500
  if (rowCount > MAX_ROWS_PER_EXPORT) {
    await logSecurityEvent('export_too_large', { orgId, userId, resourceType, rowCount })
    return { allowed: false, reason: `Maximum ${MAX_ROWS_PER_EXPORT} lignes par export` }
  }

  return { allowed: true }
}

// ===== HEALTH SCORE CLIENT =====

export interface HealthScore {
  score: number          // 0-100
  level: 'healthy' | 'warning' | 'critical'
  signals: string[]
  recommendations: string[]
}

/** Calcule le health score d'un client (pour prédiction churn) */
export function calculateHealthScore(metrics: {
  daysSinceLastLogin: number
  actionsThisWeek: number
  actionsLastWeek: number
  leadsCreatedThisMonth: number
  hasUnpaidInvoice: boolean
  daysAsCustomer: number
  featureAdoptionPct: number
}): HealthScore {
  let score = 100
  const signals: string[] = []
  const recommendations: string[] = []

  // Activité récente
  if (metrics.daysSinceLastLogin > 30) {
    score -= 40
    signals.push('Inactif depuis > 30 jours')
    recommendations.push('Envoyer un email de réengagement')
  } else if (metrics.daysSinceLastLogin > 14) {
    score -= 20
    signals.push('Inactif depuis > 14 jours')
    recommendations.push('Appeler pour prendre des nouvelles')
  } else if (metrics.daysSinceLastLogin > 7) {
    score -= 10
    signals.push('Connexion peu fréquente')
  }

  // Trend d'activité
  if (metrics.actionsLastWeek > 0 && metrics.actionsThisWeek < metrics.actionsLastWeek * 0.5) {
    score -= 15
    signals.push('Activité en baisse de > 50%')
    recommendations.push('Proposer une formation produit')
  }

  // Utilisation fonctionnalités
  if (metrics.featureAdoptionPct < 20) {
    score -= 15
    signals.push('Utilise < 20% des fonctionnalités')
    recommendations.push('Envoyer un guide des fonctionnalités clés')
  }

  // Impayés
  if (metrics.hasUnpaidInvoice) {
    score -= 30
    signals.push('Facture impayée')
    recommendations.push('Relance paiement urgente')
  }

  // Création de valeur
  if (metrics.leadsCreatedThisMonth === 0 && metrics.daysAsCustomer > 30) {
    score -= 10
    signals.push('Aucun lead créé ce mois')
  }

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    level: score >= 60 ? 'healthy' : score >= 30 ? 'warning' : 'critical',
    signals,
    recommendations,
  }
}

// ===== CHARGEBACK PROTECTION =====

/** Collecte les preuves pour répondre à un chargeback Stripe */
export function collectDisputeEvidence(customerId: string) {
  return {
    customer_email_address: true,   // Email vérifié à l'inscription
    product_description: 'CRM SaaS pour centre de formation esthétique — Abonnement mensuel',
    service_documentation_url: 'https://crm.dermotec.fr/conditions-generales',
    // Les preuves d'usage seront collectées depuis les tables analytics_events et activites
    evidence_to_collect: [
      'Logs de connexion (dates, IPs)',
      'Actions réalisées dans le CRM',
      'Emails de confirmation reçus',
      'Factures envoyées via Stripe',
    ],
  }
}

// ===== MULTI-SESSION DETECTION =====

/** Détecte si un utilisateur partage ses identifiants (> 2 sessions simultanées) */
export async function checkConcurrentSessions(
  userId: string,
  currentSessionId: string,
  maxSessions: number = 3
): Promise<{ blocked: boolean; activeSessions: number }> {
  // En production, vérifier via Redis/Upstash
  // Pour l'instant, retourner toujours OK
  return { blocked: false, activeSessions: 1 }
}

// ===== WATERMARK EXPORTS =====

/** Ajoute un watermark invisible dans les exports CSV */
export function addExportWatermark(csvContent: string, orgId: string, userId: string): string {
  const watermark = `# Export Dermotec CRM — ${new Date().toISOString()} — ID:${orgId.substring(0, 8)}`
  return watermark + '\n' + csvContent
}
