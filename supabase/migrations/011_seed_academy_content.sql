-- ============================================================
-- CRM DERMOTEC — Academy : Seed Content (6 modules, 31 leçons, 10 badges)
-- Formation interne équipe commerciale
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- MODULE 1 : Onboarding Dermotec
-- ────────────────────────────────────────────────────────────
INSERT INTO academy_modules (id, slug, titre, description, icone, couleur, categorie, ordre, duree_minutes, is_published)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'onboarding-dermotec',
  'Onboarding Dermotec',
  'Découvre l''entreprise, la mission, l''équipe et installe ton environnement de travail.',
  'Rocket',
  '#2EC6F3',
  'onboarding',
  1,
  30,
  true
);

-- Module 1, Leçon 1 — Bienvenue chez Dermotec
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'bienvenue-dermotec',
  'Bienvenue chez Dermotec',
  'texte',
  1, 5, 10,
  '{
    "body": "# Bienvenue chez Dermotec Advanced 🎓\n\n## Notre histoire\n\nDermotec Advanced est un centre de formation esthétique basé au **75 Boulevard Richard Lenoir, 75011 Paris**. Nous formons les professionnelles de l''esthétique aux techniques les plus demandées du marché : maquillage permanent, microblading, soins visage avancés, laser et dermo-correction.\n\n## Notre mission\n\nPermettre à chaque esthéticienne, chaque professionnelle en reconversion, chaque gérante d''institut de **monter en compétences rapidement** avec des formations courtes, intensives et certifiantes.\n\n## Nos valeurs\n\n- **Excellence** — Nos formatrices sont des praticiennes expertes avec 10+ ans d''expérience\n- **Accessibilité** — 12 organismes de financement partenaires, personne ne reste sur le banc\n- **Accompagnement** — Suivi post-formation, communauté alumni, support continu\n- **Innovation** — Techniques NPM dernière génération, matériel professionnel inclus\n\n## Certification Qualiopi\n\nDermotec est **certifié Qualiopi** — le label qualité national pour les organismes de formation. Cela signifie :\n- Nos formations sont finançables (OPCO, France Travail, CPF)\n- Nous respectons les 7 critères et 32 indicateurs du Référentiel National Qualité\n- Nous sommes audités régulièrement\n\n## Chiffres clés\n\n| Indicateur | Valeur |\n|---|---|\n| Formations | 11 |\n| Catégories | 6 (Hygiène, Dermo-Esthétique, Dermo-Correctrice, Soins Visage, Laser & IPL) |\n| Prix | 400€ à 2 500€ HT |\n| Durée | 1 à 5 jours |\n| Adresse | 75 Bd Richard Lenoir, 75011 Paris |\n| Téléphone | 01 88 33 43 43 |\n| Certification | Qualiopi |\n\n## Ton rôle\n\nEn tant que membre de l''équipe commerciale, tu es le **premier point de contact** des futurs stagiaires. Tu les accompagnes de la découverte à l''inscription, en passant par le montage du dossier de financement. Tu es la vitrine de Dermotec."
  }'::jsonb
);

-- Module 1, Leçon 2 — Visite du centre
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'visite-centre',
  'Visite du centre',
  'video',
  2, 5, 10,
  '{
    "url": "https://storage.dermotec.fr/academy/visite-centre.mp4",
    "duree_secondes": 300,
    "transcript": "Bienvenue au 75 Boulevard Richard Lenoir dans le 11e arrondissement de Paris. Vous entrez dans notre centre de formation Dermotec Advanced. À gauche, l''accueil et l''espace administratif. Tout droit, nos deux salles de formation équipées de postes individuels avec miroirs grossissants et éclairage professionnel. Chaque poste dispose du matériel NPM dernière génération. À droite, notre espace de pause avec café et thé à disposition des stagiaires. Au fond, le bureau de la direction et la salle de réunion pour les entretiens de qualification et les rendez-vous financement."
  }'::jsonb
);

-- Module 1, Leçon 3 — Setup de ton poste
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'setup-poste',
  'Setup de ton poste',
  'checklist',
  3, 10, 15,
  '{
    "items": [
      { "label": "Accès CRM Dermotec", "description": "Demande tes identifiants à l''admin. URL : crm.dermotec.fr — Vérifie que tu peux te connecter et voir le dashboard." },
      { "label": "Email professionnel", "description": "Ton email @dermotec.fr doit être actif. Vérifie l''envoi et la réception. Configure ta signature : Prénom Nom | Conseillère Formation | Dermotec Advanced | 01 88 33 43 43" },
      { "label": "WhatsApp Business", "description": "Installe WhatsApp Business sur ton téléphone pro. Connecte-le au CRM via les paramètres > Intégrations. Tu pourras envoyer des messages directement depuis la fiche lead." },
      { "label": "Accès Google Drive", "description": "Vérifie que tu as accès au dossier partagé Dermotec : modèles de devis, brochures formations, documents financement." },
      { "label": "Calendrier partagé", "description": "Accepte l''invitation au calendrier Google ''Sessions Dermotec''. Tu y verras toutes les sessions planifiées et pourras proposer des dates aux prospects." },
      { "label": "Numéro du centre", "description": "Enregistre le 01 88 33 43 43 dans tes contacts. C''est le numéro principal, celui qu''on donne aux prospects." },
      { "label": "Test appel", "description": "Passe un appel test à un collègue depuis ta ligne pro pour vérifier que tout fonctionne." }
    ]
  }'::jsonb
);

-- Module 1, Leçon 4 — L'organigramme
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000001',
  'organigramme',
  'L''organigramme',
  'texte',
  4, 5, 10,
  '{
    "body": "# L''équipe Dermotec\n\n## Les rôles\n\n### 👩‍💼 Admin / Direction\n- Gestion globale du centre\n- Stratégie commerciale et marketing\n- Relations organismes de financement\n- Suivi qualité Qualiopi\n\n### 📞 Commerciale / Conseillère Formation\n- Qualification des leads entrants\n- Appels de découverte et closing\n- Montage des dossiers de financement\n- Relances et suivi pipeline\n- Objectif : convertir les leads en inscriptions\n\n### 👩‍🏫 Formatrice\n- Animation des sessions de formation\n- Évaluation des stagiaires\n- Création de contenu pédagogique\n- Émargement et suivi de présence\n\n### 🗂️ Assistante Administrative\n- Gestion des inscriptions et convocations\n- Suivi des dossiers de financement\n- Facturation et relances paiement\n- Archivage des documents Qualiopi\n\n## Circuit d''un lead\n\n1. Le lead arrive (formulaire, téléphone, réseaux sociaux)\n2. La **commerciale** le qualifie et l''accompagne\n3. L''**assistante** monte le dossier de financement\n4. La **direction** valide si besoin\n5. Le lead est inscrit → la **formatrice** prend le relais\n\n## Communication interne\n\n- **CRM** : tout passe par le CRM (notes, activités, emails)\n- **WhatsApp groupe équipe** : pour les urgences et infos rapides\n- **Réunion hebdo** : chaque lundi 9h30 — revue pipeline et objectifs"
  }'::jsonb
);

-- Module 1, Leçon 5 — Quiz onboarding
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000001',
  'quiz-onboarding',
  'Quiz onboarding',
  'quiz',
  5, 5, 20,
  '{
    "questions": [
      {
        "question": "Quelle est l''adresse de Dermotec ?",
        "options": ["12 Rue de Rivoli, 75001 Paris", "75 Bd Richard Lenoir, 75011 Paris", "45 Avenue des Champs-Élysées, 75008 Paris", "100 Rue de la Roquette, 75011 Paris"],
        "correct": 1,
        "explication": "Dermotec est situé au 75 Boulevard Richard Lenoir dans le 11e arrondissement de Paris."
      },
      {
        "question": "Quel est le numéro de téléphone du centre ?",
        "options": ["01 42 33 43 43", "01 88 33 43 43", "01 88 43 33 43", "06 88 33 43 43"],
        "correct": 1,
        "explication": "Le numéro principal est le 01 88 33 43 43."
      },
      {
        "question": "Combien de formations propose Dermotec ?",
        "options": ["8", "9", "11", "15"],
        "correct": 2,
        "explication": "Dermotec propose 11 formations allant de 400€ à 2 500€ HT."
      },
      {
        "question": "Quelle certification qualité détient Dermotec ?",
        "options": ["ISO 9001", "Qualiopi", "AFNOR", "NF Service"],
        "correct": 1,
        "explication": "Dermotec est certifié Qualiopi, le label national pour les organismes de formation professionnelle."
      },
      {
        "question": "Quelle est la formation la plus chère ?",
        "options": ["Maquillage Permanent (2 490€)", "Tricopigmentation HFS (2 500€)", "Aréole Mammaire (2 300€)", "Microblading (1 400€)"],
        "correct": 1,
        "explication": "La Tricopigmentation HFS est la formation la plus chère à 2 500€ HT (3 jours, 21 heures)."
      }
    ]
  }'::jsonb
);

-- ────────────────────────────────────────────────────────────
-- MODULE 2 : Maîtriser le CRM
-- ────────────────────────────────────────────────────────────
INSERT INTO academy_modules (id, slug, titre, description, icone, couleur, categorie, ordre, duree_minutes, is_published)
VALUES (
  'a1000000-0000-0000-0000-000000000002',
  'maitriser-crm',
  'Maîtriser le CRM',
  'Apprends à utiliser le CRM Dermotec au quotidien : leads, pipeline, messages, cadences.',
  'Monitor',
  '#10B981',
  'crm',
  2,
  40,
  true
);

-- Module 2, Leçon 1 — Dashboard & navigation
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b2000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000002',
  'dashboard-navigation',
  'Dashboard & navigation',
  'texte',
  1, 5, 10,
  '{
    "body": "# Dashboard & Navigation du CRM\n\n## Le Dashboard\n\nQuand tu te connectes, tu arrives sur le **dashboard**. C''est ta vue d''ensemble quotidienne :\n\n- **KPIs du jour** : leads à traiter, rappels en retard, RDV du jour\n- **Pipeline** : nombre de leads par statut\n- **CA du mois** : factures payées vs objectif\n- **Activité récente** : dernières actions de l''équipe\n\n## La navigation\n\n| Page | Accès | Ce que tu y fais |\n|---|---|---|\n| Dashboard | `/` | Vue d''ensemble, KPIs |\n| Leads | `/leads` | Liste et fiches leads, pipeline |\n| Pipeline | `/pipeline` | Vue Kanban drag & drop |\n| Sessions | `/sessions` | Calendrier des formations |\n| Inscriptions | `/inscriptions` | Stagiaires inscrits |\n| Financements | `/financements` | Dossiers en cours |\n| Factures | `/factures` | Facturation, paiements |\n| Messages | `/messages` | Inbox email + WhatsApp |\n| Rappels | `/rappels` | Tes tâches et rappels |\n| Analytics | `/analytics` | Tableaux de bord détaillés |\n| Academy | `/academy` | Tu es ici ! Formation interne |\n\n## Raccourcis\n\n- **Ctrl+K** : recherche rapide (lead, formation, session)\n- Clique sur le nom d''un lead n''importe où → ouvre sa fiche\n- Le badge rouge sur Messages = messages non lus"
  }'::jsonb
);

-- Module 2, Leçon 2 — Gérer les leads
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b2000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000002',
  'gerer-leads',
  'Gérer les leads',
  'texte',
  2, 8, 10,
  '{
    "body": "# Gérer les Leads\n\n## Créer un lead\n\nBouton **+ Nouveau lead** en haut à droite de la page Leads. Champs obligatoires :\n- Prénom + Nom\n- Téléphone ou Email (au moins un)\n- Source (formulaire, téléphone, Instagram, bouche-à-oreille, salon pro...)\n\n## Les 11 statuts du pipeline\n\n| # | Statut | Signification | Action attendue |\n|---|---|---|---|\n| 1 | `nouveau` | Lead vient d''arriver | Appeler dans les 2h |\n| 2 | `contacte` | Premier contact établi | Qualifier le besoin |\n| 3 | `qualifie` | Besoin identifié, formation ciblée | Proposer une session |\n| 4 | `rdv_planifie` | RDV de découverte calé | Préparer l''argumentaire |\n| 5 | `propose` | Devis envoyé | Relancer à J+2 |\n| 6 | `negocie` | Discussion prix/financement | Monter le dossier |\n| 7 | `gagné` | Inscription confirmée | Envoyer convocation |\n| 8 | `perdu` | Lead abandonné | Documenter la raison |\n| 9 | `en_attente` | Attend une réponse (financement, date) | Mettre un rappel |\n| 10 | `no_show` | Ne s''est pas présenté | Rappeler pour replanifier |\n| 11 | `a_relancer` | Lead froid à réactiver | Cadence de relance |\n\n## Qualifier un lead\n\nSur la fiche lead, renseigne :\n- **Formation souhaitée** — laquelle parmi les 11\n- **Statut pro** — esthéticienne en activité, reconversion, gérante institut, étudiante\n- **Budget** — auto-financement ou besoin de financement\n- **Disponibilité** — quand peut-elle se former\n- **Score** — le CRM calcule un score automatique (activité, engagement, budget)\n\n## Bonnes pratiques\n\n1. **Chaque interaction = une note** dans le CRM\n2. **Jamais de lead sans rappel** — si le lead n''est pas gagné/perdu, il doit avoir un rappel futur\n3. **Déplacer le statut** après chaque interaction\n4. **Taguer la formation** dès que tu sais laquelle l''intéresse"
  }'::jsonb
);

-- Module 2, Leçon 3 — Ton premier lead
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b2000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000002',
  'premier-lead',
  'Ton premier lead',
  'checklist',
  3, 10, 15,
  '{
    "items": [
      { "label": "Créer un lead test", "description": "Va dans Leads > + Nouveau lead. Crée un lead fictif : Marie Dupont, 06 12 34 56 78, source Instagram, intéressée par le Microblading." },
      { "label": "Ajouter une note", "description": "Sur la fiche du lead, ajoute une note : ''Appel de qualification — Marie est esthéticienne depuis 3 ans, veut ajouter le microblading à ses prestations. Budget OK, dispo en mars.''" },
      { "label": "Changer le statut", "description": "Déplace le lead de ''nouveau'' à ''qualifié'' en utilisant le sélecteur de statut ou le drag & drop sur le Pipeline." },
      { "label": "Programmer un rappel", "description": "Crée un rappel pour demain 10h : ''Envoyer le programme Microblading + les dates de session''." },
      { "label": "Envoyer un email", "description": "Depuis la fiche lead, clique sur l''icône email. Utilise le template ''Programme formation'' et personnalise-le avec Microblading." },
      { "label": "Vérifier l''activité", "description": "Regarde le fil d''activité sur la fiche lead : tu dois voir ta note, le changement de statut, le rappel créé et l''email envoyé." }
    ]
  }'::jsonb
);

-- Module 2, Leçon 4 — L'inbox messages
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b2000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000002',
  'inbox-messages',
  'L''inbox messages',
  'texte',
  4, 5, 10,
  '{
    "body": "# L''Inbox Messages\n\n## Vue unifiée\n\nL''inbox regroupe **tous tes échanges** avec les leads :\n- 📧 **Emails** envoyés et reçus\n- 💬 **WhatsApp** messages\n- 📱 **SMS** si configuré\n\nChaque conversation est liée à une fiche lead. Tu peux répondre directement depuis l''inbox.\n\n## Envoyer un message\n\n### Depuis la fiche lead\n1. Ouvre la fiche du lead\n2. Clique sur l''icône du canal (email, WhatsApp)\n3. Rédige ton message ou choisis un template\n4. Envoie\n\n### Depuis l''inbox\n1. Va sur /messages\n2. Sélectionne la conversation\n3. Rédige et envoie\n\n## Templates email\n\nLe CRM a des templates pré-rédigés :\n- **Bienvenue** — premier contact après formulaire\n- **Programme formation** — détail d''une formation spécifique\n- **Relance douce** — quand le lead ne répond plus\n- **Financement** — explication des options de financement\n- **Confirmation inscription** — après paiement\n\nTu peux les personnaliser avec les variables : `{prenom}`, `{formation}`, `{date_session}`, `{prix}`.\n\n## Bonnes pratiques\n\n- Réponds dans les **2h max** aux emails\n- WhatsApp = canal le plus efficace pour les relances\n- Toujours **personnaliser** le message (prénom, formation mentionnée)\n- **Jamais de spam** — maximum 1 relance par semaine par canal"
  }'::jsonb
);

-- Module 2, Leçon 5 — Les cadences automatiques
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b2000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000002',
  'cadences-automatiques',
  'Les cadences automatiques',
  'texte',
  5, 7, 10,
  '{
    "body": "# Les Cadences Automatiques\n\n## C''est quoi une cadence ?\n\nUne **cadence** est une séquence d''actions automatisées qui se déclenche à un moment précis du parcours lead. Le CRM te crée des tâches aux bons moments pour que tu n''oublies jamais un lead.\n\n## Les 3 cadences Dermotec\n\n### 1. Nouveau Lead (5 étapes, 14 jours)\n| Jour | Canal | Action |\n|---|---|---|\n| J+0 | 📞 Appel | Appel de qualification (matin) |\n| J+1 | 📧 Email | Email de bienvenue + programme |\n| J+3 | 💬 WhatsApp | Relance WhatsApp |\n| J+7 | 📞 Appel | Relance téléphonique |\n| J+14 | 📧 Email | Dernière relance + offre |\n\n### 2. Post-Formation Alumni (4 étapes, 90 jours)\n| Jour | Canal | Action |\n|---|---|---|\n| J+1 | 📧 Email | Remerciement + lien avis Google |\n| J+7 | 💬 WhatsApp | Comment ça se passe ? |\n| J+30 | 📞 Appel | Suivi J+30 — installation ? |\n| J+90 | 📧 Email | Upsell formation complémentaire |\n\n### 3. Relance Financement (4 étapes, 21 jours)\n| Jour | Canal | Action |\n|---|---|---|\n| J+0 | 📧 Email | Checklist documents |\n| J+3 | 📞 Appel | Suivi : documents reçus ? |\n| J+10 | 💬 WhatsApp | Relance documents manquants |\n| J+21 | 📞 Appel | Point sur l''avancement |\n\n## Comment ça marche concrètement\n\n1. Un lead passe au statut ''nouveau'' → la cadence ''Nouveau Lead'' se déclenche\n2. Le CRM crée un rappel pour J+0 : ''Appel de qualification''\n3. Tu fais l''appel, tu coches le rappel comme fait\n4. Le lendemain, un nouveau rappel apparaît : ''Email de bienvenue''\n5. Et ainsi de suite...\n\n## Important\n\n- Tu peux **arrêter une cadence** manuellement si le lead est gagné ou perdu\n- Les cadences ne remplacent pas ton jugement — adapte le message au contexte\n- Si le lead répond entre deux étapes, **adapte la suite**"
  }'::jsonb
);

-- Module 2, Leçon 6 — Quiz CRM
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b2000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000002',
  'quiz-crm',
  'Quiz CRM',
  'quiz',
  6, 5, 20,
  '{
    "questions": [
      {
        "question": "Dans quel délai maximum dois-tu rappeler un nouveau lead ?",
        "options": ["24 heures", "2 heures", "1 semaine", "Le lendemain matin"],
        "correct": 1,
        "explication": "Un nouveau lead doit être contacté dans les 2 heures. Plus tu es rapide, plus le taux de conversion est élevé."
      },
      {
        "question": "Combien de statuts compte le pipeline ?",
        "options": ["7", "9", "11", "5"],
        "correct": 2,
        "explication": "Le pipeline compte 11 statuts : nouveau, contacté, qualifié, rdv_planifié, proposé, négocié, gagné, perdu, en_attente, no_show, à_relancer."
      },
      {
        "question": "Quel canal est le plus efficace pour les relances ?",
        "options": ["Email", "Courrier postal", "WhatsApp", "SMS"],
        "correct": 2,
        "explication": "WhatsApp a le meilleur taux de réponse. Les gens lisent leurs WhatsApp bien plus que leurs emails."
      },
      {
        "question": "Que dois-tu faire après chaque interaction avec un lead ?",
        "options": ["Rien de spécial", "Ajouter une note dans le CRM", "Envoyer un email automatique", "Appeler ton manager"],
        "correct": 1,
        "explication": "Chaque interaction doit être documentée par une note dans le CRM. C''est essentiel pour le suivi et si un collègue reprend le lead."
      },
      {
        "question": "Combien de cadences automatiques sont configurées ?",
        "options": ["1", "2", "3", "5"],
        "correct": 2,
        "explication": "3 cadences : Nouveau Lead (14 jours), Post-Formation Alumni (90 jours), Relance Financement (21 jours)."
      }
    ]
  }'::jsonb
);

-- ────────────────────────────────────────────────────────────
-- MODULE 3 : Les 11 formations Dermotec
-- ────────────────────────────────────────────────────────────
INSERT INTO academy_modules (id, slug, titre, description, icone, couleur, categorie, ordre, duree_minutes, is_published)
VALUES (
  'a1000000-0000-0000-0000-000000000003',
  'formations-dermotec',
  'Les 11 formations Dermotec',
  'Connais chaque formation sur le bout des doigts : prix, durée, arguments, ROI, objections.',
  'GraduationCap',
  '#8B5CF6',
  'produit',
  3,
  45,
  true
);

-- Module 3, Leçon 1 — Vue d'ensemble
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b3000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000003',
  'vue-ensemble-formations',
  'Vue d''ensemble',
  'texte',
  1, 10, 10,
  '{
    "body": "# Les 11 Formations Dermotec\n\n## 6 Catégories\n\n### 🧼 Hygiène\n| Formation | Prix HT | Durée | Niveau |\n|---|---|---|---|\n| Hygiène et Salubrité | 400€ | 3 jours (21h) | Débutant |\n\n### 💄 Dermo-Esthétique\n| Formation | Prix HT | Durée | Niveau |\n|---|---|---|---|\n| Maquillage Permanent Complet | 2 490€ | 5 jours (35h) | Débutant |\n| Microblading / Microshading | 1 400€ | 2 jours (14h) | Débutant |\n| Full Lips | 1 400€ | 2 jours (14h) | Débutant |\n| Tricopigmentation HFS | 2 500€ | 3 jours (21h) | Intermédiaire |\n\n### 🩹 Dermo-Correctrice\n| Formation | Prix HT | Durée | Niveau |\n|---|---|---|---|\n| Aréole Mammaire & Cicatrices | 2 300€ | 3 jours (21h) | Intermédiaire |\n\n### ✨ Soins Visage\n| Formation | Prix HT | Durée | Niveau |\n|---|---|---|---|\n| Nanoneedling & BB Glow | 700€ | 1 jour (7h) | Débutant |\n| Soin Visage ALLin1 | 900€ | 1 jour (7h) | Débutant |\n| Peeling Chimique & Dermaplaning | 990€ | 1 jour (7h) | Débutant |\n\n### 🔬 Laser & IPL\n| Formation | Prix HT | Durée | Niveau |\n|---|---|---|---|\n| Détatouage & Carbon Peel | 990€ | 1 jour (7h) | Intermédiaire |\n| Épilation Définitive | 990€ | 1 jour (7h) | Débutant |\n\n## Positionnement prix\n\n- **Entrée de gamme** (400-990€) : Hygiène, Soins Visage, Laser — formations courtes 1-3 jours, idéales pour les premières formations ou l''upsell\n- **Milieu de gamme** (1 400€) : Microblading et Full Lips — 2 jours, techniques spécialisées à forte demande\n- **Haut de gamme** (2 300-2 500€) : Maquillage Permanent, Tricopigmentation, Aréole — formations longues, expertise avancée\n\n## Le parcours typique d''une stagiaire\n\n1. **Hygiène et Salubrité** (obligatoire, prérequis légal) — 400€\n2. **Une formation technique** selon son projet — 700€ à 2 500€\n3. **Formations complémentaires** pour élargir son offre\n\n💡 **Astuce commerciale** : propose toujours l''Hygiène en bundle avec la formation technique. Ça augmente le panier moyen et c''est un argument logique (prérequis légal)."
  }'::jsonb
);

-- Module 3, Leçon 2 — Fiches argumentaires
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b3000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003',
  'fiches-argumentaires',
  'Fiches argumentaires',
  'texte',
  2, 15, 15,
  '{
    "body": "# Fiches Argumentaires — Les 11 Formations\n\n---\n\n## 1. Hygiène et Salubrité — 400€ HT (3 jours)\n\n**Argument clé** : C''est le prérequis légal pour exercer toute technique invasive. Sans ça, tu ne peux pas pratiquer légalement.\n\n**Objection fréquente** : *\"Je l''ai déjà fait dans mon école d''esthétique.\"*\n**Réponse** : La formation Hygiène Dermotec est spécifique à la dermopigmentation et aux techniques invasives. Votre diplôme esthétique ne couvre pas ces actes. C''est obligatoire pour votre assurance professionnelle.\n\n**ROI** : Formation remboursée dès la 1ère semaine d''exercice. Sans elle, vous ne pouvez tout simplement pas pratiquer.\n\n---\n\n## 2. Maquillage Permanent Complet — 2 490€ HT (5 jours)\n\n**Argument clé** : 3 techniques en 5 jours (sourcils, lèvres, eye-liner). La formation la plus complète du marché.\n\n**Objection fréquente** : *\"C''est cher, je peux trouver moins cher ailleurs.\"*\n**Réponse** : Chez Dermotec, vous pratiquez sur modèles vivants dès le jour 2. Le matériel NPM professionnel est inclus. Et avec le financement OPCO/CPF, votre reste à charge peut être de 0€.\n\n**ROI** : Sourcils 150-250€, lèvres 200-350€, eye-liner 150-200€. Avec 3 clientes/semaine, la formation est remboursée en 3 semaines.\n\n---\n\n## 3. Microblading / Microshading — 1 400€ HT (2 jours)\n\n**Argument clé** : La prestation la plus demandée en institut. 200€ par séance minimum, demande explosive.\n\n**Objection fréquente** : *\"2 jours c''est trop court pour maîtriser la technique.\"*\n**Réponse** : Nos formatrices ont 10+ ans d''expérience. Vous pratiquez sur peau synthétique puis sur modèle vivant. Et vous avez un suivi post-formation avec corrections de vos premiers travaux.\n\n**ROI** : 200€/séance × 3 clientes/semaine = 2 400€/mois. Formation remboursée en 2 semaines.\n\n---\n\n## 4. Full Lips — 1 400€ HT (2 jours)\n\n**Argument clé** : Pigmentation des lèvres = 300€/séance. Tendance forte, peu de praticiennes formées.\n\n**Objection fréquente** : *\"J''ai peur de me lancer sur les lèvres, c''est sensible.\"*\n**Réponse** : C''est exactement pour ça que la formation existe. Vous apprenez les zones à risque, les bonnes aiguilles, l''anesthésie topique. Encadrée par une formatrice experte, vous serez confiante dès la fin du jour 2.\n\n**ROI** : 300€/séance × 2 clientes/semaine = 2 400€/mois. Remboursé en 2 semaines.\n\n---\n\n## 5. Tricopigmentation HFS — 2 500€ HT (3 jours)\n\n**Argument clé** : Marché de la calvitie masculine — 500 à 800€ par séance. Clientèle fidèle (retouches annuelles).\n\n**Objection fréquente** : *\"La clientèle masculine, c''est un marché de niche.\"*\n**Réponse** : 70% des hommes sont concernés par la calvitie. C''est un marché en plein essor, très peu concurrentiel car peu de praticiennes sont formées. Vos clients viennent de loin pour cette prestation.\n\n**ROI** : 500-800€/séance × 2 clients/semaine = 4 000-6 400€/mois. Formation remboursée en 1 semaine.\n\n---\n\n## 6. Aréole Mammaire & Cicatrices — 2 300€ HT (3 jours)\n\n**Argument clé** : Dermopigmentation réparatrice post-mastectomie. Mission humaine + revenus élevés.\n\n**Objection fréquente** : *\"C''est trop médical pour moi.\"*\n**Réponse** : Vous n''êtes pas médecin, vous êtes technicienne en dermopigmentation. Les patientes post-cancer ont besoin de vous. C''est un acte de reconstruction, pas un acte médical.\n\n**ROI** : 400-600€/séance. Partenariats avec cliniques et chirurgiens possibles. Revenus réguliers.\n\n---\n\n## 7. Nanoneedling & BB Glow — 700€ HT (1 jour)\n\n**Argument clé** : Soin anti-âge simple, 80-120€ en institut. Technique facile, résultats immédiats visibles.\n\n**Objection fréquente** : *\"700€ pour 1 jour, c''est beaucoup.\"*\n**Réponse** : En 1 journée, vous repartez avec une nouvelle prestation à 80-120€ que vous pouvez proposer dès le lendemain. Remboursé en 7 clientes.\n\n**ROI** : 100€/soin × 5 clientes/semaine = 2 000€/mois. Remboursé en 1 semaine.\n\n---\n\n## 8. Soin Visage ALLin1 — 900€ HT (1 jour)\n\n**Argument clé** : Soin signature 90-150€ qui combine plusieurs techniques. Différenciez-vous de la concurrence.\n\n**Objection fréquente** : *\"Je fais déjà des soins visage.\"*\n**Réponse** : Le ALLin1 combine des techniques avancées que vous ne proposez probablement pas : microcourant, LED, dermaplaning en un seul soin premium. Vos clientes paieront plus cher pour cette expérience unique.\n\n**ROI** : 120€/soin × 4 clientes/semaine = 1 920€/mois. Remboursé en 2 semaines.\n\n---\n\n## 9. Peeling Chimique & Dermaplaning — 990€ HT (1 jour)\n\n**Argument clé** : Transformez tous types de peau. 120-200€ par séance, cure de 3-6 séances.\n\n**Objection fréquente** : *\"Les peelings, c''est dangereux non ?\"*\n**Réponse** : Pas du tout avec la bonne formation. Vous apprenez à évaluer chaque type de peau, choisir le bon acide, la bonne concentration. Zéro risque quand on est bien formée.\n\n**ROI** : 150€/séance × cure de 4 = 600€/cliente. 3 clientes/mois = 1 800€. Remboursé en 1 mois.\n\n---\n\n## 10. Détatouage & Carbon Peel — 990€ HT (1 jour)\n\n**Argument clé** : Marché du détatouage en pleine croissance. 150-300€ par séance, 6-10 séances par client.\n\n**Objection fréquente** : *\"Il faut un laser cher non ?\"*\n**Réponse** : Dermotec vous forme sur les équipements que nous distribuons aussi. Nous pouvons vous accompagner pour l''achat de votre laser. L''investissement est rentabilisé rapidement.\n\n**ROI** : 200€/séance × 8 séances = 1 600€/client. 2 nouveaux clients/mois = 3 200€. Laser rentabilisé en 3-6 mois.\n\n---\n\n## 11. Épilation Définitive — 990€ HT (1 jour)\n\n**Argument clé** : La prestation la plus demandée en institut. Clientèle récurrente, revenus prévisibles.\n\n**Objection fréquente** : *\"Il y a déjà beaucoup de concurrence sur l''épilation.\"*\n**Réponse** : Justement, la demande est tellement forte que le marché absorbe tous les praticiens. Et avec la formation Dermotec, vous maîtrisez les dernières technologies qui donnent de meilleurs résultats.\n\n**ROI** : 80-150€/séance, forfaits zones 300-600€. Clientèle récurrente (6-10 séances). CA mensuel 3 000€+ facilement atteignable."
  }'::jsonb
);

-- Module 3, Leçon 3 — Calcul ROI par formation
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b3000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000003',
  'calcul-roi',
  'Calcul ROI par formation',
  'texte',
  3, 10, 10,
  '{
    "body": "# Calcul ROI — L''argument qui fait signer\n\n## Pourquoi parler ROI ?\n\nLa plupart des prospects hésitent à cause du **prix**. Ton rôle est de transformer le prix en **investissement** en montrant le retour.\n\n## La formule magique\n\n```\nROI = (Prix séance × Nombre de clientes/semaine × 4 semaines) − Coût formation\n```\n\n## Tableau ROI par formation\n\n| Formation | Coût | Prix séance | Clientes/sem | CA mensuel | Remboursé en |\n|---|---|---|---|---|---|\n| Hygiène | 400€ | — | — | — | Prérequis légal |\n| Maquillage Permanent | 2 490€ | 200€ moy | 3 | 2 400€ | 4 semaines |\n| Microblading | 1 400€ | 200€ | 3 | 2 400€ | 2 semaines |\n| Full Lips | 1 400€ | 300€ | 2 | 2 400€ | 2 semaines |\n| Tricopigmentation | 2 500€ | 650€ | 2 | 5 200€ | 2 semaines |\n| Aréole | 2 300€ | 500€ | 1 | 2 000€ | 5 semaines |\n| Nanoneedling | 700€ | 100€ | 5 | 2 000€ | 1 semaine |\n| ALLin1 | 900€ | 120€ | 4 | 1 920€ | 2 semaines |\n| Peeling | 990€ | 150€ | 3 | 1 800€ | 2 semaines |\n| Détatouage | 990€ | 200€ | 3 | 2 400€ | 2 semaines |\n| Épilation | 990€ | 100€ | 8 | 3 200€ | 1 semaine |\n\n## Comment présenter le ROI au prospect\n\n### Exemple : Microblading (1 400€)\n\n> *\"Marie, le Microblading c''est 200€ la séance minimum. Si vous faites 3 séances par semaine — et croyez-moi la demande est là — ça fait 2 400€ de CA en un mois. Votre formation à 1 400€ est remboursée en 2 semaines. Et ça, c''est sans compter que beaucoup de praticiennes montent à 250-300€ la séance après quelques mois d''expérience.\"*\n\n### Exemple : Tricopigmentation (2 500€)\n\n> *\"La tricopigmentation, c''est 500 à 800€ par séance. Les hommes concernés par la calvitie, il y en a partout. Avec seulement 2 clients par semaine à 650€, vous faites 5 200€ de CA par mois. Votre investissement de 2 500€ est remboursé en 2 semaines.\"*\n\n## Astuce : le double ROI avec financement\n\n> *\"Et le meilleur dans tout ça ? Si votre OPCO prend en charge la formation, votre investissement est de 0€. Le ROI est immédiat et infini.\"*\n\nC''est l''argument massue : **formation financée = ROI immédiat**."
  }'::jsonb
);

-- Module 3, Leçon 4 — Quiz produit
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b3000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000003',
  'quiz-produit',
  'Quiz produit',
  'quiz',
  4, 10, 30,
  '{
    "questions": [
      {
        "question": "Quel est le prix HT de la formation Microblading ?",
        "options": ["990€", "1 200€", "1 400€", "1 600€"],
        "correct": 2,
        "explication": "Le Microblading / Microshading coûte 1 400€ HT pour 2 jours (14 heures)."
      },
      {
        "question": "Quelle formation dure 5 jours ?",
        "options": ["Tricopigmentation", "Maquillage Permanent Complet", "Aréole Mammaire", "Full Lips"],
        "correct": 1,
        "explication": "Le Maquillage Permanent Complet est la seule formation de 5 jours (35 heures) à 2 490€."
      },
      {
        "question": "Combien coûte la séance de Microblading en institut (minimum) ?",
        "options": ["100€", "150€", "200€", "300€"],
        "correct": 2,
        "explication": "Le Microblading se facture minimum 200€ la séance en institut."
      },
      {
        "question": "Quelle est la formation prérequis légal obligatoire ?",
        "options": ["Maquillage Permanent", "Nanoneedling", "Hygiène et Salubrité", "Peeling Chimique"],
        "correct": 2,
        "explication": "L''Hygiène et Salubrité (400€, 3 jours) est le prérequis légal pour exercer toute technique invasive."
      },
      {
        "question": "Quel est le marché cible de la Tricopigmentation ?",
        "options": ["Femmes 25-35 ans", "Hommes atteints de calvitie", "Adolescents acnéiques", "Seniors"],
        "correct": 1,
        "explication": "La Tricopigmentation HFS cible les hommes concernés par la calvitie — 500 à 800€ par séance."
      },
      {
        "question": "En combien de temps le Nanoneedling est-il remboursé ?",
        "options": ["1 semaine", "2 semaines", "1 mois", "3 mois"],
        "correct": 0,
        "explication": "À 100€ le soin et 5 clientes/semaine, le Nanoneedling (700€) est remboursé en 1 semaine."
      },
      {
        "question": "Quelle formation a le meilleur CA mensuel potentiel ?",
        "options": ["Microblading", "Tricopigmentation", "Épilation Définitive", "Maquillage Permanent"],
        "correct": 1,
        "explication": "La Tricopigmentation : 650€/séance × 2 clients/semaine × 4 = 5 200€/mois."
      },
      {
        "question": "Quel argument utiliser quand un prospect dit que c''est trop cher ?",
        "options": ["Faire une remise", "Parler du ROI et du financement", "Proposer une formation moins chère", "Insister sur la qualité"],
        "correct": 1,
        "explication": "Le ROI + le financement (reste à charge potentiel 0€) sont les meilleurs arguments contre l''objection prix."
      },
      {
        "question": "Combien de catégories de formations propose Dermotec ?",
        "options": ["3", "4", "5", "6"],
        "correct": 2,
        "explication": "5 catégories : Hygiène, Dermo-Esthétique, Dermo-Correctrice, Soins Visage, Laser & IPL."
      },
      {
        "question": "Quel bundle proposer systématiquement ?",
        "options": ["2 formations techniques", "Hygiène + formation technique", "3 soins visage", "Tous les lasers"],
        "correct": 1,
        "explication": "L''Hygiène est un prérequis légal. La proposer en bundle avec la formation technique augmente le panier et c''est logique pour la prospect."
      }
    ]
  }'::jsonb
);

-- ────────────────────────────────────────────────────────────
-- MODULE 4 : Techniques de vente
-- ────────────────────────────────────────────────────────────
INSERT INTO academy_modules (id, slug, titre, description, icone, couleur, categorie, ordre, duree_minutes, is_published)
VALUES (
  'a1000000-0000-0000-0000-000000000004',
  'techniques-vente',
  'Techniques de vente',
  'Scripts d''appel, gestion des objections, closing, relance — tout pour convertir.',
  'Phone',
  '#F59E0B',
  'vente',
  4,
  60,
  true
);

-- Module 4, Leçon 1 — Le parcours prospect
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b4000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000004',
  'parcours-prospect',
  'Le parcours prospect',
  'texte',
  1, 8, 10,
  '{
    "body": "# Le Parcours Prospect\n\n## De la découverte à l''inscription\n\nChaque prospect traverse un parcours en 5 phases :\n\n### Phase 1 — Découverte\nLe prospect découvre Dermotec via Instagram, Google, bouche-à-oreille ou salon pro. Il remplit un formulaire ou appelle.\n**Statuts CRM** : `nouveau`\n**Ta mission** : Répondre en moins de 2h.\n\n### Phase 2 — Qualification\nTu appelles pour comprendre son projet, son niveau, ses contraintes.\n**Statuts CRM** : `contacte` → `qualifie`\n**Ta mission** : Identifier la formation, le budget, la disponibilité.\n\n### Phase 3 — Proposition\nTu envoies le programme, les dates de session, le devis. Si besoin, tu planifies un RDV de découverte.\n**Statuts CRM** : `rdv_planifie` → `propose`\n**Ta mission** : Personnaliser l''offre, parler ROI.\n\n### Phase 4 — Négociation & Financement\nLe prospect compare, hésite, a des objections. Tu montes le dossier de financement si besoin.\n**Statuts CRM** : `negocie` → `en_attente`\n**Ta mission** : Traiter les objections, accompagner le financement.\n\n### Phase 5 — Closing\nInscription confirmée, paiement reçu, convocation envoyée.\n**Statuts CRM** : `gagné`\n**Ta mission** : Confirmer, envoyer les documents, fêter ça !\n\n## Les signaux d''achat\n\nRepère ces indices que le prospect est prêt :\n- Pose des questions sur les **dates** de session\n- Demande les **modalités de paiement**\n- Parle de ses **futures clientes**\n- Dit *\"si je fais la formation...\"* (projection)\n- Demande si le **matériel est inclus**\n\n## Les signaux d''alerte\n\n- *\"Je vais réfléchir\"* → objection classique, traite-la maintenant\n- *\"Mon mari/ma mère doit valider\"* → propose un appel à 3\n- Ne rappelle jamais → passe en cadence de relance\n- Fantôme sur WhatsApp → tente un appel"
  }'::jsonb
);

-- Module 4, Leçon 2 — Script appel de qualification
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b4000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000004',
  'script-qualification',
  'Script appel de qualification',
  'script',
  2, 10, 15,
  '{
    "scenario": "Appel sortant vers un lead qui a rempli le formulaire web. Objectif : qualifier le besoin, identifier la formation, évaluer le budget et la disponibilité, planifier la suite.",
    "etapes": [
      { "role": "Commerciale", "texte": "Bonjour [Prénom], c''est [ton prénom] du centre de formation Dermotec. Vous nous avez contactés pour une formation en esthétique, c''est bien ça ?", "note": "Confirme que le lead est au bon endroit. Ton chaleureux et professionnel." },
      { "role": "Prospect", "texte": "Oui, bonjour ! J''ai rempli le formulaire sur votre site." },
      { "role": "Commerciale", "texte": "Super, merci pour votre intérêt ! Je vais vous poser quelques questions pour bien comprendre votre projet et vous orienter vers la formation idéale. Ça vous prend 5-10 minutes, c''est bon pour vous ?", "note": "Demande la permission + donne un temps estimé. Ça rassure." },
      { "role": "Prospect", "texte": "Oui bien sûr, allez-y." },
      { "role": "Commerciale", "texte": "Parfait ! Alors dites-moi, quelle est votre situation actuelle ? Vous êtes esthéticienne en activité, en reconversion, ou vous avez un institut ?", "note": "Question ouverte pour comprendre le profil. Adapte la suite selon la réponse." },
      { "role": "Prospect", "texte": "Je suis esthéticienne en institut depuis 5 ans, et j''aimerais ajouter le microblading à mes prestations." },
      { "role": "Commerciale", "texte": "Excellent choix ! Le microblading c''est la prestation la plus demandée en ce moment. Vous avez déjà une idée du prix en institut ? C''est minimum 200€ la séance. Avec 3 clientes par semaine, vous récupérez votre investissement en 2 semaines.", "note": "Rebondis avec l''argument ROI. Montre que tu connais le marché." },
      { "role": "Commerciale", "texte": "D''ailleurs, est-ce que vous avez déjà votre certificat Hygiène et Salubrité ? C''est le prérequis légal pour pratiquer.", "note": "Identifie le besoin d''upsell Hygiène." },
      { "role": "Prospect", "texte": "Non, je ne l''ai pas..." },
      { "role": "Commerciale", "texte": "Pas de souci, on propose les deux ! La plupart de nos stagiaires font l''Hygiène puis enchaînent avec le Microblading. Et la bonne nouvelle, c''est que les deux sont finançables. Justement, au niveau du financement, vous savez si votre OPCO prend en charge les formations ?", "note": "Propose le bundle naturellement. Introduis le sujet financement." },
      { "role": "Prospect", "texte": "Je ne sais pas trop comment ça marche..." },
      { "role": "Commerciale", "texte": "C''est tout à fait normal, on est là pour ça ! On travaille avec 12 organismes de financement. Si vous êtes salariée, votre OPCO peut prendre en charge jusqu''à 100%. Si vous êtes indépendante, il y a le FAFCEA ou le CPF. On s''occupe de monter le dossier avec vous, étape par étape.", "note": "Rassure et propose l''accompagnement. C''est un argument différenciant." },
      { "role": "Commerciale", "texte": "Au niveau des dates, vous avez une idée de quand vous aimeriez vous former ? On a des sessions tous les mois.", "note": "Engage vers le closing : si elle parle dates, elle se projette." },
      { "role": "Prospect", "texte": "Plutôt en mars ou avril, j''ai un creux à ces périodes." },
      { "role": "Commerciale", "texte": "Parfait, on a justement des sessions en mars. Ce que je vous propose, c''est de vous envoyer par email le programme complet du Microblading avec les dates disponibles et les infos financement. Et on se fixe un point téléphonique dans 2-3 jours pour avancer. Ça vous va ?", "note": "Propose un next step concret. Ne jamais raccrocher sans action suivante." },
      { "role": "Prospect", "texte": "Oui, super !" },
      { "role": "Commerciale", "texte": "Top ! Je vous envoie ça dès qu''on raccroche. N''hésitez pas si vous avez des questions entre-temps. Bonne journée [Prénom] !", "note": "Clôture positive. Envoie l''email IMMÉDIATEMENT après le call." }
    ]
  }'::jsonb
);

-- Module 4, Leçon 3 — Gestion des 12 objections
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b4000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000004',
  'gestion-objections',
  'Gestion des 12 objections',
  'script',
  3, 12, 15,
  '{
    "scenario": "Les 12 objections les plus fréquentes en appel de vente pour les formations esthétiques. Pour chacune : la réponse et la question rebond pour reprendre le contrôle.",
    "etapes": [
      { "role": "Prospect", "texte": "C''est trop cher.", "note": "OBJECTION #1 — La plus fréquente" },
      { "role": "Commerciale", "texte": "Je comprends, c''est un investissement. Mais regardons les chiffres : avec le Microblading à 200€ la séance et 3 clientes par semaine, vous récupérez vos 1 400€ en 2 semaines. Et avec le financement OPCO, votre reste à charge peut être de 0€. Vous connaissez votre OPCO ?", "note": "ROI + financement. Toujours finir par une question." },
      { "role": "Prospect", "texte": "Je vais réfléchir.", "note": "OBJECTION #2 — La classique" },
      { "role": "Commerciale", "texte": "Bien sûr, c''est important de bien réfléchir. Pour vous aider à y voir clair, qu''est-ce qui vous fait hésiter exactement ? C''est le prix, les dates, ou autre chose ?", "note": "Creuse l''objection. ''Réfléchir'' cache toujours une vraie raison." },
      { "role": "Prospect", "texte": "Je vais comparer avec d''autres centres.", "note": "OBJECTION #3" },
      { "role": "Commerciale", "texte": "C''est tout à fait normal de comparer. Ce qui fait la différence chez Dermotec : on est certifié Qualiopi donc finançable, on pratique sur modèles vivants dès le jour 2, le matériel NPM est inclus, et on assure un suivi post-formation. Quels critères sont les plus importants pour vous ?", "note": "Différenciation + question pour comprendre les priorités." },
      { "role": "Prospect", "texte": "Je n''ai pas le budget.", "note": "OBJECTION #4" },
      { "role": "Commerciale", "texte": "Justement, c''est pour ça qu''on travaille avec 12 organismes de financement. La majorité de nos stagiaires ne paient pas un euro de leur poche. Est-ce que vous êtes salariée ou indépendante ?", "note": "Redirige vers le financement. La question permet de qualifier." },
      { "role": "Prospect", "texte": "Mon conjoint / ma famille n''est pas convaincu.", "note": "OBJECTION #5" },
      { "role": "Commerciale", "texte": "C''est normal que votre entourage veuille comprendre. Est-ce que ça vous aiderait si je vous envoyais un document clair avec le programme, le ROI chiffré et les options de financement ? Comme ça vous pouvez en discuter ensemble avec tous les éléments.", "note": "Fournir des arguments pour le ''décideur caché''." },
      { "role": "Prospect", "texte": "J''ai peur de ne pas trouver de clientes.", "note": "OBJECTION #6" },
      { "role": "Commerciale", "texte": "Je comprends cette inquiétude. Mais regardez les chiffres : le microblading, c''est 200 000 recherches Google par mois en France. La demande est là, le problème c''est plutôt le manque de praticiennes qualifiées. D''ailleurs, on a une communauté alumni qui s''entraide pour la visibilité. Vous avez un Instagram pro ?", "note": "Données marché + communauté. Question pour creuser." },
      { "role": "Prospect", "texte": "2 jours c''est trop court, je ne serai pas prête.", "note": "OBJECTION #7" },
      { "role": "Commerciale", "texte": "Nos formatrices ont plus de 10 ans d''expérience et notre méthode est intensive : théorie le matin, pratique l''après-midi, d''abord sur peau synthétique puis sur modèle vivant. Et après la formation, vous avez un suivi : envoyez-nous des photos de vos premiers travaux, on vous corrige. Vous ne serez pas lâchée dans la nature.", "note": "Rassurer sur la pédagogie et le suivi post-formation." },
      { "role": "Prospect", "texte": "Je ne suis pas esthéticienne de base.", "note": "OBJECTION #8" },
      { "role": "Commerciale", "texte": "Pas de problème ! Beaucoup de nos stagiaires sont en reconversion. La formation est conçue pour les débutantes. Vous commencez par les bases. Le seul prérequis c''est l''Hygiène et Salubrité, qu''on propose aussi. Quel est votre métier actuel ?", "note": "Normalise la reconversion. Upsell Hygiène naturel." },
      { "role": "Prospect", "texte": "Je suis enceinte / en congé mat.", "note": "OBJECTION #9" },
      { "role": "Commerciale", "texte": "Félicitations ! On peut tout à fait planifier votre formation pour après votre congé. On a des sessions tous les mois. On peut même commencer à monter votre dossier de financement maintenant pour que tout soit prêt le jour J. Vous reprenez quand à peu près ?", "note": "Reporter, pas annuler. Garder le lien." },
      { "role": "Prospect", "texte": "J''ai déjà fait une formation ailleurs et ça ne m''a pas plu.", "note": "OBJECTION #10" },
      { "role": "Commerciale", "texte": "Je suis désolée d''entendre ça. Est-ce que vous pouvez me dire ce qui ne vous a pas convenu ? Chez Dermotec, on insiste sur la pratique sur modèles vivants, les groupes de 6 max, et le suivi post-formation. Et on est certifié Qualiopi, ce qui garantit un niveau de qualité audité.", "note": "Empathie + différenciation. Comprendre la mauvaise expérience." },
      { "role": "Prospect", "texte": "Je n''ai pas confiance, il y a des arnaques dans le secteur.", "note": "OBJECTION #11" },
      { "role": "Commerciale", "texte": "Vous avez raison d''être prudente, il y a malheureusement des formations douteuses. C''est pour ça que Dermotec est certifié Qualiopi — c''est le label de l''État qui garantit la qualité. On a plus de 200 avis Google positifs. Et vous pouvez venir visiter le centre avant de vous inscrire, on est au 75 Bd Richard Lenoir dans le 11e. Ça vous dirait de passer ?", "note": "Preuves sociales : Qualiopi + avis + invitation physique." },
      { "role": "Prospect", "texte": "Les dates ne me conviennent pas.", "note": "OBJECTION #12" },
      { "role": "Commerciale", "texte": "On a des sessions tous les mois, donc on va trouver une date qui vous arrange. Quelles sont vos contraintes ? Plutôt en semaine ou le week-end ? Quel mois vous conviendrait le mieux ?", "note": "Objection facile à traiter. Proposer des alternatives." }
    ]
  }'::jsonb
);

-- Module 4, Leçon 4 — Script de closing
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b4000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000004',
  'script-closing',
  'Script de closing',
  'script',
  4, 8, 15,
  '{
    "scenario": "Le lead est chaud : il a reçu le programme, posé des questions, validé le financement ou le budget. Il est temps de conclure l''inscription.",
    "etapes": [
      { "role": "Commerciale", "texte": "Bonjour [Prénom] ! C''est [ton prénom] de Dermotec. Comment allez-vous ? Je vous appelle suite à notre échange de la semaine dernière sur la formation [Formation]. Vous aviez eu le temps de regarder le programme ?", "note": "Rappelle le contexte. Ton enthousiaste mais pas agressif." },
      { "role": "Prospect", "texte": "Oui j''ai bien regardé, c''est intéressant." },
      { "role": "Commerciale", "texte": "Super ! Est-ce que vous avez des questions sur le contenu ou le déroulement ?", "note": "Laisse le prospect poser ses dernières questions. Montre que tu es là pour l''aider." },
      { "role": "Prospect", "texte": "Non c''est assez clair, je pense que c''est ce qu''il me faut." },
      { "role": "Commerciale", "texte": "Parfait ! Alors j''ai une bonne nouvelle : on a encore 2 places sur la session du [date]. Les groupes sont limités à 6 personnes pour que chacune ait un maximum de temps de pratique. Est-ce que cette date vous convient ?", "note": "Urgence douce (places limitées = vrai). Propose une date concrète." },
      { "role": "Prospect", "texte": "Oui ça me va !" },
      { "role": "Commerciale", "texte": "Excellent ! Pour finaliser votre inscription, je vais vous envoyer un lien de paiement sécurisé par email. C''est un paiement Stripe, totalement sécurisé. Et si votre OPCO prend en charge, on peut aussi envoyer la facture directement à l''organisme. Vous préférez quelle option ?", "note": "Deux options = choix facilité. Le prospect ne dit pas oui/non mais choisit comment." },
      { "role": "Prospect", "texte": "Je vais payer moi-même pour l''instant." },
      { "role": "Commerciale", "texte": "Parfait, je vous envoie le lien dans les 2 minutes. Dès que le paiement est confirmé, vous recevrez votre convocation avec toutes les infos pratiques : adresse du centre, horaires, ce qu''il faut apporter. Avez-vous d''autres questions ?", "note": "Rassure sur la suite. Prochaines étapes claires." },
      { "role": "Commerciale", "texte": "Bienvenue chez Dermotec [Prénom] ! Vous avez fait le bon choix. On se retrouve le [date] au 75 Boulevard Richard Lenoir. Bonne journée !", "note": "Félicite le choix. Ancre la date et le lieu. Envoie le lien IMMÉDIATEMENT." }
    ]
  }'::jsonb
);

-- Module 4, Leçon 5 — L'art de la relance
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b4000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000004',
  'art-relance',
  'L''art de la relance',
  'texte',
  5, 8, 10,
  '{
    "body": "# L''Art de la Relance\n\n## Règle d''or\n\n**80% des ventes se font entre la 5e et la 12e relance.** La plupart des commerciales abandonnent après 2. Ne sois pas la plupart.\n\n## Le timing parfait\n\n| Après quoi | Quand relancer | Canal |\n|---|---|---|\n| 1er appel sans réponse | Le lendemain matin | WhatsApp |\n| Email envoyé (programme) | J+2 | Appel |\n| Devis envoyé | J+2 | Appel |\n| Réponse ''je réfléchis'' | J+3 | WhatsApp |\n| Pas de nouvelle depuis 1 sem | J+7 | Appel |\n| Fantôme depuis 2 sem | J+14 | Email + WhatsApp |\n| Lead froid (1 mois+) | Lors d''une nouvelle session | Email |\n\n## Les 5 types de relance\n\n### 1. La relance valeur\n> *\"Bonjour [Prénom], je voulais vous partager un témoignage de Marie qui a suivi le Microblading le mois dernier. Elle a déjà 5 clientes par semaine ! [lien photo avant/après]\"*\n\n### 2. La relance urgence\n> *\"[Prénom], il ne reste que 2 places sur la session du [date]. Je vous la réserve ?\"*\n\n### 3. La relance aide\n> *\"Bonjour [Prénom], je me permets de revenir vers vous. Avez-vous besoin d''aide pour le dossier de financement ? Je peux m''en occuper avec vous.\"*\n\n### 4. La relance info\n> *\"[Prénom], bonne nouvelle : les OPCO ont rallongé les délais de prise en charge. Vous pourriez être éligible à un financement à 100%. On en parle ?\"*\n\n### 5. La relance dernière chance\n> *\"Bonjour [Prénom], je fais un point sur les inscriptions pour [mois]. Si vous êtes toujours intéressée par le [Formation], c''est le moment de finaliser. Après ça, la prochaine session est dans 2 mois.\"*\n\n## Canaux par efficacité\n\n1. **Appel téléphonique** — le plus efficace pour le closing\n2. **WhatsApp** — le meilleur taux d''ouverture et de réponse\n3. **Email** — pour les infos détaillées et les documents\n4. **SMS** — en dernier recours, pour les leads qui ne répondent nulle part\n\n## Ce qu''il ne faut JAMAIS faire\n\n- Relancer 2 fois le même jour\n- Être agressif ou culpabilisant\n- Envoyer un message identique à la relance précédente\n- Abandonner avant la 5e relance"
  }'::jsonb
);

-- Module 4, Leçon 6 — Role-play
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b4000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000004',
  'role-play',
  'Role-play',
  'exercice',
  6, 10, 15,
  '{
    "consigne": "Entraîne-toi avec un·e collègue en jouant ces 3 scénarios. L''un joue la commerciale, l''autre le prospect. Changez de rôle après chaque scénario.",
    "exemple": "Scénario 1 : Lead formulaire — Une esthéticienne de 28 ans appelle après avoir vu une pub Instagram. Elle s''intéresse au Microblading mais trouve ça cher. Objectif : qualifier, argumenter le ROI, proposer le financement.",
    "criteres": [
      "A posé au moins 3 questions de qualification (situation, formation souhaitée, budget)",
      "A utilisé l''argument ROI avec des chiffres concrets",
      "A mentionné le financement et proposé de monter le dossier",
      "A traité au moins 2 objections avec les techniques apprises",
      "A fixé un next step concret avant de raccrocher",
      "Ton chaleureux et professionnel (ni agressif, ni hésitant)",
      "Scénario 2 : Relance d''un lead fantôme — Le prospect n''a pas répondu depuis 10 jours après l''envoi du programme. Appel de relance. Objectif : comprendre ce qui bloque et réengager.",
      "Scénario 3 : Closing — Le prospect est chaud, le financement est validé, il reste à fixer la date et encaisser. Objectif : confirmer l''inscription en un appel."
    ]
  }'::jsonb
);

-- Module 4, Leçon 7 — Quiz vente
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b4000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000004',
  'quiz-vente',
  'Quiz vente',
  'quiz',
  7, 8, 25,
  '{
    "questions": [
      {
        "question": "Quel pourcentage des ventes se font après la 5e relance ?",
        "options": ["20%", "50%", "80%", "95%"],
        "correct": 2,
        "explication": "80% des ventes se font entre la 5e et la 12e relance. La persévérance est la clé."
      },
      {
        "question": "Quand un prospect dit ''je vais réfléchir'', que fais-tu ?",
        "options": ["Tu attends son rappel", "Tu le rappelles dans 1 mois", "Tu creuses pour identifier la vraie objection", "Tu fais une remise immédiate"],
        "correct": 2,
        "explication": "''Réfléchir'' cache toujours une vraie raison (prix, timing, peur). Pose la question : ''Qu''est-ce qui vous fait hésiter exactement ?''"
      },
      {
        "question": "Quel est le meilleur argument contre ''c''est trop cher'' ?",
        "options": ["Faire une remise de 10%", "Montrer le ROI chiffré + options de financement", "Proposer une formation moins chère", "Dire que c''est le prix du marché"],
        "correct": 1,
        "explication": "Le ROI transforme un coût en investissement. Le financement peut réduire le reste à charge à 0€."
      },
      {
        "question": "Comment clôturer un appel de qualification ?",
        "options": ["''Bonne journée !''", "''Je vous rappelle quand vous voulez''", "Fixer un next step concret (email + rappel à J+2)", "''Rappelez-nous si ça vous intéresse''"],
        "correct": 2,
        "explication": "Toujours finir avec une action concrète et une date. ''Je vous envoie le programme et on se fait un point jeudi matin, ça vous va ?''"
      },
      {
        "question": "Quel canal a le meilleur taux de réponse pour les relances ?",
        "options": ["Email", "Courrier", "WhatsApp", "SMS"],
        "correct": 2,
        "explication": "WhatsApp a le meilleur taux d''ouverture (90%+) et de réponse. Les gens vivent sur WhatsApp."
      },
      {
        "question": "Quels sont les signaux d''achat chez un prospect ?",
        "options": ["Il parle de prix", "Il demande les dates de session et parle de ses futures clientes", "Il dit ''intéressant''", "Il visite le site web"],
        "correct": 1,
        "explication": "Les questions sur les dates et la projection vers ses futures clientes montrent que le prospect se voit déjà formé."
      },
      {
        "question": "Combien de places maximum par session chez Dermotec ?",
        "options": ["4", "6", "10", "12"],
        "correct": 1,
        "explication": "6 personnes max par session. C''est un argument de vente : attention personnalisée et maximum de pratique."
      },
      {
        "question": "Que faire quand un prospect compare avec un autre centre ?",
        "options": ["Baisser le prix", "Critiquer le concurrent", "Mettre en avant les différenciateurs Dermotec (Qualiopi, modèles vivants, matériel inclus, suivi)", "Abandonner le lead"],
        "correct": 2,
        "explication": "Jamais critiquer un concurrent. Mets en avant ce qui te différencie : Qualiopi, pratique sur modèles vivants, matériel NPM inclus, suivi post-formation, groupes de 6 max."
      }
    ]
  }'::jsonb
);

-- ────────────────────────────────────────────────────────────
-- MODULE 5 : Guide financement complet
-- ────────────────────────────────────────────────────────────
INSERT INTO academy_modules (id, slug, titre, description, icone, couleur, categorie, ordre, duree_minutes, is_published)
VALUES (
  'a1000000-0000-0000-0000-000000000005',
  'guide-financement',
  'Guide financement complet',
  'OPCO, France Travail, CPF — maîtrise les 12 organismes et monte les dossiers sans erreur.',
  'Wallet',
  '#EF4444',
  'financement',
  5,
  50,
  true
);

-- Module 5, Leçon 1 — Vue d'ensemble financement
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b5000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000005',
  'vue-ensemble-financement',
  'Vue d''ensemble financement',
  'texte',
  1, 10, 10,
  '{
    "body": "# Vue d''ensemble — Financement des formations\n\n## Pourquoi c''est crucial\n\nLe financement est l''**arme secrète** de la commerciale. Quand un prospect dit ''c''est trop cher'', ta réponse c''est : ''votre OPCO peut prendre en charge 100% du coût''.\n\n**60% de nos inscriptions passent par un financement.** C''est le levier numéro 1.\n\n## Les 12 organismes partenaires\n\n### OPCO (pour les salariées)\n| OPCO | Secteur | Éligibilité |\n|---|---|---|\n| **OPCO EP** | Entreprises de proximité (instituts, salons) | Salariée d''un institut/salon |\n| **FAFIH** | Hôtellerie-restauration (spa hôtels) | Salariée d''un spa en hôtel |\n| **AFDAS** | Culture, médias, loisirs | Intermittentes, freelances culture |\n| **ATLAS** | Services financiers, conseil | Reconversions depuis ces secteurs |\n| **OPCOMMERCE** | Commerce | Salariée commerce de détail |\n\n### Pour les indépendantes\n| Organisme | Éligibilité |\n|---|---|\n| **FAFCEA** | Artisanes, micro-entrepreneuses |\n| **AGEFICE** | Commerçantes, dirigeantes |\n| **FIF-PL** | Professions libérales |\n\n### Dispositifs publics\n| Dispositif | Éligibilité |\n|---|---|\n| **France Travail (ex-Pôle Emploi)** | Demandeuses d''emploi |\n| **CPF (MonCompteFormation)** | Toute personne ayant cotisé |\n| **Agefiph** | Personnes en situation de handicap |\n| **Conseil Régional** | Selon les régions, dispositifs spécifiques |\n\n## Qui est éligible à quoi ?\n\n| Profil | 1er choix | 2e choix |\n|---|---|---|\n| Salariée institut | OPCO EP | CPF |\n| Salariée spa hôtel | FAFIH | CPF |\n| Auto-entrepreneuse | FAFCEA | CPF |\n| Gérante institut (SARL/SAS) | AGEFICE | OPCO EP |\n| Demandeuse d''emploi | France Travail (AIF) | Conseil Régional |\n| En reconversion (salariée) | CPF Transition Pro | OPCO de son secteur |\n| Profession libérale | FIF-PL | CPF |\n\n## Les questions à poser au prospect\n\n1. **Vous êtes salariée, indépendante, ou en recherche d''emploi ?**\n2. **Si salariée : dans quel type de structure ? (institut, spa, hôtel, autre)**\n3. **Vous avez déjà utilisé votre CPF cette année ?**\n4. **Vous avez un conseiller France Travail ?** (si demandeuse d''emploi)\n\nAvec ces 4 réponses, tu sais exactement quel organisme solliciter."
  }'::jsonb
);

-- Module 5, Leçon 2 — Dossier OPCO pas à pas
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b5000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000005',
  'dossier-opco',
  'Dossier OPCO pas à pas',
  'texte',
  2, 10, 10,
  '{
    "body": "# Dossier OPCO — Pas à Pas\n\n## Étape 1 : Identifier l''OPCO (J+0)\n\nDemande au prospect le **code NAF/APE** de son employeur (sur la fiche de paie). Chaque code correspond à un OPCO.\n\n- Code 96.02A / 96.02B (coiffure, esthétique) → **OPCO EP**\n- Code 55.xx (hébergement) → **FAFIH**\n- En doute ? → Vérifie sur quel-est-mon-opco.fr\n\n## Étape 2 : Monter le dossier (J+1 à J+3)\n\n### Documents à fournir par l''entreprise :\n- Formulaire de demande de prise en charge (PDF sur le site de l''OPCO)\n- Convention de formation (on la fournit, signée par Dermotec)\n- Programme de formation (on le fournit)\n- Devis (on le fournit)\n- RIB de l''entreprise\n\n### Documents fournis par Dermotec :\n- Convention de formation pré-remplie\n- Programme détaillé de la formation\n- Devis officiel\n- Certificat Qualiopi (indispensable pour la prise en charge)\n\n## Étape 3 : Soumettre (J+3 à J+5)\n\n- **OPCO EP** : soumission en ligne sur portail-ep.opcoep.fr\n- Délai de traitement : **15 à 30 jours ouvrés** en moyenne\n- Montant pris en charge : variable selon le barème de l''OPCO et la taille de l''entreprise\n\n## Étape 4 : Suivi (J+5 à J+30)\n\n- Relance à J+10 si pas de retour\n- L''OPCO peut demander des pièces complémentaires → réagis dans les 48h\n- Une fois l''accord obtenu → inscris le stagiaire immédiatement\n\n## Étape 5 : Après la formation\n\n- Envoyer à l''OPCO : attestation de présence, feuille d''émargement, facture\n- L''OPCO paie Dermotec directement (subrogation) ou rembourse l''entreprise\n\n## Pièges à éviter\n\n1. **Soumettre trop tard** — certains OPCO exigent la demande 15 jours AVANT le début de la formation\n2. **Oublier le Qualiopi** — sans certificat valide, pas de prise en charge\n3. **Documents incomplets** — la moindre pièce manquante retarde tout de 2 semaines\n4. **Ne pas relancer** — les OPCO sont lents, il faut pousser\n5. **Mauvais OPCO** — vérifier le code NAF, une erreur = dossier rejeté"
  }'::jsonb
);

-- Module 5, Leçon 3 — France Travail / AIF
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b5000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000005',
  'france-travail-aif',
  'France Travail / AIF',
  'texte',
  3, 10, 10,
  '{
    "body": "# France Travail (ex-Pôle Emploi) — Financement AIF\n\n## C''est quoi l''AIF ?\n\nL''**Aide Individuelle à la Formation** (AIF) est un financement France Travail pour les demandeurs d''emploi. Elle couvre tout ou partie du coût de la formation.\n\n## Qui est éligible ?\n\n- Inscrit·e à France Travail comme demandeur·euse d''emploi\n- Projet de formation validé avec son conseiller\n- Formation certifiée Qualiopi (c''est notre cas)\n\n## Le processus KAIROS\n\n### Qu''est-ce que KAIROS ?\nKAIROS est la plateforme en ligne de France Travail pour la gestion des demandes de formation. C''est par là que tout passe.\n\n### Étape 1 : Créer le devis sur KAIROS (Dermotec le fait)\n1. On se connecte sur kairos.pole-emploi.fr avec nos identifiants organisme\n2. On crée un devis pour la formation demandée\n3. On renseigne : formation, dates, prix, lieu, durée\n4. Le devis est envoyé au conseiller France Travail du prospect\n\n### Étape 2 : Le prospect contacte son conseiller\nLe prospect doit :\n1. Appeler son conseiller France Travail\n2. Lui dire qu''il a un devis KAIROS en attente pour une formation Dermotec\n3. Demander la validation\n\n**C''est l''étape critique** — le conseiller doit valider que la formation est cohérente avec le projet professionnel.\n\n### Étape 3 : Validation (5 à 20 jours)\n- Le conseiller examine le devis\n- Il peut demander des informations complémentaires\n- Il valide ou refuse\n- En cas de validation → le financement est confirmé\n\n### Étape 4 : Inscription\n- Dès validation, on inscrit le stagiaire\n- France Travail paie Dermotec directement après la formation\n\n## Délais moyens\n\n| Étape | Durée |\n|---|---|\n| Création devis KAIROS | 1 jour |\n| Contact conseiller par le prospect | 1-5 jours |\n| Validation conseiller | 5-20 jours |\n| **Total** | **7 à 26 jours** |\n\n## Conseils pour accélérer\n\n1. **Prépare le prospect** : donne-lui le script exact pour appeler son conseiller\n2. **Envoie le devis KAIROS le jour même** de la qualification\n3. **Relance le prospect à J+3** : ''Avez-vous eu votre conseiller ?''\n4. **Si le conseiller hésite** : on peut l''appeler directement pour expliquer la formation et le débouché professionnel\n\n## Script pour le prospect\n\nDonne ce script au prospect pour qu''il appelle son conseiller :\n\n> *''Bonjour, je vous appelle car j''ai un projet de formation en [technique esthétique] avec le centre Dermotec, qui est certifié Qualiopi. J''ai un devis sur KAIROS en attente de votre validation. C''est une formation courte de [X] jours qui me permettra de [exercer / ajouter une prestation / me reconvertir]. Pouvez-vous le consulter ?''*"
  }'::jsonb
);

-- Module 5, Leçon 4 — CPF & MonCompteFormation
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b5000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005',
  'cpf-moncompteformation',
  'CPF & MonCompteFormation',
  'texte',
  4, 8, 10,
  '{
    "body": "# CPF & MonCompteFormation\n\n## Le CPF en 2026\n\n### Reste à charge\nDepuis 2024, il y a un **reste à charge obligatoire** de 100€ pour toute formation CPF. Ce montant est payé par le stagiaire et ne peut pas être pris en charge par l''employeur (sauf exceptions).\n\n### Droits acquis\nChaque salarié ou indépendant cumule **500€/an** sur son CPF (plafonné à 5 000€). Pour vérifier son solde : moncompteformation.gouv.fr\n\n## Les formations Dermotec éligibles CPF\n\nPour qu''une formation soit éligible CPF, elle doit mener à une certification inscrite au RNCP ou au RS. Nos formations éligibles :\n- Hygiène et Salubrité ✅\n- Maquillage Permanent Complet ✅\n\nLes autres formations ne sont **pas encore éligibles CPF** mais le sont via OPCO et France Travail.\n\n## Étapes d''inscription CPF\n\n### Pour le prospect :\n1. Se connecter sur **moncompteformation.gouv.fr** ou l''app mobile\n2. S''identifier avec FranceConnect (identité numérique)\n3. Rechercher ''Dermotec'' ou le nom de la formation\n4. Sélectionner la session souhaitée\n5. Valider et payer le reste à charge de 100€\n\n### Ce que fait Dermotec :\n1. On publie les sessions sur la plateforme MonCompteFormation\n2. On valide l''inscription côté organisme\n3. On gère l''émargement et l''attestation\n\n## Attention aux arnaques CPF\n\n⚠️ **JAMAIS** démarcher par téléphone pour le CPF. C''est **illégal** depuis 2022 (loi anti-démarchage CPF). Si un prospect nous contacte de lui-même, parfait. Mais on ne l''appelle **jamais** pour lui proposer d''utiliser son CPF.\n\n## Quand orienter vers le CPF ?\n\n- Le prospect est salarié et son OPCO ne prend pas en charge\n- Le prospect est indépendant et le FAFCEA/AGEFICE est épuisé\n- Le prospect a un solde CPF suffisant\n- La formation est éligible (Hygiène ou Maquillage Permanent)\n\n## Combinaison CPF + autre financement\n\nSi le solde CPF ne couvre pas tout, le prospect peut compléter :\n- Avec son propre argent\n- Avec un abondement de son employeur\n- Avec un abondement France Travail (si demandeur d''emploi)"
  }'::jsonb
);

-- Module 5, Leçon 5 — Checklist documents par organisme
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b5000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000005',
  'checklist-documents-financement',
  'Checklist documents par organisme',
  'checklist',
  5, 7, 15,
  '{
    "items": [
      { "label": "OPCO (tous) — Avant la formation", "description": "Formulaire de demande de prise en charge (spécifique à chaque OPCO) + Convention de formation signée + Programme détaillé + Devis + Certificat Qualiopi Dermotec + RIB de l''entreprise" },
      { "label": "OPCO (tous) — Après la formation", "description": "Attestation de présence + Feuilles d''émargement signées + Facture Dermotec + Évaluation de satisfaction stagiaire" },
      { "label": "France Travail (AIF) — Avant", "description": "Devis KAIROS (créé par Dermotec) + Validation du conseiller France Travail + Attestation d''inscription France Travail du prospect" },
      { "label": "France Travail (AIF) — Après", "description": "Attestation de présence + Feuilles d''émargement + Facture + Attestation de fin de formation" },
      { "label": "CPF — Avant", "description": "Inscription validée sur MonCompteFormation + Paiement du reste à charge (100€) + Pièce d''identité du stagiaire" },
      { "label": "CPF — Après", "description": "Émargement dématérialisé + Attestation de fin de formation + Évaluation sur la plateforme" },
      { "label": "FAFCEA / AGEFICE — Avant", "description": "Attestation URSSAF à jour + Convention de formation + Programme + Devis + Extrait Kbis ou attestation auto-entrepreneur" },
      { "label": "FAFCEA / AGEFICE — Après", "description": "Attestation de présence + Feuilles d''émargement + Facture acquittée + Évaluation" },
      { "label": "Documents toujours fournis par Dermotec", "description": "Convention de formation (modèle Qualiopi) + Programme détaillé avec objectifs pédagogiques + Devis/facture + Certificat Qualiopi valide + Règlement intérieur + Attestation de fin de formation + Feuilles d''émargement" },
      { "label": "Vérification avant envoi", "description": "Tous les documents sont signés + Dates cohérentes (demande AVANT la formation) + Montants identiques sur devis, convention et facture + Nom et prénom corrects partout + Certificat Qualiopi non expiré" }
    ]
  }'::jsonb
);

-- Module 5, Leçon 6 — Quiz financement
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b5000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000005',
  'quiz-financement',
  'Quiz financement',
  'quiz',
  6, 8, 25,
  '{
    "questions": [
      {
        "question": "Quel OPCO couvre les instituts de beauté et salons d''esthétique ?",
        "options": ["FAFIH", "OPCO EP", "ATLAS", "AFDAS"],
        "correct": 1,
        "explication": "OPCO EP (Entreprises de Proximité) couvre les codes NAF 96.02A et 96.02B (coiffure, soins de beauté)."
      },
      {
        "question": "Combien d''organismes de financement partenaires a Dermotec ?",
        "options": ["5", "8", "12", "15"],
        "correct": 2,
        "explication": "Dermotec travaille avec 12 organismes : 5 OPCO, 3 fonds pour indépendants, et 4 dispositifs publics."
      },
      {
        "question": "Quel est le reste à charge obligatoire pour le CPF en 2026 ?",
        "options": ["0€", "50€", "100€", "200€"],
        "correct": 2,
        "explication": "Depuis 2024, un reste à charge de 100€ est obligatoire pour toute formation financée par le CPF."
      },
      {
        "question": "Quelle plateforme utilise France Travail pour les demandes de formation ?",
        "options": ["MonCompteFormation", "KAIROS", "EDOF", "Démarches Simplifiées"],
        "correct": 1,
        "explication": "KAIROS est la plateforme de France Travail pour la gestion des devis et demandes de formation."
      },
      {
        "question": "Quel document est indispensable pour obtenir un financement ?",
        "options": ["Le CV du stagiaire", "Le certificat Qualiopi", "Un business plan", "Une lettre de motivation"],
        "correct": 1,
        "explication": "Sans certification Qualiopi, aucun organisme public ne finance la formation. C''est le document clé."
      },
      {
        "question": "Une auto-entrepreneuse esthéticienne, quel financement en premier choix ?",
        "options": ["OPCO EP", "FAFCEA", "France Travail", "CPF"],
        "correct": 1,
        "explication": "Le FAFCEA est le fonds de formation des artisans, incluant les auto-entrepreneuses en esthétique."
      },
      {
        "question": "Combien de jours AVANT la formation faut-il soumettre le dossier OPCO ?",
        "options": ["La veille", "7 jours", "15 jours minimum", "1 mois"],
        "correct": 2,
        "explication": "Certains OPCO exigent la demande au moins 15 jours avant le début. Toujours anticiper."
      },
      {
        "question": "Quel pourcentage d''inscriptions Dermotec passent par un financement ?",
        "options": ["20%", "40%", "60%", "80%"],
        "correct": 2,
        "explication": "60% des inscriptions sont financées. C''est le levier n°1 pour lever l''objection prix."
      }
    ]
  }'::jsonb
);

-- ────────────────────────────────────────────────────────────
-- MODULE 6 : Qualité & Qualiopi
-- ────────────────────────────────────────────────────────────
INSERT INTO academy_modules (id, slug, titre, description, icone, couleur, categorie, ordre, duree_minutes, is_published)
VALUES (
  'a1000000-0000-0000-0000-000000000006',
  'qualite-qualiopi',
  'Qualité & Qualiopi',
  'Comprends la certification Qualiopi, ses critères, et comment maintenir la conformité au quotidien.',
  'ShieldCheck',
  '#06B6D4',
  'qualite',
  6,
  25,
  true
);

-- Module 6, Leçon 1 — Comprendre Qualiopi
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b6000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000006',
  'comprendre-qualiopi',
  'Comprendre Qualiopi',
  'texte',
  1, 10, 10,
  '{
    "body": "# Comprendre Qualiopi\n\n## C''est quoi ?\n\nQualiopi est la **certification qualité nationale** obligatoire pour les organismes de formation souhaitant accéder aux fonds publics et mutualisés (OPCO, CPF, France Travail). Sans Qualiopi, pas de financement.\n\n## Pourquoi c''est important pour TOI (commerciale)\n\n1. **Argument de vente** : ''Nos formations sont certifiées Qualiopi, donc finançables''\n2. **Confiance** : les prospects vérifient que le centre est sérieux\n3. **Obligation légale** : sans Qualiopi, on perd 60% de nos inscriptions\n\n## Les 7 critères du Référentiel National Qualité\n\n### Critère 1 — Information du public\nLes informations sur les formations sont **claires, précises et accessibles** : programmes, objectifs, prérequis, durées, prix, modalités d''évaluation.\n→ *Impact commercial : nos brochures et le site doivent être à jour.*\n\n### Critère 2 — Objectifs des formations\nChaque formation a des **objectifs pédagogiques mesurables** et adaptés au public visé.\n→ *Impact commercial : tu dois pouvoir expliquer les objectifs de chaque formation.*\n\n### Critère 3 — Adaptation aux publics\nLes formations s''adaptent au **profil des stagiaires** : niveau, handicap, contraintes.\n→ *Impact commercial : questionne le niveau et les besoins spécifiques du prospect.*\n\n### Critère 4 — Moyens pédagogiques\nLes moyens sont **adaptés** : locaux, matériel, formatrices qualifiées.\n→ *Impact commercial : mentionne les postes individuels, le matériel NPM pro, les formatrices expertes.*\n\n### Critère 5 — Compétences des formateurs\nLes formatrices maintiennent et développent leurs **compétences**.\n→ *Impact commercial : nos formatrices ont 10+ ans d''expérience et se forment en continu.*\n\n### Critère 6 — Engagement dans l''environnement\nInscription dans un **réseau professionnel**, veille sectorielle.\n→ *Impact commercial : Dermotec est distributeur NPM France, au cœur du secteur.*\n\n### Critère 7 — Recueil des appréciations\nOn collecte les **retours des stagiaires** et on s''améliore en continu.\n→ *Impact commercial : nos avis Google 4.8/5 en témoignent.*\n\n## Les 32 indicateurs\n\nChaque critère se décline en indicateurs mesurables (32 au total). Par exemple :\n- Indicateur 1 : le programme est diffusé au public ✅\n- Indicateur 4 : les objectifs sont formulés de manière opérationnelle ✅\n- Indicateur 11 : les acquis sont évalués en cours et fin de formation ✅\n- Indicateur 26 : le formateur a les compétences requises ✅\n\n## L''audit Qualiopi\n\n- **Audit initial** : pour obtenir la certification (3 ans de validité)\n- **Audit de surveillance** : entre le 14e et le 22e mois\n- **Audit de renouvellement** : tous les 3 ans\n\nL''auditeur vient sur site, examine les dossiers, interroge l''équipe. **Tout le monde peut être interrogé**, y compris les commerciales."
  }'::jsonb
);

-- Module 6, Leçon 2 — Checklist audit Qualiopi
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b6000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000006',
  'checklist-audit-qualiopi',
  'Checklist audit Qualiopi',
  'checklist',
  2, 10, 15,
  '{
    "items": [
      { "label": "Programmes à jour", "description": "Vérifier que chaque formation a un programme détaillé avec : intitulé, objectifs pédagogiques, prérequis, durée, modalités d''évaluation, public visé, tarif, accessibilité handicap." },
      { "label": "Émargements complets", "description": "Toutes les sessions des 12 derniers mois doivent avoir des feuilles d''émargement signées par chaque stagiaire et la formatrice, pour chaque demi-journée." },
      { "label": "Évaluations stagiaires", "description": "Chaque formation doit avoir : évaluation des acquis (début + fin), évaluation de satisfaction à chaud, et idéalement une évaluation à froid (J+30)." },
      { "label": "CV des formatrices", "description": "CV à jour de chaque formatrice avec preuves de compétences (diplômes, expérience, formations continues suivies)." },
      { "label": "Traçabilité des réclamations", "description": "Registre des réclamations avec : date, objet, traitement, résolution. Même s''il y en a eu zéro, le registre doit exister." },
      { "label": "Aménagements handicap", "description": "Document décrivant les modalités d''accueil des personnes en situation de handicap. Référent handicap identifié." },
      { "label": "Veille sectorielle", "description": "Preuves de veille : abonnements professionnels, participations à des salons, formations suivies par l''équipe." },
      { "label": "Indicateurs de résultats", "description": "Taux de satisfaction, taux de réussite, taux d''insertion professionnelle — affichés et à jour." },
      { "label": "Conventions et devis", "description": "Archivage de toutes les conventions signées et devis des 12 derniers mois. Format papier ou numérique organisé." },
      { "label": "Dossier CRM à jour", "description": "Si l''auditeur demande un dossier stagiaire, tu dois pouvoir retrouver en 2 minutes : convention, émargement, évaluation, certificat." }
    ]
  }'::jsonb
);

-- Module 6, Leçon 3 — Quiz Qualiopi
INSERT INTO academy_lessons (id, module_id, slug, titre, type, ordre, duree_minutes, points, contenu)
VALUES (
  'b6000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000006',
  'quiz-qualiopi',
  'Quiz Qualiopi',
  'quiz',
  3, 5, 20,
  '{
    "questions": [
      {
        "question": "Combien de critères comporte le Référentiel National Qualité (Qualiopi) ?",
        "options": ["5", "7", "10", "12"],
        "correct": 1,
        "explication": "Le RNQ comporte 7 critères et 32 indicateurs."
      },
      {
        "question": "Quelle est la durée de validité de la certification Qualiopi ?",
        "options": ["1 an", "2 ans", "3 ans", "5 ans"],
        "correct": 2,
        "explication": "La certification Qualiopi est valable 3 ans, avec un audit de surveillance entre le 14e et le 22e mois."
      },
      {
        "question": "Que se passe-t-il si Dermotec perd sa certification Qualiopi ?",
        "options": ["Rien de grave", "On perd l''accès aux financements publics (OPCO, CPF, France Travail)", "On doit fermer le centre", "On a une amende"],
        "correct": 1,
        "explication": "Sans Qualiopi, plus aucun financement public n''est possible. C''est 60% de nos inscriptions qui disparaissent."
      },
      {
        "question": "Qui peut être interrogé lors d''un audit Qualiopi ?",
        "options": ["Uniquement le directeur", "Uniquement les formatrices", "Tout le monde, y compris les commerciales", "Uniquement le référent qualité"],
        "correct": 2,
        "explication": "L''auditeur peut interroger n''importe quel membre de l''équipe. C''est pour ça que tout le monde doit connaître les bases."
      },
      {
        "question": "Quel document est indispensable pour chaque session de formation ?",
        "options": ["Un PowerPoint", "La feuille d''émargement signée", "Un certificat médical", "Une photo de groupe"],
        "correct": 1,
        "explication": "La feuille d''émargement signée par chaque stagiaire et la formatrice pour chaque demi-journée. C''est LA pièce justificative n°1."
      }
    ]
  }'::jsonb
);

-- ────────────────────────────────────────────────────────────
-- BADGES (10)
-- ────────────────────────────────────────────────────────────
INSERT INTO academy_badges (id, slug, nom, description, icone, condition_type, condition_value, points_bonus) VALUES
(
  'c1000000-0000-0000-0000-000000000001',
  'premier-pas',
  'Premier pas',
  'Complète ta première leçon dans l''Academy.',
  '👣',
  'custom',
  '{"type": "first_lesson_complete"}',
  5
),
(
  'c1000000-0000-0000-0000-000000000002',
  'onboarde',
  'Onboardé',
  'Complète le module Onboarding Dermotec.',
  '🚀',
  'module_complete',
  '{"module_id": "a1000000-0000-0000-0000-000000000001"}',
  20
),
(
  'c1000000-0000-0000-0000-000000000003',
  'crm-master',
  'CRM Master',
  'Complète le module Maîtriser le CRM.',
  '🖥️',
  'module_complete',
  '{"module_id": "a1000000-0000-0000-0000-000000000002"}',
  20
),
(
  'c1000000-0000-0000-0000-000000000004',
  'expert-produit',
  'Expert produit',
  'Complète le module Les 11 formations Dermotec.',
  '🎓',
  'module_complete',
  '{"module_id": "a1000000-0000-0000-0000-000000000003"}',
  25
),
(
  'c1000000-0000-0000-0000-000000000005',
  'top-vendeur',
  'Top vendeur',
  'Complète le module Techniques de vente.',
  '🏆',
  'module_complete',
  '{"module_id": "a1000000-0000-0000-0000-000000000004"}',
  30
),
(
  'c1000000-0000-0000-0000-000000000006',
  'roi-financement',
  'Roi du financement',
  'Complète le module Guide financement complet.',
  '💰',
  'module_complete',
  '{"module_id": "a1000000-0000-0000-0000-000000000005"}',
  25
),
(
  'c1000000-0000-0000-0000-000000000007',
  'certifie-qualiopi',
  'Certifié Qualiopi',
  'Complète le module Qualité & Qualiopi.',
  '🛡️',
  'module_complete',
  '{"module_id": "a1000000-0000-0000-0000-000000000006"}',
  20
),
(
  'c1000000-0000-0000-0000-000000000008',
  'perfectionniste',
  'Perfectionniste',
  'Obtiens 100% à tous les quiz de l''Academy.',
  '💎',
  'quiz_score',
  '{"min_score": 100, "all_quizzes": true}',
  50
),
(
  'c1000000-0000-0000-0000-000000000009',
  'assidu',
  'Assidu',
  'Connecte-toi et complète des leçons 5 jours consécutifs.',
  '🔥',
  'streak',
  '{"days": 5}',
  15
),
(
  'c1000000-0000-0000-0000-000000000010',
  'diplome-academy',
  'Diplômé Academy',
  'Complète tous les modules de l''Academy. Tu es prêt·e !',
  '🎖️',
  'custom',
  '{"type": "all_modules_complete"}',
  100
);
