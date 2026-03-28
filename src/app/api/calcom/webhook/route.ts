import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Webhook Cal.com — reçoit les événements de réservation
 * Configurer dans Cal.com : Settings > Developer > Webhooks
 * URL = https://crm-dermotec.vercel.app/api/calcom/webhook
 * Events: BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { triggerEvent, payload } = body

    logger.info('Cal.com webhook event received', {
      service: 'calcom-webhook',
      triggerEvent,
      payloadSize: JSON.stringify(payload).length
    })

    // Helper pour créer des rappels
    async function createRappel(data: {
      lead_id?: string
      user_id?: string
      date_rappel: string
      type: 'RDV' | 'APPEL' | 'SUIVI'
      titre: string
      description: string
      priorite?: 'URGENTE' | 'HAUTE' | 'NORMALE' | 'BASSE'
      external_id?: string
    }) {
      const { createServiceSupabase } = await import('@/lib/supabase-server')
      const supabase = await createServiceSupabase()

      const { error } = await (supabase.from('rappels') as any).insert({
        lead_id: data.lead_id || null,
        user_id: data.user_id || null,
        date_rappel: data.date_rappel,
        type: data.type,
        statut: 'EN_ATTENTE',
        priorite: data.priorite || 'NORMALE',
        titre: data.titre,
        description: data.description,
        metadata: { source: 'calcom', external_id: data.external_id }
      })

      if (error) {
        console.error('[Cal.com Webhook] Erreur création rappel:', error)
      }
      return !error
    }

    // Helper pour trouver un lead par email
    async function findLeadByEmail(email: string) {
      const { createServiceSupabase } = await import('@/lib/supabase-server')
      const supabase = await createServiceSupabase()

      const { data, error } = await (supabase
        .from('leads')
        .select('id, prenom, nom, email, commercial_assigne_id, statut')
        .eq('email', email)
        .single() as any)

      if (error && error.code !== 'PGRST116') {
        console.error('[Cal.com Webhook] Erreur recherche lead:', error)
      }
      return data
    }

    switch (triggerEvent) {
      case 'BOOKING_CREATED': {
        const { startTime, endTime, attendees, metadata, title, uid } = payload

        // Extraire les infos du premier participant
        const attendee = attendees?.[0]
        const email = attendee?.email
        const name = attendee?.name || 'Prospect'

        if (!email) {
          console.warn('[Cal.com Webhook] Pas d\'email attendee, ignoré')
          break
        }

        // Chercher le lead correspondant
        const lead = await findLeadByEmail(email)

        // Créer un rappel RDV
        const rdvDate = new Date(startTime).toISOString()
        await createRappel({
          lead_id: lead?.id,
          user_id: lead?.commercial_assigne_id,
          date_rappel: rdvDate,
          type: 'RDV',
          titre: title || 'RDV Cal.com',
          description: `RDV planifié avec ${name} (${email})`,
          priorite: 'HAUTE',
          external_id: uid
        })

        // Logger l'activité si lead trouvé
        if (lead) {
          const { logActivity } = await import('@/lib/activity-logger')
          await logActivity({
            type: 'RAPPEL',
            description: `RDV planifié via Cal.com : ${title || 'RDV'}`,
            lead_id: lead.id,
            metadata: {
              source: 'calcom',
              event_type: 'BOOKING_CREATED',
              start_time: startTime,
              end_time: endTime,
              external_id: uid
            }
          })

          // Si provient du CRM, mettre à jour le statut
          if (metadata?.source === 'crm-dermotec' && lead.statut === 'NOUVEAU') {
            const { createServiceSupabase } = await import('@/lib/supabase-server')
            const supabase = await createServiceSupabase()

            await ((supabase as any)
              .from('leads')
              .update({ statut: 'CONTACTE' })
              .eq('id', lead.id))

            const { logStatutChange } = await import('@/lib/activity-logger')
            await logStatutChange(lead.id, 'NOUVEAU', 'CONTACTE')
          }
        }

        logger.info('RDV created from Cal.com booking', {
          service: 'calcom-webhook',
          event: 'booking-created',
          leadId: lead?.id,
          rdvDate
        })
        break
      }

      case 'BOOKING_RESCHEDULED': {
        const { startTime, title, uid, attendees } = payload
        const email = attendees?.[0]?.email

        if (!email || !uid) break

        // Mettre à jour le rappel existant
        const { createServiceSupabase } = await import('@/lib/supabase-server')
        const supabase = await createServiceSupabase()

        const nouveauDate = new Date(startTime).toISOString()

        const { error } = await ((supabase as any)
          .from('rappels')
          .update({
            date_rappel: nouveauDate,
            titre: title || 'RDV Cal.com (reprogrammé)',
            description: `RDV reprogrammé via Cal.com`
          })
          .eq('metadata->external_id', uid))

        if (error) {
          console.error('[Cal.com Webhook] Erreur mise à jour rappel:', error)
        }

        // Logger l'activité
        const lead = await findLeadByEmail(email)
        if (lead) {
          const { logActivity } = await import('@/lib/activity-logger')
          await logActivity({
            type: 'RAPPEL',
            description: `RDV reprogrammé via Cal.com : ${title || 'RDV'}`,
            lead_id: lead.id,
            metadata: {
              source: 'calcom',
              event_type: 'BOOKING_RESCHEDULED',
              new_start_time: startTime,
              external_id: uid
            }
          })
        }

        logger.info('RDV rescheduled from Cal.com', {
          service: 'calcom-webhook',
          event: 'booking-rescheduled',
          uid,
          nouveauDate
        })
        break
      }

      case 'BOOKING_CANCELLED': {
        const { uid, attendees, title } = payload
        const email = attendees?.[0]?.email

        if (!email || !uid) break

        // Annuler le rappel associé
        const { createServiceSupabase } = await import('@/lib/supabase-server')
        const supabase = await createServiceSupabase()

        const { error } = await ((supabase as any)
          .from('rappels')
          .update({ statut: 'ANNULE' })
          .eq('metadata->external_id', uid))

        if (error) {
          console.error('[Cal.com Webhook] Erreur annulation rappel:', error)
        }

        // Logger l'activité
        const lead = await findLeadByEmail(email)
        if (lead) {
          const { logActivity } = await import('@/lib/activity-logger')
          await logActivity({
            type: 'RAPPEL',
            description: `RDV annulé via Cal.com : ${title || 'RDV'}`,
            lead_id: lead.id,
            metadata: {
              source: 'calcom',
              event_type: 'BOOKING_CANCELLED',
              external_id: uid
            }
          })
        }

        logger.info('RDV cancelled from Cal.com', {
          service: 'calcom-webhook',
          event: 'booking-cancelled',
          uid
        })
        break
      }

      case 'MEETING_ENDED': {
        const { attendees, title, uid } = payload
        const email = attendees?.[0]?.email

        if (!email) break

        const lead = await findLeadByEmail(email)
        if (!lead) break

        // Créer un rappel de suivi post-RDV (dans 2 heures)
        const suiviDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

        await createRappel({
          lead_id: lead.id,
          user_id: lead.commercial_assigne_id,
          date_rappel: suiviDate,
          type: 'SUIVI',
          titre: 'Suivi post-RDV',
          description: `Suivi après RDV "${title || 'RDV'}" - Relancer pour finaliser`,
          priorite: 'HAUTE',
          external_id: `${uid}-followup`
        })

        // Logger l'activité
        const { logActivity } = await import('@/lib/activity-logger')
        await logActivity({
          type: 'RAPPEL',
          description: `RDV terminé - suivi programmé : ${title || 'RDV'}`,
          lead_id: lead.id,
          metadata: {
            source: 'calcom',
            event_type: 'MEETING_ENDED',
            followup_scheduled: suiviDate,
            external_id: uid
          }
        })

        logger.info('Post-RDV followup created', {
          service: 'calcom-webhook',
          event: 'meeting-ended',
          leadId: lead.id,
          suiviDate
        })
        break
      }

      default:
        logger.warn('Unhandled Cal.com webhook event', {
          service: 'calcom-webhook',
          triggerEvent
        })
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Cal.com Webhook] Erreur:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
