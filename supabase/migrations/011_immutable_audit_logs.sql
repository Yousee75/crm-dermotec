-- ============================================================
-- CRM DERMOTEC — Migration 011
-- Rendre les tables d'audit IMMUABLES (pas d'UPDATE/DELETE)
-- Sécurité : un attaquant ne peut pas effacer ses traces
-- ============================================================

-- field_history : historique des changements de champs
CREATE RULE no_update_field_history AS ON UPDATE TO field_history DO INSTEAD NOTHING;
CREATE RULE no_delete_field_history AS ON DELETE TO field_history DO INSTEAD NOTHING;

-- login_logs : historique des connexions
CREATE RULE no_update_login_logs AS ON UPDATE TO login_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_login_logs AS ON DELETE TO login_logs DO INSTEAD NOTHING;

-- activites : journal d'activités CRM
-- Note : on garde UPDATE possible car le type/description peut être corrigé par admin
-- Mais DELETE est interdit
CREATE RULE no_delete_activites AS ON DELETE TO activites DO INSTEAD NOTHING;

-- emails_sent : historique des emails (si la table existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emails_sent') THEN
    EXECUTE 'CREATE RULE no_update_emails_sent AS ON UPDATE TO emails_sent DO INSTEAD NOTHING';
    EXECUTE 'CREATE RULE no_delete_emails_sent AS ON DELETE TO emails_sent DO INSTEAD NOTHING';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'emails_sent rules skipped';
END $$;

-- webhook_events : historique des webhooks (si la table existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_events') THEN
    EXECUTE 'CREATE RULE no_delete_webhook_events AS ON DELETE TO webhook_events DO INSTEAD NOTHING';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'webhook_events rules skipped';
END $$;

-- anomalies : journal des anomalies détectées
-- UPDATE autorisé (résolution), DELETE interdit
CREATE RULE no_delete_anomalies AS ON DELETE TO anomalies DO INSTEAD NOTHING;
