// ============================================================
// CAL.COM — Prise de RDV (remplace Calendly ~12€/mois)
// https://cal.com/docs/api-reference/v2
// ============================================================

const CALCOM_API_URL = process.env.CALCOM_API_URL || 'https://api.cal.com/v2'
const CALCOM_API_KEY = process.env.CALCOM_API_KEY

// Lazy init — silent skip si non configuré
function getHeaders() {
  if (!CALCOM_API_KEY) return null
  return {
    Authorization: `Bearer ${CALCOM_API_KEY}`,
    'Content-Type': 'application/json',
    'cal-api-version': '2024-08-13',
  }
}

// ── Types ──────────────────────────────────────────────────

export interface CalComEventType {
  id: number
  slug: string
  title: string
  description: string | null
  length: number // durée en minutes
  locations: CalComLocation[]
  bookingFields: unknown[]
}

export interface CalComLocation {
  type: string
  address?: string
  link?: string
}

export interface CalComBooking {
  id: number
  uid: string
  title: string
  status: 'accepted' | 'pending' | 'cancelled' | 'rejected'
  start: string // ISO 8601
  end: string
  attendees: CalComAttendee[]
  location: string | null
  meetingUrl: string | null
  cancelUrl: string | null
  rescheduleUrl: string | null
}

export interface CalComAttendee {
  email: string
  name: string
  timeZone: string
  language: string
}

export interface CalComAvailability {
  busy: { start: string; end: string }[]
  timeZone: string
  dateRanges: { start: string; end: string }[]
}

export interface CreateBookingParams {
  eventTypeId: number
  start: string // ISO 8601
  attendee: {
    name: string
    email: string
    timeZone?: string
    language?: string
  }
  metadata?: Record<string, string>
  guests?: string[]
}

// ── API Client ─────────────────────────────────────────────

async function calcomFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  const headers = getHeaders()
  if (!headers) {
    console.log('[Cal.com] API key non configurée — skip')
    return null
  }

  const res = await fetch(`${CALCOM_API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  })

  if (!res.ok) {
    console.error(`[Cal.com] Erreur ${res.status}: ${await res.text()}`)
    return null
  }

  const json = await res.json()
  return json.data ?? json
}

// ── Event Types ────────────────────────────────────────────

/** Lister les types d'événements (types de RDV) */
export async function listEventTypes(): Promise<CalComEventType[]> {
  const result = await calcomFetch<CalComEventType[]>('/event-types')
  return result ?? []
}

/** Récupérer un type d'événement */
export async function getEventType(id: number): Promise<CalComEventType | null> {
  return calcomFetch<CalComEventType>(`/event-types/${id}`)
}

// ── Bookings ───────────────────────────────────────────────

/** Créer une réservation */
export async function createBooking(params: CreateBookingParams): Promise<CalComBooking | null> {
  return calcomFetch<CalComBooking>('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      eventTypeId: params.eventTypeId,
      start: params.start,
      attendee: {
        name: params.attendee.name,
        email: params.attendee.email,
        timeZone: params.attendee.timeZone || 'Europe/Paris',
        language: params.attendee.language || 'fr',
      },
      metadata: params.metadata,
      guests: params.guests,
    }),
  })
}

/** Récupérer une réservation */
export async function getBooking(uid: string): Promise<CalComBooking | null> {
  return calcomFetch<CalComBooking>(`/bookings/${uid}`)
}

/** Lister les réservations */
export async function listBookings(params?: {
  status?: 'upcoming' | 'recurring' | 'past' | 'cancelled' | 'unconfirmed'
  afterStart?: string
  beforeEnd?: string
}): Promise<CalComBooking[]> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.afterStart) searchParams.set('afterStart', params.afterStart)
  if (params?.beforeEnd) searchParams.set('beforeEnd', params.beforeEnd)

  const query = searchParams.toString()
  const result = await calcomFetch<CalComBooking[]>(`/bookings${query ? `?${query}` : ''}`)
  return result ?? []
}

/** Annuler une réservation */
export async function cancelBooking(uid: string, reason?: string): Promise<boolean> {
  const result = await calcomFetch<unknown>(`/bookings/${uid}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancellationReason: reason }),
  })
  return result !== null
}

// ── Disponibilités ─────────────────────────────────────────

/** Vérifier les disponibilités */
export async function getAvailability(params: {
  eventTypeId: number
  startTime: string
  endTime: string
}): Promise<CalComAvailability | null> {
  const searchParams = new URLSearchParams({
    eventTypeId: String(params.eventTypeId),
    startTime: params.startTime,
    endTime: params.endTime,
  })
  return calcomFetch<CalComAvailability>(`/slots/available?${searchParams}`)
}

// ── Helpers métier CRM ─────────────────────────────────────

/** Générer le lien d'embed Cal.com pour un type de RDV */
export function getCalEmbedUrl(username: string, eventSlug: string): string {
  return `https://cal.com/${username}/${eventSlug}`
}

/** Créer un RDV découverte pour un lead */
export async function creerRdvDecouverte(params: {
  eventTypeId: number
  lead: { email: string; prenom: string; nom: string; telephone?: string }
  dateHeure: string // ISO 8601
  formation?: string
}): Promise<CalComBooking | null> {
  return createBooking({
    eventTypeId: params.eventTypeId,
    start: params.dateHeure,
    attendee: {
      name: `${params.lead.prenom} ${params.lead.nom}`,
      email: params.lead.email,
      timeZone: 'Europe/Paris',
      language: 'fr',
    },
    metadata: {
      source: 'crm-dermotec',
      ...(params.lead.telephone && { telephone: params.lead.telephone }),
      ...(params.formation && { formation: params.formation }),
    },
  })
}

/** Vérifier si Cal.com est configuré */
export function isCalComConfigured(): boolean {
  return !!CALCOM_API_KEY
}
