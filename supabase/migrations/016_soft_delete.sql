-- ============================================================
-- CRM DERMOTEC — Soft Delete : on ne supprime JAMAIS rien
-- Chaque "suppression" = marquage deleted_at + deleted_by
-- Les données restent en base pour audit et analyse
-- ============================================================

-- Ajouter colonnes soft delete sur toutes les tables principales
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'leads', 'formations', 'sessions', 'inscriptions', 'financements',
    'factures', 'rappels', 'documents', 'commandes', 'equipe',
    'modeles', 'notes_lead', 'partenaires', 'cadence_templates', 'cadence_instances'
  ])
  LOOP
    -- deleted_at : timestamp de la suppression (NULL = actif)
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL', t);
    -- deleted_by : qui a supprimé
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL', t);
    -- delete_reason : pourquoi (optionnel)
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS delete_reason TEXT DEFAULT NULL', t);
    -- Index pour filtrer rapidement les actifs
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_not_deleted ON %I(deleted_at) WHERE deleted_at IS NULL', t, t);

    RAISE NOTICE 'Soft delete added to %', t;
  END LOOP;
END $$;

-- Vue pour voir UNIQUEMENT les éléments actifs (non supprimés)
-- Les requêtes standard utilisent ces vues au lieu des tables directement

CREATE OR REPLACE VIEW v_leads_active AS
  SELECT * FROM leads WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW v_sessions_active AS
  SELECT * FROM sessions WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW v_inscriptions_active AS
  SELECT * FROM inscriptions WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW v_financements_active AS
  SELECT * FROM financements WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW v_commandes_active AS
  SELECT * FROM commandes WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW v_equipe_active AS
  SELECT * FROM equipe WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW v_rappels_active AS
  SELECT * FROM rappels WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW v_documents_active AS
  SELECT * FROM documents WHERE deleted_at IS NULL;

-- Table corbeille : historique de toutes les suppressions
CREATE TABLE IF NOT EXISTS corbeille (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  record_data JSONB NOT NULL,  -- snapshot complet au moment de la suppression
  deleted_by UUID REFERENCES auth.users(id),
  deleted_by_name TEXT,
  delete_reason TEXT,
  restored_at TIMESTAMPTZ DEFAULT NULL,  -- NULL = encore supprimé, date = restauré
  restored_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_corbeille_table ON corbeille(table_name);
CREATE INDEX idx_corbeille_record ON corbeille(record_id);
CREATE INDEX idx_corbeille_created ON corbeille(created_at DESC);
CREATE INDEX idx_corbeille_not_restored ON corbeille(restored_at) WHERE restored_at IS NULL;

ALTER TABLE corbeille ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_corbeille" ON corbeille FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'role') IN ('admin', 'manager'));

-- Fonction de soft delete générique
CREATE OR REPLACE FUNCTION soft_delete(
  p_table TEXT,
  p_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_record JSONB;
  v_user_name TEXT;
BEGIN
  -- Capturer le snapshot avant suppression
  EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE id = $1 AND deleted_at IS NULL', p_table)
    INTO v_record USING p_id;

  IF v_record IS NULL THEN
    RETURN FALSE;  -- Déjà supprimé ou inexistant
  END IF;

  -- Récupérer le nom de l'utilisateur
  IF p_user_id IS NOT NULL THEN
    SELECT prenom || ' ' || nom INTO v_user_name FROM equipe WHERE auth_user_id = p_user_id;
  END IF;

  -- Marquer comme supprimé
  EXECUTE format('UPDATE %I SET deleted_at = NOW(), deleted_by = $1, delete_reason = $2 WHERE id = $3', p_table)
    USING p_user_id, p_reason, p_id;

  -- Sauvegarder dans la corbeille
  INSERT INTO corbeille (table_name, record_id, record_data, deleted_by, deleted_by_name, delete_reason)
  VALUES (p_table, p_id, v_record, p_user_id, v_user_name, p_reason);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de restauration
CREATE OR REPLACE FUNCTION restore_from_trash(
  p_corbeille_id UUID,
  p_user_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_record corbeille%ROWTYPE;
BEGIN
  SELECT * INTO v_record FROM corbeille WHERE id = p_corbeille_id AND restored_at IS NULL;

  IF v_record IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Restaurer l'enregistrement
  EXECUTE format('UPDATE %I SET deleted_at = NULL, deleted_by = NULL, delete_reason = NULL WHERE id = $1', v_record.table_name)
    USING v_record.record_id;

  -- Marquer comme restauré dans la corbeille
  UPDATE corbeille SET restored_at = NOW(), restored_by = p_user_id WHERE id = p_corbeille_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
