# INTÉGRATIONS CRM + AGENT IA — GUIDE EXHAUSTIF
## Dermotec Academy — Tout ce qu'il faut savoir, sans pensée limitative

> Généré le 21 mars 2026 | Recherches live + sources officielles
> Périmètre : Comment les grands SaaS gèrent les intégrations, ce qui existe, comment connecter au mieux un agent IA à un CRM, et quoi connecter pour être au top.

---

## VISION GÉNÉRALE — COMPRENDRE LE PARADIGME 2026

### Ce qui a changé avec MCP + les agents IA

Avant 2024, connecter des outils = construire des intégrations custom une par une. Chaque connexion (CRM ↔ Slack, CRM ↔ Drive) = des semaines de dev. C'était le problème "N×M" : N outils × M apps = complexité explosive.

**2026 : Tout a changé avec MCP (Model Context Protocol).**

MCP est un protocole open standard créé par Anthropic, maintenant gouverné par l'AAIF (Linux Foundation, co-fondé avec Block et OpenAI). En mars 2026 : **97 millions de téléchargements mensuels du SDK, 10 000+ serveurs MCP actifs, supporté nativement par tous les grands players AI.**

**L'idée simple :** au lieu de construire une intégration pour chaque paire d'outils, chaque outil expose un "serveur MCP" et n'importe quel agent AI peut le consommer via un protocole standardisé.

```
AVANT : Agent ←→ API Salesforce (custom)
                ←→ API Gmail (custom)
                ←→ API Slack (custom)
                = 3 intégrations custom

APRÈS : Agent ←→ MCP Gateway
                    ↓ (un seul protocole)
                Salesforce MCP | Gmail MCP | Slack MCP | Drive MCP
                = 1 connexion standardisée
```

**Google** a annoncé le support MCP officiel pour tous ses services (déc 2025). **Microsoft** supporte MCP dans Windows, Copilot, VS Code, Azure. **Slack** a lancé un MCP server. **Notion** supporte MCP nativement.

---

## PARTIE 1 — LES COUCHES D'INTÉGRATION (COMMENT PENSER LE PROBLÈME)

### Les 5 patterns d'intégration pour les agents AI

**Pattern 1 : Tool Calling direct**
L'agent appelle directement une API externe via un "tool". Simple, rapide à coder.
- Pour : Proof of concept, 1-5 intégrations
- Contre : Auth complexe, maintenance lourde, pas de scaling

**Pattern 2 : MCP Gateway (standard 2026)**
L'agent passe par un gateway MCP qui gère l'auth et standardise les appels.
- Pour : Standard industriel, sécurisé, gouvernance, audit trail
- Contre : Légère latence additionnelle (<100ms)
- Tools : Claude.ai (natif), Claude Code, Cursor, VS Code

**Pattern 3 : Unified API**
Un seul endpoint pour toute une catégorie d'APIs (ex: un endpoint = toutes les CRMs).
- Pour : Idéal pour supporter plusieurs CRM/HRIS chez différents clients
- Contre : Abstraction qui peut cacher des détails spécifiques à chaque API
- Tools : Nango (700+ APIs), Merge (catégories spécifiques), Composio (500+ toolkits)

**Pattern 4 : Workflow Automation (no-code/low-code)**
L'agent déclenche ou est déclenché par des workflows automatisés.
- Pour : Non-technique, rapide à déployer, 8000+ intégrations
- Contre : Moins de contrôle sur la logique, coût à l'exécution
- Tools : n8n (open-source, self-hostable), Zapier (8000+ apps), Make (3000+ apps)

**Pattern 5 : Agent-to-Agent (A2A Protocol)**
Un agent délègue des tâches à d'autres agents spécialisés.
- Pour : Systèmes multi-agents sophistiqués
- Contre : Complexe, encore émergent
- Tools : Google ADK, LangChain, n8n multi-agent

**→ Pour Dermotec : Pattern 2 (MCP) + Pattern 4 (n8n) est le combo idéal.**

---

## PARTIE 2 — CE QUE LES GRANDS SAAS FONT EN 2026

### Salesforce (Agentforce 360)
- **Architecture :** "Agentforce" = des agents AI autonomes qui agissent dans le CRM sans prompt humain
- **Intégrations :** Slack natif (Agentforce Sales in Slack), Teams, Google Workspace, SAP, Oracle
- **Ce qu'ils font :** Les agents routent des leads, mettent à jour les records CRM, escaladent automatiquement, ferment des tickets — sans intervention humaine
- **Clé :** Chaque agent a une "mission" définie, accès aux données CRM en temps réel, capacité d'action sur les records
- **Innovation :** Agentforce Sales dans le sidebar Slack — les reps voient les données CRM + peuvent demander à l'agent d'agir tout en discutant

### HubSpot (Breeze AI)
- **Architecture :** "Breeze copilot" = assistant dans l'interface + "Breeze agents" = agents autonomes
- **Intégrations :** Gmail, Outlook, Slack, Google Drive, Zoom, Stripe, Shopify, Segment, Intercom, 1000+ via API
- **Ce qu'ils font :** Prospection automatique, scoring prédictif des leads, emails personnalisés, résumé des appels, mise à jour du pipeline
- **Clé :** Context window = toute l'historique du client depuis tous les points de contact (email, chat, call, deal)

### Notion (Custom Agents)
- **Architecture :** Des agents "custom" déclenchés par triggers (schedule ou événements Notion/Slack)
- **Intégrations via MCP :** Linear, Figma, HubSpot, Ramp, Wiz, Stripe, GitHub, Intercom, Amplitude, Attio, Sentry + custom MCP servers
- **Ce qu'ils font :** Triage de tickets (>95% précision), réponses autonomes aux questions dans Slack, rapports automatiques, mise à jour de bases de données Notion
- **Clé :** "Nous avons 100% arrêté de gérer le travail nous-mêmes dans Notion et passé à interagir uniquement avec les agents Notion" — COO de Every

### Slack (MCP + RTS API)
- **Architecture :** Slack = "système opératoire agentique" — tous les agents ont leur home dans Slack
- **Intégrations :** Salesforce (natif), Notion AI, Dropbox, OpenAI, Anthropic, Google, Perplexity, Vercel, Cursor, + custom via MCP
- **Ce qu'ils font :** Enterprise search unifiée (Gmail, Outlook, Dropbox, Notion + API custom), Slackbot reconfiguré comme "compagnon AI personnalisé"
- **Clé :** Real-Time Search (RTS) API + MCP server = n'importe quel outil peut accéder aux conversations Slack en temps réel de façon sécurisée

---

## PARTIE 3 — CARTOGRAPHIE COMPLÈTE DES INTÉGRATIONS

### 3.1 INTÉGRATIONS TIER 1 — INDISPENSABLES (Impact direct sur le CRM)

#### 📧 Email — La colonne vertébrale

**Gmail / Google Workspace**
- MCP officiel Google (déc 2025) : accès natif dans Claude, agents, etc.
- Ce que l'agent peut faire : lire les emails entrants, rédiger des réponses, extraire des infos de contact, détecter l'intent d'un email, créer automatiquement un contact dans le CRM
- Pour Dermotec : email d'une esthéticienne → agent détecte la demande de formation → crée le lead dans le CRM → envoie un email de nurturing personnalisé
- **Setup :** MCP Google Workspace (official) ou google-workspace-mcp (GitHub)

**Outlook / Microsoft 365**
- Intégration via Microsoft Graph API
- Même logique que Gmail mais pour l'écosystème Microsoft

**Resend (déjà dans votre stack)**
- Pour les emails transactionnels sortants
- L'agent peut déclencher l'envoi de séquences d'emails via API

---

#### 📅 Calendrier — Prise de rendez-vous intelligente

**Google Calendar**
- MCP officiel Google : l'agent lit les disponibilités, crée des events, gère les invitations
- Pour Dermotec : agent propose automatiquement des créneaux de démo/formation en fonction des disponibilités → crée l'event → envoie les invitations
- Intégration avec Cal.com ou Calendly pour la prise de RDV externe

**Cal.com (open-source, auto-hébergeable)**
- Alternative à Calendly, RGPD-friendly, peut être auto-hébergé sur votre infra
- Webhook sur booking → déclenche workflow n8n → mise à jour CRM + email de confirmation
- L'agent peut proposer un link Cal.com contextualisé dans ses réponses

---

#### 💼 Google Drive / Documents

**Google Drive MCP**
- L'agent accède aux docs, sheets, slides dans Drive
- Pour Dermotec : agent lit un devis dans Drive → extrait les infos → crée une opportunité dans le CRM
- Pour les équipes internes : agent peut générer des rapports d'activité → les sauver dans Drive → notifier dans Slack
- **Setup :** google-drive-mcp (GitHub, support Drive + Docs + Sheets + Slides + Calendar)

**Google Sheets**
- L'agent peut lire/écrire dans les sheets
- Usage CRM : importer des contacts depuis un sheet, exporter des stats CRM vers un sheet de reporting
- Pour Dermotec : feuille de suivi des inscriptions formations → sync auto avec le CRM

---

#### 💬 Communication interne

**Slack**
- MCP server officiel Slack + RTS API
- Ce que l'agent peut faire : envoyer des notifications dans les bons channels, lire le contexte des conversations, répondre aux questions sur les clients, router les demandes
- Pour Dermotec : nouvelle inscription formation → notification Slack enrichie (données CRM du client) → agent répond aux questions de l'équipe dans le channel
- **Pattern :** Runbear-style — l'agent répond dans Slack en puisant dans Google Drive + CRM + Notion sans switching d'onglets

**WhatsApp Business API**
- Via Twilio ou 360dialog (APIs officielles Meta)
- L'agent peut envoyer des messages WhatsApp pour le suivi commercial
- Pour Dermotec : rappels de formation, suivi après une session, nurturing B2B
- **Attention :** nécessite un compte Business vérifié Meta + approbation des templates

---

#### 💳 Paiement et facturation

**Stripe (déjà dans votre stack)**
- Webhooks Stripe → n8n → mise à jour CRM (deal gagné, montant, récurrence)
- L'agent peut vérifier le statut de paiement d'un client, générer des liens de paiement, relancer les impayés
- Pour Dermotec : achat de formation → agent crée automatiquement le dossier client complet dans le CRM

**Pennylane / QuickBooks / FreshBooks**
- Sync des factures avec le CRM
- L'agent rapproche les paiements aux contacts CRM

---

### 3.2 INTÉGRATIONS TIER 2 — HIGH VALUE (Enrichissement des données)

#### 🔍 Enrichissement de données clients

**Clearbit / Apollo.io / Hunter.io**
- L'agent enrichit automatiquement un nouveau contact : poste, entreprise, LinkedIn, email pro, taille d'entreprise
- Pour Dermotec B2B : une esthéticienne s'inscrit avec son email perso → agent cherche son cabinet/spa, ses réseaux sociaux, le nombre de salariés, le CA estimé
- **Apollo.io** : 275M+ contacts professionnels, 60M+ entreprises, données RGPD
- **Hunter.io** : vérification d'emails, recherche d'emails pro par domaine

**LinkedIn Sales Navigator (via API)**
- Données LinkedIn directement dans le CRM
- Suivi des changements de poste des contacts (signal d'opportunité)

**Société.com / Pappers (France)**
- Enrichissement avec données légales françaises (SIRET, CA, effectifs, statut juridique)
- Critique pour la validation B2B en France

---

#### 📊 Analytics et comportement utilisateur

**PostHog (déjà dans votre stack)**
- L'agent peut interroger les données d'usage pour qualifier un lead : "cet utilisateur a regardé 5 vidéos niveau 3 → signal fort d'intérêt pour la formation avancée"
- Sync PostHog events → CRM pour enrichir les profils

**Mixpanel / Amplitude**
- Mêmes usages que PostHog
- Events utilisateur → score d'engagement → priorité dans le CRM

**Segment**
- CDP (Customer Data Platform) — collecte tous les events de tous les outils → distribue vers CRM, analytics, email
- Pour les entreprises plus avancées

---

#### 🎙️ Appels et réunions

**tl;dv / Fireflies / Otter.ai**
- Enregistrement + transcription + résumé des calls automatiques
- Sync vers CRM : chaque call → résumé dans la fiche contact → action suivante automatique
- L'agent peut analyser les transcriptions pour détecter des signaux d'intent, des objections récurrentes
- Pour Dermotec : appel de démo avec une directrice de spa → agent génère un résumé → identifie les besoins exprimés → crée les tâches de suivi dans le CRM

**Zoom / Google Meet / Teams**
- L'agent peut créer des réunions, envoyer les liens, gérer les récurrences
- Via Calendar + Zoom API ou Google Meet API

---

#### 🗣️ Chat et support client

**Intercom**
- Chat en direct sur le site avec agent IA intégré
- Sync Intercom ↔ CRM : chaque conversation → timeline contact
- Pour Dermotec : visiteur pose une question sur le site → agent Intercom répond → si lead qualifié → crée le contact dans le CRM avec contexte de la conversation

**Crisp**
- Alternative française à Intercom, RGPD-friendly
- Chat + email + bot + base de connaissances en un

**Typeform / Tally**
- Formulaires enrichis pour qualifier les leads
- Submission → n8n → création contact CRM + enrichissement + assignation au bon pipeline

---

### 3.3 INTÉGRATIONS TIER 3 — STRATÉGIQUES (Avantage concurrentiel)

#### 🤖 Agent IA au cœur du CRM

**Claude API (déjà dans votre stack)**
- L'agent lit les données CRM en temps réel → génère des insights → suggère des actions
- Pour Dermotec : "Ce contact a vu 4 fois la page formation peelings avancés mais n'a pas demandé de devis → l'agent génère un email ultra-personnalisé + propose un créneau de démo"

**Anthropic MCP Claude.ai**
- Vous avez déjà Gmail MCP + Google Calendar MCP dans Claude.ai
- L'agent Claude peut maintenant interagir avec vos emails + calendrier directement
- Extension possible : connecter votre Supabase CRM via un MCP server custom

**Pattern "Agent in the Loop" :**
```
Nouveau contact dans CRM
       ↓
Agent Claude analyse le profil
       ↓
Enrichit les données (Apollo, LinkedIn)
       ↓
Calcule un score de maturité
       ↓
Détermine la séquence de nurturing
       ↓
Déclenche les actions (email, Slack notif, task)
       ↓
Surveille les réponses en temps réel
       ↓
Adapte la stratégie
```

---

#### 📱 Réseaux sociaux et marketing

**Instagram Business API**
- Pour Dermotec : monitoring des mentions, DMs entrants → création auto de leads dans le CRM
- L'agent peut répondre aux DMs qualifiés

**Facebook Lead Ads**
- Formulaires Facebook/Instagram → leads directement dans le CRM via webhook n8n

**LinkedIn (Campaign Manager API)**
- Sync des leads LinkedIn Ads vers le CRM
- Enrichissement automatique des profils

---

#### 📝 Base de connaissances et documentation

**Notion**
- MCP Notion natif : l'agent peut lire/écrire dans Notion
- Pour Dermotec : documentation interne des offres de formation → agent l'utilise pour répondre aux questions commerciales
- Wiki interne + CRM = agent toujours informé des dernières offres

**Google Docs / Confluence**
- Même logique : base documentaire pour alimenter le contexte de l'agent

---

#### 🔔 Notifications et alertes

**Slack (déjà mentionné)**

**Discord**
- Pour les communautés pro (étudiants en esthétique, groups privés)
- L'agent peut monitorer des channels Discord pour détecter des opportunités

**Telegram Bot API**
- Alternative légère pour les notifications internes
- Utile pour des alertes en temps réel : "New hot lead dans le CRM"

**PushOver / Ntfy**
- Notifications push sur mobile pour l'équipe
- L'agent envoie des alertes quand un lead passe au statut critique

---

#### 📦 E-commerce et boutique

**Stripe (déjà)**
**WooCommerce / Shopify**
- Si Dermotec vend des produits (matériel esthétique, produits cosmétiques)
- Sync commandes → CRM → suivi lifetime value client

**Pennylane**
- Comptabilité en ligne française
- Sync factures/devis ↔ CRM

---

## PARTIE 4 — LES OUTILS D'ORCHESTRATION (COMMENT CONNECTER TOUT ÇA)

### 4.1 n8n — Le choix recommandé pour Dermotec

**Pourquoi n8n et pas Zapier ou Make ?**

| Critère | Zapier | Make | n8n |
|---------|--------|------|-----|
| Prix (10k exécutions/mois) | ~$100 | ~$20 | $0 (self-hosted) |
| Intégrations | 8000+ | 3000+ | 400+ (mais custom HTTP = tout) |
| Logique complexe | ❌ Limitée | ✅ Moyenne | ✅ Excellent |
| AI natif | ❌ Basique | ❌ Beta | ✅ LangChain + agents |
| Self-hosting | ❌ Non | ❌ Non | ✅ Oui |
| MCP support | ❌ Non | ❌ Non | ✅ Oui |
| Data privacy | ❌ Cloud only | ❌ Cloud only | ✅ Tes serveurs |
| Pour Dermotec | ❌ Trop cher | ✅ Acceptable | ✅ Best choice |

**n8n est le seul qui supporte :**
- Self-hosting (données restent sur ton infrastructure)
- LangChain intégré (agents AI sophistiqués)
- MCP server natif
- Exécutions illimitées sur self-hosted (~10€/mois sur un VPS)
- Logique complexe (conditions, loops, parallel, retry, error handling)

**Architecture n8n pour Dermotec :**
```
Sources de déclenchement :
├── Webhook (Stripe, Typeform, calendrier)
├── Schedule (cron : rapports quotidiens, séquences d'emails)
├── Database trigger (nouvelle inscription CRM)
└── Email (Gmail inbox watch)

Traitements disponibles :
├── Appels API (Apollo, LinkedIn, etc.)
├── AI processing (Claude API pour analyse)
├── Transformations de données (JavaScript)
└── Conditions et routage

Actions possibles :
├── CRM (Supabase : créer/modifier/supprimer)
├── Email (Resend : envoyer des séquences)
├── Slack (notifications enrichies)
├── WhatsApp (via Twilio)
├── Drive (créer des docs/dossiers)
└── Calendar (créer des events)
```

**Workflows n8n prioritaires pour Dermotec :**

```
Workflow 1 : Inscription Academy → Qualification lead
Trigger: Nouveau profil Supabase
→ Appel Apollo.io (enrichissement)
→ Claude: analyse le profil + génère score
→ CRM: met à jour le profil + assigne pipeline
→ Resend: email de bienvenue personnalisé
→ Slack: notification équipe si score > 80

Workflow 2 : Lead chaud → Action commerciale
Trigger: PostHog event "video_completed × 5"
→ Claude: génère un email de nurturing personnalisé
→ CRM: ajoute note + met à jour statut
→ Resend: envoie l'email
→ Calendar: propose un créneau de démo

Workflow 3 : Email entrant → Lead créé
Trigger: Gmail watch (emails entrants)
→ Claude: analyse intent + extrait infos
→ Si prospect: créer contact dans CRM
→ Enrichissement Apollo
→ Assigner au bon pipeline

Workflow 4 : Réunion complétée → Suivi automatique
Trigger: tl;dv webhook (call terminé)
→ Récupérer transcript
→ Claude: extraire résumé + actions suivantes + objections
→ CRM: mettre à jour fiche contact
→ Créer tâches de suivi
→ Slack: notifier l'équipe

Workflow 5 : Conversion formation → Onboarding
Trigger: Stripe payment.succeeded
→ CRM: marquer deal comme gagné
→ Google Drive: créer dossier client
→ Resend: email de bienvenue formation
→ Google Calendar: créer les events de formation
→ Slack: célébration dans le channel équipe
```

---

### 4.2 Composio — Pour les tool calls de l'agent IA

**Composio est l'infrastructure pour que ton agent Claude puisse appeler des outils tiers.**

Problème sans Composio :
```
Agent Claude veut mettre à jour HubSpot
→ Tu dois : gérer l'OAuth HubSpot, stocker les tokens, gérer les refresh, mapper les champs, gérer les erreurs...
→ 1 intégration = 2-8 semaines de dev + maintenance continue
```

Avec Composio :
```
Agent Claude demande à Composio : "Crée un contact dans HubSpot avec ces infos"
→ Composio gère : OAuth, tokens, mapping, erreurs, retry
→ L'agent reçoit : confirmation ou erreur structurée
→ Dev time : 30 minutes
```

**Ce que Composio apporte :**
- 500+ toolkits pré-construits et optimisés pour les LLMs
- Gestion multi-tenant (chaque utilisateur a ses propres credentials)
- MCP support natif
- SOC 2 Type II, RGPD
- Event-driven triggers (l'agent se déclenche quand un event externe arrive)
- Tarification usage-based (scale avec l'usage)

**Intégrations Composio les plus utiles pour Dermotec :**
```
✅ Gmail (lire/envoyer emails)
✅ Google Calendar (créer events)
✅ Google Drive (lire/créer fichiers)
✅ Slack (envoyer messages)
✅ HubSpot (si utilisé comme CRM secondaire)
✅ LinkedIn (recherche de profils)
✅ Notion (lire/écrire)
✅ Typeform (lire les submissions)
✅ Stripe (vérifier statut)
```

---

### 4.3 Nango — Pour les syncs de données CRM

**Nango est complémentaire à Composio : là où Composio fait des tool calls ponctuels, Nango fait des syncs de données continus.**

Usage type : tu as des contacts dans HubSpot + dans LinkedIn + dans un fichier Excel → Nango synchonise tout dans Supabase CRM en continu.

- 700+ APIs supportées
- Data sync bidirectionnel
- Webhooks et triggers
- Self-hostable
- Code-first (ton équipe tech contrôle tout)
- SOC 2, RGPD, HIPAA

---

## PARTIE 5 — ARCHITECTURE AGENT IA + CRM POUR DERMOTEC

### 5.1 Architecture recommandée

```
┌─────────────────────────────────────────────────────────────┐
│                    DERMOTEC CRM INTELLIGENCE                  │
└─────────────────────────────────────────────────────────────┘

COUCHE 1 — SOURCES DE DONNÉES
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Gmail   │ │  Drive   │ │  Slack   │ │ Stripe   │ │PostHog   │
│ Calendar │ │ Sheets   │ │WhatsApp  │ │Cal.com   │ │tl;dv     │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     └────────────┴────────────┴────────────┴────────────┘
                              ↓

COUCHE 2 — ORCHESTRATION
┌─────────────────────────────────────────────────────────────┐
│                    n8n (self-hosted)                          │
│  Workflows automatisés | Triggers | Logic | Error handling   │
└─────────────────────────────────────────────────────────────┘
                              ↓

COUCHE 3 — AGENT IA
┌─────────────────────────────────────────────────────────────┐
│               Claude claude-sonnet-4-6 via API                │
│  + Composio (tool calling) + MCP servers                     │
│  Contexte : historique client + données CRM temps réel       │
└─────────────────────────────────────────────────────────────┘
                              ↓

COUCHE 4 — SUPABASE CRM (Source de vérité)
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL + RLS + Realtime + Edge Functions     │
│  Contacts | Deals | Activities | Notes | Scores | Pipeline   │
└─────────────────────────────────────────────────────────────┘
                              ↓

COUCHE 5 — INTERFACE UTILISATEUR
┌─────────────────────────────────────────────────────────────┐
│              CRM Dashboard Next.js 16 + Agent Chat UI         │
│  Vue contacts | Pipeline Kanban | Timeline | AI Chat         │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.2 L'agent IA dans le CRM — Capacités concrètes

**L'agent peut faire tout ça en temps réel, directement depuis le CRM :**

```typescript
// Exemples de capabilities de l'agent CRM Dermotec

// 1. ANALYSE EN TEMPS RÉEL
"Analyse les 10 derniers contacts créés et dis-moi lesquels sont les plus chauds"
→ Agent: lit les données CRM + PostHog events + emails reçus
→ Retourne: score de maturité + recommandations

// 2. ACTIONS DIRECTES
"Envoie un email de suivi à Marie Dupont et crée un RDV pour jeudi"
→ Agent: récupère le contact dans CRM
→ Rédige un email personnalisé avec contexte
→ Envoie via Gmail/Resend
→ Crée event dans Google Calendar
→ Met à jour CRM avec log de l'activité

// 3. REPORTING INTELLIGENT
"Génère le rapport commercial de la semaine"
→ Agent: agrège toutes les activités CRM
→ Analyse les tendances
→ Compare avec la semaine précédente
→ Génère un rapport markdown → sauve dans Drive → envoie dans Slack

// 4. DÉTECTION D'OPPORTUNITÉS
"Quels contacts n'ont pas été contactés depuis 30 jours mais sont actifs sur l'Academy?"
→ Agent: requête CRM (dernière activité) + PostHog (events Academy)
→ Retourne: liste priorisée avec contexte
→ Option: créer automatiquement les tâches de suivi

// 5. QUALIFICATION AUTOMATIQUE
Trigger: nouveau contact créé
→ Agent: enrichit avec Apollo.io
→ Analyse le profil LinkedIn
→ Score la maturité commerciale
→ Assigne au bon pipeline (direct vs nurturing)
→ Déclenche la bonne séquence d'emails
```

---

### 5.3 Implémentation MCP pour le CRM Dermotec

```typescript
// mcp/crm-server.ts — Serveur MCP custom pour l'agent Claude

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'

const server = new McpServer({
  name: 'dermotec-crm',
  version: '1.0.0',
})

// Tool : Rechercher un contact
server.tool(
  'search_contact',
  'Rechercher un contact dans le CRM Dermotec',
  {
    query: z.string().describe('Nom, email ou entreprise du contact'),
    limit: z.number().optional().default(10),
  },
  async ({ query, limit }) => {
    const { data } = await adminClient
      .from('crm_contacts')
      .select('id, first_name, last_name, email, company, status, last_contact_at, score')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit)
    
    return {
      content: [{ type: 'text', text: JSON.stringify(data) }]
    }
  }
)

// Tool : Créer une activité (log d'interaction)
server.tool(
  'log_activity',
  'Enregistrer une interaction avec un contact CRM',
  {
    contactId: z.string().uuid(),
    type: z.enum(['email', 'call', 'meeting', 'note', 'demo']),
    summary: z.string().describe('Résumé de l\'interaction'),
    nextAction: z.string().optional().describe('Prochaine action à faire'),
    nextActionDate: z.string().optional().describe('Date ISO de la prochaine action'),
  },
  async ({ contactId, type, summary, nextAction, nextActionDate }) => {
    const { data } = await adminClient
      .from('crm_activities')
      .insert({
        contact_id: contactId,
        type,
        summary,
        next_action: nextAction,
        next_action_date: nextActionDate,
        created_by: 'ai_agent',
      })
    
    return {
      content: [{ type: 'text', text: `Activité créée: ${data?.id}` }]
    }
  }
)

// Tool : Mettre à jour le statut d'un deal
server.tool(
  'update_deal_stage',
  'Mettre à jour l\'étape d\'un deal dans le pipeline',
  {
    dealId: z.string().uuid(),
    stage: z.enum(['prospect', 'qualified', 'demo_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost']),
    notes: z.string().optional(),
  },
  async ({ dealId, stage, notes }) => {
    await adminClient.from('crm_deals').update({ stage, updated_at: new Date().toISOString() }).eq('id', dealId)
    if (notes) {
      await adminClient.from('crm_activities').insert({
        deal_id: dealId,
        type: 'stage_change',
        summary: `Stage changé à "${stage}". ${notes}`,
        created_by: 'ai_agent',
      })
    }
    return { content: [{ type: 'text', text: `Deal ${dealId} mis à jour: ${stage}` }] }
  }
)

// Tool : Générer un rapport
server.tool(
  'generate_pipeline_report',
  'Générer un rapport sur le pipeline commercial',
  {
    period: z.enum(['week', 'month', 'quarter']),
  },
  async ({ period }) => {
    const dateFrom = new Date()
    if (period === 'week') dateFrom.setDate(dateFrom.getDate() - 7)
    if (period === 'month') dateFrom.setMonth(dateFrom.getMonth() - 1)
    if (period === 'quarter') dateFrom.setMonth(dateFrom.getMonth() - 3)
    
    const { data: deals } = await adminClient
      .from('crm_deals')
      .select('stage, amount, created_at, closed_at')
      .gte('created_at', dateFrom.toISOString())
    
    // Agrégation et analyse
    const report = {
      period,
      totalDeals: deals?.length,
      wonDeals: deals?.filter(d => d.stage === 'won').length,
      totalRevenue: deals?.filter(d => d.stage === 'won').reduce((sum, d) => sum + (d.amount ?? 0), 0),
      conversionRate: `${Math.round((deals?.filter(d => d.stage === 'won').length ?? 0) / (deals?.length ?? 1) * 100)}%`,
      byStage: Object.fromEntries(
        ['prospect', 'qualified', 'demo_scheduled', 'won', 'lost'].map(stage => [
          stage,
          deals?.filter(d => d.stage === stage).length
        ])
      )
    }
    
    return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] }
  }
)

export { server }
```

---

## PARTIE 6 — SCHÉMA CRM ÉTENDU POUR LES INTÉGRATIONS

```sql
-- Extension du schéma Supabase pour un CRM complet

-- ================================================================
-- CONTACTS CRM
-- ================================================================
CREATE TABLE crm_contacts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Infos de base
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT UNIQUE,
  phone         TEXT,
  company       TEXT,
  job_title     TEXT,
  
  -- Enrichissement (Apollo, LinkedIn, etc.)
  linkedin_url  TEXT,
  twitter_url   TEXT,
  website       TEXT,
  company_size  TEXT,
  industry      TEXT,
  annual_revenue BIGINT,
  siret         TEXT,  -- Spécifique France
  
  -- Données Academy Dermotec
  academy_user_id UUID REFERENCES profiles(id),
  academy_level   INT,
  academy_points  INT,
  
  -- Scoring et qualification
  score         INT DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  score_updated_at TIMESTAMPTZ,
  intent_signals JSONB DEFAULT '[]',  -- [{signal, date, source}]
  
  -- Statut et pipeline
  status        TEXT DEFAULT 'cold' CHECK (status IN ('cold', 'warm', 'hot', 'customer', 'churned')),
  lifecycle_stage TEXT DEFAULT 'subscriber' CHECK (lifecycle_stage IN (
    'subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist'
  )),
  
  -- Assignation
  assigned_to   UUID REFERENCES auth.users(id),
  
  -- Tracking temporel
  first_seen_at    TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  last_email_at    TIMESTAMPTZ,
  last_call_at     TIMESTAMPTZ,
  
  -- Source
  source        TEXT,  -- 'academy_signup', 'linkedin', 'referral', 'website', 'event'
  utm_source    TEXT,
  utm_campaign  TEXT,
  
  -- Métadonnées
  tags          TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ  -- soft delete
);

-- ================================================================
-- DEALS / OPPORTUNITÉS
-- ================================================================
CREATE TABLE crm_deals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id  UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  
  title       TEXT NOT NULL,
  amount      DECIMAL(10,2),
  currency    TEXT DEFAULT 'EUR',
  
  stage       TEXT NOT NULL DEFAULT 'prospect' CHECK (stage IN (
    'prospect', 'qualified', 'demo_scheduled', 'proposal_sent', 
    'negotiation', 'won', 'lost', 'on_hold'
  )),
  
  -- Formation concernée
  formation_type TEXT,  -- 'peelings', 'laser_ipl', 'mesotherapie', etc.
  formation_date DATE,
  formation_seats INT DEFAULT 1,
  
  -- Probabilité et prévision
  probability INT DEFAULT 20 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Agent IA
  ai_score     INT,
  ai_next_action TEXT,
  ai_analysis  TEXT,
  
  -- Source
  source      TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ACTIVITÉS (Timeline des interactions)
-- ================================================================
CREATE TABLE crm_activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id  UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id     UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  
  type        TEXT NOT NULL CHECK (type IN (
    'email_sent', 'email_received', 'call', 'meeting', 'demo',
    'note', 'stage_change', 'score_change', 'ai_action',
    'website_visit', 'academy_activity', 'stripe_payment'
  )),
  
  summary     TEXT NOT NULL,
  content     TEXT,  -- Corps de l'email, transcript de l'appel, etc.
  
  -- Actions suivantes
  next_action      TEXT,
  next_action_date TIMESTAMPTZ,
  is_completed     BOOLEAN DEFAULT FALSE,
  
  -- Métadonnées
  external_id     TEXT,  -- ID dans le système source (Gmail thread ID, etc.)
  source_system   TEXT,  -- 'gmail', 'tldv', 'calendly', 'manual', 'ai_agent'
  created_by      TEXT,  -- user_id ou 'ai_agent'
  attachments     JSONB DEFAULT '[]',
  
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- SÉQUENCES D'EMAILS
-- ================================================================
CREATE TABLE crm_sequences (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  steps       JSONB NOT NULL DEFAULT '[]',
  -- [{stepNumber, delayDays, subject, body, condition}]
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crm_sequence_enrollments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id  UUID NOT NULL REFERENCES crm_sequences(id),
  contact_id   UUID NOT NULL REFERENCES crm_contacts(id),
  current_step INT DEFAULT 0,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  next_step_at TIMESTAMPTZ,
  UNIQUE(sequence_id, contact_id)
);

-- ================================================================
-- INTÉGRATIONS — Configuration et tokens
-- ================================================================
CREATE TABLE crm_integrations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users(id),
  
  provider     TEXT NOT NULL,  -- 'gmail', 'google_calendar', 'slack', 'apollo', etc.
  is_connected BOOLEAN DEFAULT FALSE,
  
  -- Tokens (chiffrés via Supabase Vault)
  access_token_id  TEXT,  -- Référence vers Supabase Vault
  refresh_token_id TEXT,
  
  -- Config spécifique
  config       JSONB DEFAULT '{}',
  
  -- Statut
  last_sync_at TIMESTAMPTZ,
  error        TEXT,
  
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider)
);

-- ================================================================
-- AI AGENT — Historique et mémoire
-- ================================================================
CREATE TABLE crm_ai_conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id),
  contact_id  UUID REFERENCES crm_contacts(id),  -- Optionnel : contexte sur un contact
  
  messages    JSONB NOT NULL DEFAULT '[]',  -- [{role, content, timestamp}]
  
  -- Résumé et mémoire
  summary     TEXT,  -- Résumé de la conversation pour le contexte futur
  entities    JSONB DEFAULT '{}',  -- Entités extraites (contacts mentionnés, deals, etc.)
  
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX CONCURRENTLY idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX CONCURRENTLY idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX CONCURRENTLY idx_crm_contacts_score ON crm_contacts(score DESC);
CREATE INDEX CONCURRENTLY idx_crm_contacts_last_activity ON crm_contacts(last_activity_at DESC);
CREATE INDEX CONCURRENTLY idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX CONCURRENTLY idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX CONCURRENTLY idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX CONCURRENTLY idx_crm_activities_type ON crm_activities(type);
CREATE INDEX CONCURRENTLY idx_crm_activities_created ON crm_activities(created_at DESC);
```

---

## PARTIE 7 — STRATÉGIES AVANCÉES QUE LES MEILLEURS FONT

### 7.1 Intent Signals — Détecter les prospects chauds en temps réel

Au lieu d'attendre qu'un lead vous contacte, vous le savez avant.

**Signaux à capter :**
```
Signal fort (score +30) :
  - A regardé la page "Formations" 3+ fois en 7 jours
  - A téléchargé une brochure
  - A passé >5min sur la page pricing
  - A completé 3+ vidéos niveau 4-5 sur l'Academy

Signal moyen (score +15) :
  - A ouvert 3+ emails de la séquence
  - A cliqué sur un CTA
  - A posé une question dans le chat

Signal faible (score +5) :
  - S'est inscrit à l'Academy
  - A suivi sur LinkedIn
  - A commenté un post
```

**Comment capter ces signaux avec l'agent :**
1. PostHog → webhook → n8n → mise à jour score CRM
2. Resend → tracking d'ouverture/clic → n8n → CRM
3. Website → analytics → n8n → CRM

### 7.2 Scoring prédictif avec Claude

```typescript
// Edge Function : mise à jour automatique du score IA
async function updateContactScore(contactId: string) {
  const contact = await getContactWithHistory(contactId)
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: `Tu es un expert en qualification commerciale B2B dans le secteur de l'esthétique médicale.
    Analyse un profil de contact et retourne UNIQUEMENT un JSON valide avec:
    - score (0-100) : probabilité de convertir en client formation physique
    - reasoning : explication courte du score
    - next_action : meilleure action à faire maintenant
    - urgency : "low" | "medium" | "high"`,
    messages: [{
      role: 'user',
      content: `
Contact: ${contact.first_name} ${contact.last_name}
Profession: ${contact.profession}
Entreprise: ${contact.company} (${contact.company_size})
Niveau Academy: ${contact.academy_level}/5
Points: ${contact.academy_points}
Modules terminés: ${contact.completed_modules.join(', ')}
Dernière activité: ${contact.last_activity_at}
Emails ouverts: ${contact.email_open_rate}%
Interactions totales: ${contact.total_interactions}
Dernier email reçu: "${contact.last_email_snippet}"
      `
    }]
  })
  
  const result = JSON.parse(response.content[0].text)
  
  await adminClient.from('crm_contacts').update({
    score: result.score,
    ai_analysis: result.reasoning,
    score_updated_at: new Date().toISOString(),
  }).eq('id', contactId)
  
  return result
}
```

### 7.3 Conversations CRM en langage naturel

```typescript
// API route : agent CRM conversationnel
// POST /api/crm/chat

export async function POST(req: Request) {
  const { message, conversationId, contactId } = await req.json()
  const session = await requireAuth()
  
  // Charger le contexte : historique de conversation + données CRM
  const conversation = conversationId ? await getConversation(conversationId) : null
  const contactContext = contactId ? await getContactFullContext(contactId) : null
  
  // Construire les tools MCP disponibles
  const tools = buildCrmTools()  // search_contact, log_activity, update_deal, etc.
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    tools,
    system: `Tu es l'assistant CRM de Dermotec Academy. 
    Tu aides l'équipe commerciale à gérer leurs contacts, deals et activités.
    
    CONTEXTE ACTUEL:
    Utilisateur: ${session.user.email}
    Date: ${new Date().toISOString()}
    ${contactContext ? `Contact en focus: ${JSON.stringify(contactContext)}` : ''}
    
    Tu peux:
    - Chercher et analyser des contacts
    - Créer des notes et activités
    - Mettre à jour des deals
    - Générer des emails personnalisés
    - Analyser le pipeline et faire des rapports
    - Suggérer les prochaines actions
    
    Sois concis, professionnel et actionnable.`,
    messages: [
      ...(conversation?.messages ?? []),
      { role: 'user', content: message }
    ]
  })
  
  // Persister la conversation
  await saveConversation(conversationId, message, response.content)
  
  return Response.json({
    content: response.content,
    conversationId: conversationId ?? generateId(),
  })
}
```

### 7.4 Déduplication et nettoyage automatique

```typescript
// n8n workflow : déduplication hebdomadaire
// 1. Trouver les doublons potentiels
// 2. Claude analyse et décide lesquels merger
// 3. Merger automatiquement

async function deduplicateContacts() {
  const duplicates = await adminClient.rpc('find_potential_duplicates')
  
  for (const pair of duplicates) {
    const decision = await claude.messages.create({
      model: 'claude-haiku-4-5',  // Plus rapide/moins cher pour les tâches répétitives
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Ces deux contacts sont-ils la même personne? Réponds UNIQUEMENT par JSON.
        Contact 1: ${JSON.stringify(pair.contact1)}
        Contact 2: ${JSON.stringify(pair.contact2)}
        Format: {"isDuplicate": boolean, "keepId": "id_a_garder", "confidence": 0-100}`
      }]
    })
    
    const result = JSON.parse(decision.content[0].text)
    if (result.isDuplicate && result.confidence > 80) {
      await mergeContacts(result.keepId, pair)
    }
  }
}
```

---

## PARTIE 8 — CHECKLIST D'INTÉGRATIONS PRIORISÉES

### Phase 1 — Foundation (semaine 1-2) — GRATUIT ou quasi

```
✅ Gmail MCP → agent lit/envoie les emails
✅ Google Calendar MCP → agent gère les RDVs
✅ Google Drive MCP → agent accède aux docs
✅ Slack → notifications enrichies
✅ Resend (déjà) → emails transactionnels
✅ Stripe webhooks (déjà) → sync paiements → CRM
✅ PostHog events (déjà) → scoring engagement Academy
```

### Phase 2 — Automatisation (semaine 2-4) — ~50€/mois

```
✅ n8n cloud ou self-hosted → workflows d'automatisation
   ↳ Workflow: inscription Academy → qualification → welcome email
   ↳ Workflow: email entrant → lead créé dans CRM
   ↳ Workflow: payment → deal won → onboarding
✅ Composio → tool calling de l'agent (auth managée)
✅ Cal.com (open-source, gratuit self-hosted) → prise de RDV
✅ Typeform/Tally → formulaires de qualification
```

### Phase 3 — Intelligence (mois 2) — ~100€/mois

```
✅ Apollo.io (starter plan ~50€/mois) → enrichissement contacts
✅ tl;dv ou Fireflies → transcription calls + sync CRM
✅ WhatsApp Business API (via Twilio) → suivi commercial B2B
✅ Agent IA conversationnel dans le CRM (Claude API)
✅ Scoring prédictif automatique
```

### Phase 4 — Scale (mois 3+) — selon ROI

```
✅ LinkedIn Sales Navigator API → données LinkedIn
✅ Clearbit (si Apollo insuffisant) → enrichissement avancé
✅ Pappers/Société.com API → données légales françaises
✅ Intercom ou Crisp → chat en direct + bot
✅ Segment → CDP unifié
✅ Nango → syncs multi-sources avancés
```

---

## PARTIE 9 — CE QUE LES MEILLEURS FONT ET QUE PERSONNE D'AUTRE NE FAIT

### 9.1 Memory Graph — Mémoire long-terme de l'agent

Stocker des entités et leurs relations dans un graphe de connaissance, pas seulement des chats.
- Outil : mem0, Zep, ou custom avec pgvector dans Supabase
- L'agent se souvient que "Marie travaille chez ce spa, a mentionné un projet de formation sur les peelings en mars, son budget est ~5000€"

### 9.2 Proactive Outreach Automatique

L'agent surveille en permanence les signaux et agit sans être sollicité.
```
Signal détecté : Marie Dupont a terminé le module "Peelings avancés" (niveau 4)
+ Son CRM score vient de passer de 45 à 68 sur 100
+ Elle n'a pas été contactée depuis 21 jours
→ Agent envoie automatiquement un email personnalisé
→ Propose une démo de la formation physique peelings
→ Log l'activité dans le CRM
→ Planifie un rappel dans 5 jours si pas de réponse
```

### 9.3 Voice Agent pour le suivi commercial

Via Vocalizen (un de tes projets) ou ElevenLabs + Twilio.
- L'agent peut appeler automatiquement les leads chauds
- Transcrit et analyse la conversation en temps réel
- Synchonise dans le CRM immédiatement

### 9.4 Competitive Intelligence

L'agent monitore les concurrents et enrichit le CRM avec des données de marché.
- Alertes prix concurrents
- Nouvelles formations concurrentes
- Opportunités de positionnement

### 9.5 RAG sur la base documentaire

- L'agent a accès à tous les documents internes (offres de formation, tarifs, conditions, FAQ)
- via vectorisation dans pgvector (Supabase)
- Répond aux questions commerciales avec les données exactes à jour

---

## PARTIE 10 — COÛTS ESTIMÉS

| Outil | Usage | Coût mensuel |
|-------|-------|-------------|
| n8n self-hosted | VPS Hetzner | ~8€ |
| Apollo.io Starter | 200 enrichissements/mois | 49€ |
| Cal.com self-hosted | Prise de RDV | 0€ |
| tl;dv Starter | 5h de transcription/mois | 0€ (freemium) |
| Composio | 10k tool calls/mois | ~25€ |
| Claude API (agent CRM) | ~500k tokens/mois | ~15€ |
| Twilio (WhatsApp) | 100 messages/mois | ~10€ |
| **TOTAL Phase 3** | | **~107€/mois** |

Pour référence : 1 formation Dermotec vendue grâce à l'agent = ROI immédiat.

---

*Fin du guide — Version 1.0 — Mars 2026*
*Sources : Salesforce Agentforce, Notion Custom Agents, Slack MCP, n8n, Composio, Nango, Google MCP, Anthropic MCP, HubSpot Breeze*
