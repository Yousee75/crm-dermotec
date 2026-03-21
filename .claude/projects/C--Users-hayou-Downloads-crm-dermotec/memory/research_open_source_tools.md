---
name: Projets Open Source pour CRM
description: Inventaire complet des projets open source (CRM, LMS, e-signature, scheduling, WhatsApp, facturation) avec compatibilite stack Next.js+Supabase
type: reference
---

# Projets Open Source - Mars 2026

## CRM COMPLETS (benchmarks architecture)

| Projet | Stars | Stack | Licence | Pertinence |
|--------|-------|-------|---------|------------|
| **Atomic CRM** | 865 | React+**Supabase**+shadcn/ui+RQ | MIT | **STACK EXACT** - reference #1 |
| **NextCRM** | 557 | **Next.js 16**+shadcn+Resend+Prisma+OpenAI | MIT | **STACK QUASI-IDENTIQUE** |
| **Twenty** | 40.6k | TypeScript+React+NestJS+PostgreSQL | AGPL | Reference CRM OS |
| Erxes | 3.9k | TypeScript+React+Next.js+MongoDB | AGPL | Multi-canal inbox |
| Krayin | 8.8k | PHP+Laravel+Vue+MySQL | MIT | WhatsApp extension |
| EspoCRM | 2.8k | PHP+MySQL/PostgreSQL | AGPL | Entity Manager no-code |
| NocoBase | 16k+ | TypeScript+React+PostgreSQL | AGPL | No-code platform |
| Monica | 24.4k | PHP+Laravel+Vue | AGPL | Personal CRM, reminders |
| Huly | 25.1k | TypeScript+Svelte+MongoDB | EPL-2.0 | CRM+HRM+PM |

## LMS / FORMATION

| Projet | Stars | Stack | Pertinence |
|--------|-------|-------|------------|
| **ClassroomIO** | 1.5k | Svelte+**Supabase**+Tailwind | **Utilise Supabase**, certificats, multi-formateur |
| **LearnHouse** | 1.3k | **Next.js**+**Stripe**+PostgreSQL | **Proche stack**, certificats auto, analytics |
| Frappe LMS | 2.7k | Python+Frappe | Logique LMS |
| Frappe Education | - | Python+ERPNext | Gestion inscriptions/frais |

## E-SIGNATURE

| Projet | Stars | Stack | Pertinence |
|--------|-------|-------|------------|
| **Documenso** | 12.5k | TypeScript+shadcn+**Stripe**+Tailwind | **Stack tres proche**, multi-signature, templates |
| **DocuSeal** | 11.6k | Ruby+Vue | Composants React embeddables, API REST |
| **OpenSign** | 6.1k | React+**Next.js**+MongoDB | **Utilise Next.js**, audit trail |

## SCHEDULING / CALENDRIER

| Projet | Stars | Stack | Pertinence |
|--------|-------|-------|------------|
| **Cal.com** | 40.6k | **Next.js**+tRPC+React+Tailwind+**Stripe** | **STACK QUASI-IDENTIQUE**, reference scheduling |
| react-big-calendar | 8k+ | React | Composant calendrier (day/week/month) |
| react-big-schedule | - | React+TypeScript | Scheduler ressources (salles, formatrices) |

## MESSAGING / WHATSAPP

| Projet | Stars | Stack | Pertinence |
|--------|-------|-------|------------|
| **Chatwoot** | 27.9k | Ruby+Vue | Inbox unifie (WhatsApp+email+social), Captain AI |
| **Evolution API** | 7.6k | **TypeScript** (98.7%) | API WhatsApp directe, **compatible stack** |

## MARKETING / FACTURATION / QUALITE

| Projet | Stars | Stack | Pertinence |
|--------|-------|-------|------------|
| Mautic | 9.3k | PHP+React | Lead scoring, campaigns, 200k+ orgs |
| **Invoify** | 6.2k | **Next.js+TypeScript+shadcn+Tailwind** | **STACK IDENTIQUE**, factures PDF |
| **Formbricks** | 10k+ | **Next.js**+TypeScript | Surveys qualite post-formation (Qualiopi) |
| @react-pdf/renderer | 15.9k | React | **Deja dans le stack**, PDF generation |
| react-email | 15k+ | React+TypeScript | **Deja dans le stack** (Resend) |

## UI TEMPLATES

| Projet | Stack | Usage |
|--------|-------|-------|
| shadcn-admin | React+shadcn+Tailwind | 10+ pages dashboard pre-construites |
| next-shadcn-dashboard-starter | **Next.js 16+shadcn+TypeScript** | Auth, charts, tables, forms |

## PRIORITES D'UTILISATION
1. **Etudier** Atomic CRM + NextCRM (architecture Supabase/Next.js)
2. **Integrer** Evolution API (WhatsApp) ou Chatwoot
3. **S'inspirer** de Cal.com (scheduling) et Documenso (e-signature)
4. **Reutiliser** Invoify (factures), Formbricks (surveys qualite)
5. **Composants** : react-big-calendar, shadcn-admin, react-email
