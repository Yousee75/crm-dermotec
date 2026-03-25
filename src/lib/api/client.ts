// ============================================================
// Client API type-safe — Hono RPC (hc)
// ============================================================
//
// Usage dans les composants React / hooks :
//
//   import { api } from '@/lib/api-client'
//
//   // GET /api/leads?page=1&limit=20
//   const res = await api.api.leads.$get({ query: { page: '1', limit: '20' } })
//   const { data, total } = await res.json()
//
//   // POST /api/leads
//   const res = await api.api.leads.$post({ json: { prenom: 'Marie', nom: 'Dupont', email: 'marie@test.fr' } })
//   const lead = await res.json()
//
//   // GET /api/leads/:id
//   const res = await api.api.leads[':id'].$get({ param: { id: 'uuid-here' } })
//
// Le client est entierement type-safe :
//   - Les query params, body, et params de route sont verifies a la compilation
//   - Les responses sont typees automatiquement grace au type AppType
//   - Pas de code generation, pas de schema a synchroniser
// ============================================================

import { hc } from 'hono/client'
import type { AppType } from '@/server'

/**
 * Client RPC Hono — type-safe, zero codegen.
 *
 * NOTE : hc() ne fait PAS de requete HTTP au moment de l'import.
 * Il cree un proxy qui intercepte les appels .$get(), .$post(), etc.
 * et construit la requete fetch correspondante.
 *
 * Le premier argument est la base URL du serveur.
 * En Next.js, on utilise '' (vide) car les appels sont relatifs
 * au meme domaine. En production, remplacer par l'URL absolue.
 */
function getBaseUrl() {
  // Server-side (SSR / Server Component)
  if (typeof window === 'undefined') {
    // En dev local
    return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  }
  // Client-side — relatif
  return ''
}

/**
 * Client API principal.
 *
 * Exemples d'utilisation :
 *
 * ```ts
 * // Liste des leads
 * const res = await api.api.leads.$get({
 *   query: { page: '1', limit: '20', statut: 'NOUVEAU' }
 * })
 * if (res.ok) {
 *   const { data, total, page } = await res.json()
 * }
 *
 * // Creer un lead
 * const res = await api.api.leads.$post({
 *   json: {
 *     prenom: 'Sophie',
 *     nom: 'Martin',
 *     email: 'sophie@institut.fr',
 *     source: 'telephone',
 *   }
 * })
 *
 * // Envoyer un email
 * const res = await api.api.email.send.$post({
 *   json: {
 *     to: 'client@example.com',
 *     template_slug: 'bienvenue',
 *     variables: { prenom: 'Marie' },
 *     lead_id: 'uuid',
 *   }
 * })
 *
 * // Lister les sessions
 * const res = await api.api.sessions.$get({
 *   query: { statut: 'CONFIRMEE' }
 * })
 * ```
 */
export const api = hc<AppType>(getBaseUrl())

/**
 * Creer un client avec un token Bearer (pour les appels authentifies).
 *
 * ```ts
 * const client = createAuthClient(session.access_token)
 * const res = await client.api.leads.$get({ query: { page: '1' } })
 * ```
 */
export function createAuthClient(token: string) {
  return hc<AppType>(getBaseUrl(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

/**
 * Hook helper : wrapper pour utiliser avec React Query.
 *
 * ```tsx
 * import { useQuery } from '@tanstack/react-query'
 * import { createAuthClient } from '@/lib/api-client'
 * import { useSession } from '@/hooks/use-session'
 *
 * function useLeads(page: number, statut?: string) {
 *   const { session } = useSession()
 *   const client = createAuthClient(session.access_token)
 *
 *   return useQuery({
 *     queryKey: ['leads', page, statut],
 *     queryFn: async () => {
 *       const res = await client.api.leads.$get({
 *         query: {
 *           page: String(page),
 *           limit: '20',
 *           ...(statut && { statut }),
 *         },
 *       })
 *       if (!res.ok) throw new Error('Erreur chargement leads')
 *       return res.json()
 *     },
 *   })
 * }
 * ```
 */
