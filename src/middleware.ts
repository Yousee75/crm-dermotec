import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ============================================================
// Middleware — Auth + Security Headers + Rate Limiting
// CSP stricte (nonces pour inline scripts)
// Rate limiting prêt pour Upstash Redis (fallback in-memory)
// ============================================================

// --- Rate Limiting (in-memory fallback, remplacé par Upstash en prod) ---
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_API = 10

// Nettoyage inline (Edge Runtime n'a pas de setInterval persistant)
function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetTime) rateLimitMap.delete(key)
  }
}

function checkRateLimit(ip: string, limit: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  entry.count++
  return entry.count <= limit
}

// --- Generate CSP nonce ---
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  // btoa works in Edge Runtime (Buffer does NOT)
  return btoa(String.fromCharCode(...array))
}

// --- Security Headers avec CSP stricte ---
function addSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  // HSTS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // Security
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '0') // Désactivé en faveur de CSP strict
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  // CSP stricte — nonces au lieu de unsafe-inline
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.resend.com https://*.ingest.sentry.io https://*.inngest.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // Passer le nonce aux composants via header custom
  response.headers.set('x-nonce', nonce)

  return response
}

// --- Routes publiques ---
const PUBLIC_PATHS = ['/login', '/auth/callback', '/api/webhook', '/api/inngest']
const API_PATHS_POST_ONLY = ['/api/webhook/formulaire', '/api/webhook/stripe', '/api/stripe/webhook']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path))
}

// --- Middleware principal ---
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const nonce = generateNonce()

  // Rate limiting (cleanup stale entries first)
  cleanupRateLimit()
  const isApiRoute = pathname.startsWith('/api/')
  const limit = isApiRoute ? RATE_LIMIT_API : RATE_LIMIT_MAX

  if (!checkRateLimit(`${ip}:${isApiRoute ? 'api' : 'page'}`, limit)) {
    return new NextResponse(
      JSON.stringify({ error: 'Trop de requêtes. Réessayez dans 1 minute.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
    )
  }

  // POST-only check pour webhooks
  if (API_PATHS_POST_ONLY.some(p => pathname.startsWith(p))) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204 })
    }
    if (request.method !== 'POST') {
      return new NextResponse(
        JSON.stringify({ error: 'Method Not Allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' } }
      )
    }
    const response = NextResponse.next({ request })
    return addSecurityHeaders(response, nonce)
  }

  // Inngest endpoint (GET + POST)
  if (pathname.startsWith('/api/inngest')) {
    const response = NextResponse.next({ request })
    return addSecurityHeaders(response, nonce)
  }

  // Supabase auth
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as never)
          )
        },
      },
    }
  )

  // Mode demo : si Supabase n'est pas configuré, on laisse passer
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

  if (isDemoMode) {
    return addSecurityHeaders(supabaseResponse, nonce)
  }

  const { data: { user } } = await supabase.auth.getUser()
  const isPublic = isPublicPath(pathname)

  // Redirect non-auth vers login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect auth vers dashboard
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return addSecurityHeaders(supabaseResponse, nonce)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
