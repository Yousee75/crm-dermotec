// ============================================================
// CRM DERMOTEC — CSV Parser utilitaire
// Parse CSV sans dépendance externe
// Auto-détection délimiteur, gestion guillemets, BOM UTF-8
// ============================================================

export interface ParsedCSV {
  headers: string[]
  rows: string[][]
}

export interface ColumnMappingResult {
  nom: string | null
  prenom: string | null
  email: string | null
  telephone: string | null
  entreprise_nom: string | null
  ville: string | null
  source: string | null
}

// --- Patterns de mapping automatique (FR + EN) ---
const COLUMN_PATTERNS: Record<keyof ColumnMappingResult, string[]> = {
  nom: ['nom', 'name', 'last_name', 'lastname', 'nom de famille', 'family_name', 'surname'],
  prenom: ['prenom', 'prénom', 'first_name', 'firstname', 'given_name'],
  email: ['email', 'mail', 'e-mail', 'courriel', 'e_mail', 'adresse email', 'adresse mail'],
  telephone: ['telephone', 'téléphone', 'tel', 'phone', 'mobile', 'portable', 'gsm', 'numero', 'numéro'],
  entreprise_nom: ['entreprise', 'société', 'societe', 'company', 'raison sociale', 'organization', 'organisation', 'sociéte'],
  ville: ['ville', 'city', 'localité', 'localite', 'location', 'town', 'commune'],
  source: ['source', 'origine', 'canal', 'channel', 'provenance'],
}

/**
 * Normalise un texte pour la comparaison (minuscules, sans accents, sans ponctuation)
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

/**
 * Supprime le BOM UTF-8 en début de fichier si présent
 */
function stripBOM(text: string): string {
  if (text.charCodeAt(0) === 0xFEFF) {
    return text.slice(1)
  }
  return text
}

/**
 * Auto-détecte le délimiteur (virgule, point-virgule, tab)
 * Analyse la première ligne pour compter les occurrences de chaque candidat
 */
function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] || ''

  const candidates = [
    { char: ';', count: 0 },
    { char: ',', count: 0 },
    { char: '\t', count: 0 },
  ]

  // Compter hors guillemets
  let inQuotes = false
  for (const ch of firstLine) {
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes) {
      for (const c of candidates) {
        if (ch === c.char) c.count++
      }
    }
  }

  // Point-virgule est le défaut français (Excel FR exporte en ;)
  // On prend celui qui a le plus d'occurrences
  candidates.sort((a, b) => b.count - a.count)

  // Si aucun délimiteur trouvé, défaut virgule
  if (candidates[0].count === 0) return ','

  return candidates[0].char
}

/**
 * Parse une ligne CSV en respectant les guillemets
 * Gère : champs entre guillemets, guillemets échappés (""), retours à la ligne dans les champs
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        // Guillemet double échappé "" → "
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i += 2
          continue
        }
        // Fin de champ entre guillemets
        inQuotes = false
        i++
        continue
      }
      current += char
      i++
    } else {
      if (char === '"') {
        inQuotes = true
        i++
        continue
      }
      if (char === delimiter) {
        fields.push(current.trim())
        current = ''
        i++
        continue
      }
      current += char
      i++
    }
  }

  // Dernier champ
  fields.push(current.trim())

  return fields
}

/**
 * Parse un texte CSV complet en headers + rows
 *
 * @param text - Contenu CSV brut
 * @param delimiter - Délimiteur optionnel (auto-détecté si absent)
 * @returns { headers, rows }
 */
export function parseCSV(text: string, delimiter?: string): ParsedCSV {
  // Nettoyage
  const cleaned = stripBOM(text)

  if (!cleaned.trim()) {
    return { headers: [], rows: [] }
  }

  // Auto-détection du délimiteur
  const delim = delimiter || detectDelimiter(cleaned)

  // Découper en lignes en gérant les retours à la ligne dans les guillemets
  const lines: string[] = []
  let currentLine = ''
  let inQuotes = false

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]

    if (char === '"') {
      inQuotes = !inQuotes
      currentLine += char
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // Fin de ligne (hors guillemets)
      if (char === '\r' && i + 1 < cleaned.length && cleaned[i + 1] === '\n') {
        i++ // Skip \n après \r
      }
      if (currentLine.trim()) {
        lines.push(currentLine)
      }
      currentLine = ''
    } else {
      currentLine += char
    }
  }

  // Dernière ligne
  if (currentLine.trim()) {
    lines.push(currentLine)
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  // Première ligne = headers
  const headers = parseCSVLine(lines[0], delim).filter(Boolean)

  // Lignes de données
  const rows: string[][] = []
  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCSVLine(lines[i], delim)
    // Ignorer les lignes vides (toutes les cellules vides)
    if (parsed.some(cell => cell.trim())) {
      // Padder ou tronquer pour matcher le nombre de headers
      while (parsed.length < headers.length) parsed.push('')
      if (parsed.length > headers.length) parsed.length = headers.length
      rows.push(parsed)
    }
  }

  return { headers, rows }
}

/**
 * Détecte automatiquement la correspondance entre les colonnes CSV
 * et les champs CRM leads
 */
export function detectColumnMapping(headers: string[]): ColumnMappingResult {
  const mapping: ColumnMappingResult = {
    nom: null,
    prenom: null,
    email: null,
    telephone: null,
    entreprise_nom: null,
    ville: null,
    source: null,
  }

  const usedHeaders = new Set<string>()

  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (const header of headers) {
      if (usedHeaders.has(header)) continue

      const normalizedHeader = normalize(header)

      for (const pattern of patterns) {
        const normalizedPattern = normalize(pattern)
        // Match exact ou contenu dans le header
        if (normalizedHeader === normalizedPattern || normalizedHeader.includes(normalizedPattern)) {
          mapping[field as keyof ColumnMappingResult] = header
          usedHeaders.add(header)
          break
        }
      }

      if (mapping[field as keyof ColumnMappingResult]) break
    }
  }

  return mapping
}
