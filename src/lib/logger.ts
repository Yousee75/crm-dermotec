// ============================================================
// CRM DERMOTEC — Structured Logging + Correlation IDs
// JSON format compatible Sentry, Vercel Logs, Datadog
// ============================================================

import { randomUUID } from 'crypto'

// --- Types ---

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogContext {
  /** Correlation ID pour tracer une requete a travers les services */
  correlationId?: string
  /** Request ID (genere par Vercel/Cloudflare) */
  requestId?: string
  /** User ID authentifié */
  userId?: string
  /** Service/module source */
  service?: string
  /** Lead ID si applicable */
  leadId?: string
  /** Session ID si applicable */
  sessionId?: string
  /** Duree de l'operation en ms */
  durationMs?: number
  /** HTTP method */
  method?: string
  /** HTTP path */
  path?: string
  /** HTTP status code */
  statusCode?: number
  /** Metadata additionnel */
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  correlationId: string
  context: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// --- Log levels hierarchy ---
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

// --- Correlation ID management ---
// AsyncLocalStorage n'est pas dispo partout dans Edge Runtime
// On utilise un header x-correlation-id ou on en genere un

let _correlationId: string | null = null

/**
 * Set the correlation ID for the current request context
 */
export function setCorrelationId(id: string): void {
  _correlationId = id
}

/**
 * Get or create a correlation ID
 */
export function getCorrelationId(): string {
  if (_correlationId) return _correlationId
  _correlationId = randomUUID()
  return _correlationId
}

// --- PII Sanitization pour logs ---
// Empeche la fuite de donnees personnelles dans les logs/Sentry/Vercel

/**
 * Masque les donnees sensibles avant logging
 * - Emails : j***@domain.com
 * - Telephones : 06 ** ** ** 89
 * - Tokens/cles API : ****4chars
 */
export function sanitizeForLog(value: unknown): unknown {
  if (typeof value === 'string') {
    let sanitized = value
    // Emails : john.doe@gmail.com → j***@gmail.com
    sanitized = sanitized.replace(
      /([a-zA-Z0-9._%+-])([a-zA-Z0-9._%+-]*)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      (_, first, _rest, domain) => `${first}***@${domain}`
    )
    // Telephones FR : 06 12 34 56 78 → 06 ** ** ** 78
    sanitized = sanitized.replace(
      /(\b0[1-9])[\s.-]?(\d{2})[\s.-]?(\d{2})[\s.-]?(\d{2})[\s.-]?(\d{2}\b)/g,
      (_, prefix, _g2, _g3, _g4, last) => `${prefix} ** ** ** ${last}`
    )
    // +33 format
    sanitized = sanitized.replace(
      /(\+33[\s.-]?\d)[\s.-]?(\d{2})[\s.-]?(\d{2})[\s.-]?(\d{2})[\s.-]?(\d{2})/g,
      (_, prefix, _g2, _g3, _g4, last) => `${prefix} ** ** ** ${last}`
    )
    // Tokens/cles API (prefixes courants)
    sanitized = sanitized.replace(
      /(sk_live_|sk_test_|dmtc_live_|Bearer\s+)([a-zA-Z0-9_-]{4,})/g,
      (_, prefix, token) => `${prefix}****${token.slice(-4)}`
    )
    return sanitized
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForLog)
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      sanitized[k] = sanitizeForLog(v)
    }
    return sanitized
  }
  return value
}

// --- Core Logger ---

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL]
}

function formatEntry(level: LogLevel, message: string, context: LogContext, error?: Error): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: context.service || 'crm-dermotec',
    correlationId: context.correlationId || getCorrelationId(),
    context: { ...context },
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    }
  }

  // Nettoyer les champs deja presents au top-level
  delete entry.context.service
  delete entry.context.correlationId

  return entry
}

function emit(entry: LogEntry): void {
  // En production, masquer les PII dans les logs pour eviter les fuites
  const safeEntry = process.env.NODE_ENV === 'production'
    ? sanitizeForLog(entry) as LogEntry
    : entry
  const json = JSON.stringify(safeEntry)

  switch (entry.level) {
    case 'debug':
      console.debug(json)
      break
    case 'info':
      console.info(json)
      break
    case 'warn':
      console.warn(json)
      break
    case 'error':
    case 'fatal':
      console.error(json)
      break
  }
}

// --- Public API ---

export const logger = {
  debug(message: string, context: LogContext = {}): void {
    if (!shouldLog('debug')) return
    emit(formatEntry('debug', message, context))
  },

  info(message: string, context: LogContext = {}): void {
    if (!shouldLog('info')) return
    emit(formatEntry('info', message, context))
  },

  warn(message: string, context: LogContext = {}): void {
    if (!shouldLog('warn')) return
    emit(formatEntry('warn', message, context))
  },

  error(message: string, error?: Error, context: LogContext = {}): void {
    if (!shouldLog('error')) return
    emit(formatEntry('error', message, context, error))
  },

  fatal(message: string, error?: Error, context: LogContext = {}): void {
    emit(formatEntry('fatal', message, context, error))
  },

  /**
   * Logger pour une requete API — mesure automatiquement la duree
   */
  request(method: string, path: string, context: LogContext = {}): RequestLogger {
    return new RequestLogger(method, path, context)
  },

  /**
   * Logger specialise pour un service
   */
  child(service: string, baseContext: LogContext = {}): ChildLogger {
    return new ChildLogger(service, baseContext)
  },
}

// --- Request Logger (auto-timer) ---

class RequestLogger {
  private startTime: number
  private method: string
  private path: string
  private context: LogContext

  constructor(method: string, path: string, context: LogContext) {
    this.startTime = Date.now()
    this.method = method
    this.path = path
    this.context = { ...context, method, path }

    logger.info(`${method} ${path} started`, this.context)
  }

  success(statusCode: number, extra: LogContext = {}): void {
    const durationMs = Date.now() - this.startTime
    logger.info(`${this.method} ${this.path} -> ${statusCode} (${durationMs}ms)`, {
      ...this.context,
      ...extra,
      statusCode,
      durationMs,
    })

    // Alerte si lent
    if (durationMs > 3000) {
      logger.warn(`Slow request: ${this.method} ${this.path} took ${durationMs}ms`, {
        ...this.context,
        durationMs,
        statusCode,
        service: 'performance',
      })
    }
  }

  error(statusCode: number, error: Error, extra: LogContext = {}): void {
    const durationMs = Date.now() - this.startTime
    logger.error(`${this.method} ${this.path} -> ${statusCode} (${durationMs}ms)`, error, {
      ...this.context,
      ...extra,
      statusCode,
      durationMs,
    })
  }
}

// --- Child Logger (scoped to a service) ---

class ChildLogger {
  private service: string
  private baseContext: LogContext

  constructor(service: string, baseContext: LogContext) {
    this.service = service
    this.baseContext = baseContext
  }

  debug(message: string, context: LogContext = {}): void {
    logger.debug(message, { ...this.baseContext, ...context, service: this.service })
  }

  info(message: string, context: LogContext = {}): void {
    logger.info(message, { ...this.baseContext, ...context, service: this.service })
  }

  warn(message: string, context: LogContext = {}): void {
    logger.warn(message, { ...this.baseContext, ...context, service: this.service })
  }

  error(message: string, error?: Error, context: LogContext = {}): void {
    logger.error(message, error, { ...this.baseContext, ...context, service: this.service })
  }
}

// --- Sentry Breadcrumbs Helper ---

/**
 * Ajoute un breadcrumb Sentry pour les actions CRM
 * Importe Sentry dynamiquement pour eviter le bundle size
 */
export async function addSentryBreadcrumb(params: {
  category: 'lead' | 'session' | 'paiement' | 'email' | 'financement' | 'auth' | 'api'
  message: string
  level: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}): Promise<void> {
  // Sentry désactivé — log console à la place
  if (params.level === 'error') {
    console.error(`[${params.category}] ${params.message}`, params.data)
  }
}

/**
 * Capturer une exception (console.error fallback)
 */
export async function captureException(error: Error, context: {
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  user?: { id: string; email?: string }
}): Promise<void> {
  console.error('[Exception]', error.message, context.tags, context.extra)
}

// --- Performance Budget Alerting ---

export const PERF_BUDGETS = {
  /** API response time max en ms */
  API_RESPONSE: 3000,
  /** Dashboard load max en ms */
  DASHBOARD_LOAD: 5000,
  /** DB query max en ms */
  DB_QUERY: 1000,
  /** Email send max en ms */
  EMAIL_SEND: 5000,
  /** Stripe call max en ms */
  STRIPE_CALL: 10000,
} as const

/**
 * Mesure la duree d'une operation et alerte si elle depasse le budget
 */
export async function withPerfBudget<T>(
  operationName: string,
  budgetMs: number,
  fn: () => Promise<T>,
  context: LogContext = {}
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start

    if (duration > budgetMs) {
      logger.warn(`Performance budget exceeded: ${operationName}`, {
        ...context,
        service: 'performance',
        durationMs: duration,
        budgetMs,
        overshootMs: duration - budgetMs,
      })

      await addSentryBreadcrumb({
        category: 'api',
        message: `Perf budget exceeded: ${operationName} (${duration}ms > ${budgetMs}ms)`,
        level: 'warning',
        data: { duration, budget: budgetMs },
      })
    }

    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error(`${operationName} failed after ${duration}ms`, error as Error, {
      ...context,
      durationMs: duration,
    })
    throw error
  }
}

// --- Business Metrics Logger ---

export const businessMetrics = {
  /**
   * Logger une conversion (lead -> inscrit)
   */
  conversion(leadId: string, formationNom: string, montant: number, source: string): void {
    logger.info('Business metric: conversion', {
      service: 'metrics',
      leadId,
      metric: 'conversion',
      formationNom,
      montant,
      source,
    })
  },

  /**
   * Logger un paiement recu
   */
  payment(montant: number, moyen: string, formationNom: string): void {
    logger.info('Business metric: payment', {
      service: 'metrics',
      metric: 'payment',
      montant,
      moyen,
      formationNom,
    })
  },

  /**
   * Logger une anomalie business (drop de conversion, etc.)
   */
  anomaly(type: string, description: string, data: Record<string, unknown>): void {
    logger.warn(`Business anomaly: ${type}`, {
      service: 'metrics',
      metric: 'anomaly',
      anomalyType: type,
      description,
      ...data,
    })
  },
}
