// ============================================================
// CRM DERMOTEC — Configuration des vues par rôle
// Chaque rôle a sa sidebar, ses permissions, ses filtres
// ============================================================

import type { RoleEquipe } from '@/types'

export interface RoleView {
  // Sidebar : quels items sont visibles
  topItems: string[]           // Chemins des pages top level
  sections: string[]           // IDs des sections dépliables visibles
  hiddenPages: string[]        // Pages explicitement cachées
  // Dashboard
  showGlobalKpis: boolean      // KPIs globaux ou filtrés
  showTeamSection: boolean     // Voir la section équipe
  // Leads
  filterByCommercial: boolean  // Filtrer les leads par commercial_assigne_id
  canCreateLead: boolean
  canDeleteLead: boolean
  canReassignLead: boolean
  // Sessions
  filterBySessions: boolean    // Filtrer par sessions assignées (formatrice)
  canCreateSession: boolean
  canModifySession: boolean
  // Agent IA
  agentEnabled: boolean
  agentMode: 'commercial' | 'formation' | 'both'
}

/**
 * Configuration des vues par rôle
 * Principe : le commercial voit UNIQUEMENT ce qui le concerne
 */
export const ROLE_VIEWS: Record<RoleEquipe, RoleView> = {
  admin: {
    topItems: ['/', '/leads', '/pipeline', '/sessions'],
    sections: ['commercial', 'formation', 'gestion'],
    hiddenPages: [],
    showGlobalKpis: true,
    showTeamSection: true,
    filterByCommercial: false,
    canCreateLead: true,
    canDeleteLead: true,
    canReassignLead: true,
    filterBySessions: false,
    canCreateSession: true,
    canModifySession: true,
    agentEnabled: true,
    agentMode: 'both',
  },

  manager: {
    topItems: ['/', '/leads', '/pipeline', '/sessions'],
    sections: ['commercial', 'formation', 'gestion'],
    hiddenPages: [],
    showGlobalKpis: true,
    showTeamSection: true,
    filterByCommercial: false,
    canCreateLead: true,
    canDeleteLead: true,
    canReassignLead: true,
    filterBySessions: false,
    canCreateSession: true,
    canModifySession: true,
    agentEnabled: true,
    agentMode: 'both',
  },

  commercial: {
    topItems: ['/', '/leads', '/pipeline', '/sessions'],
    sections: ['commercial'],  // Seulement commercial (pas formation/gestion)
    hiddenPages: [
      '/analytics', '/equipe', '/facturation', '/qualite',
      '/outils', '/commandes', '/parametres',
    ],
    showGlobalKpis: false,     // Voit SES KPIs uniquement
    showTeamSection: false,
    filterByCommercial: true,  // NE VOIT QUE SES LEADS
    canCreateLead: true,       // Peut créer (auto-assigné)
    canDeleteLead: false,      // Ne peut pas supprimer
    canReassignLead: false,    // Ne peut pas réassigner
    filterBySessions: false,
    canCreateSession: false,   // Ne peut pas créer de session
    canModifySession: false,
    agentEnabled: true,
    agentMode: 'commercial',
  },

  formatrice: {
    topItems: ['/', '/sessions'],
    sections: ['formation'],   // Seulement formation
    hiddenPages: [
      '/leads', '/pipeline', '/contacts', '/clients',
      '/analytics', '/equipe', '/facturation', '/commandes',
      '/outils', '/qualite',
    ],
    showGlobalKpis: false,
    showTeamSection: false,
    filterByCommercial: false,
    canCreateLead: false,
    canDeleteLead: false,
    canReassignLead: false,
    filterBySessions: true,    // Ne voit que SES sessions
    canCreateSession: false,
    canModifySession: false,   // Peut seulement émarger
    agentEnabled: true,
    agentMode: 'formation',
  },

  assistante: {
    topItems: ['/', '/leads', '/sessions'],
    sections: ['commercial', 'formation'],
    hiddenPages: ['/equipe', '/facturation', '/outils'],
    showGlobalKpis: true,
    showTeamSection: false,
    filterByCommercial: false,
    canCreateLead: true,
    canDeleteLead: false,
    canReassignLead: true,
    filterBySessions: false,
    canCreateSession: true,
    canModifySession: true,
    agentEnabled: true,
    agentMode: 'both',
  },
}

/**
 * Retourne la config de vue pour un rôle donné
 */
export function getRoleView(role: RoleEquipe): RoleView {
  return ROLE_VIEWS[role] || ROLE_VIEWS.commercial
}

/**
 * Vérifie si une page est accessible pour un rôle
 */
export function canAccessPage(role: RoleEquipe, pathname: string): boolean {
  const view = getRoleView(role)
  return !view.hiddenPages.some(p => pathname.startsWith(p))
}

/**
 * Labels de rôle en français
 */
export const ROLE_LABELS: Record<RoleEquipe, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  commercial: 'Commercial(e)',
  formatrice: 'Formatrice',
  assistante: 'Assistante',
}
