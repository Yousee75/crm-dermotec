// ============================================================
// CRM DERMOTEC — Activity Logger centralisé
// Toute action traçable passe par ici
// ============================================================

import type { TypeActivite } from '@/types'

interface LogActivityParams {
  type: TypeActivite
  description: string
  lead_id?: string
  session_id?: string
  inscription_id?: string
  user_id?: string
  ancien_statut?: string
  nouveau_statut?: string
  metadata?: Record<string, unknown>
}

/**
 * Log une activité dans la table activites (server-side)
 * Utilise le service role pour bypass RLS
 * Non-bloquant : ne throw jamais
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { createServiceSupabase } = await import('./supabase-server')
    const supabase = await createServiceSupabase()

    const { error } = await (supabase.from('activites') as any).insert({
      type: params.type,
      description: params.description,
      lead_id: params.lead_id || null,
      session_id: params.session_id || null,
      inscription_id: params.inscription_id || null,
      user_id: params.user_id || null,
      ancien_statut: params.ancien_statut || null,
      nouveau_statut: params.nouveau_statut || null,
      metadata: params.metadata || {},
    })

    if (error) {
      console.error('[ActivityLogger] Insert failed:', error.message)
    }
  } catch (err) {
    console.error('[ActivityLogger] Error:', err)
    // Never throw — logging must not break the app
  }

  // Always console log as fallback
  console.log(`[Activity] ${params.type}: ${params.description}`, {
    lead_id: params.lead_id,
    session_id: params.session_id,
  })
}

/**
 * Helper pour logger un changement de statut lead
 */
export function logStatutChange(
  leadId: string,
  ancien: string,
  nouveau: string,
  userId?: string
): Promise<void> {
  return logActivity({
    type: 'STATUT_CHANGE',
    description: `Statut changé : ${ancien} → ${nouveau}`,
    lead_id: leadId,
    user_id: userId,
    ancien_statut: ancien,
    nouveau_statut: nouveau,
  })
}

/**
 * Helper pour logger un contact (appel, email, whatsapp)
 */
export function logContact(
  leadId: string,
  canal: string,
  resultat: string,
  userId?: string
): Promise<void> {
  return logActivity({
    type: 'CONTACT',
    description: `Contact ${canal} : ${resultat}`,
    lead_id: leadId,
    user_id: userId,
    metadata: { canal, resultat },
  })
}

/**
 * Helper pour logger un paiement
 */
export function logPaiement(
  inscriptionId: string,
  montant: number,
  moyen: string,
  leadId?: string
): Promise<void> {
  return logActivity({
    type: 'PAIEMENT',
    description: `Paiement reçu : ${montant.toFixed(2)}€ (${moyen})`,
    inscription_id: inscriptionId,
    lead_id: leadId,
    metadata: { montant, moyen },
  })
}

/**
 * Helper pour logger une note
 */
export function logNote(
  leadId: string,
  contenu: string,
  userId?: string
): Promise<void> {
  return logActivity({
    type: 'NOTE',
    description: contenu.slice(0, 200),
    lead_id: leadId,
    user_id: userId,
  })
}
