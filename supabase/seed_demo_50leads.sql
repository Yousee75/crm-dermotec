-- ============================================================
-- SEED DEMO — 50 leads réalistes CRM Dermotec
-- Couvre TOUS les statuts, profils, sources, formations, scénarios
-- Prêt pour Supabase : exécuter après les migrations
-- ============================================================

-- Nettoyer les données de démo existantes (garder les formations/equipe/templates)
DELETE FROM activites WHERE description LIKE '%[DEMO]%' OR description LIKE '%demo%';
DELETE FROM notes_lead WHERE contenu LIKE '%[DEMO]%';
DELETE FROM rappels WHERE titre LIKE '%[DEMO]%';
DELETE FROM financements WHERE numero_dossier LIKE 'DEMO-%';
DELETE FROM inscriptions WHERE notes LIKE '%[DEMO]%';
DELETE FROM messages WHERE contenu LIKE '%[DEMO]%';
DELETE FROM leads WHERE tags @> ARRAY['demo'];

-- ============================================================
-- ÉQUIPE (si pas déjà créée)
-- ============================================================
INSERT INTO equipe (id, prenom, nom, email, telephone, role, specialites, objectif_mensuel, avatar_color, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Sarah', 'Benali', 'sarah@dermotec.fr', '0612345678', 'commercial', ARRAY['vente', 'financement'], 15000, '#2EC6F3', true),
  ('a0000000-0000-0000-0000-000000000002', 'Karim', 'Moussaoui', 'karim@dermotec.fr', '0687654321', 'commercial', ARRAY['prospection', 'closing'], 12000, '#8B5CF6', true),
  ('a0000000-0000-0000-0000-000000000003', 'Nadia', 'Dermotec', 'nadia@dermotec.fr', '0698765432', 'formatrice', ARRAY['maquillage permanent', 'microblading', 'full lips'], 0, '#22C55E', true),
  ('a0000000-0000-0000-0000-000000000004', 'Leila', 'Admin', 'leila@dermotec.fr', '0611223344', 'admin', ARRAY['gestion', 'qualite'], 0, '#F59E0B', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SESSIONS (8 sessions couvrant les formations populaires)
-- ============================================================
INSERT INTO sessions (id, formation_id, date_debut, date_fin, horaire_debut, horaire_fin, salle, formatrice_id, places_max, places_occupees, statut, ca_prevu, ca_realise)
SELECT
  's' || lpad(n::text, 7, '0') || '-0000-0000-0000-000000000000',
  f.id,
  d.debut,
  d.fin,
  '09:00', '17:00',
  CASE WHEN n <= 4 THEN 'Salle A' ELSE 'Salle B' END,
  'a0000000-0000-0000-0000-000000000003',
  6,
  CASE WHEN n IN (1,5) THEN 5 WHEN n IN (2,6) THEN 4 WHEN n IN (3,7) THEN 3 ELSE 2 END,
  CASE WHEN n <= 2 THEN 'TERMINEE' WHEN n <= 4 THEN 'EN_COURS' WHEN n <= 6 THEN 'CONFIRMEE' ELSE 'PLANIFIEE' END,
  f.prix_ht * 6,
  CASE WHEN n <= 2 THEN f.prix_ht * CASE WHEN n = 1 THEN 5 ELSE 4 END ELSE 0 END
FROM (VALUES
  (1, 'maquillage-permanent', '2026-02-10'::date, '2026-02-14'::date),
  (2, 'microblading', '2026-02-24'::date, '2026-02-25'::date),
  (3, 'full-lips', '2026-03-17'::date, '2026-03-18'::date),
  (4, 'maquillage-permanent', '2026-03-19'::date, '2026-03-21'::date),
  (5, 'nanoneedling', '2026-04-07'::date, '2026-04-07'::date),
  (6, 'microblading', '2026-04-14'::date, '2026-04-15'::date),
  (7, 'peeling-dermaplaning', '2026-04-28'::date, '2026-04-28'::date),
  (8, 'hygiene-salubrite', '2026-05-05'::date, '2026-05-07'::date)
) AS d(n, slug, debut, fin)
JOIN formations f ON f.slug = d.slug
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 50 LEADS — CHAQUE LEAD = UNE HISTOIRE
-- ============================================================

-- Variable pour les IDs de formation
-- On utilise des sous-requêtes pour récupérer les IDs

-- ————————————————————————————————
-- BLOC 1 : NOUVEAU (8 leads) — Viennent d'arriver, pas contactés
-- ————————————————————————————————

INSERT INTO leads (id, prenom, nom, email, telephone, whatsapp, statut, priorite, score_chaud, source, statut_pro, experience_esthetique, formation_principale_id, financement_souhaite, nb_contacts, message, tags, created_at)
VALUES
-- L01 : Formulaire site, gérante institut, intéressée maquillage permanent — LEAD CHAUDE
('b0000000-0000-0000-0001-000000000001', 'Marie', 'Dupont', 'marie.dupont@beaute-paris.fr', '0612340001', '0612340001', 'NOUVEAU', 'HAUTE', 82, 'site_web', 'gerant_institut', 'confirmee',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), true, 0,
 'Bonjour, je suis gérante d''un institut à Paris 15e et je souhaite me former au maquillage permanent pour proposer ce service à mes clientes. Pouvez-vous me rappeler ? Merci.',
 ARRAY['demo', 'hot'], NOW() - INTERVAL '2 hours'),

-- L02 : Instagram, reconversion, microblading — jeune, motivée
('b0000000-0000-0000-0001-000000000002', 'Léa', 'Martin', 'lea.martin93@gmail.com', '0678900002', NULL, 'NOUVEAU', 'NORMALE', 55, 'instagram', 'reconversion', 'aucune',
 (SELECT id FROM formations WHERE slug = 'microblading'), true, 0,
 'Vu votre post sur les résultats microblading, je suis coiffeuse et je veux me reconvertir. C''est possible de faire financer ?',
 ARRAY['demo', 'instagram'], NOW() - INTERVAL '1 day'),

-- L03 : Google, salariée spa, full lips — a cherché "formation maquillage permanent paris"
('b0000000-0000-0000-0001-000000000003', 'Fatima', 'Berkani', 'fatima.b@outlook.fr', '0645670003', '0645670003', 'NOUVEAU', 'NORMALE', 48, 'google', 'salariee', 'intermediaire',
 (SELECT id FROM formations WHERE slug = 'full-lips'), false, 0,
 NULL, ARRAY['demo'], NOW() - INTERVAL '3 days'),

-- L04 : WhatsApp direct, demandeuse emploi, hygiène — besoin urgent (prérequis légal)
('b0000000-0000-0000-0001-000000000004', 'Amina', 'Diallo', 'amina.diallo@gmail.com', '0698760004', '0698760004', 'NOUVEAU', 'URGENTE', 72, 'whatsapp', 'demandeur_emploi', 'debutante',
 (SELECT id FROM formations WHERE slug = 'hygiene-salubrite'), true, 0,
 'Salam, je viens de m''inscrire à France Travail et je veux ouvrir mon institut. Il me faut l''hygiène et salubrité en premier. C''est finançable AIF ?',
 ARRAY['demo', 'urgente'], NOW() - INTERVAL '5 hours'),

-- L05 : Salon professionnel, gérante, tricopigmentation — marché niche
('b0000000-0000-0000-0001-000000000005', 'Christine', 'Lefebvre', 'c.lefebvre@institut-bellezza.com', '0156780005', NULL, 'NOUVEAU', 'HAUTE', 78, 'salon', 'gerant_institut', 'experte',
 (SELECT id FROM formations WHERE slug = 'tricopigmentation'), false, 0,
 'Rencontrée au salon Beyond Beauty. Gère 2 instituts. Veut proposer la tricopigmentation homme. Budget pas un problème.',
 ARRAY['demo', 'salon', 'vip'], NOW() - INTERVAL '1 day'),

-- L06 : Facebook, étudiante, nanoneedling — petit budget
('b0000000-0000-0000-0001-000000000006', 'Chloé', 'Petit', 'chloe.petit.bts@gmail.com', '0712340006', NULL, 'NOUVEAU', 'BASSE', 25, 'facebook', 'etudiante', 'aucune',
 (SELECT id FROM formations WHERE slug = 'nanoneedling'), false, 0,
 'Combien coûte la formation nanoneedling svp ?',
 ARRAY['demo', 'etudiant'], NOW() - INTERVAL '6 days'),

-- L07 : Partenariat école, auto-entrepreneur, soin allin1
('b0000000-0000-0000-0001-000000000007', 'Sofia', 'Rahmani', 'sofia.r@beauty-academy.fr', '0634560007', NULL, 'NOUVEAU', 'NORMALE', 42, 'partenariat', 'auto_entrepreneur', 'debutante',
 (SELECT id FROM formations WHERE slug = 'soin-allin1'), true, 0,
 NULL, ARRAY['demo', 'partenaire-school'], NOW() - INTERVAL '4 days'),

-- L08 : Téléphone direct, indépendante, épilation définitive — appel entrant
('b0000000-0000-0000-0001-000000000008', 'Nathalie', 'Rousseau', 'nathalie.r@free.fr', '0687650008', '0687650008', 'NOUVEAU', 'NORMALE', 51, 'telephone', 'independante', 'intermediaire',
 (SELECT id FROM formations WHERE slug = 'epilation-definitive'), true, 0,
 'A appelé directement. Esthéticienne à domicile, veut ajouter l''épilation laser à ses services.',
 ARRAY['demo'], NOW() - INTERVAL '12 hours'),

-- ————————————————————————————————
-- BLOC 2 : CONTACTÉ (7 leads) — Premier contact fait
-- ————————————————————————————————

-- L09 : Contactée par Sarah, très intéressée, attend le rappel pour le financement
('b0000000-0000-0000-0001-000000000009', 'Julie', 'Bernard', 'julie.bernard@hotmail.fr', '0645670009', '0645670009', 'CONTACTE', 'HAUTE', 68, 'site_web', 'salariee', 'debutante',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), true, 2,
 'Esthéticienne chez Yves Rocher. Veut se former pour ouvrir à son compte. Très motivée.',
 ARRAY['demo'], NOW() - INTERVAL '8 days'),

-- L10 : 1 appel, pas décroché, relance prévue
('b0000000-0000-0000-0001-000000000010', 'Yasmine', 'Khelif', 'yasmine.k@gmail.com', '0678900010', NULL, 'CONTACTE', 'NORMALE', 35, 'instagram', 'reconversion', 'aucune',
 (SELECT id FROM formations WHERE slug = 'microblading'), false, 1,
 'DM Instagram. Dit vouloir se reconvertir mais n''a pas décroché au premier appel.',
 ARRAY['demo', 'relance'], NOW() - INTERVAL '10 days'),

-- L11 : Échange WhatsApp fluide, attend les dates
('b0000000-0000-0000-0001-000000000011', 'Camille', 'Dubois', 'camille.dubois@gmail.com', '0712340011', '0712340011', 'CONTACTE', 'HAUTE', 71, 'whatsapp', 'independante', 'confirmee',
 (SELECT id FROM formations WHERE slug = 'peeling-dermaplaning'), true, 3,
 'Échange WhatsApp très positif. Veut le peeling + dermaplaning. Demande les prochaines dates.',
 ARRAY['demo', 'whatsapp-actif'], NOW() - INTERVAL '5 days'),

-- L12 : Appel de 20 min, hésite entre 2 formations
('b0000000-0000-0000-0001-000000000012', 'Aurélie', 'Moreau', 'aurelie.moreau@laposte.net', '0698760012', NULL, 'CONTACTE', 'NORMALE', 55, 'google', 'salariee', 'intermediaire',
 (SELECT id FROM formations WHERE slug = 'full-lips'), false, 2,
 'Hésite entre Full Lips et Microblading. Travaille en institut. Doit en parler à sa patronne.',
 ARRAY['demo', 'hesitation'], NOW() - INTERVAL '12 days'),

-- L13 : Contactée, demande devis pour son employeur
('b0000000-0000-0000-0001-000000000013', 'Pauline', 'Girard', 'p.girard@spa-luxe.com', '0634560013', NULL, 'CONTACTE', 'HAUTE', 64, 'telephone', 'salariee', 'confirmee',
 (SELECT id FROM formations WHERE slug = 'areole-cicatrices'), true, 2,
 'Travaille dans un spa médical. L''employeur veut financer la formation aréole mammaire via OPCO.',
 ARRAY['demo', 'b2b'], NOW() - INTERVAL '7 days'),

-- L14 : Bouche à oreille, ancienne stagiaire recommande — confiance élevée
('b0000000-0000-0000-0001-000000000014', 'Sandra', 'Nguyen', 'sandra.nguyen@yahoo.fr', '0687650014', '0687650014', 'CONTACTE', 'HAUTE', 75, 'bouche_a_oreille', 'auto_entrepreneur', 'debutante',
 (SELECT id FROM formations WHERE slug = 'microblading'), true, 1,
 'Recommandée par Amira (alumni microblading). Veut la même formation. Très enthousiaste.',
 ARRAY['demo', 'referral'], NOW() - INTERVAL '3 days'),

-- L15 : Contactée mais doute, objection "trop cher"
('b0000000-0000-0000-0001-000000000015', 'Emilie', 'Laurent', 'emilie.laurent@orange.fr', '0712340015', NULL, 'CONTACTE', 'NORMALE', 38, 'facebook', 'demandeur_emploi', 'aucune',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), true, 2,
 'Intéressée mais trouve le maquillage permanent trop cher (2490€). Ne sait pas que France Travail peut financer.',
 ARRAY['demo', 'objection-prix'], NOW() - INTERVAL '15 days'),

-- ————————————————————————————————
-- BLOC 3 : QUALIFIÉ (6 leads) — Profil validé, intérêt confirmé
-- ————————————————————————————————

-- L16 : Gérante qualifiée, prête à s'inscrire si dates OK
('b0000000-0000-0000-0001-000000000016', 'Isabelle', 'Mercier', 'isabelle@institut-beaute-rose.fr', '0145670016', '0145670016', 'QUALIFIE', 'HAUTE', 85, 'site_web', 'gerant_institut', 'experte',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), false, 4,
 'Gère un institut depuis 15 ans. Veut ajouter le maquillage permanent. Prête si session avant mai.',
 ARRAY['demo', 'ready-to-close'], NOW() - INTERVAL '14 days'),

-- L17 : Reconversion validée, CPF disponible
('b0000000-0000-0000-0001-000000000017', 'Lucie', 'Thomas', 'lucie.thomas.reconversion@gmail.com', '0678900017', '0678900017', 'QUALIFIE', 'HAUTE', 78, 'google', 'reconversion', 'aucune',
 (SELECT id FROM formations WHERE slug = 'microblading'), true, 3,
 'Ex-comptable en reconversion. A 3200€ sur son CPF. Veut commencer par le microblading.',
 ARRAY['demo', 'cpf-dispo'], NOW() - INTERVAL '18 days'),

-- L18 : Indépendante qualifiée, veut 2 formations (bundle)
('b0000000-0000-0000-0001-000000000018', 'Rachida', 'Benmoussa', 'rachida.bm@gmail.com', '0698760018', '0698760018', 'QUALIFIE', 'HAUTE', 80, 'instagram', 'independante', 'intermediaire',
 (SELECT id FROM formations WHERE slug = 'microblading'), true, 5,
 'Veut Microblading + Full Lips. Budget total 2800€ HT. FAFCEA peut couvrir 2000€.',
 ARRAY['demo', 'bundle', 'fafcea'], NOW() - INTERVAL '20 days'),

-- L19 : Salariée qualifiée, attend validation employeur
('b0000000-0000-0000-0001-000000000019', 'Marion', 'Garcia', 'marion.garcia@derma-center.com', '0634560019', NULL, 'QUALIFIE', 'NORMALE', 62, 'partenariat', 'salariee', 'confirmee',
 (SELECT id FROM formations WHERE slug = 'detatouage'), true, 3,
 'Centre de dermatologie veut former Marion au détatouage laser. Attend le OK du directeur.',
 ARRAY['demo', 'b2b', 'employeur'], NOW() - INTERVAL '22 days'),

-- L20 : Demandeuse emploi qualifiée, dossier AIF à monter
('b0000000-0000-0000-0001-000000000020', 'Aicha', 'Benali', 'aicha.benali.ft@gmail.com', '0687650020', '0687650020', 'QUALIFIE', 'HAUTE', 73, 'bouche_a_oreille', 'demandeur_emploi', 'debutante',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), true, 4,
 'Inscrite France Travail depuis 3 mois. Projet esthétique validé par sa conseillère. Il faut monter le dossier AIF.',
 ARRAY['demo', 'france-travail', 'aif'], NOW() - INTERVAL '16 days'),

-- L21 : Auto-entrepreneur qualifiée, FIFPL
('b0000000-0000-0000-0001-000000000021', 'Valérie', 'Roux', 'valerie.roux.esthetique@gmail.com', '0712340021', NULL, 'QUALIFIE', 'NORMALE', 60, 'ancien_stagiaire', 'independante', 'confirmee',
 (SELECT id FROM formations WHERE slug = 'soin-allin1'), true, 3,
 'Alumni nanoneedling (2025). Veut le soin ALLin1 maintenant. FIFPL éligible.',
 ARRAY['demo', 'alumni-upsell', 'fifpl'], NOW() - INTERVAL '25 days'),

-- ————————————————————————————————
-- BLOC 4 : FINANCEMENT EN COURS (5 leads)
-- ————————————————————————————————

-- L22 : Dossier OPCO EP en cours — gérante institut
('b0000000-0000-0000-0001-000000000022', 'Stéphanie', 'Blanc', 'stephanie.blanc@institut-sb.fr', '0145670022', '0145670022', 'FINANCEMENT_EN_COURS', 'HAUTE', 88, 'telephone', 'gerant_institut', 'experte',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), true, 6,
 'Dossier OPCO EP déposé. Attend la réponse. Session avril réservée conditionnellement.',
 ARRAY['demo', 'opco-ep'], NOW() - INTERVAL '30 days'),

-- L23 : Dossier France Travail AIF — demandeuse emploi
('b0000000-0000-0000-0001-000000000023', 'Karine', 'Petit', 'karine.petit.ft@gmail.com', '0678900023', '0678900023', 'FINANCEMENT_EN_COURS', 'HAUTE', 80, 'site_web', 'demandeur_emploi', 'aucune',
 (SELECT id FROM formations WHERE slug = 'microblading'), true, 5,
 'Dossier AIF soumis via la conseillère France Travail. Devis Dermotec envoyé. En attente réponse.',
 ARRAY['demo', 'france-travail', 'aif'], NOW() - INTERVAL '35 days'),

-- L24 : CPF en cours — reconversion
('b0000000-0000-0000-0001-000000000024', 'Elodie', 'Simon', 'elodie.simon@gmail.com', '0698760024', NULL, 'FINANCEMENT_EN_COURS', 'NORMALE', 70, 'google', 'reconversion', 'aucune',
 (SELECT id FROM formations WHERE slug = 'hygiene-salubrite'), true, 4,
 'Utilise son CPF pour l''hygiène. Compte CPF vérifié : 1800€ dispo. Procédure en cours sur moncompteformation.',
 ARRAY['demo', 'cpf'], NOW() - INTERVAL '28 days'),

-- L25 : FAFCEA en cours — auto-entrepreneur
('b0000000-0000-0000-0001-000000000025', 'Samira', 'Hadj', 'samira.hadj.beaute@gmail.com', '0634560025', '0634560025', 'FINANCEMENT_EN_COURS', 'HAUTE', 83, 'whatsapp', 'auto_entrepreneur', 'intermediaire',
 (SELECT id FROM formations WHERE slug = 'full-lips'), true, 7,
 'Dossier FAFCEA soumis. Full Lips 1400€ couvert à 100% (plafond 2000€). Documents complets.',
 ARRAY['demo', 'fafcea'], NOW() - INTERVAL '25 days'),

-- L26 : Transitions Pro (PTP) en cours — salariée CDI reconversion
('b0000000-0000-0000-0001-000000000026', 'Caroline', 'Leroy', 'caroline.leroy@orange.fr', '0687650026', NULL, 'FINANCEMENT_EN_COURS', 'NORMALE', 65, 'site_web', 'salariee', 'aucune',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), true, 4,
 'CDI depuis 5 ans en bureau. Projet reconversion validé. Dossier Transitions Pro en instruction (2-3 mois).',
 ARRAY['demo', 'transitions-pro', 'ptp'], NOW() - INTERVAL '45 days'),

-- ————————————————————————————————
-- BLOC 5 : INSCRIT (4 leads) — Payées, session à venir
-- ————————————————————————————————

-- L27 : Inscrite microblading avril, payée par OPCO
('b0000000-0000-0000-0001-000000000027', 'Mélanie', 'Fournier', 'melanie.fournier@institut-mel.fr', '0712340027', '0712340027', 'INSCRIT', 'NORMALE', 90, 'telephone', 'gerant_institut', 'confirmee',
 (SELECT id FROM formations WHERE slug = 'microblading'), false, 8,
 'OPCO EP a validé. Inscription confirmée session avril. Convention signée.',
 ARRAY['demo', 'opco-valide'], NOW() - INTERVAL '40 days'),

-- L28 : Inscrite nanoneedling avril, paiement carte 3x
('b0000000-0000-0000-0001-000000000028', 'Jessica', 'Duval', 'jessica.duval@gmail.com', '0645670028', NULL, 'INSCRIT', 'NORMALE', 85, 'instagram', 'independante', 'debutante',
 (SELECT id FROM formations WHERE slug = 'nanoneedling'), false, 5,
 'Paiement en 3x sans frais. Première échéance encaissée. Session avril confirmée.',
 ARRAY['demo', 'paiement-3x'], NOW() - INTERVAL '35 days'),

-- L29 : Inscrite peeling avril, paiement France Travail
('b0000000-0000-0000-0001-000000000029', 'Manon', 'Robert', 'manon.robert.ft@gmail.com', '0698760029', '0698760029', 'INSCRIT', 'NORMALE', 88, 'bouche_a_oreille', 'demandeur_emploi', 'aucune',
 (SELECT id FROM formations WHERE slug = 'peeling-dermaplaning'), false, 6,
 'AIF validé 100%. Inscription confirmée. Convocation envoyée.',
 ARRAY['demo', 'aif-valide'], NOW() - INTERVAL '30 days'),

-- L30 : Inscrite hygiène mai, paiement CPF
('b0000000-0000-0000-0001-000000000030', 'Ophélie', 'Martinez', 'ophelie.martinez@gmail.com', '0634560030', NULL, 'INSCRIT', 'BASSE', 80, 'google', 'reconversion', 'aucune',
 (SELECT id FROM formations WHERE slug = 'hygiene-salubrite'), false, 4,
 'CPF utilisé. Inscription hygiène mai. Prérequis pour ouvrir son institut.',
 ARRAY['demo', 'cpf-valide'], NOW() - INTERVAL '20 days'),

-- ————————————————————————————————
-- BLOC 6 : EN FORMATION (3 leads) — Actuellement en cours
-- ————————————————————————————————

-- L31 : En formation maquillage permanent cette semaine
('b0000000-0000-0000-0001-000000000031', 'Alexandra', 'David', 'alexandra.david@gmail.com', '0687650031', '0687650031', 'EN_FORMATION', 'NORMALE', 92, 'site_web', 'independante', 'intermediaire',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), false, 10,
 'Jour 3/5 maquillage permanent. Excellente progression. Très motivée.',
 ARRAY['demo', 'en-cours'], NOW() - INTERVAL '50 days'),

-- L32 : En formation full lips
('b0000000-0000-0000-0001-000000000032', 'Laura', 'Morel', 'laura.morel.esthetique@gmail.com', '0712340032', NULL, 'EN_FORMATION', 'NORMALE', 90, 'instagram', 'salariee', 'confirmee',
 (SELECT id FROM formations WHERE slug = 'full-lips'), false, 7,
 'Jour 1/2 Full Lips. Bonne maîtrise des techniques. A déjà fait le microblading ici.',
 ARRAY['demo', 'en-cours', 'retour'], NOW() - INTERVAL '55 days'),

-- L33 : En formation maquillage permanent — gérante
('b0000000-0000-0000-0001-000000000033', 'Virginie', 'Bonnet', 'virginie@institut-vb.fr', '0645670033', '0645670033', 'EN_FORMATION', 'NORMALE', 93, 'salon', 'gerant_institut', 'experte',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), false, 12,
 'Gérante 2 instituts. Jour 4/5. Veut former sa salariée aussi après (potentiel 2e inscription).',
 ARRAY['demo', 'en-cours', 'upsell-equipe'], NOW() - INTERVAL '60 days'),

-- ————————————————————————————————
-- BLOC 7 : FORMÉ (3 leads) — Formation terminée, suivi
-- ————————————————————————————————

-- L34 : Formée microblading, satisfaction 5/5, potentiel upsell
('b0000000-0000-0000-0001-000000000034', 'Amira', 'Ziani', 'amira.ziani@gmail.com', '0698760034', '0698760034', 'FORME', 'NORMALE', 95, 'site_web', 'independante', 'confirmee',
 (SELECT id FROM formations WHERE slug = 'microblading'), false, 15,
 'Microblading terminé le 25/02. Satisfaction 5/5. A recommandé Sandra. Potentiel Full Lips.',
 ARRAY['demo', 'referral-source', 'upsell'], NOW() - INTERVAL '65 days'),

-- L35 : Formée hygiène, satisfaite mais pas encore demandé avis Google
('b0000000-0000-0000-0001-000000000035', 'Sabrina', 'Charef', 'sabrina.charef@gmail.com', '0634560035', '0634560035', 'FORME', 'BASSE', 80, 'whatsapp', 'demandeur_emploi', 'debutante',
 (SELECT id FROM formations WHERE slug = 'hygiene-salubrite'), false, 8,
 'Hygiène terminée. Satisfaction 4/5. Veut enchainer avec microblading (France Travail).',
 ARRAY['demo', 'upsell-enchainement'], NOW() - INTERVAL '45 days'),

-- L36 : Formée peeling, certificat généré
('b0000000-0000-0000-0001-000000000036', 'Olivia', 'Lemaire', 'olivia.lemaire@institut-ol.fr', '0687650036', NULL, 'FORME', 'BASSE', 85, 'partenariat', 'gerant_institut', 'experte',
 (SELECT id FROM formations WHERE slug = 'peeling-dermaplaning'), false, 9,
 'Peeling terminé. Certificat envoyé. Avis Google laissé (5 étoiles). Potentiel nanoneedling.',
 ARRAY['demo', 'avis-google', 'upsell'], NOW() - INTERVAL '50 days'),

-- ————————————————————————————————
-- BLOC 8 : ALUMNI (4 leads) — Anciennes stagiaires fidèles
-- ————————————————————————————————

-- L37 : Alumni multi-formations, ambassadrice — a fait 3 formations
('b0000000-0000-0000-0001-000000000037', 'Sarah', 'Masson', 'sarah.masson.pro@gmail.com', '0712340037', '0712340037', 'ALUMNI', 'BASSE', 98, 'site_web', 'independante', 'experte',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), false, 25,
 'Alumni 3 formations (Microblading 2024, Full Lips 2025, Maquillage Permanent 2025). Ambassadrice Dermotec. 3 filleules inscrites.',
 ARRAY['demo', 'ambassadrice', 'vip'], NOW() - INTERVAL '365 days'),

-- L38 : Alumni récente, commandes e-shop régulières
('b0000000-0000-0000-0001-000000000038', 'Inès', 'Faure', 'ines.faure.beaute@gmail.com', '0645670038', '0645670038', 'ALUMNI', 'BASSE', 88, 'instagram', 'auto_entrepreneur', 'confirmee',
 (SELECT id FROM formations WHERE slug = 'nanoneedling'), false, 12,
 'Alumni nanoneedling (jan 2026). Commande régulièrement du matériel NPM en e-shop. Fidèle.',
 ARRAY['demo', 'eshop-client', 'fidele'], NOW() - INTERVAL '90 days'),

-- L39 : Alumni qui revient pour une nouvelle formation
('b0000000-0000-0000-0001-000000000039', 'Justine', 'Andre', 'justine.andre@free.fr', '0698760039', NULL, 'ALUMNI', 'NORMALE', 82, 'ancien_stagiaire', 'salariee', 'confirmee',
 (SELECT id FROM formations WHERE slug = 'microblading'), false, 14,
 'A fait microblading en 2025. Revient pour le peeling/dermaplaning. Fidèle.',
 ARRAY['demo', 'retour-formation'], NOW() - INTERVAL '200 days'),

-- L40 : Alumni gérante, envoie régulièrement des stagiaires
('b0000000-0000-0000-0001-000000000040', 'Nadia', 'El Amrani', 'nadia@beauty-concept-paris.fr', '0156780040', '0156780040', 'ALUMNI', 'BASSE', 95, 'bouche_a_oreille', 'gerant_institut', 'experte',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), false, 30,
 'Gérante Beauty Concept. Alumni maquillage permanent 2024. A envoyé 5 stagiaires depuis. Partenaire clé.',
 ARRAY['demo', 'partenaire', 'referral-source', 'vip'], NOW() - INTERVAL '400 days'),

-- ————————————————————————————————
-- BLOC 9 : PERDU (5 leads) — Deals perdus, raisons variées
-- ————————————————————————————————

-- L41 : Perdue — trop cher, pas de financement possible
('b0000000-0000-0000-0001-000000000041', 'Myriam', 'Ferreira', 'myriam.ferreira@gmail.com', '0678900041', NULL, 'PERDU', 'BASSE', 15, 'facebook', 'etudiante', 'aucune',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), false, 3,
 'Étudiante sans financement. 2490€ trop cher. Pas éligible CPF/AIF. À réactiver quand situation change.',
 ARRAY['demo', 'perdu-prix'], NOW() - INTERVAL '60 days'),

-- L42 : Perdue — a choisi un concurrent moins cher
('b0000000-0000-0000-0001-000000000042', 'Christelle', 'Pires', 'christelle.pires@outlook.fr', '0698760042', NULL, 'PERDU', 'BASSE', 20, 'google', 'independante', 'debutante',
 (SELECT id FROM formations WHERE slug = 'microblading'), false, 4,
 'A trouvé une formation microblading à 800€ ailleurs. Pas Qualiopi mais s''en fiche. Perdue.',
 ARRAY['demo', 'perdu-concurrent'], NOW() - INTERVAL '45 days'),

-- L43 : Perdue — financement refusé par France Travail
('b0000000-0000-0000-0001-000000000043', 'Latifa', 'Hamidi', 'latifa.hamidi@gmail.com', '0634560043', '0634560043', 'PERDU', 'BASSE', 10, 'whatsapp', 'demandeur_emploi', 'aucune',
 (SELECT id FROM formations WHERE slug = 'full-lips'), true, 6,
 'Dossier AIF refusé car projet jugé non viable par France Travail. Déçue. Pourrait revenir avec CPF.',
 ARRAY['demo', 'perdu-financement-refuse'], NOW() - INTERVAL '70 days'),

-- L44 : Perdue — ghosting après 3 relances
('b0000000-0000-0000-0001-000000000044', 'Priscilla', 'Lopes', 'priscilla.lopes@gmail.com', '0687650044', NULL, 'PERDU', 'BASSE', 5, 'instagram', 'reconversion', 'aucune',
 (SELECT id FROM formations WHERE slug = 'nanoneedling'), false, 3,
 'DM Instagram. 1 appel positif puis plus de réponse. 2 emails + 1 WhatsApp sans réponse. Ghost.',
 ARRAY['demo', 'perdu-ghost'], NOW() - INTERVAL '40 days'),

-- L45 : Perdue — raison personnelle (maladie)
('b0000000-0000-0000-0001-000000000045', 'Dominique', 'Renard', 'dominique.renard@gmail.com', '0712340045', NULL, 'PERDU', 'BASSE', 30, 'telephone', 'salariee', 'intermediaire',
 (SELECT id FROM formations WHERE slug = 'areole-cicatrices'), true, 5,
 'Très motivée pour la formation aréole mammaire. Problème de santé personnel. Reporté indéfiniment. À rappeler dans 6 mois.',
 ARRAY['demo', 'perdu-sante', 'rappel-6-mois'], NOW() - INTERVAL '55 days'),

-- ————————————————————————————————
-- BLOC 10 : REPORTÉ (3 leads) — Intéressées mais pas maintenant
-- ————————————————————————————————

-- L46 : Reporté — enceinte, reprendra après congé maternité
('b0000000-0000-0000-0001-000000000046', 'Céline', 'Vidal', 'celine.vidal@gmail.com', '0645670046', '0645670046', 'REPORTE', 'BASSE', 45, 'site_web', 'independante', 'confirmee',
 (SELECT id FROM formations WHERE slug = 'full-lips'), true, 4,
 'Très intéressée Full Lips mais enceinte 6 mois. Reprendra en septembre 2026. FAFCEA éligible.',
 ARRAY['demo', 'reporte-maternite', 'rappel-sept'], NOW() - INTERVAL '30 days'),

-- L47 : Reporté — budget pas encore disponible, attends janvier
('b0000000-0000-0000-0001-000000000047', 'Melissa', 'Costa', 'melissa.costa@hotmail.fr', '0678900047', NULL, 'REPORTE', 'NORMALE', 50, 'instagram', 'auto_entrepreneur', 'debutante',
 (SELECT id FROM formations WHERE slug = 'soin-allin1'), false, 3,
 'Auto-entrepreneur, trésorerie tendue. Veut le soin ALLin1 mais attendra la bonne période.',
 ARRAY['demo', 'reporte-budget'], NOW() - INTERVAL '35 days'),

-- L48 : Reporté — en formation ailleurs, finira en juin
('b0000000-0000-0000-0001-000000000048', 'Tatiana', 'Ivanova', 'tatiana.iv@gmail.com', '0698760048', '0698760048', 'REPORTE', 'NORMALE', 55, 'salon', 'reconversion', 'debutante',
 (SELECT id FROM formations WHERE slug = 'maquillage-permanent'), true, 3,
 'Rencontrée au salon. En CFA esthétique jusqu''en juin. Viendra pour le maquillage permanent après. France Travail possible.',
 ARRAY['demo', 'reporte-formation-en-cours'], NOW() - INTERVAL '25 days'),

-- ————————————————————————————————
-- BLOC 11 : SPAM (2 leads) — Faux leads
-- ————————————————————————————————

-- L49 : Spam — email jetable, message vide
('b0000000-0000-0000-0001-000000000049', 'Test', 'Bot', 'test123@tempmail.com', NULL, NULL, 'SPAM', 'BASSE', 0, 'formulaire', 'autre', 'aucune',
 NULL, false, 0,
 'zzzz test test',
 ARRAY['demo', 'spam'], NOW() - INTERVAL '10 days'),

-- L50 : Spam — démarchage commercial déguisé
('b0000000-0000-0000-0001-000000000050', 'Commercial', 'Logiciel', 'sales@crm-concurrent.io', '0100000050', NULL, 'SPAM', 'BASSE', 0, 'formulaire', 'autre', 'aucune',
 NULL, false, 1,
 'Bonjour, nous proposons un logiciel CRM révolutionnaire pour les centres de formation...',
 ARRAY['demo', 'spam', 'demarchage'], NOW() - INTERVAL '8 days');

-- ============================================================
-- FINANCEMENTS (pour les leads en financement + inscrites)
-- ============================================================

INSERT INTO financements (id, lead_id, organisme, montant_demande, montant_accorde, statut, numero_dossier, created_at)
VALUES
-- L22 : OPCO EP soumis
('f0000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0001-000000000022', 'OPCO_EP', 2490, 0, 'EN_EXAMEN', 'DEMO-OPCO-2026-001', NOW() - INTERVAL '20 days'),
-- L23 : France Travail AIF soumis
('f0000000-0000-0000-0001-000000000002', 'b0000000-0000-0000-0001-000000000023', 'FRANCE_TRAVAIL', 1400, 0, 'SOUMIS', 'DEMO-AIF-2026-001', NOW() - INTERVAL '25 days'),
-- L24 : CPF en cours
('f0000000-0000-0000-0001-000000000003', 'b0000000-0000-0000-0001-000000000024', 'CPF', 400, 0, 'DOSSIER_COMPLET', 'DEMO-CPF-2026-001', NOW() - INTERVAL '18 days'),
-- L25 : FAFCEA soumis
('f0000000-0000-0000-0001-000000000004', 'b0000000-0000-0000-0001-000000000025', 'FAFCEA', 1400, 0, 'SOUMIS', 'DEMO-FAFCEA-2026-001', NOW() - INTERVAL '15 days'),
-- L26 : Transitions Pro en instruction
('f0000000-0000-0000-0001-000000000005', 'b0000000-0000-0000-0001-000000000026', 'TRANSITIONS_PRO', 2490, 0, 'EN_EXAMEN', 'DEMO-PTP-2026-001', NOW() - INTERVAL '35 days'),
-- L27 : OPCO EP validé (inscrite)
('f0000000-0000-0000-0001-000000000006', 'b0000000-0000-0000-0001-000000000027', 'OPCO_EP', 1400, 1400, 'VERSE', 'DEMO-OPCO-2026-002', NOW() - INTERVAL '30 days'),
-- L29 : AIF validé (inscrite)
('f0000000-0000-0000-0001-000000000007', 'b0000000-0000-0000-0001-000000000029', 'FRANCE_TRAVAIL', 990, 990, 'VERSE', 'DEMO-AIF-2026-002', NOW() - INTERVAL '20 days'),
-- L30 : CPF validé (inscrite)
('f0000000-0000-0000-0001-000000000008', 'b0000000-0000-0000-0001-000000000030', 'CPF', 400, 400, 'VERSE', 'DEMO-CPF-2026-002', NOW() - INTERVAL '15 days'),
-- L43 : AIF refusé (perdue)
('f0000000-0000-0000-0001-000000000009', 'b0000000-0000-0000-0001-000000000043', 'FRANCE_TRAVAIL', 1400, 0, 'REFUSE', 'DEMO-AIF-2026-003', NOW() - INTERVAL '55 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INSCRIPTIONS (pour les leads inscrites/en formation/formées)
-- ============================================================

INSERT INTO inscriptions (id, lead_id, session_id, montant_total, montant_finance, reste_a_charge, mode_paiement, paiement_statut, statut, taux_presence, note_satisfaction, notes, created_at)
VALUES
-- L27 inscrite microblading avril (session 6)
('i0000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0001-000000000027',
 (SELECT id FROM sessions WHERE formation_id = (SELECT id FROM formations WHERE slug = 'microblading') AND statut = 'CONFIRMEE' LIMIT 1),
 1400, 1400, 0, 'financement', 'PAYE', 'CONFIRMEE', 0, NULL, '[DEMO] OPCO EP validé', NOW() - INTERVAL '15 days'),

-- L28 inscrite nanoneedling avril (session 5)
('i0000000-0000-0000-0001-000000000002', 'b0000000-0000-0000-0001-000000000028',
 (SELECT id FROM sessions WHERE formation_id = (SELECT id FROM formations WHERE slug = 'nanoneedling') AND statut = 'CONFIRMEE' LIMIT 1),
 700, 0, 700, 'carte', 'ACOMPTE', 'CONFIRMEE', 0, NULL, '[DEMO] Paiement 3x Alma', NOW() - INTERVAL '10 days'),

-- L31 en formation maquillage permanent (session 4)
('i0000000-0000-0000-0001-000000000003', 'b0000000-0000-0000-0001-000000000031',
 (SELECT id FROM sessions WHERE formation_id = (SELECT id FROM formations WHERE slug = 'maquillage-permanent') AND statut = 'EN_COURS' LIMIT 1),
 2490, 2490, 0, 'financement', 'PAYE', 'EN_COURS', 60, NULL, '[DEMO] FAFCEA', NOW() - INTERVAL '30 days'),

-- L34 formée microblading (session 2 terminée)
('i0000000-0000-0000-0001-000000000004', 'b0000000-0000-0000-0001-000000000034',
 (SELECT id FROM sessions WHERE formation_id = (SELECT id FROM formations WHERE slug = 'microblading') AND statut = 'TERMINEE' LIMIT 1),
 1400, 1400, 0, 'financement', 'PAYE', 'COMPLETEE', 100, 5, '[DEMO] Excellente stagiaire', NOW() - INTERVAL '50 days'),

-- L37 alumni — inscription historique maquillage permanent (session 1 terminée)
('i0000000-0000-0000-0001-000000000005', 'b0000000-0000-0000-0001-000000000037',
 (SELECT id FROM sessions WHERE formation_id = (SELECT id FROM formations WHERE slug = 'maquillage-permanent') AND statut = 'TERMINEE' LIMIT 1),
 2490, 0, 2490, 'carte', 'PAYE', 'COMPLETEE', 100, 5, '[DEMO] Alumni ambassadrice', NOW() - INTERVAL '300 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RAPPELS (actifs et en retard pour tester le cockpit)
-- ============================================================

INSERT INTO rappels (id, lead_id, user_id, date_rappel, type, statut, priorite, titre, description)
VALUES
-- Rappels EN RETARD (urgences cockpit)
('r0000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0001-000000000010', 'a0000000-0000-0000-0000-000000000001',
 NOW() - INTERVAL '3 days', 'APPEL', 'EN_ATTENTE', 'HAUTE', '[DEMO] Rappeler Yasmine Khelif', 'N''a pas décroché au 1er appel. 2e tentative.'),

('r0000000-0000-0000-0001-000000000002', 'b0000000-0000-0000-0001-000000000015', 'a0000000-0000-0000-0000-000000000002',
 NOW() - INTERVAL '5 days', 'WHATSAPP', 'EN_ATTENTE', 'NORMALE', '[DEMO] Relancer Emilie Laurent', 'Objection prix. Lui expliquer le financement France Travail.'),

('r0000000-0000-0000-0001-000000000003', 'b0000000-0000-0000-0001-000000000022', 'a0000000-0000-0000-0000-000000000001',
 NOW() - INTERVAL '1 day', 'APPEL', 'HAUTE', '[DEMO] Suivre dossier OPCO Stéphanie', 'Vérifier avancement dossier OPCO EP. Relancer si pas de nouvelle.'),

-- Rappels AUJOURD'HUI
('r0000000-0000-0000-0001-000000000004', 'b0000000-0000-0000-0001-000000000001', 'a0000000-0000-0000-0000-000000000001',
 NOW() + INTERVAL '2 hours', 'APPEL', 'EN_ATTENTE', 'URGENTE', '[DEMO] Premier appel Marie Dupont', 'Lead chaude gérante institut. Appeler en priorité.'),

('r0000000-0000-0000-0001-000000000005', 'b0000000-0000-0000-0001-000000000011', 'a0000000-0000-0000-0000-000000000002',
 NOW() + INTERVAL '4 hours', 'WHATSAPP', 'EN_ATTENTE', 'HAUTE', '[DEMO] Envoyer dates à Camille', 'Demande les prochaines dates peeling. Répondre par WhatsApp.'),

-- Rappels FUTURS
('r0000000-0000-0000-0001-000000000006', 'b0000000-0000-0000-0001-000000000046', 'a0000000-0000-0000-0000-000000000001',
 '2026-09-01 10:00:00', 'APPEL', 'EN_ATTENTE', 'NORMALE', '[DEMO] Rappeler Céline Vidal', 'Reprend après congé maternité. Proposer session septembre.'),

('r0000000-0000-0000-0001-000000000007', 'b0000000-0000-0000-0001-000000000045', 'a0000000-0000-0000-0000-000000000002',
 '2026-09-15 10:00:00', 'APPEL', 'EN_ATTENTE', 'BASSE', '[DEMO] Rappeler Dominique Renard', 'Problème de santé. Vérifier si situation améliorée.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- NOTES LEAD (pour enrichir les fiches)
-- ============================================================

INSERT INTO notes_lead (lead_id, user_id, contenu, type, is_pinned, created_at)
VALUES
('b0000000-0000-0000-0001-000000000009', 'a0000000-0000-0000-0000-000000000001',
 '[DEMO] Appel de 15 min. Très motivée. Veut quitter Yves Rocher pour ouvrir à son compte. Besoin : formation + financement + accompagnement installation.',
 'appel', true, NOW() - INTERVAL '6 days'),

('b0000000-0000-0000-0001-000000000016', 'a0000000-0000-0000-0000-000000000001',
 '[DEMO] 4e échange. Prête à s''inscrire session avril maquillage permanent si encore des places. Vérifier dispo.',
 'appel', false, NOW() - INTERVAL '3 days'),

('b0000000-0000-0000-0001-000000000018', 'a0000000-0000-0000-0000-000000000002',
 '[DEMO] Rachida veut Microblading + Full Lips en bundle. FAFCEA couvre 2000€. Reste à charge 800€ qu''elle paierait en 2x. À proposer le package.',
 'note_interne', true, NOW() - INTERVAL '10 days'),

('b0000000-0000-0000-0001-000000000022', 'a0000000-0000-0000-0000-000000000001',
 '[DEMO] Dossier OPCO EP envoyé le 20/02. Accusé réception reçu. Délai estimé 3-4 semaines. Session avril réservée.',
 'note_interne', true, NOW() - INTERVAL '20 days'),

('b0000000-0000-0000-0001-000000000034', 'a0000000-0000-0000-0000-000000000003',
 '[DEMO] Amira excellente en formation. Maîtrise rapide du microblading. Recommande la formation Full Lips. A déjà recommandé Sandra Nguyen.',
 'note_interne', false, NOW() - INTERVAL '25 days'),

('b0000000-0000-0000-0001-000000000037', 'a0000000-0000-0000-0000-000000000001',
 '[DEMO] Sarah est notre meilleure ambassadrice. 3 formations faites, 3 filleules inscrites. Lui proposer un statut VIP avec -15% sur prochaine formation.',
 'note_interne', true, NOW() - INTERVAL '30 days'),

('b0000000-0000-0000-0001-000000000042', 'a0000000-0000-0000-0000-000000000002',
 '[DEMO] Christelle a choisi un concurrent à 800€ sans Qualiopi. Lui envoyer un email dans 3 mois pour savoir si elle est satisfaite (souvent non).',
 'note_interne', false, NOW() - INTERVAL '40 days');

-- ============================================================
-- ACTIVITÉS (timeline réaliste)
-- ============================================================

INSERT INTO activites (type, lead_id, user_id, description, ancien_statut, nouveau_statut, created_at)
VALUES
-- Créations
('LEAD_CREE', 'b0000000-0000-0000-0001-000000000001', NULL, '[DEMO] Lead créé via formulaire site web', NULL, 'NOUVEAU', NOW() - INTERVAL '2 hours'),
('LEAD_CREE', 'b0000000-0000-0000-0001-000000000002', NULL, '[DEMO] Lead créé via DM Instagram', NULL, 'NOUVEAU', NOW() - INTERVAL '1 day'),
('LEAD_CREE', 'b0000000-0000-0000-0001-000000000004', NULL, '[DEMO] Lead créé via WhatsApp entrant', NULL, 'NOUVEAU', NOW() - INTERVAL '5 hours'),

-- Transitions
('STATUT_CHANGE', 'b0000000-0000-0000-0001-000000000009', 'a0000000-0000-0000-0000-000000000001', '[DEMO] Qualifiée après appel découverte', 'NOUVEAU', 'CONTACTE', NOW() - INTERVAL '6 days'),
('STATUT_CHANGE', 'b0000000-0000-0000-0001-000000000016', 'a0000000-0000-0000-0000-000000000001', '[DEMO] Profil validé, prête à s''inscrire', 'CONTACTE', 'QUALIFIE', NOW() - INTERVAL '5 days'),
('STATUT_CHANGE', 'b0000000-0000-0000-0001-000000000022', 'a0000000-0000-0000-0000-000000000001', '[DEMO] Dossier OPCO EP lancé', 'QUALIFIE', 'FINANCEMENT_EN_COURS', NOW() - INTERVAL '20 days'),
('STATUT_CHANGE', 'b0000000-0000-0000-0001-000000000027', 'a0000000-0000-0000-0000-000000000001', '[DEMO] OPCO validé, inscription confirmée', 'FINANCEMENT_EN_COURS', 'INSCRIT', NOW() - INTERVAL '15 days'),
('STATUT_CHANGE', 'b0000000-0000-0000-0001-000000000031', 'a0000000-0000-0000-0000-000000000003', '[DEMO] Début formation J1', 'INSCRIT', 'EN_FORMATION', NOW() - INTERVAL '3 days'),
('STATUT_CHANGE', 'b0000000-0000-0000-0001-000000000034', 'a0000000-0000-0000-0000-000000000003', '[DEMO] Formation microblading terminée', 'EN_FORMATION', 'FORME', NOW() - INTERVAL '25 days'),
('STATUT_CHANGE', 'b0000000-0000-0000-0001-000000000037', 'a0000000-0000-0000-0000-000000000001', '[DEMO] Passage alumni après 3e formation', 'FORME', 'ALUMNI', NOW() - INTERVAL '100 days'),
('STATUT_CHANGE', 'b0000000-0000-0000-0001-000000000042', 'a0000000-0000-0000-0000-000000000002', '[DEMO] A choisi un concurrent', 'CONTACTE', 'PERDU', NOW() - INTERVAL '40 days'),

-- Contacts
('CONTACT', 'b0000000-0000-0000-0001-000000000009', 'a0000000-0000-0000-0000-000000000001', '[DEMO] Appel découverte 15 min — très motivée', NULL, NULL, NOW() - INTERVAL '6 days'),
('CONTACT', 'b0000000-0000-0000-0001-000000000011', 'a0000000-0000-0000-0000-000000000002', '[DEMO] Échange WhatsApp — demande les dates peeling', NULL, NULL, NOW() - INTERVAL '4 days'),
('CONTACT', 'b0000000-0000-0000-0001-000000000018', 'a0000000-0000-0000-0000-000000000002', '[DEMO] Appel 20 min — veut bundle Microblading + Full Lips', NULL, NULL, NOW() - INTERVAL '10 days'),
('EMAIL', 'b0000000-0000-0000-0001-000000000022', 'a0000000-0000-0000-0000-000000000001', '[DEMO] Email confirmation dossier OPCO envoyé', NULL, NULL, NOW() - INTERVAL '18 days'),

-- Financement
('FINANCEMENT', 'b0000000-0000-0000-0001-000000000027', 'a0000000-0000-0000-0000-000000000001', '[DEMO] OPCO EP validé — 1400€ accordés', NULL, NULL, NOW() - INTERVAL '15 days'),
('FINANCEMENT', 'b0000000-0000-0000-0001-000000000043', 'a0000000-0000-0000-0000-000000000002', '[DEMO] AIF refusé par France Travail', NULL, NULL, NOW() - INTERVAL '55 days'),

-- Paiement
('PAIEMENT', 'b0000000-0000-0000-0001-000000000028', NULL, '[DEMO] 1ère échéance 3x encaissée — 233€', NULL, NULL, NOW() - INTERVAL '10 days');

-- ============================================================
-- ASSIGNMENT COMMERCIAL (répartir les leads)
-- ============================================================

-- Sarah Benali (commercial 1) : leads impaires
UPDATE leads SET commercial_assigne_id = 'a0000000-0000-0000-0000-000000000001'
WHERE id IN (
  'b0000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0001-000000000003',
  'b0000000-0000-0000-0001-000000000005', 'b0000000-0000-0000-0001-000000000007',
  'b0000000-0000-0000-0001-000000000009', 'b0000000-0000-0000-0001-000000000013',
  'b0000000-0000-0000-0001-000000000016', 'b0000000-0000-0000-0001-000000000020',
  'b0000000-0000-0000-0001-000000000022', 'b0000000-0000-0000-0001-000000000024',
  'b0000000-0000-0000-0001-000000000027', 'b0000000-0000-0000-0001-000000000029',
  'b0000000-0000-0000-0001-000000000031', 'b0000000-0000-0000-0001-000000000034',
  'b0000000-0000-0000-0001-000000000037', 'b0000000-0000-0000-0001-000000000040',
  'b0000000-0000-0000-0001-000000000045', 'b0000000-0000-0000-0001-000000000046'
);

-- Karim Moussaoui (commercial 2) : leads paires
UPDATE leads SET commercial_assigne_id = 'a0000000-0000-0000-0000-000000000002'
WHERE id IN (
  'b0000000-0000-0000-0001-000000000002', 'b0000000-0000-0000-0001-000000000004',
  'b0000000-0000-0000-0001-000000000006', 'b0000000-0000-0000-0001-000000000008',
  'b0000000-0000-0000-0001-000000000010', 'b0000000-0000-0000-0001-000000000011',
  'b0000000-0000-0000-0001-000000000012', 'b0000000-0000-0000-0001-000000000014',
  'b0000000-0000-0000-0001-000000000015', 'b0000000-0000-0000-0001-000000000017',
  'b0000000-0000-0000-0001-000000000018', 'b0000000-0000-0000-0001-000000000019',
  'b0000000-0000-0000-0001-000000000021', 'b0000000-0000-0000-0001-000000000023',
  'b0000000-0000-0000-0001-000000000025', 'b0000000-0000-0000-0001-000000000026',
  'b0000000-0000-0000-0001-000000000028', 'b0000000-0000-0000-0001-000000000030',
  'b0000000-0000-0000-0001-000000000032', 'b0000000-0000-0000-0001-000000000033',
  'b0000000-0000-0000-0001-000000000035', 'b0000000-0000-0000-0001-000000000036',
  'b0000000-0000-0000-0001-000000000038', 'b0000000-0000-0000-0001-000000000039',
  'b0000000-0000-0000-0001-000000000041', 'b0000000-0000-0000-0001-000000000042',
  'b0000000-0000-0000-0001-000000000043', 'b0000000-0000-0000-0001-000000000044',
  'b0000000-0000-0000-0001-000000000047', 'b0000000-0000-0000-0001-000000000048'
);

-- ============================================================
-- MISE À JOUR date_dernier_contact pour les leads contactées+
-- ============================================================

UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '6 days' WHERE id = 'b0000000-0000-0000-0001-000000000009';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '9 days' WHERE id = 'b0000000-0000-0000-0001-000000000010';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '2 days' WHERE id = 'b0000000-0000-0000-0001-000000000011';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '10 days' WHERE id = 'b0000000-0000-0000-0001-000000000012';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '5 days' WHERE id = 'b0000000-0000-0000-0001-000000000013';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '2 days' WHERE id = 'b0000000-0000-0000-0001-000000000014';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '12 days' WHERE id = 'b0000000-0000-0000-0001-000000000015';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '3 days' WHERE id = 'b0000000-0000-0000-0001-000000000016';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '5 days' WHERE id = 'b0000000-0000-0000-0001-000000000017';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '4 days' WHERE id = 'b0000000-0000-0000-0001-000000000018';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '8 days' WHERE id = 'b0000000-0000-0000-0001-000000000019';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '3 days' WHERE id = 'b0000000-0000-0000-0001-000000000020';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '2 days' WHERE id = 'b0000000-0000-0000-0001-000000000022';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '5 days' WHERE id = 'b0000000-0000-0000-0001-000000000023';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '7 days' WHERE id = 'b0000000-0000-0000-0001-000000000024';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '1 day' WHERE id = 'b0000000-0000-0000-0001-000000000025';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '14 days' WHERE id = 'b0000000-0000-0000-0001-000000000026';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '3 days' WHERE id = 'b0000000-0000-0000-0001-000000000027';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '1 day' WHERE id = 'b0000000-0000-0000-0001-000000000031';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '1 day' WHERE id = 'b0000000-0000-0000-0001-000000000032';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '1 day' WHERE id = 'b0000000-0000-0000-0001-000000000033';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '5 days' WHERE id = 'b0000000-0000-0000-0001-000000000034';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '10 days' WHERE id = 'b0000000-0000-0000-0001-000000000035';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '8 days' WHERE id = 'b0000000-0000-0000-0001-000000000036';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '15 days' WHERE id = 'b0000000-0000-0000-0001-000000000037';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '20 days' WHERE id = 'b0000000-0000-0000-0001-000000000038';
UPDATE leads SET date_dernier_contact = NOW() - INTERVAL '30 days' WHERE id = 'b0000000-0000-0000-0001-000000000040';
