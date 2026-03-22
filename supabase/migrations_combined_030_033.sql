-- ============================================================
-- CRM SATOREA — Migrations combinées 030-033
-- À exécuter dans Supabase SQL Editor
-- Sun Mar 22 17:45:54     2026
-- ============================================================


-- ============================================================
-- 030_enrichment_v2_intelligence.sql
-- ============================================================

-- ============================================================
-- CRM DERMOTEC — Migration 030: Enrichment v2 Intelligence
-- 10 nouvelles sources gratuites : Formation + Marche + Geo
-- Inspiré par : plan enrichissement v2 (25 sources totales)
-- ============================================================

-- ============================================================
-- 1. INTELLIGENCE FORMATION — Données CPF / OF / RNCP
-- ============================================================

-- Formations CPF depuis Mon Compte Formation (EDOF)
CREATE TABLE IF NOT EXISTS enrichment_cpf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identification
    organisme_siren TEXT,
    organisme_nom TEXT NOT NULL,
    organisme_nda TEXT, -- Numéro Déclaration Activité
    -- Formation
    intitule TEXT NOT NULL,
    code_rncp TEXT,
    code_rs TEXT,
    code_nsf TEXT, -- Nomenclature des Spécialités de Formation
    niveau_sortie TEXT,
    -- Conditions
    prix_ttc INTEGER, -- en centimes
    duree_heures INTEGER,
    modalite TEXT, -- présentiel, distanciel, mixte
    -- Localisation
    region TEXT,
    departement TEXT,
    ville TEXT,
    code_postal TEXT,
    -- Méta
    nb_sessions INTEGER DEFAULT 0,
    date_debut DATE,
    date_fin DATE,
    certifiante BOOLEAN DEFAULT false,
    -- Cache
    source_id TEXT, -- ID unique dans l'API EDOF
    raw_data JSONB DEFAULT '{}',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_cpf_siren ON enrichment_cpf(organisme_siren);
CREATE INDEX IF NOT EXISTS idx_enrichment_cpf_dept ON enrichment_cpf(departement);
CREATE INDEX IF NOT EXISTS idx_enrichment_cpf_rncp ON enrichment_cpf(code_rncp);
CREATE INDEX IF NOT EXISTS idx_enrichment_cpf_intitule ON enrichment_cpf USING gin(to_tsvector('french', intitule));
CREATE INDEX IF NOT EXISTS idx_enrichment_cpf_fetched ON enrichment_cpf(fetched_at);

CREATE TRIGGER IF NOT EXISTS tr_enrichment_cpf_updated
    BEFORE UPDATE ON enrichment_cpf
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Organismes de formation depuis DGEFP
CREATE TABLE IF NOT EXISTS enrichment_of_dgefp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identification
    nda TEXT, -- Numéro Déclaration Activité (unique)
    siren TEXT,
    siret TEXT,
    nom TEXT NOT NULL,
    -- Données DGEFP
    effectif_formateurs INTEGER,
    nb_stagiaires INTEGER,
    specialites TEXT[],
    statut_bpf TEXT, -- Bilan Pédagogique et Financier
    qualiopi BOOLEAN DEFAULT false,
    qualiopi_actions TEXT[], -- actions de formation, bilan, VAE, apprentissage
    -- Localisation
    adresse TEXT,
    code_postal TEXT,
    ville TEXT,
    region TEXT,
    departement TEXT,
    -- Contact
    telephone TEXT,
    email TEXT,
    website TEXT,
    -- Méta
    raw_data JSONB DEFAULT '{}',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrichment_of_nda ON enrichment_of_dgefp(nda) WHERE nda IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrichment_of_siren ON enrichment_of_dgefp(siren);
CREATE INDEX IF NOT EXISTS idx_enrichment_of_dept ON enrichment_of_dgefp(departement);
CREATE INDEX IF NOT EXISTS idx_enrichment_of_qualiopi ON enrichment_of_dgefp(qualiopi);
CREATE INDEX IF NOT EXISTS idx_enrichment_of_nom ON enrichment_of_dgefp USING gin(to_tsvector('french', nom));

CREATE TRIGGER IF NOT EXISTS tr_enrichment_of_updated
    BEFORE UPDATE ON enrichment_of_dgefp
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. INTELLIGENCE MARCHE — Emploi / BODACC / PageSpeed / INPI
-- ============================================================

-- Offres emploi depuis France Travail
CREATE TABLE IF NOT EXISTS enrichment_emploi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Offre
    offre_id TEXT NOT NULL, -- ID France Travail
    intitule TEXT NOT NULL,
    description TEXT,
    -- Entreprise
    entreprise_nom TEXT,
    entreprise_siren TEXT,
    -- Conditions
    type_contrat TEXT, -- CDI, CDD, Intérim...
    salaire_min INTEGER, -- en centimes annuel
    salaire_max INTEGER,
    experience_requis TEXT, -- D (débutant), S (1-3 ans), E (3+ ans)
    -- Localisation
    commune TEXT,
    departement TEXT,
    code_postal TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    -- Méta
    code_rome TEXT DEFAULT 'D1208', -- Soins esthétiques
    date_creation DATE,
    date_actualisation DATE,
    raw_data JSONB DEFAULT '{}',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrichment_emploi_offre ON enrichment_emploi(offre_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_emploi_dept ON enrichment_emploi(departement);
CREATE INDEX IF NOT EXISTS idx_enrichment_emploi_siren ON enrichment_emploi(entreprise_siren);
CREATE INDEX IF NOT EXISTS idx_enrichment_emploi_rome ON enrichment_emploi(code_rome);
CREATE INDEX IF NOT EXISTS idx_enrichment_emploi_date ON enrichment_emploi(date_creation DESC);

-- Annonces légales depuis BODACC
CREATE TABLE IF NOT EXISTS enrichment_bodacc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identification
    annonce_id TEXT NOT NULL,
    siren TEXT,
    denomination TEXT,
    -- Annonce
    type_annonce TEXT NOT NULL CHECK (type_annonce IN (
        'immatriculation', 'modification', 'radiation',
        'vente', 'procedure_collective', 'depot_comptes',
        'jugement', 'avis_prealable', 'autre'
    )),
    sous_type TEXT, -- redressement, liquidation, sauvegarde...
    contenu TEXT,
    -- Tribunal
    tribunal TEXT,
    -- Date
    date_parution DATE,
    numero_parution TEXT,
    -- Méta
    raw_data JSONB DEFAULT '{}',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrichment_bodacc_annonce ON enrichment_bodacc(annonce_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_bodacc_siren ON enrichment_bodacc(siren);
CREATE INDEX IF NOT EXISTS idx_enrichment_bodacc_type ON enrichment_bodacc(type_annonce);
CREATE INDEX IF NOT EXISTS idx_enrichment_bodacc_date ON enrichment_bodacc(date_parution DESC);

-- Scores PageSpeed
CREATE TABLE IF NOT EXISTS enrichment_pagespeed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Cible
    url TEXT NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    competitor_id UUID REFERENCES competitor_profiles(id) ON DELETE SET NULL,
    -- Scores (0-100)
    score_mobile INTEGER,
    score_desktop INTEGER,
    -- Core Web Vitals
    lcp_ms INTEGER, -- Largest Contentful Paint
    fid_ms INTEGER, -- First Input Delay
    cls NUMERIC(4,3), -- Cumulative Layout Shift
    fcp_ms INTEGER, -- First Contentful Paint
    ttfb_ms INTEGER, -- Time to First Byte
    si_ms INTEGER, -- Speed Index
    -- Diagnostics
    suggestions JSONB DEFAULT '[]',
    opportunities JSONB DEFAULT '[]',
    -- Méta
    strategy TEXT DEFAULT 'mobile' CHECK (strategy IN ('mobile', 'desktop')),
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_pagespeed_url ON enrichment_pagespeed(url);
CREATE INDEX IF NOT EXISTS idx_enrichment_pagespeed_lead ON enrichment_pagespeed(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_pagespeed_competitor ON enrichment_pagespeed(competitor_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_pagespeed_fetched ON enrichment_pagespeed(fetched_at);

-- Bilans INPI
CREATE TABLE IF NOT EXISTS enrichment_inpi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identification
    siren TEXT NOT NULL,
    denomination TEXT,
    -- Bilan
    annee_cloture INTEGER,
    date_cloture DATE,
    duree_exercice INTEGER, -- en mois
    -- Chiffres clés (en euros)
    chiffre_affaires BIGINT,
    resultat_net BIGINT,
    total_bilan BIGINT,
    capitaux_propres BIGINT,
    effectif INTEGER,
    -- Méta
    type_comptes TEXT, -- complet, simplifié, consolidé
    confidentialite TEXT,
    pdf_url TEXT,
    raw_data JSONB DEFAULT '{}',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_inpi_siren ON enrichment_inpi(siren);
CREATE INDEX IF NOT EXISTS idx_enrichment_inpi_annee ON enrichment_inpi(annee_cloture DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrichment_inpi_unique ON enrichment_inpi(siren, annee_cloture);

-- ============================================================
-- 3. INTELLIGENCE GEOGRAPHIQUE — INSEE IRIS / DVF
-- ============================================================

-- Revenus par IRIS (pré-chargé depuis fichier CSV INSEE)
CREATE TABLE IF NOT EXISTS iris_revenus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Identification IRIS
    code_iris TEXT NOT NULL,
    libelle_iris TEXT,
    code_commune TEXT NOT NULL,
    nom_commune TEXT,
    departement TEXT,
    region TEXT,
    -- Revenus (Filosofi 2021)
    revenu_median INTEGER, -- en euros
    revenu_q1 INTEGER, -- 1er quartile
    revenu_q3 INTEGER, -- 3ème quartile
    taux_pauvrete NUMERIC(4,1), -- en %
    -- Population
    nb_menages INTEGER,
    nb_personnes INTEGER,
    part_moins_30 NUMERIC(4,1), -- en %
    part_30_60 NUMERIC(4,1),
    part_plus_60 NUMERIC(4,1),
    -- Méta
    annee_donnees INTEGER DEFAULT 2021,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_iris_code ON iris_revenus(code_iris);
CREATE INDEX IF NOT EXISTS idx_iris_commune ON iris_revenus(code_commune);
CREATE INDEX IF NOT EXISTS idx_iris_dept ON iris_revenus(departement);
CREATE INDEX IF NOT EXISTS idx_iris_revenu ON iris_revenus(revenu_median DESC);

-- Prix immobilier par commune (DVF)
CREATE TABLE IF NOT EXISTS dvf_prix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Localisation
    code_commune TEXT NOT NULL,
    nom_commune TEXT,
    departement TEXT,
    code_postal TEXT,
    -- Prix (calculés depuis DVF Etalab)
    prix_m2_median INTEGER, -- en euros
    prix_m2_moyen INTEGER,
    nb_transactions INTEGER,
    -- Par type
    prix_m2_appart INTEGER,
    prix_m2_maison INTEGER,
    -- Méta
    annee INTEGER NOT NULL,
    trimestre INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dvf_commune_annee ON dvf_prix(code_commune, annee, trimestre);
CREATE INDEX IF NOT EXISTS idx_dvf_commune ON dvf_prix(code_commune);
CREATE INDEX IF NOT EXISTS idx_dvf_dept ON dvf_prix(departement);
CREATE INDEX IF NOT EXISTS idx_dvf_prix ON dvf_prix(prix_m2_median DESC);

CREATE TRIGGER IF NOT EXISTS tr_dvf_updated
    BEFORE UPDATE ON dvf_prix
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. ENRICHIR competitor_profiles avec les nouvelles données
-- ============================================================

DO $$ BEGIN
    -- PageSpeed scores
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'pagespeed_mobile') THEN
        ALTER TABLE competitor_profiles ADD COLUMN pagespeed_mobile INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'pagespeed_desktop') THEN
        ALTER TABLE competitor_profiles ADD COLUMN pagespeed_desktop INTEGER;
    END IF;
    -- BODACC status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'bodacc_procedure') THEN
        ALTER TABLE competitor_profiles ADD COLUMN bodacc_procedure TEXT; -- redressement, liquidation, null
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'bodacc_derniere_date') THEN
        ALTER TABLE competitor_profiles ADD COLUMN bodacc_derniere_date DATE;
    END IF;
    -- DGEFP / Formation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'est_organisme_formation') THEN
        ALTER TABLE competitor_profiles ADD COLUMN est_organisme_formation BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'nda') THEN
        ALTER TABLE competitor_profiles ADD COLUMN nda TEXT; -- Numéro Déclaration Activité
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'qualiopi') THEN
        ALTER TABLE competitor_profiles ADD COLUMN qualiopi BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'nb_formations_cpf') THEN
        ALTER TABLE competitor_profiles ADD COLUMN nb_formations_cpf INTEGER DEFAULT 0;
    END IF;
    -- Emploi / croissance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'offres_emploi_actives') THEN
        ALTER TABLE competitor_profiles ADD COLUMN offres_emploi_actives INTEGER DEFAULT 0;
    END IF;
    -- Zone de chalandise
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'revenu_median_quartier') THEN
        ALTER TABLE competitor_profiles ADD COLUMN revenu_median_quartier INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitor_profiles' AND column_name = 'prix_m2_zone') THEN
        ALTER TABLE competitor_profiles ADD COLUMN prix_m2_zone INTEGER;
    END IF;
END $$;

-- ============================================================
-- 5. ENRICHIR la table leads aussi
-- ============================================================

DO $$ BEGIN
    -- Formation / CPF
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'est_organisme_formation') THEN
        ALTER TABLE leads ADD COLUMN est_organisme_formation BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'nda') THEN
        ALTER TABLE leads ADD COLUMN nda TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'qualiopi') THEN
        ALTER TABLE leads ADD COLUMN qualiopi BOOLEAN DEFAULT false;
    END IF;
    -- Zone de chalandise
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'revenu_median_quartier') THEN
        ALTER TABLE leads ADD COLUMN revenu_median_quartier INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'prix_m2_zone') THEN
        ALTER TABLE leads ADD COLUMN prix_m2_zone INTEGER;
    END IF;
    -- Maturité digitale
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'pagespeed_mobile') THEN
        ALTER TABLE leads ADD COLUMN pagespeed_mobile INTEGER;
    END IF;
    -- Marché local
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'offres_emploi_zone') THEN
        ALTER TABLE leads ADD COLUMN offres_emploi_zone INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'concurrents_of_zone') THEN
        ALTER TABLE leads ADD COLUMN concurrents_of_zone INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- 6. Mettre à jour auto_enrichment_log providers
-- ============================================================

-- Ajouter les nouveaux providers à la contrainte CHECK
ALTER TABLE auto_enrichment_log DROP CONSTRAINT IF EXISTS auto_enrichment_log_provider_check;
ALTER TABLE auto_enrichment_log ADD CONSTRAINT auto_enrichment_log_provider_check
    CHECK (provider IN (
        -- Existants
        'pappers', 'google_places', 'social_scraping', 'instagram_scraping',
        'facebook_scraping', 'linkedin_scraping', 'corporama', 'societe_com',
        -- Nouveaux v2
        'edof_cpf', 'dgefp_of', 'rncp', 'france_travail', 'bodacc',
        'pagespeed', 'inpi', 'insee_iris', 'dvf'
    ));

-- ============================================================
-- 7. RLS sur toutes les nouvelles tables
-- ============================================================

ALTER TABLE enrichment_cpf ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_of_dgefp ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_emploi ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_bodacc ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_pagespeed ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_inpi ENABLE ROW LEVEL SECURITY;
ALTER TABLE iris_revenus ENABLE ROW LEVEL SECURITY;
ALTER TABLE dvf_prix ENABLE ROW LEVEL SECURITY;

-- Policies : authenticated = lecture, service_role = tout
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'enrichment_cpf', 'enrichment_of_dgefp', 'enrichment_emploi',
        'enrichment_bodacc', 'enrichment_pagespeed', 'enrichment_inpi',
        'iris_revenus', 'dvf_prix'
    ] LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "%1$s_select" ON %1$s;
            CREATE POLICY "%1$s_select" ON %1$s FOR SELECT TO authenticated USING (true);
            DROP POLICY IF EXISTS "%1$s_service" ON %1$s;
            CREATE POLICY "%1$s_service" ON %1$s FOR ALL TO service_role USING (true);
        ', tbl);
    END LOOP;
END $$;

-- ============================================================
-- 8. Vue synthèse intelligence formation par zone
-- ============================================================

CREATE OR REPLACE VIEW v_intelligence_formation AS
SELECT
    departement,
    COUNT(*) AS nb_organismes,
    COUNT(*) FILTER (WHERE qualiopi = true) AS nb_qualiopi,
    AVG(nb_stagiaires) AS avg_stagiaires,
    AVG(effectif_formateurs) AS avg_formateurs
FROM enrichment_of_dgefp
WHERE departement IS NOT NULL
GROUP BY departement
ORDER BY nb_organismes DESC;

-- Vue offres emploi par zone
CREATE OR REPLACE VIEW v_intelligence_emploi AS
SELECT
    departement,
    code_rome,
    COUNT(*) AS nb_offres,
    COUNT(*) FILTER (WHERE type_contrat = 'CDI') AS nb_cdi,
    COUNT(*) FILTER (WHERE type_contrat = 'CDD') AS nb_cdd,
    AVG(salaire_min) AS salaire_min_moyen,
    MAX(date_creation) AS derniere_offre
FROM enrichment_emploi
WHERE departement IS NOT NULL
GROUP BY departement, code_rome
ORDER BY nb_offres DESC;

-- ============================================================
-- 9. Commentaires
-- ============================================================

COMMENT ON TABLE enrichment_cpf IS 'Formations CPF depuis Mon Compte Formation (EDOF) — intelligence concurrentielle formation';
COMMENT ON TABLE enrichment_of_dgefp IS 'Organismes de formation déclarés depuis DGEFP — base de prospection et veille';
COMMENT ON TABLE enrichment_emploi IS 'Offres emploi esthétique depuis France Travail — indicateur croissance marché';
COMMENT ON TABLE enrichment_bodacc IS 'Annonces légales BODACC — créations, radiations, procédures collectives';
COMMENT ON TABLE enrichment_pagespeed IS 'Scores Google PageSpeed — maturité digitale prospects et concurrents';
COMMENT ON TABLE enrichment_inpi IS 'Bilans et comptes annuels INPI — données financières gratuites';
COMMENT ON TABLE iris_revenus IS 'Revenus médians INSEE par IRIS — score zone de chalandise';
COMMENT ON TABLE dvf_prix IS 'Prix immobilier DVF par commune — standing quartier';

-- ============================================================
-- 031_security_device_guardian.sql
-- ============================================================

-- ============================================================
-- CRM SATOREA — Migration 031: Device Guardian
-- Tables sécurité : appareils connus, événements, alertes
-- Anti-intrusion, impossible travel, device fingerprinting
-- ============================================================

-- Table 1 : Appareils connus et autorisés
CREATE TABLE IF NOT EXISTS known_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    fingerprint TEXT NOT NULL, -- Hash device (FingerprintJS + UA)
    name TEXT, -- Nom donné par l'utilisateur ("MacBook Pro bureau")
    -- Metadata appareil
    user_agent TEXT,
    platform TEXT,
    screen_resolution TEXT,
    timezone TEXT,
    language TEXT,
    -- Historique
    ip_addresses TEXT[] DEFAULT '{}', -- Toutes les IPs utilisées
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    login_count INTEGER DEFAULT 1,
    -- Confiance
    trusted BOOLEAN DEFAULT false, -- Doit être validé par l'admin ou l'utilisateur
    trusted_at TIMESTAMPTZ,
    trusted_by UUID, -- Qui a validé
    blocked BOOLEAN DEFAULT false, -- Bloqué manuellement
    blocked_reason TEXT,
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_known_devices_fp_user ON known_devices(fingerprint, user_id);
CREATE INDEX IF NOT EXISTS idx_known_devices_user ON known_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_known_devices_last_seen ON known_devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_known_devices_trusted ON known_devices(user_id, trusted);

CREATE TRIGGER IF NOT EXISTS tr_known_devices_updated
    BEFORE UPDATE ON known_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger : fusionner les IP addresses sur upsert
CREATE OR REPLACE FUNCTION merge_device_ips()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Ajouter la nouvelle IP si pas déjà présente
        NEW.ip_addresses = array_cat(
            OLD.ip_addresses,
            ARRAY(
                SELECT unnest(NEW.ip_addresses)
                EXCEPT
                SELECT unnest(OLD.ip_addresses)
            )
        );
        -- Limiter à 20 IPs max
        IF array_length(NEW.ip_addresses, 1) > 20 THEN
            NEW.ip_addresses = NEW.ip_addresses[array_length(NEW.ip_addresses, 1) - 19 : array_length(NEW.ip_addresses, 1)];
        END IF;
        -- Incrémenter le compteur de login
        NEW.login_count = COALESCE(OLD.login_count, 0) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS tr_merge_device_ips
    BEFORE UPDATE ON known_devices
    FOR EACH ROW EXECUTE FUNCTION merge_device_ips();

-- Table 2 : Événements de sécurité (audit trail complet)
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    -- Action
    action TEXT NOT NULL CHECK (action IN (
        'login', 'logout', 'api_call', 'enrichment', 'export',
        'admin_action', 'password_change', 'mfa_challenge', 'device_trust'
    )),
    -- Appareil
    device_fingerprint TEXT,
    ip_address TEXT,
    user_agent TEXT,
    -- Géolocalisation
    geo_lat DOUBLE PRECISION,
    geo_lng DOUBLE PRECISION,
    geo_city TEXT,
    geo_country TEXT,
    -- Évaluation risque
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_flags TEXT[] DEFAULT '{}',
    risk_action TEXT CHECK (risk_action IN ('allow', 'challenge', 'notify_admin', 'block')),
    -- Meta
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioning par mois (les events s'accumulent vite)
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_risk ON security_events(risk_level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_action ON security_events(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_fp ON security_events(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_security_events_date ON security_events(created_at DESC);

-- Table 3 : Alertes de sécurité (pour le dashboard admin)
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    -- Alerte
    risk_level TEXT NOT NULL CHECK (risk_level IN ('medium', 'high', 'critical')),
    risk_score INTEGER NOT NULL,
    flags TEXT[] DEFAULT '{}',
    action_taken TEXT NOT NULL,
    details TEXT,
    -- Contexte
    device_fingerprint TEXT,
    ip_address TEXT,
    geo_city TEXT,
    geo_country TEXT,
    -- Résolution
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON security_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_level ON security_alerts(risk_level, resolved);
CREATE INDEX IF NOT EXISTS idx_security_alerts_unresolved ON security_alerts(resolved, created_at DESC) WHERE resolved = false;

-- Table 4 : IP Whitelist (appareils/IPs autorisés par l'admin)
CREATE TABLE IF NOT EXISTS ip_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Règle
    ip_address TEXT, -- IP exacte ou CIDR (ex: 192.168.1.0/24)
    ip_range_start TEXT, -- Début de plage
    ip_range_end TEXT, -- Fin de plage
    description TEXT NOT NULL, -- "Bureau Dermotec", "VPN Hayou"
    -- Scope
    user_id UUID, -- NULL = global (tous les users)
    -- Activation
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ, -- NULL = permanent
    -- Meta
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_whitelist_active ON ip_whitelist(active, ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_user ON ip_whitelist(user_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE known_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;

-- known_devices : chaque user voit SES appareils, admin voit tout
CREATE POLICY "Users see own devices" ON known_devices
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role full access devices" ON known_devices
    FOR ALL TO service_role USING (true);

-- security_events : admin seulement (données sensibles)
CREATE POLICY "Service role full access events" ON security_events
    FOR ALL TO service_role USING (true);

-- security_alerts : admin seulement
CREATE POLICY "Service role full access alerts" ON security_alerts
    FOR ALL TO service_role USING (true);

-- ip_whitelist : admin seulement
CREATE POLICY "Service role full access whitelist" ON ip_whitelist
    FOR ALL TO service_role USING (true);

-- ============================================================
-- Vues pour le dashboard admin
-- ============================================================

-- Vue : appareils suspects (non trusted, actifs récemment)
CREATE OR REPLACE VIEW v_suspicious_devices AS
SELECT
    kd.*,
    COUNT(se.id) FILTER (WHERE se.risk_level IN ('high', 'critical')) AS high_risk_events,
    MAX(se.created_at) AS last_event_at
FROM known_devices kd
LEFT JOIN security_events se ON se.device_fingerprint = kd.fingerprint
    AND se.user_id = kd.user_id
    AND se.created_at > NOW() - INTERVAL '7 days'
WHERE kd.trusted = false
    AND kd.last_seen > NOW() - INTERVAL '30 days'
GROUP BY kd.id
ORDER BY high_risk_events DESC, kd.last_seen DESC;

-- Vue : alertes non résolues
CREATE OR REPLACE VIEW v_pending_alerts AS
SELECT
    sa.*,
    COUNT(*) OVER (PARTITION BY sa.user_id) AS total_alerts_user
FROM security_alerts sa
WHERE sa.resolved = false
ORDER BY
    CASE sa.risk_level
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
    END,
    sa.created_at DESC;

-- Vue : statistiques sécurité 7 jours
CREATE OR REPLACE VIEW v_security_stats_7d AS
SELECT
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE risk_level = 'critical') AS critical_events,
    COUNT(*) FILTER (WHERE risk_level = 'high') AS high_events,
    COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium_events,
    COUNT(DISTINCT ip_address) AS unique_ips,
    COUNT(DISTINCT device_fingerprint) AS unique_devices,
    COUNT(DISTINCT user_id) AS unique_users,
    COUNT(*) FILTER (WHERE risk_action = 'block') AS blocked_requests,
    COUNT(*) FILTER (WHERE 'IMPOSSIBLE_TRAVEL' = ANY(risk_flags)) AS impossible_travel_events,
    COUNT(*) FILTER (WHERE 'NEW_DEVICE' = ANY(risk_flags)) AS new_device_events,
    COUNT(*) FILTER (WHERE 'AUTOMATED_PATTERN' = ANY(risk_flags)) AS bot_detected_events
FROM security_events
WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================================
-- Nettoyage automatique (données > 90 jours)
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
    DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM security_alerts WHERE resolved = true AND resolved_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Commentaires
-- ============================================================

COMMENT ON TABLE known_devices IS 'Appareils connus par utilisateur — fingerprint + IP + trust status';
COMMENT ON TABLE security_events IS 'Audit trail complet de toutes les actions avec évaluation de risque';
COMMENT ON TABLE security_alerts IS 'Alertes sécurité à résoudre par l''admin — impossible travel, brute force, etc.';
COMMENT ON TABLE ip_whitelist IS 'IPs/plages autorisées — contourne les vérifications de sécurité';
COMMENT ON VIEW v_suspicious_devices IS 'Appareils non-trusted avec activité récente suspecte';
COMMENT ON VIEW v_pending_alerts IS 'Alertes non résolues triées par criticité';
COMMENT ON VIEW v_security_stats_7d IS 'KPIs sécurité des 7 derniers jours';

-- ============================================================
-- 032_ai_security_audit.sql
-- ============================================================

-- ============================================================
-- CRM SATOREA — Migration 032: AI Security Audit
-- Tables pour l'audit du chatbot IA, détection injection,
-- et monitoring de l'intégrité du système
-- ============================================================

-- Table 1 : Audit trail de toutes les conversations IA
CREATE TABLE IF NOT EXISTS ai_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    -- Session
    session_id TEXT NOT NULL, -- Identifiant unique de la conversation
    -- Requête
    user_message TEXT NOT NULL,
    user_message_length INTEGER,
    -- Réponse
    assistant_response TEXT,
    model_used TEXT, -- claude-sonnet, deepseek, etc. (opaque en prod)
    tokens_input INTEGER,
    tokens_output INTEGER,
    -- Tools
    tools_called TEXT[] DEFAULT '{}', -- Liste des tools appelés
    tools_count INTEGER DEFAULT 0,
    -- Sécurité
    prompt_injection_detected BOOLEAN DEFAULT false,
    jailbreak_detected BOOLEAN DEFAULT false,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_flags TEXT[] DEFAULT '{}',
    blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    -- Performance
    latency_ms INTEGER,
    -- Meta
    ip_address TEXT,
    device_fingerprint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_user ON ai_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_session ON ai_audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_risk ON ai_audit_log(risk_score DESC) WHERE risk_score > 0;
CREATE INDEX IF NOT EXISTS idx_ai_audit_injection ON ai_audit_log(created_at DESC) WHERE prompt_injection_detected = true;
CREATE INDEX IF NOT EXISTS idx_ai_audit_blocked ON ai_audit_log(created_at DESC) WHERE blocked = true;
CREATE INDEX IF NOT EXISTS idx_ai_audit_date ON ai_audit_log(created_at DESC);

-- Table 2 : Tentatives d'injection détectées (pour analyse)
CREATE TABLE IF NOT EXISTS ai_injection_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    -- Payload
    original_prompt TEXT NOT NULL, -- Le prompt original (avant sanitization)
    sanitized_prompt TEXT, -- Le prompt après sanitization
    -- Analyse
    injection_type TEXT NOT NULL CHECK (injection_type IN (
        'system_override', -- "ignore previous instructions"
        'role_hijack', -- "you are now a..."
        'env_access', -- "process.env.API_KEY"
        'code_execution', -- "eval(", "exec("
        'sql_injection', -- "DROP TABLE"
        'data_exfiltration', -- tentative d'extraire des données
        'jailbreak', -- DAN, roleplay
        'encoding_trick', -- base64, ROT13
        'indirect', -- injection via les données (lead name, notes)
        'unknown'
    )),
    technique TEXT, -- description plus détaillée
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    -- Contexte
    ip_address TEXT,
    user_agent TEXT,
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_injection_user ON ai_injection_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_injection_type ON ai_injection_attempts(injection_type);
CREATE INDEX IF NOT EXISTS idx_ai_injection_severity ON ai_injection_attempts(severity, created_at DESC);

-- Table 3 : Health checks du système IA
CREATE TABLE IF NOT EXISTS ai_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Check
    check_type TEXT NOT NULL CHECK (check_type IN (
        'system_prompt_integrity', -- Le system prompt n'a pas été modifié
        'tools_integrity', -- Les tools sont les mêmes
        'kb_integrity', -- La knowledge base n'a pas été empoisonnée
        'rate_limits_active', -- Les limites sont en place
        'model_availability', -- Les modèles IA répondent
        'injection_scan', -- Scan des données pour détecter des payloads
        'full_check' -- Toutes les vérifications
    )),
    -- Résultat
    healthy BOOLEAN NOT NULL,
    issues TEXT[] DEFAULT '{}',
    details JSONB DEFAULT '{}',
    -- Meta
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_health_date ON ai_health_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_health_unhealthy ON ai_health_checks(created_at DESC) WHERE healthy = false;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_injection_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_health_checks ENABLE ROW LEVEL SECURITY;

-- Seul service_role peut lire/écrire (données sensibles)
CREATE POLICY "ai_audit_service" ON ai_audit_log FOR ALL TO service_role USING (true);
CREATE POLICY "ai_injection_service" ON ai_injection_attempts FOR ALL TO service_role USING (true);
CREATE POLICY "ai_health_service" ON ai_health_checks FOR ALL TO service_role USING (true);

-- Les admins peuvent voir les audits (lecture seule)
CREATE POLICY "ai_audit_admin_read" ON ai_audit_log FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM equipe WHERE auth_user_id = (SELECT auth.uid()) AND role IN ('admin', 'manager')
    ));

CREATE POLICY "ai_injection_admin_read" ON ai_injection_attempts FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM equipe WHERE auth_user_id = (SELECT auth.uid()) AND role IN ('admin', 'manager')
    ));

-- ============================================================
-- Vues pour le monitoring
-- ============================================================

-- Vue : statistiques IA des 7 derniers jours
CREATE OR REPLACE VIEW v_ai_security_stats_7d AS
SELECT
    COUNT(*) AS total_conversations,
    COUNT(*) FILTER (WHERE prompt_injection_detected) AS injection_attempts,
    COUNT(*) FILTER (WHERE jailbreak_detected) AS jailbreak_attempts,
    COUNT(*) FILTER (WHERE blocked) AS blocked_requests,
    COUNT(DISTINCT user_id) AS unique_users,
    AVG(risk_score) FILTER (WHERE risk_score > 0) AS avg_risk_score,
    MAX(risk_score) AS max_risk_score,
    SUM(tokens_input + tokens_output) AS total_tokens,
    AVG(latency_ms) AS avg_latency_ms,
    -- Top threats
    (SELECT array_agg(DISTINCT unnest) FROM unnest(
        (SELECT array_agg(flag) FROM ai_audit_log, unnest(risk_flags) AS flag
         WHERE created_at > NOW() - INTERVAL '7 days' AND risk_score > 30)
    )) AS top_risk_flags
FROM ai_audit_log
WHERE created_at > NOW() - INTERVAL '7 days';

-- Vue : users suspects (trop d'injections)
CREATE OR REPLACE VIEW v_ai_suspicious_users AS
SELECT
    user_id,
    COUNT(*) AS total_attempts,
    COUNT(DISTINCT injection_type) AS unique_techniques,
    MAX(severity) AS max_severity,
    MAX(created_at) AS last_attempt,
    array_agg(DISTINCT injection_type) AS techniques_used
FROM ai_injection_attempts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id
HAVING COUNT(*) >= 3
ORDER BY total_attempts DESC;

-- ============================================================
-- Fonction de nettoyage (données > 90 jours)
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_old_ai_audit()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_audit_log WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM ai_injection_attempts WHERE created_at < NOW() - INTERVAL '180 days'; -- Garder plus longtemps
    DELETE FROM ai_health_checks WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Commentaires
-- ============================================================

COMMENT ON TABLE ai_audit_log IS 'Audit trail de toutes les conversations IA — détection injection et jailbreak';
COMMENT ON TABLE ai_injection_attempts IS 'Tentatives de prompt injection détectées — pour analyse et amélioration des défenses';
COMMENT ON TABLE ai_health_checks IS 'Résultats des vérifications d''intégrité du système IA';
COMMENT ON VIEW v_ai_security_stats_7d IS 'Dashboard sécurité IA — KPIs des 7 derniers jours';
COMMENT ON VIEW v_ai_suspicious_users IS 'Utilisateurs suspects — 3+ tentatives d''injection en 30 jours';

-- ============================================================
-- 033_formation_lms.sql
-- ============================================================

-- ============================================================
-- CRM SATOREA — Migration 033: Formation LMS
-- Système de contenus pédagogiques pour les stagiaires
-- Modules, leçons, fichiers (PPT/PDF/vidéo/audio), progression
-- ============================================================

-- ============================================================
-- 1. MODULES PAR FORMATION
-- ============================================================

CREATE TABLE IF NOT EXISTS formation_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,

    -- Contenu
    titre TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    icone TEXT DEFAULT 'BookOpen', -- Lucide icon name
    couleur TEXT DEFAULT '#2EC6F3', -- Hex color

    -- Organisation
    jour_formation INTEGER, -- Jour 1, 2, 3... (null = transversal)
    ordre INTEGER NOT NULL DEFAULT 0,
    duree_minutes INTEGER,

    -- Accès
    accessible_avant BOOLEAN DEFAULT false, -- Dispo avant la session
    accessible_pendant BOOLEAN DEFAULT true,
    accessible_apres BOOLEAN DEFAULT true, -- Dispo après la session (alumni)
    delai_acces_avant_jours INTEGER DEFAULT 7, -- Accessible X jours avant
    delai_acces_apres_jours INTEGER DEFAULT 365, -- Accessible X jours après

    -- Publication
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,

    -- Meta
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fm_formation_slug ON formation_modules(formation_id, slug);
CREATE INDEX IF NOT EXISTS idx_fm_formation ON formation_modules(formation_id, ordre);
CREATE INDEX IF NOT EXISTS idx_fm_published ON formation_modules(is_published, formation_id);

CREATE TRIGGER IF NOT EXISTS tr_formation_modules_updated
    BEFORE UPDATE ON formation_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. CONTENUS (fichiers, vidéos, quiz, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS formation_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES formation_modules(id) ON DELETE CASCADE,
    formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,

    -- Contenu
    titre TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    ordre INTEGER NOT NULL DEFAULT 0,

    -- Type de contenu
    type TEXT NOT NULL CHECK (type IN (
        'video',      -- Vidéo (YouTube, Vimeo, Supabase Storage, Bunny)
        'ppt',        -- Présentation PowerPoint/Keynote/Google Slides
        'pdf',        -- Document PDF
        'audio',      -- Podcast, audio
        'image',      -- Image, photo, infographie
        'galerie',    -- Galerie photos (avant/après)
        'quiz',       -- QCM interactif
        'exercice',   -- Exercice pratique avec consignes
        'texte',      -- Contenu texte riche (Markdown)
        'lien',       -- Lien externe
        'checklist'   -- Liste de vérification
    )),

    -- Fichier (pour ppt, pdf, audio, image)
    file_path TEXT, -- Chemin dans Supabase Storage (bucket: formation-content)
    file_name TEXT, -- Nom original du fichier
    file_size INTEGER, -- Taille en bytes
    file_mime TEXT, -- Type MIME

    -- Vidéo (pour type video)
    video_url TEXT, -- URL YouTube/Vimeo/Bunny non-listé
    video_provider TEXT CHECK (video_provider IN ('youtube', 'vimeo', 'bunny', 'supabase', 'autre')),
    video_duration_seconds INTEGER,
    video_thumbnail_url TEXT,

    -- Audio (pour type audio)
    audio_url TEXT,
    audio_duration_seconds INTEGER,

    -- Contenu inline (pour texte, quiz, exercice, checklist)
    contenu JSONB DEFAULT '{}',
    -- Quiz : { questions: [{ question, options: [], correct: number, explication }] }
    -- Exercice : { consigne, materiel_requis, duree_estimee, criteres_evaluation }
    -- Checklist : { items: [{ titre, description, obligatoire }] }
    -- Texte : { markdown: "..." }
    -- Galerie : { images: [{ url, legende, avant_apres }] }

    -- Téléchargement
    telechargeable BOOLEAN DEFAULT true, -- Le stagiaire peut-il télécharger ?
    watermark_enabled BOOLEAN DEFAULT true, -- Watermark PDF avec nom stagiaire ?

    -- Points et progression
    points INTEGER DEFAULT 0,
    obligatoire BOOLEAN DEFAULT false, -- Requis pour obtenir le certificat ?
    score_minimum INTEGER, -- Score minimum quiz pour valider (%)

    -- Publication
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,

    -- Meta
    vues_totales INTEGER DEFAULT 0,
    telechargements_totaux INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fc_module_slug ON formation_contents(module_id, slug);
CREATE INDEX IF NOT EXISTS idx_fc_module ON formation_contents(module_id, ordre);
CREATE INDEX IF NOT EXISTS idx_fc_formation ON formation_contents(formation_id);
CREATE INDEX IF NOT EXISTS idx_fc_type ON formation_contents(type);
CREATE INDEX IF NOT EXISTS idx_fc_published ON formation_contents(is_published, formation_id);

CREATE TRIGGER IF NOT EXISTS tr_formation_contents_updated
    BEFORE UPDATE ON formation_contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. PROGRESSION STAGIAIRE
-- ============================================================

CREATE TABLE IF NOT EXISTS content_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Liens
    inscription_id UUID NOT NULL REFERENCES inscriptions(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES formation_contents(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL, -- Dénormalisé pour faciliter les requêtes

    -- Progression
    statut TEXT NOT NULL DEFAULT 'non_vu' CHECK (statut IN (
        'non_vu',     -- Jamais accédé
        'en_cours',   -- Ouvert/commencé mais pas terminé
        'complete'    -- Terminé (vidéo vue, quiz validé, PDF téléchargé)
    )),

    -- Données
    temps_passe_secondes INTEGER DEFAULT 0,
    progression_pct INTEGER DEFAULT 0 CHECK (progression_pct >= 0 AND progression_pct <= 100),
    score_quiz INTEGER, -- Score quiz en % (null si pas un quiz)
    tentatives_quiz INTEGER DEFAULT 0,
    reponses_quiz JSONB, -- Réponses données au quiz

    -- Dates
    first_viewed_at TIMESTAMPTZ,
    last_viewed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cp_inscription_content ON content_progress(inscription_id, content_id);
CREATE INDEX IF NOT EXISTS idx_cp_inscription ON content_progress(inscription_id);
CREATE INDEX IF NOT EXISTS idx_cp_lead ON content_progress(lead_id);
CREATE INDEX IF NOT EXISTS idx_cp_content ON content_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_cp_statut ON content_progress(statut);

CREATE TRIGGER IF NOT EXISTS tr_content_progress_updated
    BEFORE UPDATE ON content_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. LOG TÉLÉCHARGEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS content_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Liens
    content_id UUID NOT NULL REFERENCES formation_contents(id) ON DELETE CASCADE,
    inscription_id UUID REFERENCES inscriptions(id) ON DELETE SET NULL,
    lead_id UUID,

    -- Download
    file_name TEXT,
    file_size INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    watermarked BOOLEAN DEFAULT false,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cd_content ON content_downloads(content_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cd_inscription ON content_downloads(inscription_id);
CREATE INDEX IF NOT EXISTS idx_cd_date ON content_downloads(created_at DESC);

-- ============================================================
-- 5. RLS
-- ============================================================

ALTER TABLE formation_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_downloads ENABLE ROW LEVEL SECURITY;

-- Modules : tout le monde peut lire les publiés, admin peut tout
CREATE POLICY "fm_select_published" ON formation_modules
    FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "fm_service" ON formation_modules
    FOR ALL TO service_role USING (true);

-- Contenus : tout le monde peut lire les publiés, admin peut tout
CREATE POLICY "fc_select_published" ON formation_contents
    FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "fc_service" ON formation_contents
    FOR ALL TO service_role USING (true);

-- Progression : chaque stagiaire voit SA progression
CREATE POLICY "cp_select_own" ON content_progress
    FOR SELECT TO authenticated
    USING (lead_id IN (
        SELECT l.id FROM leads l
        JOIN equipe e ON e.auth_user_id = (SELECT auth.uid())
        WHERE l.id = content_progress.lead_id
        LIMIT 1
    ));
CREATE POLICY "cp_service" ON content_progress
    FOR ALL TO service_role USING (true);

-- Downloads : service_role seulement
CREATE POLICY "cd_service" ON content_downloads
    FOR ALL TO service_role USING (true);

-- ============================================================
-- 6. VUES
-- ============================================================

-- Vue : progression par inscription (% de complétion)
CREATE OR REPLACE VIEW v_inscription_content_progress AS
SELECT
    i.id AS inscription_id,
    i.lead_id,
    i.session_id,
    f.id AS formation_id,
    f.nom AS formation_nom,
    -- Stats contenus
    COUNT(fc.id) AS total_contenus,
    COUNT(fc.id) FILTER (WHERE fc.obligatoire = true) AS contenus_obligatoires,
    COUNT(cp.id) FILTER (WHERE cp.statut = 'complete') AS contenus_completes,
    COUNT(cp.id) FILTER (WHERE cp.statut = 'complete' AND fc.obligatoire = true) AS obligatoires_completes,
    -- Pourcentage
    CASE
        WHEN COUNT(fc.id) > 0
        THEN ROUND(100.0 * COUNT(cp.id) FILTER (WHERE cp.statut = 'complete') / COUNT(fc.id))
        ELSE 0
    END AS progression_pct,
    -- Quiz
    AVG(cp.score_quiz) FILTER (WHERE fc.type = 'quiz' AND cp.score_quiz IS NOT NULL) AS score_quiz_moyen,
    -- Temps
    SUM(cp.temps_passe_secondes) AS temps_total_secondes,
    -- Points
    SUM(fc.points) FILTER (WHERE cp.statut = 'complete') AS points_gagnes,
    SUM(fc.points) AS points_totaux
FROM inscriptions i
JOIN sessions s ON s.id = i.session_id
JOIN formations f ON f.id = s.formation_id
LEFT JOIN formation_contents fc ON fc.formation_id = f.id AND fc.is_published = true
LEFT JOIN content_progress cp ON cp.content_id = fc.id AND cp.inscription_id = i.id
GROUP BY i.id, i.lead_id, i.session_id, f.id, f.nom;

-- Vue : contenus les plus populaires
CREATE OR REPLACE VIEW v_popular_contents AS
SELECT
    fc.id,
    fc.titre,
    fc.type,
    fc.formation_id,
    f.nom AS formation_nom,
    fc.vues_totales,
    fc.telechargements_totaux,
    COUNT(cp.id) FILTER (WHERE cp.statut = 'complete') AS completions,
    AVG(cp.score_quiz) FILTER (WHERE cp.score_quiz IS NOT NULL) AS avg_quiz_score
FROM formation_contents fc
JOIN formations f ON f.id = fc.formation_id
LEFT JOIN content_progress cp ON cp.content_id = fc.id
WHERE fc.is_published = true
GROUP BY fc.id, fc.titre, fc.type, fc.formation_id, f.nom,
         fc.vues_totales, fc.telechargements_totaux
ORDER BY fc.vues_totales DESC;

-- ============================================================
-- 7. BUCKET STORAGE
-- ============================================================

-- Note : le bucket doit être créé dans le dashboard Supabase
-- Nom : formation-content
-- Public : NON (privé)
-- File size limit : 500 MB
-- Allowed MIME types : application/pdf, application/vnd.ms-powerpoint,
--   application/vnd.openxmlformats-officedocument.presentationml.presentation,
--   video/mp4, video/webm, video/quicktime,
--   audio/mpeg, audio/mp4, audio/wav, audio/ogg,
--   image/jpeg, image/png, image/webp, image/gif

-- ============================================================
-- 8. COMMENTAIRES
-- ============================================================

COMMENT ON TABLE formation_modules IS 'Modules pédagogiques par formation — organisés par jour/ordre';
COMMENT ON TABLE formation_contents IS 'Contenus pédagogiques (PPT, PDF, vidéo, audio, quiz) — liés à un module et une formation';
COMMENT ON TABLE content_progress IS 'Progression de chaque stagiaire sur chaque contenu — statut, temps, score quiz';
COMMENT ON TABLE content_downloads IS 'Log de tous les téléchargements de fichiers — audit trail';
COMMENT ON COLUMN formation_contents.watermark_enabled IS 'Si true, les PDF téléchargés sont watermarkés avec le nom du stagiaire';
COMMENT ON COLUMN formation_contents.telechargeable IS 'Si false, le contenu ne peut être que consulté en ligne (pas de téléchargement)';
COMMENT ON COLUMN formation_modules.accessible_avant IS 'Si true, le module est accessible X jours avant le début de la session';
COMMENT ON COLUMN formation_modules.accessible_apres IS 'Si true, le module reste accessible X jours après la fin de la session';
