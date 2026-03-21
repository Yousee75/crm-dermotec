-- ============================================================
-- Migration 014: Module Questionnaires & Évaluations
-- Qualiopi indicateurs 4 (positionnement), 8 (acquis entrée),
-- 11 (évaluation objectifs), 30 (recueil appréciations)
-- ============================================================

-- ============================================================
-- 1. Templates de questionnaires
-- ============================================================
CREATE TABLE IF NOT EXISTS questionnaire_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'positionnement',       -- Pré-formation (indicateur 4, 8)
    'evaluation_acquis',    -- Pendant/fin formation (indicateur 11)
    'satisfaction',         -- Post-formation (indicateur 30)
    'satisfaction_froid',   -- J+30/J+90 post-formation
    'insertion'             -- Suivi insertion pro (indicateur 2)
  )),
  formation_id UUID REFERENCES formations(id),  -- NULL = tous
  questions JSONB NOT NULL DEFAULT '[]',
  -- questions: [{id, texte, type: 'note_10'|'oui_non'|'choix_multiple'|'texte_libre'|'echelle_5', options?: string[], obligatoire: boolean, ordre: number}]
  envoi_auto BOOLEAN DEFAULT true,
  delai_envoi_jours INTEGER DEFAULT 0,          -- 0=immédiat, -7=7j avant, 1=J+1 après
  declencheur TEXT CHECK (declencheur IN (
    'inscription_confirmee',  -- Envoyé à l'inscription
    'session_j_moins_7',      -- 7 jours avant la session
    'session_terminee',       -- Fin de session
    'j_plus_1',               -- J+1 post-formation
    'j_plus_30',              -- J+30
    'j_plus_90',              -- J+90
    'manuel'                  -- Envoi manuel uniquement
  )),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES equipe(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questionnaire_tpl_type ON questionnaire_templates(type);
CREATE INDEX idx_questionnaire_tpl_formation ON questionnaire_templates(formation_id);

ALTER TABLE questionnaire_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questionnaire_tpl_read" ON questionnaire_templates
  FOR SELECT USING (true);
CREATE POLICY "questionnaire_tpl_manage" ON questionnaire_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = (SELECT auth.uid()) AND role IN ('admin', 'manager'))
  );

CREATE TRIGGER tr_questionnaire_tpl_updated
  BEFORE UPDATE ON questionnaire_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. Envois de questionnaires (instances)
-- ============================================================
CREATE TABLE IF NOT EXISTS questionnaire_envois (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES questionnaire_templates(id),
  lead_id UUID REFERENCES leads(id),
  inscription_id UUID REFERENCES inscriptions(id),
  session_id UUID REFERENCES sessions(id),

  -- Token unique pour accès sans auth (lien dans l'email)
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  statut TEXT DEFAULT 'en_attente' CHECK (statut IN (
    'en_attente',     -- Pas encore envoyé
    'envoye',         -- Email envoyé
    'ouvert',         -- Lien cliqué
    'en_cours',       -- Partiellement rempli
    'complete',       -- Terminé
    'expire'          -- Délai dépassé
  )),

  envoye_at TIMESTAMPTZ,
  ouvert_at TIMESTAMPTZ,
  complete_at TIMESTAMPTZ,
  expire_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  -- Réponses
  reponses JSONB DEFAULT '{}',
  -- reponses: {question_id: {valeur: string|number, repondu_at: timestamp}}

  score_global NUMERIC(5,2),              -- Score calculé (si applicable)
  commentaire_libre TEXT,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  duree_secondes INTEGER,                 -- Temps pour remplir

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_envois_template ON questionnaire_envois(template_id);
CREATE INDEX idx_envois_lead ON questionnaire_envois(lead_id);
CREATE INDEX idx_envois_inscription ON questionnaire_envois(inscription_id);
CREATE INDEX idx_envois_session ON questionnaire_envois(session_id);
CREATE INDEX idx_envois_token ON questionnaire_envois(token);
CREATE INDEX idx_envois_statut ON questionnaire_envois(statut);
CREATE INDEX idx_envois_created ON questionnaire_envois(created_at DESC);

ALTER TABLE questionnaire_envois ENABLE ROW LEVEL SECURITY;

-- Les stagiaires accèdent via token (pas d'auth)
CREATE POLICY "envois_read_admin" ON questionnaire_envois
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = (SELECT auth.uid()) AND role IN ('admin', 'manager', 'formatrice'))
  );
CREATE POLICY "envois_insert" ON questionnaire_envois
  FOR INSERT WITH CHECK (true);
CREATE POLICY "envois_update" ON questionnaire_envois
  FOR UPDATE USING (true);  -- Le stagiaire peut remplir via API publique (token)

-- ============================================================
-- 3. Vue analytics questionnaires
-- ============================================================
CREATE OR REPLACE VIEW v_questionnaire_stats AS
SELECT
  qt.id AS template_id,
  qt.titre,
  qt.type,
  COUNT(qe.id) AS total_envoyes,
  COUNT(qe.id) FILTER (WHERE qe.statut = 'complete') AS total_completes,
  COUNT(qe.id) FILTER (WHERE qe.statut = 'envoye') AS en_attente_reponse,
  ROUND(
    COUNT(qe.id) FILTER (WHERE qe.statut = 'complete')::NUMERIC * 100 /
    NULLIF(COUNT(qe.id), 0), 1
  ) AS taux_reponse,
  AVG(qe.score_global) FILTER (WHERE qe.statut = 'complete') AS score_moyen,
  AVG(qe.duree_secondes) FILTER (WHERE qe.statut = 'complete') AS duree_moyenne_secondes
FROM questionnaire_templates qt
LEFT JOIN questionnaire_envois qe ON qe.template_id = qt.id
WHERE qt.is_active = true
GROUP BY qt.id, qt.titre, qt.type;

-- ============================================================
-- 4. Seeds : templates par défaut Qualiopi
-- ============================================================
INSERT INTO questionnaire_templates (titre, description, type, declencheur, delai_envoi_jours, questions) VALUES

-- Questionnaire de positionnement (pré-formation)
('Questionnaire de positionnement',
 'Évaluation des acquis et attentes avant la formation — obligatoire Qualiopi indicateurs 4 et 8',
 'positionnement', 'inscription_confirmee', 0,
 '[
   {"id":"pos_1","texte":"Quel est votre niveau d''expérience en esthétique ?","type":"choix_multiple","options":["Aucune expérience","Débutante (< 1 an)","Intermédiaire (1-3 ans)","Confirmée (3-5 ans)","Experte (5+ ans)"],"obligatoire":true,"ordre":1},
   {"id":"pos_2","texte":"Quelles techniques maîtrisez-vous déjà ?","type":"texte_libre","obligatoire":false,"ordre":2},
   {"id":"pos_3","texte":"Quels sont vos objectifs principaux pour cette formation ?","type":"texte_libre","obligatoire":true,"ordre":3},
   {"id":"pos_4","texte":"Avez-vous des besoins spécifiques (accessibilité, aménagements) ?","type":"texte_libre","obligatoire":false,"ordre":4},
   {"id":"pos_5","texte":"Comment avez-vous entendu parler de Dermotec ?","type":"choix_multiple","options":["Google","Instagram","Bouche à oreille","Ancien stagiaire","Salon professionnel","Autre"],"obligatoire":false,"ordre":5}
 ]'::jsonb),

-- Évaluation des acquis (fin de formation)
('Évaluation des acquis',
 'Évaluation des compétences acquises en fin de formation — obligatoire Qualiopi indicateur 11',
 'evaluation_acquis', 'session_terminee', 0,
 '[
   {"id":"eval_1","texte":"Maîtrise des gestes techniques enseignés","type":"echelle_5","obligatoire":true,"ordre":1},
   {"id":"eval_2","texte":"Compréhension des protocoles de sécurité et d''hygiène","type":"echelle_5","obligatoire":true,"ordre":2},
   {"id":"eval_3","texte":"Capacité à travailler en autonomie sur les techniques apprises","type":"echelle_5","obligatoire":true,"ordre":3},
   {"id":"eval_4","texte":"Connaissance des contre-indications et précautions","type":"echelle_5","obligatoire":true,"ordre":4},
   {"id":"eval_5","texte":"Points forts observés","type":"texte_libre","obligatoire":false,"ordre":5},
   {"id":"eval_6","texte":"Axes d''amélioration","type":"texte_libre","obligatoire":false,"ordre":6}
 ]'::jsonb),

-- Questionnaire de satisfaction (J+1)
('Questionnaire de satisfaction',
 'Recueil des appréciations post-formation — obligatoire Qualiopi indicateur 30',
 'satisfaction', 'j_plus_1', 1,
 '[
   {"id":"sat_1","texte":"Note globale de la formation","type":"note_10","obligatoire":true,"ordre":1},
   {"id":"sat_2","texte":"La formation a répondu à vos attentes","type":"echelle_5","obligatoire":true,"ordre":2},
   {"id":"sat_3","texte":"Qualité du contenu pédagogique","type":"echelle_5","obligatoire":true,"ordre":3},
   {"id":"sat_4","texte":"Qualité de la formatrice","type":"echelle_5","obligatoire":true,"ordre":4},
   {"id":"sat_5","texte":"Qualité des locaux et du matériel","type":"echelle_5","obligatoire":true,"ordre":5},
   {"id":"sat_6","texte":"Organisation générale (accueil, horaires, repas)","type":"echelle_5","obligatoire":true,"ordre":6},
   {"id":"sat_7","texte":"Recommanderiez-vous Dermotec à un(e) collègue ?","type":"note_10","obligatoire":true,"ordre":7},
   {"id":"sat_8","texte":"Qu''avez-vous le plus apprécié ?","type":"texte_libre","obligatoire":false,"ordre":8},
   {"id":"sat_9","texte":"Que pourrions-nous améliorer ?","type":"texte_libre","obligatoire":false,"ordre":9},
   {"id":"sat_10","texte":"Souhaitez-vous suivre une autre formation Dermotec ?","type":"oui_non","obligatoire":false,"ordre":10}
 ]'::jsonb),

-- Suivi insertion (J+90)
('Suivi insertion professionnelle',
 'Suivi de l''insertion professionnelle 3 mois après la formation — Qualiopi indicateur 2',
 'insertion', 'j_plus_90', 90,
 '[
   {"id":"ins_1","texte":"Exercez-vous une activité en lien avec la formation suivie ?","type":"oui_non","obligatoire":true,"ordre":1},
   {"id":"ins_2","texte":"Avez-vous lancé votre activité ou intégré un institut ?","type":"choix_multiple","options":["Oui, activité indépendante","Oui, salarié(e) en institut","En cours de création","Pas encore","Non, autre projet"],"obligatoire":true,"ordre":2},
   {"id":"ins_3","texte":"Les compétences acquises vous sont-elles utiles au quotidien ?","type":"echelle_5","obligatoire":true,"ordre":3},
   {"id":"ins_4","texte":"Avez-vous besoin d''un perfectionnement ou d''une formation complémentaire ?","type":"oui_non","obligatoire":false,"ordre":4},
   {"id":"ins_5","texte":"Commentaire libre","type":"texte_libre","obligatoire":false,"ordre":5}
 ]'::jsonb)

ON CONFLICT DO NOTHING;
