// ============================================================
// CRM DERMOTEC — Tâches automatiques par étape du pipeline
// Quand un lead change d'étape, créer les tâches associées.
// Pattern : stage-based task creation (HubSpot/Salesforce)
// ============================================================

import type { StatutLead, TypeRappel } from '@/types'

export interface StageTask {
  titre: string
  type: TypeRappel
  delai_heures: number   // heures ouvrées après le changement
  description: string
  priorite: 'URGENTE' | 'HAUTE' | 'NORMALE' | 'BASSE'
}

/**
 * Tâches à créer automatiquement quand un lead entre dans une étape.
 * Chaque étape a ses actions requises pour avancer.
 */
const STAGE_TASKS: Partial<Record<StatutLead, StageTask[]>> = {
  CONTACTE: [
    {
      titre: 'Qualifier le besoin',
      type: 'APPEL',
      delai_heures: 0,
      description: 'Identifier : formation souhaitée, expérience, statut pro, financement, disponibilités',
      priorite: 'HAUTE',
    },
  ],

  QUALIFIE: [
    {
      titre: 'Envoyer devis + programme formation',
      type: 'EMAIL',
      delai_heures: 2,
      description: 'Envoyer le devis personnalisé + programme pédagogique de la formation visée',
      priorite: 'HAUTE',
    },
    {
      titre: 'Proposer un créneau de session',
      type: 'APPEL',
      delai_heures: 24,
      description: 'Appeler pour valider le devis et proposer les prochaines dates de session',
      priorite: 'NORMALE',
    },
  ],

  FINANCEMENT_EN_COURS: [
    {
      titre: 'Constituer le dossier de financement',
      type: 'ADMIN',
      delai_heures: 0,
      description: 'Rassembler : pièce identité, attestation employeur/Pôle Emploi, devis signé. Identifier l\'organisme (OPCO, France Travail, CPF, etc.)',
      priorite: 'HAUTE',
    },
    {
      titre: 'Relance dossier financement (si pas soumis)',
      type: 'RELANCE',
      delai_heures: 72, // 3 jours ouvrés
      description: 'Vérifier que tous les documents sont reçus et soumettre le dossier',
      priorite: 'NORMALE',
    },
  ],

  INSCRIT: [
    {
      titre: 'Envoyer convention de formation',
      type: 'EMAIL',
      delai_heures: 2,
      description: 'Générer et envoyer la convention de formation pour signature',
      priorite: 'HAUTE',
    },
    {
      titre: 'Convocation J-7',
      type: 'EMAIL',
      delai_heures: 0, // sera calculé par rapport à la date de session
      description: 'Envoyer la convocation avec lieu, horaires, matériel à prévoir',
      priorite: 'NORMALE',
    },
  ],

  FORME: [
    {
      titre: 'Envoyer questionnaire de satisfaction',
      type: 'EMAIL',
      delai_heures: 24, // J+1 post-formation
      description: 'Questionnaire NPS + satisfaction détaillée (Qualiopi obligatoire)',
      priorite: 'HAUTE',
    },
    {
      titre: 'Générer le certificat de formation',
      type: 'ADMIN',
      delai_heures: 48,
      description: 'Générer et envoyer le certificat de réalisation',
      priorite: 'NORMALE',
    },
    {
      titre: 'Demander avis Google (J+7)',
      type: 'EMAIL',
      delai_heures: 168, // 7 jours
      description: 'Envoyer le lien pour laisser un avis Google',
      priorite: 'BASSE',
    },
  ],

  ALUMNI: [
    {
      titre: 'Suivi J+30 — formation complémentaire',
      type: 'APPEL',
      delai_heures: 720, // 30 jours ouvrés ≈ 6 semaines
      description: 'Appel de suivi : comment se passe la mise en pratique ? Intéressée par une formation avancée ?',
      priorite: 'NORMALE',
    },
  ],
}

/**
 * Retourne les tâches à créer quand un lead entre dans une nouvelle étape.
 */
export function getTasksForStage(newStatut: StatutLead): StageTask[] {
  return STAGE_TASKS[newStatut] ?? []
}

/**
 * Crée les rappels Supabase pour les tâches d'une étape.
 * Appelé après un changement de statut réussi.
 */
export function buildRappelsForStage(
  leadId: string,
  newStatut: StatutLead,
  assignedTo?: string | null,
): Array<{
  lead_id: string
  type: TypeRappel
  titre: string
  description: string
  date_rappel: string
  statut: 'EN_ATTENTE'
  assigned_to: string | null
}> {
  const tasks = getTasksForStage(newStatut)
  const now = new Date()

  return tasks.map(task => {
    const date = new Date(now.getTime() + task.delai_heures * 3600000)

    return {
      lead_id: leadId,
      type: task.type,
      titre: `[Auto] ${task.titre}`,
      description: task.description,
      date_rappel: date.toISOString(),
      statut: 'EN_ATTENTE' as const,
      assigned_to: assignedTo ?? null,
    }
  })
}
