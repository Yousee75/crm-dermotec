import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * POST /api/soft-delete/restore
 * Restaure un enregistrement depuis la corbeille
 */
export async function POST(request: NextRequest) {
  try {
    const { corbeille_id } = await request.json()

    if (!corbeille_id) {
      return NextResponse.json({ error: 'corbeille_id requis' }, { status: 400 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 })
    }

    // 1. Trouver l'entrée corbeille
    const { data: entry, error } = await supabase
      .from('corbeille')
      .select('*')
      .eq('id', corbeille_id)
      .is('restored_at', null)
      .single()

    if (error || !entry) {
      return NextResponse.json({ error: 'Entrée corbeille introuvable' }, { status: 404 })
    }

    // 2. Restaurer (enlever deleted_at)
    const { error: restoreError } = await supabase
      .from(entry.table_name)
      .update({
        deleted_at: null,
        deleted_by: null,
        delete_reason: null,
      })
      .eq('id', entry.record_id)

    if (restoreError) {
      return NextResponse.json({ error: 'Échec de la restauration' }, { status: 500 })
    }

    // 3. Marquer comme restauré dans la corbeille
    await supabase
      .from('corbeille')
      .update({ restored_at: new Date().toISOString() })
      .eq('id', corbeille_id)

    // 4. Logger
    try {
      await (supabase as any).from('activites').insert({
        type: 'SYSTEME',
        lead_id: entry.table_name === 'leads' ? entry.record_id : null,
        description: `${entry.table_name} restauré depuis la corbeille`,
        metadata: { table: entry.table_name, record_id: entry.record_id },
      })
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json({ success: true, message: 'Restauré avec succès' })
  } catch (error) {
    console.error('[Restore] Error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
