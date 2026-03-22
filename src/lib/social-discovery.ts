// ============================================================
// CRM DERMOTEC — Social Discovery
// Trouver les profils sociaux d'un concurrent
// Scrape site web footer → liens Instagram/Facebook/TikTok/LinkedIn
// ============================================================

export interface SocialProfiles {
  instagram?: string  // username
  facebook?: string   // page URL
  tiktok?: string     // username
  linkedin?: string   // company slug
  youtube?: string    // channel URL
  website?: string    // site officiel
}

export interface SocialMetrics {
  instagram?: {
    username: string
    followers?: number
    following?: number
    posts?: number
    bio?: string
    isVerified?: boolean
    profilePic?: string
  }
  facebook?: {
    pageUrl: string
    likes?: number
    followers?: number
    category?: string
  }
  tiktok?: {
    username: string
    followers?: number
    likes?: number
    videos?: number
    bio?: string
  }
}

const SOCIAL_PATTERNS = {
  instagram: [
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{1,30})\/?/gi,
    /(?:https?:\/\/)?(?:www\.)?instagr\.am\/([a-zA-Z0-9._]{1,30})\/?/gi,
  ],
  facebook: [
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9._-]{1,50})\/?/gi,
    /(?:https?:\/\/)?(?:www\.)?fb\.com\/([a-zA-Z0-9._-]{1,50})\/?/gi,
  ],
  tiktok: [
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._]{1,30})\/?/gi,
  ],
  linkedin: [
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/([a-zA-Z0-9_-]{1,50})\/?/gi,
  ],
  youtube: [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel|c|@)\/([a-zA-Z0-9_-]{1,50})\/?/gi,
  ],
}

// Mots à exclure (liens de partage, CMS par défaut, pas des profils)
const EXCLUDED_USERNAMES = new Set([
  'share', 'sharer', 'intent', 'hashtag', 'explore', 'p', 'reel',
  'stories', 'tv', 'login', 'signup', 'help', 'about', 'privacy',
  'terms', 'settings', 'pages', 'groups', 'events', 'marketplace',
  // CMS defaults (faux positifs)
  'wix', 'wixstudio', 'wixcom', 'squarespace', 'wordpress', 'shopify',
  'weebly', 'godaddy', 'jimdo', 'webflow', 'hubspot', 'mailchimp',
  'google', 'youtube', 'twitter', 'x', 'pinterest',
  // Platforms
  'treatwell', 'planity', 'doctolib', 'pagesjaunes', 'tripadvisor',
  'yelp', 'fresha', 'booksy',
])

/** Extraire les liens sociaux d'un HTML (footer/header d'un site web) */
export function extractSocialLinks(html: string): SocialProfiles {
  const profiles: SocialProfiles = {}

  for (const [platform, patterns] of Object.entries(SOCIAL_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = html.matchAll(new RegExp(pattern))
      for (const match of matches) {
        const username = match[1]?.toLowerCase()
        if (username && !EXCLUDED_USERNAMES.has(username) && username.length > 1) {
          if (platform === 'facebook' || platform === 'linkedin' || platform === 'youtube') {
            (profiles as Record<string, string>)[platform] = match[0]
          } else {
            (profiles as Record<string, string>)[platform] = username
          }
          break // Premier match suffit
        }
      }
    }
  }

  return profiles
}

/** Scraper un site web pour trouver les liens sociaux — avec fallback Bright Data */
export async function discoverSocialProfiles(
  websiteUrl: string,
  businessName?: string
): Promise<SocialProfiles> {
  const bdKey = process.env.BRIGHTDATA_API_KEY

  // Skip les widgets Treatwell/Planity (pas de réseaux sociaux dedans)
  const isWidget = /widget\.treatwell|planity\.com|doctolib\.fr/i.test(websiteUrl)

  let html = ''

  try {
    if (!isWidget) {
      // Essai 1 : Fetch direct (gratuit, 15s timeout)
      try {
        const res = await fetch(websiteUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'fr-FR,fr;q=0.9',
          },
          signal: AbortSignal.timeout(15000),
          redirect: 'follow',
        })
        if (res.ok) html = await res.text()
      } catch {
        console.log(`[SocialDiscovery] Fetch direct timeout pour ${websiteUrl.slice(0, 50)}, fallback Bright Data`)
      }
    }

    // Essai 2 : Bright Data Web Unlocker (si fetch direct échoue ou pas assez de contenu)
    if ((!html || html.length < 2000) && bdKey) {
      try {
        const zone = process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE || 'web_unlocker1'
        const targetUrl = isWidget ? `https://www.google.com/search?q=${encodeURIComponent(businessName || '')}+instagram+facebook` : websiteUrl
        const res = await fetch('https://api.brightdata.com/request', {
          method: 'POST',
          headers: { Authorization: `Bearer ${bdKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ zone, url: targetUrl, format: 'raw', country: 'fr' }),
          signal: AbortSignal.timeout(30000),
        })
        if (res.ok) {
          const bdHtml = await res.text()
          if (bdHtml.length > html.length) html = bdHtml
        }
      } catch {
        console.warn('[SocialDiscovery] Bright Data fallback failed')
      }
    }

    // Essai 3 : Bright Data Scraping Browser (si SPA/JS, pas assez de liens trouvés)
    if (html.length > 0 && html.length < 5000 && bdKey && !isWidget) {
      try {
        const zone = process.env.BRIGHTDATA_SCRAPING_BROWSER_ZONE || 'scraping_browser1'
        const res = await fetch('https://api.brightdata.com/request', {
          method: 'POST',
          headers: { Authorization: `Bearer ${bdKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ zone, url: websiteUrl, format: 'raw', country: 'fr', browser: true }),
          signal: AbortSignal.timeout(60000),
        })
        if (res.ok) {
          const browserHtml = await res.text()
          if (browserHtml.length > html.length) html = browserHtml
        }
      } catch {
        console.warn('[SocialDiscovery] Scraping Browser fallback failed')
      }
    }

    if (!html || html.length < 500) return {}

    const profiles = extractSocialLinks(html)

    // Extraire le site web canonique
    const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)
    if (canonicalMatch) profiles.website = canonicalMatch[1]

    console.log(`[SocialDiscovery] ${websiteUrl.slice(0, 50)} (${html.length} chars) → IG:${profiles.instagram || 'N/A'} FB:${profiles.facebook ? 'oui' : 'N/A'} TT:${profiles.tiktok || 'N/A'}`)

    return profiles
  } catch (err) {
    console.warn('[SocialDiscovery] Error:', err)
    return {}
  }
}

/** Scraper Instagram pour les métriques publiques */
export async function scrapeInstagram(username: string): Promise<SocialMetrics['instagram'] | null> {
  const bdKey = process.env.BRIGHTDATA_API_KEY
  if (!bdKey || !username) return null

  try {
    const url = `https://www.instagram.com/${username}/`
    const res = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bdKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zone: process.env.BRIGHTDATA_SCRAPING_BROWSER_ZONE || 'scraping_browser1',
        url,
        format: 'raw',
        country: 'fr',
        browser: true,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) return null
    const html = await res.text()

    if (html.length < 5000) return null

    // Extraire métriques depuis meta tags et HTML
    const result: SocialMetrics['instagram'] = { username }

    // Meta description : "X Followers, Y Following, Z Posts"
    const metaDesc = html.match(/content="([\d,.KMkm]+)\s*Followers?,\s*([\d,.KMkm]+)\s*Following,\s*([\d,.KMkm]+)\s*Posts?/i)
      || html.match(/"edge_followed_by":\{"count":(\d+)\}.*?"edge_follow":\{"count":(\d+)\}.*?"edge_owner_to_timeline_media":\{"count":(\d+)\}/s)

    if (metaDesc) {
      result.followers = parseCount(metaDesc[1])
      result.following = parseCount(metaDesc[2])
      result.posts = parseCount(metaDesc[3])
    }

    // Fallback : chercher dans le JSON intégré
    const followersMatch = html.match(/"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)/)
      || html.match(/"follower_count"\s*:\s*(\d+)/)
      || html.match(/(\d[\d,.]*[KMkm]?)\s*(?:followers?|abonnés)/i)
    if (followersMatch && !result.followers) {
      result.followers = parseCount(followersMatch[1])
    }

    const postsMatch = html.match(/"edge_owner_to_timeline_media"\s*:\s*\{\s*"count"\s*:\s*(\d+)/)
      || html.match(/"media_count"\s*:\s*(\d+)/)
      || html.match(/(\d[\d,.]*)\s*(?:posts?|publications?)/i)
    if (postsMatch && !result.posts) {
      result.posts = parseCount(postsMatch[1])
    }

    // Bio
    const bioMatch = html.match(/"biography"\s*:\s*"([^"]{1,300})"/)
      || html.match(/meta\s+property="og:description"\s+content="([^"]{1,300})"/)
    if (bioMatch) result.bio = bioMatch[1].replace(/\\n/g, '\n').replace(/\\u[\dA-Fa-f]{4}/g, '')

    // Verified
    result.isVerified = html.includes('"is_verified":true') || html.includes('verified_badge')

    // Profile pic
    const picMatch = html.match(/"profile_pic_url_hd"\s*:\s*"([^"]+)"/)
      || html.match(/"profile_pic_url"\s*:\s*"([^"]+)"/)
    if (picMatch) result.profilePic = picMatch[1].replace(/\\u0026/g, '&')

    console.log(`[Instagram] @${username}: ${result.followers || '?'} followers, ${result.posts || '?'} posts`)

    return result
  } catch (err) {
    console.warn(`[Instagram] Error scraping @${username}:`, err)
    return null
  }
}

/** Parser les nombres style "12.5K", "1.2M", "3,456" */
function parseCount(str: string): number {
  if (!str) return 0
  const cleaned = str.replace(/,/g, '.').replace(/\s/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return 0

  if (/[kK]$/i.test(cleaned)) return Math.round(num * 1000)
  if (/[mM]$/i.test(cleaned)) return Math.round(num * 1000000)
  return Math.round(num)
}
