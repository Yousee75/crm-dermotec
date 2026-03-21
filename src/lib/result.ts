// ============================================================
// CRM DERMOTEC — Result Type (Ok/Err)
// Pattern enterprise : jamais throw pour la logique métier
// Inspiré de Rust Result<T, E> et Effect-TS
// ============================================================

// --- Types de base ---

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}

// --- Helpers ---

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok
}

/** Extraire la valeur ou throw (dernier recours, à la frontière API) */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value
  throw result.error
}

/** Extraire la valeur ou retourner un fallback */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback
}

/** Mapper la valeur si Ok */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result
}

/** Mapper l'erreur si Err */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : Err(fn(result.error))
}

/** Chaîner les opérations (flatMap) */
export function andThen<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return result.ok ? fn(result.value) : result
}

/** Combiner plusieurs Results — échoue au premier Err */
export function all<T extends readonly Result<unknown, unknown>[]>(
  results: T
): Result<
  { [K in keyof T]: T[K] extends Result<infer V, unknown> ? V : never },
  T[number] extends Result<unknown, infer E> ? E : never
> {
  const values: unknown[] = []
  for (const result of results) {
    if (!result.ok) return result as never
    values.push(result.value)
  }
  return Ok(values) as never
}

/** Wrapper try/catch → Result */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  mapError?: (error: unknown) => AppError
): Promise<Result<T, AppError>> {
  try {
    const value = await fn()
    return Ok(value)
  } catch (error) {
    if (mapError) return Err(mapError(error))
    if (error instanceof AppError) return Err(error)
    return Err(new InternalError(
      error instanceof Error ? error.message : 'Unknown error',
      { cause: error }
    ))
  }
}

// ============================================================
// Error Hierarchy — Codes structurés pour les API consumers
// ============================================================

export abstract class AppError extends Error {
  abstract readonly code: string
  abstract readonly httpStatus: number
  readonly timestamp: string
  readonly details?: Record<string, unknown>

  constructor(message: string, options?: { cause?: unknown; details?: Record<string, unknown> }) {
    super(message, { cause: options?.cause })
    this.timestamp = new Date().toISOString()
    this.details = options?.details
    this.name = this.constructor.name
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    }
  }
}

// --- Erreurs métier (4xx) ---

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR'
  readonly httpStatus = 400
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND'
  readonly httpStatus = 404
}

export class ConflictError extends AppError {
  readonly code = 'CONFLICT'
  readonly httpStatus = 409
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN'
  readonly httpStatus = 403
}

export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED'
  readonly httpStatus = 401
}

export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_EXCEEDED'
  readonly httpStatus = 429
}

export class InvalidTransitionError extends AppError {
  readonly code = 'INVALID_TRANSITION'
  readonly httpStatus = 422

  constructor(entity: string, from: string, to: string) {
    super(`Transition invalide pour ${entity}: ${from} → ${to}`, {
      details: { entity, from, to },
    })
  }
}

export class DuplicateError extends AppError {
  readonly code = 'DUPLICATE'
  readonly httpStatus = 409

  constructor(entity: string, field: string, value: string) {
    super(`${entity} avec ${field}="${value}" existe déjà`, {
      details: { entity, field, value },
    })
  }
}

// --- Erreurs infrastructure (5xx) ---

export class InternalError extends AppError {
  readonly code = 'INTERNAL_ERROR'
  readonly httpStatus = 500
}

export class ServiceUnavailableError extends AppError {
  readonly code = 'SERVICE_UNAVAILABLE'
  readonly httpStatus = 503

  constructor(service: string, cause?: unknown) {
    super(`Service "${service}" indisponible`, { cause, details: { service } })
  }
}

export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR'
  readonly httpStatus = 502

  constructor(service: string, message: string, cause?: unknown) {
    super(`Erreur ${service}: ${message}`, { cause, details: { service } })
  }
}
