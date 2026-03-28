# Zen Futur Phase 1 — Tokens + Composants + Sidebar + Home

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le design dashboard CRM de "bon" à "premium" — fond blanc, sidebar 5 sections, composants modernisés, home page repensée.

**Architecture:** Modifier les tokens CSS en premier (cascade sur tout), puis les composants UI de base, puis le DashboardShell (sidebar), puis la Home page. Chaque étape est testable visuellement.

**Tech Stack:** Tailwind v4 (@theme), React 19, Phosphor Icons, Framer Motion, DM Sans + Bricolage Grotesque

---

## File Map

| Action | File | Responsabilité |
|--------|------|---------------|
| Modify | `src/app/globals.css` | Tokens design (couleurs, shadows, radius) |
| Modify | `src/components/ui/Card.tsx` | Card avec nouveau radius, shadow, padding |
| Modify | `src/components/ui/Input.tsx` | Input avec nouveau radius, focus ring |
| Modify | `src/components/ui/Badge.tsx` | Badge couleurs atténuées |
| Modify | `src/components/ui/Skeleton.tsx` | Skeleton sur fond blanc |
| Modify | `src/components/ui/Dialog.tsx` | Dialog avec shadow-modal, radius 20px |
| Modify | `src/components/ui/PageHeader.tsx` | Header 28px, border-bottom |
| Modify | `src/components/ui/Tabs.tsx` | Underline orange actif |
| Modify | `src/components/DashboardShell.tsx` | Sidebar 5 sections métier |
| Modify | `src/app/(dashboard)/page.tsx` | Home page Zen Futur |

---

### Task 1: Tokens Design — globals.css

**Files:**
- Modify: `src/app/globals.css` (lignes @theme)

- [ ] **Step 1: Modifier les tokens de surface et background**

Dans le bloc `@theme`, remplacer :

```css
/* AVANT */
--color-surface-hover: #FAF8F5;
--color-surface-active: #F4F0EB;
--color-background: #FAF8F5;

/* APRÈS */
--color-surface-hover: #FAFAFA;
--color-surface-active: #F5F5F5;
--color-background: #FFFFFF;
```

- [ ] **Step 2: Modifier les tokens de bordures**

```css
/* AVANT */
--color-border: #EEEEEE;
--color-border-light: #F4F0EB;

/* APRÈS */
--color-border: #F0F0F0;
--color-border-light: #F7F7F7;
```

- [ ] **Step 3: Modifier les shadows**

```css
/* AVANT */
--shadow-card: 0 1px 4px rgba(17, 17, 17, 0.04), 0 1px 2px rgba(17, 17, 17, 0.02);
--shadow-card-hover: 0 12px 32px rgba(255, 92, 0, 0.14), 0 4px 12px rgba(17, 17, 17, 0.08);

/* APRÈS */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
--shadow-card-hover: 0 8px 25px rgba(255, 92, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.04);
```

Ajouter après `--shadow-xl` :

```css
--shadow-modal: 0 24px 50px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.08);
```

- [ ] **Step 4: Modifier les border radius**

```css
/* AVANT */
--radius-lg: 14px;
--radius-xl: 18px;

/* APRÈS */
--radius-lg: 16px;
--radius-xl: 20px;
```

- [ ] **Step 5: Modifier le hover-lift pour le nouveau shadow**

Chercher `.hover-lift:hover` et remplacer le translateY :

```css
/* AVANT */
.hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
}

/* APRÈS */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
```

- [ ] **Step 6: Modifier le skeleton gradient pour fond blanc**

```css
/* AVANT */
.skeleton {
  background: linear-gradient(90deg, #F4F0EB 25%, #EDE8E0 50%, #F4F0EB 75%);
}

/* APRÈS */
.skeleton {
  background: linear-gradient(90deg, #F5F5F5 25%, #EEEEEE 50%, #F5F5F5 75%);
}
```

- [ ] **Step 7: Vérifier visuellement**

Run: `npm run dev`
Vérifier : fond blanc, bordures plus subtiles, skeleton neutre.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css
git commit -m "design(tokens): Zen Futur — fond blanc, shadows subtiles, radius modernisés"
```

---

### Task 2: Card.tsx — Nouveau style

**Files:**
- Modify: `src/components/ui/Card.tsx`

- [ ] **Step 1: Mettre à jour le border et radius de la Card de base**

Remplacer dans la classe de base du composant Card :

```tsx
// AVANT
'bg-white rounded-xl border border-[#F4F0EB] shadow-card'

// APRÈS
'bg-white rounded-2xl border border-[var(--color-border)] shadow-card'
```

Note : `rounded-2xl` = 16px en Tailwind, correspond au nouveau `--radius-lg`.

- [ ] **Step 2: Mettre à jour le hover effect**

Remplacer la classe hover de `.hover-lift` ou le hover inline :

```tsx
// AVANT
'hover:border-[#EEEEEE]'

// APRÈS
'hover:border-[rgba(255,92,0,0.15)]'
```

- [ ] **Step 3: Mettre à jour CardFooter border**

```tsx
// AVANT
'border-t border-[#F4F0EB]'

// APRÈS
'border-t border-[var(--color-border)]'
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Card.tsx
git commit -m "design(card): Zen Futur — radius 16px, border tokens, hover orange"
```

---

### Task 3: Input.tsx — Nouveau radius et focus

**Files:**
- Modify: `src/components/ui/Input.tsx`

- [ ] **Step 1: Mettre à jour le border radius et border color**

```tsx
// AVANT
'w-full rounded-lg border bg-white text-sm transition-colors'
// et
'border-[#EEEEEE]'

// APRÈS
'w-full rounded-xl border bg-white text-sm transition-colors'
// et
'border-[var(--color-border)]'
```

- [ ] **Step 2: Mettre à jour le focus ring**

```tsx
// AVANT
'focus:border-primary focus:ring-2 focus:ring-primary/15'

// APRÈS
'focus:border-primary focus:ring-2 focus:ring-primary/10 focus:shadow-[0_0_0_3px_rgba(255,92,0,0.08)]'
```

- [ ] **Step 3: Mettre à jour le disabled state**

```tsx
// AVANT
'disabled:bg-[#FAF8F5]'

// APRÈS
'disabled:bg-[#FAFAFA]'
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Input.tsx
git commit -m "design(input): Zen Futur — radius 12px, focus ring orange subtil"
```

---

### Task 4: Badge.tsx — Couleurs atténuées

**Files:**
- Modify: `src/components/ui/Badge.tsx`

- [ ] **Step 1: Remplacer les couleurs de fond par des versions plus atténuées**

Dans l'objet variants, mettre à jour :

```tsx
// AVANT
default: 'bg-[#F4F0EB] text-[#3A3A3A]',
// APRÈS
default: 'bg-[#F5F5F5] text-[#3A3A3A]',

// AVANT
primary: 'bg-primary/10 text-primary-dark',
// APRÈS
primary: 'bg-[#FFF5EE] text-[#E65200]',
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Badge.tsx
git commit -m "design(badge): Zen Futur — couleurs atténuées, fond neutre"
```

---

### Task 5: Dialog.tsx — Shadow modal et radius

**Files:**
- Modify: `src/components/ui/Dialog.tsx`

- [ ] **Step 1: Mettre à jour le radius et shadow du contenu**

```tsx
// AVANT
'bg-white rounded-2xl shadow-xl p-6'

// APRÈS
'bg-white rounded-[20px] shadow-[var(--shadow-modal)] p-6'
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Dialog.tsx
git commit -m "design(dialog): Zen Futur — shadow modal, radius 20px"
```

---

### Task 6: PageHeader.tsx — Nouveau style

**Files:**
- Modify: `src/components/ui/PageHeader.tsx`

- [ ] **Step 1: Agrandir le titre et ajouter la description en gris**

```tsx
// AVANT
'text-2xl font-bold text-accent tracking-tight'

// APRÈS
'text-[28px] font-bold text-accent tracking-tight leading-tight'
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/PageHeader.tsx
git commit -m "design(page-header): Zen Futur — titre 28px"
```

---

### Task 7: Skeleton.tsx — Fond neutre

**Files:**
- Modify: `src/components/ui/Skeleton.tsx`

- [ ] **Step 1: Mettre à jour le gradient warm paper → neutre**

```tsx
// AVANT (dans le composant, pas le CSS)
background: 'linear-gradient(90deg, #F4F0EB 25%, #EDE8E0 50%, #F4F0EB 75%)'

// APRÈS
background: 'linear-gradient(90deg, #F5F5F5 25%, #EEEEEE 50%, #F5F5F5 75%)'
```

Si le skeleton utilise la classe CSS `.skeleton` de globals.css (déjà modifié en Task 1), vérifier qu'il n'y a pas de gradient inline hardcodé dans le composant.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Skeleton.tsx
git commit -m "design(skeleton): Zen Futur — gradient neutre fond blanc"
```

---

### Task 8: DashboardShell — Sidebar 5 sections métier

**Files:**
- Modify: `src/components/DashboardShell.tsx`

C'est la tâche la plus complexe. La sidebar actuelle a 5 items plats avec `COLLAPSIBLE_SECTIONS = []`. On doit restructurer en 5 sections métier collapsibles.

- [ ] **Step 1: Remplacer TOP_ITEMS et COLLAPSIBLE_SECTIONS**

Remplacer l'ancien `TOP_ITEMS` (lignes ~80-86) et `COLLAPSIBLE_SECTIONS` (ligne ~91) par :

```tsx
import {
  HouseSimple, UsersThree, CalendarBlank, ChartBar, GearSix,
  Chalkboard, Certificate, CreditCard as PhCreditCard,
  Megaphone, Target, BookOpen, GraduationCap, ChartPie,
  ShieldCheck, ClipboardText, UserCircle, Receipt, Wallet,
  ShoppingBag, Users, TrendUp, Eye
} from '@phosphor-icons/react'

// Items toujours visibles en haut (hors sections)
const PINNED_ITEMS: NavItem[] = []

// 5 sections métier
const NAV_SECTIONS = [
  {
    id: 'quotidien',
    label: 'QUOTIDIEN',
    defaultOpen: true,
    items: [
      { href: '/', label: 'Tableau de bord', icon: HouseSimple },
      { href: '/pipeline', label: 'Pipeline', icon: Target },
      { href: '/sessions', label: 'Sessions', icon: CalendarBlank },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ]
  },
  {
    id: 'commercial',
    label: 'COMMERCIAL',
    defaultOpen: true,
    items: [
      { href: '/leads', label: 'Leads', icon: UsersThree },
      { href: '/contacts', label: 'Contacts', icon: UserCircle },
      { href: '/cadences', label: 'Cadences', icon: Megaphone },
      { href: '/playbook', label: 'Playbook', icon: BookOpen },
    ]
  },
  {
    id: 'formation',
    label: 'FORMATION',
    defaultOpen: false,
    items: [
      { href: '/inscriptions', label: 'Inscriptions', icon: ClipboardText },
      { href: '/stagiaires', label: 'Stagiaires', icon: GraduationCap },
      { href: '/academy', label: 'Academy', icon: Chalkboard },
      { href: '/catalogue', label: 'Catalogue', icon: Certificate },
    ]
  },
  {
    id: 'gestion',
    label: 'GESTION',
    defaultOpen: false,
    items: [
      { href: '/facturation', label: 'Facturation', icon: Receipt },
      { href: '/financement', label: 'Financement', icon: Wallet },
      { href: '/commandes', label: 'Commandes', icon: ShoppingBag },
      { href: '/equipe', label: 'Équipe', icon: Users },
    ]
  },
  {
    id: 'pilotage',
    label: 'PILOTAGE',
    defaultOpen: false,
    items: [
      { href: '/analytics', label: 'Analytics', icon: ChartBar },
      { href: '/performance', label: 'Performance', icon: TrendUp },
      { href: '/qualiopi', label: 'Qualiopi', icon: ShieldCheck },
      { href: '/audit', label: 'Audit', icon: Eye },
    ]
  },
]

// Items en bas de la sidebar
const BOTTOM_ITEMS: NavItem[] = [
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/reglages', label: 'Réglages', icon: GearSix },
]
```

- [ ] **Step 2: Créer le composant SidebarSection**

Ajouter dans DashboardShell.tsx, avant le composant principal :

```tsx
function SidebarSection({
  section,
  collapsed,
  isOpen,
  onToggle,
  pathname
}: {
  section: typeof NAV_SECTIONS[0]
  collapsed: boolean
  isOpen: boolean
  onToggle: () => void
  pathname: string
}) {
  if (collapsed) {
    // Mode compact : juste les icônes, pas de titre de section
    return (
      <div className="space-y-1 px-2">
        {section.items.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Tooltip key={item.href} content={item.label} side="right" delay={0}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150',
                  active
                    ? 'bg-[rgba(255,92,0,0.08)] text-white'
                    : 'text-[#999999] hover:text-[#CCCCCC] hover:bg-[#222222]'
                )}
              >
                <Icon size={20} weight={active ? 'fill' : 'duotone'} />
                {active && (
                  <span className="absolute left-0 w-[3px] h-6 bg-primary rounded-r-full" />
                )}
              </Link>
            </Tooltip>
          )
        })}
      </div>
    )
  }

  return (
    <div className="mb-1">
      {/* Section title — clickable to toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-2 group"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[1px] text-[#666666]">
          {section.label}
        </span>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-[#666666] transition-transform duration-200',
            !isOpen && '-rotate-90'
          )}
        />
      </button>

      {/* Section items — collapsible */}
      {isOpen && (
        <div className="space-y-0.5 px-2 animate-fadeIn">
          {section.items.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-all duration-150',
                  active
                    ? 'bg-[rgba(255,92,0,0.08)] text-white font-medium'
                    : 'text-[#999999] hover:text-[#CCCCCC] hover:bg-[#222222]'
                )}
              >
                {active && (
                  <span className="absolute left-0 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <Icon size={20} weight={active ? 'fill' : 'duotone'} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Remplacer le rendu de la sidebar (navigation section)**

Remplacer la section de navigation dans le JSX de la sidebar (entre le header et le footer) par :

```tsx
{/* Navigation sections */}
<nav className="flex-1 overflow-y-auto py-2 space-y-2 scrollbar-thin">
  {NAV_SECTIONS.map(section => (
    <SidebarSection
      key={section.id}
      section={section}
      collapsed={collapsed}
      isOpen={expandedSections.has(section.id) ?? section.defaultOpen}
      onToggle={() => {
        setExpandedSections(prev => {
          const next = new Set(prev)
          if (next.has(section.id)) {
            next.delete(section.id)
          } else {
            next.add(section.id)
          }
          localStorage.setItem('sidebar-expanded', JSON.stringify([...next]))
          return next
        })
      }}
      pathname={pathname}
    />
  ))}
</nav>
```

- [ ] **Step 4: Initialiser les sections ouvertes par défaut**

Modifier l'initialisation de `expandedSections` pour utiliser les defaultOpen des sections :

```tsx
const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
  if (typeof window === 'undefined') return new Set(NAV_SECTIONS.filter(s => s.defaultOpen).map(s => s.id))
  try {
    const saved = localStorage.getItem('sidebar-expanded')
    if (saved) return new Set(JSON.parse(saved))
    // Par défaut : ouvrir quotidien + commercial
    return new Set(NAV_SECTIONS.filter(s => s.defaultOpen).map(s => s.id))
  } catch { return new Set(['quotidien', 'commercial']) }
})
```

- [ ] **Step 5: Mettre à jour le profil utilisateur dans le footer**

Remplacer le profil hardcodé "Admin" par les données du currentUser :

```tsx
<div className={cn(
  'flex items-center gap-2.5 rounded-lg p-2 hover:bg-white/5 transition cursor-pointer group',
  collapsed && 'justify-center'
)}>
  <Avatar
    name={currentUser?.prenom || currentUser?.nom || 'User'}
    size="sm"
    color="var(--color-primary)"
    status="online"
  />
  {!collapsed && (
    <div className="flex-1 min-w-0">
      <p className="text-[12px] font-medium text-slate-300 truncate">
        {currentUser?.prenom || 'Utilisateur'}
      </p>
      <p className="text-[10px] text-slate-500 truncate">
        {currentUser?.role || 'Commercial'}
      </p>
    </div>
  )}
</div>
```

- [ ] **Step 6: Ajouter les items du bas (Notifications + Réglages)**

Avant le profil utilisateur, ajouter la section bottom items :

```tsx
{/* Separator */}
<div className="border-t border-white/10 mx-3 my-2" />

{/* Bottom items */}
<div className="space-y-0.5 px-2 mb-2">
  {BOTTOM_ITEMS.map(item => {
    const Icon = item.icon
    const active = pathname.startsWith(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'relative flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-all duration-150',
          active
            ? 'bg-[rgba(255,92,0,0.08)] text-white font-medium'
            : 'text-[#999999] hover:text-[#CCCCCC] hover:bg-[#222222]',
          collapsed && 'justify-center'
        )}
      >
        <Icon size={20} weight={active ? 'fill' : 'duotone'} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    )
  })}
</div>
```

- [ ] **Step 7: Mettre à jour la largeur de la sidebar**

```tsx
// AVANT
collapsed ? 'w-[64px]' : 'w-[240px]'

// APRÈS
collapsed ? 'w-[64px]' : 'w-[260px]'
```

- [ ] **Step 8: Mettre à jour la fonction isActive() pour les nouvelles routes**

La fonction `isActive` doit supporter toutes les routes des 5 sections. Simplifier :

```tsx
function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}
```

Les mappings parent→enfant ne sont plus nécessaires car chaque page a maintenant son propre item de navigation.

- [ ] **Step 9: Vérifier visuellement**

Run: `npm run dev`
Vérifier :
- 5 sections dans la sidebar avec titres en uppercase
- Sections Quotidien et Commercial ouvertes par défaut
- Sections Formation, Gestion, Pilotage fermées par défaut
- Clic sur titre de section → toggle avec animation
- Item actif = barre orange à gauche + fond subtil
- Mode compact (sidebar collapsed) = icônes seules avec tooltips
- Profil utilisateur en bas

- [ ] **Step 10: Commit**

```bash
git add src/components/DashboardShell.tsx
git commit -m "design(sidebar): Zen Futur — 5 sections métier, collapsibles, profil dynamique"
```

---

### Task 9: Home Page — Refonte complète

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Refonte du greeting header**

Remplacer la section greeting existante par un header plus épuré :

```tsx
{/* Header épuré */}
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-[28px] font-bold text-accent tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
      {getGreeting()} {currentUser?.prenom || ''} 👋
    </h1>
    <p className="text-[15px] text-[#777777] mt-1">
      {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
      {overdueCount > 0 && ` — ${overdueCount} action${overdueCount > 1 ? 's' : ''} en attente`}
    </p>
  </div>
  <Button href="/leads" variant="primary" size="md">
    + Nouveau lead
  </Button>
</div>
```

- [ ] **Step 2: Refonte des KPI cards (chiffres géants)**

Remplacer les KPI cards existantes par des cards avec chiffres 36-48px :

```tsx
{/* KPIs */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {[
    { label: 'Leads actifs', value: enPipeline, trend: variationNouveaux, color: '#FF5C00' },
    { label: 'Sessions ce mois', value: sessionsAVenir, color: '#FF2D78' },
    { label: 'CA pipeline', value: formatEuro(caRealise), trend: '+12%', color: '#FF5C00' },
    { label: 'Conversion', value: `${tauxConversion}%`, color: '#10B981' },
  ].map((kpi, i) => (
    <div key={i} className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-card hover:shadow-card-hover hover:translate-y-[-2px] transition-all duration-200">
      <p className="text-[13px] text-[#777777] uppercase tracking-wide font-medium">{kpi.label}</p>
      <p className="text-[36px] font-bold text-accent mt-1 tabular-nums count-up" style={{ fontFamily: 'var(--font-heading)' }}>
        {kpi.value}
      </p>
      {kpi.trend && (
        <p className={cn('text-[13px] mt-1',
          typeof kpi.trend === 'string' && kpi.trend.startsWith('+') ? 'text-[#10B981]' : 'text-[#FF2D78]'
        )}>
          {kpi.trend}
        </p>
      )}
    </div>
  ))}
</div>
```

- [ ] **Step 3: Section "À faire aujourd'hui"**

Remplacer la section "Urgent Actions" par une section plus épurée :

```tsx
{/* À faire aujourd'hui */}
{(overdueRappels.length > 0 || todayRappels.length > 0) && (
  <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-card overflow-hidden">
    <div className="px-5 py-4 border-b border-[var(--color-border)]">
      <h2 className="text-[16px] font-semibold text-accent flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse-soft" />
        À faire aujourd'hui
      </h2>
    </div>
    <div className="divide-y divide-[var(--color-border)]">
      {[...overdueRappels.slice(0, 3), ...todayRappels.slice(0, 2)].map((rappel, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-[#FAFAFA] transition-colors">
          <div className="flex items-center gap-3">
            <span className={cn(
              'w-2 h-2 rounded-full',
              rappel.overdue ? 'bg-[#FF2D78]' : 'bg-[#FF5C00]'
            )} />
            <div>
              <p className="text-[14px] text-accent font-medium">{rappel.lead_nom}</p>
              <p className="text-[13px] text-[#777777]">{rappel.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-[#FFF5EE] text-[#FF5C00] transition-colors">
              <Phone size={18} />
            </button>
            <button className="p-2 rounded-lg hover:bg-[#FFF5EE] text-[#FF5C00] transition-colors">
              <Mail size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 4: Section "Leads chauds" (cards)**

Remplacer la timeline d'activité par des cards de leads chauds :

```tsx
{/* Leads chauds */}
<div>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-[16px] font-semibold text-accent">Leads chauds</h2>
    <Link href="/leads?sort=score" className="text-[13px] text-[#FF5C00] hover:underline">
      Voir tous →
    </Link>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {recentLeads
      ?.filter(l => (l.score_chaud || 0) >= 60)
      .slice(0, 3)
      .map(lead => (
        <Link
          key={lead.id}
          href={`/lead/${lead.id}`}
          className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-card hover:shadow-card-hover hover:translate-y-[-2px] transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={`${lead.prenom} ${lead.nom}`} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-accent truncate">{lead.prenom} {lead.nom}</p>
              <p className="text-[13px] text-[#777777] truncate">{lead.formation_souhaitee}</p>
            </div>
          </div>
          {/* Score bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full score-fill"
                style={{
                  width: `${lead.score_chaud || 0}%`,
                  backgroundColor: (lead.score_chaud || 0) >= 80 ? '#FF5C00' : '#FF8C42'
                }}
              />
            </div>
            <span className="text-[12px] font-semibold tabular-nums text-[#FF5C00]">
              {lead.score_chaud}/100
            </span>
          </div>
          {/* Prochaine action (pattern noCRM) */}
          {lead.prochaine_action && (
            <p className="text-[12px] text-[#777777] mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C42]" />
              {lead.prochaine_action}
            </p>
          )}
        </Link>
      ))}
  </div>
</div>
```

- [ ] **Step 5: Section "Prochaines sessions"**

Ajouter en bas de la page :

```tsx
{/* Prochaines sessions */}
<div>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-[16px] font-semibold text-accent">Prochaines sessions</h2>
    <Link href="/sessions" className="text-[13px] text-[#FF5C00] hover:underline">
      Voir le planning →
    </Link>
  </div>
  <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-card overflow-hidden">
    <div className="divide-y divide-[var(--color-border)]">
      {sessions?.slice(0, 5).map((session, i) => (
        <Link
          key={session.id}
          href={`/session/${session.id}`}
          className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="text-center min-w-[48px]">
              <p className="text-[12px] text-[#777777] uppercase">
                {new Date(session.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div>
              <p className="text-[14px] font-medium text-accent">{session.formation_nom || session.titre}</p>
              <p className="text-[13px] text-[#777777]">{session.formatrice_nom}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#777777] tabular-nums">
              {session.nb_inscrits}/{session.places_max}
            </span>
            <Badge
              variant={session.nb_inscrits >= session.places_max ? 'success' : 'primary'}
              size="sm"
            >
              {session.nb_inscrits >= session.places_max ? 'Complet' : 'Ouvert'}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  </div>
</div>
```

- [ ] **Step 6: Mettre à jour le spacing global**

Remplacer le container principal :

```tsx
// AVANT
<div className="space-y-6">

// APRÈS
<div className="space-y-8 px-2 lg:px-0">
```

- [ ] **Step 7: Mettre à jour le skeleton loading**

Adapter le DashboardSkeleton pour correspondre au nouveau layout :

```tsx
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-64 bg-[#F5F5F5] rounded-lg" />
        <div className="h-4 w-48 bg-[#F5F5F5] rounded-lg mt-2" />
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
            <div className="h-3 w-20 bg-[#F5F5F5] rounded" />
            <div className="h-10 w-24 bg-[#F5F5F5] rounded-lg mt-2" />
          </div>
        ))}
      </div>
      {/* À faire */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
        <div className="h-4 w-40 bg-[#F5F5F5] rounded mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-2 h-2 bg-[#F5F5F5] rounded-full" />
            <div className="h-4 w-48 bg-[#F5F5F5] rounded" />
          </div>
        ))}
      </div>
      {/* Leads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#F5F5F5] rounded-full" />
              <div>
                <div className="h-4 w-28 bg-[#F5F5F5] rounded" />
                <div className="h-3 w-20 bg-[#F5F5F5] rounded mt-1" />
              </div>
            </div>
            <div className="h-1.5 bg-[#F5F5F5] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Vérifier visuellement**

Run: `npm run dev`
Vérifier :
- Greeting épuré avec date + badge actions
- 4 KPIs avec chiffres géants et animation countUp
- Section "À faire" avec items cliquables et actions rapides
- Cards leads chauds avec avatar, score bar, prochaine action
- Prochaines sessions en liste avec date + badge statut
- Spacing aéré (space-y-8)
- Skeleton loading correct

- [ ] **Step 9: Commit**

```bash
git add src/app/(dashboard)/page.tsx
git commit -m "design(home): Zen Futur — KPIs géants, leads chauds, sessions, prochaine action"
```

---

### Task 10: Build & Vérification finale

- [ ] **Step 1: Build**

```bash
npm run build
```

Si des erreurs TypeScript apparaissent, les corriger.

- [ ] **Step 2: Test visuel**

```bash
npm run dev
```

Vérifier TOUTES les pages affectées :
- [ ] Home page : KPIs, leads chauds, sessions
- [ ] Sidebar : 5 sections, collapse/expand, mobile
- [ ] Pipeline : cards avec nouveau border/shadow
- [ ] Leads : inputs avec nouveau radius
- [ ] Toute page avec Dialog : nouveau shadow

- [ ] **Step 3: Commit final si corrections**

```bash
git add -A
git commit -m "fix: corrections build Phase 1 Zen Futur"
```

---

## Résumé des 10 tâches

| # | Tâche | Fichier | Impact |
|---|-------|---------|--------|
| 1 | Tokens CSS | globals.css | Tout le site |
| 2 | Card | Card.tsx | Cards partout |
| 3 | Input | Input.tsx | Formulaires |
| 4 | Badge | Badge.tsx | Badges partout |
| 5 | Dialog | Dialog.tsx | Modals |
| 6 | PageHeader | PageHeader.tsx | En-tête pages |
| 7 | Skeleton | Skeleton.tsx | Loading states |
| 8 | Sidebar | DashboardShell.tsx | Navigation |
| 9 | Home | page.tsx | Page d'accueil |
| 10 | Build | - | Vérification |
