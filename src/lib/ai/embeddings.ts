import 'server-only'
import { openai } from '@ai-sdk/openai'
import { embed } from 'ai'

// Générer un embedding pour un texte (utilise text-embedding-3-small — bon en français, 1536 dims)
export async function generateEmbedding(text: string): Promise<number[]> {
  // Fallback si pas de clé OpenAI : retourner null
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[Embeddings] OPENAI_API_KEY non configurée — hybrid search désactivé')
    return []
  }

  try {
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: text,
    })

    return embedding
  } catch (error) {
    console.error('[Embeddings] Erreur génération embedding:', error)
    return []
  }
}

// Générer des embeddings en batch (pour indexer la KB)
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) return texts.map(() => [])

  try {
    const results = await Promise.all(
      texts.map(text => generateEmbedding(text))
    )

    return results
  } catch (error) {
    console.error('[Embeddings] Erreur génération embeddings batch:', error)
    return texts.map(() => [])
  }
}