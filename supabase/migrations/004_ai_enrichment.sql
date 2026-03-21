-- ============================================================
-- CRM DERMOTEC — Migration 004 : IA & Enrichissement
-- Tables pour les interactions IA, enrichissement prospect,
-- et logs des cadences automatisées
-- ============================================================

-- 1. Table ai_interactions : historique de toutes les interactions IA
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN (
    'SCORING', 'EMAIL_GENERATION', 'OBJECTION_HANDLING',
    'PROSPECT_RESEARCH', 'NOTE_SUMMARY', 'FINANCEMENT_ANALYSIS',
    'CUSTOM_PROMPT'
  )),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  user_id UUID REFERENCES equipe(id),
  -- Input/Output
  prompt_summary TEXT, -- résumé du prompt (pas le prompt complet pour RGPD)
  response_summary TEXT, -- résumé de la réponse
  response_data JSONB DEFAULT '{}', -- réponse structurée complète
  -- Métriques
  model TEXT, -- ex: "deepseek-chat", "gpt-4o-mini"
  tokens_used INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0, -- coût en centimes
  latency_ms INTEGER DEFAULT 0,
  -- Feedback
  was_useful BOOLEAN, -- le commercial a-t-il trouvé ça utile ?
  was_used BOOLEAN, -- le contenu a-t-il été utilisé ?
  feedback TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_type ON ai_interactions(type);
CREATE INDEX idx_ai_lead ON ai_interactions(lead_id);
CREATE INDEX idx_ai_created ON ai_interactions(created_at DESC);
CREATE INDEX idx_ai_model ON ai_interactions(model);

-- 2. Table prospect_enrichments : données enrichies par recherche IA
CREATE TABLE IF NOT EXISTS prospect_enrichments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  -- Données entreprise
  entreprise_nom TEXT,
  entreprise_siret TEXT,
  entreprise_activite TEXT,
  entreprise_taille TEXT, -- "micro", "tpe", "pme"
  entreprise_ca TEXT,
  entreprise_adresse TEXT,
  entreprise_site_web TEXT,
  -- Données secteur
  secteur TEXT,
  zone_chalandise TEXT,
  concurrents_identifies TEXT[],
  -- Scoring enrichi
  ai_score INTEGER,
  ai_segment TEXT,
  ai_probabilite_conversion INTEGER,
  ai_urgence TEXT,
  ai_next_action TEXT,
  ai_message_personnalise TEXT,
  -- Financement
  organismes_recommandes JSONB DEFAULT '[]',
  reste_a_charge_estime TEXT,
  -- Research
  resume_recherche TEXT,
  talking_points TEXT[],
  opportunites TEXT[],
  risques TEXT[],
  -- Source
  source TEXT CHECK (source IN ('perplexity', 'tavily', 'deepseek', 'manual', 'corporama', 'societecom')),
  -- Metadata
  enriched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days', -- TTL 30 jours
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enrichment_lead ON prospect_enrichments(lead_id);
CREATE INDEX idx_enrichment_expires ON prospect_enrichments(expires_at);
CREATE UNIQUE INDEX idx_enrichment_lead_unique ON prospect_enrichments(lead_id);

-- 3. Table cadence_logs : logs détaillés d'exécution des cadences
CREATE TABLE IF NOT EXISTS cadence_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES cadence_instances(id) ON DELETE CASCADE,
  template_id UUID REFERENCES cadence_templates(id),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  -- Exécution
  etape_numero INTEGER NOT NULL,
  etape_type TEXT NOT NULL, -- APPEL, EMAIL, WHATSAPP, SMS
  etape_titre TEXT,
  -- Résultat
  statut TEXT DEFAULT 'EXECUTE' CHECK (statut IN ('EXECUTE', 'ECHOUE', 'IGNORE', 'SKIP')),
  canal_utilise TEXT, -- email, sms, whatsapp, rappel_cree
  message_envoye TEXT,
  external_id TEXT, -- ID Resend, Twilio SID, etc.
  error_message TEXT,
  -- Metadata
  execution_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cadlog_instance ON cadence_logs(instance_id);
CREATE INDEX idx_cadlog_lead ON cadence_logs(lead_id);
CREATE INDEX idx_cadlog_created ON cadence_logs(created_at DESC);

-- 4. RLS
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_enrichments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_full_ai_interactions" ON ai_interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_prospect_enrichments" ON prospect_enrichments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_cadence_logs" ON cadence_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Vue : coût IA mensuel
CREATE OR REPLACE VIEW v_ai_costs AS
SELECT
  DATE_TRUNC('month', created_at) AS mois,
  type,
  model,
  COUNT(*) AS nb_appels,
  SUM(tokens_used) AS total_tokens,
  SUM(cost_cents) / 100.0 AS cout_euros,
  ROUND(AVG(latency_ms)) AS latence_moyenne_ms,
  COUNT(*) FILTER (WHERE was_useful = true) AS nb_utiles,
  COUNT(*) FILTER (WHERE was_used = true) AS nb_utilises
FROM ai_interactions
GROUP BY DATE_TRUNC('month', created_at), type, model
ORDER BY mois DESC, cout_euros DESC;

-- 6. Vue : performance cadences
CREATE OR REPLACE VIEW v_cadence_performance AS
SELECT
  ct.nom AS cadence_nom,
  ct.declencheur,
  COUNT(DISTINCT ci.id) AS instances_total,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.statut = 'COMPLETEE') AS completees,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.statut = 'ACTIVE') AS actives,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.statut = 'ANNULEE') AS annulees,
  COUNT(cl.id) AS actions_executees,
  COUNT(cl.id) FILTER (WHERE cl.statut = 'ECHOUE') AS actions_echouees,
  ROUND(100.0 * COUNT(DISTINCT ci.id) FILTER (WHERE ci.statut = 'COMPLETEE') / NULLIF(COUNT(DISTINCT ci.id), 0), 1) AS taux_completion
FROM cadence_templates ct
LEFT JOIN cadence_instances ci ON ci.template_id = ct.id
LEFT JOIN cadence_logs cl ON cl.instance_id = ci.id
GROUP BY ct.id, ct.nom, ct.declencheur
ORDER BY instances_total DESC;

-- 7. Vue : enrichissement leads
CREATE OR REPLACE VIEW v_leads_enrichis AS
SELECT
  l.id,
  l.prenom,
  l.nom,
  l.email,
  l.statut,
  l.score_chaud,
  pe.ai_score,
  pe.ai_segment,
  pe.ai_probabilite_conversion,
  pe.ai_urgence,
  pe.ai_next_action,
  pe.organismes_recommandes,
  pe.enriched_at,
  pe.expires_at < NOW() AS enrichissement_expire
FROM leads l
LEFT JOIN prospect_enrichments pe ON pe.lead_id = l.id
ORDER BY COALESCE(pe.ai_score, l.score_chaud) DESC;

-- 8. Ajouter colonnes IA au lead
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_segment TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_next_action TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_scored_at TIMESTAMPTZ;
