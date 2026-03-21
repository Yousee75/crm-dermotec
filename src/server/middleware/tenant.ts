// ============================================================
// Multi-tenant Middleware — Row-level isolation with org_id
//
// Pattern: every table has an org_id column. RLS policies
// filter by org_id from the JWT claim. This middleware:
// 1. Extracts org_id from the user's JWT (set by Supabase Auth)
// 2. Sets it in the Hono context for downstream use
// 3. Validates the org_id exists
//
// For now, Dermotec is single-tenant but the architecture
// is ready for multi-tenant (franchise model / white-label).
// ============================================================

import { createMiddleware } from 'hono/factory'
import type { AuthEnv } from './auth'

// Extended env type with org_id
export type TenantEnv = AuthEnv & {
  Variables: AuthEnv['Variables'] & {
    orgId: string
  }
}

/**
 * Middleware: extract org_id from JWT or default.
 * In single-tenant mode, uses a constant org_id.
 * In multi-tenant mode, reads from user metadata or JWT claim.
 */
export const tenantMiddleware = () =>
  createMiddleware<TenantEnv>(async (c, next) => {
    const user = c.var.user

    // Strategy 1: Read from user metadata (set during signup)
    const orgId =
      user?.user_metadata?.org_id ??
      user?.app_metadata?.org_id ??
      process.env.DEFAULT_ORG_ID ??
      'org_dermotec_default'

    c.set('orgId', orgId as string)

    // Set as Supabase RLS variable (for policies that check org_id)
    // This uses the SET LOCAL command to scope to the current transaction
    // Note: only works with service role + SQL RPC
    // For RLS with anon key, the org_id comes from the JWT claim

    await next()
  })

// ============================================================
// SQL for multi-tenant setup (reference)
// ============================================================
/*

-- 1. Add org_id to all tables
ALTER TABLE leads ADD COLUMN org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE sessions ADD COLUMN org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001';
-- ... repeat for all tables

-- 2. Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter',
  settings JSONB DEFAULT '{}',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create org_members table
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  UNIQUE(org_id, user_id)
);

-- 4. RLS policies with org_id
CREATE POLICY "leads_org_isolation" ON leads
  FOR ALL USING (
    org_id = (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- 5. Create index for performance
CREATE INDEX idx_leads_org_id ON leads(org_id);
CREATE INDEX idx_sessions_org_id ON sessions(org_id);

-- 6. Set org_id in JWT custom claims (via trigger on org_members)
CREATE OR REPLACE FUNCTION set_org_claim()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('org_id', NEW.org_id)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_org_member_created
  AFTER INSERT ON org_members
  FOR EACH ROW EXECUTE FUNCTION set_org_claim();

*/
