// ============================================================
// CRM DERMOTEC — Génération rapport Satorea via Claude API
// Structured output → RapportSatorea JSON validé
// ============================================================
import 'server-only'

import { generateText } from 'ai'
import { getModel } from '../ai-sdk'
import { SATOREA_SYSTEM_PROMPT, buildUserPrompt } from './prompts'
import type { ProspectData, RapportSatorea } from './types'

/**
 * Génère un rapport commercial complet via Claude structured output
 */
export async function genererRapportSatorea(prospect: ProspectData): Promise<RapportSatorea> {
  const userPrompt = buildUserPrompt(prospect)

  const { text } = await generateText({
    model: getModel('best'),
    system: SATOREA_SYSTEM_PROMPT,
    prompt: `${userPrompt}

IMPORTANT : Retourne UNIQUEMENT un JSON valide correspondant à cette structure exacte :
{
  "accroche": "string — phrase d'accroche unique pour cet appel",
  "angle_unique": "string — argument différenciant pour CE prospect",
  "argument_tarifaire": "string — cohérence tarifaire personnalisée",
  "analyse_reputation": "string — analyse rapide de la réputation",
  "profil_psychologique": "string — profil commercial du prospect",
  "argument_opco": "string — argument OPCO personnalisé",
  "conclusion_emotionnelle": "string — message de clôture émotionnel",
  "kpi": {
    "ca_mensuel_conservateur": number,
    "ca_mensuel_mixte": number,
    "ca_mensuel_optimiste": number,
    "ca_annuel_mixte": number,
    "remboursement_jours": number,
    "anciennete_ans": number,
    "score_reputation": number
  },
  "script": [
    { "numero": 1, "nom": "Accroche", "duree_secondes": 15, "texte": "string", "conseil": "string" },
    { "numero": 2, "nom": "Angle unique", "duree_secondes": 20, "texte": "string", "conseil": "string" },
    { "numero": 3, "nom": "Les chiffres", "duree_secondes": 30, "texte": "string", "conseil": "string" },
    { "numero": 4, "nom": "Closing", "duree_secondes": 15, "texte": "string", "conseil": "string" }
  ],
  "objections": [
    { "objection": "string", "diagnostic_psychologique": "string", "reponse_principale": "string", "pivot_si_insistance": "string" }
  ],
  "timeline": [
    { "jour": "J0", "action": "string", "canal": "string", "objectif": "string", "est_critique": false }
  ],
  "mots_interdits": [
    { "interdit": "string", "a_dire": "string", "raison": "string" }
  ]
}

5 objections, 6 actions timeline, 5+ mots interdits. Pas de markdown, pas de commentaires, JUSTE le JSON.`,
    temperature: 0.7,
    maxOutputTokens: 6000,
  })

  // Parser le JSON — trouver le premier { et le dernier }
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Claude n\'a pas retourné de JSON valide')
  }

  let rapport: RapportSatorea
  try {
    rapport = JSON.parse(text.slice(firstBrace, lastBrace + 1))
  } catch (parseError) {
    // Tenter de nettoyer les trailing commas et re-parser
    const cleaned = text.slice(firstBrace, lastBrace + 1)
      .replace(/,\s*([\]}])/g, '$1')
    rapport = JSON.parse(cleaned)
  }

  // Ajouter les métadonnées
  rapport.date_generation = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Classification basée sur le score
  const score = prospect.scores?.global || prospect.reputation.note_globale * 20 || 50
  rapport.score_chaleur = Math.round(score)
  rapport.classification = score >= 60 ? 'CHAUD' : score >= 30 ? 'TIEDE' : 'FROID'

  return rapport
}
