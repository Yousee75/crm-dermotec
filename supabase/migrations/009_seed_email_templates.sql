-- ============================================================
-- CRM DERMOTEC — Seed Email Templates
-- Les 10 templates utilisés par les cadences automatisées
-- ============================================================

INSERT INTO email_templates (nom, slug, sujet, contenu_html, variables, categorie, is_active)
VALUES
  ('Bienvenue', 'bienvenue', 'Bienvenue chez Dermotec, {{prenom}} !', '<p>Template géré par le code (email-templates.ts)</p>', ARRAY['prenom', 'formation_nom'], 'bienvenue', true),
  ('Confirmation inscription', 'confirmation-inscription', 'Inscription confirmée — {{formation_nom}}', '<p>Template géré par le code</p>', ARRAY['prenom', 'formation_nom', 'dates', 'horaires', 'lieu', 'montant'], 'confirmation', true),
  ('Convocation J-7', 'convocation-j7', 'J-7 — Votre formation {{formation_nom}} approche !', '<p>Template géré par le code</p>', ARRAY['prenom', 'formation_nom', 'date_debut', 'date_fin', 'horaires', 'formatrice'], 'convocation', true),
  ('Rappel J-1', 'rappel-j1', 'C''est demain ! — {{formation_nom}}', '<p>Template géré par le code</p>', ARRAY['prenom', 'formation_nom', 'horaire_debut'], 'rappel', true),
  ('Satisfaction NPS', 'satisfaction-nps', '{{prenom}}, votre avis compte !', '<p>Template géré par le code</p>', ARRAY['prenom', 'formation_nom', 'portail_url'], 'satisfaction', true),
  ('Certificat', 'certificat', 'Votre certificat Dermotec — {{formation_nom}}', '<p>Template géré par le code</p>', ARRAY['prenom', 'formation_nom', 'certificat_numero', 'portail_url', 'duree_heures', 'taux_presence'], 'certificat', true),
  ('Upsell J+30', 'upsell-j30', '{{prenom}}, prête pour la suite ?', '<p>Template géré par le code</p>', ARRAY['prenom', 'formation_completee', 'formation_suggeree', 'prix_suggeree', 'url_inscription'], 'relance', true),
  ('Relance financement', 'relance-financement', 'Des nouvelles de votre dossier {{organisme}} ?', '<p>Template géré par le code</p>', ARRAY['prenom', 'organisme', 'formation_nom', 'jours_depuis'], 'financement', true),
  ('Abandon relance', 'abandon-relance', '{{prenom}}, avez-vous encore des questions ?', '<p>Template géré par le code</p>', ARRAY['prenom', 'formation_nom', 'prochaine_session', 'places_restantes'], 'relance', true),
  ('Alumni parrainage', 'alumni-parrainage', '{{prenom}}, 3 mois déjà ! Un cadeau pour vous', '<p>Template géré par le code</p>', ARRAY['prenom', 'formation_completee', 'code_parrainage', 'eshop_url'], 'autre', true)
ON CONFLICT (slug) DO NOTHING;
