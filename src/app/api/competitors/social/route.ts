import { NextRequest, NextResponse } from 'next/server'
import { discoverSocialProfiles, scrapeInstagram } from '@/lib/social-discovery'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { websiteUrl, nom, ville } = body

    if (!websiteUrl && !nom) {
      return NextResponse.json({ error: 'URL site web ou nom requis' }, { status: 400 })
    }

    // Phase 1 : Découvrir les profils sociaux
    let profiles = {}
    if (websiteUrl) {
      profiles = await discoverSocialProfiles(websiteUrl)
    }

    // Phase 2 : Scraper Instagram si trouvé
    const social: Record<string, unknown> = { profiles }

    const igUsername = (profiles as { instagram?: string }).instagram
    if (igUsername) {
      const igData = await scrapeInstagram(igUsername)
      if (igData) social.instagram = igData
    }

    return NextResponse.json({
      profiles,
      social,
      scrapedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Social API] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
