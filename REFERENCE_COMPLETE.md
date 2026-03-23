# DOCUMENT DE RÉFÉRENCE COMPLET — CRM SATOREA / DERMOTEC
# Version 2026-03-23 — Pour audit par IA externe (Gemini, GPT, etc.)

---

## TABLE DES MATIÈRES

1. Présentation du projet
2. Architecture technique
3. Palette et Design System
4. Navigation et Sidebar
5. Pages Dashboard (détail)
6. Pages publiques
7. Pages spéciales (inscription, portail, émargement)
8. API Routes (détail)
9. Composants UI
10. Composants métier (CRM, financement, academy, LMS)
11. Hooks React
12. Modules lib
13. Base de données et migrations
14. Jobs Inngest (automatisations)
15. Sécurité
16. Agent IA
17. Gouvernance des rôles
18. Mobile et PWA
19. Animations et interactions
20. Business model et monétisation
21. Roadmap et dette technique

---

## 1. PRÉSENTATION DU PROJET

### Contexte
- **Marque** : Dermotec Advanced — Centre de formation esthétique certifié Qualiopi
- **Lieu** : 75 Boulevard Richard Lenoir, Paris 11e
- **Activité** : Formation professionnelle en esthétique (micropigmentation, microblading, soins du visage/corps) + Distribution de matériel NPM France
- **SaaS** : Satorea — l'agence qui développe le CRM pour Dermotec et d'autres centres de formation
- **Cible** : Centres de formation esthétique en France, TPE/PME (1-10 employés)

### Formations proposées (11)
- Maquillage permanent (35h, 2500€ HT)
- Microblading (14h)
- Full Lips (14h)
- Tricopigmentation (21h)
- Aréoles & Cicatrices (21h)
- Hygiène & Salubrité (21h, obligatoire)
- Extension de cils (7h)
- Brow Lift (7h)
- Blanchiment dentaire (7h)
- Peeling & Dermaplaning (7h)
- Speed Détatouage (7h)

4 catégories : Micropigmentation, Regard, Soins visage, Soins corps

### Chiffres du projet (mars 2026)
- **554 fichiers source**
- **71 pages** (dashboard + public + spéciales)
- **63 API routes**
- **136 composants** React
- **27 hooks** React Query
- **141 modules lib**
- **54 migrations SQL**
- **20 tests** (Vitest + happy-dom)
- **15 jobs Inngest** (background)
- **11 produits Stripe** avec prix
- **4 plans SaaS** : Découverte (gratuit), Pro (49€/mois), Expert (99€/mois), Clinique (sur devis)

### URL
- **Production** : https://crm-dermotec.vercel.app
- **GitHub** : https://github.com/Yousee75/crm-dermotec
- **Supabase** : projet `wtbrdxijvtelluwfmgsf`

---

## 2. ARCHITECTURE TECHNIQUE

### Stack
| Technologie | Version | Rôle |
|------------|---------|------|
| Next.js | 15 | Framework React, App Router, SSR/SSG |
| React | 19 | UI, Server Components |
| TypeScript | Strict | Typage |
| Supabase | Hosted | Base de données PostgreSQL, Auth, RLS, Storage, Realtime |
| Stripe | API | Paiements formations, abonnements SaaS, webhooks |
| Resend | API | Emails transactionnels |
| Tailwind CSS | v4 | Styling utilitaire |
| Framer Motion | Latest | Animations |
| React Query | v5 | State management serveur, cache |
| Zustand | Latest | State management client |
| React Hook Form + Zod | Latest | Formulaires + validation |
| Inngest | Cloud | Background jobs, crons, event-driven |
| Upstash Redis | Serverless | Rate limiting distribué |
| Hono | Latest | API server DDD (domain-driven design) |
| Vitest | Latest | Tests unitaires |

### Structure des dossiers
```
src/
  app/
    (auth)/              4 pages : login, forgot-password, reset-password, mfa-verify
    (dashboard)/         34+ pages CRM
    (public)/            8 pages marketing/légal
    api/                 63 API routes
    formations/          Catalogue public + pages [slug]
    inscription/         Inscription en ligne (standard + express)
    emargement/          Émargement digital QR
    portail/             Portail stagiaire (convention, documents)
    nps/                 Enquête satisfaction post-formation
    questionnaire/       Évaluation stagiaire
    join/                Invitation équipe par token
  components/
    ui/                  ~80 composants primitifs (Button, Card, Badge, Dialog, Sheet...)
    crm/                 ~10 composants métier (WizardInscription, LeadActionHub...)
    academy/             9 composants LMS ancien (ContentRenderer, QuizBlock...)
    lms/                 3 composants LMS nouveau (CoursePlayer, ContentUploader, ProgressDashboard)
    financement/         2 composants (FinancementWorkflow, FinancementDetailEnriched)
    competitors/         5 composants analyse concurrentielle
    documents/           2 composants (DocumentChecklist, TransitionBlocker)
    leads/               2 composants (ImportCSVDialog, GenerateDevisButton)
    tools/               8 composants outils (calculateurs, générateurs)
  hooks/                 27 hooks React Query
  lib/                   141 modules (scoring, IA, PDF, enrichissement, sécurité...)
  server/                Architecture DDD Hono (domain, application, infrastructure, routes)
  inngest/               15 background jobs
  types/                 TypeScript types et interfaces
```

---

## 3. PALETTE ET DESIGN SYSTEM

### Palette Satorea Officielle (source : satorea_light_options.html — Option B)

| Rôle | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| **Orange Satorea** | `#FF5C00` | `--color-primary` | CTA principal, sidebar active, liens, énergie |
| **Orange clair** | `#FF8C42` | `--color-primary-light` | Hover, warning, badges |
| **Rose Hot Pink** | `#FF2D78` | `--color-action` | Accent secondaire, beauté, erreurs |
| **Rose clair** | `#FF6BA8` | — | Badges légers, hover rose |
| **Noir** | `#1A1A1A` | `--color-accent` | Sidebar bg, texte principal |
| **Gris foncé** | `#3A3A3A` | `--color-accent-light` | Texte secondaire, sidebar hover |
| **Fond papier** | `#FAF8F5` | `--color-background` | Background page — JAMAIS gris froid |
| **Fond hover** | `#F4F0EB` | `--color-surface-hover` | Surfaces au survol |
| **Fond active** | `#EDE8E0` | `--color-surface-active` | Surfaces cliquées |
| **Border** | `#EEEEEE` | `--color-border` | Bordures |
| **Blanc** | `#FFFFFF` | `--color-surface` | Cards, surfaces |
| **Success** | `#10B981` | `--color-success` | Validé, gagné, formé |

AUCUNE autre couleur n'est autorisée. Pas de bleu, pas de violet, pas de cyan.

### Typographie
- **Headings** : Bricolage Grotesque (serif, caractère fort)
- **Body** : DM Sans (sans-serif, lisible)
- **Monospace** : Geist Mono (code, données)
- Body size : 16px (14px dans les tableaux)
- H1 : 30px, H2 : 24px, H3 : 20px

### Composants visuels
- Border-radius : 6/10/14/18/9999px (boutons pill = rounded-full)
- Spacing : grille 4px (4/8/16/24/32/48px)
- Shadows : teinte chaude (rgba(26,26,26,...))
- Boutons : pill shape (rounded-full), pas de shadow, hover = couleur change
- Cards : bg-white, border border-gray-100, shadow-card, rounded-xl

### Animations
- `glow-hot` : prospects score >= 80 pulsent (3 cycles)
- `pulse-urgent` : rappels en retard pulsent rouge (3 cycles)
- `bounce-badge` : compteurs rebondissent
- `count-up` : KPIs glissent vers le haut
- `celebrate` : pop animation au changement de statut
- `filter-reveal` : résultats filtrés en cascade stagger
- `spring-hover` : scale(1.02) avec spring physics
- `stagger-children` : apparition séquentielle des éléments de liste

---

## 4. NAVIGATION ET SIDEBAR

### Sidebar (7 items — langage formateur)
| # | Label | Route | Icône | Fusionne |
|---|-------|-------|-------|----------|
| 1 | Aujourd'hui | `/` | LayoutDashboard | Dashboard + cockpit |
| 2 | Prospects | `/leads` | UserPlus | Leads + pipeline + contacts |
| 3 | Formations | `/sessions` | Calendar | Sessions + inscriptions + stagiaires |
| 4 | Financement | `/financement` | CreditCard | OPCO + CPF + BPF |
| 5 | Tableau de bord | `/analytics` | BarChart3 | Analytics + performance |
| 6 | Qualité | `/qualiopi` | Award | Qualiopi + audits + NPS |
| 7 | Réglages | `/parametres` | Settings | Paramètres + équipe + sécurité |

### Accès hors sidebar (via Cmd+K)
Messages, Mon coaching (Academy), Pipeline Kanban, Scripts de vente (Playbook), Outils, Concurrents, Relances auto (Cadences), Commandes

### Navigation mobile
- Bottom bar : 5 items (Aujourd'hui, Prospects, +FAB, Formations, Stats)
- FAB : 3 actions (Nouveau prospect, Nouvelle formation, Financement)

### Gouvernance par rôle
| Rôle | Items sidebar | Filtre leads |
|------|--------------|-------------|
| Admin | 7 (tout) | Tous |
| Manager | 7 (tout) | Tous |
| Commercial | 4 | Ses leads uniquement (par défaut) |
| Formatrice | 3 | Pas de leads |
| Assistante | 5 | Tous |

---

## 5. PAGES DASHBOARD (34+ pages)

### Aujourd'hui (/)
- **Objectif** : En 10 secondes, savoir quoi faire
- **Sections** : Focus intelligent (rouge/orange/vert selon urgence), Pipeline mini cliquable, Actions du jour (rappels avec boutons appel/email/WhatsApp), Derniers prospects, KPIs compacts (6)
- **Données** : useLeads, useSessions, useOverdueRappels, useTodayRappels
- **Statut** : Fonctionnel

### Prospects (/leads)
- **Objectif** : Trouver, filtrer, agir en 1 clic
- **Sections** : Filtrage 3 niveaux (recherche → smart chips → filtres avancés), Liste/cards responsive, Bulk actions, Import/Export CSV
- **Smart filters** : Chauds (score>=60), Aujourd'hui, Stagnants (7j+), Financement, Urgents
- **Données** : useLeads avec filtres dynamiques
- **Statut** : Fonctionnel

### Pipeline Kanban (/pipeline)
- **Objectif** : Vue visuelle drag-and-drop du parcours prospect
- **Colonnes** : 11 statuts (NOUVEAU → CONTACTE → QUALIFIE → FINANCEMENT_EN_COURS → INSCRIT → EN_FORMATION → FORME → ALUMNI → PERDU → SPAM → REPORTE)
- **Features** : Drag-drop (dnd-kit), slide-over panel au clic, recherche, filtres
- **Données** : useLeads, useChangeStatut
- **Statut** : Fonctionnel

### Fiche Prospect (/lead/[id])
- **Objectif** : Tout sur ce prospect en un endroit
- **Sections** : Header (avatar + statut + score + actions rapides), 3 onglets (Résumé / Activité / Dossier), Stepper parcours, Composants CRM (WizardInscription, FinancementExpress, FormationSuggester, LeadActionHub, ParcoursClient)
- **Actions** : Appeler, Email, WhatsApp, Changer statut, Inscrire, Assigner commercial, Enrichir IA, Rapport PDF/Word
- **Données** : useLead, useMessages, useCadenceInstances, useAIResearch
- **Statut** : Fonctionnel (815 lignes)

### Formations (/sessions)
- **Objectif** : Planifier, remplir, émarger
- **Architecture** : Hub à onglets (Planning / Inscriptions / Émargement)
- **Données** : useSessions via lazy-loaded tabs
- **Statut** : Fonctionnel

### Session détail (/session/[id])
- **Sections** : Infos formation, Liste inscrits, QR code émargement, Statut places
- **Statut** : Fonctionnel

### Émargement live (/session/[id]/emargement-live)
- **Objectif** : QR code scanné par les stagiaires pour signer
- **Refresh** : Auto 10 secondes
- **Statut** : Fonctionnel

### Financement (/financement)
- **Objectif** : Suivre chaque dossier OPCO/CPF du début à la fin
- **Vues** : Kanban (EN_ATTENTE → SOUMIS → EN_INSTRUCTION → ACCEPTE/REFUSE) + Table
- **KPIs** : 5 (montant total, acceptés, en cours, taux acceptation, délai moyen)
- **Données** : useQuery financement
- **Statut** : Fonctionnel

### Simulateur financement (/financement/simulateur)
- **Objectif** : Calculer le financement selon profil + formation
- **Statut** : Fonctionnel

### Analytics (/analytics)
- **Objectif** : Comprendre les performances
- **Sections** : Sélecteur période, 6 KPIs, CA mensuel (Recharts), Funnel conversion, Sources, Top formations, Satisfaction, Tableaux performance
- **Données** : useQuery analytics
- **Statut** : Fonctionnel (mais certaines données mockées)

### Performance (/performance)
- **Objectif** : Leaderboard commercial
- **Sections** : KPIs par commercial, Classement, Progression objectif
- **Données** : useCommercialPerformance
- **Statut** : Fonctionnel

### Qualité (/qualiopi)
- **Objectif** : Préparer l'audit Qualiopi en continu
- **Architecture** : Hub à onglets (Indicateurs / Questionnaires / BPF / Réclamations)
- **Statut** : Fonctionnel

### Messages (/messages)
- **Objectif** : Inbox unifiée multi-canal
- **Canaux** : Email, WhatsApp, SMS, Appel, Note interne
- **Vue** : Split inbox (liste gauche / conversation droite)
- **Données** : useInbox, useMessages, useSendMessage
- **Statut** : Fonctionnel

### Cadences (/cadences)
- **Objectif** : Séquences de relance automatisées
- **Sections** : Templates prédéfinis, Instances actives
- **Statut** : Fonctionnel

### Mon coaching (/academy)
- **Objectif** : Formation continue, 5 min/jour
- **Sections** : Header avec stats (points, complétion, badges), Progression globale, Modules, Leaderboard, Badges
- **Gamification** : Streaks, points, badges, quiz
- **Statut** : Fonctionnel

### Catalogue (/catalogue)
- **Objectif** : Explorer les formations avec filtres, FAQ, ROI
- **Statut** : Fonctionnel (1038 lignes)

### Concurrents (/concurrents)
- **Objectif** : Analyse concurrentielle par SIRET/nom/rayon
- **Features** : Recherche, carte, analyse IA
- **Statut** : Fonctionnel

### Outils (/outils)
- **Objectif** : 13 outils utilitaires
- **Outils** : Calculatrice TVA, Vérification SIRET, Simulateur financement, Générateur email signature, Compteur caractères, Générateur mot de passe, Minuteur Pomodoro, Compresseur images, Fusion PDF, Reformulateur texte, etc.
- **Statut** : Fonctionnel

### Playbook (/playbook)
- **Objectif** : Scripts de vente collaboratifs
- **Features** : Créer/voter/copier des scripts, suggestions IA
- **Statut** : Fonctionnel

### Audit (/audit)
- **Objectif** : Trail d'activité des utilisateurs
- **Statut** : Fonctionnel

### Équipe (/equipe)
- **Objectif** : Gestion des membres
- **Statut** : Fonctionnel

### Réglages (/parametres)
- **Architecture** : Hub à onglets (Équipe / Catalogue / Sécurité / Mon plan / Intégrations)
- **Statut** : Fonctionnel

### Settings (/settings)
- **Sous-pages** : /settings/privacy (RGPD), /settings/security (MFA), /settings/subscription (plan SaaS)
- **Statut** : Fonctionnel

### Pages placeholder (redirects)
- /clients → redirect /contacts
- /apprenants → redirect /stagiaires
- /bpf → redirect /qualiopi
- /facturation → redirect /gestion
- /cockpit → redirect /
- /qualite → redirect /qualiopi

---

## 6. PAGES PUBLIQUES

| Page | Route | Description |
|------|-------|-------------|
| Accueil | /accueil | Landing page marketing (hero noir + gradient, TrustBar, features) |
| Pricing | /pricing | Plans SaaS (4 tiers) |
| Aide | /aide | FAQ et documentation |
| Changelog | /changelog | Historique des mises à jour |
| CGV | /conditions-generales | Conditions générales de vente |
| DPA | /dpa | Data Processing Agreement |
| Mentions légales | /mentions-legales | Mentions légales |
| Politique confidentialité | /politique-confidentialite | RGPD |

---

## 7. PAGES SPÉCIALES

| Page | Route | Description |
|------|-------|-------------|
| Catalogue formations | /formations | Catalogue public avec pages [slug] |
| Inscription standard | /inscription/[formationId] | Formulaire inscription multi-étapes |
| Inscription express | /inscription-express/[formationId] | Version rapide |
| Émargement | /emargement/[sessionId] | Signature digitale par QR code |
| Portail stagiaire | /portail/[token] | Convention, documents |
| Convention | /portail/[token]/convention | Signature convention |
| NPS | /nps/[sessionId] | Enquête satisfaction post-formation |
| Questionnaire | /questionnaire/[token] | Évaluation stagiaire |
| Join | /join/[token] | Invitation équipe |
| Auth | /login, /forgot-password, /reset-password, /mfa-verify | Authentification |

---

## 8. SÉCURITÉ (7 couches)

1. **WAF + Headers** : CSP, HSTS, X-Frame-Options, X-Content-Type-Options (middleware.ts)
2. **Rate limiting** : Upstash Redis distribué (30 req/min pages, 10 req/min API)
3. **Auth** : Supabase Auth obligatoire sauf routes publiques
4. **RLS** : Row Level Security sur toutes les tables PostgreSQL
5. **Anti-scraping** : honeypot endpoints, bot detection user-agent
6. **Prompt guard** : protection injection IA
7. **RGPD** : export données, droit à l'oubli, cookie consent, DPA

### Validations
- Zod sur tous les inputs API
- Honeypot fields sur formulaires publics
- Emails jetables bloqués (lib/disposable-emails.ts)
- Sanitization HTML (DOMPurify via lib/sanitize.ts)
- Content-Length max 10KB formulaires

---

## 9. AGENT IA

### Agent v3 (dual-mode)
- **Mode commercial** : scoring, prospection, objections, scripts
- **Mode formation/Qualiopi** : indicateurs, évaluation, conformité
- **15 tools** : search leads, update lead, score, create activity, search sessions, etc.
- **Hybrid search** : pgvector + full-text search
- **Semantic cache** : évite les requêtes IA dupliquées
- **Proactive Agent** (Inngest cron L-V 8h) : détecte leads chauds, financements stagnants, sessions proches, recovery

---

## 10. BUSINESS MODEL

### Monétisation SaaS (4 plans)
| Plan | Prix | Contacts | Chatbot IA | Features |
|------|------|----------|-----------|----------|
| Découverte | 0€ | 50 | 10/jour | Base |
| Pro | 49€/mois | 500 | 50/jour | Export, cadences |
| Expert | 99€/mois | Illimité | 200/jour | Analytics, multi-commercial |
| Clinique | Sur devis | Illimité | Illimité | Multi-centres, API |

### Parcours prospect (6 scénarios)
1. Autofinancement (10 jours)
2. OPCO (30-60 jours)
3. France Travail / AIF (30-90 jours)
4. CPF (7-21 jours)
5. Post-formation (365 jours)
6. Réactivation (180 jours)

### Pipeline probabilités
| Statut | Probabilité conversion |
|--------|----------------------|
| NOUVEAU | 5% |
| CONTACTÉ | 10% |
| QUALIFIÉ | 25% |
| FINANCEMENT_EN_COURS | 40% |
| INSCRIT | 80% |
| EN_FORMATION | 95% |
| FORMÉ/ALUMNI | 100% |

---

## 11. MOBILE ET PWA

### Composants mobile
- `MobileBottomNav` : bottom bar 5 items + FAB
- `SwipeableRow` : swipe gauche/droite sur les listes (framer-motion)
- `MobileBottomSheet` : bottom sheet pattern iOS Maps (3 snap points)
- CSS : `.kpi-carousel`, `.pipeline-mobile`, `.lead-card-mobile`, `.quick-actions-bar`

### PWA
- manifest.json configuré
- Service worker (sw.js)
- Install prompt
- Touch targets 44px minimum
- Safe areas iOS (notch, Dynamic Island)

---

## 12. DETTE TECHNIQUE CONNUE

1. **25 fichiers @ts-nocheck** (routes API sans types Supabase générés)
2. **~108 console.log** restants (surtout API routes — logs légitimes)
3. **3 composants > 1000 lignes** (FinancementWorkflow, FinancementDetailEnriched, WizardInscription)
4. **fontFamily inline** dans les pages publiques (~56 occurrences)
5. **Données mockées** dans Analytics (satisfaction, NPS)
6. **Multi-tenant** non sécurisé (RLS pas filtré par org_id)

---

---

## 13. BASE DE DONNÉES — 50 migrations, ~85 tables

### Tables principales (16)
equipe, formations, leads, sessions, inscriptions, financements, rappels, activites, documents, commandes, modeles, notes_lead, factures, qualite, partenaires, email_templates

### Tables audit (4)
field_history, login_logs, smart_actions, anomalies (IMMUABLES — pas d'UPDATE/DELETE)

### Tables enrichissement (8)
prospect_reports, prospect_reviews, auto_enrichment_log, enrichment_cpf, enrichment_geo, enrichment_market, enrichment_social_proof, prospect_data

### Tables sécurité (5)
security_events, security_alerts, known_devices, ai_audit_log, ai_injection_attempts

### Tables LMS (4)
formation_modules, formation_lessons, formation_files, formation_progress

### Tables Academy (5)
academy_modules, academy_lessons, academy_progress, academy_badges, academy_user_badges

### Tables communication (3)
messages, emails_sent, webhook_events

### Tables financement enrichi (6)
financement_lignes, financement_historique, organisme_parametres, factures_formation, paiements_formation, echeanciers_formation

### Tables analytics (3)
analytics_events, user_events, kpi_snapshots

### Materialized Views (7)
mv_dashboard_kpis, mv_revenue_graph, mv_pipeline_forecast, v_revenue_graph, v_pipeline, v_dashboard_metrics

### Politique RLS
- Toutes les tables ont RLS activé
- Helpers optimisés : auth_uid(), auth_role(), auth_equipe_id(), auth_org_id()
- Multi-tenant : org_id sur 14+ tables (migration 034)

---

## 14. AUTOMATISATIONS INNGEST — 15 fichiers, 19 fonctions

### Crons (12)
| Fréquence | Job | Description |
|-----------|-----|-------------|
| */2 min | processQueueJob | Draine la queue mémoire + DLQ |
| */5 min | refreshMaterializedViews | Rafraîchit les MV dashboard |
| */5 min | uptimeMonitor | Ping 3 endpoints (homepage, API health, login) |
| 1h | businessMetricsCheck | Détecte anomalies business (drop leads >50%) |
| 1h | securityAuditHourly | Audit sécurité : AI self-check, injection, appareils |
| 7h | dailyRappels | Récap quotidien rappels + email admin |
| 8h (L-V) | proactiveAgent | Agent IA : leads chauds, financements stagnants |
| 8h | sessionLifecycle | Transitions auto sessions, convocations J-7 |
| 8h | dailySecurityReport | Rapport sécurité quotidien |
| 9h | smartRelance | Relance IA : message DeepSeek personnalisé |
| Lundi 7h | weeklyReport | Rapport hebdo HTML + backup DB |
| 1er du mois | monthlySnapshot | Snapshot KPIs + détection upsell |

### Events (7)
| Event | Job | Description |
|-------|-----|-------------|
| lead.enrich | autoEnrichLead | Enrichit via Pappers, Google, scraping |
| crm/email.send | sendEmail | Envoi email Resend + log |
| crm/bulk.email.send | bulkEmailSend | Email masse (throttle 50/min) |
| crm/bulk.lead.update | bulkLeadUpdate | MAJ bulk par lots de 50 |
| crm/lead.cadence.start | leadCadence | Cadence nurturing 14 jours |
| crm/lead.post-formation.start | postFormationCadence | Post-formation : avis J+5, upsell J+30 |
| stripe/webhook.process | stripeWebhookProcessor | Traitement async webhooks Stripe |

---

## 15. TYPES — 27 enums, 41 interfaces

### Enums clés
- **StatutLead** (11) : NOUVEAU → CONTACTÉ → QUALIFIÉ → FINANCEMENT_EN_COURS → INSCRIT → EN_FORMATION → FORMÉ → ALUMNI → PERDU → SPAM → REPORTÉ
- **RoleEquipe** (5) : admin, commercial, formatrice, assistante, manager
- **SourceLead** (12) : formulaire, whatsapp, telephone, instagram, facebook, google, bouche_a_oreille...
- **OrganismeFinancement** (12) : OPCO_EP, AKTO, FAFCEA, FIFPL, FRANCE_TRAVAIL, CPF...
- **StatutFinancement** (10) : PREPARATION → SOUMIS → EN_EXAMEN → VALIDÉ/REFUSÉ → VERSÉ
- **StatutSession** (7) : BROUILLON → PLANIFIÉE → CONFIRMÉE → EN_COURS → TERMINÉE
- **CanalMessage** (5) : email, whatsapp, sms, appel, note_interne

### Interfaces principales
Lead, Session, Inscription, Financement, Rappel, Activite, Message, Equipe, Formation, Document, Commande, Facture, Emargement, AcademyModule, AcademyLesson, CadenceTemplate

---

---

## 16. API ROUTES — 65 routes, 27 catégories

### Résumé par catégorie
| Catégorie | Routes | Auth | Services externes |
|-----------|--------|------|-------------------|
| AI | 10 | Mixte | Anthropic, OpenAI, DeepSeek |
| Analytics | 2 | requireAuth + role | — |
| Automatisations/Crons | 3 | CRON_SECRET | — |
| Briefing | 1 | supabase.auth | Anthropic, OSM |
| Cal.com | 2 | public | Cal.com API |
| Competitors | 6 | public | Sirene, Pappers, Google, PJ, Planity |
| Devis | 2 | mixte | Stripe, @react-pdf |
| Documents | 1 | public | VirusTotal, Supabase Storage |
| DocuSeal | 3 | public | DocuSeal API |
| Email | 2 | mixte | Resend, DNS/SMTP |
| Émargement | 1 | token portail | — |
| Enrichment | 6 | mixte | 25+ sources |
| Formation/LMS | 1 | supabase.auth | — |
| GDPR | 2 | supabase.auth + admin | — |
| Health | 1 | public | Supabase, Stripe, Resend, Redis |
| Inngest | 1 | Inngest signing key | Inngest |
| Inscription | 1 | public (Zod strict) | Stripe |
| Invitations | 2 | supabase.auth (Zod) | Resend |
| Leads | 2 | mixte | Multi-sources |
| Messages | 1 | supabase.auth | Resend, Twilio |
| Portail | 2 | token portail | — |
| Questionnaires | 2 | mixte | Resend |
| Soft Delete | 2 | public | — |
| Stripe | 2 | webhook sig | Stripe, Inngest |
| Tools | 2 | public | INSEE, AI |
| Tracking | 1 | public (Zod) | — |
| Webhook formulaire | 1 | public (Zod + honeypot) | Inngest |

### Routes IA (10)
- `/api/ai/agent-v2` — Agent commercial v3, streaming Claude, 15 tools, hybrid search
- `/api/ai/assistant` — Assistant général DeepSeek, rate-limité par plan SaaS
- `/api/ai/chat` — Chatbot contextuel (formations, sessions, lead)
- `/api/ai/commercial` — Assistant commercial (email, relance, objection, score)
- `/api/ai/generate` — Génération email/message personnalisé (6 types)
- `/api/ai/index-kb` — Indexation knowledge base pgvector (cron)
- `/api/ai/objection` — Traitement objection temps réel
- `/api/ai/playbook-suggest` — Suggestion réponse depuis playbook
- `/api/ai/prospect-research` — Recherche enrichie avant appel
- `/api/ai/score` — Scoring IA prédictif /100

### Routes Enrichment (6)
- `/api/enrichment` — Enrichir un lead (Pappers, Google) avec crédits
- `/api/enrichment/full` — Pipeline 25 sources complet
- `/api/enrichment/pipeline` — Pipeline intelligent + narrative IA
- `/api/enrichment/report` — Récupérer rapport prospection
- `/api/enrichment/report/pdf` — Générer PDF rapport (@react-pdf)
- `/api/enrichment/report/word` — Générer Word (.docx) + carte OSM

### ALERTES SÉCURITÉ — Routes sans auth
10 routes manipulent des données sensibles SANS authentification :
1. `/api/soft-delete` + `/api/soft-delete/restore` — Suppression/restauration 12 tables
2. `/api/documents/upload` — Upload fichiers
3. `/api/leads/[id]/enrich` — Enrichissement (coût API)
4. `/api/enrichment/full` — Pipeline 25 sources (0.15-0.40€/appel)
5. `/api/devis/generate` — Génération devis PDF
6. `/api/stripe/payment-link` — Création lien paiement
7. `/api/competitors/*` — 6 routes analyse concurrentielle
8. `/api/ai/agent-v2` — Agent IA streaming (coût Claude)

---

## 17. INVENTAIRE PAGES — 70 pages, 27 836 lignes

### Résumé
| Catégorie | Pages | Fonctionnelles | Redirects | Lignes |
|-----------|-------|---------------|-----------|--------|
| Auth | 4 | 4 | 0 | 839 |
| Dashboard | 46 | 40 | 6 | 19 491 |
| Public | 8 | 8 | 0 | 3 124 |
| Standalone | 12 | 12 | 0 | 4 382 |
| **Total** | **70** | **64** | **6** | **27 836** |

### Pages les plus volumineuses
1. settings/security — 1 336 lignes (MFA, sessions, logs)
2. portail/[token] — 1 045 lignes (8 onglets stagiaire)
3. catalogue — 1 038 lignes (11 formations, filtres, FAQ)
4. inscription/[formationId] — 997 lignes (formulaire multi-étapes)
5. academy/formations — 923 lignes (modules interactifs, quiz)
6. lead/[id] — 843 lignes (fiche prospect complète)
7. leads — 794 lignes (liste avec 3 niveaux de filtres)

### Toutes les pages standalone
| Route | Description | Lignes |
|-------|-------------|--------|
| /formations | Catalogue public SSR | 30 |
| /formations/[slug] | Détail formation SSR | 60 |
| /inscription/[formationId] | Formulaire inscription complet | 997 |
| /inscription-express/[formationId] | Inscription rapide + paiement | 524 |
| /inscription/success | Confirmation post-paiement | 306 |
| /inscription/cancel | Annulation paiement | 155 |
| /join/[token] | Invitation équipe | 187 |
| /nps/[sessionId] | Enquête satisfaction NPS | 148 |
| /portail/[token] | Espace stagiaire 8 onglets | 1 045 |
| /portail/[token]/convention | Signature convention | 390 |
| /questionnaire/[token] | Évaluation stagiaire | 307 |
| /emargement/[sessionId] | QR code émargement | (dans dashboard) |

---

## SECTIONS EN ATTENTE

- Détail des 136 composants avec props (agent en cours)
- Détail des 27 hooks
- Détail des 141 modules lib

---

*Document généré le 23 mars 2026. Source : codebase CRM Dermotec/Satorea.*
*554 fichiers, 71 pages, 63 API, 136 composants, 27 hooks, 141 libs, 50 migrations, 15 jobs Inngest.*
*Pour audit par : Gemini, GPT-4, Claude, ou tout autre LLM.*
