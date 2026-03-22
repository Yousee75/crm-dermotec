-- Migration 029: Tables devis et auto-enrichissement
-- Auteur: CRM Dermotec
-- Date: 2026-03-22

-- Table devis pour la génération automatique de devis
CREATE TABLE devis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL,
    formation_nom TEXT NOT NULL,
    formation_prix_ht INTEGER NOT NULL,
    tva_taux NUMERIC(4,2) DEFAULT 20.00,
    montant_ht INTEGER NOT NULL,
    montant_tva INTEGER NOT NULL,
    montant_ttc INTEGER NOT NULL,
    financement_type TEXT CHECK (financement_type IN ('autofinancement', 'opco', 'cpf', 'france_travail')),
    financement_montant INTEGER DEFAULT 0,
    reste_a_charge INTEGER,
    echeances INTEGER DEFAULT 1,
    stripe_payment_link TEXT,
    stripe_session_id TEXT,
    pdf_url TEXT,
    statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon','envoye','consulte','signe','paye','expire','annule')),
    validite_jours INTEGER DEFAULT 30,
    notes TEXT,
    sent_at TIMESTAMPTZ,
    consulted_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour tracker l'enrichissement automatique des leads
CREATE TABLE auto_enrichment_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('pappers', 'google_places', 'instagram', 'societe_com')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','success','failed','skipped')),
    data_before JSONB,
    data_after JSONB,
    credits_used NUMERIC(6,4) DEFAULT 0,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_devis_lead_id ON devis(lead_id);
CREATE INDEX idx_devis_statut ON devis(statut);
CREATE INDEX idx_devis_expires_at ON devis(expires_at);

CREATE INDEX idx_auto_enrichment_lead_id ON auto_enrichment_log(lead_id);
CREATE INDEX idx_auto_enrichment_provider ON auto_enrichment_log(provider);
CREATE INDEX idx_auto_enrichment_created_at ON auto_enrichment_log(created_at);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_devis_updated_at
    BEFORE UPDATE ON devis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_enrichment_log ENABLE ROW LEVEL SECURITY;

-- Policies pour devis
CREATE POLICY "Users can view devis" ON devis
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create devis" ON devis
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update devis" ON devis
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role has full access to devis" ON devis
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies pour auto_enrichment_log
CREATE POLICY "Users can view enrichment logs" ON auto_enrichment_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role has full access to enrichment logs" ON auto_enrichment_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Commentaires
COMMENT ON TABLE devis IS 'Devis générés automatiquement pour les prospects avec formations';
COMMENT ON COLUMN devis.formation_prix_ht IS 'Prix HT en centimes ou euros selon la logique métier';
COMMENT ON COLUMN devis.financement_montant IS 'Montant pris en charge par l\'organisme de financement';
COMMENT ON COLUMN devis.reste_a_charge IS 'Montant restant à payer par le prospect';

COMMENT ON TABLE auto_enrichment_log IS 'Log des tentatives d\'enrichissement automatique des données prospects';
COMMENT ON COLUMN auto_enrichment_log.credits_used IS 'Nombre de crédits API consommés pour cet enrichissement';
COMMENT ON COLUMN auto_enrichment_log.data_before IS 'État des données avant enrichissement';
COMMENT ON COLUMN auto_enrichment_log.data_after IS 'État des données après enrichissement';