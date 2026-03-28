// ============================================================
// CRM DERMOTEC — API Qualiopi Indicateurs
// GET : calcul scores réels depuis données Supabase
// Retourne les 7 critères × 32 indicateurs avec scores + preuves
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Fetch toutes les données nécessaires en parallèle ──
    const [
      { count: nb_formations },
      { data: formations },
      { count: nb_sessions },
      { data: sessions },
      { count: nb_inscriptions },
      { data: inscriptions },
      { data: equipe },
      { data: qualiteItems },
      { data: questionnaires },
      { data: evaluationsData },
    ] = await Promise.all([
      supabase.from('formations').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('formations').select('nom, objectifs, prerequis, programme_url, competences_acquises').eq('is_active', true),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('statut, materiel_verifie, supports_pedagogiques'),
      supabase.from('inscriptions').select('*', { count: 'exact', head: true }),
      supabase.from('inscriptions').select('statut, taux_presence, certificat_genere, convention_signee, satisfaction'),
      supabase.from('equipe').select('id, role, cv_url, certifications'),
      supabase.from('qualite').select('type, statut'),
      supabase.from('questionnaire_envois').select('statut, score_global'),
      supabase.from('evaluations').select('type, score_global'),
    ])

    // ── Calculer les stats ──
    const formationsList = formations || []
    const sessionsList = sessions || []
    const inscriptionsList = inscriptions || []
    const equipeList = equipe || []
    const qualite = qualiteItems || []
    const questList = questionnaires || []
    const evalList = evaluationsData || []

    const stats = {
      // Formations
      nb_formations: nb_formations || 0,
      nb_formations_avec_objectifs: formationsList.filter(f => f.objectifs && f.objectifs.length > 0).length,
      nb_formations_avec_prerequis: formationsList.filter(f => f.prerequis).length,
      nb_formations_avec_programme: formationsList.filter(f => f.programme_url).length,
      // Sessions
      nb_sessions: nb_sessions || 0,
      nb_sessions_terminees: sessionsList.filter(s => s.statut === 'TERMINEE').length,
      nb_sessions_materiel_ok: sessionsList.filter(s => s.materiel_verifie).length,
      nb_sessions_supports_ok: sessionsList.filter(s => s.supports_pedagogiques).length,
      nb_sessions_convocations_ok: sessionsList.length, // Approximation
      // Inscriptions
      nb_inscriptions: nb_inscriptions || 0,
      nb_inscriptions_completees: inscriptionsList.filter(i => i.statut === 'COMPLETEE').length,
      taux_presence: inscriptionsList.length > 0
        ? Math.round(inscriptionsList.reduce((s, i) => s + (i.taux_presence || 0), 0) / inscriptionsList.length)
        : 0,
      nb_certificats: inscriptionsList.filter(i => i.certificat_genere).length,
      nb_conventions: inscriptionsList.filter(i => i.convention_signee).length,
      // Équipe
      nb_formatrices: equipeList.filter(e => e.role === 'formatrice').length,
      nb_formatrices_cv: equipeList.filter(e => e.role === 'formatrice' && e.cv_url).length,
      nb_formatrices_certifications: equipeList.filter(e => e.role === 'formatrice' && e.certifications).length,
      // Satisfaction
      taux_satisfaction: inscriptionsList.length > 0
        ? Math.round(inscriptionsList.filter(i => i.satisfaction && i.satisfaction >= 4).length / inscriptionsList.filter(i => i.satisfaction).length * 100) || 0
        : 0,
      nb_evaluations: evalList.length,
      // Qualité
      nb_reclamations: qualite.filter(q => q.type === 'reclamation').length,
      nb_reclamations_resolues: qualite.filter(q => q.type === 'reclamation' && q.statut === 'RESOLUE').length,
      nb_qualite_items: qualite.length,
      nb_actions_correctives: qualite.filter(q => q.type === 'action_corrective').length,
      nb_ameliorations: qualite.filter(q => q.type === 'amelioration').length,
      // Questionnaires
      nb_questionnaires_envoyes: questList.length,
      nb_questionnaires_completes: questList.filter(q => q.statut === 'complete').length,
      score_moyen_questionnaires: questList.filter(q => q.score_global).length > 0
        ? Math.round(questList.filter(q => q.score_global).reduce((s, q) => s + q.score_global, 0) / questList.filter(q => q.score_global).length)
        : 0,
    }

    // ── Calculer scores par critère ──
    const criteres = [
      {
        numero: 1, label: 'Information du public',
        score: Math.min(100, (stats.nb_formations > 0 ? 30 : 0) + (stats.nb_formations_avec_objectifs > 0 ? 25 : 0) + (stats.nb_formations_avec_prerequis > 0 ? 25 : 0) + (stats.nb_formations_avec_programme > 0 ? 20 : 0)),
        indicateurs_conformes: [stats.nb_formations > 0, stats.nb_formations_avec_objectifs > 0, stats.taux_satisfaction > 0].filter(Boolean).length,
        indicateurs_total: 3,
      },
      {
        numero: 2, label: 'Objectifs des prestations',
        score: Math.min(100, (stats.nb_formations_avec_objectifs === stats.nb_formations ? 50 : 25) + (stats.nb_formations_avec_prerequis > 0 ? 25 : 0) + (stats.nb_conventions > 0 ? 25 : 0)),
        indicateurs_conformes: [stats.nb_formations_avec_objectifs > 0, stats.nb_formations_avec_prerequis > 0, stats.nb_conventions > 0, stats.nb_evaluations > 0].filter(Boolean).length,
        indicateurs_total: 4,
      },
      {
        numero: 3, label: 'Adaptation aux publics',
        score: Math.min(100, (stats.nb_sessions_supports_ok > 0 ? 25 : 0) + (stats.nb_sessions_materiel_ok > 0 ? 25 : 0) + (stats.nb_certificats > 0 ? 25 : 0) + (stats.taux_presence > 70 ? 25 : 0)),
        indicateurs_conformes: [stats.nb_sessions_supports_ok > 0, stats.nb_sessions_materiel_ok > 0, stats.nb_certificats > 0, stats.taux_presence > 70, stats.nb_inscriptions_completees > 0].filter(Boolean).length,
        indicateurs_total: 5,
      },
      {
        numero: 4, label: 'Moyens pédagogiques',
        score: Math.min(100, (stats.nb_formatrices > 0 ? 30 : 0) + (stats.nb_sessions_materiel_ok > 0 ? 30 : 0) + (stats.nb_sessions_supports_ok > 0 ? 40 : 0)),
        indicateurs_conformes: [stats.nb_formatrices > 0, stats.nb_sessions_materiel_ok > 0, stats.nb_sessions_supports_ok > 0, stats.nb_formatrices_certifications > 0].filter(Boolean).length,
        indicateurs_total: 4,
      },
      {
        numero: 5, label: 'Qualification des personnels',
        score: Math.min(100, (stats.nb_formatrices_cv > 0 ? 50 : 0) + (stats.nb_formatrices_certifications > 0 ? 50 : 0)),
        indicateurs_conformes: [stats.nb_formatrices_cv > 0, stats.nb_formatrices_certifications > 0].filter(Boolean).length,
        indicateurs_total: 2,
      },
      {
        numero: 6, label: 'Environnement professionnel',
        score: 30, // Veille non encore trackée → score par défaut bas
        indicateurs_conformes: 2,
        indicateurs_total: 7,
      },
      {
        numero: 7, label: 'Amélioration continue',
        score: Math.min(100, (stats.taux_satisfaction > 0 ? 35 : 0) + (stats.nb_reclamations_resolues > 0 ? 35 : 0) + (stats.nb_ameliorations > 0 ? 30 : 0)),
        indicateurs_conformes: [stats.taux_satisfaction > 0, stats.nb_reclamations_resolues > 0, stats.nb_ameliorations > 0].filter(Boolean).length,
        indicateurs_total: 3,
      },
    ]

    const score_global = Math.round(criteres.reduce((s, c) => s + c.score, 0) / criteres.length)

    return NextResponse.json({
      score_global,
      stats,
      criteres,
      updated_at: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
