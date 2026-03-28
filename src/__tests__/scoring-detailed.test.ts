// ============================================================
// Tests — Scoring Lead (algorithme complet)
// Verifie chaque composante du score et les edge cases.
// ============================================================

import { describe, it, expect } from 'vitest'
import { scoreLead, getScoreColor, getScoreLabel } from '@/lib/ai/scoring'
import type { Lead } from '@/types'

// Helper : lead minimal
function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'test-id',
    prenom: 'Marie',
    nom: null,
    email: null,
    telephone: null,
    source: 'formulaire',
    sujet: null,
    message: null,
    statut: 'NOUVEAU',
    priorite: 'NORMALE',
    score_chaud: 0,
    nb_contacts: 0,
    tags: [],
    formations_interessees: [],
    financement_souhaite: false,
    statut_pro: null,
    experience_esthetique: null,
    objectif_pro: null,
    formation_principale_id: null,
    commercial_assigne_id: null,
    date_dernier_contact: null,
    resultat_dernier_contact: null,
    date_prochain_contact: null,
    canal_prefere: null,
    adresse: null,
    ip_address: null,
    user_agent: null,
    referrer_url: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    metadata: null,
    data_sources: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Lead
}

describe('scoreLead', () => {
  it('lead minimal a un score bas', () => {
    const result = scoreLead(makeLead())
    expect(result.total).toBeLessThan(20)
    expect(result.total).toBeGreaterThanOrEqual(0)
  })

  it('score ne depasse jamais 100', () => {
    const lead = makeLead({
      email: 'marie@test.com',
      telephone: '0612345678',
      nom: 'Dupont',
      statut_pro: 'salariee',
      formation_principale_id: 'form-1',
      experience_esthetique: 'intermediaire',
      objectif_pro: 'reconversion',
      adresse: { code_postal: '75011' } as any,
      nb_contacts: 10,
      date_dernier_contact: new Date().toISOString(),
      source: 'whatsapp',
      financement_souhaite: true,
      formations_interessees: ['a', 'b'],
      statut: 'FINANCEMENT_EN_COURS',
      priorite: 'URGENTE',
      tags: ['urgent'],
    })
    const result = scoreLead(lead)
    expect(result.total).toBeLessThanOrEqual(100)
  })

  describe('completude (/30)', () => {
    it('+5 pour email', () => {
      const sans = scoreLead(makeLead())
      const avec = scoreLead(makeLead({ email: 'test@test.com' }))
      expect(avec.completude - sans.completude).toBe(5)
    })

    it('+5 pour telephone', () => {
      const sans = scoreLead(makeLead())
      const avec = scoreLead(makeLead({ telephone: '0612345678' }))
      expect(avec.completude - sans.completude).toBe(5)
    })

    it('+5 pour formation principale', () => {
      const sans = scoreLead(makeLead())
      const avec = scoreLead(makeLead({ formation_principale_id: 'form-1' }))
      expect(avec.completude - sans.completude).toBe(5)
    })
  })

  describe('engagement (/25)', () => {
    it('+10 pour 3+ contacts', () => {
      const result = scoreLead(makeLead({ nb_contacts: 3 }))
      expect(result.engagement).toBeGreaterThanOrEqual(10)
    })

    it('+5 pour 1-2 contacts', () => {
      const result = scoreLead(makeLead({ nb_contacts: 1 }))
      expect(result.engagement).toBeGreaterThanOrEqual(5)
    })

    it('+8 pour contact recent (< 3 jours)', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString()
      const sans = scoreLead(makeLead({ nb_contacts: 1 }))
      const avec = scoreLead(makeLead({ nb_contacts: 1, date_dernier_contact: yesterday }))
      expect(avec.engagement - sans.engagement).toBe(8)
    })
  })

  describe('financement (/20)', () => {
    it('+10 pour financement souhaite', () => {
      const sans = scoreLead(makeLead())
      const avec = scoreLead(makeLead({ financement_souhaite: true }))
      expect(avec.financement - sans.financement).toBe(10)
    })

    it('+8 pour salariee (OPCO probable)', () => {
      const result = scoreLead(makeLead({ statut_pro: 'salariee' }))
      expect(result.financement).toBeGreaterThanOrEqual(8)
    })

    it('+7 pour demandeur emploi (France Travail)', () => {
      const result = scoreLead(makeLead({ statut_pro: 'demandeur_emploi' }))
      expect(result.financement).toBeGreaterThanOrEqual(7)
    })
  })

  describe('urgence (/10)', () => {
    it('+5 pour statut QUALIFIE', () => {
      const sans = scoreLead(makeLead())
      const avec = scoreLead(makeLead({ statut: 'QUALIFIE' }))
      expect(avec.urgence - sans.urgence).toBe(5)
    })

    it('+8 pour statut FINANCEMENT_EN_COURS', () => {
      const sans = scoreLead(makeLead())
      const avec = scoreLead(makeLead({ statut: 'FINANCEMENT_EN_COURS' }))
      expect(avec.urgence - sans.urgence).toBe(8)
    })
  })
})

describe('getScoreColor', () => {
  it('vert pour score >= 80', () => {
    expect(getScoreColor(80)).toBe('var(--color-success)')
    expect(getScoreColor(100)).toBe('var(--color-success)')
  })

  it('orange pour score 60-79', () => {
    expect(getScoreColor(60)).toBe('#F59E0B')
    expect(getScoreColor(79)).toBe('#F59E0B')
  })

  it('bleu pour score 40-59', () => {
    expect(getScoreColor(40)).toBe('#3B82F6')
    expect(getScoreColor(59)).toBe('#3B82F6')
  })

  it('gris pour score < 40', () => {
    expect(getScoreColor(0)).toBe('#9CA3AF')
    expect(getScoreColor(39)).toBe('#9CA3AF')
  })
})

describe('getScoreLabel', () => {
  it('labels corrects', () => {
    expect(getScoreLabel(80)).toBe('Chaud')
    expect(getScoreLabel(60)).toBe('Tiède')
    expect(getScoreLabel(40)).toBe('À qualifier')
    expect(getScoreLabel(20)).toBe('Froid')
  })
})
