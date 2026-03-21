// ============================================================
// CRM DERMOTEC — Module Sécurité
// Import centralisé de toutes les fonctions de sécurité
// ============================================================

export { sanitizeText, sanitizeEmail, stripHtml, sanitizePayload } from '../sanitize'
export { guardPrompt, guardResponse } from './prompt-guard'
export { rateLimits, checkRateLimit, logSecurityEvent } from './rate-limits'
export { validateFile, generateSafeFilename } from './file-validation'
export { checkAnomalies, isUserThrottled } from './anomaly-detection'
export {
  // Primitifs
  SafeString, SafeEmail, SafePhone, SafeUUID, SafeUrl, SafeSIRET, SafeAmount, SafeNotes,
  // Schemas métier
  CreateLeadSchema, UpdateLeadSchema, ChangeStatutSchema,
  CreateInscriptionSchema, CreateSessionSchema, CreateRappelSchema,
  CreateFinancementSchema, SendEmailSchema, WebhookFormSchema, AIMessageSchema,
  // Helpers
  validateInput, ValidationError,
} from './validation-schemas'
