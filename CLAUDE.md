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
│   ├── api/             # 3 API routes (webhook, stripe, email)
│   ├── error.tsx        # Error boundary
│   ├── not-found.tsx    # 404
│   └── global-error.tsx # Global error
├── components/ui/       # Composants réutilisables
├── hooks/               # React Query hooks (6 hooks)
├── lib/
│   ├── constants.ts     # Branding, formations, config
│   ├── validators.ts    # 11 validateurs + 4 state machines
│   ├── scoring.ts       # Algorithme scoring lead (/100)
│   ├── smart-actions.ts # Moteur suggestions proactives
│   ├── rbac.ts          # Matrice permissions (5 rôles × 30 permissions)
│   ├── email.ts         # Service Resend (lazy init, templates inline)
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

## Règles absolues

1. JAMAIS commiter .env.local
2. TOUJOURS valider côté serveur (API routes) avec zod
3. TOUJOURS logger les activités (activity-logger.ts)
4. TOUJOURS vérifier auth dans les API routes
5. TOUJOURS utiliser les state machines pour les transitions de statut
6. Branding : #2EC6F3 primary, #082545 accent, DM Sans + Bricolage Grotesque
7. CSS hover (Tailwind), jamais JS onMouseEnter/onMouseLeave
8. Touch targets minimum 44x44px sur mobile
