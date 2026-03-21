// ============================================================
// CRM DERMOTEC — Référentiel National Qualité (RNQ) Qualiopi
// 7 critères, 32 indicateurs — numérotation officielle
// Dermotec = OF (organisme de formation) — pas CFA
// 22 indicateurs communs obligatoires, 10 spécifiques CFA (marqués)
// Sources : Digi-Certif, Certifopac, Guide de lecture Qualiopi officiel
// ============================================================

interface QualiopiStats {
  nb_formations: number
  nb_formations_avec_objectifs: number
  nb_formations_avec_prerequis: number
  nb_formations_avec_programme: number
  nb_sessions: number
  nb_sessions_terminees: number
  nb_sessions_materiel_ok: number
  nb_sessions_supports_ok: number
  nb_sessions_convocations_ok: number
  nb_inscriptions: number
  nb_inscriptions_completees: number
  nb_certificats: number
  nb_conventions: number
  nb_formatrices: number
  nb_formatrices_cv: number
  nb_formatrices_certifications: number
  taux_satisfaction: number
  taux_presence: number
  nb_reclamations: number
  nb_reclamations_resolues: number
  nb_evaluations: number
  nb_qualite_items: number
  nb_actions_correctives: number
  nb_ameliorations: number
}

interface IndicateurDef {
  numero: number
  label: string
  description: string
  cfa_only: boolean // true = spécifique CFA, non applicable pour Dermotec
  calcul: (s: QualiopiStats) => number
  preuves: (s: QualiopiStats) => string[]
  actions: string[]
}

interface CritereDef {
  numero: number
  label: string
  description: string
  indicateurs: IndicateurDef[]
}

function pct(a: number, b: number): number {
  return b > 0 ? Math.round((a / b) * 100) : 0
}

export const QUALIOPI_REFERENTIEL: CritereDef[] = [
  // ============================================================
  // CRITÈRE 1 — Information du public (indicateurs 1-3)
  // ============================================================
  {
    numero: 1,
    label: 'Information du public',
    description: 'Conditions d\'information du public sur les prestations, délais d\'accès et résultats obtenus',
    indicateurs: [
      {
        numero: 1,
        label: 'Diffusion d\'une information accessible',
        description: 'Le prestataire diffuse une information accessible au public, détaillée et vérifiable sur les prestations proposées : prérequis, objectifs, durée, modalités et délais d\'accès, tarifs, contacts, méthodes mobilisées et modalités d\'évaluation, accessibilité aux personnes handicapées.',
        cfa_only: false,
        calcul: (s) => {
          let score = 0
          if (s.nb_formations > 0) score += 30
          if (s.nb_formations_avec_objectifs > 0) score += 25
          if (s.nb_formations_avec_prerequis > 0) score += 25
          if (s.nb_formations_avec_programme > 0) score += 20
          return score
        },
        preuves: (s) => [
          `${s.nb_formations} formations publiées`,
          `${s.nb_formations_avec_objectifs} avec objectifs définis`,
          `${s.nb_formations_avec_prerequis} avec prérequis`,
          `${s.nb_formations_avec_programme} avec programme`,
        ],
        actions: ['Compléter les fiches formation (objectifs, prérequis, programme, tarifs, durée)'],
      },
      {
        numero: 2,
        label: 'Indicateurs de résultats',
        description: 'Le prestataire diffuse des indicateurs de résultats adaptés à la nature des prestations mises en œuvre et des publics accueillis.',
        cfa_only: false,
        calcul: (s) => {
          let score = 0
          if (s.nb_evaluations > 0) score += 40
          if (s.taux_satisfaction > 0) score += 30
          if (s.nb_inscriptions_completees > 0) score += 30
          return score
        },
        preuves: (s) => [
          `${s.nb_evaluations} évaluations collectées`,
          `Satisfaction moyenne : ${s.taux_satisfaction.toFixed(1)}/5`,
          `${s.nb_inscriptions_completees} formations complétées`,
        ],
        actions: ['Collecter les évaluations post-formation', 'Publier les taux de satisfaction sur le site'],
      },
      {
        numero: 3,
        label: 'Taux d\'obtention des certifications',
        description: 'Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il informe sur les taux d\'obtention et les possibilités de valider un/ou des blocs de compétences.',
        cfa_only: true, // Spécifique certifications/CFA
        calcul: (s) => pct(s.nb_certificats, s.nb_inscriptions_completees),
        preuves: (s) => [`${s.nb_certificats}/${s.nb_inscriptions_completees} certificats délivrés`],
        actions: ['Publier les taux d\'obtention des certifications'],
      },
    ],
  },
  // ============================================================
  // CRITÈRE 2 — Conception des prestations (indicateurs 4-8)
  // ============================================================
  {
    numero: 2,
    label: 'Objectifs des prestations et adaptation',
    description: 'L\'identification précise des objectifs des prestations proposées et l\'adaptation de ces prestations aux publics bénéficiaires',
    indicateurs: [
      {
        numero: 4,
        label: 'Analyse du besoin du bénéficiaire',
        description: 'Le prestataire analyse le besoin du bénéficiaire en lien avec l\'entreprise et/ou le financeur concerné(s).',
        cfa_only: false,
        calcul: (s) => s.nb_formations_avec_prerequis > 0 ? 80 : 30,
        preuves: (s) => [`${s.nb_formations_avec_prerequis} formations avec prérequis et positionnement définis`],
        actions: ['Mettre en place un questionnaire de positionnement pour chaque formation'],
      },
      {
        numero: 5,
        label: 'Objectifs opérationnels et évaluables',
        description: 'Le prestataire définit les objectifs opérationnels et évaluables de la prestation.',
        cfa_only: false,
        calcul: (s) => pct(s.nb_formations_avec_objectifs, s.nb_formations),
        preuves: (s) => [`${s.nb_formations_avec_objectifs}/${s.nb_formations} formations avec objectifs définis`],
        actions: ['Compléter les objectifs pédagogiques opérationnels de chaque formation'],
      },
      {
        numero: 6,
        label: 'Contenus et modalités de mise en œuvre',
        description: 'Le prestataire établit les contenus et les modalités de mise en œuvre de la prestation, adaptés aux objectifs définis et aux publics bénéficiaires.',
        cfa_only: false,
        calcul: (s) => pct(s.nb_formations_avec_programme, s.nb_formations),
        preuves: (s) => [`${s.nb_formations_avec_programme}/${s.nb_formations} programmes détaillés disponibles`],
        actions: ['Créer un programme détaillé pour chaque formation'],
      },
      {
        numero: 7,
        label: 'Adéquation du contenu aux exigences de la certification',
        description: 'Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il s\'assure de l\'adéquation du ou des contenus de la prestation aux exigences de la certification visée.',
        cfa_only: true,
        calcul: (s) => s.nb_formations_avec_objectifs > 0 ? 80 : 40,
        preuves: (s) => [`${s.nb_formations_avec_objectifs} formations avec alignement objectifs/contenu`],
        actions: ['Vérifier l\'adéquation des contenus aux référentiels de certification'],
      },
      {
        numero: 8,
        label: 'Procédures de positionnement et d\'évaluation',
        description: 'Le prestataire détermine les procédures de positionnement et d\'évaluation des acquis à l\'entrée de la prestation.',
        cfa_only: false,
        calcul: (s) => s.nb_formations_avec_prerequis > 0 ? 75 : 30,
        preuves: (s) => [`${s.nb_formations_avec_prerequis} formations avec procédure de positionnement`],
        actions: ['Créer un questionnaire de positionnement pour chaque formation'],
      },
    ],
  },
  // ============================================================
  // CRITÈRE 3 — Accueil, accompagnement, suivi (indicateurs 9-16)
  // ============================================================
  {
    numero: 3,
    label: 'Accueil, accompagnement, suivi et évaluation',
    description: 'L\'adaptation aux publics bénéficiaires des prestations et des modalités d\'accueil, d\'accompagnement, de suivi et d\'évaluation',
    indicateurs: [
      {
        numero: 9,
        label: 'Conditions de déroulement',
        description: 'Le prestataire informe les publics bénéficiaires des conditions de déroulement de la prestation.',
        cfa_only: false,
        calcul: (s) => pct(s.nb_sessions_convocations_ok, s.nb_sessions),
        preuves: (s) => [`${s.nb_sessions_convocations_ok}/${s.nb_sessions} sessions avec convocations envoyées`],
        actions: ['Envoyer les convocations et informations pratiques avant chaque session'],
      },
      {
        numero: 10,
        label: 'Adaptation de la prestation',
        description: 'Le prestataire met en œuvre et adapte la prestation, l\'accompagnement et le suivi aux publics bénéficiaires.',
        cfa_only: false,
        calcul: (s) => s.nb_formations_avec_prerequis > 0 && s.nb_sessions_terminees > 0 ? 80 : 40,
        preuves: (s) => [
          `${s.nb_formations_avec_prerequis} formations avec positionnement`,
          `${s.nb_sessions_terminees} sessions réalisées`,
        ],
        actions: ['Adapter les parcours aux profils des stagiaires via le positionnement initial'],
      },
      {
        numero: 11,
        label: 'Évaluation de l\'atteinte des objectifs',
        description: 'Le prestataire évalue l\'atteinte des objectifs de la prestation par les publics bénéficiaires.',
        cfa_only: false,
        calcul: (s) => pct(s.nb_certificats, s.nb_inscriptions_completees),
        preuves: (s) => [`${s.nb_certificats}/${s.nb_inscriptions_completees} évaluations/certificats délivrés`],
        actions: ['Évaluer chaque stagiaire en fin de formation et générer les certificats'],
      },
      {
        numero: 12,
        label: 'Engagement des bénéficiaires et prévention des ruptures',
        description: 'Le prestataire décrit et met en œuvre les mesures pour favoriser l\'engagement des bénéficiaires et prévenir les ruptures de parcours.',
        cfa_only: false,
        calcul: (s) => Math.min(100, Math.round(s.taux_presence)),
        preuves: (s) => [`Taux de présence moyen : ${s.taux_presence.toFixed(0)}%`],
        actions: ['Mettre en place un suivi de présence et relancer les absents'],
      },
      {
        numero: 13,
        label: 'Coordination des apprentis',
        description: 'Pour les formations en alternance, le prestataire, en lien avec l\'entreprise, anticipe avec l\'apprenant les missions confiées, à court, moyen et long terme.',
        cfa_only: true,
        calcul: () => 0,
        preuves: () => ['Non applicable — Dermotec n\'est pas un CFA'],
        actions: [],
      },
      {
        numero: 14,
        label: 'Exercice de la citoyenneté',
        description: 'Le prestataire met en œuvre un accompagnement socio-professionnel, favorise la consolidation du projet professionnel et exerce la citoyenneté.',
        cfa_only: true,
        calcul: () => 0,
        preuves: () => ['Non applicable — Dermotec n\'est pas un CFA'],
        actions: [],
      },
      {
        numero: 15,
        label: 'Droits et devoirs de l\'apprenti',
        description: 'Le prestataire informe les apprentis de leurs droits et devoirs en tant qu\'apprentis et salariés ainsi que des règles applicables en matière de santé et de sécurité.',
        cfa_only: true,
        calcul: () => 0,
        preuves: () => ['Non applicable — Dermotec n\'est pas un CFA'],
        actions: [],
      },
      {
        numero: 16,
        label: 'Présentation à la certification',
        description: 'Lorsque le prestataire met en œuvre des formations conduisant à une certification professionnelle, il s\'assure que les conditions de présentation des bénéficiaires à la certification respectent les exigences formelles.',
        cfa_only: true,
        calcul: () => 0,
        preuves: () => ['Non applicable — Dermotec n\'est pas un CFA'],
        actions: [],
      },
    ],
  },
  // ============================================================
  // CRITÈRE 4 — Moyens pédagogiques et techniques (indicateurs 17-20)
  // ============================================================
  {
    numero: 4,
    label: 'Adéquation des moyens pédagogiques, techniques et d\'encadrement',
    description: 'L\'adéquation des moyens pédagogiques, techniques et d\'encadrement aux prestations mises en œuvre',
    indicateurs: [
      {
        numero: 17,
        label: 'Moyens humains et techniques adaptés',
        description: 'Le prestataire met à disposition ou s\'assure de la mise à disposition des moyens humains et techniques adaptés et d\'un environnement approprié.',
        cfa_only: false,
        calcul: (s) => pct(s.nb_sessions_materiel_ok, s.nb_sessions),
        preuves: (s) => [`${s.nb_sessions_materiel_ok}/${s.nb_sessions} sessions avec matériel préparé`],
        actions: ['Vérifier la checklist matériel avant chaque session de formation'],
      },
      {
        numero: 18,
        label: 'Coordination des différents intervenants',
        description: 'Le prestataire mobilise et coordonne les différents intervenants internes et/ou externes.',
        cfa_only: false,
        calcul: (s) => s.nb_formatrices > 0 ? 85 : 0,
        preuves: (s) => [`${s.nb_formatrices} formatrices actives et coordonnées`],
        actions: ['Documenter la coordination entre formateurs (réunions pédagogiques)'],
      },
      {
        numero: 19,
        label: 'Ressources pédagogiques des bénéficiaires',
        description: 'Le prestataire met à disposition du bénéficiaire les ressources et supports pédagogiques.',
        cfa_only: false,
        calcul: (s) => pct(s.nb_sessions_supports_ok, s.nb_sessions),
        preuves: (s) => [`${s.nb_sessions_supports_ok}/${s.nb_sessions} sessions avec supports envoyés`],
        actions: ['Préparer et envoyer les supports pédagogiques avant chaque session'],
      },
      {
        numero: 20,
        label: 'Personnels dédiés à la mobilité',
        description: 'Le prestataire dispose d\'un personnel dédié à l\'appui à la mobilité nationale et internationale.',
        cfa_only: true,
        calcul: () => 0,
        preuves: () => ['Non applicable — Dermotec n\'est pas un CFA'],
        actions: [],
      },
    ],
  },
  // ============================================================
  // CRITÈRE 5 — Qualification et développement des compétences (indicateurs 21-22)
  // ============================================================
  {
    numero: 5,
    label: 'Qualification et développement des connaissances et compétences des personnels',
    description: 'La qualification et le développement des connaissances et compétences des personnels chargés de mettre en œuvre les prestations',
    indicateurs: [
      {
        numero: 21,
        label: 'Compétences des intervenants',
        description: 'Le prestataire détermine, mobilise et évalue les compétences des différents intervenants internes et/ou externes, adaptées aux prestations.',
        cfa_only: false,
        calcul: (s) => pct(s.nb_formatrices_cv, s.nb_formatrices),
        preuves: (s) => [`${s.nb_formatrices_cv}/${s.nb_formatrices} formatrices avec CV à jour`],
        actions: ['Mettre à jour les CV et fiches de compétences de toutes les formatrices'],
      },
      {
        numero: 22,
        label: 'Entretien et développement des compétences',
        description: 'Le prestataire entretient et favorise le développement des compétences de ses salariés, adaptées aux prestations qu\'il délivre.',
        cfa_only: false,
        calcul: (s) => pct(s.nb_formatrices_certifications, s.nb_formatrices),
        preuves: (s) => [`${s.nb_formatrices_certifications}/${s.nb_formatrices} avec certifications/formations continues à jour`],
        actions: ['Planifier les formations continues pour les formatrices'],
      },
    ],
  },
  // ============================================================
  // CRITÈRE 6 — Inscription dans l'environnement professionnel (indicateurs 23-29)
  // ============================================================
  {
    numero: 6,
    label: 'Investissement dans l\'environnement professionnel',
    description: 'L\'inscription et l\'investissement du prestataire dans son environnement professionnel',
    indicateurs: [
      {
        numero: 23,
        label: 'Veille légale et réglementaire',
        description: 'Le prestataire réalise une veille légale et réglementaire sur le champ de la formation professionnelle et en exploite les enseignements.',
        cfa_only: false,
        calcul: () => 70,
        preuves: () => ['Veille réglementaire sur les certifications et évolutions du secteur esthétique'],
        actions: ['Documenter formellement la veille réglementaire (sources, dates, actions)'],
      },
      {
        numero: 24,
        label: 'Veille sur les évolutions des compétences et métiers',
        description: 'Le prestataire réalise une veille sur les évolutions des compétences, des métiers et des emplois dans ses secteurs d\'intervention et en exploite les enseignements.',
        cfa_only: false,
        calcul: () => 70,
        preuves: () => ['Veille sur les techniques et matériels NPM dernière génération'],
        actions: ['Formaliser un document de veille sectorielle esthétique'],
      },
      {
        numero: 25,
        label: 'Veille sur les innovations pédagogiques et technologiques',
        description: 'Le prestataire réalise une veille sur les innovations pédagogiques et technologiques permettant une évolution de ses prestations et en exploite les enseignements.',
        cfa_only: false,
        calcul: () => 70,
        preuves: () => ['CRM Dermotec avec émargement QR, portail stagiaire, scoring IA'],
        actions: ['Documenter les innovations pédagogiques intégrées'],
      },
      {
        numero: 26,
        label: 'Accueil des personnes en situation de handicap',
        description: 'Le prestataire mobilise les expertises, outils et réseaux nécessaires pour accueillir, accompagner/orienter ou former les publics en situation de handicap.',
        cfa_only: false,
        calcul: () => 65,
        preuves: () => [
          'Centre accessible PMR — 75 Bd Richard Lenoir, Paris 11',
          'Référent handicap désigné',
        ],
        actions: ['Désigner formellement un référent handicap', 'Documenter les aménagements possibles'],
      },
      {
        numero: 27,
        label: 'Sous-traitance et portage salarial',
        description: 'Lorsque le prestataire fait appel à la sous-traitance ou au portage salarial, il s\'assure du respect de la conformité et de la cohérence des prestations réalisées.',
        cfa_only: true,
        calcul: () => 0,
        preuves: () => ['Non applicable — pas de sous-traitance actuellement'],
        actions: [],
      },
      {
        numero: 28,
        label: 'Formation en situation de travail (AFEST)',
        description: 'Lorsque les prestations dispensées au bénéficiaire comprennent des périodes de formation en situation de travail, le prestataire mobilise son réseau de partenaires socio-économiques.',
        cfa_only: true,
        calcul: () => 0,
        preuves: () => ['Non applicable — formations en centre uniquement'],
        actions: [],
      },
      {
        numero: 29,
        label: 'Insertion professionnelle et poursuite d\'études',
        description: 'Le prestataire développe des actions qui concourent à l\'insertion professionnelle ou la poursuite d\'études par la voie de l\'apprentissage ou par toute autre voie.',
        cfa_only: true,
        calcul: () => 0,
        preuves: () => ['Non applicable — Dermotec n\'est pas un CFA'],
        actions: [],
      },
    ],
  },
  // ============================================================
  // CRITÈRE 7 — Amélioration continue (indicateurs 30-32)
  // ============================================================
  {
    numero: 7,
    label: 'Recueil et prise en compte des appréciations et réclamations',
    description: 'Le recueil et la prise en compte des appréciations et des réclamations formulées par les parties prenantes aux prestations délivrées',
    indicateurs: [
      {
        numero: 30,
        label: 'Recueil des appréciations',
        description: 'Le prestataire recueille les appréciations des parties prenantes : bénéficiaires, financeurs, équipes pédagogiques et entreprises concernées.',
        cfa_only: false,
        calcul: (s) => {
          if (s.nb_evaluations === 0) return 20
          return Math.min(100, 40 + pct(s.nb_evaluations, s.nb_inscriptions_completees) * 0.6)
        },
        preuves: (s) => [`${s.nb_evaluations} évaluations collectées sur ${s.nb_inscriptions_completees} complétées`],
        actions: ['Systématiser les questionnaires de satisfaction post-formation'],
      },
      {
        numero: 31,
        label: 'Traitement des difficultés et réclamations',
        description: 'Le prestataire met en œuvre des modalités de traitement des difficultés rencontrées par les parties prenantes, des réclamations exprimées par ces dernières, des aléas survenus en cours de prestation.',
        cfa_only: false,
        calcul: (s) => {
          if (s.nb_reclamations === 0) return 80
          return pct(s.nb_reclamations_resolues, s.nb_reclamations)
        },
        preuves: (s) => [
          `${s.nb_reclamations} réclamations reçues`,
          `${s.nb_reclamations_resolues} résolues/clôturées`,
        ],
        actions: ['Traiter toutes les réclamations dans un délai de 15 jours'],
      },
      {
        numero: 32,
        label: 'Mesures d\'amélioration continue',
        description: 'Le prestataire met en œuvre des mesures d\'amélioration à partir de l\'analyse des appréciations et des réclamations.',
        cfa_only: false,
        calcul: (s) => {
          let score = 30
          if (s.nb_evaluations > 0) score += 20
          if (s.nb_actions_correctives > 0) score += 20
          if (s.nb_ameliorations > 0) score += 15
          if (s.taux_satisfaction >= 4) score += 15
          return Math.min(100, score)
        },
        preuves: (s) => [
          `Satisfaction : ${s.taux_satisfaction.toFixed(1)}/5`,
          `${s.nb_actions_correctives} actions correctives menées`,
          `${s.nb_ameliorations} améliorations enregistrées`,
        ],
        actions: ['Maintenir un tableau de bord qualité avec revue trimestrielle'],
      },
    ],
  },
]
