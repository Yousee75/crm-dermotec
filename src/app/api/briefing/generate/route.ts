import { NextRequest, NextResponse } from 'next/server'
import { analyzeBriefing, calculerNotePonderee, identifierDonneesManquantes, determinerGraphiques, type CollectedData, type BriefingAnalysis } from '@/lib/briefing-analyzer'
import { generateBriefingWord, type BriefingData } from '@/lib/generate-briefing-word'
import { generateProspectMap } from '@/lib/map-generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 secondes max (Vercel Pro)

/**
 * POST /api/briefing/generate
 *
 * Pipeline complet : données collectées → analyse Claude → Word
 *
 * Body : CollectedData (JSON)
 * Retourne : .docx en téléchargement
 *
 * Coût : ~0.40€ par rapport (Claude + carte OSM)
 */
export async function POST(req: NextRequest) {
  try {
    // Auth obligatoire
    const { createServerSupabase } = await import('@/lib/supabase-server')
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const data: CollectedData = await req.json()

    if (!data.prospect?.entreprise) {
      return NextResponse.json({ error: 'Données prospect incomplètes' }, { status: 400 })
    }

    // 1. Identifier ce qui manque
    const manquantes = identifierDonneesManquantes(data)
    // 2. Calculer la note pondérée
    const { note, total } = calculerNotePonderee(data.plateformes)

    // 3. Déterminer les graphiques à générer
    const graphiques = determinerGraphiques(data)

    // 4. Analyser avec Claude
    const analysis: BriefingAnalysis = await analyzeBriefing(data)

    // 5. Générer la carte OSM
    let mapBuffer: Buffer | undefined
    if (data.coordonnees || data.prospect.adresse) {
      const mapResult = await generateProspectMap({
        adresse: data.prospect.adresse,
        lat: data.coordonnees?.lat,
        lng: data.coordonnees?.lng,
      })
      if (mapResult) mapBuffer = mapResult.buffer
    }

    // 6. Construire le BriefingData pour le Word
    const briefingData: BriefingData = {
      prospect: {
        prenom: data.prospect.prenom || data.legal?.dirigeant?.split(' ')[0] || '',
        nom: data.prospect.nom || '',
        entreprise: data.prospect.entreprise,
        adresse: data.prospect.adresse,
        tel: data.prospect.telephone,
        email: data.prospect.email,
        siret: data.legal?.siret,
        forme_juridique: data.legal?.forme_juridique,
        date_creation: data.legal?.date_creation,
        effectif: data.legal?.effectif ? parseInt(data.legal.effectif) : undefined,
        equipe: data.equipe_identifiee,
        services: data.activite?.services,
        instagram: data.plateformes.instagram?.username,
        site_web: data.prospect.site_web,
        google_rating: data.plateformes.google?.note,
        google_avis: data.plateformes.google?.nb_avis,
        ca: data.legal?.ca,
        dirigeant: data.legal?.dirigeant,
      },
      scores: {
        global: analysis.scores.global,
        reputation: analysis.scores.reputation,
        presence: analysis.scores.presence,
        activity: analysis.scores.activite,
        financial: analysis.scores.financier,
        neighborhood: analysis.scores.quartier,
      },
      classification: analysis.classification,
      verdict: analysis.verdict,
      brief: analysis.brief,
      histoire: analysis.histoire_prospect,
      situation_business: analysis.analyse_avis.resume_global,
      reputation_visibilite: analysis.analyse_digitale.resume,
      environnement: analysis.strategie.justification,
      atouts: analysis.analyse_avis.points_forts_avis,
      pieges: analysis.analyse_avis.points_faibles_avis,
      strategie: analysis.strategie,
      script: {
        accroche: analysis.script.accroche.texte,
        accroche_pourquoi: analysis.script.accroche.pourquoi,
        transition: analysis.script.transition.texte,
        transition_pourquoi: analysis.script.transition.pourquoi,
        proposition: analysis.script.proposition.texte,
        proposition_chiffres: analysis.script.proposition.chiffres_cles,
        closing: analysis.script.closing.texte,
        closing_pourquoi: analysis.script.closing.pourquoi,
      },
      objections: analysis.objections,
      douleurs: analysis.douleurs,
      aspirations: analysis.aspirations,
      positionnement: analysis.mots_qui_marchent.map(m => `"${m.dis_plutot}" au lieu de "${m.ne_dis_pas}"`),
      formations: analysis.formations.map(f => ({
        nom: f.nom,
        prix: f.prix,
        duree: f.duree,
        niveau_priorite: f.priorite,
        pourquoi: f.pourquoi_ce_prospect,
        roi: f.roi,
      })),
      financement: {
        option_principale: analysis.financement.option_principale,
        comment_parler: analysis.financement.phrase_cle,
        phrase_cle: analysis.financement.phrase_cle,
        alternatives: analysis.financement.alternatives,
      },
      plan_action: analysis.plan_action.map(pa => ({
        quand: pa.quand,
        action: pa.action,
        si_ok: pa.objectif,
      })),
      message_final: analysis.message_final,
      // Données enrichies
      avis: data.plateformes.google ? {
        total: total,
        moyenne: note,
        distribution: data.plateformes.google.distribution.map(d => ({
          stars: d.etoiles, count: d.nombre, pct: d.pourcentage,
        })),
        trend: 'stable' as const,
        trendDelta: 0,
        ownerResponseRate: 0,
        positiveKeywords: data.plateformes.google.themes.slice(0, 6).map(t => t.theme),
        negativeKeywords: [],
        topPositive: data.plateformes.google.avis_texte.find(a => a.note >= 4) ? {
          author: data.plateformes.google.avis_texte.find(a => a.note >= 4)!.auteur,
          text: data.plateformes.google.avis_texte.find(a => a.note >= 4)!.texte,
        } : undefined,
        topNegative: data.plateformes.google.avis_texte.find(a => a.note <= 2) ? {
          author: data.plateformes.google.avis_texte.find(a => a.note <= 2)!.auteur,
          text: data.plateformes.google.avis_texte.find(a => a.note <= 2)!.texte,
          rating: data.plateformes.google.avis_texte.find(a => a.note <= 2)!.note,
        } : undefined,
        fetchedCount: data.plateformes.google.avis_texte.length,
        withTextPct: 0,
        withPhotos: 0,
      } : undefined,
      quartier: data.quartier ? {
        metros: data.quartier.metros,
        restaurants: data.quartier.restaurants,
        concurrentsBeaute: data.quartier.concurrents_beaute,
        pharmacies: data.quartier.pharmacies,
        footTrafficScore: data.quartier.score_trafic,
      } : undefined,
      mapImageBuffer: mapBuffer,
      coordonnees: data.coordonnees,
    }

    // 7. Générer le Word
    const wordBuffer = await generateBriefingWord(briefingData)

    const nom = data.prospect.entreprise.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    const filename = `satorea-briefing-${nom}.docx`

    return new NextResponse(new Uint8Array(wordBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Briefing-Score': String(analysis.scores.global),
        'X-Briefing-Classification': analysis.classification,
        'X-Briefing-Avis-Total': String(total),
        'X-Briefing-Note-Ponderee': String(note),
        'X-Briefing-Graphiques': graphiques.join(','),
        'X-Briefing-Manquantes': manquantes.join(',') || 'aucune',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('[Briefing] Erreur:', error)
    return NextResponse.json({
      error: 'Erreur génération briefing',
      details: error.message,
    }, { status: 500 })
  }
}
