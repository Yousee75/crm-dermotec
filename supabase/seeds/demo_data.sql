-- ============================================================
-- CRM DERMOTEC — Données démo (Mars 2026)
-- Un mois fictif réaliste d'activité d'un centre de formation
-- ============================================================

-- 1. ÉQUIPE (4 personnes)
INSERT INTO equipe (id, prenom, nom, email, telephone, role, specialites, objectif_mensuel, avatar_color) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Yossi', 'Hayoun', 'yossi@dermotec.fr', '01 88 33 43 43', 'admin', '{"direction","commercial","formation"}', 15, '#082545'),
  ('e1000000-0000-0000-0000-000000000002', 'Sarah', 'Benali', 'sarah@dermotec.fr', '06 12 34 56 78', 'formatrice', '{"maquillage permanent","microblading","full lips"}', 8, '#E11D48'),
  ('e1000000-0000-0000-0000-000000000003', 'Nadia', 'Khelifi', 'nadia@dermotec.fr', '06 98 76 54 32', 'commercial', '{"prospection","financement"}', 12, '#2EC6F3'),
  ('e1000000-0000-0000-0000-000000000004', 'Camille', 'Dupont', 'camille@dermotec.fr', '06 55 44 33 22', 'assistante', '{"facturation","financement","documents"}', 0, '#F59E0B')
ON CONFLICT (email) DO NOTHING;

-- 2. LEADS (25 leads sur le mois — réaliste pour un centre de formation)

-- Semaine 1 (1-7 mars) — 7 leads
INSERT INTO leads (id, prenom, nom, email, telephone, source, sujet, message, statut, priorite, score_chaud, statut_pro, experience_esthetique, formation_principale_id, commercial_assigne_id, date_premier_contact, date_dernier_contact, nb_contacts, financement_souhaite, tags, notes, created_at) VALUES
  ('l1000000-0000-0000-0000-000000000001', 'Fatou', 'Diallo', 'fatou.diallo@gmail.com', '06 71 22 33 44', 'formulaire', 'formation', 'Bonjour, je souhaite me reconvertir dans le maquillage permanent. Je suis actuellement salariée chez Sephora.', 'INSCRIT', 'HAUTE', 82, 'salariee', 'aucune', (SELECT id FROM formations WHERE slug='maquillage-permanent'), 'e1000000-0000-0000-0000-000000000003', '2026-03-01 09:15:00', '2026-03-12 14:30:00', 5, true, '{"reconversion","OPCO"}', 'Très motivée, dossier OPCO en cours chez AKTO', '2026-03-01 08:45:00'),

  ('l1000000-0000-0000-0000-000000000002', 'Marie', 'Lefebvre', 'marie.lefebvre@hotmail.fr', '06 82 11 55 66', 'instagram', 'formation', NULL, 'QUALIFIE', 'HAUTE', 68, 'independante', 'intermediaire', (SELECT id FROM formations WHERE slug='full-lips'), 'e1000000-0000-0000-0000-000000000003', '2026-03-02 11:00:00', '2026-03-10 16:45:00', 3, true, '{"institut","upsell"}', 'Gère un institut à Vincennes, veut ajouter les lèvres', '2026-03-02 10:30:00'),

  ('l1000000-0000-0000-0000-000000000003', 'Aïcha', 'Benmalek', 'aicha.b@outlook.com', '07 63 44 22 11', 'google', 'formation', 'Formation microblading Paris, quand est la prochaine session ?', 'FORME', 'NORMALE', 45, 'auto_entrepreneur', 'debutante', (SELECT id FROM formations WHERE slug='microblading'), 'e1000000-0000-0000-0000-000000000003', '2026-02-15 10:00:00', '2026-03-18 11:30:00', 7, false, '{"alumni","satisfaite"}', 'Formée le 6-7 mars. A adoré. Intéressée par maquillage permanent complet', '2026-02-15 09:00:00'),

  ('l1000000-0000-0000-0000-000000000004', 'Sophie', 'Martin', 'sophie.martin.beaute@gmail.com', '06 44 55 66 77', 'bouche_a_oreille', 'formation', NULL, 'CONTACTE', 'NORMALE', 35, 'demandeur_emploi', 'aucune', (SELECT id FROM formations WHERE slug='maquillage-permanent'), 'e1000000-0000-0000-0000-000000000003', '2026-03-03 14:00:00', '2026-03-05 10:15:00', 2, true, '{"France Travail"}', 'Recommandée par Aïcha. En reconversion, demandeur emploi', '2026-03-03 13:30:00'),

  ('l1000000-0000-0000-0000-000000000005', 'Léa', 'Rousseau', 'lea.r@yahoo.fr', '06 33 22 11 00', 'telephone', 'financement', NULL, 'FINANCEMENT_EN_COURS', 'HAUTE', 72, 'salariee', 'debutante', (SELECT id FROM formations WHERE slug='maquillage-permanent'), 'e1000000-0000-0000-0000-000000000003', '2026-03-04 09:30:00', '2026-03-15 11:00:00', 4, true, '{"OPCO EP","urgent"}', 'Salariée institut Yves Rocher. OPCO EP validé à 100%', '2026-03-04 09:00:00'),

  ('l1000000-0000-0000-0000-000000000006', 'Inès', 'Zouari', 'ines.z@gmail.com', '07 11 22 33 44', 'salon', 'formation', NULL, 'NOUVEAU', 'NORMALE', 20, NULL, NULL, NULL, NULL, NULL, NULL, 0, false, '{}', NULL, '2026-03-05 16:00:00'),

  ('l1000000-0000-0000-0000-000000000007', 'Clara', 'Duval', 'clara.duval@free.fr', '06 99 88 77 66', 'formulaire', 'eshop', 'Bonjour, je cherche des pigments NPM pour mon institut.', 'CONTACTE', 'BASSE', 15, 'gerant_institut', 'confirmee', NULL, 'e1000000-0000-0000-0000-000000000004', '2026-03-06 10:00:00', '2026-03-08 14:00:00', 2, false, '{"eshop","pigments"}', 'Veut commander des pigments. Pas intéressée par la formation pour le moment', '2026-03-06 09:45:00'),

-- Semaine 2 (8-14 mars) — 6 leads
  ('l1000000-0000-0000-0000-000000000008', 'Amina', 'Ouali', 'amina.ouali@gmail.com', '06 55 66 77 88', 'facebook', 'formation', 'Vu votre pub Facebook. Combien coûte la formation microblading ?', 'QUALIFIE', 'NORMALE', 55, 'reconversion', 'aucune', (SELECT id FROM formations WHERE slug='microblading'), 'e1000000-0000-0000-0000-000000000003', '2026-03-08 12:00:00', '2026-03-14 09:30:00', 3, true, '{"reconversion","FIFPL"}', 'Ancienne coiffeuse, veut se mettre à son compte en microblading', '2026-03-08 11:30:00'),

  ('l1000000-0000-0000-0000-000000000009', 'Julie', 'Petit', 'julie.petit.pro@gmail.com', '07 22 33 44 55', 'whatsapp', 'formation', 'Bonjour ! Je suis intéressée par la formation nanoneedling', 'INSCRIT', 'HAUTE', 78, 'independante', 'intermediaire', (SELECT id FROM formations WHERE slug='nanoneedling'), 'e1000000-0000-0000-0000-000000000003', '2026-03-09 08:00:00', '2026-03-16 15:00:00', 4, false, '{"paiement CB"}', 'A payé directement par CB. Session du 24 mars', '2026-03-09 07:45:00'),

  ('l1000000-0000-0000-0000-000000000010', 'Yasmine', 'El Amrani', 'yasmine.ea@hotmail.com', '06 77 88 99 00', 'formulaire', 'formation', 'Je veux me former en tricopigmentation. Quelles sont les prérequis ?', 'QUALIFIE', 'NORMALE', 60, 'independante', 'intermediaire', (SELECT id FROM formations WHERE slug='tricopigmentation'), 'e1000000-0000-0000-0000-000000000003', '2026-03-10 14:30:00', '2026-03-17 10:00:00', 3, true, '{"tricopigmentation","FAFCEA"}', 'Esthéticienne indépendante à Montreuil. Veut ajouter la tricopigmentation', '2026-03-10 14:00:00'),

  ('l1000000-0000-0000-0000-000000000011', 'Emma', 'Bernard', 'emma.brd@gmail.com', '06 11 00 99 88', 'google', 'formation', NULL, 'PERDU', 'BASSE', 10, 'etudiante', 'aucune', (SELECT id FROM formations WHERE slug='maquillage-permanent'), NULL, '2026-03-11 16:00:00', '2026-03-13 11:00:00', 2, false, '{"perdu","prix"}', 'Étudiante, pas de budget, pas éligible financement', '2026-03-11 15:45:00'),

  ('l1000000-0000-0000-0000-000000000012', 'Samira', 'Kaddour', 'samira.k@laposte.net', '07 44 55 66 77', 'partenariat', 'formation', NULL, 'EN_FORMATION', 'HAUTE', 85, 'salariee', 'debutante', (SELECT id FROM formations WHERE slug='maquillage-permanent'), 'e1000000-0000-0000-0000-000000000003', '2026-03-01 09:00:00', '2026-03-17 08:30:00', 6, true, '{"AKTO","en cours"}', 'En formation cette semaine (17-21 mars). AKTO a tout financé', '2026-03-01 08:30:00'),

  ('l1000000-0000-0000-0000-000000000013', 'Chloé', 'Moreau', 'chloe.moreau@icloud.com', '06 88 77 66 55', 'instagram', 'formation', NULL, 'NOUVEAU', 'NORMALE', 25, NULL, NULL, (SELECT id FROM formations WHERE slug='peeling-dermaplaning'), NULL, NULL, NULL, 0, false, '{}', NULL, '2026-03-12 20:15:00'),

-- Semaine 3 (15-21 mars) — 7 leads
  ('l1000000-0000-0000-0000-000000000014', 'Rania', 'Benmoussa', 'rania.bm@gmail.com', '07 33 22 11 00', 'formulaire', 'formation', 'Bonjour, je gère un institut et je veux former mon équipe en soins visage ALLin1', 'QUALIFIE', 'HAUTE', 75, 'gerant_institut', 'confirmee', (SELECT id FROM formations WHERE slug='soin-allin1'), 'e1000000-0000-0000-0000-000000000001', '2026-03-15 09:00:00', '2026-03-19 14:00:00', 3, true, '{"institut","groupe","OPCO EP"}', '3 esthéticiennes à former. OPCO EP. Gros potentiel CA', '2026-03-15 08:30:00'),

  ('l1000000-0000-0000-0000-000000000015', 'Lina', 'Ferhat', 'lina.ferhat@gmail.com', '06 22 11 00 99', 'ancien_stagiaire', 'formation', NULL, 'INSCRIT', 'NORMALE', 70, 'auto_entrepreneur', 'intermediaire', (SELECT id FROM formations WHERE slug='full-lips'), 'e1000000-0000-0000-0000-000000000003', '2026-03-16 10:00:00', '2026-03-18 16:00:00', 2, false, '{"alumni","upsell","microblading done"}', 'A fait microblading en janvier, revient pour Full Lips', '2026-03-16 09:30:00'),

  ('l1000000-0000-0000-0000-000000000016', 'Mélissa', 'Girard', 'melissa.g@outlook.fr', '07 55 44 33 22', 'google', 'financement', 'Comment faire financer la formation maquillage permanent par mon OPCO ?', 'FINANCEMENT_EN_COURS', 'NORMALE', 58, 'salariee', 'debutante', (SELECT id FROM formations WHERE slug='maquillage-permanent'), 'e1000000-0000-0000-0000-000000000004', '2026-03-16 14:00:00', '2026-03-19 10:30:00', 3, true, '{"OPCO","dossier en cours"}', 'Dossier OPCO EP soumis le 19/03. En attente réponse', '2026-03-16 13:45:00'),

  ('l1000000-0000-0000-0000-000000000017', 'Nour', 'Hakim', 'nour.hakim@gmail.com', '06 66 55 44 33', 'whatsapp', 'formation', 'Salam ! Possible de faire hygiène et salubrité + microblading la même semaine ?', 'CONTACTE', 'NORMALE', 42, 'reconversion', 'aucune', (SELECT id FROM formations WHERE slug='hygiene-salubrite'), 'e1000000-0000-0000-0000-000000000003', '2026-03-17 11:00:00', '2026-03-19 09:00:00', 2, true, '{"combo","France Travail"}', 'Veut faire les 2 formations. Demandeur emploi bientôt', '2026-03-17 10:30:00'),

  ('l1000000-0000-0000-0000-000000000018', 'Laura', 'Nguyen', 'laura.nguyen@gmail.com', '07 88 77 66 55', 'site_web', 'formation', NULL, 'NOUVEAU', 'NORMALE', 18, NULL, NULL, (SELECT id FROM formations WHERE slug='epilation-definitive'), NULL, NULL, NULL, 0, false, '{}', NULL, '2026-03-18 22:30:00'),

  ('l1000000-0000-0000-0000-000000000019', 'Djamila', 'Ait Ahmed', 'djamila.aa@yahoo.fr', '06 44 33 22 11', 'telephone', 'formation', NULL, 'REPORTE', 'BASSE', 30, 'salariee', 'debutante', (SELECT id FROM formations WHERE slug='microblading'), 'e1000000-0000-0000-0000-000000000003', '2026-03-19 09:30:00', '2026-03-19 09:45:00', 1, true, '{"reporté","juin"}', 'Intéressée mais pas dispo avant juin. Rappeler fin mai', '2026-03-19 09:30:00'),

  ('l1000000-0000-0000-0000-000000000020', 'Océane', 'Lambert', 'oceane.lambert@gmail.com', '07 11 22 33 44', 'formulaire', 'partenariat', 'Bonjour, je suis formatrice indépendante et je cherche un partenariat pour utiliser vos locaux', 'CONTACTE', 'NORMALE', 28, 'independante', 'experte', NULL, 'e1000000-0000-0000-0000-000000000001', '2026-03-20 10:00:00', '2026-03-20 15:00:00', 1, false, '{"partenariat","formatrice"}', 'Proposition intéressante. À étudier', '2026-03-20 09:45:00'),

-- Semaine 4 (22-31 mars) — 5 leads
  ('l1000000-0000-0000-0000-000000000021', 'Sabrina', 'Meziane', 'sabrina.mez@gmail.com', '06 99 00 11 22', 'instagram', 'formation', NULL, 'NOUVEAU', 'HAUTE', 30, 'independante', 'intermediaire', (SELECT id FROM formations WHERE slug='areole-cicatrices'), NULL, NULL, NULL, 0, false, '{"instagram story"}', NULL, '2026-03-22 14:00:00'),

  ('l1000000-0000-0000-0000-000000000022', 'Kenza', 'Boudjema', 'kenza.b@gmail.com', '07 66 55 44 33', 'formulaire', 'formation', 'Je veux faire la formation détatouage. Quand est la prochaine date ?', 'CONTACTE', 'NORMALE', 40, 'gerant_institut', 'confirmee', (SELECT id FROM formations WHERE slug='detatouage'), 'e1000000-0000-0000-0000-000000000003', '2026-03-23 11:00:00', '2026-03-25 14:00:00', 2, false, '{"institut","détatouage"}', 'Institut à Créteil, veut ajouter le détatouage', '2026-03-23 10:45:00'),

  ('l1000000-0000-0000-0000-000000000023', 'Pauline', 'Roux', 'pauline.roux.pro@gmail.com', '06 33 44 55 66', 'google', 'formation', NULL, 'NOUVEAU', 'NORMALE', 22, NULL, NULL, (SELECT id FROM formations WHERE slug='soin-allin1'), NULL, NULL, NULL, 0, false, '{}', NULL, '2026-03-25 19:00:00'),

  ('l1000000-0000-0000-0000-000000000024', 'Hawa', 'Coulibaly', 'hawa.c@hotmail.fr', '07 22 11 00 99', 'bouche_a_oreille', 'formation', NULL, 'QUALIFIE', 'HAUTE', 65, 'demandeur_emploi', 'aucune', (SELECT id FROM formations WHERE slug='maquillage-permanent'), 'e1000000-0000-0000-0000-000000000003', '2026-03-26 09:00:00', '2026-03-28 11:00:00', 3, true, '{"France Travail","AIF","parrainage Fatou"}', 'Recommandée par Fatou Diallo. France Travail AIF en cours', '2026-03-26 08:30:00'),

  ('l1000000-0000-0000-0000-000000000025', 'Manon', 'Leroy', 'manon.leroy@gmail.com', '06 77 88 99 11', 'formulaire', 'formation', 'Bonjour, intéressée par peeling chimique', 'NOUVEAU', 'NORMALE', 20, 'independante', 'debutante', (SELECT id FROM formations WHERE slug='peeling-dermaplaning'), NULL, NULL, NULL, 0, false, '{}', NULL, '2026-03-28 16:30:00')
ON CONFLICT DO NOTHING;

-- 3. SESSIONS (5 sessions en mars)
INSERT INTO sessions (id, formation_id, date_debut, date_fin, horaire_debut, horaire_fin, salle, formatrice_id, places_max, places_occupees, statut, ca_prevu, ca_realise, materiel_prepare, supports_envoyes, notes) VALUES
  -- Session Microblading 6-7 mars (TERMINÉE)
  ('s1000000-0000-0000-0000-000000000001',
   (SELECT id FROM formations WHERE slug='microblading'),
   '2026-03-06', '2026-03-07', '09:00', '17:00', 'Salle 1',
   'e1000000-0000-0000-0000-000000000002', 6, 4, 'TERMINEE',
   5600, 5600, true, true, 'Session complète. 4 stagiaires, très bon niveau'),

  -- Session Maquillage Permanent 17-21 mars (EN COURS)
  ('s1000000-0000-0000-0000-000000000002',
   (SELECT id FROM formations WHERE slug='maquillage-permanent'),
   '2026-03-17', '2026-03-21', '09:00', '17:00', 'Salle 1',
   'e1000000-0000-0000-0000-000000000002', 6, 3, 'EN_COURS',
   7470, 4980, true, true, 'Samira en cours, Fatou et Léa confirmées'),

  -- Session Nanoneedling 24 mars (CONFIRMÉE)
  ('s1000000-0000-0000-0000-000000000003',
   (SELECT id FROM formations WHERE slug='nanoneedling'),
   '2026-03-24', '2026-03-24', '09:00', '17:00', 'Salle 2',
   'e1000000-0000-0000-0000-000000000002', 6, 2, 'CONFIRMEE',
   1400, 0, true, false, 'Julie + 1 autre stagiaire confirmées'),

  -- Session Full Lips 27-28 mars (PLANIFIÉE)
  ('s1000000-0000-0000-0000-000000000004',
   (SELECT id FROM formations WHERE slug='full-lips'),
   '2026-03-27', '2026-03-28', '09:00', '17:00', 'Salle 1',
   'e1000000-0000-0000-0000-000000000002', 6, 1, 'PLANIFIEE',
   1400, 0, false, false, 'Lina inscrite. Chercher 2-3 stagiaires de plus'),

  -- Session Hygiène et Salubrité 31 mars - 2 avril (PLANIFIÉE)
  ('s1000000-0000-0000-0000-000000000005',
   (SELECT id FROM formations WHERE slug='hygiene-salubrite'),
   '2026-03-31', '2026-04-02', '09:00', '17:00', 'Salle 2',
   NULL, 6, 0, 'PLANIFIEE',
   0, 0, false, false, 'Pas de formatrice assignée encore')
ON CONFLICT DO NOTHING;

-- 4. INSCRIPTIONS (6 inscriptions)
INSERT INTO inscriptions (id, lead_id, session_id, montant_total, montant_finance, reste_a_charge, paiement_statut, statut, note_satisfaction, certificat_genere, convention_signee, notes) VALUES
  -- Aïcha — Microblading terminé
  ('i1000000-0000-0000-0000-000000000001',
   'l1000000-0000-0000-0000-000000000003', 's1000000-0000-0000-0000-000000000001',
   1400, 0, 1400, 'PAYE', 'COMPLETEE', 5, true, true, 'Excellente stagiaire'),

  -- Samira — Maquillage permanent en cours
  ('i1000000-0000-0000-0000-000000000002',
   'l1000000-0000-0000-0000-000000000012', 's1000000-0000-0000-0000-000000000002',
   2490, 2490, 0, 'PAYE', 'EN_COURS', NULL, false, true, 'Financée 100% AKTO'),

  -- Fatou — Maquillage permanent inscrite
  ('i1000000-0000-0000-0000-000000000003',
   'l1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000002',
   2490, 2490, 0, 'PAYE', 'EN_COURS', NULL, false, true, 'Financée AKTO'),

  -- Léa — Maquillage permanent inscrite (OPCO EP)
  ('i1000000-0000-0000-0000-000000000004',
   'l1000000-0000-0000-0000-000000000005', 's1000000-0000-0000-0000-000000000002',
   2490, 2490, 0, 'EN_ATTENTE', 'CONFIRMEE', NULL, false, true, 'OPCO EP validé, en attente versement'),

  -- Julie — Nanoneedling
  ('i1000000-0000-0000-0000-000000000005',
   'l1000000-0000-0000-0000-000000000009', 's1000000-0000-0000-0000-000000000003',
   700, 0, 700, 'PAYE', 'CONFIRMEE', NULL, false, true, 'Payé CB direct'),

  -- Lina — Full Lips (alumni microblading)
  ('i1000000-0000-0000-0000-000000000006',
   'l1000000-0000-0000-0000-000000000015', 's1000000-0000-0000-0000-000000000004',
   1400, 0, 1400, 'ACOMPTE', 'CONFIRMEE', NULL, false, false, 'Acompte 500€ reçu, solde avant session')
ON CONFLICT DO NOTHING;

-- 5. FINANCEMENTS (5 dossiers)
INSERT INTO financements (id, lead_id, inscription_id, organisme, numero_dossier, montant_demande, montant_accorde, montant_verse, statut, date_soumission, date_reponse, notes, historique) VALUES
  -- Fatou — AKTO validé et versé
  ('f1000000-0000-0000-0000-000000000001',
   'l1000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000003',
   'AKTO', 'AKTO-2026-18745', 2490, 2490, 2490, 'VERSE',
   '2026-02-15', '2026-02-28', 'Dossier traité rapidement',
   '[{"date":"2026-02-15","action":"Dossier soumis"},{"date":"2026-02-28","action":"Accord AKTO 100%"},{"date":"2026-03-10","action":"Versement reçu"}]'),

  -- Samira — AKTO validé, en attente versement
  ('f1000000-0000-0000-0000-000000000002',
   'l1000000-0000-0000-0000-000000000012', 'i1000000-0000-0000-0000-000000000002',
   'AKTO', 'AKTO-2026-19201', 2490, 2490, 0, 'VALIDE',
   '2026-02-20', '2026-03-05', 'Validé, versement prévu post-formation',
   '[{"date":"2026-02-20","action":"Dossier soumis"},{"date":"2026-03-05","action":"Accord AKTO 100%"}]'),

  -- Léa — OPCO EP validé
  ('f1000000-0000-0000-0000-000000000003',
   'l1000000-0000-0000-0000-000000000005', 'i1000000-0000-0000-0000-000000000004',
   'OPCO_EP', 'OPCOEP-2026-44521', 2490, 2490, 0, 'VALIDE',
   '2026-03-01', '2026-03-14', 'Validé rapidement, bon dossier',
   '[{"date":"2026-03-01","action":"Dossier soumis"},{"date":"2026-03-14","action":"Accord OPCO EP 100%"}]'),

  -- Mélissa — OPCO EP soumis, en attente
  ('f1000000-0000-0000-0000-000000000004',
   'l1000000-0000-0000-0000-000000000016', NULL,
   'OPCO_EP', NULL, 2490, NULL, 0, 'SOUMIS',
   '2026-03-19', NULL, 'En attente réponse OPCO',
   '[{"date":"2026-03-19","action":"Dossier soumis"}]'),

  -- Hawa — France Travail AIF en préparation
  ('f1000000-0000-0000-0000-000000000005',
   'l1000000-0000-0000-0000-000000000024', NULL,
   'FRANCE_TRAVAIL', NULL, 2490, NULL, 0, 'DOCUMENTS_REQUIS',
   NULL, NULL, 'Manque attestation inscription France Travail',
   '[{"date":"2026-03-26","action":"Dossier ouvert, documents demandés"}]')
ON CONFLICT DO NOTHING;

-- 6. RAPPELS (10 rappels — passés et futurs)
INSERT INTO rappels (id, lead_id, user_id, date_rappel, type, statut, priorite, titre, description) VALUES
  -- Rappels passés (faits)
  ('r1000000-0000-0000-0000-000000000001', 'l1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', '2026-03-02 09:00:00', 'APPEL', 'FAIT', 'HAUTE', 'Premier appel Fatou', 'Qualification + vérif financement AKTO'),
  ('r1000000-0000-0000-0000-000000000002', 'l1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', '2026-03-13 14:00:00', 'APPEL', 'FAIT', 'NORMALE', 'Suivi post-formation Aïcha', 'Comment ça se passe ? Intéressée par maquillage permanent ?'),
  ('r1000000-0000-0000-0000-000000000003', 'l1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000003', '2026-03-10 10:00:00', 'EMAIL', 'FAIT', 'HAUTE', 'Envoi convention Léa', 'Convention + programme pour le dossier OPCO EP'),

  -- Rappels en retard
  ('r1000000-0000-0000-0000-000000000004', 'l1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000003', '2026-03-18 09:00:00', 'APPEL', 'EN_ATTENTE', 'HAUTE', 'Relance Sophie Martin', 'Rappeler pour avancer le dossier France Travail'),
  ('r1000000-0000-0000-0000-000000000005', 'l1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000003', '2026-03-19 14:00:00', 'WHATSAPP', 'EN_ATTENTE', 'NORMALE', 'Relance Amina financement', 'Vérifier si elle a les documents FIFPL'),

  -- Rappels aujourd'hui (20 mars)
  ('r1000000-0000-0000-0000-000000000006', 'l1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000003', '2026-03-20 09:30:00', 'APPEL', 'EN_ATTENTE', 'NORMALE', 'Appel Yasmine tricopigmentation', 'Confirmer la session et le financement FAFCEA'),
  ('r1000000-0000-0000-0000-000000000007', 'l1000000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000001', '2026-03-20 14:00:00', 'RDV', 'EN_ATTENTE', 'HAUTE', 'RDV Rania — formation groupe', 'Discuter du planning pour 3 esthéticiennes'),

  -- Rappels futurs
  ('r1000000-0000-0000-0000-000000000008', 'l1000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000002', '2026-03-23 09:00:00', 'EMAIL', 'EN_ATTENTE', 'NORMALE', 'Envoi convocation Julie', 'Convocation nanoneedling J-1'),
  ('r1000000-0000-0000-0000-000000000009', 'l1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', '2026-04-05 10:00:00', 'APPEL', 'EN_ATTENTE', 'NORMALE', 'Suivi J+30 Aïcha', 'A-t-elle lancé son activité ? Proposer maquillage permanent'),
  ('r1000000-0000-0000-0000-000000000010', 'l1000000-0000-0000-0000-000000000019', 'e1000000-0000-0000-0000-000000000003', '2026-05-25 09:00:00', 'APPEL', 'EN_ATTENTE', 'BASSE', 'Rappel Djamila juin', 'Intéressée microblading mais dispo en juin')
ON CONFLICT DO NOTHING;

-- 7. ACTIVITÉS (15 événements)
INSERT INTO activites (type, lead_id, session_id, inscription_id, user_id, description, ancien_statut, nouveau_statut, metadata, created_at) VALUES
  ('LEAD_CREE', 'l1000000-0000-0000-0000-000000000001', NULL, NULL, NULL, 'Lead créé via formulaire site — Fatou Diallo (formation)', NULL, 'NOUVEAU', '{"source":"formulaire"}', '2026-03-01 08:45:00'),
  ('STATUT_CHANGE', 'l1000000-0000-0000-0000-000000000001', NULL, NULL, 'e1000000-0000-0000-0000-000000000003', 'Statut changé vers CONTACTE après premier appel', 'NOUVEAU', 'CONTACTE', '{}', '2026-03-02 09:15:00'),
  ('CONTACT', 'l1000000-0000-0000-0000-000000000001', NULL, NULL, 'e1000000-0000-0000-0000-000000000003', 'Appel 12min — très motivée, reconversion, AKTO à vérifier', NULL, NULL, '{"duree":"12min","type":"appel"}', '2026-03-02 09:30:00'),
  ('STATUT_CHANGE', 'l1000000-0000-0000-0000-000000000001', NULL, NULL, 'e1000000-0000-0000-0000-000000000003', 'Qualifiée — AKTO confirmé, formation MP choisie', 'CONTACTE', 'QUALIFIE', '{}', '2026-03-05 14:00:00'),
  ('FINANCEMENT', 'l1000000-0000-0000-0000-000000000001', NULL, NULL, 'e1000000-0000-0000-0000-000000000004', 'Dossier AKTO soumis — AKTO-2026-18745', NULL, NULL, '{"organisme":"AKTO","montant":2490}', '2026-03-06 10:00:00'),
  ('PAIEMENT', 'l1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000002', 'i1000000-0000-0000-0000-000000000003', NULL, 'Financement AKTO versé — 2490€', NULL, NULL, '{"montant":2490,"source":"AKTO"}', '2026-03-10 11:00:00'),
  ('INSCRIPTION', 'l1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000002', 'i1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', 'Inscrite session Maquillage Permanent 17-21 mars', NULL, 'INSCRIT', '{}', '2026-03-12 14:30:00'),

  ('SESSION', NULL, 's1000000-0000-0000-0000-000000000001', NULL, 'e1000000-0000-0000-0000-000000000002', 'Session Microblading terminée — 4 stagiaires, 100% satisfaction', NULL, 'TERMINEE', '{"stagiaires":4,"satisfaction":"100%"}', '2026-03-07 17:30:00'),
  ('LEAD_CREE', 'l1000000-0000-0000-0000-000000000009', NULL, NULL, NULL, 'Lead créé via WhatsApp — Julie Petit (nanoneedling)', NULL, 'NOUVEAU', '{"source":"whatsapp"}', '2026-03-09 07:45:00'),
  ('PAIEMENT', 'l1000000-0000-0000-0000-000000000009', 's1000000-0000-0000-0000-000000000003', 'i1000000-0000-0000-0000-000000000005', NULL, 'Paiement CB reçu — 700€', NULL, NULL, '{"montant":700,"mode":"carte"}', '2026-03-10 16:00:00'),

  ('LEAD_CREE', 'l1000000-0000-0000-0000-000000000014', NULL, NULL, NULL, 'Lead créé via formulaire — Rania Benmoussa (groupe 3 esthéticiennes)', NULL, 'NOUVEAU', '{"source":"formulaire","potentiel":"groupe"}', '2026-03-15 08:30:00'),
  ('EMAIL', 'l1000000-0000-0000-0000-000000000016', NULL, NULL, 'e1000000-0000-0000-0000-000000000004', 'Email envoyé — Guide financement OPCO EP + checklist docs', NULL, NULL, '{"template":"financement_opco"}', '2026-03-17 10:00:00'),
  ('DOCUMENT', 'l1000000-0000-0000-0000-000000000005', NULL, NULL, 'e1000000-0000-0000-0000-000000000004', 'Convention de formation uploadée et signée', NULL, NULL, '{"type":"convention","signe":true}', '2026-03-08 14:00:00'),
  ('NOTE', 'l1000000-0000-0000-0000-000000000012', NULL, NULL, 'e1000000-0000-0000-0000-000000000002', 'Jour 1 formation — Samira très appliquée, bonne coordination main', NULL, NULL, '{}', '2026-03-17 17:00:00'),
  ('SYSTEME', NULL, NULL, NULL, NULL, 'Backup quotidien effectué — 25 leads, 5 sessions, 6 inscriptions', NULL, NULL, '{"leads":25,"sessions":5,"inscriptions":6}', '2026-03-20 02:00:00');

-- 8. NOTES (5 notes)
INSERT INTO notes_lead (lead_id, user_id, contenu, type, is_pinned) VALUES
  ('l1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 'Appel du 2 mars : Fatou travaille chez Sephora depuis 3 ans. Très motivée pour la reconversion. Son manager est OK pour la formation via AKTO. Elle a déjà contacté son OPCO.', 'appel', true),
  ('l1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000002', 'Aïcha a terminé la formation Microblading avec d''excellents résultats. Geste sûr, bonne compréhension de la colorimétrie. Je recommande le maquillage permanent complet comme suite logique.', 'note', true),
  ('l1000000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000001', 'Rania gère un institut à Saint-Mandé avec 3 esthéticiennes. Elle veut les former toutes les 3 au Soin Visage ALLin1. Potentiel CA : 2700€ HT (3 × 900€). Dossier OPCO EP pour les 3.', 'reunion', true),
  ('l1000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000002', 'Jour 2 : Samira progresse bien. Première pratique sur modèle demain. Elle est un peu nerveuse mais technique solide.', 'note', false),
  ('l1000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000003', 'Emma est étudiante, pas de budget, pas de financement possible. Elle reviendra peut-être dans 2-3 ans. Ne pas relancer.', 'appel', false);

-- 9. QUALITÉ (2 entrées)
INSERT INTO qualite (type, titre, description, statut, priorite, critere_qualiopi, actions_menees) VALUES
  ('amelioration', 'Ajouter une vidéo de préparation', 'Plusieurs stagiaires ont demandé une vidéo de préparation à regarder avant la formation pour arriver plus sereine.', 'EN_COURS', 'NORMALE', 2, 'Vidéo en cours de tournage avec Sarah'),
  ('reclamation', 'Température salle trop basse', 'Une stagiaire s''est plainte que la salle était trop froide pendant la formation du 6 mars.', 'RESOLUE', 'BASSE', 4, 'Chauffage d''appoint installé + thermostat réglé à 22°C');
