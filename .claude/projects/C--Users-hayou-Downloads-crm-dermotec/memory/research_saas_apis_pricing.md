---
name: APIs et SaaS - Pricing et Recommandations
description: Pricing detaille de tous les outils/APIs envisages pour le CRM (WhatsApp, SMS, Voice AI, e-signature, BNPL, IA, automation) avec budget par phase
type: reference
---

# APIs et SaaS - Pricing Mars 2026

## COMMUNICATION

### WhatsApp Business API
- **Meta Cloud API direct** : gratuit (plateforme) + ~0.08$/msg marketing FR, service messages gratuits
- **respond.io** : 79$/mo (Starter), 159$/mo (Growth), 279$/mo (Advanced)
- **Evolution API** (open source) : gratuit, TypeScript, GitHub 7.6k stars
- **Reco** : Meta Cloud API + Evolution API (gratuit) puis respond.io Growth quand volume justifie

### SMS France
- **Telnyx** : ~0.004$/msg (20x moins cher que Twilio), SDK Node.js
- **Twilio** : 0.0798$/msg outbound FR
- **Reco** : Telnyx (~2$/mo pour 500 SMS)

### Voice AI (agents vocaux)
- **Bland AI** : 0.14$/min, 100 appels/jour gratuits, plan Start 0$/mo
- **Vapi** : ~0.30$/min tout inclus, 10$ credits gratuits
- **Retell AI** : ~0.07-0.15$/min
- **Reco** : Bland AI Start (gratuit, 28$/mo pour 100 leads)

### Video
- **Daily.co** : 0.004$/min video, **10,000 min/mo gratuits**, SDK React
- **Whereby** : 0.004$/min, 2000 min/mo a 6.99$/mo
- **Reco** : Daily.co gratuit (166h/mo de formation couvertes)

## DOCUMENTS

### E-Signature
- **DocuSeal** (open source) : gratuit self-hosted, composants React embeddables
- **Yousign API** (FR, eIDAS) : 131EUR/mo (500 signatures)
- **Documenso** (open source) : gratuit self-hosted, TypeScript+shadcn
- **Reco** : DocuSeal/Documenso gratuit + Yousign si besoin eIDAS qualifie

### OCR Documents
- **Google Document AI** : 0.0015$/page, 1000 pages/mo gratuits
- **AWS Textract** : 0.0015$/page
- **PaddleOCR** (open source) : gratuit
- **Reco** : Google Document AI (250 pages/mo = gratuit pour 50 dossiers)

### QR Code Emargement
- **Edusign** : sur devis, leader FR, accepte OPCO/CPF
- **Custom** : lib qrcode npm + Supabase = 0$
- **Reco** : custom (gratuit) ou Edusign si certification rapide necessaire

### Digital Badges
- **Certifier** : gratuit (forever free), Pro 33$/mo, Open Badges 3.0, API
- **Credly** : 3000$/an minimum
- **Reco** : Certifier gratuit

## PAIEMENT

### BNPL (paiement fractionne)
- **Alma** (FR leader) : 3-4% commission, 23000 marchands, API REST
- **Klarna** : 2.5-4.5%, present en France
- **Reco** : Alma (conversion +20-30%, ROI evident sur formations 400-2500EUR)

### Dunning (relance paiement)
- **Stripe Billing** : natif dans Stripe (deja dans le stack)
- **Reco** : activer Smart Retries de Stripe (gratuit)

## IA

### LLM APIs
| Modele | Input/1M tok | Output/1M tok |
|--------|-------------|--------------|
| Claude Haiku 4.5 | 1$ | 5$ |
| Claude Sonnet 4.6 | 3$ | 15$ |
| GPT-4.1 | 2$ | 8$ |
| Perplexity Sonar | 1$ | 1$ |

- **Batch API Claude** : -50% sur tokens
- **Prompt caching** : -90% sur inputs repetes
- **Reco strategie multi-modele** : Haiku pour chatbot (~5$/mo), Sonnet pour content (~10$/mo), Perplexity pour enrichissement (~5$/mo) = ~20$/mo total IA

### Chatbot Widget
- **Chatbase Hobby** : 40$/mo, entraine sur donnees, API incluse
- **DIY (Claude API + Supabase pgvector)** : 5-20$/mo
- **Reco** : DIY pour controle total, Chatbase si rapidite

### Lead Scoring IA
- **Custom (Claude API)** : quelques $/mo
- MadKudu : 999$/mo (overkill)
- **Reco** : construire en interne

## AUTOMATISATION

### Workflow
- **n8n self-hosted** : gratuit (Community), 400+ integrations
- **n8n Cloud** : 24EUR/mo (Starter)
- **Make.com** : 9$/mo (Core)
- **Reco** : n8n self-hosted sur VPS 5-10EUR/mo

### Scheduling
- **Cal.com** : gratuit (individuel), self-hostable
- **Calendly** : gratuit (1 event)
- **Reco** : Cal.com gratuit

### Formulaires
- **Tally** : gratuit (99% features), illimite forms+submissions
- **Reco** : Tally gratuit

## EMAIL
- **Resend** (deja dans le stack) : 3000 emails/mo gratuits, 20$/mo pour 50K

## HEBERGEMENT
- **Supabase Pro** : 25$/mo (10K connexions realtime)
- **Vercel** (Next.js) : gratuit puis 20$/mo (Pro)

---

## BUDGETS RECOMMANDES

### Phase 1 : Lancement (0-50 leads/mo) = ~37$/mo
Resend(0) + Supabase(25) + Tally(0) + Cal.com(0) + Certifier(0) + Claude Haiku(5) + Telnyx SMS(2) + QR custom(0) + n8n(5 VPS)

### Phase 2 : Croissance (50-200 leads/mo) = +250$/mo
+ Bland AI(50) + Chatbase(40) + Alma(commission) + Yousign(131) + Daily.co(0) + Claude Sonnet(15) + Perplexity(10)

### Phase 3 : Scale (200+ leads/mo) = +275$/mo
+ respond.io(159) + DocuSeal(0) + Google Doc AI(5) + n8n Cloud(60) + Daily.co transcription(50)

## MATRICE DIFFERENTIATION vs CRM FR
| Feature | Dermotec | Digiforma | Dendreo | SmartOF |
|---------|----------|-----------|---------|---------|
| WhatsApp | OUI | NON | NON | NON |
| Voice AI | OUI | NON | NON | NON |
| Chatbot IA | OUI | NON | NON | NON |
| BNPL Alma | OUI | NON | NON | NON |
| Lead scoring IA | OUI | NON | NON | NON |
| Badges numeriques | OUI | NON | NON | NON |
| Video integree | OUI | NON | NON | NON |
| OCR dossiers | OUI | NON | NON | NON |
| Stack moderne | OUI | NON | NON | NON |
