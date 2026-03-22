import { NextRequest, NextResponse } from 'next/server'
import { listBookings, createBooking, isCalComConfigured } from '@/lib/calcom'

export const dynamic = 'force-dynamic'

/** GET — Lister les réservations Cal.com */
export async function GET(req: NextRequest) {
  if (!isCalComConfigured()) {
    return NextResponse.json({ error: 'Cal.com non configuré' }, { status: 503 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as any

    const bookings = await listBookings({ status: status || 'upcoming' })
    return NextResponse.json({ bookings })
  } catch (err: any) {
    console.error('[Cal.com] Erreur:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** POST — Créer une réservation Cal.com */
export async function POST(req: NextRequest) {
  if (!isCalComConfigured()) {
    return NextResponse.json({ error: 'Cal.com non configuré' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { eventTypeId, start, attendee, metadata } = body

    if (!eventTypeId || !start || !attendee?.email || !attendee?.name) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const booking = await createBooking({
      eventTypeId,
      start,
      attendee,
      metadata,
    })

    if (!booking) {
      return NextResponse.json({ error: 'Échec de la réservation' }, { status: 500 })
    }

    return NextResponse.json({ booking })
  } catch (err: any) {
    console.error('[Cal.com] Erreur:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
