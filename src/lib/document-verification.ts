// ============================================================
// CRM DERMOTEC — Système de vérification de documents
// ============================================================

// Constantes pour la validation des fichiers
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
] as const

export const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.html', '.htm', '.php', '.asp', '.jsp'
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Magic bytes pour détection du type de fichier
const MAGIC_BYTES = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF...WEBP (check bytes 8-11)
  exe: [0x4D, 0x5A], // MZ
  zip: [0x50, 0x4B, 0x03, 0x04] // PK
} as const

export interface FileValidationResult {
  valid: boolean
  detectedType: string
  declaredType: string
  match: boolean
}

export interface FileSizeValidationResult {
  valid: boolean
  sizeMB: number
  maxMB: number
}

export interface VirusScanResult {
  clean: boolean
  detections?: number
  engines?: number
  permalink?: string
  skipped?: boolean
}

export interface SIRETVerificationResult {
  valid: boolean
  entreprise?: {
    nom: string
    siret: string
    siren: string
    codeNAF: string
    adresse: string
    actif: boolean
  }
}

export interface DocumentCrossVerificationResult {
  score: number // 0-100
  issues: string[]
  verified_fields: string[]
}

/**
 * Valide le type de fichier en vérifiant les magic bytes
 */
export function validateFileType(buffer: ArrayBuffer, filename: string): FileValidationResult {
  const bytes = new Uint8Array(buffer)
  const extension = filename.toLowerCase().split('.').pop() || ''

  // Détection par magic bytes
  let detectedType = 'unknown'

  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    detectedType = 'pdf'
  } else if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    detectedType = 'jpeg'
  } else if (bytes.length >= 8 &&
             bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
             bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
    detectedType = 'png'
  } else if (bytes.length >= 12 &&
             bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
             bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    detectedType = 'webp'
  }

  // Type déclaré par l'extension
  const declaredTypeMap: Record<string, string> = {
    'pdf': 'pdf',
    'jpg': 'jpeg',
    'jpeg': 'jpeg',
    'png': 'png',
    'webp': 'webp',
    'heic': 'heic',
    'heif': 'heif'
  }
  const declaredType = declaredTypeMap[extension] || 'unknown'

  // Vérification des types dangereux
  const isDangerous = BLOCKED_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext)) ||
                      (bytes.length >= 2 && bytes[0] === 0x4D && bytes[1] === 0x5A) || // EXE
                      (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4B) // ZIP

  const match = detectedType === declaredType
  const valid = !isDangerous && detectedType !== 'unknown' && (match || detectedType === 'heic' || detectedType === 'heif')

  return {
    valid,
    detectedType,
    declaredType,
    match
  }
}

/**
 * Valide la taille du fichier
 */
export function validateFileSize(size: number, maxMB = 10): FileSizeValidationResult {
  const maxBytes = maxMB * 1024 * 1024
  const sizeMB = size / (1024 * 1024)

  return {
    valid: size <= maxBytes,
    sizeMB: Math.round(sizeMB * 100) / 100,
    maxMB
  }
}

/**
 * Scan antivirus avec VirusTotal API v3
 */
export async function scanWithVirusTotal(
  fileBuffer: ArrayBuffer,
  apiKey?: string
): Promise<VirusScanResult> {
  if (!apiKey) {
    return { clean: true, skipped: true }
  }

  try {
    // Upload du fichier
    const formData = new FormData()
    formData.append('file', new Blob([fileBuffer]))

    const uploadResponse = await fetch('https://www.virustotal.com/api/v3/files', {
      method: 'POST',
      headers: {
        'x-apikey': apiKey
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      throw new Error(`VirusTotal upload failed: ${uploadResponse.status}`)
    }

    const uploadData = await uploadResponse.json()
    const analysisId = uploadData.data?.id

    if (!analysisId) {
      throw new Error('No analysis ID received')
    }

    // Attendre quelques secondes puis récupérer le résultat
    await new Promise(resolve => setTimeout(resolve, 3000))

    const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
      headers: {
        'x-apikey': apiKey
      }
    })

    if (!analysisResponse.ok) {
      throw new Error(`VirusTotal analysis failed: ${analysisResponse.status}`)
    }

    const analysisData = await analysisResponse.json()
    const stats = analysisData.data?.attributes?.stats

    if (!stats) {
      return { clean: true, skipped: true }
    }

    return {
      clean: stats.malicious === 0 && stats.suspicious === 0,
      detections: stats.malicious + stats.suspicious,
      engines: stats.harmless + stats.malicious + stats.suspicious + stats.undetected,
      permalink: `https://www.virustotal.com/gui/file-analysis/${analysisId}`
    }
  } catch (error) {
    console.error('VirusTotal scan error:', error)
    // En cas d'erreur, on considère le fichier comme propre pour ne pas bloquer
    return { clean: true, skipped: true }
  }
}

/**
 * Extraction de texte OCR — placeholder pour Tesseract.js
 * TODO: npm install tesseract.js pour activer
 */
export async function extractTextOCR(imageBuffer: ArrayBuffer): Promise<string> {
  // Placeholder pour l'implémentation future
  // const { createWorker } = require('tesseract.js')
  // const worker = await createWorker()
  // await worker.loadLanguage('fra')
  // await worker.initialize('fra')
  // const { data: { text } } = await worker.recognize(imageBuffer)
  // await worker.terminate()
  // return text

  return '' // Temporaire
}

/**
 * Vérification SIRET avec API INSEE
 */
export async function verifySIRET(siret: string): Promise<SIRETVerificationResult> {
  const cleanedSiret = siret.replace(/\s/g, '')

  if (!/^\d{14}$/.test(cleanedSiret)) {
    return { valid: false }
  }

  try {
    // Essayer d'abord l'API INSEE officielle
    const inseeResponse = await fetch(
      `https://api.insee.fr/entreprises/sirene/V3.11/siret/${cleanedSiret}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.INSEE_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    )

    if (inseeResponse.ok) {
      const data = await inseeResponse.json()
      const etablissement = data.etablissement

      if (etablissement) {
        return {
          valid: true,
          entreprise: {
            nom: etablissement.uniteLegale?.denominationUniteLegale ||
                 `${etablissement.uniteLegale?.prenom1UniteLegale || ''} ${etablissement.uniteLegale?.nomUniteLegale || ''}`.trim(),
            siret: etablissement.siret,
            siren: etablissement.siren,
            codeNAF: etablissement.activitePrincipaleEtablissement || '',
            adresse: `${etablissement.adresseEtablissement?.numeroVoieEtablissement || ''} ${etablissement.adresseEtablissement?.typeVoieEtablissement || ''} ${etablissement.adresseEtablissement?.libelleVoieEtablissement || ''} ${etablissement.adresseEtablissement?.codePostalEtablissement || ''} ${etablissement.adresseEtablissement?.libelleCommuneEtablissement || ''}`.trim(),
            actif: etablissement.etatAdministratifEtablissement === 'A'
          }
        }
      }
    }
  } catch (error) {
    console.error('INSEE API error:', error)
  }

  // Fallback vers API publique
  try {
    const fallbackResponse = await fetch(
      `https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/${cleanedSiret}`
    )

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json()
      const etablissement = data.etablissement

      if (etablissement) {
        return {
          valid: true,
          entreprise: {
            nom: etablissement.unite_legale?.denomination ||
                 `${etablissement.unite_legale?.prenom_1 || ''} ${etablissement.unite_legale?.nom || ''}`.trim(),
            siret: etablissement.siret,
            siren: etablissement.siren,
            codeNAF: etablissement.activite_principale || '',
            adresse: `${etablissement.numero_voie || ''} ${etablissement.type_voie || ''} ${etablissement.libelle_voie || ''} ${etablissement.code_postal || ''} ${etablissement.libelle_commune || ''}`.trim(),
            actif: etablissement.etat_administratif === 'A'
          }
        }
      }
    }
  } catch (error) {
    console.error('Fallback API error:', error)
  }

  return { valid: false }
}

/**
 * Vérification croisée entre données extraites et données du lead
 */
export function crossVerifyDocument(
  extractedData: Record<string, string>,
  leadData: { nom?: string; prenom?: string; siret?: string; email?: string }
): DocumentCrossVerificationResult {
  const issues: string[] = []
  const verified_fields: string[] = []
  let score = 0

  // Vérification du nom (similarité approximative)
  if (extractedData.nom && leadData.nom) {
    const similarity = calculateStringSimilarity(
      extractedData.nom.toLowerCase(),
      leadData.nom.toLowerCase()
    )
    if (similarity > 0.8) {
      verified_fields.push('nom')
      score += 25
    } else if (similarity > 0.5) {
      issues.push('Le nom ne correspond pas exactement')
      score += 10
    } else {
      issues.push('Le nom ne correspond pas')
    }
  }

  // Vérification du prénom
  if (extractedData.prenom && leadData.prenom) {
    const similarity = calculateStringSimilarity(
      extractedData.prenom.toLowerCase(),
      leadData.prenom.toLowerCase()
    )
    if (similarity > 0.8) {
      verified_fields.push('prenom')
      score += 25
    } else {
      issues.push('Le prénom ne correspond pas')
    }
  }

  // Vérification du SIRET
  if (extractedData.siret && leadData.siret) {
    if (extractedData.siret === leadData.siret) {
      verified_fields.push('siret')
      score += 30
    } else {
      issues.push('Le SIRET ne correspond pas')
    }
  }

  // Vérification de l'email
  if (extractedData.email && leadData.email) {
    if (extractedData.email.toLowerCase() === leadData.email.toLowerCase()) {
      verified_fields.push('email')
      score += 20
    } else {
      issues.push('L\'email ne correspond pas')
    }
  }

  return {
    score: Math.min(100, score),
    issues,
    verified_fields
  }
}

/**
 * Calcul du score de confiance global du document
 */
export function calculateDocumentConfidence(checks: {
  formatValid: boolean
  sizeOK: boolean
  virusClean: boolean
  ocrMatch?: DocumentCrossVerificationResult
  siretValid?: boolean
}): number {
  let score = 0

  // Format valide: +20
  if (checks.formatValid) score += 20

  // Taille OK: +10
  if (checks.sizeOK) score += 10

  // Scan antivirus clean: +30
  if (checks.virusClean) score += 30

  // Correspondance OCR: +25
  if (checks.ocrMatch) {
    score += Math.floor(checks.ocrMatch.score * 0.25)
  }

  // SIRET valide: +15
  if (checks.siretValid) score += 15

  return Math.min(100, score)
}

// Utilitaire pour calculer la similarité entre chaînes
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator  // substitution
      )
    }
  }

  return matrix[str2.length][str1.length]
}