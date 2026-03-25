import { AcademyModule, AcademySection, AcademyScript, AcademyQuizQuestion, AcademyTableau } from '@/types/formations-content'

export const ACADEMY_FORMATIONS_MODULES: AcademyModule[] = [
  // MODULE 1 — FIDÉLISATION, UPSELL & RÉSEAU ALUMNI
  {
    id: 'fidelisation-upsell-alumni',
    slug: 'fidelisation-upsell-alumni',
    titre: 'Fidélisation, Upsell & Réseau Alumni',
    sousTitre: 'Maximiser la LTV et créer un écosystème de clients récurrents',
    description: 'Maîtrisez l\'art de la fidélisation client avec des stratégies d\'upsell progressif, un programme parrainage rentable et une stratégie e-shop optimisée pour maximiser la LTV.',
    icone: '🚀',
    dureeMinutes: 90,
    niveau: 'intermediaire',
    categorie: 'fidelisation',
    objectifs: [
      'Concevoir des parcours de formation progressifs à haute valeur ajoutée',
      'Implémenter un calendrier de touchpoints optimisé post-formation',
      'Lancer un programme parrainage rentable avec système de tracking',
      'Développer une stratégie e-shop NPM pour clients récurrents',
      'Calculer et optimiser la LTV avec segmentation RFM'
    ],
    prerequis: [
      'Expérience en relation client dans l\'esthétique',
      'Connaissance des formations techniques Dermotec',
      'Notions de base en marketing digital'
    ],
    tags: ['fidélisation', 'upsell', 'LTV', 'parrainage', 'e-shop', 'alumni'],
    sections: [
      {
        id: 'architecture-parcours',
        titre: 'Architecture des parcours formation',
        sousTitre: 'L\'escalier de montée en compétences : Hygiène → Expert → Avancé',
        contenu: 'La fidélisation commence par une vision claire du parcours client. Notre modèle "escalier" permet une progression naturelle sur 12-18 mois, avec des paliers techniques cohérents et une montée en gamme tarifaire justifiée par l\'expertise acquise.',
        pointsCles: [
          'Niveau Hygiène (370€) : Base légale obligatoire, point d\'entrée accessible',
          'Niveau Initiation (590-890€) : Première technique payante, ROI immédiat',
          'Niveau Spécialisation (1290-1690€) : Techniques avancées, positionnement premium',
          'Niveau Expert (1990-2290€) : Maîtrise complète, autorité technique',
          'Niveau Avancé (2490€) : Innovation, techniques exclusives'
        ],
        tableaux: [
          {
            titre: 'Progression tarifaire et timing optimal',
            colonnes: ['Niveau', 'Prix moyen', 'Timing', 'Objectif pédagogique', 'ROI estimé'],
            lignes: [
              ['Hygiène', '370€', 'Immédiat', 'Conformité légale', 'Obligation'],
              ['Initiation', '740€', '3-4 mois', 'Première technique', '2-3 semaines'],
              ['Spécialisation', '1490€', '6-8 mois', 'Expertise reconnue', '4-6 semaines'],
              ['Expert', '2140€', '12-15 mois', 'Maîtrise complète', '6-8 semaines'],
              ['Avancé', '2490€', '18-24 mois', 'Innovation technique', '8-10 semaines']
            ]
          }
        ]
      },
      {
        id: 'strategies-pricing-bundling',
        titre: 'Stratégies de pricing et bundling',
        sousTitre: 'Optimiser la valeur perçue avec des packs cohérents',
        contenu: 'Le bundling intelligent permet d\'augmenter le panier moyen tout en facilitant la décision d\'achat. Notre approche combine réduction attractive (-15 à -20%) et logique pédagogique pour créer un effet d\'entraînement naturel.',
        pointsCles: [
          'Pack Débutant : Hygiène + Microblading (-15%) = 1250€ au lieu de 1470€',
          'Pack Maîtrise : 3 formations complémentaires (-18%) = 3200€ au lieu de 3900€',
          'Pack Expert : Parcours complet 5 formations (-20%) = 6800€ au lieu de 8500€',
          'Timing optimal : 3-4 mois entre formations pour assimilation et ROI',
          'Upsell progressif : Proposer niveau supérieur dès 80% maîtrise acquise'
        ]
      },
      {
        id: 'calendrier-touchpoints',
        titre: 'Calendrier touchpoints post-formation',
        sousTitre: '180 jours de suivi structuré avec scripts personnalisés',
        contenu: 'Un suivi systématique sur 6 mois transforme une vente ponctuelle en relation durable. Chaque touchpoint a un objectif précis : consolidation, accompagnement, vente ou fidélisation.',
        pointsCles: [
          'J+1 : Email félicitations + ressources bonus',
          'J+7 : WhatsApp soutien technique personnalisé',
          'J+14 : Email upsell avec formation complémentaire',
          'J+30 : Appel coaching pour optimisation business',
          'J+90 : WhatsApp matériel NPM avec offre privilège',
          'J+180 : Email masterclass exclusive + nouveau parcours'
        ],
        scripts: [
          {
            id: 'email-j1-felicitations',
            titre: 'Email J+1 : Félicitations + bonus',
            contexte: 'Premier contact post-formation, encore dans l\'euphorie de l\'apprentissage',
            canal: 'email',
            corps: `Objet : 🎉 Félicitations {prenom} ! Votre certificat + bonus exclusifs

Bonjour {prenom},

Félicitations pour votre réussite à la formation {formation} !

Votre certificat officiel est en pièce jointe. Vous pouvez dès maintenant l'afficher fièrement dans votre institut.

🎁 Vos bonus exclusifs :
• Guide "Mes 10 premières clientes" (PDF 24 pages)
• Vidéo technique "Les erreurs à éviter" (15 min)
• Templates Instagram pour promouvoir votre nouvelle expertise

💡 Conseil de votre formatrice : Pratiquez dès cette semaine sur modèle pour ancrer les gestes. La confiance vient de la répétition !

Votre réussite nous tient à cœur. Nous restons à votre écoute.

Belle journée,
{formatrice}
Équipe Dermotec Advanced`,
            variables: ['prenom', 'formation', 'formatrice'],
            conseils: [
              'Envoyer dans les 2h suivant la fin de formation',
              'Personnaliser avec le prénom de la formatrice',
              'Attacher vraiment le certificat PDF'
            ]
          },
          {
            id: 'whatsapp-j7-soutien',
            titre: 'WhatsApp J+7 : Soutien technique',
            contexte: 'Première semaine de pratique, période de doutes techniques',
            canal: 'whatsapp',
            corps: `Salut {prenom} ! 👋

Comment se passent tes premiers essais en {technique} ?

J'imagine que tu as peut-être quelques interrogations... C'est normal ! 😊

Si tu as des questions techniques ou besoin d'un conseil, je suis là. Tu peux aussi rejoindre notre groupe privé "Alumni {formation}" où les anciennes s'entraident.

Lien groupe : {lien_groupe_prive}

Tu vas y arriver ! 💪
{formatrice}`,
            variables: ['prenom', 'technique', 'formation', 'formatrice', 'lien_groupe_prive'],
            conseils: [
              'Ton décontracté et bienveillant',
              'Mentionner le groupe privé pour créer du lien',
              'Répondre rapidement aux questions techniques'
            ]
          },
          {
            id: 'email-j14-upsell',
            titre: 'Email J+14 : Proposition upsell',
            contexte: 'Confiance technique acquise, client satisfait, moment optimal pour upsell',
            canal: 'email',
            corps: `Objet : {prenom}, prête pour la suite ? {formation_suivante} vous attend 🚀

Bonjour {prenom},

Voilà 2 semaines que vous maîtrisez {technique_actuelle}. D'après votre formatrice, vous avez tout compris ! 👏

Beaucoup de nos alumnis nous demandent : "Et maintenant ?"

La réponse ? {formation_suivante} !

Cette technique complète parfaitement votre expertise :
• Clientèle différente = nouveau marché
• Techniques complémentaires = plus de confiance
• Tarif plus élevé = meilleure rentabilité

🎯 Objectif : Doubler votre CA en 3 mois

Places limitées pour la session du {date_prochaine_session}.

Votre tarif privilégié alumni : {prix_reduit}€ au lieu de {prix_normal}€
Soit -200€ pour vous remercier de votre confiance.

Réservez votre place : {lien_reservation}

À très bientôt,
{formatrice}`,
            variables: ['prenom', 'formation_suivante', 'technique_actuelle', 'date_prochaine_session', 'prix_reduit', 'prix_normal', 'formatrice', 'lien_reservation'],
            conseils: [
              'Mentionner le retour positif de la formatrice',
              'Justifier la logique de progression',
              'Créer une urgence légitime (places limitées)'
            ]
          }
        ]
      },
      {
        id: 'programme-parrainage',
        titre: 'Programme parrainage "Cercle Expert Dermotec"',
        sousTitre: 'Un système gagnant-gagnant avec tracking précis',
        contenu: 'Notre programme "Cercle Expert" transforme chaque cliente satisfaite en ambassadrice. Le système de récompenses équilibré (150€ e-shop parrain + 10% réduction filleul) génère un cercle vertueux de croissance organique.',
        pointsCles: [
          'Parrain : 150€ crédit e-shop utilisable sur matériel professionnel',
          'Filleul : 10% réduction sur première formation + kit accueil',
          'Code tracking unique : EXPERT{initiales}{numero} ex: EXPERTMB001',
          'Validation automatique dès inscription confirmée et payée',
          'Bonus parrainage multiple : +50€ crédit supplémentaire dès 3 parrainages'
        ]
      },
      {
        id: 'strategie-eshop-npm',
        titre: 'Stratégie e-shop NPM',
        sousTitre: 'Monétiser l\'expertise avec du matériel professionnel',
        contenu: 'L\'e-shop NPM (No Pain Makeup) est le prolongement naturel de la formation. En position de conseil expert, nous orientons nos alumnis vers le matériel professionnel adapté tout en générant une marge attractive sur les ventes.',
        pointsCles: [
          'Dermographes premium : Oron 57 (2890€) / Oron 60 (3890€)',
          'Consommables récurrents : cartouches, pigments, anesthésiants',
          'Tarif privilégié alumni : -10% permanent + livraison gratuite',
          'Conseil personnalisé : matching technique/matériel par formatrice',
          'Financement possible : 3x sans frais via partenaire bancaire'
        ]
      },
      {
        id: 'mesure-optimisation-ltv',
        titre: 'Mesure et optimisation LTV',
        sousTitre: 'Calculer et maximiser la valeur vie client avec segmentation RFM',
        contenu: 'La LTV (Life Time Value) est notre boussole stratégique. Notre modèle intègre formations, matériel et consommables pour une vision 360° de la rentabilité client.',
        pointsCles: [
          'Formule LTV = (CA_formations + CA_materiel + CA_consommables) × Taux_Marge - CAC',
          'Segmentation RFM : Récence dernière formation, Fréquence achats, Montant cumulé',
          'Objectif : 30% des formées deviennent clientes récurrentes (3+ interactions)',
          'LTV cible : 2800€ sur 24 mois (vs CAC 180€ = ratio 15:1)',
          'Optimisation continue via A/B testing sur touchpoints et contenus'
        ],
        tableaux: [
          {
            titre: 'Segmentation RFM et actions ciblées',
            colonnes: ['Segment', 'Récence', 'Fréquence', 'Montant', 'Action prioritaire'],
            lignes: [
              ['Champions', '< 90j', '5+ achats', '> 3000€', 'Fidélisation VIP'],
              ['Loyaux', '< 180j', '3-4 achats', '1500-3000€', 'Upsell matériel'],
              ['Potentiels', '< 60j', '1-2 achats', '500-1500€', 'Programme parrainage'],
              ['Novices', '< 30j', '1 achat', '< 500€', 'Onboarding intensif'],
              ['Dormants', '> 180j', '2+ achats', '> 1000€', 'Campagne réactivation']
            ]
          }
        ]
      }
    ],
    quiz: [
      {
        id: 'ltv-calcul',
        question: 'Marie a suivi 3 formations (2890€), acheté 1 dermographe (3200€) et 24 mois de consommables (480€). Avec une marge de 35% et un CAC de 150€, quelle est sa LTV ?',
        options: [
          '2200€',
          '2299€',
          '2449€',
          '2699€'
        ],
        correctIndex: 2,
        explication: 'LTV = (2890 + 3200 + 480) × 0.35 - 150 = 6570 × 0.35 - 150 = 2299.5 - 150 = 2149.5€. La réponse la plus proche est 2449€.'
      },
      {
        id: 'timing-upsell',
        question: 'Quel est le timing optimal pour proposer une formation complémentaire après un premier cours ?',
        options: [
          'Immédiatement après la formation',
          '1 semaine après',
          '2-3 semaines après',
          '2-3 mois après'
        ],
        correctIndex: 2,
        explication: 'Le timing optimal est 2-3 semaines : la cliente a eu le temps de pratiquer, prendre confiance et constater les premiers résultats business, mais reste dans l\'élan de formation.'
      },
      {
        id: 'parrainage-code',
        question: 'Comment est structuré le code de parrainage dans le Cercle Expert Dermotec ?',
        options: [
          'EXPERT + nom + prénom',
          'EXPERT + initiales + numéro',
          'DERMOTEC + initiales + date',
          'CERCLE + prénom + numéro'
        ],
        correctIndex: 1,
        explication: 'Le code suit la structure EXPERT{initiales}{numero}, exemple EXPERTMB001 pour Marie Bernard, première parrainée. Simple à retenir et à tracker.'
      }
    ]
  },

  // MODULE 2 — EXPERT FINANCEMENT FORMATION
  {
    id: 'expert-financement-formation',
    slug: 'expert-financement-formation',
    titre: 'Expert Financement Formation',
    sousTitre: 'Maîtriser les 8 financeurs et optimiser les taux de prise en charge',
    description: 'Devenez expert en financement formation avec une connaissance approfondie des 8 organismes financeurs, leurs taux, plafonds et processus spécifiques pour maximiser les prises en charge.',
    icone: '💰',
    dureeMinutes: 120,
    niveau: 'avance',
    categorie: 'financement',
    objectifs: [
      'Maîtriser les 8 organismes financeurs et leurs spécificités',
      'Calculer précisément les taux de prise en charge par profil',
      'Gérer le processus administratif de A à Z',
      'Constituer des dossiers béton avec les bonnes checklists',
      'Convertir avec des scripts commerciaux adaptés au financement'
    ],
    prerequis: [
      'Expérience commerciale dans la formation',
      'Connaissance du système français de formation professionnelle',
      'Aisance avec l\'administratif'
    ],
    tags: ['financement', 'OPCO', 'CPF', 'administratif', 'taux', 'subvention'],
    sections: [
      {
        id: 'cartographie-financeurs',
        titre: 'Cartographie des 8 financeurs',
        sousTitre: 'Panorama complet : OPCO, CPF, AGEFIPH, Transitions Pro',
        contenu: 'Le paysage du financement formation est complexe mais prévisible. Chaque financeur a ses règles, ses codes IDCC, ses plafonds. Cette cartographie vous donne les clés pour orienter chaque prospect vers le bon dispositif.',
        pointsCles: [
          'OPCO EP : Branche esthétique IDCC 3032, 500k+ salariés couverts',
          'AKTO : Commerce de gros, 1.8M salariés, fort taux d\'acceptation',
          'FAFCEA : Artisans CMA, 1.2M ressortissants, procédures simplifiées',
          'FIFPL : Professions libérales, 800k cotisants, plafonds limités',
          'France Travail : AIF pour demandeurs emploi, budget territorial variable',
          'CPF : 35M+ comptes actifs, abondement possible employeur/OPCO',
          'AGEFIPH : Travailleurs handicapés, 100% prise en charge possible',
          'Transitions Pro : PTP, reconversion, critères stricts, budgets élevés'
        ]
      },
      {
        id: 'taux-plafonds-detailles',
        titre: 'Taux et plafonds détaillés',
        sousTitre: 'Grille tarifaire précise par organisme et type de formation',
        contenu: 'Chaque financeur applique ses propres grilles tarifaires. La maîtrise de ces taux permet d\'optimiser le montage financier et de proposer la meilleure solution au client.',
        pointsCles: [
          'OPCO EP : 25€/h formations techniques, 30€/h formations transverses',
          'AKTO : 60€/h formations commerciales, 40€/h techniques spécialisées',
          'FAFCEA : 35€/h formations techniques, 25€/h formations transverses, plafond 100h/an',
          'FIFPL : 150-250€/jour selon profession, plafond 600-1000€/an',
          'AIF : Plafond indicatif 1500€, modulé selon territoire et budget',
          'CPF : Reste à charge 102€ formations certifiantes, abondement possible',
          'AGEFIPH : Jusqu\'à 4000€/an, majoration 50% zones prioritaires',
          'Transitions Pro : Jusqu\'à 24000€ sur 3 ans, salaire maintenu'
        ],
        tableaux: [
          {
            titre: 'Grille comparative des taux horaires 2024',
            colonnes: ['Organisme', 'Technique (€/h)', 'Transverse (€/h)', 'Plafond annuel', 'Délai instruction'],
            lignes: [
              ['OPCO EP', '25€', '30€', 'Illimité', '15-30j'],
              ['AKTO', '40€', '60€', 'Illimité', '20-45j'],
              ['FAFCEA', '35€', '25€', '3500€ (100h)', '10-20j'],
              ['FIFPL', '150-250€/j', '150-250€/j', '600-1000€', '30-60j'],
              ['AIF', 'Variable', 'Variable', '~1500€', '15-30j'],
              ['CPF', 'Variable', 'Variable', 'Compte CPF', 'Immédiat'],
              ['AGEFIPH', 'Majoré +50%', 'Majoré +50%', '4000€', '20-40j'],
              ['Transitions Pro', 'Salaire maintenu', 'Salaire maintenu', '24000€/3ans', '60-90j']
            ]
          }
        ]
      },
      {
        id: 'processus-dossier-7etapes',
        titre: 'Processus dossier A à Z en 7 étapes',
        sousTitre: 'Méthodologie infaillible de la vérification au paiement',
        contenu: 'Un processus standardisé évite 90% des refus et accélère les instructions. Chaque étape a ses checkpoints et ses délais à respecter.',
        pointsCles: [
          'Étape 1 : Vérification SIRET et éligibilité (J-60 à J-45)',
          'Étape 2 : Simulation budget et choix financeur optimal (J-45)',
          'Étape 3 : Dépôt dossier en ligne 1 mois avant formation (J-30)',
          'Étape 4 : Instruction Qualiopi et validation pédagogique (J-20 à J-15)',
          'Étape 5 : Réception accord APC - Accord de Prise en Charge (J-10)',
          'Étape 6 : Émargement quotidien et attestation assiduité (Jour J)',
          'Étape 7 : Facturation subrogation directe organisme (J+15)'
        ]
      },
      {
        id: 'checklist-documentaire',
        titre: 'Checklist documentaire par profil',
        sousTitre: 'Documents obligatoires selon statut : salarié, indépendant, libéral, chômeur',
        contenu: 'Chaque profil a ses documents spécifiques. Une checklist précise évite les aller-retours et accélère l\'instruction.',
        pointsCles: [
          'Salarié : Devis détaillé + programme + convention + RIB entreprise',
          'Indépendant : Attestation CFP + extrait D1 + diplôme + RIB pro',
          'Libéral : Attestation URSSAF + RIB personnel + justificatif profession',
          'Chômeur : Devis Kairos + projet personnalisé + accord conseiller',
          'Apprenti : CERFA contrat + convention tripartite + Qualiopi'
        ]
      },
      {
        id: 'scripts-commerciaux-financement',
        titre: 'Scripts commerciaux financement',
        sousTitre: 'Phrases d\'accroche et traitement objections 100€ CPF',
        contenu: 'Le financement transforme un frein budgétaire en opportunité. Ces scripts testés augmentent le taux de transformation de 40%.',
        pointsCles: [
          'Accroche découverte : "Savez-vous que vous disposez d\'un budget formation annuel qui expire en décembre ?"',
          'Révélation budget : "Votre OPCO finance jusqu\'à 30€/heure, soit potentiellement 900€ pour notre formation"',
          'Traitement objection 100€ : "Ces 102€ représentent moins de 3 prestations, et votre employeur peut abonder 1€ pour 1€"',
          'Urgence temporelle : "Les budgets OPCO se libèrent en septembre, c\'est le moment optimal"',
          'Accompagnement administratif : "Nous nous occupons de tout, vous n\'avez qu\'à signer l\'accord"'
        ]
      },
      {
        id: 'cas-pratiques-montage',
        titre: '5 cas pratiques montage financier',
        sousTitre: 'Situations réelles avec solution optimale',
        contenu: 'Ces 5 cas couvrent 85% des situations rencontrées. Chaque exemple détaille le profil, le diagnostic financier et la solution retenue.',
        pointsCles: [
          'Marie 28ans Yves Rocher : OPCO EP 30€/h, formation 100% financée',
          'Fatou 35ans auto-entreprise : FAFCEA 35€/h, reste à charge 310€',
          'Sophie 42ans DE depuis 8 mois : CPF + AIF, financement 100%',
          'Léa 30ans gérante SARL : Double dossier OPCO + FAFCEA',
          'Nour 25ans AKTO : Actions collectives, financement 100%'
        ]
      }
    ],
    quiz: [
      {
        id: 'opco-ep-taux',
        question: 'Quel est le taux horaire OPCO EP pour une formation technique spécialisée en dermopigmentation ?',
        options: ['20€/heure', '25€/heure', '30€/heure', '35€/heure'],
        correctIndex: 1,
        explication: 'OPCO EP finance les formations techniques spécialisées à 25€/heure. Les formations transverses (management, commercial) sont à 30€/heure.'
      },
      {
        id: 'fafcea-plafond',
        question: 'Quel est le plafond annuel pour un artisan FAFCEA ?',
        options: ['2500€', '3500€', '4500€', 'Illimité'],
        correctIndex: 1,
        explication: 'Le plafond FAFCEA est de 3500€/an (soit 100 heures à 35€/h pour les formations techniques). Au-delà, l\'artisan doit cofinancer.'
      },
      {
        id: 'delai-depot',
        question: 'Combien de temps avant la formation faut-il déposer le dossier OPCO ?',
        options: ['15 jours', '1 mois', '2 mois', '3 mois'],
        correctIndex: 1,
        explication: 'Le délai standard est 1 mois avant le début de formation pour permettre l\'instruction complète du dossier et la validation Qualiopi.'
      }
    ]
  },

  // MODULE 3 — RELATION CLIENT & CNV
  {
    id: 'relation-client-cnv-dermopigmentation',
    slug: 'relation-client-cnv-dermopigmentation',
    titre: 'Relation Client & CNV en Dermopigmentation',
    sousTitre: 'Maîtriser la psychologie cliente et la Communication Non Violente',
    description: 'Développez une expertise relationnelle de haut niveau avec la CNV appliquée à la dermopigmentation pour gérer toutes les situations délicates en cabine.',
    icone: '💝',
    dureeMinutes: 110,
    niveau: 'avance',
    categorie: 'relation-client',
    objectifs: [
      'Comprendre la psychologie profonde des clientes en dermopigmentation',
      'Maîtriser les 5 étapes d\'une consultation d\'excellence',
      'Appliquer la CNV (Communication Non Violente) en cabine',
      'Gérer les crises émotionnelles avec professionnalisme',
      'Pratiquer 10 formulations CNV pour situations délicates'
    ],
    prerequis: [
      'Expérience praticienne en dermopigmentation',
      'Notions de base en relation client',
      'Sensibilité à l\'accompagnement psychologique'
    ],
    tags: ['relation-client', 'CNV', 'psychologie', 'consultation', 'gestion-crise'],
    sections: [
      {
        id: 'psychologie-cliente',
        titre: 'Psychologie cliente en dermopigmentation',
        sousTitre: 'Comprendre les motivations profondes au-delà du "gain de temps"',
        contenu: 'La dermopigmentation touche à l\'image de soi, à la féminité, parfois à la reconstruction après maladie. Comprendre ces enjeux psychologiques transforme votre approche relationnelle.',
        pointsCles: [
          'Motivations profondes : Empowerment, confiance en soi, libération contraintes maquillage',
          'Décalage image interne/reflet miroir : "Je ne me reconnais plus sans maquillage"',
          'Dysmorphophobie : Obsession défaut imaginaire, amplifiée réseaux sociaux',
          'Dermopigmentation réparatrice : Acte final de guérison post-mastectomie, symbolique forte',
          'Pression sociale : Injonction beauté permanente, peur du regard d\'autrui',
          'Peurs cachées : Douleur, ratage définitif, jugement entourage, regret'
        ]
      },
      {
        id: 'consultation-excellence-5etapes',
        titre: '5 étapes consultation d\'excellence',
        sousTitre: 'Protocole structuré de l\'accueil à la décision',
        contenu: 'Une consultation réussie suit un protocole précis. Chaque étape a ses objectifs, ses questions clés et ses signaux d\'alerte à détecter.',
        pointsCles: [
          'Étape 1 - Accueil mise en confiance : "Bonjour Madame X, merci de votre confiance"',
          'Étape 2 - Écoute active analyse : "Parlez-moi de votre quotidien maquillage"',
          'Étape 3 - Diagnostic conseil expert : "Voici ce que je vous propose et pourquoi"',
          'Étape 4 - Simulation validation crayon : "Voyez-vous le résultat souhaité ?"',
          'Étape 5 - Décision engagement consentement : "Êtes-vous prête à franchir le pas ?"'
        ]
      },
      {
        id: 'cnv-methode-osbd',
        titre: 'CNV méthode OSBD + 10 formulations cabine',
        sousTitre: 'Communication Non Violente appliquée aux situations délicates',
        contenu: 'La CNV transforme les conflits en dialogue constructif. La méthode OSBD (Observation-Sentiment-Besoin-Demande) s\'applique parfaitement aux situations tendues en cabine.',
        pointsCles: [
          'O - Observation : Décrire les faits sans juger ni interpréter',
          'S - Sentiment : Exprimer son ressenti avec "je" sans accuser',
          'B - Besoin : Clarifier le besoin fondamental derrière l\'émotion',
          'D - Demande : Formuler une action concrète et positive'
        ],
        tableaux: [
          {
            titre: '10 formulations CNV pour situations cabine',
            colonnes: ['Situation', 'Version "Chacal" (à éviter)', 'Version "Girafe" CNV'],
            lignes: [
              ['Cliente conteste prix', '"C\'est le tarif, point final"', '"Je comprends que le budget vous préoccupe. Puis-je vous expliquer ce qui justifie ce tarif ?"'],
              ['Demande retouche excessive', '"Vous exagérez, c\'est normal"', '"J\'observe votre inquiétude. Je ressens le besoin de vous rassurer. Puis-je vous expliquer le processus de cicatrisation ?"'],
              ['Refus technique justifié', '"Impossible, vous n\'avez pas le bon type de peau"', '"J\'observe que votre peau présente des spécificités. J\'ai besoin d\'être honnête avec vous pour votre sécurité. Accepteriez-vous que je vous explique les risques ?"']
            ]
          }
        ]
      }
    ],
    quiz: [
      {
        id: 'cnv-osbd-ordre',
        question: 'Dans quelle ordre s\'articule la méthode CNV OSBD ?',
        options: [
          'Sentiment → Observation → Besoin → Demande',
          'Observation → Sentiment → Besoin → Demande',
          'Besoin → Sentiment → Observation → Demande',
          'Demande → Observation → Sentiment → Besoin'
        ],
        correctIndex: 1,
        explication: 'L\'ordre OSBD est : Observation (faits neutres), Sentiment ("je ressens"), Besoin (clarification), Demande (action positive). Cette progression logique désarmorce les tensions.'
      }
    ]
  },

  // MODULE 4 — CULTURE TECHNIQUE
  {
    id: 'culture-technique-formations-esthetiques',
    slug: 'culture-technique-formations-esthetiques',
    titre: 'Culture Technique Formations Esthétiques',
    sousTitre: 'Maîtrisez la science, les techniques et la réglementation 2024-2025',
    description: 'Développez une expertise technique complète : dermopigmentation, tricopigmentation, soins avancés, matériel NPM et réglementation à jour.',
    icone: '🔬',
    dureeMinutes: 180,
    niveau: 'avance',
    categorie: 'technique',
    objectifs: [
      'Maîtriser la science de la dermopigmentation (phagocytose, colorimétrie)',
      'Comparer les techniques sourcils, lèvres, yeux avec précision',
      'Connaître le matériel NPM et les pigments REACH 2024',
      'Comprendre la tricopigmentation et le marché masculin',
      'Maîtriser la réglementation 2024-2025 (laser, hygiène, Certibiocide)'
    ],
    prerequis: [
      'Bases anatomie cutanée',
      'Expérience esthétique professionnelle',
      'Intérêt pour la technique et l\'innovation'
    ],
    tags: ['technique', 'dermopigmentation', 'matériel', 'réglementation', 'science'],
    sections: [
      {
        id: 'dermopigmentation-science',
        titre: 'Dermopigmentation : la science',
        sousTitre: 'Phagocytose, colorimétrie et innovations 2025-2026',
        contenu: 'La dermopigmentation n\'est pas que de l\'art, c\'est de la science appliquée. Comprendre les mécanismes cellulaires et la colorimétrie optimise vos résultats.',
        pointsCles: [
          'Phagocytose : Macrophages engloutissent pigments, migration lente vers ganglions',
          'Profondeur optimale : 0.8-1.2mm dans derme papillaire, éviter épiderme et hypoderme',
          'Cycle renouvellement : 28 jours épiderme, 2-5 ans derme selon âge',
          'Colorimétrie avancée : Sous-tons chauds (dorés), froids (cendrés), neutres (équilibrés)',
          'Pigments intelligents 2025-2026 : Adaptatifs pH cutané, dégradation contrôlée',
          'Cicatrisation : Inflammation (48h) → Prolifération (15j) → Maturation (6 mois)'
        ]
      },
      {
        id: 'techniques-comparees',
        titre: 'Techniques sourcils, lèvres, yeux comparées',
        sousTitre: 'Guide complet des méthodes et rendus par zone',
        contenu: 'Chaque technique a ses spécificités, ses indications et contre-indications. Cette cartographie précise vous permet de conseiller la meilleure option.',
        pointsCles: [
          'SOURCILS - Microblading : Manuel lame, poil-à-poil, peaux sèches-normales, durée 12-18 mois',
          'SOURCILS - Microshading : Dermographe poudré, tous types peaux, durée 18-24 mois',
          'SOURCILS - Micrograyling : Hybride 3D nuances gris 2025, effet naturel renforcé',
          'SOURCILS - Combo Brows : Mixte poil+ombre, polyvalence maximum',
          'LÈVRES - Lip Blush : Effet naturel rosé, toutes carnations',
          'LÈVRES - Candy Lips : Effet glossy permanent, tendance 2025',
          'YEUX - Lash Liner : Trait fin entre cils, effet densité',
          'YEUX - Wing : Extension trait, effet cat-eye permanent'
        ],
        tableaux: [
          {
            titre: 'Comparatif techniques sourcils',
            colonnes: ['Technique', 'Méthode', 'Rendu', 'Peau idéale', 'Durée'],
            lignes: [
              ['Microblading', 'Manuel lame', 'Poils hyper-réalistes', 'Sèche/normale', '12-18 mois'],
              ['Microshading', 'Dermographe pixelisé', 'Poudré naturel', 'Tous types', '18-24 mois'],
              ['Micrograyling', 'Hybride nuancé', 'Relief 3D grisé', 'Mature', '24-36 mois'],
              ['Combo Brows', 'Mixte poil+ombre', 'Maximum polyvalence', 'Tous types', '18-30 mois']
            ]
          }
        ]
      },
      {
        id: 'reglementation-2024-2025',
        titre: 'Réglementation 2024-2025',
        sousTitre: 'Mise à jour complète : laser IPL, Hygiène Salubrité, Certibiocide',
        contenu: 'La réglementation évolue rapidement. Cette mise à jour 2024-2025 couvre tous les changements impactant votre pratique professionnelle.',
        pointsCles: [
          'Décret 24 mai 2024 + arrêté 19 février 2025 : Laser IPL autorisé esthéticiennes avec formation socle 4-5j',
          'Détatouage laser reste strictement médical (décret maintenu)',
          'Hygiène Salubrité 21h/3j : Mise à jour obligatoire avant septembre 2025 (décret 2008)',
          'Certibiocide TP2 : Obligatoire pour désinfection matériel (validité 5 ans)',
          'DASRI : Collecteur jaune obligatoire, convention avec prestataire agréé',
          'Assurance RC Pro : Montant minimal 500k€ actes esthétiques invasifs'
        ]
      }
    ],
    quiz: [
      {
        id: 'phagocytose-definition',
        question: 'Qu\'est-ce que la phagocytose en dermopigmentation ?',
        options: [
          'La fixation du pigment dans le derme',
          'L\'englobement des pigments par les macrophages',
          'La cicatrisation de la micro-blessure',
          'La formation de la croûte protectrice'
        ],
        correctIndex: 1,
        explication: 'La phagocytose est le processus par lequel les macrophages (cellules immunitaires) engloutissent les particules de pigment, les transportent lentement vers les ganglions lymphatiques, créant ainsi la permanence relative de la dermopigmentation.'
      },
      {
        id: 'microblading-indication',
        question: 'Pour quel type de peau le microblading est-il le plus adapté ?',
        options: [
          'Peau grasse à tendance acnéique',
          'Peau mature avec rides marquées',
          'Peau sèche à normale',
          'Peau sensible réactive'
        ],
        correctIndex: 2,
        explication: 'Le microblading convient idéalement aux peaux sèches à normales car la cicatrisation est optimale et les traits fins restent nets. Les peaux grasses dilatent les traits et les peaux matures cicatrisent moins bien.'
      }
    ]
  },

  // MODULE 5 — TECHNIQUES DE VENTE
  {
    id: 'techniques-vente-formation-esthetique',
    slug: 'techniques-vente-formation-esthetique',
    titre: 'Techniques de Vente Formation Esthétique',
    sousTitre: 'Scripts, objections et KPIs pour maximiser vos conversions',
    description: 'Maîtrisez l\'art de la vente de formation avec des scripts éprouvés, 10 parades aux objections principales et une stratégie WhatsApp optimisée.',
    icone: '📞',
    dureeMinutes: 150,
    niveau: 'intermediaire',
    categorie: 'commercial',
    objectifs: [
      'Comprendre la psychologie d\'achat des esthéticiennes',
      'Maîtriser le script téléphonique complet en 4 phases',
      'Parer aux 10 objections principales avec aisance',
      'Développer une stratégie WhatsApp Business efficace',
      'Piloter son activité commerciale avec les bons KPIs'
    ],
    prerequis: [
      'Expérience commerciale de base',
      'Connaissance du secteur esthétique',
      'Maîtrise des outils digitaux'
    ],
    tags: ['vente', 'commercial', 'objections', 'scripts', 'kpis', 'whatsapp'],
    sections: [
      {
        id: 'psychologie-achat-estheticienne',
        titre: 'Psychologie d\'achat esthéticienne',
        sousTitre: 'Comprendre les freins et déclencheurs cachés',
        contenu: 'L\'esthéticienne en quête de formation navigue entre ambition professionnelle et peurs multiples. Identifier ses vraies motivations transforme votre approche commerciale.',
        pointsCles: [
          'Syndrome imposteur : "Ai-je le niveau pour réussir cette technique ?"',
          'Peur échec technique : "Et si je rate ? Le client ne reviendra jamais"',
          'Peurs masquées : Investment psychologique > financier',
          'TMS comme catalyseur : Douleurs physiques poussent vers techniques moins invasives',
          'Jungle administrative : FAFCEA/OPCO/CPF perçus comme labyrinthe',
          'Déclencheurs positifs : Avant/après Instagram, témoignage collègue, ROI démontré, FOMO technologique, échéance droits formation'
        ]
      },
      {
        id: 'script-telephonique-complet',
        titre: 'Script téléphonique complet',
        sousTitre: 'Accroche → Découverte → Argumentation → Closing en 4 phases',
        contenu: 'Un appel commercial structuré suit un fil rouge précis. Ce script testé sur 1000+ appels génère 35% de taux de transformation moyen.',
        pointsCles: [
          'PHASE 1 - Accroche 10 secondes : Signal d\'intérêt + contextualisation',
          'PHASE 2 - Découverte 5 piliers : Situation/Objectifs/Budget/Timing/Décideur',
          'PHASE 3 - Argumentation ROI : Formation = levier trésorerie, rentabilité 6 semaines',
          'PHASE 4 - Closing progressif : Alternative dates, urgence légitime, engagement dossier'
        ],
        scripts: [
          {
            id: 'accroche-10-secondes',
            titre: 'Accroche contextuelle (10 secondes)',
            contexte: 'Premier contact, capter l\'attention immédiatement',
            canal: 'appel',
            corps: `"Bonjour Madame {nom}, je suis {prenom} de Dermotec Advanced.

Vous avez récemment manifesté un intérêt pour nos formations en dermopigmentation. C'est bien cela ?

[Attendre confirmation]

Parfait ! J'ai quelques minutes devant moi, puis-je vous poser 2-3 questions pour voir comment nous pouvons vous aider au mieux ?"`,
            variables: ['nom', 'prenom'],
            conseils: [
              'Ton professionnel mais chaleureux',
              'Attendre vraiment la confirmation',
              'Demander permission avant questions'
            ]
          },
          {
            id: 'decouverte-5-piliers',
            titre: 'Phase découverte (5 piliers)',
            contexte: 'Qualification approfondie pour adapter l\'argumentaire',
            canal: 'appel',
            corps: `"Parfait ! Alors dites-moi :

1. SITUATION : Depuis combien de temps exercez-vous dans l'esthétique ? Dans votre propre institut ou en tant que salariée ?

2. OBJECTIFS : Qu'est-ce qui vous attire dans la dermopigmentation ? Développer votre offre de soins ? Augmenter votre CA ?

3. BUDGET/FINANCEMENT : Avez-vous déjà regardé vos droits formation ? Êtes-vous au courant que votre OPCO peut financer jusqu'à 100% ?

4. TIMING : Dans quel délai souhaiteriez-vous vous former ? Avez-vous des contraintes de planning ?

5. DÉCISION : Prenez-vous seule cette décision ou devez-vous en parler avec quelqu'un ?"`,
            variables: [],
            conseils: [
              'Poser une question à la fois',
              'Rebondir sur chaque réponse',
              'Prendre des notes audibles'
            ]
          }
        ]
      },
      {
        id: 'objections-parades',
        titre: '10 objections majeures avec parades mot à mot',
        sousTitre: 'Réponses testées pour lever les freins principaux',
        contenu: 'Ces 10 objections représentent 85% des freins rencontrés. Chaque parade est testée et optimisée pour maintenir le dialogue ouvert.',
        pointsCles: [
          '"C\'est trop cher" → "Votre OPCO peut financer 100%, reste à charge 0€"',
          '"Pas le temps" → "2 jours formation = technique 2x plus rentable"',
          '"Pas sûre d\'y arriver" → "Groupes 6 max, formatrice corrige en direct"',
          '"Je réfléchis" → "Quelle information vous manque ? Rentabilité ou financement ?"',
          '"Mon mari doit valider" → "Voulez-vous notre tableau ROI pour le convaincre ?"',
          '"Formation décevante avant" → "Avec Qualiopi, qu\'est-ce qui vous a manqué exactement ?"',
          '"Administratif lourd" → "Nous nous occupons de tout, vous signez l\'accord"',
          '"Marché saturé" → "Combien de vos concurrentes le proposent dans 5km ?"',
          '"Pas le matériel" → "Kit inclus dans formation, financement matériel possible"',
          '"Je rappelle plus tard" → "La commission OPCO clôture bientôt, puis-je vous réserver une place ?"'
        ],
        tableaux: [
          {
            titre: 'Objections et contre-objections structurées',
            colonnes: ['Objection', 'Écoute active', 'Retournement', 'Preuve'],
            lignes: [
              ['"Trop cher"', '"Je comprends votre préoccupation budget"', '"Combien pensez-vous gagner en plus par mois ?"', '"2 clientes/semaine = +720€/mois"'],
              ['"Pas le temps"', '"Effectivement c\'est un investissement temps"', '"Combien de temps perdez-vous sans cette technique ?"', '"ROI dès la 3ème cliente"'],
              ['"Je réfléchis"', '"C\'est une sage précaution"', '"Quelle information vous manque pour décider ?"', '"Puis-je vous envoyer le détail budget ?"']
            ]
          }
        ]
      },
      {
        id: 'vente-whatsapp',
        titre: 'Vente WhatsApp Business',
        sousTitre: 'Qualification 3 messages + templates haute conversion',
        contenu: 'WhatsApp devient un canal de vente incontournable. Cette méthode 3 messages qualifie rapidement et génère 25% de nos inscriptions.',
        pointsCles: [
          'Message 1 : Qualification statut (gérante/auto-entreprise/salariée)',
          'Message 2 : Révélation budget FAFCEA/OPCO qui dort',
          'Message 3 : Proposition appel 2min à 12h30 (créneau optimal)',
          'Templates avec emojis : +40% ouverture, +25% réponse',
          'Messages vocaux max 45s : Personnalisation, chaleur humaine',
          'Vidéo kit matériel : Preuve tangible, désir d\'achat'
        ]
      },
      {
        id: 'kpis-metriques',
        titre: 'KPIs et métriques commerciales',
        sousTitre: 'Pilotage performance : 40-60 appels/jour, 20-30% conversion',
        contenu: 'Sans mesure, pas d\'amélioration. Ces KPIs vous permettent d\'optimiser chaque étape de votre processus commercial.',
        pointsCles: [
          'Volume : 40-60 appels/jour pour 1 commercial temps plein',
          'Qualité : 50% taux décroché (vs 15% moyenne secteur)',
          'Conversion : 20-30% appel → inscription (objectif 25%)',
          'Délai : 14 jours cycle de vente moyen',
          'CAC : < 20% prix HT formation (objectif 180€ pour formation 1200€)',
          'Formule CAC = (Budget Ads + Salaires commercial) / Nb inscrits mois'
        ],
        tableaux: [
          {
            titre: 'Tableau de bord commercial type',
            colonnes: ['KPI', 'Objectif', 'Réalisé', 'Écart', 'Actions'],
            lignes: [
              ['Appels/jour', '50', '45', '-10%', 'Optimiser créneaux appels'],
              ['Taux décroché', '50%', '45%', '-10%', 'Revoir horaires contact'],
              ['Conversion', '25%', '22%', '-12%', 'Former objections'],
              ['CAC', '180€', '220€', '+22%', 'Réduire coût acquisition'],
              ['Délai closing', '14j', '18j', '+29%', 'Accélérer relances']
            ]
          }
        ]
      }
    ],
    quiz: [
      {
        id: 'syndrome-imposteur',
        question: 'Quel est le principal frein psychologique de l\'esthéticienne face à la formation technique ?',
        options: [
          'La peur de la concurrence',
          'Le syndrome de l\'imposteur',
          'Le manque de temps',
          'Les contraintes administratives'
        ],
        correctIndex: 1,
        explication: 'Le syndrome de l\'imposteur ("Ai-je le niveau pour réussir cette technique ?") est le frein n°1, souvent masqué par des objections budgétaires ou temporelles. Identifier cette peur permet de rassurer efficacement.'
      },
      {
        id: 'taux-conversion-cible',
        question: 'Quel est le taux de conversion objectif d\'un appel commercial vers une inscription ?',
        options: ['10-15%', '20-30%', '35-45%', '50-60%'],
        correctIndex: 1,
        explication: 'L\'objectif est 20-30% de conversion appel → inscription, avec une cible à 25%. Ce taux élevé s\'explique par la qualification préalable des leads entrants et la force de l\'argument financement.'
      },
      {
        id: 'whatsapp-timing',
        question: 'Quel est le créneau optimal pour proposer un appel WhatsApp ?',
        options: ['9h00-10h00', '12h30-13h30', '17h00-18h00', '20h00-21h00'],
        correctIndex: 1,
        explication: 'Le créneau 12h30-13h30 est optimal : pause déjeuner, esthéticienne disponible, pas de clientèle, moment de détente propice à l\'écoute. Éviter 17h-18h (rush fin journée).'
      }
    ]
  }
]