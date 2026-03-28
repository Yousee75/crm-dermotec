// ============================================================
// CRM DERMOTEC — Monitoring Run Details
// GET /api/monitoring/[runId] — Détails d'un run
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getMonitoringRunDetails } from '@/lib/monitoring'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  try {
    const { run, checks } = await getMonitoringRunDetails(runId)

    if (!run) {
      return NextResponse.json({ error: 'Run non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ run, checks })
  } catch (error) {
    console.error('[Monitoring] Details failed:', error)
    return NextResponse.json({ error: 'Erreur détails' }, { status: 500 })
  }
}
