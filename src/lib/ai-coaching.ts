// ============================================================
// CRM DERMOTEC — AI Coaching Engine
// Coaching personnalisé basé sur l'analyse des données commerciales
// ============================================================

import type { CommercialStats } from './gamification'
import type { Activite, Lead, Session, Financement } from '@/types'

export interface CoachingInsight {
  type: 'tip' | 'alert' | 'celebration' | 'challenge'
  title: string
  message: string
  action?: { label: string; url: string }
  priority: 'high' | 'normal' | 'low'
  icon: string // emoji
}

interface CoachingContext {
  stats: CommercialStats
  recentActivity: Activite[]
  leads: Lead[]
  sessions: Session[]
  financements: Financement[]
  teamAverage?: {
    appelsParJour: number
    tauxConversion: number
    caParMois: number
  }
}

// Générer les insights de coaching personnalisés
export function generateCoachingInsight(context: CoachingContext): CoachingInsight[] {
  const insights: CoachingInsight[] = []
  const { stats, recentActivity, leads, sessions, financements, teamAverage } = context

  // 1. ANALYSE DU TAUX D'APPELS
  if (teamAverage && stats.appels_jour < teamAverage.appelsParJour * 0.8) {
    insights.push({
      type: 'tip',
      title: 'Augmente ton volume d\'appels',
      message: `Tu fais ${stats.appels_jour} appels/jour, la moyenne des top performers est ${teamAverage.appelsParJour}. Essaie d'en faire 2 de plus demain.`,
      action: { label: 'Planifier des appels', url: '/leads?statut=NOUVEAU,CONTACTE' },
      priority: 'high',
      icon: '📞'
    })
  }

  // 2. ANALYSE DE LA CONVERSION
  const totalLeads = leads.length
  const convertedLeads = leads.filter(l => ['INSCRIT', 'EN_FORMATION', 'FORME'].includes(l.statut)).length
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

  if (conversionRate < 15 && totalLeads >= 10) {
    insights.push({
      type: 'tip',
      title: 'Optimise ta conversion',
      message: `Tu convertis ${conversionRate.toFixed(1)}% des leads qualifiés. Astuce : appelle dans les 2h après le formulaire, le taux monte à 40%.`,
      action: { label: 'Voir les nouveaux leads', url: '/leads?statut=NOUVEAU' },
      priority: 'normal',
      icon: '🎯'
    })
  }

  // 3. ENCOURAGEMENT STREAK
  if (stats.streak === 4) {
    insights.push({
      type: 'challenge',
      title: 'Tu touches au but ! 🔥',
      message: 'Tu es à 4 jours de streak ! Encore 1 inscription demain pour débloquer le badge "En Feu".',
      action: { label: 'Voir les leads chauds', url: '/leads?score_min=70' },
      priority: 'high',
      icon: '🔥'
    })
  }

  if (stats.streak >= 10) {
    insights.push({
      type: 'celebration',
      title: 'Streak exceptionnel !',
      message: `${stats.streak} jours de suite avec au moins 1 inscription. Tu es une machine ! Continue comme ça.`,
      priority: 'normal',
      icon: '⚡'
    })
  }

  // 4. ANALYSE FINANCEMENT
  const leadsEligibles = leads.filter(l =>
    l.financement_souhaite &&
    ['salariee', 'demandeur_emploi', 'reconversion'].includes(l.statut_pro || '')
  ).length

  const financementsProposés = financements.length
  const tauxProposition = leadsEligibles > 0 ? (financementsProposés / leadsEligibles) * 100 : 0

  if (tauxProposition < 50 && leadsEligibles >= 5) {
    insights.push({
      type: 'tip',
      title: 'Levier financement sous-exploité',
      message: `${leadsEligibles} leads sont éligibles au financement mais tu ne le proposes qu'à ${tauxProposition.toFixed(0)}%. C'est LE levier #1 pour convertir.`,
      action: { label: 'Voir les leads éligibles', url: '/leads?financement=true' },
      priority: 'high',
      icon: '💰'
    })
  }

  // 5. ANALYSE TIMING (meilleurs créneaux)
  const activitésParsemaine = recentActivity.reduce((acc, activity) => {
    const jour = new Date(activity.created_at).getDay()
    const jourName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][jour]
    acc[jourName] = (acc[jourName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const meilleurJour = Object.entries(activitésParsemaine)
    .sort(([,a], [,b]) => b - a)[0]

  if (meilleurJour && activitésParsemaine[meilleurJour[0]] >= 3) {
    insights.push({
      type: 'tip',
      title: 'Optimise ton planning',
      message: `Tes meilleurs résultats sont le ${meilleurJour[0]}. Bloque ce créneau en priorité pour la prospection.`,
      action: { label: 'Planifier des rappels', url: '/rappels' },
      priority: 'normal',
      icon: '⏰'
    })
  }

  // 6. OPPORTUNITÉ UPSELL ALUMNI
  const alumni = leads.filter(l =>
    ['FORME', 'ALUMNI'].includes(l.statut) &&
    l.date_dernier_contact &&
    Math.floor((Date.now() - new Date(l.date_dernier_contact).getTime()) / 86400000) >= 30
  )

  if (alumni.length >= 3) {
    const potentielCA = alumni.length * 1400 // Prix moyen formation complémentaire
    insights.push({
      type: 'tip',
      title: 'Opportunité upsell détectée',
      message: `${alumni.length} alumni n'ont pas été recontactés depuis J+30. Potentiel upsell : ${potentielCA}€.`,
      action: { label: 'Voir les alumni', url: '/leads?statut=FORME,ALUMNI' },
      priority: 'normal',
      icon: '💎'
    })
  }

  // 7. SESSIONS PEU REMPLIES
  const sessionsProchesPeuRemplies = sessions.filter(s => {
    const joursAvant = Math.floor((new Date(s.date_debut).getTime() - Date.now()) / 86400000)
    const tauxRemplissage = (s.places_occupees / s.places_max) * 100
    return joursAvant > 0 && joursAvant <= 21 && tauxRemplissage < 50 && s.statut === 'PLANIFIEE'
  })

  if (sessionsProchesPeuRemplies.length > 0) {
    const session = sessionsProchesPeuRemplies[0]
    const joursAvant = Math.floor((new Date(session.date_debut).getTime() - Date.now()) / 86400000)
    const placesRestantes = session.places_max - session.places_occupees

    insights.push({
      type: 'alert',
      title: 'Session à remplir en urgence',
      message: `La session ${session.formation?.nom} du ${new Date(session.date_debut).toLocaleDateString('fr-FR')} n'a que ${session.places_occupees} inscrites. ${placesRestantes} places restantes dans ${joursAvant}j.`,
      action: { label: 'Voir les leads intéressés', url: `/leads?formation_id=${session.formation_id}` },
      priority: 'high',
      icon: '⚠️'
    })
  }

  // 8. CÉLÉBRATION OBJECTIFS
  if (stats.inscriptions_mois >= 5) {
    insights.push({
      type: 'celebration',
      title: 'Objectif mensuel atteint ! 🎉',
      message: `${stats.inscriptions_mois} inscriptions ce mois. Tu as débloqué le badge "Closer" ! Maintenant vise les 10.`,
      priority: 'normal',
      icon: '🎉'
    })
  }

  if (stats.ca_mois >= 10000) {
    insights.push({
      type: 'celebration',
      title: 'Machine à CA ! 👑',
      message: `${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.ca_mois)} de CA ce mois. Tu es dans le top 1% de l'équipe !`,
      priority: 'normal',
      icon: '👑'
    })
  }

  // 9. CHALLENGE SATISFACTION
  if (stats.nps_moyen < 4 && stats.inscriptions_mois >= 3) {
    insights.push({
      type: 'tip',
      title: 'Focus sur la satisfaction',
      message: `NPS moyen de ${stats.nps_moyen.toFixed(1)}/5. Appelle tes dernières formées pour recueillir leurs retours et ajuster.`,
      action: { label: 'Voir les formées récentes', url: '/leads?statut=FORME' },
      priority: 'normal',
      icon: '⭐'
    })
  }

  // 10. DÉFI DU JOUR
  const today = new Date().toISOString().split('T')[0]
  const activitésAujourdhui = recentActivity.filter(a => a.created_at.split('T')[0] === today)

  if (activitésAujourdhui.length < 5) {
    insights.push({
      type: 'challenge',
      title: 'Défi du jour',
      message: 'Tu n\'as que ${activitésAujourdhui.length} actions aujourd\'hui. Objectif : 3 appels avant 17h pour finir en beauté !',
      action: { label: 'Voir ma todo list', url: '/rappels' },
      priority: 'normal',
      icon: '🚀'
    })
  }

  // Trier par priorité
  const priorityOrder = { high: 0, normal: 1, low: 2 }
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return insights
}

// Générer un insight coaching simple (version allégée)
export function generateSingleCoachingInsight(stats: CommercialStats): CoachingInsight {
  // Logique simple basée sur les stats les plus critiques

  // Priorité 1 : Streak proche du badge
  if (stats.streak === 4) {
    return {
      type: 'challenge',
      title: 'Badge "En Feu" à portée !',
      message: '4 jours de streak ! Encore 1 inscription demain pour débloquer le badge 🔥',
      priority: 'high',
      icon: '🔥'
    }
  }

  // Priorité 2 : CA élevé
  if (stats.ca_mois >= 10000) {
    return {
      type: 'celebration',
      title: 'Machine à CA ! 👑',
      message: `${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.ca_mois)} ce mois. Tu cartonnes !`,
      priority: 'normal',
      icon: '👑'
    }
  }

  // Priorité 3 : Objectif mensuel
  if (stats.inscriptions_mois >= 5) {
    return {
      type: 'celebration',
      title: 'Objectif mensuel atteint !',
      message: `${stats.inscriptions_mois} inscriptions ce mois. Continue sur cette lancée !`,
      priority: 'normal',
      icon: '🎯'
    }
  }

  // Priorité 4 : Encouragement par défaut
  if (stats.inscriptions_mois < 3) {
    return {
      type: 'tip',
      title: 'C\'est le moment de briller !',
      message: 'Focus sur les leads chauds et les financements OPCO. Tu as tout pour réussir !',
      action: { label: 'Voir les leads chauds', url: '/leads?score_min=70' },
      priority: 'normal',
      icon: '💡'
    }
  }

  // Par défaut
  return {
    type: 'tip',
    title: 'Continue comme ça !',
    message: 'Tu es sur la bonne voie. Reste concentré sur tes objectifs.',
    priority: 'normal',
    icon: '💪'
  }
}