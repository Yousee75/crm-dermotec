// @ts-nocheck
// ============================================================
// CRM DERMOTEC — Credit Guard (anti-abus)
// Vérifie et consomme les crédits AVANT chaque appel API
// Atomique, inviolable, avec détection d'abus
// ============================================================

interface CreditCheckResult {
  allowed: boolean
  reason?: string
  remaining?: number
  credits_consumed?: number
  plan?: string
  retry_after?: string
  provider?: string
}

/**
 * Vérifie les crédits ET les limites d'abus AVANT un appel enrichissement.
 * Utilise une fonction SQL SECURITY DEFINER avec FOR UPDATE (lock atomique).
 *
 * IMPOSSIBLE à contourner :
 * - Le lock SQL empêche les race conditions (2 appels simultanés)
 * - Les limites sont vérifiées côté DB (pas côté client)
 * - Chaque dépassement est loggé dans credit_abuse_log
 * - Les résultats cachés ne consomment pas de crédits
 */
export async function checkAndConsumeCredits(params: {
  user_id: string
  org_id?: string
  lead_id?: string
  provider: string
  credits: number
  ip?: string
}): Promise<CreditCheckResult> {
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase()

    // Appel atomique à la fonction SQL
    const { data, error } = await supabase.rpc('safe_consume_credits', {
      p_user_id: params.user_id,
      p_org_id: params.org_id || null,
      p_lead_id: params.lead_id || null,
      p_provider: params.provider,
      p_credits: params.credits,
      p_ip: params.ip || null,
    })

    if (error) {
      console.error('[CreditGuard] RPC error:', error.message)
      // En cas d'erreur DB, BLOQUER par défaut (fail-closed)
      return { allowed: false, reason: 'system_error' }
    }

    return data as CreditCheckResult

  } catch (err) {
    console.error('[CreditGuard] Error:', err)
    // Fail-closed : si le système de crédits plante, on bloque
    return { allowed: false, reason: 'system_error' }
  }
}

/**
 * Récupère le solde de crédits et l'usage actuel.
 */
export async function getCreditStatus(org_id?: string): Promise<{
  remaining: number
  total: number
  used: number
  plan: string
  limits: {
    max_per_hour: number
    max_per_day: number
    max_per_lead: number
  }
  usage_today: number
  usage_this_hour: number
  abuse_alerts: number
}> {
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase()

    const [creditsRes, limitsRes, todayRes, hourRes, abuseRes] = await Promise.all([
      supabase.from('credits').select('*').eq('org_id', org_id).single(),
      supabase.from('credit_limits').select('*').eq('plan',
        (await supabase.from('credits').select('plan').eq('org_id', org_id).single()).data?.plan || 'starter'
      ).single(),
      supabase.from('enrichment_log').select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .neq('status', 'cached'),
      supabase.from('enrichment_log').select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())
        .neq('status', 'cached'),
      supabase.from('credit_abuse_log').select('id', { count: 'exact', head: true })
        .eq('resolved', false),
    ])

    const credits = creditsRes.data
    const limits = limitsRes.data

    return {
      remaining: credits ? (credits.credits_total - credits.credits_used + credits.credits_bonus) : 0,
      total: credits?.credits_total || 100,
      used: credits?.credits_used || 0,
      plan: credits?.plan || 'starter',
      limits: {
        max_per_hour: limits?.max_per_hour || 20,
        max_per_day: limits?.max_per_day || 100,
        max_per_lead: limits?.max_per_lead || 3,
      },
      usage_today: todayRes.count || 0,
      usage_this_hour: hourRes.count || 0,
      abuse_alerts: abuseRes.count || 0,
    }
  } catch {
    return {
      remaining: 0, total: 0, used: 0, plan: 'starter',
      limits: { max_per_hour: 0, max_per_day: 0, max_per_lead: 0 },
      usage_today: 0, usage_this_hour: 0, abuse_alerts: 0,
    }
  }
}
