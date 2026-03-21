// ============================================================
// CRM DERMOTEC — Role-Based Access Control (RBAC)
// ============================================================

import type { RoleEquipe } from '@/types'

// Permissions par module
export type Permission =
  | 'leads:read' | 'leads:write' | 'leads:delete' | 'leads:assign'
  | 'sessions:read' | 'sessions:write' | 'sessions:delete'
  | 'inscriptions:read' | 'inscriptions:write'
  | 'financements:read' | 'financements:write'
  | 'factures:read' | 'factures:write' | 'factures:delete'
  | 'commandes:read' | 'commandes:write'
  | 'equipe:read' | 'equipe:write' | 'equipe:delete'
  | 'analytics:read' | 'analytics:export'
  | 'qualite:read' | 'qualite:write'
  | 'settings:read' | 'settings:write'
  | 'audit:read'
  | 'anomalies:read' | 'anomalies:resolve'
  | 'documents:read' | 'documents:write' | 'documents:delete'
  | 'emails:send'
  | 'smart_actions:read' | 'smart_actions:execute'

// Matrice de permissions par rôle
const ROLE_PERMISSIONS: Record<RoleEquipe, Permission[]> = {
  admin: [
    // TOUT
    'leads:read', 'leads:write', 'leads:delete', 'leads:assign',
    'sessions:read', 'sessions:write', 'sessions:delete',
    'inscriptions:read', 'inscriptions:write',
    'financements:read', 'financements:write',
    'factures:read', 'factures:write', 'factures:delete',
    'commandes:read', 'commandes:write',
    'equipe:read', 'equipe:write', 'equipe:delete',
    'analytics:read', 'analytics:export',
    'qualite:read', 'qualite:write',
    'settings:read', 'settings:write',
    'audit:read',
    'anomalies:read', 'anomalies:resolve',
    'documents:read', 'documents:write', 'documents:delete',
    'emails:send',
    'smart_actions:read', 'smart_actions:execute',
  ],
  manager: [
    'leads:read', 'leads:write', 'leads:assign',
    'sessions:read', 'sessions:write',
    'inscriptions:read', 'inscriptions:write',
    'financements:read', 'financements:write',
    'factures:read', 'factures:write',
    'commandes:read', 'commandes:write',
    'equipe:read', 'equipe:write',
    'analytics:read', 'analytics:export',
    'qualite:read', 'qualite:write',
    'audit:read',
    'anomalies:read',
    'documents:read', 'documents:write',
    'emails:send',
    'smart_actions:read', 'smart_actions:execute',
  ],
  commercial: [
    'leads:read', 'leads:write', // seulement ses leads (filtré par RLS)
    'sessions:read',
    'inscriptions:read', 'inscriptions:write',
    'financements:read',
    'factures:read',
    'equipe:read',
    'documents:read', 'documents:write',
    'emails:send',
    'smart_actions:read', 'smart_actions:execute',
  ],
  formatrice: [
    'leads:read', // lecture seule, limité aux stagiaires de ses sessions
    'sessions:read', 'sessions:write', // seulement ses sessions
    'inscriptions:read',
    'equipe:read',
    'documents:read', 'documents:write',
    'qualite:read',
  ],
  assistante: [
    'leads:read',
    'sessions:read',
    'inscriptions:read', 'inscriptions:write',
    'financements:read', 'financements:write',
    'factures:read', 'factures:write',
    'commandes:read', 'commandes:write',
    'equipe:read',
    'documents:read', 'documents:write', 'documents:delete',
    'emails:send',
  ],
}

export function hasPermission(role: RoleEquipe, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function getPermissions(role: RoleEquipe): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

export function canAccess(role: RoleEquipe, module: string): boolean {
  const readPerm = `${module}:read` as Permission
  return hasPermission(role, readPerm)
}

export function canWrite(role: RoleEquipe, module: string): boolean {
  const writePerm = `${module}:write` as Permission
  return hasPermission(role, writePerm)
}

export function canDelete(role: RoleEquipe, module: string): boolean {
  const deletePerm = `${module}:delete` as Permission
  return hasPermission(role, deletePerm)
}
