-- ============================================================
-- CRM DERMOTEC — Tracking utilisateur complet
-- Table pour stocker TOUS les événements utilisateur
-- Partitionnement + indexation pour performance
-- ============================================================

-- Table principale des événements utilisateur
CREATE TABLE IF NOT EXISTS user_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,                    -- Type d'événement (page_view, click, etc.)
  page TEXT,                             -- URL/route de la page
  target TEXT,                           -- Élément ciblé (ID, nom, description)
  duration_ms INTEGER,                   -- Durée en millisecondes (pour page_leave)
  metadata JSONB DEFAULT '{}',           -- Données contextuelles
  ip_address TEXT,                       -- IP de l'utilisateur
  user_agent TEXT,                       -- Browser/device info
  client_timestamp TIMESTAMPTZ,          -- Timestamp côté client
  created_at TIMESTAMPTZ DEFAULT NOW()   -- Timestamp serveur (authoritative)
);

-- Index pour performance sur les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_user_events_user_created ON user_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_event ON user_events(event);
CREATE INDEX IF NOT EXISTS idx_user_events_created_day ON user_events(date_trunc('day', created_at));
CREATE INDEX IF NOT EXISTS idx_user_events_page ON user_events(page) WHERE page IS NOT NULL;

-- Index composite pour l'audit par utilisateur + période
CREATE INDEX IF NOT EXISTS idx_user_events_audit ON user_events(user_id, event, created_at DESC);

-- Index GIN pour recherche dans metadata
CREATE INDEX IF NOT EXISTS idx_user_events_metadata ON user_events USING GIN (metadata);

-- Vue pour les KPIs quotidiens (cache les calculs fréquents)
CREATE OR REPLACE VIEW v_daily_activity AS
SELECT
  date_trunc('day', created_at) as jour,
  user_id,
  event,
  page,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as avg_duration_ms,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event
FROM user_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY 1, 2, 3, 4
ORDER BY jour DESC, event_count DESC;

-- Vue pour les sessions utilisateur (groupement par proximité temporelle)
CREATE OR REPLACE VIEW v_user_sessions AS
WITH session_breaks AS (
  SELECT
    user_id,
    created_at,
    event,
    page,
    LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) as prev_event_time,
    CASE
      WHEN LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) IS NULL
      OR EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at))) > 1800 -- 30 min gap = new session
      THEN 1
      ELSE 0
    END as is_session_start
  FROM user_events
  WHERE created_at > NOW() - INTERVAL '7 days'
),
session_ids AS (
  SELECT
    *,
    SUM(is_session_start) OVER (PARTITION BY user_id ORDER BY created_at) as session_number
  FROM session_breaks
)
SELECT
  user_id,
  session_number,
  MIN(created_at) as session_start,
  MAX(created_at) as session_end,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as session_duration_seconds,
  COUNT(*) as events_count,
  COUNT(DISTINCT page) as pages_visited,
  array_agg(DISTINCT page ORDER BY page) as pages_list
FROM session_ids
GROUP BY user_id, session_number
ORDER BY session_start DESC;

-- Vue pour heatmap des heures d'activité
CREATE OR REPLACE VIEW v_activity_heatmap AS
SELECT
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  EXTRACT(DOW FROM created_at) as day_of_week, -- 0=Sunday, 6=Saturday
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM user_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY hour_of_day, day_of_week;

-- Vue pour qui est en ligne (dernière activité < 5 min)
CREATE OR REPLACE VIEW v_users_online AS
SELECT DISTINCT
  ue.user_id,
  p.email,
  p.prenom,
  p.nom,
  MAX(ue.created_at) as last_activity,
  COUNT(*) as recent_events
FROM user_events ue
LEFT JOIN profiles p ON ue.user_id = p.id
WHERE ue.created_at > NOW() - INTERVAL '5 minutes'
GROUP BY ue.user_id, p.email, p.prenom, p.nom
ORDER BY last_activity DESC;

-- Row Level Security (RLS)
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Politique : tous peuvent insérer leurs propres événements
CREATE POLICY "allow_insert_own_events"
ON user_events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR
  -- Permettre au service role d'insérer pour n'importe qui
  auth.role() = 'service_role'
);

-- Politique : seuls les admins peuvent lire tous les événements
CREATE POLICY "admin_read_all_events"
ON user_events
FOR SELECT
TO authenticated
USING (
  -- Vérifie le rôle dans la table profiles
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Politique : les utilisateurs peuvent lire leurs propres événements
CREATE POLICY "read_own_events"
ON user_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS pour les vues (héritent des politiques de la table principale)
-- Pas besoin de RLS spécifique pour les vues en lecture seule

-- Fonction de nettoyage automatique (à exécuter via cron)
CREATE OR REPLACE FUNCTION cleanup_old_user_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprimer les événements de plus de 90 jours
  DELETE FROM user_events
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Log du nettoyage
  RAISE NOTICE 'Cleaned old user_events older than 90 days';
END;
$$;

-- Commenter la table et les colonnes pour la documentation
COMMENT ON TABLE user_events IS 'Tracking complet des actions utilisateur dans le CRM Dermotec';
COMMENT ON COLUMN user_events.event IS 'Type d''événement : page_view, click, lead_edited, etc.';
COMMENT ON COLUMN user_events.metadata IS 'Données contextuelles JSON (lead_id, old_value, etc.)';
COMMENT ON COLUMN user_events.duration_ms IS 'Durée en ms pour les événements temporels (page_leave)';
COMMENT ON COLUMN user_events.client_timestamp IS 'Timestamp côté navigateur';
COMMENT ON COLUMN user_events.created_at IS 'Timestamp serveur (authoritative)';

-- Exemple de requête pour analyser l'usage
/*
-- Top 10 pages les plus visitées aujourd'hui
SELECT page, COUNT(*) as visits
FROM user_events
WHERE event = 'page_view'
  AND date_trunc('day', created_at) = date_trunc('day', NOW())
GROUP BY page
ORDER BY visits DESC
LIMIT 10;

-- Utilisateurs les plus actifs cette semaine
SELECT p.email, p.prenom, p.nom, COUNT(*) as actions
FROM user_events ue
JOIN profiles p ON ue.user_id = p.id
WHERE ue.created_at > NOW() - INTERVAL '7 days'
GROUP BY p.id, p.email, p.prenom, p.nom
ORDER BY actions DESC
LIMIT 10;

-- Temps moyen passé par page
SELECT page,
       COUNT(*) as page_views,
       AVG(duration_ms) / 1000 as avg_seconds
FROM user_events
WHERE event = 'page_leave'
  AND duration_ms IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY page
ORDER BY avg_seconds DESC;
*/