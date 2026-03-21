-- ============================================================
-- Migration 009: Security Hardening
-- Fix RLS audit tables + index auth_user_id + equipe policies
-- ============================================================

-- ============================================================
-- 1. CRITICAL: Restreindre les tables d'audit (immutabilité)
-- Les tables d'audit ne doivent JAMAIS être modifiables par les users
-- ============================================================

-- field_history : lecture admin/manager, insert uniquement par triggers
DROP POLICY IF EXISTS "auth_full_field_history" ON field_history;
CREATE POLICY "field_history_read_admin" ON field_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );
-- Les inserts sont faits par les triggers (SECURITY DEFINER), pas par les users

-- login_logs : lecture admin uniquement
DROP POLICY IF EXISTS "auth_full_login_logs" ON login_logs;
CREATE POLICY "login_logs_read_admin" ON login_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role = 'admin')
  );
-- Insert via trigger/service role uniquement

-- smart_actions : lecture pour l'user assigné, CRUD admin
DROP POLICY IF EXISTS "auth_full_smart_actions" ON smart_actions;
CREATE POLICY "smart_actions_read_own" ON smart_actions
  FOR SELECT USING (
    user_id = (SELECT id FROM equipe WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );
CREATE POLICY "smart_actions_update_own" ON smart_actions
  FOR UPDATE USING (
    user_id = (SELECT id FROM equipe WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- anomalies : lecture admin/manager, update admin
DROP POLICY IF EXISTS "auth_full_anomalies" ON anomalies;
CREATE POLICY "anomalies_read" ON anomalies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );
CREATE POLICY "anomalies_update_admin" ON anomalies
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 2. HIGH: Index sur equipe.auth_user_id (perf RLS)
-- Chaque policy RLS fait un lookup equipe WHERE auth_user_id = auth.uid()
-- Sans index = full table scan à CHAQUE requête
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_equipe_auth_user_id ON equipe(auth_user_id);

-- ============================================================
-- 3. HIGH: RLS policies sur equipe (données personnelles internes)
-- ============================================================

-- Tout le monde peut lire les infos de base (nom, rôle) pour l'affichage
-- Seuls admin/manager peuvent voir les détails sensibles
DROP POLICY IF EXISTS "equipe_select_basic" ON equipe;
CREATE POLICY "equipe_select_basic" ON equipe
  FOR SELECT USING (true); -- Nécessaire pour les lookups FK (commercial_assigne)

-- Update : soi-même ou admin
DROP POLICY IF EXISTS "equipe_update" ON equipe;
CREATE POLICY "equipe_update" ON equipe
  FOR UPDATE USING (
    auth_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM equipe e2 WHERE e2.auth_user_id = auth.uid() AND e2.role = 'admin')
  );

-- Insert/Delete : admin uniquement
DROP POLICY IF EXISTS "equipe_insert_admin" ON equipe;
CREATE POLICY "equipe_insert_admin" ON equipe
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "equipe_delete_admin" ON equipe;
CREATE POLICY "equipe_delete_admin" ON equipe
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 4. HIGH: RLS sur activites (chaque user voit ses leads)
-- ============================================================

-- Politique existante peut être trop permissive
-- Admin/manager voient tout, commerciaux voient leurs leads
DROP POLICY IF EXISTS "activites_select" ON activites;
CREATE POLICY "activites_select" ON activites
  FOR SELECT USING (
    -- Admin/manager : tout voir
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
    OR
    -- Commercial : activités de ses leads
    lead_id IN (
      SELECT id FROM leads WHERE commercial_assigne_id = (
        SELECT id FROM equipe WHERE auth_user_id = auth.uid()
      )
    )
    OR
    -- Formatrice : activités de ses sessions
    session_id IN (
      SELECT id FROM sessions WHERE formatrice_id = (
        SELECT id FROM equipe WHERE auth_user_id = auth.uid()
      )
    )
    OR
    -- Ses propres activités
    user_id = (SELECT id FROM equipe WHERE auth_user_id = auth.uid())
  );

-- Insert : tout authenticated (logging non-bloquant)
DROP POLICY IF EXISTS "activites_insert" ON activites;
CREATE POLICY "activites_insert" ON activites
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 5. RLS sur notes_lead (privacy commerciale)
-- ============================================================

DROP POLICY IF EXISTS "notes_lead_select" ON notes_lead;
CREATE POLICY "notes_lead_select" ON notes_lead
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
    OR
    lead_id IN (
      SELECT id FROM leads WHERE commercial_assigne_id = (
        SELECT id FROM equipe WHERE auth_user_id = auth.uid()
      )
    )
    OR
    user_id = (SELECT id FROM equipe WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "notes_lead_insert" ON notes_lead
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notes_lead_update" ON notes_lead
  FOR UPDATE USING (
    user_id = (SELECT id FROM equipe WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM equipe WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- ============================================================
-- 6. Stripe : ajouter idempotency_key aux inscriptions
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inscriptions' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE inscriptions ADD COLUMN idempotency_key TEXT UNIQUE;
  END IF;
END $$;
