import { Lead } from '@/types'
import { daysBetween } from '@/lib/utils'

/**
 * Génère un code de parrainage unique
 */
export function generateReferralCode(leadPrenom: string): string {
  const prenom = leadPrenom.toUpperCase().substring(0, 6).padEnd(6, 'X')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `DERMOTEC-${prenom}-${random}`
}

/**
 * Calcule le score d'upsell d'un lead (0-100)
 */
export function calculateUpsellScore(lead: Lead): { score: number; suggestions: string[] } {
  let score = 0
  const suggestions: string[] = []

  // Base : lead formé récemment (+30 pts)
  const hasFormations = lead.inscriptions && lead.inscriptions.some(i => i.statut === 'COMPLETEE')
  if (hasFormations) {
    score += 30

    // Ancienneté de la dernière formation
    const lastFormation = lead.inscriptions
      ?.filter(i => i.statut === 'COMPLETEE')
      ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]

    if (lastFormation) {
      const daysSince = daysBetween(lastFormation.updated_at, new Date().toISOString())

      // Formation très récente (< 30 jours) = optimal pour upsell
      if (daysSince < 30) {
        score += 25
        suggestions.push('Formation complémentaire recommandée (momentum)')
      }
      // Formation récente (30-90 jours) = encore chaud
      else if (daysSince < 90) {
        score += 15
        suggestions.push('Perfectionnement dans la même catégorie')
      }
      // Formation ancienne (> 90 jours) = besoin de réactivation
      else if (daysSince > 90 && daysSince < 365) {
        score += 5
        suggestions.push('Nouvelle technique pour relancer l\'activité')
      }
    }
  }

  // Statut pro favorable (+20 pts)
  if (lead.statut_pro === 'independante' || lead.statut_pro === 'auto_entrepreneur') {
    score += 20
    suggestions.push('Formation rentable pour développer la clientèle')
  } else if (lead.statut_pro === 'gerant_institut') {
    score += 25
    suggestions.push('Formation pour l\'équipe ou nouvelles prestations')
  }

  // Expérience élevée (+15 pts)
  if (lead.experience_esthetique === 'confirmee' || lead.experience_esthetique === 'experte') {
    score += 15
    suggestions.push('Technique avancée adaptée à votre niveau')
  }

  // Achat matériel récent via e-shop (+10 pts)
  if (lead.commandes && lead.commandes.some(c =>
    c.statut === 'LIVREE' && daysBetween(c.created_at, new Date().toISOString()) < 60
  )) {
    score += 10
    suggestions.push('Formation pour optimiser le nouveau matériel')
  }

  // Activité lancée avec succès (+15 pts)
  if (lead.a_lance_activite) {
    score += 15
    suggestions.push('Diversification des prestations')
  }

  // NPS élevé (+10 pts)
  if (lead.nps_score && lead.nps_score >= 9) {
    score += 10
    suggestions.push('Formation avancée (client satisfait)')
  }

  // Parrain actif (+5 pts)
  if (lead.parrain_id) {
    score += 5
    suggestions.push('Pack formations pour vous et votre filleule')
  }

  // Malus : lead perdu ou en difficulté
  if (lead.statut === 'PERDU' || lead.statut === 'SPAM') {
    score = Math.max(0, score - 30)
  }

  return {
    score: Math.min(100, score),
    suggestions: suggestions.slice(0, 3) // Top 3 suggestions
  }
}

/**
 * Détermine la prochaine meilleure action commerciale
 */
export function getNextBestAction(lead: Lead): { action: string; reason: string; priority: string } {
  // Lead nouveau : qualification urgente
  if (lead.statut === 'NOUVEAU') {
    return {
      action: 'Appel de qualification dans les 2h',
      reason: 'Lead chaud, conversion optimale sous 2h',
      priority: 'URGENTE'
    }
  }

  // Lead qualifié sans rappel : relance
  if (lead.statut === 'QUALIFIE' && lead.date_prochain_rappel) {
    const isOverdue = new Date(lead.date_prochain_rappel) < new Date()
    if (isOverdue) {
      return {
        action: 'Relance téléphonique immédiate',
        reason: 'Rappel en retard, risque de perdre le lead',
        priority: 'HAUTE'
      }
    }
  }

  // Lead formé récemment : upsell
  const recentlyTrained = lead.inscriptions?.some(i =>
    i.statut === 'COMPLETEE' &&
    daysBetween(i.updated_at, new Date().toISOString()) < 30
  )
  if (recentlyTrained) {
    const upsellScore = calculateUpsellScore(lead)
    if (upsellScore.score >= 70) {
      return {
        action: 'Proposition formation complémentaire',
        reason: `Score upsell ${upsellScore.score}/100 optimal`,
        priority: 'HAUTE'
      }
    }
  }

  // Alumni sans nouvelle formation : réactivation
  if (lead.statut === 'ALUMNI') {
    const lastFormation = lead.inscriptions
      ?.filter(i => i.statut === 'COMPLETEE')
      ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]

    if (lastFormation) {
      const monthsSince = Math.floor(daysBetween(lastFormation.updated_at, new Date().toISOString()) / 30)
      if (monthsSince >= 6) {
        return {
          action: 'Campagne de réactivation alumni',
          reason: `Dernière formation il y a ${monthsSince} mois`,
          priority: 'NORMALE'
        }
      }
    }
  }

  // Lead avec financement en cours : suivi
  if (lead.statut === 'FINANCEMENT_EN_COURS') {
    return {
      action: 'Suivi dossier financement',
      reason: 'Faciliter l\'obtention du financement',
      priority: 'NORMALE'
    }
  }

  // Lead perdu : tentative de reconquête
  if (lead.statut === 'PERDU') {
    const daysSinceLoss = daysBetween(lead.updated_at, new Date().toISOString())
    if (daysSinceLoss >= 90 && daysSinceLoss <= 180) {
      return {
        action: 'Email de reconquête avec offre spéciale',
        reason: 'Délai optimal pour tentative de reconquête',
        priority: 'BASSE'
      }
    }
  }

  return {
    action: 'Entretien de la relation',
    reason: 'Newsletter et contenu de valeur',
    priority: 'BASSE'
  }
}

/**
 * Retourne le meilleur créneau de contact
 */
export function getBestContactTime(): { day: string; hour: string } {
  const now = new Date()
  const currentHour = now.getHours()
  const currentDay = now.getDay() // 0 = dimanche

  // Créneaux optimaux : mardi/jeudi 8h-12h et 14h-17h
  const optimalDays = [2, 4] // mardi, jeudi
  const morningSlot = currentHour >= 8 && currentHour < 12
  const afternoonSlot = currentHour >= 14 && currentHour < 17

  // Si on est dans un créneau optimal
  if (optimalDays.includes(currentDay) && (morningSlot || afternoonSlot)) {
    return {
      day: currentDay === 2 ? 'mardi' : 'jeudi',
      hour: morningSlot ? '8h-12h' : '14h-17h'
    }
  }

  // Sinon, suggérer le prochain créneau optimal
  const nextTuesday = currentDay <= 2 ? 'ce mardi' : 'mardi prochain'
  const nextThursday = currentDay <= 4 ? 'ce jeudi' : 'jeudi prochain'

  return {
    day: currentDay < 2 || currentDay > 4 ? nextTuesday : nextThursday,
    hour: currentHour < 8 ? '8h-12h' : '14h-17h'
  }
}

/**
 * Calcule le Net Promoter Score (NPS)
 */
export function calculateNPS(scores: number[]): {
  nps: number;
  promoters: number;
  passives: number;
  detractors: number;
} {
  if (scores.length === 0) {
    return { nps: 0, promoters: 0, passives: 0, detractors: 0 }
  }

  const promoters = scores.filter(score => score >= 9).length
  const passives = scores.filter(score => score >= 7 && score <= 8).length
  const detractors = scores.filter(score => score <= 6).length
  const total = scores.length

  const nps = Math.round(((promoters - detractors) / total) * 100)

  return {
    nps,
    promoters: Math.round((promoters / total) * 100),
    passives: Math.round((passives / total) * 100),
    detractors: Math.round((detractors / total) * 100)
  }
}

/**
 * Détermine si on doit demander un avis
 */
export function shouldRequestReview(lead: Lead): boolean {
  // Lead doit être formé
  const hasCompletedFormation = lead.inscriptions?.some(i => i.statut === 'COMPLETEE')
  if (!hasCompletedFormation) return false

  // N'a pas encore laissé d'avis Google
  if (lead.avis_google_laisse) return false

  // Formation terminée il y a 5-10 jours (période optimale)
  const lastFormation = lead.inscriptions
    ?.filter(i => i.statut === 'COMPLETEE')
    ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]

  if (lastFormation) {
    const daysSince = daysBetween(lastFormation.updated_at, new Date().toISOString())
    return daysSince >= 5 && daysSince <= 10
  }

  return false
}

/**
 * Détermine l'éligibilité aux financements selon le statut pro
 */
export function getFinancementEligibility(statutPro: string): {
  eligible: string[];
  documents: string[];
} {
  const eligibilityMap: Record<string, { eligible: string[]; documents: string[] }> = {
    'salariee': {
      eligible: ['OPCO_EP', 'AKTO', 'EMPLOYEUR', 'CPF'],
      documents: ['Bulletin de paie', 'Attestation employeur', 'Programme formation']
    },
    'independante': {
      eligible: ['FAFCEA', 'FIFPL', 'CPF'],
      documents: ['Attestation URSSAF', 'Avis imposition', 'Programme formation']
    },
    'auto_entrepreneur': {
      eligible: ['FAFCEA', 'CPF'],
      documents: ['Attestation URSSAF', 'Relevé CFP', 'Programme formation']
    },
    'demandeur_emploi': {
      eligible: ['FRANCE_TRAVAIL', 'REGION', 'MISSIONS_LOCALES', 'CPF'],
      documents: ['Attestation Pôle Emploi', 'Programme formation', 'Lettre motivation']
    },
    'reconversion': {
      eligible: ['TRANSITIONS_PRO', 'CPF', 'REGION'],
      documents: ['Bulletins paie 12 mois', 'Projet reconversion', 'Bilan positionnement']
    },
    'etudiante': {
      eligible: ['MISSIONS_LOCALES', 'REGION'],
      documents: ['Certificat scolarité', 'Pièce identité', 'Programme formation']
    },
    'gerant_institut': {
      eligible: ['FAFCEA', 'OPCO_EP', 'EMPLOYEUR'],
      documents: ['KBIS', 'Attestation URSSAF', 'Programme formation']
    }
  }

  return eligibilityMap[statutPro] || {
    eligible: ['CPF'],
    documents: ['Pièce identité', 'Programme formation']
  }
}