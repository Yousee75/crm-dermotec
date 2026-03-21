// ============================================================
// Next.js catch-all → Hono
// ============================================================
//
// Toutes les requetes /api/* sont deleguees a Hono,
// SAUF celles qui ont leur propre route.ts standalone :
//   - /api/stripe/webhook  (raw body pour signature Stripe)
//   - /api/webhook/formulaire  (public, pas d'auth Hono)
//
// Next.js App Router resolution : les routes plus specifiques
// (ex: src/app/api/stripe/webhook/route.ts) ont PRIORITE sur
// le catch-all [[...route]]. Donc les webhooks standalone
// continuent de fonctionner sans conflit.
// ============================================================

import { handle } from 'hono/vercel'
import app from '@/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs' // 'edge' si deploye sur Vercel Edge

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)
