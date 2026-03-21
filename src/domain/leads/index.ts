// ============================================================
// Domain: Leads — Public API
// ============================================================

export { SupabaseLeadRepository } from './repository'
export type { ILeadRepository, LeadFilters, PaginatedResult, CreateLeadInput } from './repository'
export { createLead, changeLeadStatus, listLeads, scoreAndUpdateLead } from './use-cases'
export type { CreateLeadResult, StatusChangeResult } from './use-cases'
