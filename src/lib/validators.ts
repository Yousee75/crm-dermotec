// ============================================================
// CRM DERMOTEC — Validateurs complets
// ============================================================

import { isDisposableEmail } from './disposable-emails'
import type { StatutFinancement, StatutLead, StatutSession, StatutInscription } from '@/types'

// --- Validateurs basiques ---

export function validateEmail(value: string): string | null {
  if (!value) return null
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(value)) return 'Email invalide'
  if (value.length > 254) return 'Email trop long'
  if (isDisposableEmail(value)) return 'Adresse email jetable non acceptée'
  return null
}

export function validatePhone(value: string): string | null {
  if (!value) return null
  const cleaned = value.replace(/[\s.\-()]/g, '')
  if (/^(?:0[1-9]|\+33[1-9])\d{8}$/.test(cleaned)) return null
  return 'Téléphone invalide (format FR : 0X XX XX XX XX)'
}

export function validateSiret(value: string): string | null {
  if (!value) return null
  const cleaned = value.replace(/\s/g, '')
  if (!/^\d{14}$/.test(cleaned)) return 'SIRET invalide (14 chiffres)'
  // Validation Luhn du SIRET
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned[i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  if (sum % 10 !== 0) return 'SIRET invalide (somme de contrôle)'
  return null
}

export function validateCodePostal(value: string): string | null {
  if (!value) return null
  if (/^(0[1-9]|[1-8]\d|9[0-8])\d{3}$/.test(value)) return null
  return 'Code postal invalide'
}

export function validateMontant(value: string): string | null {
  if (!value) return null
  const num = parseFloat(value.replace(/[,\s€]/g, '').replace(',', '.'))
  if (isNaN(num) || num < 0) return 'Montant invalide'
  if (num > 100_000) return 'Montant trop élevé (max 100 000€)'
  return null
}

export function validateUrl(value: string): string | null {
  if (!value) return null
  try {
    new URL(value)
    return null
  } catch {
    return 'URL invalide'
  }
}

export function validateDateFuture(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'Date invalide'
  if (date <= new Date()) return 'La date doit être dans le futur'
  return null
}

export function validateAge(value: string): string | null {
  if (!value) return null
  const age = parseInt(value)
  if (isNaN(age) || age < 16 || age > 99) return 'Âge invalide (16-99)'
  return null
}

export function validateRequired(value: string): string | null {
  if (!value || !value.trim()) return 'Ce champ est requis'
  return null
}

export function validateNPS(value: string): string | null {
  if (!value) return null
  const n = parseInt(value)
  if (isNaN(n) || n < 0 || n > 10) return 'Score NPS entre 0 et 10'
  return null
}

export function validateSatisfaction(value: string): string | null {
  if (!value) return null
  const n = parseInt(value)
  if (isNaN(n) || n < 1 || n > 5) return 'Note entre 1 et 5'
  return null
}

// --- Validation dates de session ---

export function validateSessionDates(dateDebut: string, dateFin: string): string | null {
  if (!dateDebut || !dateFin) return 'Dates de début et fin requises'
  const debut = new Date(dateDebut)
  const fin = new Date(dateFin)

  if (isNaN(debut.getTime())) return 'Date de début invalide'
  if (isNaN(fin.getTime())) return 'Date de fin invalide'
  if (fin < debut) return 'La date de fin doit être après la date de début'

  const diffJours = Math.ceil((fin.getTime() - debut.getTime()) / 86_400_000) + 1
  if (diffJours > 30) return 'La session ne peut pas durer plus de 30 jours'

  return null
}

// --- State machines ---

const VALID_LEAD_TRANSITIONS: Record<StatutLead, StatutLead[]> = {
  NOUVEAU: ['CONTACTE', 'QUALIFIE', 'PERDU', 'SPAM'],
  CONTACTE: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'PERDU', 'REPORTE', 'SPAM'],
  QUALIFIE: ['FINANCEMENT_EN_COURS', 'INSCRIT', 'PERDU', 'REPORTE'],
  FINANCEMENT_EN_COURS: ['INSCRIT', 'PERDU', 'REPORTE', 'QUALIFIE'],
  INSCRIT: ['EN_FORMATION', 'PERDU', 'REPORTE'],
  EN_FORMATION: ['FORME', 'PERDU'],
  FORME: ['ALUMNI', 'PERDU'],
  ALUMNI: ['QUALIFIE'], // Re-inscription possible
  PERDU: ['NOUVEAU', 'CONTACTE'], // Réactivation
  REPORTE: ['CONTACTE', 'QUALIFIE', 'PERDU'],
  SPAM: [], // Terminal
}

export function validateLeadTransition(from: StatutLead, to: StatutLead): string | null {
  if (from === to) return null // Pas de changement
  const valid = VALID_LEAD_TRANSITIONS[from]
  if (!valid || !valid.includes(to)) {
    return `Transition invalide : ${from} → ${to}`
  }
  return null
}

const VALID_FINANCEMENT_TRANSITIONS: Record<StatutFinancement, StatutFinancement[]> = {
  PREPARATION: ['DOCUMENTS_REQUIS', 'DOSSIER_COMPLET'],
  DOCUMENTS_REQUIS: ['DOSSIER_COMPLET', 'PREPARATION'],
  DOSSIER_COMPLET: ['SOUMIS'],
  SOUMIS: ['EN_EXAMEN', 'VALIDE', 'REFUSE'],
  EN_EXAMEN: ['COMPLEMENT_DEMANDE', 'VALIDE', 'REFUSE'],
  COMPLEMENT_DEMANDE: ['EN_EXAMEN', 'DOSSIER_COMPLET', 'REFUSE'],
  VALIDE: ['VERSE', 'CLOTURE'],
  REFUSE: ['PREPARATION', 'CLOTURE'], // Nouveau dossier possible
  VERSE: ['CLOTURE'],
  CLOTURE: [], // Terminal
}

export function validateFinancementTransition(from: StatutFinancement, to: StatutFinancement): string | null {
  if (from === to) return null
  const valid = VALID_FINANCEMENT_TRANSITIONS[from]
  if (!valid || !valid.includes(to)) {
    return `Transition invalide : ${from} → ${to}`
  }
  return null
}

const VALID_SESSION_TRANSITIONS: Record<StatutSession, StatutSession[]> = {
  BROUILLON: ['PLANIFIEE', 'ANNULEE'],
  PLANIFIEE: ['CONFIRMEE', 'ANNULEE', 'REPORTEE'],
  CONFIRMEE: ['EN_COURS', 'ANNULEE', 'REPORTEE'],
  EN_COURS: ['TERMINEE', 'ANNULEE'],
  TERMINEE: [], // Terminal
  ANNULEE: ['BROUILLON'], // Recréation possible
  REPORTEE: ['PLANIFIEE', 'ANNULEE'],
}

export function validateSessionTransition(from: StatutSession, to: StatutSession): string | null {
  if (from === to) return null
  const valid = VALID_SESSION_TRANSITIONS[from]
  if (!valid || !valid.includes(to)) {
    return `Transition invalide : ${from} → ${to}`
  }
  return null
}

const VALID_INSCRIPTION_TRANSITIONS: Record<StatutInscription, StatutInscription[]> = {
  EN_ATTENTE: ['CONFIRMEE', 'ANNULEE'],
  CONFIRMEE: ['EN_COURS', 'ANNULEE'],
  EN_COURS: ['COMPLETEE', 'ANNULEE', 'NO_SHOW'],
  COMPLETEE: ['REMBOURSEE'], // Cas rare
  ANNULEE: ['EN_ATTENTE'], // Réinscription
  REMBOURSEE: [], // Terminal
  NO_SHOW: ['ANNULEE'],
}

export function validateInscriptionTransition(from: StatutInscription, to: StatutInscription): string | null {
  if (from === to) return null
  const valid = VALID_INSCRIPTION_TRANSITIONS[from]
  if (!valid || !valid.includes(to)) {
    return `Transition invalide : ${from} → ${to}`
  }
  return null
}

// --- Sanitization ---

export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')     // Strip HTML tags
    .replace(/[<>"']/g, '')      // Remove dangerous chars (keep &)
    .trim()
    .slice(0, 2000)              // Max length
}

export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const cleaned = { ...data }
  for (const [key, value] of Object.entries(cleaned)) {
    if (typeof value === 'string') {
      (cleaned as Record<string, unknown>)[key] = sanitizeString(value)
    }
  }
  return cleaned
}
