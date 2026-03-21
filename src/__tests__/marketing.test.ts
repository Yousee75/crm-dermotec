import { describe, it, expect } from 'vitest'
import {
  generateReferralCode,
  calculateUpsellScore,
  getBestContactTime,
  calculateNPS,
  getFinancementEligibility,
  getNextBestAction,
} from '@/lib/marketing'
import type { Lead } from '@/types'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'test-id',
    prenom: 'Marie',
    nom: 'Dupont',
    email: 'marie@test.fr',
    telephone: '0612345678',
    source: 'formulaire',
    statut: 'NOUVEAU',
    priorite: 'NORMALE',
    score_chaud: 20,
    nb_contacts: 0,
    formations_interessees: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Lead
}

describe('generateReferralCode', () => {
  it('génère un code au format DERMOTEC-XXXXXX-XXXX', () => {
    const code = generateReferralCode('Marie')
    expect(code).toMatch(/^DERMOTEC-[A-Z]{6}-[A-Z0-9]{4}$/)
  })

  it('pad le prénom court', () => {
    const code = generateReferralCode('Li')
    expect(code).toContain('LIXXXX')
  })

  it('tronque le prénom long', () => {
    const code = generateReferralCode('Alexandre')
    expect(code).toContain('ALEXAN')
  })
})

describe('calculateUpsellScore', () => {
  it('retourne un score bas pour un lead sans formations', () => {
    const result = calculateUpsellScore(makeLead())
    expect(result.score).toBeLessThan(30)
  })

  it('retourne un score élevé pour une indépendante formée récemment', () => {
    const result = calculateUpsellScore(makeLead({
      statut: 'FORME',
      statut_pro: 'independante',
      inscriptions: [{
        statut: 'COMPLETEE',
        updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      }] as never,
    }))
    expect(result.score).toBeGreaterThan(50)
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('pénalise les leads PERDU', () => {
    const result = calculateUpsellScore(makeLead({ statut: 'PERDU' }))
    expect(result.score).toBe(0) // -30 sur un score probablement 0
  })

  it('retourne max 3 suggestions', () => {
    const result = calculateUpsellScore(makeLead({
      statut: 'FORME',
      statut_pro: 'gerant_institut',
      experience_esthetique: 'experte',
      a_lance_activite: true,
      nps_score: 10,
    }))
    expect(result.suggestions.length).toBeLessThanOrEqual(3)
  })
})

describe('getBestContactTime', () => {
  it('retourne un jour et un créneau horaire', () => {
    const result = getBestContactTime()
    expect(result).toHaveProperty('day')
    expect(result).toHaveProperty('hour')
    expect(typeof result.day).toBe('string')
    expect(typeof result.hour).toBe('string')
  })
})

describe('calculateNPS', () => {
  it('retourne NPS 0 avec un tableau vide', () => {
    const result = calculateNPS([])
    expect(result.nps).toBe(0)
  })

  it('retourne NPS 100 si que des promoteurs (9-10)', () => {
    const result = calculateNPS([9, 10, 9, 10, 10])
    expect(result.nps).toBe(100)
    expect(result.promoters).toBe(100)
    expect(result.detractors).toBe(0)
  })

  it('retourne NPS -100 si que des détracteurs (0-6)', () => {
    const result = calculateNPS([1, 3, 5, 6, 2])
    expect(result.nps).toBe(-100)
    expect(result.detractors).toBe(100)
  })

  it('calcule correctement un mix', () => {
    // 2 promoteurs (9,10), 1 passif (8), 1 détracteur (5) = NPS 25%
    const result = calculateNPS([9, 10, 8, 5])
    expect(result.nps).toBe(25) // (2-1)/4 * 100 = 25
  })
})

describe('getFinancementEligibility', () => {
  it('salariée éligible OPCO/CPF', () => {
    const result = getFinancementEligibility('salariee')
    expect(result.eligible).toContain('OPCO_EP')
    expect(result.eligible).toContain('CPF')
    expect(result.documents.length).toBeGreaterThan(0)
  })

  it('demandeur emploi éligible France Travail', () => {
    const result = getFinancementEligibility('demandeur_emploi')
    expect(result.eligible).toContain('FRANCE_TRAVAIL')
    expect(result.eligible).toContain('CPF')
  })

  it('indépendante éligible FAFCEA', () => {
    const result = getFinancementEligibility('independante')
    expect(result.eligible).toContain('FAFCEA')
  })

  it('reconversion éligible Transitions Pro', () => {
    const result = getFinancementEligibility('reconversion')
    expect(result.eligible).toContain('TRANSITIONS_PRO')
  })

  it('gérante institut éligible OPCO/FAFCEA', () => {
    const result = getFinancementEligibility('gerant_institut')
    expect(result.eligible).toContain('FAFCEA')
    expect(result.eligible).toContain('OPCO_EP')
  })

  it('statut inconnu → CPF par défaut', () => {
    const result = getFinancementEligibility('inconnu')
    expect(result.eligible).toContain('CPF')
  })
})

describe('getNextBestAction', () => {
  it('lead NOUVEAU → appel de qualification urgent', () => {
    const result = getNextBestAction(makeLead({ statut: 'NOUVEAU' }))
    expect(result.priority).toBe('URGENTE')
    expect(result.action).toContain('qualification')
  })

  it('lead FINANCEMENT_EN_COURS → suivi dossier', () => {
    const result = getNextBestAction(makeLead({ statut: 'FINANCEMENT_EN_COURS' }))
    expect(result.action).toContain('financement')
  })

  it('lead sans statut spécial → entretien relation', () => {
    const result = getNextBestAction(makeLead({ statut: 'CONTACTE' }))
    expect(result.priority).toBe('BASSE')
  })
})
