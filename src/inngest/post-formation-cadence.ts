// ============================================================
// Inngest Function: Cadence post-formation
// Déclenché quand une formation est terminée
// J+5 : Demande avis Google
// J+30 : Upsell formation complémentaire
// J+90 : Check alumni + e-shop + parrainage
// ============================================================

import { inngest } from '@/lib/inngest'

export const postFormationCadence = inngest.createFunction(
  {
    id: 'crm-post-formation-cadence',
    retries: 3,
    cancelOn: [
      {
        event: 'crm/lead.cadence.cancel',
        match: 'data.lead_id',
      },
    ],
    triggers: [{ event: 'crm/lead.post-formation.start' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { lead_id, email, prenom, formation_nom } = event.data

    // --- J+5 : Demande avis Google ---
    await step.sleep('wait-5-days', '5d')

    await step.run('j5-avis-google', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      // Vérifier que le lead est toujours FORME/ALUMNI
      const { data: lead } = await supabase
        .from('leads')
        .select('statut, avis_google_laisse')
        .eq('id', lead_id)
        .single()

      if (!lead || !['FORME', 'ALUMNI'].includes(lead.statut as string)) {
        return { skipped: true, reason: `Statut: ${lead?.statut}` }
      }

      if (lead.avis_google_laisse) {
        return { skipped: true, reason: 'Avis déjà laissé' }
      }

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)

      await resend.emails.send({
        from: 'Dermotec Formation <formation@dermotec.fr>',
        to: email,
        subject: `${prenom}, votre avis compte pour nous !`,
        html: `
          <!DOCTYPE html>
          <html lang="fr">
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
          <body style="margin:0;padding:0;background:#f8fafc;font-family:'DM Sans',Arial,sans-serif">
          <div style="max-width:600px;margin:0 auto;padding:24px">
            <div style="background:#082545;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:#2EC6F3;font-size:20px;margin:0;font-weight:600">Dermotec Advanced</h1>
              <p style="color:#94a3b8;font-size:12px;margin:4px 0 0">Centre de Formation Esthétique Certifié Qualiopi</p>
            </div>
            <div style="background:#ffffff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:0">
              <h2 style="color:#082545;margin:0 0 12px">${prenom}, merci pour ces jours ensemble !</h2>
              <p style="color:#334155;line-height:1.6">
                Vous avez terminé la formation <strong>${formation_nom}</strong> et nous espérons
                qu'elle vous a donné les clés pour lancer ou développer votre activité.
              </p>
              <p style="color:#334155;line-height:1.6">
                Votre avis aide d'autres professionnelles comme vous à nous faire confiance.
                <strong>30 secondes suffisent</strong> — et ça compte énormément pour nous.
              </p>
              <div style="text-align:center;margin:24px 0">
                <a href="https://g.page/r/dermotec-advanced/review"
                   style="display:inline-block;background:linear-gradient(135deg,#2EC6F3,#1DA1D4);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(46,198,243,0.3)">
                  Laisser un avis Google
                </a>
              </div>
              <p style="color:#64748b;font-size:13px;text-align:center">
                Merci du fond du coeur,<br><strong>L'équipe Dermotec</strong>
              </p>
            </div>
            <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">
              Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris<br>
              01 88 33 43 43 — dermotec.fr@gmail.com
            </p>
          </div>
          </body></html>
        `,
      })

      await supabase.from('activites').insert({
        type: 'EMAIL',
        lead_id,
        description: 'Cadence post-formation J+5 : Demande avis Google envoyée',
        metadata: { step: 'post_formation_j5', formation_nom },
      })

      return { sent: true }
    })

    // --- J+30 : Upsell formation complémentaire ---
    await step.sleep('wait-25-days', '25d')

    const upsellResult = await step.run('j30-upsell', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const { data: lead } = await supabase
        .from('leads')
        .select('statut, statut_pro, experience_esthetique, nps_score, a_lance_activite')
        .eq('id', lead_id)
        .single()

      if (!lead || !['FORME', 'ALUMNI'].includes(lead.statut as string)) {
        return { skipped: true, reason: `Statut: ${lead?.statut}` }
      }

      // Suggestions de formations complémentaires basées sur la formation suivie
      const UPSELL_MAP: Record<string, { nom: string; prix: string; roi: string }[]> = {
        'microblading': [
          { nom: 'Full Lips', prix: '1 680€', roi: '300€/séance' },
          { nom: 'Nanoneedling & BB Glow', prix: '840€', roi: '100€/séance' },
        ],
        'full-lips': [
          { nom: 'Microblading / Microshading', prix: '1 680€', roi: '200€/séance' },
          { nom: 'Maquillage Permanent Complet', prix: '2 990€', roi: '250€/séance' },
        ],
        'maquillage-permanent': [
          { nom: 'Tricopigmentation HFS', prix: '3 000€', roi: '600€/séance' },
          { nom: 'Aréole Mammaire & Cicatrices', prix: '2 760€', roi: '500€/séance' },
        ],
        'nanoneedling': [
          { nom: 'Soin Visage ALLin1', prix: '1 080€', roi: '120€/séance' },
          { nom: 'Peeling & Dermaplaning', prix: '1 188€', roi: '150€/séance' },
        ],
        'default': [
          { nom: 'Maquillage Permanent Complet', prix: '2 990€', roi: '250€/séance' },
          { nom: 'Nanoneedling & BB Glow', prix: '840€', roi: '100€/séance' },
        ],
      }

      // Trouver le slug de la formation terminée
      const { data: inscription } = await supabase
        .from('inscriptions')
        .select('formation:formations(slug)')
        .eq('lead_id', lead_id)
        .eq('statut', 'COMPLETEE')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formationSlug = (inscription?.formation as any)?.slug || 'default'
      const suggestions = UPSELL_MAP[formationSlug] || UPSELL_MAP['default']

      const suggestionsHtml = suggestions.map(s => `
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:8px 0">
          <p style="margin:0 0 4px;font-weight:600;color:#082545">${s.nom}</p>
          <p style="margin:0;color:#334155;font-size:14px">${s.prix} TTC — ROI : ${s.roi}</p>
        </div>
      `).join('')

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)

      await resend.emails.send({
        from: 'Dermotec Formation <formation@dermotec.fr>',
        to: email,
        subject: `${prenom}, prête à aller plus loin ?`,
        html: `
          <!DOCTYPE html>
          <html lang="fr">
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
          <body style="margin:0;padding:0;background:#f8fafc;font-family:'DM Sans',Arial,sans-serif">
          <div style="max-width:600px;margin:0 auto;padding:24px">
            <div style="background:#082545;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:#2EC6F3;font-size:20px;margin:0;font-weight:600">Dermotec Advanced</h1>
            </div>
            <div style="background:#ffffff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:0">
              <h2 style="color:#082545;margin:0 0 12px">${prenom}, 1 mois déjà !</h2>
              <p style="color:#334155;line-height:1.6">
                Comment se passe le lancement de votre activité depuis la formation
                <strong>${formation_nom}</strong> ?
              </p>
              <p style="color:#334155;line-height:1.6">
                Pour diversifier vos prestations et augmenter votre chiffre d'affaires,
                voici les formations que nos anciennes stagiaires recommandent :
              </p>
              ${suggestionsHtml}
              <p style="color:#334155;line-height:1.6;margin-top:16px">
                <strong>Rappel :</strong> nous vous accompagnons gratuitement pour le financement
                (OPCO, France Travail, CPF). La plupart de nos stagiaires obtiennent une prise en charge à 100%.
              </p>
              <div style="text-align:center;margin:24px 0">
                <a href="https://wa.me/33188334343?text=Bonjour, j'ai suivi ${encodeURIComponent(formation_nom)} et je suis intéressée par une formation complémentaire"
                   style="display:inline-block;background:#25D366;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px">
                  Discuter sur WhatsApp
                </a>
              </div>
            </div>
            <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">
              Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris
            </p>
          </div>
          </body></html>
        `,
      })

      await supabase.from('activites').insert({
        type: 'EMAIL',
        lead_id,
        description: `Cadence post-formation J+30 : Upsell envoyé (${suggestions.map(s => s.nom).join(', ')})`,
        metadata: { step: 'post_formation_j30', formation_nom, suggestions },
      })

      // Créer un rappel pour la commerciale
      await supabase.from('rappels').insert({
        lead_id,
        type: 'RELANCE',
        date_rappel: new Date().toISOString(),
        description: `Suivi J+30 : ${prenom} a reçu l'email upsell. Appeler pour proposer formation complémentaire.`,
        statut: 'EN_ATTENTE',
      })

      return { sent: true, suggestions: suggestions.map(s => s.nom) }
    })

    // --- J+90 : Alumni check + e-shop + parrainage ---
    await step.sleep('wait-60-days', '60d')

    await step.run('j90-alumni-eshop-parrainage', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )

      const { data: lead } = await supabase
        .from('leads')
        .select('statut')
        .eq('id', lead_id)
        .single()

      if (!lead || lead.statut === 'PERDU' || lead.statut === 'SPAM') {
        return { skipped: true, reason: `Statut: ${lead?.statut}` }
      }

      // Passer en ALUMNI si encore FORME
      if (lead.statut === 'FORME') {
        await supabase
          .from('leads')
          .update({ statut: 'ALUMNI', updated_at: new Date().toISOString() })
          .eq('id', lead_id)
      }

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY!)

      // Générer code parrainage
      const referralCode = `DERMOTEC-${prenom.toUpperCase().substring(0, 6).padEnd(6, 'X')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      await resend.emails.send({
        from: 'Dermotec Formation <formation@dermotec.fr>',
        to: email,
        subject: `${prenom}, 3 mois déjà — on prend des nouvelles !`,
        html: `
          <!DOCTYPE html>
          <html lang="fr">
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
          <body style="margin:0;padding:0;background:#f8fafc;font-family:'DM Sans',Arial,sans-serif">
          <div style="max-width:600px;margin:0 auto;padding:24px">
            <div style="background:#082545;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:#2EC6F3;font-size:20px;margin:0;font-weight:600">Dermotec Advanced</h1>
            </div>
            <div style="background:#ffffff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:0">
              <h2 style="color:#082545;margin:0 0 12px">${prenom}, comment ça se passe ?</h2>
              <p style="color:#334155;line-height:1.6">
                3 mois depuis votre formation <strong>${formation_nom}</strong>.
                Avez-vous lancé votre activité ? On aimerait savoir !
              </p>

              <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0">
                <p style="margin:0 0 8px;font-weight:600;color:#082545">Parrainage — Gagnez 100€</p>
                <p style="margin:0 0 8px;color:#334155;font-size:14px">
                  Recommandez Dermotec à une amie ou collègue :
                </p>
                <p style="margin:0;color:#334155;font-size:14px">
                  <strong>Vous gagnez 100€</strong> sur votre prochaine formation<br>
                  <strong>Elle gagne 50€</strong> sur sa première inscription
                </p>
                <div style="background:#082545;color:#2EC6F3;text-align:center;padding:12px;border-radius:8px;margin-top:12px;font-family:monospace;font-size:16px;letter-spacing:2px">
                  ${referralCode}
                </div>
              </div>

              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
                <p style="margin:0 0 8px;font-weight:600;color:#082545">E-Shop — Matériel pro</p>
                <p style="margin:0;color:#334155;font-size:14px">
                  En tant qu'ancienne stagiaire, vous bénéficiez de <strong>-10%</strong>
                  sur tout le matériel NPM. Besoin de recharges, aiguilles, pigments ?
                </p>
              </div>

              <div style="text-align:center;margin:24px 0;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
                <a href="https://wa.me/33188334343?text=Bonjour, je suis ancienne stagiaire (${encodeURIComponent(formation_nom)}) et j'aimerais commander du matériel"
                   style="display:inline-block;background:#25D366;color:white;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
                  Commander du matériel
                </a>
                <a href="tel:+33188334343"
                   style="display:inline-block;background:linear-gradient(135deg,#2EC6F3,#1DA1D4);color:white;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
                  Nous appeler
                </a>
              </div>
            </div>
            <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">
              Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris
            </p>
          </div>
          </body></html>
        `,
      })

      await supabase.from('activites').insert({
        type: 'EMAIL',
        lead_id,
        description: 'Cadence post-formation J+90 : Email alumni + parrainage + e-shop envoyé',
        metadata: { step: 'post_formation_j90', formation_nom, referral_code: referralCode },
      })

      // Créer un rappel pour la commerciale
      await supabase.from('rappels').insert({
        lead_id,
        type: 'SUIVI',
        date_rappel: new Date(Date.now() + 2 * 86400000).toISOString(), // J+2
        description: `Suivi J+90 alumni : ${prenom} — appeler pour savoir si activité lancée, besoins matériel, formation complémentaire.`,
        statut: 'EN_ATTENTE',
      })

      return { sent: true, referral_code: referralCode }
    })

    return { lead_id, cadence: 'post-formation-complete', steps: 3 }
  }
)
