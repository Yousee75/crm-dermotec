import 'server-only'
// ============================================================
// CRM SATOREA — MCP Safety Layer
// Protège contre les requêtes SQL dangereuses via MCP.
// Le MCP Supabase utilise service_role = BYPASS RLS TOTAL.
// Ce fichier est la DERNIÈRE ligne de défense.
// ============================================================

// ============================================================
// LISTES DE BLOCAGE
// ============================================================

/** Mots-clés SQL dangereux — BLOQUÉS inconditionnellement */
const DANGEROUS_SQL = [
  /\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW|FUNCTION|TRIGGER|POLICY)\b/i,
  /\bTRUNCATE\s+/i,
  /\bDELETE\s+FROM\s+\w+\s*$/i, // DELETE sans WHERE
  /\bUPDATE\s+\w+\s+SET\s+.*(?!WHERE)/i, // UPDATE sans WHERE (heuristique)
  /\bALTER\s+TABLE\s+\w+\s+DROP\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bCREATE\s+ROLE\b/i,
  /\bDROP\s+ROLE\b/i,
  /\bCREATE\s+USER\b/i,
  /\bALTER\s+ROLE\b/i,
  /\bCOPY\s+.*\bTO\b/i, // COPY TO = export data
  /\bCOPY\s+.*\bFROM\b/i, // COPY FROM = import data
  /\bpg_dump\b/i,
  /\bpg_restore\b/i,
  /\bSET\s+ROLE\b/i,
  /\bSET\s+SESSION\b/i,
  /\bRESET\s+ROLE\b/i,
  /\\connect\b/i,
  /\bCREATE\s+EXTENSION\b/i,
  /\bDROP\s+EXTENSION\b/i,
  /\bCREATE\s+SERVER\b/i,
  /\bdblink\b/i, // Cross-database access
  /\bpg_read_file\b/i, // Filesystem access
  /\bpg_write_file\b/i,
  /\bpg_ls_dir\b/i,
  /\blo_import\b/i, // Large object manipulation
  /\blo_export\b/i,
]

/** Tables sensibles — accès bloqué même en lecture */
const SENSITIVE_TABLES = [
  'auth.users', // Supabase auth interne
  'auth.sessions',
  'auth.refresh_tokens',
  'auth.mfa_factors',
  'auth.mfa_challenges',
  'auth.flow_state',
  'auth.identities',
  'vault.secrets', // Supabase vault
  'supabase_functions.secrets',
  'extensions', // Extensions système
  'pg_catalog', // Catalogue PostgreSQL
  'information_schema', // Schéma info
]

/** Patterns d'injection SQL */
const SQL_INJECTION_PATTERNS = [
  /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|GRANT|CREATE)\b/i, // Multi-statement
  /UNION\s+(ALL\s+)?SELECT/i, // UNION injection
  /\/\*.*\*\//s, // Block comments (pour cacher du code)
  /--[^\n]*$/m, // Line comments en fin de requête
  /';\s*--/i, // Classic SQL injection
  /\bWAITFOR\s+DELAY\b/i, // Time-based injection
  /\bSLEEP\s*\(/i, // Time-based injection MySQL
  /\bpg_sleep\s*\(/i, // Time-based injection PostgreSQL
  /\bBENCHMARK\s*\(/i, // MySQL benchmark injection
]

// ============================================================
// FONCTIONS PUBLIQUES
// ============================================================

/**
 * Vérifie qu'une requête SQL est safe avant exécution via MCP.
 * Retourne un objet avec le statut et la raison du blocage.
 */
export function sanitizeSQLForMCP(sql: string): {
  safe: boolean
  reason?: string
  sanitized?: string
  blocked_pattern?: string
} {
  if (!sql || typeof sql !== 'string') {
    return { safe: false, reason: 'Empty or invalid SQL' }
  }

  const trimmed = sql.trim()

  // Longueur max (anti-DoS)
  if (trimmed.length > 10_000) {
    return { safe: false, reason: 'SQL too long (max 10000 chars)' }
  }

  // Vérifier les patterns dangereux
  for (const pattern of DANGEROUS_SQL) {
    if (pattern.test(trimmed)) {
      return {
        safe: false,
        reason: 'Dangerous SQL operation blocked',
        blocked_pattern: pattern.source.slice(0, 50),
      }
    }
  }

  // Vérifier les patterns d'injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        safe: false,
        reason: 'SQL injection pattern detected',
        blocked_pattern: pattern.source.slice(0, 50),
      }
    }
  }

  // Vérifier l'accès aux tables sensibles
  for (const table of SENSITIVE_TABLES) {
    if (trimmed.toLowerCase().includes(table.toLowerCase())) {
      return {
        safe: false,
        reason: `Access to sensitive table blocked: ${table}`,
      }
    }
  }

  return { safe: true, sanitized: trimmed }
}

/**
 * Vérifie qu'une requête SQL est en lecture seule (SELECT/EXPLAIN/SHOW).
 */
export function isReadOnlyQuery(sql: string): boolean {
  if (!sql || typeof sql !== 'string') return false

  const trimmed = sql.trim().toUpperCase()

  // Accepter seulement SELECT, EXPLAIN, SHOW, WITH...SELECT
  const readOnlyPrefixes = [
    /^SELECT\b/,
    /^EXPLAIN\b/,
    /^SHOW\b/,
    /^WITH\b.*\bSELECT\b/s, // CTE (Common Table Expression)
    /^TABLE\b/, // TABLE est un raccourci SELECT * FROM
  ]

  const isReadOnly = readOnlyPrefixes.some(p => p.test(trimmed))

  if (!isReadOnly) return false

  // Double check : pas de sous-requêtes d'écriture cachées
  const writePatterns = [
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bINTO\b/i, // SELECT INTO = écriture
    /\bCREATE\b/i,
    /\bDROP\b/i,
    /\bALTER\b/i,
    /\bTRUNCATE\b/i,
  ]

  return !writePatterns.some(p => p.test(sql))
}

/**
 * Log un accès SQL via MCP pour audit.
 */
export async function logMCPSQLAccess(params: {
  sql: string
  safe: boolean
  reason?: string
  user_agent?: string
  source?: string // 'claude_code', 'cursor', 'mcp_custom'
}): Promise<void> {
  try {
    const { createServiceSupabase } = await import('../supabase-server')
    const supabase = await createServiceSupabase()

    await (supabase as any).from('security_events').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // MCP = pas de user auth
      action: 'api_call',
      risk_score: params.safe ? 0 : 80,
      risk_level: params.safe ? 'low' : 'high',
      risk_flags: params.safe ? ['MCP_SQL_ACCESS'] : ['MCP_SQL_BLOCKED', params.reason || 'unknown'],
      risk_action: params.safe ? 'allow' : 'block',
      metadata: {
        sql_preview: params.sql.slice(0, 200), // Tronquer pour ne pas stocker des requêtes énormes
        source: params.source || 'mcp',
        blocked_reason: params.reason,
      },
    })
  } catch {
    // Non-bloquant
  }

  // Log console pour debugging
  if (!params.safe) {
    console.warn(`[MCP SAFETY] BLOCKED: ${params.reason} — SQL: ${params.sql.slice(0, 100)}`)
  }
}

/**
 * Wrapper complet : vérifie + log + retourne le résultat.
 * À utiliser comme middleware avant toute exécution SQL via MCP.
 */
export async function guardMCPSQL(sql: string, source?: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  // Étape 1 : vérifier read-only
  const readOnly = isReadOnlyQuery(sql)

  // Étape 2 : sanitize
  const result = sanitizeSQLForMCP(sql)

  // Étape 3 : décision
  const allowed = readOnly && result.safe

  // Étape 4 : log
  await logMCPSQLAccess({
    sql,
    safe: allowed,
    reason: !allowed ? (result.reason || 'Not a read-only query') : undefined,
    source,
  })

  return {
    allowed,
    reason: !allowed ? (result.reason || 'Only SELECT queries are allowed via MCP') : undefined,
  }
}
