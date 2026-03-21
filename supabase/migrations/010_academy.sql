-- ============================================================
-- CRM DERMOTEC — Academy (formation interne des équipes)
-- ============================================================

-- Modules de formation (onboarding, scripts, financement, etc.)
CREATE TABLE IF NOT EXISTS academy_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  icone TEXT DEFAULT 'BookOpen',
  couleur TEXT DEFAULT '#2EC6F3',
  categorie TEXT NOT NULL CHECK (categorie IN ('onboarding', 'vente', 'produit', 'financement', 'crm', 'qualite')),
  ordre INT DEFAULT 0,
  duree_minutes INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  prerequis_module_id UUID REFERENCES academy_modules(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leçons (contenu de chaque module)
CREATE TABLE IF NOT EXISTS academy_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES academy_modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  titre TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('texte', 'video', 'quiz', 'checklist', 'script', 'pdf', 'exercice')),
  contenu JSONB NOT NULL DEFAULT '{}',
  -- contenu structure selon type:
  -- texte: { body: "markdown..." }
  -- video: { url: "...", duree_secondes: 120, transcript?: "..." }
  -- quiz: { questions: [{ question, options: [], correct: 0, explication }] }
  -- checklist: { items: [{ label, description? }] }
  -- script: { scenario, etapes: [{ role, texte, note? }] }
  -- pdf: { url: "...", titre: "..." }
  -- exercice: { consigne, exemple?, criteres: [] }
  ordre INT DEFAULT 0,
  duree_minutes INT DEFAULT 5,
  points INT DEFAULT 10,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_academy_lessons_module_slug ON academy_lessons(module_id, slug);

-- Progression des utilisateurs
CREATE TABLE IF NOT EXISTS academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES equipe(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
  statut TEXT NOT NULL DEFAULT 'non_commence' CHECK (statut IN ('non_commence', 'en_cours', 'complete')),
  score_quiz INT, -- pour les quiz, score obtenu
  temps_passe_secondes INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_academy_progress_user ON academy_progress(user_id);

-- Badges / Achievements
CREATE TABLE IF NOT EXISTS academy_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  icone TEXT NOT NULL, -- emoji ou lucide icon name
  condition_type TEXT NOT NULL CHECK (condition_type IN ('module_complete', 'points_total', 'streak', 'quiz_score', 'custom')),
  condition_value JSONB NOT NULL, -- { module_id: "..." } ou { points: 100 } ou { days: 7 }
  points_bonus INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges obtenus par les utilisateurs
CREATE TABLE IF NOT EXISTS academy_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES equipe(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES academy_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- RLS
ALTER TABLE academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy_modules_read" ON academy_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "academy_lessons_read" ON academy_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "academy_progress_own" ON academy_progress FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "academy_badges_read" ON academy_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "academy_user_badges_own" ON academy_user_badges FOR ALL TO authenticated USING (true) WITH CHECK (true);
