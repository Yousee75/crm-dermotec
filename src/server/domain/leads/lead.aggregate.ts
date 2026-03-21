// ============================================================
// Lead Aggregate — Domain logic, state machine, business rules
// The aggregate is the consistency boundary.
// All mutations go through methods that enforce invariants.
// ============================================================

import type { StatutLead, PrioriteLead, SourceLead } from '@/types'
import { type Result, Ok, Err, Errors } from '../shared/result'
import { Email, PhoneFR } from '../shared/value-objects'
import { scoreLead } from '@/lib/scoring'
import { createEvent, type LeadCreatedEvent, type LeadStatusChangedEvent, type LeadContactedEvent, type LeadAssignedEvent, type LeadLostEvent, type CRMDomainEvent } from '../shared/domain-events'

// --- State machine: exact copy of validators.ts, enforced here ---

const VALID_TRANSITIONS: Record<StatutLead, StatutLead[]> = {
  NOUVEAU: ['CONTACTE', 'QUALIFIE', 'PERDU', 'SPAM'],
  CONTACTE: ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'PERDU', 'REPORTE', 'SPAM'],
  QUALIFIE: ['FINANCEMENT_EN_COURS', 'INSCRIT', 'PERDU', 'REPORTE'],
  FINANCEMENT_EN_COURS: ['INSCRIT', 'PERDU', 'REPORTE', 'QUALIFIE'],
  INSCRIT: ['EN_FORMATION', 'PERDU', 'REPORTE'],
  EN_FORMATION: ['FORME', 'PERDU'],
  FORME: ['ALUMNI', 'PERDU'],
  ALUMNI: ['QUALIFIE'],
  PERDU: ['NOUVEAU', 'CONTACTE'],
  REPORTE: ['CONTACTE', 'QUALIFIE', 'PERDU'],
  SPAM: [],
}

// --- Lead aggregate ---

export interface LeadData {
  id: string
  prenom: string
  nom: string | null
  email: string | null
  telephone: string | null
  source: SourceLead
  sujet: string | null
  message: string | null
  statut: StatutLead
  priorite: PrioriteLead
  score_chaud: number
  formation_principale_id: string | null
  commercial_assigne_id: string | null
  nb_contacts: number
  financement_souhaite: boolean
  tags: string[]
  date_dernier_contact: string | null
  resultat_dernier_contact: string | null
  statut_pro: string | null
  experience_esthetique: string | null
  formations_interessees: string[]
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export class LeadAggregate {
  /** Domain events accumulated during this unit of work */
  private _events: CRMDomainEvent[] = []

  private constructor(private _data: LeadData) {}

  // --- Factory: from DB row ---
  static fromData(data: LeadData): LeadAggregate {
    return new LeadAggregate(data)
  }

  // --- Factory: create new lead ---
  static create(
    input: {
      prenom: string
      nom?: string
      email?: string
      telephone?: string
      source: SourceLead
      sujet?: string
      message?: string
      formation_principale_id?: string
      utm_source?: string
      utm_medium?: string
      utm_campaign?: string
    },
    actorId: string | null = null
  ): Result<{ data: Omit<LeadData, 'id' | 'created_at' | 'updated_at'>; events: CRMDomainEvent[] }> {
    // Validate email if provided
    if (input.email) {
      const email = Email.create(input.email)
      if (!email) {
        return Err(Errors.validation('Email invalide ou jetable', { field: 'email' }), 422)
      }
    }

    // Validate phone if provided
    if (input.telephone) {
      const phone = PhoneFR.create(input.telephone)
      if (!phone) {
        return Err(Errors.validation('Telephone invalide (format FR)', { field: 'telephone' }), 422)
      }
    }

    // Must have at least name
    if (!input.prenom || input.prenom.trim().length === 0) {
      return Err(Errors.validation('Prenom requis', { field: 'prenom' }), 422)
    }

    const initialScore = 20
    const now = new Date().toISOString()

    const data: Omit<LeadData, 'id' | 'created_at' | 'updated_at'> = {
      prenom: input.prenom.trim(),
      nom: input.nom?.trim() || null,
      email: input.email?.toLowerCase().trim() || null,
      telephone: input.telephone || null,
      source: input.source,
      sujet: input.sujet || null,
      message: input.message || null,
      statut: 'NOUVEAU',
      priorite: 'NORMALE',
      score_chaud: initialScore,
      formation_principale_id: input.formation_principale_id || null,
      commercial_assigne_id: null,
      nb_contacts: 0,
      financement_souhaite: false,
      tags: [],
      date_dernier_contact: null,
      resultat_dernier_contact: null,
      statut_pro: null,
      experience_esthetique: null,
      formations_interessees: [],
    }

    const events: CRMDomainEvent[] = [
      createEvent('crm/lead.created', {
        lead_id: '', // Will be set after DB insert
        email: data.email as string | null,
        prenom: data.prenom as string,
        nom: (data.nom || '') as string,
        source: data.source as string,
        sujet: data.sujet as string | null,
        formation_id: data.formation_principale_id as string | null,
        score_chaud: initialScore,
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
      }, actorId) as CRMDomainEvent,
    ]

    return Ok({ data, events })
  }

  // --- Getters ---
  get id(): string { return this._data.id }
  get data(): Readonly<LeadData> { return this._data }
  get events(): readonly CRMDomainEvent[] { return this._events }
  get statut(): StatutLead { return this._data.statut }
  get email(): string | null { return this._data.email }

  // --- State machine transition ---
  changeStatus(
    newStatut: StatutLead,
    reason?: string,
    actorId: string | null = null
  ): Result<void> {
    const current = this._data.statut
    if (current === newStatut) return Ok(undefined)

    const allowed = VALID_TRANSITIONS[current]
    if (!allowed?.includes(newStatut)) {
      return Err(Errors.invalidTransition(current, newStatut, 'Lead'), 422)
    }

    const oldStatut = current
    this._data.statut = newStatut
    this._data.updated_at = new Date().toISOString()

    // Emit event
    this._events.push(
      createEvent('crm/lead.status.changed', {
        lead_id: this._data.id,
        from: oldStatut,
        to: newStatut,
        reason,
      }, actorId)
    )

    // If lost, emit specific event
    if (newStatut === 'PERDU') {
      this._events.push(
        createEvent('crm/lead.lost', {
          lead_id: this._data.id,
          raison: reason || 'Non precise',
          previous_statut: oldStatut,
        }, actorId)
      )
    }

    return Ok(undefined)
  }

  // --- Record a contact ---
  recordContact(
    canal: string,
    resultat: string,
    actorId: string | null = null
  ): void {
    this._data.nb_contacts += 1
    this._data.date_dernier_contact = new Date().toISOString()
    this._data.resultat_dernier_contact = resultat
    this._data.updated_at = new Date().toISOString()

    this._events.push(
      createEvent('crm/lead.contacted', {
        lead_id: this._data.id,
        canal,
        resultat,
        nb_contacts: this._data.nb_contacts,
      }, actorId)
    )
  }

  // --- Assign commercial ---
  assignCommercial(
    commercialId: string,
    actorId: string | null = null
  ): void {
    const previous = this._data.commercial_assigne_id
    this._data.commercial_assigne_id = commercialId
    this._data.updated_at = new Date().toISOString()

    this._events.push(
      createEvent('crm/lead.assigned', {
        lead_id: this._data.id,
        commercial_id: commercialId,
        previous_commercial_id: previous,
      }, actorId)
    )
  }

  // --- Recalculate score ---
  recalculateScore(): number {
    // Need the full Lead shape for scoring
    const breakdown = scoreLead(this._data as never)
    this._data.score_chaud = breakdown.total
    return breakdown.total
  }

  // --- Clear accumulated events (after publishing) ---
  clearEvents(): void {
    this._events = []
  }
}
