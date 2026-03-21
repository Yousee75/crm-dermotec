// ============================================================
// Repository Interfaces — Ports (Hexagonal Architecture)
// Domain defines what it needs. Infrastructure provides it.
// Supabase is an implementation detail — testable with in-memory fakes.
// ============================================================

import type { Result } from './result'
import type { Pagination } from './value-objects'

// --- Generic Repository interface ---

export interface Repository<T, CreateDTO, UpdateDTO> {
  findById(id: string): Promise<Result<T>>
  findMany(filters: Record<string, unknown>, pagination: Pagination): Promise<Result<{ data: T[]; total: number }>>
  create(data: CreateDTO): Promise<Result<T>>
  update(id: string, data: UpdateDTO): Promise<Result<T>>
  delete(id: string): Promise<Result<void>>
}

// --- Lead-specific repository ---

export interface LeadRepository {
  findById(id: string): Promise<Result<LeadAggregate>>
  findByEmail(email: string): Promise<Result<LeadAggregate | null>>
  findMany(filters: LeadFilters, pagination: Pagination): Promise<Result<{ data: LeadAggregate[]; total: number }>>
  create(data: CreateLeadDTO): Promise<Result<LeadAggregate>>
  update(id: string, data: UpdateLeadDTO): Promise<Result<LeadAggregate>>
  updateStatus(id: string, status: string): Promise<Result<void>>
  incrementContacts(id: string): Promise<Result<void>>
  search(query: string, pagination: Pagination): Promise<Result<{ data: LeadAggregate[]; total: number }>>
  countByStatus(): Promise<Result<Record<string, number>>>
}

export interface LeadFilters {
  statut?: string
  source?: string
  commercial_id?: string
  formation_id?: string
  priorite?: string
  search?: string
  created_after?: string
  created_before?: string
  tags?: string[]
  score_min?: number
  score_max?: number
}

export interface CreateLeadDTO {
  prenom: string
  nom?: string
  email?: string
  telephone?: string
  source: string
  sujet?: string
  message?: string
  statut?: string
  priorite?: string
  score_chaud?: number
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer_url?: string
  ip_address?: string
  user_agent?: string
  formation_principale_id?: string
  metadata?: Record<string, unknown>
}

export interface UpdateLeadDTO {
  prenom?: string
  nom?: string
  email?: string
  telephone?: string
  statut?: string
  priorite?: string
  score_chaud?: number
  commercial_assigne_id?: string
  formation_principale_id?: string
  statut_pro?: string
  experience_esthetique?: string
  financement_souhaite?: boolean
  organisme_financement?: string
  tags?: string[]
  notes?: string
  nps_score?: number
  avis_google_laisse?: boolean
  temoignage?: string
  date_dernier_contact?: string
  resultat_dernier_contact?: string
  [key: string]: unknown
}

// --- Lead aggregate (entity + relations) ---
export interface LeadAggregate {
  id: string
  prenom: string
  nom: string | null
  email: string | null
  telephone: string | null
  source: string
  statut: string
  priorite: string
  score_chaud: number
  formation_principale_id: string | null
  commercial_assigne_id: string | null
  nb_contacts: number
  financement_souhaite: boolean
  tags: string[]
  created_at: string
  updated_at: string
  [key: string]: unknown
}

// --- Session repository ---

export interface SessionRepository {
  findById(id: string): Promise<Result<SessionAggregate>>
  findMany(filters: SessionFilters, pagination: Pagination): Promise<Result<{ data: SessionAggregate[]; total: number }>>
  create(data: CreateSessionDTO): Promise<Result<SessionAggregate>>
  update(id: string, data: UpdateSessionDTO): Promise<Result<SessionAggregate>>
  updateStatus(id: string, status: string): Promise<Result<void>>
  findByDateRange(start: string, end: string): Promise<Result<SessionAggregate[]>>
  incrementPlaces(id: string, delta: number): Promise<Result<void>>
  incrementCA(id: string, amount: number): Promise<Result<void>>
}

export interface SessionFilters {
  statut?: string
  formation_id?: string
  formatrice_id?: string
  date_after?: string
  date_before?: string
}

export interface CreateSessionDTO {
  formation_id: string
  date_debut: string
  date_fin: string
  horaire_debut: string
  horaire_fin: string
  salle: string
  adresse: string
  formatrice_id?: string
  places_max: number
  modeles_necessaires?: number
  notes?: string
}

export interface UpdateSessionDTO {
  statut?: string
  formatrice_id?: string
  places_max?: number
  notes?: string
  materiel_prepare?: boolean
  supports_envoyes?: boolean
  convocations_envoyees?: boolean
  ca_realise?: number
  [key: string]: unknown
}

export interface SessionAggregate {
  id: string
  formation_id: string
  date_debut: string
  date_fin: string
  statut: string
  places_max: number
  places_occupees: number
  ca_prevu: number
  ca_realise: number
  [key: string]: unknown
}

// --- Inscription repository ---

export interface InscriptionRepository {
  findById(id: string): Promise<Result<InscriptionAggregate>>
  findByLeadAndSession(leadId: string, sessionId: string): Promise<Result<InscriptionAggregate | null>>
  create(data: CreateInscriptionDTO): Promise<Result<InscriptionAggregate>>
  update(id: string, data: UpdateInscriptionDTO): Promise<Result<InscriptionAggregate>>
  updatePaymentStatus(id: string, status: string, stripeId?: string): Promise<Result<void>>
}

export interface CreateInscriptionDTO {
  lead_id: string
  session_id: string
  montant_total: number
  montant_finance?: number
  reste_a_charge?: number
  mode_paiement?: string
}

export interface UpdateInscriptionDTO {
  statut?: string
  paiement_statut?: string
  stripe_payment_id?: string
  stripe_invoice_id?: string
  taux_presence?: number
  note_satisfaction?: number
  certificat_genere?: boolean
  certificat_url?: string
  [key: string]: unknown
}

export interface InscriptionAggregate {
  id: string
  lead_id: string
  session_id: string
  montant_total: number
  paiement_statut: string
  statut: string
  [key: string]: unknown
}

// --- Financement repository ---

export interface FinancementRepository {
  findById(id: string): Promise<Result<FinancementAggregate>>
  findByLead(leadId: string): Promise<Result<FinancementAggregate[]>>
  create(data: CreateFinancementDTO): Promise<Result<FinancementAggregate>>
  update(id: string, data: UpdateFinancementDTO): Promise<Result<FinancementAggregate>>
  updateStatus(id: string, status: string): Promise<Result<void>>
}

export interface CreateFinancementDTO {
  lead_id: string
  inscription_id?: string
  organisme: string
  montant_demande?: number
}

export interface UpdateFinancementDTO {
  statut?: string
  montant_accorde?: number
  montant_verse?: number
  numero_dossier?: string
  date_soumission?: string
  date_reponse?: string
  motif_refus?: string
  [key: string]: unknown
}

export interface FinancementAggregate {
  id: string
  lead_id: string
  organisme: string
  statut: string
  montant_demande: number | null
  montant_accorde: number | null
  montant_verse: number
  [key: string]: unknown
}

// --- Activity / Audit repository ---

export interface ActivityRepository {
  log(data: CreateActivityDTO): Promise<void>
  findByLead(leadId: string, pagination: Pagination): Promise<Result<{ data: ActivityRecord[]; total: number }>>
  findRecent(limit: number): Promise<Result<ActivityRecord[]>>
}

export interface CreateActivityDTO {
  type: string
  description: string
  lead_id?: string
  session_id?: string
  inscription_id?: string
  user_id?: string
  ancien_statut?: string
  nouveau_statut?: string
  metadata?: Record<string, unknown>
}

export interface ActivityRecord {
  id: string
  type: string
  description: string
  lead_id: string | null
  user_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// --- Audit Log (immutable, GDPR-compliant) ---

export interface AuditLogRepository {
  /** Append-only: never update or delete */
  append(entry: AuditEntry): Promise<void>
  /** Query audit trail for an entity */
  findByEntity(table: string, recordId: string): Promise<AuditEntry[]>
  /** GDPR: find all data linked to an email */
  findByDataSubject(email: string): Promise<AuditEntry[]>
}

export interface AuditEntry {
  id?: string
  event_type: string
  table_name: string
  record_id: string
  actor_id: string | null | undefined
  actor_role: string | null | undefined
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null | undefined
  user_agent: string | null | undefined
  timestamp: string
  org_id?: string
}
