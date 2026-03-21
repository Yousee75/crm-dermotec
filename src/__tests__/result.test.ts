// ============================================================
// Tests — Result Type + Error Hierarchy
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  Ok, Err, isOk, isErr, unwrap, unwrapOr, map, mapErr, andThen, all, tryCatch,
  ValidationError, NotFoundError, ConflictError, InvalidTransitionError,
  DuplicateError, InternalError, ServiceUnavailableError,
} from '@/lib/result'

describe('Result type', () => {
  it('Ok wraps a value', () => {
    const result = Ok(42)
    expect(result.ok).toBe(true)
    expect(isOk(result)).toBe(true)
    if (result.ok) expect(result.value).toBe(42)
  })

  it('Err wraps an error', () => {
    const result = Err(new ValidationError('bad input'))
    expect(result.ok).toBe(false)
    expect(isErr(result)).toBe(true)
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  it('unwrap extracts Ok value', () => {
    expect(unwrap(Ok('hello'))).toBe('hello')
  })

  it('unwrap throws on Err', () => {
    expect(() => unwrap(Err(new NotFoundError('nope')))).toThrow()
  })

  it('unwrapOr returns fallback on Err', () => {
    expect(unwrapOr(Err(new InternalError('err')), 'default')).toBe('default')
    expect(unwrapOr(Ok('value'), 'default')).toBe('value')
  })

  it('map transforms Ok value', () => {
    const result = map(Ok(10), (x) => x * 2)
    expect(isOk(result) && result.value).toBe(20)
  })

  it('map passes through Err', () => {
    const err = Err(new ValidationError('bad'))
    const result = map(err, () => 'never')
    expect(isErr(result)).toBe(true)
  })

  it('mapErr transforms error', () => {
    const result = mapErr(
      Err(new ValidationError('original')),
      () => new InternalError('wrapped')
    )
    if (!result.ok) expect(result.error.code).toBe('INTERNAL_ERROR')
  })

  it('andThen chains operations', () => {
    const double = (x: number) => Ok(x * 2)
    const result = andThen(Ok(5), double)
    expect(isOk(result) && result.value).toBe(10)
  })

  it('andThen short-circuits on Err', () => {
    const err = Err(new ValidationError('stop'))
    const result = andThen(err, () => Ok('never'))
    expect(isErr(result)).toBe(true)
  })

  it('all combines multiple Ok results', () => {
    const result = all([Ok(1), Ok('two'), Ok(true)] as const)
    if (result.ok) {
      expect(result.value).toEqual([1, 'two', true])
    }
  })

  it('all fails on first Err', () => {
    const result = all([Ok(1), Err(new ValidationError('fail')), Ok(3)])
    expect(isErr(result)).toBe(true)
  })
})

describe('tryCatch', () => {
  it('wraps successful async in Ok', async () => {
    const result = await tryCatch(async () => 42)
    expect(isOk(result)).toBe(true)
    if (result.ok) expect(result.value).toBe(42)
  })

  it('wraps thrown error in Err', async () => {
    const result = await tryCatch(async () => {
      throw new Error('boom')
    })
    expect(isErr(result)).toBe(true)
  })

  it('uses custom error mapper', async () => {
    const result = await tryCatch(
      async () => { throw new Error('boom') },
      () => new ServiceUnavailableError('stripe')
    )
    if (!result.ok) expect(result.error.code).toBe('SERVICE_UNAVAILABLE')
  })
})

describe('Error hierarchy', () => {
  it('ValidationError has correct code and status', () => {
    const err = new ValidationError('bad input', { details: { field: 'email' } })
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.httpStatus).toBe(400)
    expect(err.details).toEqual({ field: 'email' })
  })

  it('NotFoundError has 404 status', () => {
    const err = new NotFoundError('Lead not found')
    expect(err.httpStatus).toBe(404)
  })

  it('InvalidTransitionError formats correctly', () => {
    const err = new InvalidTransitionError('Lead', 'NOUVEAU', 'INSCRIT')
    expect(err.code).toBe('INVALID_TRANSITION')
    expect(err.httpStatus).toBe(422)
    expect(err.details).toEqual({ entity: 'Lead', from: 'NOUVEAU', to: 'INSCRIT' })
  })

  it('DuplicateError formats correctly', () => {
    const err = new DuplicateError('Lead', 'email', 'test@test.com')
    expect(err.code).toBe('DUPLICATE')
    expect(err.httpStatus).toBe(409)
  })

  it('toJSON produces clean API response', () => {
    const err = new ConflictError('Already exists')
    const json = err.toJSON()
    expect(json.error.code).toBe('CONFLICT')
    expect(json.error.message).toBe('Already exists')
    expect(json.error.timestamp).toBeTruthy()
  })

  it('ServiceUnavailableError includes service name', () => {
    const err = new ServiceUnavailableError('resend')
    expect(err.httpStatus).toBe(503)
    expect(err.details).toEqual({ service: 'resend' })
  })
})
