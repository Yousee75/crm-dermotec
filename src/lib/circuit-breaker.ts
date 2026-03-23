// ============================================================
// CRM DERMOTEC — Circuit Breaker + Retry with Jitter
// Resilience patterns pour APIs externes (Stripe, Resend, Supabase)
// ============================================================

// --- Types ---

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerOptions {
  /** Nombre d'echecs avant ouverture du circuit */
  failureThreshold: number
  /** Duree en ms pendant laquelle le circuit reste ouvert */
  resetTimeout: number
  /** Nombre de requetes autorisees en half-open pour tester */
  halfOpenRequests: number
  /** Fonction appelée quand le circuit s'ouvre */
  onOpen?: (serviceName: string, error: Error) => void
  /** Fonction appelée quand le circuit se ferme */
  onClose?: (serviceName: string) => void
  /** Fonction appelée quand le circuit passe en half-open */
  onHalfOpen?: (serviceName: string) => void
}

interface CircuitBreakerState {
  state: CircuitState
  failures: number
  successes: number
  lastFailure: number
  lastAttempt: number
  halfOpenAttempts: number
}

interface RetryOptions {
  /** Nombre max de tentatives (incluant la premiere) */
  maxAttempts: number
  /** Delai de base en ms */
  baseDelay: number
  /** Facteur multiplicatif pour le backoff */
  backoffFactor: number
  /** Delai max en ms */
  maxDelay: number
  /** Ajouter du jitter aleatoire */
  jitter: boolean
  /** Fonction pour determiner si l'erreur est retriable */
  isRetriable?: (error: Error) => boolean
}

// --- Circuit Breaker ---

const circuits = new Map<string, CircuitBreakerState>()

const DEFAULT_CB_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30_000, // 30 secondes
  halfOpenRequests: 2,
}

function getCircuit(name: string): CircuitBreakerState {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailure: 0,
      lastAttempt: 0,
      halfOpenAttempts: 0,
    })
  }
  return circuits.get(name)!
}

/**
 * Circuit Breaker pattern
 *
 * CLOSED (normal) -> OPEN (apres N echecs) -> HALF_OPEN (apres timeout) -> CLOSED (si succes)
 *
 * Usage:
 * ```ts
 * const result = await circuitBreaker('stripe', () => stripe.charges.create(...))
 * ```
 */
export async function circuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  options: Partial<CircuitBreakerOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_CB_OPTIONS, ...options }
  const circuit = getCircuit(serviceName)
  const now = Date.now()

  // --- OPEN: rejeter immediatement ---
  if (circuit.state === 'OPEN') {
    if (now - circuit.lastFailure > opts.resetTimeout) {
      // Timeout ecoule -> passer en HALF_OPEN
      circuit.state = 'HALF_OPEN'
      circuit.halfOpenAttempts = 0
      opts.onHalfOpen?.(serviceName)
      // Circuit state transition: OPEN -> HALF_OPEN
    } else {
      throw new CircuitOpenError(
        serviceName,
        opts.resetTimeout - (now - circuit.lastFailure)
      )
    }
  }

  // --- HALF_OPEN: limiter le nombre de requetes test ---
  if (circuit.state === 'HALF_OPEN' && circuit.halfOpenAttempts >= opts.halfOpenRequests) {
    throw new CircuitOpenError(serviceName, opts.resetTimeout)
  }

  // --- Executer la fonction ---
  try {
    circuit.lastAttempt = now
    if (circuit.state === 'HALF_OPEN') circuit.halfOpenAttempts++

    const result = await fn()

    // Succes
    if (circuit.state === 'HALF_OPEN') {
      circuit.successes++
      if (circuit.successes >= opts.halfOpenRequests) {
        // Assez de succes -> fermer le circuit
        circuit.state = 'CLOSED'
        circuit.failures = 0
        circuit.successes = 0
        opts.onClose?.(serviceName)
        // Circuit state transition: HALF_OPEN -> CLOSED
      }
    } else {
      // Reset failures on success in CLOSED state
      circuit.failures = 0
    }

    return result
  } catch (error) {
    circuit.failures++
    circuit.lastFailure = now

    if (circuit.state === 'HALF_OPEN') {
      // Echec en half-open -> rouvrir
      circuit.state = 'OPEN'
      circuit.successes = 0
      opts.onOpen?.(serviceName, error as Error)
      console.error(`[CircuitBreaker] ${serviceName}: HALF_OPEN -> OPEN (failure in test)`)
    } else if (circuit.failures >= opts.failureThreshold) {
      // Seuil atteint -> ouvrir
      circuit.state = 'OPEN'
      opts.onOpen?.(serviceName, error as Error)
      console.error(`[CircuitBreaker] ${serviceName}: CLOSED -> OPEN (${circuit.failures} failures)`)
    }

    throw error
  }
}

/**
 * Erreur specifique quand le circuit est ouvert
 */
export class CircuitOpenError extends Error {
  public readonly serviceName: string
  public readonly retryAfterMs: number

  constructor(serviceName: string, retryAfterMs: number) {
    super(`Circuit breaker OPEN for ${serviceName}. Retry after ${Math.ceil(retryAfterMs / 1000)}s`)
    this.name = 'CircuitOpenError'
    this.serviceName = serviceName
    this.retryAfterMs = retryAfterMs
  }
}

/**
 * Obtenir l'etat actuel d'un circuit (pour monitoring)
 */
export function getCircuitState(serviceName: string): CircuitBreakerState & { name: string } {
  return { name: serviceName, ...getCircuit(serviceName) }
}

/**
 * Obtenir l'etat de tous les circuits (pour health check)
 */
export function getAllCircuitStates(): Array<CircuitBreakerState & { name: string }> {
  return Array.from(circuits.entries()).map(([name, state]) => ({
    name,
    ...state,
  }))
}

/**
 * Reset manuel d'un circuit (pour admin/debug)
 */
export function resetCircuit(serviceName: string): void {
  circuits.delete(serviceName)
}

// --- Retry with Exponential Backoff + Jitter ---

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  backoffFactor: 2,
  maxDelay: 30_000,
  jitter: true,
  isRetriable: (error: Error) => {
    // Ne pas retrier les erreurs 4xx (sauf 429)
    const message = error.message.toLowerCase()
    if (message.includes('400') || message.includes('401') || message.includes('403') || message.includes('404')) {
      return false
    }
    // Retrier 429 (rate limit), 5xx, timeout, network errors
    if (message.includes('429') || message.includes('500') || message.includes('502') ||
        message.includes('503') || message.includes('504') || message.includes('timeout') ||
        message.includes('econnrefused') || message.includes('econnreset') ||
        message.includes('network')) {
      return true
    }
    return true // par defaut, retrier
  },
}

/**
 * Retry avec backoff exponentiel et jitter decorrelé
 *
 * Usage:
 * ```ts
 * const result = await retryWithBackoff(
 *   () => stripe.charges.create(params),
 *   { maxAttempts: 3, baseDelay: 1000 }
 * )
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Derniere tentative ou erreur non retriable
      if (attempt === opts.maxAttempts || !opts.isRetriable?.(lastError)) {
        throw lastError
      }

      // Calculer le delai avec backoff exponentiel
      let delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      )

      // Ajouter du jitter decorrelé (evite thundering herd)
      if (opts.jitter) {
        delay = Math.random() * delay
      }

      console.warn(
        `[Retry] Attempt ${attempt}/${opts.maxAttempts} failed for: ${lastError.message}. ` +
        `Retrying in ${Math.round(delay)}ms...`
      )

      await sleep(delay)
    }
  }

  throw lastError!
}

/**
 * Combine Circuit Breaker + Retry
 * Le retry se fait A L'INTERIEUR du circuit breaker
 */
export async function resilientCall<T>(
  serviceName: string,
  fn: () => Promise<T>,
  options: {
    circuit?: Partial<CircuitBreakerOptions>
    retry?: Partial<RetryOptions>
  } = {}
): Promise<T> {
  return circuitBreaker(
    serviceName,
    () => retryWithBackoff(fn, options.retry),
    options.circuit
  )
}

// --- Helpers ---

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// --- Pre-configured resilient wrappers for CRM services ---

/**
 * Appel resilient a Stripe (circuit breaker + retry)
 */
export function stripeCall<T>(fn: () => Promise<T>): Promise<T> {
  return resilientCall('stripe', fn, {
    circuit: {
      failureThreshold: 5,
      resetTimeout: 60_000,
      onOpen: (name) => {
        console.error(`[ALERT] ${name} circuit OPEN — queuing payments`)
      },
    },
    retry: {
      maxAttempts: 3,
      baseDelay: 2000,
      isRetriable: (error) => {
        const msg = error.message.toLowerCase()
        // Stripe rate limit ou erreur serveur
        return msg.includes('429') || msg.includes('500') || msg.includes('502') ||
               msg.includes('503') || msg.includes('timeout') || msg.includes('lock_timeout')
      },
    },
  })
}

/**
 * Appel resilient a Resend (circuit breaker + retry)
 */
export function resendCall<T>(fn: () => Promise<T>): Promise<T> {
  return resilientCall('resend', fn, {
    circuit: {
      failureThreshold: 3,
      resetTimeout: 45_000,
    },
    retry: {
      maxAttempts: 2,
      baseDelay: 1500,
    },
  })
}

/**
 * Appel resilient a Supabase (retry seulement, pas de circuit breaker)
 * Supabase est le service principal, on ne veut pas l'open-circuiter
 */
export function supabaseCall<T>(fn: () => Promise<T>): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
  })
}
