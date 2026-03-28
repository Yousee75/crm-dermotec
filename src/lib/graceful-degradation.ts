// ============================================================
// CRM DERMOTEC — Graceful Degradation + Queue Patterns
// Quand un service tombe, on queue et on degrade proprement
// ============================================================

import { CircuitOpenError } from './circuit-breaker'
import { logger } from './logger'

// --- Types ---

interface QueuedOperation {
  id: string
  service: string
  operation: string
  payload: unknown
  createdAt: string
  attempts: number
  maxAttempts: number
  status: 'pending' | 'processing' | 'failed' | 'completed'
  error?: string
}

// --- In-memory queue (remplace par Redis/Inngest en production) ---
// Cette queue est un fallback quand Inngest/Redis sont aussi down
const operationQueue: QueuedOperation[] = []
const MAX_QUEUE_SIZE = 1000

/**
 * Queue une operation pour execution ulterieure
 * Utilise quand le circuit breaker est ouvert
 */
export async function queueOperation(params: {
  service: string
  operation: string
  payload: unknown
  maxAttempts?: number
}): Promise<string> {
  const id = crypto.randomUUID()

  const op: QueuedOperation = {
    id,
    service: params.service,
    operation: params.operation,
    payload: params.payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    maxAttempts: params.maxAttempts || 5,
    status: 'pending',
  }

  // Tenter de persister dans Supabase d'abord
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    await supabase.from('activites').insert({
      type: 'SYSTEME',
      description: `Operation queued: ${params.service}/${params.operation}`,
      metadata: {
        queue_id: id,
        service: params.service,
        operation: params.operation,
        payload: params.payload,
        queued_at: op.createdAt,
      },
    })
  } catch {
    // DB aussi down — stocker en memoire
  }

  // Tenter de passer par Inngest (pour le retry automatique)
  try {
    const { inngest } = await import('./infra/inngest')
    await inngest.send({
      name: 'crm/webhook.received',
      data: {
        source: 'degraded-queue',
        payload: {
          queue_id: id,
          service: params.service,
          operation: params.operation,
          original_payload: params.payload,
        },
      },
    })
    logger.info('Queued operation via Inngest', { service: params.service, operation: params.operation })
    return id
  } catch {
    // Inngest aussi down — fallback memoire
  }

  // Dernier recours: queue en memoire
  if (operationQueue.length >= MAX_QUEUE_SIZE) {
    // Supprimer les plus anciennes
    operationQueue.shift()
    logger.warn('Operation queue overflow — dropping oldest entry')
  }

  operationQueue.push(op)
  logger.warn(`Operation queued in-memory: ${params.service}/${params.operation}`, {
    service: 'degradation',
    queueSize: operationQueue.length,
  })

  return id
}

/**
 * Wrapper qui degrade proprement quand un service est down
 *
 * Usage:
 * ```ts
 * const result = await withGracefulDegradation(
 *   'stripe',
 *   () => stripeCall(() => stripe.charges.create(params)),
 *   {
 *     fallback: () => ({ queued: true }),
 *     queuePayload: { amount: 1000, customer: 'cust_123' },
 *   }
 * )
 * ```
 */
export async function withGracefulDegradation<T, F = T>(
  serviceName: string,
  fn: () => Promise<T>,
  options: {
    /** Valeur de fallback si le service est down */
    fallback: () => F
    /** Payload a queue pour retraitement ulterieur */
    queuePayload?: unknown
    /** Nom de l'operation pour la queue */
    operationName?: string
    /** Notifier l'admin par email */
    notifyAdmin?: boolean
  }
): Promise<T | F> {
  try {
    return await fn()
  } catch (error) {
    const isCircuitOpen = error instanceof CircuitOpenError

    logger.error(
      `Service degradation: ${serviceName}`,
      error as Error,
      {
        service: 'degradation',
        isCircuitOpen,
        operation: options.operationName,
      }
    )

    // Queue l'operation si on a un payload
    if (options.queuePayload) {
      await queueOperation({
        service: serviceName,
        operation: options.operationName || 'unknown',
        payload: options.queuePayload,
      }).catch(() => {})
    }

    // Notifier l'admin si demande
    if (options.notifyAdmin) {
      notifyServiceDown(serviceName, error as Error).catch(() => {})
    }

    return options.fallback()
  }
}

// --- Stripe degradation specifique ---

/**
 * Creer un paiement avec degradation gracieuse
 * Si Stripe est down, queue le paiement et retourne un statut "en attente"
 */
export async function createPaymentWithDegradation(params: {
  inscriptionId: string
  montant: number
  leadEmail: string
  formationNom: string
}): Promise<{ success: boolean; checkoutUrl?: string; queued?: boolean }> {
  return withGracefulDegradation(
    'stripe',
    async () => {
      const { createCheckoutSession } = await import('./integrations/stripe')
      const session = await createCheckoutSession({
        leadEmail: params.leadEmail,
        leadNom: '',
        formationNom: params.formationNom,
        montant: params.montant,
        inscriptionId: params.inscriptionId,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/inscriptions?success=true`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/inscriptions?cancelled=true`,
      })
      return { success: true, checkoutUrl: session.url || undefined }
    },
    {
      fallback: () => ({ success: false, queued: true }),
      queuePayload: params,
      operationName: 'create-checkout-session',
      notifyAdmin: true,
    }
  )
}

// --- Email degradation ---

/**
 * Envoyer un email avec degradation gracieuse
 * Si Resend est down, queue l'email pour envoi ulterieur
 */
export async function sendEmailWithDegradation(params: {
  to: string
  subject: string
  html: string
  leadId?: string
}): Promise<{ sent: boolean; queued?: boolean }> {
  return withGracefulDegradation(
    'resend',
    async () => {
      const { resendCall } = await import('./circuit-breaker')
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)

      await resendCall(() =>
        resend.emails.send({
          from: process.env.EMAIL_FROM || 'Dermotec Formation <contact@dermotec.fr>',
          to: params.to,
          subject: params.subject,
          html: params.html,
        })
      )
      return { sent: true }
    },
    {
      fallback: () => ({ sent: false, queued: true }),
      queuePayload: params,
      operationName: 'send-email',
    }
  )
}

// --- Notification admin ---

async function notifyServiceDown(serviceName: string, error: Error): Promise<void> {
  try {
    // Essayer d'envoyer via un canal alternatif
    logger.fatal(`SERVICE DOWN: ${serviceName}`, error, {
      service: 'alerting',
      alertType: 'service_down',
      affectedService: serviceName,
    })

    // Tenter Sentry
    const { captureException } = await import('./logger')
    await captureException(error, {
      tags: {
        service: serviceName,
        alert: 'service_down',
      },
      extra: {
        message: `${serviceName} is unreachable, operations are being queued`,
      },
    })
  } catch {
    // On ne peut plus rien faire — juste console.error
    console.error(`[CRITICAL] ${serviceName} DOWN and no alerting available:`, error.message)
  }
}

// --- Queue processor (drain la queue in-memory) ---

/**
 * Traiter les operations en queue (appele par un cron Inngest)
 */
export async function processQueue(): Promise<{
  processed: number
  failed: number
  remaining: number
}> {
  let processed = 0
  let failed = 0

  const pending = operationQueue.filter(op => op.status === 'pending')

  for (const op of pending) {
    op.status = 'processing'
    op.attempts++

    try {
      switch (op.service) {
        case 'stripe': {
          const { createCheckoutSession } = await import('./integrations/stripe')
          const payload = op.payload as Record<string, unknown>
          await createCheckoutSession({
            leadEmail: payload.leadEmail as string,
            leadNom: '',
            formationNom: payload.formationNom as string,
            montant: payload.montant as number,
            inscriptionId: payload.inscriptionId as string,
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/inscriptions?success=true`,
            cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/inscriptions?cancelled=true`,
          })
          break
        }
        case 'resend': {
          const { Resend } = await import('resend')
          const resend = new Resend(process.env.RESEND_API_KEY!)
          const payload = op.payload as Record<string, unknown>
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Dermotec Formation <contact@dermotec.fr>',
            to: payload.to as string,
            subject: payload.subject as string,
            html: payload.html as string,
          })
          break
        }
      }

      op.status = 'completed'
      processed++

      logger.info(`Queue: processed ${op.service}/${op.operation}`, {
        service: 'queue',
        queueId: op.id,
      })
    } catch (err) {
      if (op.attempts >= op.maxAttempts) {
        op.status = 'failed'
        op.error = (err as Error).message
        failed++

        logger.error(`Queue: permanently failed ${op.service}/${op.operation}`, err as Error, {
          service: 'queue',
          queueId: op.id,
          attempts: op.attempts,
        })
      } else {
        op.status = 'pending' // Retenter plus tard
      }
    }
  }

  // Nettoyer les operations completees
  const completed = operationQueue.filter(op => op.status === 'completed' || op.status === 'failed')
  for (const op of completed) {
    const idx = operationQueue.indexOf(op)
    if (idx >= 0) operationQueue.splice(idx, 1)
  }

  return {
    processed,
    failed,
    remaining: operationQueue.filter(op => op.status === 'pending').length,
  }
}

/**
 * Obtenir le statut de la queue (pour monitoring)
 */
export function getQueueStats(): {
  total: number
  pending: number
  processing: number
  failed: number
} {
  return {
    total: operationQueue.length,
    pending: operationQueue.filter(op => op.status === 'pending').length,
    processing: operationQueue.filter(op => op.status === 'processing').length,
    failed: operationQueue.filter(op => op.status === 'failed').length,
  }
}
