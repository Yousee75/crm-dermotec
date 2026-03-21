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

import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

// Lazy import to prevent zod-openapi crash during SSG page collection
async function getHandler() {
  const { handle } = await import('hono/vercel')
  const { default: app } = await import('@/server')
  return handle(app)
}

async function handler(req: NextRequest) {
  const h = await getHandler()
  return h(req)
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
