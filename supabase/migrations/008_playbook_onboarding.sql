-- ============================================================
-- Migration 008 : Playbook Collaboratif + Onboarding Interactif
-- Intelligence collective : les commerciaux partagent ce qui marche
-- ============================================================

-- === PLAYBOOK : Entrées (objections, scripts, arguments) ===

CREATE TABLE IF NOT EXISTS playbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie TEXT NOT NULL CHECK (categorie IN (
    'objection', 'script', 'argument', 'temoignage', 'astuce'
  )),
  titre TEXT NOT NULL,
  contexte TEXT,
  lead_id UUID REFERENCES leads(id),
  formation_slug TEXT,
  statut_pro_cible TEXT,
  etape_pipeline TEXT,
  created_by UUID REFERENCES equipe(id),
  occurences INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_playbook_categorie ON playbook_entries(categorie) WHERE is_active = true;
CREATE INDEX idx_playbook_created_by ON playbook_entries(created_by);

-- Full-text search
ALTER TABLE playbook_entries ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(titre, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(contexte, '')), 'B')
  ) STORED;
CREATE INDEX idx_playbook_fts ON playbook_entries USING GIN(fts);

-- === PLAYBOOK : Réponses (propositions de l'équipe + IA) ===

CREATE TABLE IF NOT EXISTS playbook_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES playbook_entries(id) ON DELETE CASCADE NOT NULL,
  contenu TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES equipe(id),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  succes INTEGER DEFAULT 0,
  echecs INTEGER DEFAULT 0,
  taux_succes NUMERIC GENERATED ALWAYS AS (
    CASE WHEN (succes + echecs) > 0
    THEN ROUND(succes::numeric / (succes + echecs) * 100, 1)
    ELSE 0 END
  ) STORED,
  promoted_to_kb BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_playbook_resp_entry ON playbook_responses(entry_id);
CREATE INDEX idx_playbook_resp_score ON playbook_responses(upvotes DESC, taux_succes DESC NULLS LAST);

-- === PLAYBOOK : Votes ===

CREATE TABLE IF NOT EXISTS playbook_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES playbook_responses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES equipe(id) NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(response_id, user_id)
);

-- === ONBOARDING : Progression par utilisateur ===

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES equipe(id) NOT NULL,
  step_id TEXT NOT NULL,
  niveau TEXT NOT NULL CHECK (niveau IN ('basique', 'intermediaire', 'expert')),
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, step_id)
);

CREATE INDEX idx_onboarding_user ON onboarding_progress(user_id);

-- === RLS ===

ALTER TABLE playbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read playbook" ON playbook_entries
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Authenticated manage playbook" ON playbook_entries
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated read responses" ON playbook_responses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage responses" ON playbook_responses
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated manage votes" ON playbook_votes
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users manage own onboarding" ON onboarding_progress
  FOR ALL TO authenticated USING (true);

-- === Triggers updated_at ===

CREATE TRIGGER set_playbook_entries_updated_at
  BEFORE UPDATE ON playbook_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_playbook_responses_updated_at
  BEFORE UPDATE ON playbook_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- === Fonction : Sync votes → compteur ===

CREATE OR REPLACE FUNCTION sync_playbook_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE playbook_responses SET
    upvotes = (SELECT count(*) FROM playbook_votes WHERE response_id = COALESCE(NEW.response_id, OLD.response_id) AND vote = 'up'),
    downvotes = (SELECT count(*) FROM playbook_votes WHERE response_id = COALESCE(NEW.response_id, OLD.response_id) AND vote = 'down')
  WHERE id = COALESCE(NEW.response_id, OLD.response_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_votes_after_change
  AFTER INSERT OR UPDATE OR DELETE ON playbook_votes
  FOR EACH ROW EXECUTE FUNCTION sync_playbook_vote_counts();

-- === Fonction : Auto-promotion vers Knowledge Base ===
-- Quand taux_succes >= 70% ET (succes+echecs) >= 5 ET upvotes >= 3

CREATE OR REPLACE FUNCTION auto_promote_to_kb()
RETURNS TRIGGER AS $$
DECLARE
  entry_record RECORD;
BEGIN
  -- Vérifier critères de promotion
  IF NEW.taux_succes >= 70
     AND (NEW.succes + NEW.echecs) >= 5
     AND NEW.upvotes >= 3
     AND NEW.promoted_to_kb = false
  THEN
    -- Récupérer l'entrée parente
    SELECT * INTO entry_record FROM playbook_entries WHERE id = NEW.entry_id;

    -- Insérer dans knowledge_base
    INSERT INTO knowledge_base (categorie, titre, contenu, formation_slug, statut_pro_cible, etape_pipeline, tags, priorite)
    VALUES (
      entry_record.categorie,
      entry_record.titre || ' (Playbook — ' || NEW.taux_succes || '% succès)',
      'OBJECTION : "' || entry_record.titre || '"'
        || E'\n\nCONTEXTE : ' || COALESCE(entry_record.contexte, 'Général')
        || E'\n\nMEILLEURE RÉPONSE (validée par l''équipe, ' || NEW.taux_succes || '% de succès) :\n' || NEW.contenu
        || E'\n\n[Source : Playbook collaboratif, ' || NEW.upvotes || ' votes positifs, ' || (NEW.succes + NEW.echecs) || ' utilisations]',
      entry_record.formation_slug,
      entry_record.statut_pro_cible,
      entry_record.etape_pipeline,
      ARRAY['playbook', 'validee', entry_record.categorie],
      2
    );

    -- Marquer comme promue
    NEW.promoted_to_kb := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_promote_response
  BEFORE UPDATE ON playbook_responses
  FOR EACH ROW EXECUTE FUNCTION auto_promote_to_kb();
