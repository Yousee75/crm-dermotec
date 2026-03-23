import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

// ============================================================
// GET /api/analytics/commerciaux
// Performance détaillée de chaque commercial — Vue manager
// Auth obligatoire (admin/manager uniquement)
// ============================================================

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  const supabase = await createServiceSupabase()

  // Vérifier rôle admin/manager
  const { data: equipeUser } = await supabase
    .from('equipe')
    .select('role')
    .eq('auth_user_id', auth.user.id)
    .single()

  if (!equipeUser || !['admin', 'manager'].includes(equipeUser.role)) {
    return NextResponse.json({ error: 'Accès réservé aux managers' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const periode = searchParams.get('periode') || 'mois' // mois, trimestre, annee
  const commercialId = searchParams.get('commercial_id') // filtre optionnel

  try {
    // Calcul des dates selon la période
    const now = new Date()
    let dateDebut: string
    let dateDebutPrecedent: string

    switch (periode) {
      case 'trimestre':
        dateDebut = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString()
        dateDebutPrecedent = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1).toISOString()
        break
      case 'annee':
        dateDebut = new Date(now.getFullYear(), 0, 1).toISOString()
        dateDebutPrecedent = new Date(now.getFullYear() - 1, 0, 1).toISOString()
        break
      default: // mois
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        dateDebutPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    }

    // 1. Récupérer tous les commerciaux actifs
    let equipeQuery = supabase
      .from('equipe')
      .select('id, prenom, nom, email, role, objectif_mensuel, avatar_color, specialites, is_active')
      .in('role', ['commercial', 'manager', 'admin'])
      .eq('is_active', true)
      .order('prenom')

    if (commercialId) {
      equipeQuery = equipeQuery.eq('id', commercialId)
    }

    const { data: commerciaux } = await equipeQuery

    if (!commerciaux?.length) {
      return NextResponse.json({ commerciaux: [], totaux: {}, classement: [] })
    }

    // 2. Pré-charger les IDs leads par commercial (évite N+1 queries)
    const commercialIds = commerciaux.map(c => c.id)
    const { data: allLeads } = await supabase
      .from('leads')
      .select('id, commercial_assigne_id')
      .in('commercial_assigne_id', commercialIds)

    const leadIdsByCommercial = new Map<string, string[]>()
    for (const lead of allLeads || []) {
      const ids = leadIdsByCommercial.get(lead.commercial_assigne_id) || []
      ids.push(lead.id)
      leadIdsByCommercial.set(lead.commercial_assigne_id, ids)
    }

    // Pour chaque commercial, récupérer ses métriques (queries parallèles, pas de N+1)
    const performances = await Promise.all(
      commerciaux.map(async (commercial) => {
        const commercialLeadIds = leadIdsByCommercial.get(commercial.id) || []

        const [
          leadsRes,
          leadsPeriodeRes,
          conversionsRes,
          caRes,
          caPrecedentRes,
          rappelsRes,
          activitesRes,
          pipelineRes,
        ] = await Promise.all([
          // Total leads assignés (tout temps)
          supabase.from('leads').select('id', { count: 'exact', head: true })
            .eq('commercial_assigne_id', commercial.id),

          // Leads reçus cette période
          supabase.from('leads').select('id', { count: 'exact', head: true })
            .eq('commercial_assigne_id', commercial.id)
            .gte('created_at', dateDebut),

          // Conversions cette période (leads devenus INSCRIT+)
          supabase.from('leads').select('id', { count: 'exact', head: true })
            .eq('commercial_assigne_id', commercial.id)
            .in('statut', ['INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI'])
            .gte('updated_at', dateDebut),

          // CA cette période (utilise les IDs pré-chargés)
          commercialLeadIds.length > 0
            ? supabase.from('inscriptions').select('montant_total')
                .eq('paiement_statut', 'PAYE')
                .gte('updated_at', dateDebut)
                .in('lead_id', commercialLeadIds)
            : Promise.resolve({ data: [], error: null }),

          // CA période précédente (utilise les IDs pré-chargés)
          commercialLeadIds.length > 0
            ? supabase.from('inscriptions').select('montant_total')
                .eq('paiement_statut', 'PAYE')
                .gte('updated_at', dateDebutPrecedent)
                .lt('updated_at', dateDebut)
                .in('lead_id', commercialLeadIds)
            : Promise.resolve({ data: [], error: null }),

          // Rappels en retard
          supabase.from('rappels').select('id', { count: 'exact', head: true })
            .eq('user_id', commercial.id)
            .eq('statut', 'EN_ATTENTE')
            .lt('date_rappel', now.toISOString()),

          // Activités cette période (appels, emails, contacts)
          supabase.from('activites').select('type', { count: 'exact' })
            .eq('user_id', commercial.id)
            .gte('created_at', dateDebut)
            .in('type', ['CONTACT', 'EMAIL', 'NOTE']),

          // Pipeline actif
          supabase.from('leads').select('id, statut, score_chaud', { count: 'exact' })
            .eq('commercial_assigne_id', commercial.id)
            .in('statut', ['NOUVEAU', 'CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS']),
        ])

        const caTotal = caRes.data?.reduce((sum, i) => sum + (i.montant_total || 0), 0) || 0
        const caPrecedent = caPrecedentRes.data?.reduce((sum, i) => sum + (i.montant_total || 0), 0) || 0
        const leadsTotal = leadsRes.count || 0
        const leadsPeriode = leadsPeriodeRes.count || 0
        const conversionsPeriode = conversionsRes.count || 0
        const pipelineCount = pipelineRes.count || 0
        const objectif = commercial.objectif_mensuel || 0

        // Score pipeline moyen
        const pipelineScoreMoyen = pipelineRes.data?.length
          ? Math.round(pipelineRes.data.reduce((sum, l) => sum + (l.score_chaud || 0), 0) / pipelineRes.data.length)
          : 0

        // Taux de conversion
        const tauxConversion = leadsPeriode > 0
          ? Math.round((conversionsPeriode / leadsPeriode) * 100)
          : 0

        // Progression objectif
        const progressionObjectif = objectif > 0
          ? Math.round((caTotal / objectif) * 100)
          : 0

        // Tendance CA vs période précédente
        const tendanceCa = caPrecedent > 0
          ? Math.round(((caTotal - caPrecedent) / caPrecedent) * 100)
          : caTotal > 0 ? 100 : 0

        return {
          id: commercial.id,
          prenom: commercial.prenom,
          nom: commercial.nom,
          email: commercial.email,
          role: commercial.role,
          avatar_color: commercial.avatar_color,
          specialites: commercial.specialites,
          objectif_mensuel: objectif,

          // KPIs période
          leads_total: leadsTotal,
          leads_periode: leadsPeriode,
          conversions_periode: conversionsPeriode,
          taux_conversion: tauxConversion,
          ca_periode: caTotal,
          ca_precedent: caPrecedent,
          tendance_ca: tendanceCa,
          progression_objectif: progressionObjectif,

          // Pipeline
          pipeline_actif: pipelineCount,
          pipeline_score_moyen: pipelineScoreMoyen,

          // Activité
          activites_periode: activitesRes.count || 0,
          rappels_overdue: rappelsRes.count || 0,
        }
      })
    )

    // 3. Forecast pipeline + temps de réponse (requêtes parallèles)
    const [forecastRes, responseTimeRes, objectifsRes] = await Promise.all([
      supabase.from('v_forecast_commercial').select('*'),
      supabase.from('mv_response_time').select('*'),
      supabase.from('objectifs_commerciaux')
        .select('*')
        .eq('statut', 'actif')
        .gte('periode_fin', now.toISOString().split('T')[0]),
    ])

    // Enrichir chaque commercial avec forecast + temps réponse + objectifs
    const enriched = performances.map(p => {
      const forecast = forecastRes.data?.find(f => f.equipe_id === p.id)
      const responseTime = responseTimeRes.data?.find(r => r.equipe_id === p.id)
      const objectifs = objectifsRes.data?.filter(o => o.membre_id === p.id) || []

      return {
        ...p,
        // Forecast
        forecast_pondere: forecast?.forecast_pondere || 0,
        valeur_pipeline_brut: forecast?.valeur_pipeline_brut || 0,
        confirme: forecast?.confirme || 0,
        best_case: forecast?.best_case || 0,
        // Temps de réponse
        temps_reponse_moyen_heures: responseTime?.temps_reponse_moyen_heures || null,
        leads_contactes_2h: responseTime?.leads_contactes_2h || 0,
        leads_jamais_contactes: responseTime?.leads_jamais_contactes || 0,
        // Objectifs actifs
        objectifs,
      }
    })

    // 4. Classement par CA (leaderboard)
    const classement = [...enriched]
      .sort((a, b) => b.ca_periode - a.ca_periode)
      .map((p, index) => ({ ...p, rang: index + 1 }))

    // 5. Totaux équipe
    const totaux = {
      ca_total: performances.reduce((sum, p) => sum + p.ca_periode, 0),
      ca_precedent_total: performances.reduce((sum, p) => sum + p.ca_precedent, 0),
      leads_total: performances.reduce((sum, p) => sum + p.leads_periode, 0),
      conversions_total: performances.reduce((sum, p) => sum + p.conversions_periode, 0),
      objectif_total: performances.reduce((sum, p) => sum + p.objectif_mensuel, 0),
      pipeline_total: performances.reduce((sum, p) => sum + p.pipeline_actif, 0),
      rappels_overdue_total: performances.reduce((sum, p) => sum + p.rappels_overdue, 0),
      taux_conversion_moyen: performances.length > 0
        ? Math.round(performances.reduce((sum, p) => sum + p.taux_conversion, 0) / performances.length)
        : 0,
      progression_objectif_global: (() => {
        const objTotal = performances.reduce((sum, p) => sum + p.objectif_mensuel, 0)
        const caTotal = performances.reduce((sum, p) => sum + p.ca_periode, 0)
        return objTotal > 0 ? Math.round((caTotal / objTotal) * 100) : 0
      })(),
      forecast_total: enriched.reduce((sum, p) => sum + (p.forecast_pondere || 0), 0),
      best_case_total: enriched.reduce((sum, p) => sum + (p.best_case || 0), 0),
    }

    return NextResponse.json({
      commerciaux: classement,
      totaux,
      periode,
      date_debut: dateDebut,
      refreshed_at: now.toISOString(),
    })

  } catch (error) {
    console.error('[Analytics Commerciaux] Error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
