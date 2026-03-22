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
