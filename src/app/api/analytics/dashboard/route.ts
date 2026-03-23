import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

// GET /api/analytics/dashboard — Toutes les métriques en un appel
export async function GET(request: NextRequest) {
  // Auth obligatoire — données sensibles
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  const supabase = await createServiceSupabase()

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
      forecastRes,
      winPatternsRes,
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

      // 8. Pipeline forecast (NOUVEAU — inspiré Gong Forecast)
      supabase.from('v_pipeline_forecast').select('*'),

      // 9. Win patterns (NOUVEAU — coaching IA)
      supabase.from('v_win_patterns').select('*'),
    ])

    // Métriques calculées
    const stats: any = statsRes.data || {}
    const funnel: any = funnelRes.data || {}

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

      // Pipeline forecast (CA pondéré par probabilité)
      pipeline_forecast: (() => {
        const stages = forecastRes.data || []
        const active = stages.filter((s: any) => !['FORME', 'ALUMNI', 'PERDU', 'SPAM'].includes(s.statut))
        const caBrut = active.reduce((sum: number, s: any) => sum + (s.ca_brut || 0), 0)
        const caPondere = active.reduce((sum: number, s: any) => sum + (s.ca_pondere || 0), 0)
        const ca30j = stages
          .filter((s: any) => ['INSCRIT', 'EN_FORMATION', 'FINANCEMENT_EN_COURS'].includes(s.statut))
          .reduce((sum: number, s: any) => sum + (s.ca_pondere || 0), 0)
        return {
          ca_brut_total: Math.round(caBrut),
          ca_pondere_total: Math.round(caPondere),
          forecast_30j: Math.round(ca30j),
          par_etape: active,
        }
      })(),

      // Win patterns (patterns gagnants pour coaching)
      win_patterns: winPatternsRes.data || [],
    })
  } catch (err) {
    console.error('[Analytics]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
