---
name: Roadmap Features Innovantes
description: Plan d'implementation des features innovantes par priorite, avec outils recommandes et budget - issu du benchmark CRM mondial
type: project
---

# Roadmap Features Innovantes - Mars 2026

**Why:** Benchmark de 50+ CRM mondiaux (FR, Asie, US) revele que le CRM Dermotec peut se differencier radicalement des CRM formation francais en integrant des features que PERSONNE ne combine.

**How to apply:** Utiliser cette roadmap pour prioriser le developpement. Chaque phase est independante.

## PHASE 1 : COMPLETER LES BASES (immediat)
Impact: conformite Qualiopi + reduction charge admin

| Feature | Outil | Cout | Ref CRM |
|---------|-------|------|---------|
| Portail Stagiaire self-service | Custom (Next.js page) | 0$ | Digiforma, Dendreo |
| Emargement QR | Custom (qrcode npm + Supabase) | 0$ | SmartOF, Edusign |
| Docs auto (convocations, attestations, BPF) | @react-pdf/renderer (deja dans stack) | 0$ | SmartOF "1 session=tout" |
| Dashboard Qualiopi 32 indicateurs | Custom (Recharts deja dans stack) | 0$ | SmartOF, Digiforma |
| Formulaires dynamiques adaptatifs | Tally (gratuit) ou custom | 0$ | GlossGenius |

## PHASE 2 : COMMUNICATION (court terme)
Impact: canal #1 des estheticiennes + conversion +30%

| Feature | Outil | Cout/mo | Ref CRM |
|---------|-------|---------|---------|
| WhatsApp Business API | Evolution API (OS) ou Meta Cloud API | 0$ | SleekFlow, Barantum |
| SMS rappels sessions | Telnyx | ~2$ | LS Institut |
| E-signature conventions | DocuSeal self-hosted + Yousign si eIDAS | 0-131EUR | Dendreo, SmartOF |
| Inbox unifiee (email+WhatsApp+SMS) | Custom ou Chatwoot | 0$ | Trengo, HubSpot |
| Cadences vente intelligentes | n8n self-hosted | ~5$ (VPS) | Salesmate, Outreach |

## PHASE 3 : INTELLIGENCE (moyen terme)
Impact: differenciation radicale vs CRM FR

| Feature | Outil | Cout/mo | Ref CRM |
|---------|-------|---------|---------|
| Agent vocal IA (qualification leads) | Bland AI | ~50$ | Aucun CRM FR |
| Chatbot IA 24/7 (site web) | Claude Haiku + RAG Supabase | ~10$ | Aesthetix CRM AI Employee |
| Scoring predictif IA | Claude API | ~5$ | HubSpot, Freshsales |
| Photos avant/apres avec alignement | Custom (canvas API) | 0$ | Pabau, AestheticsPro |
| BNPL paiement fractionne | Alma API | commission 3-4% | Pabau (Klarna) |
| Dunning automatise | Stripe Smart Retries | 0$ | Stripe natif |
| OCR dossiers financement | Google Document AI | 0$ (1000 pages/mo) | Aucun CRM FR |

## PHASE 4 : DIFFERENCIATION PREMIUM (long terme)
Impact: positionnement haut de gamme unique

| Feature | Outil | Cout/mo | Ref CRM |
|---------|-------|---------|---------|
| Badges numeriques LinkedIn | Certifier | 0-33$ | 360Learning, Credly |
| Video formation integree | Daily.co | 0$ (10K min) | Dendreo (classe virtuelle) |
| Digital Sales Room (B2B instituts) | Custom | 0$ | GetAccept |
| Extranet formateur | Custom (Next.js page) | 0$ | Dendreo |
| Micro-learning mobile | Custom (format stories) | 0$ | 7Taps, Gnow Be |
| Attribution multi-touch | Custom analytics | 0$ | Cometly |
| Gamification stagiaires | Custom (badges, progression) | 0$ | 360Learning |
| Analyse sentiment emails | Claude API | ~5$ | Freshworks Freddy |
| "Private Traffic" WhatsApp | Groupes WhatsApp geres dans CRM | 0$ | Concept chinois WeCom |
| Paiement in-chat WhatsApp | SleekFlow ou custom Stripe | variable | SleekFlow (HK) |

## BUDGET TOTAL PAR PHASE
- Phase 1 : ~37$/mo (Supabase + VPS + Claude)
- Phase 2 : +~140$/mo (SMS + Yousign)
- Phase 3 : +~250$/mo (Bland AI + Alma commission)
- Phase 4 : +~40$/mo (Certifier + Claude)
- **TOTAL MAX : ~470$/mo** vs Digiforma (129-699EUR/mo) ou Dendreo (199EUR+/mo)
