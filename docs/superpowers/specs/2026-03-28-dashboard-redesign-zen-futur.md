# Design Spec — Dashboard Redesign "Zen Futur"

**Date** : 2026-03-28
**Auteur** : Claude Code + Hayou
**Statut** : Approuvé
**Scope** : Toutes les pages dashboard CRM (34 pages)

---

## 1. Vision

**"Minimalisme premium"** — Simple comme une app iPhone, moderne comme Linear, premium comme Stripe.

Cible : TPE françaises du secteur esthétique/formation. Gérante solo comme directrice multi-centres.
Principe : Interface épurée et intuitive en surface, toutes les fonctionnalités accessibles en profondeur.

**Références visuelles** : Qonto (clarté) × Linear (modernité) × Stripe Dashboard (premium)

---

## 2. Tokens Design — Évolutions

### Couleurs — Ce qui change

| Token | Avant | Après | Pourquoi |
|-------|-------|-------|----------|
| `--color-background` | `#FAF8F5` (papier) | `#FFFFFF` (blanc pur) | Plus moderne, plus clean |
| `--color-surface` | `#FFFFFF` | `#FFFFFF` | Inchangé |
| `--color-surface-hover` | `#FAF8F5` | `#FAFAFA` | Gris neutre ultra-léger |
| `--color-surface-active` | `#F4F0EB` | `#F5F5F5` | Neutre, pas chaud |
| `--color-border` | `#EEEEEE` | `#F0F0F0` | Plus subtil |
| `--color-border-light` | `#F4F0EB` | `#F7F7F7` | Ultra-fin |

### Couleurs — Ce qui NE change PAS

- Primary orange `#FF5C00` — intact
- Accent noir sidebar `#1A1A1A` — intact
- Action rose `#FF2D78` — intact
- Sémantique (success, warning, error, info) — intact
- Texte (`#111111`, `#3A3A3A`, `#777777`) — intact

### Typographie — Évolutions

| Élément | Avant | Après |
|---------|-------|-------|
| Line-height body | 1.5 | 1.6 |
| Taille KPI chiffres | 24-30px | 36-48px |
| Taille titres page | 24px | 28-30px |
| Espacement entre sections | gap-6 (24px) | gap-8 (32px) |
| Padding cards | p-4 (16px) | p-5 (20px) ou p-6 (24px) |

### Ombres — Évolutions

| Token | Avant | Après |
|-------|-------|-------|
| `--shadow-card` | `0 1px 4px rgba(17,17,17,0.04)` | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)` |
| `--shadow-card-hover` | glow orange 0.14 | `0 8px 25px rgba(255,92,0,0.10), 0 2px 8px rgba(0,0,0,0.04)` |
| NOUVEAU `--shadow-modal` | — | `0 24px 50px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08)` |

### Border Radius — Évolutions

| Élément | Avant | Après |
|---------|-------|-------|
| Cards | 14px | 16px |
| Boutons md/lg | varies | `9999px` (pill) |
| Boutons sm | varies | 10px |
| Inputs | 10px | 12px |
| Modals | 18px | 20px |
| Badges | 9999px | 9999px (inchangé) |

---

## 3. Sidebar — Restructuration complète

### Architecture : 5 sections métier

```
┌──────────────────────┐
│  🟠 SATOREA           │  ← Logo + nom, toujours visible
│                        │
│  QUOTIDIEN             │  ← Section 1, toujours ouverte
│  ◉ Tableau de bord     │
│  ◉ Pipeline            │
│  ◉ Sessions            │
│  ◉ Messages            │
│                        │
│  COMMERCIAL            │  ← Section 2, ouverte par défaut
│  ◉ Leads               │
│  ◉ Contacts            │
│  ◉ Cadences            │
│  ◉ Playbook            │
│                        │
│  FORMATION             │  ← Section 3, ouverte si sessions actives
│  ◉ Inscriptions        │
│  ◉ Stagiaires          │
│  ◉ Academy             │
│  ◉ Catalogue           │
│                        │
│  GESTION               │  ← Section 4, collapsée par défaut
│  ◉ Facturation         │
│  ◉ Financement         │
│  ◉ Commandes           │
│  ◉ Équipe              │
│                        │
│  PILOTAGE              │  ← Section 5, collapsée par défaut
│  ◉ Analytics           │
│  ◉ Performance         │
│  ◉ Qualiopi            │
│  ◉ Audit               │
│                        │
│  ─────────────────     │
│  ◉ Notifications  (3)  │  ← Badge compteur
│  ◉ Réglages            │
│                        │
│  ┌──────────────────┐  │
│  │ 👤 Marie Dupont  │  │  ← Avatar + nom + rôle
│  │   Gérante        │  │
│  └──────────────────┘  │
└──────────────────────┘
```

### Style sidebar

- **Fond** : `#1A1A1A` (noir chaud, inchangé)
- **Titres de section** : `#666666`, uppercase, 10px, letter-spacing 1px, font-weight 600
- **Items inactifs** : `#999999`, 14px, DM Sans
- **Item actif** : `#FFFFFF` texte + barre orange 3px à gauche + fond `rgba(255,92,0,0.08)`
- **Item hover** : `#CCCCCC` texte + fond `#222222`
- **Icônes** : Phosphor duotone, 20px, même couleur que texte
- **Badges** : Pill orange `#FF5C00` avec texte blanc, uniquement sur items nécessitant action
- **Sections collapsibles** : Chevron discret, état mémorisé dans localStorage
- **Largeur** : 260px (fixe), collapsible en mode icônes (64px) sur petit écran
- **Transition** : 200ms ease-out pour collapse/expand

### Interactions sidebar

- Clic sur titre de section → toggle collapse avec animation height
- Clic sur item → navigation + highlight immédiat (optimistic)
- Hover sur item → fond subtil + texte plus clair
- Mode compact (< 1280px) → icônes seules, tooltip au hover
- Mobile → drawer slide-in depuis la gauche

---

## 4. Layout global — Structure type

### Header de page

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Titre de la page                    [Bouton CTA]   │
│  Description courte en gris                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Titre : Bricolage Grotesque, 28px, font-weight 700, `#111111`
- Description : DM Sans, 15px, `#777777`
- Bouton CTA : pill orange, à droite, l'ACTION PRINCIPALE de la page
- Padding : `py-6 px-8` (24px vertical, 32px horizontal)
- Border-bottom : `1px solid #F0F0F0`

### Zone KPIs (quand applicable)

```
┌────────────┐  ┌────────────┐  ┌────────────┐
│   Label    │  │   Label    │  │   Label    │
│    42      │  │  8 500 €   │  │   76%      │
│   +12%  ↑  │  │   -3%  ↓   │  │  stable    │
└────────────┘  └────────────┘  └────────────┘
```

- Cards blanches, border `#F0F0F0`, radius 16px, padding 20px
- Label : 13px, `#777777`, uppercase
- Valeur : 36-48px, font-weight 700, `#111111`, Bricolage Grotesque
- Trend : 13px, vert si positif, rose si négatif, gris si stable
- Animation : countUp au chargement (0 → valeur en 600ms, ease-out)
- Grid : 3 colonnes desktop, 1 colonne mobile (scroll horizontal désactivé)
- Max 3-4 KPIs par page

### Zone contenu principal

- Padding : `px-8 py-6`
- Background : `#FFFFFF`
- Espace entre sections : `gap-8` (32px)
- Cards : border `#F0F0F0`, radius 16px, shadow-card, padding 20-24px
- Hover cards : shadow-card-hover, translateY(-2px), transition 200ms

### Pattern "Résumé + Détail"

Pour les pages riches (facturation, analytics, etc.) :
- Onglets en haut du contenu : "Résumé" | "Détail" | "Historique"
- Onglet style : underline orange sur actif, pas de fond
- Le résumé = KPIs + 5 derniers items + 1 graphique simple
- Le détail = table complète, filtres avancés, export

---

## 5. Composants — Évolutions

### Cards (refonte)

```css
/* Avant */
border: 1px solid #EEEEEE;
border-radius: 14px;
padding: 16px;
box-shadow: 0 1px 4px rgba(17,17,17,0.04);

/* Après — Zen Futur */
border: 1px solid #F0F0F0;
border-radius: 16px;
padding: 20px;
box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
transition: all 200ms ease-out;

/* Hover */
box-shadow: 0 8px 25px rgba(255,92,0,0.10), 0 2px 8px rgba(0,0,0,0.04);
transform: translateY(-2px);
border-color: rgba(255,92,0,0.15);
```

### Boutons

- **Primary** : `bg-[#FF5C00] text-white rounded-full px-6 py-2.5` + ripple
- **Secondary** : `bg-[#1A1A1A] text-white rounded-full px-6 py-2.5`
- **Ghost** : `bg-transparent text-[#3A3A3A] hover:bg-[#F5F5F5] rounded-full`
- **Outline** : `border border-[#F0F0F0] text-[#111111] hover:bg-[#F5F5F5] rounded-full`
- Taille minimum : hauteur 40px (md), 36px (sm), 44px (lg)
- Icône + texte : gap-2, icône 18px

### Badges/Pills

- Plus petits, plus discrets : `px-2.5 py-0.5 text-xs rounded-full`
- Couleurs atténuées : fond pastel + texte saturé
- Pas d'animation pulse sauf notification urgente
- Dot indicator : 6px, couleur sémantique

### Inputs

```css
border: 1px solid #F0F0F0;
border-radius: 12px;
padding: 10px 14px;
font-size: 15px;
background: #FFFFFF;
transition: border-color 200ms, box-shadow 200ms;

/* Focus */
border-color: #FF5C00;
box-shadow: 0 0 0 3px rgba(255,92,0,0.08);
```

### Tables (quand utilisées)

- Header : `bg-[#FAFAFA]`, texte `#777777`, 12px uppercase
- Lignes : alternance subtle `#FFFFFF` / `#FAFAFA`
- Hover ligne : `bg-[#FFF8F5]` (teinte orange ultra-légère)
- Pas de bordures verticales entre colonnes
- Border-bottom entre lignes : `#F5F5F5`
- Radius sur la table entière : 16px (overflow hidden)

### Modals/Dialogs

- Backdrop : `rgba(0,0,0,0.4)` + `backdrop-filter: blur(4px)`
- Card : blanc, radius 20px, shadow-modal, padding 24px
- Animation : scale 0.95→1 + fade, 200ms spring
- Close button : top-right, ghost style

### Empty States

- Illustration SVG centrée (style line-art, couleur `#E0E0E0`)
- Titre : 18px, `#111111`
- Description : 14px, `#777777`
- CTA button : orange pill
- Pas de fond coloré, juste centré sur fond blanc

---

## 6. Pages — Design par page

### 6.1 HOME — Tableau de bord

**Structure :**
```
Header : "Bonjour Marie 👋"           [+ Nouveau lead]
Sous-titre : "Mardi 28 mars — 3 actions en attente"

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Leads actifs│ │ Sessions    │ │ CA pipeline │ │ Conversion  │
│     42      │ │     3       │ │  24 500 €   │ │    32%      │
│   +5 ↑      │ │ cette sem.  │ │  +12% ↑     │ │  +3% ↑      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

┌─ À faire aujourd'hui ────────────────────────────────────────┐
│  🔴 Rappeler Mme Durand (devis en attente depuis 3j)  [📞]  │
│  🟠 Relancer M. Martin (financement OPCO)             [📧]  │
│  🟡 Préparer session "Microblading" du 30/03          [→]   │
└──────────────────────────────────────────────────────────────┘

┌─ Leads chauds ───────────────────────────────────────────────┐
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ Avatar  │  │ Avatar  │  │ Avatar  │                     │
│  │ Sophie  │  │ Nadia   │  │ Claire  │                     │
│  │ Score:85│  │ Score:78│  │ Score:72│                     │
│  │ Microbl.│  │ Mésoth. │  │ BB Glow │                     │
│  │ [Appeler]│ │ [Appeler]│ │ [Appeler]│                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│                                         [Voir tous les leads →] │
└──────────────────────────────────────────────────────────────┘

┌─ Prochaines sessions ────────────────────────────────────────┐
│  30 mar  Microblading Avancé    4/6 inscrits    Marie D.    │
│  02 avr  BB Glow Initiation     6/6 COMPLET     Sophie L.   │
│  05 avr  Mésothérapie Pro       2/8 inscrits    Marie D.    │
│                                      [Voir le planning →]    │
└──────────────────────────────────────────────────────────────┘
```

**Règles :**
- Maximum 4 KPIs
- "À faire" : max 5 items, triés par urgence (rouge→orange→jaune)
- "Leads chauds" : max 5 cards, triés par score décroissant
- "Prochaines sessions" : max 5, triées par date
- Chaque section a un lien "Voir tout →"
- Animation staggered : sections apparaissent une par une (100ms delay)
- Skeleton loading : rectangles gris avec shimmer

### 6.2 PIPELINE — Kanban

**Ce qui change :**
- Cards plus épurées : Nom + formation + score. C'est tout.
- Pas de source, pas de jours, pas d'icônes contact sur la card
- Tout le détail → slide-over au clic
- Colonnes : bande de couleur 3px en haut (pas de fond coloré entier)
- Header colonne : nom + compteur + montant total
- Ajouter toggle "Vue liste" en haut à droite

**Ce qui ne change pas :**
- Drag & drop (dnd-kit) — déjà excellent
- Glow effect sur leads chauds
- Slide-over panel avec détails

**Couleurs colonnes :**
- Nouveau : `#E0E0E0` (gris)
- Contacté : `#FFE0CC` (orange pâle)
- Qualifié : `#FF5C00` (orange)
- Financement : `#FF8C42` (orange clair)
- Inscrit : `#FF2D78` (rose)
- En formation : `#FFE0EF` (rose pâle)
- Formé : `#10B981` (vert)

### 6.3 LEADS — Liste

**Vue par défaut : Cards (pas table)**

```
┌─ Recherche ──────────────────────────────────────────────────┐
│  🔍 Rechercher un lead...          [Filtres] [📥] [+ Lead]  │
│                                                              │
│  Chips: [Tous 142] [Chauds 23] [À relancer 8] [Cette sem.] │
└──────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 🟢 MD        │  │ 🟠 NB        │  │ 🔴 CL        │
│ Marie Durand │  │ Nadia Barka  │  │ Claire Lopez  │
│ Microblading │  │ Mésothérapie │  │ BB Glow       │
│ Score: 85/100│  │ Score: 78/100│  │ Score: 72/100 │
│ Il y a 2h    │  │ Hier         │  │ Il y a 3j     │
│         [···]│  │         [···]│  │          [···] │
└──────────────┘  └──────────────┘  └──────────────┘
```

- Grid : 3 colonnes desktop, 2 tablet, 1 mobile
- Card : avatar (initiales colorées) + nom + formation + score bar + dernier contact
- Menu "..." : Appeler, Email, WhatsApp, Voir profil, Assigner
- Toggle vue : Cards ↔ Table (en haut à droite)
- Smart filters : chips horizontaux scrollables
- Tri : dropdown discret (Récent, Score, Nom, Statut)

### 6.4 SESSIONS — Planning

**Vue par défaut : Liste semaine**

```
Header: "Sessions"                    [+ Nouvelle session]

Onglets: [Cette semaine] [Ce mois] [Calendrier]

┌─ Lundi 28 mars ──────────────────────────────────────────────┐
│  (aucune session)                                            │
├─ Mardi 29 mars ──────────────────────────────────────────────┤
│  09:00  Microblading Avancé   │ Marie D. │ 4/6  │ Confirmée │
├─ Mercredi 30 mars ───────────────────────────────────────────┤
│  09:00  BB Glow Initiation    │ Sophie L.│ 6/6  │ Complet ✓ │
│  14:00  Mésothérapie Pro      │ Marie D. │ 2/8  │ Ouverte   │
└──────────────────────────────────────────────────────────────┘
```

- Jours sans session : ligne grise discrète "(aucune session)"
- Status : badge coloré (Confirmée=vert, Ouverte=orange, Complet=rose)
- Clic → page détail session
- Onglet "Calendrier" → vue mois classique

### 6.5 LEAD/[ID] — Fiche détaillée

**Structure à onglets :**

```
Header: [← Retour]  Marie Durand          Score: 85/100
        Microblading Avancé | Qualifiée    [Appeler] [Email]

Onglets: [Résumé] [Activités] [Documents] [Financement] [Notes]

── Onglet Résumé ──
┌─ Informations ───────────┐  ┌─ Actions rapides ─────────┐
│ Email: marie@gmail.com   │  │ [📞 Appeler]              │
│ Tél: 06 12 34 56 78      │  │ [📧 Envoyer un email]     │
│ Source: Site web          │  │ [💬 WhatsApp]             │
│ Commercial: Sophie L.    │  │ [📄 Créer un devis]       │
│ Depuis: 15 mars 2026     │  │ [📝 Inscrire]             │
└──────────────────────────┘  └───────────────────────────┘

┌─ Timeline récente ───────────────────────────────────────┐
│ 28/03 14:00  Email envoyé — Devis formation             │
│ 27/03 10:30  Appel — Intéressée, demande financement    │
│ 25/03 09:00  Lead créé via formulaire site              │
│                                    [Voir tout →]         │
└──────────────────────────────────────────────────────────┘
```

- Pas de section enrichment/AI visible par défaut → onglet dédié si besoin
- Score affiché en barre de progression orange
- Timeline : max 5 items, le reste dans onglet "Activités"

### 6.6 FACTURATION

```
Header: "Facturation"                  [+ Nouvelle facture]

KPIs:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ CA ce mois   │  │ Impayés      │  │ À émettre    │
│  12 400 €    │  │   2 150 €    │  │     3        │
│  +18% ↑      │  │  2 factures  │  │              │
└──────────────┘  └──────────────┘  └──────────────┘

Onglets: [Récentes] [Toutes] [Impayées] [Statistiques]

── Onglet Récentes ──
Liste des 10 dernières factures en cards/lignes épurées :
| N° | Client | Formation | Montant | Statut | Date |
```

### 6.7 FINANCEMENT

```
Header: "Financement"                  [+ Nouveau dossier]

Kanban simplifié (4 colonnes) :
En attente → Dossier envoyé → Accepté → Refusé

Cards : Nom stagiaire + organisme (OPCO/CPF) + montant + jours
Clic → détail avec checklist documents + timeline
```

### 6.8 ANALYTICS / PERFORMANCE

```
Header: "Analytics"

KPIs row (4)

Onglets: [Vue d'ensemble] [Commercial] [Formation] [Tendances]

Vue d'ensemble :
- Graphique conversion funnel (barres horizontales)
- Graphique CA mensuel (ligne)
- Top formations (barres)
- Sources de leads (pie chart)
```

### 6.9 Autres pages (pattern commun)

Toutes les pages restantes suivent le même pattern :
- Header (titre + description + CTA)
- KPIs si pertinent (max 3-4)
- Contenu principal en cards
- Onglets si contenu riche
- Actions dans "..." menu

Pages concernées : Contacts, Clients, Stagiaires, Apprenants, Équipe, Academy, Catalogue, Qualiopi, Qualité, Audit, Commandes, Cadences, Playbook, Notifications, Messages, Paramètres, Outils, etc.

---

## 7. Animations & Micro-interactions

### Entrées de page
- Fade-in + translateY(8px→0), 300ms, ease-out
- KPIs : countUp animation 600ms
- Cards : stagger 50ms entre chaque card
- Skeleton → contenu : crossfade 200ms

### Hover
- Cards : translateY(-2px) + shadow upgrade, 200ms
- Boutons : scale(1.02), 150ms
- Liens sidebar : fond + texte color, 150ms
- Table rows : fond `#FFF8F5`, 150ms

### Actions
- Bouton clic : ripple effect (déjà en place)
- Toast success : slide-in from top, 3s auto-dismiss
- Modal open : scale(0.95→1) + backdrop fade, 200ms spring
- Drag & drop : spring physics (déjà en place)

### Pas d'animation sur :
- Navigation entre pages (instant, pas de page transition)
- Scroll (pas de parallax, pas de sticky surprises)
- Texte (pas de typewriter effect)

---

## 8. Responsive

### Breakpoints
- Mobile : < 640px — 1 colonne, sidebar drawer, bottom nav
- Tablet : 640-1024px — 2 colonnes, sidebar compacte (icônes)
- Desktop : 1024-1440px — sidebar 260px + contenu
- Large : > 1440px — sidebar 260px + contenu max-width 1200px centré

### Mobile spécifique
- Bottom nav : 5 items (Accueil, Pipeline, Sessions, Messages, Plus)
- Cards en pile (1 colonne)
- KPIs en scroll horizontal
- Touch targets 44×44px minimum
- Pas de hover effects (tap only)
- Swipe pour actions sur les cards (iOS style)

---

## 9. Ordre d'implémentation

| Phase | Pages | Impact |
|-------|-------|--------|
| **Phase 1** | DashboardShell (sidebar + layout) | Toutes les pages |
| **Phase 2** | Home (tableau de bord) | Première impression |
| **Phase 3** | Pipeline (kanban) | Cœur CRM |
| **Phase 4** | Leads (liste) | Usage quotidien |
| **Phase 5** | Sessions (planning) | Formation |
| **Phase 6** | Lead/[id] (fiche) | Détail lead |
| **Phase 7** | Facturation | Business |
| **Phase 8** | Financement | Workflow |
| **Phase 9** | Analytics/Performance | Reporting |
| **Phase 10** | Toutes les autres pages | Harmonisation |

Chaque phase suit le pattern établi. Les tokens et composants de base (Phase 1) cascadent sur toutes les pages.

---

## 10. Ce qu'on NE fait PAS

- ❌ Pas de dark mode
- ❌ Pas de suppression de fonctionnalité
- ❌ Pas de refonte de la logique métier
- ❌ Pas de changement de stack (pas de shadcn, on garde le custom)
- ❌ Pas de nouvelles pages
- ❌ Pas de changement de couleurs principales (orange, rose, noir)
- ❌ Pas de changement de fonts (DM Sans, Bricolage Grotesque)
- ❌ Pas de bleu, violet, cyan en production

---

*Design Spec "Zen Futur" — CRM Satorea*
*Orange #FF5C00 · Rose #FF2D78 · Noir #1A1A1A · Blanc #FFFFFF*
*"Minimalisme premium — respire mais ne cache rien"*
