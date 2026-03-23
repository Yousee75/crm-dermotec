-- ============================================================
-- MIGRATION 039 — Corriger v_enrichment_summary
-- Ajoute les 7 colonnes manquantes attendues par auto-enrichment.ts
-- ============================================================

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
  -- Colonnes existantes
  (SELECT COUNT(*) FROM enrichment_logs el WHERE el.lead_id = l.id) as total_enrichments,
  (SELECT COUNT(*) FROM enrichment_logs el WHERE el.lead_id = l.id AND el.status = 'success') as successful_enrichments,
  (SELECT COUNT(*) FROM enrichment_logs el WHERE el.lead_id = l.id AND el.status = 'failed') as failed_enrichments,
  (SELECT SUM(el.duration_ms) FROM enrichment_logs el WHERE el.lead_id = l.id) as total_duration_ms,
  -- 7 NOUVELLES COLONNES (attendues par auto-enrichment.ts)
  COALESCE((SELECT SUM(el.credits_used) FROM enrichment_logs el WHERE el.lead_id = l.id), 0) as total_credits_used,
  COALESCE(
    (SELECT ARRAY_AGG(DISTINCT el.provider) FROM enrichment_logs el WHERE el.lead_id = l.id AND el.status = 'success'),
    ARRAY[]::text[]
  ) as enriched_providers,
  (SELECT MAX(el.created_at) FROM enrichment_logs el WHERE el.lead_id = l.id) as last_enrichment_at,
  EXISTS(SELECT 1 FROM enrichment_logs el WHERE el.lead_id = l.id AND el.provider = 'pappers' AND el.status = 'success') as has_pappers_data,
  EXISTS(SELECT 1 FROM enrichment_logs el WHERE el.lead_id = l.id AND el.provider = 'google_places' AND el.status = 'success') as has_google_data,
  EXISTS(SELECT 1 FROM enrichment_logs el WHERE el.lead_id = l.id AND el.provider IN ('instagram', 'facebook', 'social_discovery') AND el.status = 'success') as has_social_data,
  EXISTS(SELECT 1 FROM enrichment_logs el WHERE el.lead_id = l.id AND el.provider = 'instagram' AND el.status = 'success') as has_instagram_data
FROM leads l
LEFT JOIN LATERAL (
  SELECT * FROM prospect_reports pr2
  WHERE pr2.lead_id = l.id
  ORDER BY pr2.version DESC
  LIMIT 1
) pr ON true;

-- Ajouter colonnes manquantes à enrichment_logs si elles n'existent pas
DO $$ BEGIN
  ALTER TABLE enrichment_logs ADD COLUMN IF NOT EXISTS credits_used NUMERIC DEFAULT 0;
  ALTER TABLE enrichment_logs ADD COLUMN IF NOT EXISTS provider TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMENT ON VIEW v_enrichment_summary IS 'Vue enrichie avec statut enrichissement par lead — 7 colonnes ajoutées migration 039';
