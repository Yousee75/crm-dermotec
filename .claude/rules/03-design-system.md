# SATOREA CRM — DESIGN SYSTEM v5 "Palette Officielle"
## Source de vérité : globals.css @theme — Ce fichier en est le miroir

---

## CONTEXTE

**Satorea** = Agence digitale française, SaaS CRM pour TPE esthétique.
**Palette** : Orange #FF5C00 · Rose #FF2D78 · Noir #1A1A1A · Papier #FAF8F5
**Source** : satorea_light_options.html — Option B "Blanc Chaud"
**Fond blanc** : Le commercial passe 8h/jour sur le CRM. Fond blanc chaud = confort longue durée.

---

## PALETTE CRM — FOND BLANC CHAUD

### PRIMARY — Orange Satorea (énergie, CTA, conversion)
```
--color-primary:         #FF5C00   → CTA, boutons, liens, focus
--color-primary-dark:    #E65200   → Hover
--color-primary-light:   #FF8C42   → Fond léger, warning
--color-primary-50:      #FFF0E5   → Fond très léger
--color-primary-100:     #FFE0CC   → Background subtil
--color-primary-200:     #FFCAAA   → Border léger
```

### ACCENT — Noir profond Satorea (sidebar, titres, ancrage)
```
--color-accent:          #1A1A1A   → Sidebar, titres H1/H2, texte fort
--color-accent-light:    #3A3A3A   → Hover sidebar
--color-accent-50:       #F5F5F5   → Fond section très léger
```

### ACTION CTA — Rose Hot Pink (distinction, beauté, accent)
```
--color-action:          #FF2D78   → Badges IA, CTA secondaires, accent beauté
--color-action-dark:     #E6186A   → Hover
--color-action-light:    #FFE0EF   → Fond badge
```

### SÉMANTIQUE
```
--color-success:         #10B981   → Vert (conversions, statuts positifs)
--color-success-light:   #D1FAE5
--color-success-50:      #ECFDF5

--color-warning:         #FF8C42   → Orange clair (= primary-light)
--color-warning-light:   #FFF3E8
--color-warning-50:      #FFFAF5

--color-error:           #FF2D78   → Rose (= action, erreurs = accent rose)
--color-error-light:     #FFE0EF
--color-error-50:        #FFF0F5

--color-info:            #6B8CAE   → Bleu doux
--color-info-light:      #E0EBF5
--color-info-50:         #F0F5FA
```

### SURFACES (blanc chaud papier)
```
--color-surface:         #FFFFFF   → Cards, conteneurs
--color-surface-hover:   #FAF8F5   → Hover léger (= fond page)
--color-surface-active:  #F4F0EB   → Active / sélectionné
--color-surface-raised:  #FFFFFF   → Cards élevées (avec shadow)
--color-background:      #FAF8F5   → Fond de page (papier chaud)
```
**RÈGLE** : JAMAIS `#F8FAFC` (gris froid). Toujours `#FAF8F5` (papier chaud).

### TEXTE (noir doux)
```
--color-text:            #111111   → Texte principal
--color-text-secondary:  #3A3A3A   → Descriptions, hints
--color-text-muted:      #777777   → Timestamps, discret
--color-text-inverse:    #FFFFFF   → Texte sur fond sombre
```

### BORDERS
```
--color-border:          #EEEEEE   → Bordure standard
--color-border-light:    #F4F0EB   → Bordure très subtile
--color-border-focus:    #FF5C00   → Focus input = primary
```

### SIDEBAR CRM
```
--color-sidebar-bg:      #111111   → Fond sidebar (noir)
--color-sidebar-text:    #999999   → Texte sidebar
--color-sidebar-active:  #FF5C00   → Élément actif (orange)
--color-sidebar-hover:   #222222   → Hover items
```

---

## STATUTS PIPELINE CRM

### Leads (11 statuts → 4 groupes couleur)
```
COLD (gris)     : NOUVEAU, CONTACTÉ         → #999999
ACTIVE (orange) : QUALIFIÉ, FINANCEMENT     → #FF5C00
HOT (rose)      : INSCRIT, EN_FORMATION     → #FF2D78
WON (vert)      : FORMÉ, ALUMNI             → #10B981
LOST (rose)     : PERDU, SPAM, REPORTÉ      → #FF2D78
```

### Paiements
```
PAYÉ       → #10B981 (vert)
EN_ATTENTE → #FF8C42 (orange clair)
EN_RETARD  → #FF2D78 (rose)
PARTIEL    → #6B8CAE (bleu)
GRATUIT    → #999999 (gris)
```

---

## TYPOGRAPHIE

```
Font headings :   Bricolage Grotesque (serif — personnalité)
Font body :       DM Sans (sans-serif — lisibilité)
Font mono :       Geist Mono (code, données)

Échelle :
  3xs: 9px  | 2xs: 10px | xs: 12px | sm: 14px
  base: 16px | lg: 18px | xl: 20px | 2xl: 24px | 3xl: 30px

Poids (3 max) :
  normal (400) → corps
  medium (500) → labels, sous-titres
  bold (700)   → titres, KPIs
```

---

## ESPACEMENTS (grille 4px)

```
4px  → gap-1  → Entre icône et texte
8px  → gap-2  → Padding interne petit
12px → gap-3  → Spacing entre éléments
16px → gap-4  → Padding standard cards
24px → gap-6  → Spacing entre sections
32px → gap-8  → Padding large
48px → gap-12 → Séparation zones majeures
```

---

## BORDER RADIUS

```
--radius-sm:   6px    → Badges, tags
--radius-md:   10px   → Inputs, selects
--radius-lg:   14px   → Cards, sections
--radius-xl:   18px   → Modals, dialogs
--radius-2xl:  24px   → Grands conteneurs
--radius-full: 9999px → Avatars, pills
```

---

## SHADOWS (ombres chaudes, base #1A1A1A)

```
--shadow-xs:         0 1px 2px rgba(26, 26, 26, 0.05)
--shadow-sm:         0 1px 3px rgba(26, 26, 26, 0.07)
--shadow-md:         0 4px 12px -2px rgba(26, 26, 26, 0.10)
--shadow-lg:         0 12px 24px -4px rgba(26, 26, 26, 0.12)
--shadow-xl:         0 24px 48px -8px rgba(26, 26, 26, 0.14)
--shadow-glow:       0 0 24px rgba(255, 92, 0, 0.25)        → Glow orange
--shadow-card:       0 1px 4px rgba(26, 26, 26, 0.04)       → Card repos
--shadow-card-hover: 0 12px 32px rgba(255, 92, 0, 0.14)     → Card hover (glow orange)
```

---

## COMPOSANTS — CONVENTIONS

### Boutons
```
Primary    → bg-primary text-white hover:bg-primary-dark rounded-xl px-4 py-2.5
Secondary  → bg-accent text-white hover:bg-accent-light rounded-xl
Action     → bg-action text-white hover:bg-action-dark rounded-xl
Ghost      → bg-transparent text-text-secondary hover:bg-surface-hover rounded-lg
Outline    → border border-border text-text hover:bg-surface-hover rounded-lg
Danger     → bg-error text-white hover:bg-error/90 rounded-xl
```

### Cards
```
Card       → bg-surface border border-border rounded-xl shadow-card
Card hover → hover:shadow-card-hover hover:border-primary/20 transition-all
```

### Inputs
```
Default    → border border-border rounded-lg px-3 py-2 text-sm bg-white
            focus:border-primary focus:ring-2 focus:ring-primary/20
```

### Badges / Pills
```
Default    → bg-accent-50 text-text-secondary px-2 py-0.5 rounded-full text-xs
Success    → bg-success-light text-success
Warning    → bg-warning-light text-warning
Error      → bg-error-light text-error
Primary    → bg-primary-50 text-primary
Action     → bg-action-light text-action
```

---

## CE QU'ON NE FAIT JAMAIS

1. ❌ Gris froid (`#F8FAFC`, `#F1F5F9`) → `#FAF8F5`
2. ❌ Noir pur (`#000000`) → `#111111`
3. ❌ Anciennes couleurs v3 (`#D4A574`, `#2EC6F3`, `#6366F1`, `#1A1A2E`)
4. ❌ Hex hardcodé dans composants → tokens Tailwind
5. ❌ Plus de 3 poids de police par écran
6. ❌ Espacement non-multiple de 4px
7. ❌ Ombres noires `rgba(0,0,0,...)` → `rgba(26,26,26,...)`
8. ❌ Classes Tailwind par défaut (`bg-gray-50`, `text-blue-500`) → tokens custom

## CE QU'ON FAIT TOUJOURS

1. ✅ `cn()` pour merger les classes
2. ✅ Tokens CSS (`text-primary`, `bg-accent`, `border-border`)
3. ✅ Grille 4px
4. ✅ Hover CSS (jamais `onMouseEnter` JS)
5. ✅ Touch targets 44×44px minimum mobile
6. ✅ Skeleton loading
7. ✅ EmptyState avec CTA
8. ✅ Feedback optimiste (React Query)

---

*Design System CRM Satorea v5 — "Palette Officielle"*
*Orange #FF5C00 · Rose #FF2D78 · Noir #1A1A1A · Papier #FAF8F5*
*Compatible : Tailwind v4, React 19, Next.js 15*
