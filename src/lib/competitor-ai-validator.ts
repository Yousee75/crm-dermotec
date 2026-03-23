import 'server-only'
// ============================================================
// CRM DERMOTEC — Validation IA des données concurrents
// Double validation : DeepSeek (rapide/pas cher) + Claude (précis)
// Compare les deux résultats pour garantir la fiabilité
// ============================================================

import type { AnalyzedCompetitor } from './competitor-analyzer'
import type { SocialMetrics } from './social-discovery'
import type { ScrapedCompetitor } from './competitor-scraper'
import type { NeighborhoodData } from './neighborhood-data'
import type { CompetitorScores } from './competitor-scoring'

export interface AIValidationResult {
  isValidMatch: boolean           // L'entreprise trouvée correspond bien ?
  confidence: number              // 0-100
  corrections: string[]           // Corrections suggérées
  enrichedData: {
    description?: string          // Description IA de l'entreprise
    pointsForts?: string[]        // Ses atouts
    pointsFaibles?: string[]      // Ses faiblesses
    conseilsProspection?: string[] // Comment les approcher
    niveauMenace: 'faible' | 'moyen' | 'fort' // Niveau de menace concurrentielle
  }
  deepseekResponse?: string
  claudeResponse?: string
}

/** Appel LLM générique (OpenAI-compatible) */
async function callLLM(
  provider: { baseUrl: string; model: string; apiKey: string; name: string },
  prompt: string,
  systemPrompt: string
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    }

    if (provider.name === 'openrouter') {
      headers['HTTP-Referer'] = 'https://crm-dermotec.vercel.app'
      headers['X-Title'] = 'CRM Dermotec'
    }

    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (err) {
    console.warn(`[AIValidator] ${provider.name} error:`, err)
    return null
  }
}

/** Construire le prompt d'analyse */
function buildPrompt(data: {
  businessName: string
  businessAddress?: string
  businessCity?: string
  competitor: Partial<AnalyzedCompetitor>
  social?: Partial<SocialMetrics>
  scraped?: ScrapedCompetitor
  neighborhood?: NeighborhoodData
  scores?: CompetitorScores
}): string {
  const c = data.competitor
  const s = data.social

  return `Analyse ce concurrent pour un centre de formation esthétique.

CONCURRENT RECHERCHÉ : "${data.businessName}" à ${data.businessCity || 'Paris'}
ADRESSE TROUVÉE : ${c.adresse || 'N/A'} ${c.ville || ''}

DONNÉES COLLECTÉES :
- SIRET: ${c.siret || 'N/A'} | SIREN: ${c.siren || 'N/A'}
- APE: ${c.codeApe || 'N/A'}
- Google: ★${c.googleRating || 'N/A'} (${c.googleReviewsCount || 0} avis)
- PagesJaunes: ★${data.scraped?.pagesJaunes?.rating || 'N/A'} (${data.scraped?.pagesJaunes?.reviewsCount || 0} avis)
- Planity: ${data.scraped?.planity?.found ? 'Oui' : 'Non'} ${data.scraped?.planity?.rating ? '★' + data.scraped.planity.rating : ''}
- Treatwell: ${data.scraped?.treatwell?.found ? 'Oui' : 'Non'}
- CA: ${c.chiffreAffaires ? c.chiffreAffaires + '€' : 'N/A'}
- Site web: ${c.website || 'N/A'}
- Instagram: ${s?.instagram ? '@' + s.instagram.username + ' (' + (s.instagram.followers || '?') + ' followers, ' + (s.instagram.posts || '?') + ' posts)' : 'Non trouvé'}
- Facebook: ${s?.facebook ? s.facebook.pageUrl : 'Non trouvé'}
- Services PJ: ${data.scraped?.pagesJaunes?.services?.join(', ') || 'N/A'}
- Services Planity: ${data.scraped?.planity?.services?.join(', ') || 'N/A'}
${data.scores ? `\nSCORES: Réputation=${data.scores.reputation} Présence=${data.scores.presence} Activité=${data.scores.activity} Finances=${data.scores.financial} Quartier=${data.scores.neighborhood} Global=${data.scores.global}` : ''}
${data.neighborhood ? `\nQUARTIER: ${data.neighborhood.metros} métros, ${data.neighborhood.restaurants} restos, ${data.neighborhood.beautyCompetitors} salons beauté, score trafic=${data.neighborhood.footTrafficScore}/100` : ''}

RÉPONDS EN JSON avec cette structure exacte :
{
  "isValidMatch": true/false (l'entreprise trouvée correspond-elle bien au nom recherché ?),
  "confidence": 0-100,
  "corrections": ["liste des erreurs ou incohérences détectées"],
  "description": "Description courte de l'établissement (2-3 phrases)",
  "pointsForts": ["3 points forts maximum"],
  "pointsFaibles": ["3 points faibles maximum"],
  "conseilsProspection": ["2 conseils pour approcher ce concurrent comme client potentiel de Dermotec"],
  "niveauMenace": "faible/moyen/fort"
}`
}

/** Double validation IA : DeepSeek + Claude, compare les résultats */
export async function validateWithAI(data: {
  businessName: string
  businessAddress?: string
  businessCity?: string
  competitor: Partial<AnalyzedCompetitor>
  social?: Partial<SocialMetrics>
  scraped?: ScrapedCompetitor
  neighborhood?: NeighborhoodData
  scores?: CompetitorScores
}): Promise<AIValidationResult> {
  const systemPrompt = `Tu es un expert en analyse concurrentielle pour le secteur de l'esthétique et de la formation professionnelle en France. Tu analyses les données collectées sur un concurrent et tu valides leur cohérence. Réponds UNIQUEMENT en JSON valide.`

  const prompt = buildPrompt(data)

  // Lancer les deux IA en parallèle
  const providers = []

  // DeepSeek (pas cher, rapide)
  if (process.env.DEEPSEEK_API_KEY) {
    providers.push({
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      apiKey: process.env.DEEPSEEK_API_KEY,
      name: 'deepseek',
    })
  }

  // Claude via Anthropic (précis)
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-sonnet-4-20250514',
      apiKey: process.env.ANTHROPIC_API_KEY,
      name: 'claude',
    })
  }

  // OpenRouter fallback
  if (providers.length === 0 && process.env.OPENROUTER_API_KEY) {
    providers.push({
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'deepseek/deepseek-chat',
      apiKey: process.env.OPENROUTER_API_KEY,
      name: 'openrouter',
    })
  }

  if (providers.length === 0) {
    console.warn('[AIValidator] Aucun provider IA disponible')
    return getDefaultResult()
  }

  // Pour Claude, on utilise l'API Messages (pas OpenAI-compatible)
  const results = await Promise.allSettled(
    providers.map(async p => {
      if (p.name === 'claude') {
        return callClaude(p.apiKey, systemPrompt, prompt)
      }
      return callLLM(p, prompt, systemPrompt)
    })
  )

  // Parser les réponses
  const parsed: Array<{ source: string; data: Record<string, unknown> | null }> = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const source = providers[i].name
    if (result.status === 'fulfilled' && result.value) {
      try {
        const json = JSON.parse(result.value)
        parsed.push({ source, data: json })
        // AI validation result parsed
      } catch {
        console.warn(`[AIValidator] ${source}: JSON parse failed`)
        parsed.push({ source, data: null })
      }
    }
  }

  if (parsed.length === 0 || !parsed.some(p => p.data)) {
    return getDefaultResult()
  }

  // Fusionner les résultats (prendre le plus confiant, croiser les données)
  const best = parsed.filter(p => p.data).sort((a, b) =>
    ((b.data as Record<string, number>)?.confidence || 0) - ((a.data as Record<string, number>)?.confidence || 0)
  )[0]

  const d = best.data as Record<string, unknown>

  // Si les deux IA sont en désaccord sur isValidMatch → signaler
  const corrections = [...((d.corrections as string[]) || [])]
  if (parsed.length >= 2 && parsed.every(p => p.data)) {
    const match1 = (parsed[0].data as Record<string, boolean>)?.isValidMatch
    const match2 = (parsed[1].data as Record<string, boolean>)?.isValidMatch
    if (match1 !== match2) {
      corrections.push(`⚠️ Désaccord IA : ${parsed[0].source} dit ${match1 ? 'match' : 'non-match'}, ${parsed[1].source} dit ${match2 ? 'match' : 'non-match'}`)
    }
  }

  return {
    isValidMatch: d.isValidMatch as boolean ?? true,
    confidence: d.confidence as number ?? 50,
    corrections,
    enrichedData: {
      description: d.description as string,
      pointsForts: d.pointsForts as string[],
      pointsFaibles: d.pointsFaibles as string[],
      conseilsProspection: d.conseilsProspection as string[],
      niveauMenace: (d.niveauMenace as 'faible' | 'moyen' | 'fort') || 'moyen',
    },
    deepseekResponse: parsed.find(p => p.source === 'deepseek')?.data ? JSON.stringify(parsed.find(p => p.source === 'deepseek')?.data) : undefined,
    claudeResponse: parsed.find(p => p.source === 'claude')?.data ? JSON.stringify(parsed.find(p => p.source === 'claude')?.data) : undefined,
  }
}

/** Appel Claude via API Messages (pas OpenAI-compatible) */
async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      console.warn('[AIValidator] Claude HTTP', res.status)
      return null
    }
    const data = await res.json()
    return data.content?.[0]?.text || null
  } catch (err) {
    console.warn('[AIValidator] Claude error:', err)
    return null
  }
}

function getDefaultResult(): AIValidationResult {
  return {
    isValidMatch: true,
    confidence: 50,
    corrections: ['Validation IA non disponible'],
    enrichedData: {
      niveauMenace: 'moyen',
    },
  }
}
