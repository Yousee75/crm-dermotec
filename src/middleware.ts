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

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path))
}

// --- Middleware ---
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const nonce = generateNonce()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'

  // Rate limiting (Upstash Redis — distribué, survit aux redéploiements)
  const rl = await getRateLimiter()
  if (rl) {
    const isApi = pathname.startsWith('/api/')
    const identifier = `${ip}:${isApi ? 'api' : 'page'}`

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

  // Demo mode: allow dashboard access without auth for demo/dev
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
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
