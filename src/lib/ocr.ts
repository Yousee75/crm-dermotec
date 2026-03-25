// ============================================================
// OCR — Extraction de texte depuis images (Tesseract.js)
// Usage serveur uniquement (server-only)
// ============================================================

import 'server-only'
import Tesseract from 'tesseract.js'

/** Extraire le texte brut d'une image */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  const { data: { text } } = await Tesseract.recognize(imageUrl, 'fra')
  return text
}

/** Champs extraits d'un document */
export interface DocumentFields {
  nom?: string
  prenom?: string
  siret?: string
  adresse?: string
  email?: string
  telephone?: string
  date_naissance?: string
}

// ── Patterns regex pour documents francais ──────────────────

const SIRET_REGEX = /\b(\d{3}\s?\d{3}\s?\d{3}\s?\d{5})\b/
const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/i
const PHONE_REGEX = /(?:0|\+33\s?)[1-9](?:[\s.-]?\d{2}){4}/
const DATE_REGEX = /\b(\d{2})[\/.-](\d{2})[\/.-](\d{4})\b/

/** Extraire les champs structures d'un document scanne */
export async function extractFieldsFromDocument(imageUrl: string): Promise<DocumentFields> {
  const text = await extractTextFromImage(imageUrl)
  return parseDocumentFields(text)
}

/** Parser le texte OCR pour en extraire les champs */
export function parseDocumentFields(text: string): DocumentFields {
  const fields: DocumentFields = {}

  // SIRET (14 chiffres)
  const siretMatch = text.match(SIRET_REGEX)
  if (siretMatch) {
    fields.siret = siretMatch[1].replace(/\s/g, '')
  }

  // Email
  const emailMatch = text.match(EMAIL_REGEX)
  if (emailMatch) {
    fields.email = emailMatch[0].toLowerCase()
  }

  // Telephone
  const phoneMatch = text.match(PHONE_REGEX)
  if (phoneMatch) {
    fields.telephone = phoneMatch[0].replace(/[\s.-]/g, '')
  }

  // Date de naissance (pattern dd/mm/yyyy pres du mot "naissance" ou "ne(e) le")
  const dateContext = text.match(/(?:n[ée]e?\s+le|naissance)[:\s]*(\d{2}[\/.-]\d{2}[\/.-]\d{4})/i)
  if (dateContext) {
    fields.date_naissance = dateContext[1]
  }

  // Nom / Prenom — heuristique : ligne apres "Nom" et "Prenom"
  const nomMatch = text.match(/(?:Nom|NOM)\s*[:\s]+([A-ZÀ-Ü][A-ZÀ-Üa-zà-ü\s-]+)/m)
  if (nomMatch) {
    fields.nom = nomMatch[1].trim()
  }

  const prenomMatch = text.match(/(?:Pr[ée]nom|PRENOM)\s*[:\s]+([A-ZÀ-Ü][a-zà-ü\s-]+)/m)
  if (prenomMatch) {
    fields.prenom = prenomMatch[1].trim()
  }

  // Adresse — heuristique : ligne contenant un code postal francais
  const adresseMatch = text.match(/(\d{1,4}[\s,]+(?:rue|avenue|boulevard|bd|allée|chemin|impasse|place|passage)[^,\n]{5,}[\s,]+\d{5}\s+[A-ZÀ-Ü][a-zà-ü]+)/i)
  if (adresseMatch) {
    fields.adresse = adresseMatch[1].trim()
  }

  return fields
}
