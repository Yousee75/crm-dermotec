// ============================================================
// DOCUSEAL — Signature électronique (remplace Yousign ~49€/mois)
// https://www.docuseal.com/docs/api
// ============================================================

const DOCUSEAL_API_URL = process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com'
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY

// Lazy init — silent skip si non configuré
function getHeaders() {
  if (!DOCUSEAL_API_KEY) return null
  return {
    'X-Auth-Token': DOCUSEAL_API_KEY,
    'Content-Type': 'application/json',
  }
}

// ── Types ──────────────────────────────────────────────────

export interface DocuSealTemplate {
  id: number
  name: string
  created_at: string
  updated_at: string
  fields: DocuSealField[]
  schema: unknown[]
}

export interface DocuSealField {
  name: string
  type: string
  required: boolean
}

export interface DocuSealSubmission {
  id: number
  status: 'pending' | 'completed' | 'expired'
  created_at: string
  updated_at: string
  completed_at: string | null
  source: string
  submitters: DocuSealSubmitter[]
  template: { id: number; name: string }
  audit_log_url: string | null
}

export interface DocuSealSubmitter {
  id: number
  email: string
  name: string | null
  role: string
  status: 'pending' | 'opened' | 'completed'
  completed_at: string | null
  documents: DocuSealDocument[]
  values: Record<string, string>
}

export interface DocuSealDocument {
  name: string
  url: string
}

export interface CreateSubmissionParams {
  template_id: number
  send_email?: boolean
  submitters: {
    email: string
    name?: string
    role?: string
    fields?: { name: string; default_value: string }[]
  }[]
  message?: {
    subject?: string
    body?: string
  }
}

// ── API Client ─────────────────────────────────────────────

async function docusealFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  const headers = getHeaders()
  if (!headers) {
    return null
  }

  const res = await fetch(`${DOCUSEAL_API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  })

  if (!res.ok) {
    console.error(`[DocuSeal] Erreur ${res.status}: ${await res.text()}`)
    return null
  }

  return res.json()
}

// ── Templates ──────────────────────────────────────────────

/** Lister tous les templates */
export async function listTemplates(): Promise<DocuSealTemplate[]> {
  const result = await docusealFetch<{ data: DocuSealTemplate[] }>('/templates')
  return result?.data ?? []
}

/** Récupérer un template par ID */
export async function getTemplate(id: number): Promise<DocuSealTemplate | null> {
  return docusealFetch<DocuSealTemplate>(`/templates/${id}`)
}

// ── Submissions (envois de signature) ──────────────────────

/** Créer une soumission (envoyer un document à signer) */
export async function createSubmission(params: CreateSubmissionParams): Promise<DocuSealSubmission | null> {
  return docusealFetch<DocuSealSubmission>('/submissions', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/** Récupérer une soumission par ID */
export async function getSubmission(id: number): Promise<DocuSealSubmission | null> {
  return docusealFetch<DocuSealSubmission>(`/submissions/${id}`)
}

/** Lister les soumissions (avec pagination) */
export async function listSubmissions(params?: {
  template_id?: number
  status?: 'pending' | 'completed' | 'expired'
  limit?: number
  after?: number
}): Promise<DocuSealSubmission[]> {
  const searchParams = new URLSearchParams()
  if (params?.template_id) searchParams.set('template_id', String(params.template_id))
  if (params?.status) searchParams.set('status', params.status)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.after) searchParams.set('after', String(params.after))

  const query = searchParams.toString()
  const result = await docusealFetch<{ data: DocuSealSubmission[] }>(`/submissions${query ? `?${query}` : ''}`)
  return result?.data ?? []
}

// ── Helpers métier CRM ─────────────────────────────────────

/** Envoyer une convention de formation à signer */
export async function envoyerConventionSignature(params: {
  templateId: number
  stagiaire: { email: string; nom: string; prenom: string }
  formation: { nom: string; dates: string; lieu: string; prix_ttc: string }
  centre: { nom: string; email: string }
}): Promise<DocuSealSubmission | null> {
  return createSubmission({
    template_id: params.templateId,
    send_email: true,
    message: {
      subject: `Convention de formation — ${params.formation.nom}`,
      body: `Bonjour ${params.stagiaire.prenom},\n\nVeuillez signer la convention de formation pour "${params.formation.nom}".\n\nCordialement,\n${params.centre.nom}`,
    },
    submitters: [
      {
        email: params.stagiaire.email,
        name: `${params.stagiaire.prenom} ${params.stagiaire.nom}`,
        role: 'Stagiaire',
        fields: [
          { name: 'nom_stagiaire', default_value: `${params.stagiaire.prenom} ${params.stagiaire.nom}` },
          { name: 'formation', default_value: params.formation.nom },
          { name: 'dates', default_value: params.formation.dates },
          { name: 'lieu', default_value: params.formation.lieu },
          { name: 'prix_ttc', default_value: params.formation.prix_ttc },
        ],
      },
      {
        email: params.centre.email,
        name: params.centre.nom,
        role: 'Centre de formation',
      },
    ],
  })
}

/** Envoyer un certificat de fin de formation à signer */
export async function envoyerCertificatSignature(params: {
  templateId: number
  stagiaire: { email: string; nom: string; prenom: string }
  formation: { nom: string; date_fin: string }
  formatrice: { email: string; nom: string }
}): Promise<DocuSealSubmission | null> {
  return createSubmission({
    template_id: params.templateId,
    send_email: true,
    message: {
      subject: `Certificat de formation — ${params.formation.nom}`,
      body: `Bonjour ${params.stagiaire.prenom},\n\nFélicitations ! Votre certificat de formation est prêt.\n\nVeuillez le signer pour validation.`,
    },
    submitters: [
      {
        email: params.stagiaire.email,
        name: `${params.stagiaire.prenom} ${params.stagiaire.nom}`,
        role: 'Stagiaire',
        fields: [
          { name: 'nom_stagiaire', default_value: `${params.stagiaire.prenom} ${params.stagiaire.nom}` },
          { name: 'formation', default_value: params.formation.nom },
          { name: 'date_fin', default_value: params.formation.date_fin },
        ],
      },
      {
        email: params.formatrice.email,
        name: params.formatrice.nom,
        role: 'Formatrice',
      },
    ],
  })
}

/** Vérifier si DocuSeal est configuré */
export function isDocuSealConfigured(): boolean {
  return !!DOCUSEAL_API_KEY
}
