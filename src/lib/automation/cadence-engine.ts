// ============================================================
// CRM DERMOTEC — Moteur de Cadences de Vente
// Exécute des séquences multi-canal automatisées
// ============================================================

import type { CadenceInstance, CadenceStep, CadenceTemplate, Lead } from '@/types'

// Cadences prédéfinies pour le secteur formation esthétique
export const CADENCES_PREDEFINES: Omit<CadenceTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    nom: 'Nouveau Lead — Séquence d\'accueil',
    description: 'Séquence automatique pour les nouveaux leads : email de bienvenue, SMS J+1, relance WhatsApp J+3, appel J+5',
    declencheur: 'nouveau_lead',
    is_active: true,
    etapes: [
      { ordre: 1, type: 'email', delai_jours: 0, delai_heures: 0, sujet: 'Bienvenue chez Dermotec !', contenu: 'email_bienvenue' },
      { ordre: 2, type: 'sms', delai_jours: 1, delai_heures: 0, contenu: 'sms_bienvenue' },
      { ordre: 3, type: 'whatsapp', delai_jours: 3, delai_heures: 0, contenu: 'whatsapp_bienvenue' },
      { ordre: 4, type: 'rappel', delai_jours: 5, delai_heures: 0, contenu: 'Appeler le lead pour qualification' },
      { ordre: 5, type: 'email', delai_jours: 10, delai_heures: 0, sujet: 'Dernière chance — Places limitées', contenu: 'email_relance_places' },
    ],
  },
  {
    nom: 'Post-Formation — Fidélisation',
    description: 'J+1 remerciement, J+5 avis Google, J+30 upsell formation complémentaire',
    declencheur: 'post_formation',
    is_active: true,
    etapes: [
      { ordre: 1, type: 'email', delai_jours: 1, delai_heures: 0, sujet: 'Merci pour votre formation !', contenu: 'email_remerciement' },
      { ordre: 2, type: 'sms', delai_jours: 5, delai_heures: 0, contenu: 'sms_avis_google' },
      { ordre: 3, type: 'whatsapp', delai_jours: 7, delai_heures: 0, contenu: 'whatsapp_satisfaction' },
      { ordre: 4, type: 'email', delai_jours: 30, delai_heures: 0, sujet: 'Votre prochaine formation ?', contenu: 'email_upsell' },
      { ordre: 5, type: 'sms', delai_jours: 90, delai_heures: 0, contenu: 'sms_suivi_activite' },
    ],
  },
  {
    nom: 'Relance Financement',
    description: 'Suivi automatique des dossiers de financement en attente',
    declencheur: 'relance_financement',
    is_active: true,
    etapes: [
      { ordre: 1, type: 'email', delai_jours: 7, delai_heures: 0, sujet: 'Où en est votre dossier de financement ?', contenu: 'email_relance_financement' },
      { ordre: 2, type: 'sms', delai_jours: 15, delai_heures: 0, contenu: 'sms_relance_financement' },
      { ordre: 3, type: 'rappel', delai_jours: 21, delai_heures: 0, contenu: 'Appeler pour état du dossier financement' },
      { ordre: 4, type: 'whatsapp', delai_jours: 30, delai_heures: 0, contenu: 'whatsapp_relance_financement' },
    ],
  },
  {
    nom: 'Abandon — Réactivation',
    description: 'Relance des leads qui ne répondent plus depuis 14 jours',
    declencheur: 'abandon',
    is_active: true,
    etapes: [
      { ordre: 1, type: 'email', delai_jours: 0, delai_heures: 0, sujet: 'Avez-vous encore des questions ?', contenu: 'email_reactivation' },
      { ordre: 2, type: 'sms', delai_jours: 3, delai_heures: 0, contenu: 'sms_reactivation' },
      { ordre: 3, type: 'whatsapp', delai_jours: 7, delai_heures: 0, contenu: 'whatsapp_reactivation' },
      { ordre: 4, type: 'email', delai_jours: 14, delai_heures: 0, sujet: 'Dernière relance — On reste disponibles', contenu: 'email_derniere_relance' },
    ],
  },
]

// Évaluer si une cadence doit s'arrêter
export function shouldStopCadence(
  instance: CadenceInstance,
  lead: Lead,
  step: CadenceStep
): { stop: boolean; reason?: string } {
  // Si le lead a changé de statut vers un statut terminal
  if (['INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI'].includes(lead.statut)) {
    return { stop: true, reason: `Lead passé en statut ${lead.statut}` }
  }

  if (['PERDU', 'SPAM'].includes(lead.statut)) {
    return { stop: true, reason: `Lead marqué ${lead.statut}` }
  }

  // Condition custom sur l'étape
  if (step.condition_arret) {
    try {
      // Évaluation sécurisée de conditions simples
      if (step.condition_arret === 'lead.statut === "INSCRIT"' && lead.statut === 'INSCRIT') {
        return { stop: true, reason: 'Condition d\'arrêt atteinte : lead inscrit' }
      }
      if (step.condition_arret === 'lead.nb_contacts > 5' && lead.nb_contacts > 5) {
        return { stop: true, reason: 'Condition d\'arrêt : plus de 5 contacts' }
      }
    } catch {
      // Ignorer les erreurs de condition
    }
  }

  return { stop: false }
}

// Calculer la prochaine exécution d'une étape
export function getNextExecutionDate(
  startDate: string,
  step: CadenceStep
): Date {
  const date = new Date(startDate)
  date.setDate(date.getDate() + step.delai_jours)
  date.setHours(date.getHours() + step.delai_heures)

  // Ajuster pour heures ouvrées (mardi-jeudi 9h-17h = meilleur créneau)
  const hour = date.getHours()
  if (hour < 9) date.setHours(9, 0, 0, 0)
  if (hour > 17) {
    date.setDate(date.getDate() + 1)
    date.setHours(9, 0, 0, 0)
  }

  // Éviter week-end
  const day = date.getDay()
  if (day === 0) date.setDate(date.getDate() + 1) // Dimanche → Lundi
  if (day === 6) date.setDate(date.getDate() + 2) // Samedi → Lundi

  return date
}

// Générer le contenu du message selon le canal et le template
export function generateMessageContent(
  step: CadenceStep,
  lead: Lead,
  variables: Record<string, string> = {}
): { sujet?: string; contenu: string } {
  const vars: Record<string, string> = {
    prenom: lead.prenom,
    nom: lead.nom || '',
    email: lead.email || '',
    telephone: lead.telephone || '',
    ...variables,
  }

  let contenu = step.contenu || ''
  let sujet = step.sujet || ''

  // Remplacer les variables {{variable}}
  for (const [key, value] of Object.entries(vars)) {
    contenu = contenu.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    sujet = sujet.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }

  return { sujet: sujet || undefined, contenu }
}

// Stats d'une cadence
export function computeCadenceStats(instances: CadenceInstance[]): {
  total: number
  actives: number
  terminees: number
  arretees: number
  taux_completion: number
} {
  const total = instances.length
  const actives = instances.filter(i => i.statut === 'active').length
  const terminees = instances.filter(i => i.statut === 'terminee').length
  const arretees = instances.filter(i => i.statut === 'arretee').length
  const taux_completion = total > 0 ? Math.round((terminees / total) * 100) : 0

  return { total, actives, terminees, arretees, taux_completion }
}
