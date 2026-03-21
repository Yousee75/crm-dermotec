// ============================================================
// CRM DERMOTEC — Gamification Engine
// Système de points, badges et niveaux pour booster la performance commerciale
// ============================================================

import type { Activite } from '@/types'

// Points par action
export const POINTS = {
  LEAD_CREE: 5,
  APPEL_FAIT: 10,
  EMAIL_ENVOYE: 5,
  RDV_PLANIFIE: 20,
  DEVIS_ENVOYE: 25,
  INSCRIPTION_CONFIRMEE: 50,
  FORMATION_COMPLETEE: 100,
  AVIS_GOOGLE_OBTENU: 30,
  FINANCEMENT_VALIDE: 40,
  PARRAINAGE_CONVERTI: 60,
} as const

// Statistiques commerciales pour calcul des badges
export interface CommercialStats {
  // Performance actuelle
  leads_crees: number
  appels_jour: number
  emails_envoyes: number
  rdv_planifies: number
  inscriptions_mois: number
  ca_mois: number

  // Streak et régularité
  streak: number // jours consécutifs avec ≥1 inscription
  sessions_pleines: number // sessions 6/6 remplies

  // Qualité et satisfaction
  nps_moyen: number // note satisfaction moyenne
  financements_valides: number
  parrainages: number
  avis_google_obtenus: number

  // Données temporelles
  derniere_activite: Date
  jours_actifs_ce_mois: number
}

// Badges (achievements)
export const BADGES = [
  {
    id: 'first_lead',
    name: 'Premier Pas',
    description: 'Créer son premier lead',
    icon: '🌱',
    condition: (stats: CommercialStats) => stats.leads_crees >= 1
  },
  {
    id: 'ten_calls',
    name: 'Téléphoniste',
    description: '10 appels dans la journée',
    icon: '📞',
    condition: (stats: CommercialStats) => stats.appels_jour >= 10
  },
  {
    id: 'streak_5',
    name: 'En Feu',
    description: '5 jours consécutifs avec ≥1 inscription',
    icon: '🔥',
    condition: (stats: CommercialStats) => stats.streak >= 5
  },
  {
    id: 'streak_20',
    name: 'Inarrêtable',
    description: '20 jours de streak',
    icon: '⚡',
    condition: (stats: CommercialStats) => stats.streak >= 20
  },
  {
    id: 'closer',
    name: 'Closer',
    description: '5 inscriptions ce mois',
    icon: '🎯',
    condition: (stats: CommercialStats) => stats.inscriptions_mois >= 5
  },
  {
    id: 'revenue_king',
    name: 'Machine à CA',
    description: '10 000€ de CA ce mois',
    icon: '👑',
    condition: (stats: CommercialStats) => stats.ca_mois >= 10000
  },
  {
    id: 'nps_hero',
    name: 'Satisfaction Max',
    description: 'NPS moyen ≥ 9',
    icon: '⭐',
    condition: (stats: CommercialStats) => stats.nps_moyen >= 9
  },
  {
    id: 'full_session',
    name: 'Session Pleine',
    description: 'Remplir une session 6/6',
    icon: '🏆',
    condition: (stats: CommercialStats) => stats.sessions_pleines >= 1
  },
  {
    id: 'financement_pro',
    name: 'Expert Financement',
    description: '10 dossiers OPCO validés',
    icon: '💎',
    condition: (stats: CommercialStats) => stats.financements_valides >= 10
  },
  {
    id: 'alumni_network',
    name: 'Réseau Alumni',
    description: '3 parrainages convertis',
    icon: '🤝',
    condition: (stats: CommercialStats) => stats.parrainages >= 3
  },
] as const

// Niveaux
export const LEVELS = [
  { level: 1, name: 'Débutant', minPoints: 0, color: '#71717a' },
  { level: 2, name: 'Apprenti', minPoints: 100, color: '#3b82f6' },
  { level: 3, name: 'Confirmé', minPoints: 300, color: '#22c55e' },
  { level: 4, name: 'Expert', minPoints: 700, color: '#f59e0b' },
  { level: 5, name: 'Champion', minPoints: 1500, color: '#ef4444' },
  { level: 6, name: 'Légende', minPoints: 3000, color: '#d4a853' },
] as const

// Calculer le niveau actuel basé sur les points
export function calculateLevel(points: number): typeof LEVELS[number] {
  let currentLevel: typeof LEVELS[number] = LEVELS[0]

  for (const level of LEVELS) {
    if (points >= level.minPoints) {
      currentLevel = level
    } else {
      break
    }
  }

  return currentLevel
}

// Calculer la progression vers le prochain niveau
export function getProgressToNextLevel(points: number): {
  current: number
  next: number | null
  progress: number
  pointsToNext: number | null
} {
  const currentLevel = calculateLevel(points)
  const nextLevel = LEVELS.find(level => level.level === currentLevel.level + 1)

  if (!nextLevel) {
    return {
      current: currentLevel.level,
      next: null,
      progress: 100,
      pointsToNext: null
    }
  }

  const pointsInCurrentLevel = points - currentLevel.minPoints
  const pointsNeededForNext = nextLevel.minPoints - currentLevel.minPoints
  const progress = Math.min((pointsInCurrentLevel / pointsNeededForNext) * 100, 100)

  return {
    current: currentLevel.level,
    next: nextLevel.level,
    progress: Math.round(progress),
    pointsToNext: nextLevel.minPoints - points
  }
}

// Obtenir les badges débloqués
export function getUnlockedBadges(stats: CommercialStats): typeof BADGES[number][] {
  return BADGES.filter(badge => badge.condition(stats))
}

// Calculer le streak basé sur les activités
export function calculateStreak(activities: { date: string, type: string }[]): number {
  if (!activities.length) return 0

  // Filtrer seulement les inscriptions
  const inscriptions = activities
    .filter(a => a.type === 'INSCRIPTION')
    .map(a => new Date(a.date).toISOString().split('T')[0])
    .sort((a, b) => b.localeCompare(a)) // Plus récent en premier

  if (!inscriptions.length) return 0

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let streak = 0
  let checkDate = today

  // Si pas d'inscription aujourd'hui, commencer par hier
  if (!inscriptions.includes(today)) {
    checkDate = yesterday
  }

  // Si pas d'inscription hier non plus, streak = 0
  if (!inscriptions.includes(checkDate)) {
    return 0
  }

  // Compter les jours consécutifs
  while (inscriptions.includes(checkDate)) {
    streak++
    const prevDay = new Date(checkDate)
    prevDay.setDate(prevDay.getDate() - 1)
    checkDate = prevDay.toISOString().split('T')[0]
  }

  return streak
}

// Calculer les points pour une activité
export function getPointsForActivity(type: string): number {
  switch (type) {
    case 'LEAD_CREE': return POINTS.LEAD_CREE
    case 'CONTACT': return POINTS.APPEL_FAIT
    case 'EMAIL': return POINTS.EMAIL_ENVOYE
    case 'RAPPEL': return POINTS.RDV_PLANIFIE
    case 'INSCRIPTION': return POINTS.INSCRIPTION_CONFIRMEE
    case 'SESSION': return POINTS.FORMATION_COMPLETEE
    case 'FINANCEMENT': return POINTS.FINANCEMENT_VALIDE
    default: return 0
  }
}

// Calculer le total de points pour un commercial
export function calculateTotalPoints(activities: Activite[]): number {
  return activities.reduce((total, activity) => {
    return total + getPointsForActivity(activity.type)
  }, 0)
}

// Interface pour les données de gamification d'un commercial
export interface GamificationData {
  points: number
  level: typeof LEVELS[number]
  progress: ReturnType<typeof getProgressToNextLevel>
  badges: typeof BADGES[number][]
  streak: number
  todayPoints: number
  stats: CommercialStats
}

// Calculer toutes les données de gamification pour un commercial
export function calculateGamificationData(
  activities: Activite[],
  stats: CommercialStats
): GamificationData {
  const totalPoints = calculateTotalPoints(activities)
  const level = calculateLevel(totalPoints)
  const progress = getProgressToNextLevel(totalPoints)
  const badges = getUnlockedBadges(stats)
  const streak = calculateStreak(activities.map(a => ({ date: a.created_at, type: a.type })))

  // Points gagnés aujourd'hui
  const today = new Date().toISOString().split('T')[0]
  const todayActivities = activities.filter(a =>
    a.created_at.split('T')[0] === today
  )
  const todayPoints = calculateTotalPoints(todayActivities)

  return {
    points: totalPoints,
    level,
    progress,
    badges,
    streak,
    todayPoints,
    stats
  }
}