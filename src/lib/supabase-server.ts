// ============================================================
// CRM DERMOTEC — Supabase Server Clients
// SSR client (cookies) + Service role (API routes)
// Support Supavisor pooler en production (port 6543)
// ============================================================
import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from './logger'

/**
 * URL Supabase pour le client serveur.
 * En production Vercel serverless, utiliser OBLIGATOIREMENT le pooler Supavisor (port 6543)
 * pour éviter la saturation des connexions PostgreSQL (chaque function = 1 connexion).
 * Le pooler gère jusqu'à 1000+ connexions concurrentes vs 200 max en direct.
 */
function getSupabaseUrl(): string {
  // PRIORITE: Pooler URL pour service role (production)
  const poolerUrl = process.env.SUPABASE_POOLER_URL
  const directUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wtbrdxijvtelluwfmgsf.supabase.co'

  // En production, toujours utiliser le pooler pour service role
  if (poolerUrl && (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production')) {
    return poolerUrl
  }

  return directUrl
}

/**
 * Client Supabase SSR (avec cookies) — pour Server Components et Server Actions
 * Utilise l'anon key (RLS par user)
 */
export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never)
            )
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  )
}

/**
 * Client Supabase Service Role — pour API routes, webhooks, crons
 * Bypass RLS — UNIQUEMENT côté serveur
 * Singleton par process pour éviter les créations excessives
 * UTILISE LE POOLER en production pour éviter connection saturation
 */
let _serviceClient: Awaited<ReturnType<typeof import('@supabase/supabase-js').createClient>> | null = null

export async function createServiceSupabase() {
  if (_serviceClient) return _serviceClient

  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = getSupabaseUrl()

  // Service Role Key OBLIGATOIRE pour les opérations admin (bypass RLS)
  // Ne JAMAIS fallback vers l'anon key — cela contournerait la sécurité RLS
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) {
    // En développement, fallback vers anon key avec warning
    if (process.env.NODE_ENV === 'development') {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (anonKey) {
        logger.warn('SUPABASE_SERVICE_ROLE_KEY missing - using anon key fallback in dev', {
          service: 'supabase',
          security: 'degraded'
        })
        _serviceClient = (await import('@supabase/supabase-js')).createClient(supabaseUrl, anonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        return _serviceClient
      }
    }
    throw new Error('SUPABASE_SERVICE_ROLE_KEY requise en production')
  }

  _serviceClient = createClient(
    supabaseUrl,
    key,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // Schema public est le defaut — pas besoin de le specifier
      // (le type TS de @supabase/supabase-js n'accepte pas 'public' comme string)
      // Pool de connexions pour Supavisor (si pooler URL)
      global: {
        headers: {
          'X-Client-Info': 'crm-dermotec-service@1.0.0',
        },
      }
    }
  )

  // Log de debug en dev
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Supabase Service initialized', {
      service: 'supabase',
      connectionType: supabaseUrl.includes(':6543') ? 'POOLER' : 'DIRECT',
      url: supabaseUrl
    })
  }

  return _serviceClient
}

// Alias pour compatibilité (certaines routes importent `createClient`)
export const createClient = createServerSupabase
