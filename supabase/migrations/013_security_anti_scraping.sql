-- ============================================================
-- CRM DERMOTEC — Security Events & Anti-Scraping Infrastructure
-- Migration 013: Tables et index pour le monitoring de sécurité
-- ============================================================

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table principale pour tous les événements de sécurité
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Utilisateur concerné (peut être NULL pour les événements IP-based)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type d'événement de sécurité
  event_type TEXT NOT NULL CHECK (event_type IN (
    'rate_limit_hit',         -- Limite de requêtes atteinte
    'export_blocked',         -- Export bloqué (trop fréquent)
    'export_authorized',      -- Export autorisé (pour tracking)
    'impossible_travel',      -- Voyage impossible détecté
    'scraping_detected',      -- Pattern de scraping détecté
    'secret_exposed',         -- Secret détecté dans le code
    'large_response',         -- Réponse trop volumineuse
    'suspicious_pagination',  -- Pagination suspecte
    'session_revoked',        -- Session révoquée pour sécurité
    'login_anomaly',          -- Connexion anormale
    'data_breach_attempt',    -- Tentative d'accès non autorisé
    'malicious_file_upload',  -- Upload de fichier malveillant
    'sql_injection_attempt', -- Tentative d'injection SQL
    'xss_attempt'            -- Tentative XSS
  )),

  -- Niveau de sévérité
  severity TEXT DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),

  -- Informations réseau
  ip_address TEXT,
  user_agent TEXT,
  endpoint TEXT,              -- URL/endpoint concerné

  -- Métadonnées spécifiques à l'événement (JSON flexible)
  metadata JSONB DEFAULT '{}',

  -- Horodatage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_security_events_user_id
  ON security_events(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_security_events_type
  ON security_events(event_type);

CREATE INDEX IF NOT EXISTS idx_security_events_severity
  ON security_events(severity)
  WHERE severity IN ('CRITICAL', 'WARNING');

CREATE INDEX IF NOT EXISTS idx_security_events_created_at
  ON security_events(created_at DESC);

-- Index composite pour les requêtes de monitoring
CREATE INDEX IF NOT EXISTS idx_security_events_monitoring
  ON security_events(event_type, severity, created_at DESC);

-- Index sur l'IP pour détecter les patterns par adresse
CREATE INDEX IF NOT EXISTS idx_security_events_ip
  ON security_events(ip_address)
  WHERE ip_address IS NOT NULL;

-- Index GIN pour recherche dans les métadonnées JSON
CREATE INDEX IF NOT EXISTS idx_security_events_metadata
  ON security_events USING GIN (metadata);

-- Table des seuils et règles de sécurité (configurable)
CREATE TABLE IF NOT EXISTS security_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Nom de la règle
  rule_name TEXT NOT NULL UNIQUE,

  -- Type de règle
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'rate_limit',
    'export_limit',
    'travel_detection',
    'response_size',
    'pagination_limit'
  )),

  -- Configuration de la règle (JSON)
  config JSONB NOT NULL DEFAULT '{}',

  -- État de la règle
  enabled BOOLEAN DEFAULT true,

  -- Métadonnées
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion des règles par défaut
INSERT INTO security_rules (rule_name, rule_type, config, description) VALUES
(
  'api_rate_limit',
  'rate_limit',
  '{"requests_per_window": 50, "window_minutes": 5, "endpoints": ["GET"]}',
  'Limite de 50 requêtes GET par endpoint en 5 minutes'
),
(
  'export_frequency',
  'export_limit',
  '{"exports_per_hour": 1, "types": ["csv", "json", "pdf"]}',
  'Maximum 1 export de données par heure'
),
(
  'impossible_travel',
  'travel_detection',
  '{"max_speed_kmh": 900, "min_distance_km": 500, "min_time_minutes": 60}',
  'Détection de voyages impossibles entre connexions'
),
(
  'response_size_limit',
  'response_size',
  '{"max_size_kb": 500}',
  'Alert si réponse API > 500Ko'
),
(
  'pagination_limit',
  'pagination_limit',
  '{"max_per_page": 100}',
  'Limite de pagination forcée à 100 résultats'
);

-- Vue pour les alertes de sécurité récentes
CREATE OR REPLACE VIEW security_alerts AS
SELECT
  se.id,
  se.event_type,
  se.severity,
  se.ip_address,
  se.endpoint,
  se.metadata,
  se.created_at,
  u.email as user_email,
  u.id as user_id
FROM security_events se
LEFT JOIN auth.users u ON se.user_id = u.id
WHERE se.severity IN ('CRITICAL', 'WARNING')
  AND se.created_at >= NOW() - INTERVAL '7 days'
ORDER BY se.created_at DESC;

-- Vue pour les statistiques de sécurité par jour
CREATE OR REPLACE VIEW security_stats_daily AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  event_type,
  severity,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM security_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), event_type, severity
ORDER BY date DESC, event_count DESC;

-- Fonction pour nettoyer les anciens événements (à appeler via cron)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les événements de plus de 90 jours, sauf CRITICAL
  DELETE FROM security_events
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND severity != 'CRITICAL';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log l'opération de nettoyage
  INSERT INTO security_events (event_type, severity, metadata) VALUES (
    'cleanup_completed',
    'INFO',
    jsonb_build_object('deleted_events', deleted_count, 'cleanup_date', NOW())
  );

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) pour protéger l'accès aux données de sécurité
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_rules ENABLE ROW LEVEL SECURITY;

-- Politique: seuls les admins peuvent voir les événements de sécurité
CREATE POLICY "admin_only_security_events" ON security_events
FOR ALL TO authenticated
USING (
  (auth.jwt() ->> 'role') = 'admin'
  OR
  (auth.jwt() ->> 'role') = 'manager'
);

-- Politique: seuls les super-admins peuvent modifier les règles
CREATE POLICY "super_admin_only_security_rules" ON security_rules
FOR ALL TO authenticated
USING ((auth.jwt() ->> 'role') = 'admin');

-- Trigger pour mettre à jour updated_at sur security_rules
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_security_rules_updated_at
  BEFORE UPDATE ON security_rules
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE security_events IS 'Journal des événements de sécurité - anti-scraping, travel detection, rate limiting';
COMMENT ON TABLE security_rules IS 'Configuration des règles de sécurité modifiables par les admins';
COMMENT ON VIEW security_alerts IS 'Vue des alertes critiques et warnings des 7 derniers jours';
COMMENT ON VIEW security_stats_daily IS 'Statistiques journalières des événements de sécurité (30 jours)';
COMMENT ON FUNCTION cleanup_old_security_events() IS 'Fonction de nettoyage automatique des anciens événements (à appeler via cron)';

COMMENT ON COLUMN security_events.metadata IS 'Données contextuelles de l''événement au format JSON (flexible selon le type)';
COMMENT ON COLUMN security_events.event_type IS 'Type d''événement standardisé pour classification et alertes';
COMMENT ON COLUMN security_events.severity IS 'Niveau de criticité: INFO (monitoring), WARNING (suspect), CRITICAL (blocage)';