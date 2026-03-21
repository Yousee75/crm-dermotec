-- ============================================================
-- CRM DERMOTEC — Migration initiale complète
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- EQUIPE
CREATE TABLE IF NOT EXISTS equipe (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prenom TEXT NOT NULL, nom TEXT NOT NULL, email TEXT UNIQUE NOT NULL, telephone TEXT,
  role TEXT NOT NULL DEFAULT 'commercial' CHECK (role IN ('admin','commercial','formatrice','assistante','manager')),
  specialites TEXT[] DEFAULT '{}', competences_formations TEXT[] DEFAULT '{}',
  objectif_mensuel INTEGER DEFAULT 0, avatar_color TEXT DEFAULT '#2EC6F3',
  cv_url TEXT, diplomes TEXT[], certifications TEXT[], taux_horaire NUMERIC(8,2),
  type_contrat TEXT, disponibilites JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FORMATIONS
CREATE TABLE IF NOT EXISTS formations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
  categorie TEXT NOT NULL CHECK (categorie IN ('Dermo-Esthétique','Dermo-Correctrice','Soins Visage','Laser & IPL','Soins Corps','Hygiène')),
  description TEXT, description_commerciale TEXT,
  prix_ht NUMERIC(10,2) NOT NULL, tva_rate NUMERIC(4,2) DEFAULT 20.00,
  duree_jours INTEGER NOT NULL, duree_heures INTEGER NOT NULL,
  prerequis TEXT, niveau TEXT DEFAULT 'debutant' CHECK (niveau IN ('debutant','intermediaire','confirme')),
  materiel_inclus BOOLEAN DEFAULT true, materiel_details TEXT, places_max INTEGER DEFAULT 6,
  programme_url TEXT, image_url TEXT, objectifs TEXT[], competences_acquises TEXT[],
  stripe_product_id TEXT, stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  civilite TEXT, prenom TEXT NOT NULL, nom TEXT, date_naissance DATE, nationalite TEXT,
  email TEXT, telephone TEXT, whatsapp TEXT, adresse JSONB DEFAULT '{}', photo_url TEXT,
  source TEXT DEFAULT 'formulaire' CHECK (source IN ('formulaire','whatsapp','telephone','instagram','facebook','google','bouche_a_oreille','partenariat','ancien_stagiaire','site_web','salon','autre')),
  sujet TEXT CHECK (sujet IN ('formation','financement','eshop','partenariat','modele','autre')),
  message TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, referrer_url TEXT,
  statut TEXT DEFAULT 'NOUVEAU' CHECK (statut IN ('NOUVEAU','CONTACTE','QUALIFIE','FINANCEMENT_EN_COURS','INSCRIT','EN_FORMATION','FORME','ALUMNI','PERDU','REPORTE','SPAM')),
  priorite TEXT DEFAULT 'NORMALE' CHECK (priorite IN ('URGENTE','HAUTE','NORMALE','BASSE')),
  score_chaud INTEGER DEFAULT 0 CHECK (score_chaud >= 0 AND score_chaud <= 100),
  statut_pro TEXT CHECK (statut_pro IN ('salariee','independante','auto_entrepreneur','demandeur_emploi','reconversion','etudiante','gerant_institut','autre')),
  experience_esthetique TEXT CHECK (experience_esthetique IN ('aucune','debutante','intermediaire','confirmee','experte')),
  experience_annees INTEGER, entreprise_nom TEXT, siret TEXT, code_ape TEXT,
  employeur_nom TEXT, employeur_siret TEXT, diplomes JSONB DEFAULT '[]', objectif_pro TEXT,
  formation_principale_id UUID REFERENCES formations(id),
  formations_interessees UUID[] DEFAULT '{}',
  commercial_assigne_id UUID REFERENCES equipe(id),
  date_premier_contact TIMESTAMPTZ, date_dernier_contact TIMESTAMPTZ, date_prochain_rappel TIMESTAMPTZ,
  resultat_dernier_contact TEXT, nb_contacts INTEGER DEFAULT 0,
  financement_souhaite BOOLEAN DEFAULT false, organisme_financement TEXT,
  nps_score INTEGER, avis_google_laisse BOOLEAN, temoignage TEXT,
  newsletter_inscrite BOOLEAN DEFAULT false, suivi_post_j30 TEXT, suivi_post_j90 TEXT,
  a_lance_activite BOOLEAN, parrain_id UUID REFERENCES leads(id),
  tags TEXT[] DEFAULT '{}', notes TEXT, ip_address TEXT, user_agent TEXT,
  data_sources JSONB DEFAULT '{}', metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  date_debut DATE NOT NULL, date_fin DATE NOT NULL,
  horaire_debut TIME DEFAULT '09:00', horaire_fin TIME DEFAULT '17:00',
  salle TEXT DEFAULT 'Salle 1', adresse TEXT DEFAULT '75 Boulevard Richard Lenoir, 75011 Paris',
  formatrice_id UUID REFERENCES equipe(id), formatrice_secondaire_id UUID REFERENCES equipe(id),
  places_max INTEGER DEFAULT 6, places_occupees INTEGER DEFAULT 0,
  modeles_necessaires INTEGER DEFAULT 0, modeles_inscrits INTEGER DEFAULT 0,
  statut TEXT DEFAULT 'PLANIFIEE' CHECK (statut IN ('BROUILLON','PLANIFIEE','CONFIRMEE','EN_COURS','TERMINEE','ANNULEE','REPORTEE')),
  ca_prevu NUMERIC(10,2) DEFAULT 0, ca_realise NUMERIC(10,2) DEFAULT 0,
  notes TEXT, materiel_prepare BOOLEAN DEFAULT false, supports_envoyes BOOLEAN DEFAULT false,
  convocations_envoyees BOOLEAN DEFAULT false, emargement_pret BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_dates CHECK (date_fin >= date_debut)
);

-- INSCRIPTIONS
CREATE TABLE IF NOT EXISTS inscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  montant_total NUMERIC(10,2) NOT NULL, montant_finance NUMERIC(10,2) DEFAULT 0,
  reste_a_charge NUMERIC(10,2) DEFAULT 0,
  mode_paiement TEXT CHECK (mode_paiement IN ('carte','virement','especes','financement','cheque','mixte')),
  paiement_statut TEXT DEFAULT 'EN_ATTENTE' CHECK (paiement_statut IN ('EN_ATTENTE','ACOMPTE','PARTIEL','PAYE','REMBOURSE','LITIGE')),
  stripe_payment_id TEXT, stripe_invoice_id TEXT,
  statut TEXT DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE','CONFIRMEE','EN_COURS','COMPLETEE','ANNULEE','REMBOURSEE','NO_SHOW')),
  presence_jour1 BOOLEAN, presence_jour2 BOOLEAN, presence_jour3 BOOLEAN,
  presence_jour4 BOOLEAN, presence_jour5 BOOLEAN, taux_presence NUMERIC(5,2),
  note_satisfaction INTEGER CHECK (note_satisfaction >= 1 AND note_satisfaction <= 5),
  commentaire_satisfaction TEXT, recommanderait BOOLEAN, points_forts TEXT, points_amelioration TEXT,
  certificat_genere BOOLEAN DEFAULT false, certificat_url TEXT, certificat_numero TEXT, date_certification TIMESTAMPTZ,
  convention_generee BOOLEAN DEFAULT false, convention_url TEXT, convention_signee BOOLEAN DEFAULT false,
  notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, session_id)
);

-- FINANCEMENTS
CREATE TABLE IF NOT EXISTS financements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  inscription_id UUID REFERENCES inscriptions(id),
  organisme TEXT NOT NULL CHECK (organisme IN ('OPCO_EP','AKTO','FAFCEA','FIFPL','FRANCE_TRAVAIL','CPF','AGEFIPH','MISSIONS_LOCALES','REGION','EMPLOYEUR','TRANSITIONS_PRO','AUTRE')),
  organisme_detail TEXT, numero_dossier TEXT,
  contact_nom TEXT, contact_email TEXT, contact_telephone TEXT,
  montant_demande NUMERIC(10,2), montant_accorde NUMERIC(10,2), montant_verse NUMERIC(10,2) DEFAULT 0,
  statut TEXT DEFAULT 'PREPARATION' CHECK (statut IN ('PREPARATION','DOCUMENTS_REQUIS','DOSSIER_COMPLET','SOUMIS','EN_EXAMEN','COMPLEMENT_DEMANDE','VALIDE','REFUSE','VERSE','CLOTURE')),
  date_soumission TIMESTAMPTZ, date_reponse TIMESTAMPTZ, date_versement TIMESTAMPTZ, date_limite TEXT,
  documents JSONB DEFAULT '[]', checklist JSONB DEFAULT '[]',
  motif_refus TEXT, notes TEXT, historique JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FACTURES
CREATE TABLE IF NOT EXISTS factures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_facture TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('devis','facture','avoir')),
  lead_id UUID REFERENCES leads(id), inscription_id UUID REFERENCES inscriptions(id),
  lignes JSONB NOT NULL DEFAULT '[]',
  sous_total_ht NUMERIC(10,2) NOT NULL, tva_taux NUMERIC(4,2) DEFAULT 20.00,
  montant_tva NUMERIC(10,2) DEFAULT 0, total_ttc NUMERIC(10,2) NOT NULL,
  exoneration_tva BOOLEAN DEFAULT false, mention_legale TEXT,
  conditions_paiement TEXT, date_echeance DATE,
  statut TEXT DEFAULT 'BROUILLON' CHECK (statut IN ('BROUILLON','ENVOYEE','PAYEE','EN_RETARD','ANNULEE','PARTIELLEMENT_PAYEE')),
  stripe_invoice_id TEXT, echeancier JSONB DEFAULT '[]',
  notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RAPPELS
CREATE TABLE IF NOT EXISTS rappels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE, session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES equipe(id),
  date_rappel TIMESTAMPTZ NOT NULL,
  type TEXT DEFAULT 'APPEL' CHECK (type IN ('APPEL','EMAIL','WHATSAPP','SMS','RDV','RELANCE','SUIVI','ADMIN')),
  statut TEXT DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE','FAIT','ANNULE','REPORTE','MANQUE')),
  priorite TEXT DEFAULT 'NORMALE' CHECK (priorite IN ('URGENTE','HAUTE','NORMALE','BASSE')),
  titre TEXT, description TEXT, resultat TEXT,
  recurrence TEXT CHECK (recurrence IN ('AUCUNE','QUOTIDIEN','HEBDO','MENSUEL')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITES
CREATE TABLE IF NOT EXISTS activites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('LEAD_CREE','LEAD_MAJ','STATUT_CHANGE','CONTACT','INSCRIPTION','FINANCEMENT','SESSION','PAIEMENT','DOCUMENT','EMAIL','RAPPEL','NOTE','EXPORT','SYSTEME')),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE, session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  inscription_id UUID REFERENCES inscriptions(id) ON DELETE SET NULL, user_id UUID REFERENCES equipe(id),
  description TEXT NOT NULL, ancien_statut TEXT, nouveau_statut TEXT, metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  inscription_id UUID REFERENCES inscriptions(id) ON DELETE SET NULL,
  financement_id UUID REFERENCES financements(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('convention','certificat','attestation','devis','facture','avoir','piece_identite','justificatif_domicile','kbis','attestation_employeur','attestation_pole_emploi','photo_avant','photo_apres','programme','emargement','consentement','autre')),
  filename TEXT NOT NULL, storage_path TEXT NOT NULL, file_size INTEGER, mime_type TEXT,
  description TEXT, uploaded_by UUID REFERENCES equipe(id), is_signed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMANDES
CREATE TABLE IF NOT EXISTS commandes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_email TEXT NOT NULL, client_nom TEXT, client_telephone TEXT,
  numero_commande TEXT UNIQUE, produits JSONB NOT NULL DEFAULT '[]',
  montant_ht NUMERIC(10,2) NOT NULL, montant_tva NUMERIC(10,2) DEFAULT 0,
  montant_ttc NUMERIC(10,2) NOT NULL, frais_port NUMERIC(10,2) DEFAULT 0,
  stripe_session_id TEXT, stripe_payment_intent TEXT,
  paiement_statut TEXT DEFAULT 'EN_ATTENTE' CHECK (paiement_statut IN ('EN_ATTENTE','PAYE','REMBOURSE','ECHOUE')),
  adresse_livraison JSONB, statut TEXT DEFAULT 'NOUVELLE' CHECK (statut IN ('NOUVELLE','PREPAREE','EXPEDIEE','LIVREE','RETOURNEE','ANNULEE')),
  tracking_number TEXT, transporteur TEXT, date_expedition TIMESTAMPTZ, date_livraison TIMESTAMPTZ,
  notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODELES
CREATE TABLE IF NOT EXISTS modeles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL, nom TEXT, email TEXT, telephone TEXT, age INTEGER,
  prestation_souhaitee TEXT, zone TEXT, contre_indications TEXT,
  statut TEXT DEFAULT 'INSCRIT' CHECK (statut IN ('INSCRIT','CONFIRME','PRESENT','ABSENT','ANNULE')),
  photo_avant_url TEXT, photo_apres_url TEXT, consentement_signe BOOLEAN DEFAULT false,
  notes TEXT, satisfaction INTEGER CHECK (satisfaction >= 1 AND satisfaction <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTES LEAD
CREATE TABLE IF NOT EXISTS notes_lead (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES equipe(id),
  contenu TEXT NOT NULL,
  type TEXT DEFAULT 'note' CHECK (type IN ('note','appel','email','whatsapp','reunion','interne')),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, sujet TEXT NOT NULL,
  contenu_html TEXT NOT NULL, contenu_text TEXT, variables TEXT[] DEFAULT '{}',
  categorie TEXT CHECK (categorie IN ('confirmation','relance','financement','rappel','certificat','bienvenue','eshop','convocation','satisfaction','autre')),
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUALITE (Qualiopi)
CREATE TABLE IF NOT EXISTS qualite (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('reclamation','action_corrective','amelioration','non_conformite')),
  titre TEXT NOT NULL, description TEXT NOT NULL,
  statut TEXT DEFAULT 'OUVERTE' CHECK (statut IN ('OUVERTE','EN_COURS','RESOLUE','CLOTUREE')),
  priorite TEXT DEFAULT 'NORMALE' CHECK (priorite IN ('HAUTE','NORMALE','BASSE')),
  indicateur_qualiopi TEXT, critere_qualiopi INTEGER,
  actions_menees TEXT, date_resolution TIMESTAMPTZ,
  lead_id UUID REFERENCES leads(id), session_id UUID REFERENCES sessions(id),
  responsable_id UUID REFERENCES equipe(id),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PARTENAIRES
CREATE TABLE IF NOT EXISTS partenaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL, type TEXT CHECK (type IN ('institut','fournisseur','ecole','prescripteur','autre')),
  contact_nom TEXT, contact_email TEXT, contact_telephone TEXT, adresse TEXT,
  commission_taux NUMERIC(5,2), leads_envoyes INTEGER DEFAULT 0, leads_convertis INTEGER DEFAULT 0,
  ca_genere NUMERIC(10,2) DEFAULT 0, notes TEXT, is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CADENCES
CREATE TABLE IF NOT EXISTS cadence_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL, description TEXT, etapes JSONB NOT NULL DEFAULT '[]',
  declencheur TEXT CHECK (declencheur IN ('nouveau_lead','post_formation','relance_financement','abandon','alumni','custom')),
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cadence_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES cadence_templates(id),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  etape_actuelle INTEGER DEFAULT 0,
  statut TEXT DEFAULT 'ACTIVE' CHECK (statut IN ('ACTIVE','PAUSE','COMPLETEE','ANNULEE')),
  prochaine_action TIMESTAMPTZ, historique JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_leads_statut ON leads(statut);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_commercial ON leads(commercial_assigne_id);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_score ON leads(score_chaud DESC);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_sessions_date ON sessions(date_debut);
CREATE INDEX idx_sessions_formation ON sessions(formation_id);
CREATE INDEX idx_sessions_statut ON sessions(statut);
CREATE INDEX idx_inscriptions_lead ON inscriptions(lead_id);
CREATE INDEX idx_inscriptions_session ON inscriptions(session_id);
CREATE INDEX idx_financements_lead ON financements(lead_id);
CREATE INDEX idx_financements_statut ON financements(statut);
CREATE INDEX idx_rappels_date ON rappels(date_rappel);
CREATE INDEX idx_rappels_lead ON rappels(lead_id);
CREATE INDEX idx_rappels_statut ON rappels(statut);
CREATE INDEX idx_activites_lead ON activites(lead_id);
CREATE INDEX idx_activites_created ON activites(created_at DESC);
CREATE INDEX idx_factures_lead ON factures(lead_id);
CREATE INDEX idx_factures_statut ON factures(statut);
CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_documents_lead ON documents(lead_id);
CREATE INDEX idx_qualite_statut ON qualite(statut);

-- TRIGGERS updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER tr_leads_updated BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_equipe_updated BEFORE UPDATE ON equipe FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_formations_updated BEFORE UPDATE ON formations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_sessions_updated BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_inscriptions_updated BEFORE UPDATE ON inscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_financements_updated BEFORE UPDATE ON financements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_rappels_updated BEFORE UPDATE ON rappels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_commandes_updated BEFORE UPDATE ON commandes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_factures_updated BEFORE UPDATE ON factures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_qualite_updated BEFORE UPDATE ON qualite FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financements ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE rappels ENABLE ROW LEVEL SECURITY;
ALTER TABLE activites ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE modeles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualite ENABLE ROW LEVEL SECURITY;
ALTER TABLE partenaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_instances ENABLE ROW LEVEL SECURITY;

-- Policies (authenticated = full access)
DO $$ DECLARE t TEXT; BEGIN
  FOR t IN SELECT unnest(ARRAY['leads','formations','sessions','inscriptions','financements','factures','rappels','activites','documents','commandes','equipe','modeles','notes_lead','email_templates','qualite','partenaires','cadence_templates','cadence_instances'])
  LOOP EXECUTE format('CREATE POLICY "auth_full_%s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t); END LOOP;
END $$;

-- Anon (webhook formulaire + catalogue formations public)
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_read_formations" ON formations FOR SELECT TO anon USING (is_active = true);

-- SEED: formations catalogue
INSERT INTO formations (nom, slug, categorie, prix_ht, duree_jours, duree_heures, niveau, description_commerciale, stripe_product_id, stripe_price_id) VALUES
  ('Hygiène et Salubrité', 'hygiene-salubrite', 'Hygiène', 400, 3, 21, 'debutant', 'Le prérequis légal pour exercer — indispensable, rapide, finançable.', 'prod_UBawX8eqtAYIGo', 'price_1TDDlL1NzDARltfqneosmYXJ'),
  ('Maquillage Permanent Complet', 'maquillage-permanent', 'Dermo-Esthétique', 2490, 5, 35, 'debutant', 'Maîtrisez les 3 techniques les plus demandées en 5 jours — ROI garanti.', 'prod_UBaoCLilz28Yi9', 'price_1TDDlH1NzDARltfqUFX26hfu'),
  ('Microblading / Microshading', 'microblading', 'Dermo-Esthétique', 1400, 2, 14, 'debutant', 'La prestation la plus rentable en institut : 200€ la séance, demande explosive.', 'prod_UBawyrZGEbleL3', 'price_1TDDlI1NzDARltfqCs4Rmqej'),
  ('Full Lips', 'full-lips', 'Dermo-Esthétique', 1400, 2, 14, 'debutant', 'Maîtrisez la pigmentation lèvres — 300€ par séance, tendance 2025.', 'prod_UBawytFLQFZYcB', 'price_1TDDlJ1NzDARltfqNqK5Ck2W'),
  ('Tricopigmentation HFS', 'tricopigmentation', 'Dermo-Esthétique', 2500, 3, 21, 'intermediaire', 'Marché calvitie : 500-800€ par séance, clientèle masculine fidèle.', 'prod_UBawuEyPuxsCh2', 'price_1TDDlK1NzDARltfqqCVzNt54'),
  ('Aréole Mammaire & Cicatrices', 'areole-cicatrices', 'Dermo-Correctrice', 2300, 3, 21, 'intermediaire', 'Dermopigmentation réparatrice — mission humaine, revenus élevés.', 'prod_UBawetNkaGspEk', 'price_1TDDlM1NzDARltfqml70JAqM'),
  ('Nanoneedling & BB Glow', 'nanoneedling', 'Soins Visage', 700, 1, 7, 'debutant', 'Soin anti-âge 80-120€ — technique simple, résultats immédiats.', 'prod_UBaxFMWfyzC43A', 'price_1TDDlN1NzDARltfqJ9n4rRNh'),
  ('Soin Visage ALLin1', 'soin-allin1', 'Soins Visage', 900, 1, 7, 'debutant', 'Soin phare institut 90-150€ — différenciez-vous de la concurrence.', 'prod_UBaxWWZLCe3LBK', 'price_1TDDlO1NzDARltfqVQaimo64'),
  ('Peeling Chimique & Dermaplaning', 'peeling-dermaplaning', 'Soins Visage', 990, 1, 7, 'debutant', 'Peeling + dermaplaning 120-200€ — transformez tous types de peau.', 'prod_UBaxHt3bGu5Y2E', 'price_1TDDlP1NzDARltfqFa3PdKO1'),
  ('Détatouage & Carbon Peel', 'detatouage', 'Laser & IPL', 990, 1, 7, 'intermediaire', 'Détatouage laser + carbon peel — marché en pleine croissance.', 'prod_UBax5qM7Cv6XY5', 'price_1TDDlQ1NzDARltfqVbfe41tq'),
  ('Épilation Définitive', 'epilation-definitive', 'Laser & IPL', 990, 1, 7, 'debutant', 'Épilation laser — la prestation la plus demandée en institut.', 'prod_UBaxmCxBsvjuVv', 'price_1TDDlQ1NzDARltfqbr3i446V')
ON CONFLICT (slug) DO NOTHING;

-- SEED: cadence templates
INSERT INTO cadence_templates (nom, description, declencheur, etapes) VALUES
  ('Nouveau Lead', 'Séquence pour les nouveaux leads formulaire', 'nouveau_lead', '[
    {"jour": 0, "type": "APPEL", "titre": "Appel de qualification", "moment": "MATIN"},
    {"jour": 1, "type": "EMAIL", "titre": "Email de bienvenue + programme", "moment": "MATIN"},
    {"jour": 3, "type": "WHATSAPP", "titre": "Relance WhatsApp", "moment": "APREM"},
    {"jour": 7, "type": "APPEL", "titre": "Relance téléphonique", "moment": "MATIN"},
    {"jour": 14, "type": "EMAIL", "titre": "Dernière relance + offre", "moment": "MATIN"}
  ]'),
  ('Post-Formation Alumni', 'Suivi après formation pour fidélisation', 'post_formation', '[
    {"jour": 1, "type": "EMAIL", "titre": "Remerciement + lien avis Google", "moment": "MATIN"},
    {"jour": 7, "type": "WHATSAPP", "titre": "Comment ça se passe ?", "moment": "APREM"},
    {"jour": 30, "type": "APPEL", "titre": "Suivi J+30 — installation ?", "moment": "MATIN"},
    {"jour": 90, "type": "EMAIL", "titre": "Suivi J+90 — upsell formation complémentaire", "moment": "MATIN"}
  ]'),
  ('Relance Financement', 'Suivi des dossiers de financement en cours', 'relance_financement', '[
    {"jour": 0, "type": "EMAIL", "titre": "Checklist documents à fournir", "moment": "MATIN"},
    {"jour": 3, "type": "APPEL", "titre": "Point dossier — documents manquants ?", "moment": "APREM"},
    {"jour": 7, "type": "EMAIL", "titre": "Relance documents", "moment": "MATIN"},
    {"jour": 14, "type": "APPEL", "titre": "Statut dossier OPCO", "moment": "MATIN"},
    {"jour": 30, "type": "APPEL", "titre": "Suivi accord/refus", "moment": "MATIN"}
  ]')
ON CONFLICT DO NOTHING;

-- SEED: email templates
INSERT INTO email_templates (nom, slug, sujet, contenu_html, variables, categorie) VALUES
  ('Bienvenue', 'bienvenue', 'Bienvenue chez Dermotec, {{prenom}} !', '<h1>Bienvenue {{prenom}} !</h1><p>Merci pour votre intérêt. Notre équipe vous contactera sous 24h.</p>', '{prenom,formation_nom}', 'bienvenue'),
  ('Confirmation inscription', 'confirmation-inscription', 'Inscription confirmée — {{formation_nom}}', '<h1>Inscription confirmée !</h1><p>{{prenom}}, votre inscription à la formation {{formation_nom}} est confirmée.</p><p>Dates : {{dates}}</p>', '{prenom,formation_nom,dates,lieu}', 'confirmation'),
  ('Convocation J-7', 'convocation-j7', 'Votre formation dans 7 jours — {{formation_nom}}', '<h1>Plus que 7 jours !</h1><p>{{prenom}}, votre formation {{formation_nom}} commence le {{date_debut}}.</p><p>Lieu : 75 Bd Richard Lenoir, 75011 Paris</p>', '{prenom,formation_nom,date_debut}', 'convocation'),
  ('Satisfaction post-formation', 'satisfaction', 'Votre avis compte — {{formation_nom}}', '<h1>Comment s''est passée votre formation ?</h1><p>{{prenom}}, nous aimerions connaître votre avis sur {{formation_nom}}.</p>', '{prenom,formation_nom,lien_evaluation}', 'satisfaction')
ON CONFLICT (slug) DO NOTHING;
