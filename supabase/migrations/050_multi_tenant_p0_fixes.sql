-- ============================================================
-- CRM DERMOTEC — Migration 050 : Multi-tenant P0 Security Fixes
--
-- Contexte : Corrections critiques de sécurité multi-tenant :
--   1. Ajouter org_id à ai_audit_log (table manquante migration 034)
--   2. RLS policies filtrées par org_id sur ai_audit_log
--   3. Trigger auto-fill org_id sur ai_audit_log
--   4. Nettoyer les anciennes policies USING (true) conflictuelles
--   5. Vérification finale de l'état multi-tenant
--
-- CRITIQUE : Faille de sécurité - ai_audit_log accessible cross-org
-- ============================================================


-- ============================================================
-- ÉTAPE 1 : Ajouter org_id à ai_audit_log
-- Cette table a été créée après migration 034 sans org_id
-- ============================================================

ALTER TABLE ai_audit_log ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Créer l'index pour performance RLS
CREATE INDEX IF NOT EXISTS idx_ai_audit_org ON ai_audit_log(org_id);


-- ============================================================
-- ÉTAPE 2 : Trigger auto-fill org_id sur ai_audit_log
-- Utilise la fonction auto_fill_org_id() de migration 034
-- ============================================================

DROP TRIGGER IF EXISTS trg_ai_audit_org_id ON ai_audit_log;
CREATE TRIGGER trg_ai_audit_org_id
  BEFORE INSERT ON ai_audit_log
  FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();


-- ============================================================
-- ÉTAPE 3 : Migrer données existantes ai_audit_log
-- Assigner org_id = première org pour toutes les lignes NULL
-- ============================================================

DO $$
DECLARE
  default_org UUID;
BEGIN
  SELECT id INTO default_org FROM organizations LIMIT 1;

  IF default_org IS NOT NULL THEN
    UPDATE ai_audit_log SET org_id = default_org WHERE org_id IS NULL;
    RAISE NOTICE 'Migration P0 : % lignes ai_audit_log assignées à org %',
      (SELECT count(*) FROM ai_audit_log WHERE org_id = default_org), default_org;
  ELSE
    RAISE WARNING 'Migration P0 : aucune organisation trouvée pour ai_audit_log';
  END IF;
END $$;


-- ============================================================
-- ÉTAPE 4 : RLS policies ai_audit_log filtrées par org_id
-- Remplace les policies USING (true) par filtrage org_id
-- ============================================================

-- Supprimer l'ancienne policy admin non filtrée (migration 032)
DROP POLICY IF EXISTS "ai_audit_admin_read" ON ai_audit_log;

-- Nouvelles policies multi-tenant
CREATE POLICY "mt_ai_audit_select" ON ai_audit_log FOR SELECT TO authenticated
  USING (org_id = (SELECT public.auth_org_id()));

CREATE POLICY "mt_ai_audit_insert" ON ai_audit_log FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT public.auth_org_id()));

-- Service role garde accès complet (pas de filtre org_id pour system)
-- La policy "ai_audit_service" de migration 032 reste active


-- ============================================================
-- ÉTAPE 5 : Nettoyer policies conflictuelles USING (true)
-- Certaines anciennes policies de migration 003 pourraient
-- contourner l'isolation org_id si elles subsistent
-- ============================================================

-- Vérifier et supprimer les policies USING (true) sur tables principales
-- Ces policies sont remplacées par les policies mt_* de migration 034

-- Tables déjà migrées par 034 - nettoyer résidus migration 003
DROP POLICY IF EXISTS "auth_full_leads" ON leads;
DROP POLICY IF EXISTS "auth_full_sessions" ON sessions;
DROP POLICY IF EXISTS "auth_full_inscriptions" ON inscriptions;
DROP POLICY IF EXISTS "auth_full_financements" ON financements;
DROP POLICY IF EXISTS "auth_full_rappels" ON rappels;
DROP POLICY IF EXISTS "auth_full_activites" ON activites;
DROP POLICY IF EXISTS "auth_full_commandes" ON commandes;
DROP POLICY IF EXISTS "auth_full_messages" ON messages;
DROP POLICY IF EXISTS "auth_full_notes_lead" ON notes_lead;
DROP POLICY IF EXISTS "auth_full_documents" ON documents;
DROP POLICY IF EXISTS "auth_full_factures" ON factures;
DROP POLICY IF EXISTS "auth_full_formations" ON formations;
DROP POLICY IF EXISTS "auth_full_equipe" ON equipe;
DROP POLICY IF EXISTS "auth_full_qualite" ON qualite;
DROP POLICY IF EXISTS "auth_full_partenaires" ON partenaires;

-- Supprimer aussi d'éventuelles policies génériques
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON leads;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON sessions;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON inscriptions;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON financements;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON rappels;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON activites;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON commandes;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON messages;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON notes_lead;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON documents;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON factures;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON formations;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON equipe;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON qualite;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON partenaires;


-- ============================================================
-- ÉTAPE 6 : Vérification finale multi-tenant
-- Inclure ai_audit_log dans la vue de vérification
-- ============================================================

-- Mettre à jour la vue pour inclure ai_audit_log
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
SELECT 'partenaires', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM partenaires
UNION ALL
SELECT 'ai_audit_log', COUNT(*), COUNT(*) FILTER (WHERE org_id IS NOT NULL), COUNT(*) FILTER (WHERE org_id IS NULL) FROM ai_audit_log;

COMMENT ON VIEW v_multi_tenant_status IS
  'Vue de vérification multi-tenant MISE À JOUR. Si without_org > 0 sur une table, investigation requise.';


-- ============================================================
-- ÉTAPE 7 : Requête de vérification finale
-- Toutes les tables principales doivent avoir org_id
-- ============================================================

DO $$
DECLARE
  tables_without_org_id TEXT[];
  table_name TEXT;
  has_org_id BOOLEAN;
BEGIN
  -- Liste des tables qui DOIVENT avoir org_id
  FOR table_name IN
    VALUES ('leads'), ('sessions'), ('inscriptions'), ('financements'),
           ('factures'), ('rappels'), ('activites'), ('commandes'),
           ('messages'), ('notes_lead'), ('documents'), ('cadence_instances'),
           ('devis'), ('formations'), ('equipe'), ('qualite'),
           ('partenaires'), ('ai_audit_log')
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public'
      AND columns.table_name=table_name
      AND column_name='org_id'
    ) INTO has_org_id;

    IF NOT has_org_id THEN
      tables_without_org_id := array_append(tables_without_org_id, table_name);
    END IF;
  END LOOP;

  IF array_length(tables_without_org_id, 1) > 0 THEN
    RAISE WARNING 'Migration 050 : Tables SANS org_id : %',
      array_to_string(tables_without_org_id, ', ');
  ELSE
    RAISE NOTICE 'Migration 050 : ✅ Toutes les tables principales ont org_id';
  END IF;
END $$;


-- ============================================================
-- COMMENTAIRES FINAUX
-- ============================================================

COMMENT ON COLUMN ai_audit_log.org_id IS
  'Organisation ID pour isolation multi-tenant. Auto-rempli par trigger.';

COMMENT ON TRIGGER trg_ai_audit_org_id ON ai_audit_log IS
  'Trigger auto-fill org_id pour isolation multi-tenant (migration 050)';


-- ============================================================
-- FIN Migration 050 - Multi-tenant P0 Security Fixes
--
-- Checklist post-migration :
--   1. SELECT * FROM v_multi_tenant_status WHERE without_org > 0;
--   2. Tester : un user de l'org A ne voit PAS les ai_audit_log de l'org B
--   3. Tester : INSERT ai_audit_log → org_id auto-rempli
--   4. Vérifier : aucune policy USING (true) résiduelle sur tables principales
--   5. Surveiller : logs de sécurité pour tentatives d'accès cross-org
-- ============================================================