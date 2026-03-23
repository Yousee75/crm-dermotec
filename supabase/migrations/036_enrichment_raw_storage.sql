-- ============================================================
-- Migration 036 : Stockage brut TOUTES les données enrichissement
-- Règle : RIEN ne doit être perdu. Chaque API = raw_data JSONB.
-- ============================================================

-- 1. BRIGHT DATA — réponses scraping brutes (PJ, Planity, Treatwell, etc.)
CREATE TABLE IF NOT EXISTS enrichment_bright_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  plateforme TEXT NOT NULL, -- pagesjaunes, planity, treatwell, fresha, booksy, groupon, wecasa, tripadvisor, google_scraper
  success BOOLEAN DEFAULT false,
  raw_response JSONB DEFAULT '{}', -- Réponse API Bright Data BRUTE
  parsed_data JSONB DEFAULT '{}', -- Données extraites/parsées
  scraping_zone TEXT, -- web_unlocker1 / scraping_browser1
  duration_ms INTEGER,
  error_message TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);

CREATE INDEX IF NOT EXISTS idx_enrichment_bd_lead ON enrichment_bright_data(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_bd_plateforme ON enrichment_bright_data(lead_id, plateforme);
ALTER TABLE enrichment_bright_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enrichment_bd_select ON enrichment_bright_data;
CREATE POLICY enrichment_bd_select ON enrichment_bright_data FOR SELECT USING (true);
DROP POLICY IF EXISTS enrichment_bd_insert ON enrichment_bright_data;
CREATE POLICY enrichment_bd_insert ON enrichment_bright_data FOR INSERT WITH CHECK (true);

-- 2. PAPPERS — données financières complètes (bilans, comptes, dettes)
CREATE TABLE IF NOT EXISTS enrichment_pappers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  siren TEXT,
  siret TEXT,
  raw_data JSONB DEFAULT '{}', -- Réponse API Pappers BRUTE (bilans, dirigeants, capital, CA, résultat, comptes)
  ca_dernier INTEGER,
  resultat_dernier INTEGER,
  effectif INTEGER,
  capital_social INTEGER,
  dirigeants JSONB DEFAULT '[]',
  bilans JSONB DEFAULT '[]', -- Bilans N, N-1, N-2 complets
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '12 months'
);

CREATE INDEX IF NOT EXISTS idx_enrichment_pappers_lead ON enrichment_pappers(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_pappers_siren ON enrichment_pappers(siren);
ALTER TABLE enrichment_pappers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enrichment_pappers_select ON enrichment_pappers;
CREATE POLICY enrichment_pappers_select ON enrichment_pappers FOR SELECT USING (true);
DROP POLICY IF EXISTS enrichment_pappers_insert ON enrichment_pappers;
CREATE POLICY enrichment_pappers_insert ON enrichment_pappers FOR INSERT WITH CHECK (true);

-- 3. SOCIAL PROFILES — usernames, followers, URLs complètes
CREATE TABLE IF NOT EXISTS enrichment_social_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  plateforme TEXT NOT NULL, -- instagram, facebook, linkedin, tiktok, youtube, twitter
  username TEXT,
  url TEXT,
  followers INTEGER,
  following INTEGER,
  posts_count INTEGER,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  profile_image_url TEXT,
  raw_data JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_enrichment_social_lead ON enrichment_social_profiles(lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrichment_social_dedup ON enrichment_social_profiles(lead_id, plateforme);
ALTER TABLE enrichment_social_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enrichment_social_select ON enrichment_social_profiles;
CREATE POLICY enrichment_social_select ON enrichment_social_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS enrichment_social_insert ON enrichment_social_profiles;
CREATE POLICY enrichment_social_insert ON enrichment_social_profiles FOR INSERT WITH CHECK (true);

-- 4. OSM SHOPS — TOUS les concurrents beauté (pas juste top 20)
CREATE TABLE IF NOT EXISTS enrichment_osm_shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  osm_id BIGINT,
  nom TEXT,
  type TEXT, -- beauty_salon, hairdresser, spa, massage, nail_salon
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_meters INTEGER,
  opening_hours TEXT,
  phone TEXT,
  website TEXT,
  raw_tags JSONB DEFAULT '{}', -- Tous les tags OSM
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_osm_lead ON enrichment_osm_shops(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_osm_distance ON enrichment_osm_shops(lead_id, distance_meters);
ALTER TABLE enrichment_osm_shops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enrichment_osm_select ON enrichment_osm_shops;
CREATE POLICY enrichment_osm_select ON enrichment_osm_shops FOR SELECT USING (true);
DROP POLICY IF EXISTS enrichment_osm_insert ON enrichment_osm_shops;
CREATE POLICY enrichment_osm_insert ON enrichment_osm_shops FOR INSERT WITH CHECK (true);

-- 5. PROSPECT REVIEWS — colonnes manquantes (photos, owner_answer, review_link, likes)
DO $$ BEGIN
  -- Ajouter colonnes si elles n'existent pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospect_reviews' AND column_name = 'review_photo_urls') THEN
    ALTER TABLE prospect_reviews ADD COLUMN review_photo_urls TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospect_reviews' AND column_name = 'owner_response') THEN
    ALTER TABLE prospect_reviews ADD COLUMN owner_response TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospect_reviews' AND column_name = 'owner_response_date') THEN
    ALTER TABLE prospect_reviews ADD COLUMN owner_response_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospect_reviews' AND column_name = 'review_link') THEN
    ALTER TABLE prospect_reviews ADD COLUMN review_link TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospect_reviews' AND column_name = 'review_likes') THEN
    ALTER TABLE prospect_reviews ADD COLUMN review_likes INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospect_reviews' AND column_name = 'review_id_external') THEN
    ALTER TABLE prospect_reviews ADD COLUMN review_id_external TEXT;
  END IF;
  -- TTL RGPD : expiration après 36 mois
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospect_reviews' AND column_name = 'expires_at') THEN
    ALTER TABLE prospect_reviews ADD COLUMN expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '36 months';
  END IF;
END $$;

-- 6. PAGESPEED — audit Lighthouse complet + scores manquants
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrichment_pagespeed' AND column_name = 'raw_lighthouse_result') THEN
    ALTER TABLE enrichment_pagespeed ADD COLUMN raw_lighthouse_result JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrichment_pagespeed' AND column_name = 'score_accessibility') THEN
    ALTER TABLE enrichment_pagespeed ADD COLUMN score_accessibility INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrichment_pagespeed' AND column_name = 'score_best_practices') THEN
    ALTER TABLE enrichment_pagespeed ADD COLUMN score_best_practices INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrichment_pagespeed' AND column_name = 'score_seo') THEN
    ALTER TABLE enrichment_pagespeed ADD COLUMN score_seo INTEGER;
  END IF;
END $$;

-- 7. NEIGHBORHOOD — données complètes (safety, walkability, décomposition POIs)
CREATE TABLE IF NOT EXISTS enrichment_neighborhood (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 500,
  metros INTEGER DEFAULT 0,
  restaurants INTEGER DEFAULT 0,
  cafes INTEGER DEFAULT 0,
  supermarkets INTEGER DEFAULT 0,
  pharmacies INTEGER DEFAULT 0,
  beauty_salons INTEGER DEFAULT 0,
  parkings INTEGER DEFAULT 0,
  foot_traffic_score INTEGER DEFAULT 0,
  safety_score INTEGER,
  walkability_score INTEGER,
  raw_nearby_results JSONB DEFAULT '{}', -- Tous les POIs Google Places
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_neighborhood_lead ON enrichment_neighborhood(lead_id);
ALTER TABLE enrichment_neighborhood ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enrichment_neighborhood_select ON enrichment_neighborhood;
CREATE POLICY enrichment_neighborhood_select ON enrichment_neighborhood FOR SELECT USING (true);
DROP POLICY IF EXISTS enrichment_neighborhood_insert ON enrichment_neighborhood;
CREATE POLICY enrichment_neighborhood_insert ON enrichment_neighborhood FOR INSERT WITH CHECK (true);

-- 8. AIDES FINANCEMENT — toutes (pas juste top 10)
CREATE TABLE IF NOT EXISTS enrichment_aides_financement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  financeur TEXT,
  type TEXT, -- subvention, pret, aide, dispositif
  montant_min INTEGER,
  montant_max INTEGER,
  taux_couverture INTEGER, -- % prise en charge
  date_limite DATE,
  url TEXT,
  conditions TEXT,
  departement TEXT,
  raw_data JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_aides_lead ON enrichment_aides_financement(lead_id);
ALTER TABLE enrichment_aides_financement ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enrichment_aides_select ON enrichment_aides_financement;
CREATE POLICY enrichment_aides_select ON enrichment_aides_financement FOR SELECT USING (true);
DROP POLICY IF EXISTS enrichment_aides_insert ON enrichment_aides_financement;
CREATE POLICY enrichment_aides_insert ON enrichment_aides_financement FOR INSERT WITH CHECK (true);

-- 9. TABLE MAÎTRE : enrichment_raw_log — TOUTES les API responses brutes (audit trail)
CREATE TABLE IF NOT EXISTS enrichment_raw_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  source TEXT NOT NULL, -- sirene, pappers, google, outscraper, brightdata, pagespeed, iris, dvf, bodacc, etc.
  endpoint TEXT, -- URL appelée
  http_status INTEGER,
  success BOOLEAN DEFAULT false,
  duration_ms INTEGER,
  request_params JSONB DEFAULT '{}', -- Paramètres envoyés (sans secrets)
  response_body JSONB DEFAULT '{}', -- Réponse BRUTE complète
  response_size_bytes INTEGER,
  error_message TEXT,
  credits_consumed NUMERIC(6,2) DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '6 months'
);

CREATE INDEX IF NOT EXISTS idx_enrichment_raw_lead ON enrichment_raw_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_raw_source ON enrichment_raw_log(source, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrichment_raw_expires ON enrichment_raw_log(expires_at) WHERE expires_at IS NOT NULL;
ALTER TABLE enrichment_raw_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enrichment_raw_admin ON enrichment_raw_log;
CREATE POLICY enrichment_raw_admin ON enrichment_raw_log FOR ALL USING (
  (SELECT auth_role()) IN ('admin')
);
DROP POLICY IF EXISTS enrichment_raw_insert ON enrichment_raw_log;
CREATE POLICY enrichment_raw_insert ON enrichment_raw_log FOR INSERT WITH CHECK (true);

-- 10. Vue agrégée : fraîcheur des données par lead
CREATE OR REPLACE VIEW v_enrichment_freshness AS
SELECT
  l.id as lead_id,
  l.prenom,
  l.nom,
  l.entreprise_nom,
  pr.created_at as last_report_at,
  (SELECT MAX(fetched_at) FROM enrichment_raw_log erl WHERE erl.lead_id = l.id) as last_api_call,
  (SELECT COUNT(*) FROM enrichment_raw_log erl WHERE erl.lead_id = l.id) as total_api_calls,
  (SELECT COUNT(*) FROM enrichment_raw_log erl WHERE erl.lead_id = l.id AND erl.success = true) as successful_calls,
  (SELECT COUNT(*) FROM prospect_reviews prv WHERE prv.lead_id = l.id) as total_reviews_stored,
  (SELECT COUNT(DISTINCT source) FROM enrichment_raw_log erl WHERE erl.lead_id = l.id AND erl.success = true) as sources_count,
  (SELECT array_agg(DISTINCT source) FROM enrichment_raw_log erl WHERE erl.lead_id = l.id AND erl.success = true) as sources_used,
  CASE
    WHEN pr.created_at > NOW() - INTERVAL '7 days' THEN 'fresh'
    WHEN pr.created_at > NOW() - INTERVAL '30 days' THEN 'recent'
    WHEN pr.created_at > NOW() - INTERVAL '90 days' THEN 'stale'
    ELSE 'expired'
  END as data_freshness
FROM leads l
LEFT JOIN LATERAL (
  SELECT created_at FROM prospect_reports WHERE lead_id = l.id ORDER BY version DESC LIMIT 1
) pr ON true;
