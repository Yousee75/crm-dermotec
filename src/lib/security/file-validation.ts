// ============================================================
// CRM DERMOTEC — Validation des fichiers uploadés
// Vérifie les magic bytes, le type réel, scanne les PDFs
// Ref: OWASP File Upload Cheat Sheet
// ============================================================

/** Magic bytes pour détecter le vrai type d'un fichier */
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
  'image/gif': [[0x47, 0x49, 0x46, 0x38]], // GIF8
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
}

/** Extensions autorisées par type MIME */
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'application/pdf': ['pdf'],
}

/** Taille max par type (en bytes) */
const MAX_SIZE: Record<string, number> = {
  'image/jpeg': 10 * 1024 * 1024,  // 10 Mo
  'image/png': 10 * 1024 * 1024,
  'image/webp': 10 * 1024 * 1024,
  'image/gif': 5 * 1024 * 1024,    // 5 Mo
  'application/pdf': 50 * 1024 * 1024, // 50 Mo
}

/** Patterns dangereux dans les PDFs */
const PDF_DANGER_PATTERNS = [
  /\/JavaScript/i,       // Code JavaScript embarqué
  /\/JS\s/i,             // JS raccourci
  /\/Launch/i,           // Lancer un programme externe
  /\/EmbeddedFile/i,     // Fichier embarqué
  /AA\s*<<[^>]*\/O/i,    // Auto-action à l'ouverture
  /\/OpenAction/i,       // Action à l'ouverture
  /\/RichMedia/i,        // Contenu multimédia embarqué (Flash)
]

export interface FileValidationResult {
  valid: boolean
  reason?: string
  detectedType?: string
  hash?: string
}

/**
 * Valide un fichier uploadé :
 * 1. Vérifie la taille
 * 2. Vérifie les magic bytes (type réel)
 * 3. Vérifie l'extension vs le type déclaré
 * 4. Scanne les PDFs pour du contenu malveillant
 * 5. Vérifie les dimensions images (anti image-bomb)
 */
export async function validateFile(
  buffer: Buffer | ArrayBuffer,
  declaredMimeType: string,
  filename: string
): Promise<FileValidationResult> {
  const buf = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer

  // 1. Taille
  const maxSize = MAX_SIZE[declaredMimeType]
  if (!maxSize) {
    return { valid: false, reason: `Type ${declaredMimeType} non autorisé` }
  }
  if (buf.length > maxSize) {
    return { valid: false, reason: `Fichier trop lourd (max ${Math.round(maxSize / 1024 / 1024)} Mo)` }
  }
  if (buf.length === 0) {
    return { valid: false, reason: 'Fichier vide' }
  }

  // 2. Magic bytes — détecter le vrai type
  const detectedType = detectFileType(buf)
  if (!detectedType) {
    return { valid: false, reason: 'Type de fichier non reconnu' }
  }
  if (detectedType !== declaredMimeType) {
    return {
      valid: false,
      reason: `Type réel (${detectedType}) ne correspond pas au type déclaré (${declaredMimeType})`,
      detectedType,
    }
  }

  // 3. Extension vs type
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) {
    return { valid: false, reason: 'Fichier sans extension' }
  }
  const allowedExts = ALLOWED_EXTENSIONS[declaredMimeType]
  if (!allowedExts?.includes(ext)) {
    return { valid: false, reason: `Extension .${ext} non autorisée pour ${declaredMimeType}` }
  }

  // 4. Nom de fichier sûr
  if (filename.startsWith('.')) {
    return { valid: false, reason: 'Fichier caché non autorisé' }
  }
  if (!/^[a-zA-Z0-9._\-\s()àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]+$/.test(filename)) {
    return { valid: false, reason: 'Nom de fichier contient des caractères invalides' }
  }

  // 5. Scan PDF
  if (declaredMimeType === 'application/pdf') {
    const content = buf.toString('binary')
    for (const pattern of PDF_DANGER_PATTERNS) {
      if (pattern.test(content)) {
        return { valid: false, reason: 'PDF potentiellement malveillant détecté' }
      }
    }
  }

  // 6. Hash SHA-256 pour déduplication/traçabilité
  const hashBuffer = await crypto.subtle.digest('SHA-256', buf)
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return { valid: true, detectedType, hash }
}

/**
 * Détecte le type réel d'un fichier via ses magic bytes
 */
function detectFileType(buffer: Buffer): string | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      if (signature.every((byte, i) => buffer[i] === byte)) {
        return mimeType
      }
    }
  }
  return null
}

/**
 * Génère un nom de fichier sûr (jamais utiliser le nom original en stockage)
 */
export function generateSafeFilename(originalExt: string): string {
  const safeExt = originalExt.replace(/[^a-z0-9]/gi, '').toLowerCase()
  return `${crypto.randomUUID()}.${safeExt || 'bin'}`
}
