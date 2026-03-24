import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Webhook DocuSeal — reçoit les événements de signature
 * Configurer dans DocuSeal : Settings > Webhooks > URL = https://crm-dermotec.vercel.app/api/docuseal/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_type, data } = body

    logger.info('DocuSeal webhook event received', {
      service: 'docuseal-webhook',
      eventType: event_type,
      dataSize: JSON.stringify(data).length
    })

    // Helper pour trouver un lead par email
    async function findLeadByEmail(email: string) {
      const { createServiceSupabase } = await import('@/lib/supabase-server')
      const supabase = await createServiceSupabase()

      const { data: lead, error } = await (supabase
        .from('leads')
        .select('id, prenom, nom, email, commercial_assigne_id')
        .eq('email', email)
        .single() as any)

      if (error && error.code !== 'PGRST116') {
        logger.error('DocuSeal webhook error: lead search failed', {
          service: 'docuseal-webhook',
          error
        })
      }
      return lead
    }

    // Helper pour trouver une inscription par email ou ID
    async function findInscription(email?: string, submissionId?: string) {
      const { createServiceSupabase } = await import('@/lib/supabase-server')
      const supabase = await createServiceSupabase()

      let query = supabase.from('inscriptions').select('id, lead_id, formation_id, lead:leads(prenom, nom, email)')

      if (email) {
        // Chercher par email via la relation lead
        const { data, error } = await (query as any)
        if (error) {
          logger.error('DocuSeal webhook error: inscription search failed', {
          service: 'docuseal-webhook',
          error
        })
          return null
        }
        return data?.find((ins: any) => ins.lead?.email === email) || null
      }

      return null
    }

    switch (event_type) {
      case 'submission.completed': {
        // Un document complet a été signé par tous les participants
        const { id: submissionId, template, submitters } = data

        // Récupérer les infos du premier signataire (prospect/stagiaire)
        const mainSubmitter = submitters?.find((s: any) => s.role !== 'admin') || submitters?.[0]
        const email = mainSubmitter?.email

        if (!email) {
          logger.warn('DocuSeal webhook: no submitter email, skipping', {
            service: 'docuseal-webhook'
          })
          break
        }

        // Trouver le lead et l'inscription
        const lead = await findLeadByEmail(email)
        const inscription = await findInscription(email)

        // Mettre à jour le statut du document dans le CRM
        const { createServiceSupabase } = await import('@/lib/supabase-server')
        const supabase = await createServiceSupabase()

        // Créer ou mettre à jour l'entrée dans la table documents
        const documentData = {
          lead_id: lead?.id || null,
          inscription_id: inscription?.id || null,
          type: template?.name?.toLowerCase().includes('convention') ? 'convention' : 'autre',
          filename: `${template?.name || 'Document'}_signé.pdf`,
          storage_path: `documents/${submissionId}/signed.pdf`, // Path virtuel, le PDF est chez DocuSeal
          mime_type: 'application/pdf',
          description: `Document DocuSeal signé : ${template?.name || 'Document'}`,
          is_signed: true,
          metadata: {
            source: 'docuseal',
            submission_id: submissionId,
            template_name: template?.name,
            signed_at: new Date().toISOString()
          }
        }

        const { error: docError } = await (supabase.from('documents').insert(documentData) as any)
        if (docError) {
          logger.error('DocuSeal webhook error: document creation failed', {
            service: 'docuseal-webhook',
            error: docError
          })
        }

        // Stocker le PDF signé dans Supabase Storage (optionnel, nécessite l'API DocuSeal)
        try {
          // NOTE: Pour télécharger le PDF, il faudrait faire un appel à l'API DocuSeal
          // avec la clé API et l'ID du submission pour récupérer le fichier signé
          // Ce code est commenté car nécessite la configuration de l'API DocuSeal

          /*
          const response = await fetch(`${process.env.DOCUSEAL_API_URL}/submissions/${submissionId}/download`, {
            headers: {
              'X-Auth-Token': process.env.DOCUSEAL_API_KEY!
            }
          })

          if (response.ok) {
            const pdfBuffer = await response.arrayBuffer()
            const fileName = `${submissionId}_signed.pdf`

            const { error: uploadError } = await supabase.storage
              .from('documents')
              .upload(`signed/${fileName}`, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
              })

            if (uploadError) {
              logger.error('DocuSeal webhook error: storage upload failed', {
                service: 'docuseal-webhook',
                error: uploadError
              })
            } else {
              // Mettre à jour le storage_path avec le vrai chemin
              await supabase.from('documents')
                .update({ storage_path: `signed/${fileName}` })
                .eq('metadata->submission_id', submissionId)
            }
          }
          */
        } catch (storageErr) {
          logger.error('DocuSeal webhook error: storage operation failed', {
            service: 'docuseal-webhook',
            error: storageErr
          })
        }

        // Logger l'activité
        if (lead) {
          const { logDocumentSigned } = await import('@/lib/activity-logger')
          await logDocumentSigned(
            lead.id,
            template?.name || 'Document DocuSeal',
            inscription?.id
          )
        }

        logger.info('Document signed and processed', {
          service: 'docuseal-webhook',
          event: 'submission-completed',
          submissionId,
          leadId: lead?.id,
          inscriptionId: inscription?.id
        })
        break
      }

      case 'submitter.completed': {
        // Un signataire individuel a terminé sa signature
        const { submission, submitter } = data
        const email = submitter?.email

        if (!email) break

        const lead = await findLeadByEmail(email)

        if (lead) {
          const { logActivity } = await import('@/lib/activity-logger')
          await logActivity({
            type: 'DOCUMENT',
            description: `Signature terminée par ${submitter?.name || email} - ${submission?.template?.name || 'Document'}`,
            lead_id: lead.id,
            metadata: {
              source: 'docuseal',
              event_type: 'submitter.completed',
              submission_id: submission?.id,
              submitter_email: email,
              template_name: submission?.template?.name
            }
          })
        }

        logger.info('Submitter completed signing', {
          service: 'docuseal-webhook',
          event: 'submitter-completed',
          submissionId: submission?.id,
          submitterEmail: email,
          leadId: lead?.id
        })
        break
      }

      case 'submission.created': {
        // Un nouveau document a été envoyé pour signature
        const { id: submissionId, template, submitters } = data

        // Récupérer le premier signataire prospect
        const mainSubmitter = submitters?.find((s: any) => s.role !== 'admin') || submitters?.[0]
        const email = mainSubmitter?.email

        if (!email) break

        const lead = await findLeadByEmail(email)

        if (lead) {
          const { logActivity } = await import('@/lib/activity-logger')
          await logActivity({
            type: 'DOCUMENT',
            description: `Document envoyé pour signature : ${template?.name || 'Document DocuSeal'}`,
            lead_id: lead.id,
            metadata: {
              source: 'docuseal',
              event_type: 'submission.created',
              submission_id: submissionId,
              recipient_email: email,
              template_name: template?.name
            }
          })
        }

        logger.info('Document created for signing', {
          service: 'docuseal-webhook',
          event: 'submission-created',
          submissionId,
          recipientEmail: email,
          leadId: lead?.id
        })
        break
      }

      default:
        logger.warn('Unhandled DocuSeal webhook event', {
          service: 'docuseal-webhook',
          eventType: event_type
        })
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    logger.error('DocuSeal webhook error: unexpected error', {
      service: 'docuseal-webhook',
      error: err.message || err
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
