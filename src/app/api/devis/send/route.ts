// ============================================================
// CRM DERMOTEC — Envoyer un devis par email
// Resend + PDF en pièce jointe + lien de paiement Stripe
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Auth obligatoire
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const { devis_id } = body

    if (!devis_id) {
      return NextResponse.json({ error: 'devis_id requis' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupérer le devis
    const { data: devis, error: devisErr } = await supabase
      .from('devis')
      .select('*')
      .eq('id', devis_id)
      .single()

    if (devisErr || !devis) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Récupérer le lead
    const { data: lead } = await supabase
      .from('leads')
      .select('nom, prenom, email, telephone, entreprise')
      .eq('id', devis.lead_id)
      .single()

    if (!lead?.email) {
      return NextResponse.json({ error: 'Le prospect n\'a pas d\'email' }, { status: 400 })
    }

    // Envoyer l'email via Resend
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend non configuré' }, { status: 503 })
    }

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const devisRef = devis.id.slice(0, 8).toUpperCase()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'

    const htmlContent = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1A1A1A, #333333); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #FF5C00; margin: 0; font-size: 24px;">Dermotec Advanced</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 5px 0 0; font-size: 13px;">Centre de Formation Esthétique — Certifié Qualiopi</p>
      </div>

      <div style="padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1A1A1A; margin: 0 0 20px;">Votre devis N° ${devisRef}</h2>

        <p style="color: #374151; line-height: 1.6;">
          Bonjour ${lead.prenom || lead.nom || 'Madame, Monsieur'},
        </p>

        <p style="color: #374151; line-height: 1.6;">
          Suite à notre échange, veuillez trouver ci-dessous votre devis pour la formation <strong>${devis.formation_nom}</strong>.
        </p>

        <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">Formation</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1A1A1A;">${devis.formation_nom}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">Montant HT</td>
              <td style="padding: 8px 0; text-align: right; color: #1A1A1A;">${devis.montant_ht} €</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">TVA (20%)</td>
              <td style="padding: 8px 0; text-align: right; color: #1A1A1A;">${devis.montant_tva} €</td>
            </tr>
            <tr style="border-top: 2px solid #FF5C00;">
              <td style="padding: 12px 0; font-weight: 700; color: #1A1A1A; font-size: 16px;">Total TTC</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #FF5C00; font-size: 16px;">${devis.montant_ttc} €</td>
            </tr>
            ${devis.financement_montant > 0 ? `
            <tr>
              <td style="padding: 8px 0; color: #22C55E;">Prise en charge (${devis.financement_type})</td>
              <td style="padding: 8px 0; text-align: right; color: #22C55E;">-${devis.financement_montant} €</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #1A1A1A;">Reste à charge</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1A1A1A;">${devis.reste_a_charge} €</td>
            </tr>` : ''}
          </table>
        </div>

        ${devis.stripe_payment_link ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${devis.stripe_payment_link}" style="background: #FF5C00; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
            Procéder au paiement →
          </a>
        </div>` : ''}

        <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
          Ce devis est valable ${devis.validite_jours} jours. Passé ce délai, les tarifs peuvent être modifiés.
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 12px; margin: 0;">
            Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris<br/>
            Tél : 01 88 33 43 43 — contact@dermotec.fr<br/>
            Organisme de formation certifié Qualiopi
          </p>
        </div>
      </div>
    </div>`

    const { error: emailErr } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Dermotec Formation <contact@dermotec.fr>',
      to: lead.email,
      subject: `Devis N° ${devisRef} — Formation ${devis.formation_nom}`,
      html: htmlContent,
    })

    if (emailErr) {
      console.error('[Devis] Email error:', emailErr)
      return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
    }

    // Mettre à jour le statut
    await supabase
      .from('devis')
      .update({ statut: 'envoye', sent_at: new Date().toISOString() })
      .eq('id', devis_id)

    // Logger l'activité
    await supabase.from('activites').insert({
      lead_id: devis.lead_id,
      type: 'EMAIL',
      description: `Devis N° ${devisRef} envoyé par email à ${lead.email}`,
      metadata: { devis_id, email: lead.email },
    })

    return NextResponse.json({ success: true, sentTo: lead.email })
  } catch (err) {
    console.error('[Devis] Send error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
