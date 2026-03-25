// ============================================================
// CRM DERMOTEC — Stripe Service
// Idempotency keys + Circuit Breaker + Error Handling
// ============================================================
import 'server-only'

import Stripe from 'stripe'

let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-08-27.basil',
    })
  }
  return _stripe
}

// Helper : générer une idempotency key déterministe
function idempotencyKey(...parts: string[]): string {
  return parts.filter(Boolean).join('-')
}

// Helper : appel Stripe avec retry via circuit breaker
async function safeStripeCall<T>(fn: () => Promise<T>, context: string): Promise<T> {
  try {
    // Tenter d'utiliser le circuit breaker s'il est dispo
    const { stripeCall } = await import('./circuit-breaker')
    return await stripeCall(fn)
  } catch (importErr) {
    // Fallback si circuit breaker pas dispo (dev, tests)
    try {
      return await fn()
    } catch (err) {
      console.error(`[Stripe] ${context} failed:`, err)
      throw err
    }
  }
}

// ============================================================
// Créer une session Checkout pour une inscription
// Idempotency: basée sur inscriptionId (un seul checkout par inscription)
// ============================================================
export async function createCheckoutSession({
  leadEmail,
  leadNom,
  formationNom,
  montant,
  inscriptionId,
  successUrl,
  cancelUrl,
}: {
  leadEmail: string
  leadNom: string
  formationNom: string
  montant: number
  inscriptionId: string
  successUrl: string
  cancelUrl: string
}) {
  const stripe = getStripe()

  return safeStripeCall(
    () => stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: leadEmail,
        payment_method_types: ['card', 'sepa_debit'], // Support SEPA
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Formation ${formationNom}`,
                description: `Inscription — ${leadNom}`,
              },
              unit_amount: Math.round(montant * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          inscription_id: inscriptionId,
          type: 'formation',
        },
        payment_intent_data: {
          metadata: {
            inscription_id: inscriptionId,
          },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      { idempotencyKey: idempotencyKey('checkout', inscriptionId) }
    ),
    `createCheckoutSession(${inscriptionId})`
  )
}

// ============================================================
// Créer un paiement échelonné
// Idempotency: basée sur inscriptionId + étape
// ============================================================
export async function createPaymentSchedule({
  leadEmail,
  formationNom,
  montantTotal,
  nbEcheances,
  inscriptionId,
}: {
  leadEmail: string
  formationNom: string
  montantTotal: number
  nbEcheances: number
  inscriptionId: string
}) {
  const stripe = getStripe()

  // 1. Chercher un customer existant par email (éviter doublons)
  const existingCustomers = await safeStripeCall(
    () => stripe.customers.list({ email: leadEmail, limit: 1 }),
    `listCustomers(${leadEmail})`
  )

  const customer = existingCustomers.data.length > 0
    ? existingCustomers.data[0]
    : await safeStripeCall(
        () => stripe.customers.create(
          { email: leadEmail, metadata: { inscription_id: inscriptionId } },
          { idempotencyKey: idempotencyKey('customer', inscriptionId) }
        ),
        `createCustomer(${inscriptionId})`
      )

  // 2. Créer la facture
  const invoice = await safeStripeCall(
    () => stripe.invoices.create(
      {
        customer: customer.id,
        collection_method: 'send_invoice',
        days_until_due: 30,
        metadata: { inscription_id: inscriptionId },
      },
      { idempotencyKey: idempotencyKey('invoice', inscriptionId) }
    ),
    `createInvoice(${inscriptionId})`
  )

  // 3. Ajouter l'item
  await safeStripeCall(
    () => stripe.invoiceItems.create(
      {
        customer: customer.id,
        invoice: invoice.id,
        amount: Math.round(montantTotal * 100),
        currency: 'eur',
        description: `Formation ${formationNom} — Paiement en ${nbEcheances}x`,
      },
      { idempotencyKey: idempotencyKey('invoiceitem', inscriptionId) }
    ),
    `createInvoiceItem(${inscriptionId})`
  )

  return { customer, invoice }
}

// ============================================================
// Créer un lien de paiement rapide
// Idempotency: basée sur inscriptionId
// ============================================================
export async function createPaymentLink({
  formationNom,
  montant,
  inscriptionId,
}: {
  formationNom: string
  montant: number
  inscriptionId: string
}) {
  const stripe = getStripe()

  const product = await safeStripeCall(
    () => stripe.products.create(
      { name: `Formation ${formationNom}` },
      { idempotencyKey: idempotencyKey('product', inscriptionId) }
    ),
    `createProduct(${inscriptionId})`
  )

  const price = await safeStripeCall(
    () => stripe.prices.create(
      {
        product: product.id,
        unit_amount: Math.round(montant * 100),
        currency: 'eur',
      },
      { idempotencyKey: idempotencyKey('price', inscriptionId) }
    ),
    `createPrice(${inscriptionId})`
  )

  return safeStripeCall(
    () => stripe.paymentLinks.create(
      {
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: { inscription_id: inscriptionId },
      },
      { idempotencyKey: idempotencyKey('paylink', inscriptionId) }
    ),
    `createPaymentLink(${inscriptionId})`
  )
}
