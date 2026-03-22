// ============================================================
// CRM DERMOTEC — Win Patterns & Coaching IA (inspiré Gong Enable)
// Analyse les leads gagnés pour extraire les patterns de succès
// ============================================================

import type { WinPattern } from './pipeline-forecast'

export interface CoachingInsight {
  titre: string
  description: string
  impact: 'high' | 'medium' | 'low'
  categorie: 'source' | 'profil' | 'timing' | 'financement' | 'formation'
}

/**
 * Génère des insights coaching à partir des win patterns
 * Injectables dans le system prompt de l'agent IA
 */
export function generateCoachingInsights(patterns: WinPattern[]): CoachingInsight[] {
  const insights: CoachingInsight[] = []

  // Grouper par dimension
  const bySource = patterns.filter(p => p.dimension === 'source')
  const byProfil = patterns.filter(p => p.dimension === 'statut_pro')
  const byFormation = patterns.filter(p => p.dimension === 'formation')
  const byCommercial = patterns.filter(p => p.dimension === 'commercial')

  // --- Insights source ---
  if (bySource.length > 0) {
    const topSource = bySource.sort((a, b) => b.nb_wins - a.nb_wins)[0]
    if (topSource) {
      insights.push({
        titre: `Source #1 : ${topSource.valeur}`,
        description: `${topSource.nb_wins} conversions, délai moyen ${topSource.delai_moyen_jours}j, panier ${topSource.panier_moyen}€. Prioriser les leads de cette source.`,
        impact: 'high',
        categorie: 'source',
      })
    }

    // Source avec le meilleur panier
    const bestBasket = bySource.sort((a, b) => b.panier_moyen - a.panier_moyen)[0]
    if (bestBasket && bestBasket.valeur !== topSource?.valeur) {
      insights.push({
        titre: `Panier le plus élevé : ${bestBasket.valeur}`,
        description: `Panier moyen ${bestBasket.panier_moyen}€. Ces leads valent l'investissement en temps.`,
        impact: 'medium',
        categorie: 'source',
      })
    }

    // Source la plus rapide
    const fastest = bySource.filter(s => s.delai_moyen_jours > 0).sort((a, b) => a.delai_moyen_jours - b.delai_moyen_jours)[0]
    if (fastest && fastest.delai_moyen_jours < 30) {
      insights.push({
        titre: `Conversion la plus rapide : ${fastest.valeur}`,
        description: `Seulement ${fastest.delai_moyen_jours} jours en moyenne. Quick wins à prioriser.`,
        impact: 'medium',
        categorie: 'timing',
      })
    }
  }

  // --- Insights profil ---
  if (byProfil.length > 0) {
    const topProfil = byProfil.sort((a, b) => b.nb_wins - a.nb_wins)[0]
    if (topProfil) {
      insights.push({
        titre: `Profil cible : ${topProfil.valeur}`,
        description: `${topProfil.nb_wins} conversions, ${topProfil.pct_finance}% financé. Adapter le discours pour ce profil.`,
        impact: 'high',
        categorie: 'profil',
      })
    }

    // Profil le plus financé
    const mostFinanced = byProfil.sort((a, b) => b.pct_finance - a.pct_finance)[0]
    if (mostFinanced && mostFinanced.pct_finance >= 50) {
      insights.push({
        titre: `${mostFinanced.valeur} : ${mostFinanced.pct_finance}% financé`,
        description: `Toujours proposer le financement en premier pour ce profil. Organismes adaptés à identifier.`,
        impact: 'high',
        categorie: 'financement',
      })
    }
  }

  // --- Insights formation ---
  if (byFormation.length > 0) {
    const topFormation = byFormation.sort((a, b) => b.nb_wins - a.nb_wins)[0]
    if (topFormation) {
      insights.push({
        titre: `Formation star : ${topFormation.valeur}`,
        description: `${topFormation.nb_wins} inscriptions, panier ${topFormation.panier_moyen}€, délai ${topFormation.delai_moyen_jours}j.`,
        impact: 'high',
        categorie: 'formation',
      })
    }
  }

  // --- Insights timing ---
  const allDelays = patterns.filter(p => p.delai_moyen_jours > 0)
  if (allDelays.length > 0) {
    const avgDelay = Math.round(allDelays.reduce((sum, p) => sum + p.delai_moyen_jours, 0) / allDelays.length)
    insights.push({
      titre: `Délai moyen de conversion : ${avgDelay} jours`,
      description: `Si un lead dépasse ${avgDelay * 2} jours sans progression, relancer ou réévaluer.`,
      impact: 'medium',
      categorie: 'timing',
    })
  }

  return insights
}

/**
 * Formate les coaching insights en texte pour le system prompt de l'agent IA
 */
export function coachingToSystemPrompt(insights: CoachingInsight[]): string {
  if (insights.length === 0) return ''

  const lines = [
    '',
    '## COACHING IA — Patterns gagnants (données réelles)',
    '',
  ]

  const highImpact = insights.filter(i => i.impact === 'high')
  const mediumImpact = insights.filter(i => i.impact === 'medium')

  if (highImpact.length > 0) {
    lines.push('### Priorités :')
    for (const i of highImpact) {
      lines.push(`- **${i.titre}** : ${i.description}`)
    }
    lines.push('')
  }

  if (mediumImpact.length > 0) {
    lines.push('### Tendances :')
    for (const i of mediumImpact) {
      lines.push(`- ${i.titre} : ${i.description}`)
    }
  }

  return lines.join('\n')
}

/**
 * Génère des recommandations personnalisées pour un lead
 * basées sur les win patterns qui matchent son profil
 */
export function getPersonalizedRecommendation(
  patterns: WinPattern[],
  leadProfil: { source?: string; statut_pro?: string; formation_nom?: string }
): string | null {
  const matching: string[] = []

  // Match par source
  const sourcePattern = patterns.find(
    p => p.dimension === 'source' && p.valeur === leadProfil.source
  )
  if (sourcePattern) {
    matching.push(
      `Les leads venant de "${sourcePattern.valeur}" convertissent en ${sourcePattern.delai_moyen_jours}j en moyenne (${sourcePattern.nb_wins} succès). ${sourcePattern.pct_finance}% utilisent un financement.`
    )
  }

  // Match par profil pro
  const profilPattern = patterns.find(
    p => p.dimension === 'statut_pro' && p.valeur === leadProfil.statut_pro
  )
  if (profilPattern) {
    matching.push(
      `Les ${profilPattern.valeur} ont un panier moyen de ${profilPattern.panier_moyen}€ et convertissent en ${profilPattern.delai_moyen_jours}j.`
    )
  }

  // Match par formation
  const formPattern = patterns.find(
    p => p.dimension === 'formation' && p.valeur === leadProfil.formation_nom
  )
  if (formPattern) {
    matching.push(
      `La formation "${formPattern.valeur}" génère ${formPattern.nb_wins} inscriptions avec ${formPattern.pct_finance}% de financement.`
    )
  }

  if (matching.length === 0) return null
  return matching.join(' ')
}
