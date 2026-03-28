// ============================================================
// CRM DERMOTEC — Envoyer une facture par email
// Resend + PDF URL + mise à jour statut → envoyee
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { logActivity, logEmailSent } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Charger la facture ──
    const { data: facture, error: factureErr } = await supabase
      .from('factures_formation')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (factureErr || !facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    if (facture.statut === 'annulee') {
      return NextResponse.json({ error: 'Impossible d\'envoyer une facture annulée' }, { status: 400 })
    }

    // ── Charger le lead pour l'email ──
    const email = facture.destinataire_email
    if (!email) {
      return NextResponse.json({ error: 'Aucun email destinataire sur cette facture' }, { status: 400 })
    }

    // ── Envoyer via Resend ──
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend non configuré' }, { status: 503 })
    }

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const typeLabel = facture.type === 'avoir' ? 'Avoir' : facture.type === 'proforma' ? 'Facture proforma' : 'Facture'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'

    const htmlContent = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1A1A1A, #333333); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #FF5C00; margin: 0; font-size: 24px;">Dermotec Advanced</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 5px 0 0; font-size: 13px;">Centre de Formation Esthétique — Certifié Qualiopi</p>
      </div>

      <div style="padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1A1A1A; margin: 0 0 20px;">${typeLabel} N° ${facture.numero_facture}</h2>

        <p style="color: #374151; line-height: 1.6;">
          Bonjour ${facture.destinataire_nom},
        </p>

        <p style="color: #374151; line-height: 1.6;">
          Veuillez trouver ci-dessous votre ${typeLabel.toLowerCase()} d'un montant de
          <strong>${(facture.montant_ttc || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € TTC</strong>.
        </p>

        <div style="background: #FAFAFA; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #777;">Référence</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold;">${facture.numero_facture}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #777;">Montant HT</td>
              <td style="padding: 5px 0; text-align: right;">${(facture.montant_ht || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
            </tr>
            ${facture.taux_tva > 0 ? `
            <tr>
              <td style="padding: 5px 0; color: #777;">TVA (${(facture.taux_tva * 100).toFixed(0)}%)</td>
              <td style="padding: 5px 0; text-align: right;">${(facture.montant_tva || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
            </tr>` : `
            <tr>
              <td style="padding: 5px 0; color: #777;">TVA</td>
              <td style="padding: 5px 0; text-align: right; font-style: italic;">Exonérée</td>
            </tr>`}
            <tr style="border-top: 2px solid #FF5C00;">
              <td style="padding: 10px 0 5px; color: #1A1A1A; font-weight: bold;">Total TTC</td>
              <td style="padding: 10px 0 5px; text-align: right; font-weight: bold; color: #FF5C00; font-size: 18px;">${(facture.montant_ttc || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
            </tr>
          </table>
        </div>

        <p style="color: #374151; line-height: 1.6;">
          <strong>Date d'échéance :</strong> ${facture.date_echeance ? new Date(facture.date_echeance).toLocaleDateString('fr-FR') : '30 jours'}
        </p>

        ${facture.conditions_paiement ? `<p style="color: #777; font-size: 13px;">${facture.conditions_paiement}</p>` : ''}
        ${facture.mentions ? `<p style="color: #777; font-size: 12px; font-style: italic;">${facture.mentions}</p>` : ''}

        ${facture.pdf_url ? `
        <div style="text-align: center; margin: 25px 0;">
          <a href="${facture.pdf_url}" style="background: #FF5C00; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Télécharger le PDF
          </a>
        </div>` : ''}

        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 25px 0;" />
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
          Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris<br/>
          SIRET : 123 456 789 00012 — Certifié Qualiopi
        </p>
      </div>
    </div>`

    const { error: sendErr } = await resend.emails.send({
      from: 'Dermotec <facturation@dermotec-advanced.fr>',
      to: [email],
      subject: `${typeLabel} N° ${facture.numero_facture} — Dermotec Advanced`,
      html: htmlContent,
    })

    if (sendErr) {
      return NextResponse.json({ error: `Erreur envoi email: ${sendErr.message}` }, { status: 500 })
    }

    // ── Mettre à jour statut → envoyee ──
    if (['brouillon', 'validee', 'emise'].includes(facture.statut)) {
      await supabase
        .from('factures_formation')
        .update({
          statut: 'envoyee',
          date_envoi: new Date().toISOString(),
          relance_count: (facture.relance_count || 0) + (facture.statut === 'envoyee' ? 1 : 0),
          derniere_relance: facture.statut === 'envoyee' ? new Date().toISOString() : facture.derniere_relance,
        })
        .eq('id', id)
    } else if (['en_retard', 'impayee'].includes(facture.statut)) {
      // Relance
      await supabase
        .from('factures_formation')
        .update({
          relance_count: (facture.relance_count || 0) + 1,
          derniere_relance: new Date().toISOString(),
        })
        .eq('id', id)
    }

    // Log activité
    const isRelance = ['envoyee', 'en_retard', 'impayee'].includes(facture.statut)
    if (facture.lead_id) {
      logEmailSent(facture.lead_id, `${typeLabel} ${facture.numero_facture}`, email, 'resend', user.id)
    }
    logActivity({
      type: 'DOCUMENT',
      description: `${isRelance ? 'Relance' : 'Envoi'} ${typeLabel.toLowerCase()} ${facture.numero_facture} → ${email}`,
      lead_id: facture.lead_id || undefined,
      user_id: user.id,
      metadata: { action: isRelance ? 'facture_relance' : 'facture_envoi', facture_id: id, email, relance_numero: facture.relance_count },
    })

    return NextResponse.json({ success: true, email_sent_to: email })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
