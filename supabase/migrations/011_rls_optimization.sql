-- ============================================================
-- CRM DERMOTEC — Optimisation RLS + RBAC JWT claims
-- Migration 011: Performance RLS + Role-based access control
-- ============================================================

-- Optimisation: Remplacer auth.uid() par (SELECT auth.uid()) pour short-circuit evaluation
-- Cela évite les appels répétés à la fonction dans les scans de table

-- 1. OPTIMISATION LEADS
DROP POLICY IF EXISTS "leads_select" ON leads;
CREATE POLICY "leads_select" ON leads
FOR SELECT USING (
  -- Cache auth.uid() une seule fois par requête
  assigned_to = (SELECT auth.uid())
  OR (SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles WHERE role IN ('ADMIN', 'MANAGER')
  )
);

-- Index pour supporter la policy RLS sur assigned_to
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_rls ON leads(assigned_to) WHERE assigned_to IS NOT NULL;

-- 2. OPTIMISATION INSCRIPTIONS
DROP POLICY IF EXISTS "inscriptions_select" ON inscriptions;
CREATE POLICY "inscriptions_select" ON inscriptions
FOR SELECT USING (
  assigned_to = (SELECT auth.uid())
  OR (SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles WHERE role IN ('ADMIN', 'MANAGER')
  )
  OR lead_id IN (
    SELECT id FROM leads WHERE assigned_to = (SELECT auth.uid())
  )
);

-- Index composite pour jointure leads
CREATE INDEX IF NOT EXISTS idx_inscriptions_lead_assigned_rls ON inscriptions(lead_id, assigned_to);

-- 3. OPTIMISATION SESSIONS (RBAC pour formatrices)
DROP POLICY IF EXISTS "sessions_select" ON sessions;
CREATE POLICY "sessions_select" ON sessions
FOR SELECT USING (
  -- Admin/Manager voient tout
  (SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles WHERE role IN ('ADMIN', 'MANAGER')
  )
  -- Formatrices ne voient que leurs sessions assignées via JWT claim
  OR (
    ((SELECT auth.jwt()) -> 'user_metadata' ->> 'role') = 'FORMATRICE'
    AND formatrice_assignee = (SELECT auth.uid())
  )
  -- Commercial voit ses leads inscrits
  OR id IN (
    SELECT session_id FROM inscriptions i
    JOIN leads l ON i.lead_id = l.id
    WHERE l.assigned_to = (SELECT auth.uid())
  )
);

-- Index pour formatrices
CREATE INDEX IF NOT EXISTS idx_sessions_formatrice_rls ON sessions(formatrice_assignee) WHERE formatrice_assignee IS NOT NULL;

-- 4. OPTIMISATION FINANCEMENTS
DROP POLICY IF EXISTS "financements_select" ON financements;
CREATE POLICY "financements_select" ON financements
FOR SELECT USING (
  -- Via lead assigné
  lead_id IN (
    SELECT id FROM leads WHERE assigned_to = (SELECT auth.uid())
  )
  -- Ou admin/manager
  OR (SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles WHERE role IN ('ADMIN', 'MANAGER')
  )
);

-- Index pour jointure leads
CREATE INDEX IF NOT EXISTS idx_financements_lead_rls ON financements(lead_id);

-- 5. OPTIMISATION DOCUMENTS
DROP POLICY IF EXISTS "documents_select" ON documents;
CREATE POLICY "documents_select" ON documents
FOR SELECT USING (
  -- Uploaded by user ou via lead assigné
  uploaded_by = (SELECT auth.uid())
  OR lead_id IN (
    SELECT id FROM leads WHERE assigned_to = (SELECT auth.uid())
  )
  OR (SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles WHERE role IN ('ADMIN', 'MANAGER')
  )
);

-- Index composite documents
CREATE INDEX IF NOT EXISTS idx_documents_lead_uploader_rls ON documents(lead_id, uploaded_by);

-- 6. OPTIMISATION ACTIVITES (très consultées)
DROP POLICY IF EXISTS "activites_select" ON activites;
CREATE POLICY "activites_select" ON activites
FOR SELECT USING (
  -- Via lead assigné (le plus fréquent)
  lead_id IN (
    SELECT id FROM leads WHERE assigned_to = (SELECT auth.uid())
  )
  -- Ou créée par l'utilisateur
  OR created_by = (SELECT auth.uid())
  -- Ou admin
  OR (SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles WHERE role IN ('ADMIN', 'MANAGER')
  )
);

-- Index activités pour performance RLS
CREATE INDEX IF NOT EXISTS idx_activites_lead_creator_rls ON activites(lead_id, created_by);

-- 7. OPTIMISATION REMINDERS
DROP POLICY IF EXISTS "reminders_select" ON reminders;
CREATE POLICY "reminders_select" ON reminders
FOR SELECT USING (
  -- Assigned to user
  assigned_to = (SELECT auth.uid())
  -- Ou créé par user
  OR created_by = (SELECT auth.uid())
  -- Via lead assigné
  OR lead_id IN (
    SELECT id FROM leads WHERE assigned_to = (SELECT auth.uid())
  )
  -- Admin
  OR (SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles WHERE role IN ('ADMIN', 'MANAGER')
  )
);

-- Index reminders
CREATE INDEX IF NOT EXISTS idx_reminders_assigned_creator_rls ON reminders(assigned_to, created_by);

-- 8. POLITIQUE RBAC VIA JWT CLAIMS
-- Helper function pour extraire le rôle du JWT
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    (SELECT role FROM user_profiles WHERE user_id = auth.uid() LIMIT 1),
    'USER'
  );
END;
$$;

-- 9. OPTIMISATION WEBHOOK_EVENTS (Service role uniquement)
DROP POLICY IF EXISTS "webhook_events_select" ON webhook_events;
CREATE POLICY "webhook_events_select" ON webhook_events
FOR SELECT USING (
  -- Uniquement pour admin ou service role
  (SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles WHERE role = 'ADMIN'
  )
);

-- 10. INDEX GLOBAUX pour performance RLS
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_uid ON user_profiles(user_id, role);

-- Statistiques pour le planner
ANALYZE leads;
ANALYZE inscriptions;
ANALYZE sessions;
ANALYZE financements;
ANALYZE documents;
ANALYZE activites;
ANALYZE reminders;

-- Commentaires pour documentation
COMMENT ON INDEX idx_leads_assigned_to_rls IS 'RLS performance - filtrage par assigned_to';
COMMENT ON INDEX idx_sessions_formatrice_rls IS 'RBAC formatrices - accès sessions assignées';
COMMENT ON INDEX idx_activites_lead_creator_rls IS 'RLS activités - composite lead_id/created_by';

-- Vérifier que RLS est activé sur toutes les tables sensibles
DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE relname = 'leads'), 'RLS non activé sur leads';
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE relname = 'inscriptions'), 'RLS non activé sur inscriptions';
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE relname = 'sessions'), 'RLS non activé sur sessions';
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE relname = 'documents'), 'RLS non activé sur documents';
  RAISE NOTICE 'RLS optimization completed successfully';
END;
$$;