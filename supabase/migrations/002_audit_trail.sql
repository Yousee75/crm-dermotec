-- ============================================================
-- CRM DERMOTEC — Audit Trail & Gouvernance
-- Traçabilité complète : qui modifie quoi, quand, pourquoi
-- ============================================================

-- 1. Table field_history : audit champ par champ
CREATE TABLE IF NOT EXISTS field_history (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_name TEXT,
  change_source TEXT DEFAULT 'manual' CHECK (change_source IN ('manual', 'api', 'webhook', 'system', 'import', 'automation')),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fh_table_record ON field_history(table_name, record_id);
CREATE INDEX idx_fh_created ON field_history(created_at DESC);
CREATE INDEX idx_fh_user ON field_history(changed_by);

-- 2. Fonction générique de tracking des changements
CREATE OR REPLACE FUNCTION track_field_changes()
RETURNS TRIGGER AS $$
DECLARE
  col TEXT;
  old_val TEXT;
  new_val TEXT;
  user_id UUID;
BEGIN
  -- Récupérer l'utilisateur courant (via Supabase auth)
  user_id := auth.uid();

  -- Parcourir toutes les colonnes
  FOR col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND column_name NOT IN ('updated_at', 'created_at', 'metadata', 'data_sources')
  LOOP
    EXECUTE format('SELECT ($1).%I::TEXT', col) INTO old_val USING OLD;
    EXECUTE format('SELECT ($1).%I::TEXT', col) INTO new_val USING NEW;

    -- Ne logger que si la valeur a changé
    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO field_history (table_name, record_id, field_name, old_value, new_value, changed_by, change_source)
      VALUES (TG_TABLE_NAME, NEW.id, col, old_val, new_val, user_id, 'manual');
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Activer le tracking sur les tables principales
CREATE TRIGGER audit_leads AFTER UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION track_field_changes();
CREATE TRIGGER audit_inscriptions AFTER UPDATE ON inscriptions FOR EACH ROW EXECUTE FUNCTION track_field_changes();
CREATE TRIGGER audit_financements AFTER UPDATE ON financements FOR EACH ROW EXECUTE FUNCTION track_field_changes();
CREATE TRIGGER audit_sessions AFTER UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION track_field_changes();
CREATE TRIGGER audit_factures AFTER UPDATE ON factures FOR EACH ROW EXECUTE FUNCTION track_field_changes();
CREATE TRIGGER audit_commandes AFTER UPDATE ON commandes FOR EACH ROW EXECUTE FUNCTION track_field_changes();

-- 4. Table login_logs : connexions
CREATE TABLE IF NOT EXISTS login_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  action TEXT CHECK (action IN ('login', 'logout', 'failed_login', 'password_reset', 'magic_link')),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_logs_user ON login_logs(user_id);
CREATE INDEX idx_login_logs_created ON login_logs(created_at DESC);

-- 5. Table smart_actions : suggestions IA
CREATE TABLE IF NOT EXISTS smart_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN (
    'APPELER_LEAD', 'RELANCER_FINANCEMENT', 'UPSELL_FORMATION',
    'SESSION_INCOMPLETE', 'LEAD_STAGNANT', 'RAPPEL_OVERDUE',
    'AVIS_GOOGLE', 'SUIVI_ALUMNI', 'DOUBLON_DETECTE',
    'ANOMALIE', 'FELICITATION', 'OBJECTIF_ATTEINT'
  )),
  priorite TEXT DEFAULT 'NORMALE' CHECK (priorite IN ('CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE')),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  action_cta TEXT, -- "Appeler", "Envoyer email", "Voir le lead"
  action_url TEXT, -- lien vers la page concernée
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES equipe(id), -- à qui s'adresse l'action
  statut TEXT DEFAULT 'ACTIVE' CHECK (statut IN ('ACTIVE', 'EXECUTEE', 'IGNOREE', 'EXPIREE')),
  expires_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_smart_actions_user ON smart_actions(user_id);
CREATE INDEX idx_smart_actions_statut ON smart_actions(statut);
CREATE INDEX idx_smart_actions_type ON smart_actions(type);
CREATE INDEX idx_smart_actions_created ON smart_actions(created_at DESC);

-- 6. Table anomalies : détection problèmes
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN (
    'DOUBLON_EMAIL', 'DOUBLON_TELEPHONE', 'SUPPRESSION_MASSE',
    'MODIFICATION_HORS_HORAIRES', 'IP_INHABITUELLE',
    'MONTANT_ANORMAL', 'STATUT_SUSPECT', 'DONNEES_INCOHERENTES'
  )),
  severite TEXT DEFAULT 'WARNING' CHECK (severite IN ('CRITICAL', 'WARNING', 'INFO')),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  user_id UUID REFERENCES auth.users(id),
  statut TEXT DEFAULT 'OUVERTE' CHECK (statut IN ('OUVERTE', 'INVESTIGUEE', 'RESOLUE', 'FAUX_POSITIF')),
  resolution TEXT,
  resolved_by UUID REFERENCES equipe(id),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomalies_statut ON anomalies(statut);
CREATE INDEX idx_anomalies_type ON anomalies(type);

-- 7. RLS sur nouvelles tables
ALTER TABLE field_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_full_field_history" ON field_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_login_logs" ON login_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_smart_actions" ON smart_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_anomalies" ON anomalies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Full Text Search sur leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('french',
      coalesce(prenom, '') || ' ' ||
      coalesce(nom, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(telephone, '') || ' ' ||
      coalesce(entreprise_nom, '') || ' ' ||
      coalesce(notes, '') || ' ' ||
      coalesce(objectif_pro, '')
    )
  ) STORED;

CREATE INDEX idx_leads_fts ON leads USING gin(fts);

-- 9. Vue statistiques rapides
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM leads) AS total_leads,
  (SELECT COUNT(*) FROM leads WHERE statut = 'NOUVEAU') AS nouveaux,
  (SELECT COUNT(*) FROM leads WHERE statut IN ('QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT')) AS en_pipeline,
  (SELECT COUNT(*) FROM leads WHERE statut IN ('FORME', 'ALUMNI')) AS convertis,
  (SELECT COUNT(*) FROM sessions WHERE statut IN ('PLANIFIEE', 'CONFIRMEE')) AS sessions_a_venir,
  (SELECT COUNT(*) FROM rappels WHERE statut = 'EN_ATTENTE' AND date_rappel < NOW()) AS rappels_overdue,
  (SELECT COUNT(*) FROM financements WHERE statut NOT IN ('VALIDE', 'REFUSE', 'VERSE', 'CLOTURE')) AS financements_en_cours,
  (SELECT COALESCE(SUM(montant_accorde), 0) FROM financements WHERE statut IN ('VALIDE', 'VERSE')) AS montant_finance_total,
  (SELECT COUNT(*) FROM anomalies WHERE statut = 'OUVERTE') AS anomalies_ouvertes,
  (SELECT COUNT(*) FROM smart_actions WHERE statut = 'ACTIVE') AS actions_suggerees;
