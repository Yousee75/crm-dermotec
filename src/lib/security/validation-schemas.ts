// ============================================================
// CRM DERMOTEC — Schemas Zod centralisés pour toutes les mutations
// Chaque input utilisateur DOIT passer par un de ces schemas
// ============================================================

import { z } from 'zod'

// ===== Primitifs sécurisés =====

/** String sécurisée — bloque scripts, event handlers, injections */
export const SafeString = z.string()
  .max(500, 'Trop long (max 500 caractères)')
  .refine(s => !/<script/i.test(s), 'Contenu non autorisé')
  .refine(s => !/javascript:/i.test(s), 'Contenu non autorisé')
  .refine(s => !/on\w+\s*=/i.test(s), 'Contenu non autorisé')

/** Email validé + nettoyé */
export const SafeEmail = z.string()
  .email('Email invalide')
  .max(254, 'Email trop long')
  .toLowerCase()
  .trim()

/** Téléphone format FR */
export const SafePhone = z.string()
  .regex(/^(\+33|0)[0-9\s.\-]{8,14}$/, 'Téléphone invalide (format français)')
  .optional()
  .nullable()

/** UUID strict */
export const SafeUUID = z.string().uuid('ID invalide')

/** URL sécurisée */
export const SafeUrl = z.string()
  .url('URL invalide')
  .refine(url => {
    try {
      const parsed = new URL(url)
      return ['https:', 'http:'].includes(parsed.protocol)
    } catch { return false }
  }, 'Protocol non autorisé')
  .refine(url => !url.includes('javascript:'), 'URL dangereuse')
  .optional()

/** SIRET (14 chiffres) */
export const SafeSIRET = z.string()
  .regex(/^[0-9]{14}$/, 'SIRET invalide (14 chiffres)')
  .optional()
  .nullable()

/** Montant positif */
export const SafeAmount = z.number()
  .min(0, 'Montant négatif impossible')
  .max(1_000_000, 'Montant trop élevé')
  .finite('Montant invalide')

/** Notes/texte long — sanitisé */
export const SafeNotes = z.string()
  .max(5000, 'Notes trop longues (max 5000 caractères)')
  .optional()
  .nullable()

// ===== Schemas métier CRM =====

/** Création de lead */
export const CreateLeadSchema = z.object({
  prenom: SafeString.min(1, 'Prénom requis').max(100),
  nom: z.string().max(100).optional().nullable(),
  email: SafeEmail.optional().nullable(),
  telephone: SafePhone,
  whatsapp: z.string().max(20).optional().nullable(),
  source: z.enum([
    'formulaire', 'whatsapp', 'telephone', 'instagram', 'facebook',
    'google', 'bouche_a_oreille', 'partenariat', 'ancien_stagiaire',
    'site_web', 'salon', 'autre'
  ]).default('formulaire'),
  sujet: z.enum(['formation', 'financement', 'eshop', 'partenariat', 'modele', 'autre']).optional(),
  message: z.string().max(2000).optional(),
  formation_principale_id: SafeUUID.optional().nullable(),
  statut_pro: z.enum([
    'salariee', 'independante', 'auto_entrepreneur', 'demandeur_emploi',
    'reconversion', 'etudiante', 'gerant_institut', 'autre'
  ]).optional().nullable(),
  financement_souhaite: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10).default([]),
  notes: SafeNotes,
})

/** Mise à jour lead (partiel) */
export const UpdateLeadSchema = CreateLeadSchema.partial().extend({
  id: SafeUUID,
})

/** Changement de statut lead */
export const ChangeStatutSchema = z.object({
  id: SafeUUID,
  statut: z.enum([
    'NOUVEAU', 'CONTACTE', 'QUALIFIE', 'FINANCEMENT_EN_COURS',
    'INSCRIT', 'EN_FORMATION', 'FORME', 'ALUMNI',
    'PERDU', 'REPORTE', 'SPAM'
  ]),
  notes: z.string().max(500).optional(),
})

/** Création inscription */
export const CreateInscriptionSchema = z.object({
  lead_id: SafeUUID,
  session_id: SafeUUID,
  montant_total: SafeAmount,
  montant_finance: SafeAmount.default(0),
  mode_paiement: z.enum(['carte', 'virement', 'especes', 'financement', 'cheque', 'mixte']).optional(),
})

/** Création session */
export const CreateSessionSchema = z.object({
  formation_id: SafeUUID,
  date_debut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
  date_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide'),
  horaire_debut: z.string().default('09:00'),
  horaire_fin: z.string().default('17:00'),
  salle: z.string().max(100).default('Salle 1'),
  adresse: z.string().max(200).default('75 Boulevard Richard Lenoir, 75011 Paris'),
  formatrice_id: SafeUUID.optional().nullable(),
  places_max: z.number().int().min(1).max(20).default(6),
  notes: SafeNotes,
})

/** Création rappel */
export const CreateRappelSchema = z.object({
  lead_id: SafeUUID.optional().nullable(),
  session_id: SafeUUID.optional().nullable(),
  date_rappel: z.string().datetime({ message: 'Date invalide (format ISO 8601)' }),
  type: z.enum(['APPEL', 'EMAIL', 'WHATSAPP', 'SMS', 'RDV', 'RELANCE', 'SUIVI', 'ADMIN']),
  titre: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  priorite: z.enum(['URGENTE', 'HAUTE', 'NORMALE', 'BASSE']).default('NORMALE'),
})

/** Création financement */
export const CreateFinancementSchema = z.object({
  lead_id: SafeUUID,
  organisme: z.enum([
    'OPCO_EP', 'AKTO', 'FAFCEA', 'FIFPL', 'FRANCE_TRAVAIL', 'CPF',
    'AGEFIPH', 'MISSIONS_LOCALES', 'REGION', 'EMPLOYEUR', 'TRANSITIONS_PRO', 'AUTRE'
  ]),
  montant_demande: SafeAmount.optional(),
  numero_dossier: z.string().max(100).optional(),
  notes: SafeNotes,
})

/** Envoi email */
export const SendEmailSchema = z.object({
  to: SafeEmail,
  template_slug: z.string().max(100).regex(/^[a-z0-9\-]+$/, 'Slug invalide'),
  variables: z.record(z.string().max(1000)).default({}),
  lead_id: SafeUUID.optional(),
})

/** Webhook formulaire (public, plus permissif mais validé) */
export const WebhookFormSchema = z.object({
  prenom: z.string().min(1).max(100).trim(),
  nom: z.string().max(100).optional(),
  email: z.string().email().max(254).toLowerCase().trim().optional(),
  telephone: z.string().max(20).optional(),
  message: z.string().max(2000).optional(),
  formation: z.string().max(200).optional(),
  source: z.string().max(50).default('formulaire'),
  // Honeypot anti-spam
  website: z.string().max(0, 'Spam détecté').optional(),
  // UTM tracking
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
})

/** Message AI */
export const AIMessageSchema = z.object({
  message: z.string().min(1, 'Message requis').max(4000, 'Message trop long (max 4000 caractères)'),
  lead_id: SafeUUID.optional(),
  conversation_id: z.string().max(100).optional(),
})

// ===== Helpers =====

/** Valide un input et retourne le résultat typé ou throw */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }))
    throw new ValidationError('Données invalides', errors)
  }
  return result.data
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
