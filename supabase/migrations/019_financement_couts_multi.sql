-- Migration 019 : Enrichissement module financement
-- Ajout : TVA, coûts formation, marge, multi-financement, historique enrichi

-- ============================================================
-- 1. COLONNES TVA & RÉGLEMENTATION
-- ============================================================
ALTER TABLE financements ADD COLUMN IF NOT EXISTS tva_applicable BOOLEAN DEFAULT false;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS taux_tva NUMERIC(5,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS montant_ht NUMERIC(10,2);
ALTER TABLE financements ADD COLUMN IF NOT EXISTS montant_ttc NUMERIC(10,2);
ALTER TABLE financements ADD COLUMN IF NOT EXISTS exoneration_tva_reference TEXT DEFAULT 'Article 261-4-4° du CGI';
ALTER TABLE financements ADD COLUMN IF NOT EXISTS numero_nda TEXT; -- Numéro Déclaration Activité OF
ALTER TABLE financements ADD COLUMN IF NOT EXISTS qualiopi_valide BOOLEAN DEFAULT true;

-- ============================================================
-- 2. COLONNES COÛTS FORMATION (pour calcul marge)
-- ============================================================
ALTER TABLE financements ADD COLUMN IF NOT EXISTS cout_formatrice NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS cout_salle NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS cout_materiel NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS cout_consommables NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS cout_deplacement NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS cout_restauration NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS cout_administratif NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS cout_autres NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS cout_autres_detail TEXT;

-- ============================================================
-- 3. COLONNES CALCULÉES : COÛT TOTAL, MARGE NETTE, TAUX MARGE
-- ============================================================
-- Note: PostgreSQL GENERATED ALWAYS AS ne peut pas être ajouté via ALTER TABLE
-- On utilise un trigger à la place

CREATE OR REPLACE FUNCTION calcul_financements_couts()
RETURNS TRIGGER AS $$
BEGIN
  -- Coût total
  NEW.cout_total := COALESCE(NEW.cout_formatrice, 0)
    + COALESCE(NEW.cout_salle, 0)
    + COALESCE(NEW.cout_materiel, 0)
    + COALESCE(NEW.cout_consommables, 0)
    + COALESCE(NEW.cout_deplacement, 0)
    + COALESCE(NEW.cout_restauration, 0)
    + COALESCE(NEW.cout_administratif, 0)
    + COALESCE(NEW.cout_autres, 0);

  -- Marge nette = montant accordé (ou demandé) - coût total
  NEW.marge_nette := COALESCE(NEW.montant_accorde, NEW.montant_demande, 0) - NEW.cout_total;

  -- Taux de marge (%)
  IF COALESCE(NEW.montant_accorde, NEW.montant_demande, 0) > 0 THEN
    NEW.taux_marge := (NEW.marge_nette / COALESCE(NEW.montant_accorde, NEW.montant_demande, 1)) * 100;
  ELSE
    NEW.taux_marge := 0;
  END IF;

  -- Calcul TVA
  IF NEW.tva_applicable = true AND NEW.taux_tva > 0 THEN
    NEW.montant_ht := COALESCE(NEW.montant_accorde, NEW.montant_demande, 0);
    NEW.montant_ttc := NEW.montant_ht * (1 + NEW.taux_tva / 100);
  ELSE
    NEW.montant_ht := COALESCE(NEW.montant_accorde, NEW.montant_demande, 0);
    NEW.montant_ttc := NEW.montant_ht; -- Exonéré = HT = TTC
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE financements ADD COLUMN IF NOT EXISTS cout_total NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS marge_nette NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS taux_marge NUMERIC(5,2) DEFAULT 0;

DROP TRIGGER IF EXISTS trg_calcul_financements_couts ON financements;
CREATE TRIGGER trg_calcul_financements_couts
  BEFORE INSERT OR UPDATE ON financements
  FOR EACH ROW EXECUTE FUNCTION calcul_financements_couts();

-- ============================================================
-- 4. MULTI-FINANCEMENT : table lignes de financement
-- ============================================================
ALTER TABLE financements ADD COLUMN IF NOT EXISTS multi_financement BOOLEAN DEFAULT false;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS financement_parent_id UUID REFERENCES financements(id);

CREATE TABLE IF NOT EXISTS financement_lignes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  financement_id UUID NOT NULL REFERENCES financements(id) ON DELETE CASCADE,
  organisme_id TEXT NOT NULL,
  organisme_nom TEXT NOT NULL,
  montant_demande NUMERIC(10,2) DEFAULT 0,
  montant_accorde NUMERIC(10,2),
  statut TEXT DEFAULT 'PREPARATION' CHECK (statut IN (
    'PREPARATION', 'SOUMIS', 'EN_EXAMEN', 'VALIDE', 'REFUSE', 'VERSE'
  )),
  numero_dossier TEXT,
  date_soumission TIMESTAMPTZ,
  date_reponse TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at sur financement_lignes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financement_lignes_updated_at
  BEFORE UPDATE ON financement_lignes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_financement_lignes_financement ON financement_lignes(financement_id);
CREATE INDEX IF NOT EXISTS idx_financement_lignes_statut ON financement_lignes(statut);

-- RLS sur financement_lignes (même politique que financements)
ALTER TABLE financement_lignes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financement_lignes_authenticated" ON financement_lignes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 5. HISTORIQUE ENRICHI : table dédiée (au lieu du JSONB)
-- ============================================================
CREATE TABLE IF NOT EXISTS financement_historique (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  financement_id UUID NOT NULL REFERENCES financements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_nom TEXT,
  action TEXT NOT NULL, -- 'creation', 'modification', 'statut_change', 'document_ajout', 'note_ajout', 'ligne_ajout', 'ligne_modification'
  champ_modifie TEXT, -- null si action globale
  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,
  details JSONB DEFAULT '{}', -- contexte supplémentaire
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financement_historique_financement ON financement_historique(financement_id);
CREATE INDEX IF NOT EXISTS idx_financement_historique_date ON financement_historique(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financement_historique_user ON financement_historique(user_id);

ALTER TABLE financement_historique ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financement_historique_authenticated" ON financement_historique
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger auto-historique sur changements financement
CREATE OR REPLACE FUNCTION track_financement_changes()
RETURNS TRIGGER AS $$
DECLARE
  col TEXT;
  old_val TEXT;
  new_val TEXT;
  cols TEXT[] := ARRAY[
    'statut', 'organisme', 'montant_demande', 'montant_accorde', 'montant_verse',
    'numero_dossier', 'motif_refus', 'notes', 'tva_applicable', 'taux_tva',
    'cout_formatrice', 'cout_salle', 'cout_materiel', 'cout_consommables',
    'cout_deplacement', 'cout_restauration', 'cout_administratif', 'cout_autres',
    'multi_financement', 'qualiopi_valide'
  ];
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO financement_historique (financement_id, action, nouvelle_valeur, details)
    VALUES (NEW.id, 'creation', NEW.statut, jsonb_build_object(
      'organisme', NEW.organisme,
      'montant_demande', NEW.montant_demande,
      'lead_id', NEW.lead_id
    ));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    FOREACH col IN ARRAY cols LOOP
      EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', col, col) INTO old_val, new_val USING OLD, NEW;
      IF old_val IS DISTINCT FROM new_val THEN
        INSERT INTO financement_historique (financement_id, action, champ_modifie, ancienne_valeur, nouvelle_valeur)
        VALUES (NEW.id,
          CASE WHEN col = 'statut' THEN 'statut_change' ELSE 'modification' END,
          col, old_val, new_val
        );
      END IF;
    END LOOP;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_track_financement_changes ON financements;
CREATE TRIGGER trg_track_financement_changes
  AFTER INSERT OR UPDATE ON financements
  FOR EACH ROW EXECUTE FUNCTION track_financement_changes();

-- ============================================================
-- 6. VUE FINANCEMENT ENRICHI (pour les queries)
-- ============================================================
CREATE OR REPLACE VIEW v_financements_enrichi AS
SELECT
  f.*,
  l.nom AS lead_nom,
  l.email AS lead_email,
  l.telephone AS lead_telephone,
  l.statut AS lead_statut,
  (SELECT COUNT(*) FROM financement_lignes fl WHERE fl.financement_id = f.id) AS nb_lignes_financement,
  (SELECT COALESCE(SUM(fl.montant_accorde), 0) FROM financement_lignes fl WHERE fl.financement_id = f.id AND fl.statut IN ('VALIDE', 'VERSE')) AS total_multi_accorde,
  (SELECT COUNT(*) FROM financement_historique fh WHERE fh.financement_id = f.id) AS nb_modifications
FROM financements f
LEFT JOIN leads l ON l.id = f.lead_id
WHERE f.deleted_at IS NULL;

-- ============================================================
-- 7. INDEX PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_financements_marge ON financements(taux_marge DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financements_multi ON financements(multi_financement) WHERE multi_financement = true;
CREATE INDEX IF NOT EXISTS idx_financements_parent ON financements(financement_parent_id) WHERE financement_parent_id IS NOT NULL;

-- ============================================================
-- 8. COLONNES PROFIL STAGIAIRE (pour ciblage financement)
-- ============================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS profil_financement TEXT DEFAULT 'salarie' CHECK (profil_financement IN (
  'salarie', 'independant', 'liberal', 'demandeur_emploi', 'apprenti'
));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS eligibilite_cpf BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS eligibilite_opco BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS eligibilite_agefiph BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS eligibilite_transition_pro BOOLEAN DEFAULT false;

-- Index profil financement
CREATE INDEX IF NOT EXISTS idx_leads_profil_financement ON leads(profil_financement) WHERE deleted_at IS NULL;

-- ============================================================
-- 9. TABLE PARAMÈTRES ORGANISMES (pour automatisation)
-- ============================================================
CREATE TABLE IF NOT EXISTS organismes_parametres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisme_id TEXT NOT NULL UNIQUE,
  organisme_nom TEXT NOT NULL,
  -- Paramètres techniques
  api_endpoint TEXT,
  api_key_env_var TEXT, -- nom de la variable d'environnement
  webhook_url TEXT,
  -- Contraintes métier
  montant_min NUMERIC(10,2) DEFAULT 0,
  montant_max NUMERIC(10,2),
  delai_reponse_jours INTEGER DEFAULT 30,
  profils_eligibles TEXT[] DEFAULT '{}',
  formations_eligibles TEXT[] DEFAULT '{}', -- formation IDs
  -- Documents requis
  documents_obligatoires TEXT[] DEFAULT '{}',
  -- Contact
  contact_nom TEXT,
  contact_email TEXT,
  contact_telephone TEXT,
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  auto_submit BOOLEAN DEFAULT false, -- soumission automatique si critères OK
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_organismes_parametres_updated_at
  BEFORE UPDATE ON organismes_parametres
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE organismes_parametres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organismes_parametres_authenticated" ON organismes_parametres
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 10. FONCTIONS UTILITAIRES
-- ============================================================

-- Fonction : calculer éligibilité financements pour un lead
CREATE OR REPLACE FUNCTION calcul_eligibilite_financements(
  p_lead_id UUID,
  p_formation_id UUID,
  p_montant_formation NUMERIC
)
RETURNS TABLE (
  organisme_id TEXT,
  organisme_nom TEXT,
  eligible BOOLEAN,
  montant_max_possible NUMERIC,
  raison_ineligibilite TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    op.organisme_id,
    op.organisme_nom,
    CASE
      WHEN op.is_active = false THEN false
      WHEN p_montant_formation < op.montant_min THEN false
      WHEN op.montant_max IS NOT NULL AND p_montant_formation > op.montant_max THEN false
      WHEN l.profil_financement = ANY(op.profils_eligibles) OR array_length(op.profils_eligibles, 1) IS NULL THEN true
      WHEN p_formation_id = ANY(op.formations_eligibles) OR array_length(op.formations_eligibles, 1) IS NULL THEN true
      ELSE false
    END as eligible,
    CASE
      WHEN op.montant_max IS NULL THEN p_montant_formation
      ELSE LEAST(p_montant_formation, op.montant_max)
    END as montant_max_possible,
    CASE
      WHEN op.is_active = false THEN 'Organisme inactif'
      WHEN p_montant_formation < op.montant_min THEN 'Montant trop faible'
      WHEN op.montant_max IS NOT NULL AND p_montant_formation > op.montant_max THEN 'Montant trop élevé'
      WHEN l.profil_financement != ANY(op.profils_eligibles) AND array_length(op.profils_eligibles, 1) > 0 THEN 'Profil non éligible'
      WHEN p_formation_id != ANY(op.formations_eligibles) AND array_length(op.formations_eligibles, 1) > 0 THEN 'Formation non éligible'
      ELSE NULL
    END as raison_ineligibilite
  FROM organismes_parametres op
  CROSS JOIN leads l
  WHERE l.id = p_lead_id
  ORDER BY eligible DESC, montant_max_possible DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 11. SEED DATA ORGANISMES
-- ============================================================
INSERT INTO organismes_parametres (organisme_id, organisme_nom, montant_min, montant_max, delai_reponse_jours, profils_eligibles, contact_email) VALUES
  ('OPCO_EP', 'OPCO Entreprises de proximité', 500, 15000, 45, ARRAY['salarie'], 'contact@opcoep.fr'),
  ('AKTO', 'AKTO', 500, 12000, 30, ARRAY['salarie'], 'contact@akto.fr'),
  ('FAFCEA', 'FAFCEA', 400, 8000, 60, ARRAY['independant', 'liberal'], 'contact@fafcea.org'),
  ('FIFPL', 'FIFPL', 400, 5500, 45, ARRAY['liberal'], 'contact@fifpl.fr'),
  ('FRANCE_TRAVAIL', 'France Travail (ex Pôle Emploi)', 300, NULL, 30, ARRAY['demandeur_emploi'], 'contact@francetravail.fr'),
  ('CPF', 'Compte Personnel de Formation', 200, NULL, 15, ARRAY['salarie', 'independant', 'demandeur_emploi'], 'contact@moncompteformation.gouv.fr'),
  ('AGEFIPH', 'AGEFIPH', 500, 10000, 45, ARRAY['salarie', 'demandeur_emploi'], 'contact@agefiph.fr'),
  ('TRANSITIONS_PRO', 'Transitions Pro', 1000, 25000, 60, ARRAY['salarie'], 'contact@transitionspro.fr')
ON CONFLICT (organisme_id) DO NOTHING;