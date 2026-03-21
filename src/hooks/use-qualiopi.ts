'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import type { QualiopiCritere, QualiopiIndicateur, StatutIndicateur } from '@/types'
import { QUALIOPI_REFERENTIEL } from '@/lib/qualiopi-referentiel'

function evalStatut(score: number): StatutIndicateur {
  if (score >= 80) return 'conforme'
  if (score >= 50) return 'a_surveiller'
  return 'non_conforme'
}

export function useQualiopi() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['qualiopi-dashboard'],
    queryFn: async () => {
      // Récupérer toutes les données nécessaires en parallèle
      const [formations, sessions, inscriptions, qualite, equipe] = await Promise.all([
        supabase.from('formations').select('*').eq('is_active', true),
        supabase.from('sessions').select('*'),
        supabase.from('inscriptions').select('*'),
        supabase.from('qualite').select('*'),
        supabase.from('equipe').select('*').eq('is_active', true),
      ])

      const f = formations.data || []
      const s = sessions.data || []
      const i = inscriptions.data || []
      const q = qualite.data || []
      const e = equipe.data || []

      // Calculs pour chaque indicateur
      const sessionsTerminees = s.filter(x => x.statut === 'TERMINEE')
      const inscriptionsCompletees = i.filter(x => x.statut === 'COMPLETEE')
      const formatrices = e.filter(x => x.role === 'formatrice')
      const reclamations = q.filter(x => x.type === 'reclamation')
      const reclamationsResolues = reclamations.filter(x => x.statut === 'RESOLUE' || x.statut === 'CLOTUREE')
      const satisfactionNotes = inscriptionsCompletees.filter(x => x.note_satisfaction != null)
      const moyenneSatisfaction = satisfactionNotes.length > 0
        ? satisfactionNotes.reduce((acc, x) => acc + (x.note_satisfaction || 0), 0) / satisfactionNotes.length
        : 0
      const tauxPresenceMoyen = inscriptionsCompletees.length > 0
        ? inscriptionsCompletees.reduce((acc, x) => acc + (x.taux_presence || 0), 0) / inscriptionsCompletees.length
        : 0
      const certificatsGeneres = inscriptionsCompletees.filter(x => x.certificat_genere).length
      const conventionsGenerees = i.filter(x => x.convention_generee).length

      // Stats pour indicateurs
      const stats = {
        nb_formations: f.length,
        nb_formations_avec_objectifs: f.filter(x => x.objectifs?.length > 0).length,
        nb_formations_avec_prerequis: f.filter(x => x.prerequis).length,
        nb_formations_avec_programme: f.filter(x => x.programme_url).length,
        nb_sessions: s.length,
        nb_sessions_terminees: sessionsTerminees.length,
        nb_sessions_materiel_ok: s.filter(x => x.materiel_prepare).length,
        nb_sessions_supports_ok: s.filter(x => x.supports_envoyes).length,
        nb_sessions_convocations_ok: s.filter(x => x.convocations_envoyees).length,
        nb_inscriptions: i.length,
        nb_inscriptions_completees: inscriptionsCompletees.length,
        nb_certificats: certificatsGeneres,
        nb_conventions: conventionsGenerees,
        nb_formatrices: formatrices.length,
        nb_formatrices_cv: formatrices.filter(x => x.cv_url).length,
        nb_formatrices_certifications: formatrices.filter(x => x.certifications?.length > 0).length,
        taux_satisfaction: moyenneSatisfaction,
        taux_presence: tauxPresenceMoyen,
        nb_reclamations: reclamations.length,
        nb_reclamations_resolues: reclamationsResolues.length,
        nb_evaluations: satisfactionNotes.length,
        nb_qualite_items: q.length,
        nb_actions_correctives: q.filter(x => x.type === 'action_corrective').length,
        nb_ameliorations: q.filter(x => x.type === 'amelioration').length,
      }

      // Construire les indicateurs dynamiquement
      // Filtrer les indicateurs CFA (non applicables pour Dermotec = OF)
      const criteres: QualiopiCritere[] = QUALIOPI_REFERENTIEL.map(critere => {
        const applicableIndicateurs = critere.indicateurs.filter(ind => !ind.cfa_only)
        const indicateurs: QualiopiIndicateur[] = applicableIndicateurs.map(ind => {
          const score = ind.calcul(stats)
          return {
            critere: critere.numero,
            indicateur: ind.numero,
            label: ind.label,
            description: ind.description,
            statut: evalStatut(score),
            score,
            preuves: ind.preuves(stats),
            actions_requises: score < 80 ? ind.actions : [],
          }
        })

        const score_global = indicateurs.length > 0
          ? Math.round(indicateurs.reduce((acc, ind) => acc + ind.score, 0) / indicateurs.length)
          : 0

        return {
          numero: critere.numero,
          label: critere.label,
          description: critere.description,
          indicateurs,
          score_global,
        }
      })

      const score_total = criteres.length > 0
        ? Math.round(criteres.reduce((acc, c) => acc + c.score_global, 0) / criteres.length)
        : 0

      return { criteres, score_total, stats }
    },
    staleTime: 5 * 60 * 1000,
  })
}
