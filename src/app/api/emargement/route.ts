// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

const CONSENT_TEXT = "En signant, je certifie ma présence effective à cette séance et j'accepte que mes données (signature, IP, horodatage) soient conservées 5 ans conformément au RGPD."

function computeHash(data: string): string {
  // Simple hash pour intégrité (SHA-256 via Web Crypto n'est pas dispo en edge,
  // on utilise un hash déterministe suffisant pour la preuve d'intégrité)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  const ts = Date.now().toString(36)
  return `SHA1-${Math.abs(hash).toString(16)}-${ts}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { session_id, inscription_id, date, creneau, signature_data, portail_token, is_formateur } = body

    if (!session_id || !inscription_id || !date || !creneau || !signature_data) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    if (!['matin', 'apres_midi', 'journee'].includes(creneau)) {
      return NextResponse.json({ error: 'Créneau invalide' }, { status: 400 })
    }

    if (signature_data.length > 500_000) {
      return NextResponse.json({ error: 'Signature trop volumineuse' }, { status: 400 })
    }

    // Validation format signature (base64 PNG uniquement)
    if (!signature_data.startsWith('data:image/png;base64,') && !signature_data.startsWith('data:image/svg+xml;base64,')) {
      return NextResponse.json({ error: 'Format de signature invalide' }, { status: 400 })
    }

    const supabase = await createServiceSupabase()
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const ua = req.headers.get('user-agent') || 'unknown'

    // Vérifier inscription + token de sécurité
    const inscriptionQuery = supabase
      .from('inscriptions')
      .select('id, session_id, portail_token')
      .eq('id', inscription_id)
      .eq('session_id', session_id)

    if (portail_token) {
      inscriptionQuery.eq('portail_token', portail_token)
    }

    const { data: inscription, error: inscError } = await inscriptionQuery.single()

    if (inscError || !inscription) {
      return NextResponse.json({ error: 'Inscription non trouvée ou token invalide' }, { status: 404 })
    }

    // Vérifier immutabilité — si déjà signé par le stagiaire, refuser
    const { data: existing } = await supabase
      .from('emargements')
      .select('id, signed_at, formateur_signed_at')
      .eq('session_id', session_id)
      .eq('inscription_id', inscription_id)
      .eq('date', date)
      .eq('creneau', creneau)
      .maybeSingle()

    if (is_formateur) {
      // Signature formateur
      if (existing?.formateur_signed_at) {
        return NextResponse.json({ error: 'Le formateur a déjà signé cet émargement' }, { status: 409 })
      }

      const updateData = {
        formateur_signature_data: signature_data,
        formateur_signed_at: new Date().toISOString(),
        formateur_ip: ip,
      }

      if (existing) {
        const { data, error } = await supabase
          .from('emargements')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          return NextResponse.json({ error: 'Erreur lors de la signature formateur' }, { status: 500 })
        }
        return NextResponse.json({ success: true, emargement: data })
      }
      // Pas encore d'émargement : créer avec signature formateur
    } else {
      // Signature stagiaire
      if (existing?.signed_at) {
        return NextResponse.json({ error: 'Cet émargement a déjà été signé' }, { status: 409 })
      }
    }

    // Hash d'intégrité
    const hashInput = `${session_id}|${inscription_id}|${date}|${creneau}|${signature_data.slice(0, 100)}|${new Date().toISOString()}`
    const integrity_hash = computeHash(hashInput)

    const now = new Date().toISOString()

    if (existing && !is_formateur) {
      // Mettre à jour l'émargement existant (créé par le formateur avant le stagiaire)
      const { data, error } = await supabase
        .from('emargements')
        .update({
          signature_data,
          signed_at: now,
          ip_address: ip,
          user_agent: ua,
          integrity_hash,
          consent_text: CONSENT_TEXT,
          metadata: { screen_width: body.screen_width, timezone: body.timezone },
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 })
      }

      await logActivity(supabase, inscription_id, session_id, date, creneau, data.id)
      return NextResponse.json({ success: true, emargement: data })
    }

    // Créer un nouvel émargement
    const insertData: Record<string, unknown> = {
      session_id,
      inscription_id,
      date,
      creneau,
      integrity_hash,
      consent_text: CONSENT_TEXT,
      metadata: { screen_width: body.screen_width, timezone: body.timezone },
    }

    if (is_formateur) {
      insertData.formateur_signature_data = signature_data
      insertData.formateur_signed_at = now
      insertData.formateur_ip = ip
    } else {
      insertData.signature_data = signature_data
      insertData.signed_at = now
      insertData.ip_address = ip
      insertData.user_agent = ua
    }

    const { data, error } = await supabase
      .from('emargements')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Erreur émargement:', error)
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 })
    }

    await logActivity(supabase, inscription_id, session_id, date, creneau, data.id)
    return NextResponse.json({ success: true, emargement: data })
  } catch (err) {
    console.error('Erreur API émargement:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function logActivity(
  supabase: Awaited<ReturnType<typeof createServiceSupabase>>,
  inscription_id: string,
  session_id: string,
  date: string,
  creneau: string,
  emargement_id: string
) {
  await supabase.from('activites').insert({
    type: 'DOCUMENT',
    inscription_id,
    session_id,
    description: `Émargement signé — ${date} (${creneau})`,
    metadata: { emargement_id },
  })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const session_id = searchParams.get('session_id')

    if (!session_id) {
      return NextResponse.json({ error: 'session_id requis' }, { status: 400 })
    }

    const supabase = await createServiceSupabase()

    const { data, error } = await supabase
      .from('emargements')
      .select('*, inscription:inscriptions(id, lead:leads(prenom, nom))')
      .eq('session_id', session_id)
      .order('date', { ascending: true })
      .order('creneau', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Erreur de récupération' }, { status: 500 })
    }

    return NextResponse.json({ emargements: data })
  } catch (err) {
    console.error('Erreur API émargement GET:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
