---
name: Architecture CRM Dermotec
description: Architecture complète du CRM après toutes les phases — pages, API, composants, modules, hooks, Inngest
type: project
---

# Architecture CRM Dermotec — Mars 2026 (état final)

## PAGES DASHBOARD (20 pages auth)

| Page | Route | Highlights |
|------|-------|-----------|
| Dashboard | / | Welcome, 6 KPIs tendances, leads récents, rappels, sessions semaine, timeline, mini chart CA |
| Cockpit | /cockpit | Vue directeur, alertes anomalies, funnel conversion, CA 6 mois, top formations |
| Leads | /leads | Table, filtres, search, scoring, pagination |
| Lead détail | /lead/[id] | 5 onglets (Infos éditable, Communication, Financement, Documents, Historique) |
| Pipeline | /pipeline | Kanban 7 colonnes drag-drop |
| Messages | /messages | Inbox unifiée 3 panneaux multi-canal |
| Sessions | /sessions | Calendrier mensuel |
| Session détail | /session/[id] | 4 onglets (Overview+checklist, Stagiaires, Émargement QR, Modèles) |
| Stagiaires | /stagiaires | Table inscriptions, présence bars, satisfaction étoiles, alumni |
| Financement | /financement | Kanban 6 colonnes + table toggle, docs checklist |
| Commandes | /commandes | E-shop, tracking, expand détail, KPIs |
| Analytics | /analytics | 6 KPIs, 6 charts recharts (CA, funnel, sources, formations, remplissage, satisfaction) |
| Qualité | /qualite | 32 indicateurs Qualiopi RNQ, gauge, accordéons, pie chart |
| Cadences | /cadences | Templates timeline + instances actives + KPIs |
| Équipe | /equipe | Grid membres, filtres rôle, profils formatrices |
| Settings | /settings | 5 onglets (Général, Templates email, Intégrations, Partenaires, Import/Export) |
| Login | /login | Split layout premium (brand panel + form) |

## PAGES PUBLIQUES (8 pages)

| Page | Route | Highlights |
|------|-------|-----------|
| Catalogue formations | /formations | Grid filtrable, search, cards conversion |
| Landing formation | /formations/[slug] | 8 sections (hero, social proof, programme, pour qui, financement, sessions, FAQ, CTA) |
| Portail stagiaire | /portail/[token] | 6 onglets self-service + convention |
| Signature convention | /portail/[token]/convention | 8 articles + SignatureCanvas |
| Émargement QR | /emargement/[sessionId] | Mobile-first, signature tactile |
| Inscription 4 étapes | /inscription/[formationId] | Champs conditionnels financement |
| Inscription express | /inscription-express/[formationId] | Convention + paiement 1 clic |
| Success/Cancel | /inscription/success + /cancel | Post-paiement |

## API ROUTES (15+)

/api/emargement, /api/portail/[token], /api/portail/[token]/sign-convention, /api/messages, /api/inscription-express, /api/ai/chat, /api/ai/score, /api/ai/commercial, /api/email/send, /api/stripe/webhook, /api/webhook/formulaire, /api/pdf/generate

## COMPOSANTS UI (25+)

SignatureCanvas, QRCodeGenerator, SocialProofToast, CountdownBanner, StickyBottomBar, TrustBar, WhatsAppButton, ExitIntentPopup, BeforeAfterSlider, ROICalculator, ChatWidget, AIAssistant (copilote commercial), CommandPalette, ActivityTimeline, Button, Card, Badge, Input, Avatar, Skeleton, Tabs, Dialog, Sheet, Tooltip, EmptyState, KpiCard, ProgressBar, PageHeader

## MODULES LIB (20+)

stripe.ts (checkout, billing, SEPA, Alma, SetupIntent, off_session, pré-auth), whatsapp.ts, sms.ts, cadence-engine.ts, ai-chatbot.ts, ai-scoring.ts, ai-commercial.ts, email.ts + email-templates.ts (10 templates pro), qualiopi-referentiel.ts, scoring.ts, smart-actions.ts, marketing.ts, rbac.ts, validators.ts, validators-inscription.ts, supabase-client.ts, supabase-server.ts, utils.ts, constants.ts

## INNGEST FUNCTIONS (7)

lead-cadence (J+0→J+14), post-formation-cadence (J+1→J+90), session-lifecycle (cron 8h), daily-rappels (cron 7h), send-email, stripe-webhook-processor, webhook-retry

## HOOKS (12)

use-leads, use-sessions, use-reminders, use-financements, use-realtime, use-emargement, use-qualiopi, use-messages, use-cadences, use-pdf-generator, use-analytics, use-onboarding

## DB (22+ tables)

Core: leads, formations, sessions, inscriptions, financements, factures, rappels, activites, documents, commandes, equipe, modeles, notes_lead, email_templates, qualite, partenaires, cadence_templates, cadence_instances
Phase 1-2: emargements, messages

## MÉMOIRE (12 fichiers recherche)

Benchmark CRM mondial, APIs pricing, conversion psychology, UX patterns, parcours prospect 6 scénarios, workflows intégrations
