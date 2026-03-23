# CRM DERMOTEC — Centre de Formation Esthétique

## Langue et style
- Répondre en français sauf code/technique
- Aller droit au but. Agir.

## Projet en 30 secondes

**Marque** : Dermotec Advanced | **Lieu** : 75 Bd Richard Lenoir, Paris 11e
**Activité** : Centre formation esthétique certifié Qualiopi + Distributeur NPM France
**Formations** : 11 formations (400-2500 EUR HT), 4 catégories
**Stack** : Next.js 15 + React 19 + Supabase + Stripe + Resend + Tailwind v4
**Déployé** : https://crm-dermotec.vercel.app
**GitHub** : https://github.com/Yousee75/crm-dermotec
**Supabase** : `wtbrdxijvtelluwfmgsf` | **Stripe** : `acct_1RpvbQ1NzDARltfq`

## Chiffres du projet (mis à jour 2026-03-23)

- **554 fichiers source** | **71 pages** | **63 API routes** | **136 composants**
- **27 hooks** | **141 modules lib** | **54 migrations SQL** | **20 tests**
- **15 jobs Inngest** | **30 fichiers DDD server**
- **11 produits Stripe** avec prix | **4 plans SaaS** (Decouverte/Pro/Expert/Clinique)

## Architecture

```
src/
  app/(auth)/           4 pages : login, forgot/reset password, MFA verify
  app/(dashboard)/      34 pages CRM (leads, pipeline, sessions, academy, cockpit...)
  app/(public)/         8 pages : accueil, aide, changelog, CGV, DPA, mentions, pricing...
  app/api/              38 API routes (webhook, stripe, AI, GDPR, inngest...)
  app/formations/       Catalogue formations + pages [slug]
  app/inscription/      Inscription en ligne (standard + express)
  app/emargement/       Emargement digital QR
  app/portail/          Portail stagiaire (convention, documents)
  app/nps/              Enquete satisfaction post-formation
  app/questionnaire/    Questionnaire evaluation stagiaire
  app/join/             Invitation equipe par token
  app/demo-feature-gating/  Demo feature gating
  components/           72 composants (56 UI, 9 academy, 3 documents, debug, examples)
  hooks/                20 hooks React Query
  lib/                  80 modules (scoring, score-360, pipeline-forecast, win-patterns, AI, plans, pdf...)
  server/               Hono API server DDD (domain, application, infrastructure, routes)
  inngest/              10 background jobs (cadences, rappels, emails, webhooks, bulk, proactive-agent...)
  types/                TypeScript types
```

### Dashboard — 34 pages

academy, analytics, apprenants, audit, bpf, cadences, catalogue, clients, cockpit, commandes, contacts, equipe, facturation, financement, gestion, inscriptions, leads, lead/[id], messages, notifications, onboarding, parametres, performance, pipeline, playbook, qualiopi, qualite, sessions, session/[id], session/[id]/emargement-live, settings, settings/privacy, settings/security, settings/subscription, stagiaires

### API — 38 routes

ai (agent, agent-v2, chat, commercial, generate, index-kb, objection, playbook-suggest, prospect-research, score), analytics (commerciaux, dashboard), automations/daily, cadence/run, documents/upload, email/send, emargement, enrichment, gdpr (delete, export), health, inngest, inscription-express, invitations (create, accept), messages, portail/[token] (info, sign-convention), questionnaires (list, [token]), sessions/auto-transition, soft-delete (delete, restore), stripe (payment-link, webhook), tracking, webhook/formulaire

### Server DDD

- **Leads** : domaine complet (aggregate, 5 use-cases, repository, read-model)
- **6 domaines vides** : communications, facturation, financements, inscriptions, sessions, qualite (structure en place, implementation a venir)

## 6 Piliers CRM

1. **Leads & Pipeline** — Kanban drag-drop, 11 statuts, scoring /100, smart actions
2. **Financement** — 12 organismes, checklist docs, workflow
3. **Sessions & Planning** — Calendrier, formatrices, modeles, emargement QR
4. **Suivi Stagiaires** — Presence, evaluation, certificats PDF, alumni, upsell
5. **E-Shop & Commandes** — Materiel NPM, Stripe checkout/echelonnement/SEPA
6. **Analytics & Qualite** — KPIs, conversion funnel, Qualiopi 7 criteres

## Fonctionnalites premium

- **Academy** : 9 composants, parcours formation, quiz, scripts, progression, streaks
- **Gamification** : 10 actions/points, 10 badges, 6 niveaux, streaks, leaderboard
- **AI Coaching** : 15 tools agent v3, coaching win-patterns, score 360°, forecast pipeline, dual-mode (commercial+formation), proactive agent Inngest
- **Feature Gating** : 4 plans SaaS, hook useFeature, composant FeatureGate
- **MFA** : TOTP (Google Auth) + SMS + WhatsApp (Supabase natif)
- **Securite 7 couches** : WAF, rate limiting, RLS, anti-scraping, impossible-travel, abuse-protection, prompt-guard
- **Documents** : upload securise, VirusTotal scan, SIRET verification, checklist
- **PDF** : attestation-assiduite, attestation-fin, BPF, convocation, feuille-emargement
- **Command Palette** : Ctrl+K recherche globale + actions rapides
- **Realtime** : notifications live, max 3 channels, filtres serveur
- **RGPD** : export donnees, droit a l'oubli, cookie consent, mentions legales, DPA
- **Soft Delete** : suppression douce avec restauration
- **Multi-tenant** : preparation multi-centres
- **NPS & Questionnaires** : satisfaction post-formation, evaluations stagiaires
- **Invitations equipe** : join par token, gestion membres

## Commandes

```bash
npm run dev              # Dev local
npm run build            # Build production
npx vercel --prod        # Deploy production
```

## Palette Satorea OFFICIELLE (SEULE référence autorisée)

**Source** : `satorea_light_options.html` — Option B "Blanc Chaud / Papier Premium"

| Rôle | Hex | Usage |
|------|-----|-------|
| **Orange** | `#FF5C00` | Primary, CTA, sidebar active, liens |
| **Orange clair** | `#FF8C42` | Hover, warning, badges |
| **Rose** | `#FF2D78` | Accent, action secondaire, beauté |
| **Rose clair** | `#FF6BA8` | Badges, hover rose |
| **Noir** | `#111111` | Texte, sidebar bg, titres |
| **Gris foncé** | `#222222` | Sidebar hover |
| **Gris moyen** | `#3A3A3A` | Texte secondaire |
| **Fond papier** | `#FAF8F5` | Background page |
| **Fond hover** | `#F4F0EB` | Surfaces hover |
| **Fond active** | `#EDE8E0` | Surfaces active |
| **Border** | `#EEEEEE` | Bordures |
| **Blanc** | `#FFFFFF` | Cards, surfaces |

**AUCUNE autre couleur n'est autorisée en production.** Pas de bleu, pas de violet, pas de cyan. Seuls les statuts sémantiques utilisent le vert (#10B981 success) et le rouge = rose (#FF2D78 error).

## Regles absolues

1. JAMAIS commiter .env.local
2. TOUJOURS export const dynamic = 'force-dynamic' sur API routes
3. TOUJOURS typescript: { ignoreBuildErrors: true } dans next.config.ts
4. Layout dashboard = Server Component (force-dynamic) + Client Shell
5. PDF templates dans lib/pdf/ (src/lib/pdf/)
6. Commit avec --no-verify (hooks pre-commit pas configures)
7. **PALETTE** : UNIQUEMENT les couleurs de satorea_light_options.html (voir ci-dessus)
8. **JAMAIS de dark: classes** dans les composants (pas de dark mode pour l'instant)

## Config manuelle (voir SETUP_GUIDE.md)

- [ ] Cle anon Supabase dans Vercel env
- [ ] 36 migrations SQL dans Supabase SQL Editor
- [ ] Seed data (demo_data.sql + seed_demo_50leads.sql)
- [ ] User auth dans Supabase Authentication
- [ ] Bucket Storage "documents" (prive)
- [ ] Webhook Stripe endpoint + secret
- [ ] Resend API key
- [ ] 1 cle IA minimum (Anthropic/Mistral/OpenAI)

## Derniere mise a jour

**2026-03-22 — Batch Gong/Klaviyo : Revenue Intelligence**
- Revenue Graph (MV unifiee lead 360°) + Pipeline Forecast (probabilites, velocity, CA 30/60/90j)
- Win Patterns (coaching IA depuis leads gagnes) + Lead Score 360° (4 axes : engagement, LTV, health, churn)
- Timeline omnicanale (7 canaux : email, SMS, WhatsApp, cadence, agent IA, portail, formation)
- Agent dual-mode (commercial + formation/Qualiopi) avec 15 tools
- Proactive Agent Inngest (cron L-V 8h : leads chauds, financements stagnants, sessions proches, recovery)
- 37 migrations SQL, 10 jobs Inngest, 80 libs
