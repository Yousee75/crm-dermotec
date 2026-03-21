import { describe, it, expect } from 'vitest'
import { isDisposableEmail, DISPOSABLE_DOMAINS } from '@/lib/disposable-emails'

describe('isDisposableEmail', () => {
  it('bloque mailinator.com', () => {
    expect(isDisposableEmail('test@mailinator.com')).toBe(true)
  })

  it('bloque yopmail.com', () => {
    expect(isDisposableEmail('fake@yopmail.com')).toBe(true)
  })

  it('bloque guerrillamail.com', () => {
    expect(isDisposableEmail('spam@guerrillamail.com')).toBe(true)
  })

  it('bloque tempmail.com', () => {
    expect(isDisposableEmail('temp@tempmail.com')).toBe(true)
  })

  it('bloque throwaway.email', () => {
    expect(isDisposableEmail('x@throwaway.email')).toBe(true)
  })

  it('bloque jetable.org', () => {
    expect(isDisposableEmail('x@jetable.org')).toBe(true)
  })

  it('accepte gmail.com', () => {
    expect(isDisposableEmail('marie@gmail.com')).toBe(false)
  })

  it('accepte outlook.com', () => {
    expect(isDisposableEmail('pro@outlook.com')).toBe(false)
  })

  it('accepte orange.fr', () => {
    expect(isDisposableEmail('contact@orange.fr')).toBe(false)
  })

  it('accepte un domaine entreprise', () => {
    expect(isDisposableEmail('marie@institut-beaute.fr')).toBe(false)
  })

  it('accepte dermotec.fr', () => {
    expect(isDisposableEmail('contact@dermotec.fr')).toBe(false)
  })

  it('est insensible à la casse', () => {
    expect(isDisposableEmail('Test@MAILINATOR.COM')).toBe(true)
  })
})

describe('DISPOSABLE_DOMAINS', () => {
  it('contient au moins 80 domaines', () => {
    expect(DISPOSABLE_DOMAINS.size).toBeGreaterThanOrEqual(80)
  })
})
