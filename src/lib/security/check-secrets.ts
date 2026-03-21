// ============================================================
// CRM DERMOTEC — Détection de secrets exposés (pre-commit)
// ============================================================

interface SecretMatch {
  type: string
  line: number
  preview: string  // Première partie du secret (masquée)
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface SecretScanResult {
  found: boolean
  secrets: SecretMatch[]
  filesScanned: number
  totalLines: number
}

// Patterns de détection de secrets sensibles
const SECRET_PATTERNS = [
  {
    name: 'Stripe Live Key',
    regex: /sk_live_[a-zA-Z0-9]{24,}/g,
    severity: 'HIGH' as const,
    description: 'Clé Stripe LIVE détectée'
  },
  {
    name: 'Stripe Test Key',
    regex: /sk_test_[a-zA-Z0-9]{24,}/g,
    severity: 'MEDIUM' as const,
    description: 'Clé Stripe TEST détectée'
  },
  {
    name: 'Stripe Publishable Key',
    regex: /pk_(live|test)_[a-zA-Z0-9]{24,}/g,
    severity: 'MEDIUM' as const,
    description: 'Clé publique Stripe détectée'
  },
  {
    name: 'Supabase Service Role',
    regex: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    severity: 'HIGH' as const,
    description: 'JWT Supabase service_role détecté'
  },
  {
    name: 'Resend API Key',
    regex: /re_[a-zA-Z0-9]{32,}/g,
    severity: 'MEDIUM' as const,
    description: 'Clé API Resend détectée'
  },
  {
    name: 'OpenAI API Key',
    regex: /sk-[a-zA-Z0-9]{48}/g,
    severity: 'HIGH' as const,
    description: 'Clé API OpenAI détectée'
  },
  {
    name: 'VirusTotal API Key',
    regex: /[a-f0-9]{64}/g,
    severity: 'LOW' as const,
    description: 'Possible clé API VirusTotal (64 chars hex)'
  },
  {
    name: 'Generic JWT',
    regex: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
    severity: 'MEDIUM' as const,
    description: 'JWT générique détecté'
  },
  {
    name: 'AWS Access Key',
    regex: /AKIA[A-Z0-9]{16}/g,
    severity: 'HIGH' as const,
    description: 'Clé d\'accès AWS détectée'
  },
  {
    name: 'AWS Secret Key',
    regex: /[A-Za-z0-9/+=]{40}/g,
    severity: 'MEDIUM' as const,
    description: 'Possible clé secrète AWS (40 chars base64)'
  },
  {
    name: 'GitHub Token',
    regex: /gh[pousr]_[A-Za-z0-9]{36}/g,
    severity: 'HIGH' as const,
    description: 'Token GitHub détecté'
  },
  {
    name: 'Heroku API Key',
    regex: /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g,
    severity: 'MEDIUM' as const,
    description: 'Possible clé API Heroku (UUID format)'
  },
  {
    name: 'Long Hex Token',
    regex: /[a-f0-9]{32,}/g,
    severity: 'LOW' as const,
    description: 'Token hexadécimal long (32+ chars)'
  },
  {
    name: 'Long Base64 Token',
    regex: /[A-Za-z0-9+/]{32,}={0,2}/g,
    severity: 'LOW' as const,
    description: 'Token Base64 long (32+ chars)'
  },
] as const

// Fichiers à ignorer lors du scan
const IGNORED_FILES = [
  '.env.example',
  '.env.template',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.git/',
  'node_modules/',
  'dist/',
  'build/',
  '.next/',
  'coverage/',
  'docs/',
  'README.md',
  'CHANGELOG.md',
] as const

// Commentaires à ignorer (faux positifs courants)
const SAFE_CONTEXTS = [
  'example',
  'placeholder',
  'your_api_key_here',
  'xxx',
  '***',
  'REPLACE_ME',
  'TODO',
  'FIXME',
  // Exemples de documentation
  'sk_test_123',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
] as const

/**
 * Scanne le contenu d'un fichier pour détecter des secrets exposés
 */
export function scanForSecrets(content: string, filename?: string): SecretScanResult {
  const lines = content.split('\n')
  const secrets: SecretMatch[] = []

  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1

    // Ignorer les lignes avec des contextes sûrs
    if (SAFE_CONTEXTS.some(safe => line.toLowerCase().includes(safe))) {
      return
    }

    // Tester chaque pattern de secret
    for (const pattern of SECRET_PATTERNS) {
      const matches = line.matchAll(pattern.regex)

      for (const match of matches) {
        const fullMatch = match[0]

        // Ignorer les très petites chaînes (probablement pas des vrais secrets)
        if (fullMatch.length < 16 && pattern.severity === 'LOW') {
          continue
        }

        // Créer un aperçu masqué du secret
        const preview = maskSecret(fullMatch, pattern.name)

        secrets.push({
          type: pattern.name,
          line: lineNumber,
          preview,
          severity: pattern.severity,
        })
      }
    }
  })

  return {
    found: secrets.length > 0,
    secrets,
    filesScanned: 1,
    totalLines: lines.length,
  }
}

/**
 * Scanne plusieurs fichiers (pour pre-commit hook)
 */
export function scanFiles(files: { name: string; content: string }[]): SecretScanResult {
  let totalSecrets: SecretMatch[] = []
  let totalLines = 0

  const relevantFiles = files.filter(file =>
    !IGNORED_FILES.some(ignored => file.name.includes(ignored))
  )

  for (const file of relevantFiles) {
    const result = scanForSecrets(file.content, file.name)

    // Ajouter le nom de fichier aux secrets trouvés
    const secretsWithFile = result.secrets.map(secret => ({
      ...secret,
      type: `${secret.type} (${file.name})`,
    }))

    totalSecrets = [...totalSecrets, ...secretsWithFile]
    totalLines += result.totalLines
  }

  return {
    found: totalSecrets.length > 0,
    secrets: totalSecrets,
    filesScanned: relevantFiles.length,
    totalLines,
  }
}

/**
 * Génère un aperçu masqué d'un secret
 */
function maskSecret(secret: string, type: string): string {
  if (secret.length <= 8) {
    return '***'
  }

  // Montrer les premiers caractères selon le type
  const prefixLength = getPrefixLength(type)
  const prefix = secret.substring(0, prefixLength)
  const suffix = secret.length > 20 ? '...' + secret.slice(-4) : '...'

  return `${prefix}***${suffix}`
}

/**
 * Détermine combien de caractères montrer au début selon le type de secret
 */
function getPrefixLength(type: string): number {
  if (type.includes('Stripe')) return 7  // sk_live_, pk_test_
  if (type.includes('GitHub')) return 5   // ghp_, gho_
  if (type.includes('Resend')) return 3   // re_
  if (type.includes('JWT')) return 10     // eyJhbGciOi...
  return 4 // Par défaut
}

/**
 * Valide qu'un fichier ne contient pas de secrets avant commit
 */
export function validateFileForCommit(filename: string, content: string): {
  safe: boolean
  violations: SecretMatch[]
  highSeverityCount: number
} {
  const result = scanForSecrets(content, filename)

  const highSeveritySecrets = result.secrets.filter(s => s.severity === 'HIGH')
  const mediumSeveritySecrets = result.secrets.filter(s => s.severity === 'MEDIUM')

  // Bloquer le commit si secrets HIGH ou trop de MEDIUM
  const safe = highSeveritySecrets.length === 0 && mediumSeveritySecrets.length < 3

  return {
    safe,
    violations: result.secrets,
    highSeverityCount: highSeveritySecrets.length,
  }
}

/**
 * Génère un rapport détaillé pour le développeur
 */
export function generateSecretReport(result: SecretScanResult): string {
  if (!result.found) {
    return `✅ Scan de sécurité : Aucun secret détecté dans ${result.filesScanned} fichier(s)`
  }

  const highCount = result.secrets.filter(s => s.severity === 'HIGH').length
  const mediumCount = result.secrets.filter(s => s.severity === 'MEDIUM').length
  const lowCount = result.secrets.filter(s => s.severity === 'LOW').length

  let report = `🚨 SECRETS DÉTECTÉS - COMMIT BLOQUÉ\n\n`
  report += `Fichiers scannés: ${result.filesScanned}\n`
  report += `Lignes analysées: ${result.totalLines}\n`
  report += `Secrets trouvés: ${result.secrets.length}\n\n`

  if (highCount > 0) {
    report += `⚠️  HAUTE SÉVÉRITÉ (${highCount}):\n`
    result.secrets
      .filter(s => s.severity === 'HIGH')
      .forEach(secret => {
        report += `  - Ligne ${secret.line}: ${secret.type}\n`
        report += `    Aperçu: ${secret.preview}\n\n`
      })
  }

  if (mediumCount > 0) {
    report += `⚡ MOYENNE SÉVÉRITÉ (${mediumCount}):\n`
    result.secrets
      .filter(s => s.severity === 'MEDIUM')
      .forEach(secret => {
        report += `  - Ligne ${secret.line}: ${secret.type}\n`
        report += `    Aperçu: ${secret.preview}\n\n`
      })
  }

  if (lowCount > 0) {
    report += `ℹ️  FAIBLE SÉVÉRITÉ (${lowCount}):\n`
    result.secrets
      .filter(s => s.severity === 'LOW')
      .slice(0, 3) // Limiter à 3 pour éviter le spam
      .forEach(secret => {
        report += `  - Ligne ${secret.line}: ${secret.type}\n`
        report += `    Aperçu: ${secret.preview}\n\n`
      })

    if (lowCount > 3) {
      report += `  ... et ${lowCount - 3} autre(s) détection(s) de faible sévérité\n\n`
    }
  }

  report += `🔧 ACTIONS RECOMMANDÉES:\n`
  report += `1. Déplacer les secrets vers le fichier .env (ignoré par git)\n`
  report += `2. Utiliser des variables d'environnement: process.env.MA_CLE_API\n`
  report += `3. Vérifier que .env est dans .gitignore\n`
  report += `4. Pour les tests: utiliser des valeurs factices ou .env.example\n\n`

  if (highCount > 0) {
    report += `❌ Commit bloqué en raison de secrets de haute sévérité\n`
  } else if (mediumCount >= 3) {
    report += `❌ Commit bloqué en raison du nombre élevé de secrets (${mediumCount} de sévérité moyenne)\n`
  }

  return report
}