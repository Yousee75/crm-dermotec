// ============================================================
// CRM DERMOTEC — Monitoring Run API
// POST /api/monitoring/run — Lance un check complet
// Cron Vercel : 0 7 * * * (tous les jours 7h)
// GET /api/monitoring/run — Historique des runs
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { runFullMonitoring, getMonitoringHistory } from '@/lib/monitoring'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * POST — Lancer un monitoring complet
 * Auth : CRON_SECRET (cron Vercel) ou session auth
 */
export async function POST(request: NextRequest) {
  // Auth cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  const isCron = authHeader === `Bearer ${cronSecret}`
  const triggerSource = isCron ? 'cron' as const : 'manual' as const

  // Si pas cron, vérifier qu'on a au moins un secret valide
  if (!isCron && cronSecret) {
    // Permettre aussi via query param pour les tests
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }

  try {
    const results = await runFullMonitoring(triggerSource)

    return NextResponse.json({
      success: true,
      ...results,
      message: `Monitoring terminé : ${results.passed}/${results.total_checks} OK, ${results.failed} échecs, ${results.warnings} warnings`
    })
  } catch (error) {
    console.error('[Monitoring] Run failed:', error)
    return NextResponse.json(
      { error: 'Erreur monitoring', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

/**
 * GET — Historique des runs de monitoring
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '30', 10)

  try {
    const runs = await getMonitoringHistory(limit)

    return NextResponse.json({ runs, total: runs.length })
  } catch (error) {
    console.error('[Monitoring] History failed:', error)
    return NextResponse.json({ error: 'Erreur historique' }, { status: 500 })
  }
}
