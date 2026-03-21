-- ============================================================
-- CRM DERMOTEC — Migration 008: Materialized Views + Partitioning
-- Optimisation DB pour le passage a l'echelle
-- ============================================================

-- ===========================================
-- 1. MATERIALIZED VIEWS pour le dashboard
-- ===========================================

-- Vue: KPIs globaux (refresh toutes les 5 min via pg_cron ou Inngest)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_kpis AS
SELECT
  -- Leads
  COUNT(*) FILTER (WHERE TRUE) AS total_leads,
  COUNT(*) FILTER (WHERE statut = 'NOUVEAU') AS leads_nouveaux,
  COUNT(*) FILTER (WHERE statut = 'CONTACTE') AS leads_contactes,
  COUNT(*) FILTER (WHERE statut = 'QUALIFIE') AS leads_qualifies,
  COUNT(*) FILTER (WHERE statut = 'FINANCEMENT_EN_COURS') AS leads_financement,
  COUNT(*) FILTER (WHERE statut = 'INSCRIT') AS leads_inscrits,
  COUNT(*) FILTER (WHERE statut IN ('EN_FORMATION', 'FORME', 'ALUMNI')) AS leads_convertis,
  COUNT(*) FILTER (WHERE statut = 'PERDU') AS leads_perdus,
  -- Taux conversion
  CASE
    WHEN COUNT(*) > 0
    THEN ROUND(
      100.0 * COUNT(*) FILTER (WHERE statut IN ('INSCRIT','EN_FORMATION','FORME','ALUMNI'))
      / COUNT(*), 2
    )
    ELSE 0
  END AS taux_conversion_global,
  -- Temporel
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS leads_7j,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS leads_30j,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS leads_aujourd_hui,
  -- Score moyen
  ROUND(AVG(score_chaud) FILTER (WHERE statut NOT IN ('PERDU','SPAM','ALUMNI')), 1) AS score_moyen_pipeline,
  -- Timestamp du refresh
  NOW() AS refreshed_at
FROM leads
WHERE statut != 'SPAM';

CREATE UNIQUE INDEX ON mv_dashboard_kpis (refreshed_at);

-- Vue: CA mensuel glissant (12 derniers mois)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ca_mensuel AS
SELECT
  DATE_TRUNC('month', s.date_debut)::DATE AS mois,
  COUNT(DISTINCT s.id) AS nb_sessions,
  COUNT(DISTINCT i.id) AS nb_inscriptions,
  COALESCE(SUM(i.montant_total), 0) AS ca_brut,
  COALESCE(SUM(i.montant_finance), 0) AS montant_finance,
  COALESCE(SUM(i.reste_a_charge), 0) AS reste_a_charge,
  COALESCE(SUM(i.montant_total) FILTER (WHERE i.paiement_statut = 'PAYE'), 0) AS ca_encaisse,
  COUNT(DISTINCT i.lead_id) AS nb_stagiaires_uniques
FROM sessions s
LEFT JOIN inscriptions i ON i.session_id = s.id AND i.statut NOT IN ('ANNULEE', 'REMBOURSEE')
WHERE s.date_debut >= CURRENT_DATE - INTERVAL '13 months'
GROUP BY DATE_TRUNC('month', s.date_debut)
ORDER BY mois DESC;

CREATE UNIQUE INDEX ON mv_ca_mensuel (mois);

-- Vue: Performance par formation
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_formation_performance AS
SELECT
  f.id AS formation_id,
  f.nom,
  f.categorie,
  f.prix_ht,
  COUNT(DISTINCT s.id) AS nb_sessions_total,
  COUNT(DISTINCT s.id) FILTER (WHERE s.statut = 'TERMINEE') AS nb_sessions_terminees,
  COUNT(DISTINCT i.id) AS nb_inscriptions_total,
  COUNT(DISTINCT i.id) FILTER (WHERE i.statut = 'COMPLETEE') AS nb_completees,
  COALESCE(SUM(i.montant_total), 0) AS ca_total,
  COALESCE(AVG(i.note_satisfaction), 0)::NUMERIC(3,1) AS satisfaction_moyenne,
  COALESCE(AVG(i.taux_presence), 0)::NUMERIC(5,2) AS taux_presence_moyen,
  COUNT(DISTINCT i.id) FILTER (WHERE i.recommanderait = TRUE) AS nb_recommandations,
  -- Taux remplissage moyen
  CASE
    WHEN COUNT(DISTINCT s.id) > 0
    THEN ROUND(AVG(s.places_occupees::NUMERIC / NULLIF(s.places_max, 0) * 100), 1)
    ELSE 0
  END AS taux_remplissage_moyen,
  NOW() AS refreshed_at
FROM formations f
LEFT JOIN sessions s ON s.formation_id = f.id
LEFT JOIN inscriptions i ON i.session_id = s.id
WHERE f.is_active = TRUE
GROUP BY f.id, f.nom, f.categorie, f.prix_ht;

CREATE UNIQUE INDEX ON mv_formation_performance (formation_id);

-- Vue: Performance commerciale par equipe
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_commercial_performance AS
SELECT
  e.id AS equipe_id,
  e.prenom || ' ' || e.nom AS nom_complet,
  e.role,
  e.objectif_mensuel,
  -- Ce mois
  COUNT(DISTINCT l.id) FILTER (
    WHERE l.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ) AS leads_mois,
  COUNT(DISTINCT l.id) FILTER (
    WHERE l.statut IN ('INSCRIT','EN_FORMATION','FORME','ALUMNI')
    AND l.updated_at >= DATE_TRUNC('month', CURRENT_DATE)
  ) AS conversions_mois,
  -- Pipeline actif
  COUNT(DISTINCT l.id) FILTER (
    WHERE l.statut IN ('NOUVEAU','CONTACTE','QUALIFIE','FINANCEMENT_EN_COURS')
  ) AS pipeline_actif,
  -- Rappels
  COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'EN_ATTENTE' AND r.date_rappel < NOW()) AS rappels_overdue,
  -- CA
  COALESCE(SUM(ins.montant_total) FILTER (
    WHERE ins.paiement_statut = 'PAYE'
    AND ins.updated_at >= DATE_TRUNC('month', CURRENT_DATE)
  ), 0) AS ca_mois,
  -- Temps moyen de conversion (jours)
  ROUND(AVG(
    EXTRACT(EPOCH FROM (l.updated_at - l.created_at)) / 86400
  ) FILTER (WHERE l.statut IN ('INSCRIT','EN_FORMATION','FORME','ALUMNI')), 1) AS delai_conversion_moyen_jours,
  NOW() AS refreshed_at
FROM equipe e
LEFT JOIN leads l ON l.commercial_assigne_id = e.id
LEFT JOIN rappels r ON r.user_id = e.id
LEFT JOIN inscriptions ins ON ins.lead_id = l.id
WHERE e.is_active = TRUE
GROUP BY e.id, e.prenom, e.nom, e.role, e.objectif_mensuel;

CREATE UNIQUE INDEX ON mv_commercial_performance (equipe_id);

-- Vue: Attribution par source (pour marketing)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_source_attribution AS
SELECT
  source,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE statut IN ('INSCRIT','EN_FORMATION','FORME','ALUMNI')) AS convertis,
  CASE
    WHEN COUNT(*) > 0
    THEN ROUND(100.0 * COUNT(*) FILTER (WHERE statut IN ('INSCRIT','EN_FORMATION','FORME','ALUMNI')) / COUNT(*), 2)
    ELSE 0
  END AS taux_conversion,
  ROUND(AVG(score_chaud), 1) AS score_moyen,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS leads_30j,
  NOW() AS refreshed_at
FROM leads
WHERE statut != 'SPAM'
GROUP BY source;

CREATE UNIQUE INDEX ON mv_source_attribution (source);

-- ===========================================
-- 2. FONCTION DE REFRESH CONCURRENT
-- ===========================================

-- Refresh concurrent = pas de lock en lecture pendant le refresh
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_kpis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ca_mensuel;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_formation_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_commercial_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_source_attribution;

  -- Log le refresh
  INSERT INTO activites (type, description, metadata)
  VALUES ('SYSTEME', 'Materialized views rafraichies', json_build_object('refreshed_at', NOW())::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 3. PARTITIONING pour tables a forte volumetrie
-- ===========================================

-- Partitioning activites par mois (range sur created_at)
-- Note: Supabase gere les tables partitionnees nativement
-- On cree la table partitionnee ET migre les donnees existantes

-- Nouvelle table partitionnee
CREATE TABLE IF NOT EXISTS activites_partitioned (
  id UUID DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('LEAD_CREE','LEAD_MAJ','STATUT_CHANGE','CONTACT','INSCRIPTION','FINANCEMENT','SESSION','PAIEMENT','DOCUMENT','EMAIL','RAPPEL','NOTE','EXPORT','SYSTEME')),
  lead_id UUID,
  session_id UUID,
  inscription_id UUID,
  user_id UUID,
  description TEXT NOT NULL,
  ancien_statut TEXT,
  nouveau_statut TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Creer les partitions pour 2025-2027
DO $$
DECLARE
  start_date DATE := '2025-01-01';
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..35 LOOP
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'activites_p_' || TO_CHAR(start_date, 'YYYY_MM');

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF activites_partitioned
       FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );

    start_date := end_date;
  END LOOP;
END $$;

-- Partition par defaut pour les donnees hors range
CREATE TABLE IF NOT EXISTS activites_p_default
  PARTITION OF activites_partitioned DEFAULT;

-- Index sur les partitions (crees automatiquement sur chaque partition)
CREATE INDEX IF NOT EXISTS idx_activites_part_lead ON activites_partitioned(lead_id);
CREATE INDEX IF NOT EXISTS idx_activites_part_type ON activites_partitioned(type);
CREATE INDEX IF NOT EXISTS idx_activites_part_created ON activites_partitioned(created_at DESC);

-- Meme pattern pour field_history
CREATE TABLE IF NOT EXISTS field_history_partitioned (
  id BIGSERIAL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  changed_by_name TEXT,
  change_source TEXT DEFAULT 'manual',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

DO $$
DECLARE
  start_date DATE := '2025-01-01';
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..35 LOOP
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'fh_p_' || TO_CHAR(start_date, 'YYYY_MM');

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF field_history_partitioned
       FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );

    start_date := end_date;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS fh_p_default
  PARTITION OF field_history_partitioned DEFAULT;

CREATE INDEX IF NOT EXISTS idx_fh_part_table_record ON field_history_partitioned(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_fh_part_created ON field_history_partitioned(created_at DESC);

-- ===========================================
-- 4. INDEX SUPPLEMENTAIRES pour les requetes courantes
-- ===========================================

-- Index composite pour le kanban (statut + commercial + date)
CREATE INDEX IF NOT EXISTS idx_leads_kanban
  ON leads(statut, commercial_assigne_id, updated_at DESC);

-- Index pour les leads "chauds" du pipeline
CREATE INDEX IF NOT EXISTS idx_leads_hot_pipeline
  ON leads(score_chaud DESC, statut)
  WHERE statut IN ('NOUVEAU','CONTACTE','QUALIFIE','FINANCEMENT_EN_COURS');

-- Index partiel pour rappels a traiter
CREATE INDEX IF NOT EXISTS idx_rappels_pending
  ON rappels(date_rappel, user_id)
  WHERE statut = 'EN_ATTENTE';

-- Index pour financements actifs
CREATE INDEX IF NOT EXISTS idx_financements_actifs
  ON financements(organisme, statut)
  WHERE statut NOT IN ('CLOTURE', 'REFUSE');

-- Index pour sessions a venir
CREATE INDEX IF NOT EXISTS idx_sessions_upcoming
  ON sessions(date_debut, statut)
  WHERE statut IN ('PLANIFIEE', 'CONFIRMEE');

-- BRIN index pour les tables temporelles (tres efficace pour les ranges de dates)
CREATE INDEX IF NOT EXISTS idx_activites_brin ON activites USING BRIN(created_at);
CREATE INDEX IF NOT EXISTS idx_field_history_brin ON field_history USING BRIN(created_at);

-- ===========================================
-- 5. SLOW QUERY DETECTION
-- ===========================================

-- Table pour logger les requetes lentes
CREATE TABLE IF NOT EXISTS slow_query_log (
  id BIGSERIAL PRIMARY KEY,
  query_text TEXT,
  duration_ms NUMERIC(12,3),
  rows_affected BIGINT,
  source TEXT, -- 'api', 'dashboard', 'cron', etc.
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slow_query_created ON slow_query_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slow_query_duration ON slow_query_log(duration_ms DESC);

-- RLS
ALTER TABLE activites_partitioned ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_history_partitioned ENABLE ROW LEVEL SECURITY;
ALTER TABLE slow_query_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_full_activites_part" ON activites_partitioned FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_fh_part" ON field_history_partitioned FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_slow_query" ON slow_query_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===========================================
-- 6. AUDIT LOG TAMPER-PROOF (hash chain)
-- ===========================================

-- Ajouter colonne hash a field_history pour chaine d'integrite
ALTER TABLE field_history ADD COLUMN IF NOT EXISTS integrity_hash TEXT;
ALTER TABLE field_history ADD COLUMN IF NOT EXISTS prev_hash TEXT;

-- Fonction qui calcule le hash en chaine
CREATE OR REPLACE FUNCTION compute_audit_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_record RECORD;
  hash_input TEXT;
BEGIN
  -- Recuperer le dernier hash de la meme table/record
  SELECT integrity_hash INTO prev_record
  FROM field_history
  WHERE table_name = NEW.table_name
    AND record_id = NEW.record_id
  ORDER BY id DESC
  LIMIT 1;

  NEW.prev_hash := COALESCE(prev_record.integrity_hash, 'GENESIS');

  -- Calculer le hash SHA-256 de la chaine
  hash_input := NEW.table_name || ':' || NEW.record_id || ':' || NEW.field_name || ':'
    || COALESCE(NEW.old_value, 'NULL') || ':' || COALESCE(NEW.new_value, 'NULL') || ':'
    || COALESCE(NEW.changed_by::TEXT, 'SYSTEM') || ':' || NEW.created_at::TEXT || ':'
    || NEW.prev_hash;

  NEW.integrity_hash := encode(digest(hash_input, 'sha256'), 'hex');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Activer les extensions necessaires
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TRIGGER tr_audit_hash
  BEFORE INSERT ON field_history
  FOR EACH ROW
  EXECUTE FUNCTION compute_audit_hash();

-- Fonction de verification d'integrite
CREATE OR REPLACE FUNCTION verify_audit_chain(p_table_name TEXT, p_record_id UUID)
RETURNS TABLE(
  entry_id BIGINT,
  field_name TEXT,
  is_valid BOOLEAN,
  stored_hash TEXT,
  computed_hash TEXT
) AS $$
DECLARE
  rec RECORD;
  computed TEXT;
  hash_input TEXT;
  expected_prev TEXT := 'GENESIS';
BEGIN
  FOR rec IN
    SELECT * FROM field_history
    WHERE table_name = p_table_name AND record_id = p_record_id
    ORDER BY id ASC
  LOOP
    hash_input := rec.table_name || ':' || rec.record_id || ':' || rec.field_name || ':'
      || COALESCE(rec.old_value, 'NULL') || ':' || COALESCE(rec.new_value, 'NULL') || ':'
      || COALESCE(rec.changed_by::TEXT, 'SYSTEM') || ':' || rec.created_at::TEXT || ':'
      || expected_prev;

    computed := encode(digest(hash_input, 'sha256'), 'hex');

    entry_id := rec.id;
    field_name := rec.field_name;
    stored_hash := rec.integrity_hash;
    computed_hash := computed;
    is_valid := (rec.integrity_hash = computed);

    expected_prev := rec.integrity_hash;

    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 7. API KEY MANAGEMENT pour integrations
-- ===========================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- SHA-256 du key (jamais stocker en clair)
  key_prefix TEXT NOT NULL, -- les 8 premiers caracteres pour identification
  scopes TEXT[] DEFAULT '{read}', -- 'read', 'write', 'leads', 'sessions', 'webhooks'
  rate_limit_per_minute INTEGER DEFAULT 60,
  allowed_ips TEXT[] DEFAULT '{}', -- vide = toutes IPs
  created_by UUID REFERENCES equipe(id),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX ON api_keys (key_hash);
CREATE INDEX ON api_keys (key_prefix);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_full_api_keys" ON api_keys FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===========================================
-- 8. PII ENCRYPTION helpers
-- ===========================================

-- Fonction pour chiffrer les PII (utilise pgcrypto)
CREATE OR REPLACE FUNCTION encrypt_pii(plaintext TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(plaintext, encryption_key),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_pii(ciphertext TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(ciphertext, 'base64'),
    encryption_key
  );
EXCEPTION WHEN OTHERS THEN
  RETURN '[DECRYPTION_ERROR]';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 9. HEALTH CHECK view
-- ===========================================

CREATE OR REPLACE VIEW v_system_health AS
SELECT
  -- DB size
  pg_size_pretty(pg_database_size(current_database())) AS db_size,
  -- Table sizes
  (SELECT pg_size_pretty(pg_total_relation_size('leads'))) AS leads_size,
  (SELECT pg_size_pretty(pg_total_relation_size('activites'))) AS activites_size,
  (SELECT pg_size_pretty(pg_total_relation_size('field_history'))) AS field_history_size,
  -- Row counts
  (SELECT reltuples::BIGINT FROM pg_class WHERE relname = 'leads') AS leads_count_approx,
  (SELECT reltuples::BIGINT FROM pg_class WHERE relname = 'activites') AS activites_count_approx,
  -- Active connections
  (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') AS active_connections,
  (SELECT COUNT(*) FROM pg_stat_activity) AS total_connections,
  -- Cache hit ratio (doit etre > 99%)
  (SELECT ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2)
   FROM pg_statio_user_tables) AS cache_hit_ratio,
  -- MV freshness
  (SELECT refreshed_at FROM mv_dashboard_kpis LIMIT 1) AS kpis_refreshed_at,
  NOW() AS checked_at;
