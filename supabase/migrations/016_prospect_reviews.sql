-- ============================================================
-- Migration 016 : Stockage et analyse des avis prospects
-- Table : prospect_reviews (tous les avis récupérés)
-- ============================================================

CREATE TABLE IF NOT EXISTS prospect_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'google' CHECK (source IN ('google', 'pagesjaunes', 'planity', 'treatwell', 'facebook', 'yelp')),
  author_name TEXT NOT NULL DEFAULT 'Anonyme',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT DEFAULT '',
  review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  language TEXT DEFAULT 'fr',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_prospect_reviews_lead_id ON prospect_reviews(lead_id);
CREATE INDEX IF NOT EXISTS idx_prospect_reviews_lead_source ON prospect_reviews(lead_id, source);
CREATE INDEX IF NOT EXISTS idx_prospect_reviews_rating ON prospect_reviews(lead_id, rating);
CREATE INDEX IF NOT EXISTS idx_prospect_reviews_date ON prospect_reviews(review_date DESC);

-- Éviter les doublons (même auteur + même date + même source)
CREATE UNIQUE INDEX IF NOT EXISTS idx_prospect_reviews_dedup
  ON prospect_reviews(lead_id, source, author_name, review_date);

-- RLS
ALTER TABLE prospect_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prospect_reviews_select ON prospect_reviews;
CREATE POLICY prospect_reviews_select ON prospect_reviews
  FOR SELECT USING (
    (SELECT auth_role()) IN ('admin', 'manager', 'commercial')
  );

DROP POLICY IF EXISTS prospect_reviews_insert ON prospect_reviews;
CREATE POLICY prospect_reviews_insert ON prospect_reviews
  FOR INSERT WITH CHECK (true);

-- Vue agrégée par lead
CREATE OR REPLACE VIEW v_prospect_reviews_summary AS
SELECT
  lead_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating)::numeric, 1) as avg_rating,
  COUNT(*) FILTER (WHERE rating = 5) as stars_5,
  COUNT(*) FILTER (WHERE rating = 4) as stars_4,
  COUNT(*) FILTER (WHERE rating = 3) as stars_3,
  COUNT(*) FILTER (WHERE rating = 2) as stars_2,
  COUNT(*) FILTER (WHERE rating = 1) as stars_1,
  COUNT(*) FILTER (WHERE text != '' AND LENGTH(text) > 10) as with_text,
  MAX(review_date) as latest_review,
  MIN(review_date) as oldest_review,
  array_agg(DISTINCT source) as sources
FROM prospect_reviews
GROUP BY lead_id;
