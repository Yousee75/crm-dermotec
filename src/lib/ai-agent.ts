// ============================================================
// CRM DERMOTEC — Agent IA Commercial
// Conseiller de vente temps réel basé UNIQUEMENT sur données internes
// Pas d'internet, pas de hallucination — que du CRM + knowledge base
// ============================================================

import { chatCompletion, type AIMessage } from './ai'
import { scoreLead, getScoreLabel } from './scoring'
import { getFinancementEligibility, calculateUpsellScore, getNextBestAction, getBestContactTime } from './marketing'
import type { Lead } from '@/types'

// --- Types ---

export interface AgentContext {
  lead?: LeadContext | null
  knowledgeBase: KBArticle[]
  conversationHistory: AgentMessage[]
}

export interface LeadContext {
  // Identité
  id: string
  prenom: string
  nom: string
  email: string
  telephone: string
  // Profil
  statut: string
  statut_pro: string
  experience_esthetique: string
  source: string
  priorite: string
  // Formation
  formation_principale: string | null
  formations_interessees: string[]
  // Engagement
  nb_contacts: number
  date_dernier_contact: string | null
  score: number
  score_label: string
  // Financement
  financement_souhaite: boolean
  financements: { organisme: string; statut: string; montant: number }[]
  // Historique
  notes: { contenu: string; type: string; created_at: string }[]
  activites: { type: string; description: string; created_at: string }[]
  inscriptions: { formation_nom: string; statut: string; satisfaction?: number }[]
  // Intelligence
  next_best_action: { action: string; reason: string; priority: string }
  upsell_score: number
  upsell_suggestions: string[]
  financement_eligible: string[]
  best_contact_time: { day: string; hour: string }
}

export interface KBArticle {
  categorie: string
  titre: string
  contenu: string
  formation_slug?: string
  statut_pro_cible?: string
  etape_pipeline?: string
}

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentResponse {
  reponse: string
  sources: string[]           // Titres des articles KB utilisés
  actions_suggerees: string[] // Actions concrètes
  confiance: 'haute' | 'moyenne' | 'basse'
}

// --- Chargement contexte CRM temps réel ---

export async function loadLeadContext(leadId: string): Promise<LeadContext | null> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Fetch lead complet avec relations
  const { data: lead, error } = await supabase
    .from('leads')
    .select(`
      *,
      formation_principale:formations!leads_formation_principale_id_fkey(nom, slug, prix_ht, categorie),
      inscriptions(
        id, statut,
        session:sessions(formation:formations(nom)),
        note_satisfaction, commentaire_satisfaction
      ),
      financements(organisme, statut, montant_demande, montant_accorde),
      notes_lead(contenu, type, created_at),
      activites(type, description, created_at)
    `)
    .eq('id', leadId)
    .single()

  if (error || !lead) return null

  // Calculer le scoring
  const scoreResult = scoreLead(lead as unknown as Lead)
  const nextAction = getNextBestAction(lead as unknown as Lead)
  const upsellResult = calculateUpsellScore(lead as unknown as Lead)
  const eligibility = getFinancementEligibility(lead.statut_pro || '')
  const bestTime = getBestContactTime()

  return {
    id: lead.id,
    prenom: lead.prenom || '',
    nom: lead.nom || '',
    email: lead.email || '',
    telephone: lead.telephone || '',
    statut: lead.statut,
    statut_pro: lead.statut_pro || 'non_renseigne',
    experience_esthetique: lead.experience_esthetique || 'non_renseigne',
    source: lead.source || '',
    priorite: lead.priorite || 'NORMALE',
    formation_principale: (lead.formation_principale as any)?.nom || null,
    formations_interessees: lead.formations_interessees?.map((f: any) => f.nom || f) || [],
    nb_contacts: lead.nb_contacts || 0,
    date_dernier_contact: lead.date_dernier_contact,
    score: scoreResult.total,
    score_label: getScoreLabel(scoreResult.total),
    financement_souhaite: lead.financement_souhaite || false,
    financements: (lead.financements || []).map((f: any) => ({
      organisme: f.organisme,
      statut: f.statut,
      montant: f.montant_accorde || f.montant_demande || 0,
    })),
    notes: (lead.notes_lead || [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((n: any) => ({ contenu: n.contenu, type: n.type, created_at: n.created_at })),
    activites: (lead.activites || [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15)
      .map((a: any) => ({ type: a.type, description: a.description, created_at: a.created_at })),
    inscriptions: (lead.inscriptions || []).map((i: any) => ({
      formation_nom: (i.session?.formation as any)?.nom || 'Inconnue',
      statut: i.statut,
      satisfaction: i.note_satisfaction,
    })),
    next_best_action: nextAction,
    upsell_score: upsellResult.score,
    upsell_suggestions: upsellResult.suggestions,
    financement_eligible: eligibility.eligible,
    best_contact_time: bestTime,
  }
}

// --- Chargement knowledge base pertinente ---

export async function loadRelevantKB(params: {
  query: string
  leadContext?: LeadContext | null
}): Promise<KBArticle[]> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const articles: KBArticle[] = []

  // 1. Full-text search sur la question
  const searchQuery = params.query
    .replace(/['"]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .join(' & ')

  if (searchQuery) {
    const { data: ftsResults } = await supabase
      .from('knowledge_base')
      .select('categorie, titre, contenu, formation_slug, statut_pro_cible, etape_pipeline')
      .textSearch('fts', searchQuery, { config: 'french' })
      .eq('is_active', true)
      .limit(5)

    if (ftsResults) articles.push(...ftsResults)
  }

  // 2. Articles liés au statut pro du lead
  if (params.leadContext?.statut_pro) {
    const { data: proResults } = await supabase
      .from('knowledge_base')
      .select('categorie, titre, contenu, formation_slug, statut_pro_cible, etape_pipeline')
      .eq('statut_pro_cible', params.leadContext.statut_pro)
      .eq('is_active', true)
      .limit(3)

    if (proResults) {
      for (const r of proResults) {
        if (!articles.some(a => a.titre === r.titre)) articles.push(r)
      }
    }
  }

  // 3. Articles liés à l'étape du pipeline
  if (params.leadContext?.statut) {
    const { data: pipelineResults } = await supabase
      .from('knowledge_base')
      .select('categorie, titre, contenu, formation_slug, statut_pro_cible, etape_pipeline')
      .eq('etape_pipeline', params.leadContext.statut)
      .eq('is_active', true)
      .limit(3)

    if (pipelineResults) {
      for (const r of pipelineResults) {
        if (!articles.some(a => a.titre === r.titre)) articles.push(r)
      }
    }
  }

  // 4. Si la question contient des mots-clés objection
  const objectionKeywords = ['cher', 'prix', 'budget', 'réfléchir', 'conjoint', 'peur', 'concurrent', 'moins cher', 'hésit']
  const hasObjection = objectionKeywords.some(k => params.query.toLowerCase().includes(k))
  if (hasObjection) {
    const { data: objResults } = await supabase
      .from('knowledge_base')
      .select('categorie, titre, contenu, formation_slug, statut_pro_cible, etape_pipeline')
      .eq('categorie', 'objection')
      .eq('is_active', true)
      .limit(4)

    if (objResults) {
      for (const r of objResults) {
        if (!articles.some(a => a.titre === r.titre)) articles.push(r)
      }
    }
  }

  // 5. Si pas assez de résultats, charger les articles prioritaires
  if (articles.length < 3) {
    const { data: priorityResults } = await supabase
      .from('knowledge_base')
      .select('categorie, titre, contenu, formation_slug, statut_pro_cible, etape_pipeline')
      .eq('is_active', true)
      .gte('priorite', 2)
      .limit(5)

    if (priorityResults) {
      for (const r of priorityResults) {
        if (!articles.some(a => a.titre === r.titre)) articles.push(r)
      }
    }
  }

  return articles.slice(0, 10) // Max 10 articles pour rester dans les limites du contexte
}

// --- Prompt système de l'agent ---

function buildAgentSystemPrompt(context: AgentContext): string {
  let prompt = `Tu es l'agent IA commercial de Dermotec Advanced, centre de formation esthétique certifié Qualiopi à Paris 11e.

MISSION : Aider le commercial à vendre en temps réel. Tu donnes des conseils concrets, actionnables, basés UNIQUEMENT sur les données du CRM et la base de connaissances Dermotec.

RÈGLES ABSOLUES :
1. Tu ne JAMAIS inventer d'information. Si tu ne sais pas, dis-le.
2. Tu ne cherches JAMAIS sur internet. Tes sources = CRM + knowledge base uniquement.
3. Tu parles en français, de façon directe et pratique.
4. Tu donnes des réponses courtes et actionnables — le commercial est au téléphone.
5. Tu cites tes sources quand c'est pertinent (ex: "Selon le script de vente : ...").
6. Tu ne dis JAMAIS "en tant qu'IA" — tu parles comme un collègue senior.
`

  // Injecter le contexte lead si disponible
  if (context.lead) {
    const l = context.lead
    prompt += `
═══ FICHE LEAD ACTUEL ═══
Nom : ${l.prenom} ${l.nom}
Statut pipeline : ${l.statut}
Statut pro : ${l.statut_pro}
Expérience : ${l.experience_esthetique}
Source : ${l.source}
Score : ${l.score}/100 (${l.score_label})
Formation principale : ${l.formation_principale || 'Non définie'}
Formations intéressées : ${l.formations_interessees.join(', ') || 'Aucune'}
Nb contacts : ${l.nb_contacts}
Dernier contact : ${l.date_dernier_contact || 'Jamais'}
Financement souhaité : ${l.financement_souhaite ? 'Oui' : 'Non'}
Priorité : ${l.priorite}

PROCHAINE ACTION RECOMMANDÉE : ${l.next_best_action.action}
Raison : ${l.next_best_action.reason}
Priorité action : ${l.next_best_action.priority}

Meilleur créneau : ${l.best_contact_time.day} ${l.best_contact_time.hour}
Organismes financement éligibles : ${l.financement_eligible.join(', ')}
`

    if (l.financements.length > 0) {
      prompt += `\nDossiers financement :\n`
      for (const f of l.financements) {
        prompt += `- ${f.organisme} : ${f.statut} (${f.montant}€)\n`
      }
    }

    if (l.inscriptions.length > 0) {
      prompt += `\nFormations suivies :\n`
      for (const i of l.inscriptions) {
        prompt += `- ${i.formation_nom} : ${i.statut}${i.satisfaction ? ` (satisfaction: ${i.satisfaction}/5)` : ''}\n`
      }
      prompt += `Score upsell : ${l.upsell_score}/100\n`
      if (l.upsell_suggestions.length > 0) {
        prompt += `Suggestions upsell : ${l.upsell_suggestions.join(', ')}\n`
      }
    }

    if (l.notes.length > 0) {
      prompt += `\nDernières notes :\n`
      for (const n of l.notes.slice(0, 5)) {
        const date = new Date(n.created_at).toLocaleDateString('fr-FR')
        prompt += `- [${date}] (${n.type}) ${n.contenu}\n`
      }
    }

    if (l.activites.length > 0) {
      prompt += `\nHistorique récent :\n`
      for (const a of l.activites.slice(0, 8)) {
        const date = new Date(a.created_at).toLocaleDateString('fr-FR')
        prompt += `- [${date}] ${a.type} : ${a.description}\n`
      }
    }
  }

  // Injecter la knowledge base
  if (context.knowledgeBase.length > 0) {
    prompt += `\n═══ BASE DE CONNAISSANCES DERMOTEC ═══\n`
    for (const article of context.knowledgeBase) {
      prompt += `\n--- [${article.categorie.toUpperCase()}] ${article.titre} ---\n${article.contenu}\n`
    }
  }

  prompt += `
═══ FORMAT DE RÉPONSE ═══
Réponds de façon concise et pratique. Structure ta réponse :
1. RÉPONSE DIRECTE (2-3 phrases max pour que le commercial puisse réagir immédiatement)
2. DÉVELOPPEMENT si nécessaire (détails, script, arguments)
3. ACTION SUGGÉRÉE (quoi faire maintenant, concrètement)

Si le commercial te pose une question sur un lead, utilise TOUTES les données de la fiche lead ci-dessus pour personnaliser ta réponse.`

  return prompt
}

// --- Fonction principale de l'agent ---

export async function askAgent(params: {
  question: string
  leadId?: string
  conversationHistory?: AgentMessage[]
}): Promise<AgentResponse> {
  // 1. Charger le contexte lead si fourni
  const leadContext = params.leadId ? await loadLeadContext(params.leadId) : null

  // 2. Charger la knowledge base pertinente
  const knowledgeBase = await loadRelevantKB({
    query: params.question,
    leadContext,
  })

  // 3. Construire le contexte
  const context: AgentContext = {
    lead: leadContext,
    knowledgeBase,
    conversationHistory: params.conversationHistory || [],
  }

  // 4. Construire les messages
  const messages: AIMessage[] = [
    { role: 'system', content: buildAgentSystemPrompt(context) },
  ]

  // Ajouter l'historique de conversation (max 6 messages pour rester dans les limites)
  for (const msg of (params.conversationHistory || []).slice(-6)) {
    messages.push({ role: msg.role, content: msg.content })
  }

  // Ajouter la question
  messages.push({ role: 'user', content: params.question })

  // 5. Appeler le LLM
  const response = await chatCompletion(messages, {
    temperature: 0.4, // Plus bas = plus factuel, moins créatif
    max_tokens: 1500,
  })

  if (!response) {
    return {
      reponse: 'Désolé, le service IA est temporairement indisponible. Vérifie la configuration des clés API.',
      sources: [],
      actions_suggerees: [],
      confiance: 'basse',
    }
  }

  // 6. Extraire les sources utilisées
  const sources = knowledgeBase
    .filter(kb => {
      // Vérifier si le contenu de l'article a été utilisé dans la réponse
      const keywords = kb.titre.toLowerCase().split(/\s+/).filter(w => w.length > 4)
      return keywords.some(k => response.content.toLowerCase().includes(k))
    })
    .map(kb => kb.titre)

  // 7. Extraire les actions suggérées
  const actions: string[] = []
  if (leadContext) {
    actions.push(leadContext.next_best_action.action)
    if (leadContext.financement_souhaite && leadContext.financements.length === 0) {
      actions.push(`Ouvrir un dossier ${leadContext.financement_eligible[0] || 'financement'}`)
    }
  }

  // 8. Déterminer la confiance
  const confiance = knowledgeBase.length >= 3 && leadContext
    ? 'haute'
    : knowledgeBase.length >= 1
    ? 'moyenne'
    : 'basse'

  return {
    reponse: response.content,
    sources,
    actions_suggerees: actions,
    confiance,
  }
}
