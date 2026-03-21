import { describe, it, expect } from 'vitest'
import { generateSmartActions, type SmartAction } from '@/lib/smart-actions'
import type { Lead, Session, Financement, Rappel } from '@/types'

// Helpers pour créer des données de test
const now = new Date()
function daysAgo(n: number): string {
  return new Date(now.getTime() - n * 86400000).toISOString()
}
function daysFromNow(n: number): string {
  return new Date(now.getTime() + n * 86400000).toISOString()
}

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
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
    created_at: daysAgo(3),
    updated_at: daysAgo(3),
    ...overrides,
  } as Lead
}

function makeRappel(overrides: Partial<Rappel> = {}): Rappel {
  return {
    id: 'rappel-1',
    lead_id: 'lead-1',
    type: 'APPEL',
    date_rappel: daysAgo(2),
    statut: 'EN_ATTENTE',
    titre: 'Rappeler Marie',
    lead: { prenom: 'Marie', nom: 'Dupont' },
    ...overrides,
  } as Rappel
}

describe('generateSmartActions', () => {
  it('retourne un tableau vide si pas de données', () => {
    const actions = generateSmartActions({
      leads: [],
      sessions: [],
      financements: [],
      rappelsOverdue: [],
    })
    expect(actions).toEqual([])
  })

  it('détecte les rappels en retard (CRITIQUE si > 3 jours)', () => {
    const actions = generateSmartActions({
      leads: [],
      sessions: [],
      financements: [],
      rappelsOverdue: [makeRappel({ date_rappel: daysAgo(5) })],
    })
    expect(actions.length).toBeGreaterThanOrEqual(1)
    expect(actions[0].type).toBe('RAPPEL_OVERDUE')
    expect(actions[0].priorite).toBe('CRITIQUE')
  })

  it('détecte les rappels en retard (HAUTE si <= 3 jours)', () => {
    const actions = generateSmartActions({
      leads: [],
      sessions: [],
      financements: [],
      rappelsOverdue: [makeRappel({ date_rappel: daysAgo(2) })],
    })
    expect(actions[0].priorite).toBe('HAUTE')
  })

  it('détecte les leads stagnants (QUALIFIE sans contact 5+ jours)', () => {
    const actions = generateSmartActions({
      leads: [makeLead({
        statut: 'QUALIFIE',
        date_dernier_contact: daysAgo(7),
      })],
      sessions: [],
      financements: [],
      rappelsOverdue: [],
    })
    const stagnants = actions.filter(a => a.type === 'LEAD_STAGNANT')
    expect(stagnants.length).toBe(1)
    expect(stagnants[0].priorite).toBe('NORMALE')
  })

  it('stagnant HAUTE si 14+ jours', () => {
    const actions = generateSmartActions({
      leads: [makeLead({
        statut: 'QUALIFIE',
        date_dernier_contact: daysAgo(20),
      })],
      sessions: [],
      financements: [],
      rappelsOverdue: [],
    })
    const stagnants = actions.filter(a => a.type === 'LEAD_STAGNANT')
    expect(stagnants[0].priorite).toBe('HAUTE')
  })

  it('détecte les nouveaux leads non contactés', () => {
    const actions = generateSmartActions({
      leads: [makeLead({ statut: 'NOUVEAU', nb_contacts: 0, created_at: daysAgo(2) })],
      sessions: [],
      financements: [],
      rappelsOverdue: [],
    })
    const appeler = actions.filter(a => a.type === 'APPELER_LEAD')
    expect(appeler.length).toBe(1)
  })

  it('détecte les sessions incomplètes proches', () => {
    const actions = generateSmartActions({
      leads: [],
      sessions: [{
        id: 'session-1',
        statut: 'CONFIRMEE',
        places_max: 6,
        places_occupees: 2,
        date_debut: daysFromNow(10),
        formation: { nom: 'Microblading' },
      } as unknown as Session],
      financements: [],
      rappelsOverdue: [],
    })
    const incomplete = actions.filter(a => a.type === 'SESSION_INCOMPLETE')
    expect(incomplete.length).toBe(1)
  })

  it('détecte les financements en attente 15+ jours', () => {
    const actions = generateSmartActions({
      leads: [],
      sessions: [],
      financements: [{
        statut: 'SOUMIS',
        organisme: 'OPCO_EP',
        date_soumission: daysAgo(20),
        lead_id: 'lead-1',
        lead: { prenom: 'Marie', nom: 'Dupont' },
      } as unknown as Financement],
      rappelsOverdue: [],
    })
    const fin = actions.filter(a => a.type === 'RELANCER_FINANCEMENT')
    expect(fin.length).toBe(1)
  })

  it('trie par priorité (CRITIQUE > HAUTE > NORMALE > BASSE)', () => {
    const actions = generateSmartActions({
      leads: [makeLead({ statut: 'NOUVEAU', nb_contacts: 0, created_at: daysAgo(2) })],
      sessions: [],
      financements: [],
      rappelsOverdue: [makeRappel({ date_rappel: daysAgo(5) })],
    })
    expect(actions.length).toBeGreaterThanOrEqual(2)
    // Le premier doit être CRITIQUE (rappel overdue > 3j)
    expect(actions[0].priorite).toBe('CRITIQUE')
  })

  it('ne détecte pas de stagnant si contact récent', () => {
    const actions = generateSmartActions({
      leads: [makeLead({
        statut: 'QUALIFIE',
        date_dernier_contact: daysAgo(2),
      })],
      sessions: [],
      financements: [],
      rappelsOverdue: [],
    })
    const stagnants = actions.filter(a => a.type === 'LEAD_STAGNANT')
    expect(stagnants.length).toBe(0)
  })
})
