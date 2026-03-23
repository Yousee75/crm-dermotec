// ============================================================
// Inngest Function: Relance automatique intelligente des leads
// Cron : Chaque jour à 9h (Europe/Paris)
// Identifie les leads à relancer et génère des messages personnalisés via IA
// ============================================================

import { inngest } from '@/lib/inngest'

function getSupabase() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

interface LeadToRelance {
  id: string
  nom: string
  prenom: string
  email: string
  statut: string
  score: number
  formation_interesse: string
  derniere_activite: string
  daysSinceLastActivity?: number
  created_at: string
  phone: string
  context?: string
}

export const smartRelance = inngest.createFunction(
  {
    id: 'crm-smart-relance',
    retries: 3,
    triggers: [{ cron: 'TZ=Europe/Paris 0 9 * * *' }], // Chaque jour 9h
  },
  async ({ step }: { step: any }) => {
    // ============================================
    // STEP 1 : Identifier les leads à relancer
    // ============================================
    const leadsToRelance = await step.run('find-leads-to-relance', async () => {
      const supabase = getSupabase()
      const now = new Date()

      // Critères de relance
      const dateRanges = {
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        fiveDays: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        threeDays: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        twoDays: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      }

      // Requête complexe avec critères multiples
      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          id, nom, prenom, email, phone, statut, score, formation_interesse,
          derniere_activite, created_at,
          formations:formations!leads_formation_principale_id_fkey(nom, duree, prix),
          activites:activites!activites_lead_id_fkey(created_at, type)
        `)
        .not('statut', 'in', '("PERDU","SPAM","ALUMNI","FORME")')
        .not('email', 'is', null)
        .or(`
          and(score.gt.50,derniere_activite.lt.${dateRanges.week}),
          and(statut.eq.CONTACTE,derniere_activite.lt.${dateRanges.fiveDays}),
          and(statut.eq.QUALIFIE,derniere_activite.lt.${dateRanges.threeDays}),
          and(statut.eq.PROPOSE,derniere_activite.lt.${dateRanges.twoDays})
        `)
        .limit(20) // Max 20 relances par jour

      if (error) {
        console.error('Error fetching leads to relance:', error)
        return []
      }

      // Enrichir avec contexte métier
      return (leads || []).map((lead: any) => ({
        ...lead,
        context: getLeadContext(lead),
        formationNom: lead.formations?.nom || 'Formation non définie',
        lastActivityType: lead.activites?.[0]?.type || 'CREATION',
        daysSinceLastActivity: Math.floor((now.getTime() - new Date(lead.derniere_activite).getTime()) / (24 * 60 * 60 * 1000))
      }))
    })

    if (!leadsToRelance || leadsToRelance.length === 0) {
      return { message: 'Aucun lead à relancer aujourd\'hui', count: 0 }
    }

    // ============================================
    // STEP 2 : Générer messages personnalisés via IA
    // ============================================
    const messages = await step.run('generate-messages', async () => {
      const results = []

      for (const lead of leadsToRelance as LeadToRelance[]) {
        try {
          const aiMessage = await generatePersonalizedMessage(lead)
          results.push({
            lead_id: lead.id,
            email: lead.email,
            subject: aiMessage.subject,
            body: aiMessage.body,
            lead_name: `${lead.prenom} ${lead.nom}`,
            statut: lead.statut
          })
        } catch (error) {
          console.error(`Failed to generate message for lead ${lead.id}:`, error)
          // Fallback avec template générique
          results.push({
            lead_id: lead.id,
            email: lead.email,
            subject: `Bonjour ${lead.prenom}, votre projet de formation`,
            body: getGenericMessage(lead),
            lead_name: `${lead.prenom} ${lead.nom}`,
            statut: lead.statut
          })
        }
      }

      return results
    })

    // ============================================
    // STEP 3 : Envoyer les relances via Resend
    // ============================================
    const results = await step.run('send-relances', async () => {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)
      const supabase = getSupabase()

      const results = { sent: 0, failed: 0, errors: [] as string[] }

      for (const message of messages) {
        try {
          // Envoyer l'email
          const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Dermotec Formation <formation@dermotec.fr>',
            to: message.email,
            subject: message.subject,
            html: formatEmailHTML(message.body, message.lead_name),
            headers: {
              'X-Lead-ID': message.lead_id,
              'X-Campaign': 'smart-relance',
            },
          })

          if (error) throw new Error(`Resend error: ${error.message}`)

          // Logger l'activité
          await supabase.from('activites').insert({
            lead_id: message.lead_id,
            type: 'RELANCE_AUTO',
            titre: 'Relance automatique envoyée',
            description: `Sujet: ${message.subject}`,
            details: {
              email_id: data?.id,
              statut_lead: message.statut,
              campaign: 'smart-relance'
            }
          })

          // Mettre à jour derniere_activite du lead
          await supabase.from('leads')
            .update({ derniere_activite: new Date().toISOString() })
            .eq('id', message.lead_id)

          // Logger dans messages (omnicanal)
          await supabase.from('messages').insert({
            lead_id: message.lead_id,
            canal: 'email',
            direction: 'outbound',
            sujet: message.subject,
            contenu: message.body,
            destinataire: message.email,
            statut: 'ENVOYE',
            details: {
              resend_id: data?.id,
              campaign: 'smart-relance',
              ai_generated: true
            }
          })

          results.sent++
        } catch (error) {
          console.error(`Failed to send relance to ${message.email}:`, error)
          results.failed++
          results.errors.push(`${message.lead_name}: ${(error as Error).message}`)
        }
      }

      return results
    })

    return {
      leads_identified: leadsToRelance.length,
      emails_sent: results.sent,
      emails_failed: results.failed,
      errors: results.errors
    }
  }
)

// ============================================
// Fonctions utilitaires
// ============================================

function getLeadContext(lead: any): string {
  const contexts = []

  if (lead.score > 80) contexts.push('lead très chaud')
  else if (lead.score > 60) contexts.push('lead qualifié')
  else if (lead.score > 40) contexts.push('lead intéressé')

  if (lead.statut === 'PROPOSE') contexts.push('devis envoyé')
  if (lead.statut === 'QUALIFIE') contexts.push('besoins identifiés')

  const daysSince = Math.floor((Date.now() - new Date(lead.derniere_activite).getTime()) / (24 * 60 * 60 * 1000))
  if (daysSince > 7) contexts.push('pas de contact depuis longtemps')

  return contexts.join(', ')
}

async function generatePersonalizedMessage(lead: LeadToRelance) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `Tu es un commercial experte en formations esthétiques. Génère un email de relance personnalisé et professionnel (max 4 phrases) pour ce lead:

Prénom: ${lead.prenom}
Statut: ${lead.statut}
Formation d'intérêt: ${lead.formation_interesse || 'Non définie'}
Score: ${lead.score}/100
Jours depuis dernier contact: ${lead.daysSinceLastActivity}
Contexte: ${lead.context}

Tone: Chaleureux mais professionnel, pas insistant. Apporte de la valeur.
Format de réponse: JSON {"subject": "...", "body": "..."}`
        }],
        max_tokens: 300,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) throw new Error('No content from AI')

    // Parser le JSON de réponse
    const parsed = JSON.parse(content)
    return {
      subject: parsed.subject || `Bonjour ${lead.prenom}, votre projet de formation`,
      body: parsed.body || getGenericMessage(lead)
    }
  } catch (error) {
    console.error('DeepSeek generation failed:', error)
    throw error
  }
}

function getGenericMessage(lead: LeadToRelance): string {
  const formation = lead.formation_interesse || 'nos formations esthétiques'

  return `Bonjour ${lead.prenom},

J'espère que vous allez bien. Vous aviez manifesté un intérêt pour ${formation} et je souhaitais prendre de vos nouvelles.

Nos prochaines sessions démarrent bientôt et nous avons encore quelques places disponibles. Seriez-vous disponible pour un échange téléphonique cette semaine afin de faire le point sur votre projet ?

Excellente journée,
L'équipe Dermotec`
}

function formatEmailHTML(body: string, leadName: string): string {
  // Convertir le texte en HTML avec style Dermotec
  const htmlBody = body.replace(/\n/g, '<br>')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #FF5C00; font-size: 24px; font-weight: bold; }
    .content { background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    .cta { background: #FF5C00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">DERMOTEC</div>
      <p style="color: #666; margin: 5px 0;">Centre de Formation Esthétique</p>
    </div>

    <div class="content">
      ${htmlBody}

      <p style="margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crm-dermotec.vercel.app'}/formations" class="cta">
          Voir nos formations
        </a>
      </p>
    </div>

    <div class="footer">
      <p>Dermotec Advanced<br>75 Bd Richard Lenoir, 75011 Paris<br>Centre certifié Qualiopi</p>
    </div>
  </div>
</body>
</html>`
}