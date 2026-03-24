// ============================================================
// Inngest Function: Auto-enrichment Lead
// Enrichit automatiquement un lead avec des données externes
// Pappers (SIRET), Google Places, Social Media, etc.
// ============================================================

import { inngest } from '@/lib/inngest'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

interface LeadCreatedEvent {
  lead_id: string
  siret?: string
  nom?: string
  prenom?: string
  entreprise_nom?: string
  ville?: string
  email?: string
  source?: string
  trigger?: 'manual' | 'webhook' | 'client' // Pour identifier l'origine
}

async function logEnrichment(
  lead_id: string,
  provider: string,
  status: 'SUCCESS' | 'FAILED' | 'SKIP',
  credits_used: number = 0,
  data_found?: any,
  error_message?: string
) {
  const supabase = getSupabase()

  await supabase.from('auto_enrichment_log').insert({
    lead_id,
    provider,
    status,
    credits_used,
    data_found: data_found || null,
    error_message: error_message || null,
  })
}

export const autoEnrichLead = (inngest as any).createFunction(
  {
    id: 'auto-enrich-lead',
    name: 'Auto-enrich Lead',
    retries: 2
  },
  { event: 'crm/lead.created' },
  async ({ event, step }: { event: { data: LeadCreatedEvent }, step: any }) => {
    const { lead_id, siret, nom, prenom, entreprise_nom, ville, email, source, trigger } = event.data
    let enrichmentResults: {
      pappers: any | null;
      google: any | null;
      social: any | null;
      instagram: any | null;
      total_credits: number;
    } = {
      pappers: null,
      google: null,
      social: null,
      instagram: null,
      total_credits: 0
    }

    // ============================================
    // STEP 1: Enrichissement Pappers (SIRET)
    // ============================================
    if (siret && process.env.PAPPERS_API_KEY) {
      enrichmentResults.pappers = await step.run('enrich-pappers', async () => {
        try {
          const siren = siret.replace(/\D/g, '').substring(0, 9)
          const url = `https://api.pappers.fr/v2/entreprise?siren=${siren}&api_token=${process.env.PAPPERS_API_KEY}&champs_optionnels=finances,dirigeants,beneficiaires`

          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`Pappers API error: ${response.status}`)
          }

          const data = await response.json()

          if (data.erreur) {
            throw new Error(data.erreur)
          }

          // Extraire les données pertinentes
          const enrichmentData = {
            ca_derniere_annee: data.finance?.chiffre_affaires,
            resultat_net: data.finance?.resultat_net,
            dirigeants: data.dirigeants?.map((d: any) => ({
              nom: d.nom,
              prenom: d.prenom,
              fonction: d.qualite
            })),
            forme_juridique: data.forme_juridique,
            capital: data.capital,
            code_ape: data.code_ape,
            activite: data.libelle_ape,
            adresse: `${data.adresse}, ${data.code_postal} ${data.ville}`,
            date_creation: data.date_creation
          }

          // Mettre à jour le lead
          const supabase = getSupabase()
          await supabase
            .from('leads')
            .update({
              code_ape: enrichmentData.code_ape,
              metadata: {
                pappers_data: enrichmentData
              }
            })
            .eq('id', lead_id)

          await logEnrichment(lead_id, 'pappers', 'SUCCESS', 1, enrichmentData)
          enrichmentResults.total_credits += 1

          return enrichmentData
        } catch (error) {
          await logEnrichment(lead_id, 'pappers', 'FAILED', 1, null, error instanceof Error ? error.message : 'Unknown error')
          console.error('[AutoEnrich] Pappers failed:', error)
          return null
        }
      })
    } else {
      await logEnrichment(lead_id, 'pappers', 'SKIP', 0, null, 'No SIRET or API key')
    }

    // ============================================
    // STEP 2: Enrichissement Google Places
    // ============================================
    const searchTerm = entreprise_nom || nom || (prenom && nom ? `${prenom} ${nom}` : null)
    if ((searchTerm || siret) && ville && process.env.GOOGLE_PLACES_API_KEY) {
      enrichmentResults.google = await step.run('enrich-google', async () => {
        try {
          const query = searchTerm ? `${searchTerm} ${ville}` : `${siret} ${ville}`
          const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total,website,formatted_phone_number,formatted_address&key=${process.env.GOOGLE_PLACES_API_KEY}`

          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`Google Places API error: ${response.status}`)
          }

          const data = await response.json()

          if (data.status !== 'OK' || !data.candidates?.length) {
            throw new Error(`No results found: ${data.status}`)
          }

          const place = data.candidates[0]
          const googleData = {
            place_id: place.place_id,
            rating: place.rating,
            reviews_count: place.user_ratings_total,
            website: place.website,
            phone: place.formatted_phone_number,
            address: place.formatted_address
          }

          // Mettre à jour le lead
          const supabase = getSupabase()
          const existingMetadata = await supabase
            .from('leads')
            .select('metadata')
            .eq('id', lead_id)
            .single()

          await supabase
            .from('leads')
            .update({
              metadata: {
                ...existingMetadata.data?.metadata || {},
                google_places: googleData
              }
            })
            .eq('id', lead_id)

          await logEnrichment(lead_id, 'google_places', 'SUCCESS', 1, googleData)
          enrichmentResults.total_credits += 1

          return googleData
        } catch (error) {
          await logEnrichment(lead_id, 'google_places', 'FAILED', 1, null, error instanceof Error ? error.message : 'Unknown error')
          console.error('[AutoEnrich] Google Places failed:', error)
          return null
        }
      })
    } else {
      await logEnrichment(lead_id, 'google_places', 'SKIP', 0, null, 'Missing data or API key')
    }

    // ============================================
    // STEP 3: Enrichissement Social Media (website)
    // ============================================
    if (enrichmentResults.google?.website) {
      enrichmentResults.social = await step.run('enrich-social', async () => {
        try {
          const website = enrichmentResults.google.website

          const response = await fetch(website, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch website: ${response.status}`)
          }

          const html = await response.text()

          // Extraire les liens sociaux du footer/header
          const socialLinks: { [key: string]: string } = {}

          // Instagram
          const instagramMatch = html.match(/https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/i)
          if (instagramMatch) {
            socialLinks.instagram = instagramMatch[0]
          }

          // Facebook
          const facebookMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/([a-zA-Z0-9_.]+)/i)
          if (facebookMatch) {
            socialLinks.facebook = facebookMatch[0]
          }

          // TikTok
          const tiktokMatch = html.match(/https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)/i)
          if (tiktokMatch) {
            socialLinks.tiktok = tiktokMatch[0]
          }

          if (Object.keys(socialLinks).length > 0) {
            // Mettre à jour le lead
            const supabase = getSupabase()
            const existingMetadata = await supabase
              .from('leads')
              .select('metadata')
              .eq('id', lead_id)
              .single()

            await supabase
              .from('leads')
              .update({
                metadata: {
                  ...existingMetadata.data?.metadata || {},
                  social_links: socialLinks
                }
              })
              .eq('id', lead_id)

            await logEnrichment(lead_id, 'social_scraping', 'SUCCESS', 0, socialLinks)
            return socialLinks
          } else {
            await logEnrichment(lead_id, 'social_scraping', 'SKIP', 0, null, 'No social links found')
            return null
          }

        } catch (error) {
          await logEnrichment(lead_id, 'social_scraping', 'FAILED', 0, null, error instanceof Error ? error.message : 'Unknown error')
          console.error('[AutoEnrich] Social scraping failed:', error)
          return null
        }
      })
    } else {
      await logEnrichment(lead_id, 'social_scraping', 'SKIP', 0, null, 'No website found')
    }

    // ============================================
    // STEP 4: Enrichissement Instagram (si trouvé)
    // ============================================
    if (enrichmentResults.social?.instagram && process.env.BRIGHTDATA_API_KEY) {
      enrichmentResults.instagram = await step.run('enrich-instagram', async () => {
        try {
          const username = enrichmentResults.social.instagram.split('/').pop()?.replace('@', '')
          if (!username) {
            throw new Error('Invalid Instagram URL')
          }

          // Utiliser scrapeInstagram de social-discovery (Bright Data Scraping Browser)
          const { scrapeInstagram } = await import('@/lib/social-discovery')
          const metrics = await scrapeInstagram(username)

          if (!metrics) {
            throw new Error('Instagram scraping returned no data')
          }

          const instagramData = {
            username,
            url: `https://www.instagram.com/${username}/`,
            followers: metrics.followers || null,
            following: metrics.following || null,
            posts: metrics.posts || null,
            bio: metrics.bio || null,
            isVerified: metrics.isVerified || false,
            profilePic: metrics.profilePic || null,
            scraped_at: new Date().toISOString()
          }

          // Mettre à jour le lead
          const supabase = getSupabase()
          const existingMetadata = await supabase
            .from('leads')
            .select('metadata')
            .eq('id', lead_id)
            .single()

          await supabase
            .from('leads')
            .update({
              metadata: {
                ...existingMetadata.data?.metadata || {},
                instagram_data: instagramData
              }
            })
            .eq('id', lead_id)

          await logEnrichment(lead_id, 'instagram_scraping', 'SUCCESS', 1, instagramData)
          enrichmentResults.total_credits += 1

          return instagramData
        } catch (error) {
          await logEnrichment(lead_id, 'instagram_scraping', 'FAILED', 1, null, error instanceof Error ? error.message : 'Unknown error')
          console.error('[AutoEnrich] Instagram scraping failed:', error)
          return null
        }
      })
    } else {
      await logEnrichment(lead_id, 'instagram_scraping', 'SKIP', 0, null, 'No Instagram link or API key')
    }

    // ============================================
    // STEP 5: Calcul du score IA (/100)
    // ============================================
    const scoreResult = await step.run('calculate-ai-score', async () => {
      try {
        const { scoreLead } = await import('@/lib/ai-scoring')

        // Récupérer le lead mis à jour avec toutes les données enrichies
        const supabase = getSupabase()
        const { data: updatedLead, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', lead_id)
          .single()

        if (error || !updatedLead) {
          throw new Error('Lead non trouvé pour scoring')
        }

        const result = await scoreLead(updatedLead)

        // Mettre à jour le score du lead
        await supabase
          .from('leads')
          .update({ score_chaud: result.score_predictif })
          .eq('id', lead_id)

        await logEnrichment(lead_id, 'ai_scoring', 'SUCCESS', 0, {
          score: result.score_predictif,
          probabilite: result.probabilite_conversion,
          facteurs: result.facteurs_positifs
        })

        return result
      } catch (error) {
        await logEnrichment(lead_id, 'ai_scoring', 'FAILED', 0, null, error instanceof Error ? error.message : 'Unknown error')
        console.error('[AutoEnrich] AI scoring failed:', error)
        return { score_predictif: 0, probabilite_conversion: 0 }
      }
    })

    // ============================================
    // STEP 6: Actions automatiques selon le score
    // ============================================
    await step.run('trigger-automatic-actions', async () => {
      const supabase = getSupabase()
      const score = scoreResult.score_predictif || 0

      // Si score >= 70 → Prospect chaud, créer un rappel automatique
      if (score >= 70) {
        const rappelDate = new Date()
        rappelDate.setHours(rappelDate.getHours() + 2) // Dans 2h

        await supabase.from('rappels').insert({
          lead_id,
          titre: '🔥 Prospect chaud à contacter',
          description: `Score IA élevé (${score}/100) détecté automatiquement. Contact prioritaire recommandé.`,
          date_rappel: rappelDate.toISOString(),
          priorite: 'HAUTE',
          type: 'appel',
          statut: 'EN_ATTENTE',
          metadata: {
            auto_generated: true,
            trigger: 'high_score_enrichment',
            score_detected: score,
            sources_enriched: Object.keys(enrichmentResults).filter(key =>
              enrichmentResults[key as keyof typeof enrichmentResults] !== null
            )
          }
        })

        await supabase.from('activites').insert({
          type: 'RAPPEL',
          lead_id,
          description: `🔥 Rappel automatique créé - Prospect chaud détecté (score ${score}/100)`,
          metadata: {
            canal: 'auto_enrichment',
            action: 'rappel_created',
            score
          }
        })
      }

      // Si score >= 50 ET formation suggérée → Proposition formation
      if (score >= 50 && enrichmentResults.pappers?.activite) {
        // Analyser l'activité pour suggérer une formation pertinente
        const activite = enrichmentResults.pappers.activite.toLowerCase()
        let formationSuggeree = null

        if (activite.includes('esthétique') || activite.includes('beauté') || activite.includes('cosmétique')) {
          formationSuggeree = 'Formation Microneedling'
        } else if (activite.includes('coiffure') || activite.includes('salon')) {
          formationSuggeree = 'Formation Dermo-cosmétique'
        } else if (activite.includes('médical') || activite.includes('médecin')) {
          formationSuggeree = 'Formation Injections'
        }

        if (formationSuggeree) {
          await supabase.from('activites').insert({
            type: 'SUGGESTION',
            lead_id,
            description: `💡 Formation suggérée automatiquement : ${formationSuggeree}`,
            metadata: {
              canal: 'auto_enrichment',
              action: 'formation_suggested',
              formation: formationSuggeree,
              activite_detected: enrichmentResults.pappers.activite,
              score
            }
          })
        }
      }
    })

    // ============================================
    // STEP 7: Log final dans activités
    // ============================================
    await step.run('log-final-activity', async () => {
      const supabase = getSupabase()

      const sourcesEnrichies = []
      if (enrichmentResults.pappers) sourcesEnrichies.push('Pappers')
      if (enrichmentResults.google) sourcesEnrichies.push('Google Places')
      if (enrichmentResults.social) sourcesEnrichies.push('Réseaux sociaux')
      if (enrichmentResults.instagram) sourcesEnrichies.push('Instagram')

      const finalScore = scoreResult.score_predictif || 0

      await supabase.from('activites').insert({
        type: 'SYSTEME',
        lead_id,
        description: sourcesEnrichies.length > 0
          ? `✅ Enrichissement automatique complet : ${sourcesEnrichies.join(', ')} → Score IA ${finalScore}/100 (${enrichmentResults.total_credits} crédits)`
          : `⚠️ Enrichissement automatique : aucune donnée trouvée → Score IA ${finalScore}/100`,
        metadata: {
          canal: 'auto_enrichment',
          sources: sourcesEnrichies,
          credits_used: enrichmentResults.total_credits,
          final_score: finalScore,
          results: {
            pappers: !!enrichmentResults.pappers,
            google: !!enrichmentResults.google,
            social: !!enrichmentResults.social,
            instagram: !!enrichmentResults.instagram,
            ai_scored: true
          }
        }
      })
    })

    return {
      lead_id,
      enrichment_complete: true,
      sources_enriched: Object.keys(enrichmentResults).filter(key => enrichmentResults[key as keyof typeof enrichmentResults] !== null),
      total_credits_used: enrichmentResults.total_credits,
      final_score: scoreResult.score_predictif || 0,
      actions_triggered: scoreResult.score_predictif >= 70 ? ['rappel_created'] : [],
      formation_suggested: scoreResult.score_predictif >= 50 && enrichmentResults.pappers?.activite
    }
  }
)