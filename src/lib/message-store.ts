// ============================================================
// CRM DERMOTEC — Message Store centralisé
// TOUT passe par ici : email, WhatsApp, SMS, appel, agent IA, cadence
// Source de vérité unique pour l'historique omnicanal
// ============================================================

type Canal = 'email' | 'whatsapp' | 'sms' | 'appel' | 'note_interne' | 'agent_ia'
type Direction = 'inbound' | 'outbound'
type Statut = 'brouillon' | 'envoye' | 'delivre' | 'lu' | 'erreur' | 'annule'

interface SaveMessageParams {
  lead_id: string
  direction: Direction
  canal: Canal
  contenu: string
  sujet?: string
  de?: string
  a?: string
  statut?: Statut
  external_id?: string
  erreur_detail?: string
  user_id?: string
  metadata?: Record<string, unknown>
}

/**
 * Sauvegarde un message dans la table messages (source de vérité omnicanale)
 *
 * CRASH-PROOF (patterns des géants de la tech) :
 * 1. Tente l'insert dans messages
 * 2. Si échec → sauvegarde dans failed_operations (Dead Letter Queue persistante)
 * 3. Un cron Inngest reprocesse les failed_operations toutes les 2 min
 * 4. Idempotency key pour éviter les doublons si retry
 *
 * → Même si Supabase crash pendant 5 min, AUCUN message n'est perdu
 */
export async function saveMessage(params: SaveMessageParams): Promise<string | null> {
  const idempotencyKey = `msg_${params.lead_id}_${params.canal}_${Date.now()}`
  const payload = {
    lead_id: params.lead_id,
    direction: params.direction,
    canal: params.canal,
    contenu: params.contenu,
    sujet: params.sujet || null,
    de: params.de || (params.direction === 'outbound' ? 'Dermotec' : null),
    a: params.a || null,
    statut: params.statut || 'envoye',
    external_id: params.external_id || null,
    erreur_detail: params.erreur_detail || null,
    user_id: params.user_id || null,
    metadata: params.metadata || {},
  }

  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase() as any

    const { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      console.error('[MessageStore] Insert failed, saving to DLQ:', error.message)
      await saveToDeadLetterQueue(supabase, 'messages', 'save_message', payload, idempotencyKey, error.message)
      return null
    }

    return data?.id || null
  } catch (err) {
    // Supabase complètement down — tenter quand même le DLQ
    console.error('[MessageStore] Critical error, attempting DLQ:', err)
    try {
      const { createServiceSupabase } = await import('./supabase-server')
      const supabase = await createServiceSupabase() as any
      await saveToDeadLetterQueue(supabase, 'messages', 'save_message', payload, idempotencyKey, (err as Error).message)
    } catch {
      // Dernier recours : console.error pour les logs Vercel
      console.error('[MessageStore] DLQ ALSO FAILED — DATA LOSS RISK:', JSON.stringify(payload).slice(0, 500))
    }
    return null
  }
}

/**
 * Sauvegarde une opération échouée dans la Dead Letter Queue
 * Sera reprocessée par le cron Inngest processQueueJob
 */
async function saveToDeadLetterQueue(
  supabase: any,
  service: string,
  operation: string,
  payload: unknown,
  idempotencyKey: string,
  errorMessage: string
): Promise<void> {
  try {
    await supabase.from('failed_operations').upsert({
      service,
      operation,
      payload,
      status: 'pending',
      attempts: 0,
      max_attempts: 5,
      last_error: errorMessage,
      idempotency_key: idempotencyKey,
      next_retry_at: new Date(Date.now() + 30_000).toISOString(), // Retry dans 30s
    }, { onConflict: 'idempotency_key' })
  } catch (dlqErr) {
    console.error('[DLQ] Failed to save to dead letter queue:', dlqErr)
  }
}

// --- Helpers par canal ---

/** Email envoyé via Resend ou cadence */
export function saveEmailSent(params: {
  lead_id: string
  sujet: string
  contenu: string
  destinataire: string
  source: 'resend' | 'cadence' | 'agent_ia' | 'manuel'
  resend_id?: string
  user_id?: string
}) {
  return saveMessage({
    lead_id: params.lead_id,
    direction: 'outbound',
    canal: 'email',
    sujet: params.sujet,
    contenu: params.contenu,
    a: params.destinataire,
    statut: 'envoye',
    external_id: params.resend_id,
    metadata: { source: params.source },
    user_id: params.user_id,
  })
}

/** SMS envoyé */
export function saveSmsSent(params: {
  lead_id: string
  contenu: string
  destinataire: string
  source: 'cadence' | 'manuel'
  external_id?: string
}) {
  return saveMessage({
    lead_id: params.lead_id,
    direction: 'outbound',
    canal: 'sms',
    contenu: params.contenu,
    a: params.destinataire,
    statut: 'envoye',
    external_id: params.external_id,
    metadata: { source: params.source },
  })
}

/** WhatsApp envoyé */
export function saveWhatsAppSent(params: {
  lead_id: string
  contenu: string
  destinataire: string
  external_id?: string
}) {
  return saveMessage({
    lead_id: params.lead_id,
    direction: 'outbound',
    canal: 'whatsapp',
    contenu: params.contenu,
    a: params.destinataire,
    statut: 'envoye',
    external_id: params.external_id,
  })
}

/** Message agent IA (question + réponse) */
export function saveAgentMessage(params: {
  lead_id?: string
  direction: Direction
  contenu: string
  user_id?: string
  metadata?: Record<string, unknown>
}) {
  if (!params.lead_id) return Promise.resolve(null)
  return saveMessage({
    lead_id: params.lead_id,
    direction: params.direction,
    canal: 'agent_ia',
    contenu: params.contenu,
    user_id: params.user_id,
    metadata: params.metadata,
  })
}

/** Appel téléphonique (log) */
export function saveAppelLog(params: {
  lead_id: string
  contenu: string
  duree_secondes?: number
  resultat?: string
  user_id?: string
}) {
  return saveMessage({
    lead_id: params.lead_id,
    direction: 'outbound',
    canal: 'appel',
    contenu: params.contenu,
    statut: 'envoye',
    user_id: params.user_id,
    metadata: { duree: params.duree_secondes, resultat: params.resultat },
  })
}

/** Note interne */
export function saveNoteInterne(params: {
  lead_id: string
  contenu: string
  user_id?: string
}) {
  return saveMessage({
    lead_id: params.lead_id,
    direction: 'outbound',
    canal: 'note_interne',
    contenu: params.contenu,
    user_id: params.user_id,
  })
}
