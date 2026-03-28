'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/infra/supabase-client'
import type { RoleEquipe } from '@/types'

export interface CurrentUser {
  auth_id: string
  auth_user_id?: string
  equipe_id: string | null
  role: RoleEquipe
  prenom: string
  nom: string
  email: string
  isAdmin: boolean
  isCommercial: boolean
  isFormatrice: boolean
}

const DEFAULT_ADMIN: CurrentUser = {
  auth_id: '',
  equipe_id: null,
  role: 'admin',
  prenom: 'Admin',
  nom: '',
  email: '',
  isAdmin: true,
  isCommercial: false,
  isFormatrice: false,
}

/**
 * Hook qui identifie l'utilisateur connecté et son rôle dans l'équipe
 * - Si match equipe.auth_user_id → retourne le profil équipe (commercial, formatrice, etc.)
 * - Si pas de match → admin par défaut (compte propriétaire)
 *
 * Usage : const { data: user } = useCurrentUser()
 *         if (user.isCommercial) → filtrer par commercial_assigne_id
 */
export function useCurrentUser() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['current-user'],
    queryFn: async (): Promise<CurrentUser> => {
      // 1. Récupérer le user auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return DEFAULT_ADMIN

      // 2. Chercher le match dans equipe
      const { data: equipe } = await supabase
        .from('equipe')
        .select('id, role, prenom, nom, email')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (!equipe) {
        // Pas de profil équipe → admin par défaut (propriétaire du CRM)
        return {
          ...DEFAULT_ADMIN,
          auth_id: user.id,
          email: user.email || '',
        }
      }

      const role = equipe.role as RoleEquipe
      return {
        auth_id: user.id,
        equipe_id: equipe.id,
        role,
        prenom: equipe.prenom,
        nom: equipe.nom,
        email: equipe.email,
        isAdmin: role === 'admin' || role === 'manager',
        isCommercial: role === 'commercial',
        isFormatrice: role === 'formatrice',
      }
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min (le rôle ne change pas souvent)
  })
}
