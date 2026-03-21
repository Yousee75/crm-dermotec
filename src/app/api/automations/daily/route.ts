// ============================================================
// CRM DERMOTEC — Automatisations quotidiennes
// POST /api/automations/daily
// Cron Vercel : 0 8 * * * (8h Paris)
// Vérifie leads stagnantes, sessions critiques, financements
// ============================================================

import { NextResponse } from 'next/server'
import { dailyAutomations } from '@/lib/automations'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  // Auth cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const results = await dailyAutomations()

    return NextResponse.json({
      success: true,
      date: new Date().toISOString(),
      ...results,
      message: `${results.stagnant_alerts} leads stagnantes alertées, ${results.session_alerts} sessions critiques, ${results.financement_alerts} financements relancés`,
    })
  } catch (error) {
    console.error('[Daily Automations] Error:', error)
    return NextResponse.json({ error: 'Erreur automatisations' }, { status: 500 })
  }
}
