-- ============================================================
-- Migration 017 : Tables Clients & Apprenants
-- Séparer la logique entreprise (client) vs personne (apprenant)
-- ============================================================

-- Table CLIENTS (entreprises/instituts)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identité entreprise
  raison_sociale TEXT NOT NULL,
  siret TEXT,
  siren TEXT,
  code_ape TEXT,
  forme_juridique TEXT,
  -- Contact principal
  contact_nom TEXT,
  contact_prenom TEXT,
  contact_email TEXT,
  contact_telephone TEXT,
  contact_poste TEXT,
  -- Adresse
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  -- Commercial
  commercial_assigne_id UUID REFERENCES equipe(id),
  -- Financement
  opco TEXT,
  convention_collective TEXT,
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  ca_total NUMERIC(10,2) DEFAULT 0,
  nb_apprenants_total INTEGER DEFAULT 0,
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  delete_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table APPRENANTS (personnes physiques)
CREATE TABLE IF NOT EXISTS apprenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identité
  civilite TEXT,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  date_naissance DATE,
  -- Lien avec le client (entreprise qui l'envoie)
  client_id UUID REFERENCES clients(id),
  -- Profil
  statut_pro TEXT,
  poste TEXT,
  -- Formation
  niveau_initial TEXT,
  objectifs TEXT,
  -- Suivi
  nps_score INTEGER,
  avis_google BOOLEAN DEFAULT false,
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  delete_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modifier inscriptions pour lier à apprenant (pas juste lead)
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS apprenant_id UUID REFERENCES apprenants(id);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Index pour performance
CREATE INDEX idx_clients_siret ON clients(siret);
CREATE INDEX idx_clients_email ON clients(contact_email);
CREATE INDEX idx_clients_commercial ON clients(commercial_assigne_id);
CREATE INDEX idx_apprenants_client ON apprenants(client_id);
CREATE INDEX idx_apprenants_email ON apprenants(email);
CREATE INDEX idx_apprenants_telephone ON apprenants(telephone);
CREATE INDEX idx_inscriptions_apprenant ON inscriptions(apprenant_id);
CREATE INDEX idx_inscriptions_client ON inscriptions(client_id);

-- RLS (Row Level Security)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprenants ENABLE ROW LEVEL SECURITY;

-- Policies pour authenticated users
CREATE POLICY "auth_clients" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_apprenants" ON apprenants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers updated_at
CREATE TRIGGER tr_clients_upd BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_apprenants_upd BEFORE UPDATE ON apprenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index soft delete (performances pour requêtes actives)
CREATE INDEX idx_clients_active ON clients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_apprenants_active ON apprenants(deleted_at) WHERE deleted_at IS NULL;

-- Commentaires pour la documentation
COMMENT ON TABLE clients IS 'Entreprises/instituts clients (qui envoient des apprenants)';
COMMENT ON TABLE apprenants IS 'Personnes physiques qui suivent les formations';
COMMENT ON COLUMN clients.ca_total IS 'CA total généré par ce client';
COMMENT ON COLUMN clients.nb_apprenants_total IS 'Nombre total d'apprenants envoyés par ce client';
COMMENT ON COLUMN apprenants.client_id IS 'Lien vers l'entreprise qui envoie cette personne (optionnel pour particuliers)';