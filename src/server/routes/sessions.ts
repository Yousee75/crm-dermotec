// ============================================================
// Routes Hono — /api/sessions
// ============================================================

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { type AuthEnv } from '../middleware'

const SessionSchema = z
  .object({
    id: z.string().uuid(),
    formation_id: z.string().uuid(),
    date_debut: z.string(),
    date_fin: z.string(),
    statut: z.enum([
      'BROUILLON', 'PLANIFIEE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'REPORTEE',
    ]),
    lieu: z.string().nullable(),
    places_max: z.number(),
    places_restantes: z.number(),
  })
  .openapi('Session')

const listSessions = createRoute({
  method: 'get',
  path: '/',
  tags: ['Sessions'],
  summary: 'Lister les sessions de formation',
  request: {
    query: z.object({
      statut: z.string().optional(),
      formation_id: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ data: z.array(SessionSchema) }) } },
      description: 'Liste des sessions',
    },
  },
})

const autoTransition = createRoute({
  method: 'post',
  path: '/auto-transition',
  tags: ['Sessions'],
  summary: 'Transitions automatiques des sessions (cron)',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            transitioned: z.number(),
            started: z.number(),
            ended: z.number(),
            date: z.string(),
          }),
        },
      },
      description: 'Resultat des transitions',
    },
  },
})

// ---------- App ----------

const sessions = new OpenAPIHono<AuthEnv>()

sessions.openapi(listSessions, async (c) => {
  const { statut, formation_id } = c.req.valid('query')
  const supabase = c.var.supabase

  let query = supabase
    .from('sessions')
    .select('*, formation:formations(nom)')
    .order('date_debut', { ascending: true })

  if (statut) query = query.eq('statut', statut)
  if (formation_id) query = query.eq('formation_id', formation_id)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return c.json({ data: data ?? [] }, 200)
})

sessions.openapi(autoTransition, async (c) => {
  const supabase = c.var.supabase
  const today = new Date().toISOString().split('T')[0]
  let transitioned = 0

  // CONFIRMEE -> EN_COURS
  const { data: toStart } = await supabase
    .from('sessions')
    .select('id, formation_id')
    .eq('statut', 'CONFIRMEE')
    .lte('date_debut', today)
    .gte('date_fin', today)

  if (toStart?.length) {
    const ids = toStart.map((s) => s.id)
    await supabase.from('sessions').update({ statut: 'EN_COURS' }).in('id', ids)
    transitioned += ids.length

    await supabase.from('activites').insert(
      toStart.map((s) => ({
        type: 'SESSION' as const,
        session_id: s.id,
        description: 'Transition automatique : session demarree',
        metadata: { auto: true, trigger: 'hono_cron' },
      }))
    )
  }

  // EN_COURS -> TERMINEE
  const { data: toEnd } = await supabase
    .from('sessions')
    .select('id, formation_id')
    .eq('statut', 'EN_COURS')
    .lt('date_fin', today)

  if (toEnd?.length) {
    const ids = toEnd.map((s) => s.id)
    await supabase.from('sessions').update({ statut: 'TERMINEE' }).in('id', ids)
    transitioned += ids.length

    await supabase.from('activites').insert(
      toEnd.map((s) => ({
        type: 'SESSION' as const,
        session_id: s.id,
        description: 'Transition automatique : session terminee',
        metadata: { auto: true, trigger: 'hono_cron' },
      }))
    )
  }

  return c.json({
    success: true,
    transitioned,
    started: toStart?.length ?? 0,
    ended: toEnd?.length ?? 0,
    date: today,
  }, 200)
})

export default sessions
