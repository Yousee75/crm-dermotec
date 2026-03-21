// ============================================================
// Routes Hono — /api/leads
// ============================================================

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { type AuthEnv } from '../middleware'

// ---------- Schemas Zod (request + response) ----------

const LeadParamsSchema = z
  .object({
    id: z.string().uuid().openapi({ description: 'ID du lead', example: '550e8400-e29b-41d4-a716-446655440000' }),
  })
  .openapi('LeadParams')

const LeadResponseSchema = z
  .object({
    id: z.string().uuid(),
    prenom: z.string(),
    nom: z.string(),
    email: z.string().email().nullable(),
    telephone: z.string().nullable(),
    statut: z.enum([
      'NOUVEAU', 'CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS',
      'INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI', 'PERDU', 'REPORTE', 'SPAM',
    ]),
    source: z.string(),
    score_chaud: z.number(),
    created_at: z.string(),
  })
  .openapi('Lead')

const LeadCreateSchema = z
  .object({
    prenom: z.string().min(1).max(100),
    nom: z.string().min(1).max(100),
    email: z.string().email().optional(),
    telephone: z.string().optional(),
    source: z.string().default('formulaire'),
    sujet: z.string().optional(),
    message: z.string().optional(),
  })
  .openapi('LeadCreate')

const LeadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ description: 'Numero de page' }),
  limit: z.coerce.number().int().min(1).max(100).default(20).openapi({ description: 'Resultats par page' }),
  statut: z.string().optional().openapi({ description: 'Filtrer par statut' }),
  search: z.string().optional().openapi({ description: 'Recherche full-text' }),
})

// ---------- Route definitions ----------

const listLeads = createRoute({
  method: 'get',
  path: '/',
  tags: ['Leads'],
  summary: 'Lister les leads avec pagination et filtres',
  request: {
    query: LeadListQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ data: z.array(LeadResponseSchema), total: z.number(), page: z.number() }) } },
      description: 'Liste paginee des leads',
    },
  },
})

const getLead = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Leads'],
  summary: 'Recuperer un lead par ID',
  request: { params: LeadParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: LeadResponseSchema } },
      description: 'Lead trouve',
    },
    404: {
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
      description: 'Lead non trouve',
    },
  },
})

const createLead = createRoute({
  method: 'post',
  path: '/',
  tags: ['Leads'],
  summary: 'Creer un nouveau lead',
  request: {
    body: {
      content: { 'application/json': { schema: LeadCreateSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: LeadResponseSchema } },
      description: 'Lead cree',
    },
    422: {
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
      description: 'Donnees invalides',
    },
  },
})

// ---------- App ----------

const leads = new OpenAPIHono<AuthEnv>()

// GET /api/leads
leads.openapi(listLeads, async (c) => {
  const { page, limit, statut, search } = c.req.valid('query')
  const supabase = c.var.supabase
  const offset = (page - 1) * limit

  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (statut) query = query.eq('statut', statut)
  if (search) query = query.textSearch('fts', search)

  const { data, count, error } = await query

  if (error) throw new Error(error.message)

  return c.json({ data: data ?? [], total: count ?? 0, page }, 200)
})

// GET /api/leads/:id
leads.openapi(getLead, async (c) => {
  const { id } = c.req.valid('param')
  const supabase = c.var.supabase

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return c.json({ error: 'Lead non trouve' }, 404)
  }

  return c.json(data, 200)
})

// POST /api/leads
leads.openapi(createLead, async (c) => {
  const body = c.req.valid('json')
  const supabase = c.var.supabase

  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...body,
      statut: 'NOUVEAU',
      priorite: 'NORMALE',
      score_chaud: 20,
    })
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 422)
  }

  // Logger l'activite (non-bloquant)
  supabase.from('activites').insert({
    type: 'LEAD_CREE',
    lead_id: data.id,
    description: `Lead cree via API — ${data.prenom} ${data.nom}`,
    auteur_id: c.var.userId,
  }).then(() => {})

  return c.json(data, 201)
})

// PUT /api/leads/:id — Mettre à jour un lead
leads.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = c.var.supabase

  const { data, error } = await supabase
    .from('leads')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 422)

  return c.json(data, 200)
})

// PATCH /api/leads/:id/status — Changer le statut (avec state machine)
leads.patch('/:id/status', async (c) => {
  const id = c.req.param('id')
  const { statut, notes } = await c.req.json()
  const supabase = c.var.supabase
  const userId = c.var.userId

  // Vérifier le lead actuel
  const { data: current, error: fetchErr } = await supabase
    .from('leads')
    .select('statut')
    .eq('id', id)
    .single()

  if (fetchErr || !current) return c.json({ error: 'Lead non trouvé' }, 404)

  // Valider la transition via state machine
  const { validateLeadTransition } = await import('@/lib/validators')
  const transitionError = validateLeadTransition(current.statut as never, statut as never)
  if (transitionError) return c.json({ error: transitionError }, 422)

  // Appliquer
  const { error: updateErr } = await supabase
    .from('leads')
    .update({ statut, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateErr) return c.json({ error: updateErr.message }, 500)

  // Logger (non-bloquant)
  supabase.from('activites').insert({
    type: 'STATUT_CHANGE',
    lead_id: id,
    user_id: userId,
    description: `Statut changé : ${current.statut} → ${statut}${notes ? ` — ${notes}` : ''}`,
    ancien_statut: current.statut,
    nouveau_statut: statut,
  }).then(() => {})

  return c.json({ success: true, id, statut }, 200)
})

// DELETE /api/leads/:id — Soft delete (statut SPAM)
leads.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = c.var.supabase

  const { error } = await supabase
    .from('leads')
    .update({ statut: 'SPAM', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return c.json({ error: error.message }, 500)

  supabase.from('activites').insert({
    type: 'STATUT_CHANGE',
    lead_id: id,
    user_id: c.var.userId,
    description: 'Lead supprimé (soft delete → SPAM)',
    nouveau_statut: 'SPAM',
  }).then(() => {})

  return c.json({ success: true }, 200)
})

export default leads
