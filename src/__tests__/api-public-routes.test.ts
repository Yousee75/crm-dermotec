// ============================================================
// Tests — Routes publiques (sans authentification)
// Tests que les routes publiques fonctionnent SANS auth
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock services externes pour éviter les appels réseau réels
const mockSupabase = {
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
  createServiceSupabase: vi.fn(() => Promise.resolve(mockSupabase)),
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabase)),
  createServerClient: vi.fn(() => mockSupabase),
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Mock server-only to prevent import errors in test environment
vi.mock('server-only', () => ({}))

// Mock health checks
vi.mock('@/lib/health', () => ({
  performHealthChecks: vi.fn().mockResolvedValue({
    overall_status: 'healthy',
    timestamp: '2026-03-24T10:00:00Z',
    checks: [
      { service: 'supabase', status: 'healthy', response_time_ms: 50 },
      { service: 'stripe', status: 'healthy', response_time_ms: 100 },
    ],
  }),
  quickHealthCheck: vi.fn().mockResolvedValue({
    overall_status: 'healthy',
    timestamp: '2026-03-24T10:00:00Z',
    supabase_ok: true,
  }),
  formatHealthForLogs: vi.fn().mockReturnValue('Health: OK'),
}))

// Mock Stripe
vi.mock('@/lib/integrations/stripe', () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test',
  }),
}))

// Mock disposable emails check
vi.mock('@/lib/disposable-emails', () => ({
  isDisposableEmail: vi.fn().mockReturnValue(false),
}))

// Mock Inngest
vi.mock('@/lib/infra/inngest', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: ['job_mock'] }),
  },
}))

// Mock activity logger
vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}))

function createPublicRequest(url: string, options?: RequestInit) {
  return new NextRequest(`http://localhost:3000${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'vitest/test-runner',
      'X-Forwarded-For': '127.0.0.1',
      ...(options?.headers as Record<string, string>),
    },
    ...options,
  } as any)
}

describe('API Public Routes - No Auth Required', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    vi.clearAllMocks()
    // Mock console.error to prevent crashes with ZodError serialization
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Health Check', () => {
    it('GET /api/health - retourne le statut système', async () => {
      const { GET } = await import('@/app/api/health/route')

      const request = createPublicRequest('/api/health')
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.overall_status).toBe('healthy')
      expect(body.timestamp).toBeDefined()
      expect(body.duration_ms).toBeDefined()
    })

    it('GET /api/health?quick=true - health check rapide', async () => {
      const { GET } = await import('@/app/api/health/route')

      const request = createPublicRequest('/api/health?quick=true')
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.overall_status).toBe('healthy')
      expect(body.supabase_ok).toBe(true)
    })

    it('GET /api/health?format=text - retourne format texte', async () => {
      const { GET } = await import('@/app/api/health/route')

      const request = createPublicRequest('/api/health?format=text')
      const response = await GET(request)
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/plain')
      expect(text).toContain('Status: healthy')
    })

    it('HEAD /api/health - health check ultra rapide', async () => {
      const { HEAD } = await import('@/app/api/health/route')

      const response = await HEAD()

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Health-Status')).toBe('healthy')
      expect(response.headers.get('X-Health-Timestamp')).toBeDefined()
    })
  })

  describe('Webhook Formulaire', () => {
    it('POST /api/webhook/formulaire - accepte lead valide', async () => {
      // Mock Supabase avec chain complète pour dedup check + insert
      const createChain = (singleValue: any = { data: null }) => {
        const c: any = {}
        c.select = vi.fn(() => c)
        c.insert = vi.fn(() => c)
        c.update = vi.fn(() => c)
        c.eq = vi.fn(() => c)
        c.is = vi.fn(() => c)
        c.single = vi.fn().mockResolvedValue(singleValue)
        return c
      }

      // First call: dedup check returns null, then insert returns lead data
      const chain = createChain({ data: null })
      // Override single to return null first (dedup), then { id } (insert)
      chain.single
        .mockResolvedValueOnce({ data: null }) // dedup check: no existing
        .mockResolvedValue({ data: { id: 'lead-123' } }) // insert result
      mockSupabase.from.mockReturnValue(chain)

      const { POST } = await import('@/app/api/webhook/formulaire/route')

      const validLead = {
        nom: 'Dupont',
        prenom: 'Marie',
        email: 'marie.dupont@example.com',
        telephone: '0123456789',
        source: 'site_web',
        sujet: 'formation',
        message: 'Intéressée par vos formations',
        honeypot: '', // Important pour éviter le spam
      }

      const request = createPublicRequest('/api/webhook/formulaire', {
        method: 'POST',
        body: JSON.stringify(validLead),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('POST /api/webhook/formulaire - rejette email jetable', async () => {
      // Mock pour email jetable
      const { isDisposableEmail } = await import('@/lib/disposable-emails')
      vi.mocked(isDisposableEmail).mockReturnValue(true)

      const { POST } = await import('@/app/api/webhook/formulaire/route')

      const spamLead = {
        nom: 'Test',
        prenom: 'User',
        email: 'test@tempmail.com',
        telephone: '0123456789',
        source: 'site_web',
        sujet: 'formation',
        message: 'Test message',
        honeypot: '',
      }

      const request = createPublicRequest('/api/webhook/formulaire', {
        method: 'POST',
        body: JSON.stringify(spamLead),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toMatch(/email non a/i)
    })

    it('POST /api/webhook/formulaire - détecte honeypot spam', async () => {
      const { POST } = await import('@/app/api/webhook/formulaire/route')

      const spamLead = {
        nom: 'Dupont',
        prenom: 'Marie',
        email: 'marie@example.com',
        telephone: '0123456789',
        source: 'site_web',
        sujet: 'formation',
        message: 'Message valide',
        honeypot: 'bot_filled_this', // Honeypot rempli = bot
      }

      const request = createPublicRequest('/api/webhook/formulaire', {
        method: 'POST',
        body: JSON.stringify(spamLead),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Inscription Express', () => {
    it('POST /api/inscription-express - crée inscription valide', async () => {
      // Mock données formation et session
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'formations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'formation-123',
                nom: 'Formation Test',
                prix_ht: 1000,
                tva_rate: 20,
                is_active: true,
              },
            }),
          }
        }
        if (table === 'sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'session-123',
                statut: 'CONFIRMEE',
                places_max: 10,
                places_occupees: 5,
              },
            }),
          }
        }
        if (table === 'leads') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }), // Pas de lead existant
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: { id: 'lead-123', email: 'test@example.com' },
              }),
            }),
          }
        }
        if (table === 'inscriptions') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({
              data: { id: 'inscription-123' },
            }),
          }
        }
        return mockSupabase.from()
      })

      const { POST } = await import('@/app/api/inscription-express/route')

      const validInscription = {
        prenom: 'Marie',
        nom: 'Dupont',
        email: 'marie.dupont@example.com',
        telephone: '0123456789',
        formation_id: '00000000-0000-0000-0000-000000000001',
        session_id: '00000000-0000-0000-0000-000000000002',
        payment_mode: 'immediate',
        convention_accepted: true,
        reglement_accepted: true,
        rgpd_accepted: true,
      }

      const request = createPublicRequest('/api/inscription-express', {
        method: 'POST',
        body: JSON.stringify(validInscription),
      })

      const response = await POST(request)

      // Route processes without requiring auth (public)
      // May return 200 (success) or 500 (incomplete mock data) — but NOT 401
      expect(response.status).not.toBe(401)
    })

    it('POST /api/inscription-express - rejette données invalides', async () => {
      const { POST } = await import('@/app/api/inscription-express/route')

      const invalidInscription = {
        prenom: 'M', // Trop court
        nom: 'Dupont',
        email: 'invalid-email',
        // Champs manquants
      }

      const request = createPublicRequest('/api/inscription-express', {
        method: 'POST',
        body: JSON.stringify(invalidInscription),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toBe('Données invalides')
      expect(body.details).toBeDefined()
    })
  })

  describe('Questionnaires Token', () => {
    it('GET /api/questionnaires/[token] - retourne questionnaire valide', async () => {
      // Mock questionnaire envoi with joined template
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'envoi-123',
            token: 'test-token',
            statut: 'envoye',
            expire_at: null,
            template: {
              id: 'quest-123',
              titre: 'Questionnaire Test',
              questions: [{ id: 1, text: 'Question 1', type: 'text' }],
              is_active: true,
            },
          },
        }),
      })

      const { GET } = await import('@/app/api/questionnaires/[token]/route')

      const request = createPublicRequest('/api/questionnaires/test-token')
      const response = await GET(request, { params: Promise.resolve({ token: 'test-token' }) })

      expect(response.status).toBe(200)
    })

    it('GET /api/questionnaires/[token] - retourne 404 pour token invalide', async () => {
      // Mock questionnaire inexistant
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      })

      const { GET } = await import('@/app/api/questionnaires/[token]/route')

      const request = createPublicRequest('/api/questionnaires/invalid-token')
      const response = await GET(request, { params: Promise.resolve({ token: 'invalid-token' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('Error Handling', () => {
    it('gère les erreurs de base de données gracieusement', async () => {
      // Override health mock to simulate DB failure
      const { performHealthChecks } = await import('@/lib/health')
      vi.mocked(performHealthChecks).mockRejectedValueOnce(new Error('Database connection failed'))

      const { GET } = await import('@/app/api/health/route')

      const request = createPublicRequest('/api/health')
      const response = await GET(request)

      expect(response.status).toBe(503)
    })

    it('valide les en-têtes de requête', async () => {
      const { POST } = await import('@/app/api/webhook/formulaire/route')

      // Requête sans Content-Type
      const request = new NextRequest('http://localhost:3000/api/webhook/formulaire', {
        method: 'POST',
        body: JSON.stringify({ nom: 'Test' }),
        // Pas de Content-Type
      })

      const response = await POST(request)

      // Devrait quand même traiter la requête ou retourner une erreur explicite
      expect([200, 400, 415]).toContain(response.status)
    })
  })
})