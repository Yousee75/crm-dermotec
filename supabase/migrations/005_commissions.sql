-- ============================================================
-- CRM DERMOTEC — Migration 005 : Systeme de commissionnement
-- Remuneration variable basee sur les leads concretises
-- ============================================================

-- 1. Table commissions : chaque conversion = 1 ligne
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Qui touche la commission
  commercial_id UUID NOT NULL REFERENCES equipe(id),
  commercial_nom TEXT NOT NULL,

  -- Le lead converti
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  lead_nom TEXT NOT NULL,
  lead_email TEXT,

  -- L'inscription qui declenche la commission
  inscription_id UUID REFERENCES inscriptions(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,

  -- Formation et montants
  formation_nom TEXT NOT NULL,
  formation_categorie TEXT,
  montant_formation_ht NUMERIC(10,2) NOT NULL,
  montant_formation_ttc NUMERIC(10,2) NOT NULL,

  -- Financement
  mode_paiement TEXT, -- direct, financement, mixte
  organisme_financement TEXT, -- OPCO_EP, FRANCE_TRAVAIL, etc.
  montant_finance NUMERIC(10,2) DEFAULT 0,
  reste_a_charge NUMERIC(10,2) DEFAULT 0,

  -- Calcul de la commission
  taux_commission NUMERIC(5,2) NOT NULL, -- pourcentage (ex: 10.00)
  montant_commission NUMERIC(10,2) NOT NULL, -- montant en euros
  bonus_financement NUMERIC(10,2) DEFAULT 0, -- bonus si financement obtenu
  bonus_upsell NUMERIC(10,2) DEFAULT 0, -- bonus si 2eme formation
  bonus_parrainage NUMERIC(10,2) DEFAULT 0, -- bonus si lead parraine
  total_commission NUMERIC(10,2) NOT NULL, -- base + bonus

  -- Contexte
  mois_reference TEXT NOT NULL, -- '2026-03' pour le mois de mars 2026
  nb_conversions_mois INTEGER DEFAULT 1, -- combien de conversions ce mois (pour paliers)
  palier TEXT, -- 'base', 'intermediaire', 'premium'

  -- Statut
  statut TEXT DEFAULT 'DUE' CHECK (statut IN ('DUE', 'VALIDEE', 'PAYEE', 'ANNULEE', 'LITIGE')),
  date_conversion TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- quand le lead a ete converti
  date_validation TIMESTAMPTZ, -- quand le manager a valide
  date_paiement TIMESTAMPTZ, -- quand la commission a ete payee
  valide_par UUID REFERENCES equipe(id), -- qui a valide

  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commissions_commercial ON commissions(commercial_id);
CREATE INDEX idx_commissions_mois ON commissions(mois_reference);
CREATE INDEX idx_commissions_statut ON commissions(statut);
CREATE INDEX idx_commissions_lead ON commissions(lead_id);
CREATE INDEX idx_commissions_created ON commissions(created_at DESC);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_full_commissions" ON commissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Table commission_config : regles de calcul
CREATE TABLE IF NOT EXISTS commission_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL, -- 'Standard 2026', 'Promo ete', etc.
  is_active BOOLEAN DEFAULT true,

  -- Taux de base par categorie de formation
  taux_base NUMERIC(5,2) DEFAULT 10.00, -- 10% par defaut

  -- Paliers (nombre de conversions / mois)
  palier_1_seuil INTEGER DEFAULT 5, -- 0 a 5 = taux_base
  palier_1_taux NUMERIC(5,2) DEFAULT 8.00,
  palier_2_seuil INTEGER DEFAULT 10, -- 6 a 10
  palier_2_taux NUMERIC(5,2) DEFAULT 10.00,
  palier_3_seuil INTEGER DEFAULT 999, -- 11+
  palier_3_taux NUMERIC(5,2) DEFAULT 12.00,

  -- Bonus
  bonus_financement_pct NUMERIC(5,2) DEFAULT 2.00, -- +2% si financement obtenu
  bonus_upsell_fixe NUMERIC(10,2) DEFAULT 50.00, -- 50 EUR fixe si 2eme formation du meme lead
  bonus_parrainage_fixe NUMERIC(10,2) DEFAULT 30.00, -- 30 EUR si lead parraine

  -- Regles
  commission_sur_ht BOOLEAN DEFAULT true, -- calculer sur HT (pas TTC)
  inclure_financement BOOLEAN DEFAULT true, -- commission sur le montant finance aussi
  delai_paiement_jours INTEGER DEFAULT 30, -- payer 30j apres la formation

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE commission_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_full_commission_config" ON commission_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed config par defaut
INSERT INTO commission_config (nom, is_active, taux_base, palier_1_taux, palier_2_taux, palier_3_taux)
VALUES ('Standard 2026', true, 10.00, 8.00, 10.00, 12.00)
ON CONFLICT DO NOTHING;

-- 3. Vue : resume commissions par commercial par mois
CREATE OR REPLACE VIEW v_commissions_resume AS
SELECT
  commercial_id,
  commercial_nom,
  mois_reference,
  COUNT(*) AS nb_conversions,
  SUM(montant_formation_ht) AS ca_genere_ht,
  SUM(montant_commission) AS commissions_base,
  SUM(bonus_financement) AS total_bonus_financement,
  SUM(bonus_upsell) AS total_bonus_upsell,
  SUM(bonus_parrainage) AS total_bonus_parrainage,
  SUM(total_commission) AS total_commissions,
  COUNT(*) FILTER (WHERE statut = 'DUE') AS nb_dues,
  COUNT(*) FILTER (WHERE statut = 'VALIDEE') AS nb_validees,
  COUNT(*) FILTER (WHERE statut = 'PAYEE') AS nb_payees,
  COUNT(*) FILTER (WHERE statut = 'ANNULEE') AS nb_annulees,
  SUM(total_commission) FILTER (WHERE statut IN ('DUE', 'VALIDEE')) AS montant_a_payer,
  SUM(total_commission) FILTER (WHERE statut = 'PAYEE') AS montant_paye
FROM commissions
GROUP BY commercial_id, commercial_nom, mois_reference
ORDER BY mois_reference DESC, total_commissions DESC;

-- 4. Vue : top performers
CREATE OR REPLACE VIEW v_top_commerciaux AS
SELECT
  commercial_id,
  commercial_nom,
  COUNT(*) AS total_conversions,
  SUM(montant_formation_ht) AS ca_total_ht,
  SUM(total_commission) AS commissions_totales,
  ROUND(AVG(taux_commission), 1) AS taux_moyen,
  COUNT(DISTINCT formation_nom) AS formations_vendues,
  COUNT(*) FILTER (WHERE organisme_financement IS NOT NULL) AS nb_financements,
  ROUND(100.0 * COUNT(*) FILTER (WHERE organisme_financement IS NOT NULL) / NULLIF(COUNT(*), 0), 1) AS pct_finance
FROM commissions
WHERE statut != 'ANNULEE'
GROUP BY commercial_id, commercial_nom
ORDER BY commissions_totales DESC;

-- 5. Trigger updated_at
CREATE TRIGGER tr_commissions_updated BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_commission_config_updated BEFORE UPDATE ON commission_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
