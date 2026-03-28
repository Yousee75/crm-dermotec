import { NextRequest, NextResponse } from 'next/server'
import { scrapeCompetitorFull } from '@/lib/competitor-scraper'
import { requireAuth } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error
    const body = await request.json()
    const { nom, ville, pagesJaunesUrl, planityUrl, treatwellUrl } = body

    if (!nom) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    const result = await scrapeCompetitorFull({
      nom,
      ville: ville || '',
      pagesJaunesUrl,
      planityUrl,
      treatwellUrl,
    })

    // Compter les sources trouvées
    const sourcesFound = [
      result.pagesJaunes?.rating ? 'PagesJaunes' : null,
      result.planity?.found ? 'Planity' : null,
      result.treatwell?.found ? 'Treatwell' : null,
    ].filter(Boolean)

    return NextResponse.json({
      ...result,
      meta: {
        sourcesFound,
        scrapedAt: new Date().toISOString(),
        nom,
        ville,
      },
    })
  } catch (err) {
    console.error('[API Scrape] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
