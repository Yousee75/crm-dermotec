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
/**
 * Configuration des vues par rôle — Sidebar v2 (7 items)
 * Sidebar : Aujourd'hui, Prospects, Formations, Financement, Tableau de bord, Qualité, Réglages
 */
export const ROLE_VIEWS: Record<RoleEquipe, RoleView> = {
  admin: {
    topItems: ['/', '/leads', '/sessions', '/financement', '/analytics', '/qualiopi', '/parametres'],
    sections: [],  // Sidebar v2 : plus de sections dépliables
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
    topItems: ['/', '/leads', '/sessions', '/financement', '/analytics', '/qualiopi', '/parametres'],
    sections: [],
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
    topItems: ['/', '/leads', '/sessions', '/financement'],  // 4 items : Aujourd'hui, Prospects, Formations, Financement
    sections: [],
    hiddenPages: [
      '/analytics', '/equipe', '/qualiopi',
      '/outils', '/commandes', '/parametres',
    ],
    showGlobalKpis: false,     // Voit SES KPIs uniquement
    showTeamSection: false,
    filterByCommercial: true,  // NE VOIT QUE SES LEADS (par défaut)
    canCreateLead: true,       // Peut créer (auto-assigné)
    canDeleteLead: false,
    canReassignLead: false,
    filterBySessions: false,
    canCreateSession: false,
    canModifySession: false,
    agentEnabled: true,
    agentMode: 'commercial',
  },

  formatrice: {
    topItems: ['/', '/sessions', '/qualiopi'],  // 3 items : Aujourd'hui, Formations, Qualité
    sections: [],
    hiddenPages: [
      '/leads', '/pipeline', '/contacts', '/clients',
      '/analytics', '/equipe', '/facturation', '/commandes',
      '/financement', '/outils', '/parametres',
    ],
    showGlobalKpis: false,
    showTeamSection: false,
    filterByCommercial: false,
    canCreateLead: false,
    canDeleteLead: false,
    canReassignLead: false,
    filterBySessions: true,    // Ne voit que SES sessions
    canCreateSession: false,
    canModifySession: false,
    agentEnabled: true,
    agentMode: 'formation',
  },

  assistante: {
    topItems: ['/', '/leads', '/sessions', '/financement', '/qualiopi'],  // 5 items
    sections: [],
    hiddenPages: ['/equipe', '/outils'],
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
