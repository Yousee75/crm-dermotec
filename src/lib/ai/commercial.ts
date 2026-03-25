// ============================================================
// CRM DERMOTEC — Assistant IA Commercial
// Copilote de vente intégré au CRM pour les commerciaux
// ============================================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

interface LeadContext {
  prenom: string
  nom?: string
  email?: string
  telephone?: string
  statut: string
  statut_pro?: string
  experience_esthetique?: string
  source?: string
  formation_principale?: string
  formations_interessees?: string[]
  financement_souhaite?: boolean
  nb_contacts: number
  score_chaud: number
  date_dernier_contact?: string
  objectif_pro?: string
  message?: string
  tags?: string[]
  notes?: string
}

const COMMERCIAL_SYSTEM = `Tu es le copilote IA des commerciales de Dermotec Advanced, centre de formation esthétique certifié Qualiopi à Paris.

TON RÔLE : Aider les commerciales à convertir plus de leads en inscriptions.

CONTEXTE DERMOTEC :
- 11 formations (400-2500€ HT) : Microblading, Maquillage Permanent, Full Lips, Tricopigmentation, BB Glow, Plasma Pen, Hollywood Peel, Dermaplaning, Soins Corps, Soins Visage, Hygiène
- Financement : OPCO, CPF, France Travail, Alma 3x/4x sans frais
- Lieu : 75 Bd Richard Lenoir, Paris 11e
- Tél : 01 88 33 43 43
- +500 stagiaires formées, 4.9/5 Google

STYLE : Direct, actionnable, concret. Pas de blabla. Donne des scripts prêts à copier-coller.`

type AssistantAction =
  | 'draft_email'
  | 'draft_whatsapp'
  | 'draft_sms'
  | 'handle_objection'
  | 'suggest_next_action'
  | 'analyze_lead'
  | 'draft_relance'
  | 'financement_eligibility'
  | 'closing_script'
  | 'free_question'

interface AssistantRequest {
  action: AssistantAction
  lead?: LeadContext
  input?: string
  formations?: { nom: string; prix_ht: number; duree_jours: number }[]
}

interface AssistantResponse {
  content: string
  copyable_texts?: { label: string; text: string; canal?: string }[]
  suggested_actions?: { label: string; action: AssistantAction; input?: string }[]
}

const ACTION_PROMPTS: Record<AssistantAction, (req: AssistantRequest) => string> = {
  draft_email: (req) => `Rédige un email professionnel mais chaleureux pour ce lead.
${leadSummary(req.lead)}
${req.input ? `Contexte supplémentaire : ${req.input}` : 'Premier email de prise de contact.'}

Retourne en JSON : { "objet": "...", "corps": "..." (texte brut, pas HTML), "variante_courte": "..." (version SMS/WhatsApp en 160 chars) }`,

  draft_whatsapp: (req) => `Rédige un message WhatsApp court et percutant pour ce lead.
${leadSummary(req.lead)}
${req.input ? `Contexte : ${req.input}` : 'Premier contact.'}

Le message doit être informel mais pro, avec emoji modéré, max 300 caractères.
Retourne en JSON : { "message": "...", "variante_relance": "..." (si pas de réponse dans 3 jours) }`,

  draft_sms: (req) => `Rédige un SMS pour ce lead. MAX 160 caractères, signé "— Dermotec".
${leadSummary(req.lead)}
${req.input ? `Contexte : ${req.input}` : 'Rappel/relance.'}

Retourne en JSON : { "sms": "...", "sms_alternatif": "..." }`,

  handle_objection: (req) => `Le lead dit : "${req.input}"

${req.lead ? leadSummary(req.lead) : ''}

Donne-moi :
1. Une réponse courte (1-2 phrases) à dire au téléphone
2. Une réponse développée avec arguments
3. 2-3 questions de rebond pour reprendre le contrôle de la conversation

Retourne en JSON : { "reponse_courte": "...", "reponse_detaillee": "...", "questions_rebond": ["...", "...", "..."] }`,

  suggest_next_action: (req) => `Analyse ce lead et dis-moi exactement quoi faire MAINTENANT.
${leadSummary(req.lead)}

Retourne en JSON : {
  "action_prioritaire": "...",
  "canal_recommande": "whatsapp|email|telephone|sms",
  "meilleur_moment": "...",
  "script_suggere": "...",
  "raison": "..."
}`,

  analyze_lead: (req) => `Analyse en profondeur ce lead et donne-moi un brief commercial.
${leadSummary(req.lead)}

Retourne en JSON : {
  "diagnostic": "...",
  "points_forts": ["...", "..."],
  "points_attention": ["...", "..."],
  "formation_recommandee": "...",
  "financement_probable": "...",
  "strategie_conversion": "...",
  "probabilite_conversion": "haute|moyenne|faible",
  "delai_estime": "..."
}`,

  draft_relance: (req) => `Ce lead ne répond plus depuis ${req.input || 'plusieurs jours'}.
${leadSummary(req.lead)}

Rédige 3 messages de relance progressifs (du plus soft au plus direct) :
Retourne en JSON : { "relance_douce": "...", "relance_directe": "...", "relance_derniere_chance": "...", "canal_recommande": "..." }`,

  financement_eligibility: (req) => `Analyse l'éligibilité financement de ce lead.
${leadSummary(req.lead)}

Retourne en JSON : {
  "eligible": true/false,
  "organismes_possibles": [{"nom": "...", "probabilite": "haute|moyenne|faible", "montant_estimé": "...", "documents_requis": ["..."]}],
  "reste_a_charge_estime": "...",
  "script_presentation": "...",
  "conseil": "..."
}`,

  closing_script: (req) => `Le lead est chaud et prêt à s'inscrire. Donne-moi un script de closing.
${leadSummary(req.lead)}
${req.input ? `Contexte : ${req.input}` : ''}

Retourne en JSON : {
  "script_telephone": "...",
  "script_email_confirmation": "...",
  "objections_possibles": [{"objection": "...", "reponse": "..."}],
  "prochaines_etapes": ["..."]
}`,

  free_question: (req) => `${req.input}
${req.lead ? `\nContexte du lead actuel :\n${leadSummary(req.lead)}` : ''}

Réponds de manière concise et actionnable.`,
}

function leadSummary(lead?: LeadContext): string {
  if (!lead) return 'Pas de lead sélectionné.'
  const parts = [
    `Lead : ${lead.prenom} ${lead.nom || ''}`,
    `Statut : ${lead.statut}`,
    `Score : ${lead.score_chaud}/100`,
    lead.statut_pro ? `Pro : ${lead.statut_pro}` : null,
    lead.experience_esthetique ? `Expérience : ${lead.experience_esthetique}` : null,
    lead.formation_principale ? `Formation visée : ${lead.formation_principale}` : null,
    lead.source ? `Source : ${lead.source}` : null,
    lead.financement_souhaite ? 'Financement souhaité : OUI' : null,
    `Contacts : ${lead.nb_contacts}`,
    lead.date_dernier_contact ? `Dernier contact : ${lead.date_dernier_contact}` : null,
    lead.objectif_pro ? `Objectif : ${lead.objectif_pro}` : null,
    lead.message ? `Message initial : "${lead.message}"` : null,
    lead.notes ? `Notes : ${lead.notes}` : null,
    lead.tags?.length ? `Tags : ${lead.tags.join(', ')}` : null,
  ]
  return parts.filter(Boolean).join('\n')
}

export async function askCommercialAssistant(req: AssistantRequest): Promise<AssistantResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      content: "L'assistant IA n'est pas configuré. Ajoutez ANTHROPIC_API_KEY dans .env.local.",
    }
  }

  const prompt = ACTION_PROMPTS[req.action](req)

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: COMMERCIAL_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      return { content: "Erreur de l'IA. Réessayez dans quelques secondes." }
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    // Tenter de parser le JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return formatResponse(req.action, parsed)
      }
    } catch {
      // Pas de JSON, retourner le texte brut
    }

    return { content: text }
  } catch {
    return { content: "Erreur de connexion à l'IA." }
  }
}

function formatResponse(action: AssistantAction, data: Record<string, unknown>): AssistantResponse {
  const copyable_texts: { label: string; text: string; canal?: string }[] = []
  const suggested_actions: { label: string; action: AssistantAction; input?: string }[] = []

  switch (action) {
    case 'draft_email':
      if (data.objet) copyable_texts.push({ label: `📧 Email — ${data.objet}`, text: String(data.corps || ''), canal: 'email' })
      if (data.variante_courte) copyable_texts.push({ label: '💬 Version WhatsApp', text: String(data.variante_courte), canal: 'whatsapp' })
      suggested_actions.push({ label: 'Relance si pas de réponse', action: 'draft_relance', input: '3 jours' })
      return { content: `**Objet :** ${data.objet}\n\n${data.corps}`, copyable_texts, suggested_actions }

    case 'draft_whatsapp':
      if (data.message) copyable_texts.push({ label: '💬 WhatsApp', text: String(data.message), canal: 'whatsapp' })
      if (data.variante_relance) copyable_texts.push({ label: '🔄 Relance J+3', text: String(data.variante_relance), canal: 'whatsapp' })
      return { content: String(data.message), copyable_texts, suggested_actions }

    case 'draft_sms':
      if (data.sms) copyable_texts.push({ label: '📱 SMS', text: String(data.sms), canal: 'sms' })
      if (data.sms_alternatif) copyable_texts.push({ label: '📱 Alternative', text: String(data.sms_alternatif), canal: 'sms' })
      return { content: String(data.sms), copyable_texts, suggested_actions }

    case 'handle_objection':
      copyable_texts.push({ label: '💬 Réponse courte', text: String(data.reponse_courte || '') })
      suggested_actions.push({ label: 'Script de closing', action: 'closing_script' })
      return {
        content: `**Réponse courte :** ${data.reponse_courte}\n\n**Détail :** ${data.reponse_detaillee}\n\n**Questions rebond :**\n${(data.questions_rebond as string[] || []).map(q => `→ ${q}`).join('\n')}`,
        copyable_texts,
        suggested_actions,
      }

    case 'suggest_next_action':
      if (data.script_suggere) copyable_texts.push({ label: `📋 Script (${data.canal_recommande})`, text: String(data.script_suggere), canal: String(data.canal_recommande) })
      return {
        content: `**Action :** ${data.action_prioritaire}\n**Canal :** ${data.canal_recommande}\n**Quand :** ${data.meilleur_moment}\n**Raison :** ${data.raison}`,
        copyable_texts,
        suggested_actions: [
          { label: 'Rédiger le message', action: data.canal_recommande === 'email' ? 'draft_email' : 'draft_whatsapp' },
        ],
      }

    case 'analyze_lead':
      suggested_actions.push(
        { label: 'Rédiger un email', action: 'draft_email' },
        { label: 'Prochaine action', action: 'suggest_next_action' },
        { label: 'Éligibilité financement', action: 'financement_eligibility' },
      )
      return {
        content: `**Diagnostic :** ${data.diagnostic}\n\n**Points forts :** ${(data.points_forts as string[] || []).join(', ')}\n**Attention :** ${(data.points_attention as string[] || []).join(', ')}\n\n**Formation :** ${data.formation_recommandee}\n**Financement :** ${data.financement_probable}\n**Stratégie :** ${data.strategie_conversion}\n**Probabilité :** ${data.probabilite_conversion}\n**Délai :** ${data.delai_estime}`,
        copyable_texts,
        suggested_actions,
      }

    case 'financement_eligibility': {
      const organismes = (data.organismes_possibles as Array<{ nom: string; probabilite: string; montant_estimé: string }>) || []
      if (data.script_presentation) copyable_texts.push({ label: '📋 Script présentation financement', text: String(data.script_presentation) })
      return {
        content: `**Éligible :** ${data.eligible ? 'OUI' : 'NON'}\n\n**Organismes :**\n${organismes.map(o => `• ${o.nom} (${o.probabilite}) — ${o.montant_estimé}`).join('\n')}\n\n**Reste à charge :** ${data.reste_a_charge_estime}\n**Conseil :** ${data.conseil}`,
        copyable_texts,
        suggested_actions: [{ label: 'Script de closing', action: 'closing_script' }],
      }
    }

    case 'closing_script':
      if (data.script_telephone) copyable_texts.push({ label: '📞 Script téléphone', text: String(data.script_telephone) })
      if (data.script_email_confirmation) copyable_texts.push({ label: '📧 Email confirmation', text: String(data.script_email_confirmation), canal: 'email' })
      return {
        content: `**Script :**\n${data.script_telephone}\n\n**Objections possibles :**\n${(data.objections_possibles as Array<{objection: string; reponse: string}> || []).map(o => `• "${o.objection}" → ${o.reponse}`).join('\n')}\n\n**Prochaines étapes :**\n${(data.prochaines_etapes as string[] || []).map(e => `✅ ${e}`).join('\n')}`,
        copyable_texts,
        suggested_actions,
      }

    default:
      return { content: JSON.stringify(data, null, 2) }
  }
}

export type { AssistantAction, AssistantRequest, AssistantResponse, LeadContext }
