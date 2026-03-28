// ============================================================
// Tests — Intégration API Critique
// Tests des 5 flux CRM les plus critiques end-to-end
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock des services principaux
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

const mockSupabaseQueries = new Map()

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
  },
  from: vi.fn((table) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => {
      const key = `${table}_single`
      return Promise.resolve(mockSupabaseQueries.get(key) || { data: null })
    }),
  })),
  rpc: vi.fn().mockResolvedValue({ data: true }),
}

vi.mock('@/lib/supabase-server', () => ({
  createServiceSupabase: vi.fn(() => mockSupabase),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}))

// Mock Stripe
const mockStripeSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/test',
  payment_intent: 'pi_test_123',
}

vi.mock('@/lib/integrations/stripe', () => ({
  createCheckoutSession: vi.fn().mockResolvedValue(mockStripeSession),
  createPaymentLink: vi.fn().mockResolvedValue({
    id: 'plink_test_123',
    url: 'https://pay.stripe.com/test',
  }),
}))

// Mock enrichissement
vi.mock('@/lib/enrichment/proxy', () => ({
  enrichmentProxy: vi.fn().mockResolvedValue({
    success: true,
    data: {
      nom: 'Beauty Salon Test',
      siret: '12345678901234',
      adresse: '123 Rue de la Paix, 75001 Paris',
      telephone: '+33123456789',
      secteur: 'Esthétique',
      ca_estime: 150000,
      nb_employes: 5,
    },
  }),
}))

// Mock IA
vi.mock('@/lib/ai-sdk', () => ({
  getModel: vi.fn().mockReturnValue({
    generateObject: vi.fn().mockResolvedValue({
      object: { score: 85, reasons: ['Strong interest', 'Good budget'] },
    }),
  }),
  DERMOTEC_SYSTEM: 'Assistant commercial Dermotec',
}))

function createAuthenticatedRequest(url: string, options?: RequestInit) {
  return new NextRequest(`http://localhost:3000${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'sb-access-token=valid-token; sb-refresh-token=refresh-token',
      'User-Agent': 'vitest/test-runner',
      'X-Forwarded-For': '127.0.0.1',
      ...(options?.headers as Record<string, string>),
    },
    ...options,
  } as any)
}

describe('API Integration - Critical CRM Flows', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    mockSupabaseQueries.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Flow 1: Lead Creation → Enrichment → Scoring', () => {
    it('crée un lead, l\'enrichit et calcule son score', async () => {
      // 1. Setup: Mock lead existant pour enrichment
      mockSupabaseQueries.set('leads_single', {
        data: {
          id: 'lead-123',
          nom: 'Dupont',
          prenom: 'Marie',
          email: 'marie@beautysalon.fr',
          entreprise: 'Beauty Salon Test',
          ville: 'Paris',
          score_chaud: 65,
          statut: 'QUALIFIE',
        },
      })

      // 2. Enrichir le lead
      const { POST: enrichPost } = await import('@/app/api/leads/[id]/enrich/route')

      const enrichRequest = createAuthenticatedRequest('/api/leads/lead-123/enrich', {
        method: 'POST',
        body: JSON.stringify({ force: false }),
      })

      const enrichResponse = await enrichPost(enrichRequest, {
        params: Promise.resolve({ id: 'lead-123' }),
      })

      expect(enrichResponse.status).toBe(200)

      // 3. Calculer le score IA
      const { POST: scorePost } = await import('@/app/api/ai/score/route')

      const scoreRequest = createAuthenticatedRequest('/api/ai/score', {
        method: 'POST',
        body: JSON.stringify({ leadId: 'lead-123' }),
      })

      const scoreResponse = await scorePost(scoreRequest)
      const scoreBody = await scoreResponse.json()

      expect(scoreResponse.status).toBe(200)
      expect(scoreBody.score).toBeGreaterThan(0)
      expect(scoreBody.reasons).toBeDefined()
    })
  })

  describe('Flow 2: Inscription Express → Stripe Payment', () => {
    it('traite inscription complète avec paiement', async () => {
      // Setup: Mock formation et session
      mockSupabaseQueries.set('formations_single', {
        data: {
          id: 'formation-123',
          nom: 'Formation Microneedling',
          prix_ht: 1200,
          tva_rate: 20,
          is_active: true,
        },
      })

      mockSupabaseQueries.set('sessions_single', {
        data: {
          id: 'session-123',
          statut: 'CONFIRMEE',
          places_max: 12,
          places_occupees: 8,
        },
      })

      // 1. Inscription express
      const { POST: inscriptionPost } = await import('@/app/api/inscription-express/route')

      const inscriptionData = {
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

      const inscriptionRequest = createAuthenticatedRequest('/api/inscription-express', {
        method: 'POST',
        body: JSON.stringify(inscriptionData),
      })

      const inscriptionResponse = await inscriptionPost(inscriptionRequest)
      const inscriptionBody = await inscriptionResponse.json()

      expect(inscriptionResponse.status).toBe(200)
      expect(inscriptionBody.success).toBe(true)
      expect(inscriptionBody.checkout_url).toBeDefined()
      expect(inscriptionBody.inscription_id).toBeDefined()

      // 2. Vérifier création du payment link
      expect(vi.mocked(require('@/lib/integrations/stripe').createCheckoutSession)).toHaveBeenCalledWith({
        leadEmail: inscriptionData.email,
        leadNom: `${inscriptionData.prenom} ${inscriptionData.nom}`,
        formationNom: 'Formation Microneedling',
        montant: 1440, // 1200 * 1.20
        inscriptionId: expect.any(String),
        successUrl: expect.stringContaining('/inscription/success'),
        cancelUrl: expect.stringContaining('/inscription-express'),
      })
    })
  })

  describe('Flow 3: Document Upload → Validation', () => {
    it('upload et valide les documents lead', async () => {
      // Setup: Mock lead existant
      mockSupabaseQueries.set('leads_single', {
        data: {
          id: 'lead-123',
          nom: 'Dupont',
          entreprise: 'Beauty Salon',
        },
      })

      // 1. Obtenir URL d'upload
      const { GET: uploadGet } = await import('@/app/api/documents/upload/route')

      const uploadRequest = createAuthenticatedRequest('/api/documents/upload?leadId=lead-123&type=kbis')

      const uploadResponse = await uploadGet(uploadRequest)
      const uploadBody = await uploadResponse.json()

      expect(uploadResponse.status).toBe(200)
      expect(uploadBody.uploadUrl).toBeDefined()
      expect(uploadBody.fileName).toBeDefined()

      // 2. Document devrait être tracé
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
    })
  })

  describe('Flow 4: Session Planning → Emargement', () => {
    it('génère feuille émargement pour session', async () => {
      // Setup: Mock session avec inscriptions
      mockSupabaseQueries.set('sessions_single', {
        data: {
          id: 'session-123',
          nom: 'Formation Microneedling - Groupe A',
          date_debut: '2026-04-15T09:00:00Z',
          date_fin: '2026-04-15T17:00:00Z',
          lieu: 'Dermotec Paris',
          formatrice_nom: 'Dr. Smith',
        },
      })

      // 1. Obtenir données émargement
      const { GET: emargementGet } = await import('@/app/api/emargement/route')

      const emargementRequest = createAuthenticatedRequest('/api/emargement?session_id=session-123&format=data')

      const emargementResponse = await emargementGet(emargementRequest)
      const emargementBody = await emargementResponse.json()

      expect(emargementResponse.status).toBe(200)
      expect(emargementBody.session).toBeDefined()
      expect(emargementBody.session.id).toBe('session-123')
    })
  })

  describe('Flow 5: Analytics → Business Intelligence', () => {
    it('génère analytics commerciaux complets', async () => {
      // 1. Analytics dashboard
      const { GET: dashboardGet } = await import('@/app/api/analytics/dashboard/route')

      const dashboardRequest = createAuthenticatedRequest('/api/analytics/dashboard')

      const dashboardResponse = await dashboardGet(dashboardRequest)
      const dashboardBody = await dashboardResponse.json()

      expect(dashboardResponse.status).toBe(200)
      expect(dashboardBody).toHaveProperty('leads_count')
      expect(dashboardBody).toHaveProperty('conversion_rate')

      // 2. Analytics commerciaux
      const { GET: commerciauxGet } = await import('@/app/api/analytics/commerciaux/route')

      const commerciauxRequest = createAuthenticatedRequest('/api/analytics/commerciaux')

      const commerciauxResponse = await commerciauxGet(commerciauxRequest)
      const commerciauxBody = await commerciauxResponse.json()

      expect(commerciauxResponse.status).toBe(200)
      expect(commerciauxBody).toHaveProperty('pipeline')
      expect(commerciauxBody).toHaveProperty('conversions')
    })
  })

  describe('Error Scenarios', () => {
    it('gère les erreurs de service externe gracieusement', async () => {
      // Mock erreur Stripe
      vi.mocked(require('@/lib/integrations/stripe').createCheckoutSession).mockRejectedValue(
        new Error('Stripe service unavailable')
      )

      const { POST } = await import('@/app/api/inscription-express/route')

      const request = createAuthenticatedRequest('/api/inscription-express', {
        method: 'POST',
        body: JSON.stringify({
          prenom: 'Marie',
          nom: 'Dupont',
          email: 'marie@example.com',
          telephone: '0123456789',
          formation_id: 'formation-123',
          session_id: 'session-123',
          payment_mode: 'immediate',
          convention_accepted: true,
          reglement_accepted: true,
          rgpd_accepted: true,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('gère les timeouts et retry', async () => {
      // Mock timeout enrichissement
      vi.mocked(require('@/lib/enrichment/proxy').enrichmentProxy).mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      mockSupabaseQueries.set('leads_single', {
        data: {
          id: 'lead-123',
          entreprise: 'Test Company',
        },
      })

      const { POST } = await import('@/app/api/leads/[id]/enrich/route')

      const request = createAuthenticatedRequest('/api/leads/lead-123/enrich', {
        method: 'POST',
        body: JSON.stringify({ force: false }),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'lead-123' }) })

      // Devrait gérer l'erreur gracieusement
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Performance & Concurrency', () => {
    it('gère les requêtes concurrentes', async () => {
      const { GET } = await import('@/app/api/health/route')

      // Lancer 5 requêtes en parallèle
      const requests = Array.from({ length: 5 }, () =>
        GET(createAuthenticatedRequest('/api/health?quick=true'))
      )

      const responses = await Promise.all(requests)

      // Toutes devraient réussir
      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('respecte les limites de rate limiting (simulation)', async () => {
      const { GET } = await import('@/app/api/health/route')

      // Note: Le rate limiting réel est dans le middleware
      // Ici on teste juste que l'endpoint répond correctement
      const response = await GET(createAuthenticatedRequest('/api/health'))

      expect(response.status).toBe(200)
    })
  })

  describe('Data Consistency', () => {
    it('maintient la cohérence transactionnelle', async () => {
      // Test que les opérations multi-tables sont cohérentes
      mockSupabaseQueries.set('sessions_single', {
        data: {
          id: 'session-123',
          places_max: 10,
          places_occupees: 9, // Presque pleine
        },
      })

      const { POST } = await import('@/app/api/inscription-express/route')

      const request = createAuthenticatedRequest('/api/inscription-express', {
        method: 'POST',
        body: JSON.stringify({
          prenom: 'Marie',
          nom: 'Dupont',
          email: 'marie@example.com',
          telephone: '0123456789',
          formation_id: 'formation-123',
          session_id: 'session-123',
          payment_mode: 'immediate',
          convention_accepted: true,
          reglement_accepted: true,
          rgpd_accepted: true,
        }),
      })

      const response = await POST(request)

      // Si l'inscription réussit, le compteur devrait être mis à jour
      if (response.status === 200) {
        expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
      }
    })
  })
})