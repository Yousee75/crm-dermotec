-- ============================================================
-- Migration 007 : Knowledge Base pour Agent IA Commercial
-- Base de connaissances interne — pas d'internet, que du data maison
-- ============================================================

-- Table principale
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie TEXT NOT NULL CHECK (categorie IN (
    'script_vente',      -- Scripts de vente par étape du pipeline
    'fiche_formation',   -- Détails enrichis par formation
    'objection',         -- Objections fréquentes + réponses
    'financement',       -- Process par organisme
    'process',           -- Procédures internes
    'faq',               -- Questions fréquentes prospects
    'temoignage',        -- Témoignages et success stories
    'argument_cle'       -- Arguments de vente par cible
  )),
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  formation_slug TEXT,        -- Lié à une formation spécifique (optionnel)
  statut_pro_cible TEXT,      -- Cible un statut pro spécifique (optionnel)
  etape_pipeline TEXT,        -- Lié à une étape du pipeline (optionnel)
  priorite INTEGER DEFAULT 0, -- 0=normal, 1=important, 2=critique
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_kb_categorie ON knowledge_base(categorie) WHERE is_active = true;
CREATE INDEX idx_kb_formation ON knowledge_base(formation_slug) WHERE formation_slug IS NOT NULL AND is_active = true;
CREATE INDEX idx_kb_tags ON knowledge_base USING GIN(tags) WHERE is_active = true;
CREATE INDEX idx_kb_etape ON knowledge_base(etape_pipeline) WHERE etape_pipeline IS NOT NULL AND is_active = true;

-- Full-text search sur contenu
ALTER TABLE knowledge_base ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(titre, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(contenu, '')), 'B')
  ) STORED;
CREATE INDEX idx_kb_fts ON knowledge_base USING GIN(fts);

-- RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read knowledge_base"
  ON knowledge_base FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage knowledge_base"
  ON knowledge_base FOR ALL TO authenticated USING (true);

-- Trigger updated_at
CREATE TRIGGER set_kb_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED : Base de connaissances initiale Dermotec
-- ============================================================

-- === SCRIPTS DE VENTE ===

INSERT INTO knowledge_base (categorie, titre, contenu, etape_pipeline, priorite) VALUES
('script_vente', 'Premier appel — Script qualification', E'OBJECTIF : qualifier le lead en 5 minutes max.\n\n1. ACCROCHE (30s)\n"Bonjour [prénom], c''est [commercial] de Dermotec Advanced. Vous nous avez contactés pour [formation/sujet]. C''est bien ça ?"\n\n2. DÉCOUVERTE (2min)\n- "Vous êtes actuellement [salariée/indépendante/en reconversion] ?" → détermine le financement\n- "Vous avez déjà de l''expérience en esthétique ?" → détermine le niveau\n- "Qu''est-ce qui vous attire dans cette formation ?" → comprendre la motivation\n- "Vous avez une idée de quand vous aimeriez commencer ?" → détecter l''urgence\n\n3. PITCH PERSONNALISÉ (1min)\n- Si salariée : "Bonne nouvelle, votre employeur peut financer 100% via OPCO. On s''occupe de tout le dossier."\n- Si reconversion : "France Travail prend souvent en charge à 100%. On vous accompagne gratuitement."\n- Si indépendante : "Vous cotisez au FAFCEA/FIFPL qui rembourse une grande partie."\n\n4. CLOSE (1min)\n"Est-ce que vous seriez disponible [mardi/jeudi] pour qu''on regarde ensemble les prochaines sessions et le financement ?"\n\nRÈGLES :\n- JAMAIS parler du prix en premier → toujours le financement d''abord\n- Noter TOUT dans le CRM immédiatement\n- Si pas de réponse → WhatsApp dans les 2h\n- Le prospect doit raccrocher en sachant : (1) c''est finançable (2) c''est court (3) y''a des places bientôt', 'NOUVEAU', 2),

('script_vente', 'Relance J+3 — Script réchauffage', E'OBJECTIF : réactiver un lead contacté mais pas qualifié.\n\n"Bonjour [prénom], c''est [commercial] de Dermotec. On s''est parlé [lundi/la semaine dernière] à propos de [formation].\nJe voulais savoir si vous aviez eu le temps d''y réfléchir ?\n\nSi hésitation : "Je comprends, c''est une décision importante. Ce que je peux vous dire c''est que nos prochaines sessions se remplissent vite et qu''on peut vous réserver une place sans engagement le temps qu''on regarde ensemble le financement."\n\nSi objection prix : → voir fiche objection "C''est trop cher"\nSi objection temps : → "La formation dure [X] jours seulement. Et vous repartez opérationnelle."\nSi pas de réponse : → laisser vocal WhatsApp 30s max + SMS le lendemain', 'CONTACTE', 1),

('script_vente', 'Closing financement — Script inscription', E'OBJECTIF : transformer un lead QUALIFIÉ en INSCRIT.\n\nQuand le financement est en cours ou validé :\n"[Prénom], j''ai une super nouvelle ! Votre dossier [OPCO/France Travail/CPF] est [en bonne voie/validé].\nLa prochaine session de [formation] est le [date] — il reste [X] places.\nJe vous réserve votre place ?\n\nDocuments à envoyer :\n- Convention de formation (générée par le CRM)\n- Programme détaillé\n- Convocation 7 jours avant\n\nSi le financement couvre 100% : "Vous n''avez RIEN à avancer. Le financement couvre l''intégralité."\nSi reste à charge : "Il reste [montant] à votre charge. Vous pouvez régler en [1/2/3] fois par carte."', 'FINANCEMENT_EN_COURS', 2);

-- === OBJECTIONS FRÉQUENTES ===

INSERT INTO knowledge_base (categorie, titre, contenu, tags, priorite) VALUES
('objection', 'C''est trop cher', E'OBJECTION : "C''est trop cher" / "Je n''ai pas le budget"\n\nRÉPONSE COURTE :\n"Je comprends, c''est un investissement. Mais saviez-vous que 80% de nos stagiaires ne paient RIEN grâce au financement ? Votre [OPCO/France Travail/FAFCEA] peut prendre en charge 100%."\n\nDÉVELOPPEMENT :\n1. RECADRER : "Ce n''est pas une dépense, c''est un investissement. Avec le microblading à 200€ la séance et 15 clientes/mois, vous générez 3 000€/mois."\n2. FINANCEMENT : "On s''occupe de tout le dossier. Vous n''avez qu''à fournir [2-3 documents]. En moyenne, le financement est validé en 15-20 jours."\n3. PREUVE SOCIALE : "Sarah, qui était dans la même situation que vous, a lancé son activité 2 semaines après la formation. Elle fait aujourd''hui [X]€/mois."\n4. FACILITÉ : "Et si le financement ne couvre pas tout, on propose le paiement en 3 fois sans frais."\n\nQUESTIONS REBOND :\n- "Si le financement couvrait tout, vous seriez partante ?"\n- "Quel budget vous aviez en tête ?"\n- "Vous êtes [salariée/indépendante] ? Parce que dans votre cas..."', ARRAY['prix', 'budget', 'cher', 'argent'], 2),

('objection', 'Je dois réfléchir / En parler à mon conjoint', E'OBJECTION : "Je dois réfléchir" / "Je dois en parler à mon conjoint"\n\nRÉPONSE COURTE :\n"Bien sûr, c''est normal de prendre le temps. Qu''est-ce qui vous ferait hésiter exactement ? Comme ça je peux vous donner les infos précises pour en discuter."\n\nDÉVELOPPEMENT :\n1. IDENTIFIER LE VRAI FREIN : "Réfléchir" = souvent un autre frein caché (prix, peur, timing)\n2. FACILITER : "Je peux vous envoyer un récap par WhatsApp avec tous les détails — comme ça vous avez tout sous les yeux pour en discuter."\n3. URGENCE DOUCE : "Les prochaines sessions se remplissent en 2-3 semaines. Je peux vous réserver une place sans engagement pendant 48h."\n4. RENDEZ-VOUS : "On peut se rappeler [jour] ? Comme ça si vous avez des questions d''ici là, on en discute."\n\nNE JAMAIS :\n- Forcer la main\n- Être insistant\n- Dénigrer le conjoint\n\nTOUJOURS :\n- Créer un prochain rendez-vous concret (date + heure)\n- Envoyer un récap WhatsApp dans l''heure', ARRAY['reflexion', 'conjoint', 'hesitation', 'temps'], 2),

('objection', 'J''ai peur de ne pas y arriver', E'OBJECTION : "J''ai peur de ne pas y arriver" / "Je suis débutante"\n\nRÉPONSE COURTE :\n"C''est exactement pour ça qu''on est là ! 90% de nos stagiaires démarrent de zéro. Nos formations sont conçues pour les débutantes, avec de la pratique sur modèles dès le premier jour."\n\nDÉVELOPPEMENT :\n1. NORMALISER : "Toutes nos stagiaires ont eu cette appréhension. C''est signe que vous prenez ça au sérieux."\n2. MÉTHODE : "On travaille en petits groupes (4-6 max), avec une formatrice pour vous. Vous pratiquez sur de vrais modèles, pas juste de la théorie."\n3. SUIVI : "Après la formation, on ne vous lâche pas. Vous avez accès au groupe WhatsApp alumni, et on fait un suivi à 30 et 90 jours."\n4. PREUVE : "Regardez [montrer photos avant/après de stagiaires débutantes]. Elles aussi avaient peur, et regardez le résultat en 2 jours !"\n\nATOUT : Le certificat Dermotec + Qualiopi rassure les futures clientes.', ARRAY['peur', 'debutante', 'niveau', 'competence'], 1),

('objection', 'Il y a moins cher ailleurs', E'OBJECTION : "J''ai trouvé moins cher ailleurs"\n\nRÉPONSE COURTE :\n"C''est possible ! Mais attention : est-ce que cette formation est certifiée Qualiopi ? Sans Qualiopi, pas de financement OPCO ni France Travail. Et le ''moins cher'' peut devenir le plus cher si vous payez de votre poche."\n\nDÉVELOPPEMENT :\n1. QUALIOPI : "Chez Dermotec, Qualiopi = éligible à TOUS les financements. C''est la première question à poser."\n2. CONTENU : "On inclut : pratique sur modèles réels (pas que des têtes en silicone), matériel NPM professionnel, support post-formation."\n3. ROI : "Nos stagiaires facturent en moyenne [X]€/séance dès la sortie. L''investissement est rentabilisé en [Y] semaines."\n4. RISQUE : "Une formation low-cost sans pratique réelle = des clientes insatisfaites = pas de bouche-à-oreille = pas de business."\n\nNE JAMAIS :\n- Dénigrer un concurrent nommément\n- Dire que les autres sont mauvais\n\nTOUJOURS :\n- Comparer sur des critères objectifs (Qualiopi, pratique, suivi, matériel)', ARRAY['concurrent', 'prix', 'comparaison', 'moins_cher'], 1);

-- === FICHES FORMATIONS ENRICHIES ===

INSERT INTO knowledge_base (categorie, titre, contenu, formation_slug, tags, priorite) VALUES
('fiche_formation', 'Maquillage Permanent Complet — Argumentaire', E'FORMATION PHARE : Maquillage Permanent Complet\nPrix : 2 490€ HT (2 990€ TTC) — 5 jours / 35h\n\nARGUMENTS DE VENTE :\n1. COMPLÉTUDE : Seule formation qui couvre les 3 techniques (sourcils, lèvres, eye-liner) en un seul bloc.\n2. ROI : 250€/séance moyenne × 12 séances/mois = 3 000€/mois de CA additionnel.\n3. DEMANDE : Le maquillage permanent est la prestation esthétique avec la plus forte croissance (+20%/an).\n4. FINANCEMENT : 100% finançable OPCO/France Travail. Reste à charge = 0€ pour 80% des stagiaires.\n\nPOUR QUI :\n- Esthéticienne qui veut diversifier (le MP rapporte 3x plus qu''un soin classique)\n- Reconversion qui veut une activité rentable rapidement\n- Gérante d''institut qui veut proposer le MP à ses clientes\n\nOBJECTIONS SPÉCIFIQUES :\n- "5 jours c''est court" → "5 jours de formation intensive avec pratique sur modèles. Vous repartez opérationnelle. Et vous avez le suivi post-formation."\n- "Je veux commencer par les sourcils seuls" → "Le pack complet est plus rentable : 3 techniques au prix de 2. Et le marché demande les 3."', 'maquillage-permanent', ARRAY['mp', 'sourcils', 'levres', 'eyeliner', 'phare'], 2),

('fiche_formation', 'Microblading — Argumentaire', E'FORMATION STAR : Microblading / Microshading\nPrix : 1 400€ HT (1 680€ TTC) — 2 jours / 14h\n\nARGUMENTS DE VENTE :\n1. RENTABILITÉ MAX : 200€/séance × 15 clientes/mois = 3 000€/mois. Formation rentabilisée en 1 semaine d''activité.\n2. RAPIDITÉ : 2 jours de formation. Opérationnelle le lundi suivant.\n3. TENDANCE : Le microblading est LA prestation la plus demandée en institut. File d''attente de 2-3 semaines chez les pros.\n4. TECHNIQUE DOUCE : Pas de machine, poil par poil. Les clientes adorent le naturel.\n\nPOUR QUI :\n- Débutante absolue (notre formation n°1 en reconversion)\n- Esthéticienne qui veut ajouter une prestation premium\n\nCOUPLAGE RECOMMANDÉ :\n- Microblading + Full Lips = pack sourcils + lèvres = 2 800€ HT (offrir -5% si les 2)\n- + Nanoneedling = triptyque gagnant pour lancer un institut', 'microblading', ARRAY['microblading', 'sourcils', 'rentable', 'star'], 2),

('fiche_formation', 'Hygiène et Salubrité — Argumentaire', E'FORMATION OBLIGATOIRE : Hygiène et Salubrité\nPrix : 400€ HT (480€ TTC) — 3 jours / 21h\n\nARGUMENTS DE VENTE :\n1. OBLIGATION LÉGALE : Décret n°2008-149. Sans cette formation, vous ne pouvez PAS exercer légalement la dermopigmentation.\n2. PRIX ACCESSIBLE : 400€ HT, finançable à 100%. C''est le ticket d''entrée le moins cher de la profession.\n3. PORTE D''ENTRÉE : Souvent le premier contact avec Dermotec → upsell vers microblading/MP ensuite.\n\nSTRATÉGIE COMMERCIALE :\n- Toujours proposer hygiène EN PREMIER si le lead n''a pas encore la certification\n- "Avant de vous inscrire en microblading, assurons-nous que vous avez l''hygiène. C''est obligatoire et on peut le faire financer ensemble."\n- Packager : Hygiène + Microblading = parcours complet débutante\n\nOBJECTION :\n- "Je l''ai déjà fait ailleurs" → "Parfait ! Vous avez votre attestation ? Si oui, on passe directement à la formation technique."', 'hygiene-salubrite', ARRAY['hygiene', 'obligatoire', 'legal', 'entree'], 1);

-- === PROCESS FINANCEMENT ===

INSERT INTO knowledge_base (categorie, titre, contenu, tags, statut_pro_cible, priorite) VALUES
('financement', 'OPCO EP — Process complet', E'ORGANISME : OPCO EP (Opérateurs de compétences des Entreprises de Proximité)\n\nÉLIGIBILITÉ : Salariées d''entreprises < 50 salariés (instituts, spas, centres esthétiques)\n\nTAUX DE PRISE EN CHARGE : 100% (jusqu''à 3 500€/an/salarié en moyenne)\n\nDÉLAI MOYEN : 15-25 jours ouvrés\n\nDOCUMENTS REQUIS :\n1. Bulletin de paie (3 derniers mois)\n2. Attestation employeur (modèle Dermotec)\n3. Programme de formation (fourni par Dermotec)\n4. Convention de formation signée (générée par le CRM)\n5. Devis (généré par le CRM)\n\nPROCESS :\n1. Vérifier que l''entreprise cotise à OPCO EP (demander le code NAF : 9602A/B = esthétique)\n2. Remplir le formulaire de demande sur moncompte.opcoep.fr\n3. Joindre tous les documents\n4. Suivi : relancer à J+10 si pas de retour\n5. Accord → convention tripartite → inscription confirmée\n\nASTPCE COMMERCIAL :\n"Votre employeur n''a RIEN à payer. C''est l''OPCO qui finance directement. Beaucoup d''employeurs ne savent pas qu''ils ont ce budget — c''est une opportunité pour vous ET pour lui."', ARRAY['opco', 'salariee', 'employeur'], 'salariee', 2),

('financement', 'France Travail (ex Pôle Emploi) — Process AIF', E'ORGANISME : France Travail — Aide Individuelle à la Formation (AIF)\n\nÉLIGIBILITÉ : Demandeur d''emploi inscrit à France Travail\n\nTAUX DE PRISE EN CHARGE : 100% (plafond variable selon région, généralement 3 000-5 000€)\n\nDÉLAI MOYEN : 20-30 jours ouvrés\n\nDOCUMENTS REQUIS :\n1. Attestation d''inscription France Travail\n2. CV à jour\n3. Lettre de motivation (modèle Dermotec)\n4. Devis Dermotec\n5. Programme de formation\n\nPROCESS :\n1. Le demandeur informe son conseiller France Travail de son projet\n2. Dermotec envoie le devis + programme via Kairos (plateforme France Travail)\n3. Le conseiller valide (ou demande un complément)\n4. Accord → inscription confirmée\n5. Le stagiaire conserve ses allocations pendant la formation\n\nASTUCE COMMERCIAL :\n"Non seulement c''est financé à 100%, mais en plus vous gardez vos allocations chômage pendant la formation. C''est le meilleur moment pour se former !"\n\nPOINT IMPORTANT : Toujours faire le devis 21 jours AVANT la date de session pour laisser le temps au conseiller.', ARRAY['france_travail', 'pole_emploi', 'aif', 'chomage'], 'demandeur_emploi', 2),

('financement', 'CPF — Compte Personnel de Formation', E'ORGANISME : CPF (moncompteformation.gouv.fr)\n\nÉLIGIBILITÉ : Toute personne ayant travaillé (solde cumulé sur le compte)\n\nTAUX DE PRISE EN CHARGE : Variable (solde moyen 2 000-3 000€, reste à charge 100€ obligatoire depuis 2024)\n\nDÉLAI : 11 jours ouvrés minimum (délai de rétractation légal)\n\nIMPORTANT 2024-2025 :\n- Reste à charge obligatoire de 100€ depuis mai 2024 (sauf demandeurs d''emploi)\n- Dermotec doit être référencé sur la plateforme\n- Attention fraude : JAMAIS démarcher par téléphone pour le CPF (interdit par la loi)\n\nSTRATÉGIE :\n- Le CPF est un complément, rarement suffisant seul pour les formations > 1 500€\n- Coupler CPF + OPCO ou CPF + employeur pour couvrir 100%\n- "Vous avez vérifié votre solde CPF ? Avec [montant] sur votre compte + un complément [OPCO/employeur], on arrive à 0€ de reste à charge."', ARRAY['cpf', 'moncompteformation', 'universel'], NULL, 1);

-- === ARGUMENTS PAR CIBLE ===

INSERT INTO knowledge_base (categorie, titre, contenu, statut_pro_cible, tags, priorite) VALUES
('argument_cle', 'Arguments pour reconversion professionnelle', E'CIBLE : Femme en reconversion (30-45 ans, ex-salariée ou en poste qui veut changer)\n\nMOTIVATIONS :\n- Envie de sens / passion\n- Indépendance (être sa propre patronne)\n- Meilleur équilibre vie pro/perso\n- Revenus potentiellement supérieurs\n\nFREINS :\n- Peur de l''inconnu\n- Pression financière (enfants, crédit)\n- Regard des autres\n- "C''est trop tard"\n\nARGUMENTS :\n1. FINANCEMENT : "Transitions Pro ou France Travail financent à 100%. Vous ne risquez RIEN financièrement."\n2. DURÉE : "En 2-5 jours, vous avez une nouvelle compétence monétisable. Pas besoin de 3 ans d''études."\n3. DEMANDE : "Le marché recrute. Les esthéticiennes spécialisées en dermopigmentation ont une file d''attente de clients."\n4. FLEXIBILITÉ : "Vous pouvez exercer à domicile, en institut, ou en micro-entreprise. Vous choisissez vos horaires."\n5. COMMUNAUTÉ : "Vous rejoignez notre réseau de 250+ anciennes stagiaires qui s''entraident."\n\nPHRASE CLÉ :\n"Ce n''est pas trop tard, c''est exactement le bon moment. Le marché n''a jamais autant demandé de professionnelles qualifiées."', 'reconversion', ARRAY['reconversion', 'changement', 'transition'], 2),

('argument_cle', 'Arguments pour gérante d''institut', E'CIBLE : Gérante d''institut de beauté qui veut diversifier\n\nMOTIVATIONS :\n- Augmenter le CA de l''institut\n- Se différencier de la concurrence\n- Rentabiliser le temps entre les clientes\n- Former son équipe\n\nARGUMENTS :\n1. MARGE : "Le maquillage permanent a la meilleure marge de l''institut : 250€/séance, 30min de temps, quasi aucun consommable."\n2. FIDÉLISATION : "Une cliente MP revient pour les retouches + achète d''autres soins. C''est un produit d''appel premium."\n3. FINANCEMENT : "OPCO EP finance 100% pour vos salariées. Vous pouvez former toute votre équipe sans rien débourser."\n4. PLANNING : "Formations de 1-5 jours, le week-end c''est possible sur demande. Minimum d''impact sur votre activité."\n\nSTRATÉGIE :\n- Proposer de former la gérante + 1-2 salariées (volume = discount possible)\n- Montrer le CA additionnel : "3 séances MP/semaine × 250€ × 4 semaines = 3 000€/mois de CA en plus"', 'gerant_institut', ARRAY['institut', 'gerante', 'diversification', 'equipe'], 1);

-- === TÉMOIGNAGES / SUCCESS STORIES ===

INSERT INTO knowledge_base (categorie, titre, contenu, formation_slug, tags) VALUES
('temoignage', 'Sarah — Reconversion réussie microblading', E'PROFIL : Sarah, 34 ans, ex-assistante de direction\nFORMATION : Microblading (2 jours)\nFINANCEMENT : France Travail 100%\n\nHISTOIRE :\n"J''ai toujours été passionnée par l''esthétique mais je n''osais pas me lancer. Quand j''ai appris que France Travail finançait à 100%, j''ai sauté le pas. 2 jours de formation chez Dermotec, avec de la pratique sur de vraies modèles dès le premier jour. 3 semaines après, j''avais mes premières clientes grâce au bouche-à-oreille."\n\nRÉSULTAT : 2 500€/mois de CA en micro-entreprise après 3 mois. File d''attente de 3 semaines.\n\nUTILISER QUAND :\n- Lead en reconversion qui hésite\n- Objection "j''ai peur de ne pas y arriver"\n- Argument ROI concret', 'microblading', ARRAY['temoignage', 'reconversion', 'succes']),

('temoignage', 'Amina — Gérante qui a diversifié', E'PROFIL : Amina, 41 ans, gérante institut beauté Paris 19e\nFORMATION : Maquillage Permanent Complet (5 jours)\nFINANCEMENT : OPCO EP 100%\n\nHISTOIRE :\n"Mon institut marchait bien mais les marges étaient serrées. Depuis que je propose le maquillage permanent, c''est ma prestation la plus rentable. 4 séances par semaine, 250€ pièce. Et les clientes reviennent pour les retouches."\n\nRÉSULTAT : +4 000€/mois de CA additionnel. ROI de la formation atteint en 2 semaines.\n\nUTILISER QUAND :\n- Gérante d''institut\n- Argument diversification/marge\n- Preuve que le MP est le levier CA n°1', 'maquillage-permanent', ARRAY['temoignage', 'gerante', 'institut', 'ca']);

-- === FAQ PROSPECTS ===

INSERT INTO knowledge_base (categorie, titre, contenu, tags) VALUES
('faq', 'Prérequis pour suivre une formation', E'QUESTION : "Quels sont les prérequis ?"\n\nRÉPONSE :\nPour les formations dermo-esthétique (microblading, MP, full lips, trico) :\n- Avoir la formation Hygiène & Salubrité (obligatoire, on peut la faire chez nous)\n- Aucune expérience préalable requise pour les formations "débutant"\n- Pour les formations "intermédiaire" (trico, aréole) : avoir déjà pratiqué la dermopigmentation\n\nPour les soins visage (nanoneedling, allin1, peeling) :\n- Aucun prérequis technique\n- La formation hygiène est recommandée mais pas obligatoire\n\nPour l''épilation/détatouage laser :\n- Aucun prérequis spécifique\n- Formation sur les normes de sécurité incluse\n\nSTRATÉGIE :\nSi le lead n''a pas l''hygiène → proposer le pack Hygiène + Formation technique. Ça augmente le panier ET ça sécurise le parcours.', ARRAY['prerequis', 'niveau', 'condition', 'debutante']),

('faq', 'Matériel inclus ou à acheter', E'QUESTION : "Est-ce que le matériel est inclus ?"\n\nRÉPONSE :\nPendant la formation : TOUT le matériel est fourni (machines, aiguilles, pigments, gants, etc.)\n\nAprès la formation :\n- Dermotec est distributeur officiel NPM France\n- Kit de démarrage disponible à partir de 500€ HT\n- Les anciennes stagiaires bénéficient de -10% permanent\n- On conseille le matériel adapté à votre pratique (pas de surprises)\n\nARGUMENT : "Vous n''avez rien à acheter avant la formation. Pendant les 2-5 jours, vous testez NOTRE matériel. Après, on vous conseille exactement ce dont vous avez besoin — et vous avez -10% à vie en tant qu''alumni."', ARRAY['materiel', 'equipement', 'npm', 'kit']);
