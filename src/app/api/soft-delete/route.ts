import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const ALLOWED_TABLES = [
  'leads', 'sessions', 'inscriptions', 'financements',
  'factures', 'rappels', 'documents', 'commandes',
  'modeles', 'notes_lead', 'partenaires', 'cadence_instances',
]

/**
 * POST /api/soft-delete
 * Soft delete : marque deleted_at + sauvegarde snapshot dans corbeille
 * Ne supprime JAMAIS physiquement
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  try {
    const { table, id, reason } = await request.json()

    if (!table || !id) {
      return NextResponse.json({ error: 'table et id requis' }, { status: 400 })
    }

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Table non autorisée' }, { status: 403 })
    }

    const supabase = await createServiceSupabase() as any

    // 1. Vérifier que l'enregistrement existe et n'est pas déjà supprimé
    const { data: record, error: fetchError } = await (supabase as any)
      .from(table)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Enregistrement introuvable ou déjà supprimé' }, { status: 404 })
    }

    // 2. Marquer comme supprimé (soft delete)
    const { error: updateError } = await (supabase as any)
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
    try {
      await (supabase as any).from('activites').insert({
        type: 'SYSTEME',
        lead_id: table === 'leads' ? id : (record.lead_id || null),
        description: `${table} supprimé (soft delete) — ${reason || 'sans raison'}`,
        metadata: { table, record_id: id, reason },
      })
    } catch {
      // Ignore logging errors
    }

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
