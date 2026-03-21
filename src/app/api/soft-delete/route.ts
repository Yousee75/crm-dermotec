import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ALLOWED_TABLES = [
  'leads', 'sessions', 'inscriptions', 'financements',
  'factures', 'rappels', 'documents', 'commandes',
  'modeles', 'notes_lead', 'partenaires', 'cadence_instances',
]

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * POST /api/soft-delete
 * Soft delete : marque deleted_at + sauvegarde snapshot dans corbeille
 * Ne supprime JAMAIS physiquement
 */
export async function POST(request: NextRequest) {
  try {
    const { table, id, reason } = await request.json()

    if (!table || !id) {
      return NextResponse.json({ error: 'table et id requis' }, { status: 400 })
    }

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Table non autorisée' }, { status: 403 })
    }

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Service indisponible' }, { status: 503 })
    }

    // 1. Vérifier que l'enregistrement existe et n'est pas déjà supprimé
    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Enregistrement introuvable ou déjà supprimé' }, { status: 404 })
    }

    // 2. Marquer comme supprimé (soft delete)
    const { error: updateError } = await supabase
      .from(table)
      .update({
        deleted_at: new Date().toISOString(),
        delete_reason: reason || 'Supprimé par l\'utilisateur',
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Échec du soft delete' }, { status: 500 })
    }

    // 3. Sauvegarder le snapshot dans la corbeille
    const { data: corbeille, error: corbeilleError } = await supabase
      .from('corbeille')
      .insert({
        table_name: table,
        record_id: id,
        record_data: record,
        delete_reason: reason,
      })
      .select('id')
      .single()

    if (corbeilleError) {
      console.error('[SoftDelete] Corbeille insert failed:', corbeilleError)
    }

    // 4. Logger l'activité
    await supabase.from('activites').insert({
      type: 'SYSTEME',
      lead_id: table === 'leads' ? id : (record.lead_id || null),
      description: `${table} supprimé (soft delete) — ${reason || 'sans raison'}`,
      metadata: { table, record_id: id, reason },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      corbeille_id: corbeille?.id || null,
      message: 'Supprimé (données conservées en corbeille)',
    })
  } catch (error) {
    console.error('[SoftDelete] Error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
