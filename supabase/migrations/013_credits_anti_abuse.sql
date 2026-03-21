-- ============================================================
-- Migration 013: Anti-abus crédits — Limites strictes
-- Rate limits par heure/jour/mois, détection comportement suspect,
-- hard cap inviolable, alertes admin
-- ============================================================

-- ============================================================
-- 1. Limites par utilisateur (rate limiting granulaire)
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan TEXT UNIQUE NOT NULL,
  credits_monthly INTEGER NOT NULL,          -- Crédits max par mois
  max_per_hour INTEGER NOT NULL DEFAULT 20,  -- Max appels enrichissement par heure
  max_per_day INTEGER NOT NULL DEFAULT 100,  -- Max par jour
  max_per_lead INTEGER NOT NULL DEFAULT 3,   -- Max enrichissements par lead (évite spam même lead)
  max_concurrent INTEGER NOT NULL DEFAULT 3, -- Max appels simultanés
  alert_threshold_pct INTEGER NOT NULL DEFAULT 80, -- Alerte admin à 80% consommation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO credit_limits (plan, credits_monthly, max_per_hour, max_per_day, max_per_lead, max_concurrent, alert_threshold_pct) VALUES
  ('starter',    100,  10,  50,  2, 2, 80),
  ('pro',        500,  30, 200,  3, 5, 80),
  ('enterprise', 2000, 100, 500,  5, 10, 90)
ON CONFLICT (plan) DO NOTHING;

-- ============================================================
-- 2. Table abus détectés
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_abuse_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES equipe(id),
  abuse_type TEXT NOT NULL CHECK (abuse_type IN (
    'hourly_limit_exceeded',
    'daily_limit_exceeded',
    'monthly_limit_exceeded',
    'same_lead_spam',
    'burst_detected',
    'concurrent_limit',
    'suspicious_pattern',
    'api_key_leak_suspected'
  )),
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  blocked BOOLEAN DEFAULT true,           -- Requête bloquée ?
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES equipe(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_abuse_user ON credit_abuse_log(user_id, created_at DESC);
CREATE INDEX idx_abuse_type ON credit_abuse_log(abuse_type);
CREATE INDEX idx_abuse_unresolved ON credit_abuse_log(resolved) WHERE resolved = false;

ALTER TABLE credit_abuse_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abuse_admin_only" ON credit_abuse_log FOR ALL USING (
  EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = (SELECT auth.uid()) AND role = 'admin')
);

-- ============================================================
-- 3. Fonction: vérifier et consommer crédits (atomique + anti-abus)
-- Vérifie TOUT avant de consommer :
-- - Solde suffisant
-- - Limite horaire
-- - Limite quotidienne
-- - Limite par lead
-- - Détection burst
-- ============================================================
CREATE OR REPLACE FUNCTION safe_consume_credits(
  p_user_id UUID,
  p_org_id UUID,
  p_lead_id UUID,
  p_provider TEXT,
  p_credits INTEGER,
  p_ip TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_plan TEXT;
  v_available INTEGER;
  v_limits RECORD;
  v_calls_hour INTEGER;
  v_calls_day INTEGER;
  v_calls_lead INTEGER;
  v_calls_minute INTEGER;
BEGIN
  -- 1. Récupérer le plan et les limites
  SELECT c.plan, (c.credits_total - c.credits_used + c.credits_bonus)
  INTO v_plan, v_available
  FROM credits c
  WHERE c.org_id = p_org_id
  FOR UPDATE; -- LOCK atomique

  IF v_plan IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'no_credits_configured');
  END IF;

  SELECT * INTO v_limits FROM credit_limits WHERE plan = v_plan;

  -- 2. Vérifier solde
  IF v_available < p_credits THEN
    INSERT INTO credit_abuse_log (user_id, abuse_type, details, ip_address, blocked)
    VALUES (p_user_id, 'monthly_limit_exceeded',
      jsonb_build_object('available', v_available, 'requested', p_credits, 'plan', v_plan),
      p_ip, true);
    RETURN jsonb_build_object('allowed', false, 'reason', 'insufficient_credits', 'remaining', v_available);
  END IF;

  -- 3. Vérifier limite par heure
  SELECT COUNT(*) INTO v_calls_hour
  FROM enrichment_log
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour'
    AND status != 'cached';

  IF v_calls_hour >= v_limits.max_per_hour THEN
    INSERT INTO credit_abuse_log (user_id, abuse_type, details, ip_address, blocked)
    VALUES (p_user_id, 'hourly_limit_exceeded',
      jsonb_build_object('calls_hour', v_calls_hour, 'limit', v_limits.max_per_hour),
      p_ip, true);
    RETURN jsonb_build_object('allowed', false, 'reason', 'hourly_limit', 'retry_after', '1 hour');
  END IF;

  -- 4. Vérifier limite par jour
  SELECT COUNT(*) INTO v_calls_day
  FROM enrichment_log
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 day'
    AND status != 'cached';

  IF v_calls_day >= v_limits.max_per_day THEN
    INSERT INTO credit_abuse_log (user_id, abuse_type, details, ip_address, blocked)
    VALUES (p_user_id, 'daily_limit_exceeded',
      jsonb_build_object('calls_day', v_calls_day, 'limit', v_limits.max_per_day),
      p_ip, true);
    RETURN jsonb_build_object('allowed', false, 'reason', 'daily_limit', 'retry_after', '24 hours');
  END IF;

  -- 5. Vérifier limite par lead (anti-spam même lead)
  IF p_lead_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_calls_lead
    FROM enrichment_log
    WHERE lead_id = p_lead_id
      AND provider = p_provider
      AND created_at > NOW() - INTERVAL '7 days'
      AND status = 'success';

    IF v_calls_lead >= v_limits.max_per_lead THEN
      INSERT INTO credit_abuse_log (user_id, abuse_type, details, ip_address, blocked)
      VALUES (p_user_id, 'same_lead_spam',
        jsonb_build_object('lead_id', p_lead_id, 'calls', v_calls_lead, 'provider', p_provider),
        p_ip, true);
      RETURN jsonb_build_object('allowed', false, 'reason', 'lead_already_enriched', 'provider', p_provider);
    END IF;
  END IF;

  -- 6. Détection burst (>5 appels en 1 minute = suspect)
  SELECT COUNT(*) INTO v_calls_minute
  FROM enrichment_log
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 minute';

  IF v_calls_minute >= 5 THEN
    INSERT INTO credit_abuse_log (user_id, abuse_type, details, ip_address, blocked)
    VALUES (p_user_id, 'burst_detected',
      jsonb_build_object('calls_minute', v_calls_minute),
      p_ip, true);
    RETURN jsonb_build_object('allowed', false, 'reason', 'burst_detected', 'retry_after', '1 minute');
  END IF;

  -- 7. TOUT OK — consommer les crédits
  UPDATE credits
  SET credits_used = credits_used + p_credits,
      updated_at = NOW()
  WHERE org_id = p_org_id;

  -- 8. Alerte si seuil atteint
  IF ((v_available - p_credits) * 100 / NULLIF(v_available + (SELECT credits_used FROM credits WHERE org_id = p_org_id), 0))
     <= (100 - v_limits.alert_threshold_pct) THEN
    INSERT INTO credit_abuse_log (user_id, abuse_type, details, ip_address, blocked)
    VALUES (p_user_id, 'suspicious_pattern',
      jsonb_build_object('reason', 'threshold_reached', 'remaining_pct',
        ((v_available - p_credits) * 100 / NULLIF(v_available + (SELECT credits_used FROM credits WHERE org_id = p_org_id), 0)),
        'plan', v_plan),
      p_ip, false); -- Pas bloqué, juste alerte
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'credits_consumed', p_credits,
    'remaining', v_available - p_credits,
    'plan', v_plan
  );
END;
$$;

-- ============================================================
-- 4. Vue alertes admin — abus non résolus
-- ============================================================
CREATE OR REPLACE VIEW v_credit_abuse_alerts AS
SELECT
  a.id,
  a.abuse_type,
  a.details,
  a.ip_address,
  a.blocked,
  a.created_at,
  e.prenom || ' ' || e.nom AS user_name,
  e.email AS user_email,
  e.role
FROM credit_abuse_log a
JOIN equipe e ON a.user_id = e.id
WHERE a.resolved = false
ORDER BY a.created_at DESC;
