import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/enrichment/full
 *
 * Pipeline COMPLET : orchestre les 25 sources + stocke dans prospect_data
 * Câble enrichment-orchestrator.ts (qui était orphelin) au CRM
 *
 * Body : { leadId: string } ou { siret: string, nom: string, ville: string }
 * Retourne : IntelligenceComplete + données stockées dans Supabase
 *
 * Arbre de décision :
 * 1. Si SIRET → Branche Identité (Sirene + Pappers + Convention + BODACC + DGEFP)
 * 2. Si Nom → Branche Réputation (Google Places + Social + PageSpeed + Instagram)
 * 3. Si GPS → Branche Géo (IRIS revenus + DVF prix m² + Neighborhood + OSM concurrents)
 * 4. Si Département → Branche Formation (France Travail + Aides + CPF + BODACC zone)
 * 5. Si Nom+Ville → Branche Scraping (PJ + Planity + Treatwell + Tripadvisor + Bright Data)
 *
 * Coût estimé : ~0.15-0.40€ selon les sources activées
 */
export async function POST(req: NextRequest) {
  const supabase = await createServiceSupabase()

  try {
    const body = await req.json()
    const { leadId, siret, nom, ville, website, skip_scraping, skip_formation, skip_geo } = body

    // Si leadId → récupérer les données du lead
    let leadData: any = null
    if (leadId) {
      const { data } = await supabase.from('leads').select('*').eq('id', leadId).single()
      if (!data) return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
      leadData = data
    }

    // Construire les params pour l'orchestrateur
    const params = {
      siret: siret || leadData?.siret || leadData?.entreprise_siret,
      nom: nom || leadData?.entreprise_nom || `${leadData?.prenom || ''} ${leadData?.nom || ''}`.trim(),
      ville: ville || leadData?.adresse?.ville || 'Paris',
      code_postal: leadData?.adresse?.code_postal,
      website: website || leadData?.site_web,
      lead_id: leadId || undefined,
      skip_scraping: skip_scraping || false,
      skip_formation: skip_formation || false,
      skip_geo: skip_geo || false,
      max_timeout_ms: 55000, // 55s pour laisser 5s de marge Vercel
    }

    if (!params.nom && !params.siret) {
      return NextResponse.json({ error: 'Nom ou SIRET requis' }, { status: 400 })
    }

    console.log(`[Enrichment Full] Démarrage pour ${params.nom} (${params.siret || 'pas de SIRET'})`)
    const startTime = Date.now()

    // ═══ LANCER L'ORCHESTRATEUR 25 SOURCES ═══
    const { enrichComplet } = await import('@/lib/enrichment-orchestrator')
    const intel = await enrichComplet(params)

    const durationMs = Date.now() - startTime
    console.log(`[Enrichment Full] Terminé en ${durationMs}ms`)

    // ═══ STOCKER DANS SUPABASE ═══
    if (leadId) {
      // Upsert dans prospect_data
      const prospectData = {
        lead_id: leadId,
        // Identité
        siret: (intel as any).identite?.siret || params.siret,
        siren: (intel as any).identite?.siren,
        nom_entreprise: (intel as any).identite?.denomination || params.nom,
        forme_juridique: (intel as any).identite?.forme_juridique,
        capital: (intel as any).financier?.capital,
        date_creation: (intel as any).identite?.date_creation,
        code_naf: (intel as any).identite?.code_naf,
        libelle_naf: (intel as any).identite?.libelle_naf,
        convention_collective: (intel as any).identite?.convention?.nom,
        convention_idcc: (intel as any).identite?.convention?.idcc,
        effectif_tranche: (intel as any).identite?.effectif,
        dirigeant_nom: (intel as any).identite?.dirigeant?.nom,
        dirigeant_fonction: (intel as any).identite?.dirigeant?.fonction,
        ca_dernier_connu: (intel as any).financier?.chiffre_affaires,
        resultat_net: (intel as any).financier?.resultat_net,
        procedure_collective: (intel as any).signaux?.en_difficulte || false,
        // Localisation
        adresse_complete: (intel as any).identite?.adresse || params.ville,
        code_postal: params.code_postal,
        ville: params.ville,
        latitude: (intel as any).geo?.lat || (intel as any).identite?.lat,
        longitude: (intel as any).geo?.lng || (intel as any).identite?.lng,
        // Google
        google_place_id: (intel as any).reputation?.google?.place_id,
        google_rating: (intel as any).reputation?.google?.rating,
        google_reviews_count: (intel as any).reputation?.google?.reviews_count,
        google_website: (intel as any).reputation?.google?.website,
        google_phone: (intel as any).reputation?.google?.phone,
        // Réseaux sociaux
        instagram_username: (intel as any).digital?.instagram?.username,
        instagram_followers: (intel as any).digital?.instagram?.followers,
        instagram_posts: (intel as any).digital?.instagram?.posts,
        facebook_url: (intel as any).digital?.facebook?.url,
        facebook_followers: (intel as any).digital?.facebook?.followers,
        site_web: website || (intel as any).reputation?.google?.website,
        // Quartier
        quartier_metros: (intel as any).geo?.neighborhood?.metros,
        quartier_restaurants: (intel as any).geo?.neighborhood?.restaurants,
        quartier_concurrents_beaute: (intel as any).geo?.neighborhood?.beauty_salons,
        quartier_pharmacies: (intel as any).geo?.neighborhood?.pharmacies,
        quartier_score_trafic: (intel as any).geo?.neighborhood?.foot_traffic_score,
        // Scores
        score_global: (intel as any).score_global,
        classification: (intel as any).classification,
        // Meta
        sources_utilisees: (intel as any)._meta?.sources || [],
        cout_enrichissement: 0.15,
        duree_enrichissement_ms: durationMs,
        updated_at: new Date().toISOString(),
      }

      // Upsert (créer ou mettre à jour)
      await supabase.from('prospect_data' as any).upsert(prospectData as any, {
        onConflict: 'lead_id',
      })

      // Mettre à jour le lead avec le score
      await supabase.from('leads').update({
        score_chaud: (intel as any).score_global || 50,
        metadata: {
          ...(leadData?.metadata || {}),
          last_full_enrichment: new Date().toISOString(),
          enrichment_duration_ms: durationMs,
          enrichment_sources: (intel as any)._meta?.sources?.length || 0,
        },
      }).eq('id', leadId)

      console.log(`[Enrichment Full] Stocké dans prospect_data pour lead ${leadId}`)
    }

    return NextResponse.json({
      success: true,
      score: (intel as any).score_global,
      classification: (intel as any).classification,
      duration_ms: durationMs,
      sources: (intel as any)._meta?.sources || [],
      signaux: (intel as any).signaux || {},
      // Résumé des données récupérées
      summary: {
        identite: !!(intel as any).identite,
        financier: !!(intel as any).financier,
        reputation: !!(intel as any).reputation,
        digital: !!(intel as any).digital,
        geo: !!(intel as any).geo,
        formation: !!(intel as any).formation,
        scraping: !!(intel as any).scraping,
      },
    })
  } catch (error: any) {
    console.error('[Enrichment Full] Erreur:', error)
    return NextResponse.json({
      error: 'Erreur enrichissement complet',
      details: error.message,
    }, { status: 500 })
  }
}
