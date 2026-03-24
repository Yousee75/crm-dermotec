-- ============================================================
-- Migration 055 — Auto-enrichment trigger on lead creation
-- Déclenche automatiquement l'enrichissement quand un nouveau lead est créé
-- ============================================================

-- Extension required for HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- Function to trigger enrichment via Inngest webhook
CREATE OR REPLACE FUNCTION trigger_lead_enrichment()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  inngest_payload JSONB;
  http_response TEXT;
BEGIN
  -- Skip if this is a system update (avoid loops)
  IF NEW.metadata ? 'skip_enrichment' OR NEW.metadata ? 'auto_enriched' THEN
    RETURN NEW;
  END IF;

  -- Skip if lead doesn't have minimum data for enrichment
  IF NEW.email IS NULL AND NEW.siret IS NULL THEN
    RETURN NEW;
  END IF;

  -- Construct Inngest webhook URL
  webhook_url := COALESCE(
    current_setting('app.inngest_webhook_url', true),
    'https://crm-dermotec.vercel.app/api/inngest'
  );

  -- Prepare Inngest payload
  inngest_payload := jsonb_build_object(
    'name', 'crm/lead.created',
    'data', jsonb_build_object(
      'lead_id', NEW.id::text,
      'siret', NEW.siret,
      'nom', NEW.nom,
      'prenom', NEW.prenom,
      'entreprise_nom', NEW.entreprise_nom,
      'ville', COALESCE(NEW.metadata->>'ville', NEW.ville),
      'email', NEW.email,
      'source', NEW.source,
      'trigger', 'database'
    )
  );

  -- Send async HTTP request to Inngest (non-blocking)
  BEGIN
    SELECT content INTO http_response
    FROM http((
      'POST',
      webhook_url,
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', 'Bearer ' || COALESCE(
          current_setting('app.inngest_secret', true),
          'inngest-secret'
        ))
      ],
      inngest_payload::text
    )::http_request);

    -- Log success (optional)
    INSERT INTO public.system_logs (
      level, message, metadata, created_at
    ) VALUES (
      'INFO',
      'Auto-enrichment triggered for lead: ' || NEW.id::text,
      jsonb_build_object('lead_id', NEW.id, 'response', http_response),
      NOW()
    );

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    INSERT INTO public.system_logs (
      level, message, metadata, created_at
    ) VALUES (
      'ERROR',
      'Failed to trigger auto-enrichment for lead: ' || NEW.id::text,
      jsonb_build_object('lead_id', NEW.id, 'error', SQLERRM),
      NOW()
    );
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read system logs
CREATE POLICY "system_logs_read" ON public.system_logs
  FOR SELECT TO authenticated
  USING (true);

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_enrichment ON public.leads;

CREATE TRIGGER trigger_auto_enrichment
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_lead_enrichment();

-- Comment
COMMENT ON FUNCTION trigger_lead_enrichment() IS
'Déclenche automatiquement l''enrichissement Inngest lors de la création d''un nouveau lead';

COMMENT ON TRIGGER trigger_auto_enrichment ON public.leads IS
'Auto-enrichment trigger - déclenche l''enrichissement automatique via Inngest';

-- Configuration settings (can be updated via SQL)
-- UPDATE pg_settings SET setting = 'your-inngest-url' WHERE name = 'app.inngest_webhook_url';
-- UPDATE pg_settings SET setting = 'your-secret' WHERE name = 'app.inngest_secret';

SELECT 'Migration 055 completed - Auto-enrichment trigger created' as status;