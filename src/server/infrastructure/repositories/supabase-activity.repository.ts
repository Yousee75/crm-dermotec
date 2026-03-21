// ============================================================
// Supabase Activity Repository — Audit trail implementation
// Append-only for compliance. Non-blocking writes.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ActivityRepository,
  CreateActivityDTO,
  ActivityRecord,
  AuditLogRepository,
  AuditEntry,
} from '../../domain/shared/repository'
import { type Result, Ok, Err, Errors } from '../../domain/shared/result'
import type { Pagination } from '../../domain/shared/value-objects'

export class SupabaseActivityRepository implements ActivityRepository {
  constructor(private readonly db: SupabaseClient) {}

  /** Non-blocking: never throws, logs errors to console */
  async log(data: CreateActivityDTO): Promise<void> {
    try {
      const { error } = await this.db.from('activites').insert({
        type: data.type,
        description: data.description,
        lead_id: data.lead_id || null,
        session_id: data.session_id || null,
        inscription_id: data.inscription_id || null,
        user_id: data.user_id || null,
        ancien_statut: data.ancien_statut || null,
        nouveau_statut: data.nouveau_statut || null,
        metadata: data.metadata || {},
      })

      if (error) {
        console.error('[ActivityRepo] Insert failed:', error.message)
      }
    } catch (err) {
      console.error('[ActivityRepo] Error:', err)
    }
  }

  async findByLead(
    leadId: string,
    pagination: Pagination
  ): Promise<Result<{ data: ActivityRecord[]; total: number }>> {
    const { data, count, error } = await this.db
      .from('activites')
      .select('*', { count: 'exact' })
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .range(...pagination.range)

    if (error) return Err(Errors.supabase(error.message), 500)
    return Ok({ data: (data ?? []) as ActivityRecord[], total: count ?? 0 })
  }

  async findRecent(limit: number): Promise<Result<ActivityRecord[]>> {
    const { data, error } = await this.db
      .from('activites')
      .select('*, user:equipe(prenom, nom)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return Err(Errors.supabase(error.message), 500)
    return Ok((data ?? []) as ActivityRecord[])
  }
}

// ============================================================
// Immutable Audit Log — GDPR-compliant field-level tracking
// Uses field_history table (append-only, no UPDATE or DELETE)
// ============================================================

export class SupabaseAuditLogRepository implements AuditLogRepository {
  constructor(private readonly db: SupabaseClient) {}

  async append(entry: AuditEntry): Promise<void> {
    try {
      await this.db.from('field_history').insert({
        event_type: entry.event_type,
        table_name: entry.table_name,
        record_id: entry.record_id,
        actor_id: entry.actor_id,
        actor_role: entry.actor_role,
        old_values: entry.old_values,
        new_values: entry.new_values,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        created_at: entry.timestamp || new Date().toISOString(),
      })
    } catch (err) {
      console.error('[AuditLog] Append failed:', err)
    }
  }

  async findByEntity(table: string, recordId: string): Promise<AuditEntry[]> {
    const { data } = await this.db
      .from('field_history')
      .select('*')
      .eq('table_name', table)
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })

    return (data ?? []) as AuditEntry[]
  }

  async findByDataSubject(email: string): Promise<AuditEntry[]> {
    // GDPR: find all audit entries related to a person (by email)
    // First find the lead(s) with this email
    const { data: leads } = await this.db
      .from('leads')
      .select('id')
      .eq('email', email)

    if (!leads?.length) return []

    const leadIds = leads.map((l: { id: string }) => l.id)

    const { data } = await this.db
      .from('field_history')
      .select('*')
      .eq('table_name', 'leads')
      .in('record_id', leadIds)
      .order('created_at', { ascending: true })

    return (data ?? []) as AuditEntry[]
  }
}
