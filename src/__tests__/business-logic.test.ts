// ============================================================
// Tests — Business Logic (5 features)
// Duplicate detection, score decay, SLA tracking,
// stage tasks, daily digest
// ============================================================

import { describe, it, expect } from 'vitest'
import { normalizePhone } from '@/lib/duplicate-detection'
import { scoreLead, getScoreColor, getScoreLabel } from '@/lib/ai/scoring'
import { calculateSLA, calculateSLAMetrics } from '@/lib/sla-tracking'
import { getTasksForStage, buildRappelsForStage } from '@/lib/automation/stage-tasks'
import { generateDigestData } from '@/lib/daily-digest'
import type { Lead } from '@/types'

// Helper lead
function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'test-id', prenom: 'Marie', nom: null, email: null, telephone: null,
    source: 'formulaire', sujet: null, message: null, statut: 'NOUVEAU',
    priorite: 'NORMALE', score_chaud: 0, nb_contacts: 0, tags: [],
    formations_interessees: [], financement_souhaite: false, statut_pro: null,
    experience_esthetique: null, objectif_pro: null, formation_principale_id: null,
    commercial_assigne_id: null, date_dernier_contact: null,
    resultat_dernier_contact: null, date_prochain_contact: null,
    canal_prefere: null, adresse: null, ip_address: null, user_agent: null,
    referrer_url: null, utm_source: null, utm_medium: null, utm_campaign: null,
    metadata: null, data_sources: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    ...overrides,
  } as Lead
}

// --- Duplicate Detection ---

describe('normalizePhone', () => {
  it('normalise les formats FR courants', () => {
    expect(normalizePhone('06 12 34 56 78')).toBe('0612345678')
    expect(normalizePhone('06.12.34.56.78')).toBe('0612345678')
    expect(normalizePhone('+33612345678')).toBe('0612345678')
    expect(normalizePhone('0033612345678')).toBe('0612345678')
    expect(normalizePhone('06-12-34-56-78')).toBe('0612345678')
  })
})

// --- Score Decay ---

describe('Score Decay', () => {
  it('pas de decay si contact récent', () => {
    const lead = makeLead({
      email: 'test@test.com',
      date_dernier_contact: new Date().toISOString(),
    })
    const result = scoreLead(lead)
    // Pas de détail de decay
    expect(result.details.some(d => d.includes('inactif'))).toBe(false)
  })

  it('decay si inactif depuis 4+ semaines', () => {
    const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString()
    const lead = makeLead({
      email: 'test@test.com',
      telephone: '0612345678',
      date_dernier_contact: fourWeeksAgo,
      updated_at: fourWeeksAgo,
    })
    const result = scoreLead(lead)
    expect(result.details.some(d => d.includes('inactif'))).toBe(true)
    expect(result.total).toBeLessThan(15) // score bas car decay
  })

  it('scoring négatif pour statut PERDU', () => {
    const lead = makeLead({
      email: 'test@test.com',
      statut: 'PERDU',
    })
    const result = scoreLead(lead)
    expect(result.details.some(d => d.includes('PERDU'))).toBe(true)
  })

  it('scoring négatif pour statut SPAM', () => {
    const lead = makeLead({ statut: 'SPAM' })
    const result = scoreLead(lead)
    expect(result.total).toBeLessThanOrEqual(0)
  })

  it('score ne descend jamais sous 0', () => {
    const lead = makeLead({
      statut: 'SPAM',
      date_dernier_contact: new Date(Date.now() - 90 * 86400000).toISOString(),
    })
    const result = scoreLead(lead)
    expect(result.total).toBeGreaterThanOrEqual(0)
  })
})

// --- SLA Tracking ---

describe('SLA Tracking', () => {
  it('lead formulaire a un SLA de 120 min', () => {
    const lead = makeLead({ source: 'formulaire' })
    const sla = calculateSLA(lead)
    expect(sla.sla_minutes).toBe(120)
  })

  it('lead téléphone a un SLA de 5 min', () => {
    const lead = makeLead({ source: 'telephone' })
    const sla = calculateSLA(lead)
    expect(sla.sla_minutes).toBe(5)
  })

  it('lead déjà répondu = pas de breach', () => {
    const lead = makeLead({
      nb_contacts: 1,
      created_at: new Date(Date.now() - 86400000).toISOString(), // hier
    })
    const sla = calculateSLA(lead)
    expect(sla.is_responded).toBe(true)
    expect(sla.is_breached).toBe(false)
    expect(sla.severity).toBe('ok')
  })

  it('SLA metrics: compliance rate', () => {
    const leads = [
      makeLead({ id: '1', nb_contacts: 1 }), // répondu
      makeLead({ id: '2', nb_contacts: 0 }), // pas répondu
    ]
    const metrics = calculateSLAMetrics(leads)
    expect(metrics.total_new).toBe(2)
    expect(metrics.responded_in_sla).toBeGreaterThanOrEqual(0)
  })
})

// --- Stage Tasks ---

describe('Stage Tasks', () => {
  it('CONTACTE génère 1 tâche (qualifier)', () => {
    const tasks = getTasksForStage('CONTACTE')
    expect(tasks.length).toBe(1)
    expect(tasks[0].titre).toContain('Qualifier')
  })

  it('QUALIFIE génère 2 tâches (devis + créneau)', () => {
    const tasks = getTasksForStage('QUALIFIE')
    expect(tasks.length).toBe(2)
    expect(tasks[0].titre).toContain('devis')
  })

  it('FINANCEMENT_EN_COURS génère 2 tâches (dossier + relance)', () => {
    const tasks = getTasksForStage('FINANCEMENT_EN_COURS')
    expect(tasks.length).toBe(2)
  })

  it('FORME génère 3 tâches (satisfaction + certificat + avis Google)', () => {
    const tasks = getTasksForStage('FORME')
    expect(tasks.length).toBe(3)
    expect(tasks[0].titre).toContain('satisfaction')
  })

  it('NOUVEAU ne génère aucune tâche', () => {
    const tasks = getTasksForStage('NOUVEAU')
    expect(tasks.length).toBe(0)
  })

  it('buildRappelsForStage crée des rappels avec dates', () => {
    const rappels = buildRappelsForStage('lead-123', 'QUALIFIE', 'user-456')
    expect(rappels.length).toBe(2)
    expect(rappels[0].lead_id).toBe('lead-123')
    expect(rappels[0].assigned_to).toBe('user-456')
    expect(rappels[0].statut).toBe('EN_ATTENTE')
    expect(rappels[0].titre).toContain('[Auto]')
    // La date du rappel doit être dans le futur
    expect(new Date(rappels[0].date_rappel).getTime()).toBeGreaterThanOrEqual(Date.now())
  })
})

// --- Daily Digest ---

describe('Daily Digest', () => {
  it('génère un digest avec KPIs', () => {
    const data = generateDigestData({
      leads: [
        makeLead({ id: '1', statut: 'NOUVEAU', nb_contacts: 0 }),
        makeLead({ id: '2', statut: 'QUALIFIE', nb_contacts: 2 }),
      ],
      sessions: [],
      financements: [],
      rappelsOverdue: [],
      destinataire: 'test@dermotec.fr',
    })

    expect(data.destinataire).toBe('test@dermotec.fr')
    expect(data.kpis.leads_non_contactes).toBe(1)
    expect(data.date).toBeTruthy()
  })

  it('filtre seulement les actions CRITIQUE et HAUTE', () => {
    const data = generateDigestData({
      leads: [],
      sessions: [],
      financements: [],
      rappelsOverdue: [],
      destinataire: 'test@test.com',
    })

    // Pas d'actions si pas de données
    expect(data.smart_actions.length).toBe(0)
  })
})
