// ============================================================
// CRM DERMOTEC — Lead Repository (Domain Layer)
// Abstract Supabase behind a clean interface for testability
// ============================================================

import type { Lead } from '@/types'
import { Ok, Err, type Result, type AppError, NotFoundError, DuplicateError, InternalError, tryCatch } from '@/lib/result'

// --- Repository Interface (Port) ---

export interface LeadFilters {
  statut?: string
  source?: string
  search?: string
  commercial_assigne_id?: string
  formation_principale_id?: string
  priorite?: string
  score_min?: number
  score_max?: number
  date_from?: string
  date_to?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ILeadRepository {
  findById(id: string): Promise<Result<Lead, AppError>>
  findByEmail(email: string): Promise<Result<Lead | null, AppError>>
  findMany(filters: LeadFilters, page: number, limit: number): Promise<Result<PaginatedResult<Lead>, AppError>>
  create(data: CreateLeadInput): Promise<Result<Lead, AppError>>
  update(id: string, data: Partial<Lead>): Promise<Result<Lead, AppError>>
  updateStatus(id: string, newStatus: string, userId?: string): Promise<Result<Lead, AppError>>
  delete(id: string): Promise<Result<void, AppError>>
  count(filters?: LeadFilters): Promise<Result<number, AppError>>
}

export interface CreateLeadInput {
  prenom: string
  nom: string
  email?: string
  telephone?: string
  source: string
  sujet?: string
  message?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer_url?: string
  ip_address?: string
  user_agent?: string
}

// --- Supabase Implementation (Adapter) ---

export class SupabaseLeadRepository implements ILeadRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private supabase: any) {}

  async findById(id: string): Promise<Result<Lead, AppError>> {
    return tryCatch(async () => {
      const { data, error } = await this.supabase
        .from('leads')
        .select('*, formation_principale:formations!formation_principale_id(id, nom, slug)')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') throw new NotFoundError(`Lead ${id} non trouvé`)
        throw new InternalError(error.message)
      }

      return data as Lead
    })
  }

  async findByEmail(email: string): Promise<Result<Lead | null>> {
    return tryCatch(async () => {
      const { data, error } = await this.supabase
        .from('leads')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle()

      if (error) throw new InternalError(error.message)
      return data as Lead | null
    })
  }

  async findMany(filters: LeadFilters, page: number = 1, limit: number = 20): Promise<Result<PaginatedResult<Lead>>> {
    return tryCatch(async () => {
      const offset = (page - 1) * limit

      let query = this.supabase
        .from('leads')
        .select('*, formation_principale:formations!formation_principale_id(id, nom, slug), commercial:equipe!commercial_assigne_id(id, prenom, nom)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Appliquer les filtres dynamiquement
      if (filters.statut) query = query.eq('statut', filters.statut)
      if (filters.source) query = query.eq('source', filters.source)
      if (filters.commercial_assigne_id) query = query.eq('commercial_assigne_id', filters.commercial_assigne_id)
      if (filters.formation_principale_id) query = query.eq('formation_principale_id', filters.formation_principale_id)
      if (filters.priorite) query = query.eq('priorite', filters.priorite)
      if (filters.score_min) query = query.gte('score_chaud', filters.score_min)
      if (filters.score_max) query = query.lte('score_chaud', filters.score_max)
      if (filters.date_from) query = query.gte('created_at', filters.date_from)
      if (filters.date_to) query = query.lte('created_at', filters.date_to)
      if (filters.search) query = query.textSearch('fts', filters.search)

      const { data, count, error } = await query

      if (error) throw new InternalError(error.message)

      return {
        data: (data || []) as Lead[],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > offset + limit,
      }
    })
  }

  async create(input: CreateLeadInput): Promise<Result<Lead, AppError>> {
    // Vérifier doublon email
    if (input.email) {
      const existing = await this.findByEmail(input.email)
      if (existing.ok && existing.value) {
        return Err(new DuplicateError('Lead', 'email', input.email))
      }
    }

    return tryCatch(async () => {
      const { data, error } = await this.supabase
        .from('leads')
        .insert({
          ...input,
          email: input.email?.toLowerCase().trim(),
          statut: 'NOUVEAU',
          priorite: 'NORMALE',
          score_chaud: 20,
        })
        .select()
        .single()

      if (error) throw new InternalError(error.message)
      return data as Lead
    })
  }

  async update(id: string, data: Partial<Lead>): Promise<Result<Lead, AppError>> {
    return tryCatch(async () => {
      const { data: updated, error } = await this.supabase
        .from('leads')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') throw new NotFoundError(`Lead ${id} non trouvé`)
        throw new InternalError(error.message)
      }

      return updated as Lead
    })
  }

  async updateStatus(id: string, newStatus: string, userId?: string): Promise<Result<Lead>> {
    // Récupérer le lead actuel pour valider la transition
    const current = await this.findById(id)
    if (!current.ok) return current

    // Valider la transition via state machine
    const { validateLeadTransition } = await import('@/lib/validators')
    const transitionError = validateLeadTransition(
      current.value.statut as never,
      newStatus as never
    )
    if (transitionError) {
      const { InvalidTransitionError } = await import('@/lib/result')
      return Err(new InvalidTransitionError('Lead', current.value.statut, newStatus))
    }

    // Mettre à jour
    const result = await this.update(id, { statut: newStatus } as Partial<Lead>)
    if (!result.ok) return result

    // Logger le changement de statut (non-bloquant)
    import('@/lib/activity-logger').then(({ logStatutChange }) => {
      logStatutChange(id, current.value.statut, newStatus, userId)
    })

    return result
  }

  async delete(id: string): Promise<Result<void, AppError>> {
    return tryCatch(async () => {
      const { error } = await this.supabase
        .from('leads')
        .update({ statut: 'SPAM' }) // Soft delete RGPD
        .eq('id', id)

      if (error) throw new NotFoundError(`Lead ${id} non trouvé`)
    })
  }

  async count(filters?: LeadFilters): Promise<Result<number>> {
    return tryCatch(async () => {
      let query = this.supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })

      if (filters?.statut) query = query.eq('statut', filters.statut)
      if (filters?.source) query = query.eq('source', filters.source)

      const { count, error } = await query
      if (error) throw new InternalError(error.message)
      return count || 0
    })
  }
}
