// ============================================================
// CRM DERMOTEC — Lead Score 360° (inspiré Klaviyo CDP 360°)
// 4 axes : Engagement, Lifetime Value, Health, Churn Risk
// ============================================================

export interface Score360 {
  // 4 axes (0-100 chacun)
  engagement: number       // Récence × fréquence × volume interactions
  lifetime_value: number   // CA réalisé + potentiel pipeline
  health: number           // Assiduité + satisfaction + paiements (stagiaires)
  churn_risk: number       // Risque de perte (0 = safe, 100 = danger)
  // Composite
  score_global: number     // Moyenne pondérée des 4 axes
  label: string            // Champion / Prometteur / À risque / Dormant / Perdu
  color: string            // Couleur associée
  // Détails
  signaux_positifs: string[]
  signaux_negatifs: string[]
  action_recommandee: string
}

interface RevenueGraphData {
  score?: number
  engagement_score?: number
  lifetime_value?: number
  nb_inscriptions?: number
  nb_formations_completees?: number
  nb_activites?: number
  nb_emails?: number
  nb_contacts_total?: number
  jours_sans_contact?: number
  jours_sans_activite?: number
  rappels_overdue?: number
  nb_financements_ok?: number
  nb_financements_en_cours?: number
  nb_financements_refuses?: number
  nb_annulees?: number
  formation_prix?: number
  statut?: string
  anciennete_jours?: number
}

/**
 * Calcule le score d'engagement (0-100)
 * Basé sur : récence, fréquence, volume
 */
function calculateEngagement(data: RevenueGraphData): { score: number; signaux: string[] } {
  const signaux: string[] = []
  let score = 0

  // Récence du contact (0-35)
  const jsc = data.jours_sans_contact ?? 999
  if (jsc <= 1) { score += 35; signaux.push('Contact hier ou aujourd\'hui') }
  else if (jsc <= 3) { score += 30 }
  else if (jsc <= 7) { score += 20 }
  else if (jsc <= 14) { score += 10 }
  else if (jsc <= 30) { score += 5 }

  // Fréquence des contacts (0-30)
  const nc = data.nb_contacts_total ?? 0
  if (nc >= 5) { score += 30; signaux.push(`${nc} contacts (très engagé)`) }
  else if (nc >= 3) { score += 20 }
  else if (nc >= 1) { score += 10 }

  // Volume d'activités (0-20)
  const na = data.nb_activites ?? 0
  if (na >= 10) { score += 20; signaux.push(`${na} activités enregistrées`) }
  else if (na >= 5) { score += 12 }
  else if (na >= 2) { score += 6 }

  // Emails envoyés (0-15)
  const ne = data.nb_emails ?? 0
  if (ne >= 3) { score += 15 }
  else if (ne >= 1) { score += 8 }

  return { score: Math.min(100, score), signaux }
}

/**
 * Calcule le score Lifetime Value (0-100)
 * Basé sur : CA réalisé + potentiel pipeline
 */
function calculateLTV(data: RevenueGraphData): { score: number; signaux: string[] } {
  const signaux: string[] = []
  let score = 0

  const ltv = data.lifetime_value ?? 0
  const prixFormation = data.formation_prix ?? 0
  const nbInscriptions = data.nb_inscriptions ?? 0

  // CA réalisé (0-50)
  if (ltv >= 5000) { score += 50; signaux.push(`LTV ${ltv.toLocaleString('fr-FR')}€ (client premium)`) }
  else if (ltv >= 2000) { score += 40; signaux.push(`LTV ${ltv.toLocaleString('fr-FR')}€`) }
  else if (ltv >= 1000) { score += 30 }
  else if (ltv > 0) { score += 15 }

  // Multi-inscriptions = client fidèle (0-20)
  if (nbInscriptions >= 3) { score += 20; signaux.push(`${nbInscriptions} inscriptions (fidèle)`) }
  else if (nbInscriptions >= 2) { score += 12 }
  else if (nbInscriptions >= 1) { score += 5 }

  // Potentiel pipeline (0-30)
  if (prixFormation >= 2000) { score += 30; signaux.push(`Formation à ${prixFormation}€ HT (potentiel élevé)`) }
  else if (prixFormation >= 1000) { score += 20 }
  else if (prixFormation >= 500) { score += 10 }

  return { score: Math.min(100, score), signaux }
}

/**
 * Calcule le Health Score (0-100) pour stagiaires
 * Basé sur : assiduité, financement, paiements
 */
function calculateHealth(data: RevenueGraphData): { score: number; signaux: string[] } {
  const signaux: string[] = []
  let score = 50 // Base neutre

  // Formations complétées = bon signe
  const completees = data.nb_formations_completees ?? 0
  if (completees >= 1) { score += 25; signaux.push(`${completees} formation(s) complétée(s)`) }

  // Financement validé = stabilité
  const finOk = data.nb_financements_ok ?? 0
  if (finOk >= 1) { score += 15; signaux.push('Financement validé') }

  // Financement en cours = en progression
  const finEnCours = data.nb_financements_en_cours ?? 0
  if (finEnCours >= 1) { score += 5 }

  // Annulations = mauvais signe
  const annulees = data.nb_annulees ?? 0
  if (annulees >= 2) { score -= 30; signaux.push(`${annulees} annulations (alerte)`) }
  else if (annulees >= 1) { score -= 15 }

  // Financement refusé = obstacle
  const finRefuse = data.nb_financements_refuses ?? 0
  if (finRefuse >= 1) { score -= 10; signaux.push('Financement refusé') }

  return { score: Math.max(0, Math.min(100, score)), signaux }
}

/**
 * Calcule le risque de churn (0-100, 100 = danger max)
 */
function calculateChurnRisk(data: RevenueGraphData): { score: number; signaux: string[] } {
  const signaux: string[] = []
  let risk = 0

  // Inactivité prolongée = danger principal
  const jsa = data.jours_sans_activite ?? 0
  if (jsa >= 60) { risk += 40; signaux.push(`${jsa} jours sans activité`) }
  else if (jsa >= 30) { risk += 25; signaux.push(`${jsa} jours sans activité`) }
  else if (jsa >= 14) { risk += 10 }

  // Sans contact prolongé
  const jsc = data.jours_sans_contact ?? 0
  if (jsc >= 30) { risk += 20; signaux.push(`${jsc} jours sans contact`) }
  else if (jsc >= 14) { risk += 10 }

  // Rappels overdue = on ne suit pas
  const ro = data.rappels_overdue ?? 0
  if (ro >= 3) { risk += 20; signaux.push(`${ro} rappels en retard`) }
  else if (ro >= 1) { risk += 10 }

  // Score CRM en baisse (< 30)
  const score = data.score ?? 50
  if (score < 20) { risk += 15; signaux.push('Score CRM très bas') }
  else if (score < 40) { risk += 5 }

  // Statut PERDU ou REPORTE
  if (data.statut === 'PERDU') { risk = 100; signaux.push('Statut PERDU') }
  if (data.statut === 'REPORTE') { risk += 15; signaux.push('Formation reportée') }

  return { score: Math.min(100, risk), signaux }
}

/**
 * Calcule le Score 360° complet d'un lead
 */
export function calculateScore360(data: RevenueGraphData): Score360 {
  const engagement = calculateEngagement(data)
  const ltv = calculateLTV(data)
  const health = calculateHealth(data)
  const churn = calculateChurnRisk(data)

  // Score global = moyenne pondérée (engagement et churn pèsent plus)
  const global = Math.round(
    engagement.score * 0.30 +
    ltv.score * 0.20 +
    health.score * 0.20 +
    (100 - churn.score) * 0.30 // Inverser churn : 0 risk = 100 points
  )

  // Label basé sur le score global
  let label: string
  let color: string
  let action: string

  if (global >= 80) {
    label = 'Champion'
    color = 'var(--color-success)'
    action = 'Proposer upsell ou parrainage'
  } else if (global >= 60) {
    label = 'Prometteur'
    color = '#3B82F6'
    action = 'Accélérer la conversion, proposer un RDV'
  } else if (global >= 40) {
    label = 'À surveiller'
    color = '#F59E0B'
    action = 'Relancer par le canal préféré'
  } else if (global >= 20) {
    label = 'À risque'
    color = '#F97316'
    action = 'Contact urgent pour comprendre le blocage'
  } else {
    label = 'Dormant'
    color = '#EF4444'
    action = 'Email de réactivation ou archiver'
  }

  return {
    engagement: engagement.score,
    lifetime_value: ltv.score,
    health: health.score,
    churn_risk: churn.score,
    score_global: global,
    label,
    color,
    signaux_positifs: [
      ...engagement.signaux.filter(s => !s.includes('alerte')),
      ...ltv.signaux.filter(s => !s.includes('alerte')),
      ...health.signaux.filter(s => !s.includes('alerte') && !s.includes('refusé')),
    ],
    signaux_negatifs: [
      ...churn.signaux,
      ...health.signaux.filter(s => s.includes('alerte') || s.includes('refusé')),
    ],
    action_recommandee: action,
  }
}

/**
 * Formatage texte du Score 360° pour l'agent IA
 */
export function score360ToText(score: Score360): string {
  return [
    `🎯 SCORE 360° : ${score.score_global}/100 — ${score.label}`,
    ``,
    `Engagement : ${score.engagement}/100`,
    `Lifetime Value : ${score.lifetime_value}/100`,
    `Santé : ${score.health}/100`,
    `Risque churn : ${score.churn_risk}/100`,
    ``,
    score.signaux_positifs.length ? `✅ ${score.signaux_positifs.join(' | ')}` : '',
    score.signaux_negatifs.length ? `⚠️ ${score.signaux_negatifs.join(' | ')}` : '',
    ``,
    `➡️ Action : ${score.action_recommandee}`,
  ].filter(Boolean).join('\n')
}
