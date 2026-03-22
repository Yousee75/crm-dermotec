-- Migration 020 : Workflow financement complet — Paiements, Factures, Échéancier
-- Gère le cycle de vie complet : qualification → montage → formation → facturation → paiement → clôture

-- ============================================================
-- 1. TABLE FACTURES FORMATION (distincte de la table factures existante)
-- ============================================================
CREATE TABLE IF NOT EXISTS factures_formation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Liens
  financement_id UUID REFERENCES financements(id) ON DELETE SET NULL,
  inscription_id UUID REFERENCES inscriptions(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,

  -- Identification facture
  numero_facture TEXT NOT NULL UNIQUE, -- Format FAC-2026-0001
  type TEXT NOT NULL DEFAULT 'facture' CHECK (type IN ('facture', 'avoir', 'acompte', 'proforma')),

  -- Destinataire
  destinataire_type TEXT NOT NULL CHECK (destinataire_type IN ('organisme_financeur', 'stagiaire', 'entreprise')),
  destinataire_nom TEXT NOT NULL,
  destinataire_adresse TEXT,
  destinataire_siret TEXT,
  destinataire_email TEXT,

  -- Montants
  montant_ht NUMERIC(10,2) NOT NULL,
  taux_tva NUMERIC(5,2) DEFAULT 0,
  montant_tva NUMERIC(10,2) DEFAULT 0,
  montant_ttc NUMERIC(10,2) NOT NULL,

  -- Si avoir : référence à la facture d'origine
  facture_origine_id UUID REFERENCES factures_formation(id),

  -- Statut
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN (
    'brouillon', 'validee', 'emise', 'envoyee', 'payee', 'partiellement_payee',
    'en_retard', 'impayee', 'contentieux', 'annulee'
  )),

  -- Dates
  date_emission TIMESTAMPTZ,
  date_envoi TIMESTAMPTZ,
  date_echeance TIMESTAMPTZ, -- date limite de paiement (30 jours par défaut)
  date_paiement TIMESTAMPTZ,

  -- Paiement
  montant_paye NUMERIC(10,2) DEFAULT 0,
  reste_a_payer NUMERIC(10,2) GENERATED ALWAYS AS (montant_ttc - COALESCE(montant_paye, 0)) STORED,

  -- Relances
  relance_count INTEGER DEFAULT 0,
  derniere_relance TIMESTAMPTZ,
  prochaine_relance TIMESTAMPTZ,

  -- Document
  pdf_url TEXT,

  -- Mentions légales
  mentions TEXT DEFAULT 'Exonération de TVA - Art. 261-4-4° du CGI',
  conditions_paiement TEXT DEFAULT 'Paiement à 30 jours',

  -- Notes
  notes TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- soft delete
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_factures_formation_updated_at
  BEFORE UPDATE ON factures_formation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Séquence pour numérotation auto
CREATE SEQUENCE IF NOT EXISTS facture_numero_seq START 1;

-- Fonction de génération numéro facture
CREATE OR REPLACE FUNCTION generate_numero_facture()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_facture IS NULL OR NEW.numero_facture = '' THEN
    NEW.numero_facture := CASE NEW.type
      WHEN 'facture' THEN 'FAC-'
      WHEN 'avoir' THEN 'AVO-'
      WHEN 'acompte' THEN 'ACO-'
      WHEN 'proforma' THEN 'PRO-'
    END || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('facture_numero_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_numero_facture
  BEFORE INSERT ON factures_formation
  FOR EACH ROW EXECUTE FUNCTION generate_numero_facture();

-- Index
CREATE INDEX IF NOT EXISTS idx_factures_financement ON factures_formation(financement_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures_formation(statut);
CREATE INDEX IF NOT EXISTS idx_factures_echeance ON factures_formation(date_echeance) WHERE statut NOT IN ('payee', 'annulee');
CREATE INDEX IF NOT EXISTS idx_factures_en_retard ON factures_formation(statut) WHERE statut IN ('en_retard', 'impayee', 'contentieux');

-- RLS
ALTER TABLE factures_formation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factures_authenticated" ON factures_formation FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 2. TABLE PAIEMENTS FORMATION
-- ============================================================
CREATE TABLE IF NOT EXISTS paiements_formation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Liens
  facture_id UUID REFERENCES factures_formation(id) ON DELETE SET NULL,
  financement_id UUID REFERENCES financements(id) ON DELETE SET NULL,
  inscription_id UUID REFERENCES inscriptions(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Type et source
  type TEXT NOT NULL CHECK (type IN (
    'financement_organisme',  -- Paiement par le financeur (OPCO, FAFCEA...)
    'reste_a_charge',         -- Reste à charge stagiaire
    'acompte',                -- Acompte avant formation
    'solde',                  -- Solde après formation
    'remboursement',          -- Remboursement au stagiaire
    'avoir'                   -- Avoir suite annulation
  )),

  -- Moyen de paiement
  moyen TEXT NOT NULL CHECK (moyen IN (
    'carte_bancaire', 'virement', 'cheque', 'especes',
    'prelevement', 'stripe', 'paypal', 'subrogation'
  )),

  -- Montant
  montant NUMERIC(10,2) NOT NULL,

  -- Statut
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN (
    'en_attente', 'en_cours', 'paye', 'partiel',
    'en_retard', 'impaye', 'rembourse', 'annule'
  )),

  -- Dates
  date_echeance TIMESTAMPTZ,
  date_paiement TIMESTAMPTZ,

  -- Référence
  reference TEXT, -- N° de virement, n° de chèque, ID Stripe...
  banque TEXT,

  -- Si paiement partiel
  montant_recu NUMERIC(10,2) DEFAULT 0,

  -- Relances
  relance_count INTEGER DEFAULT 0,
  derniere_relance TIMESTAMPTZ,
  motif_impaye TEXT,

  -- Notes
  notes TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_paiements_formation_updated_at
  BEFORE UPDATE ON paiements_formation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_paiements_facture ON paiements_formation(facture_id);
CREATE INDEX IF NOT EXISTS idx_paiements_financement ON paiements_formation(financement_id);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON paiements_formation(statut);
CREATE INDEX IF NOT EXISTS idx_paiements_echeance ON paiements_formation(date_echeance) WHERE statut IN ('en_attente', 'en_retard');

-- RLS
ALTER TABLE paiements_formation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paiements_authenticated" ON paiements_formation FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 3. TABLE ÉCHÉANCIER (paiement en plusieurs fois)
-- ============================================================
CREATE TABLE IF NOT EXISTS echeancier_formation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Liens
  financement_id UUID REFERENCES financements(id) ON DELETE CASCADE,
  inscription_id UUID REFERENCES inscriptions(id),
  lead_id UUID REFERENCES leads(id),

  -- Configuration
  montant_total NUMERIC(10,2) NOT NULL,
  nombre_echeances INTEGER NOT NULL CHECK (nombre_echeances BETWEEN 1 AND 12),

  -- Statut global
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'termine', 'defaut', 'annule')),

  -- Notes
  notes TEXT,
  moyen_paiement TEXT DEFAULT 'carte_bancaire',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS echeances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  echeancier_id UUID NOT NULL REFERENCES echeancier_formation(id) ON DELETE CASCADE,

  numero INTEGER NOT NULL, -- 1, 2, 3...
  montant NUMERIC(10,2) NOT NULL,
  date_echeance DATE NOT NULL,

  statut TEXT NOT NULL DEFAULT 'a_venir' CHECK (statut IN (
    'a_venir', 'paye', 'en_retard', 'impaye', 'annule'
  )),

  date_paiement DATE,
  reference_paiement TEXT,

  -- Relance
  relance_envoyee BOOLEAN DEFAULT false,
  date_relance TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_echeancier_formation_updated_at
  BEFORE UPDATE ON echeancier_formation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_echeances_updated_at
  BEFORE UPDATE ON echeances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_echeances_echeancier ON echeances(echeancier_id);
CREATE INDEX IF NOT EXISTS idx_echeances_date ON echeances(date_echeance) WHERE statut IN ('a_venir', 'en_retard');

ALTER TABLE echeancier_formation ENABLE ROW LEVEL SECURITY;
ALTER TABLE echeances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "echeancier_authenticated" ON echeancier_formation FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "echeances_authenticated" ON echeances FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 4. ENRICHIR documents sur financements (statut, signature)
-- ============================================================
-- La colonne documents est JSONB dans financements. On crée une vraie table.
CREATE TABLE IF NOT EXISTS documents_financement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  financement_id UUID NOT NULL REFERENCES financements(id) ON DELETE CASCADE,

  -- Type de document
  type TEXT NOT NULL CHECK (type IN (
    'convention', 'devis', 'programme', 'attestation_urssaf', 'kbis', 'extrait_rm',
    'diplome_esthetique', 'apc', 'certificat_realisation', 'emargement',
    'facture', 'rib', 'attestation_cpf', 'consentement', 'autre'
  )),

  -- Fichier
  nom TEXT NOT NULL,
  url TEXT, -- URL Supabase Storage
  taille_octets INTEGER,
  mime_type TEXT,

  -- Statut
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN (
    'en_attente', 'recu', 'valide', 'refuse', 'expire', 'a_signer'
  )),

  -- Validation
  valide_par UUID REFERENCES auth.users(id),
  valide_le TIMESTAMPTZ,
  motif_refus TEXT,

  -- Signature
  signe BOOLEAN DEFAULT false,
  signe_par TEXT,
  signe_le TIMESTAMPTZ,
  signature_type TEXT CHECK (signature_type IN ('manuscrite', 'electronique', 'cachet')),

  -- Dates
  date_reception TIMESTAMPTZ DEFAULT NOW(),
  date_expiration TIMESTAMPTZ, -- ex: attestation URSSAF valable 1 an

  -- Notes
  commentaire TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_documents_financement_updated_at
  BEFORE UPDATE ON documents_financement
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_docs_financement ON documents_financement(financement_id);
CREATE INDEX IF NOT EXISTS idx_docs_type ON documents_financement(type);
CREATE INDEX IF NOT EXISTS idx_docs_statut ON documents_financement(statut);

ALTER TABLE documents_financement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs_financement_authenticated" ON documents_financement FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 5. ENRICHIR TABLE FINANCEMENTS — colonnes workflow
-- ============================================================
ALTER TABLE financements ADD COLUMN IF NOT EXISTS etape_workflow TEXT DEFAULT 'qualification' CHECK (etape_workflow IN (
  'qualification', 'collecte_docs', 'dossier_complet', 'depose', 'en_instruction',
  'complement_demande', 'accorde', 'inscription_confirmee', 'en_formation',
  'facture_envoyee', 'paiement_recu', 'cloture', 'refuse', 'annule'
));

ALTER TABLE financements ADD COLUMN IF NOT EXISTS mode_paiement TEXT CHECK (mode_paiement IN (
  'subrogation', 'remboursement_stagiaire', 'mixte'
));

ALTER TABLE financements ADD COLUMN IF NOT EXISTS echeancier_id UUID REFERENCES echeancier_formation(id);
ALTER TABLE financements ADD COLUMN IF NOT EXISTS date_accord TIMESTAMPTZ;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS numero_apc TEXT; -- Accord de Prise en Charge
ALTER TABLE financements ADD COLUMN IF NOT EXISTS montant_apc NUMERIC(10,2); -- montant exact de l'APC

-- Annulation
ALTER TABLE financements ADD COLUMN IF NOT EXISTS annule BOOLEAN DEFAULT false;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS date_annulation TIMESTAMPTZ;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS motif_annulation TEXT;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS montant_remboursement NUMERIC(10,2) DEFAULT 0;

-- Suivi paiement global
ALTER TABLE financements ADD COLUMN IF NOT EXISTS total_facture NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS total_paye NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS solde_restant NUMERIC(10,2) DEFAULT 0;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS paiement_en_retard BOOLEAN DEFAULT false;
ALTER TABLE financements ADD COLUMN IF NOT EXISTS jours_retard INTEGER DEFAULT 0;

-- Ajout de la colonne deleted_at pour soft delete si elle n'existe pas déjà
ALTER TABLE financements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================
-- 6. TRIGGER : mise à jour automatique du solde paiement
-- ============================================================
CREATE OR REPLACE FUNCTION update_financement_solde()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paye NUMERIC(10,2);
  v_total_facture NUMERIC(10,2);
BEGIN
  -- Calculer le total payé pour ce financement
  SELECT COALESCE(SUM(montant_recu), 0) INTO v_total_paye
  FROM paiements_formation
  WHERE financement_id = COALESCE(NEW.financement_id, OLD.financement_id)
  AND statut IN ('paye', 'partiel');

  -- Calculer le total facturé
  SELECT COALESCE(SUM(montant_ttc), 0) INTO v_total_facture
  FROM factures_formation
  WHERE financement_id = COALESCE(NEW.financement_id, OLD.financement_id)
  AND statut NOT IN ('annulee', 'brouillon');

  -- Mettre à jour le financement
  UPDATE financements SET
    total_paye = v_total_paye,
    total_facture = v_total_facture,
    solde_restant = v_total_facture - v_total_paye,
    paiement_en_retard = EXISTS (
      SELECT 1 FROM factures_formation
      WHERE financement_id = COALESCE(NEW.financement_id, OLD.financement_id)
      AND statut IN ('en_retard', 'impayee')
    )
  WHERE id = COALESCE(NEW.financement_id, OLD.financement_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_financement_solde_paiement
  AFTER INSERT OR UPDATE OR DELETE ON paiements_formation
  FOR EACH ROW EXECUTE FUNCTION update_financement_solde();

CREATE TRIGGER trg_update_financement_solde_facture
  AFTER INSERT OR UPDATE OR DELETE ON factures_formation
  FOR EACH ROW EXECUTE FUNCTION update_financement_solde();

-- ============================================================
-- 7. TRIGGER : détection automatique retard de paiement
-- ============================================================
CREATE OR REPLACE FUNCTION check_factures_en_retard()
RETURNS void AS $$
BEGIN
  -- Marquer les factures en retard (date_echeance dépassée et pas payée)
  UPDATE factures_formation
  SET statut = 'en_retard',
      prochaine_relance = NOW() + INTERVAL '7 days'
  WHERE statut IN ('envoyee', 'emise')
  AND date_echeance < NOW()
  AND deleted_at IS NULL;

  -- Marquer les échéances en retard
  UPDATE echeances
  SET statut = 'en_retard'
  WHERE statut = 'a_venir'
  AND date_echeance < CURRENT_DATE;

  -- Mettre à jour le nombre de jours de retard sur les financements
  UPDATE financements f
  SET jours_retard = EXTRACT(DAY FROM NOW() - (
    SELECT MIN(date_echeance) FROM factures_formation ff
    WHERE ff.financement_id = f.id AND ff.statut = 'en_retard'
  ))
  WHERE EXISTS (
    SELECT 1 FROM factures_formation ff
    WHERE ff.financement_id = f.id AND ff.statut = 'en_retard'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. VUE CONSOLIDÉE WORKFLOW FINANCEMENT
-- ============================================================
CREATE OR REPLACE VIEW v_financement_workflow AS
SELECT
  f.id,
  f.lead_id,
  l.nom AS lead_nom,
  l.email AS lead_email,
  l.telephone AS lead_telephone,
  f.organisme,
  f.statut,
  f.etape_workflow,
  f.montant_demande,
  f.montant_accorde,
  f.montant_verse,
  f.montant_apc,
  f.numero_apc,
  f.numero_dossier,
  f.mode_paiement,
  f.total_facture,
  f.total_paye,
  f.solde_restant,
  f.paiement_en_retard,
  f.jours_retard,
  f.annule,
  f.multi_financement,
  f.date_soumission,
  f.date_reponse,
  f.date_accord,
  f.created_at,
  f.updated_at,
  -- Compteurs documents
  (SELECT COUNT(*) FROM documents_financement d WHERE d.financement_id = f.id) AS nb_documents,
  (SELECT COUNT(*) FROM documents_financement d WHERE d.financement_id = f.id AND d.statut = 'valide') AS nb_documents_valides,
  (SELECT COUNT(*) FROM documents_financement d WHERE d.financement_id = f.id AND d.statut = 'en_attente') AS nb_documents_en_attente,
  -- Compteurs factures
  (SELECT COUNT(*) FROM factures_formation ff WHERE ff.financement_id = f.id AND ff.deleted_at IS NULL) AS nb_factures,
  (SELECT COUNT(*) FROM factures_formation ff WHERE ff.financement_id = f.id AND ff.statut = 'payee') AS nb_factures_payees,
  -- Compteurs paiements
  (SELECT COUNT(*) FROM paiements_formation p WHERE p.financement_id = f.id) AS nb_paiements,
  -- Multi-financement lignes
  (SELECT COUNT(*) FROM financement_lignes fl WHERE fl.financement_id = f.id) AS nb_lignes_multi,
  -- Historique
  (SELECT COUNT(*) FROM financement_historique fh WHERE fh.financement_id = f.id) AS nb_modifications
FROM financements f
LEFT JOIN leads l ON l.id = f.lead_id
WHERE f.deleted_at IS NULL;

-- ============================================================
-- 9. INDEX PERFORMANCE GLOBAUX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_financements_workflow ON financements(etape_workflow) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financements_retard ON financements(paiement_en_retard) WHERE paiement_en_retard = true;
CREATE INDEX IF NOT EXISTS idx_financements_annule ON financements(annule) WHERE annule = true;
CREATE INDEX IF NOT EXISTS idx_financements_deleted ON financements(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- 10. FONCTIONS UTILITAIRES WORKFLOW
-- ============================================================

-- Fonction pour calculer le taux de conversion du workflow financement
CREATE OR REPLACE FUNCTION stats_conversion_workflow()
RETURNS TABLE (
  etape TEXT,
  nb_total BIGINT,
  taux_conversion NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH workflow_stats AS (
    SELECT
      etape_workflow,
      COUNT(*) as nb
    FROM financements
    WHERE deleted_at IS NULL
    GROUP BY etape_workflow
  ),
  total_leads AS (
    SELECT SUM(nb) as total FROM workflow_stats
  )
  SELECT
    ws.etape_workflow as etape,
    ws.nb as nb_total,
    ROUND((ws.nb::NUMERIC / tl.total) * 100, 2) as taux_conversion
  FROM workflow_stats ws
  CROSS JOIN total_leads tl
  ORDER BY
    CASE ws.etape_workflow
      WHEN 'qualification' THEN 1
      WHEN 'collecte_docs' THEN 2
      WHEN 'dossier_complet' THEN 3
      WHEN 'depose' THEN 4
      WHEN 'en_instruction' THEN 5
      WHEN 'complement_demande' THEN 6
      WHEN 'accorde' THEN 7
      WHEN 'inscription_confirmee' THEN 8
      WHEN 'en_formation' THEN 9
      WHEN 'facture_envoyee' THEN 10
      WHEN 'paiement_recu' THEN 11
      WHEN 'cloture' THEN 12
      ELSE 13
    END;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour automatiser les transitions d'étape workflow
CREATE OR REPLACE FUNCTION auto_transition_workflow(p_financement_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_financement financements%ROWTYPE;
  v_nb_docs_valides INTEGER;
  v_nb_docs_requis INTEGER := 5; -- Convention, devis, programme, URSSAF, diplôme minimum
  v_nouvelle_etape TEXT;
BEGIN
  -- Récupérer le financement
  SELECT * INTO v_financement FROM financements WHERE id = p_financement_id;

  IF v_financement.id IS NULL THEN
    RETURN 'Financement introuvable';
  END IF;

  -- Compter documents validés
  SELECT COUNT(*) INTO v_nb_docs_valides
  FROM documents_financement
  WHERE financement_id = p_financement_id
  AND statut = 'valide';

  -- Logique de transition automatique
  CASE v_financement.etape_workflow
    WHEN 'qualification' THEN
      IF v_financement.organisme IS NOT NULL AND v_financement.montant_demande > 0 THEN
        v_nouvelle_etape := 'collecte_docs';
      END IF;

    WHEN 'collecte_docs' THEN
      IF v_nb_docs_valides >= v_nb_docs_requis THEN
        v_nouvelle_etape := 'dossier_complet';
      END IF;

    WHEN 'dossier_complet' THEN
      IF v_financement.date_soumission IS NOT NULL THEN
        v_nouvelle_etape := 'depose';
      END IF;

    WHEN 'depose' THEN
      IF v_financement.statut = 'EN_EXAMEN' THEN
        v_nouvelle_etape := 'en_instruction';
      END IF;

    WHEN 'en_instruction' THEN
      IF v_financement.statut = 'VALIDE' AND v_financement.date_accord IS NOT NULL THEN
        v_nouvelle_etape := 'accorde';
      END IF;

    WHEN 'accorde' THEN
      IF v_financement.inscription_id IS NOT NULL THEN
        v_nouvelle_etape := 'inscription_confirmee';
      END IF;

    WHEN 'inscription_confirmee' THEN
      -- Vérifier si la formation a commencé
      IF EXISTS (
        SELECT 1 FROM sessions s
        JOIN inscriptions i ON i.session_id = s.id
        WHERE i.id = v_financement.inscription_id
        AND s.date_debut <= CURRENT_DATE
      ) THEN
        v_nouvelle_etape := 'en_formation';
      END IF;

    WHEN 'en_formation' THEN
      -- Vérifier si une facture a été envoyée
      IF EXISTS (
        SELECT 1 FROM factures_formation
        WHERE financement_id = p_financement_id
        AND statut IN ('envoyee', 'payee')
      ) THEN
        v_nouvelle_etape := 'facture_envoyee';
      END IF;

    WHEN 'facture_envoyee' THEN
      IF v_financement.total_paye >= v_financement.total_facture THEN
        v_nouvelle_etape := 'paiement_recu';
      END IF;

    WHEN 'paiement_recu' THEN
      -- Auto-clôture si formation terminée + paiement complet
      IF EXISTS (
        SELECT 1 FROM sessions s
        JOIN inscriptions i ON i.session_id = s.id
        WHERE i.id = v_financement.inscription_id
        AND s.statut = 'TERMINEE'
      ) AND v_financement.total_paye >= v_financement.total_facture THEN
        v_nouvelle_etape := 'cloture';
      END IF;

    ELSE
      v_nouvelle_etape := v_financement.etape_workflow; -- Aucun changement
  END CASE;

  -- Mise à jour si transition détectée
  IF v_nouvelle_etape IS NOT NULL AND v_nouvelle_etape != v_financement.etape_workflow THEN
    UPDATE financements
    SET etape_workflow = v_nouvelle_etape,
        updated_at = NOW()
    WHERE id = p_financement_id;

    RETURN 'Transition automatique : ' || v_financement.etape_workflow || ' → ' || v_nouvelle_etape;
  END IF;

  RETURN 'Aucune transition automatique possible';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 11. FONCTION ALERTE RETARDS
-- ============================================================
CREATE OR REPLACE FUNCTION alertes_retards_financement()
RETURNS TABLE (
  financement_id UUID,
  lead_nom TEXT,
  organisme TEXT,
  type_retard TEXT,
  jours_retard INTEGER,
  montant_concerne NUMERIC,
  action_recommandee TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Retards de paiement
  SELECT
    f.id,
    l.nom,
    f.organisme,
    'paiement' as type_retard,
    f.jours_retard,
    f.solde_restant,
    CASE
      WHEN f.jours_retard > 60 THEN 'Procédure contentieux'
      WHEN f.jours_retard > 30 THEN 'Relance formelle'
      ELSE 'Relance client'
    END as action_recommandee
  FROM financements f
  LEFT JOIN leads l ON l.id = f.lead_id
  WHERE f.paiement_en_retard = true
  AND f.deleted_at IS NULL

  UNION ALL

  -- Retards de documents
  SELECT
    f.id,
    l.nom,
    f.organisme,
    'documents' as type_retard,
    EXTRACT(DAY FROM NOW() - f.updated_at)::INTEGER,
    f.montant_demande,
    'Relancer documents manquants'
  FROM financements f
  LEFT JOIN leads l ON l.id = f.lead_id
  WHERE f.etape_workflow IN ('collecte_docs', 'complement_demande')
  AND f.updated_at < NOW() - INTERVAL '7 days'
  AND f.deleted_at IS NULL

  UNION ALL

  -- Retards d'instruction organisme
  SELECT
    f.id,
    l.nom,
    f.organisme,
    'instruction' as type_retard,
    EXTRACT(DAY FROM NOW() - f.date_soumission)::INTEGER,
    f.montant_demande,
    'Relancer organisme financeur'
  FROM financements f
  LEFT JOIN leads l ON l.id = f.lead_id
  WHERE f.etape_workflow = 'en_instruction'
  AND f.date_soumission < NOW() - INTERVAL '30 days'
  AND f.deleted_at IS NULL

  ORDER BY jours_retard DESC, montant_concerne DESC;
END;
$$ LANGUAGE plpgsql;