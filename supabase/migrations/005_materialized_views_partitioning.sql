-- ============================================================
-- Migration 005: Materialized Views + Performance Optimization
-- Enterprise-grade: refresh async, index on mat views, partitioning prep
-- ============================================================

-- ============================================================
-- 1. Materialized Views pour Dashboard (refresh async)
-- Avantage : requêtes dashboard < 10ms au lieu de 200-500ms
-- ============================================================

-- KPIs Dashboard (refresh toutes les 5 min)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM leads WHERE statut NOT IN ('SPAM')) AS total_leads,
  (SELECT COUNT(*) FROM leads WHERE statut = 'NOUVEAU') AS nouveaux_leads,
  (SELECT COUNT(*) FROM leads WHERE statut IN ('CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS')) AS pipeline,
  (SELECT COUNT(*) FROM leads WHERE statut IN ('INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI')) AS convertis,
  (SELECT COUNT(*) FROM sessions WHERE statut = 'CONFIRMEE' AND date_debut > NOW()) AS sessions_a_venir,
  (SELECT COUNT(*) FROM rappels WHERE statut = 'EN_ATTENTE' AND date_rappel < NOW()) AS rappels_overdue,
  (SELECT COUNT(*) FROM financements WHERE statut IN ('SOUMIS', 'EN_EXAMEN', 'COMPLEMENT_DEMANDE')) AS financements_en_cours,
  (SELECT COUNT(*) FROM anomalies WHERE statut = 'OUVERTE') AS anomalies_ouvertes,
  (SELECT COUNT(*) FROM smart_actions WHERE statut = 'ACTIVE') AS actions_suggerees,
  (SELECT COALESCE(SUM(montant_total), 0) FROM inscriptions WHERE paiement_statut = 'PAYE' AND created_at >= date_trunc('month', NOW())) AS ca_mois_courant,
  (SELECT COALESCE(AVG(satisfaction), 0) FROM inscriptions WHERE satisfaction IS NOT NULL) AS satisfaction_moyenne,
  NOW() AS refreshed_at
WITH NO DATA;

-- Unique index requis pour REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS mv_dashboard_kpis_idx ON mv_dashboard_kpis (refreshed_at);

-- CA Mensuel (refresh toutes les heures)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ca_mensuel AS
SELECT
  date_trunc('month', i.created_at) AS mois,
  COUNT(*) AS nb_inscriptions,
  COALESCE(SUM(i.montant_total), 0) AS montant_total,
  COALESCE(SUM(i.montant_finance), 0) AS montant_finance,
  COALESCE(SUM(i.reste_a_charge), 0) AS reste_a_charge,
  COALESCE(AVG(i.satisfaction), 0) AS satisfaction_moyenne,
  COALESCE(AVG(i.taux_presence), 0) AS taux_presence_moyen
FROM inscriptions i
WHERE i.paiement_statut = 'PAYE'
GROUP BY date_trunc('month', i.created_at)
ORDER BY mois DESC
LIMIT 24
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_ca_mensuel_idx ON mv_ca_mensuel (mois);

-- Conversion Funnel (refresh toutes les heures)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_conversion_funnel AS
SELECT
  COUNT(*) FILTER (WHERE statut != 'SPAM') AS total,
  COUNT(*) FILTER (WHERE statut = 'NOUVEAU') AS nouveau,
  COUNT(*) FILTER (WHERE statut = 'CONTACTE') AS contacte,
  COUNT(*) FILTER (WHERE statut = 'QUALIFIE') AS qualifie,
  COUNT(*) FILTER (WHERE statut = 'FINANCEMENT_EN_COURS') AS financement,
  COUNT(*) FILTER (WHERE statut = 'INSCRIT') AS inscrit,
  COUNT(*) FILTER (WHERE statut = 'EN_FORMATION') AS en_formation,
  COUNT(*) FILTER (WHERE statut IN ('FORME', 'ALUMNI')) AS forme,
  COUNT(*) FILTER (WHERE statut = 'PERDU') AS perdu,
  CASE WHEN COUNT(*) FILTER (WHERE statut != 'SPAM') > 0
    THEN ROUND(100.0 * COUNT(*) FILTER (WHERE statut IN ('INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI')) / COUNT(*) FILTER (WHERE statut != 'SPAM'), 2)
    ELSE 0
  END AS taux_conversion,
  NOW() AS refreshed_at
FROM leads
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_conversion_funnel_idx ON mv_conversion_funnel (refreshed_at);

-- Performance par Formation (refresh journalier)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_formation_performance AS
SELECT
  f.id AS formation_id,
  f.nom AS formation_nom,
  f.slug,
  f.categorie,
  f.prix_ht,
  COUNT(DISTINCT s.id) AS nb_sessions,
  COUNT(DISTINCT i.id) AS nb_inscrits,
  COALESCE(SUM(i.montant_total) FILTER (WHERE i.paiement_statut = 'PAYE'), 0) AS ca_realise,
  COALESCE(AVG(i.satisfaction), 0) AS satisfaction_moyenne,
  COALESCE(AVG(i.taux_presence), 0) AS taux_presence_moyen,
  COUNT(*) FILTER (WHERE i.certificat_genere = true) AS certificats_generes,
  NOW() AS refreshed_at
FROM formations f
LEFT JOIN sessions s ON s.formation_id = f.id
LEFT JOIN inscriptions i ON i.session_id = s.id
WHERE f.is_active = true
GROUP BY f.id, f.nom, f.slug, f.categorie, f.prix_ht
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_formation_perf_idx ON mv_formation_performance (formation_id);

-- ============================================================
-- 2. Fonction refresh all materialized views
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_kpis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ca_mensuel;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversion_funnel;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_formation_performance;
END;
$$;

-- Refresh initial
SELECT refresh_all_materialized_views();

-- ============================================================
-- 3. Index composites pour requêtes fréquentes
-- ============================================================

-- Leads pipeline (kanban: statut + score + created_at)
CREATE INDEX IF NOT EXISTS idx_leads_pipeline
  ON leads (statut, score_chaud DESC, created_at DESC)
  WHERE statut NOT IN ('SPAM', 'PERDU');

-- Leads commercial dashboard (assigné + statut actif)
CREATE INDEX IF NOT EXISTS idx_leads_commercial
  ON leads (commercial_assigne_id, statut)
  WHERE commercial_assigne_id IS NOT NULL AND statut NOT IN ('SPAM');

-- Inscriptions paiement en attente
CREATE INDEX IF NOT EXISTS idx_inscriptions_paiement_pending
  ON inscriptions (paiement_statut, created_at DESC)
  WHERE paiement_statut IN ('EN_ATTENTE', 'ACOMPTE', 'PARTIEL');

-- Sessions actives par mois
CREATE INDEX IF NOT EXISTS idx_sessions_active_dates
  ON sessions (date_debut, date_fin)
  WHERE statut IN ('PLANIFIEE', 'CONFIRMEE', 'EN_COURS');

-- Activités récentes (timeline)
CREATE INDEX IF NOT EXISTS idx_activites_recent
  ON activites (lead_id, created_at DESC)
  WHERE lead_id IS NOT NULL;

-- ============================================================
-- 4. Table API Keys (pour intégrations)
-- ============================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,           -- SHA-256 du clé
  key_prefix TEXT NOT NULL,                 -- Premiers caractères pour identification
  scopes TEXT[] NOT NULL DEFAULT '{}',      -- Permissions: read:leads, write:leads, etc.
  rate_limit_per_minute INTEGER DEFAULT 60,
  allowed_ips TEXT[] DEFAULT '{}',          -- IP allowlist (vide = toutes)
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count BIGINT DEFAULT 0,
  created_by UUID REFERENCES equipe(id),
  org_id UUID,                              -- Prêt pour multi-tenancy
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_api_keys" ON api_keys FOR ALL
  USING (EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER tr_api_keys_updated
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 5. Préparer multi-tenancy (org_id sur tables critiques)
-- ============================================================

-- Ajouter org_id aux tables principales (nullable pour migration progressive)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'org_id') THEN
    ALTER TABLE leads ADD COLUMN org_id UUID;
    ALTER TABLE sessions ADD COLUMN org_id UUID;
    ALTER TABLE inscriptions ADD COLUMN org_id UUID;
    ALTER TABLE financements ADD COLUMN org_id UUID;
    ALTER TABLE factures ADD COLUMN org_id UUID;
    ALTER TABLE rappels ADD COLUMN org_id UUID;
    ALTER TABLE commandes ADD COLUMN org_id UUID;
    ALTER TABLE equipe ADD COLUMN org_id UUID;

    -- Index pour future RLS multi-tenant
    CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(org_id) WHERE org_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_sessions_org ON sessions(org_id) WHERE org_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_equipe_org ON equipe(org_id) WHERE org_id IS NOT NULL;
  END IF;
END $$;

-- Table Organizations (pour le futur)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter',              -- starter, pro, enterprise
  settings JSONB DEFAULT '{}',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2EC6F3',
  max_users INTEGER DEFAULT 5,
  max_leads INTEGER DEFAULT 1000,
  features TEXT[] DEFAULT '{}',             -- Feature flags par tenant
  billing_email TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_organizations_updated
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
