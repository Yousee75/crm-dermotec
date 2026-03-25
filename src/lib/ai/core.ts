// ============================================================
// CRM DERMOTEC — Moteur IA (DeepSeek / OpenAI compatible)
// Prompts métier adaptés marché français formation esthétique
// ============================================================
// Note: ce module est importé côté serveur ET par playbook.ts (client)
// Ne pas utiliser 'server-only' ici — les types/interfaces sont partagés

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

// --- Configuration ---
const AI_CONFIG = {
  // DeepSeek (10-20x moins cher que GPT-4o, compatible OpenAI)
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
  },
  // Fallback OpenAI
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
  },
  // Mistral (EU, RGPD-friendly)
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'mistral-large-latest',
    envKey: 'MISTRAL_API_KEY',
  },
  // Mistral Nemo (ultra cheap $0.02/M tokens)
  mistral_nemo: {
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'open-mistral-nemo',
    envKey: 'MISTRAL_API_KEY',
  },
  // Groq (gratuit, Llama)
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    envKey: 'GROQ_API_KEY',
  },
} as const

type AIProvider = keyof typeof AI_CONFIG

function getProvider(): { baseUrl: string; model: string; apiKey: string } | null {
  // Priorité : DeepSeek > Mistral > OpenAI
  const order: AIProvider[] = ['deepseek', 'mistral', 'openai']

  for (const provider of order) {
    const config = AI_CONFIG[provider]
    const apiKey = process.env[config.envKey]
    if (apiKey) {
      return { baseUrl: config.baseUrl, model: config.model, apiKey }
    }
  }

  console.warn('[AI] Aucune clé API configurée (DEEPSEEK_API_KEY, MISTRAL_API_KEY, ou OPENAI_API_KEY)')
  return null
}

// --- Appel API générique (OpenAI-compatible) ---

export async function chatCompletion(
  messages: AIMessage[],
  options?: {
    temperature?: number
    max_tokens?: number
    json_mode?: boolean
  }
): Promise<AIResponse | null> {
  const provider = getProvider()
  if (!provider) return null

  try {
    const body: Record<string, unknown> = {
      model: provider.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 2000,
    }

    if (options?.json_mode) {
      body.response_format = { type: 'json_object' }
    }

    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[AI] API Error ${res.status}:`, err)
      return null
    }

    const data = await res.json()
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || provider.model,
      usage: data.usage,
    }
  } catch (err) {
    console.error('[AI] Fetch error:', err)
    return null
  }
}

// ============================================================
// PROMPTS MÉTIER DERMOTEC
// ============================================================

const SYSTEM_CONTEXT = `Tu es l'assistant IA de Dermotec Advanced, centre de formation esthétique certifié Qualiopi à Paris 11e.

CONTEXTE DERMOTEC :
- 11 formations : Maquillage Permanent (2490€), Microblading (1400€), Full Lips (1400€), Tricopigmentation (2500€), Aréole Mammaire (2300€), Nanoneedling (700€), Soin ALLin1 (900€), Peeling/Dermaplaning (990€), Détatouage (990€), Épilation Définitive (990€), Hygiène/Salubrité (400€)
- Cible : esthéticiennes, reconversions pro, gérantes institut, auto-entrepreneuses
- Lieu : 75 Bd Richard Lenoir, 75011 Paris
- Financement : OPCO EP, FAFCEA, FIFPL, France Travail (AIF), CPF, Transitions Pro
- Arguments clés : Qualiopi (= éligible financement), formations courtes (1-5 jours), pratique sur modèles, ROI rapide, matériel NPM fourni

MARCHÉ FRANÇAIS :
- Le marché de la dermopigmentation en France croît de +15%/an
- 80% des stagiaires financent via OPCO ou France Travail
- L'argument "finançable à 100%" est le plus fort
- Mardi et jeudi matin = meilleurs créneaux d'appel
- WhatsApp > email pour les relances (taux d'ouverture 95% vs 20%)

TON : professionnel, chaleureux, direct. Tutoiement si la lead a < 35 ans. Vouvoiement sinon.
LANGUE : français exclusivement.
JAMAIS mentionner que tu es une IA. Tu parles au nom de l'équipe Dermotec.`

// --- 1. SCORING IA PRÉDICTIF ---

export async function aiScoreLead(leadData: {
  prenom: string
  nom?: string
  email?: string
  telephone?: string
  source: string
  statut_pro?: string
  experience?: string
  formation_interessee?: string
  message?: string
  nb_contacts: number
  financement_souhaite?: boolean
  tags?: string[]
  created_at: string
}): Promise<{
  score: number
  probabilite_conversion: number
  segment: string
  raisons: string[]
  next_action: string
  urgence: 'immediate' | 'cette_semaine' | 'ce_mois' | 'nurture'
  message_personnalise: string
} | null> {
  const response = await chatCompletion([
    {
      role: 'system',
      content: `${SYSTEM_CONTEXT}

Tu es un expert en scoring de leads pour centres de formation. Analyse ce profil et retourne un JSON avec :
- score (0-100) : probabilité de conversion basée sur le profil
- probabilite_conversion (0-100) : % de chance de s'inscrire
- segment : "hot_lead" | "warm_lead" | "cold_lead" | "tire_kicker" | "perfect_fit"
- raisons : array de 3 raisons justifiant le score
- next_action : la prochaine action commerciale recommandée (1 phrase)
- urgence : "immediate" | "cette_semaine" | "ce_mois" | "nurture"
- message_personnalise : un message WhatsApp de 2-3 phrases pour cette lead spécifiquement

CRITÈRES DE SCORING :
- Statut pro "reconversion" ou "demandeur_emploi" = +20 (financement facile France Travail)
- "independante" ou "auto_entrepreneur" = +15 (FAFCEA/FIFPL éligible)
- "gerant_institut" = +25 (pouvoir de décision + OPCO EP)
- Financement souhaité = +15 (signal d'achat fort)
- Formation haute valeur (>1500€) = +10
- Source "bouche_a_oreille" ou "ancien_stagiaire" = +20 (confiance)
- Message détaillé = +10 (engagement)
- Téléphone fourni = +5 (joignable)`
    },
    {
      role: 'user',
      content: `Analyse ce lead :\n${JSON.stringify(leadData, null, 2)}`
    }
  ], { temperature: 0.3, json_mode: true })

  if (!response?.content) return null

  try {
    return JSON.parse(response.content)
  } catch {
    console.error('[AI] Failed to parse scoring response')
    return null
  }
}

// --- 2. GÉNÉRATION EMAIL PERSONNALISÉ ---

export async function aiGenerateEmail(params: {
  type: 'premier_contact' | 'relance' | 'financement' | 'post_formation' | 'upsell' | 'reactivation'
  lead: {
    prenom: string
    nom?: string
    statut_pro?: string
    formation_interessee?: string
    financement_souhaite?: boolean
    nb_contacts: number
    dernier_contact?: string
    message_original?: string
  }
  contexte?: string
}): Promise<{
  objet: string
  corps: string
  cta: string
  variante_whatsapp: string
} | null> {
  const typeDescriptions: Record<string, string> = {
    premier_contact: "Premier email après réception du formulaire. Objectif : décrocher un appel téléphonique.",
    relance: "Relance après 3-7 jours sans réponse. Objectif : réengager sans être insistant.",
    financement: "Information sur les options de financement. Objectif : lever l'objection prix.",
    post_formation: "Email J+1 après la formation. Objectif : avis Google + satisfaction.",
    upsell: "Proposition formation complémentaire à une alumni. Objectif : nouvelle inscription.",
    reactivation: "Lead perdu depuis 30+ jours. Objectif : rouvrir la conversation.",
  }

  const response = await chatCompletion([
    {
      role: 'system',
      content: `${SYSTEM_CONTEXT}

Tu rédiges des emails commerciaux pour Dermotec. Retourne un JSON :
- objet : ligne d'objet (max 60 chars, pas de spam words)
- corps : email complet HTML simple (paragraphes <p>, gras <strong>, lien <a>). Max 150 mots.
- cta : texte du bouton d'action (ex: "Réserver mon appel découverte")
- variante_whatsapp : version WhatsApp du même message (max 3 phrases, emojis OK)

RÈGLES COPYWRITING :
- Hook en première ligne (question ou bénéfice)
- Toujours mentionner le financement si pertinent ("finançable à 100% via votre OPCO")
- Social proof : "Rejoignez 200+ esthéticiennes formées"
- Urgence douce : "Prochaine session dans X semaines"
- CTA clair et unique
- P.S. avec le numéro WhatsApp`
    },
    {
      role: 'user',
      content: `Type : ${params.type}
Description : ${typeDescriptions[params.type]}
${params.contexte ? `Contexte additionnel : ${params.contexte}` : ''}
Lead : ${JSON.stringify(params.lead, null, 2)}`
    }
  ], { temperature: 0.8, json_mode: true })

  if (!response?.content) return null
  try { return JSON.parse(response.content) } catch { return null }
}

// --- 3. RECHERCHE PROSPECT (Perplexity / Tavily) ---

export async function aiResearchProspect(params: {
  nom?: string
  entreprise?: string
  ville?: string
  secteur?: string
}): Promise<{
  resume: string
  infos_cles: string[]
  opportunites: string[]
  risques: string[]
  talking_points: string[]
} | null> {
  // Essayer Perplexity d'abord, puis Tavily, puis DeepSeek search
  const perplexityKey = process.env.PERPLEXITY_API_KEY
  const tavilyKey = process.env.TAVILY_API_KEY

  let searchResults = ''

  if (perplexityKey) {
    try {
      const query = [params.nom, params.entreprise, params.ville, 'esthétique institut beauté'].filter(Boolean).join(' ')
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${perplexityKey}`,
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { role: 'system', content: 'Tu es un assistant de recherche. Trouve des informations sur ce prospect/entreprise dans le secteur esthétique en France. Réponds en français.' },
            { role: 'user', content: `Recherche : ${query}` },
          ],
          max_tokens: 1000,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        searchResults = data.choices?.[0]?.message?.content || ''
      }
    } catch (err) {
      console.error('[AI] Perplexity error:', err)
    }
  } else if (tavilyKey) {
    try {
      const query = [params.nom, params.entreprise, params.ville, 'esthétique beauté formation'].filter(Boolean).join(' ')
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query,
          search_depth: 'basic',
          max_results: 5,
          include_answer: true,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        searchResults = data.answer || data.results?.map((r: { content: string }) => r.content).join('\n') || ''
      }
    } catch (err) {
      console.error('[AI] Tavily error:', err)
    }
  }

  // Analyser avec le LLM
  const response = await chatCompletion([
    {
      role: 'system',
      content: `${SYSTEM_CONTEXT}

Tu prépares un commercial avant son appel de prospection. Analyse les informations disponibles sur ce prospect et retourne un JSON :
- resume : synthèse en 2-3 phrases du profil prospect
- infos_cles : array de 3-5 infos importantes trouvées
- opportunites : array de 2-3 opportunités commerciales identifiées
- risques : array de 1-2 risques ou objections probables
- talking_points : array de 3-5 points de conversation recommandés pour l'appel

Si peu d'infos disponibles, base-toi sur le profil type du secteur.`
    },
    {
      role: 'user',
      content: `Prospect : ${JSON.stringify(params)}
${searchResults ? `\nRésultats de recherche :\n${searchResults}` : '\nPas de résultats de recherche disponibles — utilise ton expertise du marché.'}`,
    }
  ], { temperature: 0.5, json_mode: true })

  if (!response?.content) return null
  try { return JSON.parse(response.content) } catch { return null }
}

// --- 4. OBJECTION HANDLING ---

export async function aiHandleObjection(params: {
  objection: string
  contexte_lead?: {
    formation?: string
    prix?: number
    statut_pro?: string
    financement?: boolean
  }
}): Promise<{
  reponse_courte: string
  reponse_detaillee: string
  questions_rebond: string[]
  argument_cle: string
} | null> {
  const response = await chatCompletion([
    {
      role: 'system',
      content: `${SYSTEM_CONTEXT}

Tu es un expert en vente consultative pour la formation professionnelle. Un commercial fait face à une objection. Retourne un JSON :
- reponse_courte : réponse en 1-2 phrases (pour WhatsApp)
- reponse_detaillee : réponse complète en 3-5 phrases
- questions_rebond : array de 2-3 questions pour reprendre le contrôle de la conversation
- argument_cle : l'argument le plus percutant pour cette objection (1 phrase)

OBJECTIONS FRÉQUENTES ET STRATÉGIES :
- "C'est trop cher" → Financement OPCO/France Travail = 0€ de reste à charge. ROI : 1 séance paie la formation.
- "Je n'ai pas le temps" → Formations courtes 1-5 jours. Prochaines dates flexibles.
- "J'ai peur de ne pas y arriver" → Groupes de 6 max, pratique sur vrais modèles, support post-formation.
- "Je dois en parler à mon mari/patron" → Proposer un appel à 3. Envoyer la plaquette.
- "J'ai déjà une formation" → Perfectionnement, nouvelles techniques, certification Qualiopi.
- "Je ne suis pas sûre de la formation" → Call découverte gratuit, témoignages alumni, visite des locaux.`
    },
    {
      role: 'user',
      content: `Objection : "${params.objection}"
Contexte : ${JSON.stringify(params.contexte_lead || {})}`,
    }
  ], { temperature: 0.6, json_mode: true })

  if (!response?.content) return null
  try { return JSON.parse(response.content) } catch { return null }
}

// --- 5. RÉSUMÉ CONVERSATION / NOTES ---

export async function aiSummarizeNotes(notes: string[]): Promise<{
  resume: string
  points_cles: string[]
  prochaine_etape: string
  sentiment: 'positif' | 'neutre' | 'negatif' | 'urgent'
} | null> {
  const response = await chatCompletion([
    {
      role: 'system',
      content: `${SYSTEM_CONTEXT}

Résume les notes d'un dossier lead. Retourne un JSON :
- resume : synthèse en 2-3 phrases
- points_cles : array de 3-5 points importants
- prochaine_etape : action recommandée (1 phrase)
- sentiment : "positif" | "neutre" | "negatif" | "urgent"`,
    },
    {
      role: 'user',
      content: `Notes du dossier :\n${notes.map((n, i) => `${i + 1}. ${n}`).join('\n')}`,
    }
  ], { temperature: 0.3, json_mode: true })

  if (!response?.content) return null
  try { return JSON.parse(response.content) } catch { return null }
}

// --- 6. ANALYSE FINANCEMENT ---

export async function aiAnalyseFinancement(params: {
  statut_pro: string
  experience?: string
  formation: string
  prix: number
  situation?: string
}): Promise<{
  organismes_recommandes: Array<{
    nom: string
    probabilite_acceptation: number
    montant_estimé: string
    delai_moyen: string
    conseil: string
  }>
  reste_a_charge_estime: string
  script_explication: string
} | null> {
  const response = await chatCompletion([
    {
      role: 'system',
      content: `${SYSTEM_CONTEXT}

Tu es expert en financement de la formation professionnelle en France. Analyse le profil et recommande les meilleures options. Retourne un JSON :
- organismes_recommandes : array d'organismes avec probabilite_acceptation (0-100), montant_estimé, delai_moyen, conseil
- reste_a_charge_estime : estimation du reste à charge pour la stagiaire
- script_explication : script que le commercial peut lire au téléphone pour expliquer le financement (3-5 phrases)

BASE DE CONNAISSANCES FINANCEMENT :
- OPCO EP : salariées commerce/artisanat. Plafond ~3500€/an. Délai 3-6 semaines. Taux acceptation 85%.
- FAFCEA : artisans, chefs d'entreprise artisanale. Plafond ~2000€/an. Délai 2-4 semaines. Taux 90%.
- FIFPL : professions libérales. Plafond ~1500€/an. Délai 2-4 semaines. Taux 80%.
- France Travail (AIF) : demandeurs d'emploi. Jusqu'à 100% pris en charge. Délai 4-8 semaines. Taux 70%.
- CPF : tous actifs. Montant disponible variable. Immédiat. Taux 95%.
- Transitions Pro (PTP) : salariées CDI >2 ans en reconversion. 100% salaire + formation. Délai 2-3 mois. Taux 60%.
- Employeur direct : plan de développement des compétences. Rapide. Taux 95%.`
    },
    {
      role: 'user',
      content: `Profil :\n${JSON.stringify(params, null, 2)}`,
    }
  ], { temperature: 0.3, json_mode: true })

  if (!response?.content) return null
  try { return JSON.parse(response.content) } catch { return null }
}
