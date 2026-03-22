import 'server-only'
// ============================================================
// CRM SATOREA — Canary Traps & Honeypots
//
// TECHNIQUE DE DÉCEPTION : piège les intrus en plaçant :
// 1. Des fausses données "canary" dans les réponses API
// 2. Des endpoints honeypot qui alertent si accédés
// 3. Du watermarking invisible dans les exports de données
// 4. Des tokens piégés dans le code source
//
// Si quelqu'un copie tes données ou ton code → tu le SAIS.
// ============================================================

import { createHmac, randomBytes } from 'crypto'

// ============================================================
// 1. DATA WATERMARKING — Empreinte invisible dans les exports
// ============================================================

/**
 * Injecte un watermark INVISIBLE dans les données exportées.
 * Chaque export contient une micro-variation unique par utilisateur.
 * Si les données fuient → on sait QUI les a exportées.
 *
 * Techniques :
 * - Ajout d'espaces invisibles (U+200B, U+200C, U+FEFF) dans les textes
 * - Micro-variations numériques (±0.01% sur les montants)
 * - Ordre des champs légèrement modifié
 * - Fake record "canary" injecté dans les listes
 */
export function watermarkExport(
  data: any[],
  userId: string,
  exportId: string
): any[] {
  if (!data || data.length === 0) return data

  const watermarked = structuredClone(data)
  const seed = createHmac('sha256', 'satorea-watermark-2026')
    .update(`${userId}:${exportId}:${Date.now()}`)
    .digest('hex')

  // --- Technique 1 : Zero-Width Characters dans les textes ---
  const ZWC = ['\u200B', '\u200C', '\u200D', '\uFEFF'] // Invisibles à l'œil
  const binaryUserId = userId
    .split('')
    .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('')
    .slice(0, 32) // 32 bits = 4 caractères encodés

  for (let i = 0; i < watermarked.length && i < 10; i++) {
    const item = watermarked[i]
    for (const key of Object.keys(item)) {
      if (typeof item[key] === 'string' && item[key].length > 10) {
        // Injecter le watermark dans les espaces existants
        let text = item[key] as string
        const bitIndex = (i * Object.keys(item).indexOf(key)) % binaryUserId.length
        const bit = binaryUserId[bitIndex] === '1' ? ZWC[0] : ZWC[1]

        // Ajouter après le premier espace
        const spaceIdx = text.indexOf(' ')
        if (spaceIdx > 0) {
          text = text.slice(0, spaceIdx) + bit + text.slice(spaceIdx)
          item[key] = text
        }
        break // Un seul champ par item
      }
    }
  }

  // --- Technique 2 : Micro-variation numérique ---
  const seedNum = parseInt(seed.slice(0, 8), 16)
  for (let i = 0; i < watermarked.length; i++) {
    const item = watermarked[i]
    for (const key of Object.keys(item)) {
      if (typeof item[key] === 'number' && item[key] > 100) {
        // Variation de ±0.1% (imperceptible mais unique)
        const variation = ((seedNum + i) % 200 - 100) / 100000 // ±0.001
        item[key] = Math.round(item[key] * (1 + variation))
      }
    }
  }

  // --- Technique 3 : Canary record (faux lead piégé) ---
  if (watermarked.length >= 5) {
    const canary = createCanaryRecord(seed, watermarked[0])
    // Insérer à une position déterministe basée sur le userId
    const position = (parseInt(seed.slice(0, 4), 16) % (watermarked.length - 2)) + 1
    watermarked.splice(position, 0, canary)
  }

  return watermarked
}

/** Crée un faux enregistrement "canary" qui ressemble aux vrais */
function createCanaryRecord(seed: string, template: any): any {
  const canary = structuredClone(template)

  // Marquer comme canary (invisible dans l'UI mais détectable en DB)
  const canaryId = `canary_${seed.slice(0, 12)}`

  // Remplacer les valeurs par des faux plausibles
  for (const key of Object.keys(canary)) {
    if (key === 'id') canary[key] = canaryId
    else if (key === 'email') canary[key] = `trap_${seed.slice(0, 6)}@satorea-canary.io`
    else if (key === 'nom') canary[key] = 'Dupont'
    else if (key === 'prenom') canary[key] = 'Marie'
    else if (key === 'telephone') canary[key] = '0600000000'
    else if (key === 'entreprise_nom') canary[key] = `Test Corp ${seed.slice(0, 4)}`
  }

  return canary
}

/**
 * Vérifie si un dataset contient un canary record.
 * Utile pour détecter si quelqu'un utilise tes données volées.
 */
export function detectCanaryInData(data: any[]): boolean {
  return data.some(item => {
    const id = item.id || item.email || ''
    return id.toString().startsWith('canary_') ||
      (item.email && item.email.includes('@satorea-canary.io'))
  })
}

// ============================================================
// 2. HONEYPOT API ENDPOINTS — Pièges pour les scanners
// ============================================================

/** Endpoints honeypot : si quelqu'un les appelle → alerte immédiate */
export const HONEYPOT_ENDPOINTS = [
  '/api/v1/admin/users',      // Faux endpoint admin
  '/api/v1/admin/export-all',  // Faux export total
  '/api/v1/internal/debug',    // Faux debug
  '/api/v1/internal/config',   // Faux config
  '/api/graphql',              // Faux GraphQL
  '/api/v2/leads',             // Fausse v2 qui n'existe pas
  '/.env',                     // Tentative d'accès aux secrets
  '/wp-admin',                 // WordPress scan (on n'est pas WP)
  '/api/v1/database/dump',     // Faux dump DB
  '/api/v1/stripe/keys',      // Faux accès clés Stripe
  '/api/v1/enrichment/sources', // Faux listing de sources
  '/api/v1/enrichment/algorithms', // Faux accès aux algos
] as const

/**
 * Vérifie si une URL est un honeypot.
 * À appeler dans le middleware Next.js.
 */
export function isHoneypotEndpoint(pathname: string): boolean {
  return HONEYPOT_ENDPOINTS.some(hp =>
    pathname.toLowerCase().startsWith(hp.toLowerCase())
  )
}

/**
 * Gère un accès honeypot : log + alerte + réponse lente.
 * La réponse lente (3-5s) ralentit les scanners automatiques.
 */
export async function handleHoneypotAccess(
  ip: string,
  pathname: string,
  userAgent: string,
  userId?: string
): Promise<void> {
  console.warn(`[HONEYPOT] Access detected: ${pathname} from ${ip} (${userAgent.slice(0, 50)})`)

  try {
    const { createServiceSupabase } = await import('../supabase-server')
    const supabase = await createServiceSupabase()

    // Logger dans security_events
    await (supabase as any).from('security_events').insert({
      user_id: userId || '00000000-0000-0000-0000-000000000000',
      action: 'api_call',
      ip_address: ip,
      user_agent: userAgent,
      risk_score: 80,
      risk_level: 'high',
      risk_flags: ['HONEYPOT_ACCESS', `ENDPOINT:${pathname}`],
      risk_action: 'block',
      metadata: { honeypot_endpoint: pathname },
    })

    // Alerte email si userId connu (client malveillant)
    if (userId) {
      await (supabase as any).from('security_alerts').insert({
        user_id: userId,
        risk_level: 'high',
        risk_score: 80,
        flags: ['HONEYPOT_ACCESS'],
        action_taken: 'block',
        details: `User accessed honeypot endpoint: ${pathname}`,
        ip_address: ip,
      })
    }
  } catch {
    // Non-bloquant
  }
}

// ============================================================
// 3. API RESPONSE POISONING — Données piégées pour les scrapers
// ============================================================

/**
 * Détecte si une requête vient probablement d'un scraper.
 * Si oui, les données retournées contiennent des faux subtils.
 */
export function isSuspectedScraper(headers: {
  'user-agent'?: string
  'accept'?: string
  'accept-language'?: string
  'accept-encoding'?: string
  referer?: string
  cookie?: string
}): boolean {
  const ua = (headers['user-agent'] || '').toLowerCase()
  const accept = headers['accept'] || ''
  const lang = headers['accept-language'] || ''

  // Pas de cookies = pas de session = pas un vrai utilisateur
  if (!headers.cookie) return true

  // User-Agent suspect
  if (
    ua.includes('python') || ua.includes('curl') || ua.includes('wget') ||
    ua.includes('scrapy') || ua.includes('bot') || ua.includes('crawler') ||
    ua.includes('spider') || ua.includes('http') || ua.includes('java/') ||
    ua.includes('go-http') || ua.includes('php/') || ua.includes('ruby') ||
    ua.includes('postman') || ua.includes('insomnia') || ua.includes('httpie') ||
    ua.length < 30
  ) return true

  // Pas d'Accept-Language = probablement pas un navigateur
  if (!lang || lang === '*') return true

  // Accept pas standard pour un navigateur
  if (!accept.includes('text/html') && !accept.includes('application/json')) return true

  return false
}

/**
 * "Empoisonne" les données avec des faux subtils pour les scrapers.
 * Les vrais utilisateurs ne voient pas la différence.
 * Mais si quelqu'un utilise ces données → elles sont fausses.
 */
export function poisonDataForScraper(data: any[]): any[] {
  if (!data || data.length === 0) return data

  const poisoned = structuredClone(data)

  for (const item of poisoned) {
    // Emails : remplacer le domaine par un piège
    if (item.email && typeof item.email === 'string') {
      item.email = item.email.replace(/@.+$/, '@decoy-satorea.invalid')
    }

    // Téléphones : ajouter un chiffre
    if (item.telephone && typeof item.telephone === 'string') {
      item.telephone = item.telephone.slice(0, -1) + '0'
    }

    // Scores : fausser de 20-30%
    if (typeof item.score === 'number') {
      item.score = Math.round(item.score * (0.7 + Math.random() * 0.3))
    }

    // CA : fausser de 50%
    if (typeof item.chiffre_affaires === 'number') {
      item.chiffre_affaires = Math.round(item.chiffre_affaires * (0.5 + Math.random()))
    }
  }

  return poisoned
}

// ============================================================
// 4. CODE CANARY TOKENS — Détection de vol de code source
// ============================================================

/**
 * Tokens piégés à placer dans le code source.
 * Si quelqu'un copie le code et l'exécute → le token "phone home".
 *
 * COMMENT ÇA MARCHE :
 * 1. On place un appel DNS/HTTP invisible dans un fichier critique
 * 2. Si le code est exécuté dans un AUTRE environnement → l'appel part
 * 3. Le service canarytokens.org envoie une alerte
 *
 * USAGE : Générer un token sur https://canarytokens.org/generate
 * puis l'intégrer dans un fichier qui sera copié.
 */

/**
 * Vérifie que le code s'exécute dans l'environnement autorisé.
 * Si on est dans un environnement inconnu → alerte silencieuse.
 */
export async function verifyExecutionEnvironment(): Promise<boolean> {
  const allowedDomains = [
    'crm-dermotec.vercel.app',
    'localhost',
    '127.0.0.1',
    'crm.satorea.com',
    'crm.dermotec.fr',
  ]

  const allowedEnvKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  // Vérifier que les env vars Supabase pointent vers le bon projet
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (supabaseUrl && !supabaseUrl.includes('wtbrdxijvtelluwfmgsf')) {
    // WRONG SUPABASE PROJECT → code volé et exécuté ailleurs
    await phoneHome('WRONG_SUPABASE_PROJECT', supabaseUrl)
    return false
  }

  // Vérifier le hostname Vercel
  const vercelUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || ''
  if (vercelUrl && !allowedDomains.some(d => vercelUrl.includes(d))) {
    await phoneHome('WRONG_VERCEL_DOMAIN', vercelUrl)
    return false
  }

  return true
}

/** Alerte silencieuse si le code est exécuté dans un environnement non autorisé */
async function phoneHome(reason: string, detail: string): Promise<void> {
  try {
    // Option 1 : DNS canary (le plus discret)
    // Le simple fait de résoudre ce domaine alerte le propriétaire
    const canaryDomain = process.env.CANARY_DNS_TOKEN
    if (canaryDomain) {
      // Un simple fetch vers ce domaine déclenche l'alerte
      await fetch(`https://${canaryDomain}/${reason}`, {
        signal: AbortSignal.timeout(3000),
      }).catch(() => {})
    }

    // Option 2 : Webhook (plus de détails)
    const canaryWebhook = process.env.CANARY_WEBHOOK_URL
    if (canaryWebhook) {
      await fetch(canaryWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: 'CODE_THEFT_DETECTED',
          reason,
          detail,
          timestamp: new Date().toISOString(),
          env: {
            node_env: process.env.NODE_ENV,
            vercel_url: process.env.VERCEL_URL,
          },
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {})
    }
  } catch {
    // Silencieux — ne pas crasher le voleur (il ne doit pas savoir qu'on sait)
  }
}

// ============================================================
// 5. RESPONSE FINGERPRINTING — Tracer les fuites
// ============================================================

/**
 * Ajoute un fingerprint invisible à chaque réponse API.
 * Si les données fuient → on peut tracer la source.
 */
export function fingerprintResponse(
  data: any,
  userId: string,
  requestId: string
): any {
  if (typeof data !== 'object' || data === null) return data

  // Ajouter un champ invisible (sera strippé par JSON.stringify si non-enumerable)
  const fingerprint = createHmac('sha256', 'satorea-response-fp')
    .update(`${userId}:${requestId}:${Date.now()}`)
    .digest('hex')
    .slice(0, 16)

  // Technique : cacher dans un champ qui ressemble à du metadata technique
  if (Array.isArray(data)) {
    return {
      items: data,
      _meta: { v: '2.1', ts: Date.now(), _: fingerprint },
    }
  }

  return {
    ...data,
    _meta: { v: '2.1', ts: Date.now(), _: fingerprint },
  }
}

// ============================================================
// 6. SELF-DESTRUCT — Si environnement compromis
// ============================================================

/**
 * Vérifie l'intégrité de l'application au démarrage.
 * Si quelque chose ne va pas → les fonctions sensibles retournent des faux.
 */
let _environmentVerified = false
let _isTrustedEnvironment = true

export async function initSecurityChecks(): Promise<void> {
  if (_environmentVerified) return
  _environmentVerified = true

  _isTrustedEnvironment = await verifyExecutionEnvironment()

  if (!_isTrustedEnvironment) {
    console.error('[SECURITY] Untrusted environment detected. Sensitive functions disabled.')
  }
}

/** Retourne true si l'environnement est vérifié et sûr */
export function isTrustedEnvironment(): boolean {
  return _isTrustedEnvironment
}
