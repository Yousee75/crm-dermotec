// @ts-nocheck
import 'server-only'
import { createServiceSupabase } from './supabase-server'
import { generateEmbedding } from './embeddings'

interface SearchResult {
  id: string
  categorie: string
  titre: string
  contenu: string
  formation_slug?: string
  statut_pro_cible?: string
  bm25_score: number
  vector_score: number
  combined_score: number
}

// Hybrid search : BM25 (full-text) + Vector (sémantique) avec Reciprocal Rank Fusion
export async function hybridSearchKB(
  query: string,
  options?: {
    limit?: number
    bm25Weight?: number
    vectorWeight?: number
    categorie?: string
  }
): Promise<SearchResult[]> {
  const supabase = await createServiceSupabase()

  // Générer l'embedding de la requête
  const embedding = await generateEmbedding(query)

  // Si pas d'embedding (clé manquante), fallback sur FTS seul
  if (!embedding.length) {
    const searchTerms = query.replace(/['"]/g, '').split(/\s+/).filter(w => w.length > 2).join(' & ')
    const { data } = await supabase
      .from('knowledge_base')
      .select('id, categorie, titre, contenu, formation_slug, statut_pro_cible')
      .eq('is_active', true)
      .textSearch('fts', searchTerms || query, { config: 'french' })
      .limit(options?.limit || 10)

    return (data || []).map((d, i) => ({
      ...d,
      bm25_score: 1 - i * 0.1,
      vector_score: 0,
      combined_score: 1 - i * 0.1,
    }))
  }

  // Hybrid search via RPC
  const { data, error } = await supabase.rpc('hybrid_search_kb', {
    query_text: query,
    query_embedding: JSON.stringify(embedding),
    match_count: options?.limit || 10,
    bm25_weight: options?.bm25Weight || 0.4,
    vector_weight: options?.vectorWeight || 0.6,
  })

  if (error) {
    console.error('[HybridSearch] RPC error:', error.message)
    // Fallback sur FTS
    const searchTerms = query.replace(/['"]/g, '').split(/\s+/).filter(w => w.length > 2).join(' & ')
    const { data: fallback } = await supabase
      .from('knowledge_base')
      .select('id, categorie, titre, contenu, formation_slug, statut_pro_cible')
      .eq('is_active', true)
      .textSearch('fts', searchTerms || query, { config: 'french' })
      .limit(options?.limit || 10)

    return (fallback || []).map((d, i) => ({
      ...d,
      bm25_score: 1 - i * 0.1,
      vector_score: 0,
      combined_score: 1 - i * 0.1,
    }))
  }

  let results = data || []

  // Filtrer par catégorie si spécifié
  if (options?.categorie) {
    results = results.filter((r: SearchResult) => r.categorie === options.categorie)
  }

  return results
}