// ============================================================
// Domain Layer — Public API
// Import from '@/domain' for all business logic
// ============================================================

// Leads domain
export * from './leads'

// Result types (shared across all domains)
export {
  Ok, Err, isOk, isErr, unwrap, unwrapOr, map, mapErr, andThen, all, tryCatch,
  type Result,
  AppError, ValidationError, NotFoundError, ConflictError, ForbiddenError,
  UnauthorizedError, RateLimitError, InvalidTransitionError, DuplicateError,
  InternalError, ServiceUnavailableError, ExternalServiceError,
} from '@/lib/result'
