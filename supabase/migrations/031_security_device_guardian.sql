-- ============================================================
-- CRM SATOREA — Migration 031: Device Guardian
-- Tables sécurité : appareils connus, événements, alertes
-- Anti-intrusion, impossible travel, device fingerprinting
-- ============================================================

-- Table 1 : Appareils connus et autorisés
CREATE TABLE IF NOT EXISTS known_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    fingerprint TEXT NOT NULL, -- Hash device (FingerprintJS + UA)
    name TEXT, -- Nom donné par l'utilisateur ("MacBook Pro bureau")
    -- Metadata appareil
    user_agent TEXT,
    platform TEXT,
    screen_resolution TEXT,
    timezone TEXT,
    language TEXT,
    -- Historique
    ip_addresses TEXT[] DEFAULT '{}', -- Toutes les IPs utilisées
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    login_count INTEGER DEFAULT 1,
    -- Confiance
    trusted BOOLEAN DEFAULT false, -- Doit être validé par l'admin ou l'utilisateur
    trusted_at TIMESTAMPTZ,
    trusted_by UUID, -- Qui a validé
    blocked BOOLEAN DEFAULT false, -- Bloqué manuellement
    blocked_reason TEXT,
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_known_devices_fp_user ON known_devices(fingerprint, user_id);
CREATE INDEX IF NOT EXISTS idx_known_devices_user ON known_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_known_devices_last_seen ON known_devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_known_devices_trusted ON known_devices(user_id, trusted);

CREATE TRIGGER IF NOT EXISTS tr_known_devices_updated
    BEFORE UPDATE ON known_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger : fusionner les IP addresses sur upsert
CREATE OR REPLACE FUNCTION merge_device_ips()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Ajouter la nouvelle IP si pas déjà présente
        NEW.ip_addresses = array_cat(
            OLD.ip_addresses,
            ARRAY(
                SELECT unnest(NEW.ip_addresses)
                EXCEPT
                SELECT unnest(OLD.ip_addresses)
            )
        );
        -- Limiter à 20 IPs max
        IF array_length(NEW.ip_addresses, 1) > 20 THEN
            NEW.ip_addresses = NEW.ip_addresses[array_length(NEW.ip_addresses, 1) - 19 : array_length(NEW.ip_addresses, 1)];
        END IF;
        -- Incrémenter le compteur de login
        NEW.login_count = COALESCE(OLD.login_count, 0) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS tr_merge_device_ips
    BEFORE UPDATE ON known_devices
    FOR EACH ROW EXECUTE FUNCTION merge_device_ips();

-- Table 2 : Événements de sécurité (audit trail complet)
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    -- Action
    action TEXT NOT NULL CHECK (action IN (
        'login', 'logout', 'api_call', 'enrichment', 'export',
        'admin_action', 'password_change', 'mfa_challenge', 'device_trust'
    )),
    -- Appareil
    device_fingerprint TEXT,
    ip_address TEXT,
    user_agent TEXT,
    -- Géolocalisation
    geo_lat DOUBLE PRECISION,
    geo_lng DOUBLE PRECISION,
    geo_city TEXT,
    geo_country TEXT,
    -- Évaluation risque
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_flags TEXT[] DEFAULT '{}',
    risk_action TEXT CHECK (risk_action IN ('allow', 'challenge', 'notify_admin', 'block')),
    -- Meta
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioning par mois (les events s'accumulent vite)
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_risk ON security_events(risk_level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_action ON security_events(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_fp ON security_events(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_security_events_date ON security_events(created_at DESC);

-- Table 3 : Alertes de sécurité (pour le dashboard admin)
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    -- Alerte
    risk_level TEXT NOT NULL CHECK (risk_level IN ('medium', 'high', 'critical')),
    risk_score INTEGER NOT NULL,
    flags TEXT[] DEFAULT '{}',
    action_taken TEXT NOT NULL,
    details TEXT,
    -- Contexte
    device_fingerprint TEXT,
    ip_address TEXT,
    geo_city TEXT,
    geo_country TEXT,
    -- Résolution
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON security_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_level ON security_alerts(risk_level, resolved);
CREATE INDEX IF NOT EXISTS idx_security_alerts_unresolved ON security_alerts(resolved, created_at DESC) WHERE resolved = false;

-- Table 4 : IP Whitelist (appareils/IPs autorisés par l'admin)
CREATE TABLE IF NOT EXISTS ip_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Règle
    ip_address TEXT, -- IP exacte ou CIDR (ex: 192.168.1.0/24)
    ip_range_start TEXT, -- Début de plage
    ip_range_end TEXT, -- Fin de plage
    description TEXT NOT NULL, -- "Bureau Dermotec", "VPN Hayou"
    -- Scope
    user_id UUID, -- NULL = global (tous les users)
    -- Activation
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ, -- NULL = permanent
    -- Meta
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_whitelist_active ON ip_whitelist(active, ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_user ON ip_whitelist(user_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE known_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;

-- known_devices : chaque user voit SES appareils, admin voit tout
CREATE POLICY "Users see own devices" ON known_devices
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role full access devices" ON known_devices
    FOR ALL TO service_role USING (true);

-- security_events : admin seulement (données sensibles)
CREATE POLICY "Service role full access events" ON security_events
    FOR ALL TO service_role USING (true);

-- security_alerts : admin seulement
CREATE POLICY "Service role full access alerts" ON security_alerts
    FOR ALL TO service_role USING (true);

-- ip_whitelist : admin seulement
CREATE POLICY "Service role full access whitelist" ON ip_whitelist
    FOR ALL TO service_role USING (true);

-- ============================================================
-- Vues pour le dashboard admin
-- ============================================================

-- Vue : appareils suspects (non trusted, actifs récemment)
CREATE OR REPLACE VIEW v_suspicious_devices AS
SELECT
    kd.*,
    COUNT(se.id) FILTER (WHERE se.risk_level IN ('high', 'critical')) AS high_risk_events,
    MAX(se.created_at) AS last_event_at
FROM known_devices kd
LEFT JOIN security_events se ON se.device_fingerprint = kd.fingerprint
    AND se.user_id = kd.user_id
    AND se.created_at > NOW() - INTERVAL '7 days'
WHERE kd.trusted = false
    AND kd.last_seen > NOW() - INTERVAL '30 days'
GROUP BY kd.id
ORDER BY high_risk_events DESC, kd.last_seen DESC;

-- Vue : alertes non résolues
CREATE OR REPLACE VIEW v_pending_alerts AS
SELECT
    sa.*,
    COUNT(*) OVER (PARTITION BY sa.user_id) AS total_alerts_user
FROM security_alerts sa
WHERE sa.resolved = false
ORDER BY
    CASE sa.risk_level
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
    END,
    sa.created_at DESC;

-- Vue : statistiques sécurité 7 jours
CREATE OR REPLACE VIEW v_security_stats_7d AS
SELECT
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE risk_level = 'critical') AS critical_events,
    COUNT(*) FILTER (WHERE risk_level = 'high') AS high_events,
    COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium_events,
    COUNT(DISTINCT ip_address) AS unique_ips,
    COUNT(DISTINCT device_fingerprint) AS unique_devices,
    COUNT(DISTINCT user_id) AS unique_users,
    COUNT(*) FILTER (WHERE risk_action = 'block') AS blocked_requests,
    COUNT(*) FILTER (WHERE 'IMPOSSIBLE_TRAVEL' = ANY(risk_flags)) AS impossible_travel_events,
    COUNT(*) FILTER (WHERE 'NEW_DEVICE' = ANY(risk_flags)) AS new_device_events,
    COUNT(*) FILTER (WHERE 'AUTOMATED_PATTERN' = ANY(risk_flags)) AS bot_detected_events
FROM security_events
WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================================
-- Nettoyage automatique (données > 90 jours)
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
    DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM security_alerts WHERE resolved = true AND resolved_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Commentaires
-- ============================================================

COMMENT ON TABLE known_devices IS 'Appareils connus par utilisateur — fingerprint + IP + trust status';
COMMENT ON TABLE security_events IS 'Audit trail complet de toutes les actions avec évaluation de risque';
COMMENT ON TABLE security_alerts IS 'Alertes sécurité à résoudre par l''admin — impossible travel, brute force, etc.';
COMMENT ON TABLE ip_whitelist IS 'IPs/plages autorisées — contourne les vérifications de sécurité';
COMMENT ON VIEW v_suspicious_devices IS 'Appareils non-trusted avec activité récente suspecte';
COMMENT ON VIEW v_pending_alerts IS 'Alertes non résolues triées par criticité';
COMMENT ON VIEW v_security_stats_7d IS 'KPIs sécurité des 7 derniers jours';
