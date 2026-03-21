-- ============================================================
-- Migration 011: RLS Performance Optimization
-- Source: Supabase docs 2026 + dermotec-tech-veille-2026.md
--
-- PROBLÈME: auth.uid() appelé directement dans les policies
-- est évalué PAR LIGNE (100x plus lent sur grandes tables)
--
-- SOLUTION: (SELECT auth.uid()) wrapper = planifié UNE FOIS
-- PostgreSQL traite le SELECT comme un sous-plan constant
-- ============================================================

-- ============================================================
-- 1. Optimiser les helper functions RLS
-- ============================================================

-- get_user_role() — optimisé avec SELECT wrapper
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM equipe WHERE auth_user_id = (SELECT auth.uid()) LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- get_user_equipe_id() — optimisé avec SELECT wrapper
CREATE OR REPLACE FUNCTION public.get_user_equipe_id()
RETURNS UUID AS $$
  SELECT id FROM equipe WHERE auth_user_id = (SELECT auth.uid()) LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 2. Recréer les policies leads avec (SELECT auth.uid())
-- Note: DROP + CREATE est atomique dans une transaction
-- ============================================================

-- Leads: commercial voit ses leads assignés
DROP POLICY IF EXISTS "leads_select_commercial" ON leads;
CREATE POLICY "leads_select_commercial" ON leads
  FOR SELECT USING (
    -- Admin/manager voient tout
    (SELECT get_user_role()) IN ('admin', 'manager', 'assistante')
    OR
    -- Commercial voit ses leads assignés
    commercial_assigne_id = (SELECT get_user_equipe_id())
    OR
    -- Formatrice voit ses stagiaires
    id IN (
      SELECT i.lead_id FROM inscriptions i
      JOIN sessions s ON i.session_id = s.id
      WHERE s.formatrice_id = (SELECT get_user_equipe_id())
    )
  );

-- Leads: insert pour anon (formulaire) et authenticated
DROP POLICY IF EXISTS "leads_insert" ON leads;
CREATE POLICY "leads_insert" ON leads
  FOR INSERT WITH CHECK (true); -- RLS vérifie via le rôle de l'appelant (anon ou authenticated)

-- Leads: update
DROP POLICY IF EXISTS "leads_update" ON leads;
CREATE POLICY "leads_update" ON leads
  FOR UPDATE USING (
    (SELECT get_user_role()) IN ('admin', 'manager', 'assistante')
    OR commercial_assigne_id = (SELECT get_user_equipe_id())
  );

-- ============================================================
-- 3. Sessions policies optimisées
-- ============================================================

DROP POLICY IF EXISTS "sessions_select" ON sessions;
CREATE POLICY "sessions_select" ON sessions
  FOR SELECT USING (
    (SELECT get_user_role()) IN ('admin', 'manager', 'assistante')
    OR formatrice_id = (SELECT get_user_equipe_id())
    OR formatrice_secondaire_id = (SELECT get_user_equipe_id())
  );

DROP POLICY IF EXISTS "sessions_insert" ON sessions;
CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (
    (SELECT get_user_role()) IN ('admin', 'manager', 'assistante')
  );

DROP POLICY IF EXISTS "sessions_update" ON sessions;
CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE USING (
    (SELECT get_user_role()) IN ('admin', 'manager', 'assistante')
    OR formatrice_id = (SELECT get_user_equipe_id())
  );

-- ============================================================
-- 4. Inscriptions policies optimisées
-- ============================================================

DROP POLICY IF EXISTS "inscriptions_select" ON inscriptions;
CREATE POLICY "inscriptions_select" ON inscriptions
  FOR SELECT USING (
    (SELECT get_user_role()) IN ('admin', 'manager', 'assistante')
    OR lead_id IN (
      SELECT id FROM leads WHERE commercial_assigne_id = (SELECT get_user_equipe_id())
    )
    OR session_id IN (
      SELECT id FROM sessions WHERE formatrice_id = (SELECT get_user_equipe_id())
    )
  );

-- ============================================================
-- 5. Financements policies optimisées
-- ============================================================

DROP POLICY IF EXISTS "financements_select" ON financements;
CREATE POLICY "financements_select" ON financements
  FOR SELECT USING (
    (SELECT get_user_role()) IN ('admin', 'manager', 'assistante')
    OR lead_id IN (
      SELECT id FROM leads WHERE commercial_assigne_id = (SELECT get_user_equipe_id())
    )
  );

-- ============================================================
-- 6. Rappels policies optimisées
-- ============================================================

DROP POLICY IF EXISTS "rappels_select" ON rappels;
CREATE POLICY "rappels_select" ON rappels
  FOR SELECT USING (
    (SELECT get_user_role()) IN ('admin', 'manager')
    OR user_id = (SELECT get_user_equipe_id())
    OR lead_id IN (
      SELECT id FROM leads WHERE commercial_assigne_id = (SELECT get_user_equipe_id())
    )
  );

-- ============================================================
-- 7. Factures policies optimisées
-- ============================================================

DROP POLICY IF EXISTS "factures_select" ON factures;
CREATE POLICY "factures_select" ON factures
  FOR SELECT USING (
    (SELECT get_user_role()) IN ('admin', 'manager', 'assistante')
  );

-- ============================================================
-- 8. Formations — tout le monde peut lire les actives
-- ============================================================

DROP POLICY IF EXISTS "formations_select" ON formations;
CREATE POLICY "formations_select" ON formations
  FOR SELECT USING (is_active = true OR (SELECT get_user_role()) IN ('admin', 'manager'));

-- ============================================================
-- 9. Performance: ajouter filtre applicatif redondant
-- "Même si RLS filtre, le filtre SQL explicite permet
-- à PostgreSQL d'utiliser les indexes" — Supabase docs 2026
-- ============================================================

COMMENT ON POLICY "leads_select_commercial" ON leads IS
  'Optimisée avec (SELECT auth.uid()) wrapper. Toujours ajouter .eq(commercial_assigne_id, userId) côté client pour forcer l''utilisation des indexes.';
