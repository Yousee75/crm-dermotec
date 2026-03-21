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
**Stripe** : `acct_1RpvbQ1NzDARltfq` (11 produits + prix créés)

## 6 Piliers CRM

1. **Leads & Pipeline** — Capture multicanal → Kanban (11 statuts)
2. **Financement** — Dossiers OPCO/France Travail/CPF (12 organismes)
3. **Sessions & Planning** — Calendrier, formatrices, modèles, matériel
4. **Suivi Stagiaires** — Présence, évaluation, certificats, alumni
5. **E-Shop & Commandes** — Matériel NPM, Stripe, livraison
6. **Analytics & Qualité** — CA, conversion, Qualiopi (7 critères, 32 indicateurs)

## DB : 22 tables Supabase

**Core** : leads · formations · sessions · inscriptions · financements · factures · rappels · activites · documents · commandes · equipe · modeles · notes_lead · email_templates · qualite · partenaires · cadence_templates · cadence_instances
**Audit** : field_history · login_logs · smart_actions · anomalies

## Architecture technique

```
src/
├── app/
│   ├── (auth)/          # Login, callback
│   ├── (dashboard)/     # 13 pages dashboard
│   ├── api/
│   │   ├── ai/score/         # Scoring IA prédictif (DeepSeek)
│   │   ├── ai/generate/      # Génération emails/messages IA
│   │   ├── ai/prospect-research/ # Recherche prospect (Perplexity/Tavily)
│   │   ├── ai/objection/     # Objection handling temps réel
│   │   ├── analytics/dashboard/ # Métriques temps réel (6 vues SQL)
│   │   ├── cadence/run/      # Moteur cadences automatiques (cron)
│   │   ├── email/send/       # Email transactionnel (Resend + templates DB)
│   │   ├── stripe/webhook/   # Webhook Stripe (paiements, litiges, remboursements)
│   │   └── webhook/formulaire/ # Webhook formulaire site public
│   ├── error.tsx        # Error boundary
│   ├── not-found.tsx    # 404
│   └── global-error.tsx # Global error
├── components/ui/
│   ├── AIAssistant.tsx  # Sidebar IA flottante (email, objection, recherche)
│   ├── ActivityTimeline.tsx # Timeline activités
│   └── CommandPalette.tsx # Cmd+K palette
├── hooks/
│   ├── use-leads.ts     # CRUD leads + filtres
│   ├── use-sessions.ts  # CRUD sessions
│   ├── use-reminders.ts # Rappels + overdue
│   ├── use-financements.ts # Dossiers financement
│   ├── use-realtime.ts  # Subscriptions Supabase
│   └── use-ai.ts        # Hooks IA (score, generate, research, objection)
├── lib/
│   ├── ai.ts            # Moteur IA (DeepSeek/Mistral/OpenAI, 6 fonctions métier)
│   ├── twilio.ts        # SMS + WhatsApp (lazy init, rappels, notifs)
│   ├── email.ts         # Service Resend (5 templates inline)
│   ├── constants.ts     # Branding, formations, config
│   ├── validators.ts    # 11 validateurs + 4 state machines + sanitization
│   ├── scoring.ts       # Algorithme scoring heuristique (/100)
│   ├── smart-actions.ts # Moteur suggestions proactives (6 types)
│   ├── rbac.ts          # Matrice permissions (5 rôles × 30 permissions)
│   ├── activity-logger.ts # Logger centralisé (non-bloquant)
│   ├── disposable-emails.ts # Blocklist 85 domaines
│   ├── marketing.ts     # NPS, referral, upsell, best contact time
│   ├── stripe.ts        # Checkout, payment schedule, payment link
│   ├── stripe-products.ts # 11 formations mappées Stripe
│   ├── pdf/             # Génération PDF (certificat, convention, facture)
│   ├── supabase-client.ts # Client browser
│   ├── supabase-server.ts # Client server + service role
│   └── utils.ts         # Formatters, helpers
├── types/index.ts       # Types complets (680+ lignes, 18 enums, 14 interfaces)
└── middleware.ts         # Auth + CSP + rate limiting + security headers
```

## Commandes

```bash
npm run dev              # Dev local (http://localhost:3000)
npm run build            # Build production
npm run stripe:listen    # Webhooks Stripe local
npm run db:types         # Regénérer types Supabase
npm run type-check       # Vérifier les types TypeScript
```

## Sécurité implémentée

- ✅ Middleware : CSP, HSTS, rate limiting (30/min pages, 10/min API)
- ✅ next.config.ts : poweredByHeader false, security headers, cache static
- ✅ API : validation zod, honeypot, sanitization, disposable email blocklist
- ✅ Supabase : RLS toutes tables, service role server-only
- ✅ Stripe : signature verification webhook, idempotence
- ✅ Auth : Supabase Auth, redirect non-connectés, RBAC 5 rôles

## State machines (validators.ts)

- **Lead** : NOUVEAU → CONTACTE → QUALIFIE → FINANCEMENT → INSCRIT → EN_FORMATION → FORME → ALUMNI
- **Financement** : PREPARATION → DOCUMENTS → COMPLET → SOUMIS → EN_EXAMEN → VALIDE/REFUSE → VERSE → CLOTURE
- **Session** : BROUILLON → PLANIFIEE → CONFIRMEE → EN_COURS → TERMINEE
- **Inscription** : EN_ATTENTE → CONFIRMEE → EN_COURS → COMPLETEE

## IA & Prospection Intelligente

### Architecture IA
- **lib/ai.ts** : Moteur multi-provider (DeepSeek > Mistral > OpenAI, OpenAI-compatible)
- **Coût estimé** : ~0.001€/scoring, ~0.003€/email, ~0.005€/recherche prospect
- **6 fonctions IA métier** :
  1. `aiScoreLead()` — Scoring prédictif (segment, probabilité, urgence, next action)
  2. `aiGenerateEmail()` — Génération email + variante WhatsApp personnalisés
  3. `aiResearchProspect()` — Recherche enrichie via Perplexity/Tavily + analyse IA
  4. `aiHandleObjection()` — Traitement objections en temps réel (réponse + rebond)
  5. `aiSummarizeNotes()` — Résumé intelligent des notes d'un dossier
  6. `aiAnalyseFinancement()` — Analyse options financement (OPCO, France Travail, CPF...)

### Prompts adaptés marché français
- Contexte Dermotec (11 formations, prix, financements) injecté dans chaque prompt
- Connaissance des organismes FR (OPCO EP, FAFCEA, FIFPL, France Travail, CPF)
- Arguments adaptés (Qualiopi = éligible financement, ROI rapide, groupes 6 max)
- Meilleurs créneaux d'appel : mardi/jeudi matin
- WhatsApp > email pour relances (95% vs 20% d'ouverture)

### Automatisation cadences
- **3 cadences pré-configurées** : Nouveau Lead (5 étapes), Post-Formation (4 étapes), Relance Financement (5 étapes)
- **Moteur cron** : `/api/cadence/run` exécute les étapes automatiquement (email, SMS, WhatsApp, création rappel)
- **Multi-canal** : Email (Resend) + SMS (Twilio) + WhatsApp (Twilio) + Rappels internes

### APIs externes
| Service | Usage | Coût |
|---------|-------|------|
| DeepSeek | Scoring, génération, objections | ~$0.55/1M tokens |
| Perplexity Sonar | Recherche prospect | $5/1000 queries |
| Tavily | Alternative recherche | Gratuit 1000/mois |
| Twilio | SMS + WhatsApp | ~$0.04/SMS, ~$0.005/WhatsApp |
| Resend | Emails transactionnels | Gratuit 100/jour |
| Stripe | Paiements formations + e-shop | 1.4% + 0.25€ |

## Règles absolues

1. JAMAIS commiter .env.local
2. TOUJOURS valider côté serveur (API routes) avec zod
3. TOUJOURS logger les activités (activity-logger.ts)
4. TOUJOURS vérifier auth dans les API routes
5. TOUJOURS utiliser les state machines pour les transitions de statut
6. Branding : #2EC6F3 primary, #082545 accent, DM Sans + Bricolage Grotesque
7. CSS hover (Tailwind), jamais JS onMouseEnter/onMouseLeave
8. Touch targets minimum 44x44px sur mobile
