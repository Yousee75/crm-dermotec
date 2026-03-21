// ============================================================
// Value Objects — Immutable, validated, self-describing types
// Inspired by Stripe's internal type system.
// Value objects validate on construction → invalid state is impossible.
// ============================================================

import { isDisposableEmail } from '@/lib/disposable-emails'

// --- Email ---

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Email | null {
    const normalized = raw.toLowerCase().trim()
    if (!normalized) return null
    if (normalized.length > 254) return null
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null
    if (isDisposableEmail(normalized)) return null
    return new Email(normalized)
  }

  /** Unsafe: skip validation, use only when reading from DB */
  static fromTrusted(value: string): Email {
    return new Email(value)
  }

  get domain(): string {
    return this.value.split('@')[1]
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

// --- Phone (FR) ---

export class PhoneFR {
  private constructor(
    public readonly value: string,
    public readonly international: string
  ) {}

  static create(raw: string): PhoneFR | null {
    const cleaned = raw.replace(/[\s.\-()]/g, '')
    if (/^0[1-9]\d{8}$/.test(cleaned)) {
      return new PhoneFR(cleaned, `+33${cleaned.slice(1)}`)
    }
    if (/^\+33[1-9]\d{8}$/.test(cleaned)) {
      return new PhoneFR(`0${cleaned.slice(3)}`, cleaned)
    }
    return null
  }

  static fromTrusted(value: string): PhoneFR {
    const intl = value.startsWith('+') ? value : `+33${value.slice(1)}`
    const local = value.startsWith('0') ? value : `0${value.slice(3)}`
    return new PhoneFR(local, intl)
  }

  get whatsappUrl(): string {
    return `https://wa.me/${this.international.replace('+', '')}`
  }

  equals(other: PhoneFR): boolean {
    return this.international === other.international
  }

  toString(): string {
    return this.value
  }
}

// --- Money ---

export class Money {
  private constructor(
    public readonly cents: number,
    public readonly currency: 'EUR' = 'EUR'
  ) {}

  static fromEuros(euros: number): Money {
    return new Money(Math.round(euros * 100))
  }

  static fromCents(cents: number): Money {
    return new Money(cents)
  }

  static zero(): Money {
    return new Money(0)
  }

  get euros(): number {
    return this.cents / 100
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents)
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents)
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.cents * factor))
  }

  isPositive(): boolean {
    return this.cents > 0
  }

  isZero(): boolean {
    return this.cents === 0
  }

  /** For Stripe API (amount in cents) */
  toStripeAmount(): number {
    return this.cents
  }

  /** Formatted string: "1 234,56 EUR" */
  format(): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(this.euros)
  }

  equals(other: Money): boolean {
    return this.cents === other.cents
  }

  toString(): string {
    return `${this.euros.toFixed(2)}€`
  }
}

// --- SIRET ---

export class SIRET {
  private constructor(public readonly value: string) {}

  static create(raw: string): SIRET | null {
    const cleaned = raw.replace(/\s/g, '')
    if (!/^\d{14}$/.test(cleaned)) return null

    // Luhn checksum
    let sum = 0
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(cleaned[i])
      if (i % 2 === 1) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
    }
    if (sum % 10 !== 0) return null

    return new SIRET(cleaned)
  }

  static fromTrusted(value: string): SIRET {
    return new SIRET(value.replace(/\s/g, ''))
  }

  get siren(): string {
    return this.value.slice(0, 9)
  }

  get nic(): string {
    return this.value.slice(9)
  }

  /** Formatted: "123 456 789 00012" */
  format(): string {
    return `${this.value.slice(0, 3)} ${this.value.slice(3, 6)} ${this.value.slice(6, 9)} ${this.value.slice(9)}`
  }

  equals(other: SIRET): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

// --- DateRange (for sessions) ---

export class DateRange {
  private constructor(
    public readonly start: Date,
    public readonly end: Date
  ) {}

  static create(start: Date | string, end: Date | string): DateRange | null {
    const s = typeof start === 'string' ? new Date(start) : start
    const e = typeof end === 'string' ? new Date(end) : end
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null
    if (e < s) return null
    return new DateRange(s, e)
  }

  get durationDays(): number {
    return Math.ceil((this.end.getTime() - this.start.getTime()) / 86_400_000) + 1
  }

  get durationHours(): number {
    return this.durationDays * 7 // 7h par jour standard
  }

  contains(date: Date): boolean {
    return date >= this.start && date <= this.end
  }

  isInFuture(): boolean {
    return this.start > new Date()
  }

  startsToday(): boolean {
    const today = new Date().toISOString().split('T')[0]
    return this.start.toISOString().split('T')[0] === today
  }

  endedYesterday(): boolean {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return this.end.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]
  }

  overlaps(other: DateRange): boolean {
    return this.start <= other.end && this.end >= other.start
  }

  formatFR(): string {
    const fmt = (d: Date) =>
      d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    return `${fmt(this.start)} — ${fmt(this.end)}`
  }
}

// --- Pagination ---

export class Pagination {
  public readonly offset: number

  private constructor(
    public readonly page: number,
    public readonly limit: number
  ) {
    this.offset = (page - 1) * limit
  }

  static create(page: number = 1, limit: number = 20): Pagination {
    const safePage = Math.max(1, Math.floor(page))
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)))
    return new Pagination(safePage, safeLimit)
  }

  get range(): [number, number] {
    return [this.offset, this.offset + this.limit - 1]
  }

  totalPages(totalCount: number): number {
    return Math.ceil(totalCount / this.limit)
  }
}

// --- OrgId (multi-tenant) ---

export class OrgId {
  private constructor(public readonly value: string) {}

  static create(raw: string): OrgId | null {
    if (!raw || typeof raw !== 'string') return null
    // UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
      return null
    }
    return new OrgId(raw)
  }

  static fromTrusted(value: string): OrgId {
    return new OrgId(value)
  }

  equals(other: OrgId): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
