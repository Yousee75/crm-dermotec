import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBienvenueEmail, sendRappelNotification } from '@/lib/email'
import { sendSMS, sendWhatsApp } from '@/lib/twilio'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Sécurité : CRON_SECRET requis
function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '')
  return secret === process.env.CRON_SECRET
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// POST /api/cadence/run — Exécuter les cadences actives
// Appelé par Vercel Cron toutes les heures
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'DB non configurée' }, { status: 503 })
  }

  const now = new Date()
  const results = { processed: 0, emails: 0, sms: 0, whatsapp: 0, rappels: 0, errors: 0 }

  try {
    // 1. Récupérer les cadence_instances actives avec prochaine action <= now
    const { data: instances, error } = await supabase
      .from('cadence_instances')
      .select(`
        *,
        template:cadence_templates(*),
        lead:leads(id, prenom, nom, email, telephone, whatsapp, statut, formation_principale_id, commercial_assigne_id,
          formation_principale:formations(nom),
          commercial_assigne:equipe(id, email, telephone)
        )
      `)
      .eq('statut', 'ACTIVE')
      .lte('prochaine_action', now.toISOString())
      .limit(50)

    if (error) {
      console.error('[Cadence] Query error:', error)
      return NextResponse.json({ error: 'Erreur DB' }, { status: 500 })
    }

    if (!instances?.length) {
      return NextResponse.json({ message: 'Aucune cadence à traiter', results })
    }

    for (const instance of instances) {
      try {
        const etapes = instance.template?.etapes as Array<{
          jour: number
          type: string
          titre: string
          moment?: string
        }>

        if (!etapes || instance.etape_actuelle >= etapes.length) {
          // Cadence terminée
          await supabase
            .from('cadence_instances')
            .update({ statut: 'COMPLETEE' })
            .eq('id', instance.id)
          continue
        }

        const etape = etapes[instance.etape_actuelle]
        const lead = instance.lead

        if (!lead || lead.statut === 'PERDU' || lead.statut === 'SPAM') {
          // Lead perdu — arrêter la cadence
          await supabase
            .from('cadence_instances')
            .update({ statut: 'ANNULEE' })
            .eq('id', instance.id)
          continue
        }

        // Exécuter l'étape selon le type
        let executed = false

        switch (etape.type) {
          case 'EMAIL':
            if (lead.email) {
              await sendBienvenueEmail({
                to: lead.email,
                prenom: lead.prenom,
                formation_nom: lead.formation_principale?.nom,
              })
              results.emails++
              executed = true
            }
            break

          case 'SMS':
            if (lead.telephone) {
              await sendSMS(lead.telephone, `Bonjour ${lead.prenom}, ${etape.titre}. L'équipe Dermotec — 01 88 33 43 43`)
              results.sms++
              executed = true
            }
            break

          case 'WHATSAPP':
            if (lead.whatsapp || lead.telephone) {
              await sendWhatsApp(
                lead.whatsapp || lead.telephone,
                `Bonjour ${lead.prenom} 👋 ${etape.titre}. N'hésitez pas à nous répondre ici ! — Dermotec`
              )
              results.whatsapp++
              executed = true
            }
            break

          case 'APPEL':
          case 'RDV':
            // Créer un rappel pour le commercial
            await supabase.from('rappels').insert({
              lead_id: lead.id,
              user_id: lead.commercial_assigne_id || null,
              date_rappel: now.toISOString(),
              type: etape.type === 'RDV' ? 'RDV' : 'APPEL',
              statut: 'EN_ATTENTE',
              priorite: 'HAUTE',
              titre: etape.titre,
              description: `Cadence auto : ${instance.template?.nom} — Étape ${instance.etape_actuelle + 1}`,
            })

            // Notifier le commercial par email
            if (lead.commercial_assigne?.email) {
              await sendRappelNotification({
                to: lead.commercial_assigne.email,
                prenom_lead: `${lead.prenom} ${lead.nom || ''}`,
                type_rappel: etape.type,
                description: etape.titre,
              })
            }

            results.rappels++
            executed = true
            break
        }

        if (executed) {
          // Calculer la prochaine action
          const nextEtapeIndex = instance.etape_actuelle + 1
          const nextEtape = etapes[nextEtapeIndex]

          const historique = [...(instance.historique || []), {
            etape: instance.etape_actuelle,
            type: etape.type,
            titre: etape.titre,
            date: now.toISOString(),
            success: true,
          }]

          if (nextEtape) {
            const nextDate = new Date(instance.created_at)
            nextDate.setDate(nextDate.getDate() + nextEtape.jour)

            // Ajuster le moment (MATIN = 9h, APREM = 14h)
            if (nextEtape.moment === 'MATIN') nextDate.setHours(9, 0, 0)
            else if (nextEtape.moment === 'APREM') nextDate.setHours(14, 0, 0)

            await supabase
              .from('cadence_instances')
              .update({
                etape_actuelle: nextEtapeIndex,
                prochaine_action: nextDate.toISOString(),
                historique,
              })
              .eq('id', instance.id)
          } else {
            // Dernière étape — terminer
            await supabase
              .from('cadence_instances')
              .update({
                etape_actuelle: nextEtapeIndex,
                statut: 'COMPLETEE',
                historique,
              })
              .eq('id', instance.id)
          }

          // Logger l'activité
          await supabase.from('activites').insert({
            type: 'SYSTEME',
            lead_id: lead.id,
            description: `Cadence "${instance.template?.nom}" — ${etape.type}: ${etape.titre}`,
            metadata: { cadence_id: instance.id, etape: instance.etape_actuelle, type: etape.type },
          })

          results.processed++
        }
      } catch (err) {
        console.error(`[Cadence] Error processing instance ${instance.id}:`, err)
        results.errors++
      }
    }

    console.log('[Cadence] Run complete:', results)
    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('[Cadence] Fatal error:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
