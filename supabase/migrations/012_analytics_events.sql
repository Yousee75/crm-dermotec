-- ============================================================
-- CRM DERMOTEC — Migration 012
-- Table d'événements analytics pour ML/Deep Learning
-- Capture TOUT : clics, navigations, durées, interactions
-- Données propriété Satorea (données d'usage, art. 6.1.f RGPD)
-- ============================================================

-- Table principale : événements bruts (append-only, partitionnable)
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,

  -- Identification (pseudonymisée)
  session_id TEXT NOT NULL,               -- ID session navigateur (UUID, pas lié à l'auth)
  user_hash TEXT,                         -- SHA-256 du user_id (pseudonymisé, pas le vrai ID)
  org_id TEXT,                            -- Tenant/organisation (pour segmentation)

  -- Événement
  event_name TEXT NOT NULL,               -- ex: 'page_view', 'lead_created', 'button_click'
  event_category TEXT NOT NULL DEFAULT 'interaction', -- 'navigation', 'interaction', 'conversion', 'engagement', 'error', 'performance'

  -- Contexte de la page
  page_path TEXT,                         -- /leads, /pipeline, /lead/xxx
  page_title TEXT,                        -- Titre affiché
  referrer_path TEXT,                     -- Page précédente (interne)

  -- Détails de l'événement
  element_type TEXT,                      -- 'button', 'link', 'input', 'select', 'tab', 'card', 'modal'
  element_id TEXT,                        -- ID ou data-track de l'élément
  element_text TEXT,                      -- Texte du bouton/lien (tronqué 100 chars)
  element_position TEXT,                  -- 'header', 'sidebar', 'main', 'modal', 'footer'

  -- Mesures de durée et engagement
  time_on_page_ms INTEGER,               -- Temps passé sur la page (ms)
  time_to_action_ms INTEGER,             -- Temps entre affichage et action (ms)
  scroll_depth_pct INTEGER,              -- % de scroll atteint (0-100)

  -- Contexte formulaire
  form_name TEXT,                         -- Nom du formulaire (ex: 'create_lead', 'edit_lead')
  form_field TEXT,                        -- Champ modifié (sans la valeur !)
  form_completion_pct INTEGER,            -- % de champs remplis

  -- Conversion tracking
  funnel_step TEXT,                       -- Étape dans un funnel (ex: 'lead_view' → 'lead_edit' → 'lead_save')
  conversion_value NUMERIC(10,2),         -- Valeur business (montant formation, etc.)

  -- Contexte technique
  viewport_width INTEGER,                -- Largeur écran
  viewport_height INTEGER,               -- Hauteur écran
  device_type TEXT,                       -- 'desktop', 'tablet', 'mobile'
  browser TEXT,                           -- 'chrome', 'firefox', 'safari'
  os TEXT,                                -- 'windows', 'macos', 'ios', 'android'
  connection_type TEXT,                   -- '4g', 'wifi', 'ethernet'

  -- Performance
  page_load_ms INTEGER,                  -- Temps de chargement page
  api_latency_ms INTEGER,                -- Latence API de l'action
  error_message TEXT,                     -- Si erreur, le message (sans données perso)

  -- Métadonnées flexibles (pour les événements custom)
  properties JSONB DEFAULT '{}',          -- Données additionnelles structurées

  -- Feature tracking
  feature_name TEXT,                      -- Feature utilisée (ex: 'pipeline_kanban', 'ai_assistant')
  feature_variant TEXT,                   -- A/B test variant si applicable

  -- Horodatage
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Index pour les requêtes ML
  day DATE GENERATED ALWAYS AS (created_at::date) STORED
);

-- Indexes pour les requêtes analytiques et ML
CREATE INDEX idx_ae_session ON analytics_events(session_id);
CREATE INDEX idx_ae_user ON analytics_events(user_hash);
CREATE INDEX idx_ae_event ON analytics_events(event_name);
CREATE INDEX idx_ae_category ON analytics_events(event_category);
CREATE INDEX idx_ae_page ON analytics_events(page_path);
CREATE INDEX idx_ae_day ON analytics_events(day);
CREATE INDEX idx_ae_created ON analytics_events(created_at DESC);
CREATE INDEX idx_ae_feature ON analytics_events(feature_name) WHERE feature_name IS NOT NULL;
CREATE INDEX idx_ae_funnel ON analytics_events(funnel_step) WHERE funnel_step IS NOT NULL;

-- Composite pour les analyses de parcours utilisateur
CREATE INDEX idx_ae_session_time ON analytics_events(session_id, created_at);
CREATE INDEX idx_ae_user_day ON analytics_events(user_hash, day);

-- Table de sessions (agrégation par visite)
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id TEXT PRIMARY KEY,                     -- Session ID
  user_hash TEXT,
  org_id TEXT,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Engagement
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  unique_pages INTEGER DEFAULT 0,
  max_scroll_depth INTEGER DEFAULT 0,

  -- Source
  entry_page TEXT,                         -- Première page visitée
  exit_page TEXT,                          -- Dernière page visitée
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Device
  device_type TEXT,
  browser TEXT,
  os TEXT,
  viewport_width INTEGER,

  -- Conversion
  converted BOOLEAN DEFAULT FALSE,        -- A réalisé une action de valeur
  conversion_type TEXT,                    -- 'lead_created', 'inscription', 'payment'
  conversion_value NUMERIC(10,2),

  -- Parcours (pages visitées en ordre)
  page_sequence TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_as_user ON analytics_sessions(user_hash);
CREATE INDEX idx_as_started ON analytics_sessions(started_at DESC);
CREATE INDEX idx_as_converted ON analytics_sessions(converted) WHERE converted = TRUE;

-- Table de métriques agrégées par jour (pour dashboards rapides)
CREATE TABLE IF NOT EXISTS analytics_daily_metrics (
  day DATE NOT NULL,
  org_id TEXT,

  -- Volumes
  total_sessions INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,

  -- Engagement
  avg_session_duration_ms INTEGER DEFAULT 0,
  avg_pages_per_session NUMERIC(4,1) DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0,       -- Sessions avec 1 seule page

  -- Conversions
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  total_conversion_value NUMERIC(12,2) DEFAULT 0,

  -- Top features
  top_features JSONB DEFAULT '{}',          -- {feature: count}
  top_pages JSONB DEFAULT '{}',             -- {page: views}

  -- Errors
  error_count INTEGER DEFAULT 0,
  avg_page_load_ms INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (day, COALESCE(org_id, '_global'))
);

-- RLS : analytics accessible uniquement par service_role (Satorea)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Pas de policy pour authenticated — seul service_role peut lire
-- Les clients ne voient PAS les données analytics brutes (propriété Satorea)
-- Ils voient uniquement les métriques agrégées via l'API

-- Policy pour INSERT depuis le client (via anon key)
CREATE POLICY "anon_insert_events" ON analytics_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_events_auth" ON analytics_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anon_insert_sessions" ON analytics_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_sessions_auth" ON analytics_sessions FOR INSERT TO authenticated WITH CHECK (true);
-- UPDATE sessions (pour mettre à jour ended_at, duration, etc.)
CREATE POLICY "anon_update_sessions" ON analytics_sessions FOR UPDATE TO anon USING (true);
CREATE POLICY "anon_update_sessions_auth" ON analytics_sessions FOR UPDATE TO authenticated USING (true);

-- Immutable : pas de DELETE sur les events
CREATE RULE no_delete_analytics_events AS ON DELETE TO analytics_events DO INSTEAD NOTHING;
CREATE RULE no_update_analytics_events AS ON UPDATE TO analytics_events DO INSTEAD NOTHING;
