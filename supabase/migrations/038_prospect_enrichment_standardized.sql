-- ============================================================
-- MIGRATION 038 — Données enrichissement prospect standardisées
-- Stocke TOUTES les données récupérées par les APIs
-- Sources : Pappers, Google Places, Outscraper, Bright Data,
--           Planity, Treatwell, Facebook, Instagram, Tripadvisor
-- ============================================================

-- Table principale : données enrichies par prospect
CREATE TABLE IF NOT EXISTS prospect_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Identité légale (Pappers + Sirene)
  siret TEXT,
  siren TEXT,
  nom_entreprise TEXT,
  forme_juridique TEXT,
  capital INTEGER,
  date_creation DATE,
  code_naf TEXT,
  libelle_naf TEXT,
  objet_social TEXT,
  convention_collective TEXT,
  convention_idcc INTEGER,
  effectif_min INTEGER,
  effectif_max INTEGER,
  effectif_tranche TEXT,
  dirigeant_nom TEXT,
  dirigeant_fonction TEXT,
  ca_dernier_connu NUMERIC,
  resultat_net NUMERIC,
  procedure_collective BOOLEAN DEFAULT false,

  -- Localisation (Pappers + Google)
  adresse_complete TEXT,
  code_postal TEXT,
  ville TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),

  -- Google Places
  google_place_id TEXT,
  google_rating NUMERIC(2, 1),
  google_reviews_count INTEGER,
  google_photos_count INTEGER,
  google_types TEXT[],
  google_price_level INTEGER,
  google_url TEXT,
  google_website TEXT,
  google_phone TEXT,
  google_lgbtq_friendly BOOLEAN,
  google_managed_by_woman BOOLEAN,
  google_rdv_obligatoire BOOLEAN,
  google_paiements TEXT[],

  -- Horaires (JSON)
  horaires JSONB,

  -- Avis multi-plateformes (JSONB pour flexibilité)
  plateformes_avis JSONB DEFAULT '{}',
  -- Structure : { "google": { "note": 4.4, "avis": 300, "distribution": [...] }, "planity": {...}, ... }

  note_ponderee NUMERIC(3, 2),
  total_avis INTEGER,

  -- Réseaux sociaux
  instagram_username TEXT,
  instagram_followers INTEGER,
  instagram_posts INTEGER,
  instagram_suivis INTEGER,
  instagram_bio TEXT,
  facebook_url TEXT,
  facebook_followers INTEGER,
  facebook_recommandation_pct INTEGER,
  facebook_avis INTEGER,
  site_web TEXT,
  email TEXT,

  -- Activité
  services TEXT[],
  marques TEXT[],
  awards TEXT[],
  mixte BOOLEAN DEFAULT false,
  gamme_prix TEXT,

  -- Équipe identifiée (croisement sources)
  equipe_identifiee TEXT[],

  -- Photos récupérées (URLs)
  photos_urls TEXT[],
  logo_url TEXT,

  -- Quartier
  quartier_metros INTEGER,
  quartier_restaurants INTEGER,
  quartier_concurrents_beaute INTEGER,
  quartier_pharmacies INTEGER,
  quartier_score_trafic INTEGER,

  -- Scores calculés
  score_reputation INTEGER,
  score_presence INTEGER,
  score_activite INTEGER,
  score_financier INTEGER,
  score_quartier INTEGER,
  score_global INTEGER,
  classification TEXT CHECK (classification IN ('CHAUD', 'TIEDE', 'FROID')),

  -- Métadonnées
  sources_utilisees TEXT[],
  donnees_manquantes TEXT[],
  cout_enrichissement NUMERIC(5, 2),
  duree_enrichissement_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lead_id)
);

-- Table des avis détaillés (Outscraper + Treatwell + Google)
CREATE TABLE IF NOT EXISTS prospect_reviews_detailed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  prospect_data_id UUID REFERENCES prospect_data(id) ON DELETE CASCADE,

  plateforme TEXT NOT NULL, -- 'google', 'treatwell', 'planity', 'tripadvisor', 'facebook'
  auteur TEXT,
  note INTEGER CHECK (note BETWEEN 1 AND 5),
  texte TEXT,
  date_avis DATE,
  date_avis_relative TEXT, -- "il y a 2 mois"
  reponse_proprietaire TEXT,
  reponse_date TIMESTAMPTZ,
  photo_urls TEXT[],
  service_mentionne TEXT,
  sentiment TEXT CHECK (sentiment IN ('positif', 'neutre', 'negatif')),
  mots_cles TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Éviter doublons
  UNIQUE(lead_id, plateforme, auteur, date_avis)
);

-- Table des photos récupérées
CREATE TABLE IF NOT EXISTS prospect_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'google', 'facebook', 'instagram', 'site_web'
  url_originale TEXT NOT NULL,
  url_stockee TEXT, -- URL Supabase Storage après upload
  type TEXT, -- 'facade', 'interieur', 'equipe', 'prestation', 'logo'
  largeur INTEGER,
  hauteur INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_prospect_data_lead_id ON prospect_data(lead_id);
CREATE INDEX IF NOT EXISTS idx_prospect_data_siret ON prospect_data(siret);
CREATE INDEX IF NOT EXISTS idx_prospect_data_google_place_id ON prospect_data(google_place_id);
CREATE INDEX IF NOT EXISTS idx_prospect_data_score_global ON prospect_data(score_global DESC);
CREATE INDEX IF NOT EXISTS idx_prospect_data_classification ON prospect_data(classification);
CREATE INDEX IF NOT EXISTS idx_prospect_reviews_lead_id ON prospect_reviews_detailed(lead_id);
CREATE INDEX IF NOT EXISTS idx_prospect_reviews_plateforme ON prospect_reviews_detailed(plateforme);
CREATE INDEX IF NOT EXISTS idx_prospect_reviews_note ON prospect_reviews_detailed(note);
CREATE INDEX IF NOT EXISTS idx_prospect_photos_lead_id ON prospect_photos(lead_id);

-- RLS
ALTER TABLE prospect_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_reviews_detailed ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_photos ENABLE ROW LEVEL SECURITY;

-- Policies (authentifié = accès complet)
DO $$ BEGIN
  DROP POLICY IF EXISTS prospect_data_select ON prospect_data;
  DROP POLICY IF EXISTS prospect_data_insert ON prospect_data;
  DROP POLICY IF EXISTS prospect_data_update ON prospect_data;
  DROP POLICY IF EXISTS prospect_reviews_select ON prospect_reviews_detailed;
  DROP POLICY IF EXISTS prospect_reviews_insert ON prospect_reviews_detailed;
  DROP POLICY IF EXISTS prospect_photos_select ON prospect_photos;
  DROP POLICY IF EXISTS prospect_photos_insert ON prospect_photos;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY prospect_data_select ON prospect_data FOR SELECT TO authenticated USING (true);
CREATE POLICY prospect_data_insert ON prospect_data FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY prospect_data_update ON prospect_data FOR UPDATE TO authenticated USING (true);
CREATE POLICY prospect_reviews_select ON prospect_reviews_detailed FOR SELECT TO authenticated USING (true);
CREATE POLICY prospect_reviews_insert ON prospect_reviews_detailed FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY prospect_photos_select ON prospect_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY prospect_photos_insert ON prospect_photos FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER tr_prospect_data_updated
  BEFORE UPDATE ON prospect_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Commentaire
COMMENT ON TABLE prospect_data IS 'Données enrichies standardisées par prospect — toutes sources consolidées';
COMMENT ON TABLE prospect_reviews_detailed IS 'Avis détaillés récupérés par Outscraper/Treatwell/Planity';
COMMENT ON TABLE prospect_photos IS 'Photos récupérées de Google Places, Facebook, Instagram';
