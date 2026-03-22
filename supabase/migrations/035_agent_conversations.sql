-- ============================================================
-- Migration 035 : Table agent_conversations + fix canal agent_ia
-- Corrige le crash de l'agent IA CRM
-- ============================================================

-- 1. Table agent_conversations (manquante — cause du crash)
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'commercial' CHECK (mode IN ('commercial', 'formation')),
  messages JSONB DEFAULT '[]',
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_lead ON agent_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_created ON agent_conversations(created_at DESC);

ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_conversations_select ON agent_conversations;
CREATE POLICY agent_conversations_select ON agent_conversations FOR SELECT USING (true);

DROP POLICY IF EXISTS agent_conversations_insert ON agent_conversations;
CREATE POLICY agent_conversations_insert ON agent_conversations FOR INSERT WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER tr_agent_conversations_updated
  BEFORE UPDATE ON agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 2. Ajouter 'agent_ia' au CHECK constraint de la table messages
-- On doit dropper et recréer le constraint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_canal_check' AND table_name = 'messages'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT messages_canal_check;
  END IF;

  ALTER TABLE messages ADD CONSTRAINT messages_canal_check
    CHECK (canal IN ('email', 'whatsapp', 'sms', 'appel', 'note_interne', 'agent_ia', 'portail', 'cadence'));
EXCEPTION WHEN OTHERS THEN
  -- Constraint peut ne pas exister si la table a été modifiée autrement
  NULL;
END $$;
