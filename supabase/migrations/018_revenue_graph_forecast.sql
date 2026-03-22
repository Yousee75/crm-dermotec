-- ============================================================
-- CRM DERMOTEC — Migration 018: Revenue Graph + Pipeline Forecast
-- Inspiré Gong Revenue Graph + Gong Forecast
-- ============================================================

-- ===========================================
-- 1. REVENUE GRAPH — Vue unifiée par lead
-- Connecte : lead + inscriptions + financements + activités + formations
-- Usage : Agent IA, dashboard, profil 360°
-- ===========================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_revenue_graph AS
WITH lead_revenue AS (
  SELECT
    lead_id,
    COALESCE(SUM(montant_total) FILTER (WHERE statut IN ('CONFIRMEE','EN_COURS','COMPLETEE')), 0) as ca_realise,
    COALESCE(SUM(montant_total), 0) as ca_total_inscriptions,
    COALESCE(SUM(montant_finance) FILTER (WHERE statut IN ('CONFIRMEE','EN_COURS','COMPLETEE')), 0) as montant_finance,
    COALESCE(SUM(reste_a_charge) FILTER (WHERE statut IN ('CONFIRMEE','EN_COURS','COMPLETEE')), 0) as reste_a_charge,
    COUNT(*) as nb_inscriptions,
    COUNT(*) FILTER (WHERE statut = 'COMPLETEE') as nb_completees,
    COUNT(*) FILTER (WHERE statut = 'ANNULEE' OR statut = 'NO_SHOW') as nb_annulees,
    MAX(created_at) as derniere_inscription
  FROM inscriptions
  WHERE deleted_at IS NULL
  GROUP BY lead_id
),
lead_activities AS (
  SELECT
    lead_id,
    COUNT(*) as nb_activites,
    COUNT(*) FILTER (WHERE type = 'EMAIL') as nb_emails,
    COUNT(*) FILTER (WHERE type = 'CONTACT') as nb_contacts,
    COUNT(*) FILTER (WHERE type = 'NOTE') as nb_notes,
    COUNT(*) FILTER (WHERE type = 'RAPPEL') as nb_rappels,
    MAX(created_at) as derniere_activite,
    MIN(created_at) as premiere_activite
  FROM activites
  GROUP BY lead_id
),
lead_financements AS (
  SELECT
    lead_id,
    COUNT(*) as nb_financements,
    COUNT(*) FILTER (WHERE statut = 'VALIDE' OR statut = 'VERSE') as nb_financements_ok,
    COUNT(*) FILTER (WHERE statut = 'REFUSE') as nb_financements_refuses,
    COUNT(*) FILTER (WHERE statut IN ('PREPARATION','DOCUMENTS_REQUIS','DOSSIER_COMPLET','SOUMIS','EN_EXAMEN','COMPLEMENT_DEMANDE')) as nb_financements_en_cours,
    COALESCE(SUM(montant) FILTER (WHERE statut = 'VALIDE' OR statut = 'VERSE'), 0) as montant_finance_total
  FROM financements
  WHERE deleted_at IS NULL
  GROUP BY lead_id
),
lead_rappels AS (
  SELECT
    lead_id,
    COUNT(*) FILTER (WHERE statut = 'EN_ATTENTE') as rappels_en_attente,
    COUNT(*) FILTER (WHERE statut = 'EN_ATTENTE' AND date_rappel < NOW()) as rappels_overdue,
    MIN(date_rappel) FILTER (WHERE statut = 'EN_ATTENTE' AND date_rappel >= NOW()) as prochain_rappel
  FROM rappels
  GROUP BY lead_id
)
SELECT
  l.id,
  l.prenom,
  l.nom,
  l.email,
  l.telephone,
  l.statut,
  l.score_chaud as score,
  l.source,
  l.priorite,
  l.commercial_assigne_id,
  l.formation_principale_id,
  l.created_at,
  l.updated_at,
  l.date_dernier_contact,
  l.nb_contacts,
  l.statut_pro,
  l.financement_souhaite,
  -- Formation
  f.nom as formation_nom,
  f.prix_ht as formation_prix,
  f.categorie as formation_categorie,
  f.duree_jours as formation_duree,
  -- Commercial
  e.prenom || ' ' || e.nom as commercial_nom,
  -- Revenue (lifetime value)
  COALESCE(lr.ca_realise, 0) as lifetime_value,
  COALESCE(lr.ca_total_inscriptions, 0) as ca_total,
  COALESCE(lr.montant_finance, 0) as montant_finance,
  COALESCE(lr.nb_inscriptions, 0) as nb_inscriptions,
  COALESCE(lr.nb_completees, 0) as nb_formations_completees,
  COALESCE(lr.nb_annulees, 0) as nb_annulees,
  -- Activités
  COALESCE(la.nb_activites, 0) as nb_activites,
  COALESCE(la.nb_emails, 0) as nb_emails,
  COALESCE(la.nb_contacts, 0) as nb_contacts_total,
  COALESCE(la.derniere_activite, l.created_at) as derniere_interaction,
  EXTRACT(DAY FROM NOW() - COALESCE(la.derniere_activite, l.created_at))::INT as jours_sans_activite,
  EXTRACT(DAY FROM NOW() - COALESCE(l.date_dernier_contact, l.created_at))::INT as jours_sans_contact,
  -- Financements
  COALESCE(lf.nb_financements, 0) as nb_financements,
  COALESCE(lf.nb_financements_ok, 0) as nb_financements_ok,
  COALESCE(lf.nb_financements_en_cours, 0) as nb_financements_en_cours,
  COALESCE(lf.nb_financements_refuses, 0) as nb_financements_refuses,
  COALESCE(lf.montant_finance_total, 0) as montant_finance_valide,
  -- Rappels
  COALESCE(lrp.rappels_en_attente, 0) as rappels_en_attente,
  COALESCE(lrp.rappels_overdue, 0) as rappels_overdue,
  lrp.prochain_rappel,
  -- Engagement score calculé (0-100)
  LEAST(100, GREATEST(0, (
    -- Récence contact (0-30)
    CASE
      WHEN l.date_dernier_contact >= NOW() - INTERVAL '3 days' THEN 30
      WHEN l.date_dernier_contact >= NOW() - INTERVAL '7 days' THEN 20
      WHEN l.date_dernier_contact >= NOW() - INTERVAL '14 days' THEN 10
      WHEN l.date_dernier_contact >= NOW() - INTERVAL '30 days' THEN 5
      ELSE 0
    END
    -- Volume activités (0-25)
    + LEAST(25, COALESCE(la.nb_activites, 0) * 3)
    -- Inscriptions (0-25)
    + LEAST(25, COALESCE(lr.nb_inscriptions, 0) * 15)
    -- Financement OK (0-10)
    + CASE WHEN COALESCE(lf.nb_financements_ok, 0) > 0 THEN 10 ELSE 0 END
    -- Financement en cours (0-10)
    + CASE WHEN COALESCE(lf.nb_financements_en_cours, 0) > 0 THEN 10 ELSE 0 END
  )))::INT as engagement_score,
  -- Ancienneté (jours depuis création)
  EXTRACT(DAY FROM NOW() - l.created_at)::INT as anciennete_jours,
  -- Velocity (jours dans le pipeline)
  EXTRACT(DAY FROM NOW() - l.created_at)::INT as jours_dans_pipeline,
  -- Timestamp refresh
  NOW() as refreshed_at
FROM leads l
LEFT JOIN formations f ON f.id = l.formation_principale_id
LEFT JOIN equipe e ON e.id = l.commercial_assigne_id
LEFT JOIN lead_revenue lr ON lr.lead_id = l.id
LEFT JOIN lead_activities la ON la.lead_id = l.id
LEFT JOIN lead_financements lf ON lf.lead_id = l.id
LEFT JOIN lead_rappels lrp ON lrp.lead_id = l.id
WHERE l.statut != 'SPAM'
  AND l.deleted_at IS NULL;

-- Index pour performances
CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_graph_id ON mv_revenue_graph (id);
CREATE INDEX IF NOT EXISTS idx_revenue_graph_statut ON mv_revenue_graph (statut);
CREATE INDEX IF NOT EXISTS idx_revenue_graph_engagement ON mv_revenue_graph (engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_graph_sans_contact ON mv_revenue_graph (jours_sans_contact DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_graph_commercial ON mv_revenue_graph (commercial_assigne_id);
CREATE INDEX IF NOT EXISTS idx_revenue_graph_ltv ON mv_revenue_graph (lifetime_value DESC);

-- ===========================================
-- 2. PIPELINE FORECAST — Vue prévisions CA
-- Probabilités par étape + weighted pipeline
-- ===========================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_pipeline_forecast AS
WITH pipeline_leads AS (
  SELECT
    l.statut,
    l.formation_principale_id,
    f.nom as formation_nom,
    f.prix_ht,
    l.commercial_assigne_id,
    e.prenom || ' ' || e.nom as commercial_nom,
    l.created_at,
    l.updated_at,
    -- Probabilité par étape (basé sur données historiques secteur formation)
    CASE l.statut
      WHEN 'NOUVEAU' THEN 0.05
      WHEN 'CONTACTE' THEN 0.12
      WHEN 'QUALIFIE' THEN 0.30
      WHEN 'FINANCEMENT_EN_COURS' THEN 0.50
      WHEN 'INSCRIT' THEN 0.85
      WHEN 'EN_FORMATION' THEN 0.95
      WHEN 'FORME' THEN 1.0
      WHEN 'ALUMNI' THEN 1.0
      WHEN 'REPORTE' THEN 0.15
      ELSE 0
    END as probabilite,
    -- Valeur pondérée
    COALESCE(f.prix_ht, 0) * CASE l.statut
      WHEN 'NOUVEAU' THEN 0.05
      WHEN 'CONTACTE' THEN 0.12
      WHEN 'QUALIFIE' THEN 0.30
      WHEN 'FINANCEMENT_EN_COURS' THEN 0.50
      WHEN 'INSCRIT' THEN 0.85
      WHEN 'EN_FORMATION' THEN 0.95
      WHEN 'FORME' THEN 1.0
      WHEN 'ALUMNI' THEN 1.0
      WHEN 'REPORTE' THEN 0.15
      ELSE 0
    END as valeur_ponderee
  FROM leads l
  LEFT JOIN formations f ON f.id = l.formation_principale_id
  LEFT JOIN equipe e ON e.id = l.commercial_assigne_id
  WHERE l.statut NOT IN ('PERDU', 'SPAM')
    AND l.deleted_at IS NULL
)
SELECT
  statut,
  COUNT(*) as nb_leads,
  -- Probabilité de l'étape
  MAX(probabilite) as probabilite_etape,
  -- CA brut (si tout converti)
  COALESCE(SUM(prix_ht), 0) as ca_brut,
  -- CA pondéré (CA × probabilité)
  COALESCE(SUM(valeur_ponderee), 0) as ca_pondere,
  -- Prix moyen par lead
  COALESCE(AVG(prix_ht), 0) as prix_moyen,
  -- Timestamp refresh
  NOW() as refreshed_at
FROM pipeline_leads
GROUP BY statut
ORDER BY probabilite DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_forecast_statut ON mv_pipeline_forecast (statut);

-- ===========================================
-- 3. VELOCITY TRACKING — Temps moyen par transition
-- Basé sur field_history (audit trail)
-- ===========================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_pipeline_velocity AS
WITH transitions AS (
  SELECT
    new_value as statut_destination,
    old_value as statut_origine,
    COUNT(*) as nb_transitions,
    AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY lead_id ORDER BY created_at))) / 86400)::NUMERIC(5,1) as duree_moyenne_jours,
    PERCENTILE_CONT(0.5) WITHIN GROUP (
      ORDER BY EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY lead_id ORDER BY created_at))) / 86400
    )::NUMERIC(5,1) as duree_mediane_jours
  FROM field_history
  WHERE field_name = 'statut'
    AND created_at >= NOW() - INTERVAL '6 months'
  GROUP BY new_value, old_value
)
SELECT
  statut_origine,
  statut_destination,
  nb_transitions,
  COALESCE(duree_moyenne_jours, 0) as duree_moyenne_jours,
  COALESCE(duree_mediane_jours, 0) as duree_mediane_jours,
  NOW() as refreshed_at
FROM transitions
WHERE nb_transitions >= 3
ORDER BY nb_transitions DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_velocity_transition
  ON mv_pipeline_velocity (statut_origine, statut_destination);

-- ===========================================
-- 4. WIN PATTERNS — Analyse des leads gagnés
-- Pour le coaching IA
-- ===========================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_win_patterns AS
WITH won_leads AS (
  SELECT
    l.id,
    l.source,
    l.statut_pro,
    l.formation_principale_id,
    f.nom as formation_nom,
    f.categorie as formation_categorie,
    f.prix_ht,
    l.financement_souhaite,
    l.experience_esthetique,
    l.created_at,
    l.updated_at,
    EXTRACT(DAY FROM l.updated_at - l.created_at)::INT as jours_conversion,
    l.commercial_assigne_id,
    e.prenom || ' ' || e.nom as commercial_nom
  FROM leads l
  LEFT JOIN formations f ON f.id = l.formation_principale_id
  LEFT JOIN equipe e ON e.id = l.commercial_assigne_id
  WHERE l.statut IN ('INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI')
    AND l.deleted_at IS NULL
    AND l.updated_at >= NOW() - INTERVAL '6 months'
)
SELECT
  -- Patterns par source
  'source' as dimension,
  source as valeur,
  COUNT(*) as nb_wins,
  AVG(jours_conversion)::INT as delai_moyen_jours,
  AVG(prix_ht)::INT as panier_moyen,
  COUNT(*) FILTER (WHERE financement_souhaite = TRUE) as avec_financement,
  ROUND(100.0 * COUNT(*) FILTER (WHERE financement_souhaite = TRUE) / NULLIF(COUNT(*), 0), 1) as pct_finance,
  NOW() as refreshed_at
FROM won_leads
GROUP BY source
HAVING COUNT(*) >= 2

UNION ALL

SELECT
  'statut_pro' as dimension,
  statut_pro as valeur,
  COUNT(*) as nb_wins,
  AVG(jours_conversion)::INT as delai_moyen_jours,
  AVG(prix_ht)::INT as panier_moyen,
  COUNT(*) FILTER (WHERE financement_souhaite = TRUE) as avec_financement,
  ROUND(100.0 * COUNT(*) FILTER (WHERE financement_souhaite = TRUE) / NULLIF(COUNT(*), 0), 1) as pct_finance,
  NOW() as refreshed_at
FROM won_leads
WHERE statut_pro IS NOT NULL
GROUP BY statut_pro
HAVING COUNT(*) >= 2

UNION ALL

SELECT
  'formation' as dimension,
  formation_nom as valeur,
  COUNT(*) as nb_wins,
  AVG(jours_conversion)::INT as delai_moyen_jours,
  AVG(prix_ht)::INT as panier_moyen,
  COUNT(*) FILTER (WHERE financement_souhaite = TRUE) as avec_financement,
  ROUND(100.0 * COUNT(*) FILTER (WHERE financement_souhaite = TRUE) / NULLIF(COUNT(*), 0), 1) as pct_finance,
  NOW() as refreshed_at
FROM won_leads
WHERE formation_nom IS NOT NULL
GROUP BY formation_nom
HAVING COUNT(*) >= 2

UNION ALL

SELECT
  'commercial' as dimension,
  commercial_nom as valeur,
  COUNT(*) as nb_wins,
  AVG(jours_conversion)::INT as delai_moyen_jours,
  AVG(prix_ht)::INT as panier_moyen,
  COUNT(*) FILTER (WHERE financement_souhaite = TRUE) as avec_financement,
  ROUND(100.0 * COUNT(*) FILTER (WHERE financement_souhaite = TRUE) / NULLIF(COUNT(*), 0), 1) as pct_finance,
  NOW() as refreshed_at
FROM won_leads
WHERE commercial_nom IS NOT NULL
GROUP BY commercial_nom
HAVING COUNT(*) >= 2;

CREATE INDEX IF NOT EXISTS idx_win_patterns_dimension ON mv_win_patterns (dimension);

-- ===========================================
-- 5. FONCTION DE REFRESH
-- À appeler via Inngest toutes les 15 min
-- ===========================================

CREATE OR REPLACE FUNCTION refresh_revenue_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_graph;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pipeline_forecast;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pipeline_velocity;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_win_patterns;
END;
$$;

-- Ajouter le refresh des nouvelles vues dans la fonction existante
-- (appelée par Inngest toutes les 5 min)
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vues existantes
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_kpis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ca_mensuel;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_formation_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_commercial_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_source_attribution;
  -- Nouvelles vues Revenue Graph + Forecast
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_graph;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pipeline_forecast;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pipeline_velocity;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_win_patterns;
END;
$$;

-- ===========================================
-- 6. VUES SIMPLES POUR LE CLIENT SUPABASE
-- (les MV ne sont pas directement accessibles via .from())
-- ===========================================

CREATE OR REPLACE VIEW v_revenue_graph AS SELECT * FROM mv_revenue_graph;
CREATE OR REPLACE VIEW v_pipeline_forecast AS SELECT * FROM mv_pipeline_forecast;
CREATE OR REPLACE VIEW v_pipeline_velocity AS SELECT * FROM mv_pipeline_velocity;
CREATE OR REPLACE VIEW v_win_patterns AS SELECT * FROM mv_win_patterns;

-- RLS sur les vues
ALTER VIEW v_revenue_graph OWNER TO authenticated;
ALTER VIEW v_pipeline_forecast OWNER TO authenticated;
ALTER VIEW v_pipeline_velocity OWNER TO authenticated;
ALTER VIEW v_win_patterns OWNER TO authenticated;
