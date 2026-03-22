import { NextResponse } from 'next/server'
import { listTemplates, isDocuSealConfigured } from '@/lib/docuseal'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isDocuSealConfigured()) {
    return NextResponse.json({ error: 'DocuSeal non configuré' }, { status: 503 })
  }

  try {
    const templates = await listTemplates()
    return NextResponse.json({ templates })
  } catch (err: any) {
    console.error('[DocuSeal] Erreur:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
