-- ============================================================
-- Migration 015 : Rapports de prospection intelligente
-- Tables : prospect_reports, enrichment_logs
-- Pipeline d'enrichissement + narration IA + versioning
-- ============================================================

-- Table des rapports de prospection (avec versioning)
CREATE TABLE IF NOT EXISTS prospect_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL DEFAULT 0,
  classification TEXT NOT NULL DEFAULT 'FROID' CHECK (classification IN ('CHAUD', 'TIEDE', 'FROID')),
  enrichment_data JSONB DEFAULT '{}',
  enrichment_steps JSONB DEFAULT '[]',
  narrative JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'edited', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, version)
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_prospect_reports_lead_id ON prospect_reports(lead_id);
CREATE INDEX IF NOT EXISTS idx_prospect_reports_lead_version ON prospect_reports(lead_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_prospect_reports_classification ON prospect_reports(classification);
CREATE INDEX IF NOT EXISTS idx_prospect_reports_score ON prospect_reports(score DESC);

-- Trigger updated_at
CREATE TRIGGER tr_prospect_reports_updated
  BEFORE UPDATE ON prospect_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE prospect_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prospect_reports_select ON prospect_reports;
CREATE POLICY prospect_reports_select ON prospect_reports
  FOR SELECT USING (
    (SELECT auth_role()) IN ('admin', 'manager', 'commercial')
  );

DROP POLICY IF EXISTS prospect_reports_insert ON prospect_reports;
CREATE POLICY prospect_reports_insert ON prospect_reports
  FOR INSERT WITH CHECK (
    (SELECT auth_role()) IN ('admin', 'manager', 'commercial')
  );

DROP POLICY IF EXISTS prospect_reports_update ON prospect_reports;
CREATE POLICY prospect_reports_update ON prospect_reports
  FOR UPDATE USING (
    (SELECT auth_role()) IN ('admin', 'manager', 'commercial')
  );

-- Table de logs d'enrichissement (audit trail)
CREATE TABLE IF NOT EXISTS enrichment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'skipped', 'failed')),
  score_impact INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  result JSONB DEFAULT '{}',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_logs_lead_id ON enrichment_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_created ON enrichment_logs(created_at DESC);

ALTER TABLE enrichment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS enrichment_logs_select ON enrichment_logs;
CREATE POLICY enrichment_logs_select ON enrichment_logs
  FOR SELECT USING (
    (SELECT auth_role()) IN ('admin', 'manager')
  );

DROP POLICY IF EXISTS enrichment_logs_insert ON enrichment_logs;
CREATE POLICY enrichment_logs_insert ON enrichment_logs
  FOR INSERT WITH CHECK (true);

-- Vue résumé enrichissement par lead
CREATE OR REPLACE VIEW v_enrichment_summary AS
SELECT
  l.id as lead_id,
  l.nom,
  l.prenom,
  l.entreprise_nom,
  pr.score as last_score,
  pr.classification as last_classification,
  pr.version as last_version,
  pr.status as last_status,
  pr.created_at as last_report_at,
  (SELECT COUNT(*) FROM enrichment_logs el WHERE el.lead_id = l.id) as total_enrichments,
  (SELECT COUNT(*) FROM enrichment_logs el WHERE el.lead_id = l.id AND el.status = 'success') as successful_enrichments,
  (SELECT COUNT(*) FROM enrichment_logs el WHERE el.lead_id = l.id AND el.status = 'failed') as failed_enrichments,
  (SELECT SUM(el.duration_ms) FROM enrichment_logs el WHERE el.lead_id = l.id) as total_duration_ms
FROM leads l
LEFT JOIN LATERAL (
  SELECT * FROM prospect_reports pr2
  WHERE pr2.lead_id = l.id
  ORDER BY pr2.version DESC
  LIMIT 1
) pr ON true;
