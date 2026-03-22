-- ============================================================
-- CRM DERMOTEC — Migration 020: Auto Enrichment Log
-- Table pour logger les résultats d'enrichissement automatique
-- ============================================================

-- Table auto_enrichment_log
CREATE TABLE IF NOT EXISTS auto_enrichment_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN (
    'pappers', 'google_places', 'social_scraping', 'instagram_scraping',
    'facebook_scraping', 'linkedin_scraping', 'corporama', 'societe_com'
  )),
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'SKIP')),
  credits_used INTEGER DEFAULT 0,
  data_found JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_auto_enrichment_lead ON auto_enrichment_log(lead_id);
CREATE INDEX idx_auto_enrichment_provider ON auto_enrichment_log(provider);
CREATE INDEX idx_auto_enrichment_status ON auto_enrichment_log(status);
CREATE INDEX idx_auto_enrichment_created ON auto_enrichment_log(created_at DESC);

-- RLS
ALTER TABLE auto_enrichment_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_full_auto_enrichment_log" ON auto_enrichment_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vue de synthèse enrichissement par lead
CREATE OR REPLACE VIEW v_enrichment_summary AS
SELECT
  l.id AS lead_id,
  l.prenom,
  l.nom,
  l.entreprise_nom,
  l.siret,
  COUNT(ael.id) AS total_enrichments,
  COUNT(ael.id) FILTER (WHERE ael.status = 'SUCCESS') AS successful_enrichments,
  COUNT(ael.id) FILTER (WHERE ael.status = 'FAILED') AS failed_enrichments,
  SUM(ael.credits_used) AS total_credits_used,
  ARRAY_AGG(
    CASE
      WHEN ael.status = 'SUCCESS' THEN ael.provider
      ELSE NULL
    END
  ) FILTER (WHERE ael.status = 'SUCCESS') AS enriched_providers,
  MAX(ael.created_at) AS last_enrichment_at,
  -- Vérifier si les données principales sont enrichies
  BOOL_OR(ael.provider = 'pappers' AND ael.status = 'SUCCESS') AS has_pappers_data,
  BOOL_OR(ael.provider = 'google_places' AND ael.status = 'SUCCESS') AS has_google_data,
  BOOL_OR(ael.provider = 'social_scraping' AND ael.status = 'SUCCESS') AS has_social_data,
  BOOL_OR(ael.provider = 'instagram_scraping' AND ael.status = 'SUCCESS') AS has_instagram_data
FROM leads l
LEFT JOIN auto_enrichment_log ael ON ael.lead_id = l.id
WHERE l.statut NOT IN ('SPAM', 'PERDU')
GROUP BY l.id, l.prenom, l.nom, l.entreprise_nom, l.siret
ORDER BY total_credits_used DESC NULLS LAST;

-- Vue coût enrichissement mensuel
CREATE OR REPLACE VIEW v_enrichment_costs AS
SELECT
  DATE_TRUNC('month', created_at) AS mois,
  provider,
  COUNT(*) AS nb_appels,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') AS nb_succes,
  COUNT(*) FILTER (WHERE status = 'FAILED') AS nb_echecs,
  SUM(credits_used) AS total_credits,
  ROUND(AVG(execution_time_ms)) AS temps_moyen_ms,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'SUCCESS') / NULLIF(COUNT(*), 0), 1) AS taux_succes
FROM auto_enrichment_log
GROUP BY DATE_TRUNC('month', created_at), provider
ORDER BY mois DESC, total_credits DESC;

-- Trigger pour mesurer le temps d'exécution
CREATE OR REPLACE FUNCTION update_enrichment_execution_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer le temps d'exécution approximatif (si c'est un UPDATE)
  IF TG_OP = 'UPDATE' AND OLD.created_at IS NOT NULL THEN
    NEW.execution_time_ms = EXTRACT(EPOCH FROM (NEW.created_at - OLD.created_at)) * 1000;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrichment_timing
  BEFORE UPDATE ON auto_enrichment_log
  FOR EACH ROW
  EXECUTE FUNCTION update_enrichment_execution_time();