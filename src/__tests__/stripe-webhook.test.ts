// ============================================================
// Tests — Stripe Webhook
// Tests critiques pour src/app/api/stripe/webhook/route.ts
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stripe/webhook/route'

// Mock Stripe
const mockConstructEvent = vi.fn()
vi.mock('stripe', () => {
  const MockStripe = vi.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }))
  MockStripe.default = MockStripe
  return { default: MockStripe, __esModule: true }
})

// Mock Supabase
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null }),
  from: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockResolvedValue({ data: null }),
  update: vi.fn().mockReturnThis(),
  rpc: vi.fn().mockResolvedValue({ data: true }),
}

vi.mock('@/lib/supabase-server', () => ({
  createServiceSupabase: vi.fn(() => Promise.resolve(mockSupabaseQuery)),
}))

// Mock Inngest
const mockInngestSend = vi.fn()
vi.mock('@/lib/infra/inngest', () => ({
  inngest: {
    send: mockInngestSend,
  },
}))

// Fixtures Stripe
const createStripeEvent = (type: string, data: any = {}) => ({
  id: `evt_test_${Date.now()}`,
  type,
  data: {
    object: {
      id: `obj_test_${Date.now()}`,
      ...data,
    },
  },
})

const createCheckoutSession = (metadata: any = {}) => ({
  id: 'cs_test_123',
  payment_intent: 'pi_test_123',
  metadata,
})

const createPaymentIntent = (metadata: any = {}) => ({
  id: 'pi_test_456',
  metadata,
})

describe('Stripe Webhook', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Sécurité', () => {
    it('rejette requête sans signature', async () => {
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toBe('Missing stripe-signature')
    })

    it('rejette signature invalide', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'invalid_signature',
        },
        body: JSON.stringify({ test: 'data' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error).toBe('Invalid signature')
    })

    it('accepte signature valide', async () => {
      const mockEvent = createStripeEvent('payment_intent.succeeded')
      mockConstructEvent.mockReturnValue(mockEvent)
      mockInngestSend.mockResolvedValue({ ids: ['job_123'] })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.received).toBe(true)
      expect(mockConstructEvent).toHaveBeenCalledWith(
        JSON.stringify(mockEvent),
        'valid_signature',
        'whsec_test_123'
      )
    })
  })

  describe('Idempotence', () => {
    it('retourne duplicate pour événement déjà traité', async () => {
      const mockEvent = createStripeEvent('checkout.session.completed')
      mockConstructEvent.mockReturnValue(mockEvent)

      // Mock événement déjà processed
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'webhook_123',
          status: 'processed',
          attempts: 1,
        },
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.duplicate).toBe(true)
    })

    it('retourne already_processing pour événement en cours', async () => {
      const mockEvent = createStripeEvent('checkout.session.completed')
      mockConstructEvent.mockReturnValue(mockEvent)

      // Mock événement pending avec attempts > 0
      mockSupabaseQuery.single.mockResolvedValue({
        data: {
          id: 'webhook_123',
          status: 'pending',
          attempts: 1,
        },
      })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.already_processing).toBe(true)
    })
  })

  describe('Événements supportés', () => {
    it('traite checkout.session.completed avec inscription_id', async () => {
      const sessionData = createCheckoutSession({
        inscription_id: 'ins_123',
      })
      const mockEvent = createStripeEvent('checkout.session.completed', sessionData)
      mockConstructEvent.mockReturnValue(mockEvent)

      // Mock existing inscription pas encore payée
      mockSupabaseQuery.single
        .mockResolvedValueOnce({ data: null }) // webhook_events check
        .mockResolvedValueOnce({ data: { paiement_statut: 'EN_ATTENTE' } }) // inscription check
        .mockResolvedValueOnce({
          data: { lead_id: 'lead_123', session_id: 'session_123', montant_total: 1200 }
        }) // inscription details

      // Mock Inngest fail pour forcer traitement inline
      mockInngestSend.mockRejectedValue(new Error('Inngest unavailable'))

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.inline).toBe(true)

      // Vérifier que l'inscription a été mise à jour
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        paiement_statut: 'PAYE',
        stripe_payment_id: 'pi_test_123',
        statut: 'CONFIRMEE',
      })
    })

    it('traite checkout.session.completed avec commande_id', async () => {
      const sessionData = createCheckoutSession({
        commande_id: 'cmd_123',
      })
      const mockEvent = createStripeEvent('checkout.session.completed', sessionData)
      mockConstructEvent.mockReturnValue(mockEvent)

      mockSupabaseQuery.single.mockResolvedValue({ data: null }) // pas de webhook existant
      mockInngestSend.mockRejectedValue(new Error('Inngest unavailable'))

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        paiement_statut: 'PAYE',
        stripe_session_id: 'cs_test_123',
        stripe_payment_intent: 'pi_test_123',
        statut: 'PREPAREE',
      })
    })

    it('traite payment_intent.succeeded', async () => {
      const intentData = createPaymentIntent({
        inscription_id: 'ins_456',
      })
      const mockEvent = createStripeEvent('payment_intent.succeeded', intentData)
      mockConstructEvent.mockReturnValue(mockEvent)

      mockSupabaseQuery.single
        .mockResolvedValueOnce({ data: null }) // webhook check
        .mockResolvedValueOnce({ data: { paiement_statut: 'EN_ATTENTE' } }) // inscription check

      mockInngestSend.mockRejectedValue(new Error('Inngest unavailable'))

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        paiement_statut: 'PAYE',
        stripe_payment_id: intentData.id,
        statut: 'CONFIRMEE',
      })
    })

    it('ignore payment_intent.succeeded si déjà payé', async () => {
      const intentData = createPaymentIntent({
        inscription_id: 'ins_789',
      })
      const mockEvent = createStripeEvent('payment_intent.succeeded', intentData)
      mockConstructEvent.mockReturnValue(mockEvent)

      mockSupabaseQuery.single
        .mockResolvedValueOnce({ data: null }) // webhook check
        .mockResolvedValueOnce({ data: { paiement_statut: 'PAYE' } }) // déjà payé

      mockInngestSend.mockRejectedValue(new Error('Inngest unavailable'))

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      // Pas d'update car déjà payé
      expect(mockSupabaseQuery.update).not.toHaveBeenCalled()
    })
  })

  describe('Fallback & Async', () => {
    it('utilise Inngest en mode async par défaut', async () => {
      const mockEvent = createStripeEvent('payment_intent.succeeded')
      mockConstructEvent.mockReturnValue(mockEvent)
      mockInngestSend.mockResolvedValue({ ids: ['job_123'] })

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.async).toBe(true)
      expect(mockInngestSend).toHaveBeenCalledWith({
        name: 'stripe/webhook.process',
        data: expect.objectContaining({
          eventId: mockEvent.id,
          eventType: mockEvent.type,
          objectId: mockEvent.data.object.id,
        }),
      })
    })

    it('fallback inline si Inngest fail', async () => {
      const mockEvent = createStripeEvent('payment_intent.succeeded', {
        metadata: { inscription_id: 'ins_fallback' },
      })
      mockConstructEvent.mockReturnValue(mockEvent)
      mockInngestSend.mockRejectedValue(new Error('Inngest down'))

      mockSupabaseQuery.single
        .mockResolvedValueOnce({ data: null }) // webhook check
        .mockResolvedValueOnce({ data: { paiement_statut: 'EN_ATTENTE' } }) // inscription

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.inline).toBe(true)
      expect(mockSupabaseQuery.rpc).toHaveBeenCalledWith('mark_webhook_processed', {
        p_event_id: mockEvent.id,
        p_processing_duration_ms: expect.any(Number),
      })
    })

    it('gère les erreurs de traitement inline', async () => {
      const mockEvent = createStripeEvent('checkout.session.completed')
      mockConstructEvent.mockReturnValue(mockEvent)
      mockInngestSend.mockRejectedValue(new Error('Inngest down'))

      // Mock erreur dans le traitement inline
      mockSupabaseQuery.single.mockRejectedValue(new Error('DB connection failed'))

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.error).toBe('Processing failed')
      expect(mockSupabaseQuery.rpc).toHaveBeenCalledWith('mark_webhook_failed', {
        p_event_id: mockEvent.id,
        p_error_message: 'DB connection failed',
        p_processing_duration_ms: expect.any(Number),
      })
    })
  })

  describe('Événements non supportés', () => {
    it('log et ignore les événements non gérés', async () => {
      const mockEvent = createStripeEvent('customer.created')
      mockConstructEvent.mockReturnValue(mockEvent)
      mockInngestSend.mockRejectedValue(new Error('Inngest down'))

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid_signature',
        },
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Stripe Webhook] Event non géré: customer.created`
      )

      consoleSpy.mockRestore()
    })
  })
})