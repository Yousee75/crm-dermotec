import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { generateBriefingWord, type BriefingData } from '@/lib/generate-briefing-word'
import { generateProspectMap } from '@/lib/map-generator'

export const dynamic = 'force-dynamic'

/**
 * GET /api/enrichment/report/word?leadId=xxx
 * Génère le rapport prospect au format Word (.docx)
 * Combine : données lead + enrichment + narrative + avis + carte OSM
 */
export async function GET(req: NextRequest) {
  const supabase = await createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const leadId = searchParams.get('leadId')

  if (!leadId) {
    return NextResponse.json({ error: 'leadId requis' }, { status: 400 })
  }

  try {
    // 1. Récupérer le lead
    const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single()
    if (!lead) return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    const l = lead as any

    // 2. Récupérer le dernier rapport
    const { data: reports } = await (supabase as any)
      .from('prospect_reports')
      .select('*')
      .eq('lead_id', leadId)
      .order('version', { ascending: false })
      .limit(1)
    const report = reports?.[0]
    if (!report?.narrative) {
      return NextResponse.json({ error: 'Aucun rapport généré. Lancez le pipeline d\'enrichissement d\'abord.' }, { status: 404 })
    }

    const n = report.narrative
    const e = report.enrichment_data || {}

    // 3. Générer la carte OpenStreetMap
    let mapBuffer: Buffer | null = null
    let coords: { lat: number; lng: number } | null = null
    const adresse = e.sirene?.adresse
      ? `${e.sirene.adresse}, ${e.sirene.code_postal} ${e.sirene.ville}`
      : l.adresse?.ville ? `${l.adresse.rue || ''} ${l.adresse.ville}` : null

    if (adresse) {
      const mapResult = await generateProspectMap({ adresse })
      if (mapResult) {
        mapBuffer = mapResult.buffer
        coords = { lat: mapResult.lat, lng: mapResult.lng }
      }
    }

    // 4. Construire le BriefingData
    const briefingData: BriefingData = {
      prospect: {
        prenom: l.prenom || '',
        nom: l.nom || '',
        entreprise: l.entreprise_nom || e.sirene?.nom || '',
        adresse: adresse || '',
        tel: l.telephone || e.google?.telephone || '',
        email: l.email || '',
        siret: e.sirene?.siret || l.siret || '',
        forme_juridique: e.pappers?.formeJuridique || e.sirene?.forme_juridique || '',
        date_creation: e.pappers?.dateCreation || e.sirene?.date_creation || '',
        effectif: e.pappers?.effectif || undefined,
        equipe: e.pappers?.dirigeants?.map((d: any) => `${d.nom} (${d.fonction})`) || [],
        services: e.reviews?.placeData?.subtypes || [],
        instagram: e.social?.instagram?.username || undefined,
        site_web: e.social?.website || e.google?.website || '',
        google_rating: e.google?.rating || undefined,
        google_avis: e.google?.reviewsCount || undefined,
        ca: e.pappers?.chiffreAffaires || undefined,
        dirigeant: e.pappers?.dirigeants?.[0] ? `${e.pappers.dirigeants[0].nom} — ${e.pappers.dirigeants[0].fonction}` : undefined,
      },
      scores: {
        global: report.score || n.score_chaleur || 50,
        reputation: report.enrichment_data?.reviews?.analysis?.averageRating ? Math.round(report.enrichment_data.reviews.analysis.averageRating * 20) : 50,
        presence: (e.social?.website ? 30 : 0) + (e.social?.instagram ? 25 : 0) + (e.google?.website ? 15 : 0),
        activity: e.social?.instagram?.posts ? Math.min(100, Math.round(Math.log10((e.social.instagram.posts || 1) + 1) * 30)) : 20,
        financial: e.pappers?.chiffreAffaires ? Math.min(100, Math.round(e.pappers.chiffreAffaires / 3000)) : 50,
        neighborhood: e.quartier?.footTrafficScore || 50,
      },
      classification: report.classification || n.classification || 'TIEDE',
      // Narrative fields
      verdict: n.verdict || '',
      brief: n.brief_commercial || '',
      histoire: n.histoire_prospect || '',
      situation_business: n.situation_business || '',
      reputation_visibilite: n.reputation_visibilite || '',
      environnement: n.environnement || '',
      atouts: n.atouts_vente || [],
      pieges: n.pieges_eviter || [],
      strategie: {
        canal: n.strategie?.canal || 'Appel téléphonique',
        numero: l.telephone || '',
        jour: n.strategie?.meilleur_moment?.split(',')[0] || 'Mardi ou mercredi',
        heure: n.strategie?.meilleur_moment?.split(',')[1]?.trim() || '10h-12h',
        duree: n.strategie?.duree_estimee || '5-7 minutes',
        angle: n.strategie?.angle_attaque || '',
        objectif: n.strategie?.objectif_appel || 'Qualifier le besoin',
      },
      script: {
        accroche: n.script_telephone?.accroche || '',
        accroche_pourquoi: ['Proximité locale', 'Montre que tu as fait tes recherches'],
        transition: n.script_telephone?.transition || '',
        transition_pourquoi: ['Positionne la formation comme une évolution naturelle'],
        proposition: n.script_telephone?.proposition || '',
        proposition_chiffres: n.formations_recommandees?.map((f: any) => `${f.nom} : ${f.prix} — ${f.argument_roi}`) || [],
        closing: n.script_telephone?.closing || '',
        closing_pourquoi: ['Zéro pression', 'Next step concret'],
      },
      objections: [
        { titre: '"C\'est trop cher"', pensee_reelle: 'Inquiétude légitime sur le budget', reponse: n.script_telephone?.si_objection_prix || '' },
        { titre: '"J\'ai pas le temps"', pensee_reelle: 'Agenda chargé, peur de perdre des clients', reponse: n.script_telephone?.si_objection_temps || '' },
        { titre: '"J\'en ai pas besoin"', pensee_reelle: 'Ne voit pas encore l\'intérêt', reponse: n.script_telephone?.si_objection_besoin || '' },
      ],
      douleurs: [
        'Plafond de CA difficile à dépasser sans nouvelles prestations',
        'Concurrence croissante dans le quartier',
        ...(e.social?.instagram ? [] : ['Pas de présence Instagram — invisible en ligne']),
      ],
      aspirations: [
        'Augmenter le panier moyen avec des prestations premium',
        'Se différencier de la concurrence locale',
        'Monter en gamme tout en gardant son identité',
      ],
      positionnement: [
        '"Évolution naturelle de votre expertise"',
        '"Nouvelle prestation premium pour votre salon"',
        '"Un investissement de 2 jours pour des années de rentabilité"',
      ],
      formations: n.formations_recommandees?.map((f: any) => ({
        nom: f.nom,
        prix: f.prix,
        duree: '2 jours',
        niveau_priorite: f.niveau_priorite === 'principal' ? 'PRINCIPAL' as const : f.niveau_priorite === 'upsell_futur' ? 'UPSELL' as const : 'COMPLEMENTAIRE' as const,
        pourquoi: [f.pourquoi_elle],
        roi: f.argument_roi,
      })) || [],
      financement: {
        option_principale: n.strategie_financement?.option_principale || 'OPCO',
        comment_parler: n.strategie_financement?.comment_presenter || '',
        phrase_cle: n.strategie_financement?.phrase_cle || '',
        alternatives: n.strategie_financement?.alternatives || ['Paiement en 3x sans frais'],
      },
      plan_action: [
        { quand: n.plan_action?.action_1?.split(':')[0] || 'Aujourd\'hui', action: n.plan_action?.action_1 || '', si_ok: 'Fixer un RDV' },
        { quand: 'Si pas de réponse', action: n.plan_action?.action_2 || '', si_ok: 'Relancer' },
        { quand: 'Si intéressé(e)', action: n.plan_action?.action_3 || '', si_ok: 'Envoyer programme' },
      ],
      message_final: `Ce prospect a un score de ${report.score}/100. ${report.classification === 'CHAUD' ? 'Fonce, ne le laisse pas refroidir !' : report.classification === 'TIEDE' ? 'Ça vaut le coup d\'investir du temps.' : 'Qualifie d\'abord, ne pousse pas la vente.'} — Rapport généré par Satorea CRM`,

      // NOUVELLES DONNÉES
      avis: e.reviews?.analysis ? {
        total: e.reviews.analysis.totalReviews || 0,
        moyenne: e.reviews.analysis.averageRating || 0,
        distribution: e.reviews.analysis.distribution?.map((d: any) => ({ stars: d.stars, count: d.count, pct: d.percentage })) || [],
        trend: e.reviews.analysis.trend || 'stable',
        trendDelta: e.reviews.analysis.trendDelta || 0,
        ownerResponseRate: e.reviews.analysis.ownerResponseRate || 0,
        positiveKeywords: e.reviews.analysis.positiveKeywords || [],
        negativeKeywords: e.reviews.analysis.negativeKeywords || [],
        topPositive: e.reviews.analysis.topPositiveReview ? { author: e.reviews.analysis.topPositiveReview.author_name, text: e.reviews.analysis.topPositiveReview.text } : undefined,
        topNegative: e.reviews.analysis.topNegativeReview ? { author: e.reviews.analysis.topNegativeReview.author_name, text: e.reviews.analysis.topNegativeReview.text, rating: e.reviews.analysis.topNegativeReview.rating } : undefined,
        fetchedCount: e.reviews.analysis.fetchedCount || 0,
        withTextPct: e.reviews.analysis.withTextPercentage || 0,
        withPhotos: e.reviews.analysis.reviewsWithPhotos || 0,
      } : undefined,

      quartier: e.quartier ? {
        metros: e.quartier.metros || 0,
        restaurants: e.quartier.restaurants || 0,
        concurrentsBeaute: e.quartier.concurrentsBeaute || 0,
        pharmacies: e.quartier.pharmacies || 0,
        footTrafficScore: e.quartier.footTrafficScore || 0,
      } : undefined,

      mapImageBuffer: mapBuffer || undefined,
      coordonnees: coords || undefined,
    }

    // 5. Générer le Word
    const buffer = await generateBriefingWord(briefingData)

    const nomFichier = `briefing-${(l.prenom || '').toLowerCase()}-${(l.nom || '').toLowerCase()}.docx`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${nomFichier}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('[Word Report] Erreur:', error)
    return NextResponse.json({ error: 'Erreur génération Word' }, { status: 500 })
  }
}
