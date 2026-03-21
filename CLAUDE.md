# CRM DERMOTEC — Centre de Formation Esthétique

## Langue et style
- Répondre en français sauf code/technique
- Aller droit au but. Agir.
- Ne jamais rester bloqué. Si un chemin échoue, essayer une alternative immédiatement.

## Projet en 30 secondes

**Marque** : Dermotec Advanced
**Activité** : Centre de formation esthétique certifié Qualiopi + Distributeur NPM France
**Cible** : Esthéticiennes, reconversions pro, gérantes institut
**Lieu** : 75 Bd Richard Lenoir, Paris 11e
**Formations** : 11 formations (400€-2500€ HT), 4 catégories
**Stack** : Next.js 15 + React 19 + Supabase + Stripe + Resend + Tailwind v4
**Supabase** : `https://wtbrdxijvtelluwfmgsf.supabase.co`
**Stripe** : `acct_1RpvbQ1NzDARltfq` (11 produits + prix créés, mode sandbox)

## Avancement global : ~85% fonctionnel

| Pilier | Pages | API | Hooks | Statut |
|--------|-------|-----|-------|--------|
| 1. Leads & Pipeline | 3 (liste, detail, kanban) | 8 (CRUD, IA, scoring) | use-leads, use-ai | Complet |
| 2. Financement | 1 | — | use-financements | Complet |
| 3. Sessions & Planning | 2 (liste, detail) | 2 (auto-transition, emargement) | use-sessions, use-emargement | Complet |
| 4. Suivi Stagiaires | 1 + portail public | 2 (portail, convention) | — | Complet |
| 5. E-Shop & Commandes | 1 | 2 (Stripe webhook, inscription) | — | Complet |
| 6. Analytics & Qualité | 2 | 1 (dashboard) | use-qualiopi, use-analytics | Analytics incomplet |

**Pages transverses** : Cockpit, Cadences, Messages, Équipe, Settings, Playbook = tous fonctionnels

## 6 Piliers CRM

1. **Leads & Pipeline** — Capture multicanal → Kanban (11 statuts) → Scoring IA
2. **Financement** — Dossiers OPCO/France Travail/CPF (12 organismes, state machine)
3. **Sessions & Planning** — Calendrier, formatrices, modèles, matériel, émargement QR
4. **Suivi Stagiaires** — Présence J1-J5, évaluation, certificats, portail token, alumni
5. **E-Shop & Commandes** — Matériel NPM, Stripe checkout, tracking 6 transporteurs
6. **Analytics & Qualité** — CA, conversion, Qualiopi (7 critères, 32 indicateurs)

## DB : 22 tables Supabase + 13 migrations

**Core** : leads · formations · sessions · inscriptions · financements · factures · rappels · activites · documents · commandes · equipe · modeles · notes_lead · email_templates · qualite · partenaires · cadence_templates · cadence_instances
**Audit** : field_history · login_logs · smart_actions · anomalies
**Triggers** : updated_at (toutes tables), track_field_changes (leads, inscriptions, financements, sessions, factures, commandes → field_history)
**RLS** : Activé toutes tables. authenticated = full access, anon = insert leads + read formations

## Architecture technique complète

```
src/
├── app/
│   ├── (auth)/               # Login (password/magic link), callback OAuth
│   ├── (dashboard)/          # 19 pages dashboard (layout + template force-dynamic)
│   │   ├── page.tsx           # Home: 5 KPIs, rappels, sessions, leads récents
│   │   ├── cockpit/           # Smart actions par priorité, rappels jour
│   │   ├── leads/             # Recherche, filtres, pagination 20/page
│   │   ├── lead/[id]/         # 5 tabs, 913 lignes, communication multi-canal
│   │   ├── pipeline/          # Kanban drag-and-drop (dnd-kit), 7 phases, CA
│   │   ├── sessions/          # Calendrier mensuel, cards formatrice
│   │   ├── session/[id]/      # 5 tabs (Info, Inscrits, Modèles, Checklist, Notes)
│   │   ├── stagiaires/        # Stats, filtres, satisfaction, certificats
│   │   ├── financement/       # KPIs, dossiers, 10 statuts colorés
│   │   ├── cadences/          # Templates expandables, instances actives
│   │   ├── messages/          # 3 panels, 5 canaux, compose multi-canal
│   │   ├── qualite/           # Score /100, 7 critères Qualiopi, réclamations
│   │   ├── commandes/         # KPIs, tracking modal, 6 transporteurs
│   │   ├── equipe/            # Cards grid, toggle actif, spécialités
│   │   ├── settings/          # 4 sections, export, stats DB, intégrations
│   │   ├── analytics/         # KPIs OK, graphiques Recharts = placeholder
│   │   └── playbook/          # Intelligence collective, votes, IA suggestions
│   ├── api/                   # 23 endpoints Next.js + 6 endpoints Hono
│   │   ├── ai/                # 6 routes IA (score, generate, research, objection, agent, playbook)
│   │   ├── analytics/         # Dashboard metrics (7 requêtes SQL parallèles)
│   │   ├── cadence/run/       # Moteur cron cadences (CRON_SECRET)
│   │   ├── email/send/        # Resend + templates DB
│   │   ├── messages/          # GET/POST inbox + envoi multi-canal
│   │   ├── emargement/        # Signature présence
│   │   ├── documents/upload/  # Upload + MIME check + VirusTotal optionnel
│   │   ├── stripe/webhook/    # Idempotent (webhook_events table), 5 event types
│   │   ├── webhook/formulaire/# Public, honeypot, disposable email blocklist
│   │   ├── sessions/auto-transition/ # Cron auto CONFIRMEE→EN_COURS→TERMINEE
│   │   ├── portail/[token]/   # Token-based, sign convention
│   │   ├── inscription-express/ # Form minimal → Stripe checkout
│   │   ├── health/            # Health check toutes dépendances
│   │   ├── inngest/           # SDK v4 endpoint
│   │   ├── gdpr/              # Export + Delete (admin/manager)
│   │   └── [[...route]]/      # Catch-all Hono (API versionnées, Swagger)
│   ├── inscription/           # Pages publiques (form, success, cancel)
│   ├── inscription-express/   # Inscription rapide publique
│   ├── portail/[token]/       # Portail stagiaire public
│   ├── emargement/            # Émargement QR public
│   ├── error.tsx              # Error boundary → Sentry
│   ├── not-found.tsx          # 404
│   └── global-error.tsx       # Global error → Sentry
├── components/ui/             # 31 composants (11 primitifs + 9 métier + 11 marketing)
├── hooks/                     # 13 hooks React Query v5 + Supabase
├── lib/                       # 36 fichiers (~5000 lignes)
│   ├── ai.ts                  # Moteur IA multi-provider (DeepSeek>Mistral>OpenAI, 6 fonctions)
│   ├── validators.ts          # 14 validateurs + 4 state machines + sanitization
│   ├── scoring.ts             # Scoring heuristique /100 (5 composantes)
│   ├── smart-actions.ts       # 6 types suggestions proactives
│   ├── constants.ts           # Branding, 11 formations, TVA, délais
│   ├── marketing.ts           # Referral, upsell, NPS, best contact time
│   ├── cadence-engine.ts      # 4 cadences prédéfinies, scheduling
│   ├── playbook.ts            # Playbook collaboratif + onboarding
│   ├── stripe.ts              # Checkout, schedules, payment links
│   ├── stripe-products.ts     # 11 formations → Stripe product_id/price_id
│   ├── email.ts               # Resend, 5 templates inline
│   ├── twilio.ts              # SMS + WhatsApp (HTTP direct)
│   ├── cache.ts               # Multi-layer (L2 memory + L1 Redis), SWR
│   ├── logger.ts              # JSON structured, correlation IDs, perf budgets
│   ├── result.ts              # Result<T,E> Rust-inspired, 12 error classes
│   ├── circuit-breaker.ts     # CLOSED/OPEN/HALF_OPEN, retry backoff+jitter
│   ├── graceful-degradation.ts# Queue fallback (Supabase→Inngest→memory)
│   ├── inngest.ts             # 7 event types, SDK v4
│   ├── upstash.ts             # Rate limiting + cache-aside
│   ├── rbac.ts                # 5 rôles × 24 permissions
│   ├── activity-logger.ts     # Audit trail non-bloquant
│   ├── api-key-auth.ts        # API keys dmtc_live_* + SHA-256
│   ├── supabase-client.ts     # Browser client (fallback SSG)
│   ├── supabase-server.ts     # Server + service role
│   ├── pdf/                   # 5 templates PDF (convocation, attestations, émargement, BPF)
│   └── utils.ts               # Formatters, helpers
├── server/                    # Architecture DDD (Hexagonale)
│   ├── domain/
│   │   ├── leads/lead.aggregate.ts  # State machine, domain events, jamais throw
│   │   └── shared/            # Value Objects, Result, DomainEvents, Repository interfaces
│   ├── application/use-cases/
│   │   └── leads/             # 4 use cases (create, status, assign, qualify)
│   ├── infrastructure/
│   │   ├── container.ts       # DI sans framework (per-request)
│   │   ├── repositories/      # Supabase implementations (lead, activity)
│   │   ├── events/            # InngestEventBus + ConsoleEventBus
│   │   └── queries/           # CQRS LeadReadModel
│   ├── middleware/            # Auth, rate-limit, sentry, tenant
│   └── routes/                # Hono: legacy + v1 (OpenAPI)
├── inngest/                   # Background jobs (bulk email/update, crons, metrics)
├── types/index.ts             # 877 lignes, 18 enums, 19 interfaces
└── middleware.ts              # CSP nonce-based, HSTS, rate limiting, auth
```

## Stack complète

### Core
- Next.js 15 + React 19 + TypeScript strict
- Supabase (Postgres + Auth + RLS + Storage + Realtime)
- Stripe (paiements formations + e-shop)
- Resend (emails transactionnels)
- Tailwind v4 + framer-motion + sonner

### Backend
- Hono 4.12 + @hono/zod-openapi (API versionnées, Swagger UI /api/swagger)
- Inngest v4 (queue async, crons, fan-out, debounce)
- Upstash Redis (rate limiting distribué + cache)
- Sentry (monitoring erreurs — actuellement désactivé, fichiers .bak)

### Frontend
- React Query v5 (data fetching + mutations)
- Zustand (global state)
- react-hook-form + Zod (formulaires)
- Recharts (graphiques — pas encore utilisé)
- dnd-kit (drag-and-drop pipeline)
- Lucide React (icônes)

### IA
- DeepSeek > Mistral > OpenAI (fallback chain, OpenAI-compatible)
- Perplexity Sonar / Tavily (recherche prospect)
- 6 fonctions métier : scoring, email, research, objection, summary, financement

### Communication multi-canal
- Resend : emails transactionnels (5 templates)
- Twilio : SMS + WhatsApp (HTTP direct, pas SDK)
- 4 cadences automatiques : Nouveau Lead, Post-Formation, Relance Financement, Abandon

## Commandes

```bash
npm run dev              # Dev local (http://localhost:3000)
npm run build            # Build production
npm run lint             # ESLint
npm run format           # Prettier
npm run type-check       # Vérifier les types TypeScript
npm run test             # Vitest
npm run stripe:listen    # Webhooks Stripe local
npm run db:types         # Regénérer types Supabase
npm run db:migrate       # Supabase push
npm run db:reset         # Reset DB
npm run inngest:dev      # Dev Inngest
npm run analyze          # Bundle analyzer
```

## Sécurité implémentée

- ✅ Middleware : CSP nonce-based (pas unsafe-inline), HSTS preload, rate limiting
- ✅ next.config.ts : poweredByHeader false, security headers, COEP
- ✅ API : validation zod, honeypot, sanitization, disposable email blocklist (85 domaines)
- ✅ Supabase : RLS toutes tables, service role server-only, field_history audit trail
- ✅ Stripe : signature verification webhook, idempotence via webhook_events table
- ✅ Auth : Supabase Auth, redirect non-connectés, RBAC 5 rôles × 24 permissions
- ✅ Documents : MIME validation, taille max 10MB, extensions bloquées, VirusTotal optionnel
- ✅ Resilience : circuit breaker, graceful degradation, retry backoff+jitter

## State machines (validators.ts)

- **Lead** : NOUVEAU → CONTACTE → QUALIFIE → FINANCEMENT_EN_COURS → INSCRIT → EN_FORMATION → FORME → ALUMNI (+ PERDU, REPORTE, SPAM)
- **Financement** : PREPARATION → DOCUMENTS_REQUIS → DOSSIER_COMPLET → SOUMIS → EN_EXAMEN → COMPLEMENT_DEMANDE → VALIDE/REFUSE → VERSE → CLOTURE
- **Session** : BROUILLON → PLANIFIEE → CONFIRMEE → EN_COURS → TERMINEE (+ ANNULEE, REPORTEE)
- **Inscription** : EN_ATTENTE → CONFIRMEE → EN_COURS → COMPLETEE (+ ANNULEE, REMBOURSEE, ABANDONNEE)

## Architecture DDD (src/server/)

### Implémenté (Leads uniquement)
- **Domain** : LeadAggregate (state machine, value objects Email/PhoneFR/Money, domain events)
- **Application** : 4 use cases (create-lead, change-status, assign, qualify)
- **Infrastructure** : SupabaseLeadRepository, SupabaseActivityRepository, InngestEventBus
- **CQRS** : LeadReadModel (listForUI, getDetail, getPipeline, getDashboardMetrics)
- **DI** : Container per-request (createContainer, createServiceContainer, createTestContainer)

### Non implémenté (domaines vides)
- communications/, facturation/, financements/, inscriptions/, sessions/, qualite/
- Pas de use cases pour ces domaines
- Routes legacy query Supabase directement (à migrer vers use cases)

## IA & Prospection Intelligente

### 6 fonctions IA métier (lib/ai.ts)
1. `aiScoreLead()` — Scoring prédictif (0-100, segment, urgence, next action)
2. `aiGenerateEmail()` — Email + WhatsApp personnalisés (6 types)
3. `aiResearchProspect()` — Recherche enrichie Perplexity/Tavily + analyse
4. `aiHandleObjection()` — Réponse + rebond (court + détaillé)
5. `aiSummarizeNotes()` — Résumé + sentiment
6. `aiAnalyseFinancement()` — Recommande 3-5 organismes + éligibilité %

### Prompts adaptés marché français
- Contexte Dermotec injecté (11 formations, prix, financements)
- Connaissance organismes FR (OPCO EP, FAFCEA, FIFPL, France Travail, CPF)
- Arguments : Qualiopi = éligible financement, ROI rapide, groupes 6 max
- Meilleurs créneaux : mardi/jeudi matin
- WhatsApp > email pour relances (95% vs 20% d'ouverture)

### APIs externes
| Service | Usage | Coût |
|---------|-------|------|
| DeepSeek | Scoring, génération, objections | ~$0.55/1M tokens |
| Perplexity Sonar | Recherche prospect | $5/1000 queries |
| Tavily | Alternative recherche | Gratuit 1000/mois |
| Twilio | SMS + WhatsApp | ~$0.04/SMS, ~$0.005/WhatsApp |
| Resend | Emails transactionnels | Gratuit 100/jour |
| Stripe | Paiements formations + e-shop | 1.4% + 0.25€ |

## Features incomplètes connues

### Code
- **Analytics** : graphiques Recharts = placeholder "Bientôt", pipeline bars = 0
- **Dialogs manquants** : nouvelle session, ajouter inscription, ajouter membre équipe
- **Export leads** : bouton existe mais non fonctionnel
- **Messages actions** : boutons appel/email/WhatsApp non implémentés
- **PDFs** : numéro déclaration activité = placeholder `11755XXX075`
- **Cadences** : métrique MCC TODO dans cadences/page.tsx:358

### Sécurité
- Chiffrement PII = XOR basique (api-key-auth.ts) — nécessite AES-256-GCM
- documents/upload : uploaded_by: null (ligne 142)
- portail/sign-convention : validation format PNG incomplète

### Build
- `ignoreBuildErrors: true` dans next.config.ts
- Bug /404 avec catch-all Hono [[...route]]
- 0 tests écrits (Vitest configuré, 1 test result.test.ts)
- Sentry désactivé (fichiers .bak)
- 55 fichiers non commités

## Règles absolues

1. JAMAIS commiter .env.local ni .env.vercel
2. TOUJOURS valider côté serveur (API routes) avec zod
3. TOUJOURS logger les activités (activity-logger.ts)
4. TOUJOURS vérifier auth dans les API routes
5. TOUJOURS utiliser les state machines pour les transitions de statut
6. TOUJOURS passer par use cases DDD pour la logique métier (pas de query Supabase dans les routes)
7. Branding : #2EC6F3 primary, #082545 accent, DM Sans + Bricolage Grotesque
8. CSS hover (Tailwind), jamais JS onMouseEnter/onMouseLeave
9. Touch targets minimum 44x44px sur mobile
10. Lazy init pour services externes — silent fallback si env var manquante
11. Async via Inngest (jamais de traitement lourd synchrone dans les API routes)
12. Result<T,E> pour la logique métier (jamais throw dans domain/application)
