// ============================================================
// Tests — API Authentication
// Tests critiques pour src/lib/api-auth.ts
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { getAuthUser, requireAuth } from '@/lib/api/auth'
import type { User } from '@supabase/supabase-js'

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

describe('getAuthUser', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    mockRequest = {
      cookies: {
        getAll: vi.fn(() => [
          { name: 'sb-access-token', value: 'valid-token' },
          { name: 'sb-refresh-token', value: 'refresh-token' },
        ]),
      },
    } as any

    // Reset env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('retourne null si env vars manquantes', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const result = await getAuthUser(mockRequest)
    expect(result).toBeNull()
  })

  it('retourne null si SUPABASE_ANON_KEY manquante', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const result = await getAuthUser(mockRequest)
    expect(result).toBeNull()
  })

  it('retourne utilisateur authentifié valide', async () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@dermotec.fr',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
    }

    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = (createServerClient as any)() as any
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

    const result = await getAuthUser(mockRequest)
    expect(result).toEqual(mockUser)
  })

  it('retourne null si pas d\'utilisateur', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = (createServerClient as any)() as any
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await getAuthUser(mockRequest)
    expect(result).toBeNull()
  })

  it('retourne null si erreur Supabase', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = (createServerClient as any)() as any
    mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'))

    await expect(getAuthUser(mockRequest)).rejects.toThrow('Network error')
  })
})

describe('requireAuth', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    mockRequest = {
      cookies: {
        getAll: vi.fn(() => []),
      },
    } as any

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    delete process.env.NEXT_PUBLIC_DEMO_MODE
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('retourne user demo en mode demo', async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true'

    const result = await requireAuth(mockRequest)

    expect(result.user).toBeDefined()
    expect(result.user?.id).toBe('demo-user')
    expect(result.user?.email).toBe('demo@dermotec.fr')
    expect(result.error).toBeUndefined()
  })

  it('retourne erreur 401 si non authentifié', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = (createServerClient as any)() as any
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await requireAuth(mockRequest)

    expect(result.user).toBeUndefined()
    expect(result.error).toBeDefined()

    // Vérifier que c'est une NextResponse avec status 401
    const response = result.error!
    expect(response.status).toBe(401)

    // Test du body JSON
    const body = await response.json()
    expect(body.error).toBe('Authentification requise')
  })

  it('retourne user authentifié valide', async () => {
    const mockUser: User = {
      id: 'user-456',
      email: 'commercial@dermotec.fr',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
    }

    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = (createServerClient as any)() as any
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

    const result = await requireAuth(mockRequest)

    expect(result.user).toEqual(mockUser)
    expect(result.error).toBeUndefined()
  })

  it('gère les cookies vides gracieusement', async () => {
    mockRequest.cookies.getAll = vi.fn(() => [])

    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = (createServerClient as any)() as any
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await requireAuth(mockRequest)

    expect(result.error).toBeDefined()
    expect(result.error?.status).toBe(401)
  })

  it('gère les cookies corrompus', async () => {
    mockRequest.cookies.getAll = vi.fn(() => [
      { name: 'sb-access-token', value: 'invalid-token' },
    ])

    const { createServerClient } = await import('@supabase/ssr')
    const mockSupabase = (createServerClient as any)() as any
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await requireAuth(mockRequest)

    expect(result.error).toBeDefined()
    expect(result.error?.status).toBe(401)
  })
})