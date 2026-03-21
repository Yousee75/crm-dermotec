// ============================================================
// CRM DERMOTEC — Validateurs formulaire inscription publique
// ============================================================

import { z } from 'zod'
import { validateEmail, validatePhone, validateSiret } from './validators'
import type { TypeFinancementInscription } from '@/types'

// Validateurs Zod personnalisés
const emailValidator = z.string().refine((val) => validateEmail(val) === null, {
  message: 'Adresse email invalide ou jetable non acceptée'
})

const phoneValidator = z.string().refine((val) => validatePhone(val) === null, {
  message: 'Téléphone invalide (format FR : 0X XX XX XX XX)'
})

const siretValidator = z.string().refine((val) => validateSiret(val) === null, {
  message: 'SIRET invalide (14 chiffres requis)'
})

const cpfValidator = z.string().refine((val) => {
  if (!val) return false
  const cleaned = val.replace(/[\s-]/g, '')
  return /^\d{11}$/.test(cleaned)
}, {
  message: 'Numéro CPF invalide (11 chiffres requis)'
})

const dateNaissanceValidator = z.string().refine((val) => {
  if (!val) return false
  const date = new Date(val)
  if (isNaN(date.getTime())) return false

  const today = new Date()
  const age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()
  const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
    ? age - 1
    : age

  return finalAge >= 16 && finalAge <= 99
}, {
  message: 'Date de naissance invalide (âge requis : 16-99 ans)'
})

// Schéma de base commun à tous les types de financement
const baseInscriptionSchema = z.object({
  // Identité
  civilite: z.enum(['Mme', 'M.'], {
    required_error: 'Veuillez sélectionner votre civilité'
  }),
  prenom: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne doit pas dépasser 50 caractères'),
  nom: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne doit pas dépasser 50 caractères'),
  email: emailValidator,
  telephone: phoneValidator,
  date_naissance: dateNaissanceValidator.optional(),

  // Adresse
  adresse: z.object({
    rue: z.string()
      .min(5, 'Adresse trop courte')
      .max(200, 'Adresse trop longue')
      .optional(),
    code_postal: z.string()
      .regex(/^(0[1-9]|[1-8]\d|9[0-8])\d{3}$/, 'Code postal invalide')
      .optional(),
    ville: z.string()
      .min(2, 'Ville trop courte')
      .max(100, 'Ville trop longue')
      .optional()
  }).optional(),

  // Profil professionnel
  statut_pro: z.enum([
    'salariee',
    'independante',
    'auto_entrepreneur',
    'demandeur_emploi',
    'reconversion',
    'etudiante',
    'gerant_institut',
    'autre'
  ], {
    required_error: 'Veuillez sélectionner votre statut professionnel'
  }),
  experience_esthetique: z.enum([
    'aucune',
    'debutante',
    'intermediaire',
    'confirmee',
    'experte'
  ], {
    required_error: 'Veuillez indiquer votre niveau d\'expérience'
  }),
  objectif_pro: z.string()
    .max(500, 'L\'objectif professionnel ne doit pas dépasser 500 caractères')
    .optional(),

  // Formation
  formation_id: z.string().min(1, 'Veuillez sélectionner une formation'),
  session_id: z.string().min(1, 'Veuillez sélectionner une session').optional(),

  // Type de financement
  type_financement: z.enum([
    'personnel',
    'opco',
    'cpf',
    'france_travail',
    'employeur',
    'autre'
  ], {
    required_error: 'Veuillez sélectionner votre mode de financement'
  }),

  // Consentements
  rgpd_consent: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter la politique de confidentialité'
  }),
  reglement_interieur_accepte: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter le règlement intérieur'
  })
})

// Schémas conditionnels selon le type de financement
const opcoSchema = baseInscriptionSchema.extend({
  type_financement: z.literal('opco'),
  opco_employeur_nom: z.string()
    .min(2, 'Nom de l\'employeur requis')
    .max(100, 'Nom trop long'),
  opco_employeur_siret: siretValidator,
  opco_organisme: z.enum([
    'OPCO_EP',
    'AKTO',
    'FAFCEA',
    'FIFPL',
    'TRANSITIONS_PRO'
  ], {
    required_error: 'Veuillez sélectionner votre OPCO'
  }),
  opco_contact_rh_email: emailValidator.optional()
})

const cpfSchema = baseInscriptionSchema.extend({
  type_financement: z.literal('cpf'),
  cpf_numero: cpfValidator
})

const franceTravailSchema = baseInscriptionSchema.extend({
  type_financement: z.literal('france_travail'),
  ft_identifiant: z.string()
    .min(8, 'Identifiant France Travail requis (8 caractères minimum)')
    .max(20, 'Identifiant trop long'),
  ft_agence: z.string()
    .min(2, 'Nom de l\'agence requis')
    .max(100, 'Nom d\'agence trop long'),
  ft_conseiller: z.string()
    .max(100, 'Nom du conseiller trop long')
    .optional()
})

const employeurSchema = baseInscriptionSchema.extend({
  type_financement: z.literal('employeur'),
  emp_nom: z.string()
    .min(2, 'Nom de l\'employeur requis')
    .max(100, 'Nom trop long'),
  emp_siret: siretValidator,
  emp_contact: z.string()
    .max(100, 'Nom du contact trop long')
    .optional()
})

const personnelSchema = baseInscriptionSchema.extend({
  type_financement: z.literal('personnel')
})

const autreSchema = baseInscriptionSchema.extend({
  type_financement: z.literal('autre')
})

// Fonction qui retourne le bon schéma selon le type de financement
export function getInscriptionSchema(type_financement: TypeFinancementInscription) {
  switch (type_financement) {
    case 'opco':
      return opcoSchema
    case 'cpf':
      return cpfSchema
    case 'france_travail':
      return franceTravailSchema
    case 'employeur':
      return employeurSchema
    case 'personnel':
      return personnelSchema
    case 'autre':
      return autreSchema
    default:
      return baseInscriptionSchema
  }
}

// Export du schéma de base pour l'usage général
export const inscriptionBaseSchema = baseInscriptionSchema

// Types TypeScript dérivés
export type InscriptionFormData = z.infer<typeof baseInscriptionSchema>
export type OpcoFormData = z.infer<typeof opcoSchema>
export type CpfFormData = z.infer<typeof cpfSchema>
export type FranceTravailFormData = z.infer<typeof franceTravailSchema>
export type EmployeurFormData = z.infer<typeof employeurSchema>