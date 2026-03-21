// ============================================================
// CRM DERMOTEC — API Auth Helper
// Vérifie l'authentification dans les API routes standalone
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

/**
 * Vérifie l'auth Supabase via cookies.
 * Retourne l'utilisateur ou null.
 */
export async function getAuthUser(request: NextRequest): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll() {},
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Middleware auth pour API routes.
 * Retourne une NextResponse 401 si non authentifié, ou l'utilisateur.
 */
export async function requireAuth(request: NextRequest): Promise<
  { user: User; error?: never } | { user?: never; error: NextResponse }
> {
  const user = await getAuthUser(request)
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      ),
    }
  }
  return { user }
}
