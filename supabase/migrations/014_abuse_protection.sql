-- ============================================================
-- CRM DERMOTEC — Migration 014 : Protection contre les abus
-- Soft delete, quotas, anonymisation RGPD, corbeille
-- ============================================================

-- 1. SOFT DELETE — Ajouter deleted_at à toutes les tables principales
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE rappels ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE notes_lead ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE qualite ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE partenaires ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE equipe ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Indexes pour filtrer les supprimés rapidement
CREATE INDEX IF NOT EXISTS idx_leads_not_deleted ON leads(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_not_deleted ON sessions(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inscriptions_not_deleted ON inscriptions(id) WHERE deleted_at IS NULL;

-- 2. RLS RESTRICTIVE : exclure automatiquement les supprimés
-- Politique restrictive = s'applique EN PLUS des autres policies
CREATE POLICY "leads_not_deleted" ON leads AS RESTRICTIVE FOR ALL USING (deleted_at IS NULL);
CREATE POLICY "sessions_not_deleted" ON sessions AS RESTRICTIVE FOR ALL USING (deleted_at IS NULL);
CREATE POLICY "inscriptions_not_deleted" ON inscriptions AS RESTRICTIVE FOR ALL USING (deleted_at IS NULL);
CREATE POLICY "notes_not_deleted" ON notes_lead AS RESTRICTIVE FOR ALL USING (deleted_at IS NULL);
CREATE POLICY "rappels_not_deleted" ON rappels AS RESTRICTIVE FOR ALL USING (deleted_at IS NULL);

-- 3. QUOTAS PAR ORGANISATION
CREATE TABLE IF NOT EXISTS org_quotas (
  org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  -- Limites actuelles (dépend du plan)
  max_leads INTEGER NOT NULL DEFAULT 50,
  max_users INTEGER NOT NULL DEFAULT 1,
  max_storage_mb INTEGER NOT NULL DEFAULT 500,
  max_api_calls_daily INTEGER NOT NULL DEFAULT 10000,
  max_exports_daily INTEGER NOT NULL DEFAULT 5,
  -- Usage actuel (reset quotidien pour certains)
  leads_count INTEGER DEFAULT 0,
  users_count INTEGER DEFAULT 0,
  storage_mb_used NUMERIC(10,2) DEFAULT 0,
  api_calls_today INTEGER DEFAULT 0,
  exports_today INTEGER DEFAULT 0,
  last_daily_reset TIMESTAMPTZ DEFAULT NOW(),
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE org_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotas_own_org" ON org_quotas FOR SELECT TO authenticated
USING (org_id = get_user_org_id());

-- 4. TABLE CORBEILLE (pour restauration self-service)
CREATE TABLE IF NOT EXISTS trash (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  record_data JSONB NOT NULL, -- Snapshot complet de la ligne
  deleted_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'), -- Auto-purge après 90 jours
  restored_at TIMESTAMPTZ
);

CREATE INDEX idx_trash_org ON trash(org_id) WHERE restored_at IS NULL;
CREATE INDEX idx_trash_expires ON trash(expires_at) WHERE restored_at IS NULL;

ALTER TABLE trash ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trash_own_org" ON trash FOR ALL TO authenticated
USING (org_id = get_user_org_id());

-- 5. TABLE DE LOG DES EXPORTS (anti-exfiltration)
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  resource_type TEXT NOT NULL, -- 'leads', 'inscriptions', 'factures'
  format TEXT NOT NULL, -- 'csv', 'json', 'pdf'
  row_count INTEGER NOT NULL DEFAULT 0,
  file_size_bytes INTEGER,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_export_org_date ON export_logs(org_id, created_at DESC);

ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "export_logs_own" ON export_logs FOR ALL TO authenticated
USING (org_id = get_user_org_id());

-- 6. TABLE ANONYMISATION RGPD
CREATE TABLE IF NOT EXISTS rgpd_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  requested_by UUID REFERENCES auth.users(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'anonymize', 'delete', 'rectify')),
  target_type TEXT NOT NULL, -- 'lead', 'user', 'all'
  target_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  reason TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rgpd_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rgpd_own_org" ON rgpd_requests FOR ALL TO authenticated
USING (org_id = get_user_org_id());

-- Immutable
CREATE RULE no_delete_rgpd AS ON DELETE TO rgpd_requests DO INSTEAD NOTHING;

-- 7. FONCTION : Soft delete avec archivage dans la corbeille
CREATE OR REPLACE FUNCTION soft_delete_with_trash(
  p_table TEXT,
  p_record_id UUID,
  p_user_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_record JSONB;
  v_org_id UUID;
BEGIN
  -- Récupérer la ligne avant suppression
  EXECUTE format('SELECT to_jsonb(t.*) FROM %I t WHERE id = $1 AND deleted_at IS NULL', p_table)
    INTO v_record USING p_record_id;

  IF v_record IS NULL THEN
    RAISE EXCEPTION 'Enregistrement non trouvé ou déjà supprimé';
  END IF;

  -- Récupérer l'org_id
  v_org_id := (v_record->>'org_id')::UUID;

  -- Archiver dans la corbeille
  INSERT INTO trash (org_id, table_name, record_id, record_data, deleted_by)
  VALUES (v_org_id, p_table, p_record_id, v_record, COALESCE(p_user_id, auth.uid()));

  -- Soft delete
  EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = $1', p_table)
    USING p_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FONCTION : Restaurer depuis la corbeille
CREATE OR REPLACE FUNCTION restore_from_trash(
  p_trash_id UUID
) RETURNS VOID AS $$
DECLARE
  v_trash RECORD;
BEGIN
  SELECT * INTO v_trash FROM trash WHERE id = p_trash_id AND restored_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Élément non trouvé dans la corbeille';
  END IF;

  -- Restaurer : remettre deleted_at à NULL
  EXECUTE format('UPDATE %I SET deleted_at = NULL WHERE id = $1', v_trash.table_name)
    USING v_trash.record_id;

  -- Marquer comme restauré
  UPDATE trash SET restored_at = NOW() WHERE id = p_trash_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FONCTION : Anonymisation RGPD d'un lead
CREATE OR REPLACE FUNCTION anonymize_lead(p_lead_id UUID) RETURNS VOID AS $$
BEGIN
  -- Anonymiser les données personnelles
  UPDATE leads SET
    prenom = 'ANONYME',
    nom = 'ANONYME',
    email = 'anonymized-' || gen_random_uuid()::TEXT || '@deleted.local',
    telephone = NULL,
    whatsapp = NULL,
    adresse = '{}',
    date_naissance = NULL,
    nationalite = NULL,
    photo_url = NULL,
    ip_address = NULL,
    user_agent = NULL,
    notes = NULL,
    message = NULL,
    metadata = jsonb_build_object('anonymized_at', NOW()::TEXT, 'reason', 'rgpd_article_17')
  WHERE id = p_lead_id;

  -- Anonymiser les notes
  UPDATE notes_lead SET
    contenu = '[CONTENU SUPPRIMÉ — RGPD Art. 17]'
  WHERE lead_id = p_lead_id;

  -- NE PAS toucher : factures (10 ans), inscriptions (Qualiopi 6 ans), financements (OPCO)

  -- Logger
  INSERT INTO activites (type, lead_id, description, metadata)
  VALUES ('SYSTEME', p_lead_id, 'Anonymisation RGPD — Article 17',
    jsonb_build_object('action', 'anonymize', 'timestamp', NOW()::TEXT));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CRON : Purger la corbeille après 90 jours (si pg_cron disponible)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'purge-trash-90d',
      '0 3 * * *', -- 3h du matin chaque jour
      $$DELETE FROM trash WHERE expires_at < NOW() AND restored_at IS NULL$$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron non disponible — purge manuelle requise';
END $$;
