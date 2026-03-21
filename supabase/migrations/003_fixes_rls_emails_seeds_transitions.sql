-- ============================================================
-- CRM DERMOTEC — Migration 003
-- Fix: RLS policies, emails_sent, email templates, formations seed, session auto-transitions
-- ============================================================

-- ============================================================
-- 1. RLS POLICIES — Isolation par rôle via equipe.role
-- ============================================================

-- Fonction helper : récupère le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM equipe WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Fonction helper : récupère l'ID equipe de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_equipe_id()
RETURNS UUID AS $$
  SELECT id FROM equipe WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -------------------------------------------------------
-- LEADS : commercial voit seulement ses leads assignés
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_leads" ON leads;

CREATE POLICY "leads_select" ON leads FOR SELECT TO authenticated
USING (
  CASE get_user_role()
    WHEN 'admin' THEN true
    WHEN 'manager' THEN true
    WHEN 'assistante' THEN true
    WHEN 'commercial' THEN commercial_assigne_id = get_user_equipe_id()
    WHEN 'formatrice' THEN id IN (
      SELECT i.lead_id FROM inscriptions i
      JOIN sessions s ON s.id = i.session_id
      WHERE s.formatrice_id = get_user_equipe_id()
    )
    ELSE false
  END
);

CREATE POLICY "leads_insert" ON leads FOR INSERT TO authenticated
WITH CHECK (
  get_user_role() IN ('admin', 'manager', 'commercial', 'assistante')
);

CREATE POLICY "leads_update" ON leads FOR UPDATE TO authenticated
USING (
  CASE get_user_role()
    WHEN 'admin' THEN true
    WHEN 'manager' THEN true
    WHEN 'assistante' THEN true
    WHEN 'commercial' THEN commercial_assigne_id = get_user_equipe_id()
    ELSE false
  END
);

CREATE POLICY "leads_delete" ON leads FOR DELETE TO authenticated
USING (
  get_user_role() IN ('admin')
);

-- Conserver l'accès anon pour le webhook formulaire
-- (policy "anon_insert_leads" existe déjà dans 001)

-- -------------------------------------------------------
-- SESSIONS : formatrice voit seulement ses sessions
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_sessions" ON sessions;

CREATE POLICY "sessions_select" ON sessions FOR SELECT TO authenticated
USING (
  CASE get_user_role()
    WHEN 'formatrice' THEN formatrice_id = get_user_equipe_id()
       OR formatrice_secondaire_id = get_user_equipe_id()
    ELSE true
  END
);

CREATE POLICY "sessions_insert" ON sessions FOR INSERT TO authenticated
WITH CHECK (
  get_user_role() IN ('admin', 'manager', 'assistante')
);

CREATE POLICY "sessions_update" ON sessions FOR UPDATE TO authenticated
USING (
  CASE get_user_role()
    WHEN 'formatrice' THEN formatrice_id = get_user_equipe_id()
    ELSE get_user_role() IN ('admin', 'manager', 'assistante')
  END
);

CREATE POLICY "sessions_delete" ON sessions FOR DELETE TO authenticated
USING (get_user_role() IN ('admin', 'manager'));

-- -------------------------------------------------------
-- INSCRIPTIONS : commercial voit celles de ses leads
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_inscriptions" ON inscriptions;

CREATE POLICY "inscriptions_select" ON inscriptions FOR SELECT TO authenticated
USING (
  CASE get_user_role()
    WHEN 'commercial' THEN lead_id IN (
      SELECT id FROM leads WHERE commercial_assigne_id = get_user_equipe_id()
    )
    WHEN 'formatrice' THEN session_id IN (
      SELECT id FROM sessions WHERE formatrice_id = get_user_equipe_id()
    )
    ELSE true
  END
);

CREATE POLICY "inscriptions_insert" ON inscriptions FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('admin', 'manager', 'commercial', 'assistante'));

CREATE POLICY "inscriptions_update" ON inscriptions FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin', 'manager', 'commercial', 'assistante'));

CREATE POLICY "inscriptions_delete" ON inscriptions FOR DELETE TO authenticated
USING (get_user_role() IN ('admin'));

-- -------------------------------------------------------
-- FINANCEMENTS : commercial voit ceux de ses leads
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_financements" ON financements;

CREATE POLICY "financements_select" ON financements FOR SELECT TO authenticated
USING (
  CASE get_user_role()
    WHEN 'commercial' THEN lead_id IN (
      SELECT id FROM leads WHERE commercial_assigne_id = get_user_equipe_id()
    )
    ELSE get_user_role() IN ('admin', 'manager', 'assistante')
  END
);

CREATE POLICY "financements_insert" ON financements FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('admin', 'manager', 'assistante'));

CREATE POLICY "financements_update" ON financements FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin', 'manager', 'assistante'));

CREATE POLICY "financements_delete" ON financements FOR DELETE TO authenticated
USING (get_user_role() IN ('admin'));

-- -------------------------------------------------------
-- FACTURES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_factures" ON factures;

CREATE POLICY "factures_select" ON factures FOR SELECT TO authenticated
USING (get_user_role() IN ('admin', 'manager', 'assistante', 'commercial'));

CREATE POLICY "factures_insert" ON factures FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('admin', 'manager', 'assistante'));

CREATE POLICY "factures_update" ON factures FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin', 'manager', 'assistante'));

CREATE POLICY "factures_delete" ON factures FOR DELETE TO authenticated
USING (get_user_role() IN ('admin'));

-- -------------------------------------------------------
-- RAPPELS : chacun voit les siens + admin/manager tout
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_rappels" ON rappels;

CREATE POLICY "rappels_select" ON rappels FOR SELECT TO authenticated
USING (
  CASE get_user_role()
    WHEN 'admin' THEN true
    WHEN 'manager' THEN true
    ELSE user_id = get_user_equipe_id()
      OR lead_id IN (SELECT id FROM leads WHERE commercial_assigne_id = get_user_equipe_id())
  END
);

CREATE POLICY "rappels_insert" ON rappels FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('admin', 'manager', 'commercial', 'assistante'));

CREATE POLICY "rappels_update" ON rappels FOR UPDATE TO authenticated
USING (
  get_user_role() IN ('admin', 'manager')
  OR user_id = get_user_equipe_id()
);

CREATE POLICY "rappels_delete" ON rappels FOR DELETE TO authenticated
USING (get_user_role() IN ('admin', 'manager'));

-- -------------------------------------------------------
-- ACTIVITES : lecture seule sauf admin
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_activites" ON activites;

CREATE POLICY "activites_select" ON activites FOR SELECT TO authenticated USING (true);
CREATE POLICY "activites_insert" ON activites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "activites_update" ON activites FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin'));
CREATE POLICY "activites_delete" ON activites FOR DELETE TO authenticated
USING (get_user_role() IN ('admin'));

-- -------------------------------------------------------
-- DOCUMENTS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_documents" ON documents;

CREATE POLICY "documents_select" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "documents_insert" ON documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "documents_update" ON documents FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin', 'manager', 'assistante'));
CREATE POLICY "documents_delete" ON documents FOR DELETE TO authenticated
USING (get_user_role() IN ('admin', 'assistante'));

-- -------------------------------------------------------
-- COMMANDES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_commandes" ON commandes;

CREATE POLICY "commandes_select" ON commandes FOR SELECT TO authenticated USING (true);
CREATE POLICY "commandes_insert" ON commandes FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('admin', 'manager', 'assistante'));
CREATE POLICY "commandes_update" ON commandes FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin', 'manager', 'assistante'));
CREATE POLICY "commandes_delete" ON commandes FOR DELETE TO authenticated
USING (get_user_role() IN ('admin'));

-- -------------------------------------------------------
-- EQUIPE : tout le monde lit, seul admin modifie
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_equipe" ON equipe;

CREATE POLICY "equipe_select" ON equipe FOR SELECT TO authenticated USING (true);
CREATE POLICY "equipe_insert" ON equipe FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('admin'));
CREATE POLICY "equipe_update" ON equipe FOR UPDATE TO authenticated
USING (
  get_user_role() IN ('admin')
  OR id = get_user_equipe_id() -- peut modifier son propre profil
);
CREATE POLICY "equipe_delete" ON equipe FOR DELETE TO authenticated
USING (get_user_role() IN ('admin'));

-- -------------------------------------------------------
-- MODELES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_modeles" ON modeles;

CREATE POLICY "modeles_select" ON modeles FOR SELECT TO authenticated USING (true);
CREATE POLICY "modeles_insert" ON modeles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "modeles_update" ON modeles FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin', 'manager', 'formatrice', 'assistante'));
CREATE POLICY "modeles_delete" ON modeles FOR DELETE TO authenticated
USING (get_user_role() IN ('admin', 'manager'));

-- -------------------------------------------------------
-- NOTES_LEAD
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_notes_lead" ON notes_lead;

CREATE POLICY "notes_lead_select" ON notes_lead FOR SELECT TO authenticated USING (true);
CREATE POLICY "notes_lead_insert" ON notes_lead FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notes_lead_update" ON notes_lead FOR UPDATE TO authenticated
USING (
  get_user_role() IN ('admin', 'manager')
  OR user_id = get_user_equipe_id()
);
CREATE POLICY "notes_lead_delete" ON notes_lead FOR DELETE TO authenticated
USING (
  get_user_role() IN ('admin')
  OR user_id = get_user_equipe_id()
);

-- -------------------------------------------------------
-- EMAIL_TEMPLATES : lecture tout le monde, écriture admin
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_email_templates" ON email_templates;

CREATE POLICY "email_templates_select" ON email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "email_templates_insert" ON email_templates FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "email_templates_update" ON email_templates FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "email_templates_delete" ON email_templates FOR DELETE TO authenticated
USING (get_user_role() IN ('admin'));

-- -------------------------------------------------------
-- QUALITE
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_qualite" ON qualite;

CREATE POLICY "qualite_select" ON qualite FOR SELECT TO authenticated USING (true);
CREATE POLICY "qualite_insert" ON qualite FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('admin', 'manager', 'formatrice'));
CREATE POLICY "qualite_update" ON qualite FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "qualite_delete" ON qualite FOR DELETE TO authenticated
USING (get_user_role() IN ('admin'));

-- -------------------------------------------------------
-- PARTENAIRES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_partenaires" ON partenaires;

CREATE POLICY "partenaires_select" ON partenaires FOR SELECT TO authenticated USING (true);
CREATE POLICY "partenaires_insert" ON partenaires FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "partenaires_update" ON partenaires FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "partenaires_delete" ON partenaires FOR DELETE TO authenticated
USING (get_user_role() IN ('admin'));

-- -------------------------------------------------------
-- CADENCE_TEMPLATES & CADENCE_INSTANCES
-- -------------------------------------------------------
DROP POLICY IF EXISTS "auth_full_cadence_templates" ON cadence_templates;
DROP POLICY IF EXISTS "auth_full_cadence_instances" ON cadence_instances;

CREATE POLICY "cadence_templates_select" ON cadence_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "cadence_templates_insert" ON cadence_templates FOR INSERT TO authenticated
WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "cadence_templates_update" ON cadence_templates FOR UPDATE TO authenticated
USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "cadence_instances_select" ON cadence_instances FOR SELECT TO authenticated USING (true);
CREATE POLICY "cadence_instances_insert" ON cadence_instances FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cadence_instances_update" ON cadence_instances FOR UPDATE TO authenticated USING (true);


-- ============================================================
-- 2. TABLE emails_sent — manquante, référencée par l'API
-- ============================================================

CREATE TABLE IF NOT EXISTS emails_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_slug TEXT NOT NULL,
  destinataire TEXT NOT NULL,
  sujet TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  resend_id TEXT,
  variables JSONB DEFAULT '{}',
  statut TEXT DEFAULT 'ENVOYE' CHECK (statut IN ('ENVOYE', 'DELIVRE', 'OUVERT', 'CLIQUE', 'BOUNCE', 'ERREUR')),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emails_sent_lead ON emails_sent(lead_id);
CREATE INDEX idx_emails_sent_template ON emails_sent(template_slug);
CREATE INDEX idx_emails_sent_created ON emails_sent(created_at DESC);
CREATE INDEX idx_emails_sent_statut ON emails_sent(statut);

ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emails_sent_select" ON emails_sent FOR SELECT TO authenticated USING (true);
CREATE POLICY "emails_sent_insert" ON emails_sent FOR INSERT TO authenticated WITH CHECK (true);
-- Service role (webhooks) peut aussi insérer sans auth
CREATE POLICY "anon_insert_emails_sent" ON emails_sent FOR INSERT TO anon WITH CHECK (true);


-- ============================================================
-- 3. EMAIL TEMPLATES — Seed complet avec HTML brandé
-- ============================================================

-- Supprimer les templates basiques existants et réinsérer avec du vrai contenu
DELETE FROM email_templates WHERE slug IN (
  'bienvenue', 'confirmation-inscription', 'convocation-j7', 'satisfaction',
  'relance-1', 'relance-2', 'relance-financement', 'rappel-documents',
  'certificat-disponible', 'bienvenue-alumni', 'confirmation-commande', 'expedition-commande'
);

INSERT INTO email_templates (nom, slug, sujet, contenu_html, contenu_text, variables, categorie) VALUES

-- BIENVENUE
('Bienvenue', 'bienvenue',
 'Bienvenue chez Dermotec, {{prenom}} !',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
    <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Centre de Formation Esthétique — Certifié Qualiopi</p>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#082545;margin:0 0 16px;">Bienvenue {{prenom}} !</h2>
    <p style="color:#334155;line-height:1.6;">Merci pour votre intérêt pour nos formations en esthétique. Nous avons bien reçu votre demande et notre équipe vous contactera sous <strong>24 heures</strong>.</p>
    <p style="color:#334155;line-height:1.6;">En attendant, voici ce que nous proposons :</p>
    <ul style="color:#334155;line-height:1.8;">
      <li><strong>11 formations</strong> du débutant à l''expert</li>
      <li>Financement possible (OPCO, France Travail, CPF…)</li>
      <li>Certification Qualiopi — qualité garantie</li>
      <li>Pratique sur modèles réels dès le 1er jour</li>
    </ul>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.dermotec.fr/formations" style="background:#2EC6F3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block;">Découvrir nos formations</a>
    </div>
    <p style="color:#64748b;font-size:13px;">Une question ? Appelez-nous au <strong>01 88 33 43 43</strong> ou répondez à cet email.</p>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris</p>
    <p style="color:#94a3b8;margin:8px 0 0;font-size:11px;">01 88 33 43 43 | dermotec.fr@gmail.com</p>
  </div>
</div></body></html>',
 'Bienvenue {{prenom}} ! Merci pour votre intérêt pour Dermotec. Notre équipe vous contactera sous 24h. Appelez-nous au 01 88 33 43 43.',
 '{prenom,formation_nom}', 'bienvenue'),

-- CONFIRMATION INSCRIPTION
('Confirmation inscription', 'confirmation-inscription',
 'Inscription confirmée — {{formation_nom}}',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
  </div>
  <div style="padding:32px;">
    <div style="background:#ecfdf5;border-left:4px solid #22c55e;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="color:#166534;margin:0;font-weight:bold;font-size:18px;">✓ Inscription confirmée !</p>
    </div>
    <p style="color:#334155;line-height:1.6;">{{prenom}}, votre inscription à la formation <strong>{{formation_nom}}</strong> est confirmée.</p>
    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;">
      <table style="width:100%;color:#334155;font-size:14px;"><tbody>
        <tr><td style="padding:6px 0;color:#64748b;">Formation</td><td style="padding:6px 0;font-weight:bold;">{{formation_nom}}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Dates</td><td style="padding:6px 0;font-weight:bold;">{{dates}}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Lieu</td><td style="padding:6px 0;">{{lieu}}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Horaires</td><td style="padding:6px 0;">9h00 - 17h00</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Montant</td><td style="padding:6px 0;font-weight:bold;">{{montant}}</td></tr>
      </tbody></table>
    </div>
    <p style="color:#334155;line-height:1.6;"><strong>Prochaines étapes :</strong></p>
    <ol style="color:#334155;line-height:1.8;">
      <li>Vous recevrez votre convention de formation à signer</li>
      <li>Une convocation vous sera envoyée 7 jours avant</li>
      <li>Préparez votre pièce d''identité pour le jour J</li>
    </ol>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris | 01 88 33 43 43</p>
  </div>
</div></body></html>',
 '{{prenom}}, votre inscription à {{formation_nom}} est confirmée. Dates : {{dates}}. Lieu : {{lieu}}. Montant : {{montant}}. Vous recevrez votre convention prochainement.',
 '{prenom,formation_nom,dates,lieu,montant}', 'confirmation'),

-- CONVOCATION J-7
('Convocation J-7', 'convocation-j7',
 'J-7 — Votre formation {{formation_nom}} approche !',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#082545;margin:0 0 16px;">Plus que 7 jours, {{prenom}} !</h2>
    <p style="color:#334155;line-height:1.6;">Votre formation <strong>{{formation_nom}}</strong> démarre le <strong>{{date_debut}}</strong>.</p>
    <div style="background:#eff6ff;border-radius:8px;padding:20px;margin:24px 0;">
      <h3 style="color:#1e40af;margin:0 0 12px;">📍 Informations pratiques</h3>
      <p style="color:#334155;margin:4px 0;"><strong>Adresse :</strong> 75 Boulevard Richard Lenoir, 75011 Paris</p>
      <p style="color:#334155;margin:4px 0;"><strong>Métro :</strong> Oberkampf (L5, L9) ou Richard-Lenoir (L5)</p>
      <p style="color:#334155;margin:4px 0;"><strong>Horaires :</strong> 9h00 - 17h00 (accueil dès 8h45)</p>
      <p style="color:#334155;margin:4px 0;"><strong>À apporter :</strong> Pièce d''identité</p>
    </div>
    <p style="color:#334155;line-height:1.6;">Le matériel de formation est fourni. Tenue confortable recommandée.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://maps.google.com/?q=75+Boulevard+Richard+Lenoir+75011+Paris" style="background:#2EC6F3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block;">Voir l''itinéraire</a>
    </div>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 01 88 33 43 43</p>
  </div>
</div></body></html>',
 '{{prenom}}, votre formation {{formation_nom}} commence le {{date_debut}} à 9h. Adresse : 75 Bd Richard Lenoir, 75011 Paris. Apportez votre pièce d''identité.',
 '{prenom,formation_nom,date_debut}', 'convocation'),

-- SATISFACTION POST-FORMATION
('Satisfaction post-formation', 'satisfaction',
 'Votre avis compte, {{prenom}} — Comment s''est passée votre formation ?',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#082545;margin:0 0 16px;">Félicitations {{prenom}} !</h2>
    <p style="color:#334155;line-height:1.6;">Vous venez de terminer la formation <strong>{{formation_nom}}</strong>. Bravo !</p>
    <p style="color:#334155;line-height:1.6;">Votre retour est précieux pour nous améliorer. Prenez 2 minutes pour partager votre expérience :</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="{{lien_evaluation}}" style="background:#2EC6F3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block;">Donner mon avis</a>
    </div>
    <p style="color:#334155;line-height:1.6;">Et si votre expérience vous a plu, un petit avis Google nous aide énormément :</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="{{lien_google}}" style="background:#ffffff;color:#082545;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block;border:2px solid #082545;">⭐ Laisser un avis Google</a>
    </div>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris</p>
  </div>
</div></body></html>',
 '{{prenom}}, félicitations pour votre formation {{formation_nom}} ! Donnez votre avis : {{lien_evaluation}}',
 '{prenom,formation_nom,lien_evaluation,lien_google}', 'satisfaction'),

-- RELANCE 1 (J+3)
('Relance J+3', 'relance-1',
 '{{prenom}}, on a essayé de vous joindre — Dermotec',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#082545;margin:0 0 16px;">{{prenom}}, avez-vous des questions ?</h2>
    <p style="color:#334155;line-height:1.6;">Nous avons essayé de vous contacter suite à votre intérêt pour la formation <strong>{{formation_nom}}</strong>.</p>
    <p style="color:#334155;line-height:1.6;">Je me permets de revenir vers vous car les <strong>places sont limitées à 6 par session</strong> et les prochaines dates se remplissent vite.</p>
    <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="color:#92400e;margin:0;"><strong>💡 Le saviez-vous ?</strong> Cette formation est finançable à 100% pour les salariées et demandeurs d''emploi.</p>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://wa.me/33188334343?text=Bonjour, je suis intéressée par {{formation_nom}}" style="background:#25D366;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block;">Répondre par WhatsApp</a>
    </div>
    <p style="color:#64748b;font-size:13px;">Ou appelez-nous directement au <strong>01 88 33 43 43</strong>.</p>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris</p>
  </div>
</div></body></html>',
 '{{prenom}}, nous avons essayé de vous joindre au sujet de {{formation_nom}}. Places limitées à 6 par session ! Appelez-nous au 01 88 33 43 43 ou répondez par WhatsApp.',
 '{prenom,formation_nom}', 'relance'),

-- RELANCE 2 (J+7 — dernière)
('Relance J+7 — Dernière chance', 'relance-2',
 'Dernière relance — {{formation_nom}} (places limitées)',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#082545;margin:0 0 16px;">{{prenom}}, c''est notre dernier message</h2>
    <p style="color:#334155;line-height:1.6;">Nous ne voulons pas être insistants, mais nous savons que la formation <strong>{{formation_nom}}</strong> peut transformer votre carrière.</p>
    <p style="color:#334155;line-height:1.6;">Si le timing n''est pas le bon, pas de souci — répondez simplement <em>"plus tard"</em> et nous reviendrons vers vous quand vous serez prête.</p>
    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;">
      <h3 style="color:#082545;margin:0 0 12px;">Ce que nos stagiaires disent :</h3>
      <p style="color:#334155;font-style:italic;margin:0;">"J''ai lancé mon activité 2 mois après la formation. Meilleur investissement de ma carrière." — Stagiaire Dermotec</p>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="tel:+33188334343" style="background:#2EC6F3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block;">Nous appeler</a>
    </div>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris</p>
  </div>
</div></body></html>',
 '{{prenom}}, dernière relance pour {{formation_nom}}. Si le timing ne convient pas, répondez "plus tard". Sinon appelez-nous au 01 88 33 43 43.',
 '{prenom,formation_nom}', 'relance'),

-- RELANCE FINANCEMENT
('Relance financement', 'relance-financement',
 'Votre dossier de financement — {{organisme}}',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#082545;margin:0 0 16px;">Point sur votre financement, {{prenom}}</h2>
    <p style="color:#334155;line-height:1.6;">Nous faisons le point sur votre dossier de financement <strong>{{organisme}}</strong> pour la formation <strong>{{formation_nom}}</strong>.</p>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="color:#991b1b;margin:0;"><strong>Documents manquants :</strong></p>
      <p style="color:#334155;margin:8px 0 0;">{{documents_manquants}}</p>
    </div>
    <p style="color:#334155;line-height:1.6;">Merci de nous envoyer ces documents au plus vite pour ne pas retarder votre inscription.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="mailto:dermotec.fr@gmail.com?subject=Documents financement {{organisme}}" style="background:#2EC6F3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block;">Envoyer mes documents</a>
    </div>
    <p style="color:#64748b;font-size:13px;">Besoin d''aide ? Notre assistante administrative est là pour vous accompagner : <strong>01 88 33 43 43</strong></p>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris</p>
  </div>
</div></body></html>',
 '{{prenom}}, point sur votre financement {{organisme}} pour {{formation_nom}}. Documents manquants : {{documents_manquants}}. Envoyez-les à dermotec.fr@gmail.com ou appelez le 01 88 33 43 43.',
 '{prenom,formation_nom,organisme,documents_manquants}', 'financement'),

-- RAPPEL DOCUMENTS
('Rappel documents', 'rappel-documents',
 'Rappel — Documents requis pour votre financement',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#082545;margin:0 0 16px;">{{prenom}}, n''oubliez pas vos documents !</h2>
    <p style="color:#334155;line-height:1.6;">Pour finaliser votre dossier <strong>{{organisme}}</strong>, nous avons besoin des documents suivants :</p>
    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="color:#334155;margin:0;white-space:pre-line;">{{documents_manquants}}</p>
    </div>
    <p style="color:#334155;line-height:1.6;">Envoyez-les par email ou apportez-les directement au centre.</p>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 01 88 33 43 43</p>
  </div>
</div></body></html>',
 '{{prenom}}, rappel : documents manquants pour votre financement {{organisme}} : {{documents_manquants}}.',
 '{prenom,organisme,documents_manquants}', 'rappel'),

-- CERTIFICAT DISPONIBLE
('Certificat disponible', 'certificat-disponible',
 'Votre certificat est prêt — {{formation_nom}}',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
  </div>
  <div style="padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <p style="font-size:48px;margin:0;">🎓</p>
    </div>
    <h2 style="color:#082545;margin:0 0 16px;text-align:center;">Félicitations {{prenom}} !</h2>
    <p style="color:#334155;line-height:1.6;text-align:center;">Votre certificat de formation <strong>{{formation_nom}}</strong> est prêt.</p>
    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
      <p style="color:#64748b;margin:0 0 4px;font-size:13px;">Numéro de certificat</p>
      <p style="color:#082545;margin:0;font-size:20px;font-weight:bold;">{{numero_certificat}}</p>
    </div>
    <p style="color:#334155;line-height:1.6;">Ce certificat atteste de votre réussite à la formation dispensée par Dermotec Advanced, organisme certifié Qualiopi.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="{{lien_certificat}}" style="background:#2EC6F3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block;">Télécharger mon certificat</a>
    </div>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris</p>
  </div>
</div></body></html>',
 '{{prenom}}, votre certificat {{formation_nom}} (n°{{numero_certificat}}) est prêt. Téléchargez-le ici : {{lien_certificat}}',
 '{prenom,formation_nom,numero_certificat,lien_certificat}', 'certificat'),

-- BIENVENUE ALUMNI
('Bienvenue Alumni', 'bienvenue-alumni',
 'Bienvenue dans le réseau Alumni Dermotec, {{prenom}} !',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
    <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Réseau Alumni</p>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#082545;margin:0 0 16px;">{{prenom}}, vous faites partie de la famille !</h2>
    <p style="color:#334155;line-height:1.6;">En tant qu''alumni Dermotec, vous bénéficiez de :</p>
    <ul style="color:#334155;line-height:2;">
      <li><strong>-15%</strong> sur toutes les formations complémentaires</li>
      <li>Accès prioritaire aux nouvelles sessions</li>
      <li>Support technique gratuit pendant 3 mois</li>
      <li>Réseau d''entraide entre professionnelles</li>
    </ul>
    <p style="color:#334155;line-height:1.6;">Votre code parrainage : <strong>{{code_parrainage}}</strong> — partagez-le pour offrir -10% à vos filleules.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.dermotec.fr/formations" style="background:#2EC6F3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block;">Voir les formations complémentaires</a>
    </div>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris</p>
  </div>
</div></body></html>',
 '{{prenom}}, bienvenue dans le réseau Alumni Dermotec ! -15% sur les formations complémentaires. Votre code parrainage : {{code_parrainage}}.',
 '{prenom,code_parrainage}', 'autre'),

-- CONFIRMATION COMMANDE E-SHOP
('Confirmation commande', 'confirmation-commande',
 'Commande confirmée — {{numero_commande}}',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
  </div>
  <div style="padding:32px;">
    <div style="background:#ecfdf5;border-left:4px solid #22c55e;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="color:#166534;margin:0;font-weight:bold;">✓ Commande confirmée</p>
    </div>
    <p style="color:#334155;line-height:1.6;">Merci {{prenom}} ! Votre commande <strong>{{numero_commande}}</strong> a bien été enregistrée.</p>
    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;">
      <table style="width:100%;color:#334155;font-size:14px;"><tbody>
        <tr><td style="padding:6px 0;color:#64748b;">Commande</td><td style="padding:6px 0;font-weight:bold;">{{numero_commande}}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Montant</td><td style="padding:6px 0;font-weight:bold;">{{montant}}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Livraison estimée</td><td style="padding:6px 0;">3-5 jours ouvrés</td></tr>
      </tbody></table>
    </div>
    <p style="color:#334155;line-height:1.6;">Vous recevrez un email avec le numéro de suivi dès l''expédition.</p>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 01 88 33 43 43</p>
  </div>
</div></body></html>',
 'Merci {{prenom}} ! Commande {{numero_commande}} confirmée. Montant : {{montant}}. Livraison sous 3-5 jours ouvrés.',
 '{prenom,numero_commande,montant}', 'eshop'),

-- EXPEDITION COMMANDE
('Expédition commande', 'expedition-commande',
 'Votre commande {{numero_commande}} est en route !',
 '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:''DM Sans'',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#082545;padding:32px;text-align:center;">
    <h1 style="color:#2EC6F3;margin:0;font-size:28px;">DERMOTEC Advanced</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#082545;margin:0 0 16px;">📦 Votre colis est en route !</h2>
    <p style="color:#334155;line-height:1.6;">{{prenom}}, votre commande <strong>{{numero_commande}}</strong> a été expédiée.</p>
    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;">
      <table style="width:100%;color:#334155;font-size:14px;"><tbody>
        <tr><td style="padding:6px 0;color:#64748b;">Transporteur</td><td style="padding:6px 0;font-weight:bold;">{{transporteur}}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">N° de suivi</td><td style="padding:6px 0;font-weight:bold;">{{tracking}}</td></tr>
      </tbody></table>
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="{{lien_tracking}}" style="background:#2EC6F3;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;display:inline-block;">Suivre mon colis</a>
    </div>
  </div>
  <div style="background:#f1f5f9;padding:24px;text-align:center;">
    <p style="color:#64748b;margin:0;font-size:12px;">Dermotec Advanced — 01 88 33 43 43</p>
  </div>
</div></body></html>',
 '{{prenom}}, votre commande {{numero_commande}} est expédiée via {{transporteur}}. Suivi : {{tracking}}.',
 '{prenom,numero_commande,transporteur,tracking,lien_tracking}', 'eshop')

ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  sujet = EXCLUDED.sujet,
  contenu_html = EXCLUDED.contenu_html,
  contenu_text = EXCLUDED.contenu_text,
  variables = EXCLUDED.variables,
  categorie = EXCLUDED.categorie,
  updated_at = NOW();


-- ============================================================
-- 4. FORMATIONS SEED — Compléter les champs manquants
-- ============================================================

UPDATE formations SET
  prerequis = 'Obligatoire pour exercer',
  objectifs = ARRAY['Maîtriser les règles d''hygiène et salubrité', 'Connaître la réglementation en vigueur', 'Appliquer les protocoles de stérilisation'],
  competences_acquises = ARRAY['Règles d''hygiène', 'Stérilisation du matériel', 'Protocoles sanitaires', 'Réglementation']
WHERE slug = 'hygiene-salubrite';

UPDATE formations SET
  objectifs = ARRAY['Maîtriser le maquillage permanent sourcils, lèvres et eye-liner', 'Colorimétrie et morphologie du visage', 'Pratique sur modèles réels'],
  competences_acquises = ARRAY['Dermopigmentation sourcils', 'Dermopigmentation lèvres', 'Dermopigmentation eye-liner', 'Colorimétrie', 'Hygiène spécifique']
WHERE slug = 'maquillage-permanent';

UPDATE formations SET
  objectifs = ARRAY['Maîtriser la technique du microblading poil à poil', 'Maîtriser le microshading ombré', 'Morphologie du sourcil'],
  competences_acquises = ARRAY['Microblading', 'Microshading', 'Morphologie sourcils', 'Choix des pigments']
WHERE slug = 'microblading';

UPDATE formations SET
  objectifs = ARRAY['Maîtriser la pigmentation des lèvres complète', 'Techniques d''ombrage et dégradé', 'Gestion des contre-indications'],
  competences_acquises = ARRAY['Full lips technique', 'Candy lips', 'Neutralisation', 'Colorimétrie lèvres']
WHERE slug = 'full-lips';

UPDATE formations SET
  objectifs = ARRAY['Maîtriser la tricopigmentation capillaire', 'Technique HFS (Hair Full Simulation)', 'Traiter calvitie et alopécie'],
  competences_acquises = ARRAY['Tricopigmentation', 'Technique HFS', 'Densification capillaire', 'Ligne frontale']
WHERE slug = 'tricopigmentation';

UPDATE formations SET
  objectifs = ARRAY['Dermopigmentation réparatrice post-chirurgie', 'Reconstruction visuelle aréole mammaire', 'Camouflage de cicatrices'],
  competences_acquises = ARRAY['Aréole mammaire 3D', 'Camouflage cicatrices', 'Vergetures', 'Accompagnement psychologique']
WHERE slug = 'areole-cicatrices';

UPDATE formations SET
  objectifs = ARRAY['Maîtriser le nanoneedling facial', 'Technique BB Glow pour teint lumineux', 'Protocole anti-âge complet'],
  competences_acquises = ARRAY['Nanoneedling', 'BB Glow', 'Sérums actifs', 'Protocole anti-âge']
WHERE slug = 'nanoneedling';

UPDATE formations SET
  objectifs = ARRAY['Soin visage complet multi-techniques', 'Personnaliser selon le type de peau', 'Protocole signature institut'],
  competences_acquises = ARRAY['Diagnostic de peau', 'Soin multi-techniques', 'Protocole ALLin1', 'Conseil client']
WHERE slug = 'soin-allin1';

UPDATE formations SET
  objectifs = ARRAY['Maîtriser le peeling chimique adapté', 'Technique de dermaplaning au scalpel', 'Combinaison des deux techniques'],
  competences_acquises = ARRAY['Peeling chimique', 'Dermaplaning', 'Analyse cutanée', 'Protocole combiné']
WHERE slug = 'peeling-dermaplaning';

UPDATE formations SET
  objectifs = ARRAY['Maîtriser le détatouage laser', 'Technique Carbon Peel', 'Paramétrage des appareils laser'],
  competences_acquises = ARRAY['Détatouage laser', 'Carbon Peel', 'Sécurité laser', 'Paramétrage appareil']
WHERE slug = 'detatouage';

UPDATE formations SET
  objectifs = ARRAY['Maîtriser l''épilation laser/IPL', 'Paramétrage selon phototype', 'Protocole complet visage et corps'],
  competences_acquises = ARRAY['Épilation laser', 'Épilation IPL', 'Phototypes de peau', 'Sécurité laser']
WHERE slug = 'epilation-definitive';


-- ============================================================
-- 5. TRANSITION AUTO : Sessions CONFIRMEE → EN_COURS
-- ============================================================

-- Fonction qui passe les sessions CONFIRMEE → EN_COURS quand date_debut = today
-- et TERMINEE quand date_fin < today pour les sessions EN_COURS
CREATE OR REPLACE FUNCTION public.auto_transition_sessions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  rows_affected INTEGER;
BEGIN
  -- CONFIRMEE → EN_COURS : la session démarre aujourd'hui
  UPDATE sessions
  SET statut = 'EN_COURS'
  WHERE statut = 'CONFIRMEE'
    AND date_debut <= CURRENT_DATE
    AND date_fin >= CURRENT_DATE;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  updated_count := updated_count + rows_affected;

  -- Log les transitions
  INSERT INTO activites (type, session_id, description, ancien_statut, nouveau_statut, metadata)
  SELECT 'SESSION', s.id,
    'Transition automatique : session démarrée',
    'CONFIRMEE', 'EN_COURS',
    jsonb_build_object('auto', true, 'trigger', 'auto_transition_sessions')
  FROM sessions s
  WHERE s.statut = 'EN_COURS'
    AND s.date_debut = CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM activites a
      WHERE a.session_id = s.id
        AND a.type = 'SESSION'
        AND a.nouveau_statut = 'EN_COURS'
        AND a.metadata->>'auto' = 'true'
        AND a.created_at::date = CURRENT_DATE
    );

  -- EN_COURS → TERMINEE : la session est finie (date_fin < today)
  UPDATE sessions
  SET statut = 'TERMINEE'
  WHERE statut = 'EN_COURS'
    AND date_fin < CURRENT_DATE;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  updated_count := updated_count + rows_affected;

  -- Log les transitions terminées
  INSERT INTO activites (type, session_id, description, ancien_statut, nouveau_statut, metadata)
  SELECT 'SESSION', s.id,
    'Transition automatique : session terminée',
    'EN_COURS', 'TERMINEE',
    jsonb_build_object('auto', true, 'trigger', 'auto_transition_sessions')
  FROM sessions s
  WHERE s.statut = 'TERMINEE'
    AND s.date_fin = CURRENT_DATE - INTERVAL '1 day'
    AND NOT EXISTS (
      SELECT 1 FROM activites a
      WHERE a.session_id = s.id
        AND a.type = 'SESSION'
        AND a.nouveau_statut = 'TERMINEE'
        AND a.metadata->>'auto' = 'true'
        AND a.created_at::date = CURRENT_DATE
    );

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appel via pg_cron (si extension disponible) — exécution quotidienne à 7h
-- Si pg_cron n'est pas dispo, cette partie sera ignorée silencieusement
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'auto-transition-sessions',
      '0 7 * * *',
      $$SELECT public.auto_transition_sessions()$$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron non disponible — utiliser un appel API externe pour auto_transition_sessions()';
END $$;

-- Alternative : trigger sur INSERT dans une table "cron_tick" pour les environnements sans pg_cron
-- Ou appel via API route Next.js (voir route créée ci-dessous)
