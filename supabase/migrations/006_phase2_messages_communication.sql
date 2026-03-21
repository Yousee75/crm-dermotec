-- ============================================================
-- CRM DERMOTEC — Phase 2 : Messages & Communication multicanal
-- ============================================================

-- Table messages (inbox unifiée)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  canal TEXT NOT NULL CHECK (canal IN ('email', 'whatsapp', 'sms', 'appel', 'note_interne')),
  sujet TEXT,
  contenu TEXT NOT NULL,
  contenu_html TEXT,
  de TEXT,
  a TEXT,
  statut TEXT NOT NULL DEFAULT 'envoye' CHECK (statut IN ('brouillon', 'envoye', 'delivre', 'lu', 'erreur', 'recu')),
  external_id TEXT,
  template_id UUID,
  cadence_instance_id UUID,
  metadata JSONB DEFAULT '{}',
  pieces_jointes JSONB DEFAULT '[]',
  lu_at TIMESTAMPTZ,
  delivre_at TIMESTAMPTZ,
  erreur_detail TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_lead ON messages(lead_id);
CREATE INDEX idx_messages_canal ON messages(canal);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_statut ON messages(statut);
CREATE INDEX idx_messages_cadence ON messages(cadence_instance_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
