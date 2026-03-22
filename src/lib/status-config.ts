// ============================================================
// CRM DERMOTEC — Source UNIQUE de vérité pour les statuts
// TOUTES les pages DOIVENT importer depuis ici
// Plus JAMAIS de couleurs hardcodées par page
// ============================================================

import type {
  StatutLead, StatutSession, StatutInscription,
  StatutFinancement, PrioriteLead, PaiementStatut
} from '@/types'

interface StatusConfig {
  label: string
  color: string      // Couleur principale (texte, bordure)
  bgColor: string    // Fond léger (10-15% opacité)
  dotColor: string   // Point de statut
  order: number      // Ordre d'affichage
}

// ============================================
// LEADS — 11 statuts
// ============================================
export const LEAD_STATUS: Record<StatutLead, StatusConfig> = {
  NOUVEAU:              { label: 'Nouveau',           color: '#6B7280', bgColor: '#F3F4F6', dotColor: '#9CA3AF', order: 0 },
  CONTACTE:             { label: 'Contacté',          color: '#3B82F6', bgColor: '#EFF6FF', dotColor: '#3B82F6', order: 1 },
  QUALIFIE:             { label: 'Qualifié',          color: '#8B5CF6', bgColor: '#F5F3FF', dotColor: '#8B5CF6', order: 2 },
  FINANCEMENT_EN_COURS: { label: 'Financement',       color: '#F59E0B', bgColor: '#FFFBEB', dotColor: '#F59E0B', order: 3 },
  INSCRIT:              { label: 'Inscrit',           color: '#10B981', bgColor: '#ECFDF5', dotColor: '#10B981', order: 4 },
  EN_FORMATION:         { label: 'En formation',      color: '#06B6D4', bgColor: '#ECFEFF', dotColor: '#06B6D4', order: 5 },
  FORME:                { label: 'Formé(e)',          color: 'var(--color-success)', bgColor: '#F0FDF4', dotColor: 'var(--color-success)', order: 6 },
  ALUMNI:               { label: 'Alumni',            color: '#059669', bgColor: '#ECFDF5', dotColor: '#059669', order: 7 },
  PERDU:                { label: 'Perdu',             color: '#EF4444', bgColor: '#FEF2F2', dotColor: '#EF4444', order: 8 },
  REPORTE:              { label: 'Reporté',           color: '#F97316', bgColor: '#FFF7ED', dotColor: '#F97316', order: 9 },
  SPAM:                 { label: 'Spam',              color: '#9CA3AF', bgColor: '#F3F4F6', dotColor: '#9CA3AF', order: 10 },
}

// ============================================
// SESSIONS — 7 statuts
// ============================================
export const SESSION_STATUS: Record<StatutSession, StatusConfig> = {
  BROUILLON:  { label: 'Brouillon',  color: '#9CA3AF', bgColor: '#F3F4F6', dotColor: '#9CA3AF', order: 0 },
  PLANIFIEE:  { label: 'Planifiée',  color: '#3B82F6', bgColor: '#EFF6FF', dotColor: '#3B82F6', order: 1 },
  CONFIRMEE:  { label: 'Confirmée',  color: 'var(--color-success)', bgColor: '#F0FDF4', dotColor: 'var(--color-success)', order: 2 },
  EN_COURS:   { label: 'En cours',   color: '#06B6D4', bgColor: '#ECFEFF', dotColor: '#06B6D4', order: 3 },
  TERMINEE:   { label: 'Terminée',   color: '#8B5CF6', bgColor: '#F5F3FF', dotColor: '#8B5CF6', order: 4 },
  ANNULEE:    { label: 'Annulée',    color: '#EF4444', bgColor: '#FEF2F2', dotColor: '#EF4444', order: 5 },
  REPORTEE:   { label: 'Reportée',   color: '#F97316', bgColor: '#FFF7ED', dotColor: '#F97316', order: 6 },
}

// ============================================
// INSCRIPTIONS — 7 statuts
// ============================================
export const INSCRIPTION_STATUS: Record<StatutInscription, StatusConfig> = {
  EN_ATTENTE:  { label: 'En attente',  color: '#F59E0B', bgColor: '#FFFBEB', dotColor: '#F59E0B', order: 0 },
  CONFIRMEE:   { label: 'Confirmée',   color: 'var(--color-success)', bgColor: '#F0FDF4', dotColor: 'var(--color-success)', order: 1 },
  EN_COURS:    { label: 'En cours',    color: '#06B6D4', bgColor: '#ECFEFF', dotColor: '#06B6D4', order: 2 },
  COMPLETEE:   { label: 'Complétée',   color: '#8B5CF6', bgColor: '#F5F3FF', dotColor: '#8B5CF6', order: 3 },
  ANNULEE:     { label: 'Annulée',     color: '#EF4444', bgColor: '#FEF2F2', dotColor: '#EF4444', order: 4 },
  REMBOURSEE:  { label: 'Remboursée',  color: '#F97316', bgColor: '#FFF7ED', dotColor: '#F97316', order: 5 },
  NO_SHOW:     { label: 'Absent',      color: '#DC2626', bgColor: '#FEF2F2', dotColor: '#DC2626', order: 6 },
}

// ============================================
// FINANCEMENT — 10 statuts
// ============================================
export const FINANCEMENT_STATUS: Record<StatutFinancement, StatusConfig> = {
  PREPARATION:         { label: 'Préparation',       color: '#9CA3AF', bgColor: '#F3F4F6', dotColor: '#9CA3AF', order: 0 },
  DOCUMENTS_REQUIS:    { label: 'Documents requis',   color: '#F59E0B', bgColor: '#FFFBEB', dotColor: '#F59E0B', order: 1 },
  DOSSIER_COMPLET:     { label: 'Dossier complet',    color: '#F59E0B', bgColor: '#FFFBEB', dotColor: '#F59E0B', order: 2 },
  SOUMIS:              { label: 'Soumis',             color: '#3B82F6', bgColor: '#EFF6FF', dotColor: '#3B82F6', order: 3 },
  EN_EXAMEN:           { label: 'En examen',          color: '#8B5CF6', bgColor: '#F5F3FF', dotColor: '#8B5CF6', order: 4 },
  COMPLEMENT_DEMANDE:  { label: 'Complément demandé', color: '#F97316', bgColor: '#FFF7ED', dotColor: '#F97316', order: 5 },
  VALIDE:              { label: 'Validé',             color: 'var(--color-success)', bgColor: '#F0FDF4', dotColor: 'var(--color-success)', order: 6 },
  REFUSE:              { label: 'Refusé',             color: '#EF4444', bgColor: '#FEF2F2', dotColor: '#EF4444', order: 7 },
  VERSE:               { label: 'Versé',              color: '#059669', bgColor: '#ECFDF5', dotColor: '#059669', order: 8 },
  CLOTURE:             { label: 'Clôturé',            color: '#6B7280', bgColor: '#F3F4F6', dotColor: '#6B7280', order: 9 },
}

// ============================================
// PRIORITÉS — 4 niveaux
// ============================================
export const PRIORITE_CONFIG: Record<PrioriteLead, StatusConfig> = {
  URGENTE:  { label: 'Urgente',  color: '#DC2626', bgColor: '#FEF2F2', dotColor: '#DC2626', order: 0 },
  HAUTE:    { label: 'Haute',    color: '#EA580C', bgColor: '#FFF7ED', dotColor: '#EA580C', order: 1 },
  NORMALE:  { label: 'Normale',  color: '#F59E0B', bgColor: '#FFFBEB', dotColor: '#F59E0B', order: 2 },
  BASSE:    { label: 'Basse',    color: '#6B7280', bgColor: '#F3F4F6', dotColor: '#6B7280', order: 3 },
}

// ============================================
// PAIEMENT — 6 statuts
// ============================================
export const PAIEMENT_STATUS: Record<PaiementStatut, StatusConfig> = {
  EN_ATTENTE:          { label: 'En attente',    color: '#F59E0B', bgColor: '#FFFBEB', dotColor: '#F59E0B', order: 0 },
  ACOMPTE:             { label: 'Acompte',       color: '#3B82F6', bgColor: '#EFF6FF', dotColor: '#3B82F6', order: 1 },
  PARTIEL:             { label: 'Partiel',       color: '#F97316', bgColor: '#FFF7ED', dotColor: '#F97316', order: 2 },
  PAYE:                { label: 'Payé',          color: 'var(--color-success)', bgColor: '#F0FDF4', dotColor: 'var(--color-success)', order: 3 },
  REMBOURSE:           { label: 'Remboursé',     color: '#9CA3AF', bgColor: '#F3F4F6', dotColor: '#9CA3AF', order: 4 },
  LITIGE:              { label: 'Litige',        color: '#EF4444', bgColor: '#FEF2F2', dotColor: '#EF4444', order: 5 },
}

// ============================================
// COULEURS BRANDING CENTRALISÉES
// ============================================
export const BRAND = {
  primary: '#2EC6F3',
  primaryHover: 'var(--color-primary-dark)',
  primaryDark: 'var(--color-primary-dark)',
  accent: '#082545',
  accentLight: '#0F3A6E',
  success: 'var(--color-success)',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const

// ============================================
// COULEURS CATÉGORIES FORMATIONS
// ============================================
export const FORMATION_CATEGORIES: Record<string, { color: string; bgColor: string }> = {
  'Dermo-Esthétique':  { color: '#E11D48', bgColor: '#FFF1F2' },
  'Dermo-Correctrice': { color: '#DB2777', bgColor: '#FDF2F8' },
  'Soins Visage':      { color: '#F59E0B', bgColor: '#FFFBEB' },
  'Laser & IPL':       { color: '#7C3AED', bgColor: '#F5F3FF' },
  'Soins Corps':       { color: '#10B981', bgColor: '#ECFDF5' },
  'Hygiène':           { color: '#3B82F6', bgColor: '#EFF6FF' },
}

// ============================================
// HELPERS — Fonctions utilitaires
// ============================================

/** Retourne la config d'un statut lead (avec fallback gris) */
export function getLeadStatus(statut: string): StatusConfig {
  return LEAD_STATUS[statut as StatutLead] || { label: statut, color: '#6B7280', bgColor: '#F3F4F6', dotColor: '#6B7280', order: 99 }
}

/** Retourne la config d'un statut session */
export function getSessionStatus(statut: string): StatusConfig {
  return SESSION_STATUS[statut as StatutSession] || { label: statut, color: '#6B7280', bgColor: '#F3F4F6', dotColor: '#6B7280', order: 99 }
}

/** Retourne la config d'un statut inscription */
export function getInscriptionStatus(statut: string): StatusConfig {
  return INSCRIPTION_STATUS[statut as StatutInscription] || { label: statut, color: '#6B7280', bgColor: '#F3F4F6', dotColor: '#6B7280', order: 99 }
}

/** Retourne la config d'un statut financement */
export function getFinancementStatus(statut: string): StatusConfig {
  return FINANCEMENT_STATUS[statut as StatutFinancement] || { label: statut, color: '#6B7280', bgColor: '#F3F4F6', dotColor: '#6B7280', order: 99 }
}

/** Retourne la config d'une priorité */
export function getPrioriteConfig(priorite: string): StatusConfig {
  return PRIORITE_CONFIG[priorite as PrioriteLead] || { label: priorite, color: '#6B7280', bgColor: '#F3F4F6', dotColor: '#6B7280', order: 99 }
}

/** Retourne la couleur d'une catégorie de formation */
export function getFormationCategoryColor(categorie: string): { color: string; bgColor: string } {
  return FORMATION_CATEGORIES[categorie] || { color: '#6B7280', bgColor: '#F3F4F6' }
}
