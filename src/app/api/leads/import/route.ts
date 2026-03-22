// ============================================================
// CRM DERMOTEC — API Import CSV Leads
// POST /api/leads/import
// Reçoit un batch de leads, valide, dédoublonne, insère
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { logActivity } from '@/lib/activity-logger'
import { isDisposableEmail } from '@/lib/disposable-emails'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// --- Validation helpers ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_FR_RE = /^(?:0[1-9]|\+33[1-9])\d{8}$/

interface ImportLeadInput {
  nom: string
  prenom?: string
  email?: string
  telephone?: string
  entreprise_nom?: string
  ville?: string
  source?: string
}

interface ImportError {
  row: number
  error: string
}

function validateLead(lead: ImportLeadInput, rowIndex: number): ImportError | null {
  // Nom obligatoire
  if (!lead.nom || !lead.nom.trim()) {
    return { row: rowIndex, error: 'Nom manquant' }
  }

  // Email : format + pas jetable
  if (lead.email && lead.email.trim()) {
    const email = lead.email.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) {
      return { row: rowIndex, error: `Email invalide : ${email}` }
    }
    if (isDisposableEmail(email)) {
      return { row: rowIndex, error: `Email jetable non accepté : ${email}` }
    }
  }

  // Téléphone FR (optionnel mais validé si présent)
  if (lead.telephone && lead.telephone.trim()) {
    const cleaned = lead.telephone.replace(/[\s.\-()]/g, '')
    if (cleaned && !PHONE_FR_RE.test(cleaned)) {
      return { row: rowIndex, error: `Téléphone invalide : ${lead.telephone} (format FR attendu)` }
    }
  }

  return null
}

function sanitize(value: string | undefined): string {
  if (!value) return ''
  return value
    .trim()
    .replace(/<[^>]*>/g, '') // Strip HTML
    .replace(/[<>]/g, '')    // Extra safety
    .slice(0, 500)           // Max length
}

// --- Main handler ---

export async function POST(request: NextRequest) {
  // Auth obligatoire
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  try {
    // Vérifier le rôle (admin/manager uniquement)
    const { createServiceSupabase } = await import('@/lib/supabase-server')
    const supabase = await createServiceSupabase()

    const { data: equipe } = await (supabase as any)
      .from('equipe')
      .select('id, role, prenom, nom')
      .eq('auth_user_id', auth.user.id)
      .single()

    if (!equipe || !['admin', 'manager'].includes(equipe.role)) {
      return NextResponse.json(
        { error: 'Accès refusé. Rôle admin ou manager requis.' },
        { status: 403 }
      )
    }

    // Parser le body
    const body = await request.json()
    const { leads } = body as { leads: ImportLeadInput[] }

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'Tableau de leads requis et non vide' },
        { status: 400 }
      )
    }

    if (leads.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 leads par import' },
        { status: 400 }
      )
    }

    // Collecter les emails pour dédoublonnage en une seule requête
    const emailsToCheck = leads
      .map(l => l.email?.trim().toLowerCase())
      .filter((e): e is string => !!e && EMAIL_RE.test(e))

    const existingEmails = new Set<string>()
    if (emailsToCheck.length > 0) {
      // Requête par lots de 100
      for (let i = 0; i < emailsToCheck.length; i += 100) {
        const batch = emailsToCheck.slice(i, i + 100)
        const { data: existing } = await (supabase as any)
          .from('leads')
          .select('email')
          .in('email', batch)

        if (existing) {
          for (const lead of existing) {
            if (lead.email) existingEmails.add(lead.email.toLowerCase())
          }
        }
      }
    }

    // Traiter les leads
    let imported = 0
    let duplicates = 0
    const errors: ImportError[] = []
    const leadsToInsert: Record<string, unknown>[] = []

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i]
      const rowNumber = i + 1

      // Validation
      const validationError = validateLead(lead, rowNumber)
      if (validationError) {
        errors.push(validationError)
        continue
      }

      // Dédoublonnage par email
      const email = lead.email?.trim().toLowerCase()
      if (email && existingEmails.has(email)) {
        duplicates++
        continue
      }

      // Aussi dédoublonner au sein du batch lui-même
      if (email) {
        if (existingEmails.has(email)) {
          duplicates++
          continue
        }
        existingEmails.add(email)
      }

      // Nettoyer le téléphone
      const telephone = lead.telephone
        ? lead.telephone.replace(/[\s.\-()]/g, '')
        : null

      // Construire l'objet lead
      leadsToInsert.push({
        nom: sanitize(lead.nom),
        prenom: sanitize(lead.prenom) || null,
        email: email || null,
        telephone: telephone || null,
        entreprise_nom: sanitize(lead.entreprise_nom) || null,
        ville: sanitize(lead.ville) || null,
        source: 'autre' as const,
        statut: 'NOUVEAU',
        score_chaud: 0,
        priorite: 'NORMALE',
        nb_contacts: 0,
        financement_souhaite: false,
        tags: ['import-csv'],
        formations_interessees: [],
        data_sources: {},
        metadata: {
          imported_by: equipe.id,
          imported_at: new Date().toISOString(),
          original_source: sanitize(lead.source) || 'import-csv',
        },
      })
    }

    // Insertion par batch de 50
    const BATCH_SIZE = 50
    const insertedIds: string[] = []

    for (let i = 0; i < leadsToInsert.length; i += BATCH_SIZE) {
      const batch = leadsToInsert.slice(i, i + BATCH_SIZE)

      const { data: insertedBatch, error: insertError } = await (supabase as any)
        .from('leads')
        .insert(batch)
        .select('id, nom, email, ville')

      if (insertError) {
        console.error(`[Import CSV] Batch ${i / BATCH_SIZE + 1} error:`, insertError.message)
        // Compter les erreurs du batch
        for (let j = 0; j < batch.length; j++) {
          errors.push({
            row: i + j + 1,
            error: `Erreur insertion : ${insertError.message}`,
          })
        }
      } else {
        imported += insertedBatch?.length || batch.length
        if (insertedBatch) {
          for (const lead of insertedBatch) {
            insertedIds.push(lead.id)
          }
        }
      }
    }

    // Lancer l'auto-enrichissement Inngest pour les leads importés (non-bloquant)
    if (insertedIds.length > 0) {
      try {
        const { inngest } = await import('@/lib/inngest')
        // Envoyer les événements par batch (max 20 à la fois pour ne pas surcharger)
        const enrichBatch = insertedIds.slice(0, 20)
        await Promise.allSettled(
          enrichBatch.map(id =>
            inngest.send({
              name: 'lead.enrich',
              data: { lead_id: id },
            })
          )
        )
      } catch (err) {
        // Inngest non disponible en dev — pas grave
        console.warn('[Import CSV] Inngest auto-enrich skipped:', err)
      }
    }

    // Logger l'activité
    await logActivity({
      type: 'SYSTEME',
      description: `Import CSV : ${imported} leads importés (${duplicates} doublons, ${errors.length} erreurs)`,
      user_id: equipe.id,
      metadata: {
        imported,
        duplicates,
        errors_count: errors.length,
        total_submitted: leads.length,
      },
    })

    return NextResponse.json({
      imported,
      duplicates,
      errors,
    })
  } catch (error) {
    console.error('[Import CSV] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur interne lors de l\'import' },
      { status: 500 }
    )
  }
}
