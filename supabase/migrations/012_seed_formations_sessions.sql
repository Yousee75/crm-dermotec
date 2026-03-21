-- ============================================================
-- CRM DERMOTEC — Seed 11 formations + 8 sessions (3 prochains mois)
-- ============================================================

-- Seed 11 formations avec Stripe IDs
INSERT INTO formations (nom, slug, categorie, description_commerciale, prix_ht, tva_rate, duree_jours, duree_heures, niveau, prerequis, places_max, materiel_inclus, is_active, sort_order, objectifs, competences_acquises)
VALUES
  ('Hygiène et Salubrité', 'hygiene-salubrite', 'Hygiène', 'Le prérequis légal pour exercer — indispensable, rapide, finançable.', 400, 20, 3, 21, 'debutant', 'Obligatoire pour exercer', 12, true, true, 1,
   ARRAY['Maîtriser les règles d''hygiène en esthétique', 'Connaître la réglementation sanitaire', 'Appliquer les protocoles de désinfection'],
   ARRAY['Certificat Hygiène et Salubrité', 'Conformité réglementaire']),

  ('Maquillage Permanent Complet', 'maquillage-permanent', 'Dermo-Esthétique', 'Maîtrisez les 3 techniques les plus demandées en 5 jours — ROI garanti.', 2490, 20, 5, 35, 'debutant', NULL, 8, true, true, 2,
   ARRAY['Maîtriser le dermographe', 'Réaliser sourcils, lèvres et eye-liner', 'Gérer les retouches', 'Conseiller les clientes'],
   ARRAY['Dermopigmentation sourcils', 'Dermopigmentation lèvres', 'Dermopigmentation eye-liner', 'Colorimétrie']),

  ('Microblading / Microshading', 'microblading', 'Dermo-Esthétique', 'La prestation la plus rentable en institut : 200€ la séance, demande explosive.', 1400, 20, 2, 14, 'debutant', NULL, 8, true, true, 3,
   ARRAY['Maîtriser la technique du microblading', 'Réaliser le microshading', 'Dessiner les sourcils selon la morphologie'],
   ARRAY['Microblading manuel', 'Microshading', 'Visagisme sourcils']),

  ('Full Lips', 'full-lips', 'Dermo-Esthétique', 'Maîtrisez la pigmentation lèvres — 300€ par séance, tendance 2025.', 1400, 20, 2, 14, 'debutant', NULL, 8, true, true, 4,
   ARRAY['Pigmenter les lèvres en toute sécurité', 'Maîtriser le dégradé et le lip blush', 'Gérer les contre-indications'],
   ARRAY['Full lips technique', 'Lip blush', 'Colorimétrie lèvres']),

  ('Tricopigmentation HFS', 'tricopigmentation', 'Dermo-Esthétique', 'Marché calvitie : 500-800€ par séance, clientèle masculine fidèle.', 2500, 20, 3, 21, 'intermediaire', 'Expérience en dermopigmentation recommandée', 6, true, true, 5,
   ARRAY['Maîtriser la tricopigmentation capillaire', 'Simuler la densité capillaire', 'Traiter les alopécies'],
   ARRAY['Tricopigmentation HFS', 'Simulation capillaire', 'Traitement alopécie']),

  ('Aréole Mammaire & Cicatrices', 'areole-cicatrices', 'Dermo-Correctrice', 'Dermopigmentation réparatrice — mission humaine, revenus élevés.', 2300, 20, 3, 21, 'intermediaire', 'Expérience en dermopigmentation requise', 6, true, true, 6,
   ARRAY['Reconstruire l''aréole mammaire', 'Camoufler les cicatrices', 'Accompagner les patientes post-chirurgie'],
   ARRAY['Reconstruction aréolaire', 'Camouflage cicatrices', 'Dermopigmentation correctrice']),

  ('Nanoneedling & BB Glow', 'nanoneedling', 'Soins Visage', 'Soin anti-âge 80-120€ — technique simple, résultats immédiats.', 700, 20, 1, 7, 'debutant', NULL, 10, true, true, 7,
   ARRAY['Maîtriser le nanoneedling', 'Réaliser un BB Glow professionnel', 'Adapter le protocole selon le type de peau'],
   ARRAY['Nanoneedling', 'BB Glow', 'Protocole anti-âge']),

  ('Soin Visage ALLin1', 'soin-allin1', 'Soins Visage', 'Soin phare institut 90-150€ — différenciez-vous de la concurrence.', 900, 20, 1, 7, 'debutant', NULL, 10, true, true, 8,
   ARRAY['Maîtriser le soin visage complet', 'Combiner les technologies', 'Personnaliser selon le diagnostic peau'],
   ARRAY['Soin visage multi-technologies', 'Diagnostic peau', 'Protocole personnalisé']),

  ('Peeling Chimique & Dermaplaning', 'peeling-dermaplaning', 'Soins Visage', 'Peeling + dermaplaning 120-200€ — transformez tous types de peau.', 990, 20, 1, 7, 'debutant', NULL, 10, true, true, 9,
   ARRAY['Réaliser des peelings chimiques en sécurité', 'Maîtriser le dermaplaning', 'Adapter les protocoles au type de peau'],
   ARRAY['Peeling chimique', 'Dermaplaning', 'Renouvellement cellulaire']),

  ('Détatouage & Carbon Peel', 'detatouage', 'Laser & IPL', 'Détatouage laser + carbon peel — marché en pleine croissance.', 990, 20, 1, 7, 'intermediaire', 'Connaissances en laser recommandées', 8, true, true, 10,
   ARRAY['Utiliser le laser Q-Switch en sécurité', 'Réaliser un carbon peel', 'Évaluer les tatouages et pigmentations'],
   ARRAY['Détatouage laser', 'Carbon peel', 'Paramétrage laser']),

  ('Épilation Définitive', 'epilation-definitive', 'Laser & IPL', 'Épilation laser — la prestation la plus demandée en institut.', 990, 20, 1, 7, 'debutant', NULL, 10, true, true, 11,
   ARRAY['Maîtriser l''épilation laser/IPL', 'Adapter les paramètres selon phototype', 'Gérer les contre-indications'],
   ARRAY['Épilation laser', 'Épilation IPL', 'Phototypes et paramétrage'])
ON CONFLICT (slug) DO UPDATE SET
  prix_ht = EXCLUDED.prix_ht,
  description_commerciale = EXCLUDED.description_commerciale,
  objectifs = EXCLUDED.objectifs,
  competences_acquises = EXCLUDED.competences_acquises,
  is_active = EXCLUDED.is_active;

-- Seed 8 sessions pour les 3 prochains mois
-- (dates relatives à partir de maintenant)
INSERT INTO sessions (formation_id, date_debut, date_fin, horaire_debut, horaire_fin, salle, adresse, places_max, places_occupees, statut, ca_prevu, materiel_prepare, supports_envoyes, convocations_envoyees, modeles_necessaires, modeles_inscrits)
SELECT
  f.id,
  CURRENT_DATE + interval '14 days',
  CURRENT_DATE + interval '14 days' + (f.duree_jours - 1) * interval '1 day',
  '09:00', '17:00',
  'Salle A', '75 Bd Richard Lenoir, 75011 Paris',
  f.places_max, 0, 'PLANIFIEE',
  f.prix_ht * 1.2 * f.places_max, false, false, false, 2, 0
FROM formations f WHERE f.slug = 'microblading'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (formation_id, date_debut, date_fin, horaire_debut, horaire_fin, salle, adresse, places_max, places_occupees, statut, ca_prevu, materiel_prepare, supports_envoyes, convocations_envoyees, modeles_necessaires, modeles_inscrits)
SELECT
  f.id,
  CURRENT_DATE + interval '21 days',
  CURRENT_DATE + interval '25 days',
  '09:00', '17:00',
  'Salle A', '75 Bd Richard Lenoir, 75011 Paris',
  f.places_max, 0, 'PLANIFIEE',
  f.prix_ht * 1.2 * f.places_max, false, false, false, 3, 0
FROM formations f WHERE f.slug = 'maquillage-permanent'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (formation_id, date_debut, date_fin, horaire_debut, horaire_fin, salle, adresse, places_max, places_occupees, statut, ca_prevu, materiel_prepare, supports_envoyes, convocations_envoyees, modeles_necessaires, modeles_inscrits)
SELECT
  f.id,
  CURRENT_DATE + interval '30 days',
  CURRENT_DATE + interval '30 days',
  '09:00', '17:00',
  'Salle B', '75 Bd Richard Lenoir, 75011 Paris',
  f.places_max, 0, 'PLANIFIEE',
  f.prix_ht * 1.2 * f.places_max, false, false, false, 0, 0
FROM formations f WHERE f.slug = 'nanoneedling'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (formation_id, date_debut, date_fin, horaire_debut, horaire_fin, salle, adresse, places_max, places_occupees, statut, ca_prevu, materiel_prepare, supports_envoyes, convocations_envoyees, modeles_necessaires, modeles_inscrits)
SELECT
  f.id,
  CURRENT_DATE + interval '35 days',
  CURRENT_DATE + interval '35 days' + interval '1 day',
  '09:00', '17:00',
  'Salle A', '75 Bd Richard Lenoir, 75011 Paris',
  f.places_max, 0, 'PLANIFIEE',
  f.prix_ht * 1.2 * f.places_max, false, false, false, 2, 0
FROM formations f WHERE f.slug = 'full-lips'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (formation_id, date_debut, date_fin, horaire_debut, horaire_fin, salle, adresse, places_max, places_occupees, statut, ca_prevu, materiel_prepare, supports_envoyes, convocations_envoyees, modeles_necessaires, modeles_inscrits)
SELECT
  f.id,
  CURRENT_DATE + interval '45 days',
  CURRENT_DATE + interval '47 days',
  '09:00', '17:00',
  'Salle A', '75 Bd Richard Lenoir, 75011 Paris',
  f.places_max, 0, 'PLANIFIEE',
  f.prix_ht * 1.2 * f.places_max, false, false, false, 1, 0
FROM formations f WHERE f.slug = 'tricopigmentation'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (formation_id, date_debut, date_fin, horaire_debut, horaire_fin, salle, adresse, places_max, places_occupees, statut, ca_prevu, materiel_prepare, supports_envoyes, convocations_envoyees, modeles_necessaires, modeles_inscrits)
SELECT
  f.id,
  CURRENT_DATE + interval '50 days',
  CURRENT_DATE + interval '52 days',
  '09:00', '17:00',
  'Salle A', '75 Bd Richard Lenoir, 75011 Paris',
  f.places_max, 0, 'CONFIRMEE',
  f.prix_ht * 1.2 * f.places_max, true, true, false, 0, 0
FROM formations f WHERE f.slug = 'hygiene-salubrite'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (formation_id, date_debut, date_fin, horaire_debut, horaire_fin, salle, adresse, places_max, places_occupees, statut, ca_prevu, materiel_prepare, supports_envoyes, convocations_envoyees, modeles_necessaires, modeles_inscrits)
SELECT
  f.id,
  CURRENT_DATE + interval '60 days',
  CURRENT_DATE + interval '60 days',
  '09:00', '17:00',
  'Salle B', '75 Bd Richard Lenoir, 75011 Paris',
  f.places_max, 0, 'PLANIFIEE',
  f.prix_ht * 1.2 * f.places_max, false, false, false, 0, 0
FROM formations f WHERE f.slug = 'peeling-dermaplaning'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (formation_id, date_debut, date_fin, horaire_debut, horaire_fin, salle, adresse, places_max, places_occupees, statut, ca_prevu, materiel_prepare, supports_envoyes, convocations_envoyees, modeles_necessaires, modeles_inscrits)
SELECT
  f.id,
  CURRENT_DATE + interval '75 days',
  CURRENT_DATE + interval '79 days',
  '09:00', '17:00',
  'Salle A', '75 Bd Richard Lenoir, 75011 Paris',
  f.places_max, 0, 'PLANIFIEE',
  f.prix_ht * 1.2 * f.places_max, false, false, false, 3, 0
FROM formations f WHERE f.slug = 'maquillage-permanent'
ON CONFLICT DO NOTHING;
