import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

// Créer une session Checkout pour une inscription
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
  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: leadEmail,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Formation ${formationNom}`,
            description: `Inscription — ${leadNom}`,
          },
          unit_amount: Math.round(montant * 100), // centimes
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
  })
}

// Créer un paiement échelonné
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
  // Créer le customer Stripe
  const customer = await stripe.customers.create({
    email: leadEmail,
    metadata: { inscription_id: inscriptionId },
  })

  // Créer une facture avec échéancier
  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: 'send_invoice',
    days_until_due: 30,
    metadata: { inscription_id: inscriptionId },
  })

  // Ajouter la ligne
  await stripe.invoiceItems.create({
    customer: customer.id,
    invoice: invoice.id,
    amount: Math.round(montantTotal * 100),
    currency: 'eur',
    description: `Formation ${formationNom} — Paiement en ${nbEcheances}x`,
  })

  return { customer, invoice }
}

// Créer un lien de paiement rapide
export async function createPaymentLink({
  formationNom,
  montant,
  inscriptionId,
}: {
  formationNom: string
  montant: number
  inscriptionId: string
}) {
  const product = await stripe.products.create({
    name: `Formation ${formationNom}`,
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(montant * 100),
    currency: 'eur',
  })

  return stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { inscription_id: inscriptionId },
  })
}
