-- ============================================================
-- CRM DERMOTEC — Migration 003 : Emails sent + Analytics views
-- ============================================================

-- Table emails_sent : historique des emails envoyés
CREATE TABLE IF NOT EXISTS emails_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_slug TEXT,
  destinataire TEXT NOT NULL,
  sujet TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  resend_id TEXT, -- ID Resend pour tracking
  variables JSONB DEFAULT '{}',
  statut TEXT DEFAULT 'ENVOYE' CHECK (statut IN ('ENVOYE', 'DELIVRE', 'OUVERT', 'CLIQUE', 'BOUNCE', 'ERREUR')),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emails_sent_lead ON emails_sent(lead_id);
CREATE INDEX idx_emails_sent_template ON emails_sent(template_slug);
CREATE INDEX idx_emails_sent_created ON emails_sent(created_at DESC);

ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_full_emails_sent" ON emails_sent FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vue : conversion funnel
CREATE OR REPLACE VIEW v_conversion_funnel AS
SELECT
  COUNT(*) FILTER (WHERE statut = 'NOUVEAU') AS nouveaux,
  COUNT(*) FILTER (WHERE statut = 'CONTACTE') AS contactes,
  COUNT(*) FILTER (WHERE statut = 'QUALIFIE') AS qualifies,
  COUNT(*) FILTER (WHERE statut = 'FINANCEMENT_EN_COURS') AS en_financement,
  COUNT(*) FILTER (WHERE statut = 'INSCRIT') AS inscrits,
  COUNT(*) FILTER (WHERE statut = 'EN_FORMATION') AS en_formation,
  COUNT(*) FILTER (WHERE statut IN ('FORME', 'ALUMNI')) AS formes,
  COUNT(*) FILTER (WHERE statut = 'PERDU') AS perdus,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE statut IN ('FORME', 'ALUMNI')) / NULLIF(COUNT(*), 0), 1) AS taux_conversion
FROM leads
WHERE created_at >= NOW() - INTERVAL '90 days';

-- Vue : CA par mois
CREATE OR REPLACE VIEW v_ca_mensuel AS
SELECT
  DATE_TRUNC('month', i.created_at) AS mois,
  COUNT(DISTINCT i.id) AS nb_inscriptions,
  SUM(i.montant_total) AS ca_total,
  SUM(i.montant_finance) AS montant_finance,
  SUM(i.reste_a_charge) AS reste_a_charge,
  ROUND(AVG(i.note_satisfaction), 1) AS satisfaction_moyenne
FROM inscriptions i
WHERE i.paiement_statut IN ('PAYE', 'PARTIEL', 'ACOMPTE')
GROUP BY DATE_TRUNC('month', i.created_at)
ORDER BY mois DESC;

-- Vue : performance par formation
CREATE OR REPLACE VIEW v_formation_performance AS
SELECT
  f.id,
  f.nom,
  f.categorie,
  f.prix_ht,
  COUNT(DISTINCT s.id) AS nb_sessions,
  COUNT(DISTINCT i.id) AS nb_inscrits,
  COALESCE(SUM(i.montant_total) FILTER (WHERE i.paiement_statut = 'PAYE'), 0) AS ca_realise,
  ROUND(AVG(i.note_satisfaction), 1) AS satisfaction_moyenne,
  ROUND(AVG(i.taux_presence), 0) AS taux_presence_moyen,
  COUNT(*) FILTER (WHERE i.certificat_genere) AS certificats_generes
FROM formations f
LEFT JOIN sessions s ON s.formation_id = f.id
LEFT JOIN inscriptions i ON i.session_id = s.id
GROUP BY f.id, f.nom, f.categorie, f.prix_ht
ORDER BY ca_realise DESC;

-- Vue : leads par source
CREATE OR REPLACE VIEW v_leads_par_source AS
SELECT
  source,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE statut IN ('INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI')) AS convertis,
  ROUND(100.0 * COUNT(*) FILTER (WHERE statut IN ('INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI')) / NULLIF(COUNT(*), 0), 1) AS taux_conversion,
  ROUND(AVG(score_chaud), 0) AS score_moyen
FROM leads
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY source
ORDER BY total DESC;

-- Vue : rappels en retard par commercial
CREATE OR REPLACE VIEW v_rappels_retard AS
SELECT
  e.id AS commercial_id,
  e.prenom || ' ' || e.nom AS commercial_nom,
  COUNT(*) AS nb_rappels_retard,
  MIN(r.date_rappel) AS plus_ancien
FROM rappels r
JOIN equipe e ON e.id = r.user_id
WHERE r.statut = 'EN_ATTENTE'
  AND r.date_rappel < NOW()
GROUP BY e.id, e.prenom, e.nom
ORDER BY nb_rappels_retard DESC;

-- Vue : résumé financements
CREATE OR REPLACE VIEW v_financements_resume AS
SELECT
  organisme,
  COUNT(*) AS total_dossiers,
  COUNT(*) FILTER (WHERE statut = 'VALIDE') AS valides,
  COUNT(*) FILTER (WHERE statut = 'REFUSE') AS refuses,
  COUNT(*) FILTER (WHERE statut IN ('SOUMIS', 'EN_EXAMEN')) AS en_cours,
  COALESCE(SUM(montant_accorde) FILTER (WHERE statut IN ('VALIDE', 'VERSE')), 0) AS montant_accorde_total,
  COALESCE(SUM(montant_verse), 0) AS montant_verse_total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE statut = 'VALIDE') / NULLIF(COUNT(*), 0), 1) AS taux_acceptation
FROM financements
GROUP BY organisme
ORDER BY total_dossiers DESC;
