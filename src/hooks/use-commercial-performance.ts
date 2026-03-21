// ============================================================
// CRM DERMOTEC — Hook Performance Commerciaux
// Vue manager : leaderboard, KPIs, comparaison, tendances
// ============================================================

'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase-client'

export interface CommercialPerformance {
  id: string
  prenom: string
  nom: string
  email: string
  role: string
  avatar_color: string
  specialites: string[]
  objectif_mensuel: number
  rang: number

  // KPIs période
  leads_total: number
  leads_periode: number
  conversions_periode: number
  taux_conversion: number
  ca_periode: number
  ca_precedent: number
  tendance_ca: number // % vs période précédente
  progression_objectif: number // % de l'objectif atteint

  // Pipeline
  pipeline_actif: number
  pipeline_score_moyen: number

  // Activité
  activites_periode: number
  rappels_overdue: number
}

interface CommerciauxData {
  commerciaux: CommercialPerformance[]
  totaux: {
    ca_total: number
    ca_precedent_total: number
    leads_total: number
    conversions_total: number
    objectif_total: number
    pipeline_total: number
    rappels_overdue_total: number
    taux_conversion_moyen: number
    progression_objectif_global: number
  }
  periode: string
  date_debut: string
  refreshed_at: string
}

export type Periode = 'mois' | 'trimestre' | 'annee'

export function useCommercialPerformance(periode: Periode = 'mois') {
  return useQuery<CommerciauxData>({
    queryKey: ['commercial-performance', periode],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/commerciaux?periode=${periode}`)
      if (!res.ok) {
        throw new Error('Erreur chargement performance commerciaux')
      }
      return res.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh auto toutes les 5 min
  })
}

/**
 * Hook pour le dashboard personnel d'un commercial
 * Récupère ses propres KPIs
 */
export function useMyPerformance() {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: ['my-performance'],
    queryFn: async () => {
      // Récupérer l'user courant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      // Récupérer son equipe_id
      const { data: equipe } = await supabase
        .from('equipe')
        .select('id, objectif_mensuel, prenom, nom')
        .eq('auth_user_id', user.id)
        .single()

      if (!equipe) throw new Error('Profil non trouvé')

      const now = new Date()
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // Requêtes parallèles
      const [leadsRes, conversionsRes, caRes, rappelsRes, pipelineRes, activitesRes] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .eq('commercial_assigne_id', equipe.id)
          .gte('created_at', debutMois),

        supabase.from('leads').select('id', { count: 'exact', head: true })
          .eq('commercial_assigne_id', equipe.id)
          .in('statut', ['INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI'])
          .gte('updated_at', debutMois),

        supabase.from('inscriptions').select('montant_total')
          .eq('paiement_statut', 'PAYE')
          .gte('updated_at', debutMois),

        supabase.from('rappels').select('id, type, date_rappel, lead_id, titre', { count: 'exact' })
          .eq('user_id', equipe.id)
          .eq('statut', 'EN_ATTENTE')
          .order('date_rappel'),

        supabase.from('leads').select('id, prenom, nom, statut, score_chaud', { count: 'exact' })
          .eq('commercial_assigne_id', equipe.id)
          .in('statut', ['NOUVEAU', 'CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS'])
          .order('score_chaud', { ascending: false })
          .limit(10),

        supabase.from('activites').select('id', { count: 'exact', head: true })
          .eq('user_id', equipe.id)
          .gte('created_at', debutMois),
      ])

      const ca = caRes.data?.reduce((sum, i) => sum + (i.montant_total || 0), 0) || 0
      const objectif = equipe.objectif_mensuel || 0
      const rappelsOverdue = rappelsRes.data?.filter(r => new Date(r.date_rappel) < now) || []
      const rappelsAujourdHui = rappelsRes.data?.filter(r => {
        const d = new Date(r.date_rappel)
        return d.toDateString() === now.toDateString()
      }) || []

      return {
        prenom: equipe.prenom,
        nom: equipe.nom,
        objectif_mensuel: objectif,
        leads_mois: leadsRes.count || 0,
        conversions_mois: conversionsRes.count || 0,
        ca_mois: ca,
        progression_objectif: objectif > 0 ? Math.round((ca / objectif) * 100) : 0,
        pipeline: pipelineRes.data || [],
        pipeline_count: pipelineRes.count || 0,
        rappels_overdue: rappelsOverdue,
        rappels_overdue_count: rappelsOverdue.length,
        rappels_aujourdhui: rappelsAujourdHui,
        activites_mois: activitesRes.count || 0,
      }
    },
    staleTime: 60 * 1000, // 1 minute
  })
}
