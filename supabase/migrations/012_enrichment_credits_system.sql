-- ============================================================
-- Migration 012: Système de crédits + enrichissement multi-API
-- Pappers, Google Places, OpenRouter, SIRENE
-- Chaque appel API consomme des crédits par utilisateur/organisation
-- ============================================================

-- ============================================================
-- 1. Table crédits — Solde par organisation
-- ============================================================
CREATE TABLE IF NOT EXISTS credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  credits_total INTEGER NOT NULL DEFAULT 100,      -- Crédits alloués par mois
  credits_used INTEGER NOT NULL DEFAULT 0,          -- Crédits consommés ce mois
  credits_bonus INTEGER NOT NULL DEFAULT 0,         -- Crédits bonus (offerts, achetés)
  reset_day INTEGER NOT NULL DEFAULT 1,             -- Jour du mois pour reset
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans de crédits
COMMENT ON TABLE credits IS 'Starter=100/mois, Pro=500/mois, Enterprise=2000/mois';

ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credits_read" ON credits FOR SELECT USING (true);
CREATE POLICY "credits_manage" ON credits FOR ALL USING (
  EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = (SELECT auth.uid()) AND role IN ('admin', 'manager'))
);

-- ============================================================
-- 2. Table enrichment_log — Historique de chaque appel API
-- ============================================================
CREATE TABLE IF NOT EXISTS enrichment_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  user_id UUID REFERENCES equipe(id),
  provider TEXT NOT NULL,                           -- pappers, google_places, openrouter, sirene, societecom
  endpoint TEXT NOT NULL,                           -- ex: /entreprise, /reviews, /chat/completions
  credits_consumed INTEGER NOT NULL DEFAULT 1,
  request_data JSONB DEFAULT '{}',                  -- Paramètres envoyés (sans secrets)
  response_summary JSONB DEFAULT '{}',              -- Résumé de la réponse (pas la réponse complète)
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'cached', 'rate_limited')),
  latency_ms INTEGER,
  error_message TEXT,
  cached BOOLEAN DEFAULT false,                     -- true si résultat venu du cache
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enrichment_lead ON enrichment_log(lead_id);
CREATE INDEX idx_enrichment_user ON enrichment_log(user_id);
CREATE INDEX idx_enrichment_provider ON enrichment_log(provider);
CREATE INDEX idx_enrichment_created ON enrichment_log(created_at DESC);

ALTER TABLE enrichment_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrichment_read" ON enrichment_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = (SELECT auth.uid()) AND role IN ('admin', 'manager'))
  OR user_id = (SELECT id FROM equipe WHERE auth_user_id = (SELECT auth.uid()))
);
CREATE POLICY "enrichment_insert" ON enrichment_log FOR INSERT WITH CHECK (true);

-- ============================================================
-- 3. Table enrichment_cache — Cache des résultats (éviter appels redondants)
-- ============================================================
CREATE TABLE IF NOT EXISTS enrichment_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,                   -- ex: pappers:siret:12345678901234
  provider TEXT NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enrichment_cache_key ON enrichment_cache(cache_key);
CREATE INDEX idx_enrichment_cache_expires ON enrichment_cache(expires_at);

-- Nettoyage auto du cache expiré
CREATE OR REPLACE FUNCTION cleanup_enrichment_cache()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM enrichment_cache WHERE expires_at < NOW();
END;
$$;

-- ============================================================
-- 4. Coûts en crédits par provider
-- ============================================================
COMMENT ON COLUMN enrichment_log.credits_consumed IS '
Coûts par provider:
- sirene (entreprise.data.gouv.fr): 0 crédits (gratuit)
- pappers (recherche SIRET): 1 crédit
- pappers (détails complets): 2 crédits
- pappers (dirigeants + bilans): 5 crédits
- google_places (search): 1 crédit
- google_places (reviews): 2 crédits
- openrouter (résumé IA): 1 crédit
- openrouter (email personnalisé): 2 crédits
- openrouter (analyse prospect): 3 crédits
';

-- ============================================================
-- 5. Vue résumé consommation
-- ============================================================
CREATE OR REPLACE VIEW v_enrichment_usage AS
SELECT
  e.id AS equipe_id,
  e.prenom || ' ' || e.nom AS nom_complet,
  e.role,
  COUNT(el.id) AS total_appels,
  COALESCE(SUM(el.credits_consumed), 0) AS credits_consommes,
  COUNT(el.id) FILTER (WHERE el.cached = true) AS appels_caches,
  COUNT(el.id) FILTER (WHERE el.status = 'error') AS erreurs,
  jsonb_object_agg(
    COALESCE(el.provider, 'none'),
    COUNT(el.id)
  ) FILTER (WHERE el.provider IS NOT NULL) AS par_provider
FROM equipe e
LEFT JOIN enrichment_log el ON el.user_id = e.id
  AND el.created_at >= date_trunc('month', CURRENT_DATE)
WHERE e.is_active = true
GROUP BY e.id, e.prenom, e.nom, e.role;

-- ============================================================
-- 6. Fonction: consommer des crédits (atomique)
-- ============================================================
CREATE OR REPLACE FUNCTION consume_credits(
  p_org_id UUID,
  p_amount INTEGER
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT (credits_total - credits_used + credits_bonus)
  INTO v_available
  FROM credits
  WHERE org_id = p_org_id
  FOR UPDATE; -- Lock la ligne

  IF v_available IS NULL OR v_available < p_amount THEN
    RETURN FALSE; -- Pas assez de crédits
  END IF;

  UPDATE credits
  SET credits_used = credits_used + p_amount,
      updated_at = NOW()
  WHERE org_id = p_org_id;

  RETURN TRUE;
END;
$$;
