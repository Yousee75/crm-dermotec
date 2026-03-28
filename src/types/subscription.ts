// ============================================================
// CRM DERMOTEC — Types Abonnements SaaS
// ============================================================

export type PlanSaaS = 'decouverte' | 'pro' | 'expert' | 'clinique'

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid'

export interface SubscriptionInfo {
  id: string
  status: SubscriptionStatus
  plan: PlanSaaS
  current_period_end: number // timestamp Unix
  cancel_at_period_end: boolean
  created: number // timestamp Unix
  price_id?: string
}

export interface CustomerInfo {
  id: string
  email: string | null
}

export interface InvoiceInfo {
  id: string
  date: number // timestamp Unix en millisecondes
  amount: number // en centimes
  status: string | null
  pdf_url: string | null
  number: string | null
}

export interface SubscriptionResponse {
  subscription: SubscriptionInfo | null
  customer: CustomerInfo | null
  plan: PlanSaaS
  invoices: InvoiceInfo[]
}

export interface CheckoutResponse {
  url: string | null
  session_id: string
  plan: PlanSaaS
}

export interface PortalResponse {
  url: string | null
  customer_id: string
}

// Métadonnées utilisateur étendues pour Supabase Auth
export interface UserMetadataSubscription {
  subscription_id?: string | null
  plan?: PlanSaaS
  subscription_status?: SubscriptionStatus
  subscription_created?: number
  current_period_end?: number
  cancel_at_period_end?: boolean
  canceled_at?: number
}

// Plans SaaS avec leurs caractéristiques
export interface PlanFeatures {
  name: string
  price: number // en EUR/mois
  currency: 'EUR'
  interval: 'month'
  features: string[]
  maxLeads?: number
  maxUsers?: number
  maxSessions?: number
  aiCredits?: number
  priority: 'low' | 'normal' | 'high'
}

export const PLANS_CONFIG: Record<PlanSaaS, PlanFeatures> = {
  decouverte: {
    name: 'Découverte',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    features: [
      '50 leads maximum',
      '1 utilisateur',
      '5 sessions par mois',
      'Support email'
    ],
    maxLeads: 50,
    maxUsers: 1,
    maxSessions: 5,
    priority: 'low'
  },
  pro: {
    name: 'Pro',
    price: 49,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Leads illimités',
      'Jusqu\'à 3 utilisateurs',
      'Sessions illimitées',
      'Agent IA inclus',
      'Support prioritaire',
      'Exports avancés'
    ],
    maxUsers: 3,
    aiCredits: 1000,
    priority: 'normal'
  },
  expert: {
    name: 'Expert',
    price: 99,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Tout du plan Pro',
      'Jusqu\'à 10 utilisateurs',
      'Automations avancées',
      'Intégrations Webhook',
      'Tableaux de bord personnalisés',
      'Formation incluse'
    ],
    maxUsers: 10,
    aiCredits: 3000,
    priority: 'high'
  },
  clinique: {
    name: 'Clinique',
    price: 199,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Tout du plan Expert',
      'Utilisateurs illimités',
      'Multi-centres',
      'API complète',
      'Support dédié',
      'Onboarding personnalisé'
    ],
    aiCredits: 10000,
    priority: 'high'
  }
}