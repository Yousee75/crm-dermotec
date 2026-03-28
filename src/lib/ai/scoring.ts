// ============================================================
// CRM DERMOTEC — Scoring Lead (probabilité d'inscription)
// Utilisé côté client (affichage) ET serveur (calcul)
// ============================================================

import type { Lead } from '@/types'

interface ScoreBreakdown {
  completude: number      // Qualité des données /30
  engagement: number      // Interactions /25
  financement: number     // Éligibilité financement /20
  profil: number          // Adéquation profil /15
  urgence: number         // Signaux d'urgence /10
  total: number           // Score final /100
  details: string[]       // Explication
}

export function scoreLead(lead: Lead): ScoreBreakdown {
  const details: string[] = []
  let completude = 0
  let engagement = 0
  let financement = 0
  let profil = 0
  let urgence = 0

  // === COMPLÉTUDE (qualité données) /30 ===
  if (lead.email) completude += 5
  if (lead.telephone) completude += 5
  if (lead.prenom && lead.nom) completude += 3
  if (lead.statut_pro) completude += 4
  if (lead.formation_principale_id) completude += 5
  if (lead.experience_esthetique) completude += 3
  if (lead.objectif_pro) completude += 3
  if (lead.adresse?.code_postal) completude += 2

  // === ENGAGEMENT (interactions) /25 ===
  if (lead.nb_contacts >= 3) {
    engagement += 10
    details.push('+10 : 3+ contacts')
  } else if (lead.nb_contacts >= 1) {
    engagement += 5
  }

  if (lead.date_dernier_contact) {
    const jours = Math.floor((Date.now() - new Date(lead.date_dernier_contact).getTime()) / 86400000)
    if (jours <= 3) {
      engagement += 8
      details.push('+8 : contact < 3 jours')
    } else if (jours <= 7) {
      engagement += 5
    } else if (jours <= 14) {
      engagement += 2
    }
  }

  if (lead.source === 'formulaire' || lead.source === 'telephone') engagement += 4
  if (lead.source === 'whatsapp') engagement += 5
  if (lead.source === 'ancien_stagiaire') engagement += 3

  // === FINANCEMENT /20 ===
  if (lead.financement_souhaite) {
    financement += 10
    details.push('+10 : financement souhaité')
  }

  // Profils éligibles financement total
  if (lead.statut_pro === 'salariee') {
    financement += 8
    details.push('+8 : salariée (OPCO probable)')
  } else if (lead.statut_pro === 'demandeur_emploi') {
    financement += 7
    details.push('+7 : demandeur emploi (France Travail)')
  } else if (lead.statut_pro === 'independante' || lead.statut_pro === 'auto_entrepreneur') {
    financement += 5
  } else if (lead.statut_pro === 'reconversion') {
    financement += 6
    details.push('+6 : reconversion (Transitions Pro)')
  }

  // === PROFIL /15 ===
  if (lead.experience_esthetique === 'aucune' || lead.experience_esthetique === 'debutante') {
    profil += 5 // Débutantes = cœur de cible
  }
  if (lead.experience_esthetique === 'intermediaire') {
    profil += 8 // Intermédiaires = savent ce qu'elles veulent
    details.push('+8 : profil intermédiaire motivé')
  }

  if (lead.objectif_pro) profil += 4
  if (lead.formations_interessees.length >= 2) {
    profil += 3
    details.push('+3 : intéressée par 2+ formations')
  }

  // === URGENCE /10 ===
  if (lead.statut === 'QUALIFIE') urgence += 5
  if (lead.statut === 'FINANCEMENT_EN_COURS') urgence += 8
  if (lead.priorite === 'URGENTE') urgence += 5
  if (lead.priorite === 'HAUTE') urgence += 3

  if (lead.tags?.includes('urgent')) {
    urgence += 4
    details.push('+4 : tag urgent')
  }

  // === SCORE DECAY (pénalité inactivité) ===
  // -3pts par semaine sans activité, max -20 pts
  // Evite les "faux chauds" qui étaient actifs il y a 6 mois
  let decay = 0
  const lastActivity = lead.date_dernier_contact || lead.updated_at
  if (lastActivity) {
    const semaines = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (7 * 86400000))
    if (semaines >= 2) {
      decay = Math.min(20, semaines * 3)
      if (decay > 0) details.push(`-${decay} : inactif depuis ${semaines} semaines`)
    }
  }

  // === SCORING NÉGATIF ===
  // Pénaliser les signaux négatifs
  let negatif = 0
  if (lead.statut === 'PERDU') { negatif += 15; details.push('-15 : statut PERDU') }
  if (lead.statut === 'SPAM') { negatif += 30; details.push('-30 : statut SPAM') }
  if (lead.tags?.includes('non_interesse')) { negatif += 10; details.push('-10 : tag non_intéressé') }

  const raw = completude + engagement + financement + profil + urgence - decay - negatif
  const total = Math.max(0, Math.min(100, raw))

  return { completude, engagement, financement, profil, urgence, total, details }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-success)' // vert — chaud
  if (score >= 60) return '#F59E0B' // orange — tiède
  if (score >= 40) return '#3B82F6' // bleu — à qualifier
  return '#9CA3AF' // gris — froid
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Chaud'
  if (score >= 60) return 'Tiède'
  if (score >= 40) return 'À qualifier'
  return 'Froid'
}
