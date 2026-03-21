// ============================================================
// CRM DERMOTEC — Sanitization HTML (Anti-XSS)
// Utilise isomorphic-dompurify (fonctionne serveur + client)
// ============================================================

import DOMPurify from 'isomorphic-dompurify'

// Options restrictives : seulement du formatage basique
const STRICT_OPTIONS = {
  ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  FORCE_BODY: true,
}

// Options pour les emails (un peu plus permissif)
const EMAIL_OPTIONS = {
  ALLOWED_TAGS: [
    'b', 'i', 'u', 'em', 'strong', 'br', 'p', 'div', 'span',
    'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4',
    'table', 'tr', 'td', 'th', 'thead', 'tbody',
    'img', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'style', 'class', 'width', 'height'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea'],
  FORCE_BODY: true,
}

/**
 * Sanitise du texte utilisateur (notes, commentaires, descriptions)
 * Supprime TOUT le HTML sauf le formatage basique
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, STRICT_OPTIONS)
}

/**
 * Sanitise du contenu email HTML (templates, previews)
 * Plus permissif mais bloque scripts/iframes/forms
 */
export function sanitizeEmail(dirty: string): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, EMAIL_OPTIONS)
}

/**
 * Strip ALL HTML — retourne du texte brut
 * Pour les champs qui ne devraient jamais contenir de HTML
 */
export function stripHtml(dirty: string): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] })
}

/**
 * Sanitise un objet entier — applique stripHtml sur toutes les valeurs string
 * Utile pour les payloads de formulaires avant insertion en base
 */
export function sanitizePayload<T extends Record<string, unknown>>(payload: T): T {
  const cleaned = { ...payload }
  for (const [key, value] of Object.entries(cleaned)) {
    if (typeof value === 'string') {
      // Les champs HTML connus gardent le formatage
      if (['contenu_html', 'body_html', 'template_html'].includes(key)) {
        (cleaned as Record<string, unknown>)[key] = sanitizeEmail(value)
      } else if (['notes', 'description', 'commentaire', 'contenu', 'message'].includes(key)) {
        (cleaned as Record<string, unknown>)[key] = sanitizeText(value)
      } else {
        (cleaned as Record<string, unknown>)[key] = stripHtml(value)
      }
    }
  }
  return cleaned
}
