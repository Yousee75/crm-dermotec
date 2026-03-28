-- Migration 051 : Tables Qualiopi compliance complètes
-- Compétences (ltree), qualifications formatrices, veille, incidents, accessibilité
-- Requis pour maintien certification Qualiopi (7 critères, 32 indicateurs)

-- ============================================================
-- 1. RÉFÉRENTIEL COMPÉTENCES (ltree pour hiérarchie)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE IF NOT EXISTS competences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,              -- ex: 'DERM.MICRO.TRACE'
  path ltree NOT NULL,                     -- ex: 'dermopigmentation.microblading.tracage'
  label TEXT NOT NULL,                     -- ex: 'Traçage sourcils naturels'
  description TEXT,
  categorie TEXT CHECK (categorie IN (
    'technique', 'theorique', 'pratique', 'securite', 'hygiene', 'relation_client'
  )),
  niveau_attendu INTEGER DEFAULT 1 CHECK (niveau_attendu BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competences_path ON competences USING GIST (path);
CREATE INDEX idx_competences_categorie ON competences(categorie);

-- Liens formations ↔ compétences
CREATE TABLE IF NOT EXISTS formation_competences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  competence_id UUID NOT NULL REFERENCES competences(id) ON DELETE CASCADE,
  niveau_vise INTEGER DEFAULT 3 CHECK (niveau_vise BETWEEN 1 AND 5),
  obligatoire BOOLEAN DEFAULT true,
  UNIQUE(formation_id, competence_id)
);

-- Compétences acquises par stagiaire
CREATE TABLE IF NOT EXISTS stagiaire_competences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscription_id UUID NOT NULL REFERENCES inscriptions(id) ON DELETE CASCADE,
  competence_id UUID NOT NULL REFERENCES competences(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  -- Évaluation
  niveau_avant INTEGER CHECK (niveau_avant BETWEEN 0 AND 5),
  niveau_pendant INTEGER CHECK (niveau_pendant BETWEEN 0 AND 5),
  niveau_apres INTEGER CHECK (niveau_apres BETWEEN 0 AND 5),
  -- Dates évaluation
  eval_avant_date TIMESTAMPTZ,
  eval_pendant_date TIMESTAMPTZ,
  eval_apres_date TIMESTAMPTZ,
  -- Évaluateur
  evaluateur_id UUID REFERENCES equipe(id),
  commentaire TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inscription_id, competence_id)
);

CREATE INDEX idx_stagiaire_comp_inscription ON stagiaire_competences(inscription_id);
CREATE INDEX idx_stagiaire_comp_lead ON stagiaire_competences(lead_id);

-- ============================================================
-- 2. QUALIFICATIONS FORMATRICES (Critère 5)
-- ============================================================
CREATE TABLE IF NOT EXISTS formateur_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID NOT NULL REFERENCES equipe(id) ON DELETE CASCADE,
  -- Type qualification
  type TEXT NOT NULL CHECK (type IN (
    'diplome', 'certification', 'experience', 'formation_continue', 'habilitation', 'autre'
  )),
  titre TEXT NOT NULL,
  organisme TEXT,                           -- Organisme délivrant
  date_obtention DATE,
  date_expiration DATE,                     -- NULL si permanent
  numero_reference TEXT,
  -- Document justificatif
  document_url TEXT,
  -- Statut
  statut TEXT DEFAULT 'valide' CHECK (statut IN ('valide', 'expire', 'en_cours', 'revoque')),
  -- Qualiopi
  indicateur_qualiopi TEXT,                -- ex: 'I21', 'I22'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_formateur_qual_equipe ON formateur_qualifications(equipe_id);
CREATE INDEX idx_formateur_qual_expiration ON formateur_qualifications(date_expiration)
  WHERE date_expiration IS NOT NULL AND statut = 'valide';

-- ============================================================
-- 3. VEILLE PÉDAGOGIQUE (Critère 6 — Indicateurs 23-25)
-- ============================================================
CREATE TABLE IF NOT EXISTS veille_pedagogique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'reglementaire', 'technologique', 'pedagogique', 'metier', 'concurrentielle'
  )),
  titre TEXT NOT NULL,
  description TEXT,
  source TEXT,                              -- URL ou nom source
  date_veille DATE DEFAULT CURRENT_DATE,
  -- Impact
  impact TEXT CHECK (impact IN ('faible', 'moyen', 'fort', 'critique')),
  actions_prevues TEXT,
  actions_realisees TEXT,
  date_action DATE,
  -- Responsable
  responsable_id UUID REFERENCES equipe(id),
  statut TEXT DEFAULT 'identifie' CHECK (statut IN (
    'identifie', 'analyse', 'action_planifiee', 'action_realisee', 'archive'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_veille_type ON veille_pedagogique(type);
CREATE INDEX idx_veille_date ON veille_pedagogique(date_veille DESC);

-- ============================================================
-- 4. INCIDENTS FORMATION (traçabilité)
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents_formation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  formation_id UUID REFERENCES formations(id),
  -- Incident
  type TEXT NOT NULL CHECK (type IN (
    'materiel', 'logistique', 'pedagogique', 'comportement',
    'securite', 'sante', 'absence_formateur', 'autre'
  )),
  gravite TEXT DEFAULT 'mineure' CHECK (gravite IN ('mineure', 'majeure', 'critique')),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  date_incident TIMESTAMPTZ DEFAULT NOW(),
  -- Résolution
  actions_immediates TEXT,
  actions_correctives TEXT,
  date_resolution TIMESTAMPTZ,
  statut TEXT DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'en_cours', 'resolu', 'clos')),
  -- Responsable
  declare_par UUID REFERENCES equipe(id),
  responsable_resolution UUID REFERENCES equipe(id),
  -- Qualiopi
  indicateur_qualiopi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_session ON incidents_formation(session_id);
CREATE INDEX idx_incidents_statut ON incidents_formation(statut) WHERE statut != 'clos';

-- ============================================================
-- 5. ACCESSIBILITÉ HANDICAP (Critère 3 — Indicateur 26)
-- ============================================================
CREATE TABLE IF NOT EXISTS accessibilite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stagiaire concerné
  inscription_id UUID REFERENCES inscriptions(id),
  lead_id UUID REFERENCES leads(id),
  -- Type handicap / besoin
  type_besoin TEXT NOT NULL CHECK (type_besoin IN (
    'moteur', 'visuel', 'auditif', 'cognitif', 'psychique', 'autre'
  )),
  description_besoin TEXT NOT NULL,
  -- Aménagements
  amenagements_demandes TEXT,
  amenagements_mis_en_place TEXT,
  date_mise_en_place DATE,
  -- Référent
  referent_handicap_id UUID REFERENCES equipe(id),
  -- Suivi
  statut TEXT DEFAULT 'demande' CHECK (statut IN (
    'demande', 'evaluation', 'amenagement_en_cours', 'operationnel', 'clos'
  )),
  satisfaction_stagiaire INTEGER CHECK (satisfaction_stagiaire BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accessibilite_inscription ON accessibilite(inscription_id);

-- ============================================================
-- 6. ÉVALUATIONS GRANULAIRES (Critère 3 — Indicateurs 11-12)
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscription_id UUID NOT NULL REFERENCES inscriptions(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  lead_id UUID REFERENCES leads(id),
  -- Type évaluation
  type TEXT NOT NULL CHECK (type IN (
    'positionnement',      -- Avant formation (Qualiopi I8)
    'formative',           -- Pendant formation
    'sommative',           -- Fin de formation (Qualiopi I11)
    'satisfaction_chaud',  -- J+1 (Qualiopi I30)
    'satisfaction_froid',  -- J+30 (Qualiopi I30)
    'transfert',           -- J+90 (Qualiopi I2)
    'impact'               -- J+180 (bonus)
  )),
  -- Scores
  score_global NUMERIC(5,2),
  score_details JSONB DEFAULT '{}',        -- {competence_id: score}
  -- Contenu
  commentaire_stagiaire TEXT,
  commentaire_formateur TEXT,
  points_forts TEXT,
  axes_amelioration TEXT,
  -- Évaluateur
  evaluateur_id UUID REFERENCES equipe(id),
  auto_evaluation BOOLEAN DEFAULT false,
  -- Dates
  date_evaluation TIMESTAMPTZ DEFAULT NOW(),
  duree_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluations_inscription ON evaluations(inscription_id);
CREATE INDEX idx_evaluations_type ON evaluations(type);
CREATE INDEX idx_evaluations_session ON evaluations(session_id);

-- ============================================================
-- 7. ACTIONS D'AMÉLIORATION (Critère 7 — Indicateur 32)
-- ============================================================
CREATE TABLE IF NOT EXISTS ameliorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Source
  source TEXT NOT NULL CHECK (source IN (
    'reclamation', 'evaluation', 'veille', 'audit', 'incident', 'suggestion', 'auto_evaluation'
  )),
  source_id UUID,                           -- ID de la réclamation/évaluation/etc.
  -- Description
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  critere_qualiopi INTEGER,                -- 1-7
  indicateur_qualiopi TEXT,                -- ex: 'I30'
  -- Plan d'action
  actions_prevues TEXT,
  actions_realisees TEXT,
  date_echeance DATE,
  date_realisation DATE,
  -- Mesure d'efficacité
  indicateur_mesure TEXT,
  valeur_avant NUMERIC(10,2),
  valeur_apres NUMERIC(10,2),
  efficace BOOLEAN,
  -- Responsable
  responsable_id UUID REFERENCES equipe(id),
  statut TEXT DEFAULT 'identifie' CHECK (statut IN (
    'identifie', 'planifie', 'en_cours', 'realise', 'mesure', 'clos'
  )),
  priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ameliorations_statut ON ameliorations(statut) WHERE statut NOT IN ('clos');
CREATE INDEX idx_ameliorations_critere ON ameliorations(critere_qualiopi);

-- ============================================================
-- 8. FORMATION VERSIONS (traçabilité programme)
-- ============================================================
CREATE TABLE IF NOT EXISTS formation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  -- Snapshot du contenu
  contenu JSONB NOT NULL,                   -- {objectifs, prerequis, programme, duree, etc.}
  motif_modification TEXT,
  -- Audit
  modifie_par UUID REFERENCES equipe(id),
  date_version TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT true,
  UNIQUE(formation_id, version)
);

CREATE INDEX idx_formation_versions_formation ON formation_versions(formation_id);

-- ============================================================
-- 9. RLS POLICIES
-- ============================================================
ALTER TABLE competences ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_competences ENABLE ROW LEVEL SECURITY;
ALTER TABLE stagiaire_competences ENABLE ROW LEVEL SECURITY;
ALTER TABLE formateur_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE veille_pedagogique ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents_formation ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibilite ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ameliorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_versions ENABLE ROW LEVEL SECURITY;

-- Accès authentifié complet (admin/manager/formatrice)
CREATE POLICY "competences_auth" ON competences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "formation_comp_auth" ON formation_competences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "stagiaire_comp_auth" ON stagiaire_competences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "formateur_qual_auth" ON formateur_qualifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "veille_auth" ON veille_pedagogique FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "incidents_auth" ON incidents_formation FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "accessibilite_auth" ON accessibilite FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "evaluations_auth" ON evaluations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ameliorations_auth" ON ameliorations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "formation_versions_auth" ON formation_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 10. TRIGGERS updated_at
-- ============================================================
CREATE TRIGGER update_competences_updated_at BEFORE UPDATE ON competences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_stagiaire_comp_updated_at BEFORE UPDATE ON stagiaire_competences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_formateur_qual_updated_at BEFORE UPDATE ON formateur_qualifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_veille_updated_at BEFORE UPDATE ON veille_pedagogique FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents_formation FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_accessibilite_updated_at BEFORE UPDATE ON accessibilite FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ameliorations_updated_at BEFORE UPDATE ON ameliorations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
