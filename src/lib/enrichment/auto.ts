import 'server-only'
// ============================================================
// CRM DERMOTEC — Auto Enrichment Helper
// Utilities pour déclencher l'enrichissement automatique
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }
  return _supabase
}

function getInngest() {
  // Lazy import pour éviter le crash SSG
  return import('../infra/inngest').then(m => m.inngest)
}

interface EnrichmentTriggerData {
  lead_id: string
  siret?: string
  nom?: string
  ville?: string
  email?: string
}

/**
 * Déclenche l'enrichissement automatique d'un lead
 */
export async function triggerLeadEnrichment(data: EnrichmentTriggerData) {
  try {
    // Vérifier si le lead existe et récupérer ses données
    const supabase = getSupabase()
    const { data: lead, error } = await supabase
      .from('leads')
      .select('id, entreprise_nom, siret, email, adresse, metadata')
      .eq('id', data.lead_id)
      .single()

    if (error || !lead) {
      throw new Error(`Lead not found: ${data.lead_id}`)
    }

    // Enrichir les données avec ce qu'on a déjà
    const enrichmentData: EnrichmentTriggerData = {
      lead_id: data.lead_id,
      siret: data.siret || lead.siret,
      nom: data.nom || lead.entreprise_nom,
      email: data.email || lead.email,
      ville: data.ville || (lead.adresse as any)?.ville
    }

    // Vérifier s'il y a assez de données pour l'enrichissement
    if (!enrichmentData.siret && !enrichmentData.nom) {
      // Skipped - not enough data
      return { skipped: true, reason: 'Not enough data (need SIRET or company name)' }
    }

    // Vérifier si un enrichissement récent existe déjà
    const { data: recentEnrichment } = await getSupabase()
      .from('auto_enrichment_log')
      .select('created_at')
      .eq('lead_id', data.lead_id)
      .eq('status', 'SUCCESS')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1)

    if (recentEnrichment && recentEnrichment.length > 0) {
      // Skipped - recent enrichment exists
      return { skipped: true, reason: 'Recent enrichment already exists (< 7 days)' }
    }

    // Déclencher l'enrichissement via Inngest
    const inngest = await getInngest()
    const result = await inngest.send({
      name: 'lead.enrich',
      data: enrichmentData
    })

    // Triggered enrichment

    return { triggered: true, eventId: result?.ids?.[0] }
  } catch (error) {
    console.error('[AutoEnrichment] Error:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Auto-enrichissement à la création d'un lead
 */
export async function autoEnrichOnLeadCreation(leadId: string) {
  return triggerLeadEnrichment({ lead_id: leadId })
}

/**
 * Enrichissement manuel avec données spécifiques
 */
export async function manualEnrichment(
  leadId: string,
  data: Omit<EnrichmentTriggerData, 'lead_id'>
) {
  return triggerLeadEnrichment({
    lead_id: leadId,
    ...data
  })
}

/**
 * Vérifier le statut d'enrichissement d'un lead
 */
export async function getEnrichmentStatus(leadId: string) {
  const { data, error } = await getSupabase()
    .from('v_enrichment_summary')
    .select('*')
    .eq('lead_id', leadId)
    .single()

  if (error) {
    return { error: error.message }
  }

  return {
    lead_id: leadId,
    total_enrichments: data.total_enrichments || 0,
    successful_enrichments: data.successful_enrichments || 0,
    failed_enrichments: data.failed_enrichments || 0,
    total_credits_used: data.total_credits_used || 0,
    enriched_providers: data.enriched_providers || [],
    last_enrichment_at: data.last_enrichment_at,
    has_pappers_data: data.has_pappers_data || false,
    has_google_data: data.has_google_data || false,
    has_social_data: data.has_social_data || false,
    has_instagram_data: data.has_instagram_data || false
  }
}

/**
 * Configuration pour l'auto-enrichissement
 */
export const ENRICHMENT_CONFIG = {
  // Providers prioritaires
  PROVIDERS: {
    PAPPERS: {
      enabled: !!process.env.PAPPERS_API_KEY,
      credits_per_call: 1,
      required_data: ['siret']
    },
    GOOGLE_PLACES: {
      enabled: !!process.env.GOOGLE_PLACES_API_KEY,
      credits_per_call: 1,
      required_data: ['nom', 'ville']
    },
    BRIGHTDATA: {
      enabled: !!process.env.BRIGHTDATA_API_KEY,
      credits_per_call: 1,
      required_data: ['instagram_url']
    }
  },

  // Limite de coût par lead
  MAX_CREDITS_PER_LEAD: 10,

  // Cooldown entre enrichissements (7 jours)
  COOLDOWN_DAYS: 7,

  // Auto-enrichissement activé
  AUTO_ENRICH_ON_CREATION: true
} as const

/**
 * Vérifier si l'auto-enrichissement est possible
 */
export function canAutoEnrich(leadData: {
  siret?: string
  entreprise_nom?: string
  adresse?: any
}) {
  const hasMinimumData = !!(leadData.siret || leadData.entreprise_nom)
  const hasActiveProviders = Object.values(ENRICHMENT_CONFIG.PROVIDERS).some(p => p.enabled)

  return {
    possible: hasMinimumData && hasActiveProviders,
    reasons: [
      !hasMinimumData && 'Missing minimum data (SIRET or company name)',
      !hasActiveProviders && 'No enrichment providers configured'
    ].filter(Boolean)
  }
}