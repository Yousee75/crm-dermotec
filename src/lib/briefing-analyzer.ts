/**
 * SATOREA — Analyseur de briefing standardisé
 *
 * 1 appel Claude API → génère TOUTE l'analyse personnalisée
 * Reproductible pour n'importe quel prospect
 *
 * Input : données collectées (scraping + APIs)
 * Output : JSON structuré avec textes, scores, insights, script, objections
 *
 * Coût : ~0.05€ (Haiku) à ~0.15€ (Sonnet)
 */
import 'server-only'

import { generateText } from 'ai'
import { getModel } from './ai-sdk'

// ══════════════════════════════════════════════════════════════
// TYPES — Structure standardisée des données collectées
// ══════════════════════════════════════════════════════════════

export interface CollectedData {
  // Source : site web ou saisie manuelle
  prospect: {
    nom: string
    prenom?: string
    entreprise: string
    adresse: string
    telephone: string
    telephone2?: string
    email?: string
    site_web?: string
  }

  // Source : API Sirene + societe.com
  legal?: {
    siret: string
    forme_juridique: string
    capital?: number
    date_creation: string
    anciennete_annees: number
    dirigeant: string
    code_naf: string
    effectif: string
    ca?: number
    resultat_net?: number
  }

  // Source : site web scraping
  activite?: {
    services: string[]
    marques: string[]
    awards: string[]
    mixte: boolean
    gamme_prix: string // €, €€, €€€, €€€€
    produits_avec_prix?: { nom: string; prix: number }[]
  }

  // Source : Google Maps, Planity, Treatwell, Facebook, Tripadvisor, PagesJaunes
  plateformes: {
    google?: {
      note: number
      nb_avis: number
      distribution: { etoiles: number; nombre: number; pourcentage: number }[]
      themes: { theme: string; mentions: number }[]
      avis_texte: { auteur: string; note: number; date: string; texte: string; reponse_proprio?: string }[]
      horaires?: string
      lgbtq_friendly?: boolean
    }
    planity?: {
      note: number
      nb_avis: number
      distribution?: { etoiles: number; nombre: number; pourcentage: number }[]
      actif: boolean
      gamme_prix: string
    }
    treatwell?: {
      note: number
      nb_avis: number
      distribution: { etoiles: number; nombre: number; pourcentage: number }[]
      sous_notes?: { categorie: string; note: number }[]
      actif: boolean
      avis_texte?: { auteur: string; texte: string }[]
    }
    facebook?: {
      followers: number
      suivis: number
      recommandation_pct: number
      nb_avis: number
      dernier_post?: string
    }
    instagram?: {
      username: string
      followers: number
      posts: number
      suivis: number
      bio?: string
      actif: boolean
    }
    tripadvisor?: {
      note: number
      nb_avis: number
      classement?: string
    }
    pagesjaunes?: {
      nb_avis: number
    }
  }

  // Source : Google Places Nearby + OSM
  quartier?: {
    metros: number
    restaurants: number
    concurrents_beaute: number
    pharmacies: number
    score_trafic: number
  }

  // Équipe identifiée (croisement sources)
  equipe_identifiee?: string[]

  // Coordonnées GPS
  coordonnees?: { lat: number; lng: number }
}

// ══════════════════════════════════════════════════════════════
// TYPES — Structure standardisée de l'analyse Claude
// ══════════════════════════════════════════════════════════════

export interface BriefingAnalysis {
  // Scores
  scores: {
    reputation: number
    presence: number
    activite: number
    financier: number
    quartier: number
    global: number
    justification: string
  }
  classification: 'CHAUD' | 'TIEDE' | 'FROID'

  // Textes principaux
  verdict: string // 2-3 phrases max
  brief: string // 4-5 phrases
  histoire_prospect: string // paragraphe narratif

  // Analyse des avis
  analyse_avis: {
    resume_global: string
    note_ponderee: number
    total_avis: number
    plateforme_principale: string
    points_forts_avis: string[] // 5 max
    points_faibles_avis: string[] // 3 max
    incoherences_plateformes: string // ex: "Tripadvisor 2,7 vs Planity 4,9 — pourquoi"
    avis_positif_cle: { texte: string; auteur: string; pourquoi_utile: string }
    avis_negatif_cle: { texte: string; auteur: string; pourquoi_utile: string }
    taux_reponse_proprio: string
    recommandation_commerciale: string // "Cite cet avis pendant l'appel..."
  }

  // Analyse digitale
  analyse_digitale: {
    resume: string
    forces: string[]
    faiblesses: string[]
    recommandation: string
  }

  // Stratégie
  strategie: {
    canal: string
    numero: string
    jour: string
    heure: string
    duree: string
    angle: string
    objectif: string
    justification: string
  }

  // Script téléphonique
  script: {
    accroche: { texte: string; pourquoi: string[] }
    transition: { texte: string; pourquoi: string[] }
    proposition: { texte: string; chiffres_cles: string[] }
    closing: { texte: string; pourquoi: string[] }
  }

  // Objections
  objections: {
    titre: string
    pensee_reelle: string
    reponse: string
    si_insiste?: string
  }[]

  // Douleurs & leviers
  douleurs: string[]
  aspirations: string[]
  mots_qui_marchent: { ne_dis_pas: string; dis_plutot: string; pourquoi: string }[]

  // Formations
  formations: {
    nom: string
    prix: string
    duree: string
    priorite: 'PRINCIPAL' | 'COMPLEMENTAIRE' | 'UPSELL'
    pourquoi_ce_prospect: string[]
    roi: string
  }[]

  // Financement
  financement: {
    option_principale: string
    phrase_cle: string
    alternatives: string[]
  }

  // Plan d'action
  plan_action: { quand: string; action: string; objectif: string }[]

  // Messages pour les graphiques (titres-insights)
  chart_insights: {
    gauge: string
    radar: string
    multiplateforme: string
    google_detail: string
    digital: string
    waterfall: string
    parcours: string
    avant_apres: string
  }

  // Message final motivationnel
  message_final: string
}

// ══════════════════════════════════════════════════════════════
// PROMPT STANDARDISÉ
// ══════════════════════════════════════════════════════════════

function buildPrompt(data: CollectedData): string {
  const totalAvis = Object.values(data.plateformes)
    .reduce((sum, p) => sum + (p && 'nb_avis' in p ? (p as any).nb_avis : 0), 0)

  return `Tu es un expert commercial pour Satorea, une agence qui vend des formations en esthétique (microblading, maquillage permanent, etc.) aux instituts de beauté en France.

DONNÉES DU PROSPECT (vérifiées par scraping) :
${JSON.stringify(data, null, 2)}

TOTAL AVIS TOUTES PLATEFORMES : ${totalAvis}

FORMATIONS DISPONIBLES :
- Microblading / Microshading : 1 400 € HT, 2 jours (14h)
- Full Lips (Candy Lips) : 1 400 € HT, 2 jours
- Rehaussement Cils + Volume Russe : 890 € HT, 2 jours
- Blanchiment Dentaire : 590 € HT, 1 jour
Toutes sont certifiées Qualiopi et finançables OPCO/CPF.

INSTRUCTIONS :
1. Analyse TOUTES les données. Chaque chiffre doit être utilisé.
2. Identifie les INCOHÉRENCES entre plateformes (ex: une note très basse vs très haute) et explique pourquoi.
3. Le script téléphonique doit CITER des données réelles du prospect (note, nombre d'avis, awards, nom de la gérante).
4. Les objections doivent être adaptées au PROFIL FINANCIER réel (capital, CA, ancienneté).
5. Le ROI doit être calculé avec des hypothèses réalistes basées sur le nombre d'avis (plus d'avis = plus de clientes potentielles).
6. Les messages des graphiques doivent être des INSIGHTS (conclusions) pas des descriptions.
7. Tu t'adresses au COMMERCIAL qui va appeler — ton direct, tutoiement, motivant.
8. Utilise les NOMS RÉELS (gérante, esthéticiennes identifiées).
9. Identifie quelle formation est la PLUS ADAPTÉE à ce prospect spécifique et pourquoi.
10. Le message final doit être motivant et personnalisé.

RÉPONDS EN JSON STRICT avec la structure BriefingAnalysis. Pas de markdown, pas d'explication, juste le JSON.`
}

// ══════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE
// ══════════════════════════════════════════════════════════════

export async function analyzeBriefing(data: CollectedData): Promise<BriefingAnalysis> {
  const prompt = buildPrompt(data)

  const { text } = await generateText({
    model: getModel('best'), // Claude Sonnet pour la qualité
    prompt,
    maxOutputTokens: 8000,
    temperature: 0.3, // Peu de créativité, beaucoup de rigueur
  })

  // Parse le JSON retourné
  try {
    // Nettoyer le texte (parfois Claude ajoute ```json ... ```)
    let cleaned = text.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    }
    return JSON.parse(cleaned) as BriefingAnalysis
  } catch (error) {
    console.error('[BriefingAnalyzer] Erreur parsing JSON Claude:', error)
    console.error('[BriefingAnalyzer] Texte brut:', text.slice(0, 500))
    throw new Error('Erreur parsing analyse Claude')
  }
}

// ══════════════════════════════════════════════════════════════
// HELPER — Calculer la note moyenne pondérée
// ══════════════════════════════════════════════════════════════

export function calculerNotePonderee(plateformes: CollectedData['plateformes']): { note: number; total: number } {
  let totalPoids = 0
  let totalNote = 0

  const sources = [
    { note: plateformes.google?.note, avis: plateformes.google?.nb_avis },
    { note: plateformes.planity?.note, avis: plateformes.planity?.nb_avis },
    { note: plateformes.treatwell?.note, avis: plateformes.treatwell?.nb_avis },
    { note: plateformes.facebook ? plateformes.facebook.recommandation_pct / 20 : undefined, avis: plateformes.facebook?.nb_avis },
    { note: plateformes.tripadvisor?.note, avis: plateformes.tripadvisor?.nb_avis },
  ]

  for (const s of sources) {
    if (s.note && s.avis && s.avis > 0) {
      totalNote += s.note * s.avis
      totalPoids += s.avis
    }
  }

  return {
    note: totalPoids > 0 ? Math.round(totalNote / totalPoids * 100) / 100 : 0,
    total: totalPoids,
  }
}

// ══════════════════════════════════════════════════════════════
// HELPER — Déterminer les données manquantes
// ══════════════════════════════════════════════════════════════

export function identifierDonneesManquantes(data: CollectedData): string[] {
  const manquantes: string[] = []

  if (!data.legal) manquantes.push('Données légales (SIRET)')
  if (!data.legal?.ca) manquantes.push('Chiffre d\'affaires')
  if (!data.plateformes.google) manquantes.push('Google Maps')
  if (!data.plateformes.planity) manquantes.push('Planity')
  if (!data.plateformes.instagram) manquantes.push('Instagram')
  if (!data.plateformes.facebook) manquantes.push('Facebook')
  if (!data.quartier) manquantes.push('Données quartier')
  if (!data.activite?.services?.length) manquantes.push('Services/prestations')
  if (!data.coordonnees) manquantes.push('Coordonnées GPS (carte)')

  return manquantes
}

// ══════════════════════════════════════════════════════════════
// HELPER — Déterminer quels graphiques générer
// ══════════════════════════════════════════════════════════════

export function determinerGraphiques(data: CollectedData): string[] {
  const graphiques = ['gauge', 'radar'] // Toujours

  // Multi-plateformes si au moins 2 sources d'avis
  const nbSources = Object.values(data.plateformes).filter(p => p && 'nb_avis' in p && (p as any).nb_avis > 0).length
  if (nbSources >= 2) graphiques.push('multiplateforme')

  // Distribution Google si disponible
  if (data.plateformes.google?.distribution?.length) graphiques.push('google_detail')

  // Digital scorecard si au moins 3 canaux
  if (nbSources >= 3 || data.plateformes.instagram || data.plateformes.facebook) graphiques.push('digital')

  // ROI toujours
  graphiques.push('waterfall', 'avant_apres')

  // Parcours toujours
  graphiques.push('parcours')

  return graphiques
}
