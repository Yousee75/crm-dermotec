-- ============================================================
-- MIGRATION 049 — Enrichment v3 : colonnes supplémentaires
-- Nouvelles plateformes, intelligence 360°, Outscraper, métadonnées fraîcheur
-- ============================================================

-- Nouvelles plateformes scraping
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS fresha_rating NUMERIC(2,1);
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS fresha_reviews_count INTEGER;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS fresha_services JSONB;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS booksy_rating NUMERIC(2,1);
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS booksy_reviews_count INTEGER;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS booksy_specialites JSONB;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS groupon_offres JSONB;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS groupon_found BOOLEAN DEFAULT FALSE;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS wecasa_found BOOLEAN DEFAULT FALSE;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS wecasa_services JSONB;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS tripadvisor_rating NUMERIC(2,1);
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS tripadvisor_reviews_count INTEGER;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS tripadvisor_ranking TEXT;

-- Intelligence 360°
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS intelligence_complete JSONB;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS carte_soins JSONB;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS signaux_commerciaux JSONB;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS convention_idcc INTEGER;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS convention_droit_heures INTEGER;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS aides_zone JSONB;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS concurrents_osm_count INTEGER;

-- Outscraper (200 avis)
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS outscraper_reviews JSONB;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS outscraper_distribution JSONB;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS outscraper_trend TEXT;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS outscraper_owner_response_rate NUMERIC(5,2);
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS outscraper_keywords_positive JSONB;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS outscraper_keywords_negative JSONB;

-- Métadonnées fraîcheur
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS enrichment_version TEXT DEFAULT 'v3.0';
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS last_scraping_at TIMESTAMPTZ;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS last_outscraper_at TIMESTAMPTZ;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS last_osm_at TIMESTAMPTZ;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS sources_count INTEGER DEFAULT 0;
ALTER TABLE prospect_data ADD COLUMN IF NOT EXISTS enrichment_cost_cents INTEGER DEFAULT 0;

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_prospect_data_signaux ON prospect_data USING GIN (signaux_commerciaux);
CREATE INDEX IF NOT EXISTS idx_prospect_data_version ON prospect_data (enrichment_version);
CREATE INDEX IF NOT EXISTS idx_prospect_data_last_enrichment ON prospect_data (last_scraping_at DESC);

-- Commentaires
COMMENT ON COLUMN prospect_data.intelligence_complete IS 'Données 360° consolidées toutes sources';
COMMENT ON COLUMN prospect_data.signaux_commerciaux IS 'Alertes automatiques : concurrent, difficulté, zone saturée, formation disponible';
COMMENT ON COLUMN prospect_data.outscraper_reviews IS 'Avis complets Outscraper avec métadonnées';
COMMENT ON COLUMN prospect_data.enrichment_version IS 'Version enrichissement pour migration progressive';
COMMENT ON COLUMN prospect_data.enrichment_cost_cents IS 'Coût total enrichissement en centimes d''euros';