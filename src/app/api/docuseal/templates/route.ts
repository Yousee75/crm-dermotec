import { NextResponse } from 'next/server'
import { listTemplates, isDocuSealConfigured } from '@/lib/docuseal'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Auth obligatoire
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

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
