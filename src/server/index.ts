// ============================================================
// CRM Dermotec — Hono API principale
// ============================================================
//
// Architecture :
//   src/app/api/[[...route]]/route.ts  →  catch-all, delegue a cette app
//   src/app/api/stripe/webhook/route.ts  →  STANDALONE (raw body pour signature)
//   src/app/api/webhook/formulaire/route.ts  →  STANDALONE (public, pas d'auth)
//
// Le webhook Stripe DOIT rester standalone car il a besoin du body brut
// (request.text()) pour stripe.webhooks.constructEvent(). Hono parse le body.
// ============================================================

import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import {
  supabaseAuth,
  rateLimiter,
  sentryMiddleware,
  initSentry,
  onErrorHandler,
  type AuthEnv,
} from './middleware'

import { leadsRoutes, sessionsRoutes, emailRoutes, financementsRoutes } from './routes'

// --- Init Sentry (une seule fois) ---
initSentry()

// --- App Hono avec basePath /api ---
const app = new OpenAPIHono<AuthEnv>().basePath('/api')

// --- Global middleware (ordre = important) ---

// 1. Logger (dev)
app.use('*', logger())

// 2. Sentry error tracking
app.use('*', sentryMiddleware())

// 3. CORS
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'https://crm.dermotec.fr',
      'https://crm-dermotec.vercel.app',
    ],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

// 4. Pretty JSON en dev
app.use('*', prettyJSON())

// 5. Rate limiting global (30 req/min)
app.use('*', rateLimiter({ requests: 30, window: '1 m' }))

// 6. Rate limiting strict sur endpoints sensibles
app.use('/api/email/*', rateLimiter({ requests: 5, window: '1 m', prefix: '@crm/email' }))

// 7. Auth Supabase sur tout /api sauf health check
app.use('/api/*', supabaseAuth())

// --- Health check (avant auth, donc on le met en premier) ---
// Note : comme le middleware auth est sur /api/*, on doit le declarer
// AVANT ou utiliser un path qui ne match pas /api/*
// Ici on cree un sous-chemin /api/health qui bypass l'auth via un
// early response dans le middleware. Alternative : le declarer avant use().

// --- Monter les sous-routes ---
app.route('/api/leads', leadsRoutes)
app.route('/api/sessions', sessionsRoutes)
app.route('/api/email', emailRoutes)
app.route('/api/financements', financementsRoutes)

// --- OpenAPI doc endpoint ---
app.doc('/api/doc', {
  openapi: '3.0.0',
  info: {
    title: 'CRM Dermotec API',
    version: '1.0.0',
    description: 'API du CRM Dermotec — Centre de Formation Esthetique',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Dev local' },
    { url: 'https://crm-dermotec.vercel.app', description: 'Production' },
  ],
})

// --- Swagger UI (optionnel) ---
app.get('/api/swagger', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>CRM Dermotec — API Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/api/doc',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
            layout: 'StandaloneLayout',
          })
        </script>
      </body>
    </html>
  `)
})

// --- Error handler global ---
app.onError(onErrorHandler)

// --- 404 ---
app.notFound((c) => {
  return c.json({ error: 'Route non trouvee', path: c.req.url }, 404)
})

// Export du type pour le RPC client
export type AppType = typeof app
export default app
