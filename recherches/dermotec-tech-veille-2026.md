# VEILLE TECHNOLOGIQUE EXHAUSTIVE 2026
## Stack Dermotec Academy — Tout ce qu'il faut savoir

> Généré le 21 mars 2026 | Sources : docs officielles + recherches live
> Périmètre : Next.js 16, React 19.2, TypeScript 5.9, Tailwind v4, Supabase 2026, Testing

---

## 1. NEXT.JS 16 — ÉTAT DE L'ART MARS 2026

### 1.1 Versions et état

- **Next.js 16.2** est la version courante (mars 2026)
- Next.js 16.1 : Turbopack File System Caching stable pour `next dev`
- Next.js 16.2 : AGENTS.md dans create-next-app, browser log forwarding, next-browser (expérimental)
- **Turbopack est maintenant le bundler PAR DÉFAUT** pour `next dev` ET `next build` — plus besoin du flag `--turbopack`
- Gains : 2-5× builds plus rapides, jusqu'à 10× Fast Refresh plus rapide vs Webpack

### 1.2 Cache Components — La révolution caching

**C'est le changement architectural majeur de Next.js 16.**

Le flag expérimental `experimental.ppr` est **supprimé**. Remplacé par `cacheComponents: true` dans next.config.ts.

```typescript
// next.config.ts — 2026
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  cacheComponents: true,      // remplace experimental.ppr
  reactCompiler: true,        // maintenant STABLE
}
export default nextConfig
```

**Comment ça marche :**
- Par défaut, tout le data fetching s'exécute à la demande (request time)
- On opte explicitement dans le cache avec la directive `'use cache'`
- Le résultat = page avec shell statique servi depuis le CDN en <50ms + contenu dynamique streamé
- PPR (Partial Pre-Rendering) est maintenant la **comportement par défaut** avec cacheComponents

**Exemple pattern :**
```typescript
// Composant caché (ex: liste de modules statiques)
'use cache'
export async function ModuleList() {
  const modules = await getModules() // caché
  return <div>{...}</div>
}

// Composant dynamique (ex: progression utilisateur) — entouré de Suspense
export default async function Page() {
  return (
    <main>
      <ModuleList />                        {/* shell statique instantané */}
      <Suspense fallback={<Skeleton />}>
        <UserProgress />                    {/* stream dynamique */}
      </Suspense>
    </main>
  )
}
```

**Nouvelles APIs cache :**
- `cacheLife('days')` / `cacheLife('max')` — profils de durée de cache
- `cacheTag('article-123')` — invalidation par tag
- `revalidateTag('article-123', 'max')` — second argument = profil
- `updateTag()` — nouvelle API Next.js 16
- `refresh()` — refresh précis d'un composant

### 1.3 Turbopack File System Caching

- Stocke les artéfacts compilés sur disque entre les redémarrages
- Gains massifs sur les grands projets : cold start quasi-instantané après le premier build
- Toujours en beta pour le stockage filesystem, stable pour dev
- `next build` avec Turbopack : **stable**, 2-5× plus rapide que Webpack

### 1.4 proxy.ts — Remplace middleware.ts

**Breaking change important :**
- `middleware.ts` est **déprécié** → remplacé par `proxy.ts`
- La runtime Edge **N'EST PLUS SUPPORTÉE** dans proxy
- proxy.ts s'exécute en **Node.js runtime uniquement** (non configurable)
- Raison : clarifier la frontière réseau et les capacités
- Si vous voulez garder l'Edge runtime : continuer avec middleware.ts (toujours fonctionnel)

```typescript
// proxy.ts (remplace middleware.ts)
import type { NextRequest } from 'next/server'
export function proxy(request: NextRequest) {
  // Logique d'auth, redirections, rewrites
  // Runtime : Node.js uniquement
}
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
```

### 1.5 React Compiler — Maintenant STABLE

- Promu de `experimental` à `stable` dans Next.js 16
- Mémoïsation automatique : plus besoin de `useMemo`, `useCallback`, `memo()` manuels
- **Attention** : augmente les temps de compilation (utilise Babel)
- Pas activé par défaut — activer explicitement avec `reactCompiler: true`
- Suivre les mises à jour : pas encore activé par défaut car l'équipe mesure encore l'impact

### 1.6 Enhanced Routing

- **Layout deduplication** : pour 50 liens avec le même layout, le layout est téléchargé UNE seule fois
- **Incremental prefetching** : seules les parties absentes du cache sont préchargées
- Le cache de prefetch annule les requêtes quand le lien quitte le viewport
- Priorité au hover pour le prefetch
- **Aucune modification de code requise** — automatique après upgrade

### 1.7 Nouvelles features Next.js 16.2

- **AGENTS.md** dans les nouveaux projets `create-next-app` — instruit les agents AI (Claude Code, Cursor) à lire la doc Next.js depuis `node_modules/next/dist/docs/` avant d'écrire du code
- **next-browser** (expérimental) : CLI pour agents AI — screenshots, network activity, React component trees, hooks, PPR boundaries
  - Installation : `npx skills add vercel-labs/next-browser`
  - Usage dans Claude Code : `/next-browser`
- **transitionTypes sur next/link** : `<Link href="/about" transitionTypes={['slide']}>` — View Transitions animées selon le contexte de navigation
- **Adapters API** : maintenant stable — permet aux plateformes de déploiement de hooker dans le build
- **Multiple icon formats** : `icon.png` + `icon.svg` côte à côte → deux `<link>` tags séparés
- **Error boundaries au niveau composant** : `error.tsx` plus nécessaire uniquement aux boundaries de segments
- **Cached Navigations** (avec cacheComponents activé) : répétition des visites servie instantanément

### 1.8 Next.js Devtools MCP

- Intégration Model Context Protocol directement dans les Devtools
- Contexte runtime accessible aux outils AI : routes, états de cache, React tree updates
- Debugging moins laborieux sur les apps larges

### 1.9 Sécurité — CVEs critiques 2025-2026

**ATTENTION — Vulnérabilités critiques à patcher IMMÉDIATEMENT :**
- **CVE-2025-29927** : bypass de middleware (auth bypass)
- **CVE-2025-55184** : DoS sur React Server Components (high severity)
- **CVE-2025-55183** : Source code exposure sur RSC (medium severity)
- **CVE-2025-55182** : RCE critique dans RSC (actively exploited)

**Règle absolue** : maintenir Next.js à jour. Pour chaque ligne de version :
- 14.x → 14.2.35+
- 15.x → 15.2.8+
- 16.x → 16.0.10+

### 1.10 Patterns production Next.js 2026

**Server Components en default :**
```typescript
// TOUJOURS par défaut — pas besoin de 'use server'
export default async function Page() {
  const data = await db.query(...)  // direct, pas d'API route
  return <Component data={data} />
}
```

**Minimiser les Client Components :**
```typescript
// ❌ Mauvais — tout devient client
'use client'
export function ProductPage({ product }) {
  const [qty, setQty] = useState(1)
  // ... beaucoup de JSX statique
}

// ✅ Bon — seul le bouton est client
export function ProductPage({ product }) {
  return (
    <div>
      <ProductDetails product={product} />  {/* Server Component */}
      <AddToCartButton productId={product.id} />  {/* Client Component minuscule */}
    </div>
  )
}
```

**Fetches parallèles :**
```typescript
// ❌ Séquentiel — lent
const user = await getUser()
const videos = await getVideos()

// ✅ Parallèle — rapide
const [user, videos] = await Promise.all([getUser(), getVideos()])
```

**Route Handlers — règles :**
- Utiliser pour accéder aux ressources backend depuis des Client Components
- Ne PAS appeler depuis des Server Components (requête serveur → serveur inutile)
- Server Actions pour les mutations (remplacent les API routes pour les formulaires)

**Metadata API :**
```typescript
export const metadata: Metadata = {
  title: 'Dermotec Academy',
  description: '...',
  openGraph: { ... },
}
// ou dynamique :
export async function generateMetadata({ params }) { ... }
```

**Error/Loading/NotFound pour chaque segment :**
```
app/
├── dashboard/
│   ├── page.tsx
│   ├── loading.tsx     // skeleton pendant le stream
│   ├── error.tsx       // error boundary
│   └── not-found.tsx   // 404 custom
```

---

## 2. REACT 19.2 — NOUVELLES PRIMITIVES

### 2.1 État de React en 2026

- **React 19.2** est la version stable (oct 2025)
- Troisième release majeure dans la série React 19 (19.0 fin 2024, 19.1 mi-2025, 19.2 oct 2025)
- **React Foundation** créée : Amazon, Callstack, Expo, Meta, Vercel — nouvelle gouvernance technique
- React Compiler **v1.0** est sorti — mémoïsation automatique stable
- **ESLint plugin** : passer à `eslint-plugin-react-hooks@^6.1.1` pour les nouvelles règles

### 2.2 `<Activity />` — Gérer la visibilité UI

**Cas d'usage : tabs, drawers, sidebars, modals — garder le state sans re-monter.**

```typescript
import { Activity } from 'react'

function TabPanel({ activeTab }) {
  return (
    <>
      <Activity mode={activeTab === 'videos' ? 'visible' : 'hidden'}>
        <VideoList />    {/* State préservé, effets unmountés, updates différés */}
      </Activity>
      <Activity mode={activeTab === 'quiz' ? 'visible' : 'hidden'}>
        <QuizPanel />
      </Activity>
    </>
  )
}
```

**Modes :**
- `'visible'` : rendu normal
- `'hidden'` : `display: none`, effets unmountés, state préservé, updates en basse priorité

**Pourquoi c'est important pour Dermotec :**
- Navigation entre onglets (vidéos / quiz / progression) sans perdre l'état du player
- Sidebar CRM qui préserve les filtres
- Modals qui gardent les données de formulaire

### 2.3 `useEffectEvent` — Callbacks stables dans les Effects

**Problème résolu : les dépendances d'Effect qui ne devraient pas déclencher un re-run.**

```typescript
import { useEffect, useEffectEvent } from 'react'

function VideoPlayer({ videoId, userEmail }) {
  // onWatchEvent voit toujours le dernier userEmail
  // mais ne cause PAS de reconnexion quand userEmail change
  const onWatchEvent = useEffectEvent((percentage: number) => {
    logWatchEvent(videoId, userEmail, percentage)  // userEmail toujours frais
  })

  useEffect(() => {
    const player = initPlayer(videoId)
    player.on('progress', onWatchEvent)
    return () => player.destroy()
  }, [videoId])  // ✅ seul videoId dans les deps
}
```

**Règles :**
- Déclarer dans le même composant/hook que l'Effect
- Ne PAS inclure dans le tableau de dépendances
- Uniquement pour les callbacks qui sont conceptuellement des "événements"
- ESLint `eslint-plugin-react-hooks@6.1.1` le gère correctement

### 2.4 `cacheSignal` — Optimiser les RSC

```typescript
// Server Component
import { cacheSignal } from 'react'

async function UserData({ userId }) {
  const signal = cacheSignal()  // AbortSignal lié au cycle de vie du cache
  const data = await fetch(`/api/users/${userId}`, { signal })
  return <div>{data.name}</div>
}
```

**Pourquoi :** annule les fetch en cours si le rendu est interrompu ou si le cache expire. Évite les requêtes gaspillées côté serveur.

### 2.5 `<ViewTransition>` — Transitions animées natives

```typescript
import { ViewTransition } from 'react'

// Les transitions View se font nativement via l'API web
// React orchestre les animations quand le DOM change
```

**Note :** Encore en préparation pour SSR dans React 19.2. SSR batching amélioré pour permettre des animations sur des sections plus larges.

### 2.6 React Server Components — Patterns sécurisés

**CRITIQUE — vulnérabilités actives en 2025 :**
- Traiter React version, intégration framework/bundler, et `react-server-dom-*` comme **une seule unité de mise à jour**
- Patcher toujours les trois ensemble

**Pattern Data Access Layer (DAL) :**
```typescript
// lib/dal.ts — TOUJOURS vérifier l'auth ici, pas seulement dans middleware
import { verifySession } from './auth'

export async function getUserVideos(userId: string) {
  const session = await verifySession()  // ← vérification à chaque appel
  if (!session || session.userId !== userId) {
    throw new Error('Unauthorized')
  }
  return db.videos.findMany({ where: { userId } })
}
```

### 2.7 Actions React — Mutations standardisées

```typescript
'use client'
import { useActionState, useOptimistic } from 'react'

function QuizForm({ questionId }) {
  const [state, submitAnswer, isPending] = useActionState(
    async (prevState, formData) => {
      const answer = formData.get('answer')
      return await submitQuizAnswer(questionId, answer)
    },
    null
  )

  const [optimisticScore, addOptimistic] = useOptimistic(
    state?.score ?? 0,
    (current, newPoints) => current + newPoints
  )

  return (
    <form action={submitAnswer}>
      {/* ... */}
      {isPending && <Spinner />}
    </form>
  )
}
```

---

## 3. TYPESCRIPT 5.9 / ROADMAP 7.0

### 3.1 État en mars 2026

- **TypeScript 5.9** est la version courante (Q1 2026)
- TypeScript est devenu le **langage #1 sur GitHub** par nb de contributeurs (août 2025, +66% YoY)
- **Project Corsa** : Microsoft porte le compilateur TypeScript en **Go** — TypeScript 7.0 prévu mi-2026
  - Gains annoncés : 10× builds plus rapides, ~8× amélioration startup éditeur, ~50% moins de mémoire
  - VS Code base : 77.8s → 7.5s avec tsgo. Playwright : 11.1s → 1.1s
- **TypeScript 6.0** = dernière version sur le compilateur JS (Strada) — Q1 2026

### 3.2 Features importantes TypeScript 5.7-5.9

**`using` et `await using` (5.2, stabilisé en prod 5.7+) :**
```typescript
// Explicit Resource Management — DB connections, file handles, etc.
async function processData() {
  await using db = await getDbConnection()  // auto-cleanup garanti
  await using lock = await acquireLock('resource')
  // ... si exception → cleanup automatique dans l'ordre inverse
}
```

**Inferred Type Predicates (5.5) :**
```typescript
// TypeScript infère automatiquement les type guards
const videos = items.filter(item => item.type === 'video')
// videos: Video[] — plus besoin de `is Video` manuel
```

**`NoInfer<T>` (5.4) :**
```typescript
// Empêche TypeScript d'inférer depuis certains paramètres
function createSlots<T>(slots: T, defaultSlot: NoInfer<keyof T>) { ... }
// defaultSlot ne "pollue" plus l'inférence de T
```

**`verbatimModuleSyntax` (5.0) :**
```typescript
// Dans tsconfig.json — OBLIGATOIRE pour les projets modernes
{
  "compilerOptions": {
    "verbatimModuleSyntax": true  // force 'import type' pour les types-only
  }
}
```

**Variable initialization stricte (5.7) :**
```typescript
// TypeScript détecte maintenant les variables non-initialisées dans les nested functions
function foo() {
  let result: number
  if (condition()) { result = compute() }
  printResult()          // TypeScript 5.7+ : erreur si path non-assigné détecté
  function printResult() { console.log(result) }
}
```

**`--erasableSyntaxOnly` (5.8) :**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "erasableSyntaxOnly": true  // interdit enums, parameter properties, decorators expérimentaux
  }
}
// Compatible avec Node.js native TypeScript execution (strip types)
```

**`--module node18` (5.8) :**
- Flag stable pour Node.js 18+ avec ESM natif
- Support de `require()` des modules ECMAScript dans `--module nodenext`

**`strictInference` (5.9) :**
```typescript
{
  "compilerOptions": {
    "strictInference": true  // patterns d'inférence génériques plus stricts
  }
}
```

### 3.3 tsconfig.json recommandé 2026

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "nodenext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "strictInference": true,
    "isolatedModules": true,
    "incremental": true,
    "skipLibCheck": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### 3.4 Préparation TypeScript 7.0 (mid-2026)

**Breaking changes annoncés :**
- `--strict` activé **par défaut**
- `--target ES5` supprimé (baseline ES2015+)
- AMD / UMD / SystemJS modules supprimés
- `moduleResolution: 'node'` (classic) supprimé → warning depuis 5.9

**Actions maintenant :**
1. Activer `--deprecation` flag pour identifier les features dépréciées
2. Migrer loin de `moduleResolution: node` vers `bundler`
3. Supprimer `baseUrl` (déprécié) — utiliser les paths `@/*` à la place
4. Activer `--strict` explicitement (ne pas dépendre du défaut)
5. Remplacer les `enum` par `const` objects (plus compatible avec erasable syntax)

---

## 4. TAILWIND CSS v4 — CSS-FIRST PARADIGM

### 4.1 Ce qui a changé

**Tailwind v4 (janvier 2025, actuellement v4.1)** est une réécriture complète.

**Moteur Oxide (Rust) :**
- 100× builds incrémentiels plus rapides (44ms → <5ms)
- 3-5× builds complets plus rapides
- Lightning CSS comme unique dépendance
- Zéro JavaScript à runtime — CSS pur en sortie

**Configuration CSS-first :**
```css
/* Avant (v3) : tailwind.config.js */

/* Après (v4) : globals.css */
@import "tailwindcss";

@theme {
  /* Design tokens Dermotec */
  --color-brand: oklch(0.78 0.12 75);        /* #d4a853 en OKLCH */
  --color-bg: oklch(0.09 0.01 270);          /* #09090b */
  --color-success: oklch(0.72 0.20 142);     /* #22c55e */
  --color-danger: oklch(0.62 0.22 24);       /* #ef4444 */
  --color-ai: oklch(0.68 0.20 295);          /* #a855f7 */

  --font-display: 'Cal Sans', sans-serif;
  --font-body: 'Geist', sans-serif;
  --font-mono: 'Geist Mono', monospace;

  --breakpoint-xs: 20rem;    /* 320px */
  --breakpoint-3xl: 120rem;  /* 1920px */
}
```

**Nouvelle syntaxe importante :**
```html
<!-- Variables CSS comme valeurs arbitraires -->
<!-- v3 -->  <div class="bg-[--brand-color]">
<!-- v4 -->  <div class="bg-(--brand-color)">

<!-- Container queries natives (plus besoin du plugin) -->
<div class="@container">
  <div class="@md:flex @lg:grid">...</div>
</div>

<!-- 3D transforms natifs -->
<div class="rotate-x-45 rotate-y-12 perspective-500">...</div>

<!-- Variants négatifs -->
<button class="not-disabled:hover:bg-brand">...</button>
<div class="not-[:empty]:p-4">...</div>

<!-- @starting-style pour entry animations -->
<div class="starting:opacity-0 starting:scale-95 transition-all">
```

**Couleurs OKLCH par défaut :**
```css
/* OKLCH = couleurs plus vibrantes, espace colorimétrique P3 wide-gamut */
@theme {
  --color-brand: oklch(0.78 0.12 75);
  /* L=lightness 0-1, C=chroma 0-0.4, H=hue 0-360 */
}
```

**CSS Layers natifs :**
```css
/* v4 génère de vrais CSS layers (pas une implémentation custom) */
@layer theme, base, components, utilities;

@layer utilities {
  .text-brand { color: var(--color-brand); }
}
```

### 4.2 Compatibilité browsers

**Prérequis v4 :** Safari 16.4+, Chrome 111+, Firefox 128+
- Utilise `@property`, `color-mix()`, cascade layers
- **Pas de polyfill possible** — rester sur v3.4 si support legacy requis
- Pour Dermotec (professionnels B2B) : largement compatible

### 4.3 Installation Next.js 16 + Tailwind v4

```bash
# Nouveau projet
npx create-next-app@latest dermotec --typescript --tailwind --eslint --app

# Migration depuis v3
npx @tailwindcss/upgrade

# Pour Next.js (PostCSS)
npm install @tailwindcss/postcss
```

```javascript
// postcss.config.js
export default {
  plugins: { '@tailwindcss/postcss': {} }
}
```

### 4.4 Plugins v4 compatibles

- **@tailwindcss/typography** : mis à jour v4 ✓
- **@tailwindcss/forms** : mis à jour v4 ✓
- **shadcn/ui** : compatible depuis janvier 2026 ✓
- **DaisyUI 5** (fév 2026) : compatible v4 — DaisyUI 4 NE marche PAS
- **Headless UI v2** : compatible sans changement ✓

---

## 5. SUPABASE — PRODUCTION PATTERNS 2026

### 5.1 Architecture recommandée

**Philosophie : "Postgres-first, RLS-first, thin backend"**

```
Client (Next.js) 
  → Supabase Client (@supabase/ssr)
  → PostgREST (port 443, HTTPS)
  → PostgreSQL + RLS
  
Serveur (Server Actions / API Routes)
  → Supabase Admin Client (service_role)
  → PostgreSQL DIRECT (port 6543 — transaction mode, PgBouncer/Supavisor)
```

**Règle absolue des ports :**
- Port **5432** (Session Mode) : uniquement pour connexions longues (migrations, scripts locaux)
- Port **6543** (Transaction Mode, Supavisor) : **OBLIGATOIRE** pour serverless (Vercel, Edge Functions, Server Actions)
  - Évite le pool exhaustion sur Next.js serverless
  - Élimine 50-200ms cold start connection

### 5.2 RLS — Row Level Security en production

**Activer RLS sur TOUTES les tables public — sans exception :**
```sql
-- Template standard pour chaque table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Politique SELECT standard
CREATE POLICY "users_own_data" ON your_table
  FOR SELECT USING (auth.uid() = user_id);

-- Politique INSERT
CREATE POLICY "users_insert_own" ON your_table
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE
CREATE POLICY "users_update_own" ON your_table
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Performance RLS — patterns critiques :**

```sql
-- ❌ Lent : appelle auth.uid() sur chaque ligne
CREATE POLICY "slow" ON videos
  FOR SELECT USING (auth.uid() = user_id);

-- ✅ Rapide : SELECT wrapper = initPlan optimiseur (100× plus rapide sur grandes tables)
CREATE POLICY "fast" ON videos
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Index obligatoire sur la colonne filtrée par RLS
CREATE INDEX CONCURRENTLY idx_videos_user_id ON videos USING btree (user_id);
```

**Security Definer Functions pour les joins complexes :**
```sql
-- ❌ Lent : RLS dans la join table aussi évalué
CREATE POLICY "team_access" ON resources
  FOR SELECT USING (
    exists (select 1 from team_members 
            where auth.uid() = user_id and team_id = resources.team_id)
  );

-- ✅ Rapide : fonction security definer contourne RLS de la join table
CREATE OR REPLACE FUNCTION user_can_access_resource(resource_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT exists (
    select 1 from team_members tm
    join resources r on r.team_id = tm.team_id
    where tm.user_id = auth.uid() and r.id = resource_id
  )
$$;

CREATE POLICY "fast_team_access" ON resources
  FOR SELECT USING ((SELECT user_can_access_resource(id)));
```

**Toujours ajouter un filtre applicatif en plus de RLS :**
```typescript
// Même si RLS filtre déjà, ajouter le filtre permet à PostgreSQL d'utiliser les indexes
const { data } = await supabase
  .from('videos')
  .select('*')
  .eq('user_id', userId)  // ← redondant avec RLS mais BEAUCOUP plus performant
```

### 5.3 Client Supabase — SSR Next.js

```typescript
// lib/supabase/server.ts — Server Components / Server Actions
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}

// lib/supabase/admin.ts — UNIQUEMENT serveur, JAMAIS client
import { createClient } from '@supabase/supabase-js'
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ⚠️ jamais exposé côté client
  { db: { schema: 'public' }, auth: { persistSession: false } }
)
```

### 5.4 Edge Functions — Bonnes pratiques

**Règle des 1 seconde :** Garder les Edge Functions courtes et stateless (<1s execution)

```typescript
// supabase/functions/award-points/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // 1. Auth immédiate
  const authHeader = req.headers.get('Authorization')!
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })
  
  // 2. Logique métier atomique via RPC
  const { data, error: rpcError } = await supabase.rpc('award_points', {
    p_user_id: user.id,
    p_action: 'video_completed',
    p_points: 20,
  })
  
  return Response.json({ success: true, data })
})
```

**Rate limiting Edge Functions (mars 2026) :**
- Nouveau : rate limit sur les appels Edge Function → Edge Function
- Max 5000 req/min par request chain
- Impact uniquement les patterns récursifs/fan-out entre fonctions

### 5.5 Realtime — Usage discipliné

```typescript
// Activer Realtime uniquement sur les tables nécessaires
// Dashboard Supabase → Table Editor → Realtime → activer uniquement INSERT

// ✅ Bon : realtime sur les points (live updates)
const channel = supabase
  .channel('points-updates')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'points_history', 
      filter: `user_id=eq.${userId}` },
    (payload) => updatePoints(payload.new)
  )
  .subscribe()

// Cleanup obligatoire
return () => { supabase.removeChannel(channel) }
```

**Règles Realtime :**
- Disable UPDATE et DELETE events si seul INSERT est nécessaire
- Les politiques RLS s'appliquent aux subscriptions Realtime — vérifier les SELECT policies
- Pour les MVPs : polling + bonne UX > Realtime pour tout

### 5.6 Storage — Patterns sécurisés

```typescript
// Toujours des buckets PRIVÉS
// Accès via signed URLs avec expiration courte

// Server Action pour générer une signed URL
async function getVideoSignedUrl(videoPath: string) {
  const { data } = await adminClient.storage
    .from('videos-protected')
    .createSignedUrl(videoPath, 3600)  // 1 heure max
  return data?.signedUrl
}
```

**Structure de bucket recommandée :**
```
avatars/{userId}/profile.jpg
videos/{moduleId}/{videoId}/thumbnail.jpg
documents/{userId}/{docId}/file.pdf
```

**RLS sur Storage :**
```sql
-- Politique : utilisateur peut uploader uniquement dans son dossier
CREATE POLICY "user_storage_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 5.7 Migrations — Workflow production

```bash
# Créer une migration
supabase migration new add_points_index

# Appliquer en local
supabase db push

# Déployer en production
supabase db push --db-url postgresql://...

# Seed data reproductible
supabase/seed.sql
```

**Toujours committer migrations dans Git. Jamais modifier une migration déployée — créer une nouvelle.**

---

## 6. TESTING — STACK STANDARD 2026

### 6.1 La stack de test recommandée

```
Vitest + React Testing Library  →  unit tests + component tests (Client Components, Server Components sync)
MSW (Mock Service Worker)        →  mock des API routes dans les tests
Playwright                       →  E2E + async Server Components
```

**Jest est OUT pour les nouveaux projets** — Vitest est le standard 2026 pour les apps Vite/Next.js.

### 6.2 Vitest — Configuration Next.js 16

```typescript
// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', '.next/', 'src/test-utils/'],
    },
  },
})
```

```typescript
// src/test-utils/setup.ts
import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
afterEach(() => cleanup())
```

### 6.3 Patterns de tests — App Router

**Client Components :**
```typescript
// src/components/quiz/QuizButton.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QuizButton } from './QuizButton'

describe('QuizButton', () => {
  it('appelle onSubmit avec la bonne réponse', async () => {
    const onSubmit = vi.fn()
    render(<QuizButton onSubmit={onSubmit} />)
    
    await userEvent.click(screen.getByRole('button', { name: /répondre/i }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})
```

**Server Components sync :**
```typescript
// Tester en rendant directement
import { ModuleBadge } from './ModuleBadge'

it('affiche le badge correct pour niveau 3', () => {
  render(<ModuleBadge level={3} />)
  expect(screen.getByText('Expert')).toBeInTheDocument()
})
```

**Async Server Components → Playwright uniquement.**

### 6.4 MSW — Mock Service Worker

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/video/:id/otp', ({ params }) => {
    return HttpResponse.json({ otp: 'mock-token', playbackInfo: {} })
  }),
  
  http.get('/api/user/progress', () => {
    return HttpResponse.json({ points: 450, level: 2, streak: 7 })
  }),
]

// src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)
```

### 6.5 Playwright — Configuration Next.js

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Page Object Model :**
```typescript
// e2e/pages/VideoPage.ts
import { type Page } from '@playwright/test'

export class VideoPage {
  constructor(private page: Page) {}
  
  async watchVideo(videoId: string) {
    await this.page.goto(`/videos/${videoId}`)
    await this.page.waitForSelector('[data-testid="video-player"]')
  }
  
  async completeVideo() {
    await this.page.evaluate(() => {
      document.querySelector('[data-testid="video-player"]')
        ?.dispatchEvent(new CustomEvent('ended'))
    })
  }
  
  async getPoints() {
    return this.page.getByTestId('points-counter').textContent()
  }
}
```

**Tests E2E critiques :**
```typescript
// e2e/gamification.spec.ts
import { test, expect } from '@playwright/test'
import { VideoPage } from './pages/VideoPage'
import { AuthHelper } from './helpers/auth'

test.describe('Gamification flow', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelper.login(page, { email: 'test@dermotec.fr' })
  })

  test('regarde une vidéo → gagne des points', async ({ page }) => {
    const videoPage = new VideoPage(page)
    const initialPoints = await videoPage.getPoints()
    
    await videoPage.watchVideo('video-123')
    await videoPage.completeVideo()
    
    await expect(page.getByTestId('points-counter'))
      .toContainText((parseInt(initialPoints!) + 20).toString())
  })
})
```

### 6.6 Stratégie de couverture

**Pyramide de tests recommandée :**
```
                    [E2E Playwright]
                  ← 5-10 critical flows →
                
            [Integration Vitest + MSW]
          ← 20-30 feature scenarios →
          
      [Unit Vitest]
    ← 100+ fonctions pures, hooks, utils →
```

**Règles :**
- Tester les happy paths ET les error paths (API failures, validation)
- Tester les loading states
- Chaque test doit être isolé — utiliser `beforeEach` pour reset
- E2E : uniquement les parcours critiques (inscription, auth, vidéo complétée, quiz, points)
- Async Server Components : toujours via Playwright

---

## 7. TOOLING & DX — STANDARDS 2026

### 7.1 Package Manager

```bash
# pnpm est le standard 2026 — plus rapide, moins d'espace disque
npm install -g pnpm

# Node.js requis : 20.x LTS minimum, 22.x recommandé
```

### 7.2 ESLint 9 (flat config)

```javascript
// eslint.config.mjs — format flat (plus eslintrc)
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'  // version 6.1.1+
import nextPlugin from '@next/eslint-plugin-next'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    plugins: {
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
    languageOptions: {
      parserOptions: { project: true, tsconfigRootDir: import.meta.dirname },
    },
  },
)
```

### 7.3 Biome — Alternative lint+format

**Biome est de plus en plus adopté en 2026 comme remplacement ESLint+Prettier en un seul outil :**
```bash
npm install --save-dev --save-exact @biomejs/biome
npx biome init
```
- 10-50× plus rapide que ESLint+Prettier
- Moins de configuration

### 7.4 Zod v4 — Validation

```typescript
import { z } from 'zod'

// Schemas Dermotec
const UserProfileSchema = z.object({
  email: z.email(),
  firstName: z.string().min(2).max(50),
  profession: z.enum(['estheticienne', 'dermatologue', 'medecin', 'autre']),
  diploma: z.string().optional(),
})

// Validation Server Actions
async function updateProfile(data: unknown) {
  const parsed = UserProfileSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }
  // ...
}

// Schema pour quiz
const QuizAnswerSchema = z.object({
  questionId: z.uuid(),
  selectedOption: z.number().int().min(0).max(4),
})
```

### 7.5 TanStack Query v5 — Data fetching client

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetch données côté client
function useUserProgress(userId: string) {
  return useQuery({
    queryKey: ['progress', userId],
    queryFn: () => fetch(`/api/progress/${userId}`).then(r => r.json()),
    staleTime: 30_000,  // 30s avant refetch
    gcTime: 5 * 60_000, // 5min en mémoire
  })
}

// Mutation avec invalidation
function useSubmitQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answer: QuizAnswer) => submitAnswer(answer),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['progress'] })
      queryClient.invalidateQueries({ queryKey: ['points'] })
    },
  })
}
```

### 7.6 Motion (ex-Framer Motion) — Animations

```typescript
import { motion, AnimatePresence } from 'motion/react'

// Layout animations — Kanban, listes réordonnables
<Reorder.Group axis="y" values={items} onReorder={setItems}>
  {items.map(item => (
    <Reorder.Item key={item.id} value={item}>
      {item.title}
    </Reorder.Item>
  ))}
</Reorder.Group>

// Stagger reveal au chargement
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300 } }
}

// Level-up animation
import confetti from 'canvas-confetti'
confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
```

### 7.7 Shadcn/ui — Composants

```bash
# Initialisation (compatible Tailwind v4 depuis jan 2026)
npx shadcn@latest init
npx shadcn@latest add button card dialog toast

# Structure : les composants sont copiés dans src/components/ui/
# → modifiable directement, pas une dépendance locked
```

---

## 8. PERFORMANCE WEB — CIBLES ET TECHNIQUES

### 8.1 Core Web Vitals cibles 2026

| Métrique | Cible | Méthode |
|----------|-------|---------|
| LCP | < 1.5s | RSC + `fetchPriority="high"` sur LCP image |
| INP | < 100ms | useTransition pour mutations coûteuses |
| CLS | < 0.05 | next/font auto-hébergé, image dimensions fixes |
| TTFB | < 200ms | Cache Components + Edge CDN |
| Bundle JS | < 150ko/route | RSC + code splitting automatique |

### 8.2 Techniques prioritaires

**React Server Components :**
```typescript
// -62% bundle JS, -65% LCP par rapport à CSR
// Règle : tout en Server Component sauf si besoin explicite de client
```

**Images AVIF :**
```typescript
// next.config.ts
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 1080, 1920],
  qualities: [75],
}

// Composant
<Image
  src="/hero.jpg"
  alt="..."
  width={1920}
  height={1080}
  priority                          // LCP → preload
  fetchPriority="high"
  sizes="100vw"
/>
```

**Fonts auto-hébergées (CLS = 0 garanti) :**
```typescript
import localFont from 'next/font/local'
const calSans = localFont({
  src: '../public/fonts/CalSans-SemiBold.woff2',
  variable: '--font-display',
  display: 'swap',
})
```

**TanStack Virtual pour listes longues :**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

// Pour les listes de > 100 éléments (contacts CRM, historique points)
const virtualizer = useVirtualizer({
  count: contacts.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 72,
  overscan: 5,
})
```

**Speculation Rules API :**
```html
<!-- Navigation instantanée — à mettre dans layout.tsx -->
<script type="speculationrules">
{
  "prefetch": [{ "source": "document", "eagerness": "moderate" }]
}
</script>
```

**Upstash Redis — Rate limiting + cache distributed :**
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),  // 5 req/min pour OTP vidéo
})

// Dans la Route Handler
const { success } = await ratelimit.limit(userId)
if (!success) return new Response('Rate limit exceeded', { status: 429 })
```

---

## 9. AUTH PATTERNS — DEFENSE IN DEPTH

### 9.1 Stratégie de sécurité auth

**Principe : ne JAMAIS dépendre du middleware seul pour l'auth.**

CVE-2025-29927 a démontré que le middleware peut être contourné. L'auth doit être vérifiée à :
1. Middleware/proxy.ts (première couche, optimisation)
2. **Chaque Server Component sensible** (couche obligatoire)
3. **Chaque Server Action** (couche obligatoire)
4. **Chaque Route Handler** (couche obligatoire)

### 9.2 Data Access Layer pattern

```typescript
// lib/auth/session.ts
import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

// cache() = déduplication dans le même rendu React
export const getSession = cache(async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
})

export const requireAuth = cache(async () => {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
})

// lib/dal/videos.ts
export async function getUserVideos() {
  const session = await requireAuth()  // auth vérifiée ici, pas seulement dans middleware
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
  
  return data ?? []
}
```

### 9.3 Sessions streaming (pattern Auth + PPR)

```typescript
// page.tsx — ne pas bloquer sur l'auth
export default async function DashboardPage() {
  const sessionPromise = getSession()  // Promise, pas await
  
  return (
    <main>
      <Header />
      <Suspense fallback={<ProfileSkeleton />}>
        <UserProfile sessionPromise={sessionPromise} />  {/* stream quand prêt */}
      </Suspense>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent sessionPromise={sessionPromise} />
      </Suspense>
    </main>
  )
}
// → Shell apparaît en <100ms, auth + data stream en ~200-400ms
// vs approche bloquante : wait 400ms pour voir quoi que ce soit
```

---

## 10. MONITORING & OBSERVABILITÉ

### 10.1 Stack recommandée

```
Sentry                → erreurs JS, performances, replay sessions
Vercel Speed Insights → Core Web Vitals en production (intégration native)
PostHog (EU)          → analytics produit RGPD-compliant
Upstash               → métriques rate limiting
Supabase Dashboard    → métriques DB, slow queries
```

### 10.2 Sentry Next.js

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
})
```

### 10.3 PostHog — Events à tracker pour Dermotec

```typescript
import posthog from 'posthog-js'

// Events funnel conversion
posthog.capture('video_started', { videoId, moduleId, niveau })
posthog.capture('video_completed', { videoId, watchPercentage: 100 })
posthog.capture('quiz_submitted', { questionId, isCorrect, pointsEarned })
posthog.capture('level_up', { oldLevel, newLevel, totalPoints })
posthog.capture('promo_code_generated', { discount, pointsSpent })
posthog.capture('formation_cta_clicked', { source, userLevel })
```

---

## 11. CLAUDE CODE AGENTS.md — STANDARD 2026

### 11.1 AGENTS.md / CLAUDE.md

Depuis Next.js 16.2, les nouveaux projets incluent un **AGENTS.md** qui instruit les agents AI à lire la documentation Next.js depuis `node_modules/next/dist/docs/` avant d'écrire du code.

**Pattern standard pour projets custom :**
- Le fichier `CLAUDE.md` à la racine du projet = instructions persistantes pour Claude Code
- Section `AGENTS.md` ou `CLAUDE.md` dans chaque sous-répertoire pour contexte spécifique
- Les agents lisent ces fichiers à chaque session

### 11.2 next-browser — Outil pour agents AI

```bash
# Installation
npx skills add vercel-labs/next-browser

# Dans Claude Code
/next-browser tree        # arbre des composants React
/next-browser props       # props + hooks actuels
/next-browser errors      # erreurs + PPR boundaries
/next-browser network     # requêtes réseau
/next-browser screenshot  # capture navigateur
```

---

*Fin de la veille technologique — Version 1.0 — Mars 2026*
*Sources : docs officielles Next.js, React, Supabase, Tailwind, TypeScript + recherches live*
