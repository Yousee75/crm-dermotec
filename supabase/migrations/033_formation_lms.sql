-- ============================================================
-- CRM SATOREA — Migration 033: Formation LMS
-- Système de contenus pédagogiques pour les stagiaires
-- Modules, leçons, fichiers (PPT/PDF/vidéo/audio), progression
-- ============================================================

-- ============================================================
-- 1. MODULES PAR FORMATION
-- ============================================================

CREATE TABLE IF NOT EXISTS formation_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,

    -- Contenu
    titre TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    icone TEXT DEFAULT 'BookOpen', -- Lucide icon name
    couleur TEXT DEFAULT '#2EC6F3', -- Hex color

    -- Organisation
    jour_formation INTEGER, -- Jour 1, 2, 3... (null = transversal)
    ordre INTEGER NOT NULL DEFAULT 0,
    duree_minutes INTEGER,

    -- Accès
    accessible_avant BOOLEAN DEFAULT false, -- Dispo avant la session
    accessible_pendant BOOLEAN DEFAULT true,
    accessible_apres BOOLEAN DEFAULT true, -- Dispo après la session (alumni)
    delai_acces_avant_jours INTEGER DEFAULT 7, -- Accessible X jours avant
    delai_acces_apres_jours INTEGER DEFAULT 365, -- Accessible X jours après

    -- Publication
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,

    -- Meta
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fm_formation_slug ON formation_modules(formation_id, slug);
CREATE INDEX IF NOT EXISTS idx_fm_formation ON formation_modules(formation_id, ordre);
CREATE INDEX IF NOT EXISTS idx_fm_published ON formation_modules(is_published, formation_id);

CREATE TRIGGER IF NOT EXISTS tr_formation_modules_updated
    BEFORE UPDATE ON formation_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. CONTENUS (fichiers, vidéos, quiz, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS formation_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES formation_modules(id) ON DELETE CASCADE,
    formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,

    -- Contenu
    titre TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    ordre INTEGER NOT NULL DEFAULT 0,

    -- Type de contenu
    type TEXT NOT NULL CHECK (type IN (
        'video',      -- Vidéo (YouTube, Vimeo, Supabase Storage, Bunny)
        'ppt',        -- Présentation PowerPoint/Keynote/Google Slides
        'pdf',        -- Document PDF
        'audio',      -- Podcast, audio
        'image',      -- Image, photo, infographie
        'galerie',    -- Galerie photos (avant/après)
        'quiz',       -- QCM interactif
        'exercice',   -- Exercice pratique avec consignes
        'texte',      -- Contenu texte riche (Markdown)
        'lien',       -- Lien externe
        'checklist'   -- Liste de vérification
    )),

    -- Fichier (pour ppt, pdf, audio, image)
    file_path TEXT, -- Chemin dans Supabase Storage (bucket: formation-content)
    file_name TEXT, -- Nom original du fichier
    file_size INTEGER, -- Taille en bytes
    file_mime TEXT, -- Type MIME

    -- Vidéo (pour type video)
    video_url TEXT, -- URL YouTube/Vimeo/Bunny non-listé
    video_provider TEXT CHECK (video_provider IN ('youtube', 'vimeo', 'bunny', 'supabase', 'autre')),
    video_duration_seconds INTEGER,
    video_thumbnail_url TEXT,

    -- Audio (pour type audio)
    audio_url TEXT,
    audio_duration_seconds INTEGER,

    -- Contenu inline (pour texte, quiz, exercice, checklist)
    contenu JSONB DEFAULT '{}',
    -- Quiz : { questions: [{ question, options: [], correct: number, explication }] }
    -- Exercice : { consigne, materiel_requis, duree_estimee, criteres_evaluation }
    -- Checklist : { items: [{ titre, description, obligatoire }] }
    -- Texte : { markdown: "..." }
    -- Galerie : { images: [{ url, legende, avant_apres }] }

    -- Téléchargement
    telechargeable BOOLEAN DEFAULT true, -- Le stagiaire peut-il télécharger ?
    watermark_enabled BOOLEAN DEFAULT true, -- Watermark PDF avec nom stagiaire ?

    -- Points et progression
    points INTEGER DEFAULT 0,
    obligatoire BOOLEAN DEFAULT false, -- Requis pour obtenir le certificat ?
    score_minimum INTEGER, -- Score minimum quiz pour valider (%)

    -- Publication
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,

    -- Meta
    vues_totales INTEGER DEFAULT 0,
    telechargements_totaux INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fc_module_slug ON formation_contents(module_id, slug);
CREATE INDEX IF NOT EXISTS idx_fc_module ON formation_contents(module_id, ordre);
CREATE INDEX IF NOT EXISTS idx_fc_formation ON formation_contents(formation_id);
CREATE INDEX IF NOT EXISTS idx_fc_type ON formation_contents(type);
CREATE INDEX IF NOT EXISTS idx_fc_published ON formation_contents(is_published, formation_id);

CREATE TRIGGER IF NOT EXISTS tr_formation_contents_updated
    BEFORE UPDATE ON formation_contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. PROGRESSION STAGIAIRE
-- ============================================================

CREATE TABLE IF NOT EXISTS content_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Liens
    inscription_id UUID NOT NULL REFERENCES inscriptions(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES formation_contents(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL, -- Dénormalisé pour faciliter les requêtes

    -- Progression
    statut TEXT NOT NULL DEFAULT 'non_vu' CHECK (statut IN (
        'non_vu',     -- Jamais accédé
        'en_cours',   -- Ouvert/commencé mais pas terminé
        'complete'    -- Terminé (vidéo vue, quiz validé, PDF téléchargé)
    )),

    -- Données
    temps_passe_secondes INTEGER DEFAULT 0,
    progression_pct INTEGER DEFAULT 0 CHECK (progression_pct >= 0 AND progression_pct <= 100),
    score_quiz INTEGER, -- Score quiz en % (null si pas un quiz)
    tentatives_quiz INTEGER DEFAULT 0,
    reponses_quiz JSONB, -- Réponses données au quiz

    -- Dates
    first_viewed_at TIMESTAMPTZ,
    last_viewed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cp_inscription_content ON content_progress(inscription_id, content_id);
CREATE INDEX IF NOT EXISTS idx_cp_inscription ON content_progress(inscription_id);
CREATE INDEX IF NOT EXISTS idx_cp_lead ON content_progress(lead_id);
CREATE INDEX IF NOT EXISTS idx_cp_content ON content_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_cp_statut ON content_progress(statut);

CREATE TRIGGER IF NOT EXISTS tr_content_progress_updated
    BEFORE UPDATE ON content_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. LOG TÉLÉCHARGEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS content_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Liens
    content_id UUID NOT NULL REFERENCES formation_contents(id) ON DELETE CASCADE,
    inscription_id UUID REFERENCES inscriptions(id) ON DELETE SET NULL,
    lead_id UUID,

    -- Download
    file_name TEXT,
    file_size INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    watermarked BOOLEAN DEFAULT false,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cd_content ON content_downloads(content_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cd_inscription ON content_downloads(inscription_id);
CREATE INDEX IF NOT EXISTS idx_cd_date ON content_downloads(created_at DESC);

-- ============================================================
-- 5. RLS
-- ============================================================

ALTER TABLE formation_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_downloads ENABLE ROW LEVEL SECURITY;

-- Modules : tout le monde peut lire les publiés, admin peut tout
CREATE POLICY "fm_select_published" ON formation_modules
    FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "fm_service" ON formation_modules
    FOR ALL TO service_role USING (true);

-- Contenus : tout le monde peut lire les publiés, admin peut tout
CREATE POLICY "fc_select_published" ON formation_contents
    FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "fc_service" ON formation_contents
    FOR ALL TO service_role USING (true);

-- Progression : chaque stagiaire voit SA progression
CREATE POLICY "cp_select_own" ON content_progress
    FOR SELECT TO authenticated
    USING (lead_id IN (
        SELECT l.id FROM leads l
        JOIN equipe e ON e.auth_user_id = (SELECT auth.uid())
        WHERE l.id = content_progress.lead_id
        LIMIT 1
    ));
CREATE POLICY "cp_service" ON content_progress
    FOR ALL TO service_role USING (true);

-- Downloads : service_role seulement
CREATE POLICY "cd_service" ON content_downloads
    FOR ALL TO service_role USING (true);

-- ============================================================
-- 6. VUES
-- ============================================================

-- Vue : progression par inscription (% de complétion)
CREATE OR REPLACE VIEW v_inscription_content_progress AS
SELECT
    i.id AS inscription_id,
    i.lead_id,
    i.session_id,
    f.id AS formation_id,
    f.nom AS formation_nom,
    -- Stats contenus
    COUNT(fc.id) AS total_contenus,
    COUNT(fc.id) FILTER (WHERE fc.obligatoire = true) AS contenus_obligatoires,
    COUNT(cp.id) FILTER (WHERE cp.statut = 'complete') AS contenus_completes,
    COUNT(cp.id) FILTER (WHERE cp.statut = 'complete' AND fc.obligatoire = true) AS obligatoires_completes,
    -- Pourcentage
    CASE
        WHEN COUNT(fc.id) > 0
        THEN ROUND(100.0 * COUNT(cp.id) FILTER (WHERE cp.statut = 'complete') / COUNT(fc.id))
        ELSE 0
    END AS progression_pct,
    -- Quiz
    AVG(cp.score_quiz) FILTER (WHERE fc.type = 'quiz' AND cp.score_quiz IS NOT NULL) AS score_quiz_moyen,
    -- Temps
    SUM(cp.temps_passe_secondes) AS temps_total_secondes,
    -- Points
    SUM(fc.points) FILTER (WHERE cp.statut = 'complete') AS points_gagnes,
    SUM(fc.points) AS points_totaux
FROM inscriptions i
JOIN sessions s ON s.id = i.session_id
JOIN formations f ON f.id = s.formation_id
LEFT JOIN formation_contents fc ON fc.formation_id = f.id AND fc.is_published = true
LEFT JOIN content_progress cp ON cp.content_id = fc.id AND cp.inscription_id = i.id
GROUP BY i.id, i.lead_id, i.session_id, f.id, f.nom;

-- Vue : contenus les plus populaires
CREATE OR REPLACE VIEW v_popular_contents AS
SELECT
    fc.id,
    fc.titre,
    fc.type,
    fc.formation_id,
    f.nom AS formation_nom,
    fc.vues_totales,
    fc.telechargements_totaux,
    COUNT(cp.id) FILTER (WHERE cp.statut = 'complete') AS completions,
    AVG(cp.score_quiz) FILTER (WHERE cp.score_quiz IS NOT NULL) AS avg_quiz_score
FROM formation_contents fc
JOIN formations f ON f.id = fc.formation_id
LEFT JOIN content_progress cp ON cp.content_id = fc.id
WHERE fc.is_published = true
GROUP BY fc.id, fc.titre, fc.type, fc.formation_id, f.nom,
         fc.vues_totales, fc.telechargements_totaux
ORDER BY fc.vues_totales DESC;

-- ============================================================
-- 7. BUCKET STORAGE
-- ============================================================

-- Note : le bucket doit être créé dans le dashboard Supabase
-- Nom : formation-content
-- Public : NON (privé)
-- File size limit : 500 MB
-- Allowed MIME types : application/pdf, application/vnd.ms-powerpoint,
--   application/vnd.openxmlformats-officedocument.presentationml.presentation,
--   video/mp4, video/webm, video/quicktime,
--   audio/mpeg, audio/mp4, audio/wav, audio/ogg,
--   image/jpeg, image/png, image/webp, image/gif

-- ============================================================
-- 8. COMMENTAIRES
-- ============================================================

COMMENT ON TABLE formation_modules IS 'Modules pédagogiques par formation — organisés par jour/ordre';
COMMENT ON TABLE formation_contents IS 'Contenus pédagogiques (PPT, PDF, vidéo, audio, quiz) — liés à un module et une formation';
COMMENT ON TABLE content_progress IS 'Progression de chaque stagiaire sur chaque contenu — statut, temps, score quiz';
COMMENT ON TABLE content_downloads IS 'Log de tous les téléchargements de fichiers — audit trail';
COMMENT ON COLUMN formation_contents.watermark_enabled IS 'Si true, les PDF téléchargés sont watermarkés avec le nom du stagiaire';
COMMENT ON COLUMN formation_contents.telechargeable IS 'Si false, le contenu ne peut être que consulté en ligne (pas de téléchargement)';
COMMENT ON COLUMN formation_modules.accessible_avant IS 'Si true, le module est accessible X jours avant le début de la session';
COMMENT ON COLUMN formation_modules.accessible_apres IS 'Si true, le module reste accessible X jours après la fin de la session';
