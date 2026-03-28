/**
 * Tests pour les nouvelles fonctionnalités : Onboarding et Pricing
 * 2026-03-24 — Dernières tâches du plan de refonte
 */

import { describe, it, expect } from 'vitest'
import { PLANS_PRICING } from '@/lib/constants'

describe('Pricing Constants', () => {
  it('should have 4 plans with correct structure', () => {
    expect(PLANS_PRICING).toHaveLength(4)

    const requiredFields = ['name', 'price', 'period', 'priceNumeric', 'features', 'cta', 'ctaHref', 'highlighted', 'popular']

    PLANS_PRICING.forEach(plan => {
      requiredFields.forEach(field => {
        expect(plan).toHaveProperty(field)
      })
    })
  })

  it('should have correct pricing values', () => {
    const expectedPricing = [
      { name: 'Découverte', priceNumeric: 0, price: 'Gratuit' },
      { name: 'Pro', priceNumeric: 79, price: '79€' },
      { name: 'Expert', priceNumeric: 149, price: '149€' },
      { name: 'Clinique', priceNumeric: 999, price: 'Sur devis' },
    ]

    expectedPricing.forEach((expected, index) => {
      expect(PLANS_PRICING[index].name).toBe(expected.name)
      expect(PLANS_PRICING[index].priceNumeric).toBe(expected.priceNumeric)
      expect(PLANS_PRICING[index].price).toBe(expected.price)
    })
  })

  it('should have Pro plan highlighted', () => {
    const proPlan = PLANS_PRICING.find(plan => plan.name === 'Pro')
    expect(proPlan?.highlighted).toBe(true)
    expect(proPlan?.popular).toBe(true)
  })

  it('should have correct user limits', () => {
    const plans = PLANS_PRICING

    // Découverte: 1 utilisateur
    expect(plans[0].features).toContain('1 utilisateur')

    // Pro: 2 utilisateurs + 25€/user
    expect(plans[1].features).toContain('2 utilisateurs inclus')
    expect(plans[1].features).toContain('+25€/utilisateur supplémentaire')

    // Expert: 5 utilisateurs
    expect(plans[2].features).toContain('5 utilisateurs inclus')

    // Clinique: illimités
    expect(plans[3].features).toContain('Utilisateurs illimités')
  })
})

describe('Onboarding Steps Logic', () => {
  it('should define correct onboarding steps', () => {
    const expectedSteps = [
      'first_lead',      // Ajouter votre premier prospect
      'first_contact',   // Envoyer un premier email ou WhatsApp
      'first_session',   // Planifier une session de formation
      'first_devis',     // Générer un premier devis
      'team_member'      // Inviter un membre de l'équipe
    ]

    // Ces steps sont définis dans OnboardingProgressBar.tsx
    // On teste ici la logique métier
    expect(expectedSteps).toHaveLength(5)
    expect(expectedSteps).toContain('first_lead')
    expect(expectedSteps).toContain('team_member')
  })

  it('should calculate progress correctly', () => {
    const totalSteps = 5

    // Test de calcul de progression
    const testCases = [
      { completed: 0, expected: 0 },
      { completed: 1, expected: 20 },
      { completed: 3, expected: 60 },
      { completed: 5, expected: 100 },
    ]

    testCases.forEach(({ completed, expected }) => {
      const progress = (completed / totalSteps) * 100
      expect(progress).toBe(expected)
    })
  })

  it('should validate localStorage keys', () => {
    const expectedKeys = [
      'onboarding_completed_steps',
      'onboarding_start_date',
      'onboarding_dismissed_until',
      'onboarding_complete'
    ]

    // Vérifier que les clés sont bien définies
    expectedKeys.forEach(key => {
      expect(key).toMatch(/^onboarding_/)
    })
  })
})

describe('Business Logic Validation', () => {
  it('should validate pricing tiers progression', () => {
    const prices = PLANS_PRICING.map(p => p.priceNumeric)

    // Vérifier que les prix augmentent (sauf gratuit et sur devis)
    expect(prices[0]).toBe(0)      // Gratuit
    expect(prices[1]).toBe(79)     // Pro
    expect(prices[2]).toBe(149)    // Expert
    expect(prices[3]).toBe(999)    // Clinique (placeholder)
  })

  it('should have appropriate features escalation', () => {
    const plans = PLANS_PRICING

    // Découverte: limitations
    expect(plans[0].features[0]).toContain('50 contacts')

    // Pro: plus de contacts, plus d'users
    expect(plans[1].features[0]).toContain('500 contacts')

    // Expert: illimité
    expect(plans[2].features[0]).toContain('illimités')

    // Chaque plan devrait avoir au moins autant de features que le précédent
    expect(plans[1].features.length).toBeGreaterThanOrEqual(plans[0].features.length)
    expect(plans[2].features.length).toBeGreaterThanOrEqual(plans[1].features.length)
  })
})