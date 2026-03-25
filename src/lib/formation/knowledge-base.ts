import { KBEntry, KBCategorie } from '@/types/formations-content'

// ============================================================
// BASE DE CONNAISSANCES — CRM DERMOTEC FORMATION ESTHÉTIQUE
// ============================================================
// Données pour l'Agent IA commercial — Retrieval structuré
// 7 catégories / 90+ entrées professionnelles
// ============================================================

// CATÉGORIE A — SCRIPTS DE VENTE (12 entrées)
// ============================================================

export const KB_SCRIPTS_VENTE: KBEntry[] = [
  {
    id: 'script-001',
    categorie: 'script-vente',
    titre: 'Accroche téléphonique contextuelle',
    contenu: "Bonjour [Prénom], je suis [Nom] de l'institut de formation [Nom]. Je vous appelle car j'ai vu que vous aviez consulté notre nouveau protocole sur le Microblading ce matin. J'ai jeté un œil à votre page Instagram, vous avez déjà un très beau travail sur le regard, et je me demandais si vous aviez déjà calculé combien de clientes vous pourriez convertir dès le mois prochain avec cette nouvelle technique? Avez-vous deux minutes pour que je vous explique comment débloquer votre budget formation pour ce projet?",
    tags: ['accroche', 'telephone', 'personnalisation', 'microblading', 'instagram'],
    metadata: {
      canal: 'appel',
      timing: 'premier-contact',
      duree: '30-45 secondes'
    }
  },
  {
    id: 'script-002',
    categorie: 'script-vente',
    titre: 'Découverte 5 piliers',
    contenu: "Les 5 questions obligatoires : Situation (\"Quelle prestation prend le plus de temps en cabine?\"), Objectifs (\"Quel CA supplémentaire visez-vous?\"), Budget (\"Quand avez-vous sollicité vos droits FAFCEA/OPCO?\"), Timing (\"À quelle date voulez-vous proposer cette prestation?\"), Décideur (\"Vous validez seule les investissements?\")",
    tags: ['decouverte', 'questions', 'qualification', 'besoins', 'budget'],
    metadata: {
      canal: 'appel',
      timing: 'phase-decouverte',
      duree: '5-10 minutes'
    }
  },
  {
    id: 'script-003',
    categorie: 'script-vente',
    titre: 'Argumentation ROI cabine',
    contenu: "Cette formation n'est pas un coût, c'est un levier de trésorerie. Une pose d'extensions de cils = 90€/1h30. Deux nouvelles clientes/semaine = 720€/mois. Formation rentabilisée en 6 semaines. Avec prise en charge OPCO, bénéfice dès la première cliente.",
    tags: ['roi', 'rentabilite', 'argumentaire', 'cils', 'calcul'],
    metadata: {
      canal: 'appel',
      timing: 'argumentation',
      duree: '1-2 minutes'
    }
  },
  {
    id: 'script-004',
    categorie: 'script-vente',
    titre: 'WhatsApp qualification message 1',
    contenu: "Coucou [Prénom]! Merci pour ton message sur [Formation]. Pour voir si tu peux l'avoir gratuitement, tu es plutôt gérante salariée ou auto-entrepreneuse? 😊",
    tags: ['whatsapp', 'qualification', 'statut', 'financement', 'tutoiement'],
    metadata: {
      canal: 'whatsapp',
      timing: 'premier-echange',
      ton: 'familier'
    }
  },
  {
    id: 'script-005',
    categorie: 'script-vente',
    titre: 'WhatsApp qualification message 2',
    contenu: "Top! En tant qu'indépendante, tu as un budget annuel FAFCEA qui dort. Je peux vérifier pour toi s'il couvre les 1200€ de la formation. Tu as déjà fait une formation cette année?",
    tags: ['whatsapp', 'fafcea', 'independante', 'budget', 'verification'],
    metadata: {
      canal: 'whatsapp',
      timing: 'qualification-suite',
      organisme: 'fafcea'
    }
  },
  {
    id: 'script-006',
    categorie: 'script-vente',
    titre: 'WhatsApp qualification message 3',
    contenu: "Il semblerait que ce soit 100% finançable! Je t'appelle 2 min à 12h30 à ta pause pour t'expliquer comment on récupère les sous? 📞",
    tags: ['whatsapp', 'financement', 'appel', 'rendez-vous', 'urgence'],
    metadata: {
      canal: 'whatsapp',
      timing: 'prise-rendez-vous',
      urgence: 'elevee'
    }
  },
  {
    id: 'script-007',
    categorie: 'script-vente',
    titre: 'J+1 Félicitations post-formation',
    contenu: "Bonjour [Prénom], c'était un plaisir de vous avoir parmi nous cette semaine. Vous avez montré de réelles aptitudes sur le tracé des sourcils poudrés. Pour nous aider à maintenir ce niveau d'excellence, pourriez-vous partager votre expérience en quelques secondes ici? [Lien avis Google]. C'est votre premier pas en tant qu'experte certifiée!",
    tags: ['post-formation', 'satisfaction', 'avis-google', 'felicitations', 'temoignage'],
    metadata: {
      canal: 'email',
      timing: 'j+1',
      objectif: 'avis-client'
    }
  },
  {
    id: 'script-008',
    categorie: 'script-vente',
    titre: 'J+7 Accompagnement technique',
    contenu: "Bonjour [Prénom], j'espère que vous avez pu installer votre poste de travail. Avez-vous déjà pratiqué sur votre premier modèle? Si vous avez un doute sur le choix de l'aiguille NPM ou sur la colorimétrie du pigment, n'hésitez pas à m'envoyer une photo. On est là pour vous aider à démarrer sereinement!",
    tags: ['accompagnement', 'technique', 'npm', 'pigment', 'suivi'],
    metadata: {
      canal: 'whatsapp',
      timing: 'j+7',
      objectif: 'accompagnement'
    }
  },
  {
    id: 'script-009',
    categorie: 'script-vente',
    titre: 'J+14 Proposition perfectionnement',
    contenu: "Bonjour [Prénom], vous pratiquez maintenant depuis deux semaines. Avez-vous remarqué que vos clientes demandent de plus en plus de naturel? Notre module 'Sourcils Poudrés Expert' vous permet de réduire votre temps de prestation de 20%. En tant qu'alumni, bénéficiez de -100€ sur cette session avec le code PERF100.",
    tags: ['perfectionnement', 'upsell', 'alumni', 'reduction', 'naturel'],
    metadata: {
      canal: 'email',
      timing: 'j+14',
      objectif: 'upsell'
    }
  },
  {
    id: 'script-010',
    categorie: 'script-vente',
    titre: 'J+30 Diagnostic business',
    contenu: "Bonjour [Prénom], comment se passe le développement de votre clientèle? Beaucoup de nos anciennes stagiaires nous disent qu'après un mois, la demande pour les lèvres 'Candy Lips' commence à arriver. Comme vous maîtrisez déjà bien le dermographe Oron, je pensais qu'une journée de spécialisation lèvres pourrait booster votre chiffre d'affaires. Qu'en pensez-vous?",
    tags: ['diagnostic', 'business', 'levres', 'specialisation', 'ca'],
    metadata: {
      canal: 'appel',
      timing: 'j+30',
      objectif: 'cross-sell'
    }
  },
  {
    id: 'script-011',
    categorie: 'script-vente',
    titre: 'J+90 Réapprovisionnement NPM',
    contenu: "Hello [Prénom]! Comment va le stock de pigments? 🎨 On arrive sur la saison haute, c'est le moment de vérifier vos aiguilles et vos couleurs préférées. Livraison offerte dès 200€ d'achat cette semaine sur l'e-shop NPM!",
    tags: ['reapprovisionnement', 'npm', 'pigments', 'saison-haute', 'e-shop'],
    metadata: {
      canal: 'whatsapp',
      timing: 'j+90',
      objectif: 'vente-materiel'
    }
  },
  {
    id: 'script-012',
    categorie: 'script-vente',
    titre: 'Break-up J+21',
    contenu: "Je suppose que le projet est reporté, je libère votre place pour une autre stagiaire. Restons en contact pour la prochaine saison.",
    tags: ['break-up', 'urgence', 'pression', 'place-limitee', 'abandon'],
    metadata: {
      canal: 'email',
      timing: 'j+21',
      objectif: 'derniere-chance'
    }
  }
]

// CATÉGORIE B — OBJECTIONS & PARADES (10 entrées)
// ============================================================

export const KB_OBJECTIONS: KBEntry[] = [
  {
    id: 'objection-001',
    categorie: 'objection-parade',
    titre: 'C\'est trop cher',
    contenu: "OBJECTION: \"C'est trop cher\" → PARADE: \"Je comprends tout à fait. C'est pour cela que nous avons Qualiopi : pour que ce soit l'OPCO qui paie, pas votre trésorerie. Parlons-nous du prix ou de votre reste à charge qui sera probablement de 0€?\"",
    tags: ['prix', 'cher', 'qualiopi', 'opco', 'reste-a-charge'],
    metadata: {
      frequence: 'tres-frequent',
      difficulte: 'facile',
      technique: 'reformulation'
    }
  },
  {
    id: 'objection-002',
    categorie: 'objection-parade',
    titre: 'Je n\'ai pas le temps',
    contenu: "OBJECTION: \"Je n'ai pas le temps\" → PARADE: \"C'est justement parce que vous travaillez trop qu'il vous faut cette technique. Elle se facture 2 fois plus cher qu'un soin classique pour le même temps passé. Quel jour de la semaine est le plus calme pour vous fermer l'institut?\"",
    tags: ['temps', 'planning', 'rentabilite', 'fermeture', 'efficacite'],
    metadata: {
      frequence: 'frequent',
      difficulte: 'moyen',
      technique: 'retournement-positif'
    }
  },
  {
    id: 'objection-003',
    categorie: 'objection-parade',
    titre: 'Je ne suis pas sûre d\'y arriver',
    contenu: "OBJECTION: \"Je ne suis pas sûre d'y arriver\" → PARADE: \"C'est une crainte normale. Nos groupes sont limités à 6 stagiaires pour que la formatrice puisse corriger votre geste minute après minute. Nous ne vous lâchons pas tant que le résultat n'est pas parfait.\"",
    tags: ['confiance', 'competence', 'peur', 'groupe-limite', 'accompagnement'],
    metadata: {
      frequence: 'frequent',
      difficulte: 'moyen',
      technique: 'reassurance'
    }
  },
  {
    id: 'objection-004',
    categorie: 'objection-parade',
    titre: 'Je vais réfléchir',
    contenu: "OBJECTION: \"Je vais réfléchir\" → PARADE: \"Bien sûr. Habituellement, quand on veut réfléchir, c'est qu'il manque une information : est-ce que c'est sur la rentabilité de la technique ou sur le montage du dossier de financement que vous avez un doute?\"",
    tags: ['reflexion', 'doute', 'information', 'rentabilite', 'financement'],
    metadata: {
      frequence: 'tres-frequent',
      difficulte: 'difficile',
      technique: 'alternative-fermee'
    }
  },
  {
    id: 'objection-005',
    categorie: 'objection-parade',
    titre: 'Mon mari doit valider',
    contenu: "OBJECTION: \"Mon mari doit valider\" → PARADE: \"Je comprends, c'est une décision pour l'entreprise familiale. Quels sont les points sur lesquels il est le plus vigilant? Je peux vous envoyer un tableau de rentabilité pour l'aider à visualiser le retour sur investissement.\"",
    tags: ['conjoint', 'validation', 'famille', 'tableau', 'roi'],
    metadata: {
      frequence: 'frequent',
      difficulte: 'moyen',
      technique: 'inclusion-tiers'
    }
  },
  {
    id: 'objection-006',
    categorie: 'objection-parade',
    titre: 'J\'ai déjà fait une formation décevante',
    contenu: "OBJECTION: \"J'ai déjà fait une formation décevante\" → PARADE: \"Je suis désolé de l'entendre. C'est précisément pour éviter cela que nous sommes certifiés Qualiopi. Qu'est-ce qui vous avait manqué la dernière fois pour que nous puissions nous assurer de le couvrir?\"",
    tags: ['experience', 'deception', 'qualiopi', 'certification', 'amelioration'],
    metadata: {
      frequence: 'occasionnel',
      difficulte: 'difficile',
      technique: 'differentiation'
    }
  },
  {
    id: 'objection-007',
    categorie: 'objection-parade',
    titre: 'L\'administratif est trop lourd',
    contenu: "OBJECTION: \"L'administratif est trop lourd\" → PARADE: \"C'est notre métier, pas le vôtre. Nous nous occupons de tout : de la demande de prise en charge jusqu'à la facture finale. Votre seul travail sera de venir apprendre le geste.\"",
    tags: ['administratif', 'lourdeur', 'accompagnement', 'service', 'simplification'],
    metadata: {
      frequence: 'frequent',
      difficulte: 'facile',
      technique: 'prise-en-charge'
    }
  },
  {
    id: 'objection-008',
    categorie: 'objection-parade',
    titre: 'Le marché est saturé',
    contenu: "OBJECTION: \"Le marché est saturé\" → PARADE: \"C'est vrai pour les soins classiques. Mais pour [technique], combien d'instituts le proposent dans un rayon de 5km? C'est votre chance de prendre les parts de marché maintenant.\"",
    tags: ['marche', 'saturation', 'concurrence', 'opportunite', 'parts-marche'],
    metadata: {
      frequence: 'occasionnel',
      difficulte: 'moyen',
      technique: 'repositionnement'
    }
  },
  {
    id: 'objection-009',
    categorie: 'objection-parade',
    titre: 'Je n\'ai pas le matériel',
    contenu: "OBJECTION: \"Je n'ai pas le matériel\" → PARADE: \"Le kit de démarrage est inclus dans la formation et il est également finançable. Vous repartez avec tout ce qu'il faut pour traiter vos 10 premières clientes immédiatement.\"",
    tags: ['materiel', 'kit', 'inclus', 'financement', 'demarrage'],
    metadata: {
      frequence: 'frequent',
      difficulte: 'facile',
      technique: 'inclusion-benefice'
    }
  },
  {
    id: 'objection-010',
    categorie: 'objection-parade',
    titre: 'Je rappellerai plus tard',
    contenu: "OBJECTION: \"Je rappellerai plus tard\" → PARADE: \"Je comprends votre planning chargé. Cependant, les commissions de l'OPCO se clôturent le [date]. Si nous ne déposons pas le dossier aujourd'hui, vous perdez vos droits pour cette session. On prend 2 minutes pour vérifier votre éligibilité?\"",
    tags: ['report', 'urgence', 'commission', 'opco', 'droits'],
    metadata: {
      frequence: 'frequent',
      difficulte: 'moyen',
      technique: 'urgence-vraie'
    }
  }
]

// CATÉGORIE C — FAQ TECHNIQUE (20 entrées)
// ============================================================

export const KB_FAQ_TECHNIQUE: KBEntry[] = [
  {
    id: 'faq-tech-001',
    categorie: 'faq-technique',
    titre: 'Le maquillage permanent est-il un tatouage?',
    contenu: "Techniquement oui, mais les pigments sont différents et l'implantation est plus superficielle pour permettre un estompage naturel en 2-3 ans.",
    tags: ['maquillage-permanent', 'tatouage', 'pigments', 'estompage', 'duree'],
    metadata: {
      complexite: 'simple',
      domaine: 'dermopigmentation',
      frequence: 'tres-frequent'
    }
  },
  {
    id: 'faq-tech-002',
    categorie: 'faq-technique',
    titre: 'Pourquoi le microblading ne tient pas sur peau grasse?',
    contenu: "L'excès de sébum fait diffuser le pigment, les traits fins du poil à poil deviennent flous. Le microshading est préférable dans ce cas.",
    tags: ['microblading', 'peau-grasse', 'sebum', 'microshading', 'diffusion'],
    metadata: {
      complexite: 'moyen',
      domaine: 'dermopigmentation',
      frequence: 'frequent'
    }
  },
  {
    id: 'faq-tech-003',
    categorie: 'faq-technique',
    titre: 'Le laser épilatoire fait-il mal?',
    contenu: "On ressent un picotement semblable à un coup d'élastique chaud. Les machines modernes refroidissent la peau.",
    tags: ['laser', 'epilation', 'douleur', 'picotement', 'refroidissement'],
    metadata: {
      complexite: 'simple',
      domaine: 'laser-ipl',
      frequence: 'tres-frequent'
    }
  },
  {
    id: 'faq-tech-004',
    categorie: 'faq-technique',
    titre: 'Pourquoi 21h de formation Hygiène?',
    contenu: "C'est la durée légale pour couvrir les 9 modules obligatoires (microbiologie, réglementation, pratique de l'asepsie).",
    tags: ['hygiene', '21h', 'legal', 'modules', 'asepsie'],
    metadata: {
      complexite: 'simple',
      domaine: 'reglementaire',
      frequence: 'frequent'
    }
  },
  {
    id: 'faq-tech-005',
    categorie: 'faq-technique',
    titre: 'Qu\'apporte le Carbon Peel vs soin classique?',
    contenu: "Une purification profonde des pores inaccessible manuellement, couplée à une stimulation thermique du collagène.",
    tags: ['carbon-peel', 'purification', 'pores', 'collagene', 'thermique'],
    metadata: {
      complexite: 'moyen',
      domaine: 'soins-visage',
      frequence: 'occasionnel'
    }
  },
  {
    id: 'faq-tech-006',
    categorie: 'faq-technique',
    titre: 'L\'esthéticienne peut-elle traiter les taches brunes au laser?',
    contenu: "Non, le décret de 2024 concerne uniquement l'épilation. Le traitement des taches reste médical.",
    tags: ['taches-brunes', 'laser', 'decret-2024', 'medical', 'epilation'],
    metadata: {
      complexite: 'important',
      domaine: 'reglementaire',
      frequence: 'frequent'
    }
  },
  {
    id: 'faq-tech-007',
    categorie: 'faq-technique',
    titre: 'Le BB Glow est-il dangereux?',
    contenu: "Utilisé avec des pigments conformes et une technique superficielle (nanoneedling), il est sûr. Le risque vient des pigments contenant trop de dioxyde de titane.",
    tags: ['bb-glow', 'danger', 'pigments', 'nanoneedling', 'dioxyde-titane'],
    metadata: {
      complexite: 'important',
      domaine: 'soins-visage',
      frequence: 'frequent'
    }
  },
  {
    id: 'faq-tech-008',
    categorie: 'faq-technique',
    titre: 'Combien de temps dure une séance de tricopigmentation?',
    contenu: "Entre 1h30 et 4h selon la zone. Il faut souvent 3 séances espacées d'un mois.",
    tags: ['tricopigmentation', 'duree', 'seance', 'zone', 'espacement'],
    metadata: {
      complexite: 'simple',
      domaine: 'tricopigmentation',
      frequence: 'frequent'
    }
  },
  {
    id: 'faq-tech-009',
    categorie: 'faq-technique',
    titre: 'Peut-on pigmenter une femme enceinte?',
    contenu: "Contre-indication absolue par principe de précaution et changements hormonaux affectant la prise du pigment.",
    tags: ['grossesse', 'contre-indication', 'hormones', 'pigment', 'precaution'],
    metadata: {
      complexite: 'important',
      domaine: 'dermopigmentation',
      frequence: 'occasional'
    }
  },
  {
    id: 'faq-tech-010',
    categorie: 'faq-technique',
    titre: 'Pourquoi NPM plutôt qu\'une machine chinoise?',
    contenu: "Certification CE, stabilité de la vitesse (évite de déchirer la peau) et SAV français.",
    tags: ['npm', 'machine', 'ce', 'vitesse', 'sav'],
    metadata: {
      complexite: 'simple',
      domaine: 'materiel',
      frequence: 'frequent'
    }
  },
  {
    id: 'faq-tech-011',
    categorie: 'faq-technique',
    titre: 'Différence microneedling vs nanoneedling?',
    contenu: "Le microneedling perce le derme (médical/esthétique avancé), le nanoneedling reste dans l'épiderme (esthétique pur).",
    tags: ['microneedling', 'nanoneedling', 'derme', 'epiderme', 'medical'],
    metadata: {
      complexite: 'moyen',
      domaine: 'soins-visage',
      frequence: 'frequent'
    }
  },
  {
    id: 'faq-tech-012',
    categorie: 'faq-technique',
    titre: 'Pourquoi les pigments virent-ils au bleu?',
    contenu: "Implantation trop profonde ou utilisation d'un pigment noir pur sur une peau froide (effet Tyndall).",
    tags: ['pigments', 'bleu', 'profondeur', 'tyndall', 'peau-froide'],
    metadata: {
      complexite: 'avance',
      domaine: 'dermopigmentation',
      frequence: 'occasionnel'
    }
  },
  {
    id: 'faq-tech-013',
    categorie: 'faq-technique',
    titre: 'Le laser fonctionne-t-il sur les poils blancs?',
    contenu: "Non, pas de mélanine pour capter la lumière. Seule l'électrolyse poil par poil fonctionne.",
    tags: ['laser', 'poils-blancs', 'melanine', 'electrolyse', 'lumiere'],
    metadata: {
      complexite: 'simple',
      domaine: 'laser-ipl',
      frequence: 'frequent'
    }
  },
  {
    id: 'faq-tech-014',
    categorie: 'faq-technique',
    titre: 'Qu\'est-ce qu\'une retouche annuelle?',
    contenu: "Une séance pour raviver la couleur du maquillage permanent éclairci suite à l'exfoliation naturelle.",
    tags: ['retouche', 'annuelle', 'couleur', 'exfoliation', 'raviver'],
    metadata: {
      complexite: 'simple',
      domaine: 'dermopigmentation',
      frequence: 'frequent'
    }
  },
  {
    id: 'faq-tech-015',
    categorie: 'faq-technique',
    titre: 'Le peeling TCA est-il douloureux?',
    contenu: "Sensation de chaleur intense pendant quelques minutes avant la neutralisation de l'acide.",
    tags: ['peeling', 'tca', 'douleur', 'chaleur', 'neutralisation'],
    metadata: {
      complexite: 'moyen',
      domaine: 'soins-visage',
      frequence: 'occasionnel'
    }
  },
  {
    id: 'faq-tech-016',
    categorie: 'faq-technique',
    titre: 'Sport après tatouage sourcils?',
    contenu: "Non, éviter la transpiration 7 jours car le sel rejette le pigment.",
    tags: ['sport', 'transpiration', 'sourcils', 'sel', 'cicatrisation'],
    metadata: {
      complexite: 'simple',
      domaine: 'dermopigmentation',
      frequence: 'frequent'
    }
  },
  {
    id: 'faq-tech-017',
    categorie: 'faq-technique',
    titre: 'Pourquoi les LED rouges sont anti-âge?',
    contenu: "Elles stimulent la production d'ATP dans les cellules, boostant la fabrication de collagène.",
    tags: ['led', 'rouge', 'anti-age', 'atp', 'collagene'],
    metadata: {
      complexite: 'moyen',
      domaine: 'soins-visage',
      frequence: 'occasionnel'
    }
  },
  {
    id: 'faq-tech-018',
    categorie: 'faq-technique',
    titre: 'Qu\'est-ce que le Certibiocide?',
    contenu: "Certification obligatoire pour utiliser et acheter des produits désinfectants professionnels de catégorie TP2.",
    tags: ['certibiocide', 'desinfectants', 'tp2', 'certification', 'hygiene'],
    metadata: {
      complexite: 'moyen',
      domaine: 'reglementaire',
      frequence: 'occasionnel'
    }
  },
  {
    id: 'faq-tech-019',
    categorie: 'faq-technique',
    titre: 'Peut-on camoufler un tatouage raté avec couleur chair?',
    contenu: "Erreur de débutant à ne jamais faire. Le pigment chair devient opaque et vieillit mal. Il faut détatouer ou neutraliser.",
    tags: ['camouflage', 'tatouage-rate', 'couleur-chair', 'erreur', 'detatouage'],
    metadata: {
      complexite: 'important',
      domaine: 'dermopigmentation',
      frequence: 'rare'
    }
  },
  {
    id: 'faq-tech-020',
    categorie: 'faq-technique',
    titre: 'Durée de rentabilité d\'une machine laser?',
    contenu: "Avec un ticket moyen de 80€ par zone, une machine à 20 000€ est rentabilisée en ~250 séances, soit 4-6 mois d'activité.",
    tags: ['rentabilite', 'machine', 'laser', 'ticket-moyen', 'amortissement'],
    metadata: {
      complexite: 'moyen',
      domaine: 'business',
      frequence: 'occasionnel'
    }
  }
]

// CATÉGORIE D — FAQ FINANCEMENT (20 entrées)
// ============================================================

export const KB_FAQ_FINANCEMENT: KBEntry[] = [
  {
    id: 'faq-fin-001',
    categorie: 'faq-financement',
    titre: 'Financer extension de cils avec CPF?',
    contenu: "Oui, si rattachée à une certification RNCP.",
    tags: ['cpf', 'extensions-cils', 'rncp', 'certification'],
    metadata: {
      organisme: 'cpf',
      eligibilite: 'conditionnelle',
      complexite: 'simple'
    }
  },
  {
    id: 'faq-fin-002',
    categorie: 'faq-financement',
    titre: 'FAFCEA finance-t-il le distanciel?',
    contenu: "Oui, sous réserve d'acceptation, mais le taux peut être ajusté.",
    tags: ['fafcea', 'distanciel', 'taux', 'acceptation'],
    metadata: {
      organisme: 'fafcea',
      modalite: 'distanciel',
      complexite: 'simple'
    }
  },
  {
    id: 'faq-fin-003',
    categorie: 'faq-financement',
    titre: 'Délai accord OPCO EP?',
    contenu: "3 à 5 semaines selon la période de l'année.",
    tags: ['opco-ep', 'delai', 'accord', 'saisonnalit'],
    metadata: {
      organisme: 'opco-ep',
      timing: 'delai',
      complexite: 'simple'
    }
  },
  {
    id: 'faq-fin-004',
    categorie: 'faq-financement',
    titre: 'L\'AIF est-elle automatique?',
    contenu: "Non, dépend de la validation du conseiller et du budget régional.",
    tags: ['aif', 'automatique', 'conseiller', 'budget-regional'],
    metadata: {
      organisme: 'france-travail',
      eligibilite: 'conditionnelle',
      complexite: 'moyen'
    }
  },
  {
    id: 'faq-fin-005',
    categorie: 'faq-financement',
    titre: 'Utiliser le CPF d\'un proche?',
    contenu: "Non, strictement personnel et non cessible.",
    tags: ['cpf', 'proche', 'personnel', 'cessible'],
    metadata: {
      organisme: 'cpf',
      regle: 'interdiction',
      complexite: 'simple'
    }
  },
  {
    id: 'faq-fin-006',
    categorie: 'faq-financement',
    titre: 'Qu\'est-ce qu\'un certificat de réalisation?',
    contenu: "Document officiel remplaçant l'attestation d'assiduité pour prouver la présence.",
    tags: ['certificat', 'realisation', 'assiduite', 'presence'],
    metadata: {
      type: 'document',
      objectif: 'preuve',
      complexite: 'simple'
    }
  },
  {
    id: 'faq-fin-007',
    categorie: 'faq-financement',
    titre: 'Qualiopi obligatoire pour FAFCEA?',
    contenu: "Oui, depuis 2022 tous les FAF et OPCO exigent Qualiopi.",
    tags: ['qualiopi', 'fafcea', '2022', 'obligatoire'],
    metadata: {
      reglementation: 'obligatoire',
      date: '2022',
      complexite: 'simple'
    }
  },
  {
    id: 'faq-fin-008',
    categorie: 'faq-financement',
    titre: 'Cumuler deux financements?',
    contenu: "Oui (ex: CPF + AIF), mais le total ne peut dépasser le coût réel.",
    tags: ['cumul', 'cpf', 'aif', 'cout-reel'],
    metadata: {
      possibilite: 'oui',
      limite: 'cout-reel',
      complexite: 'moyen'
    }
  },
  {
    id: 'faq-fin-009',
    categorie: 'faq-financement',
    titre: 'Employeur peut-il refuser formation CPF?',
    contenu: "Hors temps de travail: non. Sur temps de travail: accord obligatoire.",
    tags: ['employeur', 'refus', 'temps-travail', 'accord'],
    metadata: {
      situation: 'salarie',
      regle: 'conditionnelle',
      complexite: 'moyen'
    }
  },
  {
    id: 'faq-fin-010',
    categorie: 'faq-financement',
    titre: 'Qu\'est-ce que l\'abondement employeur?',
    contenu: "Versement volontaire de l'entreprise sur le compte CPF d'un salarié pour compléter un financement.",
    tags: ['abondement', 'employeur', 'complement', 'versement'],
    metadata: {
      type: 'complement',
      source: 'employeur',
      complexite: 'moyen'
    }
  },
  {
    id: 'faq-fin-011',
    categorie: 'faq-financement',
    titre: 'Sans diplôme esthétique, FAFCEA finance?',
    contenu: "Stages transverses (gestion): oui. Stages techniques: non.",
    tags: ['diplome', 'esthetique', 'fafcea', 'transverse', 'technique'],
    metadata: {
      eligibilite: 'partielle',
      condition: 'diplome',
      complexite: 'moyen'
    }
  },
  {
    id: 'faq-fin-012',
    categorie: 'faq-financement',
    titre: 'Comment savoir si OF exonéré TVA?',
    contenu: "Mention article 261-4-4° CGI sur les factures.",
    tags: ['tva', 'exoneration', 'cgi', 'facture'],
    metadata: {
      verification: 'facture',
      article: '261-4-4-cgi',
      complexite: 'simple'
    }
  },
  {
    id: 'faq-fin-013',
    categorie: 'faq-financement',
    titre: 'Qu\'est-ce que le PDC?',
    contenu: "Plan de Développement des Compétences, l'enveloppe budgétaire des entreprises.",
    tags: ['pdc', 'plan', 'competences', 'enveloppe', 'entreprise'],
    metadata: {
      type: 'plan',
      cible: 'entreprise',
      complexite: 'simple'
    }
  },
  {
    id: 'faq-fin-014',
    categorie: 'faq-financement',
    titre: 'FIFPL finance les frais de repas?',
    contenu: "Non, seuls les coûts pédagogiques sont éligibles.",
    tags: ['fifpl', 'frais-repas', 'cout-pedagogique', 'eligible'],
    metadata: {
      organisme: 'fifpl',
      exclusion: 'frais-annexes',
      complexite: 'simple'
    }
  },
  {
    id: 'faq-fin-015',
    categorie: 'faq-financement',
    titre: 'Former un apprenti en interne?',
    contenu: "Oui (AFEST), nécessite ingénierie spécifique et accompagnement OPCO.",
    tags: ['apprenti', 'interne', 'afest', 'ingenierie', 'opco'],
    metadata: {
      modalite: 'afest',
      complexite: 'complexe',
      accompagnement: 'opco'
    }
  },
  {
    id: 'faq-fin-016',
    categorie: 'faq-financement',
    titre: 'Heures FAFCEA par an?',
    contenu: "Plafond de 100 heures par an et par stagiaire.",
    tags: ['fafcea', 'heures', 'plafond', '100h', 'stagiaire'],
    metadata: {
      organisme: 'fafcea',
      limite: '100h-an',
      complexite: 'simple'
    }
  },
  {
    id: 'faq-fin-017',
    categorie: 'faq-financement',
    titre: 'Le CPF expire-t-il?',
    contenu: "Non, droits disponibles jusqu'à la retraite sauf fraude.",
    tags: ['cpf', 'expiration', 'retraite', 'fraude', 'droits'],
    metadata: {
      duree: 'vie-active',
      exception: 'fraude',
      complexite: 'simple'
    }
  },
  {
    id: 'faq-fin-018',
    categorie: 'faq-financement',
    titre: 'Qu\'est-ce qu\'un tiers-déclarant?',
    contenu: "OF qui dépose le dossier à la place de l'entreprise (subrogation).",
    tags: ['tiers-declarant', 'subrogation', 'dossier', 'of'],
    metadata: {
      role: 'intermediaire',
      procedure: 'subrogation',
      complexite: 'moyen'
    }
  },
  {
    id: 'faq-fin-019',
    categorie: 'faq-financement',
    titre: 'Transitions Pro finance CAP Esthétique?',
    contenu: "Oui, dans le cadre d'une reconversion certifiante.",
    tags: ['transitions-pro', 'cap', 'esthetique', 'reconversion', 'certifiante'],
    metadata: {
      organisme: 'transitions-pro',
      contexte: 'reconversion',
      complexite: 'moyen'
    }
  },
  {
    id: 'faq-fin-020',
    categorie: 'faq-financement',
    titre: 'OPCO paie en retard que faire?',
    contenu: "Relancer avec numéro de dossier, vérifier que toutes les preuves de présence sont validées.",
    tags: ['opco', 'retard', 'paiement', 'relance', 'preuves'],
    metadata: {
      probleme: 'retard-paiement',
      solution: 'relance',
      complexite: 'simple'
    }
  }
]

// CATÉGORIE E — ARGUMENTAIRES FINANCEMENT (8 entrées)
// ============================================================

export const KB_ARGUMENTAIRES: KBEntry[] = [
  {
    id: 'arg-fin-001',
    categorie: 'argumentaire-financement',
    titre: 'OPCO EP — Esthétique IDCC 3032',
    contenu: "OPCO EP couvre les instituts esthétique (IDCC 3032). Financement: 25€/h technique, 30€/h transverse. Plafond TPE: 2500-3500€. Script commercial: \"Votre institut dépend de l'OPCO EP. Savez-vous que vous disposez d'un budget annuel qui expire en décembre? Je peux vérifier votre éligibilité en 2 minutes.\"",
    tags: ['opco-ep', 'esthetique', 'idcc-3032', 'tpe', 'budget-annuel'],
    metadata: {
      organisme: 'opco-ep',
      secteur: 'esthetique',
      taux: '25-30-euros-heure'
    }
  },
  {
    id: 'arg-fin-002',
    categorie: 'argumentaire-financement',
    titre: 'AKTO — Grandes chaînes',
    contenu: "AKTO finance les grandes chaînes et commerce de gros. Avantages: jusqu'à 60€/h, budget 6000€ TPE, Espace Formation 100% financé hors budget. Script: \"Votre groupe fait partie des entreprises AKTO. Vous avez accès à des financements privilégiés jusqu'à 6000€ par an.\"",
    tags: ['akto', 'chaines', 'commerce-gros', '60-euros', '6000-euros'],
    metadata: {
      organisme: 'akto',
      cible: 'grandes-entreprises',
      avantage: 'taux-eleve'
    }
  },
  {
    id: 'arg-fin-003',
    categorie: 'argumentaire-financement',
    titre: 'FAFCEA — Artisanes CMA',
    contenu: "FAFCEA pour artisanes inscrites CMA. Taux: 35€/h technique, 25€/h transverse, plafond 100h/an. Paiement: remboursement post-formation ou subrogation. Script: \"En tant qu'artisane, votre budget FAFCEA vous permet 100h de formation par an. Avez-vous utilisé vos droits cette année?\"",
    tags: ['fafcea', 'artisanes', 'cma', '35-euros', '100h'],
    metadata: {
      organisme: 'fafcea',
      cible: 'artisanes',
      modalite: 'remboursement-subrogation'
    }
  },
  {
    id: 'arg-fin-004',
    categorie: 'argumentaire-financement',
    titre: 'FIFPL — Libérales URSSAF',
    contenu: "FIFPL pour professions libérales cotisant URSSAF. Budget: 150-250€/jour selon code NAF, plafond 600-1000€/an. Spécificité: e-learning -50%, délai 10 jours après début formation. Script: \"Vos cotisations URSSAF vous donnent droit à un budget formation. Connaissez-vous votre code de financement FIFPL?\"",
    tags: ['fifpl', 'liberales', 'urssaf', '150-250-euros', 'e-learning'],
    metadata: {
      organisme: 'fifpl',
      cible: 'professions-liberales',
      specificite: 'e-learning-reduit'
    }
  },
  {
    id: 'arg-fin-005',
    categorie: 'argumentaire-financement',
    titre: 'France Travail AIF — Demandeurs emploi',
    contenu: "AIF pour demandeurs d'emploi. Plafond ~1500€, validation conseiller + PPAE, complément CPF possible. Script: \"L'AIF peut financer votre reconversion. Avez-vous validé ce projet avec votre conseiller France Travail? Je peux vous aider à monter le dossier.\"",
    tags: ['aif', 'demandeurs-emploi', '1500-euros', 'conseiller', 'ppae'],
    metadata: {
      organisme: 'france-travail',
      cible: 'demandeurs-emploi',
      validation: 'conseiller'
    }
  },
  {
    id: 'arg-fin-006',
    categorie: 'argumentaire-financement',
    titre: 'CPF — Universel',
    contenu: "CPF pour tous, reste à charge 102€ (exonéré DE ou abondement employeur 1€). Limite: certifications RNCP uniquement. Script: \"Votre CPF contient [montant]€. Avec notre certification RNCP, il ne vous reste que 102€ à payer. Souhaitez-vous que je vérifie votre solde?\"",
    tags: ['cpf', 'universel', '102-euros', 'rncp', 'abondement'],
    metadata: {
      organisme: 'cpf',
      cible: 'tous',
      condition: 'rncp'
    }
  },
  {
    id: 'arg-fin-007',
    categorie: 'argumentaire-financement',
    titre: 'AGEFIPH — Handicap',
    contenu: "AGEFIPH pour personnes handicapées. Budget jusqu'à 3000€, adaptations parcours possibles. Script: \"Votre RQTH vous ouvre des droits spécifiques AGEFIPH. Nous pouvons adapter la formation à vos besoins et obtenir jusqu'à 3000€ de financement.\"",
    tags: ['agefiph', 'handicap', '3000-euros', 'rqth', 'adaptation'],
    metadata: {
      organisme: 'agefiph',
      cible: 'handicap',
      specificite: 'adaptation'
    }
  },
  {
    id: 'arg-fin-008',
    categorie: 'argumentaire-financement',
    titre: 'Transitions Pro — PTP reconversion',
    contenu: "Transitions Pro pour PTP (reconversion). Avantages: salaire maintenu, formation longue certifiante possible. Script: \"Votre projet de transition professionnelle peut être financé avec maintien de salaire. Avez-vous déjà constitué votre dossier PTP?\"",
    tags: ['transitions-pro', 'ptp', 'reconversion', 'salaire-maintenu', 'longue'],
    metadata: {
      organisme: 'transitions-pro',
      cible: 'salaries-reconversion',
      avantage: 'salaire-maintenu'
    }
  }
]

// CATÉGORIE F — CNV FORMULATIONS (10 entrées)
// ============================================================

export const KB_CNV: KBEntry[] = [
  {
    id: 'cnv-001',
    categorie: 'cnv-formulation',
    titre: 'Annonce prix',
    contenu: "CHACAL: \"C'est 400€, c'est comme ça partout.\" → GIRAFE: \"Mon tarif est de 400€ pour refléter la qualité des pigments stériles et l'expertise du dessin sur-mesure que je vais créer pour vous.\"",
    tags: ['prix', 'tarif', 'qualite', 'expertise', 'sur-mesure'],
    metadata: {
      situation: 'annonce-prix',
      emotion: 'justification',
      technique: 'valorisation'
    }
  },
  {
    id: 'cnv-002',
    categorie: 'cnv-formulation',
    titre: 'Retouche payante',
    contenu: "CHACAL: \"Vous avez dépassé le délai, vous devez payer.\" → GIRAFE: \"Je remarque que 6 mois se sont écoulés. Pour stabiliser la couleur durablement, une nouvelle séance est nécessaire au tarif de X€.\"",
    tags: ['retouche', 'delai', 'stabilisation', 'couleur', 'tarif'],
    metadata: {
      situation: 'retouche-payante',
      emotion: 'explication',
      technique: 'observation-factuelle'
    }
  },
  {
    id: 'cnv-003',
    categorie: 'cnv-formulation',
    titre: 'Refus technique',
    contenu: "CHACAL: \"Vos lèvres sont trop fines, ça va être moche.\" → GIRAFE: \"Au vu de votre morphologie, j'ai peur qu'un tracé trop large ne paraisse pas naturel. J'ai à cœur de valoriser vos traits réels.\"",
    tags: ['refus', 'morphologie', 'naturel', 'valorisation', 'traits'],
    metadata: {
      situation: 'refus-technique',
      emotion: 'bienveillance',
      technique: 'reformulation-positive'
    }
  },
  {
    id: 'cnv-004',
    categorie: 'cnv-formulation',
    titre: 'Cliente impolie',
    contenu: "CHACAL: \"Vous êtes vraiment désagréable.\" → GIRAFE: \"Lorsque vous élevez la voix, je me sens tendue et j'ai besoin de calme pour me concentrer sur mon geste de précision.\"",
    tags: ['impolitesse', 'voix', 'tension', 'calme', 'precision'],
    metadata: {
      situation: 'conflit',
      emotion: 'tension',
      technique: 'expression-besoin'
    }
  },
  {
    id: 'cnv-005',
    categorie: 'cnv-formulation',
    titre: 'Critique du travail',
    contenu: "CHACAL: \"C'est n'importe quoi ce que vous dites.\" → GIRAFE: \"J'entends votre déception. Pouvons-nous regarder ensemble les photos avant/après pour comprendre ce qui vous gêne?\"",
    tags: ['critique', 'deception', 'photos', 'avant-apres', 'comprehension'],
    metadata: {
      situation: 'critique-travail',
      emotion: 'deception',
      technique: 'ecoute-empathique'
    }
  },
  {
    id: 'cnv-006',
    categorie: 'cnv-formulation',
    titre: 'Demande de silence',
    contenu: "CHACAL: \"Taisez-vous, je travaille.\" → GIRAFE: \"J'ai besoin de silence pendant ces 10 minutes pour assurer la symétrie parfaite de votre tracé. Seriez-vous d'accord?\"",
    tags: ['silence', 'concentration', 'symetrie', 'trace', 'accord'],
    metadata: {
      situation: 'concentration',
      emotion: 'besoin',
      technique: 'demande-explicite'
    }
  },
  {
    id: 'cnv-007',
    categorie: 'cnv-formulation',
    titre: 'Cliente en retard',
    contenu: "CHACAL: \"Vous êtes encore en retard.\" → GIRAFE: \"Je vois que notre séance commence avec 20 minutes de décalage. J'ai besoin de respecter le temps de la cliente suivante.\"",
    tags: ['retard', 'decalage', 'respect', 'temps', 'cliente-suivante'],
    metadata: {
      situation: 'retard',
      emotion: 'contrainte',
      technique: 'observation-consequence'
    }
  },
  {
    id: 'cnv-008',
    categorie: 'cnv-formulation',
    titre: 'Dire non à un conjoint',
    contenu: "CHACAL: \"C'est elle qui décide, pas vous.\" → GIRAFE: \"Je comprends votre inquiétude. Cependant, j'ai besoin de m'assurer que ce projet correspond aux souhaits personnels de ma cliente.\"",
    tags: ['conjoint', 'decision', 'inquietude', 'projet', 'souhaits-personnels'],
    metadata: {
      situation: 'tiers-interferent',
      emotion: 'comprehension',
      technique: 'recentrage-cliente'
    }
  },
  {
    id: 'cnv-009',
    categorie: 'cnv-formulation',
    titre: 'Recevoir un compliment',
    contenu: "CHACAL: \"Oh, c'est rien, c'est mon job.\" → GIRAFE: \"Je me sens vraiment joyeuse de voir que ce résultat vous redonne le sourire. Merci de votre confiance.\"",
    tags: ['compliment', 'joie', 'resultat', 'sourire', 'confiance'],
    metadata: {
      situation: 'compliment',
      emotion: 'joie',
      technique: 'accueil-positif'
    }
  },
  {
    id: 'cnv-010',
    categorie: 'cnv-formulation',
    titre: 'Proposer correction',
    contenu: "CHACAL: \"Je vais refaire ça.\" → GIRAFE: \"Je remarque une légère zone claire ici. J'ai besoin que le rendu soit parfait. Accepteriez-vous que je repasse sur ce point?\"",
    tags: ['correction', 'zone-claire', 'perfection', 'accord', 'retouche'],
    metadata: {
      situation: 'correction',
      emotion: 'perfectionnisme',
      technique: 'demande-permission'
    }
  }
]

// CATÉGORIE G — CAS PRATIQUES (10 entrées)
// ============================================================

export const KB_CAS_PRATIQUES: KBEntry[] = [
  {
    id: 'cas-001',
    categorie: 'cas-pratique',
    titre: 'Auto-entrepreneure débutante — Microblading',
    contenu: "CONTEXTE: Sarah, 28 ans, esthéticienne à domicile depuis 6 mois, CA 15k€. Veut se lancer dans le microblading. PROBLÉMATIQUE: Budget serré, peur de l'échec, pas de diplôme esthétique. SOLUTION FINANCEMENT: FAFCEA (35€/h × 21h = 735€ sur 1200€ formation). Reste à charge: 465€. SCRIPT: \"Sarah, votre statut vous donne accès à 735€ FAFCEA. Pour les 465€ restants, notre partenaire propose un paiement en 3×. Vous rentabilisez dès votre 6e cliente.\"",
    tags: ['auto-entrepreneuse', 'microblading', 'fafcea', 'paiement-echelonne', 'debutante'],
    metadata: {
      profil: 'ae-debutante',
      formation: 'microblading',
      financement: 'fafcea-partiel'
    }
  },
  {
    id: 'cas-002',
    categorie: 'cas-pratique',
    titre: 'Salariée chaîne — Extensions cils CPF',
    contenu: "CONTEXTE: Marie, 35 ans, manager Yves Rocher, 1800€ CPF disponible, formation extensions 1200€ + kit. PROBLÉMATIQUE: Employeur doit valider congé formation. SOLUTION: Formation weekend + CPF couvre tout + abondement employeur 1€ si besoin. SCRIPT: \"Marie, votre formation weekend évite l'accord employeur. Votre CPF couvre les 1200€. Si il manque quelques euros, votre employeur peut abonder pour 1€ symbolique. Je vous envoie la procédure?\"",
    tags: ['salariee', 'chaine', 'cpf', 'weekend', 'abondement'],
    metadata: {
      profil: 'salariee-chaine',
      formation: 'extensions-cils',
      financement: 'cpf-complet'
    }
  },
  {
    id: 'cas-003',
    categorie: 'cas-pratique',
    titre: 'Reconversion DE — Laser + AIF',
    contenu: "CONTEXTE: Julie, 42 ans, licenciée économique, veut ouvrir institut. Formation laser 2800€. PROBLÉMATIQUE: Budget serré, besoin formation complète. SOLUTION: AIF 1500€ + CPF 800€ + reste à charge 500€. SCRIPT: \"Julie, votre conseiller peut valider 1500€ AIF pour votre reconversion. Avec vos 800€ CPF, il ne reste que 500€. Cette formation vous permet d'ouvrir avec une prestation à 120€/séance.\"",
    tags: ['reconversion', 'demandeur-emploi', 'aif', 'cpf', 'laser'],
    metadata: {
      profil: 'reconversion-de',
      formation: 'laser',
      financement: 'mixte-aif-cpf'
    }
  },
  {
    id: 'cas-004',
    categorie: 'cas-pratique',
    titre: 'Institute owner — OPCO EP budget entreprise',
    contenu: "CONTEXTE: Françoise, propriétaire institut 3 salariées, IDCC 3032. Veut former équipe au BB Glow. PROBLÉMATIQUE: Budget formation non utilisé, 3 personnes à former. SOLUTION: OPCO EP 25€/h × 7h × 3 = 525€ sur 900€ total. SCRIPT: \"Françoise, votre budget OPCO EP expire en décembre. Pour 3 stagiaires BB Glow, l'OPCO prend en charge 525€ sur 900€. Votre retour sur investissement se fait dès le premier mois.\"",
    tags: ['institute', 'opco-ep', 'equipe', 'bb-glow', 'budget-expire'],
    metadata: {
      profil: 'proprietaire-institut',
      formation: 'bb-glow',
      financement: 'opco-ep-entreprise'
    }
  },
  {
    id: 'cas-005',
    categorie: 'cas-pratique',
    titre: 'Libérale FIFPL — Carbon Peel',
    contenu: "CONTEXTE: Dr. Martin, médecin esthétique, veut ajouter Carbon Peel non-médical. Cotise FIFPL. PROBLÉMATIQUE: Formation 1600€, plafond FIFPL 750€. SOLUTION: FIFPL 750€ + CPF complément. SCRIPT: \"Docteur, votre cotisation FIFPL vous donne 750€. Ajouté à votre CPF, vous pouvez financer cette formation technique qui complète parfaitement votre approche médicale.\"",
    tags: ['liberal', 'medecin', 'fifpl', 'carbon-peel', 'complement-cpf'],
    metadata: {
      profil: 'medecin-liberal',
      formation: 'carbon-peel',
      financement: 'fifpl-cpf'
    }
  },
  {
    id: 'cas-006',
    categorie: 'cas-pratique',
    titre: 'Cliente exigeante — Sourcils asymétriques',
    contenu: "CONTEXTE: Claire veut correction sourcils asymétriques suite à épilation ratée. Très anxieuse, a consulté 3 instituts. PROBLÉMATIQUE: Attentes irréalistes, pression émotionnelle forte. APPROCHE CNV: \"Claire, je ressens votre inquiétude. Mes 8 ans d'expérience me disent qu'on peut harmoniser vos sourcils sans les transformer. Accepteriez-vous qu'on commence par un tracé au crayon pour voir le rendu ensemble?\"",
    tags: ['sourcils', 'asymetrie', 'anxiete', 'attentes', 'tracé-crayon'],
    metadata: {
      problematique: 'asymetrie',
      emotion: 'anxiete',
      solution: 'demonstration'
    }
  },
  {
    id: 'cas-007',
    categorie: 'cas-pratique',
    titre: 'Gestion conflit — Prix non respecté',
    contenu: "CONTEXTE: Lucie arrive pour sourcils, annonce avoir négocié 200€ au lieu de 350€ avec \"votre collègue\". PROBLÉMATIQUE: Tarif non respecté, cliente de mauvaise foi. APPROCHE CNV: \"Lucie, il semble y avoir une confusion sur le tarif. Mon prix est affiché à 350€. J'ai besoin de clarifier cette situation avant de commencer. Pouvons-nous regarder ensemble votre devis?\"",
    tags: ['prix', 'negociation', 'mauvaise-foi', 'tarif-affiche', 'devis'],
    metadata: {
      problematique: 'prix-non-respecte',
      emotion: 'confusion',
      solution: 'clarification'
    }
  },
  {
    id: 'cas-008',
    categorie: 'cas-pratique',
    titre: 'Urgence médicale — Allergie pigment',
    contenu: "CONTEXTE: En cours de séance sourcils, apparition rougeurs importantes et gonflements. PROBLÉMATIQUE: Possible allergie, client paniqué. PROTOCOLE: 1) Arrêt immédiat, 2) Compresses froides, 3) Antihistaminique si pas contre-indication, 4) Si aggravation: SAMU. COMMUNICATION: \"Je vais nettoyer et appliquer du froid. C'est une réaction qui peut arriver. Si ça ne s'améliore pas dans 30 minutes, nous irons aux urgences ensemble.\"",
    tags: ['allergie', 'urgence', 'protocole', 'samu', 'reaction'],
    metadata: {
      problematique: 'urgence-medicale',
      protocole: 'allergie',
      solution: 'procedure-securite'
    }
  },
  {
    id: 'cas-009',
    categorie: 'cas-pratique',
    titre: 'Perfectionniste — Retouche excessive',
    contenu: "CONTEXTE: Sandrine revient pour la 4e retouche gratuite, toujours insatisfaite de ses lèvres. PROBLÉMATIQUE: Perfectionnisme pathologique, risque de surcharge pigmentaire. APPROCHE CNV: \"Sandrine, je vois votre quête de perfection. Cependant, j'ai peur qu'une nouvelle retouche nuise à la qualité du résultat. J'aimerais qu'on laisse cicatriser 3 mois avant d'évaluer si une intervention est vraiment nécessaire.\"",
    tags: ['perfectionnisme', 'retouche', 'surcharge', 'cicatrisation', 'pause'],
    metadata: {
      problematique: 'perfectionnisme',
      risque: 'surcharge-pigmentaire',
      solution: 'pause-cicatrisation'
    }
  },
  {
    id: 'cas-010',
    categorie: 'cas-pratique',
    titre: 'Client masculin — Tricopigmentation cuir chevelu',
    contenu: "CONTEXTE: Pascal, 45 ans, calvitie avancée, très complexé. Première consultation trico. PROBLÉMATIQUE: Honte, attentes masculines spécifiques, budget 1800€. APPROCHE: Rassurer sur la normalité de la demande, montrer avant/après masculins, expliquer le rendu \"densité\" vs \"repousse\". SCRIPT: \"Pascal, 60% de ma clientèle trico est masculine. Le résultat donne l'effet d'un crâne rasé de près, très naturel. Votre FAFCEA peut financer une grande partie.\"",
    tags: ['masculin', 'calvitie', 'complexe', 'tricopigmentation', 'naturalite'],
    metadata: {
      cible: 'homme',
      problematique: 'calvitie-complexe',
      solution: 'reassurance-masculine'
    }
  }
]

// ASSEMBLAGE FINAL ET FONCTIONS UTILITAIRES
// ============================================================

export const KB_FORMATIONS: KBEntry[] = [
  ...KB_SCRIPTS_VENTE,
  ...KB_OBJECTIONS,
  ...KB_FAQ_TECHNIQUE,
  ...KB_FAQ_FINANCEMENT,
  ...KB_ARGUMENTAIRES,
  ...KB_CNV,
  ...KB_CAS_PRATIQUES
]

/**
 * Recherche dans la base de connaissances par mots-clés
 * @param query - Termes de recherche
 * @param categorie - Catégorie optionnelle pour filtrer
 * @returns Entrées KB correspondantes
 */
export function searchKB(query: string, categorie?: KBCategorie): KBEntry[] {
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2)

  let results = categorie
    ? KB_FORMATIONS.filter(entry => entry.categorie === categorie)
    : KB_FORMATIONS

  return results.filter(entry => {
    const searchText = `${entry.titre} ${entry.contenu} ${entry.tags.join(' ')}`.toLowerCase()
    return searchTerms.some(term => searchText.includes(term))
  }).sort((a, b) => {
    // Score par nombre de termes trouvés
    const scoreA = searchTerms.filter(term =>
      `${a.titre} ${a.contenu} ${a.tags.join(' ')}`.toLowerCase().includes(term)
    ).length
    const scoreB = searchTerms.filter(term =>
      `${b.titre} ${b.contenu} ${b.tags.join(' ')}`.toLowerCase().includes(term)
    ).length
    return scoreB - scoreA
  })
}

/**
 * Récupère les entrées par catégorie
 */
export function getKBByCategory(categorie: KBCategorie): KBEntry[] {
  return KB_FORMATIONS.filter(entry => entry.categorie === categorie)
}

/**
 * Récupère une entrée par son ID
 */
export function getKBEntry(id: string): KBEntry | undefined {
  return KB_FORMATIONS.find(entry => entry.id === id)
}

/**
 * Statistiques de la KB
 */
export function getKBStats() {
  const categories = [...new Set(KB_FORMATIONS.map(entry => entry.categorie))]
  return {
    totalEntries: KB_FORMATIONS.length,
    categories: categories.length,
    byCategory: categories.map(cat => ({
      category: cat,
      count: KB_FORMATIONS.filter(entry => entry.categorie === cat).length
    }))
  }
}