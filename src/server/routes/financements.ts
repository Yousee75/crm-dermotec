// ============================================================
// Routes Hono — /api/financements
// CRUD + historique + validation state machine
// ============================================================

import { Hono } from 'hono'
import { type AuthEnv } from '../middleware'

const financements = new Hono<AuthEnv>()

// POST /api/financements — Créer un financement
financements.post('/', async (c) => {
  const body = await c.req.json()
  const supabase = c.var.supabase
  const userId = c.var.userId

  const { data, error } = await supabase
    .from('financements')
    .insert({
      ...body,
      historique: [{
        date: new Date().toISOString(),
        action: 'Dossier créé',
        detail: `Organisme: ${body.organisme}`,
        user: userId,
      }],
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 422)

  // Logger (non-bloquant)
  if (body.lead_id) {
    supabase.from('activites').insert({
      type: 'FINANCEMENT',
      lead_id: body.lead_id,
      user_id: userId,
      description: `Nouveau dossier de financement ${body.organisme}`,
      metadata: { organisme: body.organisme, montant: body.montant_demande },
    }).then(() => {})
  }

  return c.json(data, 201)
})

// PUT /api/financements/:id — Mettre à jour
financements.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { historique_entry, ...updates } = await c.req.json()
  const supabase = c.var.supabase
  const userId = c.var.userId

  // Si historique_entry, l'ajouter à l'historique existant
  if (historique_entry) {
    const { data: current } = await supabase
      .from('financements')
      .select('historique')
      .eq('id', id)
      .single()

    updates.historique = [
      ...((current?.historique as unknown[]) || []),
      { date: new Date().toISOString(), ...historique_entry, user: userId },
    ]
  }

  // Valider la transition de statut si changement
  if (updates.statut) {
    const { data: current } = await supabase
      .from('financements')
      .select('statut')
      .eq('id', id)
      .single()

    if (current) {
      const { validateFinancementTransition } = await import('@/lib/validators')
      const err = validateFinancementTransition(current.statut as never, updates.statut as never)
      if (err) return c.json({ error: err }, 422)
    }
  }

  const { data, error } = await supabase
    .from('financements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 422)

  // Log si changement statut
  if (updates.statut && data.lead_id) {
    supabase.from('activites').insert({
      type: 'FINANCEMENT',
      lead_id: data.lead_id,
      user_id: userId,
      description: `Financement ${updates.statut.toLowerCase().replace('_', ' ')}`,
      metadata: { nouveau_statut: updates.statut },
    }).then(() => {})
  }

  return c.json(data, 200)
})

// DELETE /api/financements/:id
financements.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = c.var.supabase

  const { error } = await supabase
    .from('financements')
    .delete()
    .eq('id', id)

  if (error) return c.json({ error: error.message }, 500)

  return c.json({ success: true }, 200)
})

export default financements
