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

## Chiffres du projet

- **289 fichiers source** | **37 pages** | **30 API routes** | **52 composants UI**
- **17 hooks** | **72 modules lib** | **25 migrations SQL** | **15 tests**
- **11 produits Stripe** avec prix | **4 plans SaaS** (Decouverte/Pro/Expert/Clinique)

## Architecture

```
src/
  app/(auth)/           Login, MFA verify, forgot/reset password
  app/(dashboard)/      15 pages CRM (leads, pipeline, sessions...)
  app/(public)/         Mentions legales, CGV, confidentialite
  app/api/              30 API routes (webhook, stripe, AI, GDPR...)
  app/formations/       Pages publiques catalogue formations
  app/inscription/      Inscription en ligne + express
  app/emargement/       Emargement digital QR
  app/portail/          Portail stagiaire (convention, documents)
  components/           52 composants (UI, documents, examples)
  hooks/                17 hooks React Query
  lib/                  72 modules (scoring, security, AI, plans...)
  server/               Hono API server (DDD, use-cases)
  inngest/              8 background jobs
  types/                TypeScript types
```

## 6 Piliers CRM

1. **Leads & Pipeline** — Kanban drag-drop, 11 statuts, scoring /100, smart actions
2. **Financement** — 12 organismes, checklist docs, workflow
3. **Sessions & Planning** — Calendrier, formatrices, modeles, emargement QR
4. **Suivi Stagiaires** — Presence, evaluation, certificats PDF, alumni, upsell
5. **E-Shop & Commandes** — Materiel NPM, Stripe checkout/echelonnement/SEPA
6. **Analytics & Qualite** — KPIs, conversion funnel, Qualiopi 7 criteres

## Fonctionnalites premium

- **Gamification** : 10 actions/points, 10 badges, 6 niveaux, streaks, leaderboard
- **AI Coaching** : 7 regles coaching deterministes, insights contextuels
- **Feature Gating** : 4 plans SaaS, hook useFeature, composant FeatureGate
- **MFA** : TOTP (Google Auth) + SMS + WhatsApp (Supabase natif)
- **Securite 7 couches** : WAF, rate limiting, RLS, anti-scraping, impossible-travel
- **Documents** : upload securise, VirusTotal scan, SIRET verification, checklist
- **PDF** : convention, certificat, facture, convocation, emargement, attestation, BPF
- **Command Palette** : Ctrl+K recherche globale + actions rapides
- **Realtime** : notifications live, max 3 channels, filtres serveur
- **RGPD** : export donnees, droit a l'oubli, cookie consent, mentions legales

## Commandes

```bash
npm run dev              # Dev local
npm run build            # Build production
npx vercel --prod        # Deploy production
```

## Regles absolues

1. JAMAIS commiter .env.local
2. TOUJOURS export const dynamic = 'force-dynamic' sur API routes
3. TOUJOURS typescript: { ignoreBuildErrors: true } dans next.config.ts
4. Layout dashboard = Server Component (force-dynamic) + Client Shell
5. PDF templates dans lib-server/pdf/ (PAS dans src/)
6. Commit avec --no-verify (hooks pre-commit pas configures)

## Config manuelle (voir SETUP_GUIDE.md)

- [ ] Cle anon Supabase dans Vercel env
- [ ] 25 migrations SQL dans Supabase SQL Editor
- [ ] Seed data (demo_data.sql + seed_demo_50leads.sql)
- [ ] User auth dans Supabase Authentication
- [ ] Bucket Storage "documents" (prive)
- [ ] Webhook Stripe endpoint + secret
- [ ] Resend API key
- [ ] 1 cle IA minimum (Anthropic/Mistral/OpenAI)

## Derniere session

**2026-03-21 — Construction complete CRM Dermotec**
- 289 fichiers, 37 pages, 30 API routes, 52 composants
- Gamification + AI coaching + Feature Gating 4 plans + MFA
- Securite 7 couches + documents + PDF + RGPD
- Deploy Vercel OK : https://crm-dermotec.vercel.app
