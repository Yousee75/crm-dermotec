import type { FormationEnriched } from '@/types/formations-content'

// ============================================================
// FORMATIONS ENRICHIES — Contenu technique détaillé
// ============================================================
// Données issues de recherche approfondie formations esthétiques
// 11 formations couvrant dermopigmentation, soins, laser, réglementaire

export const FORMATIONS_ENRICHIES: FormationEnriched[] = [
  // ========================================
  // FORMATION 1 — Hygiène et Salubrité
  // ========================================
  {
    slug: 'hygiene-salubrite',
    nom: 'Hygiène et Salubrité',
    categorie: 'reglementaire',
    descriptionTechnique: `Certification obligatoire 21h/3j (décret 2008, arrêté mars 2024). Couvre microbiologie, gestion DASRI, stérilisation, désinfection mains, protocoles asepsie. 9 modules obligatoires. Validité 5 ans, mise à jour obligatoire avant septembre 2025 pour les formées pré-2022. Prérequis légal absolu pour tatouage, maquillage permanent et perçage.`,

    techniquesComparees: [
      {
        nom: 'Module théorique',
        methode: 'Cours magistral + supports',
        rendu: 'Connaissance réglementaire',
        peauIdeale: 'N/A'
      },
      {
        nom: 'Module pratique',
        methode: 'Mise en situation asepsie',
        rendu: 'Maîtrise protocoles',
        peauIdeale: 'N/A'
      }
    ],

    materiel: [
      {
        nom: 'Kit hygiène complet',
        description: 'Gants nitrile, films protection, contenants DASRI',
        prixIndicatif: 'Fourni',
        avantages: ['Respect normes ARS', 'Formation complète']
      },
      {
        nom: 'Désinfectants TP2',
        description: 'Produits biocides homologués surfaces',
        prixIndicatif: '50-80€',
        avantages: ['Efficacité prouvée', 'Conformité réglementaire']
      }
    ],

    roi: {
      coutFormation: 490,
      coutConsommablesParSeance: 0,
      prixVenteMoyen: 0,
      seuilRentabiliteSeances: 0,
      gainAnnuelEstime: 'Indispensable légal',
      tempsAmortissement: 'Sans ce certificat : pas d\'assurance, fermeture administrative, amende pénale'
    },

    faq: [
      {
        question: 'Pourquoi exactement 21 heures ?',
        reponse: 'Minimum légal fixé par décret. Permet de couvrir les 9 modules obligatoires : microbiologie, DASRI, stérilisation, lavage des mains, traçabilité, réglementation, protocoles d\'asepsie, gestion des incidents d\'exposition.'
      },
      {
        question: 'Quelle est la validité du certificat ?',
        reponse: '5 ans maximum. ATTENTION : mise à jour obligatoire avant septembre 2025 pour toutes les personnes formées avant 2022 (nouvel arrêté mars 2024).'
      },
      {
        question: 'Le Certibiocide est-il inclus ?',
        reponse: 'Non, c\'est un certificat séparé obligatoire depuis 2024 pour utiliser les produits désinfectants TP2. Formation complémentaire de 7h.'
      },
      {
        question: 'Formation en ligne possible ?',
        reponse: 'Partie théorique possible à distance, mais module pratique obligatoirement en présentiel (manipulation matériel, protocoles asepsie).'
      },
      {
        question: 'Avant ou après formation PMU ?',
        reponse: 'AVANT obligatoirement. Sans certificat d\'hygiène, aucune assurance ne couvre les actes d\'effraction cutanée.'
      }
    ],

    glossaire: [
      { terme: 'DASRI', definition: 'Déchets d\'Activités de Soins à Risques Infectieux' },
      { terme: 'Asepsie', definition: 'Ensemble des mesures préventives pour éviter toute contamination microbienne' },
      { terme: 'Stérilisation', definition: 'Destruction de tous micro-organismes et spores' },
      { terme: 'Biocide TP2', definition: 'Produits désinfectants pour surfaces (Type de Produit 2)' },
      { terme: 'ARS', definition: 'Agence Régionale de Santé - autorité de contrôle' }
    ],

    reglementation: 'Décret 19 février 2008, arrêté mars 2024, Certibiocide 2024-2025. Formation obligatoire pour tous actes par effraction cutanée.',

    contreIndications: ['Aucune (obligatoire pour tous)'],

    publicCible: ['Toute personne pratiquant des actes par effraction cutanée', 'Futures praticiennes PMU/tatouage', 'Professionnels esthétique'],

    duree: '3 jours (21 heures)',
    prix: '490 € HT'
  },

  // ========================================
  // FORMATION 2 — Maquillage Permanent Initiation
  // ========================================
  {
    slug: 'maquillage-permanent-initiation',
    nom: 'Maquillage Permanent Initiation',
    categorie: 'dermopigmentation',
    descriptionTechnique: `Module fondamental 3-5 jours. 3 zones visage : sourcils, lèvres, eye-liner. Implantation pigments dans derme superficiel par dermographe. Phagocytose par macrophages, longévité dépend taille molécules et profondeur. Cycle renouvellement épiderme 28 jours. Colorimétrie sous-tons chauds/froids/neutres.`,

    techniquesComparees: [
      {
        nom: 'Microblading',
        methode: 'Manuel lame, poil à poil',
        rendu: 'Traits fins naturels',
        peauIdeale: 'Peaux sèches-normales'
      },
      {
        nom: 'Microshading',
        methode: 'Dermographe, technique poudré',
        rendu: 'Effet ombré doux',
        peauIdeale: 'Tous types de peau'
      },
      {
        nom: 'Combo Brows',
        methode: 'Mixte blading + shading',
        rendu: 'Densité + réalisme',
        peauIdeale: 'Sourcils très clairsemés'
      }
    ],

    materiel: [
      {
        nom: 'Dermographe Oron 60s',
        description: 'Machine professionnelle haute précision',
        prixIndicatif: '3 500€+',
        avantages: ['Vibrations minimales', 'Précision maximale', 'Fiabilité']
      },
      {
        nom: 'Pack 10 aiguilles',
        description: 'Cartouches stériles usage unique',
        prixIndicatif: '25€/séance',
        avantages: ['Sécurité maximale', 'Trait parfait']
      },
      {
        nom: 'Pigments REACH',
        description: 'Nouveau Contour/Perma Blend LUXE',
        prixIndicatif: '80-120€/flacon',
        avantages: ['Conformité 2022', 'Tenue optimale', 'Couleurs stables']
      }
    ],

    roi: {
      coutFormation: 2300,
      coutConsommablesParSeance: 25,
      prixVenteMoyen: 350,
      seuilRentabiliteSeances: 15,
      gainAnnuelEstime: '62 400€ (4 clientes/semaine)',
      tempsAmortissement: '2 mois (formation + machine 4800€ total)'
    },

    faq: [
      {
        question: 'Différence avec un tatouage traditionnel ?',
        reponse: 'PMU = derme superficiel (1-1.5mm), pigments organiques résorbables, longévité 1-3 ans. Tatouage = derme profond (2-4mm), encres permanentes.'
      },
      {
        question: 'Combien de temps ça dure exactement ?',
        reponse: '12-18 mois en moyenne. Variables : type de peau, exposition solaire, soins post-traitement, qualité des pigments, profondeur d\'implantation.'
      },
      {
        question: 'Est-ce que c\'est douloureux ?',
        reponse: 'Inconfort modéré 3-4/10. Crème anesthésiante appliquée 20min avant. Zones sensibles : contour œil > lèvres > sourcils.'
      },
      {
        question: 'Problème sur peau grasse ?',
        reponse: 'Microblading déconseillé (bavure sébum). Privilégier microshading ou combo. Préparation peau 15j avant (nettoyage profond).'
      },
      {
        question: 'Retouche incluse dans le prix ?',
        reponse: 'Oui, retouche à 4-6 semaines incluse (cicatrisation complète). Permet ajustements couleur et densité selon rendu final.'
      }
    ],

    glossaire: [
      { terme: 'Dermographe', definition: 'Machine électrique d\'implantation de pigments' },
      { terme: 'Cartouche', definition: 'Embout stérile contenant les aiguilles' },
      { terme: 'Pigment REACH', definition: 'Colorants conformes réglementation européenne 2022' },
      { terme: 'Phagocytose', definition: 'Processus d\'élimination naturelle des pigments par les macrophages' },
      { terme: 'Derme', definition: 'Couche profonde de la peau sous l\'épiderme' },
      { terme: 'Épiderme', definition: 'Couche superficielle de la peau' },
      { terme: 'Colorimétrie', definition: 'Science des couleurs et harmonies teint' },
      { terme: 'Phototype', definition: 'Classification couleur peau selon Fitzpatrick' }
    ],

    reglementation: 'Hygiène et Salubrité obligatoire avant formation. Pigments REACH 2022 (4000 substances interdites). Traçabilité obligatoire.',

    contreIndications: [
      'Grossesse et allaitement',
      'Traitement Roaccutane (6 mois)',
      'Diabète non stabilisé',
      'Herpès actif (zone lèvres)',
      'Tendance cicatrices chéloïdes',
      'Anticoagulants',
      'Problèmes de coagulation'
    ],

    publicCible: ['Esthéticiennes diplômées', 'Futures praticiennes PMU', 'Reconversion professionnelle'],

    duree: '5 jours (35 heures)',
    prix: '2 300 € HT'
  },

  // ========================================
  // FORMATION 3 — Microblading & Microshading
  // ========================================
  {
    slug: 'microblading-microshading',
    nom: 'Microblading & Microshading',
    categorie: 'dermopigmentation',
    descriptionTechnique: `Spécialisation sourcils. Microblading = technique manuelle (microblade/lame) créant des traits fins imitant les poils naturels. Risque sur peau grasse (diffusion sébum). Microshading = technique pixelisation par dermographe, effet poudré-ombré, adapté à tous types de peau. Micrograyling 2025 = hybride avec nuances gris/brun froid pour illusion de profondeur 3D.`,

    techniquesComparees: [
      {
        nom: 'Microblading classique',
        methode: 'Lame manuelle 12-14 picots',
        rendu: 'Poils ultra-réalistes',
        peauIdeale: 'Peau normale à sèche'
      },
      {
        nom: 'Microshading poudré',
        methode: 'Dermographe pixelisation',
        rendu: 'Effet maquillage naturel',
        peauIdeale: 'Tous types, ideal peau grasse'
      },
      {
        nom: 'Micrograyling 3D',
        methode: 'Nuances grises + brunes',
        rendu: 'Profondeur et relief',
        peauIdeale: 'Sourcils très clairs'
      },
      {
        nom: 'Combo Brows',
        methode: 'Blading base + shading finale',
        rendu: 'Densité maximale naturelle',
        peauIdeale: 'Sourcils très clairsemés'
      }
    ],

    materiel: [
      {
        nom: 'Stylets manuels',
        description: 'Lames microblading 12-18 picots',
        prixIndicatif: '15-25€ par set',
        avantages: ['Précision millimétrique', 'Trait naturel']
      },
      {
        nom: 'Pigments sourcils poudrés',
        description: 'Gamme complète bruns/gris/auburn',
        prixIndicatif: '90€/couleur',
        avantages: ['Nuances subtiles', 'Tenue longue durée']
      },
      {
        nom: 'Dermographe précision',
        description: 'Pour technique shading',
        prixIndicatif: 'Inclus formation initiation',
        avantages: ['Polyvalence', 'Résultat homogène']
      }
    ],

    roi: {
      coutFormation: 1800,
      coutConsommablesParSeance: 20,
      prixVenteMoyen: 400,
      seuilRentabiliteSeances: 5,
      gainAnnuelEstime: '50 000€+ (segment le plus demandé)',
      tempsAmortissement: 'Rentabilisée en 1 mois'
    },

    faq: [
      {
        question: 'Pourquoi ça "bave" sur peau grasse ?',
        reponse: 'Le sébum fait diffuser les pigments sous la peau. Les traits fins se transforment en taches floues. Solution : microshading exclusivement.'
      },
      {
        question: 'Différence visuelle shading vs blading ?',
        reponse: 'Blading = effet poils naturels, précis. Shading = effet maquillage poudré, plus couvrant. Combo = réalisme + densité.'
      },
      {
        question: 'Le micrograyling c\'est quoi exactement ?',
        reponse: 'Technique 2025 : mélange subtil gris froid + brun pour créer illusion de profondeur 3D. Idéal sourcils très clairs ou décolorés.'
      },
      {
        question: 'Durée de tenue comparative ?',
        reponse: 'Microblading : 8-12 mois. Microshading : 12-18 mois. Micrograyling : 10-15 mois. Combo : 12-20 mois (le plus durable).'
      }
    ],

    glossaire: [
      { terme: 'Microblade', definition: 'Lame fine avec plusieurs picots pour trait poil' },
      { terme: 'Pixelisation', definition: 'Technique de points fins pour effet poudré' },
      { terme: 'Combo brows', definition: 'Combinaison blading + shading' },
      { terme: 'Micrograyling', definition: 'Technique nuances grises pour effet 3D' },
      { terme: 'Sous-ton', definition: 'Nuance subtile chaude/froide/neutre du pigment' }
    ],

    reglementation: 'Hygiène + Initiation PMU préalables obligatoires. Formation colorimétrie recommandée.',

    contreIndications: [
      'Peau très grasse (microblading)',
      'Cicatrices chéloïdes',
      'Anticoagulants',
      'Herpès actif front',
      'Grossesse'
    ],

    publicCible: ['Praticiennes PMU initiées', 'Spécialisation sourcils', 'Perfectionnement technique'],

    duree: '3 jours (21 heures)',
    prix: '1 800 € HT'
  },

  // ========================================
  // FORMATION 4 — Candy Lips / Lip Blush
  // ========================================
  {
    slug: 'candy-lips-lip-blush',
    nom: 'Candy Lips / Lip Blush',
    categorie: 'dermopigmentation',
    descriptionTechnique: `Voilage coloré des lèvres. Objectif 2025 : dégradé naturel redonnant du volume par illusion optique (plus de contour marqué années 90). Technique pigments Aquarelle, travail en couches fines, respect de la muqueuse labiale. Correction asymétries, ravivage couleur naturelle, effet repulpant visuel.`,

    techniquesComparees: [
      {
        nom: 'Lip Blush naturel',
        methode: 'Voilage déградé',
        rendu: 'Couleur naturelle ravivée',
        peauIdeale: 'Toutes carnations'
      },
      {
        nom: 'Candy Lips nude',
        methode: 'Technique aquarelle',
        rendu: 'Effet glossy permanent',
        peauIdeale: 'Lèvres pâles ou foncées'
      },
      {
        nom: 'Contour soft',
        methode: 'Redéfinition subtile',
        rendu: 'Volume optique',
        peauIdeale: 'Lèvres asymétriques'
      }
    ],

    materiel: [
      {
        nom: 'Pigments lèvres spéciaux',
        description: 'Couleurs adaptées muqueuse',
        prixIndicatif: '95€/couleur',
        avantages: ['Tenue spéciale muqueuse', 'Couleurs stables']
      },
      {
        nom: 'Cartouches lèvres',
        description: 'Aiguilles fine pour zone sensible',
        prixIndicatif: '20€/séance',
        avantages: ['Confort optimal', 'Précision']
      }
    ],

    roi: {
      coutFormation: 1500,
      coutConsommablesParSeance: 20,
      prixVenteMoyen: 400,
      seuilRentabiliteSeances: 4,
      gainAnnuelEstime: 'Prix moyen 300-500€/prestation',
      tempsAmortissement: '3 semaines'
    },

    faq: [
      {
        question: 'Risque d\'herpès labial ?',
        reponse: 'Oui, risque réel. Prescrire Zelitrex (antiviral) 48h avant pour toute personne ayant déjà eu de l\'herpès. Prophylaxie indispensable.'
      },
      {
        question: 'Différence avec ancien contour des années 90 ?',
        reponse: 'Finies les lèvres "cernées". Technique 2025 = dégradé naturel, voilage subtil, effet volume par illusion optique.'
      }
    ],

    glossaire: [
      { terme: 'Lip Blush', definition: 'Voilage coloré naturel des lèvres' },
      { terme: 'Candy Lips', definition: 'Effet glossy permanent par pigmentation' },
      { terme: 'Muqueuse labiale', definition: 'Tissu interne délicat des lèvres' },
      { terme: 'Voilage', definition: 'Technique de couleur transparente' }
    ],

    reglementation: 'Hygiène + Initiation PMU. Prescription antivirale si antécédent herpès.',

    contreIndications: [
      'Herpès labial actif',
      'Grossesse',
      'Allergie aux anesthésiants',
      'Lèvres gercées/abîmées'
    ],

    publicCible: ['Praticiennes PMU confirmées', 'Spécialisation lèvres'],

    duree: '2 jours (14 heures)',
    prix: '1 500 € HT'
  },

  // ========================================
  // FORMATION 5 — Eyeliner & Lash Liner
  // ========================================
  {
    slug: 'eyeliner-lash-liner',
    nom: 'Eyeliner & Lash Liner',
    categorie: 'dermopigmentation',
    descriptionTechnique: `Lash Liner = densification ciliaire par pigmentation de la ligne des cils, regard intensifié sans effet maquillé visible. Eyeliner graphique/wing = sophistiqué, maîtrise parfaite symétrie nécessaire. Zone ultra-sensible, technique précision maximale.`,

    techniquesComparees: [
      {
        nom: 'Lash Liner invisible',
        methode: 'Points entre les cils',
        rendu: 'Densification naturelle',
        peauIdeale: 'Toutes paupières'
      },
      {
        nom: 'Eyeliner fin classique',
        methode: 'Trait continu fin',
        rendu: 'Regard défini discret',
        peauIdeale: 'Paupières normales'
      },
      {
        nom: 'Eyeliner wing/cat eye',
        methode: 'Trait + aileron',
        rendu: 'Regard sophistiqué',
        peauIdeale: 'Paupières sans ptose'
      }
    ],

    materiel: [
      {
        nom: 'Aiguilles ultra-fines',
        description: 'Cartouches spéciales contour œil',
        prixIndicatif: '25€/séance',
        avantages: ['Précision maximale', 'Sécurité zone sensible']
      },
      {
        nom: 'Pigments noirs/bruns',
        description: 'Couleurs stables contour œil',
        prixIndicatif: '90€/couleur',
        avantages: ['Pas de virage', 'Tenue longue']
      }
    ],

    roi: {
      coutFormation: 1500,
      coutConsommablesParSeance: 25,
      prixVenteMoyen: 350,
      seuilRentabiliteSeances: 5,
      gainAnnuelEstime: '300-400€/prestation, demande en forte croissance',
      tempsAmortissement: '1 mois'
    },

    faq: [
      {
        question: 'Risques zone contour œil ?',
        reponse: 'Zone la plus délicate. Formation approfondie sécurité obligatoire. Jamais sur paupière mobile. Protection oculaire indispensable.'
      }
    ],

    glossaire: [
      { terme: 'Lash Liner', definition: 'Densification ligne des cils' },
      { terme: 'Wing/Cat eye', definition: 'Aileron eyeliner style félin' },
      { terme: 'Ptose', definition: 'Affaissement paupière supérieure' }
    ],

    reglementation: 'Hygiène + Initiation PMU. Formation sécurité zone oculaire.',

    contreIndications: [
      'Conjonctivite active',
      'Blépharite',
      'Œil sec sévère',
      'Ptose marquée',
      'Allergie produits oculaires'
    ],

    publicCible: ['Praticiennes PMU expertes', 'Spécialisation contour œil'],

    duree: '2 jours (14 heures)',
    prix: '1 500 € HT'
  },

  // ========================================
  // FORMATION 6 — Dermopigmentation Réparatrice
  // ========================================
  {
    slug: 'dermopigmentation-reparatrice',
    nom: 'Dermopigmentation Réparatrice',
    categorie: 'dermopigmentation',
    descriptionTechnique: `Dimension paramédicale et sociale. Reconstruction aréoles mammaires post-mastectomie (acte final du parcours de soin), camouflage cicatrices (accidents, chirurgies), vitiligo. Illusion 3D saisissante mais relief/contractilité mamelon non restituables. Perte totale sensibilité zone reconstruite. Approche = empathie radicale + résilience (pas pitié).`,

    techniquesComparees: [
      {
        nom: 'Reconstruction aréole 3D',
        methode: 'Dégradés + trompe-l\'œil mamelon',
        rendu: 'Illusion relief saisissante',
        peauIdeale: 'Peau cicatricielle'
      },
      {
        nom: 'Camouflage cicatrices',
        methode: 'Colorimétrie peau + texture',
        rendu: 'Cicatrice invisible',
        peauIdeale: 'Cicatrices matures'
      },
      {
        nom: 'Vitiligo masquage',
        methode: 'Repigmentation zones blanches',
        rendu: 'Teint homogène',
        peauIdeale: 'Vitiligo stable'
      }
    ],

    materiel: [
      {
        nom: 'Pigments médicaux spéciaux',
        description: 'Gamme complète teints + camouflage',
        prixIndicatif: '120€/couleur',
        avantages: ['Biocompatibilité', 'Tenue sur peau fragilisée']
      },
      {
        nom: 'Dermographe précision médicale',
        description: 'Machine adaptée zones sensibles',
        prixIndicatif: '4000€+',
        avantages: ['Contrôle parfait', 'Douceur maximale']
      }
    ],

    roi: {
      coutFormation: 2500,
      coutConsommablesParSeance: 30,
      prixVenteMoyen: 800,
      seuilRentabiliteSeances: 4,
      gainAnnuelEstime: '500-1500€/prestation, dimension sociale forte',
      tempsAmortissement: 'Différenciation concurrentielle majeure'
    },

    faq: [
      {
        question: 'Combien de temps après la chirurgie ?',
        reponse: 'Minimum 6-12 mois cicatrisation complète. Accord médical obligatoire. Peau mature et stable exigée.'
      },
      {
        question: 'Le relief du mamelon est-il reconstitué ?',
        reponse: 'NON. Seule illusion 3D par jeu d\'ombres/lumières. Relief physique = chirurgie plastique. Contractilité perdue définitivement.'
      }
    ],

    glossaire: [
      { terme: 'Mastectomie', definition: 'Ablation chirurgicale du sein' },
      { terme: 'Aréole', definition: 'Zone pigmentée autour du mamelon' },
      { terme: 'Vitiligo', definition: 'Dépigmentation cutanée par plaques' },
      { terme: 'Biocompatibilité', definition: 'Tolérance parfaite par l\'organisme' }
    ],

    reglementation: 'Hygiène + Initiation PMU + 3 mois pratique terrain minimum. Accord médical obligatoire.',

    contreIndications: [
      'Cicatrisation incomplète',
      'Traitement oncologique en cours',
      'Infection locale',
      'Peau fragile/radiodermite'
    ],

    publicCible: ['Praticiennes PMU confirmées', 'Reconversion paramédical', 'Formation médicale esthétique'],

    duree: '3 jours (21 heures)',
    prix: '2 500 € HT'
  },

  // ========================================
  // FORMATION 7 — Tricopigmentation
  // ========================================
  {
    slug: 'tricopigmentation',
    nom: 'Tricopigmentation',
    categorie: 'tricopigmentation',
    descriptionTechnique: `Micropigmentation cuir chevelu. 50% hommes après 50 ans touchés par calvitie. 3 effets : crâne rasé (calvities totales/avancées, illusion follicules en repousse), densité (cheveux longs/mi-longs, réduction contraste peau/cheveux), camouflage cicatrices FUE/FUT. 3 séances espacées d'un mois. Marché féminin (alopécie diffuse) en forte croissance. Psychologie masculine : pudeur, honte, approche technique/factuelle requis.`,

    techniquesComparees: [
      {
        nom: 'Effet crâne rasé',
        methode: 'Points follicules illusion repousse',
        rendu: 'Chevelure rasée uniforme',
        peauIdeale: 'Calvities avancées/complètes'
      },
      {
        nom: 'Effet densité',
        methode: 'Réduction contraste peau/cheveux',
        rendu: 'Cheveux plus épais visuellement',
        peauIdeale: 'Alopécie diffuse, cheveux fins'
      },
      {
        nom: 'Camouflage cicatrices',
        methode: 'Reconstruction follicules manquants',
        rendu: 'Cicatrices FUE/FUT invisibles',
        peauIdeale: 'Post-greffe capillaire'
      }
    ],

    materiel: [
      {
        nom: 'Machine tricopigmentation',
        description: 'Dermographe spécialisé cuir chevelu',
        prixIndicatif: '3500€+',
        avantages: ['Précision follicule', 'Profondeur contrôlée']
      },
      {
        nom: 'Pigments cuir chevelu',
        description: 'Gamme complète couleurs cheveux',
        prixIndicatif: '100€/couleur',
        avantages: ['Teintes naturelles', 'Pas de virage']
      },
      {
        nom: 'Cartouches spéciales',
        description: 'Aiguilles effet follicule',
        prixIndicatif: '60€/protocole 3 séances',
        avantages: ['Rendu ultra-réaliste']
      }
    ],

    roi: {
      coutFormation: 2250,
      coutConsommablesParSeance: 60,
      prixVenteMoyen: 1200,
      seuilRentabiliteSeances: 2,
      gainAnnuelEstime: 'Prestation la plus lucrative par heure',
      tempsAmortissement: 'Rentabilité après 2 clients seulement'
    },

    faq: [
      {
        question: 'Différence avec greffe capillaire ?',
        reponse: 'Greffe = vrais cheveux qui poussent, 10000-15000€, résultat à 1 an. Tricopigmentation = illusion visuelle immédiate, 1500-2500€, retouche tous les 3-5 ans.'
      },
      {
        question: 'Ça marche sur calvitie totale ?',
        reponse: 'Oui, effet "crâne rasé" très convaincant. Créé illusion de follicules en repousse. Idéal pour assumPeur la calvitie avec style.'
      },
      {
        question: 'Et pour les femmes ?',
        reponse: 'Marché en explosion ! Alopécie diffuse, pelade, chimiothérapie. Technique "densité" redonne volume visuel sans chirurgie.'
      },
      {
        question: 'Combien de séances nécessaires ?',
        reponse: '3 séances espacées d\'1 mois : 1ère = base, 2ème = densité, 3ème = finitions. Résultat progressif et naturel.'
      },
      {
        question: 'Entretien à prévoir ?',
        reponse: 'Retouche tous les 3-5 ans selon exposition solaire et type de peau. Pigments s\'estompent progressivement.'
      }
    ],

    glossaire: [
      { terme: 'Alopécie', definition: 'Chute anormale des cheveux' },
      { terme: 'FUE/FUT', definition: 'Techniques de greffe capillaire' },
      { terme: 'Follicule', definition: 'Cavité où pousse le cheveu' },
      { terme: 'Pelade', definition: 'Chute cheveux par plaques (auto-immune)' },
      { terme: 'Calvitie androgénétique', definition: 'Perte cheveux hormonale masculine' }
    ],

    reglementation: 'Hygiène + formation spécialisée cuir chevelu. Pas de réglementation médicale.',

    contreIndications: [
      'Psoriasis cuir chevelu actif',
      'Eczéma sévère',
      'Chimiothérapie en cours',
      'Greffe récente (<6 mois)'
    ],

    publicCible: ['Professionnels esthétique', 'Barbiers/coiffeurs', 'Spécialisation masculine'],

    duree: '4 jours (28 heures)',
    prix: '2 250 € HT'
  },

  // ========================================
  // FORMATION 8 — Nanoneedling & BB Glow
  // ========================================
  {
    slug: 'nanoneedling-bb-glow',
    nom: 'Nanoneedling & BB Glow',
    categorie: 'soins-visage',
    descriptionTechnique: `Nanoneedling = perforation non-invasive avec stylet C-PEN III, cartouches picots silicone/aiguilles <0.5mm, micro-canaux épidermiques, +80% pénétration actifs (acide hyaluronique, vitamines). BB Glow = variante avec sérums teintés pour unifier teint, camoufler cernes, effet "peau de porcelaine" immédiat. Reste dans l'épiderme (≠ microneedling qui perce le derme).`,

    techniquesComparees: [
      {
        nom: 'Nanoneedling pur',
        methode: 'Picots silicone <0.5mm',
        rendu: 'Pénétration actifs +80%',
        peauIdeale: 'Tous types, sensibles inclus'
      },
      {
        nom: 'BB Glow teinté',
        methode: 'Nanoneedling + sérums colorés',
        rendu: 'Teint unifié immédiat',
        peauIdeale: 'Peaux ternes, cernes'
      },
      {
        nom: 'Nanoneedling hydratant',
        methode: 'Acide hyaluronique pur',
        rendu: 'Hydratation profonde',
        peauIdeale: 'Peaux déshydratées'
      }
    ],

    materiel: [
      {
        nom: 'Stylet C-PEN III',
        description: 'Machine nanoneedling professionnelle',
        prixIndicatif: '2500€',
        avantages: ['Précision réglable', 'Sans douleur']
      },
      {
        nom: 'Cartouches nano',
        description: 'Picots silicone usage unique',
        prixIndicatif: '15€/séance',
        avantages: ['Sécurité maximale', 'Efficacité prouvée']
      },
      {
        nom: 'Sérums BB Glow',
        description: 'Cocktails teintés + actifs',
        prixIndicatif: '80€/flacon',
        avantages: ['Résultat immédiat', 'Tenue 6-8 mois']
      }
    ],

    roi: {
      coutFormation: 600,
      coutConsommablesParSeance: 25,
      prixVenteMoyen: 100,
      seuilRentabiliteSeances: 10,
      gainAnnuelEstime: '80-120€/séance, rentabilisée en 10 soins',
      tempsAmortissement: 'Moins d\'1 mois'
    },

    faq: [
      {
        question: 'Différence avec microneedling ?',
        reponse: 'Nanoneedling = épiderme seulement, sans douleur, sans éviction sociale. Microneedling = derme, saignements, 48h récupération.'
      },
      {
        question: 'Le BB Glow, c\'est du maquillage permanent ?',
        reponse: 'NON ! Reste dans épiderme, s\'estompe en 6-8 mois. Effet teint parfait immédiat mais temporaire.'
      }
    ],

    glossaire: [
      { terme: 'Nanoneedling', definition: 'Perforation superficielle <0.5mm' },
      { terme: 'BB Glow', definition: 'Teint unifié par sérums nanoneedling' },
      { terme: 'Micro-canaux', definition: 'Ouvertures temporaires pénétration actifs' },
      { terme: 'C-PEN III', definition: 'Référence machine nanoneedling' }
    ],

    reglementation: 'Pas de prérequis spécifiques. Formation esthétique recommandée.',

    contreIndications: [
      'Acné inflammatoire active',
      'Rosacée sévère',
      'Grossesse (sérums actifs)',
      'Allergies cosmétiques'
    ],

    publicCible: ['Esthéticiennes', 'Instituts beauté', 'Cabinets esthétique'],

    duree: '1 jour (7 heures)',
    prix: '600 € HT'
  },

  // ========================================
  // FORMATION 9 — Peeling Chimique
  // ========================================
  {
    slug: 'peeling-chimique',
    nom: 'Peeling Chimique',
    categorie: 'soins-visage',
    descriptionTechnique: `3 niveaux. Superficiel (AHA/glycolique) = épiderme, coup d'éclat, autorisé esthéticiennes, sans éviction sociale. Moyen (TCA acide trichloracétique) = derme superficiel, rides/taches, desquamation 5-7j. Profond (phénol) = derme profond, STRICTEMENT MÉDICAL risques cardiaques. Formation couvre niveaux autorisés esthéticiennes.`,

    techniquesComparees: [
      {
        nom: 'Peeling glycolique 20-30%',
        methode: 'AHA doux application pinceau',
        rendu: 'Éclat immédiat, pores resserrés',
        peauIdeale: 'Tous types, débutantes'
      },
      {
        nom: 'Peeling aux fruits 15%',
        methode: 'Mélange AHA naturels',
        rendu: 'Coup d\'éclat naturel',
        peauIdeale: 'Peaux sensibles'
      },
      {
        nom: 'Peeling salicylique 20%',
        methode: 'BHA spécial peaux grasses',
        rendu: 'Désincruste pores, anti-acné',
        peauIdeale: 'Peaux mixtes à grasses'
      }
    ],

    materiel: [
      {
        nom: 'Gamme peelings professionnels',
        description: 'AHA/BHA concentrés + neutralisant',
        prixIndicatif: '200€/kit complet',
        avantages: ['Dosage précis', 'Sécurité contrôlée']
      },
      {
        nom: 'Pinceaux application',
        description: 'Outils précision zones visage',
        prixIndicatif: '50€/set',
        avantages: ['Application homogène']
      }
    ],

    roi: {
      coutFormation: 450,
      coutConsommablesParSeance: 15,
      prixVenteMoyen: 80,
      seuilRentabiliteSeances: 7,
      gainAnnuelEstime: 'Rentabilisée en 5 séances (1 mois)',
      tempsAmortissement: 'ROI immédiat'
    },

    faq: [
      {
        question: 'Risques des peelings superficiels ?',
        reponse: 'Très faibles si protocole respecté. Possibles : rougeurs 2-4h, picotements. JAMAIS sur peau bronzée ou lésée.'
      },
      {
        question: 'Période idéale pour les peelings ?',
        reponse: 'Automne-hiver-printemps. ÉVITER été (photosensibilisation). Protection solaire SPF50 obligatoire 15 jours après.'
      }
    ],

    glossaire: [
      { terme: 'AHA', definition: 'Acides de fruits (Alpha Hydroxy Acids)' },
      { terme: 'BHA', definition: 'Acide salicylique (Beta Hydroxy Acid)' },
      { terme: 'TCA', definition: 'Acide trichloracétique (médical uniquement)' },
      { terme: 'Photosensibilisation', definition: 'Sensibilité accrue au soleil post-peeling' }
    ],

    reglementation: 'Formation esthétique obligatoire. Concentrations limitées (max 30% AHA pour esthéticiennes).',

    contreIndications: [
      'Grossesse/allaitement',
      'Peau bronzée récemment',
      'Herpès actif',
      'Lésions cutanées',
      'Traitement photosensibilisant',
      'Période estivale'
    ],

    publicCible: ['Esthéticiennes diplômées', 'Instituts beauté', 'Perfectionnement soins'],

    duree: '1 jour (7 heures)',
    prix: '450 € HT'
  },

  // ========================================
  // FORMATION 10 — Laser & IPL Épilation
  // ========================================
  {
    slug: 'laser-ipl-epilation',
    nom: 'Laser & IPL Épilation',
    categorie: 'laser-ipl',
    descriptionTechnique: `Décret 24 mai 2024 + arrêté 19 février 2025 = esthéticiennes autorisées officiellement. Laser = faisceau monochromatique captant mélanine du poil, chaleur >70°C détruit follicule. Alexandrite 755nm ou Nd:YAG 1064nm. IPL = spectre large polyvalent. 6-8 séances (phase anagène uniquement). Ne fonctionne PAS sur poils blancs (pas de mélanine). Attestation formation visible dans institut obligatoire.`,

    techniquesComparees: [
      {
        nom: 'Laser Alexandrite 755nm',
        methode: 'Faisceau monochromatique précis',
        rendu: 'Efficacité max peaux claires',
        peauIdeale: 'Phototypes I-IV, poils foncés'
      },
      {
        nom: 'Laser Nd:YAG 1064nm',
        methode: 'Longueur d\'onde plus longue',
        rendu: 'Sécurité peaux mates/noires',
        peauIdeale: 'Phototypes V-VI'
      },
      {
        nom: 'IPL spectre large',
        methode: 'Lumière pulsée polyvalente',
        rendu: 'Efficace + économique',
        peauIdeale: 'Phototypes I-III'
      }
    ],

    materiel: [
      {
        nom: 'Machine laser/IPL pro',
        description: 'Appareil homologué médical',
        prixIndicatif: '15 000-20 000€',
        avantages: ['Efficacité maximale', 'Sécurité certifiée']
      },
      {
        nom: 'Consommables séance',
        description: 'Gel, lingettes, équipements protection',
        prixIndicatif: '5€/séance',
        avantages: ['Confort client', 'Sécurité']
      }
    ],

    roi: {
      coutFormation: 1800,
      coutConsommablesParSeance: 5,
      prixVenteMoyen: 80,
      seuilRentabiliteSeances: 224,
      gainAnnuelEstime: '75€ net/séance 30min, rentabilisé en 1 mois si 10/jour',
      tempsAmortissement: 'Machine rentabilisée en 224 séances'
    },

    faq: [
      {
        question: 'Autorisation légale depuis quand ?',
        reponse: 'Décret 24 mai 2024 + arrêté février 2025. Esthéticiennes officiellement autorisées épilation laser. Attestation formation obligatoire.'
      },
      {
        question: 'Différence laser vs IPL efficacité ?',
        reponse: 'Laser = plus efficace, ciblé. IPL = plus polyvalent, économique. Résultat final similaire mais laser plus rapide.'
      },
      {
        question: 'Ça marche sur tous les poils ?',
        reponse: 'NON ! Uniquement poils avec mélanine (bruns/noirs). Poils blancs/blonds/roux = inefficace (pas de cible mélanine).'
      },
      {
        question: 'Combien de séances nécessaires ?',
        reponse: '6-8 séances minimum espacées 4-8 semaines (cycle pilaire). Phase anagène seule destructible (20% poils simultanément).'
      },
      {
        question: 'Détatouage autorisé pour esthéticiennes ?',
        reponse: 'NON ! Détatouage = MÉDICAL uniquement. Esthéticiennes = épilation seulement. Taches brunes aussi médical.'
      }
    ],

    glossaire: [
      { terme: 'Alexandrite', definition: 'Type laser 755nm, référence épilation' },
      { terme: 'Nd:YAG', definition: 'Laser 1064nm pour peaux foncées' },
      { terme: 'IPL', definition: 'Intense Pulsed Light, spectre large' },
      { terme: 'Phase anagène', definition: 'Phase croissance poil (20% simultané)' },
      { terme: 'Mélanine', definition: 'Pigment noir cible du laser' }
    ],

    reglementation: 'Décret 24 mai 2024. Formation certifiante obligatoire. Attestation visible en institut. SEULE épilation autorisée.',

    contreIndications: [
      'Peau bronzée/hâlée',
      'Grossesse',
      'Cancer cutané',
      'Photosensibilisation',
      'Tatouages zone traitée',
      'Poils blancs/blonds'
    ],

    publicCible: ['Esthéticiennes diplômées', 'Instituts investissement machine', 'Spécialisation épilation'],

    duree: '5 jours (35 heures)',
    prix: '1 800 € HT'
  },

  // ========================================
  // FORMATION 11 — Détatouage sans Laser
  // ========================================
  {
    slug: 'detatouage-sans-laser',
    nom: 'Détatouage sans Laser',
    categorie: 'dermopigmentation',
    descriptionTechnique: `Techniques de lightening pour corriger anciens maquillages permanents ratés. JAMAIS camoufler avec couleur chair (erreur débutant = opaque, vieillit mal). Neutralisation colorimétrique des virages (orange, bleu, gris). Alternative au détatouage laser (qui reste médical). Techniques acides, saline, enzymes selon cas.`,

    techniquesComparees: [
      {
        nom: 'Lightening acide',
        methode: 'Application acides spéciaux',
        rendu: 'Éclaircissement progressif',
        peauIdeale: 'PMU récents <2 ans'
      },
      {
        nom: 'Méthode saline',
        methode: 'Solution saline concentrée',
        rendu: 'Extraction pigments doux',
        peauIdeale: 'Peaux sensibles'
      },
      {
        nom: 'Neutralisation colorimétrique',
        methode: 'Couleurs complémentaires',
        rendu: 'Correction virages colorés',
        peauIdeale: 'PMU virant orange/bleu'
      }
    ],

    materiel: [
      {
        nom: 'Solutions détatouage',
        description: 'Acides spécialisés + saline',
        prixIndicatif: '150€/kit',
        avantages: ['Non-médical', 'Progressif et contrôlé']
      },
      {
        nom: 'Pigments correcteurs',
        description: 'Couleurs neutralisantes',
        prixIndicatif: '100€/couleur',
        avantages: ['Correction virages']
      }
    ],

    roi: {
      coutFormation: 1800,
      coutConsommablesParSeance: 40,
      prixVenteMoyen: 200,
      seuilRentabiliteSeances: 12,
      gainAnnuelEstime: 'Marché correction PMU ratés en croissance',
      tempsAmortissement: '2-3 mois'
    },

    faq: [
      {
        question: 'Différence avec laser médical ?',
        reponse: 'Laser = destruction thermique rapide, médical uniquement. Lightening = éclaircissement progressif, autorisé esthéticiennes.'
      },
      {
        question: 'Pourquoi pas couleur chair pour camoufler ?',
        reponse: 'ERREUR classique ! Couleur chair = opaque, vieillit mal, effet "correcteur mal étalé". Toujours éclaircir d\'abord.'
      }
    ],

    glossaire: [
      { terme: 'Lightening', definition: 'Éclaircissement progressif pigments PMU' },
      { terme: 'Virage coloré', definition: 'Modification couleur PMU avec le temps' },
      { terme: 'Neutralisation', definition: 'Correction par couleur complémentaire' },
      { terme: 'Méthode saline', definition: 'Extraction douce par solution salée' }
    ],

    reglementation: 'Hygiène + 3 mois pratique PMU minimum. Détatouage laser reste médical.',

    contreIndications: [
      'PMU trop récents (<3 mois)',
      'Peau fragile/abîmée',
      'Attentes irréalistes',
      'Grossesse'
    ],

    publicCible: ['Praticiennes PMU expérimentées', 'Spécialisation correction', 'Formation perfectionnement'],

    duree: '2 jours (14 heures)',
    prix: '1 800 € HT'
  }
]

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

export function getFormationBySlug(slug: string): FormationEnriched | undefined {
  return FORMATIONS_ENRICHIES.find(formation => formation.slug === slug)
}

export function getFormationsByCategorie(categorie: FormationEnriched['categorie']): FormationEnriched[] {
  return FORMATIONS_ENRICHIES.filter(formation => formation.categorie === categorie)
}

// ============================================================
// PARCOURS RECOMMANDÉ — Escalier logique des formations
// ============================================================

export const PARCOURS_RECOMMANDE = [
  {
    etape: 1,
    niveau: 'Prérequis légal',
    formations: ['hygiene-salubrite'],
    description: 'Certification obligatoire avant toute pratique PMU'
  },
  {
    etape: 2,
    niveau: 'Initiation',
    formations: ['maquillage-permanent-initiation'],
    description: 'Bases fondamentales 3 zones visage'
  },
  {
    etape: 3,
    niveau: 'Spécialisation',
    formations: ['microblading-microshading', 'candy-lips-lip-blush', 'eyeliner-lash-liner'],
    description: 'Perfectionnement par zone spécifique'
  },
  {
    etape: 4,
    niveau: 'Expert',
    formations: ['tricopigmentation', 'dermopigmentation-reparatrice'],
    description: 'Techniques avancées et niches rentables'
  },
  {
    etape: 5,
    niveau: 'Diversification',
    formations: ['nanoneedling-bb-glow', 'peeling-chimique', 'laser-ipl-epilation'],
    description: 'Soins complémentaires et nouvelles technologies'
  },
  {
    etape: 6,
    niveau: 'Perfectionnement',
    formations: ['detatouage-sans-laser'],
    description: 'Correction et services premium'
  }
] as const

// ============================================================
// TABLEAU ROI COMPARATIF — Résumé toutes formations
// ============================================================

export const TABLEAU_ROI_COMPARATIF = [
  {
    formation: 'Hygiène et Salubrité',
    cout: 490,
    prixSeance: 0,
    rentabilite: 'Obligatoire légal',
    particularite: 'Prérequis absolu'
  },
  {
    formation: 'PMU Initiation',
    cout: 2300,
    prixSeance: 350,
    rentabilite: '15 séances (2 mois)',
    particularite: 'Base indispensable'
  },
  {
    formation: 'Microblading & Microshading',
    cout: 1800,
    prixSeance: 400,
    rentabilite: '5 séances (1 mois)',
    particularite: 'Segment le plus demandé'
  },
  {
    formation: 'Candy Lips',
    cout: 1500,
    prixSeance: 400,
    rentabilite: '4 séances (3 semaines)',
    particularite: 'Forte demande 2025'
  },
  {
    formation: 'Eyeliner & Lash Liner',
    cout: 1500,
    prixSeance: 350,
    rentabilite: '5 séances (1 mois)',
    particularite: 'Croissance continue'
  },
  {
    formation: 'Dermopigmentation Réparatrice',
    cout: 2500,
    prixSeance: 800,
    rentabilite: '4 séances (différenciation)',
    particularite: 'Dimension sociale forte'
  },
  {
    formation: 'Tricopigmentation',
    cout: 2250,
    prixSeance: 1200,
    rentabilite: '2 séances seulement',
    particularite: 'Plus lucrative/heure'
  },
  {
    formation: 'Nanoneedling & BB Glow',
    cout: 600,
    prixSeance: 100,
    rentabilite: '10 séances (<1 mois)',
    particularite: 'ROI le plus rapide'
  },
  {
    formation: 'Peeling Chimique',
    cout: 450,
    prixSeance: 80,
    rentabilite: '7 séances (1 mois)',
    particularite: 'Investissement minimal'
  },
  {
    formation: 'Laser & IPL Épilation',
    cout: 1800,
    prixSeance: 80,
    rentabilite: '30 jours si 10/jour',
    particularite: 'Machine 15-20k€'
  },
  {
    formation: 'Détatouage sans Laser',
    cout: 1800,
    prixSeance: 200,
    rentabilite: '12 séances (2-3 mois)',
    particularite: 'Marché correction croissant'
  }
] as const

// ============================================================
// CONSTANTES SUPPLÉMENTAIRES
// ============================================================

export const CATEGORIES_FORMATIONS = {
  'dermopigmentation': {
    nom: 'Dermopigmentation',
    description: 'Maquillage permanent et techniques d\'implantation pigments',
    icone: '🎨'
  },
  'tricopigmentation': {
    nom: 'Tricopigmentation',
    description: 'Micropigmentation cuir chevelu et camouflage calvitie',
    icone: '💇‍♂️'
  },
  'soins-visage': {
    nom: 'Soins du visage',
    description: 'Techniques de soin et rajeunissement cutané',
    icone: '✨'
  },
  'laser-ipl': {
    nom: 'Laser & IPL',
    description: 'Technologies laser et lumière pulsée',
    icone: '⚡'
  },
  'reglementaire': {
    nom: 'Réglementaire',
    description: 'Formations obligatoires et mises aux normes',
    icone: '📋'
  }
} as const

export const STATISTIQUES_FORMATIONS = {
  totalFormations: FORMATIONS_ENRICHIES.length,
  coutMoyenne: Math.round(FORMATIONS_ENRICHIES.reduce((acc, f) => acc + f.roi.coutFormation, 0) / FORMATIONS_ENRICHIES.length),
  prixMoyenSeance: Math.round(FORMATIONS_ENRICHIES.filter(f => f.roi.prixVenteMoyen > 0).reduce((acc, f) => acc + f.roi.prixVenteMoyen, 0) / FORMATIONS_ENRICHIES.filter(f => f.roi.prixVenteMoyen > 0).length),
  dureeMinimale: '7 heures',
  dureeMaximale: '35 heures'
} as const