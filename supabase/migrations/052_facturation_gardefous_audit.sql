-- Migration 052 : Garde-fous facturation — audit trail, remises, verrouillage, anti-fraude
-- Objectif : conformité comptable FR + protection contre fraude interne + traçabilité complète

-- ============================================================
-- 1. TABLE AUDIT LOG FACTURES (traçabilité obligatoire)
-- ============================================================
-- Chaque action sur une facture est enregistrée de façon IMMUTABLE
-- Obligation comptable : traçabilité des modifications

CREATE TABLE IF NOT EXISTS facture_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES factures_formation(id) ON DELETE CASCADE,

  -- Action
  action TEXT NOT NULL CHECK (action IN (
    'creation',           -- Facture créée
    'modification',       -- Champ modifié
    'envoi_email',        -- Email envoyé
    'relance',            -- Relance envoyée
    'paiement_partiel',   -- Paiement partiel reçu
    'paiement_complet',   -- Facture payée intégralement
    'annulation',         -- Facture annulée
    'avoir_cree',         -- Avoir créé depuis cette facture
    'conversion_devis',   -- Créée depuis un devis
    'suppression',        -- Soft-delete
    'restauration',       -- Restauration après suppression
    'remise_appliquee',   -- Remise accordée
    'verrouillage'        -- Facture verrouillée (post-envoi)
  )),

  -- Détails
  old_values JSONB,       -- Valeurs AVANT modification
  new_values JSONB,       -- Valeurs APRÈS modification
  details TEXT,           -- Description humaine

  -- Qui
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  ip_address TEXT,

  -- Quand (immutable, pas de updated_at)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour recherche rapide
CREATE INDEX idx_audit_facture ON facture_audit_log(facture_id);
CREATE INDEX idx_audit_action ON facture_audit_log(action);
CREATE INDEX idx_audit_date ON facture_audit_log(created_at DESC);
CREATE INDEX idx_audit_user ON facture_audit_log(user_id);

-- RLS : lecture seule pour tous les authentifiés, insertion via triggers uniquement
ALTER TABLE facture_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_read_auth" ON facture_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_insert_auth" ON facture_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 2. COLONNES REMISE sur factures_formation
-- ============================================================
ALTER TABLE factures_formation ADD COLUMN IF NOT EXISTS remise_pct NUMERIC(5,2) DEFAULT 0 CHECK (remise_pct >= 0 AND remise_pct <= 100);
ALTER TABLE factures_formation ADD COLUMN IF NOT EXISTS remise_montant NUMERIC(10,2) DEFAULT 0 CHECK (remise_montant >= 0);
ALTER TABLE factures_formation ADD COLUMN IF NOT EXISTS remise_motif TEXT;
ALTER TABLE factures_formation ADD COLUMN IF NOT EXISTS remise_validee_par UUID REFERENCES auth.users(id);

-- ============================================================
-- 3. COLONNE VERROUILLAGE
-- ============================================================
ALTER TABLE factures_formation ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- ============================================================
-- 4. TRIGGER AUTO-AUDIT sur factures_formation
-- ============================================================
-- Enregistre automatiquement chaque INSERT/UPDATE/DELETE

CREATE OR REPLACE FUNCTION trg_facture_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_old JSONB;
  v_new JSONB;
  v_details TEXT;
  v_user_id UUID;
BEGIN
  -- Déterminer l'utilisateur courant
  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_action := 'creation';
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_details := 'Facture ' || NEW.numero_facture || ' créée — ' || NEW.montant_ttc || '€ TTC';

    INSERT INTO facture_audit_log (facture_id, action, old_values, new_values, details, user_id)
    VALUES (NEW.id, v_action, v_old, v_new, v_details, v_user_id);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Détecter le type de modification
    IF OLD.statut != NEW.statut THEN
      IF NEW.statut = 'annulee' THEN
        v_action := 'annulation';
        v_details := 'Facture annulée (était ' || OLD.statut || ')';
      ELSIF NEW.statut = 'payee' THEN
        v_action := 'paiement_complet';
        v_details := 'Facture payée — ' || NEW.montant_ttc || '€';
      ELSIF NEW.statut = 'envoyee' AND OLD.statut != 'envoyee' THEN
        v_action := 'envoi_email';
        v_details := 'Facture envoyée à ' || COALESCE(NEW.destinataire_email, 'N/A');
      ELSE
        v_action := 'modification';
        v_details := 'Statut : ' || OLD.statut || ' → ' || NEW.statut;
      END IF;
    ELSIF OLD.montant_paye IS DISTINCT FROM NEW.montant_paye THEN
      IF NEW.montant_paye >= NEW.montant_ttc THEN
        v_action := 'paiement_complet';
      ELSE
        v_action := 'paiement_partiel';
      END IF;
      v_details := 'Paiement : ' || COALESCE(OLD.montant_paye, 0) || '€ → ' || NEW.montant_paye || '€';
    ELSIF OLD.relance_count IS DISTINCT FROM NEW.relance_count THEN
      v_action := 'relance';
      v_details := 'Relance n°' || NEW.relance_count;
    ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'suppression';
      v_details := 'Facture supprimée (soft-delete)';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action := 'restauration';
      v_details := 'Facture restaurée';
    ELSIF OLD.remise_pct IS DISTINCT FROM NEW.remise_pct OR OLD.remise_montant IS DISTINCT FROM NEW.remise_montant THEN
      v_action := 'remise_appliquee';
      v_details := 'Remise : ' || COALESCE(NEW.remise_pct, 0) || '% / ' || COALESCE(NEW.remise_montant, 0) || '€ — Motif : ' || COALESCE(NEW.remise_motif, 'N/A');
    ELSIF OLD.is_locked IS DISTINCT FROM NEW.is_locked AND NEW.is_locked = true THEN
      v_action := 'verrouillage';
      v_details := 'Facture verrouillée — modification montants interdite';
    ELSE
      v_action := 'modification';
      v_details := 'Modification générale';
    END IF;

    -- Capturer old/new values (seulement les champs qui changent)
    v_old := jsonb_build_object(
      'statut', OLD.statut, 'montant_ht', OLD.montant_ht, 'montant_ttc', OLD.montant_ttc,
      'montant_paye', OLD.montant_paye, 'remise_pct', OLD.remise_pct, 'remise_montant', OLD.remise_montant,
      'is_locked', OLD.is_locked, 'deleted_at', OLD.deleted_at
    );
    v_new := jsonb_build_object(
      'statut', NEW.statut, 'montant_ht', NEW.montant_ht, 'montant_ttc', NEW.montant_ttc,
      'montant_paye', NEW.montant_paye, 'remise_pct', NEW.remise_pct, 'remise_montant', NEW.remise_montant,
      'is_locked', NEW.is_locked, 'deleted_at', NEW.deleted_at
    );

    INSERT INTO facture_audit_log (facture_id, action, old_values, new_values, details, user_id)
    VALUES (NEW.id, v_action, v_old, v_new, v_details, v_user_id);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- On ne devrait JAMAIS hard-delete une facture, mais on trace quand même
    INSERT INTO facture_audit_log (facture_id, action, old_values, details, user_id)
    VALUES (OLD.id, 'suppression', to_jsonb(OLD), 'HARD DELETE — ALERTE', v_user_id);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_facture_audit_trail
  AFTER INSERT OR UPDATE OR DELETE ON factures_formation
  FOR EACH ROW EXECUTE FUNCTION trg_facture_audit();

-- ============================================================
-- 5. TRIGGER VERROUILLAGE AUTO post-envoi
-- ============================================================
-- Quand une facture passe en envoyee/payee → verrouillage automatique

CREATE OR REPLACE FUNCTION trg_facture_auto_lock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut IN ('envoyee', 'payee', 'partiellement_payee', 'en_retard', 'impayee', 'contentieux')
     AND OLD.is_locked = false THEN
    NEW.is_locked := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_facture_auto_lock
  BEFORE UPDATE ON factures_formation
  FOR EACH ROW EXECUTE FUNCTION trg_facture_auto_lock();

-- ============================================================
-- 6. TRIGGER PROTECTION MODIFICATION FACTURE VERROUILLÉE
-- ============================================================
-- Empêche de modifier les montants d'une facture verrouillée

CREATE OR REPLACE FUNCTION trg_facture_protect_locked()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_locked = true THEN
    -- Seuls ces champs sont modifiables sur une facture verrouillée
    IF OLD.montant_ht IS DISTINCT FROM NEW.montant_ht
       OR OLD.montant_tva IS DISTINCT FROM NEW.montant_tva
       OR OLD.montant_ttc IS DISTINCT FROM NEW.montant_ttc
       OR OLD.taux_tva IS DISTINCT FROM NEW.taux_tva
       OR OLD.destinataire_nom IS DISTINCT FROM NEW.destinataire_nom
       OR OLD.remise_pct IS DISTINCT FROM NEW.remise_pct
       OR OLD.remise_montant IS DISTINCT FROM NEW.remise_montant THEN
      -- Exception : si on annule la facture, on peut modifier
      IF NEW.statut = 'annulee' THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Facture verrouillée — modification des montants interdite. Créez un avoir.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_facture_protect_locked
  BEFORE UPDATE ON factures_formation
  FOR EACH ROW EXECUTE FUNCTION trg_facture_protect_locked();

-- ============================================================
-- 7. TABLE HISTORIQUE RELANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS relances_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES factures_formation(id) ON DELETE CASCADE,
  numero_relance INTEGER NOT NULL,
  type TEXT DEFAULT 'email' CHECK (type IN ('email', 'sms', 'courrier', 'telephone', 'mise_en_demeure')),
  destinataire_email TEXT,
  contenu_resume TEXT,
  envoye_par UUID REFERENCES auth.users(id),
  envoye_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_relances_facture ON relances_historique(facture_id);
ALTER TABLE relances_historique ENABLE ROW LEVEL SECURITY;
CREATE POLICY "relances_auth" ON relances_historique FOR ALL TO authenticated USING (true) WITH CHECK (true);
