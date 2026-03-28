// ============================================================
// CRM DERMOTEC — Configuration Plans Stripe
// Mapping planId → Stripe Price ID avec fallbacks
// ============================================================

import type { PlanSaaS } from '@/types/subscription'

/**
 * Mapping des plans SaaS vers les Price IDs Stripe
 * Les env vars sont optionnelles, avec des placeholders pour le dev
 */
export const STRIPE_PLAN_PRICES: Record<PlanSaaS, string> = {
  decouverte: 'free', // Plan gratuit, pas de Price ID Stripe
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
  expert: process.env.STRIPE_PRICE_EXPERT || 'price_expert_placeholder',
  clinique: process.env.STRIPE_PRICE_CLINIQUE || 'price_clinique_placeholder',
} as const

/**
 * Vérifier si un Price ID est configuré (pas un placeholder)
 */
export function isPriceConfigured(planId: PlanSaaS): boolean {
  if (planId === 'decouverte') return true
  const priceId = STRIPE_PLAN_PRICES[planId]
  return !priceId.includes('placeholder')
}

/**
 * Obtenir le Price ID pour un plan, avec vérification
 */
export function getPriceId(planId: PlanSaaS): string {
  const priceId = STRIPE_PLAN_PRICES[planId]

  if (!isPriceConfigured(planId)) {
    throw new Error(`Plan ${planId} non configuré dans Stripe (Price ID manquant)`)
  }

  return priceId
}

/**
 * Mapper un Price ID Stripe vers un planId
 * Utilisé dans les webhooks pour identifier le plan
 */
export function getPlanFromPriceId(priceId: string): PlanSaaS {
  for (const [plan, id] of Object.entries(STRIPE_PLAN_PRICES)) {
    if (id === priceId) {
      return plan as PlanSaaS
    }
  }
  return 'decouverte' // Fallback
}

/**
 * Configuration des prix pour l'affichage (en EUR)
 * À synchroniser avec Stripe Dashboard
 */
export const PLAN_PRICING = {
  decouverte: {
    price: 0,
    currency: 'EUR',
    interval: 'month',
    annual_discount: 0,
  },
  pro: {
    price: 49,
    currency: 'EUR',
    interval: 'month',
    annual_discount: 0.15, // 15% de réduction annuelle
  },
  expert: {
    price: 99,
    currency: 'EUR',
    interval: 'month',
    annual_discount: 0.15,
  },
  clinique: {
    price: 199,
    currency: 'EUR',
    interval: 'month',
    annual_discount: 0.20, // 20% de réduction annuelle
  },
} as const

/**
 * Variables d'environnement Stripe requises
 */
export const STRIPE_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  // Price IDs pour les plans
  prices: {
    pro: process.env.STRIPE_PRICE_PRO,
    expert: process.env.STRIPE_PRICE_EXPERT,
    clinique: process.env.STRIPE_PRICE_CLINIQUE,
    // Prix annuels (optionnel)
    pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
    expert_annual: process.env.STRIPE_PRICE_EXPERT_ANNUAL,
    clinique_annual: process.env.STRIPE_PRICE_CLINIQUE_ANNUAL,
  },
} as const