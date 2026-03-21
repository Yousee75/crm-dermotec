-- ============================================================
-- CRM DERMOTEC — Migration 013 : Multi-tenant
-- Chaque TPE cliente = une organisation isolée
-- ============================================================

-- 1. Table organisations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  siret TEXT,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  -- Plan & billing
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'expert', 'clinique')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  trial_ends_at TIMESTAMPTZ,
  -- Limits
  max_users INTEGER NOT NULL DEFAULT 1,
  max_leads INTEGER NOT NULL DEFAULT 50,
  -- Metadata
  settings JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_slug ON organizations(slug);
CREATE INDEX idx_org_stripe ON organizations(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- 2. Table membres d'organisation
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipe_id UUID REFERENCES equipe(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_om_org ON org_members(org_id);
CREATE INDEX idx_om_user ON org_members(user_id);

-- 3. Table invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_token ON invitations(token) WHERE accepted_at IS NULL;
CREATE INDEX idx_inv_email ON invitations(email);

-- 4. Ajouter org_id aux tables principales (nullable pour migration progressive)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE formations ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE financements ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE factures ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE rappels ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE activites ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE equipe ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE notes_lead ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE qualite ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE partenaires ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- 5. Indexes sur org_id
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org ON sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_org ON inscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_factures_org ON factures(org_id);
CREATE INDEX IF NOT EXISTS idx_equipe_org ON equipe(org_id);

-- 6. Fonction helper : récupérer l'org_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 7. RLS sur organizations et org_members
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Organizations : un user voit seulement son org
CREATE POLICY "org_select_own" ON organizations FOR SELECT TO authenticated
USING (id = get_user_org_id());

CREATE POLICY "org_update_own" ON organizations FOR UPDATE TO authenticated
USING (id = get_user_org_id() AND EXISTS (
  SELECT 1 FROM org_members WHERE org_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')
));

-- Org members : voir les membres de son org
CREATE POLICY "om_select_own" ON org_members FOR SELECT TO authenticated
USING (org_id = get_user_org_id());

CREATE POLICY "om_insert_admin" ON org_members FOR INSERT TO authenticated
WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "om_delete_admin" ON org_members FOR DELETE TO authenticated
USING (org_id = get_user_org_id() AND EXISTS (
  SELECT 1 FROM org_members WHERE org_id = org_members.org_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
));

-- Invitations : admins de l'org
CREATE POLICY "inv_select_own" ON invitations FOR SELECT TO authenticated
USING (org_id = get_user_org_id());

CREATE POLICY "inv_insert_admin" ON invitations FOR INSERT TO authenticated
WITH CHECK (org_id = get_user_org_id());

-- Anon peut lire une invitation par token (pour la page /join)
CREATE POLICY "inv_select_token" ON invitations FOR SELECT TO anon
USING (accepted_at IS NULL AND expires_at > NOW());

-- 8. Trigger updated_at sur organizations
CREATE TRIGGER tr_org_updated BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9. Plan limits par défaut
COMMENT ON TABLE organizations IS 'Chaque client TPE = une organisation. Plans: free (50 leads, 1 user), pro (500 leads, 5 users), expert (illimité, 15 users), clinique (illimité, illimité).';
