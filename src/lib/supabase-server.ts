// ============================================================
// CRM DERMOTEC — Supabase Server Clients
// SSR client (cookies) + Service role (API routes)
// Support Supavisor pooler en production (port 6543)
// ============================================================
import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
  if (poolerUrl && process.env.VERCEL_ENV === 'production') {
    console.log('[Supabase] Using pooler URL for production service role')
    return poolerUrl
  }

  // En dev, préférer le pooler si configuré, sinon direct
  if (poolerUrl && process.env.NODE_ENV === 'production') {
    console.log('[Supabase] Using pooler URL for service role')
    return poolerUrl
  }

  // Fallback sur URL directe (dev local uniquement)
  console.log('[Supabase] Using direct URL (dev mode)')
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

  _serviceClient = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // Optimisations pour serverless + pooler
      db: {
        schema: 'public',
      },
      // Pool de connexions pour Supavisor (si pooler URL)
      global: {
        headers: supabaseUrl.includes(':6543') ? {
          'X-Client-Info': 'crm-dermotec-service@1.0.0'
        } : undefined
      }
    }
  )

  // Log de debug en dev
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Supabase Service] Initialized with ${supabaseUrl.includes(':6543') ? 'POOLER' : 'DIRECT'} connection`)
  }

  return _serviceClient
}
