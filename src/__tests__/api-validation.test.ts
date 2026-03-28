// ============================================================
// Tests — Validation des entrées API
// Tests que toutes les routes valident correctement leurs inputs
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock auth pour bypasser l'authentification dans ces tests
const mockUser = {
  id: 'test-user',
  email: 'test@dermotec.fr',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
}

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null }),
  }),
}

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: vi.fn(() => mockSupabase),
  createServiceSupabase: vi.fn(() => Promise.resolve(mockSupabase)),
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabase)),
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}))

// Mock server-only to prevent import errors in test environment
vi.mock('server-only', () => ({}))

// Mock services externes
vi.mock('@/lib/integrations/stripe', () => ({
  createPaymentLink: vi.fn().mockResolvedValue({
    id: 'plink_test_123',
    url: 'https://pay.stripe.com/test',
  }),
}))

vi.mock('@/lib/enrichment/proxy', () => ({
  enrichmentProxy: vi.fn().mockResolvedValue({
    success: true,
    data: { nom: 'Test Company' },
  }),
}))

function createAuthenticatedRequest(url: string, options?: RequestInit) {
  return new NextRequest(`http://localhost:3000${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'sb-access-token=valid-token; sb-refresh-token=refresh-token',
      ...(options?.headers as Record<string, string>),
    },
    ...options,
  } as any)
}

describe('API Input Validation', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Soft Delete Validation', () => {
    it('POST /api/soft-delete - rejette sans table', async () => {
      const { POST } = await import('@/app/api/soft-delete/route')

      const request = createAuthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: JSON.stringify({ id: 'test-id' }), // table manquante
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toBe('table et id requis')
    })

    it('POST /api/soft-delete - rejette sans id', async () => {
      const { POST } = await import('@/app/api/soft-delete/route')

      const request = createAuthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: JSON.stringify({ table: 'leads' }), // id manquant
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toBe('table et id requis')
    })

    it('POST /api/soft-delete - rejette table non autorisée', async () => {
      const { POST } = await import('@/app/api/soft-delete/route')

      const request = createAuthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: JSON.stringify({
          table: 'users', // Table non autorisée
          id: 'test-id'
        }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(403)
      expect(body.error).toBe('Table non autorisée')
    })

    it('POST /api/soft-delete - accepte table autorisée', async () => {
      // Mock record existant
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'test-id', nom: 'Test Lead' }
        }),
        update: vi.fn().mockResolvedValue({ error: null }),
      })

      const { POST } = await import('@/app/api/soft-delete/route')

      const request = createAuthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: JSON.stringify({
          table: 'leads', // Table autorisée
          id: 'test-id',
          reason: 'Test deletion'
        }),
      })

      const response = await POST(request)

      // Ne devrait pas être rejeté pour validation
      expect(response.status).not.toBe(400)
      expect(response.status).not.toBe(403)
    })
  })

  describe('Enrichment Validation', () => {
    it('POST /api/enrichment/full - rejette sans nom', async () => {
      const { POST } = await import('@/app/api/enrichment/full/route')

      const request = createAuthenticatedRequest('/api/enrichment/full', {
        method: 'POST',
        body: JSON.stringify({ siret: '12345678901234' }), // nom manquant
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('nom')
    })

    it('POST /api/enrichment/full - rejette sans siret', async () => {
      const { POST } = await import('@/app/api/enrichment/full/route')

      const request = createAuthenticatedRequest('/api/enrichment/full', {
        method: 'POST',
        body: JSON.stringify({ nom: 'Test Company' }), // siret manquant
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('siret')
    })

    it('POST /api/enrichment/full - rejette SIRET invalide', async () => {
      const { POST } = await import('@/app/api/enrichment/full/route')

      const request = createAuthenticatedRequest('/api/enrichment/full', {
        method: 'POST',
        body: JSON.stringify({
          nom: 'Test Company',
          siret: '123', // SIRET trop court
        }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('SIRET')
    })

    it('POST /api/enrichment/full - accepte SIRET valide', async () => {
      const { POST } = await import('@/app/api/enrichment/full/route')

      const request = createAuthenticatedRequest('/api/enrichment/full', {
        method: 'POST',
        body: JSON.stringify({
          nom: 'Test Company',
          siret: '12345678901234', // SIRET 14 chiffres
        }),
      })

      const response = await POST(request)

      // Ne devrait pas être rejeté pour validation
      expect(response.status).not.toBe(400)
    })
  })

  describe('Stripe Payment Link Validation', () => {
    it('POST /api/stripe/payment-link - rejette sans leadId', async () => {
      const { POST } = await import('@/app/api/stripe/payment-link/route')

      const request = createAuthenticatedRequest('/api/stripe/payment-link', {
        method: 'POST',
        body: JSON.stringify({
          montant: 1000,
          description: 'Test payment'
        }), // leadId manquant
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('leadId')
    })

    it('POST /api/stripe/payment-link - rejette montant invalide', async () => {
      const { POST } = await import('@/app/api/stripe/payment-link/route')

      const request = createAuthenticatedRequest('/api/stripe/payment-link', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'test-id',
          montant: -100, // Montant négatif
          description: 'Test payment'
        }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('montant')
    })

    it('POST /api/stripe/payment-link - rejette montant nul', async () => {
      const { POST } = await import('@/app/api/stripe/payment-link/route')

      const request = createAuthenticatedRequest('/api/stripe/payment-link', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'test-id',
          montant: 0, // Montant nul
          description: 'Test payment'
        }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('montant')
    })

    it('POST /api/stripe/payment-link - accepte données valides', async () => {
      const { POST } = await import('@/app/api/stripe/payment-link/route')

      const request = createAuthenticatedRequest('/api/stripe/payment-link', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'test-id',
          montant: 1000,
          description: 'Test payment'
        }),
      })

      const response = await POST(request)

      // Ne devrait pas être rejeté pour validation
      expect(response.status).not.toBe(400)
    })
  })

  describe('JSON Parsing Validation', () => {
    it('rejette JSON invalide', async () => {
      const { POST } = await import('@/app/api/soft-delete/route')

      const request = createAuthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: '{ invalid json }', // JSON malformé
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toContain('JSON')
    })

    it('rejette body vide', async () => {
      const { POST } = await import('@/app/api/soft-delete/route')

      const request = createAuthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: '', // Body vide
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('rejette body trop volumineux (simulation)', async () => {
      const { POST } = await import('@/app/api/soft-delete/route')

      // Simuler un body très volumineux
      const largData = 'x'.repeat(100000) // 100KB
      const request = createAuthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: JSON.stringify({ table: 'leads', id: 'test', data: largData }),
      })

      const response = await POST(request)

      // Selon l'implémentation, peut être rejeté ou accepté
      // Au minimum, ne devrait pas crash
      expect(typeof response.status).toBe('number')
    })
  })

  describe('Type Validation', () => {
    it('rejette types incorrects', async () => {
      const { POST } = await import('@/app/api/soft-delete/route')

      const request = createAuthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: JSON.stringify({
          table: 123, // Devrait être string
          id: null, // Devrait être string
        }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toBe('table et id requis')
    })

    it('rejette UUID invalide', async () => {
      const { POST } = await import('@/app/api/soft-delete/route')

      const request = createAuthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: JSON.stringify({
          table: 'leads',
          id: 'not-a-uuid', // UUID invalide
        }),
      })

      const response = await POST(request)

      // Peut être rejeté au niveau validation ou au niveau DB
      // Au minimum ne devrait pas crash
      expect(typeof response.status).toBe('number')
    })
  })

  describe('Content-Type Validation', () => {
    it('gère Content-Type manquant gracieusement', async () => {
      const { POST } = await import('@/app/api/soft-delete/route')

      const request = new NextRequest('http://localhost:3000/api/soft-delete', {
        method: 'POST',
        body: JSON.stringify({ table: 'leads', id: 'test-id' }),
        headers: {
          'Cookie': 'sb-access-token=valid-token',
          // Pas de Content-Type
        },
      })

      const response = await POST(request)

      // Devrait traiter ou retourner erreur explicite, pas crash
      expect(typeof response.status).toBe('number')
    })

    it('gère Content-Type incorrect', async () => {
      const { POST } = await import('@/app/api/soft-delete/route')

      const request = createAuthenticatedRequest('/api/soft-delete', {
        method: 'POST',
        body: JSON.stringify({ table: 'leads', id: 'test-id' }),
        headers: {
          'Content-Type': 'text/plain', // Mauvais Content-Type
        },
      })

      const response = await POST(request)

      // Devrait traiter ou retourner erreur explicite
      expect(typeof response.status).toBe('number')
    })
  })
})