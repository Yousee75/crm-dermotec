// ============================================================
// Result Type — Stripe/Rust-inspired error handling
// Never throw for business logic. Return Result<T, E>.
// ============================================================

/**
 * Discriminated union: every function returns Ok or Err.
 * Pattern-match with result.ok / result.err or use helpers.
 *
 * Usage:
 *   const result = await createLead(data)
 *   if (!result.ok) return c.json({ error: result.error }, result.status)
 *   return c.json(result.data, 201)
 */
export type Result<T, E = AppError> =
  | { ok: true; data: T }
  | { ok: false; error: E; status: number }

// --- Constructors ---

export function Ok<T>(data: T): Result<T, never> {
  return { ok: true, data }
}

export function Err<E = AppError>(error: E, status: number = 400): Result<never, E> {
  return { ok: false, error, status }
}

// --- Error hierarchy ---

export type ErrorCode =
  // Validation
  | 'VALIDATION_ERROR'
  | 'INVALID_TRANSITION'
  | 'INVALID_EMAIL'
  | 'DISPOSABLE_EMAIL'
  | 'DUPLICATE_RECORD'
  // Auth / Authz
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INSUFFICIENT_ROLE'
  // Not found
  | 'NOT_FOUND'
  | 'LEAD_NOT_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'INSCRIPTION_NOT_FOUND'
  | 'FINANCEMENT_NOT_FOUND'
  // Business rules
  | 'SESSION_FULL'
  | 'SESSION_NOT_BOOKABLE'
  | 'ALREADY_INSCRIT'
  | 'ALREADY_PAID'
  | 'FINANCEMENT_INVALID_STATE'
  | 'CADENCE_ALREADY_ACTIVE'
  // External services
  | 'STRIPE_ERROR'
  | 'EMAIL_ERROR'
  | 'SUPABASE_ERROR'
  | 'INNGEST_ERROR'
  // System
  | 'INTERNAL_ERROR'
  | 'RATE_LIMIT'
  | 'SERVICE_UNAVAILABLE'

export interface AppError {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
  /** Original error for logging (never sent to client) */
  cause?: unknown
}

// --- Error factories ---

export const Errors = {
  validation: (message: string, details?: Record<string, unknown>): AppError => ({
    code: 'VALIDATION_ERROR',
    message,
    details,
  }),

  invalidTransition: (from: string, to: string, entity: string): AppError => ({
    code: 'INVALID_TRANSITION',
    message: `Transition invalide pour ${entity} : ${from} -> ${to}`,
    details: { from, to, entity },
  }),

  notFound: (entity: string, id: string): AppError => ({
    code: 'NOT_FOUND',
    message: `${entity} non trouve : ${id}`,
    details: { entity, id },
  }),

  duplicate: (entity: string, field: string, value: string): AppError => ({
    code: 'DUPLICATE_RECORD',
    message: `${entity} avec ${field} "${value}" existe deja`,
    details: { entity, field, value },
  }),

  forbidden: (message: string = 'Action non autorisee'): AppError => ({
    code: 'FORBIDDEN',
    message,
  }),

  unauthorized: (message: string = 'Non authentifie'): AppError => ({
    code: 'UNAUTHORIZED',
    message,
  }),

  sessionFull: (sessionId: string): AppError => ({
    code: 'SESSION_FULL',
    message: 'Plus de places disponibles pour cette session',
    details: { session_id: sessionId },
  }),

  alreadyPaid: (inscriptionId: string): AppError => ({
    code: 'ALREADY_PAID',
    message: 'Cette inscription est deja payee',
    details: { inscription_id: inscriptionId },
  }),

  stripe: (message: string, cause?: unknown): AppError => ({
    code: 'STRIPE_ERROR',
    message,
    cause,
  }),

  supabase: (message: string, cause?: unknown): AppError => ({
    code: 'SUPABASE_ERROR',
    message,
    cause,
  }),

  internal: (message: string, cause?: unknown): AppError => ({
    code: 'INTERNAL_ERROR',
    message,
    cause,
  }),
} as const

// --- Helpers ---

/** Map a successful Result's data, pass through errors */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (result.ok) return Ok(fn(result.data))
  return result
}

/** Chain Results (flatMap / andThen) */
export async function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> {
  if (!result.ok) return result
  return fn(result.data)
}

/** Collect array of Results into Result of array, short-circuit on first error */
export function collectResults<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const data: T[] = []
  for (const result of results) {
    if (!result.ok) return result
    data.push(result.data)
  }
  return Ok(data)
}

/** Safe wrapper for async operations that might throw */
export async function trySafe<T>(
  fn: () => Promise<T>,
  errorFactory: (err: unknown) => AppError = (err) =>
    Errors.internal(err instanceof Error ? err.message : 'Unknown error', err)
): Promise<Result<T>> {
  try {
    const data = await fn()
    return Ok(data)
  } catch (err) {
    return Err(errorFactory(err), 500)
  }
}
