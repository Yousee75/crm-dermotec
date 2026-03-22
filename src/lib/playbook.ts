// ============================================================
// CRM DERMOTEC — Playbook Collaboratif
// Intelligence collective : objections, scripts, arguments
// ============================================================

import { chatCompletion, type AIMessage } from './ai'

// --- Types ---

export interface PlaybookEntry {
  id: string
  categorie: 'objection' | 'script' | 'argument' | 'temoignage' | 'astuce'
  titre: string
  contexte: string | null
  lead_id: string | null
  formation_slug: string | null
  statut_pro_cible: string | null
  etape_pipeline: string | null
  created_by: string | null
  occurences: number
  created_at: string
  // Joined
  author?: { prenom: string; nom: string }
  responses?: PlaybookResponse[]
  _count_responses?: number
}

export interface PlaybookResponse {
  id: string
  entry_id: string
  contenu: string
  is_ai_generated: boolean
  created_by: string | null
  upvotes: number
  downvotes: number
  succes: number
  echecs: number
  taux_succes: number
  promoted_to_kb: boolean
  created_at: string
  // Joined
  author?: { prenom: string; nom: string }
  user_vote?: 'up' | 'down' | null
}

// --- Catégories avec labels FR ---

export const PLAYBOOK_CATEGORIES = {
  objection: { label: 'Objection', icon: 'Shield', color: '#F59E0B' },
  script: { label: 'Script', icon: 'FileText', color: '#3B82F6' },
  argument: { label: 'Argument', icon: 'Lightbulb', color: '#22C55E' },
  temoignage: { label: 'Temoignage', icon: 'Star', color: '#8B5CF6' },
  astuce: { label: 'Astuce', icon: 'Zap', color: 'var(--color-primary)' },
} as const

// --- IA : Suggérer une réponse à une objection ---

export async function suggestPlaybookResponse(params: {
  objection: string
  contexte?: string
  existingResponses?: string[]
}): Promise<{ suggestion: string; argument_cle: string } | null> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `Tu es le coach commercial de Dermotec Advanced, centre de formation esthétique certifié Qualiopi à Paris.

MISSION : Suggérer la MEILLEURE réponse à une objection prospect.

CONTEXTE DERMOTEC :
- 11 formations (400€-2500€ HT), finançables à 100% (OPCO, France Travail, CPF)
- Cible : esthéticiennes, reconversions, gérantes institut
- Argument n°1 : "80% de nos stagiaires ne paient rien grâce au financement"
- Formations courtes (1-5 jours), pratique sur modèles, ROI rapide

RÈGLES :
1. Réponse COURTE et DIRECTE (le commercial est au téléphone)
2. Commence TOUJOURS par valider l'objection ("Je comprends...")
3. Rebondis avec un FAIT concret (prix, financement, ROI, témoignage)
4. Termine par une QUESTION OUVERTE pour relancer la conversation
5. Jamais agressif, jamais insistant
6. Si des réponses existantes sont fournies, propose une VARIANTE différente`,
    },
    {
      role: 'user',
      content: `OBJECTION : "${params.objection}"
${params.contexte ? `CONTEXTE : ${params.contexte}` : ''}
${params.existingResponses?.length ? `RÉPONSES EXISTANTES (propose une variante) :\n${params.existingResponses.map((r, i) => `${i + 1}. ${r}`).join('\n')}` : ''}

Réponds en JSON : { "suggestion": "ta réponse complète", "argument_cle": "l'argument principal en 1 phrase" }`,
    },
  ]

  const response = await chatCompletion(messages, {
    temperature: 0.6,
    max_tokens: 500,
    json_mode: true,
  })

  if (!response) return null

  try {
    return JSON.parse(response.content)
  } catch {
    return {
      suggestion: response.content,
      argument_cle: 'Voir suggestion complète',
    }
  }
}

// --- Onboarding : Définition des steps ---

export interface OnboardingStep {
  id: string
  niveau: 'basique' | 'intermediaire' | 'expert'
  ordre: number
  titre: string
  description: string
  action_cible?: string // URL ou action à faire pour valider
  tour_steps?: TourStep[] // Steps du tour guidé associé
}

export interface TourStep {
  element: string // data-tour selector
  title: string
  description: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  // === NIVEAU 1 : BASIQUE ===
  {
    id: 'basique_dashboard',
    niveau: 'basique',
    ordre: 1,
    titre: 'Découvrir le dashboard',
    description: 'Comprendre les KPIs et la vue d\'ensemble',
    action_cible: '/',
    tour_steps: [
      { element: '[data-tour="kpi-leads"]', title: 'Vos leads', description: 'Le nombre total de prospects dans le CRM.', side: 'bottom' },
      { element: '[data-tour="kpi-sessions"]', title: 'Sessions à venir', description: 'Les prochaines formations planifiées.', side: 'bottom' },
      { element: '[data-tour="rappels"]', title: 'Rappels du jour', description: 'Les actions à faire aujourd\'hui. Traitez-les en priorité !', side: 'top' },
    ],
  },
  {
    id: 'basique_creer_lead',
    niveau: 'basique',
    ordre: 2,
    titre: 'Créer un lead',
    description: 'Saisir un nouveau prospect dans le CRM',
    action_cible: '/leads',
    tour_steps: [
      { element: '[data-tour="btn-nouveau-lead"]', title: 'Nouveau lead', description: 'Cliquez ici pour ajouter un prospect. Minimum : prénom + email ou téléphone.', side: 'bottom' },
    ],
  },
  {
    id: 'basique_pipeline',
    niveau: 'basique',
    ordre: 3,
    titre: 'Naviguer dans le pipeline',
    description: 'Voir et déplacer les leads dans le pipeline',
    action_cible: '/pipeline',
    tour_steps: [
      { element: '[data-tour="pipeline-board"]', title: 'Le pipeline', description: 'Glissez-déposez les leads entre les colonnes pour mettre à jour leur statut.', side: 'top' },
    ],
  },
  {
    id: 'basique_statut',
    niveau: 'basique',
    ordre: 4,
    titre: 'Changer un statut',
    description: 'Passer un lead de NOUVEAU à CONTACTÉ',
  },
  {
    id: 'basique_rappel',
    niveau: 'basique',
    ordre: 5,
    titre: 'Créer un rappel',
    description: 'Planifier un suivi pour un lead',
  },
  {
    id: 'basique_agent_ia',
    niveau: 'basique',
    ordre: 6,
    titre: 'Utiliser l\'Agent IA',
    description: 'Poser une question à l\'assistant commercial',
    tour_steps: [
      { element: '[data-tour="ai-button"]', title: 'Agent IA', description: 'Cliquez ici pour ouvrir l\'assistant. Il connaît vos leads et peut vous conseiller en temps réel.', side: 'left' },
    ],
  },

  // === NIVEAU 2 : INTERMÉDIAIRE ===
  {
    id: 'inter_scoring',
    niveau: 'intermediaire',
    ordre: 7,
    titre: 'Comprendre le scoring',
    description: 'Lire et interpréter le score d\'un lead (/100)',
  },
  {
    id: 'inter_financement',
    niveau: 'intermediaire',
    ordre: 8,
    titre: 'Ouvrir un dossier financement',
    description: 'Créer et suivre un dossier OPCO/France Travail',
    action_cible: '/financement',
  },
  {
    id: 'inter_playbook',
    niveau: 'intermediaire',
    ordre: 9,
    titre: 'Utiliser le playbook',
    description: 'Trouver et contribuer aux meilleures réponses',
    action_cible: '/playbook',
  },
  {
    id: 'inter_email_ia',
    niveau: 'intermediaire',
    ordre: 10,
    titre: 'Générer un email IA',
    description: 'Créer un email personnalisé avec l\'assistant',
  },
  {
    id: 'inter_cockpit',
    niveau: 'intermediaire',
    ordre: 11,
    titre: 'Maîtriser le cockpit',
    description: 'Utiliser les smart actions pour prioriser sa journée',
    action_cible: '/cockpit',
  },

  // === NIVEAU 3 : EXPERT ===
  {
    id: 'expert_flash',
    niveau: 'expert',
    ordre: 12,
    titre: 'Lancer une offre flash',
    description: 'Remplir une session avec une promotion ciblée',
  },
  {
    id: 'expert_financement_complet',
    niveau: 'expert',
    ordre: 13,
    titre: 'Suivi financement bout en bout',
    description: 'Gérer un dossier de la préparation au versement',
  },
  {
    id: 'expert_contribuer_playbook',
    niveau: 'expert',
    ordre: 14,
    titre: 'Enrichir le playbook',
    description: 'Ajouter une objection et voter sur les réponses',
  },
  {
    id: 'expert_analytics',
    niveau: 'expert',
    ordre: 15,
    titre: 'Analyser le funnel',
    description: 'Interpréter les analytics pour décider',
    action_cible: '/analytics',
  },
]

export function getStepsByNiveau(niveau: 'basique' | 'intermediaire' | 'expert'): OnboardingStep[] {
  return ONBOARDING_STEPS.filter(s => s.niveau === niveau).sort((a, b) => a.ordre - b.ordre)
}

export function calculateProgress(completedStepIds: string[], niveau?: string): {
  total: number
  completed: number
  percent: number
} {
  const steps = niveau
    ? ONBOARDING_STEPS.filter(s => s.niveau === niveau)
    : ONBOARDING_STEPS

  const completed = steps.filter(s => completedStepIds.includes(s.id)).length
  return {
    total: steps.length,
    completed,
    percent: steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0,
  }
}
