import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// GET /api/analytics/dashboard — Toutes les métriques en un appel
export async function GET(request: NextRequest) {
  // Auth obligatoire — données sensibles
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'DB non configurée' }, { status: 503 })
  }

  try {
    // Exécuter toutes les requêtes en parallèle
    const [
      statsRes,
      funnelRes,
      caRes,
      formationsRes,
      sourcesRes,
      rappelsRes,
      financementsRes,
    ] = await Promise.all([
      // 1. Stats globales (vue existante)
      supabase.from('v_dashboard_stats').select('*').single(),

      // 2. Funnel conversion (vue existante)
      supabase.from('v_conversion_funnel').select('*').single(),

      // 3. CA mensuel (vue existante)
      supabase.from('v_ca_mensuel').select('*').limit(12),

      // 4. Performance formations (vue existante)
      supabase.from('v_formation_performance').select('*'),

      // 5. Leads par source (vue existante)
      supabase.from('v_leads_par_source').select('*'),

      // 6. Rappels en retard (vue existante)
      supabase.from('v_rappels_retard').select('*'),

      // 7. Résumé financements (vue existante)
      supabase.from('v_financements_resume').select('*'),
    ])

    // Métriques calculées
    const stats = statsRes.data || {}
    const funnel = funnelRes.data || {}

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),

      // KPIs principaux
      kpis: {
        total_leads: stats.total_leads || 0,
        nouveaux: stats.nouveaux || 0,
        en_pipeline: stats.en_pipeline || 0,
        convertis: stats.convertis || 0,
        sessions_a_venir: stats.sessions_a_venir || 0,
        rappels_overdue: stats.rappels_overdue || 0,
        financements_en_cours: stats.financements_en_cours || 0,
        montant_finance_total: stats.montant_finance_total || 0,
        anomalies_ouvertes: stats.anomalies_ouvertes || 0,
        actions_suggerees: stats.actions_suggerees || 0,
      },

      // Funnel conversion (90 derniers jours)
      funnel: {
        nouveaux: funnel.nouveaux || 0,
        contactes: funnel.contactes || 0,
        qualifies: funnel.qualifies || 0,
        en_financement: funnel.en_financement || 0,
        inscrits: funnel.inscrits || 0,
        en_formation: funnel.en_formation || 0,
        formes: funnel.formes || 0,
        perdus: funnel.perdus || 0,
        total: funnel.total || 0,
        taux_conversion: funnel.taux_conversion || 0,
      },

      // CA mensuel (12 derniers mois)
      ca_mensuel: caRes.data || [],

      // Performance par formation
      formations: formationsRes.data || [],

      // Attribution par source
      sources: sourcesRes.data || [],

      // Rappels en retard par commercial
      rappels_retard: rappelsRes.data || [],

      // Financements par organisme
      financements: financementsRes.data || [],
    })
  } catch (err) {
    console.error('[Analytics]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
