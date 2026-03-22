# SATOREA CRM — DESIGN SYSTEM LIGHT (Fond Blanc)
## Référence obligatoire pour Claude — Toute interface CRM Satorea/Dermotec

---

## CONTEXTE

**Satorea** = Agence digitale française, SaaS CRM pour TPE esthétique.
**Ce fichier** = Design system LIGHT pour le CRM (outil de travail quotidien du commercial).
**Différence avec SATOREA_DESIGN_SYSTEM.md** = Le site vitrine Satorea est dark (noir/orange/rose). Le CRM est LIGHT (fond blanc, couleurs douces, confort visuel longue durée).

**Pourquoi fond blanc ?** Le commercial passe 8h/jour sur le CRM. Un fond noir fatigue les yeux sur du long terme. Le fond blanc + tons chauds crée un confort premium adapté au secteur beauté.

---

## PALETTE CRM — FOND BLANC

### SURFACES (fond blanc chaud, pas froid)
```
--color-background:      #FFFFFF   → Fond principal (cards, conteneurs)
--color-surface:         #FFFFFF   → Surface cards
--color-surface-hover:   #FAF8F5   → Hover léger (crème chaud)
--color-surface-active:  #F5F0EA   → Active / sélectionné
--color-surface-raised:  #FFFFFF   → Cards élevées (avec shadow)
--color-page-bg:         #FAF8F5   → Fond de page (crème, pas gris)
```
**RÈGLE** : Jamais de `#F8FAFC` (gris froid). Toujours `#FAF8F5` (crème chaud) pour le fond de page.

### PRIMARY — Orange Satorea adapté (chaleur, action)
```
--color-primary:         #D4A574   → Rose Gold (version douce de l'orange Satorea)
--color-primary-dark:    #B8895A   → Hover
--color-primary-light:   #E8C9A8   → Fond léger
--color-primary-50:      #FDF8F3   → Fond très léger
--color-primary-100:     #FAEFDF   → Background subtil
--color-primary-200:     #F0D9BE   → Border léger
```
**Usage** : Boutons CTA, icônes actives, liens, éléments de marque, bordure focus.

### ACCENT — Charcoal (sidebar, titres, ancrage visuel)
```
--color-accent:          #1A1A2E   → Sidebar, titres H1/H2, texte fort
--color-accent-light:    #2A2A40   → Hover sidebar, fond sombre secondaire
--color-accent-50:       #F5F5F8   → Fond section très léger
```
**Usage** : Sidebar CRM, en-têtes, badges sombres, texte d'emphase maximale.

### ACTION CTA — Violet (distinction, créativité)
```
--color-action:          #8B5CF6   → Boutons action secondaires, badges IA
--color-action-dark:     #7C3AED   → Hover
--color-action-light:    #EDE9FE   → Fond badge IA
```
**Usage** : Tout ce qui est IA/intelligence, CTA secondaires, tags "premium".

### SÉMANTIQUE (tons adoucis pour le secteur beauté)
```
--color-success:         #6B9080   → Vert doux (pas le #22C55E agressif)
--color-success-light:   #E0EDE6   → Fond success
--color-success-50:      #F0F7F3   → Background subtil

--color-warning:         #D4A754   → Ambre chaud
--color-warning-light:   #FFF3DB   → Fond warning
--color-warning-50:      #FFFBF0

--color-error:           #C25B68   → Rouge doux (pas le #EF4444 vif)
--color-error-light:     #FCE4E8   → Fond erreur
--color-error-50:        #FEF2F4

--color-info:            #6B8CAE   → Bleu doux
--color-info-light:      #E0EBF5
--color-info-50:         #F0F5FA
```
**RÈGLE** : Les couleurs sémantiques sont ADOUCIES par rapport au standard Tailwind. Le secteur beauté/esthétique demande de la douceur, pas de l'agressivité visuelle.

### TEXTE (charcoal doux, JAMAIS noir pur)
```
--color-text:            #2D2D3F   → Texte principal (pas #000000)
--color-text-secondary:  #5C5C72   → Texte descriptions, hints
--color-text-muted:      #9090A7   → Texte discret, timestamps
--color-text-inverse:    #FFFFFF   → Texte sur fond sombre
```

### BORDERS (tons chauds)
```
--color-border:          #E8E0D8   → Bordure standard (pas #E2E8F0 froid)
--color-border-light:    #F5F0EA   → Bordure très subtile
--color-border-focus:    #D4A574   → Focus input = primary
```

### SIDEBAR CRM
```
--color-sidebar-bg:      #1A1A2E   → Fond sidebar (charcoal profond)
--color-sidebar-text:    #B8B8CC   → Texte sidebar
--color-sidebar-active:  #D4A574   → Élément actif (rose gold)
--color-sidebar-hover:   #2A2A40   → Hover items
```

---

## STATUTS PIPELINE CRM

### Leads (11 statuts → 5 groupes couleur)
```
COLD (gris)     : NOUVEAU, CONTACTÉ    → #9090A7
ACTIVE (rose gold) : QUALIFIÉ, FINANCEMENT → #D4A574
HOT (ambre)     : INSCRIT, EN_FORMATION → #D4A754
WON (vert)      : FORMÉ, ALUMNI         → #6B9080
LOST (rouge)    : PERDU, SPAM, REPORTÉ  → #C25B68
```
**RÈGLE** : Chaque statut a une couleur FIXE. Ne jamais changer les associations statut-couleur.

### Paiements
```
PAYÉ       → #6B9080 (vert doux)
EN_ATTENTE → #D4A754 (ambre)
EN_RETARD  → #C25B68 (rouge)
PARTIEL    → #6B8CAE (bleu)
GRATUIT    → #9090A7 (gris)
```

### Priorité actions
```
URGENTE   → #C25B68 (rouge doux)
HAUTE     → #D4A754 (ambre)
NORMALE   → #6B8CAE (bleu)
BASSE     → #9090A7 (gris)
```

---

## TYPOGRAPHIE

```
Font headings :   Bricolage Grotesque (serif — personnalité, distinction)
Font body :       DM Sans (sans-serif — lisibilité, neutralité)
Font mono :       Geist Mono (code, données techniques)

Échelle de tailles :
  text-3xs:  9px   → Micro-labels (badges extrêmes, timestamps)
  text-2xs:  10px  → Labels, sources, hints discrets
  text-xs:   12px  → Descriptions courtes, légendes
  text-sm:   14px  → Corps texte, inputs, buttons
  text-base: 16px  → Titres de section
  text-lg:   18px  → Sous-titres
  text-xl:   20px  → Titres de page
  text-2xl:  24px  → H2
  text-3xl:  30px  → H1

Poids utilisés (3 max) :
  normal (400) → corps texte
  medium (500) → labels, sous-titres
  bold (700)   → titres, KPIs, emphase
```
**RÈGLE** : Jamais plus de 3 poids de police sur le même écran. Jamais `extrabold` ou `black`.

---

## ESPACEMENTS (grille 4px — comme Teams)

```
4px   → gap-1, p-1       → Entre icône et texte
8px   → gap-2, p-2       → Padding interne petit
12px  → gap-3, p-3       → Spacing entre éléments
16px  → gap-4, p-4       → Padding standard cards
24px  → gap-6, p-6       → Spacing entre sections
32px  → gap-8, p-8       → Padding large
48px  → gap-12           → Séparation de zones majeures
```
**RÈGLE** : Tous les espacements sont des multiples de 4px. Jamais 5px, 7px, 9px, 13px.

---

## BORDER RADIUS

```
--radius-sm:    6px    → Petits éléments (badges, tags)
--radius-md:    10px   → Inputs, selects
--radius-lg:    14px   → Cards, sections
--radius-xl:    18px   → Modals, dialogs
--radius-2xl:   24px   → Grands conteneurs
--radius-full:  9999px → Avatars, pills, badges circulaires
```

---

## SHADOWS (ombres chaudes, pas grises)

```
--shadow-xs:         0 1px 2px rgba(26, 26, 46, 0.04)
--shadow-sm:         0 1px 3px rgba(26, 26, 46, 0.06), 0 1px 2px rgba(26, 26, 46, 0.04)
--shadow-md:         0 4px 12px -2px rgba(26, 26, 46, 0.08)
--shadow-lg:         0 12px 24px -4px rgba(26, 26, 46, 0.10)
--shadow-xl:         0 24px 48px -8px rgba(26, 26, 46, 0.12)
--shadow-glow:       0 0 24px rgba(212, 165, 116, 0.20)     → Glow rose gold
--shadow-card:       0 1px 3px rgba(26, 26, 46, 0.04)       → Card au repos
--shadow-card-hover: 0 12px 32px rgba(212, 165, 116, 0.12)  → Card hover (glow chaud)
```
**RÈGLE** : Les ombres utilisent `rgba(26, 26, 46, ...)` (teinte charcoal) pas `rgba(0,0,0,...)` (noir pur). Le hover card a un glow rose gold subtil.

---

## ANIMATIONS CRM

```css
/* Prospect chaud — glow pulsant rose gold */
.glow-hot { animation: glowHot 2.5s ease-in-out infinite; border-left: 3px solid var(--color-primary); }

/* Urgent — pulse rouge doux */
.pulse-urgent { animation: pulseUrgent 2s ease-in-out infinite; border-left: 3px solid var(--color-error); }

/* Badge bounce — attire l'attention */
.bounce-badge { animation: bounceBadge 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }

/* Card hover — lift + glow */
.card-interactive:hover { transform: translateY(-3px); box-shadow: var(--shadow-card-hover); }

/* Row hover — gradient rose gold à gauche */
tr.hover-row:hover { background: linear-gradient(90deg, rgba(212,165,116,0.08), transparent); border-left-color: var(--color-primary); }

/* Stagger reveal — apparition séquentielle filtres */
.filter-reveal-stagger > *:nth-child(n) { animation-delay: calc(n * 30ms); }
```

---

## COMPOSANTS — CONVENTIONS

### Boutons
```
Primary    → bg-primary text-white hover:bg-primary-dark rounded-xl px-4 py-2.5
Secondary  → bg-accent text-white hover:bg-accent-light rounded-xl
Ghost      → bg-transparent text-text-secondary hover:bg-surface-hover rounded-lg
Outline    → border border-border text-text hover:bg-surface-hover rounded-lg
Danger     → bg-error text-white hover:bg-error/90 rounded-xl
```

### Cards
```
Card       → bg-surface border border-border rounded-xl shadow-card
Card hover → hover:shadow-card-hover hover:border-primary/20 transition-all
Card accent → bg-primary-50 border border-primary/20 rounded-xl
```

### Inputs
```
Default    → border border-border rounded-lg px-3 py-2 text-sm bg-white
            focus:border-primary focus:ring-2 focus:ring-primary/20
Error      → border-error focus:ring-error/20
Disabled   → bg-surface-hover text-text-muted cursor-not-allowed
```

### Badges / Pills
```
Default    → bg-accent-50 text-text-secondary px-2 py-0.5 rounded-full text-xs
Success    → bg-success-light text-success
Warning    → bg-warning-light text-warning
Error      → bg-error-light text-error
Primary    → bg-primary-50 text-primary
```

---

## CE QU'ON NE FAIT JAMAIS

1. ❌ **Fond gris froid** (`#F8FAFC`, `#F1F5F9`) → Utiliser `#FAF8F5` (crème chaud)
2. ❌ **Noir pur** (`#000000`) pour le texte → Utiliser `#2D2D3F` (charcoal doux)
3. ❌ **Vert vif** (`#22C55E`, `#10B981`) → Utiliser `#6B9080` (vert doux)
4. ❌ **Rouge vif** (`#EF4444`) → Utiliser `#C25B68` (rouge doux)
5. ❌ **Bleu pur** (`#3B82F6`) → Utiliser `#6B8CAE` (bleu doux)
6. ❌ **Hex hardcodé** dans les composants → Utiliser les classes Tailwind tokens (`text-primary`, `bg-accent`)
7. ❌ **`style={{ color: '#xxx' }}`** sauf pour couleurs dynamiques (statuts pipeline)
8. ❌ **Plus de 3 poids** de police sur un écran
9. ❌ **Espacement non-multiple de 4px**
10. ❌ **Ombres noires** (`rgba(0,0,0,...)`) → Utiliser `rgba(26,26,46,...)`

## CE QU'ON FAIT TOUJOURS

1. ✅ **`cn()`** pour merger les classes (clsx + tailwind-merge)
2. ✅ **Tokens CSS** (`text-primary`, `bg-accent`, `border-border`) partout
3. ✅ **Grille 4px** pour tous les espacements
4. ✅ **Hover CSS** (jamais `onMouseEnter` JS)
5. ✅ **Touch targets 44×44px** minimum sur mobile
6. ✅ **Skeleton loading** au lieu de "Chargement..."
7. ✅ **EmptyState avec CTA** au lieu d'écrans vides
8. ✅ **Feedback optimiste** sur les mutations (cache React Query)
9. ✅ **Raccourcis clavier** pour les actions fréquentes
10. ✅ **Source tracking** sur les données enrichies (👤 manual, 🤖 IA, 📊 API)

---

## MODE COMPACT (Teams-inspired)

Toggle dans le header. Active `html.density-compact` qui réduit :
- Paddings de 25% (p-4 → 10px, p-6 → 16px)
- Gaps de 50% (gap-4 → 8px)
- Font-sizes de 1px (text-sm → 13px, text-xs → 11px)
- Border-radius de 20%
- Heights des headers

Stocké en `localStorage('density-compact')`.

---

*Design System CRM Satorea v3 — "Rose Gold Light"*
*Fond blanc chaud, tons doux, secteur beauté/esthétique*
*Compatible : Tailwind v4, React 19, Next.js 15*
