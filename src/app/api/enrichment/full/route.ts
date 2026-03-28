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
    // Auth obligatoire
    const { createServerSupabase } = await import('@/lib/supabase-server')
    const authSb = await createServerSupabase()
    const { data: { user } } = await authSb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Rate limiting strict (3 req/min — routes coûteuses)
    const { getEnrichmentRateLimiter } = await import('@/lib/upstash')
    const limiter = getEnrichmentRateLimiter()
    if (limiter) {
      const { success } = await limiter.limit(user.id)
      if (!success) {
        return NextResponse.json({ error: 'Trop de requêtes. Maximum 3 enrichissements par minute.' }, { status: 429 })
      }
    }

    const body = await req.json()
    const { leadId, siret, nom, ville, website, skip_scraping, skip_formation, skip_geo } = body

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

    const startTime = Date.now()

    // ═══ LANCER L'ORCHESTRATEUR 25 SOURCES ═══
    const { enrichComplet } = await import('@/lib/enrichment-orchestrator')
    const intel = await enrichComplet(params)

    const durationMs = Date.now() - startTime

    // ═══ STOCKER DANS SUPABASE ═══
    // Mapping CORRECT des propriétés IntelligenceComplete
    // Type réel : { score_global, niveau, fiabilite, financier, reputation, formation, marche, digital, zone, signaux, ... }
    if (leadId) {
      const prospectData = {
        lead_id: leadId,
        // Financier (identité est DANS financier — pas de champ "identite")
        siret: params.siret,
        siren: params.siret?.slice(0, 9),
        nom_entreprise: params.nom,
        forme_juridique: intel.financier?.forme_juridique,
        capital: intel.financier?.capital_social,
        date_creation: intel.financier?.date_creation,
        effectif_tranche: intel.financier?.effectif ? String(intel.financier.effectif) : undefined,
        dirigeant_nom: intel.financier?.dirigeants?.[0]?.nom,
        dirigeant_fonction: intel.financier?.dirigeants?.[0]?.fonction,
        ca_dernier_connu: intel.financier?.chiffre_affaires,
        resultat_net: intel.financier?.resultat_net,
        procedure_collective: intel.signaux?.en_difficulte || false,
        // Convention collective
        convention_collective: intel.convention_collective?.intitule,
        convention_idcc: intel.convention_collective?.code_convention,
        // Localisation (zone, pas geo)
        adresse_complete: params.ville,
        code_postal: params.code_postal,
        ville: params.ville,
        latitude: (params as any).lat,
        longitude: (params as any).lng,
        // Réputation (opaque — pas de .google sous-objet)
        google_rating: intel.reputation?.note_globale,
        google_reviews_count: intel.reputation?.nb_avis_total,
        // Digital (opaque — pas de .instagram sous-objet)
        site_web: website,
        // Quartier (zone, pas geo)
        quartier_metros: intel.zone?.transports_proches,
        quartier_concurrents_beaute: intel.concurrents_zone?.length || 0,
        quartier_score_trafic: intel.zone?.score_trafic_pieton,
        // Scores
        score_reputation: intel.reputation?.score_reputation,
        score_presence: intel.digital?.score_digital,
        score_financier: intel.financier?.score_financier,
        score_quartier: intel.zone?.score_zone,
        score_global: intel.score_global,
        // Classification : niveau A/B/C/D → CHAUD/TIEDE/FROID
        classification: intel.niveau === 'A' || intel.niveau === 'B' ? 'CHAUD'
          : intel.niveau === 'C' ? 'TIEDE' : 'FROID',
        // Plateformes avis (JSONB)
        plateformes_avis: intel.plateformes_avis ? JSON.stringify(intel.plateformes_avis) : undefined,
        total_avis: intel.reputation?.nb_avis_total,
        note_ponderee: intel.reputation?.note_globale,
        // Services et marques
        services: intel.carte_soins || [],
        // Signaux
        sources_utilisees: [],
        cout_enrichissement: 0.15,
        duree_enrichissement_ms: durationMs,
        updated_at: new Date().toISOString(),
      }

      await supabase.from('prospect_data' as any).upsert(prospectData as any, {
        onConflict: 'lead_id',
      })

      // Mettre à jour le lead avec le score
      await ((supabase as any).from('leads').update({
        score_chaud: intel.score_global || 50,
        metadata: {
          ...(leadData?.metadata || {}),
          last_full_enrichment: new Date().toISOString(),
          enrichment_duration_ms: durationMs,
          enrichment_niveau: intel.niveau,
          enrichment_fiabilite: intel.fiabilite,
          nb_donnees_collectees: intel.nb_donnees_collectees,
        },
      }).eq('id', leadId))

    }

    return NextResponse.json({
      success: true,
      score: intel.score_global,
      niveau: intel.niveau,
      fiabilite: intel.fiabilite,
      classification: intel.niveau === 'A' || intel.niveau === 'B' ? 'CHAUD'
        : intel.niveau === 'C' ? 'TIEDE' : 'FROID',
      duration_ms: durationMs,
      nb_donnees: intel.nb_donnees_collectees,
      signaux: intel.signaux || {},
      summary: {
        financier: !!intel.financier,
        reputation: !!intel.reputation,
        formation: !!intel.formation,
        marche: !!intel.marche,
        digital: !!intel.digital,
        zone: !!intel.zone,
        plateformes_avis: intel.plateformes_avis?.length || 0,
        concurrents_zone: intel.concurrents_zone?.length || 0,
        aides_disponibles: intel.aides_disponibles?.length || 0,
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
