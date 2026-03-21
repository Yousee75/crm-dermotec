---
name: Architecture CRM Dermotec
description: Architecture complète du CRM après les 4 phases de construction — pages, API, composants, modules, hooks
type: project
---

# Architecture CRM Dermotec — Mars 2026

**Why:** Référence rapide de tout ce qui existe dans le CRM pour éviter de recréer ou de chercher.

## PAGES (20 pages)

### Dashboard (auth required)
- / — Dashboard KPIs
- /cockpit — Vue directeur (CA, alertes, funnel, top formations)
- /leads — Table leads + filtres + recherche
- /lead/[id] — Détail lead 5 onglets (Infos, Communication, Financement, Docs, Historique)
- /pipeline — Kanban 7 colonnes drag-drop
- /messages — Inbox unifiée 3 panneaux
- /sessions — Calendrier mensuel
- /session/[id] — Détail session 4 onglets (Overview, Stagiaires, Émargement, Modèles)
- /stagiaires — Liste inscriptions
- /financement — Dossiers financement
- /commandes — E-Shop
- /analytics — 6 KPIs + 6 charts recharts
- /qualite — Dashboard Qualiopi 32 indicateurs
- /cadences — Templates + instances actives
- /equipe — Gestion équipe
- /settings — Paramètres
- /login — Auth

### Public (no auth)
- /portail/[token] — Portail stagiaire self-service
- /portail/[token]/convention — Signature convention
- /emargement/[sessionId] — Émargement QR mobile
- /inscription/[formationId] — Formulaire inscription 4 étapes
- /inscription-express/[formationId] — Convention + paiement 1 clic
- /inscription/success + /inscription/cancel

## API ROUTES (10+)
- /api/emargement — POST signature + GET par session
- /api/portail/[token] — GET données stagiaire
- /api/portail/[token]/sign-convention — POST signature convention
- /api/messages — GET inbox + POST envoi multi-canal
- /api/inscription-express — POST lead + inscription + convention + Stripe
- /api/ai/chat — POST chatbot Claude Haiku
- /api/ai/score — POST scoring prédictif IA
- /api/email/send — POST/GET templates email
- /api/stripe/webhook — Stripe events
- /api/webhook/formulaire — Lead creation publique

## COMPOSANTS UI (20+)
- SignatureCanvas, QRCodeGenerator
- SocialProofToast, CountdownBanner, StickyBottomBar
- TrustBar, WhatsAppButton, ExitIntentPopup
- BeforeAfterSlider, ROICalculator
- ChatWidget (chatbot IA)
- CommandPalette, ActivityTimeline
- Button, Card, Badge, Input, Avatar, Skeleton, Tabs, Dialog, Sheet, Tooltip, EmptyState, KpiCard, ProgressBar, PageHeader

## MODULES LIB (15+)
- stripe.ts (checkout, billing, SEPA, Alma, SetupIntent, off_session, pré-auth)
- whatsapp.ts (Meta Cloud API)
- sms.ts (Telnyx)
- cadence-engine.ts (4 séquences prédéfinies)
- ai-chatbot.ts (Claude Haiku RAG)
- ai-scoring.ts (scoring prédictif + fallback)
- qualiopi-referentiel.ts (32 indicateurs RNQ)
- scoring.ts (scoring règles lead)
- smart-actions.ts (suggestions proactives)
- marketing.ts (NPS, upsell, best contact time)
- rbac.ts (5 rôles × 30 permissions)
- validators.ts (11 validateurs + 4 state machines)
- validators-inscription.ts (zod conditionnel financement)
- supabase-client.ts + supabase-server.ts
- email.ts, utils.ts, constants.ts

## HOOKS (10)
- use-leads, use-sessions, use-reminders, use-financements
- use-realtime (Supabase realtime + notifications)
- use-emargement, use-qualiopi
- use-messages, use-cadences
- use-pdf-generator

## PDFs (5)
- convocation, attestation-fin, feuille-emargement, attestation-assiduité, bpf

## DB (20+ tables)
Core: leads, formations, sessions, inscriptions, financements, factures, rappels, activites, documents, commandes, equipe, modeles, notes_lead, email_templates, qualite, partenaires, cadence_templates, cadence_instances
Phase 1: emargements (+ portail_token sur inscriptions)
Phase 2: messages
