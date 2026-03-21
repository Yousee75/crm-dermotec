// @ts-nocheck
// ============================================================
// CRM DERMOTEC — Automatisations métier
// Règles qui se déclenchent sur les changements de statut/données
// Logique réelle d'un centre de formation esthétique
// ============================================================
import 'server-only'

import { createServiceSupabase } from './supabase-server'

// ============================================================
// 1. QUAND UN LEAD EST CRÉÉ
// → Assigner commercial (round-robin)
// → Lancer cadence "Nouveau Lead" (si consentement)
// → Scorer automatiquement
// ============================================================

export async function onLeadCreated(leadId: string) {
  const supabase = await createServiceSupabase()

  const { data: lead } = await supabase
    .from('leads')
    .select('id, prenom, email, telephone, source, statut_pro, formation_principale_id, financement_souhaite, commercial_assigne_id')
    .eq('id', leadId)
    .single()

  if (!lead) return

  const actions: string[] = []

  // A. Auto-assign commercial si pas déjà assigné (round-robin)
  if (!lead.commercial_assigne_id) {
    const { data: commerciaux } = await supabase
      .from('equipe')
      .select('id')
      .in('role', ['commercial', 'manager'])
      .eq('is_active', true)
      .order('updated_at', { ascending: true }) // Le moins récemment assigné
      .limit(1)

    if (commerciaux?.[0]) {
      await supabase.from('leads').update({ commercial_assigne_id: commerciaux[0].id }).eq('id', leadId)
      actions.push(`Assigné à commercial ${commerciaux[0].id}`)
    }
  }

  // B. Créer rappel automatique "Premier appel" dans 2h (si heures ouvrées) ou demain 9h
  const now = new Date()
  const hour = now.getHours()
  let rappelDate: Date

  if (hour >= 9 && hour < 16) {
    // Pendant les heures ouvrées → rappel dans 2h
    rappelDate = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  } else {
    // Hors heures → demain 9h
    rappelDate = new Date(now)
    rappelDate.setDate(rappelDate.getDate() + 1)
    rappelDate.setHours(9, 0, 0, 0)
    // Si demain est dimanche → lundi
    if (rappelDate.getDay() === 0) rappelDate.setDate(rappelDate.getDate() + 1)
    // Si demain est samedi → lundi
    if (rappelDate.getDay() === 6) rappelDate.setDate(rappelDate.getDate() + 2)
  }

  await supabase.from('rappels').insert({
    lead_id: leadId,
    user_id: lead.commercial_assigne_id,
    date_rappel: rappelDate.toISOString(),
    type: 'APPEL',
    statut: 'EN_ATTENTE',
    priorite: lead.source === 'telephone' || lead.source === 'whatsapp' ? 'URGENTE' : 'HAUTE',
    titre: `Premier appel — ${lead.prenom}`,
    description: `Nouveau lead ${lead.source}. ${lead.financement_souhaite ? 'Financement souhaité.' : ''} ${lead.statut_pro ? `Profil : ${lead.statut_pro}` : ''}`,
  })
  actions.push(`Rappel premier appel créé pour ${rappelDate.toLocaleString('fr-FR')}`)

  // C. Logger
  await supabase.from('activites').insert({
    type: 'SYSTEME',
    lead_id: leadId,
    description: `Automatisations post-création : ${actions.join(' | ')}`,
  })
}

// ============================================================
// 2. QUAND UN STATUT CHANGE
// → Déclencher les actions appropriées selon la transition
// ============================================================

export async function onLeadStatusChanged(leadId: string, oldStatus: string, newStatus: string) {
  const supabase = await createServiceSupabase()

  const { data: lead } = await supabase
    .from('leads')
    .select('id, prenom, nom, email, telephone, statut_pro, formation_principale_id, commercial_assigne_id, formation_principale:formations!leads_formation_principale_id_fkey(nom, prix_ht)')
    .eq('id', leadId)
    .single()

  if (!lead) return

  // ── NOUVEAU → CONTACTÉ : premier contact fait ──
  if (oldStatus === 'NOUVEAU' && newStatus === 'CONTACTE') {
    // Annuler les rappels "premier appel" en attente
    await supabase.from('rappels')
      .update({ statut: 'FAIT' })
      .eq('lead_id', leadId)
      .eq('statut', 'EN_ATTENTE')
      .ilike('titre', '%premier appel%')
  }

  // ── → QUALIFIÉ : créer rappel de suivi ──
  if (newStatus === 'QUALIFIE') {
    await supabase.from('rappels').insert({
      lead_id: leadId,
      user_id: lead.commercial_assigne_id,
      date_rappel: addBusinessDays(new Date(), 2).toISOString(),
      type: 'APPEL',
      statut: 'EN_ATTENTE',
      priorite: 'HAUTE',
      titre: `Suivi qualification — ${lead.prenom} ${lead.nom}`,
      description: `Lead qualifiée. ${lead.statut_pro === 'gerant_institut' ? 'Gérante institut → OPCO EP probable.' : ''} Proposer dates et financement.`,
    })
  }

  // ── → FINANCEMENT_EN_COURS : créer rappel suivi dossier à J+7 ──
  if (newStatus === 'FINANCEMENT_EN_COURS') {
    await supabase.from('rappels').insert({
      lead_id: leadId,
      user_id: lead.commercial_assigne_id,
      date_rappel: addBusinessDays(new Date(), 7).toISOString(),
      type: 'SUIVI',
      statut: 'EN_ATTENTE',
      priorite: 'NORMALE',
      titre: `Suivi dossier financement — ${lead.prenom} ${lead.nom}`,
      description: 'Vérifier avancement du dossier de financement. Relancer si pas de nouvelle.',
    })
  }

  // ── → INSCRIT : confirmation ──
  if (newStatus === 'INSCRIT') {
    // Marquer tous les rappels en attente comme faits
    await supabase.from('rappels')
      .update({ statut: 'FAIT' })
      .eq('lead_id', leadId)
      .eq('statut', 'EN_ATTENTE')

    // Créer rappel J-7 avant session (si session connue)
    const { data: inscription } = await supabase
      .from('inscriptions')
      .select('session:sessions(date_debut)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (inscription?.session) {
      const sessionDate = new Date((inscription.session as any).date_debut)
      const rappelDate = new Date(sessionDate)
      rappelDate.setDate(rappelDate.getDate() - 7)

      if (rappelDate > new Date()) {
        await supabase.from('rappels').insert({
          lead_id: leadId,
          user_id: lead.commercial_assigne_id,
          date_rappel: rappelDate.toISOString(),
          type: 'EMAIL',
          statut: 'EN_ATTENTE',
          priorite: 'NORMALE',
          titre: `Convocation J-7 — ${lead.prenom} ${lead.nom}`,
          description: 'Envoyer convocation + infos pratiques (adresse, métro, matériel à apporter).',
        })
      }
    }
  }

  // ── → FORMÉ : lancer suivi post-formation ──
  if (newStatus === 'FORME') {
    // Créer rappel avis Google J+5
    await supabase.from('rappels').insert({
      lead_id: leadId,
      user_id: lead.commercial_assigne_id,
      date_rappel: addBusinessDays(new Date(), 5).toISOString(),
      type: 'WHATSAPP',
      statut: 'EN_ATTENTE',
      priorite: 'NORMALE',
      titre: `Demande avis Google — ${lead.prenom}`,
      description: 'Envoyer le lien avis Google par WhatsApp. Satisfaction 4+/5 = demander avis.',
    })

    // Créer rappel upsell J+30
    const upsellDate = new Date()
    upsellDate.setDate(upsellDate.getDate() + 30)
    await supabase.from('rappels').insert({
      lead_id: leadId,
      user_id: lead.commercial_assigne_id,
      date_rappel: upsellDate.toISOString(),
      type: 'APPEL',
      statut: 'EN_ATTENTE',
      priorite: 'NORMALE',
      titre: `Upsell formation — ${lead.prenom}`,
      description: `Proposer formation complémentaire. Formation actuelle : ${(lead.formation_principale as any)?.nom || 'N/A'}.`,
    })
  }

  // ── → PERDU : noter la raison et planifier réactivation ──
  if (newStatus === 'PERDU') {
    // Annuler tous les rappels en attente
    await supabase.from('rappels')
      .update({ statut: 'ANNULE' })
      .eq('lead_id', leadId)
      .eq('statut', 'EN_ATTENTE')

    // Créer rappel de réactivation dans 90 jours
    const reactivationDate = new Date()
    reactivationDate.setDate(reactivationDate.getDate() + 90)
    await supabase.from('rappels').insert({
      lead_id: leadId,
      user_id: lead.commercial_assigne_id,
      date_rappel: reactivationDate.toISOString(),
      type: 'EMAIL',
      statut: 'EN_ATTENTE',
      priorite: 'BASSE',
      titre: `Réactivation — ${lead.prenom} ${lead.nom}`,
      description: 'Lead perdue il y a 3 mois. Vérifier si la situation a changé. Email de réactivation.',
    })
  }
}

// ============================================================
// 3. QUAND UNE SESSION EST PRESQUE PLEINE
// → Alerter les commerciaux avec des leads en pipeline
// ============================================================

export async function onSessionAlmostFull(sessionId: string) {
  const supabase = await createServiceSupabase()

  const { data: session } = await supabase
    .from('sessions')
    .select('id, places_max, places_occupees, date_debut, formation:formations(nom, slug)')
    .eq('id', sessionId)
    .single()

  if (!session) return

  const placesRestantes = session.places_max - session.places_occupees
  if (placesRestantes > 2) return // Pas encore critique

  // Trouver les leads qualifiées/en financement pour cette formation
  const { data: leadsInteressees } = await supabase
    .from('leads')
    .select('id, prenom, nom, commercial_assigne_id')
    .eq('formation_principale_id', (session.formation as any)?.id)
    .in('statut', ['QUALIFIE', 'FINANCEMENT_EN_COURS', 'CONTACTE'])
    .limit(10)

  if (!leadsInteressees?.length) return

  // Créer rappels urgents pour chaque commercial
  const commerciauxUniques = [...new Set(leadsInteressees.map(l => l.commercial_assigne_id).filter(Boolean))]

  for (const commercialId of commerciauxUniques) {
    const leadsCommercial = leadsInteressees.filter(l => l.commercial_assigne_id === commercialId)
    await supabase.from('rappels').insert({
      lead_id: leadsCommercial[0].id,
      user_id: commercialId,
      date_rappel: new Date().toISOString(),
      type: 'APPEL',
      statut: 'EN_ATTENTE',
      priorite: 'URGENTE',
      titre: `URGENCE — ${(session.formation as any)?.nom} : ${placesRestantes} place(s) restante(s)`,
      description: `Session du ${new Date(session.date_debut).toLocaleDateString('fr-FR')} presque complète. Leads en attente : ${leadsCommercial.map(l => `${l.prenom} ${l.nom}`).join(', ')}. Appeler MAINTENANT.`,
    })
  }

  // Logger
  await supabase.from('activites').insert({
    type: 'SYSTEME',
    session_id: sessionId,
    description: `Session ${(session.formation as any)?.nom} presque pleine (${placesRestantes} place(s)). ${leadsInteressees.length} leads en pipeline alertées.`,
  })
}

// ============================================================
// 4. QUAND UN FINANCEMENT CHANGE DE STATUT
// → Notifier le commercial et le lead
// ============================================================

export async function onFinancementStatusChanged(financementId: string, oldStatus: string, newStatus: string) {
  const supabase = await createServiceSupabase()

  const { data: financement } = await supabase
    .from('financements')
    .select('id, lead_id, organisme, montant_demande, montant_accorde, lead:leads(prenom, nom, email, commercial_assigne_id, formation_principale:formations!leads_formation_principale_id_fkey(nom))')
    .eq('id', financementId)
    .single()

  if (!financement?.lead) return
  const lead = financement.lead as any

  // ── VALIDÉ : financement accepté ! ──
  if (newStatus === 'VALIDE') {
    // Créer rappel urgent pour inscrire le lead
    await supabase.from('rappels').insert({
      lead_id: financement.lead_id,
      user_id: lead.commercial_assigne_id,
      date_rappel: new Date().toISOString(),
      type: 'APPEL',
      statut: 'EN_ATTENTE',
      priorite: 'URGENTE',
      titre: `FINANCEMENT VALIDÉ — ${lead.prenom} ${lead.nom}`,
      description: `${financement.organisme} a validé ${financement.montant_accorde || financement.montant_demande}€. Appeler pour confirmer l'inscription. Formation : ${lead.formation_principale?.nom}.`,
    })

    // Logger
    await supabase.from('activites').insert({
      type: 'FINANCEMENT',
      lead_id: financement.lead_id,
      description: `${financement.organisme} VALIDÉ — ${financement.montant_accorde || financement.montant_demande}€ accordés`,
    })
  }

  // ── REFUSÉ : proposer alternatives ──
  if (newStatus === 'REFUSE') {
    await supabase.from('rappels').insert({
      lead_id: financement.lead_id,
      user_id: lead.commercial_assigne_id,
      date_rappel: addBusinessDays(new Date(), 1).toISOString(),
      type: 'APPEL',
      statut: 'EN_ATTENTE',
      priorite: 'HAUTE',
      titre: `Financement REFUSÉ — ${lead.prenom} ${lead.nom}`,
      description: `${financement.organisme} a refusé le dossier. Proposer alternatives : CPF, autre organisme, paiement 3x. Ne pas laisser le lead partir.`,
    })
  }

  // ── COMPLEMENT_DEMANDE : relancer le lead pour les documents ──
  if (newStatus === 'COMPLEMENT_DEMANDE') {
    await supabase.from('rappels').insert({
      lead_id: financement.lead_id,
      user_id: lead.commercial_assigne_id,
      date_rappel: new Date().toISOString(),
      type: 'WHATSAPP',
      statut: 'EN_ATTENTE',
      priorite: 'HAUTE',
      titre: `Documents manquants — ${lead.prenom} ${lead.nom}`,
      description: `${financement.organisme} demande un complément de dossier. Contacter le lead pour récupérer les documents.`,
    })
  }
}

// ============================================================
// 5. VÉRIFICATIONS QUOTIDIENNES (appelé par cron)
// → Leads stagnantes, rappels oubliés, sessions bientôt complètes
// ============================================================

export async function dailyAutomations() {
  const supabase = await createServiceSupabase()
  const results = { stagnant_alerts: 0, session_alerts: 0, financement_alerts: 0 }

  // A. Leads stagnantes : CONTACTÉ/QUALIFIÉ sans contact > 7 jours
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: stagnantLeads } = await supabase
    .from('leads')
    .select('id, prenom, nom, commercial_assigne_id, statut, date_dernier_contact')
    .in('statut', ['CONTACTE', 'QUALIFIE'])
    .lt('date_dernier_contact', sevenDaysAgo.toISOString())
    .not('commercial_assigne_id', 'is', null)

  for (const lead of stagnantLeads || []) {
    // Vérifier qu'il n'y a pas déjà un rappel en attente
    const { data: existingRappel } = await supabase
      .from('rappels')
      .select('id')
      .eq('lead_id', lead.id)
      .eq('statut', 'EN_ATTENTE')
      .limit(1)

    if (!existingRappel?.length) {
      await supabase.from('rappels').insert({
        lead_id: lead.id,
        user_id: lead.commercial_assigne_id,
        date_rappel: new Date().toISOString(),
        type: 'APPEL',
        statut: 'EN_ATTENTE',
        priorite: 'HAUTE',
        titre: `Lead stagnante — ${lead.prenom} ${lead.nom}`,
        description: `Aucun contact depuis plus de 7 jours. Statut : ${lead.statut}. Relancer avant qu'elle parte chez un concurrent.`,
      })
      results.stagnant_alerts++
    }
  }

  // B. Sessions < 3 places restantes dans les 14 prochains jours
  const twoWeeks = new Date()
  twoWeeks.setDate(twoWeeks.getDate() + 14)

  const { data: sessionsCritiques } = await supabase
    .from('sessions')
    .select('id, places_max, places_occupees')
    .in('statut', ['PLANIFIEE', 'CONFIRMEE'])
    .lte('date_debut', twoWeeks.toISOString())
    .gte('date_debut', new Date().toISOString())

  for (const session of sessionsCritiques || []) {
    const restantes = session.places_max - session.places_occupees
    if (restantes <= 2 && restantes > 0) {
      await onSessionAlmostFull(session.id)
      results.session_alerts++
    }
  }

  // C. Dossiers financement > 21 jours sans nouvelle (SOUMIS/EN_EXAMEN)
  const twentyOneDaysAgo = new Date()
  twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21)

  const { data: financementsStagnants } = await supabase
    .from('financements')
    .select('id, lead_id, organisme, lead:leads(prenom, nom, commercial_assigne_id)')
    .in('statut', ['SOUMIS', 'EN_EXAMEN'])
    .lt('updated_at', twentyOneDaysAgo.toISOString())

  for (const fin of financementsStagnants || []) {
    const lead = fin.lead as any
    if (!lead) continue

    const { data: existingRappel } = await supabase
      .from('rappels')
      .select('id')
      .eq('lead_id', fin.lead_id)
      .eq('statut', 'EN_ATTENTE')
      .ilike('titre', '%financement%')
      .limit(1)

    if (!existingRappel?.length) {
      await supabase.from('rappels').insert({
        lead_id: fin.lead_id,
        user_id: lead.commercial_assigne_id,
        date_rappel: new Date().toISOString(),
        type: 'APPEL',
        statut: 'EN_ATTENTE',
        priorite: 'HAUTE',
        titre: `Relance financement — ${lead.prenom} ${lead.nom}`,
        description: `Dossier ${fin.organisme} sans nouvelle depuis 21+ jours. Appeler l'organisme pour suivi.`,
      })
      results.financement_alerts++
    }
  }

  return results
}

// ============================================================
// HELPERS
// ============================================================

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      added++
    }
  }
  // Ajuster à 10h si pas d'heure définie
  if (result.getHours() < 9) result.setHours(10, 0, 0, 0)
  return result
}
