// ============================================================
// Inngest Function: Notifications Enrichies
// Cron toutes les 4h — Détecte les situations critiques manquées
// Complète l'agent proactif pour les sessions pleines et rappels en retard
// ============================================================

import { inngest } from '@/lib/infra/inngest'

export const enhancedNotifications = inngest.createFunction(
  {
    id: 'crm-enhanced-notifications',
    retries: 2,
    triggers: [{ cron: 'TZ=Europe/Paris 0 */4 * * *' }], // Toutes les 4h
  },
  async ({ step }: { step: any }) => {
    const supabaseImport = async () => {
      const { createClient } = await import('@supabase/supabase-js')
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
    }

    // ============================================
    // STEP 1: Sessions proches de la capacité max (80%+)
    // ============================================
    const sessionsPresquePleines = await step.run('detect-sessions-almost-full', async () => {
      const supabase = await supabaseImport()

      // Récupérer les sessions confirmées avec leur taux de remplissage
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          date_debut,
          places_max,
          formation:formations(nom),
          inscriptions!inner(id, statut)
        `)
        .in('statut', ['CONFIRMEE', 'PLANIFIEE'])
        .gte('date_debut', new Date().toISOString()) // Futures seulement
        .limit(20)

      if (!sessions) return []

      const sessionsCritiques = sessions
        .map((session: any) => {
          const inscriptionsValides = (session.inscriptions || [])
            .filter((i: any) => ['CONFIRMEE', 'EN_COURS'].includes(i.statut))

          const tauxRemplissage = (inscriptionsValides.length / session.places_max) * 100

          return {
            ...session,
            inscrits: inscriptionsValides.length,
            pourcentage: tauxRemplissage
          }
        })
        .filter((s: any) => s.pourcentage >= 80) // 80% ou plus

      return sessionsCritiques
    })

    // Créer des notifications pour les sessions pleines
    if (sessionsPresquePleines.length > 0) {
      await step.run('notify-sessions-almost-full', async () => {
        const supabase = await supabaseImport()

        for (const session of sessionsPresquePleines as any[]) {
          // Éviter les doublons : ne pas notifier si déjà fait dans les 24h
          const { data: existing } = await supabase
            .from('activites')
            .select('id')
            .eq('session_id', session.id)
            .eq('type', 'SYSTEME')
            .contains('metadata', { canal: 'agent_ia', action: 'session_pleine' })
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1)

          if (!existing?.length) {
            const formation = session.formation as any

            await supabase.from('activites').insert({
              type: 'SYSTEME',
              session_id: session.id,
              description: `[Agent IA] Session "${formation?.nom || 'Formation'}" presque pleine — ${session.inscrits}/${session.places_max} places (${Math.round(session.pourcentage)}%)`,
              metadata: {
                canal: 'agent_ia',
                action: 'session_pleine',
                inscrits: session.inscrits,
                places_max: session.places_max,
                pourcentage: session.pourcentage
              },
            })
          }
        }

        return { notified: sessionsPresquePleines.length }
      })
    }

    // ============================================
    // STEP 2: Rappels en retard (pas traités par l'agent proactif)
    // Date de rappel dépassée depuis plus de 1h
    // ============================================
    const rappelsEnRetard = await step.run('detect-overdue-rappels', async () => {
      const supabase = await supabaseImport()

      const uneHeureAvant = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('rappels')
        .select('id, titre, description, type, date_rappel, lead_id, user_id, lead:leads(prenom, nom)')
        .eq('statut', 'EN_ATTENTE')
        .lte('date_rappel', uneHeureAvant) // En retard d'au moins 1h
        .is('deleted_at', null)
        .limit(50)

      return data || []
    })

    if (rappelsEnRetard.length > 0) {
      await step.run('notify-overdue-rappels', async () => {
        const supabase = await supabaseImport()

        for (const rappel of rappelsEnRetard as any[]) {
          // Éviter les doublons : ne pas notifier si déjà fait pour ce rappel
          const { data: existing } = await supabase
            .from('activites')
            .select('id')
            .contains('metadata', { canal: 'agent_ia', action: 'rappel_overdue', rappel_id: rappel.id })
            .limit(1)

          if (!existing?.length) {
            const lead = rappel.lead as any
            const retardHeures = Math.floor((Date.now() - new Date(rappel.date_rappel).getTime()) / (1000 * 60 * 60))

            await supabase.from('activites').insert({
              type: 'SYSTEME',
              lead_id: rappel.lead_id,
              description: `[Agent IA] Rappel en retard — "${rappel.titre}" — ${lead?.prenom || ''} ${lead?.nom || ''} — ${retardHeures}h de retard`,
              metadata: {
                canal: 'agent_ia',
                action: 'rappel_overdue',
                rappel_id: rappel.id,
                retard_heures: retardHeures
              },
            })
          }
        }

        return { notified: rappelsEnRetard.length }
      })
    }

    // ============================================
    // STEP 3: Prospects avec score élevé sans formation assignée
    // Score > 70 mais formation_principale_id null
    // ============================================
    const prospectsEgares = await step.run('detect-lost-hot-prospects', async () => {
      const supabase = await supabaseImport()

      const { data } = await supabase
        .from('leads')
        .select('id, prenom, nom, email, score_chaud, commercial_assigne_id')
        .is('formation_principale_id', null)
        .gte('score_chaud', 70)
        .in('statut', ['NOUVEAU', 'CONTACTE', 'QUALIFIE'])
        .limit(20)

      return data || []
    })

    if (prospectsEgares.length > 0) {
      await step.run('notify-lost-hot-prospects', async () => {
        const supabase = await supabaseImport()

        for (const prospect of prospectsEgares as any[]) {
          // Éviter les doublons : pas de notification dans les 7 derniers jours
          const { data: existing } = await supabase
            .from('activites')
            .select('id')
            .eq('lead_id', prospect.id)
            .contains('metadata', { canal: 'agent_ia', action: 'prospect_sans_formation' })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1)

          if (!existing?.length) {
            await supabase.from('activites').insert({
              type: 'SYSTEME',
              lead_id: prospect.id,
              description: `[Agent IA] Prospect chaud sans formation assignée — ${prospect.prenom} ${prospect.nom} (score ${prospect.score_chaud}) — Définir une formation cible`,
              metadata: {
                canal: 'agent_ia',
                action: 'prospect_sans_formation',
                score: prospect.score_chaud
              },
            })

            // Créer un rappel pour le commercial
            if (prospect.commercial_assigne_id) {
              await supabase.from('rappels').insert({
                lead_id: prospect.id,
                user_id: prospect.commercial_assigne_id,
                type: 'SUIVI',
                titre: 'Définir formation cible',
                description: `Prospect chaud (score ${prospect.score_chaud}) sans formation assignée — À qualifier`,
                date_rappel: new Date().toISOString(),
                statut: 'EN_ATTENTE',
              })
            }
          }
        }

        return { notified: prospectsEgares.length }
      })
    }

    // ============================================
    // STEP 4: Résumé
    // ============================================
    const summary = {
      date: new Date().toISOString(),
      sessions_pleines: sessionsPresquePleines.length,
      rappels_retard: rappelsEnRetard.length,
      prospects_egares: prospectsEgares.length,
      total_notifications: sessionsPresquePleines.length + rappelsEnRetard.length + prospectsEgares.length,
    }

    return summary
  }
)