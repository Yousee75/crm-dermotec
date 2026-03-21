// ============================================================
// CRM DERMOTEC — Indexation Knowledge Base avec Embeddings
// POST /api/ai/index-kb
// Génère les embeddings pour tous les articles KB + playbook
// À exécuter UNE FOIS après la migration pgvector
// ============================================================

import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { generateEmbedding } from '@/lib/embeddings'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes (beaucoup d'articles)

export async function POST(request: Request) {
  // Vérifier le secret pour éviter les appels non autorisés
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY requise pour les embeddings' }, { status: 400 })
  }

  const supabase = await createServiceSupabase()
  const results = { kb_indexed: 0, kb_errors: 0, playbook_indexed: 0, playbook_errors: 0 }

  // 1. Indexer knowledge_base
  const { data: kbArticles } = await supabase
    .from('knowledge_base')
    .select('id, titre, contenu, categorie')
    .eq('is_active', true)
    .is('embedding', null) // Seulement ceux sans embedding

  if (kbArticles?.length) {
    for (const article of kbArticles) {
      try {
        const text = `${article.categorie}: ${article.titre}\n${article.contenu}`
        const embedding = await generateEmbedding(text)
        if (embedding.length) {
          await supabase
            .from('knowledge_base')
            .update({ embedding: JSON.stringify(embedding) })
            .eq('id', article.id)
          results.kb_indexed++
        }
        // Rate limit : 1 embedding / 100ms pour ne pas dépasser les limites OpenAI
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch {
        results.kb_errors++
      }
    }
  }

  // 2. Indexer playbook_entries
  const { data: playbookEntries } = await supabase
    .from('playbook_entries')
    .select('id, titre, contexte, categorie')
    .eq('is_active', true)
    .is('embedding', null)

  if (playbookEntries?.length) {
    for (const entry of playbookEntries) {
      try {
        const text = `${entry.categorie}: ${entry.titre}${entry.contexte ? ` — ${entry.contexte}` : ''}`
        const embedding = await generateEmbedding(text)
        if (embedding.length) {
          await supabase
            .from('playbook_entries')
            .update({ embedding: JSON.stringify(embedding) })
            .eq('id', entry.id)
          results.playbook_indexed++
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch {
        results.playbook_errors++
      }
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
    total: results.kb_indexed + results.playbook_indexed,
    message: `${results.kb_indexed} articles KB + ${results.playbook_indexed} entrées playbook indexés`,
  })
}
