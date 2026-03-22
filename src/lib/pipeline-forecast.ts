// ============================================================
// CRM DERMOTEC — Pipeline Forecast (inspiré Gong Forecast)
// Probabilités, weighted pipeline, velocity, prévisions CA
// ============================================================

import type { StatutLead } from '@/types'

// --- Probabilités de conversion par étape pipeline ---
// Basées sur les données secteur formation professionnelle esthétique
// Source : moyennes constatées centres de formation certifiés Qualiopi

export const PIPELINE_PROBABILITIES: Record<StatutLead, number> = {
  NOUVEAU: 0.05,
  CONTACTE: 0.12,
  QUALIFIE: 0.30,
  FINANCEMENT_EN_COURS: 0.50,
  INSCRIT: 0.85,
  EN_FORMATION: 0.95,
  FORME: 1.0,
  ALUMNI: 1.0,
  REPORTE: 0.15,
  PERDU: 0,
  SPAM: 0,
} as const

// Étapes actives du pipeline (excluant terminaux)
export const ACTIVE_PIPELINE_STAGES: StatutLead[] = [
  'NOUVEAU',
  'CONTACTE',
  'QUALIFIE',
  'FINANCEMENT_EN_COURS',
  'INSCRIT',
  'EN_FORMATION',
] as const

// Étapes terminales
export const TERMINAL_STAGES: StatutLead[] = [
  'FORME',
  'ALUMNI',
  'PERDU',
  'SPAM',
] as const

// --- Types ---

export interface PipelineStageMetrics {
  statut: StatutLead
  nb_leads: number
  probabilite: number
  ca_brut: number       // Si tout converti
  ca_pondere: number    // CA × probabilité
  prix_moyen: number
}

export interface PipelineForecast {
  // Résumé
  total_leads_actifs: number
  ca_brut_total: number          // Somme si tout le pipeline convertit
  ca_pondere_total: number       // Somme pondérée par probabilités
  ca_pondere_30j: number         // Forecast 30 jours
  ca_pondere_60j: number         // Forecast 60 jours
  ca_pondere_90j: number         // Forecast 90 jours
  // Détail par étape
  par_etape: PipelineStageMetrics[]
  // Taux conversion historique
  taux_conversion_global: number
  // Velocity
  delai_moyen_conversion_jours: number
}

export interface VelocityMetrics {
  statut_origine: string
  statut_destination: string
  nb_transitions: number
  duree_moyenne_jours: number
  duree_mediane_jours: number
}

export interface WinPattern {
  dimension: 'source' | 'statut_pro' | 'formation' | 'commercial'
  valeur: string
  nb_wins: number
  delai_moyen_jours: number
  panier_moyen: number
  avec_financement: number
  pct_finance: number
}

// --- Fonctions de calcul ---

/**
 * Calcule le CA pondéré d'un lead individuel
 */
export function calculateWeightedValue(
  prix_formation: number,
  statut: StatutLead
): number {
  const proba = PIPELINE_PROBABILITIES[statut] ?? 0
  return Math.round(prix_formation * proba)
}

/**
 * Calcule le forecast pipeline complet depuis les données de la vue
 */
export function calculateForecast(
  stageData: PipelineStageMetrics[],
  velocityData: VelocityMetrics[],
  tauxConversion: number
): PipelineForecast {
  const activeStages = stageData.filter(
    s => ACTIVE_PIPELINE_STAGES.includes(s.statut as StatutLead)
  )

  const totalLeadsActifs = activeStages.reduce((sum, s) => sum + s.nb_leads, 0)
  const caBrutTotal = activeStages.reduce((sum, s) => sum + s.ca_brut, 0)
  const caPondereTotal = activeStages.reduce((sum, s) => sum + s.ca_pondere, 0)

  // Forecast temporel : basé sur velocity + pipeline
  // Approximation : leads proches de la conversion ont plus de chances de closer dans 30j
  const ca30j = activeStages
    .filter(s => ['INSCRIT', 'EN_FORMATION', 'FINANCEMENT_EN_COURS'].includes(s.statut))
    .reduce((sum, s) => sum + s.ca_pondere, 0)

  const ca60j = ca30j + activeStages
    .filter(s => s.statut === 'QUALIFIE')
    .reduce((sum, s) => sum + s.ca_pondere, 0)

  const ca90j = ca60j + activeStages
    .filter(s => ['CONTACTE', 'REPORTE'].includes(s.statut))
    .reduce((sum, s) => sum + s.ca_pondere, 0)

  // Velocity moyenne
  const avgVelocity = velocityData.length > 0
    ? velocityData.reduce((sum, v) => sum + v.duree_moyenne_jours, 0) / velocityData.length
    : 0

  return {
    total_leads_actifs: totalLeadsActifs,
    ca_brut_total: Math.round(caBrutTotal),
    ca_pondere_total: Math.round(caPondereTotal),
    ca_pondere_30j: Math.round(ca30j),
    ca_pondere_60j: Math.round(ca60j),
    ca_pondere_90j: Math.round(ca90j),
    par_etape: activeStages,
    taux_conversion_global: tauxConversion,
    delai_moyen_conversion_jours: Math.round(avgVelocity),
  }
}

/**
 * Labels et couleurs pour l'affichage pipeline
 */
export function getPipelineStageInfo(statut: StatutLead) {
  const info: Record<string, { label: string; color: string; emoji: string }> = {
    NOUVEAU: { label: 'Nouveau', color: '#6B7280', emoji: '🆕' },
    CONTACTE: { label: 'Contacté', color: '#3B82F6', emoji: '📞' },
    QUALIFIE: { label: 'Qualifié', color: '#8B5CF6', emoji: '✅' },
    FINANCEMENT_EN_COURS: { label: 'Financement', color: '#F59E0B', emoji: '💰' },
    INSCRIT: { label: 'Inscrit', color: '#10B981', emoji: '📋' },
    EN_FORMATION: { label: 'En formation', color: 'var(--color-success)', emoji: '🎓' },
    FORME: { label: 'Formé', color: '#059669', emoji: '🏆' },
    ALUMNI: { label: 'Alumni', color: '#047857', emoji: '⭐' },
    REPORTE: { label: 'Reporté', color: '#F97316', emoji: '⏸️' },
    PERDU: { label: 'Perdu', color: '#EF4444', emoji: '❌' },
    SPAM: { label: 'Spam', color: '#9CA3AF', emoji: '🚫' },
  }
  return info[statut] || { label: statut, color: '#6B7280', emoji: '❓' }
}

/**
 * Génère un résumé texte du forecast pour l'agent IA
 */
export function forecastToText(forecast: PipelineForecast): string {
  const lines = [
    `📊 PIPELINE FORECAST`,
    ``,
    `Leads actifs : ${forecast.total_leads_actifs}`,
    `CA brut (si 100% conversion) : ${forecast.ca_brut_total.toLocaleString('fr-FR')} € HT`,
    `CA pondéré (prévisionnel) : ${forecast.ca_pondere_total.toLocaleString('fr-FR')} € HT`,
    ``,
    `Prévisions :`,
    `  30 jours : ${forecast.ca_pondere_30j.toLocaleString('fr-FR')} € HT`,
    `  60 jours : ${forecast.ca_pondere_60j.toLocaleString('fr-FR')} € HT`,
    `  90 jours : ${forecast.ca_pondere_90j.toLocaleString('fr-FR')} € HT`,
    ``,
    `Taux conversion global : ${forecast.taux_conversion_global}%`,
    `Délai moyen conversion : ${forecast.delai_moyen_conversion_jours} jours`,
    ``,
    `Par étape :`,
  ]

  for (const etape of forecast.par_etape) {
    const info = getPipelineStageInfo(etape.statut as StatutLead)
    lines.push(
      `  ${info.emoji} ${info.label} : ${etape.nb_leads} leads | ${etape.ca_pondere.toLocaleString('fr-FR')} € (${Math.round(etape.probabilite * 100)}% proba)`
    )
  }

  return lines.join('\n')
}

/**
 * Génère un résumé des win patterns pour le coaching IA
 */
export function winPatternsToText(patterns: WinPattern[]): string {
  const lines = [
    `🏆 PATTERNS GAGNANTS (6 derniers mois)`,
    ``,
  ]

  const byDimension = patterns.reduce((acc, p) => {
    if (!acc[p.dimension]) acc[p.dimension] = []
    acc[p.dimension].push(p)
    return acc
  }, {} as Record<string, WinPattern[]>)

  const dimensionLabels: Record<string, string> = {
    source: 'Par source',
    statut_pro: 'Par profil professionnel',
    formation: 'Par formation',
    commercial: 'Par commercial',
  }

  for (const [dim, pats] of Object.entries(byDimension)) {
    lines.push(`📌 ${dimensionLabels[dim] || dim} :`)
    // Trier par nb_wins DESC
    const sorted = pats.sort((a, b) => b.nb_wins - a.nb_wins)
    for (const p of sorted.slice(0, 5)) {
      lines.push(
        `  ${p.valeur || 'N/A'} : ${p.nb_wins} conversions | ${p.delai_moyen_jours}j avg | ${p.panier_moyen.toLocaleString('fr-FR')} € panier | ${p.pct_finance}% financé`
      )
    }
    lines.push(``)
  }

  return lines.join('\n')
}
