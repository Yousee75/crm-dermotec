-- Migration 028: Competitor Profiles
-- Creates tables for storing scraped competitor data and reviews

-- Table 1: competitor_profiles
-- Stores detailed information about competitors scraped from various sources
CREATE TABLE competitor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- nullable - links to CRM lead if exists

    -- Company identification
    siren TEXT,
    siret TEXT,
    nom TEXT NOT NULL,
    nom_commercial TEXT,

    -- Address
    adresse TEXT,
    code_postal TEXT,
    ville TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,

    -- Legal/financial data
    code_ape TEXT,
    forme_juridique TEXT,
    capital_social INTEGER,
    date_creation DATE,
    ca_dernier INTEGER, -- CA in euros
    resultat_net INTEGER,
    annee_fiscale INTEGER,
    effectif INTEGER,
    dirigeants JSONB DEFAULT '[]',

    -- Contact info
    website TEXT,
    telephone TEXT,
    email TEXT,

    -- Google presence
    google_place_id TEXT,
    google_rating NUMERIC(2,1),
    google_reviews_count INTEGER,

    -- Pages Jaunes presence
    pj_rating NUMERIC(2,1),
    pj_reviews_count INTEGER,

    -- Booking platforms
    planity_found BOOLEAN DEFAULT false,
    planity_rating NUMERIC(2,1),
    treatwell_found BOOLEAN DEFAULT false,
    treatwell_rating NUMERIC(2,1),

    -- Social media
    instagram_username TEXT,
    instagram_followers INTEGER,
    instagram_posts INTEGER,
    facebook_url TEXT,
    facebook_followers INTEGER,
    tiktok_username TEXT,
    tiktok_followers INTEGER,
    linkedin_url TEXT,

    -- Business data
    services JSONB DEFAULT '[]',
    prix JSONB DEFAULT '[]',
    horaires JSONB DEFAULT '[]',
    photos JSONB DEFAULT '[]',

    -- Metadata
    sources TEXT[] DEFAULT '{}', -- List of sources where data was found
    scores JSONB DEFAULT '{}', -- Various computed scores
    ai_analysis JSONB DEFAULT '{}', -- AI-generated insights
    score_remplissage NUMERIC(5,2) DEFAULT 0, -- Data completeness score

    -- Timestamps
    scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints and indexes
ALTER TABLE competitor_profiles ADD CONSTRAINT unique_siren UNIQUE (siren) WHERE siren IS NOT NULL;

-- Indexes for performance
CREATE INDEX idx_competitor_profiles_geo ON competitor_profiles USING GIST (
    ll_to_earth(lat, lng)
) WHERE lat IS NOT NULL AND lng IS NOT NULL;

CREATE INDEX idx_competitor_profiles_lead_id ON competitor_profiles(lead_id);
CREATE INDEX idx_competitor_profiles_ville ON competitor_profiles(ville);
CREATE INDEX idx_competitor_profiles_code_postal ON competitor_profiles(code_postal);
CREATE INDEX idx_competitor_profiles_scraped_at ON competitor_profiles(scraped_at);

-- Trigger for updated_at
CREATE TRIGGER tr_competitor_profiles_updated_at
    BEFORE UPDATE ON competitor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Table 2: competitor_reviews
-- Stores reviews scraped from various platforms
CREATE TABLE competitor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID NOT NULL REFERENCES competitor_profiles(id) ON DELETE CASCADE,

    -- Review data
    platform TEXT NOT NULL CHECK (platform IN ('google', 'pagesjaunes', 'planity', 'treatwell', 'instagram')),
    author TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    review_date DATE,
    owner_responded BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reviews
CREATE INDEX idx_competitor_reviews_competitor_id ON competitor_reviews(competitor_id);
CREATE INDEX idx_competitor_reviews_platform ON competitor_reviews(platform);
CREATE INDEX idx_competitor_reviews_rating ON competitor_reviews(rating);
CREATE INDEX idx_competitor_reviews_date ON competitor_reviews(review_date);

-- Enable RLS on both tables
ALTER TABLE competitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitor_profiles
CREATE POLICY "Authenticated users can view competitor profiles"
    ON competitor_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert competitor profiles"
    ON competitor_profiles FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update competitor profiles"
    ON competitor_profiles FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Service role has full access to competitor profiles"
    ON competitor_profiles FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for competitor_reviews
CREATE POLICY "Authenticated users can view competitor reviews"
    ON competitor_reviews FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert competitor reviews"
    ON competitor_reviews FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update competitor reviews"
    ON competitor_reviews FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Service role has full access to competitor reviews"
    ON competitor_reviews FOR ALL
    TO service_role
    USING (true);

-- Add table comments
COMMENT ON TABLE competitor_profiles IS 'Stores detailed competitor information scraped from various sources including legal, financial, digital presence and business data';
COMMENT ON TABLE competitor_reviews IS 'Stores reviews for competitors scraped from various platforms (Google, Pages Jaunes, Planity, etc.)';

-- Add column comments for key fields
COMMENT ON COLUMN competitor_profiles.score_remplissage IS 'Data completeness score from 0 to 100 based on filled fields';
COMMENT ON COLUMN competitor_profiles.sources IS 'Array of sources where competitor data was found (sirene, google, pagesjaunes, etc.)';
COMMENT ON COLUMN competitor_profiles.scores IS 'JSON object containing various computed scores (digital_maturity, competition_level, etc.)';
COMMENT ON COLUMN competitor_profiles.ai_analysis IS 'JSON object containing AI-generated insights and analysis';
COMMENT ON COLUMN competitor_reviews.platform IS 'Platform where the review was found (google, pagesjaunes, planity, treatwell, instagram)';