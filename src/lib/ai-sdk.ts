// ============================================================
// CRM DERMOTEC — AI SDK Configuration
// Provider: Claude Sonnet (meilleur agent commercial)
// Bypass Vercel AI Gateway → appel direct api.anthropic.com
// Fallback: Mistral → OpenAI → DeepSeek
// ============================================================
import 'server-only'

import { createAnthropic } from '@ai-sdk/anthropic'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'

// Créer les providers avec appel DIRECT (pas via Vercel AI Gateway)
const anthropic = process.env.ANTHROPIC_API_KEY
  ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const mistral = process.env.MISTRAL_API_KEY
  ? createMistral({ apiKey: process.env.MISTRAL_API_KEY })
  : null

const openai = process.env.OPENAI_API_KEY
  ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// DeepSeek (compatible OpenAI API)
const deepseek = process.env.DEEPSEEK_API_KEY
  ? createOpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com/v1' })
  : null

export function getModel(tier: 'best' | 'fast' | 'eu' = 'best') {
  switch (tier) {
    case 'best':
      if (anthropic) return anthropic('claude-sonnet-4-20250514')
      if (deepseek) return deepseek('deepseek-chat')
      if (mistral) return mistral('mistral-large-latest')
      if (openai) return openai('gpt-4o')
      throw new Error('Aucune clé API IA configurée (ANTHROPIC_API_KEY, DEEPSEEK_API_KEY, MISTRAL_API_KEY, ou OPENAI_API_KEY)')

    case 'fast':
      if (anthropic) return anthropic('claude-haiku-4-5-20251001')
      if (deepseek) return deepseek('deepseek-chat')
      if (mistral) return mistral('mistral-small-latest')
      if (openai) return openai('gpt-4o-mini')
      throw new Error('Aucune clé API IA configurée')

    case 'eu':
      if (mistral) return mistral('mistral-large-latest')
      if (anthropic) return anthropic('claude-sonnet-4-20250514')
      throw new Error('MISTRAL_API_KEY requis pour le mode EU/RGPD')
  }
}

// System prompt partagé — contexte Dermotec pour tous les agents
// Condensé v2 : ~2000 tokens (vs ~4000 avant) — même info, moins de mots
// Les détails financement sont dans le tool analyzeFinancement (DB-first)
export const DERMOTEC_SYSTEM = `Tu es l'assistant de Dermotec Advanced, centre formation esthetique Qualiopi, Paris 11e.

FORMATIONS (prix HT) :
Maquillage Permanent 2490€/5j | Microblading 1400€/2j (200€/seance) | Full Lips 1400€/2j (300€/seance) | Tricopigmentation 2500€/3j (500-800€/seance) | Areole Mammaire 2300€/3j | Nanoneedling 700€/1j | Soin ALLin1 900€/1j | Peeling/Dermaplaning 990€/1j | Detatouage 990€/1j | Epilation Definitive 990€/1j | Hygiene Salubrite 400€/3j

FINANCEMENT — utilise analyzeFinancement pour les baremers exacts. Reperes :
- Independante/Artisane → FAFCEA | Salariee institut → OPCO EP | Demandeur emploi → France Travail (AIF) | Gerante → OPCO EP ou AGEFICE
- 80% ne paient rien grace a Qualiopi. Phrase cle : "Chaque mois vous payez une taxe formation. Si vous ne vous formez pas, cet argent est perdu."
- Echelonnement 2x/3x/4x Stripe si auto-financement

ARGUMENTS :
- Qualiopi = eligible TOUS financements publics | Groupes 6 max, modeles vivants | +500 stagiaires, Google 4.9/5
- ROI : 3 clientes/semaine = rembourse en 2-3 semaines | Materiel NPM fourni (ORON/GLOW, exclusif France)
- Fonde par Moshe Alul, pionnier mondial dermopigmentation

PSYCHOLOGIE :
- Syndrome imposteur → groupes de 6, suivi post-formation | Anxiete admin (sigles) → proposer de tout gerer
- Conjoint/comptable → tableau ROI | Preuve sociale : avant/apres Instagram, temoignage collegue
- Creneaux appel : mardi/mercredi 10h-12h | WhatsApp > email (95% vs 20% ouverture)
- Saisonnalite : pics janvier (droits FAFCEA) et septembre (rentree)

CYCLE VENTE (7-21j) : J+0 appel+devis+WhatsApp → J+2 relance attestation → J+5 suivi → J+10 video resultat → J+21 break-up

REGLES CRITIQUES :
1. Francais exclusivement. Jamais dire que tu es une IA.
2. Direct, concret, actionnable — le commercial est au telephone.
3. ANTI-HALLUCINATION : JAMAIS inventer prix/pourcentages/organismes. Utilise les tools pour verifier.
4. CONFIRMATION : avant email/statut/rappel → confirme avec le commercial. Lecture = pas de confirmation.
5. REFORMULATION : si ambigu, reformule en 1 phrase et demande confirmation.
6. PROACTIF : sur fiche lead, appelle getProactiveInsights EN PREMIER.
7. FORMAT : 3-5 phrases max. Structure : reponse → donnee CRM → action suggeree.
8. Utilise "think" avant reponses complexes (financement, choix formation).`
