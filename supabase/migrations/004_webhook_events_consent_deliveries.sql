-- ============================================================
-- Migration 004: webhook_events + consent_logs + webhook_subscriptions + webhook_deliveries
-- Idempotence Stripe + RGPD + Webhooks sortants
-- ============================================================

-- ============================================================
-- 1. Table webhook_events — Idempotence webhooks entrants
-- ============================================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,           -- ID unique de l'événement (ex: evt_xxx Stripe)
  event_type TEXT NOT NULL,                 -- Type d'événement
  source TEXT NOT NULL DEFAULT 'stripe',    -- stripe, resend, etc.
  payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',   -- pending, processed, failed
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);

-- RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_webhook_events" ON webhook_events FOR ALL
  USING (EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')));
-- Permettre les inserts depuis les API routes (service role)

-- ============================================================
-- 2. Table consent_logs — Consentements RGPD
-- ============================================================
CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  lead_id UUID REFERENCES leads(id),
  consent_type TEXT NOT NULL,               -- marketing, analytics, newsletter, cgu, privacy
  consent_given BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  ip_address TEXT,
  user_agent TEXT,
  method TEXT DEFAULT 'web_form',           -- web_form, api, verbal, written
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consent_logs_lead ON consent_logs(lead_id);
CREATE INDEX idx_consent_logs_type ON consent_logs(consent_type);
CREATE INDEX idx_consent_logs_created ON consent_logs(created_at DESC);

-- RLS
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_consent_logs" ON consent_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')));

-- ============================================================
-- 3. Table webhook_subscriptions — Abonnements webhooks sortants
-- ============================================================
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',       -- liste des event types écoutés
  secret TEXT,                                -- HMAC secret pour signature
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES equipe(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_subs_active ON webhook_subscriptions(is_active);

-- RLS
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_webhook_subs" ON webhook_subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin')));

-- Trigger updated_at
CREATE TRIGGER tr_webhook_subscriptions_updated
  BEFORE UPDATE ON webhook_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. Table webhook_deliveries — Historique livraisons webhooks
-- ============================================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',    -- pending, delivered, failed
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempts INTEGER DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_sub ON webhook_deliveries(subscription_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- RLS
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_webhook_deliveries" ON webhook_deliveries FOR ALL
  USING (EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin')));

-- ============================================================
-- 5. Activer pg_trgm pour fuzzy search
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index trigram sur leads (noms mal orthographiés, recherche fuzzy)
CREATE INDEX IF NOT EXISTS idx_leads_trgm_prenom ON leads USING gin (prenom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_trgm_nom ON leads USING gin (nom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_trgm_email ON leads USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_trgm_entreprise ON leads USING gin (entreprise_nom gin_trgm_ops);

-- ============================================================
-- 6. Vue RGPD — Données exportables par lead
-- ============================================================
CREATE OR REPLACE VIEW v_gdpr_export AS
SELECT
  l.id AS lead_id,
  l.prenom, l.nom, l.email, l.telephone,
  l.entreprise_nom, l.adresse,
  l.source, l.statut,
  l.created_at AS lead_created,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'formation', f.nom,
      'dates', i.created_at,
      'statut', i.statut,
      'montant', i.montant_total
    ))
    FROM inscriptions i
    LEFT JOIN sessions s ON i.session_id = s.id
    LEFT JOIN formations f ON s.formation_id = f.id
    WHERE i.lead_id = l.id
  ) AS inscriptions,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'organisme', fi.organisme,
      'montant_demande', fi.montant_demande,
      'statut', fi.statut
    ))
    FROM financements fi
    WHERE fi.lead_id = l.id
  ) AS financements,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'type', a.type,
      'description', a.description,
      'date', a.created_at
    ))
    FROM activites a
    WHERE a.lead_id = l.id
  ) AS activites,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'type', cl.consent_type,
      'given', cl.consent_given,
      'date', cl.created_at
    ))
    FROM consent_logs cl
    WHERE cl.lead_id = l.id
  ) AS consentements
FROM leads l;

-- ============================================================
-- 7. Fonction de purge automatique RGPD
-- ============================================================
CREATE OR REPLACE FUNCTION purge_old_data()
RETURNS TABLE(
  activites_purged BIGINT,
  login_logs_purged BIGINT,
  spam_leads_purged BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Purger les activités > 24 mois
  DELETE FROM activites
  WHERE created_at < NOW() - INTERVAL '24 months';
  GET DIAGNOSTICS activites_purged = ROW_COUNT;

  -- Purger les login_logs > 12 mois
  DELETE FROM login_logs
  WHERE created_at < NOW() - INTERVAL '12 months';
  GET DIAGNOSTICS login_logs_purged = ROW_COUNT;

  -- Anonymiser les leads SPAM > 6 mois
  UPDATE leads SET
    prenom = 'ANONYME',
    nom = 'ANONYME',
    email = 'anonyme-' || id::text || '@purged.local',
    telephone = '',
    message = '',
    ip_address = '',
    user_agent = '',
    metadata = '{}'
  WHERE statut = 'SPAM'
    AND updated_at < NOW() - INTERVAL '6 months'
    AND prenom != 'ANONYME';
  GET DIAGNOSTICS spam_leads_purged = ROW_COUNT;

  RETURN NEXT;
END;
$$;
