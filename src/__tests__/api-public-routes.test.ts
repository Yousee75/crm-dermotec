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
  createServiceSupabase: vi.fn(() => mockSupabase),
}))

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

function createPublicRequest(url: string, options?: RequestInit) {
  return new NextRequest(`http://localhost:3000${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'vitest/test-runner',
      'X-Forwarded-For': '127.0.0.1',
      ...options?.headers,
    },
    ...options,
  })
}

describe('API Public Routes - No Auth Required', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
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
      // Mock Supabase pour succès
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'lead-123', email: 'test@example.com' }],
        }),
      })

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
      expect(body.error).toContain('Email non autorisé')
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
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({
              data: { id: 'lead-123', email: 'test@example.com' },
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
        formation_id: 'formation-123',
        session_id: 'session-123',
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
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.checkout_url).toBeDefined()
      expect(body.inscription_id).toBeDefined()
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
      // Mock questionnaire
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'quest-123',
            titre: 'Questionnaire Test',
            questions: [{ id: 1, text: 'Question 1', type: 'text' }],
            is_active: true,
          },
        }),
      })

      const { GET } = await import('@/app/api/questionnaires/test-token/route')

      const request = createPublicRequest('/api/questionnaires/test-token')
      const response = await GET(request, { params: { token: 'test-token' } })

      expect(response.status).toBe(200)
    })

    it('GET /api/questionnaires/[token] - retourne 404 pour token invalide', async () => {
      // Mock questionnaire inexistant
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      })

      const { GET } = await import('@/app/api/questionnaires/invalid-token/route')

      const request = createPublicRequest('/api/questionnaires/invalid-token')
      const response = await GET(request, { params: { token: 'invalid-token' } })

      expect(response.status).toBe(404)
    })
  })

  describe('Error Handling', () => {
    it('gère les erreurs de base de données gracieusement', async () => {
      // Mock erreur Supabase
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

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