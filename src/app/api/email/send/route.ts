// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@supabase/ssr'
import { isDisposableEmail } from '@/lib/disposable-emails'
import { sanitizeString } from '@/lib/validators'
import { createServiceSupabase } from '@/lib/supabase-server'

// ============================================================
// API Email — Envoi via templates
// Sécurisé : Auth obligatoire + sanitization XSS variables
// ============================================================

export const dynamic = 'force-dynamic'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[Email API] RESEND_API_KEY manquante')
    return null
  }
  return new Resend(key)
}

// Vérifier l'auth via cookies Supabase
async function getAuthUser(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll() {
        // Read-only dans API route
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Sanitize les variables de template pour prévenir XSS
function sanitizeVariables(variables: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {}
  for (const [key, value] of Object.entries(variables)) {
    // Échapper le HTML dans les valeurs injectées
    sanitized[key] = String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .slice(0, 1000)
  }
  return sanitized
}

interface EmailRequest {
  to: string
  template_slug: string
  variables: Record<string, string>
  lead_id?: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    // Mode démo : skip auth
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    let user: { id: string; email?: string } | null = null
    if (!isDemoMode) {
      user = await getAuthUser(request)
      if (!user) {
        return NextResponse.json(
          { error: 'Authentification requise' },
          { status: 401 }
        )
      }
    }

    const body: EmailRequest = await request.json()
    const { to, template_slug, variables, lead_id } = body

    // 2. Validation
    if (!to || !template_slug) {
      return NextResponse.json(
        { error: 'Destinataire et template requis' },
        { status: 400 }
      )
    }

    // 3. Anti-spam : bloquer emails jetables
    if (isDisposableEmail(to)) {
      return NextResponse.json(
        { error: 'Adresse email non acceptée' },
        { status: 400 }
      )
    }

    const supabase = await createServiceSupabase()

    // 4. Récupérer le template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('slug', template_slug)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: `Template '${sanitizeString(template_slug)}' non trouvé ou inactif` },
        { status: 404 }
      )
    }

    // 5. Sanitize les variables avant injection dans le HTML
    const safeVars = sanitizeVariables(variables || {})

    // 6. Remplacer les variables dans le contenu
    let sujet = template.sujet
    let contenuHtml = template.contenu_html
    let contenuText = template.contenu_text || ''

    for (const [key, value] of Object.entries(safeVars)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      sujet = sujet.replace(pattern, value)
      contenuHtml = contenuHtml.replace(pattern, value)
      contenuText = contenuText.replace(pattern, value)
    }

    // 7. Envoyer l'email via Resend
    const resend = getResend()
    if (!resend) {
      return NextResponse.json(
        { error: 'Service email non configuré' },
        { status: 503 }
      )
    }

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Dermotec Formation <formation@dermotec.fr>',
      to,
      subject: sujet,
      html: contenuHtml,
      text: contenuText || undefined,
      headers: {
        'X-Template-Slug': template_slug,
        'X-Lead-ID': lead_id || '',
      },
    })

    if (emailError) {
      console.error('[Email API] Resend error:', emailError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    // 8. Logger dans activités (non-bloquant)
    if (lead_id) {
      supabase.from('activites').insert({
        type: 'EMAIL',
        lead_id,
        user_id: user?.id || null,
        description: `Email envoyé: ${sujet}`,
        metadata: {
          template_slug,
          email_id: emailData?.id,
          destinataire: to,
          sent_by: user?.email || 'demo',
        },
      }).then(({ error: actErr }) => {
        if (actErr) console.warn('[Email API] Activity log failed:', actErr.message)
      })
    }

    // 9. Logger dans emails_sent (non-bloquant)
    supabase.from('emails_sent').insert({
      template_id: template.id,
      template_slug,
      destinataire: to,
      sujet,
      lead_id: lead_id || null,
      resend_id: emailData?.id,
      variables: safeVars,
      statut: 'ENVOYE',
    }).then(({ error: insertError }) => {
      if (insertError) console.warn('[Email API] emails_sent insert failed:', insertError.message)
    })

    return NextResponse.json({
      success: true,
      email_id: emailData?.id,
      message: 'Email envoyé avec succès',
      template_utilise: template.nom,
    })

  } catch (error) {
    console.error('[Email API] Error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// --- GET: Lister les templates disponibles (auth requise) ---
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'auth
    // Mode démo : skip auth
    const isDemoModeGet = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    if (!isDemoModeGet) {
      const user = await getAuthUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const categorie = searchParams.get('categorie')

    const supabase = getServiceSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 })
    }

    let query = supabase
      .from('email_templates')
      .select('id, nom, slug, sujet, variables, categorie')
      .eq('is_active', true)

    if (categorie) {
      query = query.eq('categorie', categorie)
    }

    const { data: templates, error } = await query.order('nom')

    if (error) {
      console.error('[Email API] Templates fetch error:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      templates: templates || [],
      total: templates?.length || 0,
    })

  } catch (error) {
    console.error('[Email API] GET error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
