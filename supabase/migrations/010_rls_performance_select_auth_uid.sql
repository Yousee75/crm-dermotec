-- ============================================================
-- Migration 010: RLS Performance — (select auth.uid()) wrapper
-- ============================================================
-- PROBLEME: auth.uid() est évalué une fois par LIGNE dans les policies RLS
-- SOLUTION: (select auth.uid()) force PostgreSQL à l'évaluer une seule fois par REQUETE
-- IMPACT: Performance O(N) → O(1) sur toutes les tables avec RLS
-- REF: Supabase docs "Performance best practices for RLS"
-- ============================================================

-- Helper function : évaluation unique par requête (STABLE + SECURITY DEFINER)
CREATE OR REPLACE FUNCTION auth_uid() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT auth.uid()
$$;

-- Helper : rôle de l'utilisateur courant (évaluation unique)
CREATE OR REPLACE FUNCTION auth_role() RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT role FROM public.equipe WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- Helper : equipe_id de l'utilisateur courant (évaluation unique)
CREATE OR REPLACE FUNCTION auth_equipe_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT id FROM public.equipe WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- ============================================================
-- FIELD_HISTORY : lecture admin/manager
-- ============================================================
DROP POLICY IF EXISTS "field_history_read_admin" ON field_history;
CREATE POLICY "field_history_read_admin" ON field_history
  FOR SELECT USING (
    (select auth_role()) IN ('admin', 'manager')
  );

-- ============================================================
-- LOGIN_LOGS : lecture admin
-- ============================================================
DROP POLICY IF EXISTS "login_logs_read_admin" ON login_logs;
CREATE POLICY "login_logs_read_admin" ON login_logs
  FOR SELECT USING (
    (select auth_role()) = 'admin'
  );

-- ============================================================
-- SMART_ACTIONS : user assigné ou admin/manager
-- ============================================================
DROP POLICY IF EXISTS "smart_actions_read_own" ON smart_actions;
CREATE POLICY "smart_actions_read_own" ON smart_actions
  FOR SELECT USING (
    user_id = (select auth_equipe_id())
    OR (select auth_role()) IN ('admin', 'manager')
  );

DROP POLICY IF EXISTS "smart_actions_update_own" ON smart_actions;
CREATE POLICY "smart_actions_update_own" ON smart_actions
  FOR UPDATE USING (
    user_id = (select auth_equipe_id())
    OR (select auth_role()) IN ('admin', 'manager')
  );

-- ============================================================
-- ANOMALIES : admin/manager lecture, admin update
-- ============================================================
DROP POLICY IF EXISTS "anomalies_read" ON anomalies;
CREATE POLICY "anomalies_read" ON anomalies
  FOR SELECT USING (
    (select auth_role()) IN ('admin', 'manager')
  );

DROP POLICY IF EXISTS "anomalies_update_admin" ON anomalies;
CREATE POLICY "anomalies_update_admin" ON anomalies
  FOR UPDATE USING (
    (select auth_role()) = 'admin'
  );

-- ============================================================
-- EQUIPE : soi-même ou admin
-- ============================================================
DROP POLICY IF EXISTS "equipe_update" ON equipe;
CREATE POLICY "equipe_update" ON equipe
  FOR UPDATE USING (
    auth_user_id = (select auth.uid())
    OR (select auth_role()) = 'admin'
  );

DROP POLICY IF EXISTS "equipe_insert_admin" ON equipe;
CREATE POLICY "equipe_insert_admin" ON equipe
  FOR INSERT WITH CHECK (
    (select auth_role()) = 'admin'
  );

DROP POLICY IF EXISTS "equipe_delete_admin" ON equipe;
CREATE POLICY "equipe_delete_admin" ON equipe
  FOR DELETE USING (
    (select auth_role()) = 'admin'
  );

-- ============================================================
-- ACTIVITES : user, commercial (ses leads), formatrice (ses sessions), admin
-- ============================================================
DROP POLICY IF EXISTS "activites_select" ON activites;
CREATE POLICY "activites_select" ON activites
  FOR SELECT USING (
    (select auth_role()) IN ('admin', 'manager')
    OR lead_id IN (
      SELECT id FROM leads WHERE commercial_assigne_id = (select auth_equipe_id())
    )
    OR session_id IN (
      SELECT id FROM sessions WHERE formatrice_id = (select auth_equipe_id())
    )
    OR user_id = (select auth_equipe_id())
  );

-- ============================================================
-- NOTES_LEAD : privacy commerciale
-- ============================================================
DROP POLICY IF EXISTS "notes_lead_select" ON notes_lead;
CREATE POLICY "notes_lead_select" ON notes_lead
  FOR SELECT USING (
    (select auth_role()) IN ('admin', 'manager')
    OR lead_id IN (
      SELECT id FROM leads WHERE commercial_assigne_id = (select auth_equipe_id())
    )
    OR user_id = (select auth_equipe_id())
  );

DROP POLICY IF EXISTS "notes_lead_update" ON notes_lead;
CREATE POLICY "notes_lead_update" ON notes_lead
  FOR UPDATE USING (
    user_id = (select auth_equipe_id())
    OR (select auth_role()) IN ('admin', 'manager')
  );

-- ============================================================
-- WEBHOOK_EVENTS : admin/manager
-- ============================================================
DROP POLICY IF EXISTS "webhook_events_select" ON webhook_events;
DROP POLICY IF EXISTS "auth_admin_webhook_events" ON webhook_events;
CREATE POLICY "webhook_events_select" ON webhook_events
  FOR SELECT USING (
    (select auth_role()) IN ('admin', 'manager')
  );

-- ============================================================
-- CONSENT_LOGS : admin/manager
-- ============================================================
DROP POLICY IF EXISTS "consent_logs_select" ON consent_logs;
DROP POLICY IF EXISTS "auth_admin_consent_logs" ON consent_logs;
CREATE POLICY "consent_logs_select" ON consent_logs
  FOR SELECT USING (
    (select auth_role()) IN ('admin', 'manager')
  );

-- ============================================================
-- API_KEYS : admin uniquement
-- ============================================================
DROP POLICY IF EXISTS "api_keys_admin" ON api_keys;
CREATE POLICY "api_keys_admin" ON api_keys
  FOR ALL USING (
    (select auth_role()) = 'admin'
  );

-- ============================================================
-- RAPPELS : user assigné ou admin/manager
-- ============================================================
DROP POLICY IF EXISTS "rappels_select" ON rappels;
DROP POLICY IF EXISTS "auth_full_rappels" ON rappels;
CREATE POLICY "rappels_select" ON rappels
  FOR SELECT USING (
    user_id = (select auth_equipe_id())
    OR (select auth_role()) IN ('admin', 'manager')
    OR lead_id IN (
      SELECT id FROM leads WHERE commercial_assigne_id = (select auth_equipe_id())
    )
  );

-- ============================================================
-- INDEX performance pour les sous-requêtes RLS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_commercial_assigne ON leads(commercial_assigne_id);
CREATE INDEX IF NOT EXISTS idx_sessions_formatrice ON sessions(formatrice_id);
CREATE INDEX IF NOT EXISTS idx_activites_user ON activites(user_id);
CREATE INDEX IF NOT EXISTS idx_activites_lead ON activites(lead_id);
CREATE INDEX IF NOT EXISTS idx_activites_session ON activites(session_id);
CREATE INDEX IF NOT EXISTS idx_rappels_user ON rappels(user_id);
CREATE INDEX IF NOT EXISTS idx_rappels_lead ON rappels(lead_id);
CREATE INDEX IF NOT EXISTS idx_notes_lead_user ON notes_lead(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_lead_lead ON notes_lead(lead_id);
