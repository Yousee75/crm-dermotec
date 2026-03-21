import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Webhook public (pas d'auth) — reçoit les leads du formulaire site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Mapper les champs du formulaire
    const lead = {
      prenom: body.prenom || body.firstName || body.name || 'Inconnu',
      nom: body.nom || body.lastName || '',
      email: body.email || '',
      telephone: body.telephone || body.phone || '',
      sujet: mapSujet(body.sujet || body.subject || ''),
      message: body.message || '',
      source: 'formulaire' as const,
      statut: 'NOUVEAU' as const,
      priorite: 'NORMALE' as const,
      score_chaud: 20, // Score initial
      // UTM tracking
      utm_source: body.utm_source || '',
      utm_medium: body.utm_medium || '',
      utm_campaign: body.utm_campaign || '',
      referrer_url: body.referrer || '',
      // Metadata
      ip_address: request.headers.get('x-forwarded-for') || '',
      user_agent: request.headers.get('user-agent') || '',
      metadata: {
        raw_form_data: body,
        received_at: new Date().toISOString(),
      },
    }

    // Vérifier doublon (même email ou téléphone)
    if (lead.email) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('email', lead.email)
        .single()

      if (existing) {
        // Mettre à jour le lead existant avec le nouveau message
        await supabase
          .from('leads')
          .update({
            message: lead.message,
            nb_contacts: existing.id ? 1 : 0, // sera incrémenté
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        // Ajouter une note
        await supabase.from('notes_lead').insert({
          lead_id: existing.id,
          contenu: `Nouveau message formulaire: ${lead.message}`,
          type: 'note',
        })

        return NextResponse.json({ success: true, action: 'updated', lead_id: existing.id })
      }
    }

    // Créer le lead
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select('id')
      .single()

    if (error) throw error

    // Logger l'activité
    await supabase.from('activites').insert({
      type: 'LEAD_CREE',
      lead_id: data.id,
      description: `Lead créé via formulaire site — ${lead.prenom} ${lead.nom} (${lead.sujet || 'non précisé'})`,
      metadata: { source: 'formulaire', sujet: lead.sujet },
    })

    return NextResponse.json({ success: true, action: 'created', lead_id: data.id })
  } catch (error) {
    console.error('Webhook formulaire error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
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
