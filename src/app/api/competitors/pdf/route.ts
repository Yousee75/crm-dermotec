import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { RapportConcurrentiel } from '@/lib/pdf/rapport-concurrentiel'
import React from 'react'
import { requireAuth } from '@/lib/api/auth'
import { logActivity } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error
    const body = await request.json()
    const { prospect, competitors, kpis, neighborhood } = body

    if (!prospect || !competitors) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Générer le PDF
    const element = React.createElement(RapportConcurrentiel, {
      prospect,
      competitors,
      kpis: kpis || {},
      neighborhood,
      generatedAt: new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    })

    const buffer = await renderToBuffer(element as React.ReactElement)

    // Retourner le PDF
    const filename = `rapport-concurrentiel-${(prospect.nom || 'analyse').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`

    logActivity({ type: 'SYSTEME', description: 'Export PDF concurrents', user_id: auth.user?.id, metadata: { action: 'competitor_pdf_export' } })

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err) {
    console.error('[PDF] Generation error:', err)
    return NextResponse.json({ error: 'Erreur de génération PDF' }, { status: 500 })
  }
}
