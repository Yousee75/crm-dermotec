import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase-client'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailRequest {
  to: string
  template_slug: string
  variables: Record<string, string>
  lead_id?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json()
    const { to, template_slug, variables, lead_id } = body

    // Validation
    if (!to || !template_slug) {
      return NextResponse.json(
        { error: 'Destinataire et template requis' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 1. Récupérer le template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('slug', template_slug)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: `Template '${template_slug}' non trouvé ou inactif` },
        { status: 404 }
      )
    }

    // 2. Remplacer les variables dans le contenu
    let sujet = template.sujet
    let contenuHtml = template.contenu_html
    let contenuText = template.contenu_text || ''

    // Remplacer {{variable}} par les valeurs
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      sujet = sujet.replace(pattern, value)
      contenuHtml = contenuHtml.replace(pattern, value)
      contenuText = contenuText.replace(pattern, value)
    }

    // 3. Envoyer l'email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Dermotec Formation <formation@dermotec.fr>',
      to,
      subject: sujet,
      html: contenuHtml,
      text: contenuText || undefined,
      // Headers pour tracking
      headers: {
        'X-Template-Slug': template_slug,
        'X-Lead-ID': lead_id || '',
      },
    })

    if (emailError) {
      console.error('Erreur Resend:', emailError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    // 4. Logger dans la table activités
    if (lead_id) {
      await supabase.from('activites').insert({
        type: 'EMAIL',
        lead_id,
        description: `Email envoyé: ${sujet}`,
        metadata: {
          template_slug,
          email_id: emailData?.id,
          destinataire: to,
          variables,
        },
      })
    }

    // 5. Optionnel: logger dans une table emails_sent
    await supabase.from('emails_sent').insert({
      template_id: template.id,
      template_slug,
      destinataire: to,
      sujet,
      lead_id,
      resend_id: emailData?.id,
      variables,
      statut: 'ENVOYE',
    }).catch(error => {
      // Table optionnelle, on ne fait pas échouer l'envoi
      console.warn('Impossible de logger dans emails_sent:', error)
    })

    return NextResponse.json({
      success: true,
      email_id: emailData?.id,
      message: 'Email envoyé avec succès',
      template_utilise: template.nom,
    })

  } catch (error) {
    console.error('Erreur API email/send:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// --- GET: Lister les templates disponibles ---
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorie = searchParams.get('categorie')

    const supabase = createClient()

    let query = supabase
      .from('email_templates')
      .select('id, nom, slug, sujet, variables, categorie')
      .eq('is_active', true)

    if (categorie) {
      query = query.eq('categorie', categorie)
    }

    const { data: templates, error } = await query.order('nom')

    if (error) {
      console.error('Erreur récupération templates:', error)
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
    console.error('Erreur API email/send GET:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}