// ============================================================
// CQRS Read Model — Optimized queries (SELECT only)
// Write model = repositories (tables, single-record mutations)
// Read model = this file (views, joins, aggregates, dashboards)
//
// Pattern: reads use views/RPCs for denormalized data.
// Writes go through use cases → repositories.
// Never mutate data in a read model.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { type Result, Ok, Err, Errors } from '../../domain/shared/result'
import type { Pagination } from '../../domain/shared/value-objects'

// --- DTOs (read-only, denormalized, optimized for UI) ---

export interface LeadListItem {
  id: string
  prenom: string
  nom: string | null
  email: string | null
  telephone: string | null
  statut: string
  priorite: string
  source: string
  score_chaud: number
  nb_contacts: number
  formation_nom: string | null
  commercial_prenom: string | null
  commercial_nom: string | null
  commercial_avatar_color: string | null
  date_dernier_contact: string | null
  tags: string[]
  created_at: string
}

export interface LeadDetailView {
  // Core lead data
  id: string
  prenom: string
  nom: string | null
  email: string | null
  telephone: string | null
  statut: string
  priorite: string
  source: string
  score_chaud: number
  nb_contacts: number
  // Denormalized relations
  formation_principale: { id: string; nom: string; prix_ht: number; slug: string } | null
  commercial_assigne: { id: string; prenom: string; nom: string; avatar_color: string } | null
  // Counts (aggregated)
  inscriptions_count: number
  financements_count: number
  rappels_en_attente: number
  // Recent activity (last 5)
  recent_activities: { type: string; description: string; created_at: string }[]
  // All data
  [key: string]: unknown
}

export interface PipelineView {
  statut: string
  count: number
  ca_potentiel: number
  leads: {
    id: string
    prenom: string
    nom: string | null
    score_chaud: number
    formation_nom: string | null
    date_dernier_contact: string | null
  }[]
}

export interface DashboardMetrics {
  leads_nouveaux_30j: number
  leads_qualifies_30j: number
  taux_conversion: number
  ca_mois: number
  ca_previsionnel: number
  inscriptions_confirmees: number
  satisfaction_moyenne: number
  rappels_en_retard: number
  rappels_aujourdhui: number
  sessions_a_venir: number
  dossiers_financement_en_cours: number
  top_formations: { nom: string; count: number; ca: number }[]
  top_sources: { source: string; count: number; conversion: number }[]
  pipeline_velocity: { statut: string; avg_days: number }[]
}

// --- Read model class ---

export class LeadReadModel {
  constructor(private readonly db: SupabaseClient) {}

  /** Optimized list query with joins (for table/kanban views) */
  async listForUI(
    filters: {
      statut?: string
      source?: string
      commercial_id?: string
      search?: string
    },
    pagination: Pagination
  ): Promise<Result<{ data: LeadListItem[]; total: number }>> {
    let query = this.db
      .from('leads')
      .select(`
        id, prenom, nom, email, telephone, statut, priorite, source,
        score_chaud, nb_contacts, date_dernier_contact, tags, created_at,
        formation_principale:formations!formation_principale_id(nom),
        commercial_assigne:equipe!commercial_assigne_id(prenom, nom, avatar_color)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(...pagination.range)

    if (filters.statut) query = query.eq('statut', filters.statut)
    if (filters.source) query = query.eq('source', filters.source)
    if (filters.commercial_id) query = query.eq('commercial_assigne_id', filters.commercial_id)
    if (filters.search) query = query.textSearch('fts', filters.search)

    const { data, count, error } = await query

    if (error) return Err(Errors.supabase(error.message), 500)

    // Flatten joins for the UI
    const items: LeadListItem[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      prenom: row.prenom as string,
      nom: row.nom as string | null,
      email: row.email as string | null,
      telephone: row.telephone as string | null,
      statut: row.statut as string,
      priorite: row.priorite as string,
      source: row.source as string,
      score_chaud: row.score_chaud as number,
      nb_contacts: row.nb_contacts as number,
      date_dernier_contact: row.date_dernier_contact as string | null,
      tags: (row.tags as string[]) || [],
      created_at: row.created_at as string,
      formation_nom: (row.formation_principale as { nom: string } | null)?.nom ?? null,
      commercial_prenom: (row.commercial_assigne as { prenom: string } | null)?.prenom ?? null,
      commercial_nom: (row.commercial_assigne as { nom: string } | null)?.nom ?? null,
      commercial_avatar_color: (row.commercial_assigne as { avatar_color: string } | null)?.avatar_color ?? null,
    }))

    return Ok({ data: items, total: count ?? 0 })
  }

  /** Full detail view with aggregated counts */
  async getDetail(id: string): Promise<Result<LeadDetailView>> {
    const { data, error } = await this.db
      .from('leads')
      .select(`
        *,
        formation_principale:formations!formation_principale_id(id, nom, prix_ht, slug),
        commercial_assigne:equipe!commercial_assigne_id(id, prenom, nom, avatar_color)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return Err(Errors.notFound('Lead', id), 404)

    // Parallel count queries
    const [inscriptions, financements, rappels, activities] = await Promise.all([
      this.db.from('inscriptions').select('id', { count: 'exact', head: true }).eq('lead_id', id),
      this.db.from('financements').select('id', { count: 'exact', head: true }).eq('lead_id', id),
      this.db.from('rappels').select('id', { count: 'exact', head: true }).eq('lead_id', id).eq('statut', 'EN_ATTENTE'),
      this.db.from('activites').select('type, description, created_at').eq('lead_id', id).order('created_at', { ascending: false }).limit(5),
    ])

    return Ok({
      ...data,
      inscriptions_count: inscriptions.count ?? 0,
      financements_count: financements.count ?? 0,
      rappels_en_attente: rappels.count ?? 0,
      recent_activities: activities.data ?? [],
    } as LeadDetailView)
  }

  /** Pipeline view (Kanban) — grouped by status */
  async getPipeline(): Promise<Result<PipelineView[]>> {
    const { data, error } = await this.db
      .from('leads')
      .select(`
        id, prenom, nom, statut, score_chaud, date_dernier_contact,
        formation_principale:formations!formation_principale_id(nom, prix_ht)
      `)
      .not('statut', 'in', '("SPAM")')
      .order('score_chaud', { ascending: false })

    if (error) return Err(Errors.supabase(error.message), 500)

    // Group by statut
    const grouped: Record<string, PipelineView> = {}
    for (const row of data ?? []) {
      const statut = row.statut as string
      if (!grouped[statut]) {
        grouped[statut] = { statut, count: 0, ca_potentiel: 0, leads: [] }
      }
      grouped[statut].count++
      const fp = Array.isArray(row.formation_principale) ? row.formation_principale[0] : row.formation_principale
      grouped[statut].ca_potentiel += (fp as { prix_ht: number } | null)?.prix_ht ?? 0
      grouped[statut].leads.push({
        id: row.id,
        prenom: row.prenom,
        nom: row.nom,
        score_chaud: row.score_chaud,
        formation_nom: (fp as { nom: string } | null)?.nom ?? null,
        date_dernier_contact: row.date_dernier_contact,
      })
    }

    return Ok(Object.values(grouped))
  }

  /** Dashboard metrics (for analytics page) */
  async getDashboardMetrics(): Promise<Result<DashboardMetrics>> {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString()
    const today = now.toISOString().split('T')[0]
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    const [
      newLeads,
      qualifiedLeads,
      inscriptions,
      sessions,
      rappelsOverdue,
      rappelsToday,
      financements,
    ] = await Promise.all([
      this.db.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      this.db.from('leads').select('id', { count: 'exact', head: true }).eq('statut', 'QUALIFIE').gte('created_at', thirtyDaysAgo),
      this.db.from('inscriptions').select('montant_total, note_satisfaction', { count: 'exact' }).eq('statut', 'CONFIRMEE'),
      this.db.from('sessions').select('id', { count: 'exact', head: true }).in('statut', ['PLANIFIEE', 'CONFIRMEE']).gte('date_debut', today),
      this.db.from('rappels').select('id', { count: 'exact', head: true }).eq('statut', 'EN_ATTENTE').lt('date_rappel', today),
      this.db.from('rappels').select('id', { count: 'exact', head: true }).eq('statut', 'EN_ATTENTE').gte('date_rappel', today).lte('date_rappel', `${today}T23:59:59`),
      this.db.from('financements').select('id', { count: 'exact', head: true }).in('statut', ['SOUMIS', 'EN_EXAMEN']),
    ])

    const inscData = inscriptions.data ?? []
    const caMois = inscData.reduce((sum: number, i: { montant_total: number }) => sum + (i.montant_total || 0), 0)
    const satisfactionScores = inscData
      .map((i: { note_satisfaction: number | null }) => i.note_satisfaction)
      .filter((n: number | null): n is number => n !== null && n > 0)
    const avgSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((a: number, b: number) => a + b, 0) / satisfactionScores.length
      : 0

    const totalNew = newLeads.count ?? 0
    const totalQualified = qualifiedLeads.count ?? 0
    const tauxConversion = totalNew > 0 ? Math.round((totalQualified / totalNew) * 100) : 0

    return Ok({
      leads_nouveaux_30j: totalNew,
      leads_qualifies_30j: totalQualified,
      taux_conversion: tauxConversion,
      ca_mois: caMois,
      ca_previsionnel: caMois * 1.2,
      inscriptions_confirmees: inscriptions.count ?? 0,
      satisfaction_moyenne: Math.round(avgSatisfaction * 10) / 10,
      rappels_en_retard: rappelsOverdue.count ?? 0,
      rappels_aujourdhui: rappelsToday.count ?? 0,
      sessions_a_venir: sessions.count ?? 0,
      dossiers_financement_en_cours: financements.count ?? 0,
      top_formations: [], // Would use a view/RPC for complex aggregation
      top_sources: [],
      pipeline_velocity: [],
    })
  }
}
