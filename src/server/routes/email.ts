// ============================================================
// Routes Hono — /api/email
// ============================================================

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Resend } from 'resend'
import { type AuthEnv } from '../middleware'
import { isDisposableEmail } from '@/lib/disposable-emails'

const SendEmailSchema = z
  .object({
    to: z.string().email(),
    template_slug: z.string().min(1),
    variables: z.record(z.string()),
    lead_id: z.string().uuid().optional(),
  })
  .openapi('SendEmail')

const EmailResponseSchema = z
  .object({
    success: z.boolean(),
    email_id: z.string().nullable(),
    message: z.string(),
    template_utilise: z.string().optional(),
  })
  .openapi('EmailResponse')

const TemplateSchema = z
  .object({
    id: z.string().uuid(),
    nom: z.string(),
    slug: z.string(),
    sujet: z.string(),
    variables: z.array(z.string()).nullable(),
    categorie: z.string().nullable(),
  })
  .openapi('EmailTemplate')

// ---------- Route definitions ----------

const sendEmail = createRoute({
  method: 'post',
  path: '/send',
  tags: ['Email'],
  summary: 'Envoyer un email via template',
  request: {
    body: { content: { 'application/json': { schema: SendEmailSchema } }, required: true },
  },
  responses: {
    200: { content: { 'application/json': { schema: EmailResponseSchema } }, description: 'Email envoye' },
    400: { content: { 'application/json': { schema: z.object({ error: z.string() }) } }, description: 'Erreur de validation' },
  },
})

const listTemplates = createRoute({
  method: 'get',
  path: '/templates',
  tags: ['Email'],
  summary: 'Lister les templates email actifs',
  request: {
    query: z.object({ categorie: z.string().optional() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ templates: z.array(TemplateSchema), total: z.number() }) } },
      description: 'Liste des templates',
    },
  },
})

// ---------- App ----------

let resend: Resend | null = null
function getResend(): Resend | null {
  if (resend) return resend
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  resend = new Resend(key)
  return resend
}

const email = new OpenAPIHono<AuthEnv>()

email.openapi(sendEmail, async (c) => {
  const body = c.req.valid('json')
  const supabase = c.var.supabase

  if (isDisposableEmail(body.to)) {
    return c.json({ error: 'Adresse email non acceptee' }, 400)
  }

  // Recuperer le template
  const { data: template, error: tplErr } = await supabase
    .from('email_templates')
    .select('*')
    .eq('slug', body.template_slug)
    .eq('is_active', true)
    .single()

  if (tplErr || !template) {
    return c.json({ error: `Template '${body.template_slug}' non trouve ou inactif` }, 400)
  }

  // Remplacer les variables
  let sujet = template.sujet as string
  let contenuHtml = template.contenu_html as string
  let contenuText = (template.contenu_text as string) || ''

  for (const [key, value] of Object.entries(body.variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    sujet = sujet.replace(pattern, value)
    contenuHtml = contenuHtml.replace(pattern, value)
    contenuText = contenuText.replace(pattern, value)
  }

  // Envoyer via Resend
  const r = getResend()
  if (!r) return c.json({ error: 'Service email non configure' }, 400)

  const { data: emailData, error: emailError } = await r.emails.send({
    from: 'Dermotec Formation <formation@dermotec.fr>',
    to: body.to,
    subject: sujet,
    html: contenuHtml,
    text: contenuText || undefined,
    headers: {
      'X-Template-Slug': body.template_slug,
      'X-Lead-ID': body.lead_id || '',
    },
  })

  if (emailError) {
    return c.json({ error: "Erreur lors de l'envoi" }, 400)
  }

  // Logger (non-bloquant)
  if (body.lead_id) {
    supabase.from('activites').insert({
      type: 'EMAIL',
      lead_id: body.lead_id,
      description: `Email envoye: ${sujet}`,
      auteur_id: c.var.userId,
      metadata: { template_slug: body.template_slug, email_id: emailData?.id, destinataire: body.to },
    }).then(() => {})
  }

  return c.json({
    success: true,
    email_id: emailData?.id ?? null,
    message: 'Email envoye avec succes',
    template_utilise: template.nom as string,
  }, 200)
})

email.openapi(listTemplates, async (c) => {
  const { categorie } = c.req.valid('query')
  const supabase = c.var.supabase

  let query = supabase
    .from('email_templates')
    .select('id, nom, slug, sujet, variables, categorie')
    .eq('is_active', true)

  if (categorie) query = query.eq('categorie', categorie)

  const { data, error } = await query.order('nom')
  if (error) throw new Error(error.message)

  return c.json({ templates: data ?? [], total: data?.length ?? 0 }, 200)
})

export default email
