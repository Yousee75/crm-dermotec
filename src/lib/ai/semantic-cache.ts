import 'server-only'
import { createServiceSupabase } from '../supabase-server'
import { generateEmbedding } from './embeddings'

interface CacheEntry {
  query: string
  response: string
  tool_results: Record<string, unknown>
}

// Semantic cache : si une requête similaire a été posée récemment, retourner le cache
export async function semanticCacheGet(query: string): Promise<CacheEntry | null> {
  // Désactivé si pas d'embedding
  if (!process.env.OPENAI_API_KEY) return null

  try {
    const embedding = await generateEmbedding(query)
    if (!embedding.length) return null

    const supabase = await createServiceSupabase() as any
    const { data } = await supabase.rpc('semantic_cache_lookup', {
      p_query_embedding: JSON.stringify(embedding),
      p_threshold: 0.95,
      p_ttl_minutes: 60,
    })

    if (data?.[0]) {
      // Incrémenter le hit count
      await supabase
        .from('semantic_cache')
        .update({ hit_count: data[0].hit_count + 1 })
        .eq('id', data[0].id)

      return {
        query: data[0].query,
        response: data[0].response,
        tool_results: data[0].tool_results,
      }
    }

    return null
  } catch (err) {
    console.error('[SemanticCache] Get error:', err)
    return null
  }
}

export async function semanticCacheSet(
  query: string,
  response: string,
  toolResults: Record<string, unknown> = {}
): Promise<void> {
  if (!process.env.OPENAI_API_KEY) return

  try {
    const embedding = await generateEmbedding(query)
    if (!embedding.length) return

    const supabase = await createServiceSupabase() as any
    await supabase.from('semantic_cache').insert({
      query,
      query_embedding: JSON.stringify(embedding),
      response,
      tool_results: toolResults,
    })
  } catch (err) {
    console.error('[SemanticCache] Set error:', err)
  }
}