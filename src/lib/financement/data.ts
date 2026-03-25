// Données structurées complètes sur les financements formation esthétique
// CRM Dermotec - Centre de formation esthétique certifié Qualiopi

import {
  OrganismeFinancement,
  ChecklistFinancement,
  CasMontageFinancier,
  MotifRefus
} from '@/types/formations-content'

// ============================================================
// SECTION A — ORGANISMES DE FINANCEMENT
// ============================================================

export const ORGANISMES_FINANCEMENT: OrganismeFinancement[] = [
  {
    id: 'opco-ep',
    nom: 'Opérateur de Compétences des Entreprises de Proximité',
    sigle: 'OPCO EP',
    description: 'Interlocuteur naturel des instituts de beauté et parfumeries indépendantes, branche esthétique-cosmétique IDCC 3032. Plan de Développement des Compétences (PDC) pour entreprises <50 salariés.',
    publicEligible: [
      'Salariés en CDI',
      'Salariés en CDD',
      'Apprentis',
      'Entreprises <50 salariés branche esthétique IDCC 3032'
    ],
    tauxHoraire: {
      technique: 25,
      transverse: 30,
      unite: '€/heure/stagiaire'
    },
    plafondAnnuel: {
      min: 2500,
      max: 3500,
      description: 'HT selon enveloppes de branche, pour entreprises <11 salariés'
    },
    fraisAnnexes: {
      nuitee: 104,
      repas: 19,
      transportParKm: 0.32
    },
    delaiTraitement: '4 semaines en moyenne',
    tauxAcceptation: 'Élevé si budget annuel non consommé',
    documentsRequis: [
      'Devis',
      'Programme de formation',
      'Convention de formation',
      'RIB de l\'organisme de formation'
    ],
    urlPortail: 'https://www.opcoep.fr',
    scriptCommercial: 'Bonjour Madame, j\'ai bien reçu votre demande pour la formation. Avant de parler technique, j\'ai vérifié vos droits : votre institut dépend de l\'OPCO EP. Savez-vous que vous disposez d\'un budget annuel qui expire en décembre? L\'État et votre branche ont provisionné des fonds pour que vous puissiez monter en gamme. Cette formation peut être prise en charge à 100% grâce à votre enveloppe PDC. En réalité, cela ne vous coûte rien, car vous avez déjà cotisé pour cela tout au long de l\'année.',
    pointsVigilance: [
      'Budgets de branche souvent épuisés dès le 2nd semestre',
      'Dépôt au moins 1 mois avant le début',
      'Vérifier SIRET à jour sur le portail',
      'Transition écologique : ligne spécifique 25€/h hors plafond'
    ]
  },
  {
    id: 'akto',
    nom: 'AKTO — Opérateur de Compétences des Services',
    sigle: 'AKTO',
    description: 'OPCO couvrant les grandes chaînes de parfumerie, commerce de gros et services. Propose des actions collectives 100% financées hors budget annuel.',
    publicEligible: [
      'Salariés grandes chaînes parfumerie',
      'Commerce de gros',
      'Services'
    ],
    tauxHoraire: {
      technique: 60,
      transverse: 60,
      unite: '€/heure (vente/marketing)'
    },
    plafondAnnuel: {
      min: 6000,
      max: 6000,
      description: '<11 salariés, budget basé sur 80% contribution conventionnelle pour 11-49 sal.'
    },
    fraisAnnexes: {
      nuitee: 150,
      repas: 25,
      transportParKm: null
    },
    delaiTraitement: '3 semaines pour actions collectives',
    tauxAcceptation: 'Excellent pour actions collectives',
    documentsRequis: [
      'Devis',
      'Programme de formation',
      'Convention de formation',
      'Attestation employeur'
    ],
    urlPortail: 'https://www.akto.fr',
    scriptCommercial: 'Votre entreprise cotise à l\'OPCO AKTO. Bonne nouvelle : l\'Espace Formation propose des actions collectives dont les coûts pédagogiques sont 100% pris en charge SANS déduction de votre budget annuel.',
    pointsVigilance: [
      'Espace Formation = 100% financé hors budget',
      'Règles différenciées selon taille entreprise et branche',
      'Actions collectives limitées en nombre de places'
    ]
  },
  {
    id: 'fafcea',
    nom: 'Fonds d\'Assurance Formation des Chefs d\'Entreprise Artisanale',
    sigle: 'FAFCEA',
    description: 'Organisme de financement pour les esthéticiennes indépendantes inscrites à la Chambre des Métiers et de l\'Artisanat. 100 heures/an maximum.',
    publicEligible: [
      'Esthéticiennes indépendantes inscrites CMA',
      'Auto-entrepreneuses artisanes',
      'Gérant(e)s TNS'
    ],
    tauxHoraire: {
      technique: 35,
      transverse: 25,
      unite: '€/heure'
    },
    plafondAnnuel: {
      min: 100,
      max: 100,
      description: 'heures/an, dont 50h spécifiques esthétique'
    },
    fraisAnnexes: {
      nuitee: 200,
      repas: null,
      transportParKm: null
    },
    delaiTraitement: 'Remboursement post-formation ou subrogation si OF agréé',
    tauxAcceptation: 'Élevé si budget non consommé',
    documentsRequis: [
      'Attestation CFP (URSSAF)',
      'Extrait D1 (CMA)',
      'Diplôme d\'esthétique (pour stages techniques)',
      'Devis',
      'Programme détaillé'
    ],
    urlPortail: 'https://www.fafcea.com',
    scriptCommercial: 'En tant qu\'indépendante inscrite à la Chambre des Métiers, vous avez un budget FAFCEA qui se renouvelle chaque janvier : 100 heures de formation financées. Avez-vous utilisé vos heures cette année? Si non, cet argent est perdu en décembre.',
    pointsVigilance: [
      'Diplôme esthétique EXIGÉ pour financement stages techniques (PMU, dermopig)',
      'Stages transverses (gestion) : pas de diplôme exigé',
      'Renouvellement des heures chaque 1er janvier',
      'Budget souvent consommé rapidement'
    ]
  },
  {
    id: 'fifpl',
    nom: 'Fonds Interprofessionnel de Formation des Professionnels Libéraux',
    sigle: 'FIFPL',
    description: 'Fonds pour les esthéticiennes en profession libérale (code NAF 8690F ou 9604Z). Plafond annuel limité mais prise en charge partielle possible.',
    publicEligible: [
      'Esthéticiennes en profession libérale',
      'Code NAF 8690F ou 9604Z',
      'Travailleurs indépendants inscrits URSSAF (hors RM)'
    ],
    tauxHoraire: {
      technique: 150,
      transverse: 250,
      unite: '€/jour'
    },
    plafondAnnuel: {
      min: 600,
      max: 1000,
      description: 'par an, E-learning limité à 50% des critères journaliers'
    },
    fraisAnnexes: {
      nuitee: null,
      repas: null,
      transportParKm: null
    },
    delaiTraitement: 'Dossier au plus tard 10 jours après le début de la formation',
    tauxAcceptation: 'Moyen, dépend du budget annuel',
    documentsRequis: [
      'Attestation URSSAF',
      'RIB personnel',
      'Devis',
      'Programme détaillé'
    ],
    urlPortail: 'https://www.fifpl.fr',
    scriptCommercial: 'En tant que professionnelle libérale, vous dépendez du FIFPL. Votre plafond annuel est limité mais peut couvrir une partie significative de votre formation.',
    pointsVigilance: [
      'Plafond annuel très limité (600-1000€)',
      'Seuls coûts pédagogiques éligibles (pas de repas)',
      'E-learning = -50%',
      'Délai strict 10 jours après début'
    ]
  },
  {
    id: 'france-travail-aif',
    nom: 'France Travail — Aide Individuelle à la Formation',
    sigle: 'AIF',
    description: 'Aide pour les demandeurs d\'emploi en reconversion. Complément idéal au CPF. Validation conseiller obligatoire.',
    publicEligible: [
      'Demandeurs d\'emploi en reconversion',
      'Inscrits France Travail'
    ],
    tauxHoraire: {
      technique: 0,
      transverse: 0,
      unite: 'forfait selon projet'
    },
    plafondAnnuel: {
      min: 1500,
      max: 1500,
      description: 'selon directions régionales, en complément du CPF'
    },
    fraisAnnexes: {
      nuitee: null,
      repas: null,
      transportParKm: null
    },
    delaiTraitement: '2-4 semaines selon région',
    tauxAcceptation: 'Variable selon conseiller et budget régional',
    documentsRequis: [
      'Devis dématérialisé (plateforme Kairos)',
      'Projet de formation validé par conseiller',
      'RIB de l\'organisme de formation'
    ],
    urlPortail: 'https://www.francetravail.fr',
    scriptCommercial: 'En tant que demandeur d\'emploi, vous pouvez bénéficier de l\'AIF pour compléter votre CPF. Nous allons déposer un devis sur la plateforme Kairos pour que votre conseiller valide le projet.',
    pointsVigilance: [
      'PAS automatique : dépend du conseiller et du budget régional',
      'Complément CPF idéal',
      'Devis dématérialisé obligatoire sur Kairos'
    ]
  },
  {
    id: 'cpf',
    nom: 'Compte Personnel de Formation',
    sigle: 'CPF',
    description: 'Compte individuel de tous les actifs. Formations certifiantes RNCP uniquement. Reste à charge de 100€ depuis mai 2024, exonération possible.',
    publicEligible: [
      'Tous les actifs (salariés, indépendants, DE)'
    ],
    tauxHoraire: {
      technique: 0,
      transverse: 0,
      unite: 'droits acquis'
    },
    plafondAnnuel: {
      min: 500,
      max: 5000,
      description: 'droits acquis selon statut, non cessibles'
    },
    fraisAnnexes: {
      nuitee: null,
      repas: null,
      transportParKm: null
    },
    delaiTraitement: 'Immédiat si droits suffisants',
    tauxAcceptation: 'Automatique si RNCP et droits',
    documentsRequis: [
      'Inscription sur MonCompteFormation',
      'Pièce d\'identité'
    ],
    urlPortail: 'https://www.moncompteformation.gouv.fr',
    scriptCommercial: 'Je comprends que ces 100€ soient inattendus. Cependant, si votre employeur accepte de verser ne serait-ce que 1€ d\'abondement sur votre compte, vous êtes automatiquement exonérée de ces 100€. C\'est une mesure de l\'État pour encourager le dialogue social. Voulez-vous que nous préparions ensemble le document pour votre gérante?',
    pointsVigilance: [
      'Reste à charge 100€ depuis mai 2024',
      'Astuce abondement employeur 1€ = exonération',
      'RNCP uniquement',
      'Non cessible (pas de transfert à un proche)',
      'Sur temps de travail = accord employeur obligatoire'
    ]
  },
  {
    id: 'agefiph',
    nom: 'Association de Gestion du Fonds pour l\'Insertion Professionnelle des Personnes Handicapées',
    sigle: 'AGEFIPH',
    description: 'Organisme spécialisé dans l\'accompagnement des travailleurs en situation de handicap. Aides complémentaires et adaptations parcours.',
    publicEligible: [
      'Personnes en situation de handicap',
      'Travailleurs handicapés (RQTH)'
    ],
    tauxHoraire: {
      technique: 0,
      transverse: 0,
      unite: 'selon projet'
    },
    plafondAnnuel: {
      min: 3000,
      max: 3000,
      description: 'aides complémentaires, adaptations parcours'
    },
    fraisAnnexes: {
      nuitee: null,
      repas: null,
      transportParKm: null
    },
    delaiTraitement: '4-6 semaines',
    tauxAcceptation: 'Élevé avec dossier complet',
    documentsRequis: [
      'Reconnaissance RQTH',
      'Projet professionnel',
      'Devis',
      'Attestation référent handicap'
    ],
    urlPortail: 'https://www.agefiph.fr',
    scriptCommercial: 'Votre reconnaissance RQTH vous ouvre des droits spécifiques AGEFIPH. Ces aides peuvent compléter votre CPF ou financement principal, notamment pour les adaptations de poste.',
    pointsVigilance: [
      'Reconnaissance RQTH obligatoire',
      'Aides complémentaires, pas financement principal',
      'Adaptations matérielles possibles'
    ]
  },
  {
    id: 'transitions-pro',
    nom: 'Transitions Pro (ex-FONGECIF) — Projet de Transition Professionnelle',
    sigle: 'PTP',
    description: 'Pour les reconversions longues (CAP Esthétique 1 an par exemple). Salaire maintenu pendant la formation. Sélection rigoureuse.',
    publicEligible: [
      'Salariés en reconversion',
      'Formation longue certifiante (ex: CAP Esthétique 1 an)'
    ],
    tauxHoraire: {
      technique: 0,
      transverse: 0,
      unite: 'prise en charge intégrale'
    },
    plafondAnnuel: {
      min: 18000,
      max: 18000,
      description: 'salaire maintenu pendant formation'
    },
    fraisAnnexes: {
      nuitee: 65,
      repas: 15,
      transportParKm: 0.20
    },
    delaiTraitement: '4 mois (commission trimestrielle)',
    tauxAcceptation: 'Faible, sélection rigoureuse',
    documentsRequis: [
      'Projet professionnel détaillé',
      'Attestation employeur',
      'Devis formation certifiante',
      'CV et lettre motivation'
    ],
    urlPortail: 'https://www.transitionspro.fr',
    scriptCommercial: 'Si vous envisagez une reconversion complète avec un CAP Esthétique par exemple, le PTP peut maintenir votre salaire pendant 1 an. C\'est un investissement de l\'État dans votre projet professionnel.',
    pointsVigilance: [
      'Formations longues uniquement (>6 mois)',
      'Dossier très sélectif',
      'Commission trimestrielle',
      'Retour dans l\'entreprise possible selon accord'
    ]
  }
]

// ============================================================
// SECTION B — CHECKLISTS PAR PROFIL
// ============================================================

export const CHECKLISTS_FINANCEMENT: ChecklistFinancement[] = [
  {
    profil: 'Salarié(e)',
    description: 'Entreprise <50 salariés, branche esthétique IDCC 3032',
    organismeId: 'opco-ep',
    documents: [
      'Devis détaillé',
      'Programme de formation',
      'Convention de formation',
      'RIB de l\'organisme de formation',
      'Attestation employeur'
    ],
    etapes: [
      'Vérification SIRET entreprise sur portail OPCO',
      'Simulation budget annuel disponible',
      'Dépôt dossier 1 mois avant début formation',
      'Instruction et vérification certification Qualiopi',
      'Accord de prise en charge (APC)',
      'Émargement quotidien obligatoire',
      'Facturation en subrogation ou remboursement'
    ],
    delaiEstime: '4 semaines'
  },
  {
    profil: 'Indépendant(e) / Artisan(e)',
    description: 'Inscrite Chambre des Métiers et de l\'Artisanat',
    organismeId: 'fafcea',
    documents: [
      'Attestation CFP (URSSAF)',
      'Extrait D1 (CMA)',
      'Diplôme d\'esthétique (stages techniques)',
      'Devis détaillé',
      'Programme de formation'
    ],
    etapes: [
      'Vérification inscription CMA à jour',
      'Contrôle heures déjà consommées dans l\'année',
      'Validation diplôme si formation technique',
      'Dépôt dossier avant début formation',
      'Émargement et attestation de présence',
      'Remboursement post-formation'
    ],
    delaiEstime: '2-3 semaines'
  },
  {
    profil: 'Libéral(e)',
    description: 'Profession libérale, code NAF 8690F ou 9604Z',
    organismeId: 'fifpl',
    documents: [
      'Attestation URSSAF à jour',
      'RIB personnel',
      'Devis détaillé',
      'Programme détaillé de formation'
    ],
    etapes: [
      'Vérification code NAF éligible',
      'Contrôle plafond annuel non dépassé',
      'Dépôt au plus tard 10 jours après début',
      'Émargement et certificat de réalisation',
      'Remboursement selon barème'
    ],
    delaiEstime: '3-4 semaines'
  },
  {
    profil: 'Demandeur d\'emploi',
    description: 'Inscrit(e) France Travail, projet de reconversion',
    organismeId: 'france-travail-aif',
    documents: [
      'Devis dématérialisé (plateforme Kairos)',
      'Projet de formation validé par conseiller',
      'RIB de l\'organisme de formation',
      'Attestation inscription France Travail'
    ],
    etapes: [
      'Rendez-vous conseiller France Travail',
      'Validation projet dans PPAE',
      'Dépôt devis sur plateforme Kairos',
      'Instruction par service formation',
      'Accord de financement',
      'Suivi formation avec conseiller'
    ],
    delaiEstime: '2-4 semaines'
  },
  {
    profil: 'Apprenti(e)',
    description: 'Contrat d\'apprentissage en cours',
    organismeId: 'opco-ep',
    documents: [
      'Contrat CERFA d\'apprentissage',
      'Convention de formation CFA',
      'Certificat Qualiopi CFA',
      'Calendrier d\'alternance'
    ],
    etapes: [
      'Vérification contrat apprentissage enregistré',
      'Contrôle certification Qualiopi CFA',
      'Dépôt demande de prise en charge',
      'Émargement apprenti + maître apprentissage',
      'Facturation directe OPCO'
    ],
    delaiEstime: '3 semaines'
  }
]

// ============================================================
// SECTION C — CAS DE MONTAGE FINANCIER
// ============================================================

export const CAS_MONTAGE_FINANCIER: CasMontageFinancier[] = [
  {
    id: 'marie-salariee-franchise',
    prenom: 'Marie',
    age: 28,
    profil: 'Salariée Yves Rocher (franchise)',
    contexte: 'Institut de beauté franchise <50 salariés, souhaite formation dermopigmentation sourcils',
    financeur: 'OPCO EP',
    montage: 'Plan de Développement des Compétences (PDC), 30€/h transverse',
    resultat: '100% financé, salaire maintenu, 0€ d\'avance',
    montantFormation: 1200,
    montantPrisEnCharge: 1200,
    resteACharge: 0
  },
  {
    id: 'fatou-auto-entrepreneur',
    prenom: 'Fatou',
    age: 35,
    profil: 'Auto-entrepreneuse artisane',
    contexte: '30K€ CA annuel, inscrite CMA, formation rehaussement cils 14h',
    financeur: 'FAFCEA',
    montage: '35€/h technique, stage 14h = 490€ financé sur 800€',
    resultat: 'Reste 310€, frais déplacement 200€ récupérables',
    montantFormation: 800,
    montantPrisEnCharge: 490,
    resteACharge: 310
  },
  {
    id: 'sophie-reconversion-de',
    prenom: 'Sophie',
    age: 42,
    profil: 'Demandeur d\'emploi reconversion',
    contexte: 'Ex-secrétaire, reconversion esthétique, CAP Esthétique 1 an',
    financeur: 'CPF + AIF',
    montage: 'CPF 1500€ + AIF 1000€ pour CAP 2500€',
    resultat: '100% financé, exonérée 100€ CPF (statut DE)',
    montantFormation: 2500,
    montantPrisEnCharge: 2500,
    resteACharge: 0
  },
  {
    id: 'lea-gerante-double-dossier',
    prenom: 'Léa',
    age: 30,
    profil: 'Gérante SARL, 2 salariées',
    contexte: 'Institut 3 personnes, formation collective micro-needling',
    financeur: 'OPCO EP + FAFCEA',
    montage: 'Double dossier : OPCO EP 25€/h pour les 2 employées + FAFCEA pour elle-même',
    resultat: 'Optimisation maximale fonds mutualisés',
    montantFormation: 3600,
    montantPrisEnCharge: 3600,
    resteACharge: 0
  },
  {
    id: 'nour-salariee-hypermarche',
    prenom: 'Nour',
    age: 25,
    profil: 'Salariée hypermarché rayon cosmétique',
    contexte: 'Grande surface, rayon parfumerie, formation conseil beauté',
    financeur: 'AKTO',
    montage: 'Actions collectives branche commerce gros, 100% financé hors budget annuel',
    resultat: 'Aucune déduction budget magasin',
    montantFormation: 1200,
    montantPrisEnCharge: 1200,
    resteACharge: 0
  }
]

// ============================================================
// SECTION D — MOTIFS DE REFUS FRÉQUENTS
// ============================================================

export const MOTIFS_REFUS: MotifRefus[] = [
  {
    motif: 'Incohérence durée convention/certificat de réalisation',
    frequence: 'frequent',
    cause: 'Convention 14h mais certificat 13h30 → blocage paiement intégral',
    solution: 'Toujours vérifier concordance exacte des heures',
    prevention: 'Double contrôle formateur + administratif en fin de formation'
  },
  {
    motif: 'Signature émargement manquante',
    frequence: 'frequent',
    cause: 'Une seule demi-journée non signée → rejet facture complète',
    solution: 'Sensibiliser le client à CHAQUE émargement',
    prevention: 'Vérifier émargements en temps réel, rappel formateur'
  },
  {
    motif: 'SIRET non à jour',
    frequence: 'frequent',
    cause: 'Déménagement ou changement forme juridique → "SIRET inexistant"',
    solution: 'Toujours vérifier le SIRET sur le portail OPCO avant dépôt',
    prevention: 'Contrôle systématique SIRET lors de la prise de commande'
  },
  {
    motif: 'Budget annuel épuisé',
    frequence: 'frequent',
    cause: 'Épuisement budgets 2nd semestre, surtout septembre-novembre',
    solution: 'Basculer sur budget N+1 ou mobiliser CPF avec abondement employeur',
    prevention: 'Alerter clients dès juillet sur consommation budget'
  },
  {
    motif: 'Salaire apprenti inférieur grille légale',
    frequence: 'occasionnel',
    cause: 'Refus OPCO si salaire < minimum légal selon âge et année',
    solution: 'Vérifier grille salariale apprentissage avant signature contrat',
    prevention: 'Formation maîtres apprentissage sur grilles obligatoires'
  },
  {
    motif: 'Diplôme exigé absent',
    frequence: 'occasionnel',
    cause: 'FAFCEA exige diplôme esthétique pour stages techniques (PMU, dermopig)',
    solution: 'Orienter vers stages transverses (gestion) si pas de diplôme',
    prevention: 'Qualifier diplômes en amont lors du premier contact'
  }
]

// ============================================================
// SECTION E — FONCTIONS UTILITAIRES
// ============================================================

export function getOrganismeById(id: string): OrganismeFinancement | undefined {
  return ORGANISMES_FINANCEMENT.find(org => org.id === id)
}

export function getOrganismeParProfil(
  profil: 'salarie' | 'independant' | 'liberal' | 'demandeur-emploi' | 'apprenti'
): OrganismeFinancement[] {
  const mapping = {
    salarie: ['opco-ep', 'akto', 'cpf'],
    independant: ['fafcea', 'cpf'],
    liberal: ['fifpl', 'cpf'],
    'demandeur-emploi': ['france-travail-aif', 'cpf'],
    apprenti: ['opco-ep']
  }

  return ORGANISMES_FINANCEMENT.filter(org => mapping[profil].includes(org.id))
}

export function getChecklistParProfil(profil: string): ChecklistFinancement | undefined {
  return CHECKLISTS_FINANCEMENT.find(checklist =>
    checklist.profil.toLowerCase().includes(profil.toLowerCase())
  )
}

export function calculerFinancement(
  montantFormation: number,
  organismeId: string,
  dureeHeures: number
): { montantPrisEnCharge: number; resteACharge: number; details: string } {
  const organisme = getOrganismeById(organismeId)

  if (!organisme) {
    return {
      montantPrisEnCharge: 0,
      resteACharge: montantFormation,
      details: 'Organisme non trouvé'
    }
  }

  let montantPrisEnCharge = 0
  let details = ''

  switch (organismeId) {
    case 'opco-ep':
      const tauxHeure = dureeHeures > 21 ? organisme.tauxHoraire.technique : organisme.tauxHoraire.transverse
      montantPrisEnCharge = Math.min(dureeHeures * tauxHeure, montantFormation, organisme.plafondAnnuel.max)
      details = `${dureeHeures}h × ${tauxHeure}€/h = ${dureeHeures * tauxHeure}€ (plafonné ${organisme.plafondAnnuel.max}€)`
      break

    case 'fafcea':
      const heuresMax = Math.min(dureeHeures, 50) // 50h techniques max
      montantPrisEnCharge = Math.min(heuresMax * organisme.tauxHoraire.technique, montantFormation)
      details = `${heuresMax}h × ${organisme.tauxHoraire.technique}€/h = ${heuresMax * organisme.tauxHoraire.technique}€`
      break

    case 'fifpl':
      const joursFormation = Math.ceil(dureeHeures / 7) // 7h/jour
      montantPrisEnCharge = Math.min(joursFormation * organisme.tauxHoraire.technique, organisme.plafondAnnuel.max)
      details = `${joursFormation} jours × ${organisme.tauxHoraire.technique}€ = ${joursFormation * organisme.tauxHoraire.technique}€ (plafonné ${organisme.plafondAnnuel.max}€)`
      break

    case 'cpf':
      // Simulation CPF : dépend des droits acquis (non calculable sans API)
      montantPrisEnCharge = Math.min(montantFormation - 100, montantFormation) // -100€ reste à charge
      details = 'Dépend des droits acquis (reste à charge 100€ si pas d\'abondement)'
      break

    case 'france-travail-aif':
      montantPrisEnCharge = Math.min(organisme.plafondAnnuel.max, montantFormation)
      details = `AIF plafonné ${organisme.plafondAnnuel.max}€`
      break

    default:
      montantPrisEnCharge = 0
      details = 'Calcul non disponible pour cet organisme'
  }

  return {
    montantPrisEnCharge,
    resteACharge: montantFormation - montantPrisEnCharge,
    details
  }
}

export function identifierOrganisme(siret: string, statut: string): string[] {
  const organismesPossibles: string[] = []

  // Logique simplifiée d'identification basée sur le statut
  if (statut.includes('salarié') || statut.includes('CDI') || statut.includes('CDD')) {
    organismesPossibles.push('opco-ep', 'akto', 'cpf')
  }

  if (statut.includes('indépendant') || statut.includes('auto-entrepreneur') || statut.includes('artisan')) {
    organismesPossibles.push('fafcea', 'cpf')
  }

  if (statut.includes('libéral')) {
    organismesPossibles.push('fifpl', 'cpf')
  }

  if (statut.includes('demandeur') || statut.includes('chômage')) {
    organismesPossibles.push('france-travail-aif', 'cpf')
  }

  if (statut.includes('apprenti')) {
    organismesPossibles.push('opco-ep')
  }

  if (statut.includes('handicap') || statut.includes('RQTH')) {
    organismesPossibles.push('agefiph')
  }

  return organismesPossibles
}

// ============================================================
// DONNÉES DE RÉFÉRENCE COMPLÉMENTAIRES
// ============================================================

export const CODES_NAF_ELIGIBLES = {
  'opco-ep': ['9602A', '9602B', '4775Z', '4791B'],
  'akto': ['4775Z', '4791A', '4791B', '4799A'],
  'fafcea': ['9602A', '9602B'],
  'fifpl': ['8690F', '9604Z']
}

export const DELAIS_PRESCRIPTION = {
  'opco-ep': '3 mois après fin formation',
  'akto': '6 mois après fin formation',
  'fafcea': '12 mois après fin formation',
  'fifpl': '3 mois après fin formation',
  'france-travail-aif': '6 mois après fin formation'
}

export const TAUX_REUSSITE_PAR_ORGANISME = {
  'opco-ep': 85, // %
  'akto': 92,
  'fafcea': 78,
  'fifpl': 65,
  'france-travail-aif': 70,
  'cpf': 95,
  'agefiph': 88,
  'transitions-pro': 45,
}

// ============================================================
// SECTION F — GUIDE COMMERCIAL AVANCÉ (Subtilités métier)
// Issu de recherche approfondie réglementation 2025-2026
// ============================================================

/**
 * CHECKLIST VÉRIFICATION 2 MINUTES
 * Le commercial doit poser ces 6 questions pour orienter immédiatement le prospect.
 */
export const CHECKLIST_VERIFICATION_RAPIDE = [
  {
    ordre: 1,
    question: 'Quel est votre statut : salariée (CDI/CDD), gérante non salariée (TNS), libérale, ou demandeuse d\'emploi ?',
    objectif: 'Identifier le financeur principal',
    orientationResultat: {
      'salariee': 'opco-ep',
      'gerante-tns': 'fafcea',
      'liberale': 'fifpl',
      'demandeuse-emploi': 'france-travail-aif',
      'apprentie': 'opco-ep',
    },
  },
  {
    ordre: 2,
    question: 'Pouvez-vous me confirmer votre SIRET et votre code APE/NAFA ?',
    objectif: 'Vérifier éligibilité et branche (IDCC 3032 = OPCO EP, Répertoire des Métiers = FAFCEA)',
    documentRequis: 'Kbis ou extrait RM < 1 an',
  },
  {
    ordre: 3,
    question: 'Avez-vous un solde CPF ? Si oui, quel montant approximatif ?',
    objectif: 'Évaluer le complément CPF possible pour multi-financement',
    lien: 'moncompteformation.gouv.fr',
  },
  {
    ordre: 4,
    question: 'Avez-vous déjà fait une formation financée cette année ?',
    objectif: 'Vérifier si le plafond annuel est déjà consommé (FAFCEA 100h/an, FIFPL plafond annuel)',
  },
  {
    ordre: 5,
    question: 'À quelle date souhaitez-vous commencer la formation ?',
    objectif: 'Vérifier les délais de dépôt : OPCO EP ≥1 mois avant, FAFCEA jusqu\'au jour de démarrage, FIFPL ≤10 jours après 1er jour',
  },
  {
    ordre: 6,
    question: 'Avez-vous une attestation URSSAF à jour ?',
    objectif: 'Pièce obligatoire pour FAFCEA et FIFPL',
    documentRequis: 'Attestation URSSAF ou justificatif de contribution',
  },
] as const

/**
 * RÈGLES DE CUMUL MULTI-FINANCEMENT
 * Quels financements peuvent être combinés, et lesquels sont incompatibles.
 */
export const REGLES_CUMUL_FINANCEMENT = {
  cumuls_autorises: [
    {
      combinaison: ['cpf', 'france-travail-aif'],
      description: 'CPF + AIF : Le cumul le plus courant. L\'AIF complète le CPF si le solde est insuffisant.',
      conditions: 'Le total ne peut pas dépasser le coût réel de la formation.',
      procedure: 'Le conseiller France Travail valide l\'abondement AIF après vérification du solde CPF.',
    },
    {
      combinaison: ['cpf', 'abondement-employeur'],
      description: 'CPF + Abondement employeur : L\'employeur verse un complément sur le compte CPF du salarié.',
      conditions: 'Décret 2025-341 du 14/04/2025. L\'abondement est traçable et formalisé.',
      avantage: 'Si l\'employeur abonde (même 1€), le salarié est exonéré du reste à charge CPF de 102,23€ (2025) / 103,20€ (2026).',
    },
    {
      combinaison: ['opco-ep', 'fafcea'],
      description: 'OPCO EP (pour les salariées) + FAFCEA (pour la gérante TNS) : Double dossier si la gérante forme aussi ses employées.',
      conditions: 'Deux dossiers séparés. La gérante ne peut pas être financée par l\'OPCO EP (elle n\'est pas salariée).',
      procedure: 'Déposer un dossier OPCO EP pour chaque salariée + un dossier FAFCEA pour la gérante.',
    },
    {
      combinaison: ['cpf', 'agefiph'],
      description: 'CPF + AGEFIPH : Les aides AGEFIPH sont cumulables avec les aides de droit commun.',
      conditions: 'Bénéficiaire RQTH. L\'AGEFIPH complète les autres financements.',
    },
    {
      combinaison: ['cpf', 'transitions-pro'],
      description: 'CPF mobilisé dans le cadre du PTP : Le CPF peut être utilisé pour le projet de transition professionnelle.',
      conditions: 'Formation certifiante RNCP obligatoire. Dossier 120 jours avant le début.',
    },
  ],
  cumuls_interdits: [
    {
      combinaison: ['fafcea', 'fifpl'],
      raison: 'Le bénéficiaire est soit artisan (FAFCEA via CMA) soit libéral (FIFPL via URSSAF). Pas les deux.',
    },
    {
      combinaison: ['opco-ep', 'akto'],
      raison: 'L\'entreprise dépend d\'un seul OPCO selon son code NAF/IDCC. Pas de double rattachement.',
    },
  ],
  regles_generales: [
    'Le total des financements ne peut JAMAIS dépasser le coût réel de la formation.',
    'Chaque financeur exige ses propres justificatifs (pas de document unique pour tous).',
    'Le prestataire ne peut PAS rembourser la participation forfaitaire CPF (102,23€) au stagiaire.',
    'Les formations doivent être Qualiopi pour tout financement public (OPCO, FAFCEA, CPF, AIF).',
  ],
}

/**
 * RESTE À CHARGE CPF — Évolution et exonérations
 */
export const CPF_RESTE_A_CHARGE = {
  montant_2024: 100.00,
  montant_2025: 102.23,
  montant_2026: 103.20,
  base_legale: 'Décret du 29 avril 2024, arrêté du 30 décembre 2025 (revalorisation)',
  exonerations: [
    'Demandeurs d\'emploi inscrits à France Travail',
    'Abondement employeur (même 1€ suffit pour exonérer le salarié)',
    'Abondement OPCO',
    'Utilisation du Compte Professionnel de Prévention (C2P)',
    'Victimes d\'accident du travail ou maladie professionnelle (AT/MP)',
  ],
  astuce_commerciale: 'Si le prospect hésite à cause des 102€ de reste à charge, proposer de faire abonder l\'employeur. Un abondement même symbolique (1€) exonère automatiquement le salarié de la participation forfaitaire. C\'est prévu par le décret 2025-341.',
}

/**
 * SAISONNALITÉ DES INSCRIPTIONS
 * Quand déposer les dossiers pour maximiser les chances d'acceptation.
 */
export const SAISONNALITE_FINANCEMENT = {
  pics: [
    {
      mois: 'Janvier',
      raison: 'Renouvellement des budgets annuels (FAFCEA 100h, OPCO EP enveloppes, CPF). Les prospects se sentent "riches" en droits.',
      action_commerciale: 'Lancer les campagnes en octobre-novembre pour sécuriser les inscriptions de janvier.',
    },
    {
      mois: 'Septembre',
      raison: 'Rentrée professionnelle. Besoin de préparer les prestations de fin d\'année (fêtes, mariages).',
      action_commerciale: 'Proposer dès juin les pré-inscriptions pour la rentrée.',
    },
  ],
  creux: [
    {
      mois: 'Juin',
      raison: 'Pic d\'activité en institut (mariages, événements). Les esthéticiennes ne se forment pas.',
      action_commerciale: 'Période de relance des prospects froids et de préparation des dossiers pour septembre.',
    },
    {
      mois: 'Décembre',
      raison: 'Pic d\'activité (fêtes). Budgets OPCO souvent épuisés au 2nd semestre.',
      action_commerciale: 'Dernière chance de déposer un dossier FAFCEA avant renouvellement janvier. Proposer le split N/N+1 (avec accord écrit du financeur).',
    },
  ],
  alerte_budget: 'Les budgets de branche OPCO EP sont souvent épuisés dès le 2nd semestre. TOUJOURS déposer les dossiers le plus tôt possible (1-3 mois avant la formation). En cas de refus pour budget épuisé : basculer sur CPF + AIF ou reporter sur budget N+1.',
}

/**
 * DÉLAIS DE DÉPÔT PAR ORGANISME — Règles strictes
 */
export const DELAIS_DEPOT = {
  'opco-ep': {
    delai: 'Minimum 1 mois avant le démarrage de la formation',
    consequence_retard: 'Refus de prise en charge',
    conseil: 'Idéalement déposer 2-3 mois avant pour garantir l\'instruction',
  },
  'fafcea': {
    delai: 'Entre 3 mois avant et au plus tard le jour du début de la formation',
    consequence_retard: 'Refus systématique si dossier envoyé après le démarrage',
    conseil: 'Envoyer le dossier complet en UNE SEULE transmission (pas de pièces séparées). Pas de courrier recommandé, uniquement via l\'espace en ligne.',
    delai_paiement: 'Jusqu\'à 2 mois après fin de formation si dossier complet',
  },
  'fifpl': {
    delai: 'Au plus tard 10 jours calendaires après le 1er jour de formation',
    consequence_retard: 'Refus de la demande',
    conseil: 'Justificatifs sous 15 jours après fin de formation pour les dossiers collectifs.',
  },
  'france-travail-aif': {
    delai: 'Validation par le conseiller avant le début (pas de délai fixe)',
    consequence_retard: 'Impossible de valider rétroactivement',
    conseil: 'Délai de réponse du conseiller ≈ 15 jours. Anticiper.',
  },
  'transitions-pro': {
    delai: 'Dossier complet 120 jours (4 mois) avant le démarrage',
    consequence_retard: 'Passage en commission reporté → formation retardée',
    conseil: 'Dossier tripartite (salarié + organisme + employeur). Prévoir 4-6 mois au total.',
  },
}

/**
 * FRAIS ANNEXES REMBOURSABLES PAR ORGANISME
 * Ce que le commercial peut proposer en plus du coût pédagogique.
 */
export const FRAIS_ANNEXES_DETAILLES = {
  'opco-ep': {
    nuitee: { montant: '96€ à 112€/nuit', conditions: 'Sur justificatif, distance > 50km du domicile' },
    repas: { montant: '19€/jour', conditions: 'Forfait, pas de justificatif de montant requis' },
    transport: { montant: '0,32€/km', conditions: 'Barème kilométrique OPCO EP' },
    salaire: { montant: 'Maintien du salaire', conditions: 'Formation sur temps de travail' },
  },
  'fafcea': {
    ancillaires: { montant: '200€ par formation', conditions: 'Nouveau depuis 1er sept 2024. Couvre déplacement/hébergement. Par formation, pas par an.' },
    paiement: { montant: 'Facture HT', conditions: 'Paiement direct à l\'organisme de formation' },
  },
  'fifpl': {
    frais: { montant: 'Aucun frais annexe', conditions: 'Seuls les coûts pédagogiques sont éligibles (pas de repas, pas de transport)' },
  },
  'akto': {
    nuitee: { montant: '150€/nuit (coûts réels plafonnés)', conditions: 'Commerce de gros' },
    repas: { montant: '25€/jour', conditions: 'Commerce de gros' },
    salaire_intra: { montant: '13€/h forfait salaire', conditions: 'Formations intra-entreprise' },
    elearning: { montant: '10€/h', conditions: 'Formations e-learning, plafonné' },
  },
}

/**
 * STRATÉGIES DE REBOND APRÈS REFUS
 * Comment transformer un refus en opportunité.
 */
export const STRATEGIES_REBOND_REFUS = [
  {
    motif_refus: 'Budget annuel épuisé',
    strategie: 'Basculer sur budget N+1',
    script: '"Le refus est lié au dépassement de votre plafond annuel. C\'est en fait une bonne nouvelle, cela signifie que vous êtes une entreprise dynamique qui forme ses équipes. Nous pouvons sécuriser votre place pour janvier quand les budgets se renouvellent. Sinon, nous pouvons mobiliser votre CPF avec un abondement de votre employeur."',
    alternatives: ['CPF + abondement employeur', 'Report sur budget N+1', 'AIF si demandeur d\'emploi'],
  },
  {
    motif_refus: 'SIRET non reconnu / non à jour',
    strategie: 'Correction rapide et redépôt',
    script: '"C\'est un problème administratif simple à résoudre. Vérifiez votre SIRET sur le portail de l\'OPCO et mettez à jour votre Kbis si nécessaire. On redépose dès que c\'est fait, ça prend 5 minutes."',
    alternatives: ['Mise à jour SIRET via CFE/CMA', 'Vérification sur annuaire-entreprises.data.gouv.fr'],
  },
  {
    motif_refus: 'Formation non éligible (pas RNCP)',
    strategie: 'Proposer une formation certifiante alternative ou un autre financeur',
    script: '"Cette formation n\'est pas éligible au CPF car elle n\'est pas certifiante RNCP. Par contre, elle est parfaitement finançable par votre OPCO EP ou votre FAFCEA qui n\'exigent pas le RNCP. On monte le dossier ?"',
    alternatives: ['OPCO EP (pas de condition RNCP)', 'FAFCEA (pas de condition RNCP pour technique)', 'Paiement en 3x sans frais'],
  },
  {
    motif_refus: 'Diplôme esthétique absent (FAFCEA technique)',
    strategie: 'Réorienter vers formations transversales ou autre financeur',
    script: '"Le FAFCEA exige un diplôme d\'esthétique pour les stages techniques comme le microblading. Deux options : soit vous avez un diplôme connexe qu\'on peut joindre, soit on finance via le CPF ou une formation transversale (gestion, relation client) qui ne nécessite pas ce diplôme."',
    alternatives: ['Formations transversales FAFCEA (gestion, commercial)', 'CPF (pas de condition diplôme)', 'OPCO EP si salariée'],
  },
  {
    motif_refus: 'Incohérence documents (durée, émargement)',
    strategie: 'Corriger et redéposer immédiatement',
    script: '"Il y a eu une incohérence entre la convention et le certificat de réalisation. C\'est corrigé, on renvoie les documents conformes aujourd\'hui. Ça arrive souvent, l\'essentiel est de réagir vite."',
    alternatives: ['Vérifier concordance programme/calendrier/attestation AVANT envoi', 'Utiliser émargement digital pour éviter les erreurs'],
  },
]

/**
 * RÉGLEMENTATION TVA POUR ORGANISMES DE FORMATION
 */
export const REGLEMENTATION_TVA_OF = {
  exoneration: {
    article: 'Article 261-4-4° du Code Général des Impôts',
    description: 'Les organismes de formation peuvent être exonérés de TVA sur leurs prestations de formation professionnelle continue.',
    procedure: 'Demande d\'attestation d\'exonération auprès de la DREETS via le formulaire 3511-SD.',
    consequences_positives: [
      'Facturation HT = prix plus attractif pour les clients non assujettis à la TVA (auto-entrepreneuses)',
      'Simplification administrative (pas de déclaration TVA)',
    ],
    consequences_negatives: [
      'Impossible de récupérer la TVA sur les achats (loyers, matériel, supports pédagogiques)',
      'Redevable de la taxe sur les salaires',
      'Si CA mixte (formation + vente matériel), prorata de déduction complexe',
    ],
    quand_ne_pas_exonerer: 'Si l\'OF a beaucoup d\'investissements (matériel NPM coûteux, local), il peut être plus avantageux de rester assujetti à la TVA pour récupérer la TVA sur les achats.',
  },
  taux_applicables: {
    taux_normal: { taux: 20, cas: 'Formation non exonérée (choix de l\'OF ou vente de matériel)' },
    taux_reduit: { taux: 5.5, cas: 'Rare en formation, applicable à certains supports pédagogiques (livres)' },
    exonere: { taux: 0, cas: 'OF avec attestation d\'exonération DREETS (cas le plus fréquent)' },
  },
  impact_commercial: 'Pour un client non assujetti à la TVA (auto-entrepreneuse en franchise), une formation facturée 2000€ HT par un OF exonéré coûte 2000€. La même formation facturée TTC par un OF non exonéré coûte 2400€ (2000€ + 400€ TVA non récupérable). L\'exonération est un avantage commercial majeur.',
}

/**
 * QUALIOPI — Essentiel pour le commercial
 */
export const QUALIOPI_COMMERCIAL = {
  obligatoire_depuis: '1er janvier 2022',
  base_legale: 'Loi Avenir professionnel du 5 septembre 2018',
  impact: 'Sans Qualiopi, AUCUN financement public n\'est possible (OPCO, FAFCEA, CPF, AIF, Transitions Pro).',
  nombre_indicateurs: 32,
  criteres: [
    'Critère 1 : Conditions d\'information du public',
    'Critère 2 : Identification précise des objectifs et adaptation',
    'Critère 3 : Adaptation aux bénéficiaires',
    'Critère 4 : Adéquation des moyens pédagogiques et techniques',
    'Critère 5 : Qualification et compétences des formateurs',
    'Critère 6 : Inscription dans l\'environnement professionnel',
    'Critère 7 : Recueil et prise en compte des appréciations',
  ],
  script_commercial: '"Nous sommes certifiés Qualiopi, ce qui signifie que votre formation peut être prise en charge par votre OPCO, le FAFCEA ou le CPF. C\'est notre certification qui rend le financement possible — c\'est votre garantie de qualité ET de gratuité."',
  renouvellement: 'Audit initial + audit de surveillance à mi-parcours + renouvellement tous les 3 ans',
}

/**
 * NDA — Numéro de Déclaration d'Activité
 */
export const NDA_INFO = {
  description: 'Numéro unique attribué par la DREETS à tout organisme de formation.',
  obligation: 'Doit figurer sur toutes les conventions et factures de formation.',
  maintien: 'Le NDA doit être "nourri" chaque année par le Bilan Pédagogique et Financier (BPF).',
  bpf: {
    date_limite: '31 mai de chaque année',
    plateforme: 'Mon Activité Formation (maf.asp-public.fr)',
    consequence_oubli: 'Si le BPF n\'est pas déposé ou affiche "Néant" (aucune activité), le NDA devient caduc automatiquement. L\'organisme perd le droit d\'exercer et risque une amende de 4 500€.',
  },
}

/**
 * CONVENTION DE FORMATION — Mentions obligatoires
 */
export const CONVENTION_MENTIONS_OBLIGATOIRES = [
  'Identification complète de l\'organisme de formation (raison sociale, SIRET, NDA)',
  'Identification du bénéficiaire (raison sociale, SIRET si entreprise)',
  'Intitulé de la formation',
  'Objectifs pédagogiques détaillés',
  'Programme détaillé et contenu',
  'Durée en heures et en jours (DOIT correspondre exactement au certificat de réalisation)',
  'Dates précises de début et de fin',
  'Lieu de la formation',
  'Moyens pédagogiques et techniques',
  'Modalités d\'évaluation',
  'Prix HT et conditions de règlement',
  'Modalités de prise en charge (organisme financeur, n° de dossier)',
  'Conditions de résiliation et d\'annulation',
  'Délai de rétractation de 10 jours ouvrés (si financement par le stagiaire particulier)',
  'Signature des deux parties',
]