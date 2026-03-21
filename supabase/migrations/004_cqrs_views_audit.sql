-- ============================================================
-- Migration 004: CQRS Views + Enterprise Audit Trail
-- Read-optimized views for dashboard/reporting (CQRS read side)
-- Immutable audit trail for compliance (GDPR, Qualiopi)
-- ============================================================

-- ============================================================
-- 1. CQRS Read Views (denormalized for UI performance)
-- ============================================================

-- Pipeline view: leads grouped by status with CA potential
CREATE OR REPLACE VIEW v_pipeline AS
SELECT
  l.statut,
  COUNT(*) AS total_leads,
  SUM(COALESCE(f.prix_ht, 0)) AS ca_potentiel,
  AVG(l.score_chaud) AS score_moyen,
  COUNT(CASE WHEN l.date_dernier_contact IS NULL THEN 1 END) AS non_contactes,
  COUNT(CASE WHEN l.date_dernier_contact < NOW() - INTERVAL '7 days' THEN 1 END) AS inactifs_7j
FROM leads l
LEFT JOIN formations f ON f.id = l.formation_principale_id
WHERE l.statut NOT IN ('SPAM')
GROUP BY l.statut;

-- Dashboard metrics view
CREATE OR REPLACE VIEW v_dashboard_metrics AS
SELECT
  -- Leads
  (SELECT COUNT(*) FROM leads WHERE created_at >= DATE_TRUNC('month', NOW())) AS leads_ce_mois,
  (SELECT COUNT(*) FROM leads WHERE statut = 'NOUVEAU') AS leads_nouveaux,
  (SELECT COUNT(*) FROM leads WHERE statut = 'QUALIFIE') AS leads_qualifies,
  -- Inscriptions
  (SELECT COUNT(*) FROM inscriptions WHERE statut = 'CONFIRMEE') AS inscriptions_confirmees,
  (SELECT COALESCE(SUM(montant_total), 0) FROM inscriptions WHERE paiement_statut = 'PAYE' AND created_at >= DATE_TRUNC('month', NOW())) AS ca_mois,
  -- Sessions
  (SELECT COUNT(*) FROM sessions WHERE statut IN ('PLANIFIEE', 'CONFIRMEE') AND date_debut >= CURRENT_DATE) AS sessions_a_venir,
  -- Rappels
  (SELECT COUNT(*) FROM rappels WHERE statut = 'EN_ATTENTE' AND date_rappel < CURRENT_DATE) AS rappels_en_retard,
  (SELECT COUNT(*) FROM rappels WHERE statut = 'EN_ATTENTE' AND date_rappel::date = CURRENT_DATE) AS rappels_aujourdhui,
  -- Financements
  (SELECT COUNT(*) FROM financements WHERE statut IN ('SOUMIS', 'EN_EXAMEN')) AS financements_en_cours,
  (SELECT COALESCE(SUM(montant_demande), 0) FROM financements WHERE statut IN ('SOUMIS', 'EN_EXAMEN')) AS montant_financement_en_attente,
  -- Satisfaction
  (SELECT ROUND(AVG(note_satisfaction)::numeric, 1) FROM inscriptions WHERE note_satisfaction IS NOT NULL) AS satisfaction_moyenne,
  -- Conversion
  CASE
    WHEN (SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '30 days') > 0
    THEN ROUND(
      (SELECT COUNT(*)::numeric FROM inscriptions WHERE created_at >= NOW() - INTERVAL '30 days' AND statut IN ('CONFIRMEE', 'COMPLETEE'))
      / (SELECT COUNT(*)::numeric FROM leads WHERE created_at >= NOW() - INTERVAL '30 days') * 100, 1
    )
    ELSE 0
  END AS taux_conversion_30j;

-- Top formations by revenue
CREATE OR REPLACE VIEW v_top_formations AS
SELECT
  f.id,
  f.nom,
  f.categorie,
  f.prix_ht,
  COUNT(DISTINCT i.id) AS nb_inscriptions,
  COUNT(DISTINCT s.id) AS nb_sessions,
  COALESCE(SUM(CASE WHEN i.paiement_statut = 'PAYE' THEN i.montant_total ELSE 0 END), 0) AS ca_total,
  ROUND(AVG(i.note_satisfaction)::numeric, 1) AS satisfaction_moyenne
FROM formations f
LEFT JOIN sessions s ON s.formation_id = f.id
LEFT JOIN inscriptions i ON i.session_id = s.id
WHERE f.is_active = true
GROUP BY f.id, f.nom, f.categorie, f.prix_ht
ORDER BY ca_total DESC;

-- Lead conversion funnel
CREATE OR REPLACE VIEW v_conversion_funnel AS
SELECT
  'NOUVEAU' AS etape, 1 AS ordre, COUNT(*) AS total
  FROM leads WHERE statut IN ('NOUVEAU', 'CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI')
UNION ALL
SELECT 'CONTACTE', 2, COUNT(*) FROM leads WHERE statut IN ('CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI')
UNION ALL
SELECT 'QUALIFIE', 3, COUNT(*) FROM leads WHERE statut IN ('QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI')
UNION ALL
SELECT 'INSCRIT', 4, COUNT(*) FROM leads WHERE statut IN ('INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI')
UNION ALL
SELECT 'FORME', 5, COUNT(*) FROM leads WHERE statut IN ('FORME', 'ALUMNI')
ORDER BY ordre;

-- Source performance
CREATE OR REPLACE VIEW v_source_performance AS
SELECT
  l.source,
  COUNT(*) AS total_leads,
  COUNT(CASE WHEN l.statut IN ('INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI') THEN 1 END) AS convertis,
  ROUND(
    COUNT(CASE WHEN l.statut IN ('INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI') THEN 1 END)::numeric
    / NULLIF(COUNT(*), 0) * 100, 1
  ) AS taux_conversion,
  ROUND(AVG(l.score_chaud)::numeric, 0) AS score_moyen
FROM leads l
WHERE l.statut != 'SPAM'
GROUP BY l.source
ORDER BY convertis DESC;

-- ============================================================
-- 2. Immutable Audit Trail (if field_history doesn't exist yet)
-- ============================================================

-- Ensure field_history table exists for enterprise audit
CREATE TABLE IF NOT EXISTS field_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  actor_id UUID,
  actor_role TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_field_history_table_record
  ON field_history(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_field_history_actor
  ON field_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_field_history_created
  ON field_history(created_at DESC);

-- RLS: only admins can read audit trail
ALTER TABLE field_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "field_history_read_authenticated"
  ON field_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "field_history_insert_authenticated"
  ON field_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No UPDATE or DELETE policies: audit log is append-only

-- ============================================================
-- 3. Webhook events table (idempotence for Stripe/Inngest)
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'stripe',
  payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processed, failed
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);

-- ============================================================
-- 4. Auto-track trigger for field changes (enterprise audit)
-- ============================================================

CREATE OR REPLACE FUNCTION track_field_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_json JSONB;
  new_json JSONB;
  changed_fields JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);

    -- Only log if something actually changed (exclude updated_at)
    changed_fields := '{}';
    FOR key IN SELECT jsonb_object_keys(new_json) LOOP
      IF key NOT IN ('updated_at', 'fts') AND
         (old_json->key)::text IS DISTINCT FROM (new_json->key)::text THEN
        changed_fields := changed_fields || jsonb_build_object(key, new_json->key);
      END IF;
    END LOOP;

    IF changed_fields != '{}' THEN
      INSERT INTO field_history (
        event_type, table_name, record_id,
        actor_id, old_values, new_values
      ) VALUES (
        'UPDATE',
        TG_TABLE_NAME,
        NEW.id::text,
        NULLIF(current_setting('app.current_user_id', true), '')::uuid,
        jsonb_strip_nulls(old_json - ARRAY['updated_at', 'fts']),
        changed_fields
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to key tables
DROP TRIGGER IF EXISTS trg_leads_audit ON leads;
CREATE TRIGGER trg_leads_audit
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION track_field_changes();

DROP TRIGGER IF EXISTS trg_inscriptions_audit ON inscriptions;
CREATE TRIGGER trg_inscriptions_audit
  AFTER UPDATE ON inscriptions
  FOR EACH ROW
  EXECUTE FUNCTION track_field_changes();

DROP TRIGGER IF EXISTS trg_financements_audit ON financements;
CREATE TRIGGER trg_financements_audit
  AFTER UPDATE ON financements
  FOR EACH ROW
  EXECUTE FUNCTION track_field_changes();

DROP TRIGGER IF EXISTS trg_sessions_audit ON sessions;
CREATE TRIGGER trg_sessions_audit
  AFTER UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION track_field_changes();

-- ============================================================
-- 5. Increment CA RPC (atomic, race-condition safe)
-- ============================================================

CREATE OR REPLACE FUNCTION increment_session_ca(
  p_session_id UUID,
  p_amount NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE sessions
  SET
    ca_realise = COALESCE(ca_realise, 0) + p_amount,
    places_occupees = CASE
      WHEN p_amount > 0 THEN COALESCE(places_occupees, 0) + 1
      WHEN p_amount < 0 THEN GREATEST(0, COALESCE(places_occupees, 0) - 1)
      ELSE places_occupees
    END,
    updated_at = NOW()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
