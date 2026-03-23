import { NextRequest, NextResponse } from 'next/server'
import { fetchNeighborhoodData } from '@/lib/neighborhood-data'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error
    const lat = parseFloat(request.nextUrl.searchParams.get('lat') || '0')
    const lng = parseFloat(request.nextUrl.searchParams.get('lng') || '0')
    const radius = parseInt(request.nextUrl.searchParams.get('radius') || '500')

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat et lng requis' }, { status: 400 })
    }

    const data = await fetchNeighborhoodData(lat, lng, radius)

    return NextResponse.json(data)
  } catch (err) {
    console.error('[Neighborhood API] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
