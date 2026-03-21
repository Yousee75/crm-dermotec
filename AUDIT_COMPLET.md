# AUDIT COMPLET — CRM DERMOTEC
# Date : 2026-03-21
# Version : 1.0.0
# Objectif : Permettre a une IA externe d'auditer tous les aspects du logiciel

---

## 1. IDENTITE DU PROJET

| Champ | Valeur |
|-------|--------|
| **Nom** | CRM Dermotec Advanced |
| **Type** | CRM SaaS pour centre de formation esthetique |
| **Marque** | Dermotec Advanced |
| **Activite** | Formation esthetique certifiee Qualiopi + Distribution materiel NPM France |
| **Cible** | Estheticiennes, reconversions pro, gerantes institut |
| **Lieu** | 75 Bd Richard Lenoir, Paris 11e |
| **Formations** | 11 formations (400-2500 EUR HT), 6 categories |
| **Certification** | Qualiopi (7 criteres, 32 indicateurs) |

---

## 2. STACK TECHNIQUE COMPLETE

### Core
| Technologie | Version | Role |
|-------------|---------|------|
| Next.js | 15.3.0 | Framework fullstack SSR/SSG |
| React | 19.0.0 | UI library |
| TypeScript | 5.8.0 | Typage strict (mode strict) |
| Tailwind CSS | 4.0.0 | CSS utility-first (v4 CSS-based @theme) |
| PostCSS | 8.5.0 | Processeur CSS avec @tailwindcss/postcss |

### Backend / Infrastructure
| Technologie | Version | Role |
|-------------|---------|------|
| Supabase | 2.49.0 | Postgres + Auth + RLS + Storage + Realtime |
| Hono | 4.12.8 | API framework type-safe + OpenAPI |
| @hono/zod-openapi | 1.2.2 | Validation + documentation API |
| Inngest | 4.0.4 | Queue async, crons, event-driven jobs |
| Upstash Redis | 1.37.0 | Rate limiting distribue + cache |
| Stripe | 18.0.0 | Paiements formations + e-shop |
| Resend | 4.0.0 | Emails transactionnels (5 templates) |
| Sentry | 10.45.0 | Error tracking (desactive, fichiers .bak) |
| Zod | 3.24.0 | Schema validation |

### Frontend
| Technologie | Version | Role |
|-------------|---------|------|
| React Query | 5.75.0 | Server state management + cache |
| Zustand | 5.0.0 | Client state management |
| react-hook-form | 7.55.0 | Formulaires |
| framer-motion | 12.0.0 | Animations |
| Recharts | 2.15.0 | Graphiques (partiellement utilise) |
| dnd-kit | 6.3.0 | Drag-and-drop (pipeline kanban) |
| cmdk | 1.0.0 | Command palette (Cmd+K) |
| sonner | 2.0.0 | Toasts |
| lucide-react | 0.500.0 | Icons |
| @react-pdf/renderer | 4.3.0 | Generation PDF (5 templates) |

### IA
| Service | Usage | Cout |
|---------|-------|------|
| DeepSeek | Scoring, generation, objections | ~$0.55/1M tokens |
| Perplexity Sonar | Recherche prospect | $5/1000 queries |
| Tavily | Alternative recherche | Gratuit 1000/mois |

### Communication
| Service | Usage | Cout |
|---------|-------|------|
| Resend | Emails transactionnels | Gratuit 100/jour |
| Twilio | SMS + WhatsApp (HTTP direct) | ~$0.04/SMS, ~$0.005/WA |
| Stripe | Paiements | 1.4% + 0.25 EUR |

### Outils dev
| Outil | Version | Role |
|-------|---------|------|
| Vitest | 4.1.0 | Test framework |
| ESLint | 9.0.0 | Linter (flat config) |
| Prettier | 3.5.0 | Formatter + tailwindcss plugin |
| Husky | 9.0.0 | Git hooks |
| lint-staged | 16.0.0 | Pre-commit lint |
| MSW | 2.12.14 | Mock Service Worker (tests) |
| happy-dom | 20.8.4 | DOM pour tests |
| @next/bundle-analyzer | 15.3.0 | Analyse bundle |
| Supabase CLI | 2.0.0 | Migrations + types |

---

## 3. METRIQUES DU CODE

| Metrique | Valeur |
|----------|--------|
| Fichiers TypeScript | 216 |
| Lignes de code (src/) | 41 179 |
| Fichiers de test | 8 |
| Vulnerabilites npm | 0 |
| Commits totaux | 20+ |
| Fichiers non commites | 47 untracked + 29 modified |
| Variables d'env | 33 |
| Pages dashboard | 19 |
| Pages publiques | 8 |
| API endpoints | 30+ (23 Next.js + 6+ Hono) |
| Composants UI | 31 |
| Hooks React Query | 13 |
| Librairies metier | 36 (~5000 lignes) |
| Migrations SQL | 13 |
| Tables Supabase | 30+ |
| Vues materialisees | 5 |
| Vues SQL | 14+ |
| Index DB | 63+ |
| Inngest functions | 11 |

---

## 4. ARCHITECTURE

### 4.1 Pattern architectural : Hexagonal + DDD (partiel)

```
                    ┌──────────────────────────────────┐
                    │         PRESENTATION             │
                    │  Next.js Pages + Hono Routes     │
                    │  (19 dashboard + 8 public pages) │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────▼───────────────────────┐
                    │         APPLICATION               │
                    │  Use Cases (4 pour leads)         │
                    │  create, changeStatus, assign,    │
                    │  qualify                          │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────▼───────────────────────┐
                    │         DOMAIN                    │
                    │  LeadAggregate + State Machine    │
                    │  Value Objects (Email, PhoneFR,   │
                    │  Money, SIRET, DateRange)         │
                    │  Domain Events (17 types)         │
                    │  Result<T,E> (jamais throw)       │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────▼───────────────────────┐
                    │         INFRASTRUCTURE            │
                    │  SupabaseLeadRepository           │
                    │  InngestEventBus                  │
                    │  LeadReadModel (CQRS)             │
                    │  DI Container (per-request)       │
                    └──────────────────────────────────┘
```

### 4.2 Ce qui est implemente en DDD
- **Leads** : Aggregate, Use Cases, Repository, EventBus, ReadModel = COMPLET
- **Sessions, Inscriptions, Financements, Communications, Facturation, Qualite** = VIDE (placeholders)

### 4.3 Gap : Routes legacy vs DDD
- `/api/leads` (Hono) → query Supabase directement (legacy)
- `/api/v1/leads` (Hono OpenAPI) → passe par use cases DDD
- Les hooks frontend appellent Supabase directement via React Query (pas les API)

---

## 5. BASE DE DONNEES

### 5.1 Schema (30+ tables)

**Core (18)** : equipe, formations, leads, sessions, inscriptions, financements, factures, rappels, activites, documents, commandes, modeles, notes_lead, email_templates, qualite, partenaires, cadence_templates, cadence_instances

**Audit (4)** : field_history, login_logs, smart_actions, anomalies

**Communication (3)** : emails_sent, messages, consent_logs

**IA (3)** : ai_interactions, prospect_enrichments, cadence_logs

**Webhooks (3)** : webhook_events, webhook_subscriptions, webhook_deliveries

**Playbook (4)** : playbook_entries, playbook_responses, playbook_votes, onboarding_progress

**Knowledge (1)** : knowledge_base

**Performance (3)** : api_keys, organizations, slow_query_log

**Attendance (1)** : emargements

### 5.2 Securite DB
- **RLS active** sur toutes les tables
- **Policies role-based** : admin voit tout, commercial voit ses leads, formatrice voit ses sessions
- **Audit trail** : field_history (append-only, SHA-256 hash chain)
- **Encryption** : pgcrypto (encrypt_pii / decrypt_pii)
- **Full-text search** : tsvector sur leads, knowledge_base, playbook_entries
- **Trigram search** : pg_trgm GIN indexes pour recherche fuzzy

### 5.3 Performance DB
- **63+ index** (composite, trigram, BRIN, GIN)
- **5 vues materialisees** (refresh toutes les 5 min via Inngest)
- **Partitioning** : activites + field_history partitionnes par mois (2025-2027)
- **14+ vues SQL** pour analytics

### 5.4 Seed data
- 11 formations avec Stripe product_id/price_id
- 3 cadences predefinies (Nouveau Lead, Post-Formation, Relance Financement)
- 4 email templates
- 64 entrees knowledge_base (scripts, objections, fiches formation, processus financement)

---

## 6. SECURITE

### 6.1 Middleware (src/middleware.ts)
- **CSP** : nonce-based (pas unsafe-inline), Stripe, Supabase, fonts autorisees
- **HSTS** : max-age=31536000; includeSubDomains; preload
- **Headers** : X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Cross-Origin-Opener-Policy, X-Permitted-Cross-Domain-Policies
- **Rate limiting** : 30 req/min pages, 10 req/min API (Upstash Redis, fallback in-memory)
- **Auth** : Supabase Auth obligatoire sauf routes publiques
- **POST-only** : webhooks Stripe et formulaire

### 6.2 API Security
- **Zod validation** : toutes les routes
- **Honeypot** : formulaire public (_hp_company field)
- **Disposable email** : blocklist 85 domaines
- **Sanitization** : sanitizeString() sur tous les inputs
- **Content-Length** : max 10 KB formulaires, 10 MB documents
- **Stripe** : signature verification + idempotence (webhook_events table)
- **RBAC** : 5 roles x 24 permissions (matrice dans rbac.ts)

### 6.3 Issues securite identifiees
| Severite | Issue | Fichier |
|----------|-------|---------|
| HAUTE | Chiffrement PII = XOR basique (pas AES-256-GCM) | api-key-auth.ts |
| HAUTE | Validation signature convention incomplete (pas de magic number PNG) | portail/sign-convention |
| MOYENNE | uploaded_by: null dans upload documents | documents/upload |
| MOYENNE | VirusTotal optionnel, fichiers non scannes stockes | documents/upload |
| MOYENNE | Messages erreur exposent info business | inscription-express |
| BASSE | console.error peut leaker PII en production | Multiples fichiers |
| INFO | .env.vercel dans les fichiers non trackes | Racine projet |

### 6.4 RGPD
- **Consent logs** : table consent_logs (type, version, IP, methode)
- **Export** : /api/gdpr/export (admin/manager, JSON complet)
- **Suppression** : /api/gdpr/delete (admin, anonymisation lead)
- **Purge** : fonction purge_old_data() (activites > 24 mois, login_logs > 12 mois)

---

## 7. FONCTIONNALITES — 6 PILIERS

### 7.1 Leads & Pipeline
- **11 statuts** : NOUVEAU → CONTACTE → QUALIFIE → FINANCEMENT → INSCRIT → EN_FORMATION → FORME → ALUMNI (+ PERDU, REPORTE, SPAM)
- **Scoring** : Heuristique /100 (5 composantes) + IA predictif (DeepSeek)
- **Pipeline Kanban** : Drag-and-drop (dnd-kit), 7 phases, CA par phase
- **Smart actions** : 6 types (rappel overdue, lead stagnant, session incomplete, upsell, relance financement)
- **Recherche** : Full-text + trigram fuzzy

### 7.2 Financement
- **12 organismes** : OPCO EP, AKTO, FAFCEA, FIFPL, France Travail, CPF, AGEFIPH, Missions Locales, Region, Employeur, Transitions Pro, Autre
- **10 statuts** : PREPARATION → DOCUMENTS → COMPLET → SOUMIS → EN_EXAMEN → COMPLEMENT → VALIDE/REFUSE → VERSE → CLOTURE
- **IA** : Analyse eligibilite financement par statut professionnel

### 7.3 Sessions & Planning
- **7 statuts** : BROUILLON → PLANIFIEE → CONFIRMEE → EN_COURS → TERMINEE (+ ANNULEE, REPORTEE)
- **Emargement** : Signature electronique QR (canvas tactile, SHA-256 integrity)
- **Auto-transition** : Cron Inngest (session lifecycle, convocations J-7, rappels J-2)
- **Modeles** : Gestion mannequins (consentement, photos avant/apres)

### 7.4 Suivi Stagiaires
- **Portail** : Acces token-based (convention, emargement, documents)
- **Presence** : J1-J5 avec taux calcule
- **Satisfaction** : Note 1-5, NPS
- **Certificats** : Generation PDF (certificat, attestation)
- **Alumni** : Cadence post-formation (avis Google J+5, upsell J+30, parrainage J+90)

### 7.5 E-Shop & Commandes
- **Stripe checkout** : Paiement immediat, 3x, 4x
- **Statuts** : NOUVELLE → PREPAREE → EXPEDIEE → LIVREE (+ RETOURNEE, ANNULEE)
- **Tracking** : 6 transporteurs (La Poste, Chronopost, UPS, FedEx, DHL, Mondial Relay)
- **Webhook** : checkout.completed, refund, dispute

### 7.6 Analytics & Qualite
- **KPIs** : Total leads, conversion, CA, NPS, satisfaction
- **Graphiques** : Recharts (partiellement implemente — placeholder "Bientot")
- **Qualiopi** : 7 criteres, indicateurs, preuves, actions requises
- **Reclamations** : Suivi qualite (ouvertes, en cours, resolues)
- **Anomalies** : Detection automatique (doublons, suppressions masse, montants anormaux)

---

## 8. IA & AUTOMATISATION

### 8.1 Moteur IA (lib/ai.ts — 476 lignes)
- **Multi-provider** : DeepSeek > Mistral > OpenAI (fallback chain, OpenAI-compatible)
- **6 fonctions metier** :
  1. `aiScoreLead()` — Scoring predictif (segment, urgence, next action)
  2. `aiGenerateEmail()` — Email + WhatsApp (6 types : premier contact, relance, financement, post-formation, upsell, reactivation)
  3. `aiResearchProspect()` — Recherche enrichie Perplexity/Tavily
  4. `aiHandleObjection()` — Reponse + rebond + argument cle
  5. `aiSummarizeNotes()` — Resume + sentiment
  6. `aiAnalyseFinancement()` — Eligibilite organismes

### 8.2 Cadences automatiques (4 predefinies)
1. **Nouveau Lead** : J0 APPEL → J1 EMAIL → J3 WHATSAPP → J7 APPEL → J14 EMAIL
2. **Post-Formation** : J5 avis Google → J30 upsell → J90 alumni
3. **Relance Financement** : J0 EMAIL checklist → J3 APPEL → J7 EMAIL → J14 APPEL → J30 APPEL
4. **Abandon/Reactivation** : EMAIL → SMS → WHATSAPP → EMAIL final

### 8.3 Playbook collaboratif
- **Intelligence collective** : Equipe partage objections + reponses
- **Votes** : upvote/downvote par reponse
- **Taux succes** : Track succes/echec de chaque reponse
- **Auto-promotion** : Si taux >= 70% ET 5+ utilisations ET 3+ votes → knowledge_base
- **IA suggestions** : Reponse generee par IA pour chaque objection

### 8.4 Inngest functions (11 fonctions)
| Fonction | Trigger | Description |
|----------|---------|-------------|
| sendEmail | crm/email.send | Envoi email Resend |
| dailyRappels | Cron 7h | Digest rappels du jour |
| leadCadence | crm/lead.cadence.start | Cadence nouveau lead (4 steps) |
| postFormationCadence | crm/lead.post-formation.start | Post-formation (avis, upsell, alumni) |
| sessionLifecycle | Cron 8h | Auto-transition sessions + convocations |
| bulkEmailSend | crm/bulk.email.send | Fan-out emails (50/min) |
| bulkLeadUpdate | crm/bulk.lead.update | Batch update leads (debounce 10s) |
| refreshMaterializedViews | Cron */5 | Refresh 5 vues materialisees |
| processQueueJob | Cron */2 | Drain graceful degradation queue |
| businessMetricsCheck | Cron horaire | Detection anomalies business |
| webhookRetry | crm/webhook.received | Retry webhooks echoues |

---

## 9. RESILIENCE & PERFORMANCE

### 9.1 Circuit Breaker (circuit-breaker.ts)
- **States** : CLOSED → OPEN (5 failures) → HALF_OPEN (30s) → CLOSED
- **Pre-configure** : Stripe (5 fails, 60s reset), Resend (3 fails, 45s reset)
- **Retry** : Exponential backoff + jitter (3 tentatives, 1-30s)

### 9.2 Cache multi-couche (cache.ts)
- **L1** : Upstash Redis (distribue)
- **L2** : In-memory process (max 500 entries)
- **Patterns** : SWR (stale-while-revalidate), tag invalidation, pattern invalidation
- **TTLs** : Static 1h, Dashboard 5min, List 2min, Detail 5min

### 9.3 Graceful degradation (graceful-degradation.ts)
- **Queue fallback** : Supabase → Inngest → In-memory (max 1000 ops)
- **Stripe degrade** : Queue paiement si Stripe down
- **Email degrade** : Queue email si Resend down

### 9.4 Logging (logger.ts — 433 lignes)
- **JSON structure** pour Sentry/Vercel/Datadog
- **Correlation IDs** pour tracage cross-services
- **PII sanitization** : masque emails, telephones, tokens
- **Performance budgets** : API 3s, Dashboard 5s, DB 1s, Email 5s, Stripe 10s

---

## 10. COMPOSANTS UI (31 fichiers)

### Primitifs (11)
Button (6 variants), Input (SearchInput), Card (compound), Badge (8 variants + StatusBadge), Avatar (AvatarGroup), Tabs (3 variants), Dialog (4 sizes), Sheet (side drawer), Tooltip, Skeleton (4 patterns), ProgressBar

### Metier (9)
KpiCard, EmptyState, PageHeader, ActivityTimeline, CommandPalette (fuzzy search, leads recents, raccourcis), KeyboardShortcuts (G+key), MobileBottomNav, AIAssistant (4 modes), Breadcrumbs

### Interaction (3)
QRCodeGenerator, SignatureCanvas (high-DPI, touch), Turnstile (CAPTCHA)

### Marketing/Conversion (8)
SocialProofToast, CountdownBanner, BeforeAfterSlider, StickyBottomBar, TrustBar, WhatsAppButton, ROICalculator, ExitIntentPopup, OnboardingChecklist

### Design system
- Primary: #2EC6F3 (cyan Dermotec)
- Accent: #082545 (bleu nuit sidebar)
- Fonts: Bricolage Grotesque (headings), DM Sans (body)
- Touch targets: minimum 44x44px
- Hover: CSS Tailwind (jamais onMouseEnter JS)
- Focus: outline-2 offset-2 cyan

---

## 11. PAGES — ETAT DETAILLE

### Dashboard (19 pages)
| Page | Statut | Notes |
|------|--------|-------|
| Dashboard Home | Fonctionnel | 5 KPIs, rappels, sessions, leads recents |
| Cockpit | Fonctionnel | Smart actions par priorite |
| Leads | Fonctionnel | Recherche, filtres, pagination 20/page |
| Lead Detail | Fonctionnel | 5 tabs, 940 lignes, breadcrumbs |
| Pipeline | Fonctionnel | Kanban DnD, 7 phases, toasts statut |
| Sessions | Fonctionnel | Calendrier mensuel, places progress |
| Session Detail | Fonctionnel | 5 tabs, presence J1-J5, breadcrumbs |
| Stagiaires | Fonctionnel | Satisfaction, certificats |
| Financement | Fonctionnel | KPIs, 10 statuts colores |
| Cadences | Fonctionnel | Templates + instances |
| Messages | Fonctionnel | 3 panels, 5 canaux |
| Qualite | Fonctionnel | Score /100, 7 criteres, reclamations |
| Commandes | Fonctionnel | Tracking modal, 6 transporteurs |
| Equipe | Fonctionnel | Cards, toggle actif |
| Settings | Fonctionnel | Export CSV/JSON, stats DB |
| Analytics | INCOMPLET | KPIs OK, graphiques Recharts = placeholder |
| Playbook | Fonctionnel | Votes, IA suggestions |
| Layout | Fonctionnel | Sidebar, notifications, raccourcis |
| Template | Fonctionnel | Force dynamic (evite SSG crash) |

### Publiques (8 pages)
| Page | Statut |
|------|--------|
| Login | Fonctionnel (password + magic link) |
| Inscription multi-step | Fonctionnel (financement, Zod) |
| Inscription success | Fonctionnel (recap, social proof) |
| Inscription cancel | Fonctionnel (relance, FAQ) |
| Inscription express | Fonctionnel (1x/3x/4x) |
| Portail stagiaire | Fonctionnel (token-based) |
| Emargement | Fonctionnel (QR + signature) |
| Auth callback | Fonctionnel |

---

## 12. TESTS

### Etat actuel
- **Framework** : Vitest 4.1.0 + happy-dom + MSW
- **8 fichiers de test** :
  - validators.test.ts — Validateurs + state machines
  - scoring.test.ts — Scoring heuristique
  - smart-actions.test.ts — Actions proactives
  - state-machines.test.ts — Transitions etats
  - utils.test.ts — Formatters, helpers
  - disposable-emails.test.ts — Blocklist
  - marketing.test.ts — Referral, upsell, eligibilite
  - result.test.ts — Result type + error hierarchy

### Tests manquants (critiques)
- Tests E2E (Playwright) : 0
- Tests API routes : 0
- Tests hooks React Query : 0
- Tests composants UI : 0
- Tests integration Stripe : 0
- Tests DDD use cases : 0

---

## 13. BUILD & DEPLOIEMENT

### Etat du build
- `ignoreBuildErrors: true` (TypeScript)
- `ignoreDuringBuilds: true` (ESLint)
- **1 erreur TS** : analytics/page.tsx:192 (type Recharts)
- **Bug /404** : conflit catch-all Hono [[...route]] avec not-found.tsx
- **Sentry** : desactive (fichiers .bak)
- **47 fichiers non commites** (features, architecture, composants)

### Variables d'environnement (33)
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL
DEEPSEEK_API_KEY (ou ANTHROPIC_API_KEY), PERPLEXITY_API_KEY, TAVILY_API_KEY
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_WHATSAPP_NUMBER
WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TOKEN
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY
SENTRY_DSN, NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY
VIRUSTOTAL_API_KEY, INSEE_API_KEY, TELNYX_API_KEY, TELNYX_FROM_NUMBER
PII_ENCRYPTION_KEY, DEFAULT_ORG_ID, CRON_SECRET
NODE_ENV, NEXT_RUNTIME
```

### Pas de .env.example
Aucun fichier de documentation des variables d'env.

---

## 14. STATE MACHINES (4 machines)

### Lead (11 statuts)
```
NOUVEAU → CONTACTE | QUALIFIE | PERDU | SPAM
CONTACTE → QUALIFIE | FINANCEMENT_EN_COURS | PERDU | REPORTE | SPAM
QUALIFIE → FINANCEMENT_EN_COURS | INSCRIT | PERDU | REPORTE
FINANCEMENT_EN_COURS → INSCRIT | PERDU | REPORTE | QUALIFIE
INSCRIT → EN_FORMATION | PERDU | REPORTE
EN_FORMATION → FORME | PERDU
FORME → ALUMNI | PERDU
ALUMNI → QUALIFIE (re-inscription)
PERDU → NOUVEAU | CONTACTE (reactivation)
REPORTE → CONTACTE | QUALIFIE | PERDU
SPAM → (terminal)
```

### Financement (10 statuts)
```
PREPARATION → DOCUMENTS_REQUIS | DOSSIER_COMPLET
DOCUMENTS_REQUIS → DOSSIER_COMPLET | PREPARATION
DOSSIER_COMPLET → SOUMIS
SOUMIS → EN_EXAMEN | VALIDE | REFUSE
EN_EXAMEN → COMPLEMENT_DEMANDE | VALIDE | REFUSE
COMPLEMENT_DEMANDE → EN_EXAMEN | DOSSIER_COMPLET | REFUSE
VALIDE → VERSE | CLOTURE
REFUSE → PREPARATION | CLOTURE
VERSE → CLOTURE
CLOTURE → (terminal)
```

### Session (7 statuts)
```
BROUILLON → PLANIFIEE | ANNULEE
PLANIFIEE → CONFIRMEE | ANNULEE | REPORTEE
CONFIRMEE → EN_COURS | ANNULEE | REPORTEE
EN_COURS → TERMINEE | ANNULEE
TERMINEE → (terminal)
ANNULEE → BROUILLON
REPORTEE → PLANIFIEE | ANNULEE
```

### Inscription (7 statuts)
```
EN_ATTENTE → CONFIRMEE | ANNULEE
CONFIRMEE → EN_COURS | ANNULEE
EN_COURS → COMPLETEE | ANNULEE | NO_SHOW
COMPLETEE → REMBOURSEE
ANNULEE → EN_ATTENTE
REMBOURSEE → (terminal)
NO_SHOW → ANNULEE
```

---

## 15. PROBLEMES IDENTIFIES & RECOMMANDATIONS

### P0 — Bloquant production
1. Build avec `ignoreBuildErrors: true` masque les erreurs
2. Bug /404 avec catch-all Hono
3. 47 fichiers non commites (risque perte)
4. 0 tests E2E / API / integration
5. Sentry desactive

### P1 — Securite
1. Chiffrement PII = XOR (remplacer par AES-256-GCM)
2. Validation signature convention incomplète
3. uploaded_by: null dans documents/upload
4. Pas de .env.example (documentation secrets)
5. Messages erreur API exposent info business

### P2 — Architecture
1. DDD implemente uniquement pour Leads (6 domaines vides)
2. Frontend appelle Supabase directement (pas les API)
3. Routes legacy coexistent avec routes DDD
4. Analytics : graphiques Recharts = placeholder

### P3 — UX
1. Dialogs creation implementes mais pas connectes partout
2. Export leads : bouton non fonctionnel
3. Messages : boutons action non implementes
4. Bulk actions : pas de selection multiple

---

## 16. PATTERNS ARCHITECTURAUX UTILISES

1. **Hexagonal Architecture** — Domain isole de l'infrastructure
2. **DDD Aggregates** — LeadAggregate enforce invariants et emet events
3. **Result Type** — Railway-oriented, jamais throw en logique metier
4. **Event Sourcing Lite** — Domain publie events → Inngest async
5. **CQRS** — LeadReadModel (SELECT) separe des repositories (write)
6. **Value Objects** — Email, PhoneFR, Money — validation a la construction
7. **Circuit Breaker** — CLOSED/OPEN/HALF_OPEN avec retry backoff
8. **Graceful Degradation** — Queue fallback multi-niveau
9. **Cache SWR** — Stale-while-revalidate multi-layer
10. **Fan-out** — Inngest batch operations (50/min throttle)
11. **Debounce** — Bulk updates (10s window)
12. **Audit Hash Chain** — SHA-256 tamper-proof trail
13. **RLS Role-based** — Supabase policies par role equipe
14. **Lazy Init** — Singletons pour services externes
15. **Serverless DI** — Container per-request sans framework
