// ============================================================
// Tests — Lead Scoring
// ============================================================

import { describe, it, expect } from 'vitest'
import { scoreLead, getScoreColor, getScoreLabel } from '@/lib/ai/scoring'
import type { Lead } from '@/types'

// Helper pour créer un lead minimal pour les tests
function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'test-id',
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    source: 'formulaire',
    statut: 'NOUVEAU',
    priorite: 'NORMALE',
    score_chaud: 0,
    nb_contacts: 0,
    formations_interessees: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Lead
}

describe('scoreLead', () => {
  it('retourne un score entre 0 et 100', () => {
    const result = scoreLead(makeLead())
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)
  })

  it('score plus élevé pour un lead qualifié', () => {
    const nouveau = scoreLead(makeLead({ statut: 'NOUVEAU' }))
    const qualifie = scoreLead(makeLead({ statut: 'QUALIFIE' }))
    expect(qualifie.total).toBeGreaterThan(nouveau.total)
  })

  it('score plus élevé avec plus d\'informations', () => {
    const minimal = scoreLead(makeLead())
    const complet = scoreLead(makeLead({
      email: 'test@example.com',
      telephone: '0612345678',
      formation_principale_id: 'some-uuid',
      nb_contacts: 3,
    }))
    expect(complet.total).toBeGreaterThan(minimal.total)
  })
})

describe('getScoreColor', () => {
  it('retourne la bonne couleur selon le score', () => {
    expect(getScoreColor(90)).toBe('var(--color-success)')  // Vert (hot)
    expect(getScoreColor(50)).toBe('#3B82F6')  // Bleu (à qualifier: 40-59)
    expect(getScoreColor(20)).toBe('#9CA3AF')  // Gris (froid: <40)
  })
})

describe('getScoreLabel', () => {
  it('retourne le bon label selon le score', () => {
    const hot = getScoreLabel(85)
    const cold = getScoreLabel(15)
    expect(hot).not.toBe(cold)
  })
})
