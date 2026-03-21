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
 * En production, préférer le pooler Supavisor (port 6543)
 * pour éviter la saturation des connexions en serverless.
 */
function getSupabaseUrl(): string {
  // Pooler URL a priorité en production
  return process.env.SUPABASE_POOLER_URL
    || process.env.NEXT_PUBLIC_SUPABASE_URL
    || 'https://placeholder.supabase.co'
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
 */
let _serviceClient: Awaited<ReturnType<typeof import('@supabase/supabase-js').createClient>> | null = null

export async function createServiceSupabase() {
  if (_serviceClient) return _serviceClient

  const { createClient } = await import('@supabase/supabase-js')
  _serviceClient = createClient(
    getSupabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' },
    }
  )
  return _serviceClient
}
