// ============================================================
// Routes v1 — /api/v1/leads
// Thin HTTP layer: parse request → call use case → return result.
// No business logic in routes. No Supabase imports.
// ============================================================

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { AuthEnv } from '../../middleware'
import { createContainer } from '../../infrastructure/container'
import { createLead, changeLeadStatus, qualifyLead, assignLead } from '../../application/use-cases/leads'
import { Pagination } from '../../domain/shared/value-objects'

// --- Schemas ---

const LeadResponseSchema = z.object({
  id: z.string().uuid(),
  prenom: z.string(),
  nom: z.string().nullable(),
  email: z.string().nullable(),
  telephone: z.string().nullable(),
  statut: z.string(),
  source: z.string(),
  priorite: z.string(),
  score_chaud: z.number(),
  formation_principale_id: z.string().nullable(),
  commercial_assigne_id: z.string().nullable(),
  nb_contacts: z.number(),
  tags: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
}).openapi('LeadV1')

const ErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
}).openapi('ErrorV1')

const LeadCreateSchema = z.object({
  prenom: z.string().min(1).max(100),
  nom: z.string().max(100).optional(),
  email: z.string().email().max(254).optional(),
  telephone: z.string().max(20).optional(),
  source: z.enum([
    'formulaire', 'whatsapp', 'telephone', 'instagram', 'facebook',
    'google', 'bouche_a_oreille', 'partenariat', 'ancien_stagiaire',
    'site_web', 'salon', 'autre',
  ]).default('formulaire'),
  sujet: z.string().optional(),
  message: z.string().max(5000).optional(),
  formation_principale_id: z.string().uuid().optional(),
}).openapi('LeadCreateV1')

const StatusChangeSchema = z.object({
  status: z.enum([
    'NOUVEAU', 'CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS',
    'INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI', 'PERDU', 'REPORTE', 'SPAM',
  ]),
  reason: z.string().max(500).optional(),
}).openapi('StatusChangeV1')

const QualifySchema = z.object({
  statut_pro: z.string().optional(),
  experience_esthetique: z.string().optional(),
  formation_principale_id: z.string().uuid().optional(),
  formations_interessees: z.array(z.string()).optional(),
  financement_souhaite: z.boolean().optional(),
  organisme_financement: z.string().optional(),
  objectif_pro: z.string().optional(),
}).openapi('QualifyLeadV1')

const AssignSchema = z.object({
  commercial_id: z.string().uuid(),
}).openapi('AssignLeadV1')

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  statut: z.string().optional(),
  source: z.string().optional(),
  commercial_id: z.string().optional(),
  search: z.string().optional(),
  score_min: z.coerce.number().optional(),
  score_max: z.coerce.number().optional(),
})

// --- Route definitions ---

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Leads v1'],
  summary: 'Lister les leads avec pagination et filtres',
  request: { query: ListQuerySchema },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(LeadResponseSchema),
            total: z.number(),
            page: z.number(),
            pages: z.number(),
          }),
        },
      },
      description: 'Liste paginee',
    },
  },
})

const getRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Leads v1'],
  summary: 'Recuperer un lead par ID',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: { content: { 'application/json': { schema: LeadResponseSchema } }, description: 'Lead' },
    404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
  },
})

const createRoute_ = createRoute({
  method: 'post',
  path: '/',
  tags: ['Leads v1'],
  summary: 'Creer un lead',
  request: {
    body: { content: { 'application/json': { schema: LeadCreateSchema } }, required: true },
  },
  responses: {
    201: { content: { 'application/json': { schema: z.object({ id: z.string(), action: z.string() }) } }, description: 'Cree' },
    422: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Validation error' },
    409: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Duplicate' },
  },
})

const statusRoute = createRoute({
  method: 'patch',
  path: '/{id}/status',
  tags: ['Leads v1'],
  summary: 'Changer le statut d\'un lead',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: StatusChangeSchema } }, required: true },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ from: z.string(), to: z.string() }) } }, description: 'Statut change' },
    422: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Transition invalide' },
  },
})

const qualifyRoute = createRoute({
  method: 'patch',
  path: '/{id}/qualify',
  tags: ['Leads v1'],
  summary: 'Qualifier un lead (profil + score)',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: QualifySchema } }, required: true },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ score: z.number(), statut: z.string(), auto_qualified: z.boolean() }) } }, description: 'Qualifie' },
  },
})

const assignRoute = createRoute({
  method: 'patch',
  path: '/{id}/assign',
  tags: ['Leads v1'],
  summary: 'Assigner un commercial',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: AssignSchema } }, required: true },
  },
  responses: {
    200: { content: { 'application/json': { schema: z.object({ lead_id: z.string(), commercial_id: z.string() }) } }, description: 'Assigne' },
    403: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Forbidden' },
  },
})

// --- App ---

const leads = new OpenAPIHono<AuthEnv>()

// Helper: build container from Hono context
function containerFrom(c: { var: { supabase: unknown; userId: string; user: unknown } }) {
  return createContainer(
    c.var.supabase as never,
    c.var.userId,
    null // Role will be fetched in use case if needed
  )
}

// Helper: send Result as HTTP response
function sendResult(c: { json: (data: unknown, status: number) => unknown }, result: { ok: boolean; data?: unknown; error?: unknown; status?: number }) {
  if (result.ok) return c.json(result.data, 200)
  return c.json({ error: result.error }, (result as { status: number }).status || 400)
}

// GET /api/v1/leads
leads.openapi(listRoute, (async (c: any) => {
  const { page, limit, statut, source, commercial_id, search, score_min, score_max } = c.req.valid('query')
  const container = containerFrom(c)
  const pagination = Pagination.create(page, limit)

  const result = await container.leadRepo.findMany(
    { statut, source, commercial_id, search, score_min, score_max },
    pagination
  )

  if (!result.ok) return c.json({ error: result.error }, result.status)

  return c.json({
    data: result.data.data,
    total: result.data.total,
    page,
    pages: pagination.totalPages(result.data.total),
  }, 200)
}) as any)

// GET /api/v1/leads/:id
leads.openapi(getRoute, (async (c: any) => {
  const { id } = c.req.valid('param')
  const container = containerFrom(c)

  const result = await container.leadRepo.findById(id)
  if (!result.ok) return c.json({ error: result.error }, result.status)
  return c.json(result.data, 200)
}) as any)

// POST /api/v1/leads
leads.openapi(createRoute_, (async (c: any) => {
  const body = c.req.valid('json')
  const container = containerFrom(c)

  const result = await createLead(body, container)
  if (!result.ok) return c.json({ error: result.error }, result.status)
  return c.json(result.data, 201)
}) as any)

// PATCH /api/v1/leads/:id/status
leads.openapi(statusRoute, (async (c: any) => {
  const { id } = c.req.valid('param')
  const { status, reason } = c.req.valid('json')
  const container = containerFrom(c)

  const result = await changeLeadStatus(
    { lead_id: id, new_status: status, reason },
    container
  )
  if (!result.ok) return c.json({ error: result.error }, result.status)
  return c.json(result.data, 200)
}) as any)

// PATCH /api/v1/leads/:id/qualify
leads.openapi(qualifyRoute, (async (c: any) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const container = containerFrom(c)

  const result = await qualifyLead({ lead_id: id, ...body }, container)
  if (!result.ok) return c.json({ error: result.error }, result.status)
  return c.json(result.data, 200)
}) as any)

// PATCH /api/v1/leads/:id/assign
leads.openapi(assignRoute, (async (c: any) => {
  const { id } = c.req.valid('param')
  const { commercial_id } = c.req.valid('json')
  const container = containerFrom(c)

  const result = await assignLead({ lead_id: id, commercial_id }, container)
  if (!result.ok) return c.json({ error: result.error }, result.status)
  return c.json(result.data, 200)
}) as any)

export default leads
