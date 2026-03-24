import type { SupabaseClient } from '@supabase/supabase-js'

export interface CreateNotificationOptions {
  userId: string
  title: string
  message: string
  type: 'prospect_chaud' | 'financement_stagnant' | 'session_pleine' | 'rappel_retard' | 'lead_recuperable'
  leadId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

/**
 * Helper serveur pour créer des notifications critiques
 * Utilise la table 'activites' avec type 'SYSTEME' pour déclencher les toasts realtime
 */
export async function createNotification(
  supabase: SupabaseClient,
  options: CreateNotificationOptions
) {
  const { userId, title, message, type, leadId, sessionId, metadata = {} } = options

  try {
    // Créer une activité système pour déclencher le toast realtime
    const { data: activite, error: activiteError } = await supabase
      .from('activites')
      .insert({
        type: 'SYSTEME',
        description: `[Agent IA] ${title} — ${message}`,
        lead_id: leadId,
        session_id: sessionId,
        metadata: {
          canal: 'agent_ia',
          action: getActionFromType(type),
          notification_type: type,
          ...metadata
        }
      })
      .select('id')
      .single()

    if (activiteError) {
      console.error('[createNotification] Erreur activite:', activiteError)
      return { success: false, error: activiteError.message }
    }

    // Optionnel : créer aussi un rappel si c'est actionnable
    if (shouldCreateRappel(type) && leadId) {
      await supabase
        .from('rappels')
        .insert({
          lead_id: leadId,
          user_id: userId,
          type: getRappelTypeFromNotificationType(type),
          titre: title,
          description: message,
          date_rappel: new Date().toISOString(),
          statut: 'EN_ATTENTE'
        })
    }

    return { success: true, activiteId: activite.id }
  } catch (error) {
    console.error('[createNotification] Erreur inattendue:', error)
    return { success: false, error: 'Erreur lors de la création de la notification' }
  }
}

function getActionFromType(type: string): string {
  const mapping: Record<string, string> = {
    prospect_chaud: 'rappel_auto',
    financement_stagnant: 'financement_relance',
    session_pleine: 'session_reminder',
    rappel_retard: 'rappel_overdue',
    lead_recuperable: 'recovery_attempt'
  }
  return mapping[type] || 'notification'
}

function shouldCreateRappel(type: string): boolean {
  // Créer des rappels pour les actions qui nécessitent un suivi
  return ['prospect_chaud', 'financement_stagnant', 'lead_recuperable'].includes(type)
}

function getRappelTypeFromNotificationType(type: string): string {
  const mapping: Record<string, string> = {
    prospect_chaud: 'APPEL',
    financement_stagnant: 'RELANCE',
    lead_recuperable: 'RELANCE'
  }
  return mapping[type] || 'SUIVI'
}

/**
 * Helper pour créer une notification de prospect chaud
 */
export async function createProspectChaudNotification(
  supabase: SupabaseClient,
  options: {
    userId: string
    leadId: string
    leadName: string
    score: number
    joursSansContact: number
  }
) {
  return createNotification(supabase, {
    userId: options.userId,
    title: 'Prospect chaud détecté',
    message: `${options.leadName} (score ${options.score}) — ${options.joursSansContact}j sans contact`,
    type: 'prospect_chaud',
    leadId: options.leadId,
    metadata: {
      score: options.score,
      jours_sans_contact: options.joursSansContact
    }
  })
}

/**
 * Helper pour créer une notification de financement stagnant
 */
export async function createFinancementStagnantNotification(
  supabase: SupabaseClient,
  options: {
    userId: string
    leadId: string
    leadName: string
    organisme: string
    joursAttente: number
    montant: number
  }
) {
  return createNotification(supabase, {
    userId: options.userId,
    title: 'Financement en attente',
    message: `${options.leadName} — ${options.organisme} (${options.montant}€) depuis ${options.joursAttente}j`,
    type: 'financement_stagnant',
    leadId: options.leadId,
    metadata: {
      organisme: options.organisme,
      jours: options.joursAttente,
      montant: options.montant
    }
  })
}

/**
 * Helper pour créer une notification de session presque pleine
 */
export async function createSessionPleineNotification(
  supabase: SupabaseClient,
  options: {
    userId: string
    sessionId: string
    sessionName: string
    inscrits: number
    placesMax: number
    pourcentage: number
  }
) {
  return createNotification(supabase, {
    userId: options.userId,
    title: 'Session presque pleine',
    message: `${options.sessionName} — ${options.inscrits}/${options.placesMax} places (${Math.round(options.pourcentage)}%)`,
    type: 'session_pleine',
    sessionId: options.sessionId,
    metadata: {
      inscrits: options.inscrits,
      places_max: options.placesMax,
      pourcentage: options.pourcentage
    }
  })
}

/**
 * Helper pour créer une notification de rappel en retard
 */
export async function createRappelRetardNotification(
  supabase: SupabaseClient,
  options: {
    userId: string
    leadId?: string
    rappelTitre: string
    retardJours: number
  }
) {
  return createNotification(supabase, {
    userId: options.userId,
    title: 'Rappel en retard',
    message: `${options.rappelTitre} — En retard de ${options.retardJours} jour(s)`,
    type: 'rappel_retard',
    leadId: options.leadId,
    metadata: {
      retard_jours: options.retardJours
    }
  })
}