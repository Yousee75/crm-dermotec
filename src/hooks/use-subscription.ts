// ============================================================
// CRM DERMOTEC — Hook Abonnements SaaS
// React Query pour les APIs Stripe Billing
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  SubscriptionResponse,
  CheckoutResponse,
  PortalResponse,
  PlanSaaS,
} from '@/types/subscription'

const SUBSCRIPTION_QUERY_KEY = ['subscription'] as const

// ============================================================
// Hook principal pour récupérer l'abonnement
// ============================================================
export function useSubscription() {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: async (): Promise<SubscriptionResponse> => {
      const response = await fetch('/api/stripe/subscription', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Erreur lors de la récupération de l\'abonnement')
      }

      return response.json()
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ============================================================
// Mutation pour créer un checkout d'abonnement
// ============================================================
export function useCreateSubscriptionCheckout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (planId: PlanSaaS): Promise<CheckoutResponse> => {
      const response = await fetch('/api/stripe/checkout-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Erreur lors de la création du checkout')
      }

      return response.json()
    },
    onSuccess: (data, planId) => {
      toast.success(`Redirection vers le paiement du plan ${planId}`)

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (error: Error) => {
      console.error('Erreur checkout subscription:', error)
      toast.error(error.message || 'Erreur lors de la création du checkout')
    },
    onSettled: () => {
      // Invalider le cache subscription
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY })
    },
  })
}

// ============================================================
// Mutation pour accéder au portail client
// ============================================================
export function useCustomerPortal() {
  return useMutation({
    mutationFn: async (): Promise<PortalResponse> => {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()

        if (response.status === 404) {
          throw new Error('Aucun abonnement trouvé')
        }

        throw new Error(error.details || 'Erreur lors de l\'accès au portail')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success('Redirection vers le portail client')

      // Rediriger vers Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (error: Error) => {
      console.error('Erreur customer portal:', error)
      if (error.message === 'Aucun abonnement trouvé') {
        toast.error('Vous devez d\'abord souscrire un abonnement')
      } else {
        toast.error(error.message || 'Erreur lors de l\'accès au portail')
      }
    },
  })
}

// ============================================================
// Hook pour obtenir le plan actuel (derived state)
// ============================================================
export function useCurrentPlan() {
  const { data: subscription, isLoading, error } = useSubscription()

  return {
    plan: subscription?.plan || 'decouverte',
    subscription: subscription?.subscription,
    isLoading,
    error,
    isPro: subscription?.plan === 'pro',
    isExpert: subscription?.plan === 'expert',
    isClinique: subscription?.plan === 'clinique',
    isGratuit: subscription?.plan === 'decouverte',
    hasPaidPlan: subscription?.plan !== 'decouverte',
  }
}

// ============================================================
// Hook pour vérifier les limites de plan
// ============================================================
export function usePlanLimits() {
  const { plan } = useCurrentPlan()

  // Ces limites devraient être synchronisées avec PLANS_CONFIG
  const limits = {
    decouverte: {
      maxLeads: 50,
      maxUsers: 1,
      maxSessions: 5,
      aiCredits: 0,
      hasAdvancedFeatures: false,
    },
    pro: {
      maxLeads: Infinity,
      maxUsers: 3,
      maxSessions: Infinity,
      aiCredits: 1000,
      hasAdvancedFeatures: true,
    },
    expert: {
      maxLeads: Infinity,
      maxUsers: 10,
      maxSessions: Infinity,
      aiCredits: 3000,
      hasAdvancedFeatures: true,
    },
    clinique: {
      maxLeads: Infinity,
      maxUsers: Infinity,
      maxSessions: Infinity,
      aiCredits: 10000,
      hasAdvancedFeatures: true,
    },
  }

  return limits[plan] || limits.decouverte
}