import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://crm-dermotec.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/formations',
          '/formations/*',
          '/pricing',
          '/aide',
          '/conditions-generales',
          '/mentions-legales',
          '/politique-confidentialite',
        ],
        disallow: [
          '/login',
          '/auth/*',
          '/dashboard/*',
          '/leads/*',
          '/pipeline/*',
          '/sessions/*',
          '/api/*',
          '/portail/*',
          '/emargement/*',
          '/nps/*',
          '/questionnaire/*',
          '/join/*',
          '/inscription/*',
          '/onboarding/*',
          '/settings/*',
          '/parametres/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
