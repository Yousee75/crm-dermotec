// ============================================================
// CRM DERMOTEC — Narrateur IA de prospects
// Briefing commercial : parle AU commercial, lui dit quoi faire,
// comment vendre, quelle stratégie adopter selon le profil.
// Ton : coach de vente bienveillant, direct, orienté action.
// ============================================================
import 'server-only'

import { generateText } from 'ai'
import { getModel } from '../ai-sdk'
import type { AggregatedProspectData } from '../enrichment-pipeline'
import { FORMATIONS_SEED, BRAND } from '../constants'

// ── Types ──────────────────────────────────────────────────

export interface ProspectNarrative {
  // Section 1 : Le brief (ce que le commercial lit en premier)
  brief_commercial: string // 3-4 phrases. "Voici qui tu appelles, pourquoi c'est intéressant, et ce que tu dois faire."
  verdict: string // 1 phrase courte type "Prospect chaud à traiter en priorité" ou "Prospect tiède, besoin de nurturing"

  // Section 2 : Qui est ce prospect ? (raconté comme une histoire)
  histoire_prospect: string // Paragraphe narratif. Pas des données froides, une HISTOIRE. "Marie tient un institut de beauté depuis 3 ans à Paris 11e..."

  // Section 3 : Sa situation business
  situation_business: string // CA, effectif, forme juridique — traduits en langage commercial. "Elle a les moyens d'investir" ou "Petite structure, sensible au prix"

  // Section 4 : Sa réputation et sa visibilité
  reputation_visibilite: string // Google, réseaux — traduits en opportunité. "Elle a 4.7 sur Google, elle sait fidéliser" ou "Pas sur Google = elle perd des clients"

  // Section 5 : Son quartier
  environnement: string // Traduit en langage commercial. "Zone à fort passage, concurrence modérée = bon terrain de jeu"

  // Section 6 : Tes atouts pour vendre
  atouts_vente: string[] // Ce que tu peux utiliser en sa faveur. Chaque point = argument de vente concret.

  // Section 7 : Attention à ça
  pieges_eviter: string[] // Ce qui peut mal tourner. Chaque point = piège concret + comment le contourner.

  // Section 8 : Ta stratégie d'approche
  strategie: {
    canal: string // "Appelle-la" / "Envoie un email d'abord" / "Passe par WhatsApp"
    meilleur_moment: string // "Mardi ou mercredi entre 10h et 12h" / "Évite le lundi matin"
    angle_attaque: string // L'angle qui va accrocher CE prospect spécifiquement
    objectif_appel: string // Ce que tu veux obtenir de ce premier contact
    duree_estimee: string // "5 min max" / "Prévois 10 min, elle va avoir des questions"
  }

  // Section 9 : Ton script (prêt à lire au téléphone)
  script_telephone: {
    accroche: string // Les 2 premières phrases quand elle décroche
    transition: string // Comment amener le sujet formation
    proposition: string // La proposition de valeur en 1 phrase
    closing: string // Comment conclure (RDV, envoi doc, rappel)
    si_objection_prix: string // Si elle dit "c'est trop cher"
    si_objection_temps: string // Si elle dit "j'ai pas le temps"
    si_objection_besoin: string // Si elle dit "j'en ai pas besoin"
  }

  // Section 10 : Quelles formations lui proposer
  formations_recommandees: {
    nom: string
    prix: string
    pourquoi_elle: string // Pourquoi CETTE formation pour CETTE personne
    argument_roi: string // "Avec 3 clientes par mois à 200€, elle rembourse en 2 mois"
    niveau_priorite: 'principal' | 'complementaire' | 'upsell_futur'
  }[]

  // Section 11 : Comment parler financement
  strategie_financement: {
    option_principale: string // L'option la plus probable pour ce profil
    comment_presenter: string // Comment en parler sans que ça fasse "vendeur"
    phrase_cle: string // LA phrase à dire
    alternatives: string[] // Si l'option 1 ne marche pas
  }

  // Section 12 : Prochaines étapes
  plan_action: {
    action_1: string // "Aujourd'hui : appeler entre 10h et 12h"
    action_2: string // "Si pas de réponse : SMS demain matin"
    action_3: string // "Si intéressée : envoyer le programme + lien inscription"
    rappel: string // "Relancer dans 3 jours si pas de retour"
  }

  // Meta
  score_chaleur: number
  classification: 'CHAUD' | 'TIEDE' | 'FROID'
}

export interface NarrativeInput {
  lead: {
    prenom?: string
    nom?: string
    email?: string
    telephone?: string
    entreprise?: string
    statut_pro?: string
    source?: string
  }
  enrichment: AggregatedProspectData
  intelligence?: import('../enrichment/proxy').IntelligenceComplete
  score: number
  classification: 'CHAUD' | 'TIEDE' | 'FROID'
}

// ── Prompt IA ──────────────────────────────────────────────

function buildPrompt(input: NarrativeInput): string {
  const { lead, enrichment, score, classification } = input

  const formationsDisponibles = FORMATIONS_SEED.slice(0, 12).map(
    f => `- ${f.nom} : ${f.prix_ht}€ HT, ${f.duree_jours}j (${f.duree_heures}h) — ${f.description_commerciale}`
  ).join('\n')

  const prenom = lead.prenom || 'le prospect'
  const nomEntreprise = enrichment.sirene?.nom || lead.entreprise || ''

  return `Tu es un COACH COMMERCIAL senior chez ${BRAND.name}, centre de formation esthétique certifié Qualiopi à Paris 11e.

Tu prépares un BRIEFING pour un commercial qui va appeler un prospect. Tu t'adresses DIRECTEMENT au commercial, avec un ton de coach bienveillant mais direct. Tu le tutoies. Tu lui donnes des conseils concrets, pas du blabla.

TON STYLE :
- Tu parles comme un directeur commercial expérimenté qui prépare son équipe
- Tu es direct, concret, actionnable. Pas de phrases vides.
- Tu utilises le prénom du prospect naturellement ("Marie", pas "le prospect")
- Tu traduis chaque donnée en ARGUMENT DE VENTE ou en SIGNAL D'ALERTE
- Tu donnes des phrases PRÊTES À DIRE au téléphone (entre guillemets)
- Quand tu ne sais pas, tu dis "On n'a pas l'info, pose-lui la question directement"
- Tu motives : "C'est un bon profil, fonce" ou "Celui-là va demander du travail, mais ça vaut le coup"

LE PROSPECT :
- Prénom : ${prenom}
- Nom : ${lead.nom || 'inconnu'}
- Entreprise : ${nomEntreprise || 'à déterminer'}
- Email : ${lead.email || 'pas d\'email'}
- Téléphone : ${lead.telephone || 'pas de téléphone'}
- Statut pro : ${lead.statut_pro || 'inconnu'}
- Source : ${lead.source || 'inconnue'}
- Score de chaleur : ${score}/100 (${classification})

DONNÉES ENRICHIES :
${JSON.stringify(enrichment, null, 2)}

NOS FORMATIONS :
${formationsDisponibles}

NOS FINANCEMENTS :
- CPF : pour salariés et demandeurs d'emploi (tout le monde en a, c'est l'argument massue)
- OPCO ${enrichment.opco || '(à déterminer)'} : prise en charge entreprise (0€ de reste à charge si validé)
- France Travail : demandeurs d'emploi (formation financée + maintien allocations)
- Paiement 2x/3x/4x sans frais : pour celles qui veulent payer elles-mêmes
- Qualiopi : notre certification garantit la prise en charge par TOUS les financeurs

${input.intelligence ? `
DONNÉES 360° (INTELLIGENCE ENRICHIE) :

CARTE DES SOINS ACTUELLE (scrappée depuis les plateformes de réservation) :
${input.intelligence.carte_soins?.join(', ') || 'Non détectée — demande-lui directement quels soins elle propose'}
→ Compare avec nos formations ci-dessus et identifie les GAPS (soins qu'elle ne propose PAS encore et qu'on peut lui apprendre)

RÉPUTATION MULTI-PLATEFORMES :
${input.intelligence.plateformes_avis?.map((p: any) => `- ${p.plateforme}: ${p.note || '?'}/5 (${p.nb_avis || 0} avis)`).join('\n') || 'Données non disponibles'}
→ Utilise les plateformes avec peu d'avis comme argument : "Vous êtes peu visible sur certaines plateformes, la formation vous aide à monter en gamme"

CONVENTION COLLECTIVE :
${input.intelligence.convention_collective ? `IDCC ${input.intelligence.convention_collective.code_convention} (${input.intelligence.convention_collective.intitule}) — ${input.intelligence.convention_collective.droit_formation_heures}h de formation par an
→ ARGUMENT MASSUE : "Vous avez ${input.intelligence.convention_collective.droit_formation_heures}h de formation par an prévues par votre convention, autant en profiter plutôt que de les perdre"` : 'Non détectée'}

AIDES FINANCEMENT DISPONIBLES DANS SA ZONE :
${input.intelligence.aides_disponibles?.map((a: any) => `- ${a.nom} (${a.financeur}) — max ${a.montant_max || '?'}€`).join('\n') || 'Aucune aide spécifique détectée'}

CONCURRENTS DANS SA ZONE :
${input.intelligence.concurrents_zone ? `${input.intelligence.concurrents_zone.length} établissements beauté dans un rayon de 2km` : 'Données non disponibles'}
${input.intelligence.signaux?.zone_saturee ? '⚠️ ZONE SATURÉE — elle a besoin de se différencier par la qualité et les certifications' : ''}

SIGNAUX COMMERCIAUX :
${input.intelligence.signaux?.est_sur_promo ? '⚡ PROSPECT CHAUD — elle est sur une plateforme de promotions = elle cherche des clients = elle a besoin de monter en gamme' : ''}
${input.intelligence.signaux?.est_organisme_concurrent ? '⚠️ ATTENTION — elle est ORGANISME DE FORMATION (elle a un numéro NDA). C\'est un CONCURRENT potentiel, pas un prospect classique. Adapte ton approche.' : ''}
${input.intelligence.signaux?.droits_formation_non_consommes ? '💰 Elle a des DROITS FORMATION non consommés (convention collective). Argument financement béton.' : ''}
${input.intelligence.signaux?.en_difficulte ? '🔴 ATTENTION — entreprise en difficulté financière (procédure collective détectée). Parle financement en priorité, pas de gros budget.' : ''}
${input.intelligence.signaux?.avis_insuffisants ? '📊 Peu visible en ligne (< 10 avis). La formation peut l\'aider à professionnaliser son image.' : ''}
` : ''}

CE QUE ${BRAND.name} PROPOSE :
- 23 formations de 400€ à 2500€ HT, de 1 à 5 jours
- Centre Paris 11e (75 Bd Richard Lenoir) — super accessible
- Certifié Qualiopi (finançable par tous les organismes)
- Petits groupes (4-6 max) — suivi personnalisé
- Matériel professionnel NPM fourni pendant la formation
- Attestation de formation reconnue

Génère un JSON avec EXACTEMENT cette structure. Chaque champ doit être rempli. Pas de placeholder.

{
  "brief_commercial": "3-4 phrases max. Tu t'adresses au commercial : 'Écoute, voici le topo sur [Prénom]...'",
  "verdict": "1 phrase courte et directe. Ex: 'Prospect chaud, appelle aujourd'hui.' ou 'Profil intéressant mais va falloir la convaincre.'",
  "histoire_prospect": "Raconte l'histoire en 4-5 phrases. Pas des données, une HISTOIRE vivante. Ex: 'Marie a ouvert son institut il y a 3 ans dans le 11e. Elle s'en sort bien — 4.7 sur Google, les clientes l'adorent...'",
  "situation_business": "Traduis les chiffres en langage commercial. Ex: 'Avec un CA de 180K€ et 3 salariées, elle a les moyens d'investir dans une formation. Son OPCO peut prendre en charge.'",
  "reputation_visibilite": "Traduis la réputation en opportunité commerciale. Ex: 'Elle a 87 avis Google à 4.7 — elle sait fidéliser. Mais pas d'Instagram : c'est un angle pour la formation marketing.'",
  "environnement": "Traduis le quartier en argument. Ex: 'Quartier dynamique, 3 métros à côté, mais 6 concurrents dans un rayon de 500m — elle a besoin de se différencier.'",
  "atouts_vente": ["Chaque point = un argument concret que le commercial peut utiliser. Ex: 'Elle est déjà dans le secteur beauté — pas besoin de la convaincre du marché'"],
  "pieges_eviter": ["Chaque piège = un risque + comment le contourner. Ex: 'Elle risque de dire qu'elle n'a pas le temps → répondre que la formation dure seulement 2 jours'"],
  "strategie": {
    "canal": "Appelle-la directement / Envoie un SMS d'abord / Email puis rappel",
    "meilleur_moment": "Mardi-mercredi 10h-12h / Évite le lundi / Après 14h elle est en soin",
    "angle_attaque": "L'angle spécifique à utiliser pour CE prospect",
    "objectif_appel": "Ce que tu veux obtenir concrètement",
    "duree_estimee": "5 min / 10 min si elle est bavarde"
  },
  "script_telephone": {
    "accroche": "Les 2 premières phrases EXACTES à dire quand elle décroche",
    "transition": "Comment passer de la politesse au sujet formation",
    "proposition": "La proposition de valeur en 1 phrase percutante",
    "closing": "Comment conclure l'appel (toujours un next step concret)",
    "si_objection_prix": "Réponse à 'c'est trop cher' — toujours rebondir sur le financement",
    "si_objection_temps": "Réponse à 'j'ai pas le temps' — montrer que c'est court et que ça rapporte",
    "si_objection_besoin": "Réponse à 'j'en ai pas besoin' — montrer ce qu'elle perd"
  },
  "formations_recommandees": [
    {
      "nom": "Nom exact de la formation",
      "prix": "XXX€ HT",
      "pourquoi_elle": "Pourquoi CETTE formation pour CETTE personne spécifiquement",
      "argument_roi": "En X clientes par mois à Y€, elle rembourse en Z mois",
      "niveau_priorite": "principal"
    }
  ],
  "strategie_financement": {
    "option_principale": "L'option la plus probable selon son profil",
    "comment_presenter": "Comment en parler naturellement sans faire vendeur",
    "phrase_cle": "LA phrase exacte à dire sur le financement",
    "alternatives": ["Si option 1 ne marche pas, proposer ça"]
  },
  "plan_action": {
    "action_1": "Aujourd'hui : faire ça",
    "action_2": "Si pas de réponse : faire ça",
    "action_3": "Si intéressée : faire ça",
    "rappel": "Relancer dans X jours"
  }
}

RÈGLES ABSOLUES :
1. Tu t'adresses au COMMERCIAL, pas au prospect. Tu le tutoies.
2. Chaque phrase doit être ACTIONNABLE. Si c'est pas utile pour vendre, enlève-le.
3. Le script téléphonique doit être NATUREL — comme une vraie conversation, pas un robot.
4. Les objections doivent avoir des réponses CONCRÈTES avec des chiffres.
5. L'argument ROI des formations doit être CALCULÉ (prix séance × clients/mois = remboursement en X mois).
6. Si des données manquent, dis "On n'a pas l'info, demande-lui directement" — ne bloque pas.
7. Le ton est motivant : le commercial doit avoir ENVIE d'appeler après avoir lu ton brief.
8. Adapte la stratégie au score : CHAUD = urgence, TIÈDE = nurturing, FROID = qualification d'abord.
9. Maximum 2-3 formations recommandées, pas plus.
10. Le plan d'action doit être concret avec des DATES RELATIVES (aujourd'hui, demain, dans 3 jours).

Réponds UNIQUEMENT avec le JSON, rien d'autre.`
}

// ── Génération du narratif ─────────────────────────────────

export async function generateProspectNarrative(input: NarrativeInput): Promise<ProspectNarrative> {
  const prompt = buildPrompt(input)

  try {
    const { text } = await generateText({
      model: getModel('best'),
      messages: [{ role: 'user' as const, content: prompt }],
      temperature: 0.7,
    })

    // Parser le JSON (enlever les ```json si présents)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const narrative = JSON.parse(cleaned) as Omit<ProspectNarrative, 'score_chaleur' | 'classification'>

    return {
      ...narrative,
      score_chaleur: input.score,
      classification: input.classification,
    }
  } catch (error) {
    console.error('[ProspectNarrator] Erreur génération:', error)
    return buildFallbackNarrative(input)
  }
}

// ── Fallback sans IA ───────────────────────────────────────

function buildFallbackNarrative(input: NarrativeInput): ProspectNarrative {
  const { lead, enrichment, score, classification } = input
  const prenom = lead.prenom || 'Ce prospect'
  const nomEntreprise = enrichment.sirene?.nom || lead.entreprise || 'son établissement'

  const isChaud = classification === 'CHAUD'
  const isTiede = classification === 'TIEDE'

  return {
    brief_commercial: `${isChaud ? 'Bonne nouvelle, celui-là est chaud.' : isTiede ? 'Prospect intéressant, mais va falloir creuser.' : 'Prospect froid, commence par qualifier.'} ${prenom} ${enrichment.sirene ? `dirige ${nomEntreprise} à ${enrichment.sirene.ville}` : 'est dans le secteur esthétique'}. Score ${score}/100. ${isChaud ? 'Appelle aujourd\'hui.' : 'Envoie un premier email de contact.'}`,

    verdict: isChaud ? `Prospect chaud (${score}/100) — appelle aujourd'hui, ne laisse pas refroidir.` : isTiede ? `Profil intéressant (${score}/100) — ça vaut un appel exploratoire.` : `Prospect à qualifier (${score}/100) — commence par un email.`,

    histoire_prospect: enrichment.sirene
      ? `${prenom} a ${enrichment.sirene.is_active ? 'un établissement actif' : 'eu un établissement'} enregistré sous le nom ${enrichment.sirene.nom}${enrichment.sirene.ville ? ` à ${enrichment.sirene.ville}` : ''}. ${enrichment.pappers?.chiffreAffaires ? `L'entreprise fait environ ${Math.round(enrichment.pappers.chiffreAffaires / 1000)}K€ de CA.` : 'On n\'a pas encore les chiffres financiers.'} ${enrichment.google?.rating ? `Côté réputation, ${enrichment.google.rating}/5 sur Google avec ${enrichment.google.reviewsCount} avis — c'est plutôt ${enrichment.google.rating >= 4 ? 'solide' : 'moyen'}.` : 'Pas encore de fiche Google trouvée.'}`
      : `On a peu d'infos sur ${prenom} pour l'instant. L'objectif du premier appel : comprendre qui elle est, ce qu'elle fait, et si nos formations peuvent l'aider.`,

    situation_business: enrichment.pappers
      ? `${enrichment.pappers.chiffreAffaires ? `CA de ${Math.round(enrichment.pappers.chiffreAffaires / 1000)}K€` : 'CA inconnu'}. ${enrichment.pappers.effectif ? `${enrichment.pappers.effectif} salarié(s)` : 'Effectif inconnu'}. ${enrichment.pappers.formeJuridique || 'Forme juridique inconnue'}. ${enrichment.pappers.chiffreAffaires && enrichment.pappers.chiffreAffaires > 80000 ? 'Elle a les moyens d\'investir.' : 'Petite structure — parle financement dès le début.'}`
      : 'Pas de données financières disponibles. Pose-lui la question sur la taille de son activité.',

    reputation_visibilite: enrichment.google
      ? `${enrichment.google.rating}/5 sur Google (${enrichment.google.reviewsCount} avis). ${enrichment.google.rating && enrichment.google.rating >= 4 ? 'Elle sait fidéliser ses clientes, c\'est un bon signe.' : 'Des avis mitigés — elle cherche peut-être à se différencier.'} ${enrichment.social?.website ? 'Elle a un site web.' : 'Pas de site web détecté.'} ${enrichment.social?.instagram ? `Instagram : @${enrichment.social.instagram.username}` : 'Pas sur Instagram.'}`
      : 'Pas de présence Google trouvée. C\'est soit une nouvelle activité, soit un angle pour la convaincre de se former au marketing.',

    environnement: enrichment.quartier
      ? `Zone avec ${enrichment.quartier.metros} station(s) de métro, ${enrichment.quartier.concurrentsBeaute} salons beauté concurrents. Trafic piéton : ${enrichment.quartier.footTrafficScore}/100. ${enrichment.quartier.concurrentsBeaute > 5 ? 'Beaucoup de concurrence — elle a besoin de se différencier.' : 'Peu de concurrence — bon marché pour elle.'}`
      : 'Analyse de quartier non réalisée. Pas grave, concentre-toi sur le profil.',

    atouts_vente: [
      enrichment.sirene?.is_active ? 'Entreprise active et déclarée — profil sérieux' : '',
      enrichment.google?.rating && enrichment.google.rating >= 4 ? `Bonne réputation (${enrichment.google.rating}/5) — elle sait gérer des clientes, nos formations vont l'intéresser` : '',
      enrichment.opco ? `Son OPCO (${enrichment.opco}) peut financer à 100% — argument massue` : '',
      lead.telephone ? 'Téléphone dispo — tu peux l\'appeler directement' : '',
      enrichment.social?.instagram ? 'Active sur Instagram — elle comprend l\'importance de la visibilité' : '',
    ].filter(Boolean) as string[],

    pieges_eviter: [
      !lead.telephone ? 'Pas de téléphone → commence par email, demande son numéro' : '',
      enrichment.google?.rating && enrichment.google.rating < 3.5 ? 'Réputation moyenne → n\'en parle pas, concentre-toi sur ce que la formation va lui apporter' : '',
      !enrichment.sirene ? 'SIRET non vérifié → demande-lui si elle est bien déclarée avant de parler financement' : '',
      classification === 'FROID' ? 'Prospect froid → ne vends pas au premier contact, qualifie d\'abord son besoin' : '',
    ].filter(Boolean) as string[],

    strategie: {
      canal: lead.telephone ? 'Appelle-la directement. Le téléphone convertit 5x mieux que l\'email.' : 'Envoie un email personnalisé. Objectif : récupérer son numéro.',
      meilleur_moment: 'Mardi ou mercredi, entre 10h et 12h. Évite le lundi matin et le vendredi après-midi.',
      angle_attaque: enrichment.google?.rating && enrichment.google.rating >= 4
        ? `Félicite-la sur sa réputation Google (${enrichment.google.rating}/5), puis enchaîne sur comment augmenter son panier moyen avec de nouvelles prestations.`
        : `Parle de la tendance du marché esthétique et de comment se différencier avec des formations certifiantes.`,
      objectif_appel: isChaud ? 'Obtenir un RDV physique ou envoyer le programme de formation.' : 'Qualifier son besoin et récupérer les infos manquantes.',
      duree_estimee: '5-7 minutes. Si elle pose des questions, c\'est bon signe — prends le temps.',
    },

    script_telephone: {
      accroche: `Bonjour ${prenom}, c'est [ton prénom] de ${BRAND.name}. Je ne vous dérange pas ?`,
      transition: `Je vous appelle parce que ${enrichment.sirene ? `j'ai vu que ${nomEntreprise} propose des soins esthétiques` : 'vous êtes dans le secteur de l\'esthétique'}, et on a des formations qui permettent d'ajouter des prestations très rentables à votre carte.`,
      proposition: 'En 2 jours de formation, vous maîtrisez une nouvelle technique qui peut vous rapporter 200 à 500€ par séance. Et c\'est finançable à 100% par votre OPCO.',
      closing: 'Est-ce que je peux vous envoyer le programme par email ? Comme ça vous regardez tranquillement et on se rappelle en fin de semaine ?',
      si_objection_prix: `Je comprends. Mais avec le financement ${enrichment.opco || 'OPCO'}, c'est souvent pris en charge à 100%. Et même en auto-financement, avec 3 clientes par mois à 200€, la formation est remboursée en 2-3 mois.`,
      si_objection_temps: 'C\'est justement pour ça que nos formations sont courtes — 1 à 2 jours maximum. Et vous pouvez choisir la date qui vous arrange.',
      si_objection_besoin: `Je comprends, mais est-ce que vous proposez déjà [prestation pertinente] ? Parce que c'est la prestation la plus demandée en ce moment, et nos participantes ajoutent en moyenne 800€ de CA par mois après la formation.`,
    },

    formations_recommandees: [
      {
        nom: 'Microblading / Microshading',
        prix: '1 400€ HT',
        pourquoi_elle: 'Prestation la plus demandée en institut, 2 jours seulement',
        argument_roi: 'À 200€ la séance, avec 3 clientes/mois elle rembourse en 2 mois. Ensuite c\'est du bénéfice net.',
        niveau_priorite: 'principal',
      },
      {
        nom: 'Hygiène et Salubrité',
        prix: '400€ HT',
        pourquoi_elle: 'Prérequis légal obligatoire — si elle ne l\'a pas, c\'est un argument imparable',
        argument_roi: 'Obligatoire pour exercer légalement. 400€ c\'est un investissement minimal pour être en règle.',
        niveau_priorite: 'complementaire',
      },
    ],

    strategie_financement: {
      option_principale: enrichment.opco
        ? `OPCO ${enrichment.opco} — prise en charge entreprise, souvent 100%`
        : lead.statut_pro === 'demandeur_emploi' ? 'France Travail — formation financée + maintien allocations' : 'CPF — tout le monde en a, c\'est le plus simple',
      comment_presenter: 'N\'en parle pas tout de suite. D\'abord, fais-la rêver sur ce que la formation va lui apporter. Ensuite dis : "Et le mieux, c\'est que c\'est finançable."',
      phrase_cle: enrichment.opco
        ? `"Votre OPCO ${enrichment.opco} prend en charge ce type de formation. Concrètement, ça peut être 0€ de votre poche."`
        : '"Vous avez un CPF ? Parce que cette formation est éligible, et beaucoup de nos participantes la financent entièrement avec."',
      alternatives: [
        'Paiement en 2x, 3x ou 4x sans frais',
        enrichment.opco ? 'CPF en complément si l\'OPCO ne couvre pas tout' : 'OPCO à vérifier selon son code NAF',
      ],
    },

    plan_action: {
      action_1: isChaud ? 'Aujourd\'hui : appelle entre 10h et 12h.' : 'Aujourd\'hui : envoie un email de prise de contact personnalisé.',
      action_2: 'Si pas de réponse : relance par SMS demain matin avec un message court et sympa.',
      action_3: 'Si intéressée : envoie le programme PDF + le lien de pré-inscription.',
      rappel: isChaud ? 'Relance dans 2 jours si pas de retour.' : 'Relance dans 5 jours. Si toujours rien, passe en nurturing (cadence email).',
    },

    score_chaleur: score,
    classification,
  }
}
