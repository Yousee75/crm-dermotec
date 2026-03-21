// ============================================================
// CRM DERMOTEC — Smart Actions Engine
// Suggestions proactives basées sur les données
// ============================================================

import type { Lead, Session, Financement, Rappel } from '@/types'

export interface SmartAction {
  type: string
  priorite: 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE'
  titre: string
  description: string
  action_cta: string
  action_url: string
  lead_id?: string
  session_id?: string
  metadata?: Record<string, unknown>
}

// Générer les smart actions pour un commercial
export function generateSmartActions({
  leads,
  sessions,
  financements,
  rappelsOverdue,
}: {
  leads: Lead[]
  sessions: Session[]
  financements: Financement[]
  rappelsOverdue: Rappel[]
}): SmartAction[] {
  const actions: SmartAction[] = []
  const now = new Date()

  // 1. RAPPELS EN RETARD (priorité critique)
  for (const rappel of rappelsOverdue) {
    const jours = Math.floor((now.getTime() - new Date(rappel.date_rappel).getTime()) / 86400000)
    actions.push({
      type: 'RAPPEL_OVERDUE',
      priorite: jours > 3 ? 'CRITIQUE' : 'HAUTE',
      titre: `Rappel en retard — ${rappel.lead?.prenom} ${rappel.lead?.nom}`,
      description: `${rappel.type} prévu il y a ${jours} jour${jours > 1 ? 's' : ''}. ${rappel.titre || ''}`,
      action_cta: 'Traiter maintenant',
      action_url: `/lead/${rappel.lead_id}`,
      lead_id: rappel.lead_id || undefined,
    })
  }

  // 2. LEADS STAGNANTS (qualifiés mais pas de contact récent)
  for (const lead of leads) {
    if (['QUALIFIE', 'FINANCEMENT_EN_COURS'].includes(lead.statut)) {
      const lastContact = lead.date_dernier_contact ? new Date(lead.date_dernier_contact) : new Date(lead.created_at)
      const jours = Math.floor((now.getTime() - lastContact.getTime()) / 86400000)

      if (jours >= 5) {
        actions.push({
          type: 'LEAD_STAGNANT',
          priorite: jours >= 14 ? 'HAUTE' : 'NORMALE',
          titre: `Lead sans contact depuis ${jours}j — ${lead.prenom} ${lead.nom}`,
          description: `${lead.statut} depuis ${jours} jours sans relance. ${lead.formation_principale?.nom || 'Formation non définie'}.`,
          action_cta: 'Appeler',
          action_url: `/lead/${lead.id}`,
          lead_id: lead.id,
        })
      }
    }

    // 3. NOUVEAUX LEADS NON CONTACTÉS
    if (lead.statut === 'NOUVEAU' && lead.nb_contacts === 0) {
      const jours = Math.floor((now.getTime() - new Date(lead.created_at).getTime()) / 86400000)
      if (jours >= 1) {
        actions.push({
          type: 'APPELER_LEAD',
          priorite: jours >= 3 ? 'HAUTE' : 'NORMALE',
          titre: `Nouveau lead non contacté — ${lead.prenom} ${lead.nom}`,
          description: `Source: ${lead.source}. Intéressé par: ${lead.formation_principale?.nom || lead.sujet || '?'}. Reçu il y a ${jours}j.`,
          action_cta: 'Premier appel',
          action_url: `/lead/${lead.id}`,
          lead_id: lead.id,
        })
      }
    }
  }

  // 4. SESSIONS PRESQUE PLEINES
  for (const session of sessions) {
    if (['PLANIFIEE', 'CONFIRMEE'].includes(session.statut)) {
      const placesRestantes = session.places_max - session.places_occupees
      const joursAvant = Math.floor((new Date(session.date_debut).getTime() - now.getTime()) / 86400000)

      if (placesRestantes > 2 && joursAvant <= 14 && joursAvant > 0) {
        actions.push({
          type: 'SESSION_INCOMPLETE',
          priorite: joursAvant <= 7 ? 'HAUTE' : 'NORMALE',
          titre: `Session ${session.formation?.nom} dans ${joursAvant}j — ${placesRestantes} places restantes`,
          description: `${session.places_occupees}/${session.places_max} inscrits. Activer la prospection ciblée.`,
          action_cta: 'Voir les leads intéressés',
          action_url: `/session/${session.id}`,
          session_id: session.id,
        })
      }
    }
  }

  // 5. UPSELL ALUMNI
  for (const lead of leads) {
    if (lead.statut === 'FORME' || lead.statut === 'ALUMNI') {
      const derniere = lead.date_dernier_contact ? new Date(lead.date_dernier_contact) : new Date(lead.updated_at)
      const jours = Math.floor((now.getTime() - derniere.getTime()) / 86400000)

      if (jours >= 25 && jours <= 35) {
        actions.push({
          type: 'UPSELL_FORMATION',
          priorite: 'NORMALE',
          titre: `Suivi J+30 — ${lead.prenom} ${lead.nom}`,
          description: `Formée il y a ~30 jours. Appel de suivi + proposition formation complémentaire.`,
          action_cta: 'Appeler pour suivi',
          action_url: `/lead/${lead.id}`,
          lead_id: lead.id,
        })
      }

      if (jours >= 85 && jours <= 95) {
        actions.push({
          type: 'SUIVI_ALUMNI',
          priorite: 'NORMALE',
          titre: `Suivi J+90 — ${lead.prenom} ${lead.nom}`,
          description: `A-t-elle lancé son activité ? Besoin de matériel ? Formation complémentaire ?`,
          action_cta: 'Suivi alumni',
          action_url: `/lead/${lead.id}`,
          lead_id: lead.id,
        })
      }

      // Demander avis Google
      if (!lead.avis_google_laisse && jours >= 5 && jours <= 10) {
        actions.push({
          type: 'AVIS_GOOGLE',
          priorite: 'BASSE',
          titre: `Demander avis Google — ${lead.prenom} ${lead.nom}`,
          description: `Formation terminée il y a ${jours}j. Envoyer le lien avis Google.`,
          action_cta: 'Envoyer lien',
          action_url: `/lead/${lead.id}`,
          lead_id: lead.id,
        })
      }
    }
  }

  // 6. FINANCEMENTS EN ATTENTE
  for (const fin of financements) {
    if (fin.statut === 'SOUMIS' || fin.statut === 'EN_EXAMEN') {
      const soumisDepuis = fin.date_soumission
        ? Math.floor((now.getTime() - new Date(fin.date_soumission).getTime()) / 86400000)
        : 0

      if (soumisDepuis >= 15) {
        actions.push({
          type: 'RELANCER_FINANCEMENT',
          priorite: soumisDepuis >= 30 ? 'HAUTE' : 'NORMALE',
          titre: `Dossier ${fin.organisme} sans réponse depuis ${soumisDepuis}j`,
          description: `${fin.numero_dossier || 'Sans numéro'} pour ${fin.lead?.prenom} ${fin.lead?.nom}. Relancer l'organisme.`,
          action_cta: 'Relancer',
          action_url: `/lead/${fin.lead_id}`,
          lead_id: fin.lead_id,
        })
      }
    }
  }

  // Trier par priorité
  const prioriteOrder = { CRITIQUE: 0, HAUTE: 1, NORMALE: 2, BASSE: 3 }
  actions.sort((a, b) => prioriteOrder[a.priorite] - prioriteOrder[b.priorite])

  return actions
}
