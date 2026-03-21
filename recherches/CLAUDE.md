# CLAUDE.md — DERMOTEC ACADEMY
## Instructions pour Claude Code — Partie Technique (Partie 1/N)

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il contient TOUT ce qu'un agent AI doit savoir pour coder correctement ce projet.
> Mis à jour : mars 2026

---

## 0. LIRE EN PREMIER

Avant d'écrire du code :
1. Lire ce fichier en entier
2. Lire `node_modules/next/dist/docs/` pour les APIs Next.js 16
3. Vérifier `.claude/agents/` pour les agents spécialisés disponibles
4. Identifier si la tâche implique un domaine spécialisé (DB → db-specialist, design → design-system, sécurité → security-reviewer)

---

## 1. PROJET — CONTEXTE ET ARCHITECTURE

### 1.1 Ce qu'est Dermotec Academy

Plateforme e-learning B2B pour professionnels de l'esthétique médicale (esthéticiennes, dermato, médecins).

**Modèle : contenu gratuit premium (funnel) → formations physiques payantes.**
- PAS de Qualiopi pour le contenu en ligne
- PAS de monétisation directe du contenu digital
- Les points et niveaux → codes promo sur les formations physiques

### 1.2 Stack technique FIXÉE

```
Framework       : Next.js 16.2+ (App Router, TypeScript strict)
Auth + DB       : Supabase (PostgreSQL + RLS + Edge Functions + Realtime)
Vidéo DRM       : VdoCipher (Widevine + FairPlay — PAS YouTube, PAS Mux)
CSS             : Tailwind CSS v4 (Oxide engine, CSS-first @theme)
Composants      : shadcn/ui (compatible Tailwind v4)
Animations      : Motion (ex-Framer Motion)
State client    : TanStack Query v5 + Zustand pour l'UI state global
Validation      : Zod v4
Testing         : Vitest + React Testing Library + Playwright
Emails          : Resend + React Email
Paiement        : Stripe (codes promo depuis points)
Analytics       : PostHog EU (RGPD-compliant)
Monitoring      : Sentry + Vercel Speed Insights
Rate Limiting   : Upstash Redis
CDN / WAF       : Cloudflare (gratuit)
Bundler         : Turbopack (défaut Next.js 16)
Package manager : pnpm
Node.js         : 22.x LTS
```

### 1.3 Structure du projet

```
dermotec/
├── CLAUDE.md                       ← ce fichier
├── AGENTS.md                       ← instructions agents AI (Next.js 16.2)
├── .claude/
│   ├── settings.json               ← MCP hooks config
│   ├── commands/                   ← commandes custom
│   └── agents/                     ← agents spécialisés
├── src/
│   ├── app/                        ← App Router (Next.js 16)
│   │   ├── (auth)/                 ← Route group : pages non-authentifiées
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/            ← Route group : pages authentifiées
│   │   │   ├── layout.tsx          ← Layout dashboard (Server Component)
│   │   │   ├── page.tsx            ← Home dashboard
│   │   │   ├── videos/
│   │   │   ├── quiz/
│   │   │   ├── progression/
│   │   │   └── profile/
│   │   ├── api/                    ← Route Handlers
│   │   │   ├── video/[id]/route.ts ← OTP VdoCipher
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/route.ts
│   │   │   └── health/route.ts
│   │   ├── globals.css             ← Tailwind v4 @theme
│   │   ├── layout.tsx              ← Root layout
│   │   └── proxy.ts                ← Auth middleware (remplace middleware.ts)
│   ├── components/
│   │   ├── ui/                     ← shadcn/ui components
│   │   ├── video/                  ← VdoCipher player + protections
│   │   ├── quiz/                   ← Quiz Flash components
│   │   ├── gamification/           ← Points, badges, level-up
│   │   ├── layout/                 ← Nav, sidebar, footer
│   │   └── shared/                 ← Composants partagés
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts           ← createServerClient (SSR)
│   │   │   ├── client.ts           ← createBrowserClient
│   │   │   └── admin.ts            ← service_role (UNIQUEMENT server)
│   │   ├── auth/
│   │   │   ├── session.ts          ← getSession, requireAuth (avec cache())
│   │   │   └── types.ts
│   │   ├── dal/                    ← Data Access Layer
│   │   │   ├── videos.ts
│   │   │   ├── quiz.ts
│   │   │   ├── gamification.ts
│   │   │   └── user.ts
│   │   ├── vdocipher/
│   │   │   └── client.ts           ← OTP generation, watermark
│   │   ├── validations/
│   │   │   └── schemas.ts          ← Tous les schemas Zod
│   │   └── utils/
│   ├── hooks/                      ← React hooks client-side
│   ├── stores/                     ← Zustand stores
│   ├── types/                      ← Types TypeScript globaux
│   ├── test-utils/                 ← Setup Vitest + helpers
│   └── mocks/                      ← MSW handlers
├── e2e/                            ← Tests Playwright
│   ├── pages/                      ← Page Object Models
│   ├── helpers/
│   └── specs/
├── supabase/
│   ├── migrations/                 ← SQL migrations versionnées
│   ├── functions/                  ← Edge Functions Deno
│   └── seed.sql                    ← Données de test reproductibles
├── next.config.ts
├── tailwind.config.ts              ← Minimal en v4 (@theme dans CSS)
├── tsconfig.json
├── vitest.config.mts
└── playwright.config.ts
```

---

## 2. RÈGLES DE CODE — NON NÉGOCIABLES

### 2.1 TypeScript strict

```json
// tsconfig.json — ces options sont OBLIGATOIRES
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "isolatedModules": true,
    "moduleResolution": "bundler"
  }
}
```

**Règles TypeScript :**
- `import type` pour tous les imports type-only (`verbatimModuleSyntax`)
- Pas d'`any` — utiliser `unknown` et type guard si nécessaire
- Pas d'`enum` — utiliser `const` objects avec `as const`
- Pas de `!` (non-null assertion) sauf cas exceptionnel justifié en commentaire
- Tous les `useEffect` doivent avoir des deps correctes — utiliser `useEffectEvent` pour les callbacks stables
- Utiliser `using` / `await using` pour les ressources qui nécessitent cleanup

```typescript
// ❌ Non
const status = { PENDING: 'pending', DONE: 'done' }
enum Status { PENDING, DONE }
const x: any = data

// ✅ Oui
const STATUS = { PENDING: 'pending', DONE: 'done' } as const
type Status = typeof STATUS[keyof typeof STATUS]
const x: unknown = data
if (typeof x === 'string') { /* x est string ici */ }
```

### 2.2 Server vs Client Components

**Règle d'or : tout est Server Component par défaut. Ajouter `'use client'` uniquement si nécessaire.**

Un composant DOIT être Client Component uniquement si :
- Utilise `useState`, `useReducer`, `useContext`
- Utilise `useEffect`, `useEffectEvent`
- Utilise des APIs browser (`window`, `document`, `localStorage`)
- Utilise des event handlers (`onClick`, `onChange`, etc.)
- Utilise TanStack Query `useQuery` / `useMutation`

**Pousser `'use client'` le plus bas possible dans l'arbre :**
```typescript
// ❌ Tout le composant devient client à cause d'un seul bouton
'use client'
export function VideoCard({ video, user }) {
  const [liked, setLiked] = useState(false)
  return (
    <div>
      <h2>{video.title}</h2>           {/* statique — gâchis */}
      <p>{video.description}</p>        {/* statique — gâchis */}
      <button onClick={() => setLiked(!liked)}>❤️</button>
    </div>
  )
}

// ✅ Seul le bouton est client
export function VideoCard({ video }) {  // Server Component
  return (
    <div>
      <h2>{video.title}</h2>
      <p>{video.description}</p>
      <LikeButton videoId={video.id} />  {/* Client Component minuscule */}
    </div>
  )
}
```

**Ne PAS appeler des Route Handlers depuis des Server Components.** Appeler directement les fonctions du DAL.

### 2.3 Data Access Layer (DAL) — OBLIGATOIRE

**Chaque accès DB passe par le DAL. Jamais accès Supabase direct depuis un composant page.**

```typescript
// src/lib/dal/videos.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { requireAuth } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function getUserVideos(level?: number) {
  // Auth toujours vérifiée dans le DAL — pas de confiance au middleware seul
  const session = await requireAuth()
  const supabase = await createClient()
  
  const query = supabase
    .from('videos')
    .select(`
      id, title, theme, niveau, duration_seconds, vdocipher_id,
      watch_events!left(completed_at, watch_percentage)
    `)
    .eq('is_published', true)
    .lte('required_level', session.user.app_metadata.level ?? 1)
    .order('ordre', { ascending: true })
  
  if (level !== undefined) {
    query.eq('niveau', level)
  }
  
  const { data, error } = await query
  if (error) throw new Error(`DAL getUserVideos: ${error.message}`)
  return data
}
```

### 2.4 Validation avec Zod

**Tout input utilisateur est validé avec Zod. Aucune exception.**

```typescript
// src/lib/validations/schemas.ts

import { z } from 'zod'

export const VideoIdSchema = z.uuid()
export const QuizAnswerSchema = z.object({
  questionId: z.uuid(),
  selectedOption: z.number().int().min(0).max(4),
})
export const UpdateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  profession: z.enum(['estheticienne', 'dermatologue', 'medecin', 'infirmier', 'autre']),
  diplome: z.string().max(200).optional(),
  phone: z.string().regex(/^(\+33|0)[0-9]{9}$/).optional(),
})

// Dans Server Actions
'use server'
import { UpdateProfileSchema } from '@/lib/validations/schemas'

export async function updateProfile(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = UpdateProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }
  // ... logique
}
```

### 2.5 Error Handling

```typescript
// Composants — toujours error.tsx + loading.tsx + not-found.tsx par segment
// Ne PAS utiliser try/catch dans les Server Components pour contrôler le flux
// Utiliser error boundaries (error.tsx) à la place

// Route Handlers — toujours structurer les erreurs
export async function GET(request: Request) {
  try {
    const data = await getProtectedData()
    return Response.json({ data })
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response('Unauthorized', { status: 401 })
    }
    console.error('GET /api/resource:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// Server Actions — retourner des objets d'erreur, pas throw
export async function submitAnswer(formData: FormData) {
  const session = await requireAuth()
  const parsed = QuizAnswerSchema.safeParse({...})
  if (!parsed.success) return { error: 'Données invalides' }
  
  try {
    const result = await processAnswer(parsed.data)
    return { success: true, data: result }
  } catch {
    return { error: 'Erreur lors de la soumission' }
  }
}
```

---

## 3. NEXT.JS 16 — PATTERNS OBLIGATOIRES

### 3.1 next.config.ts

```typescript
// next.config.ts — configuration Dermotec Academy
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cache Components (remplace experimental.ppr)
  cacheComponents: true,
  
  // React Compiler (mémoïsation automatique — stable Next.js 16)
  // Désactivé par défaut — activer progressivement et mesurer les build times
  // reactCompiler: true,
  
  // Images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'img.vdocipher.com' },
    ],
    deviceSizes: [640, 1080, 1920],
  },
  
  // Sécurité headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  
  // Redirections
  async redirects() {
    return [
      { source: '/home', destination: '/dashboard', permanent: true },
    ]
  },
}

export default nextConfig
```

### 3.2 proxy.ts (auth middleware)

```typescript
// src/app/proxy.ts — remplace middleware.ts (Next.js 16)
// Runtime : Node.js uniquement (pas Edge)
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
        },
      },
    }
  )
  
  // Rafraîchir la session (ne PAS bloquer sur ça pour les perfs)
  const { data: { session } } = await supabase.auth.getSession()
  
  // Routes protégées
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/register')
  
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**IMPORTANT : Le proxy/middleware ne suffit PAS pour la sécurité.** Toujours vérifier l'auth dans les Server Components via `requireAuth()` du DAL.

### 3.3 Cache Components — Utilisation

```typescript
// 'use cache' — données qui changent rarement (modules, catégories)
'use cache'
import { cacheTag, cacheLife } from 'next/cache'

export async function ModulesList() {
  cacheTag('modules')
  cacheLife('days')  // expire au bout de 24h
  
  const supabase = await createClient()
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('is_published', true)
    .order('ordre')
  
  return <ModulesGrid modules={modules ?? []} />
}

// Données dynamiques — dans Suspense, sans 'use cache'
export default async function DashboardPage() {
  return (
    <main>
      {/* Shell statique — servi depuis CDN en <50ms */}
      <DashboardHeader />
      
      {/* Données cachées — réutilisées entre navigations */}
      <ModulesList />
      
      {/* Données dynamiques — streamées à la demande */}
      <Suspense fallback={<ProgressSkeleton />}>
        <UserProgressSection />
      </Suspense>
      
      <Suspense fallback={<LeaderboardSkeleton />}>
        <Leaderboard />
      </Suspense>
    </main>
  )
}

// Invalidation manuelle du cache (Server Action)
'use server'
import { revalidateTag } from 'next/cache'

export async function publishModule(moduleId: string) {
  await updateModulePublished(moduleId, true)
  revalidateTag('modules')  // invalide tous les composants taggés 'modules'
}
```

### 3.4 Loading / Error / NotFound

**OBLIGATOIRE pour chaque segment de route dans (dashboard) :**

```typescript
// app/(dashboard)/videos/loading.tsx
export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-zinc-800 rounded-xl h-40 mb-3" />
          <div className="bg-zinc-800 rounded h-4 mb-2 w-3/4" />
          <div className="bg-zinc-800 rounded h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

// app/(dashboard)/videos/error.tsx
'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
  
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-zinc-400">Erreur lors du chargement des vidéos</p>
      <button onClick={reset} className="btn-secondary">Réessayer</button>
    </div>
  )
}

// app/(dashboard)/videos/not-found.tsx
import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h2 className="text-xl text-zinc-300">Vidéo introuvable</h2>
      <Link href="/dashboard/videos" className="text-brand mt-4 inline-block">
        ← Retour aux vidéos
      </Link>
    </div>
  )
}
```

---

## 4. SUPABASE — PATTERNS OBLIGATOIRES

### 4.1 Clients Supabase

```typescript
// src/lib/supabase/server.ts — UNIQUEMENT pour Server Components / Server Actions
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch { /* Read-only cookie store dans Server Components */ }
        },
      },
    }
  )
}

// src/lib/supabase/client.ts — UNIQUEMENT pour Client Components
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// src/lib/supabase/admin.ts — UNIQUEMENT server, service_role
// JAMAIS importer ce fichier dans du code client
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const adminClient = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Variable sans NEXT_PUBLIC_ !
  {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  }
)
```

### 4.2 Schéma de base de données

```sql
-- ================================================================
-- SCHÉMA DERMOTEC ACADEMY — Mars 2026
-- ================================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- PROFILS UTILISATEURS
-- ================================================================
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL UNIQUE,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  profession   TEXT CHECK (profession IN ('estheticienne','dermatologue','medecin','infirmier','autre')),
  diplome      TEXT,
  phone        TEXT,
  level        INT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  points       INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  streak_count INT NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  avatar_url   TEXT,
  is_verified  BOOLEAN DEFAULT FALSE,  -- diplôme vérifié par admin
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- SESSIONS UTILISATEUR (max 2 devices simultanés)
-- ================================================================
CREATE TABLE user_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  ip_address       INET,
  user_agent       TEXT,
  last_seen_at     TIMESTAMPTZ DEFAULT NOW(),
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- CONTENU — MODULES ET VIDÉOS
-- ================================================================
CREATE TABLE modules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT NOT NULL,
  description    TEXT,
  theme          TEXT NOT NULL CHECK (theme IN (
    'soins_visage','peelings','laser_ipl','mesotherapie',
    'maquillage_permanent','analyse_peau','initiation'
  )),
  niveau         INT NOT NULL CHECK (niveau BETWEEN 1 AND 5),
  required_level INT NOT NULL DEFAULT 1 CHECK (required_level BETWEEN 1 AND 5),
  ordre          INT NOT NULL DEFAULT 0,
  thumbnail_url  TEXT,
  is_published   BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE videos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id      UUID REFERENCES modules(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  theme          TEXT NOT NULL,
  niveau         INT NOT NULL CHECK (niveau BETWEEN 1 AND 5),
  required_level INT NOT NULL DEFAULT 1,
  vdocipher_id   TEXT NOT NULL UNIQUE,  -- ID VdoCipher pour OTP
  duration_seconds INT NOT NULL DEFAULT 0,
  thumbnail_url  TEXT,
  ordre          INT NOT NULL DEFAULT 0,
  is_published   BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- QUIZ
-- ================================================================
CREATE TABLE quiz_questions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id     UUID REFERENCES videos(id) ON DELETE CASCADE,
  module_id    UUID REFERENCES modules(id) ON DELETE CASCADE,
  type         TEXT NOT NULL DEFAULT 'multiple_choice',
  question     TEXT NOT NULL,
  options      JSONB NOT NULL,  -- [{text, isCorrect}]
  explication  TEXT,
  points_reward INT NOT NULL DEFAULT 30,
  ordre        INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_answers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option INT NOT NULL,
  is_correct      BOOLEAN NOT NULL,
  score           INT NOT NULL DEFAULT 0,
  answered_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)  -- une seule tentative par question
);

-- ================================================================
-- PROGRESSION
-- ================================================================
CREATE TABLE watch_events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id         UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  watch_percentage INT NOT NULL DEFAULT 0 CHECK (watch_percentage BETWEEN 0 AND 100),
  is_completed     BOOLEAN GENERATED ALWAYS AS (watch_percentage >= 80) STORED,
  UNIQUE(user_id, video_id)
);

-- ================================================================
-- GAMIFICATION
-- ================================================================
CREATE TABLE points_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action       TEXT NOT NULL CHECK (action IN (
    'video_completed','quiz_passed','quiz_perfect','cas_clinique',
    'module_completed','daily_streak','streak_7_days','streak_30_days',
    'theme_completed','referral','admin_bonus',
    'promo_redeemed','module_unlock','pdf_access','qa_access','ai_coach'
  )),
  points_earned INT NOT NULL,  -- positif = gagné, négatif = dépensé
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE badges (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT,
  icon_url         TEXT,
  required_points  INT,
  required_level   INT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- ================================================================
-- CODES PROMO (depuis points)
-- ================================================================
CREATE TABLE promo_codes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_coupon_id TEXT,
  discount_percent INT NOT NULL CHECK (discount_percent IN (5, 10, 15, 20)),
  points_spent     INT NOT NULL,
  code             TEXT NOT NULL UNIQUE,
  is_used          BOOLEAN DEFAULT FALSE,
  used_at          TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- AUDIT LOG (INSERT ONLY — immuable)
-- ================================================================
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  ip_address    INET,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Interdire UPDATE et DELETE sur audit_logs
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- ================================================================
-- INDEXES (performance)
-- ================================================================
CREATE INDEX CONCURRENTLY idx_profiles_user_id ON profiles(id);
CREATE INDEX CONCURRENTLY idx_watch_events_user_id ON watch_events(user_id);
CREATE INDEX CONCURRENTLY idx_watch_events_video_id ON watch_events(video_id);
CREATE INDEX CONCURRENTLY idx_quiz_answers_user_id ON quiz_answers(user_id);
CREATE INDEX CONCURRENTLY idx_points_history_user_id ON points_history(user_id);
CREATE INDEX CONCURRENTLY idx_points_history_created ON points_history(created_at DESC);
CREATE INDEX CONCURRENTLY idx_videos_module_id ON videos(module_id);
CREATE INDEX CONCURRENTLY idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_created ON audit_logs(created_at DESC);
```

### 4.3 RLS Policies

```sql
-- ================================================================
-- RLS — Row Level Security OBLIGATOIRE sur TOUTES les tables
-- ================================================================

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING ((SELECT auth.uid()) = id);

-- watch_events
ALTER TABLE watch_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watch_events_own" ON watch_events
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- quiz_answers
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_answers_own" ON quiz_answers
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- points_history
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "points_own_select" ON points_history
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "points_own_insert" ON points_history
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
-- UPDATE/DELETE = interdit pour les users

-- videos — lecture si published ET niveau requis ≤ niveau user
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos_level_access" ON videos
  FOR SELECT USING (
    is_published = true AND
    required_level <= COALESCE(
      (SELECT level FROM profiles WHERE id = (SELECT auth.uid())),
      1
    )
  );

-- modules
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_level_access" ON modules
  FOR SELECT USING (
    is_published = true AND
    required_level <= COALESCE(
      (SELECT level FROM profiles WHERE id = (SELECT auth.uid())),
      1
    )
  );

-- quiz_questions — accès si vidéo/module accessible
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_questions_access" ON quiz_questions
  FOR SELECT USING (
    video_id IN (SELECT id FROM videos WHERE is_published = true)
  );

-- user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_own" ON user_badges
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- promo_codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promo_own" ON promo_codes
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- audit_logs — INSERT uniquement pour les users, SELECT interdit
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_insert_only" ON audit_logs
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = user_id OR user_id IS NULL
  );
-- Pas de SELECT policy pour les users → seul service_role peut lire

-- user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_own" ON user_sessions
  FOR ALL USING ((SELECT auth.uid()) = user_id);
```

### 4.4 Edge Functions — Gamification Points

```typescript
// supabase/functions/award-points/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

type PointAction = 
  | 'video_completed'
  | 'quiz_passed'
  | 'quiz_perfect'
  | 'module_completed'
  | 'daily_streak'

const POINTS_MAP: Record<PointAction, number> = {
  video_completed: 20,
  quiz_passed: 30,
  quiz_perfect: 50,
  module_completed: 100,
  daily_streak: 5,
}

const LEVEL_THRESHOLDS = [0, 200, 600, 1500, 4000]

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  const body: { action: PointAction; metadata?: Record<string, unknown> } = await req.json()
  const points = POINTS_MAP[body.action]
  if (!points) return new Response('Invalid action', { status: 400 })

  // Transaction atomique via RPC PostgreSQL
  const { data, error } = await supabase.rpc('award_points_and_check_level', {
    p_user_id: user.id,
    p_action: body.action,
    p_points: points,
    p_metadata: body.metadata ?? {},
    p_level_thresholds: LEVEL_THRESHOLDS,
  })

  if (error) {
    console.error('award_points error:', error)
    return new Response('Internal error', { status: 500 })
  }

  return Response.json(data)
})
```

---

## 5. VDOCIPHER — PROTECTION VIDÉO

### 5.1 Architecture OTP

```typescript
// src/app/api/video/[id]/route.ts
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getUserVideoAccess } from '@/lib/dal/videos'
import { generateVdoCipherOTP } from '@/lib/vdocipher/client'
import { ratelimit } from '@/lib/upstash/ratelimit'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const session = await requireAuth()
    
    // Rate limiting : 5 OTP/min/user pour la vidéo (anti-sharing)
    const { success } = await ratelimit.video.limit(session.user.id)
    if (!success) {
      return new Response('Too many requests', { status: 429 })
    }
    
    // Vérifier accès au niveau requis
    const video = await getUserVideoAccess(videoId, session.user.id)
    if (!video) {
      return new Response('Not found or access denied', { status: 403 })
    }
    
    // Vérifier max 2 devices simultanés
    const deviceFingerprint = request.headers.get('x-device-fingerprint')
    const activeSessions = await checkActiveSessions(session.user.id, deviceFingerprint!)
    if (activeSessions > 2) {
      return new Response('Max devices reached', { status: 403 })
    }
    
    // Générer OTP VdoCipher avec watermark dynamique
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    const timestamp = new Date().toISOString().slice(0, 19)
    
    const { otp, playbackInfo } = await generateVdoCipherOTP({
      videoId: video.vdocipher_id,
      watermarkText: `${session.user.email} | ${ip} | ${timestamp}`,
      ttl: 300,  // 5 minutes
    })
    
    // Log watch event
    await adminClient.from('watch_events').upsert({
      user_id: session.user.id,
      video_id: videoId,
      started_at: new Date().toISOString(),
    }, { onConflict: 'user_id,video_id' })
    
    return Response.json({ otp, playbackInfo })
    
  } catch (error) {
    console.error('Video OTP error:', error)
    return new Response('Internal error', { status: 500 })
  }
}
```

```typescript
// src/lib/vdocipher/client.ts
const VDOCIPHER_API_SECRET = process.env.VDOCIPHER_API_SECRET!
const VDOCIPHER_BASE_URL = 'https://dev.vdocipher.com/api'

interface OTPOptions {
  videoId: string
  watermarkText: string
  ttl?: number  // secondes, défaut 300
}

export async function generateVdoCipherOTP({ videoId, watermarkText, ttl = 300 }: OTPOptions) {
  const response = await fetch(
    `${VDOCIPHER_BASE_URL}/videos/${videoId}/otp`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Apisecret ${VDOCIPHER_API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ttl,
        annotate: JSON.stringify([{
          type: 'rtext',
          text: watermarkText,
          alpha: '0.4',
          color: '0x99CCFF',
          size: '12',
          interval: '5000',
        }]),
        whitelisthref: process.env.NEXT_PUBLIC_APP_URL,
      }),
    }
  )
  
  if (!response.ok) {
    throw new Error(`VdoCipher OTP error: ${response.status}`)
  }
  
  return response.json() as Promise<{ otp: string; playbackInfo: string }>
}
```

### 5.2 Composant VideoPlayer

```typescript
// src/components/video/VideoPlayer.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { useEffectEvent } from 'react'

interface VideoPlayerProps {
  videoId: string  // ID Dermotec (pas VdoCipher)
  onComplete?: (percentage: number) => void
  deviceFingerprint: string
}

export function VideoPlayer({ videoId, onComplete, deviceFingerprint }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable callback pour l'event — ne reconnecte pas le player si onComplete change
  const handleComplete = useEffectEvent((percentage: number) => {
    onComplete?.(percentage)
  })

  useEffect(() => {
    let player: VdoCipherPlayer | null = null

    async function initPlayer() {
      try {
        const response = await fetch(`/api/video/${videoId}`, {
          method: 'POST',
          headers: {
            'x-device-fingerprint': deviceFingerprint,
          },
        })
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const { otp, playbackInfo } = await response.json()
        
        // VdoCipher SDK (chargé via CDN dans layout.tsx)
        player = new (window as any).VdoPlayer({
          otp,
          playbackInfo,
          theme: '9ae8bbe8dd964ddc9bdb932cca1cb59a',
          container: containerRef.current,
        })
        
        player.addEventListener('load', () => setLoading(false))
        player.addEventListener('progress', (e: { percent: number }) => {
          if (e.percent >= 80) handleComplete(e.percent)
        })
        
      } catch (err) {
        setError('Erreur de chargement de la vidéo')
        console.error(err)
      }
    }
    
    initPlayer()
    return () => { player?.destroy() }
  }, [videoId, deviceFingerprint])  // handleComplete n'est PAS une dépendance

  if (error) return <VideoError message={error} />
  return (
    <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden">
      {loading && <VideoSkeleton />}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
```

---

## 6. DESIGN SYSTEM — RÈGLES ABSOLUES

### 6.1 Tailwind v4 — globals.css

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* ===== COULEURS ===== */
  --color-bg:        oklch(0.09 0.01 270);    /* #09090b zinc-950 */
  --color-surface:   oklch(0.12 0.01 270);    /* zinc-900 */
  --color-border:    oklch(0.22 0.01 270);    /* zinc-800 */
  --color-muted:     oklch(0.45 0.01 270);    /* zinc-600 */
  --color-text:      oklch(0.96 0.00 0);      /* zinc-50 */
  --color-text-dim:  oklch(0.72 0.01 270);    /* zinc-400 */

  --color-brand:     oklch(0.78 0.12 75);     /* #d4a853 or Dermotec */
  --color-brand-dim: oklch(0.60 0.10 75);     /* or atténué */
  --color-success:   oklch(0.72 0.20 142);    /* #22c55e */
  --color-danger:    oklch(0.62 0.22 24);     /* #ef4444 */
  --color-warning:   oklch(0.80 0.18 75);     /* amber */
  --color-ai:        oklch(0.68 0.20 295);    /* #a855f7 — uniquement IA */

  /* ===== FONTS ===== */
  --font-display: 'Cal Sans', 'Inter', sans-serif;
  --font-body:    'Geist', 'Inter', sans-serif;
  --font-mono:    'Geist Mono', 'Fira Code', monospace;

  /* ===== RADIUS ===== */
  --radius-sm:  0.375rem;   /* 6px */
  --radius-md:  0.625rem;   /* 10px */
  --radius-lg:  0.875rem;   /* 14px */
  --radius-xl:  1.25rem;    /* 20px */
  --radius-full: 9999px;

  /* ===== SHADOWS ===== */
  --shadow-glow:  0 0 30px -5px oklch(0.78 0.12 75 / 0.3);
  --shadow-card:  0 0 0 1px oklch(0.22 0.01 270), 0 4px 20px -4px oklch(0 0 0 / 0.4);
}

/* Base */
@layer base {
  body {
    background-color: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
  }
}

/* Components réutilisables */
@layer components {
  .btn-primary {
    @apply inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
           bg-brand text-bg font-medium text-sm
           hover:bg-brand-dim active:scale-[0.98]
           transition-all duration-150 cursor-pointer;
  }
  
  .btn-secondary {
    @apply inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
           bg-surface text-text text-sm font-medium
           border border-border hover:border-muted
           transition-all duration-150 cursor-pointer;
  }
  
  .card {
    @apply bg-surface rounded-xl border border-border p-5;
    box-shadow: var(--shadow-card);
  }
  
  .label-mono {
    @apply font-mono text-[10px] uppercase tracking-widest text-text-dim;
  }
  
  .badge-level {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full
           text-xs font-medium font-mono uppercase tracking-wide;
  }
}
```

### 6.2 Règles design NON NÉGOCIABLES

```
❌ JAMAIS : Inter comme font principale
❌ JAMAIS : Gradient purple sur fond blanc
❌ JAMAIS : 2 CTAs brand (couleur or) sur le même écran
❌ JAMAIS : Cacher les features locked — les afficher à 35% opacity + icône 🔒
❌ JAMAIS : Fond blanc ou gris clair — toujours dark (#09090b)
❌ JAMAIS : Animations GSAP sauf timeline complexe justifiée
❌ JAMAIS : Ajouter des dépendances CSS-in-JS (styled-components, Emotion)

✅ TOUJOURS : Fond zinc-950 (#09090b)
✅ TOUJOURS : Cal Sans pour les titres, Geist pour le corps
✅ TOUJOURS : Labels en Geist Mono, 10-11px, uppercase, tracking-widest
✅ TOUJOURS : Motion pour layout animations et interactions
✅ TOUJOURS : canvas-confetti pour level-up
✅ TOUJOURS : Spotlight cursor sur les cartes premium
```

### 6.3 Feature Gating

```typescript
// src/hooks/useFeature.ts — JAMAIS de if(plan==='pro') dispersé
'use client'
import { useUserStore } from '@/stores/user'

type Feature = 
  | 'ai_coach'
  | 'level_4_5_content'
  | 'promo_generation'
  | 'pdf_download'
  | 'qa_monthly'

const FEATURES_BY_LEVEL: Record<number, Feature[]> = {
  1: ['level_1_content'],
  2: ['level_1_content', 'level_2_content', 'promo_5pct'],
  3: ['level_1_content', 'level_2_content', 'level_3_content', 'promo_10pct', 'pdf_download'],
  4: ['ai_coach', 'level_4_content', 'promo_15pct', 'qa_monthly'],
  5: ['ai_coach', 'level_5_content', 'promo_20pct', 'qa_monthly'],
}

export function useFeature(feature: Feature) {
  const userLevel = useUserStore(s => s.level)
  const availableFeatures = FEATURES_BY_LEVEL[userLevel] ?? []
  return availableFeatures.includes(feature)
}

// src/components/shared/FeatureGate.tsx
interface FeatureGateProps {
  feature: Feature
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const hasAccess = useFeature(feature)
  
  if (hasAccess) return <>{children}</>
  
  return (
    <div className="relative">
      <div className="opacity-35 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        {fallback ?? (
          <div className="flex items-center gap-2 bg-surface/80 backdrop-blur-sm 
                          border border-border rounded-lg px-3 py-2">
            <span>🔒</span>
            <span className="label-mono">Niveau requis</span>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 7. TESTING — CONVENTIONS

### 7.1 Fichiers de test

- Tests unitaires colocalisés : `ComponentName.test.tsx` à côté du composant
- Tests Playwright : `e2e/specs/feature-name.spec.ts`
- Mocks MSW : `src/mocks/handlers/` séparés par domaine

### 7.2 Ce qu'il faut toujours tester

**Pour chaque feature :**
- Happy path
- Error path (API failure, validation error)
- Loading state
- Edge cases (liste vide, données manquantes)

**E2E critiques obligatoires :**
1. Inscription → connexion → premier accès vidéo
2. Regarder une vidéo → quiz → gain de points
3. Level up (progression niveau 1 → niveau 2)
4. Génération code promo depuis points
5. Limite 2 devices simultanés

### 7.3 Conventions de nommage

```typescript
// Vitest
describe('VideoPlayer', () => {
  describe('when video loads successfully', () => {
    it('shows the player after OTP fetch', async () => { ... })
    it('tracks watch progress', async () => { ... })
    it('calls onComplete at 80%', async () => { ... })
  })
  describe('when OTP request fails', () => {
    it('shows error message', async () => { ... })
    it('does not call onComplete', async () => { ... })
  })
})

// Playwright
test.describe('Gamification', () => {
  test('watching a video earns 20 points', async ({ page }) => { ... })
})
```

---

## 8. VARIABLES D'ENVIRONNEMENT

### 8.1 Variables requises

```bash
# .env.local — ne jamais committer
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # ⚠️ jamais NEXT_PUBLIC

# VdoCipher
VDOCIPHER_API_SECRET=xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Resend
RESEND_API_KEY=re_...

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntryu_...

# App
NEXT_PUBLIC_APP_URL=https://academy.dermotec.fr
```

### 8.2 Règle critique

**Variables sans `NEXT_PUBLIC_` = uniquement serveur. JAMAIS dans du code client.**

Si Claude Code voit une variable serveur utilisée côté client → signaler immédiatement.

---

## 9. SÉCURITÉ — CHECKLIST

### 9.1 Avant chaque PR

- [ ] Aucune variable serveur exposée côté client
- [ ] Chaque Route Handler vérifie l'auth (pas seulement proxy.ts)
- [ ] Chaque Server Action valide les inputs avec Zod
- [ ] Les données DAL retournent uniquement ce dont le composant a besoin (pas `select('*')` en production)
- [ ] Pas de `console.log` avec des données utilisateur
- [ ] Tous les inputs utilisateur sont sanitisés (DOMPurify pour HTML)

### 9.2 Patterns interdits

```typescript
// ❌ INTERDIT — clé service_role dans le code client
'use client'
import { adminClient } from '@/lib/supabase/admin'  // ERREUR

// ❌ INTERDIT — trust le middleware seul
export default async function SecretPage() {
  // Pas de vérification d'auth ici → VULNÉRABLE à CVE-2025-29927
  return <SecretContent />
}

// ❌ INTERDIT — select * en production
const { data } = await supabase.from('profiles').select('*')

// ❌ INTERDIT — exposer les messages d'erreur DB
return new Response(error.message, { status: 500 })  // révèle la structure DB

// ✅ Patterns corrects
// Auth dans chaque composant sensible
const session = await requireAuth()

// Select minimal
const { data } = await supabase
  .from('profiles')
  .select('id, first_name, level, points')

// Erreurs génériques côté client
return new Response('Internal error', { status: 500 })
```

---

## 10. WORKFLOW CLAUDE CODE

### 10.1 Pour chaque nouvelle feature

1. **Lire** ce CLAUDE.md + les fichiers agent pertinents
2. **Schema first** : si DB → créer la migration SQL avant le code
3. **DAL first** : écrire les fonctions DAL (avec tests) avant les composants
4. **Server Component first** : commencer par le Server Component, ajouter `'use client'` uniquement si nécessaire
5. **Types** : toujours typer les retours des fonctions DAL
6. **Tests** : Vitest pour la logique, Playwright pour les flows E2E

### 10.2 Commandes disponibles

```bash
# Développement
pnpm dev              # Next.js 16 + Turbopack (default)
pnpm build            # Build production (Turbopack)
pnpm type-check       # tsc --noEmit

# Tests
pnpm test             # Vitest en watch mode
pnpm test:run         # Vitest une fois
pnpm test:e2e         # Playwright
pnpm test:e2e:ui      # Playwright UI mode

# DB
pnpm supabase:start   # Supabase local
pnpm supabase:push    # Push migrations
pnpm supabase:types   # Générer types TypeScript depuis schéma

# Qualité
pnpm lint             # ESLint
pnpm format           # Biome format
```

### 10.3 Commandes Claude Code disponibles

```
/project:dermotec-implement [feature]  → Implémenter une feature complète (TDD)
/project:dermotec-design [component]   → Créer un composant avec le design system
/project:dermotec-animate [component]  → Ajouter des animations Motion
/project:dermotec-security            → Audit sécurité de la session courante
/project:dermotec-migrate [feature]   → Générer une migration SQL
```

---

## 11. GLOSSAIRE PROJET

```
OTP           = One-Time Password VdoCipher (token d'accès vidéo, expire en 5min)
RLS           = Row Level Security (sécurité PostgreSQL au niveau des lignes)
DAL           = Data Access Layer (lib/dal/* — couche d'accès données)
DRM           = Digital Rights Management (Widevine + FairPlay via VdoCipher)
Level 1-5     = Niveaux gamification : Découverte / Praticien / Expert / Spécialiste / Maître
Points        = Monnaie gamification → codes promo formations physiques
Stream        = React Streaming via Suspense (pas un flux vidéo)
Cache Comp.   = Cache Components (Next.js 16 — remplace PPR expérimental)
proxy.ts      = Auth middleware Next.js 16 (remplace middleware.ts)
requireAuth() = Fonction DAL auth qui throw si non-authentifié + cache React
```

---

*CLAUDE.md version 1.0 — Dermotec Academy — Mars 2026*
*Mise à jour ce fichier lorsque des décisions d'architecture sont prises.*
