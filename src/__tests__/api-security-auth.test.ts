// ============================================================
// Tests — Sécurité API - Authentification requise
// Tests critiques que TOUTES les routes sécurisées retournent 401 sans auth
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase pour retourner null (pas d'auth)
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
  },
}

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: vi.fn(() => mockSupabase),
  createServiceSupabase: vi.fn(() => mockSupabase),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}))

// Helper pour créer une requête sans cookies d'auth
function createUnauthenticatedRequest(url: string, options?: RequestInit) {
  return new NextRequest(`http://localhost:3000${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}

describe('API Security - Auth Required Routes', () => {
  beforeEach(() => {
    // Reset env vars pour s'assurer qu'on n'est pas en mode démo
    delete process.env.NEXT_PUBLIC_DEMO_MODE
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Soft Delete Routes', () => {
    it('POST /api/soft-delete - retourne 401 sans auth', async () => {
      const { POST } = await import('@/app/api/soft-delete/route')

      const request = createUnauthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: JSON.stringify({ table: 'leads', id: 'test-id' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })

    it('POST /api/soft-delete/restore - retourne 401 sans auth', async () => {
      const { POST } = await import('@/app/api/soft-delete/restore/route')

      const request = createUnauthenticatedRequest('/api/soft-delete/restore', {
        method: 'POST',
        body: JSON.stringify({ corbeille_id: 'test-id' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })
  })

  describe('Lead Enrichment Routes', () => {
    it('POST /api/leads/[id]/enrich - retourne 401 sans auth', async () => {
      const { POST } = await import('@/app/api/leads/test-id/enrich/route')

      const request = createUnauthenticatedRequest('/api/leads/test-id/enrich', {
        method: 'POST',
        body: JSON.stringify({ force: false }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })

    it('GET /api/leads/[id]/enrich - retourne 401 sans auth', async () => {
      const { GET } = await import('@/app/api/leads/test-id/enrich/route')

      const request = createUnauthenticatedRequest('/api/leads/test-id/enrich')

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })

    it('POST /api/enrichment/full - retourne 401 sans auth', async () => {
      const { POST } = await import('@/app/api/enrichment/full/route')

      const request = createUnauthenticatedRequest('/api/enrichment/full', {
        method: 'POST',
        body: JSON.stringify({ nom: 'Test', siret: '12345678901234' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })
  })

  describe('AI Agent Routes', () => {
    it('POST /api/ai/agent-v2 - retourne 401 sans auth', async () => {
      const { POST } = await import('@/app/api/ai/agent-v2/route')

      const request = createUnauthenticatedRequest('/api/ai/agent-v2', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          leadId: 'test-id'
        }),
      })

      const response = await POST(request)

      // Agent v2 peut retourner une streaming response, on vérifie le status
      expect(response.status).toBe(401)
    })

    it('POST /api/ai/score - retourne 401 sans auth', async () => {
      const { POST } = await import('@/app/api/ai/score/route')

      const request = createUnauthenticatedRequest('/api/ai/score', {
        method: 'POST',
        body: JSON.stringify({ leadId: 'test-id' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })
  })

  describe('Document & Upload Routes', () => {
    it('GET /api/documents/upload - retourne 401 sans auth', async () => {
      const { GET } = await import('@/app/api/documents/upload/route')

      const request = createUnauthenticatedRequest('/api/documents/upload?leadId=test-id')

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })

    it('GET /api/emargement - retourne 401 sans auth', async () => {
      const { GET } = await import('@/app/api/emargement/route')

      const request = createUnauthenticatedRequest('/api/emargement?session_id=test-id')

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })
  })

  describe('Payment & Stripe Routes', () => {
    it('POST /api/stripe/payment-link - retourne 401 sans auth', async () => {
      const { POST } = await import('@/app/api/stripe/payment-link/route')

      const request = createUnauthenticatedRequest('/api/stripe/payment-link', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'test-id',
          montant: 1000,
          description: 'Test payment'
        }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })
  })

  describe('Competitor Analysis Routes', () => {
    it('POST /api/competitors/analyze - retourne 401 sans auth', async () => {
      const { POST } = await import('@/app/api/competitors/analyze/route')

      const request = createUnauthenticatedRequest('/api/competitors/analyze', {
        method: 'POST',
        body: JSON.stringify({ nom: 'Test Company', ville: 'Paris' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })

    it('POST /api/competitors/discover - retourne 401 sans auth', async () => {
      const { POST } = await import('@/app/api/competitors/discover/route')

      const request = createUnauthenticatedRequest('/api/competitors/discover', {
        method: 'POST',
        body: JSON.stringify({ ville: 'Paris', secteur: 'esthetique' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })
  })

  describe('Analytics Routes', () => {
    it('GET /api/analytics/commerciaux - retourne 401 sans auth', async () => {
      const { GET } = await import('@/app/api/analytics/commerciaux/route')

      const request = createUnauthenticatedRequest('/api/analytics/commerciaux')

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })

    it('GET /api/analytics/dashboard - retourne 401 sans auth', async () => {
      const { GET } = await import('@/app/api/analytics/dashboard/route')

      const request = createUnauthenticatedRequest('/api/analytics/dashboard')

      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error).toBe('Authentification requise')
    })
  })

  describe('Demo Mode Bypass', () => {
    it('autorise les requêtes en mode démo', async () => {
      // Activer le mode démo
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'

      const { POST } = await import('@/app/api/soft-delete/route')

      const request = createUnauthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: JSON.stringify({ table: 'leads', id: 'test-id' }),
      })

      const response = await POST(request)

      // En mode démo, ne devrait pas retourner 401 d'auth
      // Peut retourner une autre erreur (400, 500) selon la logique métier
      expect(response.status).not.toBe(401)
    })
  })
})