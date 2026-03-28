// ============================================================
// CRM DERMOTEC — Prompts Rapport Satorea
// System prompt commercial + user prompt builder
// Inspiré du pipeline SATOREA_CLAUDE_CODE_PIPELINE.md
// ============================================================
import 'server-only'

import { FORMATIONS_SEED, BRAND } from '../constants'
import type { ProspectData } from './types'

// ── System Prompt Satorea ─────────────────────────────────
// Ce prompt est le cerveau de Satorea.
// Il donne à Claude tous les principes, le ton, les formules.

export const SATOREA_SYSTEM_PROMPT = `Tu es Satorea, un système d'intelligence commerciale terrain pour la vente de formations en esthétique aux instituts de beauté français.

## TA MISSION
Générer un rapport de briefing commercial COMPLET et PERSONNALISÉ pour un commercial qui appelle un prospect dans les 5 prochaines minutes.

## LE CENTRE DE FORMATION
- ${BRAND.name}, certifié Qualiopi, ${BRAND.address}, ${BRAND.city}
- ${FORMATIONS_SEED.length} formations (${FORMATIONS_SEED[0].prix_ht}€ à ${Math.max(...FORMATIONS_SEED.map(f => f.prix_ht))}€ HT)

## FORMATIONS CLÉS
${FORMATIONS_SEED.slice(0, 8).map(f => `- ${f.nom} : ${f.prix_ht}€ HT, ${f.duree_jours}j — ${f.description_commerciale}`).join('\n')}

## CALCUL DU ROI STANDARD
- Prix moyen prestation post-formation : 225€ (200€ femmes / 250€ hommes)
- Scénario conservateur : 3 clients/sem × 200€ × 4 sem = 2 400€/mois
- Scénario MIXTE (vedette) : 3F + 2H/sem × 225€ × 4 sem = 4 500€/mois
- Scénario optimiste : 4F + 3H/sem × 225€ × 4 sem = 6 300€/mois
- Remboursement formation : prix ÷ CA_mensuel_mixte × 30 jours (arrondi au-dessus)
- Score réputation = (note_globale / 5 × 40) + min(nb_avis/1000 × 40, 40) + 20

## RÈGLES D'ÉCRITURE ABSOLUES

### TON
- Entre professionnels reconnus. Jamais "prospect lambda".
- Respecter les awards AVANT de mentionner les notes.
- Factuel et chiffré : chaque affirmation a un chiffre ou une source.

### ANGLE MIXTE (priorité absolue si mixte=True)
Si l'institut est mixte (hommes ET femmes) :
- C'est l'argument DIFFÉRENCIANT UNIQUE.
- Le microblading sourcils hommes 25-40 ans explose en France.
- Quasi-monopole local si 0 concurrent avec dermo dans 500m.
- Formuler : "Vous êtes un des rares instituts MIXTES du quartier."

### ARGUMENT OPCO
TOUJOURS mentionner OPCO avant le prix. Jamais l'inverse.
Formule : "Votre [forme_juridique] cotise à l'OPCO EP depuis [année]. [X] ans de cotisations = droits accumulés = 0€ de votre poche."

### COHÉRENCE TARIFAIRE
Si service_le_plus_cher_eur >= 200€ :
"Votre [service] est à [prix]€. Le microblading à 225€ est dans la même gamme. Aucun choc tarifaire pour vos clients existants."

### MOTS INTERDITS → REFORMULATIONS OBLIGATOIRES
| Ne JAMAIS dire | Dire à la place |
|---|---|
| "Formation" | "Prestation premium" ou "Technique de précision" |
| "[Prix] EUR" en premier | "Financé OPCO à 100%" d'abord |
| "Microblading" seul | "Maquillage semi-permanent artistique" |
| "Vos concurrents" | "Vos clientes le cherchent" |

### SCRIPT TÉLÉPHONIQUE
4 étapes précises :
1. ACCROCHE (15 sec) : awards d'abord → note → ancienneté → "ce calibre"
2. ANGLE UNIQUE (20 sec) : mixte ou avantage spécifique → opportunité marché
3. LES CHIFFRES (30 sec) : 2 jours → 5 clients/sem → 4500€/mois → 0€ OPCO
4. CLOSING (15 sec) : "dossier avant/après adapté → 15 min → Mardi ou jeudi ?"
Total : ~80 secondes. Formuler en "je" (le commercial parle).

### OBJECTIONS — LES 5 INCONTOURNABLES
1. "C'est trop cher" → OPCO + cohérence tarifaire + facilités
2. "Pas le temps" → effectif + durée courte + ROI long terme
3. "Ça marche déjà bien" → évolutions passées + même logique
4. "Trop médical" → artistique + awards = œil expert
5. "Je réfléchis" → avant/après + RDV précis

### CONCLUSION ÉMOTIONNELLE
- Citer le prénom du prospect
- 3 chiffres les plus frappants de CE profil
- "Elle/Il a déjà tout pour réussir. Il ne manque que la technique."
- "À toi de jouer." (toujours en dernier)

## FORMAT DE SORTIE
Retourner UNIQUEMENT le JSON conforme au schéma demandé.
Tous les champs texte doivent être en FRANÇAIS.
Calculer précisément les KPI selon les formules ci-dessus.`


// ── User Prompt Builder ───────────────────────────────────

export function buildUserPrompt(prospect: ProspectData): string {
  const annee = new Date().getFullYear()
  const anciennete = annee - prospect.finances.annee_creation

  const formation = prospect.formation_principale
  const prixFormation = formation?.prix_ht || 1400

  return `Génère un rapport Satorea COMPLET pour ce prospect.
Toutes les phrases doivent être vraiment personnalisées — pas génériques.

## DONNÉES DU PROSPECT

### Identité
- Dirigeant : ${prospect.nom_dirigeant}
- Salon : ${prospect.nom_salon}
- Adresse : ${prospect.adresse}, ${prospect.code_postal} ${prospect.ville}
- Téléphone mobile : ${prospect.telephone_mobile}
- Email : ${prospect.email || 'non communiqué'}
- Institut mixte H+F : ${prospect.mixte ? 'OUI — argument MAJEUR' : 'NON'}
- Effectif : ${prospect.effectif}
- Statut pro : ${prospect.statut_pro || 'non renseigné'}
- Spécialités : ${prospect.specialites.join(', ') || 'non précisées'}
- Marques : ${prospect.marques_utilisees.join(', ') || 'non précisées'}

### Réputation (${prospect.reputation.nb_avis_total} avis au total)
- Note globale : ${prospect.reputation.note_globale}/5
${prospect.reputation.planity_note ? `- Planity : ${prospect.reputation.planity_note}/5 (${prospect.reputation.planity_nb_avis} avis)` : ''}
${prospect.reputation.google_note ? `- Google : ${prospect.reputation.google_note}/5 (${prospect.reputation.google_nb_avis} avis)` : ''}
- Taux réponse avis négatifs : ${prospect.reputation.taux_reponse_avis || 'non renseigné'}%
- Awards : ${prospect.reputation.awards.length > 0 ? prospect.reputation.awards.join(', ') : 'aucun'}

### Données financières
- Forme juridique : ${prospect.finances.forme_juridique}
- Ancienneté : ${anciennete} ans (depuis ${prospect.finances.annee_creation})
- BODACC clean : ${prospect.finances.bodacc_clean ? 'OUI — 0 procédure collective' : 'VÉRIFIER'}
- OPCO éligible : ${prospect.finances.opco_eligible ? 'OUI → argument 0€' : 'VÉRIFIER'}
${prospect.finances.service_le_plus_cher_eur ? `- Service le plus cher : ${prospect.finances.service_le_plus_cher_eur}€ (cohérence tarifaire)` : ''}

### Marché local
${prospect.concurrents_500m ? `- Concurrents dans 500m : ${prospect.concurrents_500m}` : ''}
${prospect.concurrents_avec_dermo != null ? `- Avec dermopigmentation : ${prospect.concurrents_avec_dermo}${prospect.concurrents_avec_dermo === 0 ? ' → QUASI-MONOPOLE POTENTIEL' : ''}` : ''}
${prospect.revenus_medians_quartier ? `- Revenus médians quartier : ${prospect.revenus_medians_quartier}€/an` : ''}
${prospect.score_trafic_pieton ? `- Score trafic piéton : ${prospect.score_trafic_pieton}/100` : ''}

${formation ? `### Formation visée
- ${formation.nom} : ${formation.prix_ht}€ HT, ${formation.duree_jours} jours (${formation.duree_heures}h)
${formation.description_commerciale ? `- ${formation.description_commerciale}` : ''}` : ''}

## CALCULS À EFFECTUER
- Ancienneté exacte : ${anciennete} ans
- Score réputation : calculer selon la formule du system prompt
- CA mensuel conservateur : 3 × 200 × 4 = ${3 * 200 * 4}€
- CA mensuel mixte (vedette) : 5 × 225 × 4 = ${5 * 225 * 4}€
- CA mensuel optimiste : 7 × 225 × 4 = ${7 * 225 * 4}€
- CA annuel mixte : ${5 * 225 * 4 * 12}€
- Remboursement formation : ${prixFormation} ÷ ${5 * 225 * 4} × 30 = ${Math.ceil(prixFormation / (5 * 225 * 4) * 30)} jours

## INSTRUCTIONS SPÉCIALES
${prospect.mixte ? '→ ANGLE MIXTE OBLIGATOIRE : Cet institut reçoit H+F — angle différenciant MAJEUR.' : '→ Institut non mixte : axer sur upsell clientèle existante.'}
${(prospect.concurrents_avec_dermo || 0) === 0 ? '→ QUASI-MONOPOLE : 0 concurrent avec dermo dans 500m — mentionner explicitement.' : ''}
${prospect.reputation.awards.length > 0 ? `→ PROFIL PREMIUM : ${prospect.reputation.awards.length} award(s) — mettre en avant.` : ''}

Génère maintenant le JSON complet du rapport. Chaque texte doit être unique à ce profil.`
}
