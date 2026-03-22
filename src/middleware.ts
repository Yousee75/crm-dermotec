import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ============================================================
// Middleware — Auth + Security Headers + Rate Limiting (Upstash)
// Edge Runtime compatible
// ============================================================

// --- Rate Limiting via Upstash Redis ---
// Lazy import pour éviter les erreurs si non configuré
let _ratelimit: { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> } | null | undefined = undefined

async function getRateLimiter() {
  if (_ratelimit !== undefined) return _ratelimit
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) {
      _ratelimit = null
      return null
    }
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')
    _ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      prefix: '@crm/middleware',
    })
    return _ratelimit
  } catch {
    _ratelimit = null
    return null
  }
}

// --- Generate CSP nonce (Edge-compatible) ---
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

// --- Security Headers ---
function addSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://va.vercel-scripts.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.resend.com https://*.ingest.sentry.io https://*.inngest.com https://va.vercel-scripts.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('x-nonce', nonce)

  return response
}

// --- Public paths ---
const PUBLIC_PATHS = ['/login', '/auth/callback', '/api/', '/inscription/', '/monitoring']

const PUBLIC_EXACT_PATHS = ['/', '/accueil', '/pricing', '/aide', '/changelog', '/formations', '/conditions-generales', '/mentions-legales', '/politique-confidentialite', '/dpa']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_EXACT_PATHS.includes(pathname) || PUBLIC_PATHS.some(path => pathname.startsWith(path))
}

// --- Honeypot endpoints (pièges pour les intrus) ---
const HONEYPOT_PATHS = [
  '/api/v1/admin/users', '/api/v1/admin/export-all',
  '/api/v1/internal/debug', '/api/v1/internal/config',
  '/api/graphql', '/api/v2/leads', '/.env', '/wp-admin',
  '/api/v1/database/dump', '/api/v1/stripe/keys',
  '/api/v1/enrichment/sources', '/api/v1/enrichment/algorithms',
  '/phpmyadmin', '/admin.php', '/.git', '/xmlrpc.php',
  '/api/v1/export/all-data', '/api/swagger.json',
]

function isHoneypot(pathname: string): boolean {
  return HONEYPOT_PATHS.some(hp => pathname.toLowerCase().startsWith(hp.toLowerCase()))
}

// --- Request fingerprint (Edge-compatible, sans crypto lourd) ---
function fingerprintRequest(request: NextRequest, ip: string): string {
  const ua = request.headers.get('user-agent') || ''
  const lang = request.headers.get('accept-language') || ''
  const enc = request.headers.get('accept-encoding') || ''
  // Simple hash côté Edge (pas de crypto.createHmac en Edge Runtime)
  let hash = 0
  const str = `${ip}|${ua}|${lang}|${enc}`
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// --- Bot detection (User-Agent heuristique) ---
function isSuspectedBot(ua: string): boolean {
  const lower = ua.toLowerCase()
  return (
    lower.includes('curl') || lower.includes('wget') || lower.includes('python') ||
    lower.includes('scrapy') || lower.includes('bot') || lower.includes('crawler') ||
    lower.includes('spider') || lower.includes('go-http') || lower.includes('java/') ||
    lower.includes('php/') || lower.includes('ruby') || lower.includes('postman') ||
    lower.includes('insomnia') || lower.includes('httpie') || lower.includes('axios/') ||
    lower.includes('node-fetch') || lower.includes('undici') ||
    ua.length < 20 // UA trop court = fake
  )
}

// --- Middleware ---
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const nonce = generateNonce()

  // ============================================================
  // FAST PATH — Skip sécurité pour les routes non-sensibles
  // Gain : -300ms TTFB sur les pages normales
  // ============================================================
  const isStaticAsset = pathname.startsWith('/_next/') || pathname.startsWith('/images/') || pathname.startsWith('/fonts/')
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/accueil' || pathname === '/formations' || pathname.startsWith('/inscription') || pathname === '/pricing' || pathname === '/aide' || pathname === '/changelog'

  // Assets statiques : juste les headers, rien d'autre
  if (isStaticAsset) {
    const response = NextResponse.next({ request })
    return addSecurityHeaders(response, nonce)
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
  const ua = request.headers.get('user-agent') || ''

  // ============================================================
  // COUCHE 1 : HONEYPOT — Piège les scanners et intrus
  // ============================================================
  if (isHoneypot(pathname)) {
    // Réponse lente (3s) pour ralentir les scanners
    await new Promise(r => setTimeout(r, 3000))
    return new NextResponse(
      JSON.stringify({ error: 'Not Found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ============================================================
  // COUCHE 2 : BOT DETECTION — Bloquer les scrapers sur les API
  // ============================================================
  if (isSuspectedBot(ua) && pathname.startsWith('/api/') && !pathname.startsWith('/api/webhook') && !pathname.startsWith('/api/inngest') && !pathname.startsWith('/api/stripe') && !pathname.startsWith('/api/health')) {
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ============================================================
  // COUCHE 3 : RATE LIMITING — Seulement sur les API et pages auth
  // Skip les pages publiques pour la vitesse
  // ============================================================
  if (!isPublicPage) {
    const rl = await getRateLimiter()
    if (rl) {
      const isApi = pathname.startsWith('/api/')
      const fp = fingerprintRequest(request, ip)
      const identifier = `${fp}:${isApi ? 'api' : 'page'}`

      const { success, limit, remaining, reset } = await rl.limit(identifier)

      if (!success) {
        return new NextResponse(
          JSON.stringify({ error: 'Trop de requêtes. Réessayez dans 1 minute.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(reset),
            },
          }
        )
      }
    }
  }

  // ============================================================
  // COUCHE 4 : ENRICHMENT PROTECTION — Headers anti-cache
  // ============================================================
  if (pathname.startsWith('/api/enrichment') || pathname.startsWith('/api/competitors')) {
    const response = NextResponse.next({ request })
    addSecurityHeaders(response, nonce)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive')
    return response
  }

  // API routes — pass through avec security headers
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next({ request })
    return addSecurityHeaders(response, nonce)
  }

  // Check Supabase config
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Demo mode: no Supabase = let everything through
  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('https://') || supabaseUrl.includes('placeholder')) {
    const response = NextResponse.next({ request })
    return addSecurityHeaders(response, nonce)
  }

  // Demo mode: UNIQUEMENT en développement local (jamais en production)
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && process.env.NODE_ENV === 'development'
  if (DEMO_MODE && !isPublicPath(pathname)) {
    const response = NextResponse.next({ request })
    return addSecurityHeaders(response, nonce)
  }

  // Supabase auth
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) =>
          supabaseResponse.cookies.set(name, value, options as never)
        )
      },
    },
  })

  try {
    const { data: { user } } = await supabase.auth.getUser()

    // Redirect non-auth to login
    if (!user && !isPublicPath(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Redirect auth away from login
    if (user && pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  } catch {
    // If auth fails, let through (graceful degradation)
  }

  return addSecurityHeaders(supabaseResponse, nonce)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
