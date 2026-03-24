// ============================================================
// CRM DERMOTEC — Narrateur IA v2 ULTIME
// Rapport prospect 28 pages avec 47 sources d'enrichissement
// Intelligence croisée, personnalisation, 10 règles de corrélation
// ============================================================
import 'server-only'

import { generateText } from 'ai'
import { getModel } from './ai-sdk'
import type { IntelligenceComplete } from './enrichment-proxy'
import { FORMATIONS_SEED, BRAND } from './constants'

// ── Types v2 ───────────────────────────────────────────────

export interface ProspectNarrativeV2 {
  // VERDICT EXECUTIVE
  verdict: string
  verdict_emoji: string
  brief_3phrases: string

  // PROFIL PSYCHOLOGIQUE
  histoire_prospect: string
  personnalite_deduite: {
    type: 'conservatrice' | 'prudente' | 'ouverte' | 'innovante'
    justification: string
    comment_adapter_ton: string
  }

  // BUSINESS INTELLIGENCE
  situation_business: string
  capacite_investissement: {
    score: number
    justification: string
    financement_obligatoire: boolean
  }

  // REPUTATION CROSS-PLATFORM
  reputation_synthese: string
  inconsistances_detectees: string[]
  avis_analyse: {
    tendance: string
    points_forts_clients: string[]
    points_faibles_clients: string[]
    demandes_non_satisfaites: string[]
    citation_strategique: string
    citation_positive_top: string
  }

  // GAP ANALYSIS FORMATION
  gaps_formations: Array<{
    soin_manquant: string
    demande_detectee: boolean
    concurrent_le_propose: boolean
    formation_dermotec: string
    argument_1phrase: string
  }>

  // ZONE GEOGRAPHIQUE
  environnement_synthese: string
  argument_zone: string
  menace_concurrentielle: string
  opportunite_locale: string

  // STRATEGIE CONTACT
  strategie: {
    canal: string
    numero: string
    jour_optimal: string
    heure_optimale: string
    angle_attaque: string
    ne_jamais_dire: string[]
    dire_plutot: string[]
    ton_recommande: string
    objectif_appel: string
  }

  // SCRIPT ULTRA-PERSONNALISE
  script: {
    accroche: string
    accroche_annotations: string[]
    accroche_variante: string
    transition: string
    transition_annotations: string[]
    proposition: string
    proposition_annotations: string[]
    closing: string
    closing_variante: string
  }

  // 7 OBJECTIONS PREDICTIVES
  objections: Array<{
    ce_quelle_dit: string
    ce_quelle_pense: string
    reponse_ideale: string
    si_insiste: string
    phrase_rebond: string
  }>

  // DOULEURS & LEVIERS
  douleurs: Array<{ douleur: string; source_detection: string; formation_qui_resout: string }>
  aspirations: string[]
  phrases_positionnement: string[]

  // ROI 3 SCENARIOS
  roi_detaille: {
    investissement: string
    cout_net_prospect: string
    scenario_conservateur: { clientes_sem: number; ca_mensuel: number; break_even: string }
    scenario_moyen: { clientes_sem: number; ca_mensuel: number; break_even: string }
    scenario_optimiste: { clientes_sem: number; ca_mensuel: number; break_even: string }
    argument_massue: string
  }

  // FINANCEMENT OPTIMAL
  financement: {
    option_1: { nom: string; montant: string; phrase_cle: string }
    option_2: { nom: string; montant: string; phrase_cle: string }
    convention_idcc: string
    droits_accumules: string
  }

  // FORMATIONS RECOMMANDEES
  formations_recommandees: Array<{
    nom: string
    prix: string
    duree: string
    niveau: 'PRINCIPAL' | 'COMPLEMENTAIRE' | 'UPSELL'
    pourquoi_elle: string
    argument_roi: string
    argument_client: string
  }>

  // PLAN ACTION 14 JOURS
  plan_action: Array<{
    jour: string
    action: string
    canal: string
    objectif: string
    si_ok: string
    si_ko: string
  }>

  // META
  score_chaleur: number
  classification: 'CHAUD' | 'TIEDE' | 'FROID'
  confiance_donnees: number
}

export interface NarrativeV2Input {
  lead: {
    prenom?: string
    nom?: string
    email?: string
    telephone?: string
    entreprise?: string
    statut_pro?: string
    source?: string
  }
  intelligence: IntelligenceComplete
  all_reviews: Array<{
    platform: string
    author: string
    rating: number
    text: string
    date?: string
  }>
  score: number
  classification: 'CHAUD' | 'TIEDE' | 'FROID'
}

// ── Prompt IA v2 ───────────────────────────────────────────

function buildPromptV2(input: NarrativeV2Input): string {
  const { lead, intelligence, all_reviews, score, classification } = input

  const formationsDisponibles = FORMATIONS_SEED.map(
    f => `- ${f.nom} : ${f.prix_ht}€ HT, ${f.duree_jours}j (${f.duree_heures}h), niveau ${f.niveau} — ${f.description_commerciale}`
  ).join('\n')

  const prenom = lead.prenom || 'le prospect'
  const avisCitation = all_reviews.slice(0, 10).map(
    a => `"${a.text}" (${a.author} sur ${a.platform}, ${a.rating}/5)`
  ).join('\n')

  return `Tu es un SUPER COACH COMMERCIAL senior chez ${BRAND.name}, centre de formation esthétique certifié Qualiopi à Paris 11e.

Tu prépares un BRIEFING DE VENTE pour un commercial terrain Dermotec. Tu t'adresses DIRECTEMENT à lui — tu es son coach, pas un robot. Tu le tutoies. Tu lui donnes des armes concrètes pour ce rendez-vous.

TON EXPERTISE :
- Tu connais les esthéticiennes françaises TPE. Elles sont passionnées, débordées, sensibles au prix mais prêtes à investir si le ROI est clair.
- Tu sais que les esthéticiennes achètent par CONFIANCE, pas par logique. Le rapport humain compte plus que le PowerPoint.
- Tu sais que le mot "formation" fait peur (="je suis nulle"). Dis plutôt "expertise complémentaire" ou "nouvelle corde à ton arc".
- Tu connais la saisonnalité : janvier-février (creux = bon moment), mai-juin (avant été = corps), septembre (rentrée).
- Tu sais que l'argument assurance/juridique marche très bien : "sans attestation, votre RC pro peut ne pas couvrir les actes techniques".

TON STYLE :
- Coach bienveillant et direct. Pas corporate, pas condescendant.
- Tu VALORISES le commercial : "Tu as l'expérience terrain, adapte selon ton feeling. Voici des idées."
- Tu donnes des phrases EXACTES entre guillemets (prêtes à dire au téléphone)
- Tu utilises le PRÉNOM du prospect partout (jamais "le prospect")
- Tu CROISES les données pour trouver des insights NON ÉVIDENTS
- Tu motives : "Ce profil est en or" ou "Profil exigeant mais le jeu en vaut la chandelle"

TIPS TERRAIN DERMOTEC (utilise-les selon le contexte) :
- Les esthéticiennes indépendantes consultent Instagram le soir après 20h — timing SMS/email
- Les gérantes de 40+ ans préfèrent le téléphone. Les 25-35 préfèrent WhatsApp/Instagram DM.
- L'argument "vos clientes le demandent" est plus puissant que "le marché évolue"
- Proposer un essai ou une visite gratuite du centre réduit le risque perçu de 80%
- Les témoignages vidéo d'anciennes stagiaires convertissent 3x plus que les arguments commerciaux
- Si elle dit "je vais en parler à mon mari/comptable" → proposer un doc PDF récapitulatif avec les chiffres
- Les formations courtes (2-3 jours) convertissent mieux que les longues — moins d'absence du salon

IMPORTANT — TU NE DONNES PAS D'ORDRES :
Chaque conseil est présenté comme une suggestion : "Tu pourrais...", "Une idée qui marche bien...", "Adapte selon ton feeling, mais voici ce qui fonctionne...". Le commercial est l'expert terrain — toi tu lui donnes du contexte et des munitions.

LE PROSPECT À ANALYSER :
- Prénom : ${prenom}
- Nom : ${lead.nom || 'inconnu'}
- Entreprise : ${lead.entreprise || 'à déterminer'}
- Email : ${lead.email || 'pas d\'email'}
- Téléphone : ${lead.telephone || 'pas de téléphone'}
- Statut pro : ${lead.statut_pro || 'inconnu'}
- Source : ${lead.source || 'inconnue'}
- Score de chaleur : ${score}/100 (${classification})

INTELLIGENCE COMPLÈTE — 47 SOURCES D'ENRICHISSEMENT :
${JSON.stringify(intelligence, null, 2)}

TOUS LES AVIS CLIENTS (${all_reviews.length} avis collectés) :
${avisCitation}

NOS FORMATIONS DISPONIBLES (${FORMATIONS_SEED.length} formations) :
${formationsDisponibles}

NOS OPTIONS DE FINANCEMENT :
- CPF : pour salariés et demandeurs d'emploi (argument massue universel)
- OPCO : prise en charge entreprise selon convention collective (0€ reste à charge)
- France Travail : demandeurs d'emploi (formation financée + maintien allocations)
- Paiement échelonné 2x/3x/4x sans frais
- Financement région/département selon localisation
- Qualiopi : certification garantit financement par TOUS les organismes

10 RÈGLES DE CROISEMENT OBLIGATOIRES — ANALYSE CES CORRÉLATIONS :

1. RÉPUTATION VS PERFORMANCE : Si elle a + de 4.5/5 sur Google MAIS moins de 20 avis → elle fidélise mais ne scale pas = formation marketing/visibilité
2. CA VS EFFECTIF : Si CA élevé (>150K) MAIS 0-1 salarié → elle fait tout = burnout = formations pour déléguer
3. ZONE VS CONCURRENCE : Si + de 5 concurrents dans 500m MAIS elle a bon rating → différenciation par expertise = formations techniques
4. PRESTATIONS VS PRIX : Si elle propose du basique (manucure, épilation) MAIS zone huppée → sous-monétise = formations premium
5. AVIS POSITIFS VS AVIS NÉGATIFS : Patterns récurrents dans les plaintes = formations correctives spécifiques
6. SAISONNALITÉ VS TRÉSORERIE : Si activité saisonnière MAIS pas de cash → formations pour diversifier revenus
7. ÂGE ENTREPRISE VS MATURITÉ : Si récente (< 2 ans) MAIS CA stable → ambitieuse = formations pour booster
8. PRÉSENCE DIGITAL VS CLIENTÈLE : Si pas sur Instagram MAIS clientèle jeune → perte d'opportunités = formation digital
9. FORME JURIDIQUE VS AMBITION : Si EURL MAIS zone dynamique → prête à grandir = formations business
10. CONVENTION COLLECTIVE VS DROITS : Si IDCC détectée → droits formation non utilisés = argument financement béton

GÉNÈRE UN NARRATIF STRATÉGIQUE — CHAQUE PHRASE COMPTE :

{
  "verdict": "Une phrase de verdict commercial percutante avec emoji contextuel",
  "verdict_emoji": "🔥/⚡/💎/⚠️/❄️",
  "brief_3phrases": "Résumé exécutif en 3 phrases max. Ce qu'il faut retenir pour pitcher à un directeur.",

  "histoire_prospect": "Raconte son histoire comme un romancier économique. Utilise les vraies données, le vrai prénom, les vrais chiffres. 200 mots max, captivant.",

  "personnalite_deduite": {
    "type": "conservatrice/prudente/ouverte/innovante",
    "justification": "Analyse comportementale basée sur ses choix business, réputation, zone",
    "comment_adapter_ton": "Conseils précis pour adapter le pitch à sa psychologie"
  },

  "situation_business": "Synthèse business avec les vrais chiffres. Traduit en langage commercial. Mentionne TOUS les éléments financiers détectés.",

  "capacite_investissement": {
    "score": 85,
    "justification": "Analyse détaillée basée sur CA, effectif, forme juridique, zone",
    "financement_obligatoire": true
  },

  "reputation_synthese": "Analyse cross-platform de sa réputation. Utilise les VRAIES notes, VRAIS nombres d'avis de chaque plateforme.",
  "inconsistances_detectees": ["Pattern 1 détecté", "Pattern 2 détecté"],

  "avis_analyse": {
    "tendance": "Tendance générale des avis clients",
    "points_forts_clients": ["Point 1 cité par clients", "Point 2"],
    "points_faibles_clients": ["Critique 1", "Critique 2"],
    "demandes_non_satisfaites": ["Service demandé mais pas proposé"],
    "citation_strategique": "Citation d'avis révélatrice pour l'argumentation",
    "citation_positive_top": "Meilleure citation positive à utiliser en social proof"
  },

  "gaps_formations": [
    {
      "soin_manquant": "Prestation qu'elle ne propose pas mais demandée",
      "demande_detectee": true,
      "concurrent_le_propose": false,
      "formation_dermotec": "Formation exacte de notre catalogue",
      "argument_1phrase": "Phrase d'argumentation commerciale prête à dire"
    }
  ],

  "environnement_synthese": "Analyse géographique : accessibilité, concurrence, clientèle potentielle, opportunités zone",
  "argument_zone": "Comment utiliser sa zone comme argument de vente",
  "menace_concurrentielle": "Analyse concurrence et comment se différencier",
  "opportunite_locale": "Opportunité spécifique à sa localisation",

  "strategie": {
    "canal": "Téléphone direct / Email puis SMS / WhatsApp / LinkedIn",
    "numero": "Son vrai numéro ou stratégie si pas de numéro",
    "jour_optimal": "Jour recommandé basé sur son profil",
    "heure_optimale": "Créneau optimal selon son activité",
    "angle_attaque": "L'angle psychologique spécifique pour CE prospect",
    "ne_jamais_dire": ["Phrase/mot à éviter avec elle", "Trigger à éviter"],
    "dire_plutot": ["Phrase alternative", "Formulation qui marche mieux"],
    "ton_recommande": "Ton à adopter : professionnel/décontracté/expert/rassurant",
    "objectif_appel": "Objectif précis du premier contact"
  },

  "script": {
    "accroche": "Phrase d'accroche EXACTE personnalisée avec son prénom et contexte",
    "accroche_annotations": ["Pourquoi cette accroche", "À quoi faire attention"],
    "accroche_variante": "Version alternative si première ne marche pas",
    "transition": "Phrase de transition vers le sujet formation",
    "transition_annotations": ["Conseil delivery", "Signal à observer"],
    "proposition": "Proposition de valeur personnalisée en 1 phrase",
    "proposition_annotations": ["Adaptation ton", "Appui sur données"],
    "closing": "Phrase de closing avec next step concret",
    "closing_variante": "Alternative si hésitation"
  },

  "objections": [
    {
      "ce_quelle_dit": "Objection probable qu'elle va exprimer",
      "ce_quelle_pense": "Ce qu'elle pense VRAIMENT (psychologie)",
      "reponse_ideale": "Réponse structurée avec preuves",
      "si_insiste": "Si elle insiste sur l'objection",
      "phrase_rebond": "Phrase pour relancer après l'objection"
    }
  ],

  "douleurs": [
    {"douleur": "Vraie douleur détectée", "source_detection": "D'où vient l'info", "formation_qui_resout": "Formation qui règle ça"}
  ],
  "aspirations": ["Aspiration 1 détectée", "Aspiration 2"],
  "phrases_positionnement": ["Phrase qui la valorise", "Phrase qui crée urgence"],

  "roi_detaille": {
    "investissement": "Montant investissement recommandé",
    "cout_net_prospect": "Coût réel après financement",
    "scenario_conservateur": {"clientes_sem": 2, "ca_mensuel": 1600, "break_even": "3 mois"},
    "scenario_moyen": {"clientes_sem": 4, "ca_mensuel": 3200, "break_even": "1.5 mois"},
    "scenario_optimiste": {"clientes_sem": 6, "ca_mensuel": 4800, "break_even": "1 mois"},
    "argument_massue": "Phrase ROI imparable basée sur ses vraies données"
  },

  "financement": {
    "option_1": {"nom": "Option principale", "montant": "Montant/modalité", "phrase_cle": "Phrase exacte"},
    "option_2": {"nom": "Option secours", "montant": "Montant/modalité", "phrase_cle": "Phrase exacte"},
    "convention_idcc": "Sa convention collective si détectée + droits",
    "droits_accumules": "Estimation droits CPF/formation"
  },

  "formations_recommandees": [
    {
      "nom": "Formation exacte de notre catalogue",
      "prix": "Prix HT exact",
      "duree": "Durée exacte",
      "niveau": "PRINCIPAL/COMPLEMENTAIRE/UPSELL",
      "pourquoi_elle": "Pourquoi CETTE formation pour ELLE spécifiquement",
      "argument_roi": "ROI calculé avec ses données",
      "argument_client": "Bénéfice client final"
    }
  ],

  "plan_action": [
    {
      "jour": "J+1",
      "action": "Action précise à faire",
      "canal": "Canal à utiliser",
      "objectif": "Objectif mesurable",
      "si_ok": "Next step si positif",
      "si_ko": "Next step si négatif"
    }
  ]
}

RÈGLES ABSOLUES :
1. Utilise le VRAI prénom dans CHAQUE section qui mentionne le prospect
2. Cite des VRAIS avis clients entre guillemets (pas d'invention)
3. Utilise les VRAIES données chiffrées (CA, notes, nombre d'avis, etc.)
4. Croise OBLIGATOIREMENT les données entre elles (10 règles ci-dessus)
5. Prédis 7 objections probables avec psychologie comportementale
6. Chaque argument ROI doit être CALCULÉ avec hypothèses explicites
7. Le script doit sonner NATUREL — teste-le mentalement
8. Les formations recommandées doivent venir de notre catalogue exact
9. Le plan 14 jours doit avoir si_ok/si_ko pour chaque étape
10. Si données manquantes, utilise "Non détecté" — ne brode JAMAIS

Réponds UNIQUEMENT avec le JSON valide, rien d'autre. Maximum 12000 tokens.`
}

// ── Génération narratif v2 ─────────────────────────────────

export async function generateProspectNarrativeV2(input: NarrativeV2Input): Promise<ProspectNarrativeV2> {
  const prompt = buildPromptV2(input)

  try {
    const { text } = await generateText({
      model: getModel('best'), // Claude Sonnet via getModel
      messages: [{ role: 'user' as const, content: prompt }],
      temperature: 0.4, // Plus déterministe que v1
      maxTokens: 12000, // Narratif long et détaillé
    })

    // Parser le JSON (enlever markdown si présent)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const narrative = JSON.parse(cleaned) as Omit<ProspectNarrativeV2, 'score_chaleur' | 'classification' | 'confiance_donnees'>

    // Calculer confiance des données (0-100) basé sur completeness
    const confiance = calculateDataConfidence(input)

    return {
      ...narrative,
      score_chaleur: input.score,
      classification: input.classification,
      confiance_donnees: confiance,
    }
  } catch (error) {
    console.error('[ProspectNarrator v2] Erreur génération:', error)
    return buildFallbackNarrativeV2(input)
  }
}

// ── Calcul confiance données ───────────────────────────────

function calculateDataConfidence(input: NarrativeV2Input): number {
  let score = 0
  const intel = input.intelligence

  // Lead info basique (20 points)
  if (input.lead.prenom) score += 3
  if (input.lead.telephone) score += 5
  if (input.lead.email) score += 2
  if (input.lead.entreprise) score += 3
  if (input.lead.statut_pro) score += 2
  if (input.lead.source) score += 5

  // Business data (30 points)
  if (intel.sirene) score += 10
  if (intel.pappers) score += 8
  if (intel.opco) score += 5
  if (intel.convention_collective) score += 7

  // Réputation data (25 points)
  if (intel.google) score += 8
  if (intel.social?.instagram) score += 5
  if (intel.social?.facebook) score += 3
  if (intel.plateformes_avis && intel.plateformes_avis.length > 0) score += 9

  // Avis texte (15 points)
  if (input.all_reviews.length > 0) score += 5
  if (input.all_reviews.length >= 5) score += 5
  if (input.all_reviews.length >= 15) score += 5

  // Zone & concurrence (10 points)
  if (intel.quartier) score += 5
  if (intel.concurrents_zone) score += 5

  return Math.min(100, score)
}

// ── Fallback sans IA ───────────────────────────────────────

function buildFallbackNarrativeV2(input: NarrativeV2Input): ProspectNarrativeV2 {
  const { lead, intelligence, score, classification } = input
  const prenom = lead.prenom || 'Ce prospect'
  const isChaud = classification === 'CHAUD'
  const isTiede = classification === 'TIEDE'

  return {
    verdict: isChaud ? `Prospect chaud (${score}/100) — à traiter en priorité absolue.` : isTiede ? `Profil intéressant (${score}/100) — mérite un appel exploratoire.` : `Prospect à qualifier (${score}/100) — stratégie nurturing recommandée.`,
    verdict_emoji: isChaud ? '🔥' : isTiede ? '⚡' : '❄️',
    brief_3phrases: `${prenom} ${intelligence.sirene ? `dirige ${intelligence.sirene.nom}` : 'est dans le secteur esthétique'}. Score ${score}/100. ${isChaud ? 'Appelle aujourd\'hui même.' : 'Stratégie d\'approche progressive.'}`,

    histoire_prospect: intelligence.sirene
      ? `${prenom} dirige ${intelligence.sirene.nom}${intelligence.sirene.ville ? ` à ${intelligence.sirene.ville}` : ''}. ${intelligence.pappers?.chiffreAffaires ? `L'entreprise réalise environ ${Math.round(intelligence.pappers.chiffreAffaires / 1000)}K€ de CA.` : 'Données financières en cours d\'analyse.'} ${intelligence.google?.rating ? `Côté réputation, ${intelligence.google.rating}/5 sur Google avec ${intelligence.google.reviewsCount} avis.` : 'Présence digitale à développer.'}`
      : `${prenom} évolue dans le secteur esthétique. Profil en cours d'enrichissement — l'appel permettra de qualifier son potentiel et ses besoins en formation.`,

    personnalite_deduite: {
      type: intelligence.google?.rating && intelligence.google.rating >= 4.5 ? 'ouverte' : intelligence.pappers?.chiffreAffaires && intelligence.pappers.chiffreAffaires > 100000 ? 'innovante' : 'prudente',
      justification: intelligence.google?.rating && intelligence.google.rating >= 4.5 ? 'Excellente réputation client = ouverte aux nouvelles approches' : 'Profil business à confirmer lors de l\'échange',
      comment_adapter_ton: 'Ton professionnel et rassurant. Mettre l\'accent sur la certification Qualiopi et les résultats concrets.',
    },

    situation_business: intelligence.pappers
      ? `${intelligence.pappers.chiffreAffaires ? `CA: ${Math.round(intelligence.pappers.chiffreAffaires / 1000)}K€` : 'CA non communiqué'}. ${intelligence.pappers.effectif || 'Effectif inconnu'}. ${intelligence.pappers.formeJuridique || 'Forme juridique à confirmer'}. ${intelligence.pappers.chiffreAffaires && intelligence.pappers.chiffreAffaires > 80000 ? 'Capacité d\'investissement confirmée.' : 'Budget à qualifier — financement recommandé.'}`
      : 'Données business en cours d\'enrichissement. Objectif appel : qualifier la taille de l\'activité et la capacité d\'investissement.',

    capacite_investissement: {
      score: intelligence.pappers?.chiffreAffaires && intelligence.pappers.chiffreAffaires > 150000 ? 85 : intelligence.pappers?.chiffreAffaires && intelligence.pappers.chiffreAffaires > 80000 ? 65 : 40,
      justification: intelligence.pappers?.chiffreAffaires ? `Basé sur CA de ${Math.round(intelligence.pappers.chiffreAffaires / 1000)}K€` : 'Évaluation à confirmer lors de l\'échange',
      financement_obligatoire: !intelligence.pappers?.chiffreAffaires || intelligence.pappers.chiffreAffaires < 100000,
    },

    reputation_synthese: intelligence.google
      ? `Google: ${intelligence.google.rating}/5 (${intelligence.google.reviewsCount} avis). ${intelligence.social?.instagram ? `Instagram actif: @${intelligence.social.instagram.username}.` : 'Pas sur Instagram.'} ${intelligence.google.rating && intelligence.google.rating >= 4 ? 'Réputation solide — elle fidélise ses clientes.' : 'Réputation à améliorer — opportunité formation.'}`
      : 'Présence digitale limitée détectée. Angle d\'approche: développement visibilité et professionnalisation.',

    inconsistances_detectees: [],

    avis_analyse: {
      tendance: input.all_reviews.length > 0 ? 'Analyse en cours des avis collectés' : 'Pas d\'avis texte disponible',
      points_forts_clients: [],
      points_faibles_clients: [],
      demandes_non_satisfaites: [],
      citation_strategique: '',
      citation_positive_top: input.all_reviews.find(r => r.rating >= 4)?.text?.substring(0, 100) + '...' || '',
    },

    gaps_formations: [
      {
        soin_manquant: 'Microblading / Sourcils',
        demande_detectee: true,
        concurrent_le_propose: true,
        formation_dermotec: 'Microblading / Microshading',
        argument_1phrase: 'La prestation la plus rentable : 200€ la séance, demande explosive.',
      },
    ],

    environnement_synthese: intelligence.quartier
      ? `Zone avec ${intelligence.quartier.concurrentsBeaute || 0} salons beauté. Trafic piéton: ${intelligence.quartier.footTrafficScore || 0}/100. ${intelligence.quartier.concurrentsBeaute && intelligence.quartier.concurrentsBeaute > 5 ? 'Zone concurrentielle — différenciation nécessaire.' : 'Marché porteur.'}`
      : 'Analyse géographique en cours. Concentrer sur les bénéfices formation.',

    argument_zone: intelligence.quartier?.concurrentsBeaute && intelligence.quartier.concurrentsBeaute > 3
      ? 'Zone concurrentielle = besoin de se différencier par l\'expertise et les certifications'
      : 'Marché à fort potentiel pour développer de nouvelles prestations',

    menace_concurrentielle: 'Analysée lors de l\'enrichissement — stratégie de différenciation par la formation',

    opportunite_locale: intelligence.sirene?.ville?.includes('Paris') ? 'Marché parisien premium — clientèle prête à payer pour la qualité' : 'Marché local à développer',

    strategie: {
      canal: lead.telephone ? 'Appel direct — le téléphone convertit 5x mieux que l\'email' : 'Email de prise de contact personnalisé',
      numero: lead.telephone || 'À récupérer lors du premier échange',
      jour_optimal: 'Mardi ou mercredi',
      heure_optimale: '10h-12h ou 14h-16h',
      angle_attaque: intelligence.google?.rating && intelligence.google.rating >= 4
        ? 'Féliciter sur sa réputation puis proposer d\'augmenter le panier moyen'
        : 'Tendance marché esthétique et opportunité de se démarquer',
      ne_jamais_dire: ['Formation obligatoire', 'Vous devez', 'Il faut que'],
      dire_plutot: ['Opportunité', 'Ce qui marche bien', 'Nos participantes constatent'],
      ton_recommande: 'Professionnel et bienveillant — coach plutôt que vendeur',
      objectif_appel: isChaud ? 'Obtenir un RDV ou envoyer le programme' : 'Qualifier le besoin et créer l\'intérêt',
    },

    script: {
      accroche: `Bonjour ${prenom}, c'est [ton prénom] de ${BRAND.name}. Je ne vous dérange pas ?`,
      accroche_annotations: ['Ton naturel et souriant', 'Attendre sa réponse avant de continuer'],
      accroche_variante: `${prenom} ? Bonjour, [ton prénom] de Dermotec Advanced, j'ai 2 minutes ?`,
      transition: `Je vous appelle parce que ${intelligence.sirene ? `j'ai vu que ${intelligence.sirene.nom} propose des soins esthétiques` : 'vous évoluez dans l\'esthétique'}, et on aide les professionnels comme vous à développer de nouvelles prestations très rentables.`,
      transition_annotations: ['Personnaliser avec ses infos réelles', 'Créer la curiosité'],
      proposition: 'En 1 à 2 jours de formation, vous maîtrisez une technique qui peut vous rapporter 200 à 500€ par séance. Et c\'est finançable à 100%.',
      proposition_annotations: ['Chiffres concrets', 'Financement = lever l\'objection prix'],
      closing: 'Est-ce que je peux vous envoyer notre catalogue par email ? Comme ça vous regardez tranquillement et on se reparle en fin de semaine ?',
      closing_variante: 'Voulez-vous que je vous rappelle ou vous préférez que je vous envoie d\'abord la documentation ?',
    },

    objections: [
      {
        ce_quelle_dit: 'C\'est trop cher',
        ce_quelle_pense: 'J\'ai pas le budget immédiatement disponible',
        reponse_ideale: `Je comprends. Mais avec le financement ${intelligence.opco || 'OPCO'}, c'est souvent pris en charge à 100%. Et même en auto-financement, avec 3 clientes par mois la formation est remboursée.`,
        si_insiste: 'Regardez notre brochure financement — on trouve toujours une solution.',
        phrase_rebond: 'Quel serait le budget que vous pourriez consacrer à votre développement cette année ?',
      },
      {
        ce_quelle_dit: 'J\'ai pas le temps',
        ce_quelle_pense: 'Je peux pas me permettre de fermer',
        reponse_ideale: 'C\'est justement pour ça que nos formations sont courtes — 1 à 2 jours maximum. Et vous choisissez vos dates.',
        si_insiste: 'Combien de temps vous faudrait-il pour rentabiliser 500€ de plus par semaine ?',
        phrase_rebond: 'Quand pourriez-vous bloquer 2 jours dans les 2 prochains mois ?',
      },
    ],

    douleurs: [
      { douleur: 'Concurrence forte', source_detection: 'Analyse quartier', formation_qui_resout: 'Formations techniques premium' },
      { douleur: 'Panier moyen stagnant', source_detection: 'Profil type', formation_qui_resout: 'Nouvelles prestations haut de gamme' },
    ],

    aspirations: [
      'Développer son chiffre d\'affaires',
      'Se différencier de la concurrence',
      'Proposer des prestations innovantes',
    ],

    phrases_positionnement: [
      intelligence.google?.rating && intelligence.google.rating >= 4 ? `Avec votre réputation de ${intelligence.google.rating}/5, vous méritez des formations à la hauteur` : 'Votre expertise mérite des formations de qualité',
      'Nos formations permettent à nos participantes d\'ajouter 800€ de CA mensuel en moyenne',
    ],

    roi_detaille: {
      investissement: '1400€ HT (formation Microblading recommandée)',
      cout_net_prospect: intelligence.opco ? '0€ (financement OPCO)' : '1400€ ou 3x467€',
      scenario_conservateur: { clientes_sem: 1, ca_mensuel: 800, break_even: '2 mois' },
      scenario_moyen: { clientes_sem: 2, ca_mensuel: 1600, break_even: '1 mois' },
      scenario_optimiste: { clientes_sem: 3, ca_mensuel: 2400, break_even: '0.5 mois' },
      argument_massue: 'Avec juste 1 cliente Microblading par semaine à 200€, vous remboursez la formation en 2 mois. Ensuite c\'est du bénéfice net.',
    },

    financement: {
      option_1: { nom: intelligence.opco ? `OPCO ${intelligence.opco}` : 'CPF', montant: intelligence.opco ? 'Prise en charge 100%' : 'Selon droits acquis', phrase_cle: intelligence.opco ? '"Votre OPCO peut financer entièrement cette formation"' : '"Avez-vous consulté vos droits CPF récemment ?"' },
      option_2: { nom: 'Paiement échelonné', montant: '3x sans frais', phrase_cle: '"On peut aussi étaler en 3 fois sans frais si vous préférez"' },
      convention_idcc: intelligence.convention_collective?.intitule || 'À déterminer lors de l\'échange',
      droits_accumules: 'À vérifier sur Mon Compte Formation',
    },

    formations_recommandees: [
      {
        nom: 'Microblading / Microshading',
        prix: '1 400€ HT',
        duree: '2 jours (14h)',
        niveau: 'PRINCIPAL',
        pourquoi_elle: 'Prestation la plus demandée, ROI rapide, technique accessible',
        argument_roi: 'À 200€ la séance, avec 3 clientes/mois elle rembourse en 2 mois',
        argument_client: 'Sourcils parfaits pendant 1-2 ans, plus besoin de maquillage quotidien',
      },
    ],

    plan_action: [
      {
        jour: 'J+0 (aujourd\'hui)',
        action: isChaud ? 'Appel téléphonique direct' : 'Email personnalisé de prise de contact',
        canal: lead.telephone ? 'Téléphone' : 'Email',
        objectif: isChaud ? 'RDV ou envoi programme' : 'Susciter l\'intérêt et récupérer le téléphone',
        si_ok: 'Envoyer catalogue + programmer rappel',
        si_ko: 'Noter objections et programmer relance J+2',
      },
      {
        jour: 'J+2',
        action: 'SMS de relance courtois',
        canal: 'SMS',
        objectif: 'Maintenir le contact sans pression',
        si_ok: 'Programmer échange téléphonique',
        si_ko: 'Basculer en nurturing email J+7',
      },
      {
        jour: 'J+7',
        action: 'Email nurturing avec case study',
        canal: 'Email',
        objectif: 'Prouver le ROI avec témoignage client',
        si_ok: 'Relancer par téléphone',
        si_ko: 'Cadence nurturing 14 jours',
      },
    ],

    score_chaleur: score,
    classification,
    confiance_donnees: calculateDataConfidence(input),
  }
}