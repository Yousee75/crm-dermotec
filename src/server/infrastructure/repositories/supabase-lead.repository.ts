// ============================================================
// Supabase Lead Repository — Infrastructure implementation
// Implements LeadRepository interface from domain layer.
// Domain never imports Supabase. Only this file does.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  LeadRepository,
  LeadFilters,
  CreateLeadDTO,
  UpdateLeadDTO,
  LeadAggregate,
} from '../../domain/shared/repository'
import { type Result, Ok, Err, Errors, trySafe } from '../../domain/shared/result'
import type { Pagination } from '../../domain/shared/value-objects'

export class SupabaseLeadRepository implements LeadRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string): Promise<Result<LeadAggregate>> {
    const { data, error } = await this.db
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return Err(Errors.notFound('Lead', id), 404)
    }

    return Ok(data as LeadAggregate)
  }

  async findByEmail(email: string): Promise<Result<LeadAggregate | null>> {
    const { data, error } = await this.db
      .from('leads')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (error) {
      return Err(Errors.supabase(error.message, error), 500)
    }

    return Ok(data as LeadAggregate | null)
  }

  async findMany(
    filters: LeadFilters,
    pagination: Pagination
  ): Promise<Result<{ data: LeadAggregate[]; total: number }>> {
    let query = this.db
      .from('leads')
      .select('*, formation_principale:formations!formation_principale_id(id, nom, slug, prix_ht), commercial_assigne:equipe!commercial_assigne_id(id, prenom, nom, avatar_color)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(...pagination.range)

    // Apply filters
    if (filters.statut) query = query.eq('statut', filters.statut)
    if (filters.source) query = query.eq('source', filters.source)
    if (filters.commercial_id) query = query.eq('commercial_assigne_id', filters.commercial_id)
    if (filters.formation_id) query = query.eq('formation_principale_id', filters.formation_id)
    if (filters.priorite) query = query.eq('priorite', filters.priorite)
    if (filters.created_after) query = query.gte('created_at', filters.created_after)
    if (filters.created_before) query = query.lte('created_at', filters.created_before)
    if (filters.score_min) query = query.gte('score_chaud', filters.score_min)
    if (filters.score_max) query = query.lte('score_chaud', filters.score_max)
    if (filters.tags?.length) query = query.overlaps('tags', filters.tags)
    if (filters.search) query = query.textSearch('fts', filters.search)

    const { data, count, error } = await query

    if (error) {
      return Err(Errors.supabase(error.message, error), 500)
    }

    return Ok({ data: (data ?? []) as LeadAggregate[], total: count ?? 0 })
  }

  async create(dto: CreateLeadDTO): Promise<Result<LeadAggregate>> {
    const { data, error } = await this.db
      .from('leads')
      .insert({
        prenom: dto.prenom,
        nom: dto.nom || '',
        email: dto.email?.toLowerCase().trim() || null,
        telephone: dto.telephone || null,
        source: dto.source,
        sujet: dto.sujet || null,
        message: dto.message || null,
        statut: dto.statut || 'NOUVEAU',
        priorite: dto.priorite || 'NORMALE',
        score_chaud: dto.score_chaud ?? 20,
        formation_principale_id: dto.formation_principale_id || null,
        utm_source: dto.utm_source || null,
        utm_medium: dto.utm_medium || null,
        utm_campaign: dto.utm_campaign || null,
        referrer_url: dto.referrer_url || null,
        ip_address: dto.ip_address || null,
        user_agent: dto.user_agent || null,
        metadata: dto.metadata || {},
      })
      .select('*')
      .single()

    if (error) {
      // Check for unique constraint violation (duplicate email)
      if (error.code === '23505') {
        return Err(Errors.duplicate('Lead', 'email', dto.email || ''), 409)
      }
      return Err(Errors.supabase(error.message, error), 500)
    }

    return Ok(data as LeadAggregate)
  }

  async update(id: string, dto: UpdateLeadDTO): Promise<Result<LeadAggregate>> {
    const { data, error } = await this.db
      .from('leads')
      .update({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return Err(Errors.notFound('Lead', id), 404)
      }
      return Err(Errors.supabase(error.message, error), 500)
    }

    return Ok(data as LeadAggregate)
  }

  async updateStatus(id: string, status: string): Promise<Result<void>> {
    const { error } = await this.db
      .from('leads')
      .update({ statut: status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return Err(Errors.supabase(error.message, error), 500)
    }

    return Ok(undefined)
  }

  async incrementContacts(id: string): Promise<Result<void>> {
    // Use RPC to avoid race conditions
    const result = await trySafe(async () => {
      const { data: lead } = await this.db
        .from('leads')
        .select('nb_contacts')
        .eq('id', id)
        .single()

      if (lead) {
        await this.db
          .from('leads')
          .update({
            nb_contacts: (lead.nb_contacts || 0) + 1,
            date_dernier_contact: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      }
    })

    if (!result.ok) return Err(Errors.supabase('Failed to increment contacts'), 500)
    return Ok(undefined)
  }

  async search(
    query: string,
    pagination: Pagination
  ): Promise<Result<{ data: LeadAggregate[]; total: number }>> {
    return this.findMany({ search: query }, pagination)
  }

  async countByStatus(): Promise<Result<Record<string, number>>> {
    const { data, error } = await this.db
      .from('leads')
      .select('statut')

    if (error) {
      return Err(Errors.supabase(error.message, error), 500)
    }

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      counts[row.statut] = (counts[row.statut] || 0) + 1
    }

    return Ok(counts)
  }
}
