# SECURITE CRM DERMOTEC

## Middleware (src/middleware.ts)
- CSP headers complets (Stripe, Supabase, fonts)
- HSTS avec preload
- Rate limiting: 30 req/min pages, 10 req/min API
- POST-only sur webhooks Stripe et formulaire
- Auth Supabase obligatoire sauf /login, /auth/callback, /api/webhook

## API Routes
- Toujours valider avec zod
- Honeypot field si formulaire public
- Bloquer emails jetables (lib/disposable-emails.ts)
- Sanitizer tous les strings (lib/validators.ts → sanitizeString)
- Content-Length max 10 KB pour les formulaires

## Supabase
- JAMAIS exposer SUPABASE_SERVICE_ROLE_KEY côté client
- Service role uniquement dans API routes et webhooks
- RLS activé sur toutes les tables
- Policies: authenticated = full access, anon = insert leads + read formations

## Stripe
- Toujours vérifier la signature webhook (stripe.webhooks.constructEvent)
- JAMAIS stocker les clés Stripe dans le code
- Utiliser STRIPE_WEBHOOK_SECRET pour chaque événement
- Idempotence : vérifier si l'inscription est déjà payée avant update

## RGPD
- Pas de cookies de tracking sans consentement
- Données personnelles dans Supabase uniquement
- Export données possible via /settings
- Droit à l'oubli : soft delete (statut SPAM) plutôt que hard delete
