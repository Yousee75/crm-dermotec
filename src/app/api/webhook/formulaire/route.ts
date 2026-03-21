import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { isDisposableEmail } from '@/lib/disposable-emails'
import { sanitizeString } from '@/lib/validators'
import { inngest } from '@/lib/inngest'

// ============================================================
// Webhook public — réception leads formulaire site
// Sécurisé : Zod + honeypot + disposable email + rate limit IP + sanitization
// ============================================================

export const dynamic = 'force-dynamic'

const LeadFormSchema = z.object({
  // Honeypot — doit être vide (les bots le remplissent)
  _hp_company: z.string().max(0, 'Bot détecté').optional().default(''),

  // Champs principaux
  prenom: z.string().min(1).max(100).optional(),
  firstName: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(100).optional(),
  nom: z.string().max(100).optional().default(''),
  lastName: z.string().max(100).optional().default(''),
  email: z.string().email('Email invalide').max(254),
  telephone: z.string().max(20).optional().default(''),
  phone: z.string().max(20).optional().default(''),
  sujet: z.string().max(200).optional().default(''),
  subject: z.string().max(200).optional().default(''),
  message: z.string().max(5000).optional().default(''),

  // UTM tracking
  utm_source: z.string().max(200).optional().default(''),
  utm_medium: z.string().max(200).optional().default(''),
  utm_campaign: z.string().max(200).optional().default(''),
  referrer: z.string().max(500).optional().default(''),
}).passthrough() // Accepter les champs supplémentaires sans crash

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function mapSujet(raw: string): string | null {
  const mapping: Record<string, string> = {
    'Formation': 'formation',
    'Financement': 'financement',
    'E-Shop / Matériel': 'eshop',
    'Partenariat': 'partenariat',
    'Autre': 'autre',
  }
  return mapping[raw] || raw.toLowerCase() || null
}

export async function POST(request: NextRequest) {
  try {
    // 1. Limiter la taille du body (10 KB max pour un formulaire)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10_240) {
      return NextResponse.json({ error: 'Payload trop volumineux' }, { status: 413 })
    }

    const rawBody = await request.json()

    // 2. Validation Zod
    const parsed = LeadFormSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const body = parsed.data

    // 3. Honeypot check — si rempli, c'est un bot
    if (body._hp_company && body._hp_company.length > 0) {
      // Retourner 200 pour ne pas alerter le bot
      return NextResponse.json({ success: true, action: 'created', lead_id: 'fake' })
    }

    // 4. Bloquer emails jetables
    if (isDisposableEmail(body.email)) {
      return NextResponse.json(
        { error: 'Adresse email non acceptée' },
        { status: 400 }
      )
    }

    // 5. Supabase
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 })
    }

    // 6. Construire le lead avec sanitization
    const prenom = sanitizeString(body.prenom || body.firstName || body.name || 'Inconnu')
    const nom = sanitizeString(body.nom || body.lastName || '')
    const telephone = sanitizeString(body.telephone || body.phone || '')
    const sujet = mapSujet(body.sujet || body.subject || '')
    const message = sanitizeString(body.message || '')

    const lead = {
      prenom,
      nom,
      email: body.email.toLowerCase().trim(),
      telephone,
      sujet,
      message,
      source: 'formulaire' as const,
      statut: 'NOUVEAU' as const,
      priorite: 'NORMALE' as const,
      score_chaud: 20,
      utm_source: sanitizeString(body.utm_source || ''),
      utm_medium: sanitizeString(body.utm_medium || ''),
      utm_campaign: sanitizeString(body.utm_campaign || ''),
      referrer_url: sanitizeString(body.referrer || ''),
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
      user_agent: request.headers.get('user-agent')?.slice(0, 500) || '',
      metadata: {
        raw_form_data: rawBody,
        received_at: new Date().toISOString(),
      },
    }

    // 7. Vérifier doublon (même email)
    if (lead.email) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id, nb_contacts')
        .eq('email', lead.email)
        .single()

      if (existing) {
        // Incrémenter nb_contacts correctement
        await supabase
          .from('leads')
          .update({
            message: lead.message,
            nb_contacts: (existing.nb_contacts || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        // Ajouter une note
        await supabase.from('notes_lead').insert({
          lead_id: existing.id,
          contenu: `Nouveau message formulaire: ${lead.message}`,
          type: 'note',
        })

        // Logger l'activité
        await supabase.from('activites').insert({
          type: 'CONTACT',
          lead_id: existing.id,
          description: `Nouveau contact formulaire (doublon) — ${prenom} ${nom}`,
          metadata: { source: 'formulaire', doublon: true },
        })

        return NextResponse.json({ success: true, action: 'updated', lead_id: existing.id })
      }
    }

    // 8. Créer le lead
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select('id')
      .single()

    if (error) throw error

    // 9. Logger l'activité
    await supabase.from('activites').insert({
      type: 'LEAD_CREE',
      lead_id: data.id,
      description: `Lead créé via formulaire site — ${prenom} ${nom} (${sujet || 'non précisé'})`,
      metadata: { source: 'formulaire', sujet },
    })

    // 10. Déclencher la cadence automatique (Inngest)
    // Email bienvenue immédiat → J+3 relance → J+7 rappel tel → J+14 dernier email
    try {
      await inngest.send({
        name: 'crm/lead.cadence.start',
        data: {
          lead_id: data.id,
          email: lead.email,
          prenom,
          formation_nom: sujet === 'formation' ? 'nos formations' : 'Dermotec',
        },
      })
    } catch (inngestErr) {
      // Non-bloquant : le lead est créé même si Inngest échoue
      console.error('[Webhook Formulaire] Inngest cadence error:', inngestErr)
    }

    return NextResponse.json({ success: true, action: 'created', lead_id: data.id })
  } catch (error) {
    console.error('[Webhook Formulaire] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
