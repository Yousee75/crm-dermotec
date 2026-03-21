// ============================================================
// Middleware Hono — Supabase Auth (session check + inject user)
// ============================================================

import { createMiddleware } from 'hono/factory'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { HTTPException } from 'hono/http-exception'

// Types injectees dans le contexte Hono
export type AuthEnv = {
  Variables: {
    supabase: SupabaseClient
    user: User
    userId: string
  }
}

/**
 * Middleware qui :
 * 1. Lit le token Bearer depuis le header Authorization
 * 2. Verifie la session Supabase (getUser)
 * 3. Injecte supabase client + user dans c.var
 *
 * Usage: app.use('/api/*', supabaseAuth())
 */
export const supabaseAuth = () =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Token manquant' })
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    )

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new HTTPException(401, { message: 'Session invalide ou expiree' })
    }

    // Injecter dans le contexte
    c.set('supabase', supabase)
    c.set('user', user)
    c.set('userId', user.id)

    await next()
  })

/**
 * Middleware optionnel : verifie un role specifique (RBAC)
 * Usage: app.use('/api/admin/*', requireRole('admin'))
 */
export const requireRole = (...roles: string[]) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const supabase = c.var.supabase
    const userId = c.var.userId

    const { data: equipe } = await supabase
      .from('equipe')
      .select('role')
      .eq('auth_user_id', userId)
      .single()

    if (!equipe || !roles.includes(equipe.role)) {
      throw new HTTPException(403, {
        message: `Role requis: ${roles.join(' | ')}`,
      })
    }

    await next()
  })
