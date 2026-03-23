import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/sessions/auto-transition
 *
 * Transitions automatiques des sessions :
 * - CONFIRMEE → EN_COURS quand date_debut <= today
 * - EN_COURS → TERMINEE quand date_fin < today
 *
 * Sécurisé par CRON_SECRET (Vercel Cron ou appel externe).
 * Peut aussi être appelé par la fonction PG auto_transition_sessions() via pg_cron.
 */
export async function POST(request: NextRequest) {
  // Vérifier le secret pour les appels cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = await createServiceSupabase() as any

  const today = new Date().toISOString().split('T')[0]
  let transitioned = 0

  // 1. CONFIRMEE → EN_COURS
  const { data: toStart, error: startError } = await supabase
    .from('sessions')
    .select('id, formation_id')
    .eq('statut', 'CONFIRMEE')
    .lte('date_debut', today)
    .gte('date_fin', today)

  if (!startError && toStart && toStart.length > 0) {
    const ids = toStart.map((s: any) => s.id)

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ statut: 'EN_COURS' })
      .in('id', ids)

    if (!updateError) {
      transitioned += ids.length

      // Logger les transitions
      await supabase.from('activites').insert(
        toStart.map((s: any) => ({
          type: 'SESSION' as const,
          session_id: s.id,
          description: 'Transition automatique : session démarrée',
          ancien_statut: 'CONFIRMEE',
          nouveau_statut: 'EN_COURS',
          metadata: { auto: true, trigger: 'api_cron' },
        }))
      )
    }
  }

  // 2. EN_COURS → TERMINEE
  const { data: toEnd, error: endError } = await supabase
    .from('sessions')
    .select('id, formation_id')
    .eq('statut', 'EN_COURS')
    .lt('date_fin', today)

  if (!endError && toEnd && toEnd.length > 0) {
    const ids = toEnd.map((s: any) => s.id)

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ statut: 'TERMINEE' })
      .in('id', ids)

    if (!updateError) {
      transitioned += ids.length

      await supabase.from('activites').insert(
        toEnd.map((s: any) => ({
          type: 'SESSION' as const,
          session_id: s.id,
          description: 'Transition automatique : session terminée',
          ancien_statut: 'EN_COURS',
          nouveau_statut: 'TERMINEE',
          metadata: { auto: true, trigger: 'api_cron' },
        }))
      )
    }
  }

  return NextResponse.json({
    success: true,
    transitioned,
    started: toStart?.length || 0,
    ended: toEnd?.length || 0,
    date: today,
  })
}
