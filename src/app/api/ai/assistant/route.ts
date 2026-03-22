// ============================================================
// CRM DERMOTEC — API Route : Assistant IA (DeepSeek)
// Rate-limité par plan SaaS, avec semantic cache Redis
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { assistantChat, getCacheKey } from '@/lib/ai-assistant'
import type { AIMessage } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Auth : skip en mode démo, sinon vérifier cookie Supabase
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    let userId = 'demo-user'

    if (!isDemoMode) {
      const { createServerSupabase } = await import('@/lib/supabase-server')
      const supabase = await createServerSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
      }
      userId = user.id
    }

    const body = await request.json()
    const { messages } = body as { messages: AIMessage[] }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
    }

    // Rate limiting via Redis (si disponible)
    const today = new Date().toISOString().split('T')[0]
    const rateLimitKey = `ai_assistant:${userId}:${today}`

    let currentUsage = 0
    const dailyLimit = 50 // Default Pro plan

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const { Redis } = await import('@upstash/redis')
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })

        currentUsage = (await redis.get<number>(rateLimitKey)) || 0

        if (currentUsage >= dailyLimit) {
          return NextResponse.json(
            { error: 'Limite quotidienne atteinte', usage: currentUsage, limit: dailyLimit },
            { status: 429 }
          )
        }

        // Semantic cache check
        const lastMessage = messages[messages.length - 1]?.content || ''
        const cacheKey = getCacheKey(lastMessage)
        const cached = await redis.get<string>(cacheKey)

        if (cached && messages.length <= 2) {
          // Cache hit (seulement pour les questions simples, pas les conversations)
          await redis.incr(rateLimitKey)
          await redis.expire(rateLimitKey, 86400)
          return NextResponse.json({
            response: cached,
            model: 'cache',
            usage: currentUsage + 1,
            limit: dailyLimit,
            cached: true,
          })
        }
      } catch (redisErr) {
        console.warn('[AI Assistant] Redis error, continuing without cache:', redisErr)
      }
    }

    // Appel LLM
    const result = await assistantChat(messages)

    if (!result) {
      return NextResponse.json(
        { error: 'Aucun provider IA disponible' },
        { status: 503 }
      )
    }

    // Incrémenter compteur + sauvegarder cache
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const { Redis } = await import('@upstash/redis')
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })

        await redis.incr(rateLimitKey)
        await redis.expire(rateLimitKey, 86400)

        // Cache la réponse (TTL 24h)
        const lastMessage = messages[messages.length - 1]?.content || ''
        const cacheKey = getCacheKey(lastMessage)
        await redis.set(cacheKey, result.content, { ex: 86400 })
      } catch {
        // Silent fail
      }
    }

    return NextResponse.json({
      response: result.content,
      model: result.model,
      usage: currentUsage + 1,
      limit: dailyLimit,
      cached: false,
    })
  } catch (err) {
    console.error('[AI Assistant] Route error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
