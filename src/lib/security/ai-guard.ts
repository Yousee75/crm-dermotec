import 'server-only'

// ============================================================
// CRM DERMOTEC — AI Guard
// Protection chatbot IA : prompt injection, data exfiltration,
// jailbreak, RBAC tools, audit, self-check
// Ref: OWASP LLM Top 10 (LLM01, LLM02, LLM06, LLM07)
// ============================================================

import { createServiceSupabase } from '../supabase-server'

// ──────────────────────────────────────────────────────────────
// Constantes de securite
// ──────────────────────────────────────────────────────────────

const BLOCKED_PATTERNS: { pattern: RegExp; label: string }[] = [
  // Prompt injection directe
  { pattern: /ignore\s+(all\s+)?previous\s+instructions/i, label: 'ignore-instructions' },
  { pattern: /you\s+are\s+now\s+/i, label: 'role-override' },
  { pattern: /pretend\s+(you\s+are|to\s+be)/i, label: 'pretend' },
  { pattern: /act\s+as\s+(an?\s+)?unrestricted/i, label: 'unrestricted' },
  { pattern: /system\s*:/i, label: 'system-marker' },
  { pattern: /<\|system\|>/i, label: 'system-delimiter' },
  { pattern: /###\s*(Human|Assistant|System)\s*:/i, label: 'role-delimiter' },
  { pattern: /<\|im_(start|end)\|>/i, label: 'im-delimiter' },
  { pattern: /\[INST\]/i, label: 'inst-marker' },
  { pattern: /\[SYSTEM\]/i, label: 'system-bracket' },

  // Acces aux secrets
  { pattern: /process\.env/i, label: 'env-access' },
  { pattern: /SUPABASE.*KEY/i, label: 'supabase-key' },
  { pattern: /STRIPE.*KEY/i, label: 'stripe-key' },
  { pattern: /API.?KEY/i, label: 'api-key' },
  { pattern: /SERVICE.?ROLE/i, label: 'service-role' },
  { pattern: /ANON.?KEY/i, label: 'anon-key' },
  { pattern: /RESEND.?API/i, label: 'resend-key' },

  // Execution de code
  { pattern: /eval\s*\(/i, label: 'eval' },
  { pattern: /exec\s*\(/i, label: 'exec' },
  { pattern: /require\s*\(/i, label: 'require' },
  { pattern: /import\s*\(/i, label: 'dynamic-import' },
  { pattern: /Function\s*\(/i, label: 'Function-constructor' },

  // SQL injection
  { pattern: /DROP\s+TABLE/i, label: 'sql-drop' },
  { pattern: /DELETE\s+FROM\s+\w/i, label: 'sql-delete' },
  { pattern: /UPDATE\s+\w+\s+SET/i, label: 'sql-update' },
  { pattern: /INSERT\s+INTO\s+\w/i, label: 'sql-insert' },
  { pattern: /;\s*(DROP|DELETE|UPDATE|ALTER|TRUNCATE)/i, label: 'sql-chain' },

  // Extraction system prompt
  { pattern: /reveal\s+(your|the)\s+(system|prompt|instructions)/i, label: 'reveal-prompt' },
  { pattern: /print\s+(your|the)\s+(system|instructions|prompt)/i, label: 'print-prompt' },
  { pattern: /show\s+(me\s+)?(your|the)\s+(system\s+)?prompt/i, label: 'show-prompt' },
  { pattern: /repeat\s+(your|the)\s+(system|initial)\s+(prompt|message)/i, label: 'repeat-prompt' },

  // Jailbreak classiques
  { pattern: /\bDAN\b.*\b(mode|prompt|now)\b/i, label: 'DAN' },
  { pattern: /jailbreak/i, label: 'jailbreak-keyword' },
  { pattern: /bypass\s+(your|the|any)\s+(rules|filter|safety|restriction)/i, label: 'bypass' },
  { pattern: /override\s+(your|the)\s+(rules|instructions|guidelines|safety)/i, label: 'override' },
  { pattern: /disable\s+(your|the)\s+(filter|safety|restriction)/i, label: 'disable-safety' },

  // Exfiltration de donnees
  { pattern: /dump\s+(the\s+)?(database|table|schema|users|data)/i, label: 'data-dump' },
  { pattern: /export\s+(all|every)\s+(data|record|lead|email)/i, label: 'mass-export' },
]

/** Patterns d'encodage suspect */
const ENCODING_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /(?:[A-Za-z0-9+/]{4}){8,}={0,2}/i, label: 'base64' },
  { pattern: /(?:\\x[0-9a-f]{2}){4,}/i, label: 'hex-escape' },
  { pattern: /(?:\\u[0-9a-f]{4}){3,}/i, label: 'unicode-escape' },
  { pattern: /(?:%[0-9a-f]{2}){6,}/i, label: 'url-encoding' },
]

const SENSITIVE_FIELDS = new Set([
  'password', 'password_hash', 'hashed_password', 'token', 'secret',
  'api_key', 'apikey', 'api_secret', 'stripe_customer_id',
  'service_role', 'anon_key', 'credit_card', 'card_number',
  'cvv', 'cvc', 'ssn', 'siret', 'refresh_token', 'access_token',
  'session_token', 'webhook_secret', 'private_key', 'encryption_key',
])

const TOOL_RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  searchLeads:          { max: 20, windowMs: 60_000 },
  getLeadDetails:       { max: 30, windowMs: 60_000 },
  createReminder:       { max: 10, windowMs: 60_000 },
  getNextSessions:      { max: 15, windowMs: 60_000 },
  analyzeFinancement:   { max: 10, windowMs: 60_000 },
  searchKnowledgeBase:  { max: 20, windowMs: 60_000 },
  getPlaybookResponse:  { max: 10, windowMs: 60_000 },
  getPipelineStats:     { max: 10, windowMs: 60_000 },
  updateLeadStatus:     { max: 10, windowMs: 60_000 },
  sendEmail:            { max: 5,  windowMs: 300_000 },
  getProactiveInsights: { max: 10, windowMs: 60_000 },
  findSimilarSuccess:   { max: 10, windowMs: 60_000 },
  getPipelineForecast:  { max: 10, windowMs: 60_000 },
  getRevenueGraph:      { max: 10, windowMs: 60_000 },
  think:                { max: 50, windowMs: 60_000 },
}

/** Tools ncessitant une confirmation utilisateur */
const DANGEROUS_TOOLS = new Set(['sendEmail', 'updateLeadStatus'])

/** Tools existants autorises */
const ALLOWED_TOOLS = new Set(Object.keys(TOOL_RATE_LIMITS))

/** Max prompt length */
const MAX_PROMPT_LENGTH = 5000

/** Jailbreak patterns multi-turn */
const JAILBREAK_SEQUENCES: { patterns: RegExp[]; technique: string }[] = [
  {
    patterns: [
      /pretend|imagine|roleplay|hypothetical/i,
      /(no\s+rules|without\s+restrictions|anything|unrestricted)/i,
    ],
    technique: 'progressive-roleplay',
  },
  {
    patterns: [
      /(translate|decode|convert|rot13|base64)/i,
      /(secret|hidden|encoded|encrypted)/i,
    ],
    technique: 'encoding-trick',
  },
  {
    patterns: [
      /(what\s+tools|list.*tools|which.*functions)/i,
      /(call|execute|run|invoke).*tool/i,
    ],
    technique: 'tool-enumeration',
  },
]

// ──────────────────────────────────────────────────────────────
// Rate limit store (in-memory, par process)
// ──────────────────────────────────────────────────────────────

const toolCallLog = new Map<string, number[]>()

function getToolCallKey(userId: string, toolName: string): string {
  return `${userId}:${toolName}`
}

function isRateLimited(userId: string, toolName: string): boolean {
  const limit = TOOL_RATE_LIMITS[toolName]
  if (!limit) return false

  const key = getToolCallKey(userId, toolName)
  const now = Date.now()
  const calls = toolCallLog.get(key) || []

  // Purger les appels hors fenetre
  const recent = calls.filter((ts) => now - ts < limit.windowMs)
  toolCallLog.set(key, recent)

  return recent.length >= limit.max
}

function recordToolCall(userId: string, toolName: string): void {
  const key = getToolCallKey(userId, toolName)
  const calls = toolCallLog.get(key) || []
  calls.push(Date.now())
  toolCallLog.set(key, calls)
}

// Nettoyage periodique (eviter fuite memoire)
setInterval(() => {
  const now = Date.now()
  for (const [key, calls] of toolCallLog.entries()) {
    const recent = calls.filter((ts) => now - ts < 600_000)
    if (recent.length === 0) {
      toolCallLog.delete(key)
    } else {
      toolCallLog.set(key, recent)
    }
  }
}, 300_000) // Toutes les 5 minutes

// ──────────────────────────────────────────────────────────────
// 1. sanitizeUserPrompt
// ──────────────────────────────────────────────────────────────

export interface SanitizeResult {
  safe: boolean
  sanitized: string
  threats: string[]
}

export function sanitizeUserPrompt(prompt: string): SanitizeResult {
  const threats: string[] = []

  if (!prompt || typeof prompt !== 'string') {
    return { safe: false, sanitized: '', threats: ['invalid-input'] }
  }

  // Longueur excessive
  if (prompt.length > MAX_PROMPT_LENGTH) {
    threats.push('excessive-length')
  }

  // Patterns bloques
  for (const { pattern, label } of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      threats.push(label)
    }
  }

  // Encodages suspects
  for (const { pattern, label } of ENCODING_PATTERNS) {
    if (pattern.test(prompt)) {
      threats.push(`encoding:${label}`)
    }
  }

  // Caracteres nuls / invisibles (zero-width, direction override)
  if (/[\u0000\u200B\u200C\u200D\u200E\u200F\u202A-\u202E\uFEFF]/.test(prompt)) {
    threats.push('invisible-chars')
  }

  // Si menaces detectees, on sanitise mais on laisse passer les faibles
  const isBlocked = threats.length > 0

  // Nettoyage du prompt
  let sanitized = prompt
    .slice(0, MAX_PROMPT_LENGTH)
    // Supprimer caracteres invisibles
    .replace(/[\u0000\u200B\u200C\u200D\u200E\u200F\u202A-\u202E\uFEFF]/g, '')
    // Supprimer delimiteurs de role
    .replace(/<\|[^|]*\|>/g, '')
    .replace(/###\s*(Human|Assistant|System)\s*:/gi, '')
    .replace(/\[INST\]|\[\/INST\]|\[SYSTEM\]/gi, '')
    .trim()

  return {
    safe: !isBlocked,
    sanitized,
    threats,
  }
}

// ──────────────────────────────────────────────────────────────
// 2. sanitizeToolOutput
// ──────────────────────────────────────────────────────────────

export function sanitizeToolOutput(toolName: string, output: unknown): unknown {
  if (output === null || output === undefined) return output
  if (typeof output === 'string') return redactString(output)
  if (typeof output !== 'object') return output

  if (Array.isArray(output)) {
    // Limiter a 20 resultats
    const limited = output.slice(0, 20)
    return limited.map((item) => sanitizeToolOutput(toolName, item))
  }

  const obj = output as Record<string, unknown>
  const cleaned: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase()

    // Supprimer champs sensibles
    if (SENSITIVE_FIELDS.has(keyLower)) {
      continue
    }

    // Masquer les emails (garder le domaine)
    if (keyLower === 'email' && typeof value === 'string') {
      cleaned[key] = maskEmail(value)
      continue
    }

    // Masquer les telephones (4 derniers chiffres)
    if (
      (keyLower === 'telephone' || keyLower === 'phone' || keyLower === 'tel') &&
      typeof value === 'string'
    ) {
      cleaned[key] = maskPhone(value)
      continue
    }

    // Tronquer les UUIDs internes Supabase (garder les 8 premiers)
    if (keyLower === 'id' && typeof value === 'string' && isUUID(value)) {
      cleaned[key] = value.slice(0, 8) + '...'
      continue
    }

    // Recurse dans les objets imbriques
    if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeToolOutput(toolName, value)
      continue
    }

    // Redact strings potentiellement sensibles
    if (typeof value === 'string') {
      cleaned[key] = redactString(value)
      continue
    }

    cleaned[key] = value
  }

  return cleaned
}

function maskEmail(email: string): string {
  const parts = email.split('@')
  if (parts.length !== 2) return '***@***'
  return `***@${parts[1]}`
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '****'
  return '****' + digits.slice(-4)
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

function redactString(str: string): string {
  // Redact JWT tokens
  let result = str.replace(
    /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}(\.[a-zA-Z0-9_-]*)?/g,
    '[REDACTED_TOKEN]'
  )
  // Redact Stripe keys
  result = result.replace(/sk_(live|test)_[a-zA-Z0-9]{10,}/g, '[REDACTED_KEY]')
  // Redact webhook secrets
  result = result.replace(/whsec_[a-zA-Z0-9]{10,}/g, '[REDACTED_SECRET]')
  return result
}

// ──────────────────────────────────────────────────────────────
// 3. detectJailbreakAttempt
// ──────────────────────────────────────────────────────────────

export interface JailbreakResult {
  isJailbreak: boolean
  confidence: number
  technique?: string
}

export function detectJailbreakAttempt(
  messages: Array<{ role: string; content: string }>
): JailbreakResult {
  if (!messages || messages.length === 0) {
    return { isJailbreak: false, confidence: 0 }
  }

  let totalScore = 0
  let detectedTechnique: string | undefined

  const userMessages = messages.filter((m) => m.role === 'user')

  for (const msg of userMessages) {
    const content = msg.content || ''

    // DAN pattern
    if (/\bDAN\b/.test(content) && /(mode|prompt|now|enable|activate)/i.test(content)) {
      totalScore += 0.9
      detectedTechnique = 'DAN'
    }

    // Role-playing jailbreak
    if (
      /pretend\s+(you\s+are|to\s+be)/i.test(content) &&
      /(no\s+rules|unrestricted|anything|evil|hacker|without\s+limit)/i.test(content)
    ) {
      totalScore += 0.85
      detectedTechnique = 'role-play-jailbreak'
    }

    // Encoding tricks explicites
    if (/rot13|base64\s+decode|decode\s+this/i.test(content)) {
      totalScore += 0.6
      detectedTechnique = 'encoding-trick'
    }

    // Unicode lookalikes (homoglyph attack)
    if (/[\u0400-\u04FF]/.test(content) && /[a-zA-Z]/.test(content)) {
      // Melange cyrillique + latin = potentiel homoglyph
      const cyrillicCount = (content.match(/[\u0400-\u04FF]/g) || []).length
      const latinCount = (content.match(/[a-zA-Z]/g) || []).length
      if (cyrillicCount > 0 && latinCount > 0 && cyrillicCount < latinCount * 0.3) {
        totalScore += 0.5
        detectedTechnique = 'homoglyph-attack'
      }
    }

    // Prompt leaking
    if (
      /what.*system\s+prompt|show.*instructions|reveal.*prompt/i.test(content)
    ) {
      totalScore += 0.7
      detectedTechnique = 'prompt-extraction'
    }

    // Pattern injection directe
    for (const { pattern, label } of BLOCKED_PATTERNS) {
      if (pattern.test(content)) {
        totalScore += 0.4
        if (!detectedTechnique) detectedTechnique = label
      }
    }
  }

  // Multi-turn sequences
  if (userMessages.length >= 2) {
    const allContent = userMessages.map((m) => m.content).join(' ')
    for (const { patterns, technique } of JAILBREAK_SEQUENCES) {
      if (patterns.every((p) => p.test(allContent))) {
        totalScore += 0.5
        if (!detectedTechnique) detectedTechnique = technique
      }
    }

    // Repetition suspecte (meme question reformulee = scraping ou fuzzing)
    const uniqueish = new Set(userMessages.map((m) => m.content.toLowerCase().trim().slice(0, 100)))
    if (userMessages.length > 5 && uniqueish.size < userMessages.length * 0.5) {
      totalScore += 0.3
      if (!detectedTechnique) detectedTechnique = 'repetitive-probing'
    }
  }

  const confidence = Math.min(totalScore, 1)

  return {
    isJailbreak: confidence >= 0.6,
    confidence: Math.round(confidence * 100) / 100,
    technique: detectedTechnique,
  }
}

// ──────────────────────────────────────────────────────────────
// 4. validateToolCall
// ──────────────────────────────────────────────────────────────

export interface ToolCallValidation {
  allowed: boolean
  reason?: string
  requiresConfirmation?: boolean
}

export function validateToolCall(
  toolName: string,
  args: Record<string, unknown>,
  userId: string
): ToolCallValidation {
  // Tool existe ?
  if (!ALLOWED_TOOLS.has(toolName)) {
    return { allowed: false, reason: `Tool inconnu: ${toolName}` }
  }

  // Rate limit
  if (isRateLimited(userId, toolName)) {
    const limit = TOOL_RATE_LIMITS[toolName]
    return {
      allowed: false,
      reason: `Limite atteinte pour ${toolName} (${limit.max} appels/${Math.round(limit.windowMs / 1000)}s)`,
    }
  }

  // Validation des arguments par tool
  const argValidation = validateToolArgs(toolName, args)
  if (!argValidation.valid) {
    return { allowed: false, reason: argValidation.reason }
  }

  // Enregistrer l'appel
  recordToolCall(userId, toolName)

  // Actions dangereuses = confirmation
  if (DANGEROUS_TOOLS.has(toolName)) {
    return { allowed: true, requiresConfirmation: true }
  }

  return { allowed: true }
}

function validateToolArgs(
  toolName: string,
  args: Record<string, unknown>
): { valid: boolean; reason?: string } {
  switch (toolName) {
    case 'searchLeads': {
      const limit = typeof args.limit === 'number' ? args.limit : 5
      if (limit > 50) return { valid: false, reason: 'Limit max 50 pour searchLeads' }
      if (typeof args.query === 'string' && args.query.length > 200) {
        return { valid: false, reason: 'Query trop longue (max 200 chars)' }
      }
      // Proteger contre injection SQL dans query
      if (typeof args.query === 'string' && /[;'"\\]/.test(args.query)) {
        return { valid: false, reason: 'Caracteres non autorises dans la recherche' }
      }
      return { valid: true }
    }

    case 'getLeadDetails': {
      if (!args.lead_id || typeof args.lead_id !== 'string') {
        return { valid: false, reason: 'lead_id requis' }
      }
      if (!isUUID(args.lead_id as string)) {
        return { valid: false, reason: 'lead_id doit etre un UUID valide' }
      }
      return { valid: true }
    }

    case 'updateLeadStatus': {
      const validStatuts = [
        'NOUVEAU', 'CONTACTE', 'QUALIFIE', 'PROPOSITION',
        'FINANCEMENT_EN_COURS', 'INSCRIT', 'EN_FORMATION',
        'FORME', 'ALUMNI', 'PERDU', 'SPAM',
      ]
      if (args.statut && !validStatuts.includes(args.statut as string)) {
        return { valid: false, reason: `Statut invalide: ${args.statut}` }
      }
      return { valid: true }
    }

    case 'sendEmail': {
      if (typeof args.to === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.to)) {
        return { valid: false, reason: 'Adresse email invalide' }
      }
      if (typeof args.subject === 'string' && args.subject.length > 200) {
        return { valid: false, reason: 'Sujet trop long (max 200 chars)' }
      }
      if (typeof args.body === 'string' && args.body.length > 5000) {
        return { valid: false, reason: 'Corps email trop long (max 5000 chars)' }
      }
      return { valid: true }
    }

    case 'createReminder': {
      if (typeof args.lead_id === 'string' && !isUUID(args.lead_id)) {
        return { valid: false, reason: 'lead_id doit etre un UUID valide' }
      }
      return { valid: true }
    }

    default:
      return { valid: true }
  }
}

// ──────────────────────────────────────────────────────────────
// 5. auditAIConversation
// ──────────────────────────────────────────────────────────────

/** Compteur scraping in-memory */
const userQueryCounts = new Map<string, { count: number; windowStart: number }>()
const SCRAPING_THRESHOLD = 50
const SCRAPING_WINDOW_MS = 600_000 // 10 minutes

export async function auditAIConversation(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  toolCalls: Array<{ tool: string; args?: unknown; result?: unknown }>
): Promise<void> {
  try {
    // Detection scraping
    const now = Date.now()
    const entry = userQueryCounts.get(userId) || { count: 0, windowStart: now }

    if (now - entry.windowStart > SCRAPING_WINDOW_MS) {
      entry.count = 1
      entry.windowStart = now
    } else {
      entry.count++
    }
    userQueryCounts.set(userId, entry)

    const isSuspicious = entry.count > SCRAPING_THRESHOLD

    // Tronquer messages pour le stockage (max 500 chars par message)
    const truncatedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content?.slice(0, 500) || '',
    }))

    // Tronquer resultats tools (max 200 chars)
    const truncatedToolCalls = toolCalls.map((tc) => ({
      tool: tc.tool,
      args: tc.args ? JSON.stringify(tc.args).slice(0, 200) : null,
      result: tc.result ? JSON.stringify(tc.result).slice(0, 200) : null,
    }))

    const supabase = await createServiceSupabase()
    await (supabase as any)
      .from('ai_audit_log')
      .insert({
        user_id: userId,
        messages: truncatedMessages,
        tool_calls: truncatedToolCalls,
        message_count: messages.length,
        is_suspicious: isSuspicious,
        suspicion_reason: isSuspicious
          ? `${entry.count} requetes en ${Math.round((now - entry.windowStart) / 1000)}s`
          : null,
        created_at: new Date().toISOString(),
      })

    if (isSuspicious) {
      console.warn(
        `[AI-GUARD] Scraping suspect: user=${userId} count=${entry.count} window=${Math.round((now - entry.windowStart) / 1000)}s`
      )
    }
  } catch (err) {
    // Audit ne doit jamais bloquer le flux principal
    console.error('[AI-GUARD] Audit error:', err instanceof Error ? err.message : err)
  }
}

// ──────────────────────────────────────────────────────────────
// 6. selfCheck
// ──────────────────────────────────────────────────────────────

/** Hash du system prompt attendu (a mettre a jour si le prompt change) */
let registeredSystemPromptHash: string | null = null
let registeredToolNames: Set<string> | null = null

/**
 * Enregistre l'etat initial du systeme pour la verification d'integrite.
 * A appeler au demarrage de l'API route.
 */
export function registerSystemState(systemPrompt: string, toolNames: string[]): void {
  registeredSystemPromptHash = simpleHash(systemPrompt)
  registeredToolNames = new Set(toolNames)
}

export interface SelfCheckResult {
  healthy: boolean
  issues: string[]
}

export function selfCheck(
  currentSystemPrompt?: string,
  currentToolNames?: string[]
): SelfCheckResult {
  const issues: string[] = []

  // Verifier que le system prompt n'a pas ete modifie
  if (registeredSystemPromptHash && currentSystemPrompt) {
    const currentHash = simpleHash(currentSystemPrompt)
    if (currentHash !== registeredSystemPromptHash) {
      issues.push('System prompt modifie depuis le demarrage')
    }
  } else if (!registeredSystemPromptHash) {
    issues.push('Etat initial non enregistre (appeler registerSystemState au demarrage)')
  }

  // Verifier que les tools sont les memes
  if (registeredToolNames && currentToolNames) {
    const currentSet = new Set(currentToolNames)
    for (const tool of currentToolNames) {
      if (!registeredToolNames.has(tool)) {
        issues.push(`Tool non autorise detecte: ${tool}`)
      }
    }
    for (const tool of registeredToolNames) {
      if (!currentSet.has(tool)) {
        issues.push(`Tool manquant: ${tool}`)
      }
    }
  }

  // Verifier que les rate limits sont en place
  if (Object.keys(TOOL_RATE_LIMITS).length === 0) {
    issues.push('Rate limits non configurees')
  }

  // Verifier que les patterns de blocage sont charges
  if (BLOCKED_PATTERNS.length === 0) {
    issues.push('Patterns de blocage non charges')
  }

  return {
    healthy: issues.length === 0,
    issues,
  }
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/** Hash simple pour comparaison d'integrite (pas crypto, juste detection de changement) */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return hash.toString(36)
}

// ──────────────────────────────────────────────────────────────
// Nettoyage memoire au shutdown (si possible)
// ──────────────────────────────────────────────────────────────

if (typeof process !== 'undefined') {
  const cleanup = () => {
    toolCallLog.clear()
    userQueryCounts.clear()
  }
  process.on('SIGTERM', cleanup)
  process.on('SIGINT', cleanup)
}
