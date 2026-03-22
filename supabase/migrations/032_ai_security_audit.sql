-- ============================================================
-- CRM SATOREA — Migration 032: AI Security Audit
-- Tables pour l'audit du chatbot IA, détection injection,
-- et monitoring de l'intégrité du système
-- ============================================================

-- Table 1 : Audit trail de toutes les conversations IA
CREATE TABLE IF NOT EXISTS ai_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    -- Session
    session_id TEXT NOT NULL, -- Identifiant unique de la conversation
    -- Requête
    user_message TEXT NOT NULL,
    user_message_length INTEGER,
    -- Réponse
    assistant_response TEXT,
    model_used TEXT, -- claude-sonnet, deepseek, etc. (opaque en prod)
    tokens_input INTEGER,
    tokens_output INTEGER,
    -- Tools
    tools_called TEXT[] DEFAULT '{}', -- Liste des tools appelés
    tools_count INTEGER DEFAULT 0,
    -- Sécurité
    prompt_injection_detected BOOLEAN DEFAULT false,
    jailbreak_detected BOOLEAN DEFAULT false,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_flags TEXT[] DEFAULT '{}',
    blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    -- Performance
    latency_ms INTEGER,
    -- Meta
    ip_address TEXT,
    device_fingerprint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_user ON ai_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_session ON ai_audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_risk ON ai_audit_log(risk_score DESC) WHERE risk_score > 0;
CREATE INDEX IF NOT EXISTS idx_ai_audit_injection ON ai_audit_log(created_at DESC) WHERE prompt_injection_detected = true;
CREATE INDEX IF NOT EXISTS idx_ai_audit_blocked ON ai_audit_log(created_at DESC) WHERE blocked = true;
CREATE INDEX IF NOT EXISTS idx_ai_audit_date ON ai_audit_log(created_at DESC);

-- Table 2 : Tentatives d'injection détectées (pour analyse)
CREATE TABLE IF NOT EXISTS ai_injection_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    -- Payload
    original_prompt TEXT NOT NULL, -- Le prompt original (avant sanitization)
    sanitized_prompt TEXT, -- Le prompt après sanitization
    -- Analyse
    injection_type TEXT NOT NULL CHECK (injection_type IN (
        'system_override', -- "ignore previous instructions"
        'role_hijack', -- "you are now a..."
        'env_access', -- "process.env.API_KEY"
        'code_execution', -- "eval(", "exec("
        'sql_injection', -- "DROP TABLE"
        'data_exfiltration', -- tentative d'extraire des données
        'jailbreak', -- DAN, roleplay
        'encoding_trick', -- base64, ROT13
        'indirect', -- injection via les données (lead name, notes)
        'unknown'
    )),
    technique TEXT, -- description plus détaillée
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    -- Contexte
    ip_address TEXT,
    user_agent TEXT,
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_injection_user ON ai_injection_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_injection_type ON ai_injection_attempts(injection_type);
CREATE INDEX IF NOT EXISTS idx_ai_injection_severity ON ai_injection_attempts(severity, created_at DESC);

-- Table 3 : Health checks du système IA
CREATE TABLE IF NOT EXISTS ai_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Check
    check_type TEXT NOT NULL CHECK (check_type IN (
        'system_prompt_integrity', -- Le system prompt n'a pas été modifié
        'tools_integrity', -- Les tools sont les mêmes
        'kb_integrity', -- La knowledge base n'a pas été empoisonnée
        'rate_limits_active', -- Les limites sont en place
        'model_availability', -- Les modèles IA répondent
        'injection_scan', -- Scan des données pour détecter des payloads
        'full_check' -- Toutes les vérifications
    )),
    -- Résultat
    healthy BOOLEAN NOT NULL,
    issues TEXT[] DEFAULT '{}',
    details JSONB DEFAULT '{}',
    -- Meta
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_health_date ON ai_health_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_health_unhealthy ON ai_health_checks(created_at DESC) WHERE healthy = false;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_injection_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_health_checks ENABLE ROW LEVEL SECURITY;

-- Seul service_role peut lire/écrire (données sensibles)
CREATE POLICY "ai_audit_service" ON ai_audit_log FOR ALL TO service_role USING (true);
CREATE POLICY "ai_injection_service" ON ai_injection_attempts FOR ALL TO service_role USING (true);
CREATE POLICY "ai_health_service" ON ai_health_checks FOR ALL TO service_role USING (true);

-- Les admins peuvent voir les audits (lecture seule)
CREATE POLICY "ai_audit_admin_read" ON ai_audit_log FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM equipe WHERE auth_user_id = (SELECT auth.uid()) AND role IN ('admin', 'manager')
    ));

CREATE POLICY "ai_injection_admin_read" ON ai_injection_attempts FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM equipe WHERE auth_user_id = (SELECT auth.uid()) AND role IN ('admin', 'manager')
    ));

-- ============================================================
-- Vues pour le monitoring
-- ============================================================

-- Vue : statistiques IA des 7 derniers jours
CREATE OR REPLACE VIEW v_ai_security_stats_7d AS
SELECT
    COUNT(*) AS total_conversations,
    COUNT(*) FILTER (WHERE prompt_injection_detected) AS injection_attempts,
    COUNT(*) FILTER (WHERE jailbreak_detected) AS jailbreak_attempts,
    COUNT(*) FILTER (WHERE blocked) AS blocked_requests,
    COUNT(DISTINCT user_id) AS unique_users,
    AVG(risk_score) FILTER (WHERE risk_score > 0) AS avg_risk_score,
    MAX(risk_score) AS max_risk_score,
    SUM(tokens_input + tokens_output) AS total_tokens,
    AVG(latency_ms) AS avg_latency_ms,
    -- Top threats
    (SELECT array_agg(DISTINCT unnest) FROM unnest(
        (SELECT array_agg(flag) FROM ai_audit_log, unnest(risk_flags) AS flag
         WHERE created_at > NOW() - INTERVAL '7 days' AND risk_score > 30)
    )) AS top_risk_flags
FROM ai_audit_log
WHERE created_at > NOW() - INTERVAL '7 days';

-- Vue : users suspects (trop d'injections)
CREATE OR REPLACE VIEW v_ai_suspicious_users AS
SELECT
    user_id,
    COUNT(*) AS total_attempts,
    COUNT(DISTINCT injection_type) AS unique_techniques,
    MAX(severity) AS max_severity,
    MAX(created_at) AS last_attempt,
    array_agg(DISTINCT injection_type) AS techniques_used
FROM ai_injection_attempts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id
HAVING COUNT(*) >= 3
ORDER BY total_attempts DESC;

-- ============================================================
-- Fonction de nettoyage (données > 90 jours)
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_old_ai_audit()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_audit_log WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM ai_injection_attempts WHERE created_at < NOW() - INTERVAL '180 days'; -- Garder plus longtemps
    DELETE FROM ai_health_checks WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Commentaires
-- ============================================================

COMMENT ON TABLE ai_audit_log IS 'Audit trail de toutes les conversations IA — détection injection et jailbreak';
COMMENT ON TABLE ai_injection_attempts IS 'Tentatives de prompt injection détectées — pour analyse et amélioration des défenses';
COMMENT ON TABLE ai_health_checks IS 'Résultats des vérifications d''intégrité du système IA';
COMMENT ON VIEW v_ai_security_stats_7d IS 'Dashboard sécurité IA — KPIs des 7 derniers jours';
COMMENT ON VIEW v_ai_suspicious_users IS 'Utilisateurs suspects — 3+ tentatives d''injection en 30 jours';
