-- ============================================================
-- CRM DERMOTEC — Phase 1 : Émargement + Portail stagiaire
-- ============================================================

-- Portail stagiaire : token unique par inscription
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS portail_token UUID DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_inscriptions_portail_token ON inscriptions(portail_token);

-- Émargement électronique (conforme Décret 2017-382, eIDAS SES, RGPD)
CREATE TABLE IF NOT EXISTS emargements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  inscription_id UUID NOT NULL REFERENCES inscriptions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  creneau TEXT NOT NULL CHECK (creneau IN ('matin', 'apres_midi', 'journee')),
  -- Signature stagiaire
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  -- Signature formateur (obligatoire Qualiopi)
  formateur_signature_data TEXT,
  formateur_signed_at TIMESTAMPTZ,
  formateur_ip TEXT,
  -- Intégrité & conformité
  integrity_hash TEXT,
  consent_text TEXT DEFAULT 'En signant, je certifie ma présence effective à cette séance et j''accepte que mes données (signature, IP, horodatage) soient conservées 5 ans conformément au RGPD.',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, inscription_id, date, creneau)
);

CREATE INDEX IF NOT EXISTS idx_emargements_session ON emargements(session_id);
CREATE INDEX IF NOT EXISTS idx_emargements_inscription ON emargements(inscription_id);
CREATE INDEX IF NOT EXISTS idx_emargements_date ON emargements(date);

-- Trigger updated_at
CREATE TRIGGER set_emargements_updated_at
  BEFORE UPDATE ON emargements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE emargements ENABLE ROW LEVEL SECURITY;

-- Policy : lecture pour tous les auth users
CREATE POLICY "emargements_select" ON emargements FOR SELECT TO authenticated USING (true);
-- Policy : insertion pour tous (page publique via token)
CREATE POLICY "emargements_insert" ON emargements FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Policy : update signature
CREATE POLICY "emargements_update" ON emargements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
