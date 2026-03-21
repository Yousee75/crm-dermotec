-- ============================================================
-- Migration 010: Objectifs commerciaux + Coaching + Temps réponse
-- Inspiré HubSpot Goals + noCRM Sales Goals + Pipedrive Insights
-- ============================================================

-- ============================================================
-- 1. Table objectifs_commerciaux — Multi-type, multi-période
-- ============================================================
CREATE TABLE IF NOT EXISTS objectifs_commerciaux (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  membre_id UUID NOT NULL REFERENCES equipe(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ca', 'inscriptions', 'leads_qualifies', 'appels', 'emails', 'rdv')),
  cible NUMERIC NOT NULL,
  realise NUMERIC DEFAULT 0,
  periode TEXT NOT NULL CHECK (periode IN ('hebdo', 'mensuel', 'trimestriel', 'annuel')),
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif', 'atteint', 'echoue', 'annule')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_objectifs_membre ON objectifs_commerciaux(membre_id);
CREATE INDEX idx_objectifs_periode ON objectifs_commerciaux(periode_debut, periode_fin);
CREATE INDEX idx_objectifs_actif ON objectifs_commerciaux(statut) WHERE statut = 'actif';

ALTER TABLE objectifs_commerciaux ENABLE ROW LEVEL SECURITY;

-- Commerciaux voient leurs objectifs, managers voient tout
CREATE POLICY "objectifs_select" ON objectifs_commerciaux
  FOR SELECT USING (
    membre_id = (SELECT id FROM equipe WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "objectifs_manage" ON objectifs_commerciaux
  FOR ALL USING (
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE TRIGGER tr_objectifs_updated
  BEFORE UPDATE ON objectifs_commerciaux
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. Table coaching_notes — Suivi 1-on-1 manager
-- ============================================================
CREATE TABLE IF NOT EXISTS coaching_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES equipe(id),
  commercial_id UUID NOT NULL REFERENCES equipe(id),
  type TEXT NOT NULL CHECK (type IN ('1on1', 'deal_review', 'feedback', 'objectif', 'felicitation')),
  contenu TEXT NOT NULL,
  action_items JSONB DEFAULT '[]',
  lead_id UUID REFERENCES leads(id),
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coaching_commercial ON coaching_notes(commercial_id, created_at DESC);
CREATE INDEX idx_coaching_manager ON coaching_notes(manager_id);

ALTER TABLE coaching_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaching_select" ON coaching_notes
  FOR SELECT USING (
    commercial_id = (SELECT id FROM equipe WHERE auth_user_id = auth.uid())
    OR manager_id = (SELECT id FROM equipe WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "coaching_insert" ON coaching_notes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================================
-- 3. Vue matérialisée: Temps de réponse par commercial
-- Délai entre création lead et premier contact
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_response_time AS
SELECT
  l.commercial_assigne_id AS equipe_id,
  e.prenom || ' ' || e.nom AS nom_complet,
  COUNT(l.id) AS total_leads,
  -- Temps moyen de première réponse (heures)
  ROUND(AVG(
    EXTRACT(EPOCH FROM (
      (SELECT MIN(a.created_at) FROM activites a
       WHERE a.lead_id = l.id AND a.type IN ('CONTACT', 'EMAIL', 'NOTE')
       AND a.user_id = l.commercial_assigne_id)
      - l.created_at
    )) / 3600
  )::NUMERIC, 1) AS temps_reponse_moyen_heures,
  -- Temps médian
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (
      (SELECT MIN(a.created_at) FROM activites a
       WHERE a.lead_id = l.id AND a.type IN ('CONTACT', 'EMAIL', 'NOTE')
       AND a.user_id = l.commercial_assigne_id)
      - l.created_at
    )) / 3600
  ) AS temps_reponse_median_heures,
  -- Leads contactés dans les 2h (gold standard)
  COUNT(l.id) FILTER (WHERE (
    SELECT MIN(a.created_at) FROM activites a
    WHERE a.lead_id = l.id AND a.type IN ('CONTACT', 'EMAIL', 'NOTE')
    AND a.user_id = l.commercial_assigne_id
  ) - l.created_at <= INTERVAL '2 hours') AS leads_contactes_2h,
  -- Leads jamais contactés
  COUNT(l.id) FILTER (WHERE NOT EXISTS (
    SELECT 1 FROM activites a
    WHERE a.lead_id = l.id AND a.type IN ('CONTACT', 'EMAIL', 'NOTE')
    AND a.user_id = l.commercial_assigne_id
  )) AS leads_jamais_contactes,
  NOW() AS refreshed_at
FROM leads l
JOIN equipe e ON l.commercial_assigne_id = e.id
WHERE l.commercial_assigne_id IS NOT NULL
  AND l.created_at >= NOW() - INTERVAL '90 days'
GROUP BY l.commercial_assigne_id, e.prenom, e.nom
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_response_time_idx ON mv_response_time(equipe_id);

-- ============================================================
-- 4. Vue: Forecast pipeline par commercial
-- Pipeline value × taux conversion historique par statut
-- ============================================================
CREATE OR REPLACE VIEW v_forecast_commercial AS
WITH taux_historique AS (
  SELECT
    CASE
      WHEN statut IN ('QUALIFIE') THEN 0.35
      WHEN statut IN ('FINANCEMENT_EN_COURS') THEN 0.55
      WHEN statut IN ('INSCRIT') THEN 0.90
      ELSE 0.10
    END AS taux_conversion_estime,
    statut
  FROM (VALUES ('QUALIFIE'), ('FINANCEMENT_EN_COURS'), ('INSCRIT'), ('CONTACTE')) AS t(statut)
)
SELECT
  e.id AS equipe_id,
  e.prenom || ' ' || e.nom AS nom_complet,
  e.objectif_mensuel,
  -- Pipeline brut
  COUNT(l.id) AS leads_pipeline,
  COALESCE(SUM(f.prix_ht), 0) AS valeur_pipeline_brut,
  -- Forecast pondéré (pipeline × probabilité)
  COALESCE(SUM(f.prix_ht * th.taux_conversion_estime), 0) AS forecast_pondere,
  -- Déjà confirmé (INSCRIT+)
  COALESCE(SUM(f.prix_ht) FILTER (WHERE l.statut IN ('INSCRIT', 'EN_FORMATION')), 0) AS confirme,
  -- Best case (tout le pipeline)
  COALESCE(SUM(f.prix_ht) FILTER (WHERE l.statut IN ('QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT', 'EN_FORMATION')), 0) AS best_case,
  -- Répartition par statut
  COUNT(l.id) FILTER (WHERE l.statut = 'CONTACTE') AS nb_contacte,
  COUNT(l.id) FILTER (WHERE l.statut = 'QUALIFIE') AS nb_qualifie,
  COUNT(l.id) FILTER (WHERE l.statut = 'FINANCEMENT_EN_COURS') AS nb_financement,
  COUNT(l.id) FILTER (WHERE l.statut = 'INSCRIT') AS nb_inscrit
FROM equipe e
LEFT JOIN leads l ON l.commercial_assigne_id = e.id
  AND l.statut IN ('CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS', 'INSCRIT', 'EN_FORMATION')
LEFT JOIN formations f ON l.formation_principale_id = f.id
LEFT JOIN taux_historique th ON l.statut = th.statut
WHERE e.role IN ('commercial', 'manager', 'admin')
  AND e.is_active = true
GROUP BY e.id, e.prenom, e.nom, e.objectif_mensuel;

-- ============================================================
-- 5. Refresh initial
-- ============================================================
REFRESH MATERIALIZED VIEW mv_response_time;

-- ============================================================
-- 6. Fonction refresh (ajouter à la fonction existante)
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_commercial_views()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_response_time;
END;
$$;
