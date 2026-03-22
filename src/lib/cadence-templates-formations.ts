import { CadenceDefinition, CadenceTemplate } from '@/types/formations-content'

// ============================================================
// CONSTANTES TIMING ET CANAUX
// ============================================================

export const CANAUX_OPTIMAUX = {
  matin: 'email',
  midi: 'whatsapp',
  soir: 'whatsapp',
  fermeture_institut: 'appel'
} as const

export const MEILLEURS_CRENEAUX = {
  whatsapp: '12h00-13h30 ou 18h30-19h30',
  appel: 'Mardi (jour fermeture) 10h-12h',
  email: 'Mardi/Jeudi 9h-10h',
  sms: 'Éviter les heures de soins (9h-17h)'
} as const

// ============================================================
// CADENCE 1 — SUIVI POST-FORMATION (180 JOURS)
// ============================================================

const CADENCE_POST_FORMATION: CadenceDefinition = {
  id: 'post-formation-180j',
  slug: 'suivi-post-formation',
  nom: 'Suivi Post-Formation',
  description: 'Accompagnement des alumni sur 6 mois : réputation, support technique, upsell, fidélisation e-shop',
  type: 'post-formation',
  dureeJours: 180,
  templates: [
    {
      id: 'post-j1-felicitations',
      cadenceId: 'post-formation-180j',
      ordre: 1,
      delaiJours: 1,
      canal: 'email',
      sujet: 'Bravo pour votre certification Dermotec!',
      corps: `Bonjour {prenom},

C'était un plaisir de vous avoir parmi nous cette semaine. Vous avez montré de réelles aptitudes sur {specialite}.

Pour nous aider à maintenir ce niveau d'excellence, pourriez-vous partager votre expérience en quelques secondes ici ? {lien_avis_google}

C'est votre premier pas en tant qu'experte certifiée !

Bien à vous,
L'équipe Dermotec`,
      variables: ['prenom', 'specialite', 'lien_avis_google'],
      objectif: 'Réputation et engagement initial',
      conseilsExecution: [
        'Envoyer dans les 24h suivant la fin de formation',
        'Personnaliser avec une observation spécifique notée pendant la formation',
        'Inclure le lien direct vers Google My Business',
        'Mentionner un point fort observé pendant la pratique'
      ]
    },
    {
      id: 'post-j1-sms',
      cadenceId: 'post-formation-180j',
      ordre: 2,
      delaiJours: 1,
      canal: 'sms',
      sujet: '',
      corps: `{prenom}, encore bravo pour votre certification ! 🎓 J'ai envoyé par email le lien pour l'avis Google. À bientôt ! - Dermotec`,
      variables: ['prenom'],
      objectif: 'Notification pour vérifier email',
      conseilsExecution: [
        'Envoyer 30min après l\'email',
        'Garder le ton chaleureux mais professionnel',
        'Utiliser emoji avec parcimonie'
      ]
    },
    {
      id: 'post-j7-support',
      cadenceId: 'post-formation-180j',
      ordre: 3,
      delaiJours: 7,
      canal: 'whatsapp',
      sujet: '',
      corps: `Bonjour {prenom}, j'espère que vous avez pu installer votre poste de travail.

Avez-vous déjà pratiqué sur votre premier modèle ?

Si vous avez un doute sur le choix de l'aiguille NPM ou sur la colorimétrie du pigment, n'hésitez pas à m'envoyer une photo. On est là pour vous aider à démarrer sereinement !`,
      variables: ['prenom'],
      objectif: 'Support technique et barrière à l\'abandon',
      conseilsExecution: [
        'Utiliser WhatsApp pour la proximité (94% taux d\'ouverture vs 20% email)',
        'Répondre rapidement aux photos envoyées (dans l\'heure si possible)',
        'Proposer un appel si la réponse nécessite plus d\'explications',
        'Garder une photo de référence prête à envoyer si besoin'
      ]
    },
    {
      id: 'post-j14-upsell',
      cadenceId: 'post-formation-180j',
      ordre: 4,
      delaiJours: 14,
      canal: 'email',
      sujet: 'Boostez vos compétences avec -100€ sur votre prochaine formation',
      corps: `Bonjour {prenom},

Vous pratiquez maintenant depuis deux semaines. Avez-vous remarqué que vos clientes demandent de plus en plus de naturel ?

Notre module '{formation_upsell}' vous permet de réduire votre temps de prestation de 20%.

En tant qu'alumni, bénéficiez de -100€ sur cette session avec le code PERF100.

Les prochaines dates disponibles :
{dates_disponibles}

Souhaitez-vous que je vous réserve une place ?

Cordialement,
L'équipe Dermotec`,
      variables: ['prenom', 'formation_upsell', 'dates_disponibles'],
      objectif: 'Upsell précoce sur besoin identifié',
      conseilsExecution: [
        'Adapter la formation proposée selon la formation initiale suivie',
        'Utiliser le code promo comme incitation temporelle (validité 15 jours)',
        'Mentionner un bénéfice concret (réduction temps, augmentation prix)',
        'Proposer 2-3 dates maximum pour éviter l\'embarras du choix'
      ]
    },
    {
      id: 'post-j30-diagnostic',
      cadenceId: 'post-formation-180j',
      ordre: 5,
      delaiJours: 30,
      canal: 'appel',
      sujet: '',
      corps: `Bonjour {prenom}, comment se passe le développement de votre clientèle ?

Beaucoup de nos anciennes stagiaires nous disent qu'après un mois, la demande pour les lèvres 'Candy Lips' commence à arriver.

Comme vous maîtrisez déjà bien le dermographe Oron, je pensais qu'une journée de spécialisation lèvres pourrait booster votre chiffre d'affaires.

Qu'en pensez-vous ?`,
      variables: ['prenom'],
      objectif: 'Coaching et identification des freins, upsell',
      conseilsExecution: [
        'Préparer avant l\'appel l\'historique de commandes e-shop',
        'Noter les signaux d\'intérêt pour une prochaine formation',
        'Adapter le discours selon les réponses (freins identifiés)',
        'Proposer un accompagnement personnalisé si difficultés'
      ]
    },
    {
      id: 'post-j90-eshop',
      cadenceId: 'post-formation-180j',
      ordre: 6,
      delaiJours: 90,
      canal: 'whatsapp',
      sujet: '',
      corps: `Hello {prenom}! Comment va le stock de pigments ? 🎨

On arrive sur la saison haute, c'est le moment de vérifier vos aiguilles et vos couleurs préférées.

Livraison offerte dès 200€ d'achat cette semaine sur l'e-shop NPM !

👉 {lien_eshop}`,
      variables: ['prenom', 'lien_eshop'],
      objectif: 'Génération revenus récurrents e-shop',
      conseilsExecution: [
        'Vérifier les dernières commandes pour personnaliser (ex: rappeler les pigments préférés)',
        'Profiter de la saisonnalité (printemps/été = saison haute)',
        'Proposer un appel si montant commande > 500€ (conseil personnalisé)',
        'Envoyer le lien direct vers la catégorie pertinente'
      ]
    },
    {
      id: 'post-j180-masterclass',
      cadenceId: 'post-formation-180j',
      ordre: 7,
      delaiJours: 180,
      canal: 'email',
      sujet: 'Invitation exclusive : Masterclass {technique_nouvelle}',
      corps: `Bonjour {prenom},

Cela fait maintenant 6 mois que vous avez obtenu votre certification. Le marché évolue rapidement et nous venons de lancer un module avancé sur {technique_nouvelle}.

En tant qu'alumni Dermotec, vous êtes invitée à une Masterclass gratuite le {date_masterclass} pour découvrir cette technique en avant-première.

Places limitées à 8 participantes.

🎯 Au programme :
- Démonstration live de la technique {technique_nouvelle}
- Cas pratiques et retours d'expérience
- Questions/réponses avec notre formatrice experte
- Offre spéciale formation complète (réservée aux participants)

Confirmez-vous votre présence ?

Cordialement,
L'équipe Dermotec`,
      variables: ['prenom', 'technique_nouvelle', 'date_masterclass'],
      objectif: 'Réactivation et montée en expertise',
      conseilsExecution: [
        'Cibler les alumni n\'ayant pas fait de formation depuis 6 mois',
        'Mentionner les nouveautés pertinentes à leur spécialisation',
        'Créer un sentiment d\'exclusivité avec le nombre limité de places',
        'Préparer une offre spéciale pour les participants à la masterclass'
      ]
    }
  ]
}

// ============================================================
// CADENCE 2 — CYCLE DE VENTE 21 JOURS
// ============================================================

const CADENCE_VENTE_21J: CadenceDefinition = {
  id: 'vente-cycle-21j',
  slug: 'cycle-vente-21-jours',
  nom: 'Cycle de Vente 21 Jours',
  description: 'Cycle commercial complet du devis jusqu\'à la signature avec relances multi-canaux',
  type: 'vente',
  dureeJours: 21,
  templates: [
    {
      id: 'vente-j0-email-devis',
      cadenceId: 'vente-cycle-21j',
      ordre: 1,
      delaiJours: 0,
      canal: 'email',
      sujet: 'Votre programme de formation {formation_nom} + devis',
      corps: `Bonjour {prenom},

Suite à notre échange, voici le programme détaillé de la formation '{formation_nom}' ainsi que le devis correspondant.

Comme discuté, cette formation peut être prise en charge à {pourcentage_financement}% par {organisme_financement}.

📋 Documents en pièce jointe :
- Programme complet {formation_nom}
- Devis détaillé
- Guide financement {organisme_financement}

N'hésitez pas à me contacter pour toute question. Je reste disponible pour vous accompagner dans les démarches de financement.

Bien cordialement,
{nom_commercial}
Dermotec Advanced`,
      variables: ['prenom', 'formation_nom', 'pourcentage_financement', 'organisme_financement', 'nom_commercial'],
      objectif: 'Ancrer l\'intérêt et fournir les documents',
      conseilsExecution: [
        'Envoyer dans l\'heure suivant l\'appel',
        'Attacher les 3 documents en PDF',
        'Personnaliser le nom du fichier avec le prénom prospect',
        'Programmer un rappel pour suivi J+2 si pas de réponse'
      ]
    },
    {
      id: 'vente-j0-whatsapp-notif',
      cadenceId: 'vente-cycle-21j',
      ordre: 2,
      delaiJours: 0,
      canal: 'whatsapp',
      sujet: '',
      corps: `Bonjour {prenom}!

Je viens de vous envoyer par email le programme + devis pour '{formation_nom}'.

Dites-moi si vous avez des questions, je suis dispo! 📋`,
      variables: ['prenom', 'formation_nom'],
      objectif: 'Notification pour vérifier email',
      conseilsExecution: [
        'Envoyer 10-15 minutes après l\'email',
        'Servir de notification pour vérifier les spams',
        'Rester disponible pour réponse immédiate',
        'Noter l\'heure de lecture du message (vu = intérêt)'
      ]
    },
    {
      id: 'vente-j2-whatsapp-urssaf',
      cadenceId: 'vente-cycle-21j',
      ordre: 3,
      delaiJours: 2,
      canal: 'whatsapp',
      sujet: '',
      corps: `Bonjour {prenom}!

Avez-vous pu vérifier si votre attestation URSSAF est disponible sur votre espace ?

C'est la pièce clé pour débloquer le financement {organisme_financement}.

Si besoin, je peux vous guider en 2 minutes par téléphone 📱`,
      variables: ['prenom', 'organisme_financement'],
      objectif: 'Avancer le dossier administratif',
      conseilsExecution: [
        'Proposer l\'aide concrète, ne pas être passif',
        'Avoir le lien direct URSSAF prêt à envoyer',
        'Si elle n\'a pas l\'attestation : proposer rendez-vous téléphonique immédiat',
        'Noter dans CRM l\'état d\'avancement du dossier'
      ]
    },
    {
      id: 'vente-j5-appel-technique',
      cadenceId: 'vente-cycle-21j',
      ordre: 4,
      delaiJours: 5,
      canal: 'appel',
      sujet: '',
      corps: `Bonjour {prenom}, je vous appelle pour faire un point sur votre projet de formation en {formation_nom}.

Avez-vous eu le temps de regarder le programme ? Y a-t-il des points techniques qui vous interrogent ?

Je peux aussi vous montrer des photos avant/après de nos dernières stagiaires si cela peut vous aider à vous projeter.`,
      variables: ['prenom', 'formation_nom'],
      objectif: 'Lever les derniers doutes techniques',
      conseilsExecution: [
        'Avoir des photos avant/après prêtes à envoyer par WhatsApp juste après l\'appel',
        'Préparer 3-4 questions ouvertes pour identifier les freins',
        'Si pas de réponse : laisser message vocal + SMS de rappel',
        'Noter les objections pour adapter les arguments suivants'
      ]
    },
    {
      id: 'vente-j10-whatsapp-temoignage',
      cadenceId: 'vente-cycle-21j',
      ordre: 5,
      delaiJours: 10,
      canal: 'whatsapp',
      sujet: '',
      corps: `Bonjour {prenom}!

Je voulais vous partager cette vidéo de {prenom_temoin}, qui a fait la même formation le mois dernier.

Elle raconte comment elle a rentabilisé sa formation en 2 semaines! 🎬

{lien_video}

Ça vous motive ?`,
      variables: ['prenom', 'prenom_temoin', 'lien_video'],
      objectif: 'Preuve sociale et réassurance',
      conseilsExecution: [
        'Utiliser un témoignage de profil similaire à la prospect (même zone géographique ou même type d\'institut si possible)',
        'Vidéo courte (max 2 minutes) et spontanée',
        'Demander autorisation à l\'alumni avant d\'utiliser son témoignage',
        'Avoir 2-3 témoignages différents selon le profil prospect'
      ]
    },
    {
      id: 'vente-j21-breakup',
      cadenceId: 'vente-cycle-21j',
      ordre: 6,
      delaiJours: 21,
      canal: 'email',
      sujet: 'Je libère votre place — {formation_nom}',
      corps: `Bonjour {prenom},

Je n'ai pas eu de nouvelles de votre part concernant la formation '{formation_nom}'.

Je comprends que votre planning est chargé. Je libère donc votre place pré-réservée pour une autre stagiaire.

Si le projet revient d'actualité, n'hésitez pas à me recontacter — je serai ravie de vous accompagner pour la prochaine session.

Belle continuation dans votre activité !

Cordialement,
{nom_commercial}
Dermotec Advanced`,
      variables: ['prenom', 'formation_nom', 'nom_commercial'],
      objectif: 'Dernière tentative de réactivation par la rareté',
      conseilsExecution: [
        'Le break-up relance souvent le dialogue, 20-30% de réponses',
        'Ne pas être négatif, rester professionnel et positif',
        'Programmer un suivi dans 3 mois pour réactivation',
        'Si réponse négative : demander un feedback sur les freins rencontrés'
      ]
    }
  ]
}

// ============================================================
// CADENCE 3 — PROGRAMME PARRAINAGE CERCLE EXPERT (180 JOURS)
// ============================================================

const CADENCE_PARRAINAGE_180J: CadenceDefinition = {
  id: 'parrainage-cercle-expert',
  slug: 'programme-parrainage-cercle-expert',
  nom: 'Programme Parrainage Cercle Expert',
  description: 'Activation et gamification du parrainage alumni avec récompenses et suivi personnalisé',
  type: 'parrainage',
  dureeJours: 180,
  templates: [
    {
      id: 'parrainage-j0-bienvenue',
      cadenceId: 'parrainage-cercle-expert',
      ordre: 1,
      delaiJours: 0,
      canal: 'email',
      sujet: 'Vous êtes officiellement Alumni Dermotec — découvrez vos avantages',
      corps: `Bonjour {prenom},

Félicitations pour l'obtention de votre certification ! Vous faites désormais partie du Cercle Expert Dermotec.

🎯 VOTRE CODE PARRAINAGE PERSONNEL : {code_parrainage}

Pour chaque collègue qui s'inscrit avec votre code à une formation d'au moins 5 jours :
✅ Vous recevez 150€ de crédit e-shop NPM
✅ Votre filleul(e) bénéficie de 10% de remise immédiate

Partagez-le sur vos réseaux ou directement avec vos consœurs !

🌟 Transmettez votre passion, nous récompensons votre expertise.

💡 Astuce : Plus vous parrainez, plus vous cumulez de crédit pour vos prochains achats de matériel et formations.

Bien à vous,
L'équipe Dermotec`,
      variables: ['prenom', 'code_parrainage'],
      objectif: 'Activer le parrainage dès la fin de formation',
      conseilsExecution: [
        'Remettre aussi un support physique (carte avec code) dans le livret d\'accueil',
        'Expliquer clairement les conditions (formation minimum 5 jours)',
        'Créer un sentiment d\'appartenance au "Cercle Expert"',
        'Envoyer dans les 2h suivant la remise du certificat'
      ]
    },
    {
      id: 'parrainage-m1-rappel',
      cadenceId: 'parrainage-cercle-expert',
      ordre: 2,
      delaiJours: 30,
      canal: 'whatsapp',
      sujet: '',
      corps: `Bonjour {prenom}!

Avez-vous eu l'occasion de partager votre code parrainage {code_parrainage} avec vos collègues ? 💎

Rappel : 150€ de crédit NPM pour vous + 10% de remise pour votre filleule.

C'est le moment d'en parler à vos consœurs qui envisagent de se former !`,
      variables: ['prenom', 'code_parrainage'],
      objectif: 'Relance douce du parrainage',
      conseilsExecution: [
        'Personnaliser en fonction de l\'activité Instagram de l\'alumni si visible',
        'Proposer des phrases types à utiliser pour le partage',
        'Envoyer en fin de journée (18h-19h) pour meilleur engagement',
        'Suivre qui a cliqué sur le lien pour cibler les prochaines relances'
      ]
    },
    {
      id: 'parrainage-m3-bilan',
      cadenceId: 'parrainage-cercle-expert',
      ordre: 3,
      delaiJours: 90,
      canal: 'email',
      sujet: 'Votre bilan Cercle Expert — {nb_filleuls} filleul(e)s!',
      corps: `Bonjour {prenom},

Voici votre bilan Cercle Expert après 3 mois :

📊 {nb_filleuls} filleul(e)s inscrit(e)s grâce à votre recommandation !
💰 Crédit e-shop cumulé : {credit_cumule}€

Pour vous remercier de votre engagement, nous vous offrons en plus une remise de 20% sur votre prochain module de perfectionnement.

🎁 Utilisez le code AMBASS20 avant le {date_expiration}

Continuez à faire rayonner l'excellence Dermotec !

Merci pour votre confiance,
L'équipe Dermotec`,
      variables: ['prenom', 'nb_filleuls', 'credit_cumule', 'date_expiration'],
      objectif: 'Gamifier le parrainage et récompenser',
      conseilsExecution: [
        'Même si 0 filleul, envoyer un message positif avec rappel du programme',
        'Créer un tableau de bord parrainage dans l\'espace alumni',
        'Proposer des conseils pour améliorer le taux de conversion',
        'Mettre en avant les top ambassadrices (avec leur accord)'
      ]
    },
    {
      id: 'parrainage-m6-renouvellement',
      cadenceId: 'parrainage-cercle-expert',
      ordre: 4,
      delaiJours: 180,
      canal: 'email',
      sujet: 'Nouvelles formations + votre code parrainage toujours actif',
      corps: `Bonjour {prenom},

6 mois déjà depuis votre certification !

Votre code {code_parrainage} est toujours actif et valable sur nos nouvelles formations :

🆕 {liste_nouvelles_formations}

C'est le moment idéal pour en parler autour de vous : les budgets formation se renouvellent en janvier et septembre.

Vous restez notre meilleure ambassadrice !

🎯 Objectif pour les 6 prochains mois : aidez-nous à former 3 nouvelles expertes grâce à vos recommandations.

Récompense spéciale si objectif atteint : Masterclass VIP gratuite avec notre formatrice experte internationale.

À bientôt,
L'équipe Dermotec`,
      variables: ['prenom', 'code_parrainage', 'liste_nouvelles_formations'],
      objectif: 'Réactiver le parrainage avec les nouveautés',
      conseilsExecution: [
        'Cibler la saisonnalité (envoyer en octobre pour janvier, en juin pour septembre)',
        'Mettre en avant les nouveautés attractives',
        'Créer un objectif gamifié avec récompense motivante',
        'Proposer un call de 15min pour faire le bilan et fixer les objectifs'
      ]
    }
  ]
}

// ============================================================
// EXPORTS ET FONCTIONS UTILITAIRES
// ============================================================

export const CADENCE_DEFINITIONS: CadenceDefinition[] = [
  CADENCE_POST_FORMATION,
  CADENCE_VENTE_21J,
  CADENCE_PARRAINAGE_180J
]

/**
 * Récupère une cadence par son type
 */
export function getCadenceByType(type: CadenceDefinition['type']): CadenceDefinition | undefined {
  return CADENCE_DEFINITIONS.find(cadence => cadence.type === type)
}

/**
 * Récupère les templates d'une cadence pour un délai donné
 */
export function getTemplatesByDelai(cadenceId: string, delaiJours: number): CadenceTemplate[] {
  const cadence = CADENCE_DEFINITIONS.find(c => c.id === cadenceId)
  if (!cadence) return []

  return cadence.templates.filter(template => template.delaiJours === delaiJours)
}

/**
 * Récupère tous les templates d'une cadence triés par ordre d'exécution
 */
export function getTemplatesByCadence(cadenceId: string): CadenceTemplate[] {
  const cadence = CADENCE_DEFINITIONS.find(c => c.id === cadenceId)
  if (!cadence) return []

  return cadence.templates.sort((a, b) => a.ordre - b.ordre)
}

/**
 * Récupère le prochain template à exécuter pour une cadence donnée
 */
export function getNextTemplate(cadenceId: string, derniereEtapeOrdre: number): CadenceTemplate | undefined {
  const templates = getTemplatesByCadence(cadenceId)
  return templates.find(template => template.ordre === derniereEtapeOrdre + 1)
}

/**
 * Calcule le nombre total de touchpoints pour une cadence
 */
export function getTotalTouchpoints(cadenceId: string): number {
  const cadence = CADENCE_DEFINITIONS.find(c => c.id === cadenceId)
  return cadence ? cadence.templates.length : 0
}

/**
 * Récupère les templates par canal pour une cadence donnée
 */
export function getTemplatesByCanal(cadenceId: string, canal: CadenceTemplate['canal']): CadenceTemplate[] {
  const templates = getTemplatesByCadence(cadenceId)
  return templates.filter(template => template.canal === canal)
}