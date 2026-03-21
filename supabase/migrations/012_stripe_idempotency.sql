-- ============================================================
-- CRM DERMOTEC — Optimisation Idempotence Stripe + Retry Logic
-- Migration 012: Amélioration webhook_events pour production
-- ============================================================

-- 1. Ajouter colonnes manquantes pour retry logic avancé
ALTER TABLE webhook_events
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS retry_backoff_seconds INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signature_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS processing_duration_ms INTEGER;

-- 2. Index pour performance des requêtes de retry
CREATE INDEX IF NOT EXISTS idx_webhook_events_retry_schedule
ON webhook_events(next_retry_at, status)
WHERE status = 'failed' AND next_retry_at IS NOT NULL;

-- Index composite pour idempotence rapide
CREATE INDEX IF NOT EXISTS idx_webhook_events_idempotence
ON webhook_events(event_id, status, created_at DESC);

-- Index pour monitoring et debugging
CREATE INDEX IF NOT EXISTS idx_webhook_events_source_type
ON webhook_events(source, event_type, created_at DESC);

-- 3. Fonction pour calculer le prochain retry (exponential backoff)
CREATE OR REPLACE FUNCTION calculate_next_retry(
  current_attempts INTEGER,
  base_backoff INTEGER DEFAULT 30,
  max_delay INTEGER DEFAULT 1800 -- 30 minutes max
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
BEGIN
  -- Exponential backoff: 30s, 1m, 2m, 4m, 8m, 16m, 30m (cap)
  RETURN NOW() + (
    LEAST(
      base_backoff * POWER(2, current_attempts),
      max_delay
    ) || ' seconds'
  )::INTERVAL;
END;
$$;

-- 4. Procédure pour marquer un webhook comme failed avec retry
CREATE OR REPLACE FUNCTION mark_webhook_failed(
  p_event_id TEXT,
  p_error_message TEXT,
  p_processing_duration_ms INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  webhook_record webhook_events%ROWTYPE;
  should_retry BOOLEAN;
BEGIN
  -- Récupérer le webhook actuel
  SELECT * INTO webhook_record
  FROM webhook_events
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    RAISE WARNING 'Webhook event not found: %', p_event_id;
    RETURN FALSE;
  END IF;

  -- Incrémenter attempts
  webhook_record.attempts := webhook_record.attempts + 1;
  webhook_record.last_attempt_at := NOW();
  webhook_record.processing_duration_ms := p_processing_duration_ms;

  -- Décider si on doit retry
  should_retry := webhook_record.attempts < webhook_record.max_attempts;

  IF should_retry THEN
    -- Programmer le prochain retry
    UPDATE webhook_events SET
      status = 'failed',
      error_message = p_error_message,
      attempts = webhook_record.attempts,
      last_attempt_at = webhook_record.last_attempt_at,
      processing_duration_ms = webhook_record.processing_duration_ms,
      next_retry_at = calculate_next_retry(webhook_record.attempts)
    WHERE event_id = p_event_id;

    RAISE NOTICE 'Webhook % scheduled for retry (attempt % of %)',
      p_event_id, webhook_record.attempts, webhook_record.max_attempts;
  ELSE
    -- Max attempts atteints, échec définitif
    UPDATE webhook_events SET
      status = 'failed_permanent',
      error_message = p_error_message || ' (max attempts reached)',
      attempts = webhook_record.attempts,
      last_attempt_at = webhook_record.last_attempt_at,
      processing_duration_ms = webhook_record.processing_duration_ms,
      next_retry_at = NULL
    WHERE event_id = p_event_id;

    RAISE WARNING 'Webhook % failed permanently after % attempts',
      p_event_id, webhook_record.attempts;
  END IF;

  RETURN should_retry;
END;
$$;

-- 5. Fonction pour marquer comme processed avec métriques
CREATE OR REPLACE FUNCTION mark_webhook_processed(
  p_event_id TEXT,
  p_processing_duration_ms INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE webhook_events SET
    status = 'processed',
    processed_at = NOW(),
    processing_duration_ms = p_processing_duration_ms,
    next_retry_at = NULL
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    RAISE WARNING 'Webhook event not found: %', p_event_id;
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- 6. Vue pour monitoring des webhooks
CREATE OR REPLACE VIEW webhook_metrics AS
SELECT
  source,
  event_type,
  status,
  COUNT(*) as total_events,
  AVG(processing_duration_ms) as avg_duration_ms,
  MAX(processing_duration_ms) as max_duration_ms,
  AVG(attempts) as avg_attempts,
  COUNT(*) FILTER (WHERE status = 'processed') as success_count,
  COUNT(*) FILTER (WHERE status LIKE 'failed%') as failed_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'processed') / COUNT(*),
    2
  ) as success_rate_pct
FROM webhook_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY source, event_type, status
ORDER BY total_events DESC;

-- 7. Fonction de cleanup des anciens webhooks (à appeler via cron)
CREATE OR REPLACE FUNCTION cleanup_old_webhooks(
  retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les webhooks anciens processed
  DELETE FROM webhook_events
  WHERE status = 'processed'
    AND created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Garder les failed pour investigation (rétention plus longue)
  DELETE FROM webhook_events
  WHERE status LIKE 'failed%'
    AND created_at < NOW() - ((retention_days * 2) || ' days')::INTERVAL;

  RAISE NOTICE 'Cleaned up % old webhook events', deleted_count;
  RETURN deleted_count;
END;
$$;

-- 8. Politique RLS optimisée pour webhook_events (service role uniquement pour writes)
DROP POLICY IF EXISTS "webhook_events_insert" ON webhook_events;
CREATE POLICY "webhook_events_insert" ON webhook_events
FOR INSERT WITH CHECK (
  -- Autoriser l'insertion uniquement via service role ou API routes
  auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "webhook_events_update" ON webhook_events;
CREATE POLICY "webhook_events_update" ON webhook_events
FOR UPDATE USING (
  -- Mise à jour uniquement via service role ou admin
  auth.role() = 'service_role'
  OR (SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles WHERE role = 'ADMIN'
  )
);

-- 9. Trigger pour auto-cleanup (optionnel)
CREATE OR REPLACE FUNCTION auto_cleanup_webhooks()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Tous les 1000 inserts, faire un cleanup
  IF (SELECT COUNT(*) % 1000 = 0 FROM webhook_events WHERE created_at >= NOW() - INTERVAL '1 hour') THEN
    PERFORM cleanup_old_webhooks();
  END IF;

  RETURN NEW;
END;
$$;

-- Activer le trigger de cleanup (commenté par défaut pour éviter la surcharge)
-- CREATE TRIGGER webhook_auto_cleanup
--   AFTER INSERT ON webhook_events
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_cleanup_webhooks();

-- 10. Documentation et commentaires
COMMENT ON TABLE webhook_events IS 'Idempotence des webhooks entrants (Stripe, Resend, etc) avec retry logic';
COMMENT ON FUNCTION mark_webhook_failed IS 'Marque un webhook comme failed avec exponential backoff retry';
COMMENT ON FUNCTION mark_webhook_processed IS 'Marque un webhook comme processed avec métriques';
COMMENT ON VIEW webhook_metrics IS 'Métriques temps réel des webhooks pour monitoring';

-- Vérification finale
DO $$
BEGIN
  -- Vérifier que les index existent
  ASSERT (SELECT count(*) FROM pg_indexes WHERE tablename = 'webhook_events' AND indexname = 'idx_webhook_events_idempotence') > 0,
    'Index idempotence manquant';

  RAISE NOTICE 'Migration 012 completed: Enhanced Stripe idempotency with retry logic';
END;
$$;