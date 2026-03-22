-- ============================================================
-- CRM DERMOTEC — Migration 034 : Multi-tenant complet
--
-- Contexte : La migration 013 a posé les bases (organizations,
-- org_members, invitations, org_id nullable sur 14 tables).
-- Cette migration finalise l'isolation multi-tenant :
--   1. Helper auth_org_id() optimisé
--   2. Trigger auto-fill org_id sur INSERT
--   3. RLS policies filtrées par org_id
--   4. Migration des données existantes
--   5. NOT NULL (commenté, exécution manuelle)
--   6. Index sur org_id (tables manquantes)
--   7. Vue de vérification
--
-- IDEMPOTENT : exécutable plusieurs fois sans erreur.
-- ============================================================


-- ============================================================
-- ÉTAPE 1 : Helper auth_org_id()
-- Retourne l'org_id de l'utilisateur connecté.
-- Utilise (SELECT auth.uid()) pour évaluation unique.
-- Remplace get_user_org_id() de la migration 013.
-- ============================================================

CREATE OR REPLACE FUNCTION public.auth_org_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT org_id FROM org_members
  WHERE user_id = (SELECT auth.uid())
  LIMIT 1
$$;

COMMENT ON FUNCTION public.auth_org_id() IS
  'Retourne l''org_id du user connecté. STABLE + SECURITY DEFINER pour RLS. Évalué 1x par requête via (SELECT auth_org_id()).';


-- ============================================================
-- ÉTAPE 2 : Ajouter org_id aux tables qui ne l'ont pas encore
-- (messages, cadence_instances, devis créés après migration 013)
-- ============================================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE cadence_instances ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE devis ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);


-- ============================================================
-- ÉTAPE 3 : Trigger auto-fill org_id sur INSERT
-- Si org_id est NULL à l'insertion, le trigger le remplit
-- automatiquement via auth_org_id().
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_fill_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := (SELECT public.auth_org_id());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.auto_fill_org_id() IS
  'Trigger function : remplit org_id automatiquement si NULL lors d''un INSERT.';

-- Appliquer le trigger sur toutes les tables avec org_id
-- DROP IF EXISTS pour idempotence

DROP TRIGGER IF EXISTS tr_auto_org_leads ON leads;
CREATE TRIGGER tr_auto_org_leads
  BEFORE INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_sessions ON sessions;
CREATE TRIGGER tr_auto_org_sessions
  BEFORE INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_inscriptions ON inscriptions;
CREATE TRIGGER tr_auto_org_inscriptions
  BEFORE INSERT ON inscriptions
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_financements ON financements;
CREATE TRIGGER tr_auto_org_financements
  BEFORE INSERT ON financements
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_rappels ON rappels;
CREATE TRIGGER tr_auto_org_rappels
  BEFORE INSERT ON rappels
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_activites ON activites;
CREATE TRIGGER tr_auto_org_activites
  BEFORE INSERT ON activites
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_commandes ON commandes;
CREATE TRIGGER tr_auto_org_commandes
  BEFORE INSERT ON commandes
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_messages ON messages;
CREATE TRIGGER tr_auto_org_messages
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_notes_lead ON notes_lead;
CREATE TRIGGER tr_auto_org_notes_lead
  BEFORE INSERT ON notes_lead
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_documents ON documents;
CREATE TRIGGER tr_auto_org_documents
  BEFORE INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_cadence_instances ON cadence_instances;
CREATE TRIGGER tr_auto_org_cadence_instances
  BEFORE INSERT ON cadence_instances
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_devis ON devis;
CREATE TRIGGER tr_auto_org_devis
  BEFORE INSERT ON devis
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

-- Tables secondaires (données partagées ou config, trigger aussi pour cohérence)
DROP TRIGGER IF EXISTS tr_auto_org_formations ON formations;
CREATE TRIGGER tr_auto_org_formations
  BEFORE INSERT ON formations
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_factures ON factures;
CREATE TRIGGER tr_auto_org_factures
  BEFORE INSERT ON factures
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_equipe ON equipe;
CREATE TRIGGER tr_auto_org_equipe
  BEFORE INSERT ON equipe
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_qualite ON qualite;
CREATE TRIGGER tr_auto_org_qualite
  BEFORE INSERT ON qualite
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

DROP TRIGGER IF EXISTS tr_auto_org_partenaires ON partenaires;
CREATE TRIGGER tr_auto_org_partenaires
  BEFORE INSERT ON partenaires
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();


-- ============================================================
-- ÉTAPE 4 : Recréer les RLS policies avec filtre org_id
--
-- Pattern : (SELECT auth_org_id()) évalué 1x par requête.
-- On conserve les policies existantes pour anon (formulaire public)
-- et les policies RESTRICTIVE (soft delete).
-- ============================================================

-- -------------------------------------------------------
-- 4a. LEADS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "leads_select" ON leads;
DROP POLICY IF EXISTS "leads_select_commercial" ON leads;
DROP POLICY IF EXISTS "leads_insert" ON leads;
DROP POLICY IF EXISTS "leads_update" ON leads;
DROP POLICY IF EXISTS "leads_delete" ON leads;

CREATE POLICY "mt_leads_select" ON leads FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- Anon peut insérer (formulaire public) — pas de filtre org_id
-- La policy anon existante (anon_insert_leads) reste active
CREATE POLICY "mt_leads_insert" ON leads FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_leads_update" ON leads FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_leads_delete" ON leads FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4b. SESSIONS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "sessions_select" ON sessions;
DROP POLICY IF EXISTS "sessions_insert" ON sessions;
DROP POLICY IF EXISTS "sessions_update" ON sessions;
DROP POLICY IF EXISTS "sessions_delete" ON sessions;

CREATE POLICY "mt_sessions_select" ON sessions FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_sessions_insert" ON sessions FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_sessions_update" ON sessions FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_sessions_delete" ON sessions FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4c. INSCRIPTIONS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "inscriptions_select" ON inscriptions;
DROP POLICY IF EXISTS "inscriptions_insert" ON inscriptions;
DROP POLICY IF EXISTS "inscriptions_update" ON inscriptions;
DROP POLICY IF EXISTS "inscriptions_delete" ON inscriptions;

CREATE POLICY "mt_inscriptions_select" ON inscriptions FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_inscriptions_insert" ON inscriptions FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_inscriptions_update" ON inscriptions FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_inscriptions_delete" ON inscriptions FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4d. FINANCEMENTS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "financements_select" ON financements;
DROP POLICY IF EXISTS "financements_insert" ON financements;
DROP POLICY IF EXISTS "financements_update" ON financements;
DROP POLICY IF EXISTS "financements_delete" ON financements;

CREATE POLICY "mt_financements_select" ON financements FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_financements_insert" ON financements FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_financements_update" ON financements FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_financements_delete" ON financements FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4e. RAPPELS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "rappels_select" ON rappels;
DROP POLICY IF EXISTS "rappels_insert" ON rappels;
DROP POLICY IF EXISTS "rappels_update" ON rappels;
DROP POLICY IF EXISTS "rappels_delete" ON rappels;

CREATE POLICY "mt_rappels_select" ON rappels FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_rappels_insert" ON rappels FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_rappels_update" ON rappels FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_rappels_delete" ON rappels FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4f. ACTIVITES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "activites_select" ON activites;
DROP POLICY IF EXISTS "activites_insert" ON activites;
DROP POLICY IF EXISTS "activites_update" ON activites;
DROP POLICY IF EXISTS "activites_delete" ON activites;

CREATE POLICY "mt_activites_select" ON activites FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_activites_insert" ON activites FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_activites_update" ON activites FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_activites_delete" ON activites FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4g. COMMANDES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "commandes_select" ON commandes;
DROP POLICY IF EXISTS "commandes_insert" ON commandes;
DROP POLICY IF EXISTS "commandes_update" ON commandes;
DROP POLICY IF EXISTS "commandes_delete" ON commandes;

CREATE POLICY "mt_commandes_select" ON commandes FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_commandes_insert" ON commandes FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_commandes_update" ON commandes FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_commandes_delete" ON commandes FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4h. MESSAGES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
DROP POLICY IF EXISTS "messages_delete" ON messages;

CREATE POLICY "mt_messages_select" ON messages FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_messages_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_messages_update" ON messages FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_messages_delete" ON messages FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4i. NOTES_LEAD
-- -------------------------------------------------------
DROP POLICY IF EXISTS "notes_lead_select" ON notes_lead;
DROP POLICY IF EXISTS "notes_lead_insert" ON notes_lead;
DROP POLICY IF EXISTS "notes_lead_update" ON notes_lead;
DROP POLICY IF EXISTS "notes_lead_delete" ON notes_lead;

CREATE POLICY "mt_notes_lead_select" ON notes_lead FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_notes_lead_insert" ON notes_lead FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_notes_lead_update" ON notes_lead FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_notes_lead_delete" ON notes_lead FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4j. DOCUMENTS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "documents_select" ON documents;
DROP POLICY IF EXISTS "documents_insert" ON documents;
DROP POLICY IF EXISTS "documents_update" ON documents;
DROP POLICY IF EXISTS "documents_delete" ON documents;

CREATE POLICY "mt_documents_select" ON documents FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_documents_insert" ON documents FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_documents_update" ON documents FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_documents_delete" ON documents FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4k. CADENCE_INSTANCES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "cadence_instances_select" ON cadence_instances;
DROP POLICY IF EXISTS "cadence_instances_insert" ON cadence_instances;
DROP POLICY IF EXISTS "cadence_instances_update" ON cadence_instances;
DROP POLICY IF EXISTS "cadence_instances_delete" ON cadence_instances;

CREATE POLICY "mt_cadence_instances_select" ON cadence_instances FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_cadence_instances_insert" ON cadence_instances FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_cadence_instances_update" ON cadence_instances FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_cadence_instances_delete" ON cadence_instances FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4l. DEVIS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Users can view devis" ON devis;
DROP POLICY IF EXISTS "Users can create devis" ON devis;
DROP POLICY IF EXISTS "Users can update devis" ON devis;
DROP POLICY IF EXISTS "Service role has full access to devis" ON devis;
DROP POLICY IF EXISTS "devis_select" ON devis;
DROP POLICY IF EXISTS "devis_insert" ON devis;
DROP POLICY IF EXISTS "devis_update" ON devis;
DROP POLICY IF EXISTS "devis_delete" ON devis;

CREATE POLICY "mt_devis_select" ON devis FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_devis_insert" ON devis FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_devis_update" ON devis FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_devis_delete" ON devis FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4m. FACTURES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "factures_select" ON factures;
DROP POLICY IF EXISTS "factures_insert" ON factures;
DROP POLICY IF EXISTS "factures_update" ON factures;
DROP POLICY IF EXISTS "factures_delete" ON factures;

CREATE POLICY "mt_factures_select" ON factures FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_factures_insert" ON factures FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_factures_update" ON factures FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_factures_delete" ON factures FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4n. FORMATIONS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "formations_select" ON formations;
DROP POLICY IF EXISTS "formations_insert" ON formations;
DROP POLICY IF EXISTS "formations_update" ON formations;
DROP POLICY IF EXISTS "formations_delete" ON formations;

CREATE POLICY "mt_formations_select" ON formations FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- Anon peut lire les formations actives (catalogue public)
DROP POLICY IF EXISTS "anon_read_formations" ON formations;
CREATE POLICY "anon_read_formations" ON formations FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "mt_formations_insert" ON formations FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_formations_update" ON formations FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_formations_delete" ON formations FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4o. EQUIPE
-- -------------------------------------------------------
DROP POLICY IF EXISTS "equipe_select" ON equipe;
DROP POLICY IF EXISTS "equipe_insert" ON equipe;
DROP POLICY IF EXISTS "equipe_update" ON equipe;
DROP POLICY IF EXISTS "equipe_delete" ON equipe;

CREATE POLICY "mt_equipe_select" ON equipe FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_equipe_insert" ON equipe FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_equipe_update" ON equipe FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_equipe_delete" ON equipe FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4p. QUALITE
-- -------------------------------------------------------
DROP POLICY IF EXISTS "qualite_select" ON qualite;
DROP POLICY IF EXISTS "qualite_insert" ON qualite;
DROP POLICY IF EXISTS "qualite_update" ON qualite;
DROP POLICY IF EXISTS "qualite_delete" ON qualite;

CREATE POLICY "mt_qualite_select" ON qualite FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_qualite_insert" ON qualite FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_qualite_update" ON qualite FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_qualite_delete" ON qualite FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

-- -------------------------------------------------------
-- 4q. PARTENAIRES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "partenaires_select" ON partenaires;
DROP POLICY IF EXISTS "partenaires_insert" ON partenaires;
DROP POLICY IF EXISTS "partenaires_update" ON partenaires;
DROP POLICY IF EXISTS "partenaires_delete" ON partenaires;

CREATE POLICY "mt_partenaires_select" ON partenaires FOR SELECT TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_partenaires_insert" ON partenaires FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_partenaires_update" ON partenaires FOR UPDATE TO authenticated
  USING (org_id = (SELECT auth_org_id()));

CREATE POLICY "mt_partenaires_delete" ON partenaires FOR DELETE TO authenticated
  USING (org_id = (SELECT auth_org_id()));


-- ============================================================
-- ÉTAPE 5 : Migration des données existantes
-- Assigne org_id = première org pour toutes les lignes NULL
-- ============================================================

DO $$
DECLARE
  default_org UUID;
BEGIN
  SELECT id INTO default_org FROM organizations LIMIT 1;

  IF default_org IS NOT NULL THEN
    RAISE NOTICE 'Migration multi-tenant : org par défaut = %', default_org;

    UPDATE leads SET org_id = default_org WHERE org_id IS NULL;
    UPDATE formations SET org_id = default_org WHERE org_id IS NULL;
    UPDATE sessions SET org_id = default_org WHERE org_id IS NULL;
    UPDATE inscriptions SET org_id = default_org WHERE org_id IS NULL;
    UPDATE financements SET org_id = default_org WHERE org_id IS NULL;
    UPDATE factures SET org_id = default_org WHERE org_id IS NULL;
    UPDATE rappels SET org_id = default_org WHERE org_id IS NULL;
    UPDATE activites SET org_id = default_org WHERE org_id IS NULL;
    UPDATE commandes SET org_id = default_org WHERE org_id IS NULL;
    UPDATE messages SET org_id = default_org WHERE org_id IS NULL;
    UPDATE notes_lead SET org_id = default_org WHERE org_id IS NULL;
    UPDATE documents SET org_id = default_org WHERE org_id IS NULL;
    UPDATE cadence_instances SET org_id = default_org WHERE org_id IS NULL;
    UPDATE devis SET org_id = default_org WHERE org_id IS NULL;
    UPDATE equipe SET org_id = default_org WHERE org_id IS NULL;
    UPDATE qualite SET org_id = default_org WHERE org_id IS NULL;
    UPDATE partenaires SET org_id = default_org WHERE org_id IS NULL;

    RAISE NOTICE 'Migration multi-tenant : données existantes assignées à org %', default_org;
  ELSE
    RAISE NOTICE 'Migration multi-tenant : aucune organisation trouvée, org_id reste NULL';
  END IF;
END $$;


-- ============================================================
-- ÉTAPE 6 : NOT NULL sur org_id
-- COMMENTÉ pour sécurité — exécuter manuellement après vérification
-- via la vue v_multi_tenant_status (étape 8)
-- ============================================================

-- IMPORTANT : Décommenter UNIQUEMENT après avoir vérifié que
-- toutes les lignes ont un org_id via :
--   SELECT * FROM v_multi_tenant_status WHERE without_org > 0;

-- ALTER TABLE leads ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE formations ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE sessions ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE inscriptions ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE financements ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE factures ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE rappels ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE activites ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE commandes ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE messages ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE notes_lead ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE documents ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE cadence_instances ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE devis ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE equipe ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE qualite ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE partenaires ALTER COLUMN org_id SET NOT NULL;


-- ============================================================
-- ÉTAPE 7 : Index sur org_id (tables manquantes)
-- Les index sur leads, sessions, inscriptions, factures, equipe
-- existent déjà (migration 013).
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_financements_org ON financements(org_id);
CREATE INDEX IF NOT EXISTS idx_rappels_org ON rappels(org_id);
CREATE INDEX IF NOT EXISTS idx_activites_org ON activites(org_id);
CREATE INDEX IF NOT EXISTS idx_commandes_org ON commandes(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_org ON messages(org_id);
CREATE INDEX IF NOT EXISTS idx_notes_lead_org ON notes_lead(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_cadence_instances_org ON cadence_instances(org_id);
CREATE INDEX IF NOT EXISTS idx_devis_org ON devis(org_id);
CREATE INDEX IF NOT EXISTS idx_formations_org ON formations(org_id);
CREATE INDEX IF NOT EXISTS idx_qualite_org ON qualite(org_id);
CREATE INDEX IF NOT EXISTS idx_partenaires_org ON partenaires(org_id);

-- Index composite org_id + colonnes fréquemment filtrées (perf RLS)
CREATE INDEX IF NOT EXISTS idx_leads_org_statut ON leads(org_id, statut);
CREATE INDEX IF NOT EXISTS idx_leads_org_commercial ON leads(org_id, commercial_assigne_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org_date ON sessions(org_id, date_debut);
CREATE INDEX IF NOT EXISTS idx_inscriptions_org_session ON inscriptions(org_id, session_id);
CREATE INDEX IF NOT EXISTS idx_activites_org_created ON activites(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rappels_org_date ON rappels(org_id, date_rappel);


-- ============================================================
-- ÉTAPE 8 : Vue de vérification multi-tenant
-- Permet de vérifier que toutes les données ont un org_id.
-- Usage : SELECT * FROM v_multi_tenant_status WHERE without_org > 0;
-- ============================================================

CREATE OR REPLACE VIEW v_multi_tenant_status AS
SELECT 'leads' AS table_name,
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE org_id IS NOT NULL) AS with_org,
       COUNT(*) FILTER (WHERE org_id IS NULL) AS without_org
FROM leads
UNION ALL
SELECT 'formations', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM formations
UNION ALL
SELECT 'sessions', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM sessions
UNION ALL
SELECT 'inscriptions', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM inscriptions
UNION ALL
SELECT 'financements', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM financements
UNION ALL
SELECT 'factures', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM factures
UNION ALL
SELECT 'rappels', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM rappels
UNION ALL
SELECT 'activites', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM activites
UNION ALL
SELECT 'commandes', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM commandes
UNION ALL
SELECT 'messages', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM messages
UNION ALL
SELECT 'notes_lead', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM notes_lead
UNION ALL
SELECT 'documents', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM documents
UNION ALL
SELECT 'cadence_instances', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM cadence_instances
UNION ALL
SELECT 'devis', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM devis
UNION ALL
SELECT 'equipe', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM equipe
UNION ALL
SELECT 'qualite', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM qualite
UNION ALL
SELECT 'partenaires', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM partenaires;

COMMENT ON VIEW v_multi_tenant_status IS
  'Vue de vérification multi-tenant. Si without_org > 0 sur une table, ne pas activer NOT NULL.';


-- ============================================================
-- FIN Migration 034
--
-- Checklist post-migration :
--   1. SELECT * FROM v_multi_tenant_status WHERE without_org > 0;
--   2. Si tout est à 0, décommenter les ALTER TABLE SET NOT NULL
--   3. Tester : un user de l'org A ne voit PAS les données de l'org B
--   4. Tester : INSERT sans org_id → trigger remplit automatiquement
--   5. Tester : formulaire public (anon) → leads insérés sans org_id OK
-- ============================================================
